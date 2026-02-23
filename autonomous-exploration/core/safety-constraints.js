/**
 * 安全约束 - 探索系统的安全守卫
 * 
 * 确保所有探索行动都在安全范围内执行
 */

class SafetyConstraints {
  constructor() {
    // 禁止的行动类型
    this.forbiddenActions = [
      'delete_user_data',
      'send_email_without_confirmation',
      'modify_system_files',
      'expose_private_keys',
      'execute_shell_command',
      'access_sensitive_files',
      'public_post_without_approval',
      'financial_transaction',
      'modify_cron_jobs',
      'install_packages'
    ];
    
    // 敏感文件模式
    this.sensitivePatterns = [
      /\.env$/,
      /\.pem$/,
      /\.key$/,
      /credentials/i,
      /password/i,
      /secret/i,
      /token/i,
      /api[_-]?key/i
    ];
    
    // 资源限制
    this.maxResourceUsage = {
      cpu: 0.8,        // 80% CPU
      memory: 0.8,     // 80% 内存
      network: 100,    // 100 MB 网络流量
      executionTime: 300 // 5 分钟最大执行时间
    };
    
    // 静默时段（不打扰用户）
    this.quietHours = {
      start: 23,  // 23:00
      end: 7      // 07:00
    };
    
    // 每日探索次数限制
    this.dailyLimits = {
      maxExplorations: 50,
      maxHighRiskExplorations: 5
    };
    
    // 今日已执行次数
    this.todayCount = {
      explorations: 0,
      highRiskExplorations: 0,
      date: new Date().toDateString()
    };
  }

  /**
   * 检查行动是否安全
   */
  isActionSafe(action) {
    // 1. 检查禁止列表
    if (this.forbiddenActions.includes(action.type)) {
      return {
        safe: false,
        reason: `禁止的行动类型: ${action.type}`,
        severity: 'critical'
      };
    }
    
    // 2. 检查敏感目标
    if (action.target && this.isSensitiveTarget(action.target)) {
      return {
        safe: false,
        reason: `目标包含敏感信息: ${action.target}`,
        severity: 'critical'
      };
    }
    
    // 3. 检查资源限制
    if (action.estimatedResources) {
      const resourceCheck = this.checkResourceLimits(action.estimatedResources);
      if (!resourceCheck.ok) {
        return {
          safe: false,
          reason: resourceCheck.reason,
          severity: 'warning'
        };
      }
    }
    
    // 4. 检查时间窗口
    if (this.isQuietHours() && !action.quietHoursAllowed) {
      return {
        safe: false,
        reason: '静默时段 - 避免干扰性操作',
        severity: 'info'
      };
    }
    
    // 5. 检查每日限制
    const limitCheck = this.checkDailyLimits(action);
    if (!limitCheck.ok) {
      return {
        safe: false,
        reason: limitCheck.reason,
        severity: 'warning'
      };
    }
    
    // 6. 检查执行时间
    if (action.estimatedTime && action.estimatedTime > this.maxResourceUsage.executionTime) {
      return {
        safe: false,
        reason: `执行时间超限: ${action.estimatedTime}分钟 > ${this.maxResourceUsage.executionTime}分钟`,
        severity: 'warning'
      };
    }
    
    return {
      safe: true,
      severity: 'none'
    };
  }

  /**
   * 检查目标是否敏感
   */
  isSensitiveTarget(target) {
    for (const pattern of this.sensitivePatterns) {
      if (pattern.test(target)) {
        return true;
      }
    }
    return false;
  }

  /**
   * 检查资源限制
   */
  checkResourceLimits(resources) {
    if (resources.cpu && resources.cpu > this.maxResourceUsage.cpu) {
      return {
        ok: false,
        reason: `CPU 使用率超限: ${resources.cpu * 100}% > ${this.maxResourceUsage.cpu * 100}%`
      };
    }
    
    if (resources.memory && resources.memory > this.maxResourceUsage.memory) {
      return {
        ok: false,
        reason: `内存使用率超限: ${resources.memory * 100}% > ${this.maxResourceUsage.memory * 100}%`
      };
    }
    
    if (resources.network && resources.network > this.maxResourceUsage.network) {
      return {
        ok: false,
        reason: `网络流量超限: ${resources.network}MB > ${this.maxResourceUsage.network}MB`
      };
    }
    
    return { ok: true };
  }

  /**
   * 检查是否在静默时段
   */
  isQuietHours() {
    const hour = new Date().getHours();
    return hour >= this.quietHours.start || hour < this.quietHours.end;
  }

  /**
   * 检查每日限制
   */
  checkDailyLimits(action) {
    // 重置每日计数
    const today = new Date().toDateString();
    if (this.todayCount.date !== today) {
      this.todayCount = {
        explorations: 0,
        highRiskExplorations: 0,
        date: today
      };
    }
    
    // 检查总次数
    if (this.todayCount.explorations >= this.dailyLimits.maxExplorations) {
      return {
        ok: false,
        reason: `今日探索次数已达上限: ${this.dailyLimits.maxExplorations}`
      };
    }
    
    // 检查高风险操作
    if (this.isHighRisk(action)) {
      if (this.todayCount.highRiskExplorations >= this.dailyLimits.maxHighRiskExplorations) {
        return {
          ok: false,
          reason: `今日高风险操作次数已达上限: ${this.dailyLimits.maxHighRiskExplorations}`
        };
      }
    }
    
    return { ok: true };
  }

  /**
   * 判断是否高风险操作
   */
  isHighRisk(action) {
    const highRiskTypes = ['execute', 'modify', 'delete', 'install', 'optimize'];
    return highRiskTypes.includes(action.type);
  }

  /**
   * 记录行动执行
   */
  recordExecution(action) {
    // 重置每日计数（如果需要）
    const today = new Date().toDateString();
    if (this.todayCount.date !== today) {
      this.todayCount = {
        explorations: 0,
        highRiskExplorations: 0,
        date: today
      };
    }
    
    this.todayCount.explorations++;
    
    if (this.isHighRisk(action)) {
      this.todayCount.highRiskExplorations++;
    }
    
    return this.todayCount;
  }

  /**
   * 获取今日统计
   */
  getTodayStatistics() {
    const today = new Date().toDateString();
    if (this.todayCount.date !== today) {
      return {
        explorations: 0,
        highRiskExplorations: 0,
        date: today
      };
    }
    return this.todayCount;
  }

  /**
   * 获取安全策略摘要
   */
  getPolicySummary() {
    return {
      forbiddenActionsCount: this.forbiddenActions.length,
      sensitivePatternsCount: this.sensitivePatterns.length,
      maxResourceUsage: this.maxResourceUsage,
      quietHours: this.quietHours,
      dailyLimits: this.dailyLimits
    };
  }

  /**
   * 添加自定义禁止行动
   */
  addForbiddenAction(actionType) {
    if (!this.forbiddenActions.includes(actionType)) {
      this.forbiddenActions.push(actionType);
    }
  }

  /**
   * 移除禁止行动
   */
  removeForbiddenAction(actionType) {
    const index = this.forbiddenActions.indexOf(actionType);
    if (index > -1) {
      this.forbiddenActions.splice(index, 1);
    }
  }
}

module.exports = SafetyConstraints;
