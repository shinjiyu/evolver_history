/**
 * File-Based Subagent System
 * 
 * 基于文件的 Agent 调度与通信系统
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// 基础路径
const BASE_PATH = '/root/.openclaw/workspace/subagents';

class FileBasedSubagentSystem {
  constructor() {
    this.ensureStructure();
  }

  /**
   * 确保目录结构存在
   */
  ensureStructure() {
    const dirs = [
      BASE_PATH,
      path.join(BASE_PATH, 'registry'),
      path.join(BASE_PATH, 'tasks', 'pending'),
      path.join(BASE_PATH, 'tasks', 'processing'),
      path.join(BASE_PATH, 'tasks', 'completed'),
      path.join(BASE_PATH, 'agents'),
      path.join(BASE_PATH, 'shared')
    ];

    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }

    // 初始化注册表
    const registryPath = path.join(BASE_PATH, 'registry', 'agents.json');
    if (!fs.existsSync(registryPath)) {
      fs.writeFileSync(registryPath, JSON.stringify({ agents: {} }, null, 2));
    }
  }

  /**
   * 生成唯一 ID
   */
  generateId(prefix = 'id') {
    return `${prefix}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  }
}

/**
 * Scheduler - 任务调度器
 */
class Scheduler extends FileBasedSubagentSystem {
  /**
   * 创建任务
   */
  createTask(taskConfig) {
    const taskId = this.generateId('task');
    const task = {
      task_id: taskId,
      type: taskConfig.type,
      description: taskConfig.description,
      inputs: taskConfig.inputs || {},
      constraints: taskConfig.constraints || {},
      assigned_to: null,
      status: 'pending',
      created_at: new Date().toISOString(),
      depends_on: taskConfig.depends_on || []
    };

    const taskPath = path.join(BASE_PATH, 'tasks', 'pending', `${taskId}.json`);
    fs.writeFileSync(taskPath, JSON.stringify(task, null, 2));
    
    console.log(`[Scheduler] Created task: ${taskId}`);
    return task;
  }

  /**
   * 分配任务给 Agent
   */
  assignTask(taskId, agentId) {
    // 读取任务
    const pendingPath = path.join(BASE_PATH, 'tasks', 'pending', `${taskId}.json`);
    const processingPath = path.join(BASE_PATH, 'tasks', 'processing', `${taskId}.json`);
    
    if (!fs.existsSync(pendingPath)) {
      throw new Error(`Task ${taskId} not found in pending queue`);
    }

    const task = JSON.parse(fs.readFileSync(pendingPath, 'utf8'));
    
    // 更新任务状态
    task.assigned_to = agentId;
    task.status = 'assigned';
    task.assigned_at = new Date().toISOString();

    // 移动到 processing
    fs.writeFileSync(processingPath, JSON.stringify(task, null, 2));
    fs.unlinkSync(pendingPath);

    // 通知 Agent
    this.sendMessage(agentId, {
      message_id: this.generateId('msg'),
      type: 'task_assignment',
      from: 'scheduler',
      to: agentId,
      payload: task,
      created_at: new Date().toISOString()
    });

    // 更新 Agent 状态
    this.updateAgentStatus(agentId, 'busy', taskId);

    console.log(`[Scheduler] Assigned task ${taskId} to agent ${agentId}`);
    return task;
  }

  /**
   * 自动分配：找到合适的 Agent
   */
  autoAssign(taskId) {
    const task = this.getTask(taskId);
    if (!task) throw new Error(`Task ${taskId} not found`);

    // 查找空闲且匹配类型的 Agent
    const agents = this.listAgents();
    const suitableAgent = agents.find(a => 
      a.status === 'idle' && 
      a.type === task.type
    );

    if (!suitableAgent) {
      console.log(`[Scheduler] No suitable agent for task ${taskId}`);
      return null;
    }

    return this.assignTask(taskId, suitableAgent.id);
  }

  /**
   * 完成任务
   */
  completeTask(taskId, result) {
    const processingPath = path.join(BASE_PATH, 'tasks', 'processing', `${taskId}.json`);
    const completedPath = path.join(BASE_PATH, 'tasks', 'completed', `${taskId}.json`);

    if (!fs.existsSync(processingPath)) {
      throw new Error(`Task ${taskId} not found in processing queue`);
    }

    const task = JSON.parse(fs.readFileSync(processingPath, 'utf8'));
    task.status = 'completed';
    task.result = result;
    task.completed_at = new Date().toISOString();

    fs.writeFileSync(completedPath, JSON.stringify(task, null, 2));
    fs.unlinkSync(processingPath);

    // 更新 Agent 状态
    if (task.assigned_to) {
      this.updateAgentStatus(task.assigned_to, 'idle', null);
    }

    console.log(`[Scheduler] Completed task: ${taskId}`);
    return task;
  }

  /**
   * 获取任务
   */
  getTask(taskId) {
    const queues = ['pending', 'processing', 'completed'];
    for (const queue of queues) {
      const taskPath = path.join(BASE_PATH, 'tasks', queue, `${taskId}.json`);
      if (fs.existsSync(taskPath)) {
        return JSON.parse(fs.readFileSync(taskPath, 'utf8'));
      }
    }
    return null;
  }

  /**
   * 列出待处理任务
   */
  listPendingTasks() {
    const pendingPath = path.join(BASE_PATH, 'tasks', 'pending');
    const files = fs.readdirSync(pendingPath).filter(f => f.endsWith('.json'));
    return files.map(f => JSON.parse(fs.readFileSync(path.join(pendingPath, f), 'utf8')));
  }

  /**
   * 发送消息给 Agent
   */
  sendMessage(agentId, message) {
    const inboxPath = path.join(BASE_PATH, 'agents', agentId, 'inbox');
    if (!fs.existsSync(inboxPath)) {
      fs.mkdirSync(inboxPath, { recursive: true });
    }
    
    const msgPath = path.join(inboxPath, `${message.message_id}.json`);
    fs.writeFileSync(msgPath, JSON.stringify(message, null, 2));
  }

  /**
   * 更新 Agent 状态
   */
  updateAgentStatus(agentId, status, currentTask) {
    const registryPath = path.join(BASE_PATH, 'registry', 'agents.json');
    const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
    
    if (registry.agents[agentId]) {
      registry.agents[agentId].status = status;
      registry.agents[agentId].current_task = currentTask;
      registry.agents[agentId].updated_at = new Date().toISOString();
      fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2));
    }
  }

  /**
   * 列出所有 Agent
   */
  listAgents() {
    const registryPath = path.join(BASE_PATH, 'registry', 'agents.json');
    const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
    return Object.values(registry.agents);
  }
}

/**
 * AgentManager - Agent 管理器
 */
class AgentManager extends FileBasedSubagentSystem {
  /**
   * 创建 Agent
   */
  createAgent(config) {
    const agentId = this.generateId(config.type);
    const agentDir = path.join(BASE_PATH, 'agents', agentId);
    
    // 创建 Agent 目录
    fs.mkdirSync(agentDir, { recursive: true });
    fs.mkdirSync(path.join(agentDir, 'inbox'));
    fs.mkdirSync(path.join(agentDir, 'outbox'));

    // 创建上下文
    const context = {
      agent_id: agentId,
      type: config.type,
      role: config.role,
      status: 'idle',
      allowed_skills: config.allowed_skills || [],
      conversation_history: [],
      created_at: new Date().toISOString()
    };
    fs.writeFileSync(path.join(agentDir, 'context.json'), JSON.stringify(context, null, 2));

    // 注册到注册表
    const registryPath = path.join(BASE_PATH, 'registry', 'agents.json');
    const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
    registry.agents[agentId] = {
      id: agentId,
      type: config.type,
      role: config.role,
      status: 'idle',
      allowed_skills: config.allowed_skills || [],
      created_at: new Date().toISOString(),
      context_path: agentDir
    };
    fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2));

    console.log(`[AgentManager] Created agent: ${agentId} (${config.type})`);
    return { id: agentId, ...context };
  }

  /**
   * 获取 Agent
   */
  getAgent(agentId) {
    const agentDir = path.join(BASE_PATH, 'agents', agentId);
    const contextPath = path.join(agentDir, 'context.json');
    
    if (!fs.existsSync(contextPath)) {
      return null;
    }
    
    return JSON.parse(fs.readFileSync(contextPath, 'utf8'));
  }

  /**
   * 更新 Agent 上下文
   */
  updateContext(agentId, updates) {
    const agent = this.getAgent(agentId);
    if (!agent) return;

    const updatedContext = { ...agent, ...updates, updated_at: new Date().toISOString() };
    const contextPath = path.join(BASE_PATH, 'agents', agentId, 'context.json');
    fs.writeFileSync(contextPath, JSON.stringify(updatedContext, null, 2));
  }

  /**
   * 检查 Agent 的 inbox
   */
  checkInbox(agentId) {
    const inboxPath = path.join(BASE_PATH, 'agents', agentId, 'inbox');
    if (!fs.existsSync(inboxPath)) return [];

    const files = fs.readdirSync(inboxPath).filter(f => f.endsWith('.json'));
    return files.map(f => {
      const msgPath = path.join(inboxPath, f);
      const msg = JSON.parse(fs.readFileSync(msgPath, 'utf8'));
      return { ...msg, _file: f };
    });
  }

  /**
   * 标记消息已读
   */
  markMessageRead(agentId, messageId) {
    const inboxPath = path.join(BASE_PATH, 'agents', agentId, 'inbox');
    const msgPath = path.join(inboxPath, `${messageId}.json`);
    
    if (fs.existsSync(msgPath)) {
      const msg = JSON.parse(fs.readFileSync(msgPath, 'utf8'));
      msg.read = true;
      msg.read_at = new Date().toISOString();
      fs.writeFileSync(msgPath, JSON.stringify(msg, null, 2));
    }
  }

  /**
   * 写入结果到 outbox
   */
  writeResult(agentId, result) {
    const outboxPath = path.join(BASE_PATH, 'agents', agentId, 'outbox');
    if (!fs.existsSync(outboxPath)) {
      fs.mkdirSync(outboxPath, { recursive: true });
    }

    const resultId = this.generateId('result');
    const resultPath = path.join(outboxPath, `${resultId}.json`);
    fs.writeFileSync(resultPath, JSON.stringify({
      result_id: resultId,
      agent_id: agentId,
      ...result,
      created_at: new Date().toISOString()
    }, null, 2));

    return resultId;
  }

  /**
   * 销毁 Agent
   */
  destroyAgent(agentId) {
    // 从注册表移除
    const registryPath = path.join(BASE_PATH, 'registry', 'agents.json');
    const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
    delete registry.agents[agentId];
    fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2));

    // 删除目录
    const agentDir = path.join(BASE_PATH, 'agents', agentId);
    if (fs.existsSync(agentDir)) {
      fs.rmSync(agentDir, { recursive: true });
    }

    console.log(`[AgentManager] Destroyed agent: ${agentId}`);
  }
}

module.exports = { FileBasedSubagentSystem, Scheduler, AgentManager };
