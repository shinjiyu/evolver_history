/**
 * OpenClaw 自主探索 - 目标系统原型
 * 
 * 实现了目标分解、冲突检测、平衡策略
 * 
 * 日期：2026-02-23
 */

// ============================================
// 1. 目标类
// ============================================

class Goal {
  constructor(options) {
    this.id = options.id || `goal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.description = options.description;
    this.type = options.type || 'generic'; // information_gathering, task_execution, learning, exploration
    this.level = options.level || 1; // 1=操作, 2=战术, 3=战略, 4=愿景
    this.priority = options.priority || 0.5;
    this.deadline = options.deadline || null;
    this.metadata = options.metadata || {};
    this.preconditions = options.preconditions || [];
    this.children = options.children || [];
    this.parent = options.parent || null;
    this.source = options.source || 'explicit'; // explicit, interest, anomaly, curiosity, calendar
    this.weight = options.weight || 1.0;
    this.status = options.status || 'pending'; // pending, active, completed, failed
    this.progress = options.progress || 0.0; // 0.0 - 1.0
  }
  
  /**
   * 评估目标分数
   */
  calculateScore(userModel) {
    const relevance = this.assessRelevance(userModel);
    const novelty = this.assessNovelty();
    const feasibility = this.assessFeasibility();
    const safety = this.assessSafety();
    
    return {
      raw: relevance * novelty * feasibility * safety,
      weighted: relevance * novelty * feasibility * safety * this.weight,
      breakdown: { relevance, novelty, feasibility, safety, sourceWeight: this.weight }
    };
  }
  
  assessRelevance(userModel) {
    // 简化实现：基于关键词匹配用户兴趣
    if (!userModel || !userModel.interests) return 0.5;
    
    const keywords = this.extractKeywords(this.description);
    const interestKeywords = userModel.interests.flatMap(i => this.extractKeywords(i));
    
    const matches = keywords.filter(k => interestKeywords.includes(k)).length;
    const maxMatches = Math.max(keywords.length, 1);
    
    return Math.min(matches / maxMatches, 1.0);
  }
  
  assessNovelty() {
    // 简化实现：基于目标类型
    const noveltyByType = {
      'exploration': 0.9,
      'learning': 0.8,
      'information_gathering': 0.7,
      'task_execution': 0.5,
      'generic': 0.5
    };
    return noveltyByType[this.type] || 0.5;
  }
  
  assessFeasibility() {
    // 简化实现：基于目标层级
    const feasibilityByLevel = {
      1: 0.9, // 操作目标很容易执行
      2: 0.7, // 战术目标较容易
      3: 0.5, // 战略目标中等难度
      4: 0.3  // 愿景目标较难
    };
    return feasibilityByLevel[this.level] || 0.5;
  }
  
  assessSafety() {
    // 简化实现：基于目标来源
    const safetyBySource = {
      'explicit': 0.95, // 用户明确目标最安全
      'calendar': 0.9,  // 日历预判较安全
      'interest': 0.8,  // 兴趣推断中等
      'anomaly': 0.7,   // 异常检测略低
      'curiosity': 0.6  // 好奇心驱动需要更多审查
    };
    return safetyBySource[this.source] || 0.7;
  }
  
  extractKeywords(text) {
    // 简单的关键词提取（实际应使用 NLP）
    return text.toLowerCase()
      .replace(/[^\w\s\u4e00-\u9fa5]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2);
  }
  
  /**
   * 判断目标是否可执行
   */
  isExecutable() {
    return this.level === 1 && this.preconditions.every(p => p.satisfied);
  }
  
  /**
   * 更新进度
   */
  updateProgress(progress) {
    this.progress = Math.min(Math.max(progress, 0.0), 1.0);
    
    if (this.progress >= 1.0) {
      this.status = 'completed';
    } else if (this.progress > 0) {
      this.status = 'active';
    }
    
    // 通知父目标
    if (this.parent) {
      this.parent.updateProgressFromChild();
    }
  }
  
  updateProgressFromChild() {
    if (this.children.length === 0) return;
    
    const totalProgress = this.children.reduce((sum, child) => sum + child.progress, 0);
    this.progress = totalProgress / this.children.length;
    
    if (this.parent) {
      this.parent.updateProgressFromChild();
    }
  }
}

// ============================================
// 2. 目标分解器
// ============================================

class GoalDecomposer {
  constructor() {
    this.decompositionStrategies = {
      'information_gathering': this.decomposeInfoGathering.bind(this),
      'task_execution': this.decomposeTaskExecution.bind(this),
      'learning': this.decomposeLearning.bind(this),
      'exploration': this.decomposeExploration.bind(this),
      'generic': this.decomposeGeneric.bind(this)
    };
  }
  
  /**
   * 分解目标
   */
  async decompose(vagueGoal, userModel, context = {}) {
    console.log(`\n🎯 分解目标: "${vagueGoal.description}"`);
    
    // 创建目标树
    const goalTree = {
      root: vagueGoal,
      children: []
    };
    
    // 应用分解策略
    const strategy = this.decompositionStrategies[vagueGoal.type] || this.decompositionStrategies['generic'];
    goalTree.children = await strategy(vagueGoal, userModel, context);
    
    // 设置父子关系
    for (const child of goalTree.children) {
      child.parent = vagueGoal;
      vagueGoal.children.push(child);
    }
    
    // 计算优先级
    for (const child of goalTree.children) {
      child.priority = this.calculatePriority(child, userModel, context);
    }
    
    console.log(`   ✓ 生成 ${goalTree.children.length} 个子目标`);
    
    return goalTree;
  }
  
  /**
   * 信息收集类目标分解
   */
  async decomposeInfoGathering(goal, userModel, context) {
    const keywords = goal.extractKeywords(goal.description);
    const mainTopic = keywords[0] || '相关信息';
    
    return [
      new Goal({
        description: `搜索最近1个月的${mainTopic}相关文章`,
        type: 'task_execution',
        level: 1,
        source: goal.source,
        weight: 0.9,
        metadata: { action: 'search', timeRange: '1m', topic: mainTopic }
      }),
      new Goal({
        description: `查找${mainTopic}的开源项目和代码示例`,
        type: 'task_execution',
        level: 1,
        source: goal.source,
        weight: 0.85,
        metadata: { action: 'search', sources: ['github.com'], topic: mainTopic }
      }),
      new Goal({
        description: `收集${mainTopic}的技术博客和教程`,
        type: 'task_execution',
        level: 1,
        source: goal.source,
        weight: 0.8,
        metadata: { action: 'search', sources: ['medium.com', 'dev.to'], topic: mainTopic }
      }),
      new Goal({
        description: `汇总搜索结果并生成报告`,
        type: 'task_execution',
        level: 1,
        source: goal.source,
        weight: 1.0,
        preconditions: [
          { type: 'dependency', targetIndex: 0, satisfied: false },
          { type: 'dependency', targetIndex: 1, satisfied: false },
          { type: 'dependency', targetIndex: 2, satisfied: false }
        ],
        metadata: { action: 'synthesis' }
      })
    ];
  }
  
  /**
   * 任务执行类目标分解
   */
  async decomposeTaskExecution(goal, userModel, context) {
    // 如果已经是操作级目标，不需要分解
    if (goal.level === 1) {
      return [goal];
    }
    
    // 简化分解：创建准备、执行、验证三个阶段
    return [
      new Goal({
        description: `准备执行: ${goal.description}`,
        type: 'task_execution',
        level: 1,
        source: goal.source,
        weight: 0.8,
        metadata: { phase: 'preparation' }
      }),
      new Goal({
        description: `执行: ${goal.description}`,
        type: 'task_execution',
        level: 1,
        source: goal.source,
        weight: 1.0,
        preconditions: [
          { type: 'dependency', targetIndex: 0, satisfied: false }
        ],
        metadata: { phase: 'execution' }
      }),
      new Goal({
        description: `验证: ${goal.description}`,
        type: 'task_execution',
        level: 1,
        source: goal.source,
        weight: 0.7,
        preconditions: [
          { type: 'dependency', targetIndex: 1, satisfied: false }
        ],
        metadata: { phase: 'validation' }
      })
    ];
  }
  
  /**
   * 学习类目标分解
   */
  async decomposeLearning(goal, userModel, context) {
    const keywords = goal.extractKeywords(goal.description);
    const topic = keywords[0] || '新知识';
    
    return [
      new Goal({
        description: `了解${topic}的基本概念和术语`,
        type: 'information_gathering',
        level: 1,
        source: goal.source,
        weight: 0.9,
        metadata: { depth: 'basic', topic }
      }),
      new Goal({
        description: `学习${topic}的核心原理和方法`,
        type: 'information_gathering',
        level: 1,
        source: goal.source,
        weight: 1.0,
        preconditions: [
          { type: 'dependency', targetIndex: 0, satisfied: false }
        ],
        metadata: { depth: 'intermediate', topic }
      }),
      new Goal({
        description: `实践${topic}的应用案例`,
        type: 'task_execution',
        level: 1,
        source: goal.source,
        weight: 0.85,
        preconditions: [
          { type: 'dependency', targetIndex: 1, satisfied: false }
        ],
        metadata: { depth: 'advanced', topic }
      })
    ];
  }
  
  /**
   * 探索类目标分解
   */
  async decomposeExploration(goal, userModel, context) {
    const keywords = goal.extractKeywords(goal.description);
    const area = keywords[0] || '未知领域';
    
    return [
      new Goal({
        description: `广泛搜索${area}的相关信息`,
        type: 'information_gathering',
        level: 1,
        source: 'curiosity',
        weight: 0.8,
        metadata: { breadth: 'wide', area }
      }),
      new Goal({
        description: `识别${area}中的关键话题和趋势`,
        type: 'task_execution',
        level: 1,
        source: 'curiosity',
        weight: 0.9,
        preconditions: [
          { type: 'dependency', targetIndex: 0, satisfied: false }
        ],
        metadata: { action: 'analysis' }
      }),
      new Goal({
        description: `评估${area}对用户的价值`,
        type: 'task_execution',
        level: 1,
        source: 'curiosity',
        weight: 1.0,
        preconditions: [
          { type: 'dependency', targetIndex: 1, satisfied: false }
        ],
        metadata: { action: 'evaluation' }
      })
    ];
  }
  
  /**
   * 通用目标分解
   */
  async decomposeGeneric(goal, userModel, context) {
    // 默认分解为信息收集 + 执行
    return [
      new Goal({
        description: `收集"${goal.description}"所需的信息`,
        type: 'information_gathering',
        level: 1,
        source: goal.source,
        weight: 0.8
      }),
      new Goal({
        description: `执行"${goal.description}"`,
        type: 'task_execution',
        level: 1,
        source: goal.source,
        weight: 1.0,
        preconditions: [
          { type: 'dependency', targetIndex: 0, satisfied: false }
        ]
      })
    ];
  }
  
  /**
   * 计算子目标优先级
   */
  calculatePriority(goal, userModel, context) {
    const score = goal.calculateScore(userModel);
    return score.weighted;
  }
}

// ============================================
// 3. 目标冲突检测器
// ============================================

class GoalConflictDetector {
  /**
   * 检测目标冲突
   */
  async detectConflicts(goals) {
    const conflicts = [];
    
    for (let i = 0; i < goals.length; i++) {
      for (let j = i + 1; j < goals.length; j++) {
        const conflict = await this.checkPair(goals[i], goals[j]);
        if (conflict) {
          conflicts.push(conflict);
        }
      }
    }
    
    return conflicts;
  }
  
  /**
   * 检查两个目标之间的冲突
   */
  async checkPair(goalA, goalB) {
    // 资源冲突（简化：基于元数据）
    if (this.hasResourceConflict(goalA, goalB)) {
      return {
        type: 'resource',
        goals: [goalA, goalB],
        resource: goalA.metadata.resource || goalB.metadata.resource || 'unknown',
        severity: 'medium',
        resolution: 'sequential'
      };
    }
    
    // 时间冲突
    if (this.hasTimeConflict(goalA, goalB)) {
      return {
        type: 'time',
        goals: [goalA, goalB],
        severity: 'low',
        resolution: 'prioritize'
      };
    }
    
    // 逻辑冲突（简化：基于关键词相反）
    if (await this.hasLogicalConflict(goalA, goalB)) {
      return {
        type: 'logical',
        goals: [goalA, goalB],
        severity: 'high',
        description: '目标可能相互矛盾',
        resolution: 'user_choice'
      };
    }
    
    return null;
  }
  
  hasResourceConflict(goalA, goalB) {
    // 检查是否需要同一资源
    const resourceA = goalA.metadata.resource;
    const resourceB = goalB.metadata.resource;
    return resourceA && resourceB && resourceA === resourceB;
  }
  
  hasTimeConflict(goalA, goalB) {
    // 检查时间冲突（简化实现）
    if (!goalA.deadline || !goalB.deadline) return false;
    return Math.abs(goalA.deadline - goalB.deadline) < 3600000; // 1小时内
  }
  
  async hasLogicalConflict(goalA, goalB) {
    // 简化实现：检查关键词是否有相反含义
    const oppositePairs = [
      ['购买', '出售'],
      ['增加', '减少'],
      ['开启', '关闭'],
      ['创建', '删除']
    ];
    
    const keywordsA = goalA.extractKeywords(goalA.description);
    const keywordsB = goalB.extractKeywords(goalB.description);
    
    for (const [word1, word2] of oppositePairs) {
      if ((keywordsA.includes(word1) && keywordsB.includes(word2)) ||
          (keywordsA.includes(word2) && keywordsB.includes(word1))) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * 解决冲突
   */
  async resolveConflict(conflict) {
    const resolutions = {
      'sequential': {
        strategy: '串行执行',
        action: `按优先级顺序执行: ${conflict.goals.map(g => g.description).join(' → ')}`
      },
      'prioritize': {
        strategy: '优先级排序',
        action: `优先执行高优先级目标`
      },
      'user_choice': {
        strategy: '用户决策',
        action: `需要用户选择执行哪个目标`
      }
    };
    
    return resolutions[conflict.resolution] || { strategy: '未知', action: '' };
  }
}

// ============================================
// 4. 目标平衡器
// ============================================

class GoalBalancer {
  constructor() {
    this.allocation = {
      longTerm: 0.3,
      shortTerm: 0.5,
      reactive: 0.2
    };
  }
  
  /**
   * 规划目标执行
   */
  async plan(longTermGoals, shortTermTasks, availableTime = 60) {
    console.log(`\n📊 规划目标执行 (可用时间: ${availableTime}分钟)`);
    
    const schedule = {
      longTermSlots: [],
      shortTermSlots: [],
      reactiveBuffer: availableTime * this.allocation.reactive,
      totalAvailable: availableTime
    };
    
    const usableTime = availableTime - schedule.reactiveBuffer;
    const longTermTime = usableTime * this.allocation.longTerm;
    const shortTermTime = usableTime * this.allocation.shortTerm;
    
    // 选择长期目标进度
    schedule.longTermSlots = await this.selectLongTermProgress(
      longTermGoals,
      longTermTime
    );
    
    // 选择短期任务
    schedule.shortTermSlots = await this.selectShortTermTasks(
      shortTermTasks,
      shortTermTime
    );
    
    console.log(`   ✓ 长期目标: ${schedule.longTermSlots.length} 项`);
    console.log(`   ✓ 短期任务: ${schedule.shortTermSlots.length} 项`);
    console.log(`   ✓ 反应式预留: ${schedule.reactiveBuffer.toFixed(0)} 分钟`);
    
    return schedule;
  }
  
  async selectLongTermProgress(goals, availableTime) {
    if (!goals || goals.length === 0) return [];
    
    const selected = [];
    let remainingTime = availableTime;
    
    // 按优先级和进度排序
    const sorted = [...goals].sort((a, b) => {
      const aScore = a.priority * (1 - a.progress);
      const bScore = b.priority * (1 - b.progress);
      return bScore - aScore;
    });
    
    for (const goal of sorted) {
      const estimatedTime = 15; // 默认15分钟
      
      if (estimatedTime <= remainingTime) {
        selected.push({
          goal: goal,
          estimatedTime,
          reason: `推进 "${goal.description}" (${(goal.progress * 100).toFixed(0)}% 完成)`
        });
        remainingTime -= estimatedTime;
      }
      
      if (remainingTime < 5) break;
    }
    
    return selected;
  }
  
  async selectShortTermTasks(tasks, availableTime) {
    if (!tasks || tasks.length === 0) return [];
    
    const selected = [];
    let remainingTime = availableTime;
    
    // 按优先级排序
    const sorted = [...tasks].sort((a, b) => b.priority - a.priority);
    
    for (const task of sorted) {
      const estimatedTime = task.metadata?.estimatedTime || 10;
      
      if (estimatedTime <= remainingTime) {
        selected.push({
          task: task,
          estimatedTime,
          priority: task.priority
        });
        remainingTime -= estimatedTime;
      }
      
      if (remainingTime < 5) break;
    }
    
    return selected;
  }
  
  /**
   * 动态调整策略
   */
  adjustStrategy(executionHistory) {
    if (!executionHistory || executionHistory.length < 5) return;
    
    // 分析执行历史
    const recentHistory = executionHistory.slice(-10);
    const longTermCompleted = recentHistory.filter(h => h.type === 'longTerm' && h.success).length;
    const interruptions = recentHistory.filter(h => h.interrupted).length;
    
    // 调整资源分配
    if (longTermCompleted / recentHistory.length < 0.3) {
      this.allocation.longTerm = Math.min(this.allocation.longTerm + 0.05, 0.5);
      this.allocation.shortTerm = Math.max(this.allocation.shortTerm - 0.05, 0.3);
      console.log('   ⚡ 调整策略：增加长期目标资源分配');
    }
    
    if (interruptions / recentHistory.length > 0.3) {
      this.allocation.reactive = Math.min(this.allocation.reactive + 0.05, 0.3);
      this.allocation.shortTerm = Math.max(this.allocation.shortTerm - 0.05, 0.3);
      console.log('   ⚡ 调整策略：增加反应式预留');
    }
  }
}

// ============================================
// 5. 主系统
// ============================================

class AutonomousGoalSystem {
  constructor() {
    this.decomposer = new GoalDecomposer();
    this.conflictDetector = new GoalConflictDetector();
    this.balancer = new GoalBalancer();
    
    this.longTermGoals = [];
    this.activeGoals = [];
    this.completedGoals = [];
    this.executionHistory = [];
  }
  
  /**
   * 处理新目标
   */
  async processGoal(goalDescription, options = {}) {
    console.log('\n' + '='.repeat(60));
    console.log('🤖 OpenClaw 自主目标系统');
    console.log('='.repeat(60));
    
    // 1. 创建目标
    const goal = new Goal({
      description: goalDescription,
      type: options.type || 'generic',
      level: options.level || 2,
      source: options.source || 'explicit',
      weight: options.weight || 1.0,
      ...options
    });
    
    // 2. 分解目标
    const goalTree = await this.decomposer.decompose(goal, {}, {});
    
    // 3. 检测冲突
    const conflicts = await this.conflictDetector.detectConflicts(goalTree.children);
    
    if (conflicts.length > 0) {
      console.log(`\n⚠️  检测到 ${conflicts.length} 个冲突:`);
      for (const conflict of conflicts) {
        console.log(`   - ${conflict.type} 冲突: ${conflict.goals.map(g => g.description).join(' vs ')}`);
        const resolution = await this.conflictDetector.resolveConflict(conflict);
        console.log(`     解决方案: ${resolution.strategy}`);
      }
    }
    
    // 4. 规划执行
    const schedule = await this.balancer.plan(
      this.longTermGoals,
      goalTree.children,
      60 // 60分钟
    );
    
    // 5. 输出执行计划
    console.log('\n📋 执行计划:');
    console.log('─'.repeat(60));
    
    if (schedule.longTermSlots.length > 0) {
      console.log('\n🎯 长期目标进展:');
      schedule.longTermSlots.forEach((slot, i) => {
        console.log(`   ${i + 1}. ${slot.reason} (${slot.estimatedTime}分钟)`);
      });
    }
    
    if (schedule.shortTermSlots.length > 0) {
      console.log('\n✅ 短期任务:');
      schedule.shortTermSlots.forEach((slot, i) => {
        console.log(`   ${i + 1}. ${slot.task.description} (优先级: ${slot.priority.toFixed(2)})`);
      });
    }
    
    console.log('\n' + '='.repeat(60));
    
    return {
      goalTree,
      conflicts,
      schedule
    };
  }
  
  /**
   * 添加长期目标
   */
  addLongTermGoal(goal) {
    this.longTermGoals.push(goal);
    console.log(`📌 添加长期目标: ${goal.description}`);
  }
}

// ============================================
// 6. 导出和示例
// ============================================

module.exports = {
  Goal,
  GoalDecomposer,
  GoalConflictDetector,
  GoalBalancer,
  AutonomousGoalSystem
};

// 如果直接运行，执行示例
if (require.main === module) {
  (async () => {
    const system = new AutonomousGoalSystem();
    
    // 示例 1: 信息收集目标
    await system.processGoal('了解 RAG 最新进展', {
      type: 'information_gathering',
      level: 2
    });
    
    // 示例 2: 添加长期目标
    const longTermGoal = new Goal({
      description: '建立完整的用户兴趣图谱',
      type: 'task_execution',
      level: 3,
      priority: 0.8,
      progress: 0.3
    });
    system.addLongTermGoal(longTermGoal);
    
    // 示例 3: 学习目标
    await system.processGoal('学习 Prompt Engineering 技巧', {
      type: 'learning',
      level: 2,
      source: 'interest',
      weight: 0.7
    });
    
    // 示例 4: 探索目标（好奇心驱动）
    await system.processGoal('探索 No-Code 工具生态', {
      type: 'exploration',
      level: 2,
      source: 'curiosity',
      weight: 0.5
    });
  })();
}
