/**
 * Multi-Subagent Orchestration System
 * 
 * 主控 Agent - 负责任务分解、分配和协调
 */

const fs = require('fs');
const path = require('path');

class Orchestrator {
  constructor(config = {}) {
    this.sessionId = `session_${Date.now()}`;
    this.sharedStatePath = config.sharedStatePath || '/root/.openclaw/workspace/multi-agent/shared-state.json';
    this.agents = new Map();
    this.taskQueue = [];
    this.completedTasks = [];
    
    this.initSharedState();
  }

  initSharedState() {
    const state = {
      session_id: this.sessionId,
      created_at: new Date().toISOString(),
      status: 'initialized',
      tasks: {},
      artifacts: [],
      context: {
        user_goal: null,
        constraints: []
      },
      messages: []
    };
    this.saveState(state);
  }

  saveState(state) {
    fs.writeFileSync(this.sharedStatePath, JSON.stringify(state, null, 2));
  }

  loadState() {
    try {
      return JSON.parse(fs.readFileSync(this.sharedStatePath, 'utf8'));
    } catch {
      return {};
    }
  }

  /**
   * 注册 subagent
   */
  registerAgent(agent) {
    this.agents.set(agent.id, agent);
    console.log(`[Orchestrator] Agent registered: ${agent.id} (${agent.type})`);
  }

  /**
   * 接收用户任务
   */
  receiveTask(userGoal, context = {}) {
    console.log(`[Orchestrator] Received task: ${userGoal}`);
    
    const state = this.loadState();
    state.context.user_goal = userGoal;
    state.context.constraints = context.constraints || [];
    state.status = 'processing';
    this.saveState(state);

    // 分解任务
    const subtasks = this.decomposeTask(userGoal, context);
    
    // 分配任务
    subtasks.forEach(task => this.assignTask(task));
    
    return subtasks;
  }

  /**
   * 任务分解
   */
  decomposeTask(userGoal, context) {
    const subtasks = [];
    
    // 根据任务类型分解
    if (userGoal.includes('研究') || userGoal.includes('分析') || userGoal.includes('调研')) {
      subtasks.push({
        id: `task_${Date.now()}_1`,
        type: 'research',
        description: '收集和分析相关信息',
        priority: 'high'
      });
    }
    
    if (userGoal.includes('实现') || userGoal.includes('开发') || userGoal.includes('创建')) {
      subtasks.push({
        id: `task_${Date.now()}_2`,
        type: 'execution',
        description: '执行具体实现任务',
        priority: 'high'
      });
    }
    
    if (userGoal.includes('验证') || userGoal.includes('测试') || userGoal.includes('检查')) {
      subtasks.push({
        id: `task_${Date.now()}_3`,
        type: 'verification',
        description: '验证结果正确性',
        priority: 'medium'
      });
    }

    // 默认：完整的 研究 -> 执行 -> 验证 流程
    if (subtasks.length === 0) {
      subtasks.push(
        { id: `task_${Date.now()}_1`, type: 'research', description: '分析需求', priority: 'high' },
        { id: `task_${Date.now()}_2`, type: 'execution', description: '执行任务', priority: 'high', depends_on: `task_${Date.now()}_1` },
        { id: `task_${Date.now()}_3`, type: 'verification', description: '验证结果', priority: 'medium', depends_on: `task_${Date.now()}_2` }
      );
    }

    return subtasks;
  }

  /**
   * 分配任务给合适的 agent
   */
  assignTask(task) {
    const state = this.loadState();
    state.tasks[task.id] = {
      ...task,
      status: 'assigned',
      assigned_at: new Date().toISOString()
    };
    this.saveState(state);

    // 找到合适的 agent
    const agent = this.findSuitableAgent(task.type);
    if (agent) {
      console.log(`[Orchestrator] Assigned ${task.id} to ${agent.id}`);
      return agent.execute(task, state);
    } else {
      console.log(`[Orchestrator] No suitable agent for ${task.type}, will handle directly`);
      return this.executeDirectly(task, state);
    }
  }

  findSuitableAgent(type) {
    for (const [id, agent] of this.agents) {
      if (agent.capabilities.includes(type)) {
        return agent;
      }
    }
    return null;
  }

  executeDirectly(task, state) {
    // 直接执行（回退方案）
    console.log(`[Orchestrator] Executing task directly: ${task.id}`);
    
    state.tasks[task.id].status = 'completed';
    state.tasks[task.id].completed_at = new Date().toISOString();
    this.saveState(state);
    
    return { success: true, task_id: task.id };
  }

  /**
   * 获取整体进度
   */
  getProgress() {
    const state = this.loadState();
    const tasks = Object.values(state.tasks);
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    
    return {
      session_id: this.sessionId,
      status: state.status,
      total_tasks: total,
      completed_tasks: completed,
      progress: total > 0 ? (completed / total * 100).toFixed(1) + '%' : '0%'
    };
  }

  /**
   * 汇报最终结果
   */
  reportFinalResult() {
    const state = this.loadState();
    const tasks = Object.values(state.tasks);
    
    const summary = {
      session_id: this.sessionId,
      user_goal: state.context.user_goal,
      total_tasks: tasks.length,
      completed: tasks.filter(t => t.status === 'completed').length,
      failed: tasks.filter(t => t.status === 'failed').length,
      artifacts: state.artifacts,
      duration: this.calculateDuration(state.created_at)
    };

    console.log('\n========== 任务完成报告 ==========');
    console.log(JSON.stringify(summary, null, 2));
    console.log('==================================\n');

    return summary;
  }

  calculateDuration(startTime) {
    const start = new Date(startTime);
    const now = new Date();
    const diff = now - start;
    return `${Math.floor(diff / 1000)} seconds`;
  }
}

module.exports = Orchestrator;
