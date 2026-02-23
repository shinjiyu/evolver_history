/**
 * 目标生成器 - 基于 OODA 循环的"感知"阶段
 * 
 * 负责从多个来源生成探索目标，并计算优先级
 */

const fs = require('fs');
const path = require('path');

class GoalGenerator {
  constructor() {
    this.goalTypes = [
      'skill_improvement',      // 技能提升
      'knowledge_expansion',    // 知识扩展
      'tool_mastery',          // 工具掌握
      'efficiency_boost',      // 效率提升
      'capability_discovery'   // 能力发现
    ];
    
    // 目标来源权重
    this.sourceWeights = {
      user_explicit: 1.0,       // 用户明确目标
      calendar_prediction: 0.9, // 日历预判
      interest_inference: 0.7,  // 兴趣推断
      anomaly_detection: 0.8,   // 异常检测
      curiosity_driven: 0.5     // 好奇心驱动
    };
    
    // 冷却系统 - 防止重复探索
    this.cooldowns = this.loadCooldowns();
  }

  /**
   * 生成探索目标
   */
  generateGoal(context) {
    const candidates = [];
    
    // 1. 分析兴趣点
    const interests = this.analyzeInterests(context);
    interests.forEach(i => candidates.push(this.createCandidate('interest', i)));
    
    // 2. 检测新奇事物
    const novelties = this.detectNovelty(context);
    novelties.forEach(n => candidates.push(this.createCandidate('novelty', n)));
    
    // 3. 识别知识缺口
    const gaps = this.identifyGaps(context);
    gaps.forEach(g => candidates.push(this.createCandidate('gap', g)));
    
    // 4. 检查日历预判
    const predictions = this.predictFromCalendar(context);
    predictions.forEach(p => candidates.push(this.createCandidate('calendar', p)));
    
    // 5. 过滤掉冷却中的目标
    const validCandidates = candidates.filter(c => !this.isCoolingDown(c));
    
    // 6. 计算综合评分并排序
    const scored = validCandidates.map(c => ({
      ...c,
      score: this.calculateScore(c, context)
    })).sort((a, b) => b.score - a.score);
    
    // 7. 返回最高分目标
    if (scored.length === 0) {
      return this.createDefaultGoal();
    }
    
    const topGoal = scored[0];
    
    // 记录到冷却系统
    this.recordExploration(topGoal);
    
    return {
      type: topGoal.type,
      category: topGoal.category,
      priority: topGoal.score,
      actions: this.planActions(topGoal),
      expectedOutcome: this.predictOutcome(topGoal),
      source: topGoal.source,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 创建候选目标
   */
  createCandidate(source, data) {
    return {
      source,
      type: this.inferGoalType(data),
      category: data.category || 'general',
      subject: data.subject || data,
      relevance: data.relevance || 0.5,
      novelty: data.novelty || 0.5,
      feasibility: data.feasibility || 0.8,
      safety: 0.9 // 默认安全
    };
  }

  /**
   * 推断目标类型
   */
  inferGoalType(data) {
    const subject = (data.subject || data || '').toLowerCase();
    
    if (subject.includes('skill') || subject.includes('技能')) return 'skill_improvement';
    if (subject.includes('tool') || subject.includes('工具')) return 'tool_mastery';
    if (subject.includes('efficiency') || subject.includes('效率')) return 'efficiency_boost';
    if (subject.includes('capability') || subject.includes('能力')) return 'capability_discovery';
    
    return 'knowledge_expansion';
  }

  /**
   * 分析兴趣点
   */
  analyzeInterests(context) {
    const interests = [];
    
    // 从 MEMORY.md 提取兴趣
    if (context.memoryContent) {
      const matches = context.memoryContent.match(/^##\s+(.+)$/gm);
      if (matches) {
        matches.slice(0, 5).forEach(m => {
          interests.push({
            subject: m.replace(/^##\s+/, ''),
            category: 'memory_interest',
            relevance: 0.8,
            novelty: 0.3
          });
        });
      }
    }
    
    // 从 HEARTBEAT.md 提取任务
    if (context.heartbeatContent) {
      const taskMatch = context.heartbeatContent.match(/检查|检查|监控|追踪/g);
      if (taskMatch) {
        interests.push({
          subject: 'periodic_task_optimization',
          category: 'heartbeat_task',
          relevance: 0.7,
          novelty: 0.2
        });
      }
    }
    
    return interests;
  }

  /**
   * 检测新奇事物
   */
  detectNovelty(context) {
    const novelties = [];
    
    // 检查新技能目录
    const skillsDir = '/root/.openclaw/workspace/skills';
    if (fs.existsSync(skillsDir)) {
      const skills = fs.readdirSync(skillsDir).filter(f => 
        fs.statSync(path.join(skillsDir, f)).isDirectory()
      );
      
      // 随机选择一个技能进行深入了解
      if (skills.length > 0 && Math.random() < 0.3) {
        const randomSkill = skills[Math.floor(Math.random() * skills.length)];
        novelties.push({
          subject: `deep_dive_skill_${randomSkill}`,
          category: 'skill_exploration',
          relevance: 0.6,
          novelty: 0.9,
          feasibility: 0.9
        });
      }
    }
    
    return novelties;
  }

  /**
   * 识别知识缺口
   */
  identifyGaps(context) {
    const gaps = [];
    
    // 检查是否有未完成的进化任务
    const evolutionStore = '/root/.openclaw/workspace/.cursor/evolution-store.json';
    if (fs.existsSync(evolutionStore)) {
      try {
        const store = JSON.parse(fs.readFileSync(evolutionStore, 'utf8'));
        if (store.pendingPatterns && store.pendingPatterns.length > 0) {
          gaps.push({
            subject: 'evolution_pattern_analysis',
            category: 'self_evolution',
            relevance: 0.8,
            novelty: 0.5,
            feasibility: 0.7
          });
        }
      } catch (e) {
        // 忽略解析错误
      }
    }
    
    // 检查小说宣传知识库
    const memoryFile = '/root/.openclaw/workspace/MEMORY.md';
    if (fs.existsSync(memoryFile)) {
      const content = fs.readFileSync(memoryFile, 'utf8');
      // 检查是否有未执行的策略
      const uncheckedPatterns = /-\s*\[\s*\]/g;
      const uncheckedCount = (content.match(uncheckedPatterns) || []).length;
      if (uncheckedCount > 10) {
        gaps.push({
          subject: 'novel_marketing_execution',
          category: 'novel_promotion',
          relevance: 0.9,
          novelty: 0.4,
          feasibility: 0.9
        });
      }
    }
    
    return gaps;
  }

  /**
   * 从日历预判目标
   */
  predictFromCalendar(context) {
    const predictions = [];
    
    // 简单的时间预判
    const hour = new Date().getHours();
    const dayOfWeek = new Date().getDay();
    
    // 周一上午 - 可能需要周报
    if (dayOfWeek === 1 && hour >= 9 && hour <= 11) {
      predictions.push({
        subject: 'weekly_report_preparation',
        category: 'calendar_prediction',
        relevance: 0.7,
        novelty: 0.1,
        feasibility: 0.9
      });
    }
    
    // 周五下午 - 可能需要周总结
    if (dayOfWeek === 5 && hour >= 15 && hour <= 18) {
      predictions.push({
        subject: 'weekly_summary',
        category: 'calendar_prediction',
        relevance: 0.7,
        novelty: 0.1,
        feasibility: 0.9
      });
    }
    
    return predictions;
  }

  /**
   * 计算综合评分
   */
  calculateScore(candidate, context) {
    const sourceWeight = this.sourceWeights[candidate.source] || 0.5;
    
    // 综合评分公式
    const score = 
      candidate.relevance * 0.3 +
      candidate.novelty * 0.25 +
      candidate.feasibility * 0.25 +
      candidate.safety * 0.2;
    
    // 应用来源权重
    const finalScore = score * sourceWeight;
    
    // 考虑当前负载
    if (context.systemLoad && context.systemLoad > 0.8) {
      return finalScore * 0.5; // 高负载时降低分数
    }
    
    return finalScore;
  }

  /**
   * 规划行动步骤
   */
  planActions(candidate) {
    const actions = [];
    
    switch (candidate.type) {
      case 'skill_improvement':
        actions.push(
          { type: 'research', target: candidate.subject },
          { type: 'practice', method: 'hands-on' },
          { type: 'evaluate', criteria: 'performance' }
        );
        break;
        
      case 'knowledge_expansion':
        actions.push(
          { type: 'search', query: candidate.subject },
          { type: 'read', sources: 'web/docs' },
          { type: 'summarize', format: 'memory-file' }
        );
        break;
        
      case 'tool_mastery':
        actions.push(
          { type: 'explore_tool', tool: candidate.subject },
          { type: 'test_features', scope: 'basic' },
          { type: 'document', format: 'skill' }
        );
        break;
        
      case 'efficiency_boost':
        actions.push(
          { type: 'analyze', target: candidate.subject },
          { type: 'optimize', method: 'incremental' },
          { type: 'measure', metric: 'time_saved' }
        );
        break;
        
      case 'capability_discovery':
        actions.push(
          { type: 'scan', scope: 'available_tools' },
          { type: 'experiment', approach: 'safe_try' },
          { type: 'record', format: 'discovery_log' }
        );
        break;
        
      default:
        actions.push(
          { type: 'explore', target: candidate.subject }
        );
    }
    
    return actions;
  }

  /**
   * 预测结果
   */
  predictOutcome(candidate) {
    return {
      expectedValue: Math.round(candidate.relevance * 100),
      confidence: Math.round(candidate.feasibility * 100),
      timeEstimate: Math.round(1 / candidate.feasibility * 5) // 分钟
    };
  }

  /**
   * 创建默认目标
   */
  createDefaultGoal() {
    return {
      type: 'capability_discovery',
      category: 'default',
      priority: 0.3,
      actions: [
        { type: 'scan', scope: 'environment' }
      ],
      expectedOutcome: {
        expectedValue: 30,
        confidence: 80,
        timeEstimate: 3
      },
      source: 'default',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 冷却系统
   */
  loadCooldowns() {
    const cooldownFile = '/root/.openclaw/workspace/autonomous-exploration/.cooldowns.json';
    if (fs.existsSync(cooldownFile)) {
      try {
        return JSON.parse(fs.readFileSync(cooldownFile, 'utf8'));
      } catch (e) {
        return {};
      }
    }
    return {};
  }

  saveCooldowns() {
    const cooldownFile = '/root/.openclaw/workspace/autonomous-exploration/.cooldowns.json';
    fs.writeFileSync(cooldownFile, JSON.stringify(this.cooldowns, null, 2));
  }

  isCoolingDown(candidate) {
    const key = `${candidate.type}:${candidate.subject}`;
    const lastExplored = this.cooldowns[key];
    
    if (!lastExplored) return false;
    
    const cooldownPeriod = this.getCooldownPeriod(candidate.type);
    const elapsed = Date.now() - new Date(lastExplored).getTime();
    
    return elapsed < cooldownPeriod;
  }

  getCooldownPeriod(type) {
    const periods = {
      'knowledge_expansion': 3 * 24 * 60 * 60 * 1000,  // 3 天
      'skill_improvement': 7 * 24 * 60 * 60 * 1000,    // 7 天
      'tool_mastery': 7 * 24 * 60 * 60 * 1000,         // 7 天
      'efficiency_boost': 1 * 24 * 60 * 60 * 1000,     // 1 天
      'capability_discovery': 30 * 24 * 60 * 60 * 1000 // 30 天
    };
    return periods[type] || 7 * 24 * 60 * 60 * 1000;
  }

  recordExploration(goal) {
    const key = `${goal.type}:${goal.subject || goal.category}`;
    this.cooldowns[key] = new Date().toISOString();
    this.saveCooldowns();
  }
}

module.exports = GoalGenerator;
