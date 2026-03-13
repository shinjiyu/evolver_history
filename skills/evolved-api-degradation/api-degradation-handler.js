#!/usr/bin/env node

/**
 * API Degradation Handler
 * 
 * 自动处理 API 错误并实施降级策略
 * 解决 PAT-090 (EvoMap 404) 和 PAT-062 (429 错误)
 */

const fs = require('fs');
const path = require('path');

// 配置
const CONFIG_FILE = '/root/.openclaw/workspace/logs/api-degradation-config.json';
const STATE_FILE = '/root/.openclaw/workspace/logs/api-degradation-state.json';
const LOG_FILE = '/root/.openclaw/workspace/logs/api-degradation.log';

// 默认配置
const DEFAULT_CONFIG = {
  apis: {
    evomap: {
      degradation: {
        '404': {
          action: 'skip_and_log',
          cooldownMinutes: 60,
          maxConsecutiveErrors: 3
        },
        '429': {
          action: 'backoff',
          initialDelayMs: 2000,
          maxDelayMs: 30000,
          maxRetries: 5
        }
      }
    },
    feishu: {
      degradation: {
        '404': {
          action: 'write_local_file',
          fallbackPath: '/root/.openclaw/workspace/memory/pending-feishu-'
        },
        '401': {
          action: 'skip_and_notify',
          notifyChannel: 'dingtalk'
        }
      }
    }
  },
  global: {
    enableDegradation: true,
    logLevel: 'info'
  }
};

class ApiDegradationHandler {
  constructor() {
    this.config = this.loadConfig();
    this.state = this.loadState();
  }

  /**
   * 加载配置
   */
  loadConfig() {
    try {
      if (fs.existsSync(CONFIG_FILE)) {
        return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
      }
    } catch (err) {
      this.log('warn', `Failed to load config: ${err.message}`);
    }
    return DEFAULT_CONFIG;
  }

  /**
   * 加载状态
   */
  loadState() {
    try {
      if (fs.existsSync(STATE_FILE)) {
        return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
      }
    } catch (err) {
      this.log('warn', `Failed to load state: ${err.message}`);
    }
    return {};
  }

  /**
   * 保存状态
   */
  saveState() {
    try {
      fs.writeFileSync(STATE_FILE, JSON.stringify(this.state, null, 2));
    } catch (err) {
      this.log('error', `Failed to save state: ${err.message}`);
    }
  }

  /**
   * 日志记录
   */
  log(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const logLine = `[${timestamp}] [${level.toUpperCase()}] ${message} ${JSON.stringify(data)}\n`;
    
    try {
      fs.appendFileSync(LOG_FILE, logLine);
    } catch (err) {
      console.error(`Failed to write log: ${err.message}`);
    }
    
    if (level === 'error' || this.config.global.logLevel === 'debug') {
      console.log(logLine.trim());
    }
  }

  /**
   * 处理 404 错误
   */
  async handleApi404(apiName, context = {}) {
    const apiConfig = this.config.apis[apiName];
    
    if (!apiConfig) {
      this.log('warn', `Unknown API: ${apiName}`);
      return { action: 'skip', message: 'Unknown API' };
    }

    const strategy = apiConfig.degradation?.['404'] || {
      action: 'skip_and_log',
      cooldownMinutes: 60
    };

    // 更新状态
    if (!this.state[apiName]) {
      this.state[apiName] = {};
    }
    
    this.state[apiName].lastError = '404';
    this.state[apiName].lastErrorTime = Date.now();
    this.state[apiName].consecutiveErrors = (this.state[apiName].consecutiveErrors || 0) + 1;
    
    // 检查是否应该降级
    if (this.state[apiName].consecutiveErrors >= (strategy.maxConsecutiveErrors || 3)) {
      this.state[apiName].status = 'degraded';
      this.state[apiName].degradedSince = Date.now();
      
      this.log('warn', `API ${apiName} 进入降级模式`, {
        consecutiveErrors: this.state[apiName].consecutiveErrors,
        strategy: strategy.action
      });
    }
    
    this.saveState();

    // 记录降级事件
    await this.logDegradation(apiName, '404', context, strategy);

    return {
      ...strategy,
      degraded: this.state[apiName].status === 'degraded',
      consecutiveErrors: this.state[apiName].consecutiveErrors
    };
  }

  /**
   * 处理 429 Rate Limit 错误
   */
  async handleRateLimit(context = {}) {
    const recent429Count = await this.getRecent429Count(30);
    
    let strategy;
    
    if (recent429Count < 3) {
      // 轻度限制
      strategy = {
        level: 'light',
        delayMs: 2000,
        maxRetries: 3,
        escalationAction: 'queue_task'
      };
    } else if (recent429Count < 10) {
      // 中度限制
      strategy = {
        level: 'medium',
        delayMs: 5000,
        maxRetries: 2,
        escalationAction: 'skip_task'
      };
    } else {
      // 重度限制
      strategy = {
        level: 'severe',
        delayMs: 30000,
        maxRetries: 1,
        escalationAction: 'terminate_session'
      };
    }
    
    this.log('warn', `429 Rate Limit 处理`, {
      recentCount: recent429Count,
      level: strategy.level,
      action: strategy.escalationAction
    });
    
    return strategy;
  }

  /**
   * 处理网络错误
   */
  async handleNetworkError(error, context = {}) {
    const transientErrors = ['ETIMEDOUT', 'ECONNRESET', 'ECONNREFUSED', 'ENOTFOUND'];
    
    if (transientErrors.includes(error.code)) {
      return {
        action: 'retry_with_backoff',
        maxRetries: 3,
        delayMs: 1000,
        isTransient: true
      };
    } else {
      return {
        action: 'use_cached_data',
        fallbackMessage: '网络不可用，使用缓存数据',
        isTransient: false
      };
    }
  }

  /**
   * 记录降级事件
   */
  async logDegradation(apiName, error, context, strategy) {
    const event = {
      timestamp: new Date().toISOString(),
      api: apiName,
      error: error,
      context: context,
      strategy: strategy.action,
      consecutiveErrors: this.state[apiName]?.consecutiveErrors || 0
    };
    
    this.log('info', `API 降级事件`, event);
  }

  /**
   * 获取最近 N 分钟的 429 错误数量
   */
  async getRecent429Count(minutesAgo = 30) {
    try {
      if (!fs.existsSync(LOG_FILE)) {
        return 0;
      }
      
      const logs = fs.readFileSync(LOG_FILE, 'utf-8');
      const lines = logs.split('\n').filter(line => line.trim());
      
      const cutoffTime = Date.now() - (minutesAgo * 60 * 1000);
      
      const recent429s = lines.filter(line => {
        try {
          const match = line.match(/\[(.+?)\]/);
          if (!match) return false;
          
          const timestamp = new Date(match[1]).getTime();
          return timestamp > cutoffTime && line.includes('429');
        } catch {
          return false;
        }
      });
      
      return recent429s.length;
    } catch (err) {
      this.log('error', `Failed to get recent 429 count: ${err.message}`);
      return 0;
    }
  }

  /**
   * 获取降级状态
   */
  getDegradationStatus() {
    const status = {
      apis: {},
      activeDegradations: 0,
      recent429Count: 0
    };
    
    for (const [apiName, apiState] of Object.entries(this.state)) {
      status.apis[apiName] = {
        status: apiState.status || 'normal',
        degradedSince: apiState.degradedSince,
        consecutiveErrors: apiState.consecutiveErrors || 0
      };
      
      if (apiState.status === 'degraded') {
        status.activeDegradations++;
      }
    }
    
    return status;
  }

  /**
   * 重置 API 状态
   */
  resetApiStatus(apiName) {
    if (this.state[apiName]) {
      this.state[apiName].status = 'normal';
      this.state[apiName].consecutiveErrors = 0;
      delete this.state[apiName].degradedSince;
      this.saveState();
      
      this.log('info', `API ${apiName} 状态已重置`);
    }
  }

  /**
   * 检查是否应该跳过 API 调用
   */
  shouldSkipApiCall(apiName) {
    const apiState = this.state[apiName];
    
    if (!apiState || apiState.status !== 'degraded') {
      return false;
    }
    
    // 检查冷却时间
    const apiConfig = this.config.apis[apiName];
    const cooldownMinutes = apiConfig?.degradation?.['404']?.cooldownMinutes || 60;
    const cooldownMs = cooldownMinutes * 60 * 1000;
    
    if (Date.now() - apiState.degradedSince > cooldownMs) {
      // 冷却时间已过，尝试恢复
      this.resetApiStatus(apiName);
      return false;
    }
    
    return true;
  }
}

// CLI 接口
if (require.main === module) {
  const handler = new ApiDegradationHandler();
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'status':
      const status = handler.getDegradationStatus();
      console.log(JSON.stringify(status, null, 2));
      break;
      
    case 'reset':
      const apiName = args[1];
      if (apiName) {
        handler.resetApiStatus(apiName);
        console.log(`✅ API ${apiName} 状态已重置`);
      } else {
        console.log('❌ 请指定 API 名称');
      }
      break;
      
    case 'test':
      // 测试 404 处理
      handler.handleApi404('evomap', { test: true }).then(result => {
        console.log('404 处理结果:', result);
      });
      break;
      
    default:
      console.log(`
使用方法:
  node api-degradation-handler.js status         - 查看降级状态
  node api-degradation-handler.js reset <api>    - 重置 API 状态
  node api-degradation-handler.js test           - 测试处理器
      `);
  }
}

module.exports = ApiDegradationHandler;
