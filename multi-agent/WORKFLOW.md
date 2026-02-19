# Multi-Subagent Collaboration Workflow

## 架构概览

```
┌─────────────────────────────────────────────────────────────┐
│                    Orchestrator Agent                        │
│  (任务分解、分配、监控、聚合)                                  │
└─────────────────────┬───────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
        ▼             ▼             ▼
┌───────────┐ ┌───────────┐ ┌───────────┐
│ Research  │ │ Executor  │ │ Verifier  │
│  Agent    │ │  Agent    │ │  Agent    │
│ (研究分析) │ │ (执行任务) │ │ (验证结果) │
└───────────┘ └───────────┘ └───────────┘
        │             │             │
        └─────────────┼─────────────┘
                      │
                      ▼
              ┌───────────────┐
              │ Shared State  │
              │ (共享状态文件) │
              └───────────────┘
```

## Subagent 类型

### 1. Orchestrator (主控)
- 接收用户任务
- 分解为子任务
- 分配给合适的 subagent
- 监控进度
- 聚合结果

### 2. Research Agent (研究型)
- 信息收集
- 代码分析
- 文档查阅
- 技术调研

### 3. Executor Agent (执行型)
- 代码编写
- 文件操作
- API 调用
- 系统命令

### 4. Verifier Agent (验证型)
- 代码测试
- 结果校验
- 质量检查
- 合规审查

## 通信协议

```javascript
// 任务消息格式
{
  "type": "task",
  "task_id": "task_001",
  "from": "orchestrator",
  "to": "executor",
  "action": "write_file",
  "payload": {
    "path": "/path/to/file.js",
    "content": "..."
  },
  "priority": "high",
  "deadline": "2026-02-17T12:00:00Z"
}

// 状态更新消息
{
  "type": "status",
  "task_id": "task_001",
  "from": "executor",
  "status": "completed",
  "result": {
    "success": true,
    "output": "File written successfully"
  }
}
```

## 共享状态

```javascript
// shared-state.json
{
  "session_id": "session_xxx",
  "created_at": "2026-02-17T10:00:00Z",
  "status": "running",
  "tasks": {
    "task_001": { "status": "completed", "result": {} },
    "task_002": { "status": "in_progress", "assigned_to": "researcher" }
  },
  "artifacts": [
    { "type": "file", "path": "/path/to/output.md" }
  ],
  "context": {
    "user_goal": "...",
    "constraints": []
  }
}
```
