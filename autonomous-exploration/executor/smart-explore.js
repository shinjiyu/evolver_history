#!/usr/bin/env node

/**
 * 自主探索系统 - 产出导向版本
 * 
 * 核心转变：
 * 1. 从"哲学探索"改为"实际任务"
 * 2. 每次探索必须产生具体产出
 * 3. 聚焦于系统改进和知识整理
 */

const fs = require('fs');
const path = require('path');

const SmartGoalGenerator = require('../core/smart-goal-generator');
const RealExplorer = require('../core/real-explorer');

class ProductiveAutonomousExplorer {
  constructor() {
    this.goalGenerator = new SmartGoalGenerator();
    this.explorer = new RealExplorer();
    
    this.logFile = '/root/.openclaw/workspace/autonomous-exploration/logs/exploration.log';
    this.reportDir = '/root/.openclaw/workspace/autonomous-exploration/reports';
    this.outputDir = '/root/.openclaw/workspace/autonomous-exploration/outputs';
    
    this.ensureDirectories();
  }

  ensureDirectories() {
    [path.dirname(this.logFile), this.reportDir, this.outputDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * 主探索流程
   */
  async explore() {
    const startTime = Date.now();
    console.log('🚀 自主探索系统 - 产出导向版本\n');
    console.log('═'.repeat(50));
    console.log('目标：每次探索产生实际价值\n');
    
    try {
      // 1. 收集上下文
      console.log('📊 [1/4] 收集系统上下文...');
      const context = await this.gatherContext();
      console.log(`   ✓ 日志文件: ${context.logFiles} 个`);
      console.log(`   ✓ Memory 文件: ${context.memoryFiles} 个`);
      console.log(`   ✓ Cron 任务: ${context.cronTasks} 个`);
      console.log(`   ✓ 会话记录: ${context.sessions} 个`);
      
      // 2. 生成探索目标
      console.log('\n🎯 [2/4] 生成探索目标...');
      const goal = await this.goalGenerator.generateGoal(context);
      console.log(`   ✓ 类型: ${goal.type}`);
      console.log(`   ✓ 描述: ${goal.description}`);
      console.log(`   ✓ 产出类型: ${goal.outputType}`);
      console.log(`   ✓ 优先级: ${goal.priority.toFixed(2)}`);
      console.log(`   ✓ 原因: ${goal.reason}`);
      
      // 3. 执行探索
      console.log('\n🔍 [3/4] 执行探索任务...');
      const result = await this.explorer.explore(goal);
      
      // 4. 生成报告
      console.log('\n📄 [4/4] 生成报告...');
      const duration = Date.now() - startTime;
      const report = this.generateReport(goal, result, duration);
      
      // 5. 保存日志和报告
      this.saveLog(report);
      this.saveDetailedReport(report);
      
      // 6. 输出总结
      console.log('\n' + '═'.repeat(50));
      console.log('📋 探索总结');
      console.log('─'.repeat(50));
      console.log(`任务: ${goal.description}`);
      console.log(`结果: ${result.success ? '✅ 完成' : '❌ 失败'}`);
      console.log(`发现: ${result.findings?.length || 0} 条`);
      console.log(`建议: ${result.recommendations?.length || 0} 条`);
      console.log(`产出: ${result.outputFile ? '✅ 已保存' : '❌ 无'}`);
      console.log(`耗时: ${(duration / 1000).toFixed(1)} 秒`);
      console.log('═'.repeat(50));
      
      // 7. 输出发现
      if (result.findings?.length > 0) {
        console.log('\n🔍 发现:');
        result.findings.forEach((f, i) => {
          console.log(`   ${i + 1}. ${f}`);
        });
      }
      
      // 8. 输出建议
      if (result.recommendations?.length > 0) {
        console.log('\n💡 建议:');
        result.recommendations.forEach((r, i) => {
          console.log(`   ${i + 1}. ${r}`);
        });
      }
      
      // 9. 输出文件位置
      if (result.outputFile) {
        console.log(`\n📂 产出文件: ${result.outputFile}`);
      }
      
      return {
        success: true,
        report,
        outputFile: result.outputFile
      };
      
    } catch (error) {
      console.error('\n❌ 探索失败:', error.message);
      console.error(error.stack);
      
      this.saveError(error);
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 收集上下文
   */
  async gatherContext() {
    const context = {
      currentTime: new Date().toISOString(),
      logFiles: 0,
      memoryFiles: 0,
      cronTasks: 0,
      sessions: 0
    };
    
    // 日志文件
    const logDir = '/root/.openclaw/workspace/logs';
    if (fs.existsSync(logDir)) {
      context.logFiles = fs.readdirSync(logDir).length;
    }
    
    // Memory 文件
    const memoryDir = '/root/.openclaw/workspace/memory';
    if (fs.existsSync(memoryDir)) {
      context.memoryFiles = fs.readdirSync(memoryDir).filter(f => f.endsWith('.md')).length;
    }
    
    // Cron 任务
    const cronDir = '/root/.openclaw/workspace/cron';
    if (fs.existsSync(cronDir)) {
      context.cronTasks = fs.readdirSync(cronDir).filter(f => f.endsWith('.js')).length;
    }
    
    // 会话记录
    const sessionsDir = '/root/.openclaw/agents/main/sessions';
    if (fs.existsSync(sessionsDir)) {
      context.sessions = fs.readdirSync(sessionsDir).filter(f => f.endsWith('.jsonl')).length;
    }
    
    return context;
  }

  /**
   * 生成报告
   */
  generateReport(goal, result, duration) {
    return {
      timestamp: new Date().toISOString(),
      version: 'productive-1.0',
      goal: {
        type: goal.type,
        description: goal.description,
        outputType: goal.outputType,
        priority: goal.priority,
        reason: goal.reason
      },
      result: {
        success: result.success,
        findings: result.findings || [],
        recommendations: result.recommendations || [],
        outputFile: result.outputFile
      },
      duration
    };
  }

  /**
   * 保存日志
   */
  saveLog(report) {
    const logEntry = {
      timestamp: report.timestamp,
      type: report.goal.type,
      description: report.goal.description,
      success: report.result.success,
      findingsCount: report.result.findings.length,
      recommendationsCount: report.result.recommendations.length,
      duration: report.duration
    };
    
    fs.appendFileSync(this.logFile, JSON.stringify(logEntry) + '\n');
  }

  /**
   * 保存详细报告
   */
  saveDetailedReport(report) {
    const reportFile = path.join(
      this.reportDir,
      `exploration-${Date.now()}.json`
    );
    
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    console.log(`   📄 详细报告: ${reportFile}`);
  }

  /**
   * 保存错误
   */
  saveError(error) {
    const errorEntry = {
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: error.stack
    };
    
    fs.appendFileSync(this.logFile, JSON.stringify(errorEntry) + '\n');
  }
}

// 主执行
if (require.main === module) {
  const explorer = new ProductiveAutonomousExplorer();
  explorer.explore()
    .then(result => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(err => {
      console.error('Fatal error:', err);
      process.exit(1);
    });
}

module.exports = ProductiveAutonomousExplorer;
