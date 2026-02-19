# 基于文件的 Subagent 系统完整设计

## 1. 系统架构

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            用户 / 主 Agent                               │
│                                                                         │
│  发起任务: "写一部科幻小说" 或 "分析并修复这个 bug"                       │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         Orchestrator (调度中心)                          │
│                                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │ Task Parser │  │   Planner   │  │ Dispatcher  │  │  Collector  │    │
│  │  任务解析   │  │  计划制定   │  │  任务分发   │  │  结果收集   │    │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    │
│                                                                         │
│  文件接口:                                                              │
│  - 读取: tasks/pending/*.json                                          │
│  - 写入: tasks/processing/*.json                                       │
│  - 读取: agents/*/outbox/*.json                                        │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
                                  │ 文件系统
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
        ┌───────────┴───────────┐   ┌───────────┴───────────┐
        │                       │   │                       │
        ▼                       ▼   ▼                       ▼
┌───────────────┐       ┌───────────────┐       ┌───────────────┐
│   Agent A     │       │   Agent B     │       │   Agent C     │
│  (researcher) │       │  (executor)   │       │  (reviewer)   │
│               │       │               │       │               │
│ ┌───────────┐ │       │ ┌───────────┐ │       │ ┌───────────┐ │
│ │context.json│ │       │ │context.json│ │       │ │context.json│ │
│ │ 隔离上下文 │ │       │ │ 隔离上下文 │ │       │ │ 隔离上下文 │ │
│ └───────────┘ │       │ └───────────┘ │       │ └───────────┘ │
│               │       │               │       │               │
│ ┌───────────┐ │       │ ┌───────────┐ │       │ ┌───────────┐ │
│ │   inbox/  │ │       │ │   inbox/  │ │       │ │   inbox/  │ │
│ │  消息输入 │ │       │ │  消息输入 │ │       │ │  消息输入 │ │
│ └───────────┘ │       │ └───────────┘ │       │ └───────────┘ │
│               │       │               │       │               │
│ ┌───────────┐ │       │ ┌───────────┐ │       │ ┌───────────┐ │
│ │  outbox/  │ │       │ │  outbox/  │ │       │ │  outbox/  │ │
│ │  结果输出 │ │       │ │  结果输出 │ │       │ │  结果输出 │ │
│ └───────────┘ │       │ └───────────┘ │       │ └───────────┘ │
│               │       │               │       │               │
│ ┌───────────┐ │       │ ┌───────────┐ │       │ ┌───────────┐ │
│ │  Skills   │ │       │ │  Skills   │ │       │ │  Skills   │ │
│ │ - skill_X │ │       │ │ - skill_Y │ │       │ │ - skill_Z │ │
│ │ - skill_Y │ │       │ │ - skill_Z │ │       │ │           │ │
│ └───────────┘ │       │ └───────────┘ │       │ └───────────┘ │
└───────────────┘       └───────────────┘       └───────────────┘
        │                       │                       │
        └───────────────────────┼───────────────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │      shared/          │
                    │  显式共享的数据       │
                    │  (只在需要时读写)     │
                    └───────────────────────┘
```

---

## 2. 目录结构

```
/root/.openclaw/workspace/subagents/
│
├── registry/
│   └── agents.json              # Agent 注册表
│
├── tasks/
│   ├── pending/                 # 待处理任务
│   │   ├── task_001.json
│   │   └── task_002.json
│   ├── processing/              # 处理中任务
│   │   └── task_003.json
│   └── completed/               # 已完成任务
│       └── task_004.json
│
├── agents/
│   ├── researcher_001/
│   │   ├── context.json         # 隔离上下文
│   │   ├── inbox/               # 输入消息
│   │   │   ├── msg_001.json
│   │   │   └── msg_002.json
│   │   └── outbox/              # 输出结果
│   │       └── result_001.json
│   │
│   ├── executor_001/
│   │   ├── context.json
│   │   ├── inbox/
│   │   └── outbox/
│   │
│   └── reviewer_001/
│       ├── context.json
│       ├── inbox/
│       └── outbox/
│
├── shared/                      # 显式共享数据
│   ├── project_state.json
│   └── artifacts/
│       └── novel_draft_v1.txt
│
└── logs/
    ├── orchestrator.log
    ├── researcher_001.log
    └── executor_001.log
```

---

## 3. 文件格式详细定义

### 3.1 注册表 (registry/agents.json)

```json
{
  "version": "1.0.0",
  "updated_at": "2026-02-17T13:00:00Z",
  "agents": {
    "researcher_001": {
      "id": "researcher_001",
      "type": "researcher",
      "role": "信息收集与分析",
      "status": "idle",
      "allowed_skills": ["log-analysis", "neutral-evaluator", "web-search"],
      "current_task": null,
      "created_at": "2026-02-17T12:00:00Z",
      "updated_at": "2026-02-17T13:00:00Z",
      "context_path": "/root/.openclaw/workspace/subagents/agents/researcher_001",
      "stats": {
        "tasks_completed": 5,
        "avg_completion_time": 45.2
      }
    },
    "executor_001": {
      "id": "executor_001",
      "type": "executor",
      "role": "执行操作",
      "status": "busy",
      "allowed_skills": ["skill-creator", "feishu-doc", "code-writer"],
      "current_task": "task_003",
      "created_at": "2026-02-17T12:00:00Z",
      "updated_at": "2026-02-17T13:05:00Z"
    }
  }
}
```

### 3.2 任务文件 (tasks/pending/task_xxx.json)

```json
{
  "task_id": "task_001",
  "parent_task": null,
  
  "type": "research",
  "priority": "high",
  "description": "分析 OpenClaw 日志，找出常见错误模式",
  
  "inputs": {
    "log_path": "/root/.openclaw/logs",
    "time_range": "7d",
    "error_types": ["error", "critical"]
  },
  
  "expected_outputs": {
    "error_patterns": "list",
    "frequency_stats": "dict",
    "recommendations": "list"
  },
  
  "constraints": {
    "timeout_seconds": 300,
    "max_retries": 3,
    "memory_limit_mb": 512
  },
  
  "dependencies": {
    "depends_on": [],
    "blocks": ["task_002", "task_003"]
  },
  
  "assignment": {
    "assigned_to": null,
    "assigned_at": null,
    "previous_assignees": []
  },
  
  "status": "pending",
  "created_at": "2026-02-17T13:00:00Z",
  "updated_at": "2026-02-17T13:00:00Z"
}
```

### 3.3 Agent 上下文 (agents/researcher_001/context.json)

```json
{
  "agent_id": "researcher_001",
  "type": "researcher",
  "role": "信息收集与分析",
  "status": "processing",
  
  "identity": {
    "system_prompt": "你是研究员 Agent，负责信息收集和分析...",
    "capabilities": ["web-search", "log-analysis", "data-extraction"],
    "limitations": ["不能修改文件", "不能发送消息"]
  },
  
  "current_task": {
    "task_id": "task_001",
    "started_at": "2026-02-17T13:01:00Z",
    "timeout_at": "2026-02-17T13:06:00Z"
  },
  
  "conversation_history": [
    {
      "role": "system",
      "content": "你是研究员 Agent...",
      "timestamp": "2026-02-17T13:00:00Z"
    },
    {
      "role": "user",
      "content": "[TASK] 分析日志找出错误模式",
      "timestamp": "2026-02-17T13:01:00Z"
    },
    {
      "role": "assistant",
      "content": "好的，我开始分析...",
      "timestamp": "2026-02-17T13:01:05Z"
    },
    {
      "role": "tool_use",
      "tool": "log-analysis",
      "input": {"path": "/root/.openclaw/logs"},
      "timestamp": "2026-02-17T13:01:10Z"
    },
    {
      "role": "tool_result",
      "output": {"patterns": [...]},
      "timestamp": "2026-02-17T13:02:00Z"
    }
  ],
  
  "working_memory": {
    "current_focus": "error_pattern_analysis",
    "partial_results": {
      "patterns_found": 5,
      "most_common": "API_TIMEOUT"
    },
    "pending_actions": ["generate_report"]
  },
  
  "skills_loaded": ["log-analysis"],
  "created_at": "2026-02-17T12:00:00Z",
  "updated_at": "2026-02-17T13:02:00Z"
}
```

### 3.4 消息格式 (agents/*/inbox/msg_xxx.json)

```json
{
  "message_id": "msg_001",
  "message_type": "task_assignment",
  
  "routing": {
    "from": "orchestrator",
    "to": "researcher_001",
    "reply_to": null,
    "correlation_id": "task_001"
  },
  
  "payload": {
    "task_id": "task_001",
    "description": "分析日志找出错误模式",
    "inputs": {
      "log_path": "/root/.openclaw/logs"
    },
    "constraints": {
      "timeout": 300
    }
  },
  
  "metadata": {
    "priority": "high",
    "created_at": "2026-02-17T13:00:00Z",
    "expires_at": "2026-02-17T13:30:00Z"
  },
  
  "status": {
    "read": false,
    "read_at": null,
    "acknowledged": false
  }
}
```

### 3.5 结果格式 (agents/*/outbox/result_xxx.json)

```json
{
  "result_id": "result_001",
  "task_id": "task_001",
  "agent_id": "researcher_001",
  
  "status": "success",
  
  "outputs": {
    "error_patterns": [
      {
        "pattern": "API_TIMEOUT",
        "frequency": 156,
        "examples": ["error log 1", "error log 2"]
      },
      {
        "pattern": "DB_CONNECTION_FAILED",
        "frequency": 23,
        "examples": ["error log 3"]
      }
    ],
    "frequency_stats": {
      "total_errors": 234,
      "by_day": {...}
    },
    "recommendations": [
      "建议增加 API 超时重试机制",
      "建议优化数据库连接池配置"
    ]
  },
  
  "metrics": {
    "execution_time_seconds": 45.2,
    "tokens_used": 3500,
    "skills_called": ["log-analysis"]
  },
  
  "artifacts": [
    {
      "type": "file",
      "path": "/root/.openclaw/workspace/subagents/shared/error_report.md",
      "description": "详细错误分析报告"
    }
  ],
  
  "created_at": "2026-02-17T13:02:00Z"
}
```

---

## 4. 通信流程

### 4.1 任务分配流程

```
Orchestrator                         Agent
     │                                 │
     │  1. 创建 task_xxx.json          │
     │     写入 tasks/pending/         │
     │                                 │
     │  2. 选择合适的 Agent            │
     │                                 │
     │  3. 移动 task                   │
     │     pending → processing        │
     │                                 │
     │  4. 写入消息                    │
     │  ┌─────────────────────────────►│
     │  │ agents/xxx/inbox/msg.json   │
     │                                 │
     │                                 │  5. 检测到新消息
     │                                 │     (轮询/watch)
     │                                 │
     │                                 │  6. 读取消息
     │                                 │     更新 context.json
     │                                 │
     │                                 │  7. 执行任务
     │                                 │     调用 Skills
     │                                 │
     │  8. 读取结果                    │
     │  ◄─────────────────────────────┐│
     │  │ agents/xxx/outbox/result.json│
     │                                 │
     │  9. 移动 task                   │
     │     processing → completed     │
     │                                 │
     ▼                                 ▼
```

### 4.2 Agent 间通信 (显式传递)

```
Agent A                              Agent B
   │                                    │
   │  1. 完成任务，生成结果             │
   │     写入 outbox/result.json        │
   │                                    │
   │  2. 需要传递数据给 Agent B         │
   │                                    │
   │  3. 写入消息到 B 的 inbox          │
   │  ┌────────────────────────────────►│
   │  │ agents/B/inbox/from_A.json     │
   │  │ payload: { result: ... }       │
   │                                    │
   │                                    │  4. 读取消息
   │                                    │     只看到 payload
   │                                    │     不看到 A 的上下文
   │                                    │
   ▼                                    ▼
```

### 4.3 迭代流程 (编辑部场景)

```
┌─────────────────────────────────────────────────────────────────┐
│                         迭代循环                                 │
│                                                                 │
│  ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐  │
│  │ 写作    │ ──► │ 评审    │ ──► │ 决策    │ ──► │ 修改    │  │
│  │ Agent   │     │ Agents  │     │Orchestr.│     │ Agent   │  │
│  └─────────┘     └─────────┘     └─────────┘     └─────────┘  │
│       ▲                                               │        │
│       └───────────────────────────────────────────────┘        │
│                      (如果需要迭代)                             │
└─────────────────────────────────────────────────────────────────┘

详细流程:

1. Orchestrator → Writer: "写第1章"
   Writer context: 只有任务描述，不知道评审标准

2. Writer → Orchestrator: { chapter_1: "..." }
   
3. Orchestrator → Readers: "评审第1章"
   Reader A context: 只有章节内容，不知道作者意图
   Reader B context: 同上，独立上下文
   Reader C context: 同上

4. Readers → Orchestrator: [
     { score: 8, feedback: "节奏好，人物单薄" },
     { score: 6, feedback: "文笔一般" },
     { score: 7, feedback: "还行" }
   ]

5. Orchestrator 决策: 平均分 7.0 < 8.0，需要迭代
   决策依据: 只看分数和反馈，不受 Writer/Reader 上下文影响

6. Orchestrator → Writer: "修改第1章，重点：丰富人物"
   Writer context: 新任务 + 评审反馈（但不知道是谁给的反馈）

7. Writer → Orchestrator: { chapter_1_v2: "..." }

8. ... 重复评审 ...

9. 达标，发布
```

---

## 5. 状态转换

### 5.1 任务状态

```
                    ┌─────────────┐
                    │   created   │
                    └──────┬──────┘
                           │
                           ▼
                    ┌─────────────┐
         ┌──────────│   pending   │◄──────────┐
         │          └──────┬──────┘           │
         │                 │                  │
         │                 ▼                  │
         │          ┌─────────────┐           │
         │          │  assigned   │           │
         │          └──────┬──────┘           │
         │                 │                  │
         │                 ▼                  │
         │          ┌─────────────┐           │
         │          │ processing  │           │
         │          └──────┬──────┘           │
         │                 │                  │
         │        ┌────────┴────────┐         │
         │        │                 │         │
         │        ▼                 ▼         │
         │ ┌─────────────┐   ┌─────────────┐  │
         │ │  completed  │   │   failed    │──┘
         │ └─────────────┘   └──────┬──────┘
         │                           │
         │                           ▼
         │                    ┌─────────────┐
         │                    │   retry     │
         │                    └─────────────┘
         │
         └─────────► 最终状态: completed
```

### 5.2 Agent 状态

```
┌─────────────┐     assign      ┌─────────────┐
│    idle     │ ──────────────► │    busy     │
└─────────────┘                 └──────┬──────┘
      ▲                                │
      │                                │
      │           complete/           │
      │            fail               │
      │                                │
      └────────────────────────────────┘

特殊情况:
- timeout: busy → failed → idle
- error: busy → error → idle
- blocked: busy → waiting → busy (等待依赖)
```

---

## 6. 错误处理

### 6.1 超时处理

```javascript
// Orchestrator 监控任务超时
async function checkTimeouts() {
  const processing = readProcessingTasks();
  const now = Date.now();
  
  for (const task of processing) {
    const timeout = task.constraints.timeout_seconds * 1000;
    if (now - new Date(task.assigned_at) > timeout) {
      // 1. 标记任务超时
      task.status = 'timeout';
      
      // 2. 通知 Agent
      sendMessage(task.assigned_to, {
        type: 'task_timeout',
        task_id: task.task_id
      });
      
      // 3. 重新分配或放弃
      if (task.retry_count < task.constraints.max_retries) {
        moveTask(task.task_id, 'processing', 'pending');
        task.assigned_to = null;
        task.retry_count++;
      } else {
        moveTask(task.task_id, 'processing', 'completed');
        task.result = { error: 'max_retries_exceeded' };
      }
    }
  }
}
```

### 6.2 Agent 崩溃恢复

```javascript
// 检测 Agent 崩溃
async function checkAgentHealth() {
  const agents = listAgents();
  
  for (const agent of agents) {
    if (agent.status === 'busy') {
      // 检查心跳文件
      const heartbeatPath = `${agent.context_path}/heartbeat.json`;
      
      if (!fs.existsSync(heartbeatPath)) {
        // Agent 可能崩溃
        agent.status = 'crashed';
        
        // 回收任务
        if (agent.current_task) {
          reassignTask(agent.current_task);
        }
      } else {
        const heartbeat = JSON.parse(fs.readFileSync(heartbeatPath));
        const lastBeat = new Date(heartbeat.timestamp);
        
        if (Date.now() - lastBeat > 60000) { // 1分钟无心跳
          // Agent 可能卡死
          agent.status = 'stuck';
          reassignTask(agent.current_task);
        }
      }
    }
  }
}
```

---

## 7. Skill 集成

### 7.1 Agent 调用 Skill

```javascript
// Agent 端
async function callSkill(skillName, input) {
  // 1. 检查权限
  if (!this.context.allowed_skills.includes(skillName)) {
    throw new Error(`Skill ${skillName} not allowed`);
  }
  
  // 2. 记录到上下文
  this.context.conversation_history.push({
    role: 'skill_call',
    skill: skillName,
    input: input,
    timestamp: new Date().toISOString()
  });
  this.saveContext();
  
  // 3. 调用 Skill (通过文件触发)
  const requestId = generateId('skill_req');
  const requestPath = `/tmp/openclaw-skill-requests/${requestId}.json`;
  const responsePath = `/tmp/openclaw-skill-responses/${requestId}.json`;
  
  fs.writeFileSync(requestPath, JSON.stringify({
    skill: skillName,
    input: input,
    agent_context: this.context.agent_id  // 标识来源
  }));
  
  // 4. 等待响应
  const result = await waitForFile(responsePath, 30000);
  
  // 5. 记录结果
  this.context.conversation_history.push({
    role: 'skill_result',
    skill: skillName,
    result: result,
    timestamp: new Date().toISOString()
  });
  this.saveContext();
  
  return result;
}
```

### 7.2 OpenClaw 主进程处理 Skill 请求

```javascript
// 在 OpenClaw 主进程中运行
async function processSkillRequests() {
  const requestDir = '/tmp/openclaw-skill-requests';
  
  // 监听新请求
  fs.watch(requestDir, async (event, filename) => {
    if (event === 'rename' && filename.endsWith('.json')) {
      const request = JSON.parse(fs.readFileSync(`${requestDir}/${filename}`));
      
      // 执行 Skill (在主上下文中)
      const result = await executeSkill(request.skill, request.input);
      
      // 写入响应
      const responsePath = `/tmp/openclaw-skill-responses/${filename}`;
      fs.writeFileSync(responsePath, JSON.stringify(result));
      
      // 清理请求文件
      fs.unlinkSync(`${requestDir}/${filename}`);
    }
  });
}
```

---

## 8. 完整示例：编辑部写小说

见 `EDITORIAL_DEPT_EXAMPLE.md`
