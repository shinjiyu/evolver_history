/**
 * 行动规划器 - 基于 OODA 循环的"决策"阶段
 * 
 * 负责将目标转化为具体可执行的行动计划
 */

class ActionPlanner {
  constructor() {
    this.actionTypes = {
      research: { cost: 2, risk: 'low' },
      search: { cost: 1, risk: 'low' },
      read: { cost: 1, risk: 'low' },
      explore: { cost: 1, risk: 'low' },
      practice: { cost: 3, risk: 'medium' },
      test_features: { cost: 2, risk: 'medium' },
      experiment: { cost: 2, risk: 'medium' },
      analyze: { cost: 2, risk: 'low' },
      optimize: { cost: 3, risk: 'medium' },
      execute: { cost: 4, risk: 'high' },
      document: { cost: 1, risk: 'low' },
      summarize: { cost: 1, risk: 'low' },
      scan: { cost: 1, risk: 'low' },
      record: { cost: 1, risk: 'low' },
      evaluate: { cost: 2, risk: 'low' },
      measure: { cost: 1, risk: 'low' }
    };
  }

  /**
   * 规划行动
   */
  plan(goal) {
    const baseActions = goal.actions || [];
    const enhancedActions = [];
    
    for (const action of baseActions) {
      // 1. 添加前置条件
      const preconditions = this.addPreconditions(action);
      enhancedActions.push(...preconditions);
      
      // 2. 添加主行动
      enhancedActions.push({
        ...action,
        estimatedTime: this.estimateTime(action),
        requiredResources: this.estimateResources(action),
        rollbackPlan: this.createRollbackPlan(action)
      });
      
      // 3. 添加后置验证
      const postValidation = this.addPostValidation(action);
      enhancedActions.push(...postValidation);
    }
    
    // 4. 优化执行顺序
    const optimized = this.optimizeOrder(enhancedActions);
    
    return optimized;
  }

  /**
   * 添加前置条件
   */
  addPreconditions(action) {
    const preconditions = [];
    
    switch (action.type) {
      case 'search':
        preconditions.push({
          type: 'check_network',
          description: '确保网络连接正常'
        });
        break;
        
      case 'read':
        preconditions.push({
          type: 'check_source',
          target: action.sources,
          description: '验证信息源可访问性'
        });
        break;
        
      case 'practice':
      case 'test_features':
        preconditions.push({
          type: 'backup_state',
          description: '备份当前状态以便回滚'
        });
        break;
        
      case 'optimize':
        preconditions.push({
          type: 'measure_baseline',
          description: '记录优化前基准'
        });
        break;
    }
    
    return preconditions;
  }

  /**
   * 添加后置验证
   */
  addPostValidation(action) {
    const validations = [];
    
    switch (action.type) {
      case 'practice':
      case 'test_features':
        validations.push({
          type: 'verify_result',
          description: '验证操作结果'
        });
        break;
        
      case 'optimize':
        validations.push({
          type: 'compare_metrics',
          description: '对比优化前后指标'
        });
        break;
        
      case 'research':
      case 'search':
        validations.push({
          type: 'quality_check',
          description: '检查信息质量'
        });
        break;
    }
    
    return validations;
  }

  /**
   * 估算时间（分钟）
   */
  estimateTime(action) {
    const timeMap = {
      research: 10,
      search: 3,
      read: 5,
      explore: 5,
      practice: 15,
      test_features: 10,
      experiment: 10,
      analyze: 8,
      optimize: 12,
      execute: 5,
      document: 5,
      summarize: 5,
      scan: 3,
      record: 2,
      evaluate: 5,
      measure: 3,
      check_network: 0.5,
      check_source: 1,
      backup_state: 2,
      measure_baseline: 2,
      verify_result: 2,
      compare_metrics: 3,
      quality_check: 2
    };
    
    return timeMap[action.type] || 5;
  }

  /**
   * 估算资源
   */
  estimateResources(action) {
    const type = this.actionTypes[action.type] || { cost: 2, risk: 'low' };
    return {
      cpu: type.cost * 0.1,
      memory: type.cost * 50,  // MB
      network: type.cost * 10, // MB
      risk: type.risk
    };
  }

  /**
   * 创建回滚计划
   */
  createRollbackPlan(action) {
    if (action.type === 'practice' || action.type === 'test_features') {
      return {
        type: 'restore_backup',
        trigger: 'failure_or_unexpected_result'
      };
    }
    
    if (action.type === 'optimize') {
      return {
        type: 'revert_changes',
        trigger: 'performance_degradation'
      };
    }
    
    return null;
  }

  /**
   * 优化执行顺序
   */
  optimizeOrder(actions) {
    // 简单的拓扑排序：前置条件 → 主行动 → 后置验证
    const grouped = {
      preconditions: [],
      main: [],
      validations: []
    };
    
    const preconditionTypes = ['check_network', 'check_source', 'backup_state', 'measure_baseline'];
    const validationTypes = ['verify_result', 'compare_metrics', 'quality_check'];
    
    for (const action of actions) {
      if (preconditionTypes.includes(action.type)) {
        grouped.preconditions.push(action);
      } else if (validationTypes.includes(action.type)) {
        grouped.validations.push(action);
      } else {
        grouped.main.push(action);
      }
    }
    
    return [
      ...grouped.preconditions,
      ...grouped.main,
      ...grouped.validations
    ];
  }

  /**
   * 生成执行计划摘要
   */
  summarizePlan(plan) {
    const totalSteps = plan.length;
    const totalTime = plan.reduce((sum, a) => sum + (a.estimatedTime || 0), 0);
    const riskLevel = this.assessOverallRisk(plan);
    
    return {
      totalSteps,
      totalTimeMinutes: Math.round(totalTime),
      riskLevel,
      actionTypes: [...new Set(plan.map(a => a.type))]
    };
  }

  /**
   * 评估整体风险
   */
  assessOverallRisk(plan) {
    const risks = plan
      .map(a => (a.requiredResources || {}).risk)
      .filter(r => r);
    
    if (risks.includes('high')) return 'high';
    if (risks.includes('medium')) return 'medium';
    return 'low';
  }
}

module.exports = ActionPlanner;
