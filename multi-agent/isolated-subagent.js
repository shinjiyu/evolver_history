/**
 * Subagent with Isolated Context
 * 
 * 利用 OpenClaw Session 机制实现上下文隔离
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class IsolatedSubagent {
  constructor(config) {
    this.id = config.id || `subagent_${crypto.randomBytes(4).toString('hex')}`;
    this.role = config.role;
    this.basePath = config.basePath || '/root/.openclaw/workspace/subagents';
    this.sessionPath = path.join(this.basePath, this.id);
    
    // 创建独立上下文目录
    this.initContext();
  }

  initContext() {
    // 创建隔离的上下文文件
    if (!fs.existsSync(this.sessionPath)) {
      fs.mkdirSync(this.sessionPath, { recursive: true });
    }

    // 初始化上下文
    this.context = {
      id: this.id,
      role: this.role,
      conversationHistory: [],  // 独立对话历史
      allowedSkills: [],        // 可调用的 Skills
      taskContext: null,        // 当前任务上下文
      createdAt: new Date().toISOString()
    };

    this.saveContext();
  }

  /**
   * 设置可用的 Skills
   */
  setAllowedSkills(skills) {
    this.context.allowedSkills = skills;
    this.saveContext();
  }

  /**
   * 接收任务（只有任务信息，没有主上下文）
   */
  receiveTask(task) {
    this.context.taskContext = {
      description: task.description,
      inputs: task.inputs,
      constraints: task.constraints,
      // 注意：不包含主对话历史
    };
    this.context.conversationHistory = [];  // 清空历史
    this.saveContext();
  }

  /**
   * 调用 Skill（在隔离上下文中）
   */
  async callSkill(skillName, input) {
    // 检查是否允许调用
    if (!this.context.allowedSkills.includes(skillName)) {
      throw new Error(`Skill ${skillName} not allowed for this subagent`);
    }

    // 记录调用
    this.context.conversationHistory.push({
      role: 'user',
      content: `[Skill Call] ${skillName}: ${JSON.stringify(input)}`,
      timestamp: new Date().toISOString()
    });

    // 实际调用逻辑（需要通过 OpenClaw API）
    // 这里是模拟
    const result = await this.executeSkillInternal(skillName, input);

    // 记录结果
    this.context.conversationHistory.push({
      role: 'assistant',
      content: JSON.stringify(result),
      timestamp: new Date().toISOString()
    });

    this.saveContext();
    return result;
  }

  /**
   * 内部 Skill 执行（需要集成 OpenClaw）
   */
  async executeSkillInternal(skillName, input) {
    // TODO: 集成 OpenClaw Skill 执行
    // 可能的方式：
    // 1. 通过 HTTP API 调用
    // 2. 通过文件触发
    // 3. 通过子进程
    
    return { success: true, output: 'simulated' };
  }

  /**
   * 返回结果（只返回结果，不返回上下文）
   */
  getResult() {
    return {
      subagentId: this.id,
      role: this.role,
      result: this.context.taskContext?.result,
      // 不返回 conversationHistory
    };
  }

  /**
   * 保存上下文到文件
   */
  saveContext() {
    const contextFile = path.join(this.sessionPath, 'context.json');
    fs.writeFileSync(contextFile, JSON.stringify(this.context, null, 2));
  }

  /**
   * 加载上下文
   */
  loadContext() {
    const contextFile = path.join(this.sessionPath, 'context.json');
    if (fs.existsSync(contextFile)) {
      this.context = JSON.parse(fs.readFileSync(contextFile, 'utf8'));
    }
  }

  /**
   * 销毁上下文（清理）
   */
  destroy() {
    if (fs.existsSync(this.sessionPath)) {
      fs.rmSync(this.sessionPath, { recursive: true });
    }
  }
}

/**
 * Orchestrator - 管理多个 Subagent
 */
class SubagentOrchestrator {
  constructor() {
    this.subagents = new Map();
    this.sharedState = {
      tasks: {},
      results: {}
    };
  }

  /**
   * 创建 Subagent
   */
  createSubagent(role, allowedSkills) {
    const subagent = new IsolatedSubagent({
      role: role,
      basePath: '/root/.openclaw/workspace/subagents'
    });
    
    subagent.setAllowedSkills(allowedSkills);
    this.subagents.set(subagent.id, subagent);
    
    return subagent;
  }

  /**
   * 分配任务给 Subagent
   */
  async assignTask(subagentId, task) {
    const subagent = this.subagents.get(subagentId);
    if (!subagent) {
      throw new Error(`Subagent ${subagentId} not found`);
    }

    // 只传递任务信息，不传递主上下文
    subagent.receiveTask(task);
    
    // 记录任务
    this.sharedState.tasks[subagentId] = {
      task: task.description,
      status: 'assigned',
      assignedAt: new Date().toISOString()
    };

    return subagent;
  }

  /**
   * 收集结果
   */
  collectResults() {
    const results = {};
    
    for (const [id, subagent] of this.subagents) {
      results[id] = subagent.getResult();
    }
    
    return results;
  }

  /**
   * 跨 Subagent 传递信息（显式）
   */
  passResult(fromId, toId, data) {
    const toSubagent = this.subagents.get(toId);
    if (!toSubagent) return;

    // 只传递数据，不传递上下文
    toSubagent.context.taskContext = {
      ...toSubagent.context.taskContext,
      receivedFrom: fromId,
      receivedData: data
    };
    toSubagent.saveContext();
  }

  /**
   * 清理所有 Subagent
   */
  cleanup() {
    for (const [id, subagent] of this.subagents) {
      subagent.destroy();
    }
    this.subagents.clear();
  }
}

module.exports = { IsolatedSubagent, SubagentOrchestrator };
