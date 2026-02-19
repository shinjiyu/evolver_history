# OpenClaw 内置 Subagent 功能调研

## 调研时间
2026-02-17

## 重大发现

**OpenClaw 已经有内置的 Subagent 功能！**

---

## 功能概览

### 1. 系统提示词

```
You are a **subagent** spawned by the main agent for a specific task.

## Your Role
- You were created to handle: {{TASK_DESCRIPTION}}
- Complete this task. That's your entire purpose.
- You are NOT the main agent. Don't try to be.

## Rules
1. **Stay focused** - Do your assigned task, nothing else
2. **Complete the task** - Your final message will be automatically reported to the main agent
3. **Don't initiate** - No heartbeats, no proactive actions, no side quests
4. **Be ephemeral** - You may be terminated after task completion. That's fine.

## What You DON'T Do
- NO user conversations (that's main agent's job)
- NO external messages unless explicitly tasked
- NO cron jobs or persistent state
- NO pretending to be the main agent
```

### 2. 命令

```bash
/subagents list              # 列出所有 subagent
/subagents stop <id>         # 停止某个 subagent
/subagents log <id>          # 查看 subagent 日志
/subagents info <id>         # 查看 subagent 详情
/subagents send <id> <msg>   # 向 subagent 发送消息
```

### 3. 配置选项

```json
{
  "agents": {
    "defaults": {
      "subagents": {
        "archiveAfterMinutes": 60  // 归档时间
      }
    }
  }
}
```

### 4. 上下文隔离

- 每个 subagent 有独立的 `childSessionKey`
- 请求者和子 session 分离
- 完成后可自动清理

### 5. 注册表

- 存储位置: `{stateDir}/subagents/runs.json`
- 包含: runId, task, label, status, startedAt, endedAt, outcome

---

## 与我们方案的对比

| 维度 | OpenClaw 内置 | 我们的文件方案 |
|------|-------------|--------------|
| 通信方式 | Session + 消息 | 文件系统 |
| 上下文隔离 | ✅ Session 隔离 | ✅ 目录隔离 |
| 持久化 | ✅ runs.json | ✅ 多文件 |
| Skills 支持 | ✅ 原生 | ✅ 需集成 |
| 状态可见性 | ⚡ 命令查看 | ✅ 直接查看文件 |
| 灵活性 | ⚡ 框架内 | ✅ 完全自定义 |
| 多 Agent 编排 | ❓ 未知 | ✅ 支持 |

---

## 建议

### 短期
1. **直接使用 OpenClaw 内置 Subagent** 进行简单任务
2. 测试 `/subagents` 命令功能

### 中期
1. 研究如何用 OpenClaw 内置机制实现多 Agent 编排
2. 对比内置方案与文件方案的优劣

### 长期
1. 考虑将文件方案作为 OpenClaw Subagent 的扩展
2. 或者使用内置方案替代文件方案

---

## 下一步

1. 测试 OpenClaw 内置 subagent 功能
2. 研究如何触发 subagent 创建
3. 对比两种方案的适用场景
