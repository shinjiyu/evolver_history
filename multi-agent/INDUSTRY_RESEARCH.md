# 业界 Multi-Agent / Subagent 方案调研

## 调研时间
2026-02-17

---

## 主要框架对比

### 1. OpenAI Swarm (⭐ 21K)
- **GitHub**: https://github.com/openai/swarm
- **特点**: 轻量级、教育性框架
- **核心概念**:
  - Agent = Instructions + Functions (handoffs)
  - 通过 handoff 实现 Agent 间切换
  - 无状态设计，每次调用独立
- **通信方式**: 函数调用 / handoff
- **上下文**: 共享 conversation

```python
# Swarm 示例
agent_a = Agent(
    name="Agent A",
    instructions="You are a helpful agent.",
    functions=[transfer_to_agent_b]
)

def transfer_to_agent_b():
    return AgentB()  # handoff
```

---

### 2. Microsoft AutoGen (⭐ 55K)
- **GitHub**: https://github.com/microsoft/autogen
- **特点**: 企业级、生产就绪
- **核心概念**:
  - ConversableAgent: 可对话的 Agent
  - GroupChat: 多 Agent 群聊
  - Human-in-the-loop: 支持人类介入
- **通信方式**: 消息传递
- **上下文**: 可以共享或隔离

```python
# AutoGen 示例
assistant = ConversableAgent("assistant", ...)
user_proxy = ConversableAgent("user", ...)

# Agent 间对话
user_proxy.initiate_chat(assistant, message="...")
```

---

### 3. LangGraph (⭐ 较高)
- **GitHub**: https://github.com/langchain-ai/langgraph
- **特点**: 图结构工作流
- **核心概念**:
  - StateGraph: 状态图
  - Nodes: 处理节点
  - Edges: 转换边
  - Conditional edges: 条件分支
- **通信方式**: State 传递
- **上下文**: State 隔离

```python
# LangGraph 示例
workflow = StateGraph(AgentState)
workflow.add_node("agent", agent_node)
workflow.add_node("tools", tool_node)
workflow.add_edge("agent", "tools")
```

---

### 4. CrewAI
- **GitHub**: https://github.com/joaomdmoura/crewAI
- **特点**: 角色扮演、团队协作
- **核心概念**:
  - Agent: 有角色和目标的 Agent
  - Task: 具体任务
  - Crew: Agent 团队
  - Process: 协作流程 (sequential/hierarchical)
- **通信方式**: 任务链
- **上下文**: 任务上下文

```python
# CrewAI 示例
researcher = Agent(role='Researcher', ...)
writer = Agent(role='Writer', ...)

crew = Crew(
    agents=[researcher, writer],
    tasks=[research_task, write_task],
    process=Process.sequential
)
```

---

### 5. Claude Flow (⭐ 14K)
- **GitHub**: https://github.com/ruvnet/claude-flow
- **特点**: Claude 专用 Agent 编排
- **核心概念**:
  - Swarm coordination
  - Task distribution
  - Memory management
- **通信方式**: 文件系统 + 内存

---

### 6. AgentScope (Alibaba)
- **GitHub**: https://github.com/modelscope/agentscope
- **特点**: 多模态、分布式
- **核心概念**:
  - AgentBase: 基础 Agent 类
  - Service: 工具服务
  - Memory: 记忆管理
  - distributed: 支持分布式
- **通信方式**: 消息传递

---

### 7. Swarms
- **GitHub**: https://github.com/kyegomez/swarms
- **特点**: 企业级生产就绪
- **核心概念**:
  - Swarm: Agent 群体
  - Registry: Agent 注册
  - Orchestration: 编排策略

---

## 通信方式对比

| 框架 | 通信方式 | 上下文隔离 | 文件系统 |
|------|---------|-----------|---------|
| **OpenAI Swarm** | handoff 函数 | 否 | 否 |
| **AutoGen** | 消息传递 | 可选 | 否 |
| **LangGraph** | State 传递 | 是 | 否 |
| **CrewAI** | 任务链 | 部分 | 否 |
| **Claude Flow** | 文件+内存 | 是 | 是 |
| **我们方案** | 文件系统 | 是 | **是** |

---

## 上下文隔离方案对比

| 方案 | 隔离程度 | 实现复杂度 | 调试难度 |
|------|---------|-----------|---------|
| **共享上下文** (Swarm) | 低 | 低 | 低 |
| **State 传递** (LangGraph) | 中 | 中 | 中 |
| **消息队列** | 高 | 高 | 高 |
| **文件系统** (我们) | 高 | 低 | **最低** |

---

## 我们方案的优势

### 1. 完全文件化
- 所有状态可查看
- 调试友好
- 持久化自动

### 2. 严格隔离
- 每个 Agent 独立目录
- 显式信息传递
- 无上下文污染

### 3. 简单可靠
- 不依赖外部服务
- 无网络开销
- 容错性强

### 4. 与 OpenClaw 集成
- 可复用现有 Skills
- 不需要修改 OpenClaw 核心
- 渐进式部署

---

## 建议参考的设计模式

### 从 Swarm 学习:
- 简洁的 Agent 定义
- handoff 机制

### 从 AutoGen 学习:
- 人类介入支持
- GroupChat 模式

### 从 LangGraph 学习:
- 图结构工作流
- 条件分支

### 从 CrewAI 学习:
- 角色定义
- Sequential vs Hierarchical

---

---

## 相关开源项目

### 文件通信方案

| 项目 | 描述 | Stars |
|------|------|-------|
| [agent-message-queue](https://github.com/avivsinai/agent-message-queue) | File-based message queue (Maildir-style) | 24 |

### 其他值得关注的

| 项目 | 描述 | Stars |
|------|------|-------|
| [claude-code-plugins-plus-skills](https://github.com/jeremylongshore/claude-code-plugins-plus-skills) | Claude Code 插件和 Skills | 1374 |
| [microsoft/spec-to-agents](https://github.com/microsoft/spec-to-agents) | 从规范生成 Agents | 73 |

---

## 关键发现

### 1. 文件系统通信是少数派但有其价值
- 大多数框架使用内存或消息队列
- 文件系统的优势在于**调试友好**和**持久化**
- 我们的方案在这一点上是独特的

### 2. 上下文隔离普遍被认为是重要问题
- LangGraph 的 State 传递
- AutoGen 的可选隔离
- 但很少有**严格隔离**的方案

### 3. Agent 编排模式
- **Sequential**: 串行执行 (CrewAI)
- **Hierarchical**: 分层管理
- **Graph**: 图结构 (LangGraph)
- **Swarm**: 群体协作 (Swarm)

---

## 我们方案与业界对比

| 维度 | 我们 | OpenAI Swarm | AutoGen | LangGraph |
|------|------|-------------|---------|-----------|
| 通信机制 | 文件 | handoff | 消息 | State |
| 上下文隔离 | ✅ 严格 | ❌ 共享 | ⚡ 可选 | ✅ State |
| 持久化 | ✅ 自动 | ❌ | ⚡ 可选 | ❌ |
| 调试友好 | ✅ 高 | ⚡ 中 | ⚡ 中 | ⚡ 中 |
| 实现复杂度 | ⚡ 低 | ✅ 低 | ❌ 高 | ⚡ 中 |
| 与 Skills 集成 | ✅ 原生 | ❌ | ⚡ 需适配 | ⚡ 需适配 |

---

## 下一步建议

### 短期 (1-2周)
1. ✅ 完成文件系统方案 (已完成)
2. 添加心跳检测和健康监控
3. 实现 Skill 调用集成

### 中期 (1-2月)
1. 参考 Swarm 添加 handoff 机制
2. 支持分层编排 (Hierarchical)
3. 添加人类介入点

### 长期 (3-6月)
1. 支持图结构工作流 (类 LangGraph)
2. 可视化编排界面
3. 与 OpenClaw 深度集成
