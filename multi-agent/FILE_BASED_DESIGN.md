# 基于文件的 Subagent 调度与通信系统

## 架构概览

```
┌─────────────────────────────────────────────────────────────────┐
│                         文件系统层                               │
│                                                                 │
│  /root/.openclaw/workspace/subagents/                          │
│  ├── registry.json          # Agent 注册表                      │
│  ├── tasks/                 # 任务队列                          │
│  │   ├── pending/           # 待处理                            │
│  │   ├── processing/        # 处理中                            │
│  │   └── completed/         # 已完成                            │
│  ├── agents/                # Agent 实例                        │
│  │   ├── researcher_001/                                        │
│  │   │   ├── context.json   # 隔离上下文                        │
│  │   │   ├── inbox/         # 输入消息                          │
│  │   │   └── outbox/        # 输出消息                          │
│  │   └── executor_001/                                          │
│  └── shared/                # 共享数据（显式）                   │
│      └── project_state.json                                     │
└─────────────────────────────────────────────────────────────────┘
```

## 核心设计

### 1. Agent 注册表 (registry.json)

```json
{
  "agents": {
    "researcher_001": {
      "id": "researcher_001",
      "type": "researcher",
      "role": "信息收集与分析",
      "status": "idle",
      "allowed_skills": ["log-analysis", "neutral-evaluator"],
      "created_at": "2026-02-17T13:00:00Z",
      "context_path": "/root/.openclaw/workspace/subagents/agents/researcher_001"
    },
    "executor_001": {
      "id": "executor_001",
      "type": "executor", 
      "role": "执行操作",
      "status": "busy",
      "allowed_skills": ["skill-creator", "feishu-doc"],
      "current_task": "task_123",
      "created_at": "2026-02-17T13:00:00Z"
    }
  }
}
```

### 2. 任务队列 (tasks/)

```
tasks/
├── pending/
│   ├── task_001.json    # 等待分配
│   └── task_002.json
├── processing/
│   └── task_003.json    # agent_001 正在处理
└── completed/
    ├── task_004.json    # 结果已产出
    └── task_005.json
```

**任务文件格式**：
```json
{
  "task_id": "task_001",
  "type": "research",
  "description": "分析项目依赖关系",
  "inputs": {
    "project_path": "/root/my-project"
  },
  "constraints": {
    "timeout": 300,
    "max_retries": 3
  },
  "assigned_to": null,
  "status": "pending",
  "created_at": "2026-02-17T13:00:00Z",
  "depends_on": []
}
```

### 3. Agent 上下文 (agents/{id}/context.json)

```json
{
  "agent_id": "researcher_001",
  "type": "researcher",
  "status": "processing",
  
  "current_task": {
    "task_id": "task_001",
    "started_at": "2026-02-17T13:01:00Z"
  },
  
  "conversation_history": [
    {
      "role": "system",
      "content": "你是研究员 Agent，负责信息收集和分析...",
      "timestamp": "2026-02-17T13:00:00Z"
    },
    {
      "role": "task",
      "content": "分析项目依赖关系",
      "timestamp": "2026-02-17T13:01:00Z"
    }
  ],
  
  "isolated_context": {
    "working_memory": {},
    "intermediate_results": []
  },
  
  "skills_loaded": ["log-analysis"]
}
```

### 4. 消息通信 (inbox/outbox)

```
agents/researcher_001/
├── inbox/
│   ├── msg_001.json    # 来自 Orchestrator 的任务
│   └── msg_002.json    # 来自其他 Agent 的数据
└── outbox/
    ├── result_001.json # 任务结果
    └── msg_to_executor.json
```

**消息格式**：
```json
{
  "message_id": "msg_001",
  "from": "orchestrator",
  "to": "researcher_001",
  "type": "task_assignment",
  "payload": {
    "task_id": "task_001",
    "description": "分析项目依赖",
    "inputs": { "project_path": "/root/my-project" }
  },
  "created_at": "2026-02-17T13:00:00Z",
  "read": false
}
```

---

## 调度流程

### 1. 任务分配

```javascript
class FileBasedScheduler {
  async assignTask(taskId) {
    // 1. 读取任务
    const task = this.readTask(`pending/${taskId}.json`);
    
    // 2. 查找合适的 Agent
    const agent = this.findAvailableAgent(task.type);
    
    // 3. 移动任务到 processing
    this.moveTask(taskId, 'pending', 'processing');
    
    // 4. 更新任务分配
    task.assigned_to = agent.id;
    task.status = 'assigned';
    this.writeTask(`processing/${taskId}.json`, task);
    
    // 5. 写入 Agent inbox
    this.writeMessage(agent.id, {
      type: 'task_assignment',
      payload: task
    });
    
    // 6. 更新 Agent 状态
    this.updateAgentStatus(agent.id, 'busy', taskId);
  }
}
```

### 2. Agent 执行

```javascript
class FileBasedAgent {
  async run() {
    while (true) {
      // 1. 检查 inbox
      const messages = this.checkInbox();
      
      for (const msg of messages) {
        if (msg.type === 'task_assignment') {
          // 2. 加载任务到隔离上下文
          this.loadTaskToContext(msg.payload);
          
          // 3. 执行任务（调用 Skills）
          const result = await this.executeTask();
          
          // 4. 写入结果到 outbox
          this.writeResult({
            task_id: msg.payload.task_id,
            result: result
          });
          
          // 5. 更新状态
          this.updateStatus('idle');
        }
      }
      
      // 6. 等待新消息
      await this.waitForNewMessage();
    }
  }
}
```

### 3. 结果收集

```javascript
class FileBasedOrchestrator {
  async collectResults() {
    // 1. 扫描所有 Agent 的 outbox
    const results = [];
    
    for (const agent of this.listAgents()) {
      const outbox = this.readOutbox(agent.id);
      for (const result of outbox) {
        // 2. 移动任务到 completed
        this.moveTask(result.task_id, 'processing', 'completed');
        
        // 3. 写入最终结果
        this.writeFinalResult(result);
        results.push(result);
      }
    }
    
    return results;
  }
}
```

---

## 优势

| 特性 | 说明 |
|------|------|
| **完全隔离** | 每个 Agent 有独立目录，上下文互不干扰 |
| **可调试** | 所有状态都是文件，可以直接查看 |
| **持久化** | 断电/重启后状态不丢失 |
| **异步** | Agent 可以独立运行，不需要同时在线 |
| **可扩展** | 增加新 Agent 只需创建新目录 |
| **跨进程** | 不同进程通过文件通信 |

---

## 实现计划

```
Phase 1: 基础框架
├── 文件结构设计
├── Scheduler 实现
└── Agent 基类

Phase 2: 通信机制
├── 消息格式
├── inbox/outbox 处理
└── 状态同步

Phase 3: Skill 集成
├── Skill 调用接口
├── 结果传递
└── 错误处理

Phase 4: Orchestrator
├── 任务分解
├── 流程编排
└── 迭代控制
```

要我开始实现 Phase 1 吗？
