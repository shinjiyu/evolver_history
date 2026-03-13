---
name: evolved-api-degradation
description: API 错误自动降级处理器。适用于：(1) API 返回 404/500 错误、(2) 需要优雅降级而非完全失败、(3) 外部 API 不可用时提供备用方案、(4) 提高系统对外部依赖的容错性。
---

# Evolved API Degradation - API 错误自动降级处理器

当外部 API 返回错误时，自动实施降级策略，避免任务完全失败。

## 核心问题

**PAT-090**: EvoMap API 全部返回 404
- 出现次数: 52+ 次（Round 309-314）
- 持续时间: >6 小时
- 影响: 节点健康检查、Bounty 扫描、Capsule 发布完全失效
- 根本原因: API 服务下线或端点变更

**PAT-062**: 429 Rate Limit 频繁触发
- 出现次数: 739+ 次/6h
- 影响: 多个子代理任务失败
- 根本原因: 多个任务并发请求 API

## 降级策略

### 策略 1: 404 错误降级

```javascript
// 当 API 返回 404 时
async function handleApi404(apiName, context) {
  const fallbackStrategies = {
    'evomap': {
      // 降级行为
      action: 'skip_and_log',
      message: 'EvoMap API 不可用，跳过本次检查',
      fallbackData: null,
      // 降级持续时间
      cooldownMinutes: 60,
      // 是否需要通知
      notify: false
    },
    'feishu': {
      action: 'write_local_file',
      message: 'Feishu 不可用，保存到本地文件',
      fallbackPath: '/root/.openclaw/workspace/memory/pending-feishu-',
      cooldownMinutes: 30,
      notify: true
    }
  };
  
  const strategy = fallbackStrategies[apiName];
  
  // 记录降级事件
  await logDegradation({
    api: apiName,
    error: 404,
    timestamp: Date.now(),
    context: context,
    strategy: strategy.action
  });
  
  return strategy;
}
```

### 策略 2: 429 错误降级

```javascript
// 当遇到 429 Rate Limit 时
async function handleRateLimit(error, context) {
  const backoffStrategies = {
    // 轻度限制（<3 次失败）
    light: {
      delayMs: 2000,
      maxRetries: 3,
      escalationAction: 'queue_task'
    },
    // 中度限制（3-10 次失败）
    medium: {
      delayMs: 5000,
      maxRetries: 2,
      escalationAction: 'skip_task'
    },
    // 重度限制（>10 次失败）
    severe: {
      delayMs: 30000,
      maxRetries: 1,
      escalationAction: 'terminate_session'
    }
  };
  
  // 根据最近的 429 错误频率选择策略
  const recent429Count = await getRecent429Count(minutesAgo=30);
  
  if (recent429Count < 3) {
    return backoffStrategies.light;
  } else if (recent429Count < 10) {
    return backoffStrategies.medium;
  } else {
    return backoffStrategies.severe;
  }
}
```

### 策略 3: 网络错误降级

```javascript
// 当遇到网络错误时
async function handleNetworkError(error, context) {
  const isTransient = [
    'ETIMEDOUT',
    'ECONNRESET',
    'ECONNREFUSED',
    'ENOTFOUND'
  ].includes(error.code);
  
  if (isTransient) {
    // 临时性网络错误 - 重试
    return {
      action: 'retry_with_backoff',
      maxRetries: 3,
      delayMs: 1000
    };
  } else {
    // 非临时性错误 - 降级
    return {
      action: 'use_cached_data',
      fallbackMessage: '网络不可用，使用缓存数据'
    };
  }
}
```

## 实施示例

### 示例 1: EvoMap API 降级

```javascript
// 在 evomap-feature-system.js 中使用降级处理器
const ApiDegradation = require('./api-degradation-handler');

async function checkEvomapHealth() {
  try {
    const response = await fetch('https://api.evomap.io/health');
    
    if (response.status === 404) {
      // 触发降级
      const strategy = await ApiDegradation.handleApi404('evomap', {
        task: 'health_check',
        round: getCurrentRound()
      });
      
      // 执行降级行为
      if (strategy.action === 'skip_and_log') {
        console.log(`⚠️ ${strategy.message}`);
        return { status: 'degraded', data: null };
      }
    }
    
    return await response.json();
  } catch (error) {
    // 网络错误降级
    const strategy = await ApiDegradation.handleNetworkError(error, {
      api: 'evomap',
      task: 'health_check'
    });
    
    if (strategy.action === 'retry_with_backoff') {
      return await retryWithBackoff(checkEvomapHealth, strategy);
    }
    
    return { status: 'error', message: strategy.fallbackMessage };
  }
}
```

### 示例 2: 子代理 429 降级

```javascript
// 在 novel-auto-review-full.js 中使用降级处理器
const ApiDegradation = require('./api-degradation-handler');

async function spawnReviewAgents(chapter) {
  // 检查当前 429 错误频率
  const strategy = await ApiDegradation.handleRateLimit(null, {
    task: 'novel_review'
  });
  
  if (strategy.escalationAction === 'skip_task') {
    console.log('⚠️ API 限制严重，跳过本次评审');
    return null;
  }
  
  if (strategy.escalationAction === 'terminate_session') {
    console.log('🔴 API 限制极端，终止会话');
    await terminateLongSessions();
    return null;
  }
  
  // 添加延迟避免 429
  await sleep(strategy.delayMs);
  
  // 降低并发数
  const maxConcurrent = strategy.maxRetries; // 使用 maxRetries 作为并发限制
  
  // 使用队列控制并发
  const agents = ['逻辑审核员', '人物分析师', '节奏分析师'];
  const results = [];
  
  for (let i = 0; i < agents.length; i += maxConcurrent) {
    const batch = agents.slice(i, i + maxConcurrent);
    const batchResults = await Promise.all(
      batch.map(agent => spawnAgent(agent, chapter))
    );
    results.push(...batchResults);
    
    // 批次间延迟
    if (i + maxConcurrent < agents.length) {
      await sleep(strategy.delayMs);
    }
  }
  
  return results;
}
```

## 配置文件

```json
// api-degradation-config.json
{
  "apis": {
    "evomap": {
      "baseUrl": "https://api.evomap.io",
      "timeout": 10000,
      "degradation": {
        "404": {
          "action": "skip_and_log",
          "cooldownMinutes": 60,
          "maxConsecutiveErrors": 3
        },
        "429": {
          "action": "backoff",
          "initialDelayMs": 2000,
          "maxDelayMs": 30000,
          "maxRetries": 5
        }
      }
    },
    "feishu": {
      "degradation": {
        "404": {
          "action": "write_local_file",
          "fallbackPath": "/root/.openclaw/workspace/memory/pending-feishu-"
        },
        "401": {
          "action": "skip_and_notify",
          "notifyChannel": "dingtalk"
        }
      }
    }
  },
  "global": {
    "enableDegradation": true,
    "logFile": "/root/.openclaw/workspace/logs/api-degradation.log",
    "stateFile": "/root/.openclaw/workspace/logs/api-degradation-state.json"
  }
}
```

## 降级状态监控

```javascript
// 获取当前降级状态
async function getDegradationStatus() {
  const state = await readJsonFile('/root/.openclaw/workspace/logs/api-degradation-state.json');
  
  return {
    evomap: {
      status: state.evomap?.status || 'normal', // normal | degraded | unavailable
      degradedSince: state.evomap?.degradedSince,
      consecutiveErrors: state.evomap?.consecutiveErrors || 0
    },
    feishu: {
      status: state.feishu?.status || 'normal',
      degradedSince: state.feishu?.degradedSince
    },
    recent429Count: await getRecent429Count(30),
    activeDegradations: Object.keys(state).filter(k => state[k].status === 'degraded').length
  };
}
```

## 最佳实践

1. **优先降级，而非失败** - 当 API 不可用时，提供备用方案
2. **记录降级事件** - 便于后续分析和修复
3. **设置冷却时间** - 避免频繁重试失败的 API
4. **分级响应** - 根据错误频率调整策略严重程度
5. **自动恢复** - 定期检查 API 是否恢复，自动退出降级状态

## 相关 Skills

- `api-retry-strategy` - API 重试策略
- `evolved-api-rate-limiter` - API 请求速率限制
- `network-error-retry` - 网络错误重试

## 相关 Pattern

- **PAT-090**: EvoMap API 端点全部 404
- **PAT-062**: 429 Rate Limit 频繁触发
- **PAT-084**: 网络错误激增

---

**创建日期**: 2026-03-13
**来源**: Round 314 - PAT-090 (EvoMap API 404) + PAT-062 (429 错误)
**解决问题**: 52+ 次 404 错误，739+ 次 429 错误
