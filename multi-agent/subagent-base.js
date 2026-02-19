/**
 * Base Subagent Class
 * 
 * 所有子代理的基类
 */

class Subagent {
  constructor(config = {}) {
    this.id = config.id || `agent_${Date.now()}`;
    this.type = config.type || 'generic';
    this.capabilities = config.capabilities || [];
    this.status = 'idle';
  }

  /**
   * 执行任务
   */
  async execute(task, context) {
    this.status = 'busy';
    console.log(`[${this.id}] Starting task: ${task.id}`);
    
    try {
      const result = await this.performTask(task, context);
      this.status = 'idle';
      return { success: true, task_id: task.id, result };
    } catch (error) {
      this.status = 'error';
      return { success: false, task_id: task.id, error: error.message };
    }
  }

  /**
   * 子类实现具体任务逻辑
   */
  async performTask(task, context) {
    throw new Error('Subagent.performTask must be implemented by subclass');
  }

  /**
   * 向共享状态写入消息
   */
  report(message, sharedStatePath) {
    const fs = require('fs');
    try {
      const state = JSON.parse(fs.readFileSync(sharedStatePath, 'utf8'));
      state.messages.push({
        from: this.id,
        timestamp: new Date().toISOString(),
        message
      });
      fs.writeFileSync(sharedStatePath, JSON.stringify(state, null, 2));
    } catch (e) {
      console.error(`[${this.id}] Failed to report: ${e.message}`);
    }
  }
}

module.exports = Subagent;
