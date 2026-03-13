/**
 * 智能目标生成器 - 产出导向版本
 * 
 * 核心转变：
 * 1. 从"哲学追问"改为"实际任务"
 * 2. 每次探索必须产生具体产出
 * 3. 聚焦于系统改进和知识整理
 */

const fs = require('fs');
const path = require('path');

class SmartGoalGenerator {
  constructor() {
    this.workspace = '/root/.openclaw/workspace';
    this.cooldownsFile = '/root/.openclaw/workspace/autonomous-exploration/.task-cooldowns.json';
    this.cooldownDuration = 4 * 60 * 60 * 1000; // 4小时冷却期
    
    // 产出导向的任务类型
    this.productiveGoals = [
      {
        type: 'analyze_logs',
        description: '分析日志文件，发现错误模式和优化机会',
        outputType: 'analysis_report',
        execute: async () => this.analyzeLogs()
      },
      {
        type: 'check_memory_health',
        description: '检查 memory 文件，发现需要整理的内容',
        outputType: 'health_report',
        execute: async () => this.checkMemoryHealth()
      },
      {
        type: 'suggest_improvements',
        description: '分析系统配置，提出改进建议',
        outputType: 'improvement_list',
        execute: async () => this.suggestImprovements()
      },
      {
        type: 'generate_content',
        description: '为小说/EvoMap 生成有用的内容',
        outputType: 'content_draft',
        execute: async () => this.generateContent()
      },
      {
        type: 'review_cron_tasks',
        description: '检查 cron 任务执行情况',
        outputType: 'cron_status_report',
        execute: async () => this.reviewCronTasks()
      },
      {
        type: 'scan_security',
        description: '扫描安全日志，发现可疑活动',
        outputType: 'security_report',
        execute: async () => this.scanSecurity()
      },
      {
        type: 'organize_knowledge',
        description: '从对话历史中提取有价值信息，整理成文档',
        outputType: 'knowledge_doc',
        execute: async () => this.organizeKnowledge()
      },
      {
        type: 'check_evomap_status',
        description: '检查 EvoMap 节点状态和声誉',
        outputType: 'evomap_status',
        execute: async () => this.checkEvoMapStatus()
      }
    ];
  }

  /**
   * 生成探索目标
   */
  async generateGoal(context) {
    console.log('🎯 生成产出导向目标...');
    
    // 1. 分析系统状态，选择最需要的任务
    const priority = await this.analyzePriority();
    
    // 2. 选择最高优先级的任务
    const selectedGoal = priority.goal;
    
    // 3. 记录任务冷却
    this.recordCooldown(selectedGoal.type);
    
    console.log(`✅ 选择任务: ${selectedGoal.type} - ${selectedGoal.description}`);
    console.log(`   优先级: ${priority.score.toFixed(2)}`);
    console.log(`   产出类型: ${selectedGoal.outputType}`);
    
    return {
      type: selectedGoal.type,
      description: selectedGoal.description,
      outputType: selectedGoal.outputType,
      execute: selectedGoal.execute,
      priority: priority.score,
      reason: priority.reason,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 加载冷却记录
   */
  loadCooldowns() {
    try {
      if (fs.existsSync(this.cooldownsFile)) {
        const data = fs.readFileSync(this.cooldownsFile, 'utf8');
        return JSON.parse(data);
      }
    } catch (e) {
      // 忽略错误
    }
    return {};
  }

  /**
   * 保存冷却记录
   */
  saveCooldowns(cooldowns) {
    try {
      fs.writeFileSync(this.cooldownsFile, JSON.stringify(cooldowns, null, 2));
    } catch (e) {
      // 忽略错误
    }
  }

  /**
   * 检查任务是否在冷却中
   */
  isInCooldown(taskType) {
    const cooldowns = this.loadCooldowns();
    const lastRun = cooldowns[taskType];
    
    if (!lastRun) return false;
    
    const elapsed = Date.now() - new Date(lastRun).getTime();
    return elapsed < this.cooldownDuration;
  }

  /**
   * 记录任务冷却
   */
  recordCooldown(taskType) {
    const cooldowns = this.loadCooldowns();
    cooldowns[taskType] = new Date().toISOString();
    this.saveCooldowns(cooldowns);
  }

  /**
   * 分析任务优先级
   */
  async analyzePriority() {
    const scores = [];
    
    for (const goal of this.productiveGoals) {
      const score = await this.calculateGoalScore(goal);
      scores.push({
        goal,
        score: score.total,
        reason: score.reason
      });
    }
    
    // 按分数排序
    scores.sort((a, b) => b.score - a.score);
    
    return scores[0];
  }

  /**
   * 计算任务分数
   */
  async calculateGoalScore(goal) {
    let score = 0;
    const reasons = [];
    
    // 检查冷却期
    if (this.isInCooldown(goal.type)) {
      // 在冷却期内，大幅降低分数
      score = 0.01;
      reasons.push('任务在冷却期内');
      return { total: score, reason: reasons.join('; ') };
    }
    
    switch (goal.type) {
      case 'analyze_logs':
        // 检查是否有大量日志
        const logSize = this.checkLogSize();
        if (logSize > 1024 * 1024) { // > 1MB
          score += 0.8;
          reasons.push('日志文件较大，可能有问题');
        }
        // 检查最近是否有错误
        if (this.hasRecentErrors()) {
          score += 0.5;
          reasons.push('最近有错误发生');
        }
        break;
        
      case 'check_memory_health':
        // 检查 memory 文件大小和更新时间
        const memoryHealth = this.checkMemoryFiles();
        score += memoryHealth.score;
        reasons.push(...memoryHealth.reasons);
        break;
        
      case 'suggest_improvements':
        // 检查配置文件更新时间
        const configAge = this.checkConfigAge();
        if (configAge > 7 * 24 * 60 * 60 * 1000) { // > 7天
          score += 0.7;
          reasons.push('配置文件较久未审查');
        }
        break;
        
      case 'generate_content':
        // 检查小说进度
        const novelProgress = this.checkNovelProgress();
        if (novelProgress.needsUpdate) {
          score += 0.6;
          reasons.push('小说需要新内容');
        }
        break;
        
      case 'review_cron_tasks':
        // 检查 cron 任务状态
        const cronHealth = this.checkCronHealth();
        score += cronHealth.score;
        reasons.push(...cronHealth.reasons);
        break;
        
      case 'scan_security':
        // 检查安全日志
        const securityIssues = this.checkSecurityIssues();
        if (securityIssues > 0) {
          score += 0.9;
          reasons.push(`发现 ${securityIssues} 个安全问题`);
        }
        break;
        
      case 'organize_knowledge':
        // 检查对话历史数量
        const sessionCount = this.countSessions();
        if (sessionCount > 50) {
          score += 0.5;
          reasons.push(`有 ${sessionCount} 个会话记录可整理`);
        }
        break;
        
      case 'check_evomap_status':
        // 检查上次 EvoMap 检查时间
        const lastCheck = this.getLastEvoMapCheck();
        if (Date.now() - lastCheck > 6 * 60 * 60 * 1000) { // > 6小时
          score += 0.7;
          reasons.push('EvoMap 状态较久未检查');
        }
        break;
    }
    
    // 基础分（确保总有任务）
    if (score === 0) {
      score = 0.3;
      reasons.push('定期检查');
    }
    
    return { total: score, reason: reasons.join('; ') };
  }

  // ============ 辅助检查方法 ============

  checkLogSize() {
    const logDir = '/root/.openclaw/workspace/logs';
    if (!fs.existsSync(logDir)) return 0;
    
    let totalSize = 0;
    const files = fs.readdirSync(logDir);
    for (const file of files) {
      const stat = fs.statSync(path.join(logDir, file));
      totalSize += stat.size;
    }
    return totalSize;
  }

  hasRecentErrors() {
    const logFile = '/root/.openclaw/workspace/logs/adaptive-scheduler.log';
    if (!fs.existsSync(logFile)) return false;
    
    const content = fs.readFileSync(logFile, 'utf8');
    return content.includes('ERROR') || content.includes('FAIL') || content.includes('error');
  }

  checkMemoryFiles() {
    let score = 0;
    const reasons = [];
    
    const memoryFile = '/root/.openclaw/workspace/MEMORY.md';
    if (fs.existsSync(memoryFile)) {
      const stat = fs.statSync(memoryFile);
      const age = Date.now() - stat.mtimeMs;
      
      if (age > 24 * 60 * 60 * 1000) { // > 1天
        score += 0.5;
        reasons.push('MEMORY.md 超过 24 小时未更新');
      }
      
      const size = stat.size;
      if (size > 100 * 1024) { // > 100KB
        score += 0.3;
        reasons.push('MEMORY.md 较大，可能需要整理');
      }
    }
    
    // 检查 memory 目录
    const memoryDir = '/root/.openclaw/workspace/memory';
    if (fs.existsSync(memoryDir)) {
      const files = fs.readdirSync(memoryDir).filter(f => f.endsWith('.md'));
      if (files.length > 20) {
        score += 0.4;
        reasons.push(`memory 目录有 ${files.length} 个文件，可能需要归档`);
      }
    }
    
    return { score, reasons };
  }

  checkConfigAge() {
    const configFile = '/root/.openclaw/workspace/HEARTBEAT.md';
    if (!fs.existsSync(configFile)) return Infinity;
    
    const stat = fs.statSync(configFile);
    return Date.now() - stat.mtimeMs;
  }

  checkNovelProgress() {
    const novelDir = '/root/.openclaw/workspace/novel-project';
    if (!fs.existsSync(novelDir)) return { needsUpdate: false };
    
    const chapters = fs.readdirSync(novelDir)
      .filter(f => f.match(/^chapter-\d+\.md$/));
    
    // 如果章节少于 100，需要更新
    return { needsUpdate: chapters.length < 100 };
  }

  checkCronHealth() {
    let score = 0;
    const reasons = [];
    
    const cronDir = '/root/.openclaw/workspace/cron';
    if (!fs.existsSync(cronDir)) {
      score += 0.8;
      reasons.push('cron 目录不存在');
      return { score, reasons };
    }
    
    const files = fs.readdirSync(cronDir).filter(f => f.endsWith('.js'));
    if (files.length === 0) {
      score += 0.6;
      reasons.push('没有 cron 任务');
    } else if (files.length > 10) {
      score += 0.3;
      reasons.push(`有 ${files.length} 个 cron 任务，建议审查`);
    }
    
    return { score, reasons };
  }

  checkSecurityIssues() {
    const logFile = '/var/log/nginx/access.log';
    if (!fs.existsSync(logFile)) return 0;
    
    try {
      const content = fs.readFileSync(logFile, 'utf8');
      const lines = content.split('\n').slice(-1000); // 最近 1000 行
      
      let issues = 0;
      for (const line of lines) {
        if (line.includes('wp-admin') || 
            line.includes('.env') || 
            line.includes('phpMyAdmin') ||
            line.includes('/etc/passwd')) {
          issues++;
        }
      }
      return issues;
    } catch (e) {
      return 0;
    }
  }

  countSessions() {
    const sessionsDir = '/root/.openclaw/agents/main/sessions';
    if (!fs.existsSync(sessionsDir)) return 0;
    
    return fs.readdirSync(sessionsDir).filter(f => f.endsWith('.jsonl')).length;
  }

  getLastEvoMapCheck() {
    const statusFile = '/root/.openclaw/workspace/memory/evomap-node-status-latest.json';
    if (!fs.existsSync(statusFile)) return 0;
    
    const stat = fs.statSync(statusFile);
    return stat.mtimeMs;
  }
}

module.exports = SmartGoalGenerator;
