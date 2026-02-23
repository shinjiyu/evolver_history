/**
 * OpenClaw 自主探索 - 好奇心驱动探索系统
 * 
 * 实现了好奇心量化、探索-利用平衡、探索调度
 * 
 * 日期：2026-02-23
 */

// ============================================
// 1. 好奇心引擎
// ============================================

class CuriosityEngine {
  constructor(userModel = {}) {
    this.userModel = userModel;
    this.predictors = new Map();      // 领域预测器
    this.learningHistory = [];        // 学习历史
    this.explorationHistory = [];     // 探索历史
  }
  
  /**
   * 计算对某个探索目标的好奇心分数
   * 
   * @param {Object} target - 探索目标 { domain, description, type }
   * @returns {Object} 好奇心评估结果
   */
  calculateCuriosity(target) {
    console.log(`\n🧠 计算好奇心: "${target.description || target.domain}"`);
    
    // 1. 预测误差（0-1）
    const predictionError = this.calculatePredictionError(target);
    
    // 2. 信息增益（0-1）
    const informationGain = this.estimateInformationGain(target);
    
    // 3. 学习进度（0-1）
    const learningProgress = this.getRecentLearningProgress(target.domain);
    
    // 4. 新颖度（0-1）
    const novelty = this.calculateNovelty(target);
    
    // 5. 用户相关性（0-1）
    const relevance = this.getUserRelevance(target);
    
    // 权重配置
    const weights = {
      predictionError: 0.2,
      informationGain: 0.25,
      learningProgress: 0.25,
      novelty: 0.15,
      relevance: 0.15
    };
    
    // 综合评分
    const curiosity = 
      predictionError * weights.predictionError +
      informationGain * weights.informationGain +
      learningProgress * weights.learningProgress +
      novelty * weights.novelty +
      relevance * weights.relevance;
    
    const result = {
      score: curiosity,
      shouldExplore: curiosity > 0.5,
      breakdown: {
        predictionError,
        informationGain,
        learningProgress,
        novelty,
        relevance
      },
      dominantFactor: this.getDominantFactor({
        predictionError,
        informationGain,
        learningProgress,
        novelty,
        relevance
      })
    };
    
    console.log(`   好奇心分数: ${curiosity.toFixed(3)} ${result.shouldExplore ? '✅' : '❌'}`);
    console.log(`   主导因素: ${result.dominantFactor}`);
    
    return result;
  }
  
  /**
   * 计算预测误差
   */
  calculatePredictionError(target) {
    const prediction = this.predict(target.domain);
    
    // 不确定性越高，预测误差可能越大
    const error = prediction.uncertainty;
    
    // 如果很久没更新，预测误差增加
    const ageInDays = prediction.lastUpdated 
      ? (Date.now() - prediction.lastUpdated) / (24 * 60 * 60 * 1000)
      : 30;
    
    const ageBonus = Math.min(ageInDays / 30, 0.3);  // 最多增加 0.3
    
    return Math.min(error + ageBonus, 1.0);
  }
  
  /**
   * 预测某个领域的状态
   */
  predict(domain) {
    if (!this.predictors.has(domain)) {
      // 新领域，高不确定性
      return {
        confidence: 0.5,
        uncertainty: 1.0,
        lastUpdated: null,
        sampleSize: 0
      };
    }
    
    const predictor = this.predictors.get(domain);
    return {
      confidence: predictor.confidence,
      uncertainty: predictor.uncertainty,
      lastUpdated: predictor.lastUpdated,
      sampleSize: predictor.history.length
    };
  }
  
  /**
   * 估算信息增益
   */
  estimateInformationGain(target) {
    const knowledgeLevel = this.getKnowledgeLevel(target.domain);
    
    // 信息增益与知识水平负相关
    // 完全不了解 → 高信息增益
    // 已经很了解 → 低信息增益
    
    if (knowledgeLevel < 0.2) return 1.0;
    if (knowledgeLevel < 0.5) return 0.7;
    if (knowledgeLevel < 0.8) return 0.4;
    return 0.2;
  }
  
  /**
   * 获取知识水平
   */
  getKnowledgeLevel(domain) {
    // 简化实现：基于探索次数
    const explorations = this.explorationHistory.filter(e => e.domain === domain);
    
    if (explorations.length === 0) return 0;
    if (explorations.length < 3) return 0.2;
    if (explorations.length < 10) return 0.5;
    if (explorations.length < 30) return 0.8;
    return 0.95;
  }
  
  /**
   * 获取最近的学习进度
   */
  getRecentLearningProgress(domain) {
    const recent = this.learningHistory
      .filter(h => h.domain === domain)
      .filter(h => Date.now() - h.timestamp < 7 * 24 * 60 * 60 * 1000);
    
    if (recent.length < 3) return 0.5; // 数据不足，中等进度
    
    // 计算平均学习效率
    const avgEfficiency = recent.reduce((sum, h) => sum + h.efficiency, 0) / recent.length;
    return avgEfficiency;
  }
  
  /**
   * 计算新颖度
   */
  calculateNovelty(target) {
    const exploredDomains = [...new Set(this.explorationHistory.map(e => e.domain))];
    
    if (exploredDomains.length === 0) return 1.0; // 完全新颖
    
    // 计算与已探索领域的相似度
    const similarities = exploredDomains.map(domain => 
      this.calculateDomainSimilarity(target.domain, domain)
    );
    
    const maxSimilarity = Math.max(...similarities);
    
    // 相似度越低，新颖度越高
    return 1.0 - maxSimilarity;
  }
  
  /**
   * 计算领域相似度（简化）
   */
  calculateDomainSimilarity(domain1, domain2) {
    // 简化实现：基于关键词重叠
    const keywords1 = this.extractKeywords(domain1);
    const keywords2 = this.extractKeywords(domain2);
    
    const common = keywords1.filter(k => keywords2.includes(k)).length;
    const union = new Set([...keywords1, ...keywords2]).size;
    
    return union > 0 ? common / union : 0;
  }
  
  /**
   * 提取关键词
   */
  extractKeywords(text) {
    return (text || '')
      .toLowerCase()
      .replace(/[-_]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2);
  }
  
  /**
   * 获取用户相关性
   */
  getUserRelevance(target) {
    const interests = this.userModel.interests || [];
    const targetKeywords = this.extractKeywords(target.domain);
    
    if (interests.length === 0) return 0.5; // 无用户数据，中等
    
    // 计算与用户兴趣的匹配度
    const matchScores = interests.map(interest => {
      const interestKeywords = this.extractKeywords(interest);
      const common = targetKeywords.filter(k => interestKeywords.includes(k)).length;
      return common / Math.max(targetKeywords.length, 1);
    });
    
    return Math.max(...matchScores);
  }
  
  /**
   * 获取主导因素
   */
  getDominantFactor(factors) {
    let max = 0;
    let dominant = 'unknown';
    
    for (const [key, value] of Object.entries(factors)) {
      if (value > max) {
        max = value;
        dominant = key;
      }
    }
    
    const factorNames = {
      predictionError: '预测误差',
      informationGain: '信息增益',
      learningProgress: '学习进度',
      novelty: '新颖度',
      relevance: '用户相关性'
    };
    
    return factorNames[dominant] || dominant;
  }
  
  /**
   * 更新预测器（学习）
   */
  updatePredictor(domain, actualState) {
    if (!this.predictors.has(domain)) {
      this.predictors.set(domain, {
        confidence: 0.5,
        uncertainty: 1.0,
        history: []
      });
    }
    
    const predictor = this.predictors.get(domain);
    const prediction = this.predict(domain);
    
    // 计算预测误差
    const error = Math.abs(prediction.confidence - actualState);
    
    // 记录历史
    predictor.history.push({
      predicted: prediction.confidence,
      actual: actualState,
      error: error,
      timestamp: Date.now()
    });
    
    // 更新置信度和不确定性
    const recentErrors = predictor.history.slice(-10);
    const avgError = recentErrors.reduce((s, h) => s + h.error, 0) / recentErrors.length;
    
    predictor.confidence = 1.0 - avgError;
    predictor.uncertainty = avgError;
    predictor.lastUpdated = Date.now();
    
    // 记录学习进度
    this.learningHistory.push({
      domain: domain,
      efficiency: 1.0 - error,
      timestamp: Date.now()
    });
    
    console.log(`   📚 更新预测器 [${domain}]: 置信度 ${(predictor.confidence * 100).toFixed(1)}%`);
  }
  
  /**
   * 记录探索
   */
  recordExploration(exploration) {
    this.explorationHistory.push({
      ...exploration,
      timestamp: Date.now()
    });
  }
}

// ============================================
// 2. 探索调度器
// ============================================

class ExplorationScheduler {
  constructor(curiosityEngine) {
    this.curiosityEngine = curiosityEngine;
    this.cooldowns = new Map();  // 冷却管理
    this.strategySelector = new ExplorationStrategySelector();
  }
  
  /**
   * 选择下一个探索目标
   * 
   * @param {Object} context - 上下文 { userState, timeAvailable, budget }
   * @returns {Object} 探索计划
   */
  selectNextExploration(context = {}) {
    console.log('\n🎯 选择探索目标...');
    
    // 1. 选择探索策略
    const strategy = this.strategySelector.select(
      context,
      this.curiosityEngine.userModel,
      this.curiosityEngine
    );
    
    console.log(`   策略: ${strategy.name}`);
    
    // 2. 生成候选目标
    const candidates = strategy.generateCandidates();
    
    if (candidates.length === 0) {
      return {
        action: 'skip',
        reason: '无合适的探索目标'
      };
    }
    
    console.log(`   候选目标: ${candidates.length} 个`);
    
    // 3. 计算好奇心并排序
    const scored = candidates.map(candidate => {
      const curiosity = this.curiosityEngine.calculateCuriosity(candidate);
      return { ...candidate, curiosity };
    });
    
    scored.sort((a, b) => b.curiosity.score - a.curiosity.score);
    
    // 4. 过滤冷却中的目标
    const available = scored.filter(candidate => {
      const cooldownCheck = this.checkCooldown(candidate.domain);
      return cooldownCheck.allowed;
    });
    
    if (available.length === 0) {
      return {
        action: 'wait',
        reason: '所有目标都在冷却中',
        nextAvailableIn: this.getNextAvailableTime(scored)
      };
    }
    
    // 5. 选择最佳目标
    const selected = available[0];
    
    console.log(`\n✅ 选定目标: ${selected.description || selected.domain}`);
    console.log(`   好奇心分数: ${selected.curiosity.score.toFixed(3)}`);
    
    return {
      action: 'explore',
      target: selected,
      strategy: strategy.name,
      alternatives: available.slice(1, 4)
    };
  }
  
  /**
   * 检查冷却状态
   */
  checkCooldown(domain) {
    if (this.cooldowns.has(domain)) {
      const cooldownEnd = this.cooldowns.get(domain);
      if (Date.now() < cooldownEnd) {
        return {
          allowed: false,
          remainingTime: cooldownEnd - Date.now()
        };
      }
    }
    return { allowed: true };
  }
  
  /**
   * 启动冷却
   */
  startCooldown(domain, duration = 24 * 60 * 60 * 1000) {
    this.cooldowns.set(domain, Date.now() + duration);
    console.log(`   ❄️ 启动冷却 [${domain}]: ${(duration / 3600000).toFixed(1)} 小时`);
  }
  
  /**
   * 获取下一个可用时间
   */
  getNextAvailableTime(scored) {
    const now = Date.now();
    let minTime = Infinity;
    
    for (const candidate of scored) {
      if (this.cooldowns.has(candidate.domain)) {
        const end = this.cooldowns.get(candidate.domain);
        if (end > now && end < minTime) {
          minTime = end;
        }
      }
    }
    
    return minTime === Infinity ? null : minTime - now;
  }
}

// ============================================
// 3. 探索策略选择器
// ============================================

class ExplorationStrategySelector {
  /**
   * 选择探索策略
   */
  select(context, userModel, curiosityEngine) {
    const strategies = [
      {
        name: 'knowledge_gap_filling',
        condition: this.hasKnowledgeGaps(userModel),
        generateCandidates: () => this.generateKnowledgeGapCandidates(userModel)
      },
      {
        name: 'trend_tracking',
        condition: this.hasHighPredictionErrors(curiosityEngine),
        generateCandidates: () => this.generateTrendCandidates(userModel, curiosityEngine)
      },
      {
        name: 'cross_domain_discovery',
        condition: this.hasMatureInterests(userModel),
        generateCandidates: () => this.generateCrossDomainCandidates(userModel)
      },
      {
        name: 'random_curiosity',
        condition: context.budget > 0.2,
        generateCandidates: () => this.generateRandomCandidates()
      }
    ];
    
    // 选择第一个满足条件的策略
    for (const strategy of strategies) {
      if (strategy.condition) {
        return strategy;
      }
    }
    
    // 默认策略
    return {
      name: 'conservative',
      generateCandidates: () => []
    };
  }
  
  hasKnowledgeGaps(userModel) {
    const knowledge = userModel.knowledge || {};
    const gaps = Object.keys(knowledge).filter(k => knowledge[k] < 0.3);
    return gaps.length > 0;
  }
  
  hasHighPredictionErrors(curiosityEngine) {
    // 检查是否有预测误差高的领域
    for (const [domain, predictor] of curiosityEngine.predictors) {
      if (predictor.uncertainty > 0.5) {
        return true;
      }
    }
    return true; // 默认启用
  }
  
  hasMatureInterests(userModel) {
    const interests = userModel.interests || [];
    return interests.length >= 2;
  }
  
  generateKnowledgeGapCandidates(userModel) {
    const knowledge = userModel.knowledge || {};
    const gaps = Object.keys(knowledge)
      .filter(k => knowledge[k] < 0.3)
      .map(domain => ({
        domain,
        description: `填补知识空白: ${domain}`,
        type: 'knowledge_gap'
      }));
    
    return gaps.slice(0, 5);
  }
  
  generateTrendCandidates(userModel, curiosityEngine) {
    const interests = userModel.interests || [];
    return interests.map(interest => ({
      domain: interest,
      description: `追踪趋势: ${interest}`,
      type: 'trend_tracking'
    }));
  }
  
  generateCrossDomainCandidates(userModel) {
    const interests = userModel.interests || [];
    if (interests.length < 2) return [];
    
    // 生成所有兴趣对
    const pairs = [];
    for (let i = 0; i < interests.length; i++) {
      for (let j = i + 1; j < interests.length; j++) {
        pairs.push({
          domain: `${interests[i]} + ${interests[j]}`,
          description: `发现交叉点: ${interests[i]} & ${interests[j]}`,
          type: 'cross_domain'
        });
      }
    }
    
    return pairs.slice(0, 3);
  }
  
  generateRandomCandidates() {
    const domains = [
      'quantum_computing',
      'web3',
      'edge_ai',
      'federated_learning',
      'digital_twins',
      'low_code_platforms',
      'synthetic_data',
      'ai_ethics'
    ];
    
    return domains.slice(0, 3).map(domain => ({
      domain,
      description: `随机探索: ${domain}`,
      type: 'random_curiosity'
    }));
  }
}

// ============================================
// 4. 探索预算管理器
// ============================================

class ExplorationBudget {
  constructor() {
    this.baseBudget = {
      dailyExplorations: 5,
      maxConcurrentExplores: 2,
      resourceLimit: 0.3
    };
    
    this.currentUsage = {
      todayExplorations: 0,
      activeExplorations: 0
    };
    
    this.adjustments = {
      positiveFeedback: 1.2,
      negativeFeedback: 0.5,
      userBusy: 0.3,
      userIdle: 1.5
    };
    
    this.lastResetDate = new Date().toDateString();
  }
  
  /**
   * 获取调整后的预算
   */
  getAdjustedBudget(userState = 'normal', recentFeedback = []) {
    this.checkDailyReset();
    
    let budget = { ...this.baseBudget };
    
    // 根据用户状态调整
    if (userState === 'busy') {
      budget.dailyExplorations *= this.adjustments.userBusy;
    } else if (userState === 'idle') {
      budget.dailyExplorations *= this.adjustments.userIdle;
    }
    
    // 根据最近反馈调整
    if (recentFeedback.length > 0) {
      const recentPositive = recentFeedback.filter(f => f > 0).length;
      const recentNegative = recentFeedback.filter(f => f < 0).length;
      
      if (recentNegative > recentPositive) {
        budget.dailyExplorations *= this.adjustments.negativeFeedback;
      } else if (recentPositive > recentNegative) {
        budget.dailyExplorations *= this.adjustments.positiveFeedback;
      }
    }
    
    return {
      ...budget,
      remaining: Math.max(budget.dailyExplorations - this.currentUsage.todayExplorations, 0)
    };
  }
  
  /**
   * 消耗预算
   */
  consumeBudget(amount = 1) {
    this.checkDailyReset();
    
    if (this.currentUsage.todayExplorations >= this.baseBudget.dailyExplorations) {
      return {
        success: false,
        reason: '今日探索预算已用完'
      };
    }
    
    this.currentUsage.todayExplorations += amount;
    return { success: true };
  }
  
  /**
   * 检查是否需要重置
   */
  checkDailyReset() {
    const today = new Date().toDateString();
    if (this.lastResetDate !== today) {
      this.currentUsage.todayExplorations = 0;
      this.lastResetDate = today;
      console.log('   🔄 重置每日探索预算');
    }
  }
  
  /**
   * 获取状态报告
   */
  getStatusReport() {
    return {
      base: this.baseBudget.dailyExplorations,
      used: this.currentUsage.todayExplorations,
      remaining: this.baseBudget.dailyExplorations - this.currentUsage.todayExplorations
    };
  }
}

// ============================================
// 5. 主系统
// ============================================

class CuriosityExplorationSystem {
  constructor(userModel = {}) {
    this.curiosityEngine = new CuriosityEngine(userModel);
    this.scheduler = new ExplorationScheduler(this.curiosityEngine);
    this.budget = new ExplorationBudget();
    this.userModel = userModel;
    this.feedbackHistory = [];
  }
  
  /**
   * 运行探索循环
   */
  async runExplorationCycle(context = {}) {
    console.log('\n' + '='.repeat(60));
    console.log('🧭 好奇心驱动探索系统');
    console.log('='.repeat(60));
    
    // 1. 检查预算
    const budget = this.budget.getAdjustedBudget(
      context.userState || 'normal',
      this.feedbackHistory.slice(-5)
    );
    
    console.log(`\n💰 探索预算: ${budget.remaining}/${budget.dailyExplorations.toFixed(1)}`);
    
    if (budget.remaining <= 0) {
      return {
        action: 'skip',
        reason: '探索预算已用完'
      };
    }
    
    // 2. 选择探索目标
    const selection = this.scheduler.selectNextExploration({
      ...context,
      budget: budget.remaining / budget.dailyExplorations
    });
    
    if (selection.action !== 'explore') {
      return selection;
    }
    
    // 3. 消耗预算
    const budgetResult = this.budget.consumeBudget(1);
    if (!budgetResult.success) {
      return {
        action: 'skip',
        reason: budgetResult.reason
      };
    }
    
    // 4. 执行探索（模拟）
    const explorationResult = await this.executeExploration(selection.target);
    
    // 5. 记录结果
    this.curiosityEngine.recordExploration({
      domain: selection.target.domain,
      description: selection.target.description,
      result: explorationResult
    });
    
    // 6. 启动冷却
    this.scheduler.startCooldown(
      selection.target.domain,
      this.getCooldownDuration(selection.target.type)
    );
    
    // 7. 更新预测器
    if (explorationResult.success) {
      this.curiosityEngine.updatePredictor(
        selection.target.domain,
        explorationResult.knowledgeGain
      );
    }
    
    console.log('\n' + '='.repeat(60));
    
    return {
      action: 'explored',
      target: selection.target,
      result: explorationResult,
      budgetRemaining: budget.remaining - 1
    };
  }
  
  /**
   * 执行探索（模拟）
   */
  async executeExploration(target) {
    console.log(`\n🔍 执行探索: ${target.description || target.domain}`);
    
    // 模拟探索过程
    const success = Math.random() > 0.3;  // 70% 成功率
    const knowledgeGain = success ? 0.3 + Math.random() * 0.4 : 0;
    
    const result = {
      success,
      knowledgeGain,
      findings: success ? [
        `发现 1: 关于 ${target.domain} 的新知识`,
        `发现 2: ${target.domain} 领域的最新趋势`
      ] : [],
      timestamp: Date.now()
    };
    
    console.log(`   ${success ? '✅ 探索成功' : '❌ 探索失败'}`);
    if (success) {
      console.log(`   知识增益: +${(knowledgeGain * 100).toFixed(1)}%`);
    }
    
    return result;
  }
  
  /**
   * 获取冷却时长
   */
  getCooldownDuration(type) {
    const durations = {
      'knowledge_gap': 3 * 24 * 60 * 60 * 1000,     // 3天
      'trend_tracking': 1 * 24 * 60 * 60 * 1000,    // 1天
      'cross_domain': 7 * 24 * 60 * 60 * 1000,      // 7天
      'random_curiosity': 30 * 24 * 60 * 60 * 1000  // 30天
    };
    
    return durations[type] || 7 * 24 * 60 * 60 * 1000;
  }
  
  /**
   * 记录用户反馈
   */
  recordFeedback(feedback) {
    this.feedbackHistory.push({
      value: feedback,  // 1=正面, -1=负面, 0=中性
      timestamp: Date.now()
    });
    
    console.log(`\n📝 记录反馈: ${feedback > 0 ? '👍 正面' : feedback < 0 ? '👎 负面' : '😐 中性'}`);
  }
  
  /**
   * 获取系统状态
   */
  getSystemStatus() {
    return {
      budget: this.budget.getStatusReport(),
      totalExplorations: this.curiosityEngine.explorationHistory.length,
      predictorsCount: this.curiosityEngine.predictors.size,
      learningRecords: this.curiosityEngine.learningHistory.length
    };
  }
}

// ============================================
// 6. 导出和示例
// ============================================

module.exports = {
  CuriosityEngine,
  ExplorationScheduler,
  ExplorationStrategySelector,
  ExplorationBudget,
  CuriosityExplorationSystem
};

// 如果直接运行，执行示例
if (require.main === module) {
  (async () => {
    // 创建系统实例
    const userModel = {
      interests: ['machine_learning', 'web_development', 'devops'],
      knowledge: {
        'machine_learning': 0.7,
        'web_development': 0.5,
        'devops': 0.3,
        'quantum_computing': 0.1
      }
    };
    
    const system = new CuriosityExplorationSystem(userModel);
    
    // 示例 1: 正常探索
    console.log('\n【示例 1：正常探索】');
    await system.runExplorationCycle({ userState: 'normal' });
    
    // 示例 2: 用户忙碌
    console.log('\n\n【示例 2：用户忙碌】');
    await system.runExplorationCycle({ userState: 'busy' });
    
    // 示例 3: 用户空闲 + 正面反馈
    console.log('\n\n【示例 3：用户空闲 + 正面反馈】');
    system.recordFeedback(1);
    await system.runExplorationCycle({ userState: 'idle' });
    
    // 示例 4: 获取系统状态
    console.log('\n\n【系统状态】');
    const status = system.getSystemStatus();
    console.log('\n📊 系统状态:');
    console.log(`   探索预算: ${status.budget.used}/${status.budget.base} (剩余 ${status.budget.remaining})`);
    console.log(`   总探索次数: ${status.totalExplorations}`);
    console.log(`   预测器数量: ${status.predictorsCount}`);
    console.log(`   学习记录: ${status.learningRecords}`);
  })();
}
