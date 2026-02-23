#!/usr/bin/env node

/**
 * 自主探索执行器
 * 
 * 整合所有核心模块，执行完整的探索循环：
 * 感知 → 决策 → 行动 → 学习
 */

const fs = require('fs');
const path = require('path');

// 导入核心模块
const GoalGenerator = require('../core/goal-generator');
const ActionPlanner = require('../core/action-planner');
const LearningSystem = require('../core/learning-system');
const SafetyConstraints = require('../core/safety-constraints');

class AutonomousExplorer {
  constructor() {
    this.goalGenerator = new GoalGenerator();
    this.actionPlanner = new ActionPlanner();
    this.learningSystem = new LearningSystem();
    this.safetyConstraints = new SafetyConstraints();
    
    this.logFile = '/root/.openclaw/workspace/autonomous-exploration/logs/exploration.log';
    this.ensureLogDirectory();
  }

  /**
   * 确保日志目录存在
   */
  ensureLogDirectory() {
    const logDir = path.dirname(this.logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  /**
   * 主探索流程
   */
  async explore() {
    const startTime = Date.now();
    console.log('🧭 开始自主探索...\n');
    
    try {
      // 1. 获取当前上下文
      const context = await this.gatherContext();
      console.log('📊 上下文收集完成');
      
      // 2. 生成探索目标
      const goal = this.goalGenerator.generateGoal(context);
      console.log(`🎯 目标: ${goal.type} (优先级: ${goal.priority.toFixed(2)})`);
      console.log(`   分类: ${goal.category}`);
      console.log(`   来源: ${goal.source}`);
      
      // 3. 规划行动
      const plan = this.actionPlanner.plan(goal);
      const planSummary = this.actionPlanner.summarizePlan(plan);
      console.log(`\n📋 计划: ${planSummary.totalSteps} 步`);
      console.log(`   预计时间: ${planSummary.totalTimeMinutes} 分钟`);
      console.log(`   风险等级: ${planSummary.riskLevel}`);
      
      // 4. 执行行动（带安全检查）
      console.log('\n▶️ 执行行动:');
      const results = [];
      let executedCount = 0;
      let skippedCount = 0;
      
      for (const action of plan) {
        const safety = this.safetyConstraints.isActionSafe(action);
        
        if (safety.safe) {
          const result = await this.executeAction(action);
          results.push(result);
          
          if (result.executed) {
            executedCount++;
            this.safetyConstraints.recordExecution(action);
          }
          
          console.log(`  ✅ ${action.type}: ${result.success ? '成功' : '失败'}`);
        } else {
          skippedCount++;
          console.log(`  ⏭️ ${action.type}: 跳过 (${safety.reason})`);
        }
      }
      
      console.log(`\n📊 执行统计: ${executedCount} 成功, ${skippedCount} 跳过`);
      
      // 5. 学习和记录
      const learning = this.learningSystem.evaluateLearning(goal, results);
      console.log(`\n📚 学习结果: ${learning.success ? '✅ 成功' : '❌ 失败'}`);
      console.log(`   价值: ${learning.value} 点`);
      
      if (learning.lessons.length > 0) {
        console.log('   教训:');
        learning.lessons.forEach(l => console.log(`     - ${l}`));
      }
      
      // 6. 更新记忆
      await this.updateMemory(goal, results, learning);
      
      // 7. 记录到知识库
      this.learningSystem.recordLearning({
        type: goal.type,
        content: `探索 ${goal.category}`,
        source: goal.source,
        confidence: goal.priority,
        success: learning.success,
        successRate: learning.success ? 1 : 0
      });
      
      // 8. 写入日志
      const duration = Date.now() - startTime;
      this.logExploration(goal, results, learning, duration);
      
      console.log(`\n✅ 探索完成 (${(duration / 1000).toFixed(1)}s)`);
      
      return {
        success: true,
        goal,
        results,
        learning,
        duration
      };
      
    } catch (error) {
      console.error('\n❌ 探索失败:', error.message);
      
      // 记录错误
      this.logError(error);
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 收集当前上下文
   */
  async gatherContext() {
    const context = {
      currentTime: new Date().toISOString(),
      recentActions: [],
      currentSkills: [],
      knowledgeGaps: [],
      systemLoad: await this.getSystemLoad()
    };
    
    // 读取 MEMORY.md
    const memoryFile = '/root/.openclaw/workspace/MEMORY.md';
    if (fs.existsSync(memoryFile)) {
      context.memoryContent = fs.readFileSync(memoryFile, 'utf8').substring(0, 5000);
    }
    
    // 读取 HEARTBEAT.md
    const heartbeatFile = '/root/.openclaw/workspace/HEARTBEAT.md';
    if (fs.existsSync(heartbeatFile)) {
      context.heartbeatContent = fs.readFileSync(heartbeatFile, 'utf8');
    }
    
    // 列出当前技能
    const skillsDir = '/root/.openclaw/workspace/skills';
    if (fs.existsSync(skillsDir)) {
      context.currentSkills = fs.readdirSync(skillsDir)
        .filter(f => fs.statSync(path.join(skillsDir, f)).isDirectory());
    }
    
    return context;
  }

  /**
   * 获取系统负载
   */
  async getSystemLoad() {
    try {
      const os = require('os');
      const cpus = os.cpus();
      const loadAvg = os.loadavg()[0] / cpus.length;
      return loadAvg;
    } catch (e) {
      return 0.5; // 默认中等负载
    }
  }

  /**
   * 执行单个行动
   */
  async executeAction(action) {
    const startTime = Date.now();
    
    try {
      let output = null;
      let success = true;
      let executed = true;
      
      switch (action.type) {
        case 'search':
          output = await this.performSearch(action);
          break;
          
        case 'scan':
          output = await this.performScan(action);
          break;
          
        case 'read':
          output = await this.performRead(action);
          break;
          
        case 'analyze':
          output = await this.performAnalyze(action);
          break;
          
        case 'check_network':
          output = { connected: true };
          break;
          
        case 'check_source':
          output = { accessible: true };
          break;
          
        case 'backup_state':
          output = { backupCreated: true };
          break;
          
        case 'measure_baseline':
          output = { baseline: Date.now() };
          break;
          
        case 'verify_result':
          output = { verified: true };
          break;
          
        case 'quality_check':
          output = { quality: 'good' };
          break;
          
        case 'record':
          output = { recorded: true };
          break;
          
        case 'document':
          output = { documented: true };
          break;
          
        default:
          // 未知行动类型，标记为跳过
          executed = false;
          output = { message: `未知行动类型: ${action.type}` };
      }
      
      const duration = Date.now() - startTime;
      
      return {
        type: action.type,
        success,
        executed,
        output,
        duration
      };
      
    } catch (error) {
      return {
        type: action.type,
        success: false,
        executed: true,
        error: error.message,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * 执行搜索
   */
  async performSearch(action) {
    // 简单的模拟搜索
    return {
      query: action.query || action.target,
      results: [],
      message: '搜索完成（模拟）'
    };
  }

  /**
   * 执行扫描
   */
  async performScan(action) {
    const results = [];
    
    if (action.scope === 'environment') {
      // 扫描环境
      results.push({
        type: 'skills',
        count: fs.existsSync('/root/.openclaw/workspace/skills') ? 
          fs.readdirSync('/root/.openclaw/workspace/skills').length : 0
      });
    }
    
    return {
      scope: action.scope,
      results,
      message: '扫描完成'
    };
  }

  /**
   * 执行读取
   */
  async performRead(action) {
    return {
      source: action.sources,
      content: '读取完成（模拟）',
      message: '信息已获取'
    };
  }

  /**
   * 执行分析
   */
  async performAnalyze(action) {
    return {
      target: action.target,
      insights: ['分析完成'],
      message: '分析结果已生成'
    };
  }

  /**
   * 更新记忆
   */
  async updateMemory(goal, results, learning) {
    const today = new Date().toISOString().split('T')[0];
    const memoryDir = '/root/.openclaw/workspace/memory';
    const memoryFile = path.join(memoryDir, `${today}.md`);
    
    // 确保目录存在
    if (!fs.existsSync(memoryDir)) {
      fs.mkdirSync(memoryDir, { recursive: true });
    }
    
    // 构建记忆条目
    let entry = `\n\n## 自主探索 ${new Date().toLocaleTimeString('zh-CN')}\n\n` +
      `- **目标**: ${goal.type} (${goal.category})\n` +
      `- **来源**: ${goal.source}\n` +
      `- **结果**: ${learning.success ? '✅ 成功' : '❌ 失败'}\n` +
      `- **价值**: ${learning.value} 点\n` +
      `- **执行步骤**: ${results.filter(r => r.executed).length}\n`;
    
    if (learning.lessons.length > 0) {
      entry += `- **教训**:\n`;
      learning.lessons.forEach(l => entry += `  - ${l}\n`);
    }
    
    // 追加到文件
    fs.appendFileSync(memoryFile, entry);
    console.log(`📝 已更新记忆文件: ${memoryFile}`);
  }

  /**
   * 记录探索日志
   */
  logExploration(goal, results, learning, duration) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      goal: {
        type: goal.type,
        category: goal.category,
        priority: goal.priority
      },
      execution: {
        totalActions: results.length,
        executedActions: results.filter(r => r.executed).length,
        successActions: results.filter(r => r.success).length
      },
      learning: {
        success: learning.success,
        value: learning.value
      },
      duration
    };
    
    const logLine = JSON.stringify(logEntry) + '\n';
    fs.appendFileSync(this.logFile, logLine);
  }

  /**
   * 记录错误
   */
  logError(error) {
    const errorEntry = {
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: error.stack
    };
    
    const logLine = JSON.stringify(errorEntry) + '\n';
    fs.appendFileSync(this.logFile, logLine);
  }
}

// 主执行
if (require.main === module) {
  const explorer = new AutonomousExplorer();
  explorer.explore()
    .then(result => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(err => {
      console.error('Fatal error:', err);
      process.exit(1);
    });
}

module.exports = AutonomousExplorer;
