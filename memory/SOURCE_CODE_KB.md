# OpenClaw 源码知识库

> 本文档基于 OpenClaw 源码分析，提供完整的架构概览和开发指南。

## 目录

1. [目录结构](#目录结构)
2. [核心组件详解](#核心组件详解)
3. [数据流分析](#数据流分析)
4. [API 端点](#api-端点)
5. [扩展开发指南](#扩展开发指南)
6. [关键文件索引](#关键文件索引)

---

## 目录结构

```
/root/openclaw-fork/src/
├── 📁 agents/              # Agent 核心系统 (最大模块)
│   ├── pi-embedded-*.ts    # 嵌入式 PI Agent 运行器
│   ├── bash-tools.*.ts     # Bash/Shell 工具实现
│   ├── skills/             # Skill 技能系统
│   ├── tools/              # Agent 工具定义
│   ├── subagent-*.ts       # 子 Agent 管理
│   ├── model-*.ts          # 模型选择/认证
│   └── workspace*.ts       # 工作空间管理
│
├── 📁 gateway/             # API 网关服务
│   ├── server.impl.ts      # 服务器主实现
│   ├── server-*.ts         # 各子系统集成
│   ├── auth*.ts            # 认证系统
│   ├── client.ts           # WebSocket 客户端
│   └── protocol/           # 通信协议定义
│
├── 📁 tasks/               # 后台任务系统
│   ├── service.ts          # 任务服务
│   ├── store.ts            # 任务存储
│   └── types.ts            # 类型定义
│
├── 📁 cron/                # 定时任务系统
│   ├── service.ts          # Cron 服务
│   ├── service/            # 服务实现
│   ├── isolated-agent/     # 隔离 Agent 执行
│   └── types.ts            # 类型定义
│
├── 📁 channels/            # 通道插件系统
│   ├── registry.ts         # 通道注册表
│   ├── plugins/            # 插件实现
│   └── dock.ts             # 通道对接
│
├── 📁 config/              # 配置管理
│   ├── io.ts               # 配置 IO
│   ├── schema*.ts          # JSON Schema
│   ├── zod-schema*.ts      # Zod 验证
│   └── types*.ts           # 类型定义
│
├── 📁 infra/               # 基础设施
│   ├── exec-approval*.ts   # 执行审批
│   ├── heartbeat-*.ts      # 心跳系统
│   ├── restart*.ts         # 重启管理
│   ├── update-*.ts         # 更新系统
│   └── bonjour-*.ts        # 服务发现
│
├── 📁 cli/                 # CLI 命令行
│   ├── program/            # 程序构建
│   ├── gateway-cli/        # Gateway CLI
│   ├── cron-cli/           # Cron CLI
│   ├── daemon-cli/         # Daemon CLI
│   └── *-cli.ts            # 各子命令
│
├── 📁 sessions/            # 会话管理
├── 📁 plugins/             # 插件系统
├── 📁 providers/           # AI 提供商
├── 📁 memory/              # 记忆系统
├── 📁 browser/             # 浏览器控制
├── 📁 node-host/           # 节点托管
├── 📁 pairing/             # 设备配对
├── 📁 canvas-host/         # 画布托管
│
├── 📁 telegram/            # Telegram 通道
├── 📁 discord/             # Discord 通道
├── 📁 slack/               # Slack 通道
├── 📁 signal/              # Signal 通道
├── 📁 whatsapp/            # WhatsApp 通道
├── 📁 imessage/            # iMessage 通道
├── 📁 irc/                 # IRC 通道
├── 📁 line/                # LINE 通道
├── 📁 feishu/              # 飞书通道 (扩展)
│
├── index.ts                # 主入口导出
├── entry.ts                # CLI 入口
├── runtime.ts              # 运行时环境
├── utils.ts                # 工具函数
└── logger.ts               # 日志系统
```

---

## 核心组件详解

### 1. Gateway 网关服务

**位置**: `src/gateway/`

Gateway 是 OpenClaw 的核心，提供 HTTP/WebSocket API 服务。

```
┌─────────────────────────────────────────────────────────────┐
│                    Gateway Server                            │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ HTTP Server │  │ WS Server   │  │ Control UI  │         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘         │
│         │                │                │                 │
│  ┌──────▼────────────────▼────────────────▼──────┐         │
│  │              Server Methods                    │         │
│  │  • chat        • cron        • sessions       │         │
│  │  • agent       • tasks       • nodes          │         │
│  │  • tools       • config      • health         │         │
│  └───────────────────────────────────────────────┘         │
│                          │                                   │
│  ┌───────────────────────▼───────────────────────┐         │
│  │              Channel Manager                   │         │
│  │  Telegram │ WhatsApp │ Discord │ Slack ...    │         │
│  └───────────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

**关键文件**:
- `server.impl.ts` - 服务器启动和生命周期管理
- `server-http.ts` - HTTP 端点处理
- `server-chat.ts` - 聊天消息处理
- `server-cron.ts` - Cron 集成
- `server-methods.ts` - RPC 方法注册

### 2. Agent 系统

**位置**: `src/agents/`

Agent 是 AI 交互的核心，处理与 LLM 的通信。

```
┌─────────────────────────────────────────────────────────────┐
│                      Agent System                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │           PI Embedded Runner                         │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │    │
│  │  │ Model Auth  │→ │ Tool Setup  │→ │ API Call    │  │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  │    │
│  │         ↓                                    ↓        │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │    │
│  │  │ Compaction  │← │ Tool Exec   │← │ Response    │  │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  │    │
│  └─────────────────────────────────────────────────────┘    │
│                          │                                   │
│  ┌───────────────────────▼───────────────────────┐         │
│  │              Tool System                       │         │
│  │  exec │ read │ write │ browser │ search ...   │         │
│  └───────────────────────────────────────────────┘         │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Subagent System                          │   │
│  │  spawn │ steer │ kill │ announce                     │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**关键文件**:
- `pi-embedded-runner/run.ts` - Agent 运行主逻辑
- `pi-embedded-subscribe.ts` - 响应流处理
- `pi-tools.ts` - 工具定义和注册
- `subagent-registry.ts` - 子 Agent 管理
- `model-selection.ts` - 模型选择
- `model-auth.ts` - API Key 管理

### 3. Tasks 后台任务

**位置**: `src/tasks/`

独立的异步任务执行系统。

```
┌─────────────────────────────────────────────────────────────┐
│                     Task Service                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Task Store (JSON)                       │    │
│  │  queued │ running │ completed │ failed │ cancelled  │    │
│  └─────────────────────────────────────────────────────┘    │
│                          │                                   │
│                          ▼                                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Worker Loop                             │    │
│  │  • Poll every 3s                                    │    │
│  │  • Max 3 concurrent tasks                           │    │
│  │  • Execute via isolated agent                       │    │
│  └─────────────────────────────────────────────────────┘    │
│                          │                                   │
│                          ▼                                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Event Broadcast                         │    │
│  │  created │ started │ finished                       │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**关键文件**:
- `service.ts` - TaskService 类实现
- `store.ts` - 任务持久化
- `types.ts` - 任务类型定义

### 4. Cron 定时任务

**位置**: `src/cron/`

基于时间的任务调度系统。

```
┌─────────────────────────────────────────────────────────────┐
│                     Cron Service                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Schedule Types                          │    │
│  │  • at: 一次性任务 (ISO timestamp)                    │    │
│  │  • every: 间隔任务 (everyMs)                        │    │
│  │  • cron: Cron 表达式 (expr + tz)                    │    │
│  └─────────────────────────────────────────────────────┘    │
│                          │                                   │
│                          ▼                                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Payload Types                           │    │
│  │  • systemEvent: 注入系统事件 (main session)         │    │
│  │  • agentTurn: 执行 Agent (isolated session)         │    │
│  └─────────────────────────────────────────────────────┘    │
│                          │                                   │
│                          ▼                                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Delivery Modes                          │    │
│  │  • none: 不通知                                      │    │
│  │  • announce: 发送到聊天                              │    │
│  │  • webhook: POST 回调                                │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**关键文件**:
- `service.ts` - CronService 类
- `service/ops.ts` - 操作实现
- `types.ts` - 类型定义
- `isolated-agent/` - 隔离执行

### 5. Channels 通道系统

**位置**: `src/channels/`

多通道消息接入系统。

```
┌─────────────────────────────────────────────────────────────┐
│                    Channel System                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                   Channel Registry                     │  │
│  │  telegram │ whatsapp │ discord │ slack │ signal ...  │  │
│  └───────────────────────────────────────────────────────┘  │
│                              │                               │
│                              ▼                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                   Channel Plugin                       │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │  │
│  │  │ onMessage   │  │ sendMessage │  │ gatewayMethods│  │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘   │  │
│  └───────────────────────────────────────────────────────┘  │
│                              │                               │
│                              ▼                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                   Dock System                          │  │
│  │  消息路由 │ 会话映射 │ 状态管理                        │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**支持的通道**:
- `telegram/` - Telegram Bot API
- `discord/` - Discord Bot
- `slack/` - Slack Socket Mode
- `signal/` - Signal CLI
- `whatsapp/` - WhatsApp Web
- `imessage/` - iMessage (BlueBubbles)
- `irc/` - IRC 协议
- `googlechat/` - Google Chat
- `line/` - LINE Messaging

### 6. Config 配置系统

**位置**: `src/config/`

配置加载、验证和管理。

```
┌─────────────────────────────────────────────────────────────┐
│                    Config System                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                Config Sources                          │  │
│  │  ~/.openclaw/config.json │ env vars │ CLI args        │  │
│  └───────────────────────────────────────────────────────┘  │
│                              │                               │
│                              ▼                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                Validation Layer                        │  │
│  │  JSON Schema │ Zod Schema │ Legacy Migration          │  │
│  └───────────────────────────────────────────────────────┘  │
│                              │                               │
│                              ▼                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                Config Structure                        │  │
│  │  agents │ gateway │ channels │ tools │ cron ...      │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**关键文件**:
- `io.ts` - 配置读写
- `schema.ts` - JSON Schema
- `zod-schema.ts` - Zod 验证
- `defaults.ts` - 默认值
- `types.*.ts` - 类型定义

---

## 数据流分析

### 1. 消息处理流程

```
用户消息
    │
    ▼
┌─────────────┐
│   Channel   │ (Telegram/Discord/WhatsApp...)
│  Plugin     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Dock      │ 路由到正确的 Session
│   System    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Session   │ 会话上下文管理
│   Manager   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Agent     │ PI Embedded Runner
│   Runner    │
│  ┌─────────┐│
│  │ History ││ 加载历史消息
│  │ Tools   ││ 准备工具
│  │ Model   ││ 选择模型
│  └─────────┘│
└──────┬──────┘
       │
       ▼
┌─────────────┐
│    LLM      │ (Claude/GPT/Gemini...)
│    API      │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Tool      │ 如果需要执行工具
│   Executor  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Response  │ 流式响应
│   Stream    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Channel   │ 发送回用户
│   Plugin    │
└─────────────┘
```

### 2. 后台任务执行流程

```
创建任务 (tasks_create)
    │
    ▼
┌─────────────┐
│ Task Store  │ status: queued
└──────┬──────┘
       │
       │ Worker Poll (3s interval)
       ▼
┌─────────────┐
│ TaskService │ 检查队列
│   tick()    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Isolated   │ 创建隔离 Session
│   Agent     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Agent      │ 执行任务
│  Execution  │ status: running
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Complete   │ status: completed/failed
│  Broadcast  │ 发送事件
└─────────────┘
```

### 3. 会话管理流程

```
Session Key 格式:
  channel:chat_id  (群聊)
  channel:user_id  (私聊)
  task:task_id     (任务)
  cron:job_id      (定时任务)

Session 存储:
  ~/.openclaw/sessions/
    agent:default/
      channel:telegram:123456.json
      task:abc123.json
```

---

## API 端点

### HTTP 端点

| 端点 | 方法 | 描述 |
|------|------|------|
| `/health` | GET | 健康检查 |
| `/v1/chat/completions` | POST | OpenAI 兼容 API |
| `/v1/responses` | POST | OpenResponses API |
| `/v1/models` | GET | 模型列表 |

### WebSocket 方法

| 方法 | 描述 |
|------|------|
| `chat` | 发送聊天消息 |
| `chat.abort` | 中止聊天 |
| `agent.run` | 运行 Agent |
| `sessions.list` | 列出会话 |
| `sessions.history` | 获取历史 |
| `sessions.send` | 发送到会话 |
| `sessions.spawn` | 创建子 Agent |
| `cron.list` | 列出定时任务 |
| `cron.add` | 添加定时任务 |
| `cron.run` | 手动运行 |
| `tasks.create` | 创建任务 |
| `tasks.list` | 列出任务 |
| `tasks.status` | 任务状态 |
| `nodes.list` | 列出节点 |
| `nodes.describe` | 节点详情 |
| `browser.*` | 浏览器控制 |
| `canvas.*` | 画布操作 |
| `gateway.config.get` | 获取配置 |
| `gateway.config.apply` | 应用配置 |
| `gateway.update.run` | 运行更新 |

---

## 扩展开发指南

### 1. 添加新的 Channel

```typescript
// src/channels/plugins/my-channel/index.ts

import type { ChannelPlugin } from "../types.plugin.js";

export const myChannelPlugin: ChannelPlugin = {
  id: "mychannel",
  meta: {
    label: "My Channel",
    docsPath: "/channels/mychannel",
    // ...
  },
  
  // Gateway 方法
  gatewayMethods: ["mychannel.action"],
  
  // 插件入口
  activate(context) {
    // 初始化逻辑
  },
  
  // 消息处理
  onMessage: async (message) => {
    // 处理接收的消息
  },
  
  // 发送消息
  sendMessage: async (params) => {
    // 发送消息到通道
  },
};
```

### 2. 添加新的 Tool

```typescript
// src/agents/tools/my-tool.ts

import type { AnyAgentTool } from "./pi-tools.types.js";

export function createMyTool(): AnyAgentTool {
  return {
    name: "my_tool",
    description: "My custom tool",
    parameters: {
      type: "object",
      properties: {
        param1: { type: "string", description: "参数1" },
      },
      required: ["param1"],
    },
    execute: async (params, context) => {
      // 工具实现
      return { result: "success" };
    },
  };
}
```

### 3. 添加新的 CLI 命令

```typescript
// src/cli/my-command.ts

import { Command } from "commander";

export function registerMyCommand(program: Command) {
  program
    .command("mycommand")
    .description("My custom command")
    .option("-v, --verbose", "详细输出")
    .action(async (options) => {
      // 命令实现
    });
}
```

### 4. 创建 Skill

```markdown
<!-- skills/my-skill/SKILL.md -->

# My Skill

## 描述
这个技能做什么...

## 触发条件
当用户说 XXX 时激活

## 使用说明
1. 步骤1
2. 步骤2

## 示例
...
```

### 5. 扩展配置 Schema

```typescript
// src/config/types.myfeature.ts

export interface MyFeatureConfig {
  enabled: boolean;
  option1?: string;
  option2?: number;
}

// src/config/zod-schema.myfeature.ts

import { z } from "zod";

export const myFeatureConfigSchema = z.object({
  enabled: z.boolean().default(false),
  option1: z.string().optional(),
  option2: z.number().optional(),
});
```

---

## 关键文件索引

### 入口和启动

| 文件 | 作用 |
|------|------|
| `index.ts` | 主入口，导出公共 API |
| `entry.ts` | CLI 入口，处理 Node 选项 |
| `cli/run-main.ts` | CLI 主运行逻辑 |
| `cli/program/build-program.ts` | 构建命令行程序 |

### Gateway 核心

| 文件 | 作用 |
|------|------|
| `gateway/server.impl.ts` | 服务器实现 |
| `gateway/server-http.ts` | HTTP 处理 |
| `gateway/server-chat.ts` | 聊天处理 |
| `gateway/client.ts` | WebSocket 客户端 |
| `gateway/auth.ts` | 认证逻辑 |

### Agent 核心

| 文件 | 作用 |
|------|------|
| `agents/pi-embedded-runner/run.ts` | Agent 运行 |
| `agents/pi-embedded-subscribe.ts` | 响应订阅 |
| `agents/pi-tools.ts` | 工具注册 |
| `agents/model-selection.ts` | 模型选择 |
| `agents/subagent-registry.ts` | 子 Agent |

### 任务系统

| 文件 | 作用 |
|------|------|
| `tasks/service.ts` | 任务服务 |
| `cron/service.ts` | Cron 服务 |
| `cron/isolated-agent/` | 隔离执行 |

### 通道系统

| 文件 | 作用 |
|------|------|
| `channels/registry.ts` | 通道注册 |
| `channels/dock.ts` | 消息路由 |
| `telegram/bot.ts` | Telegram 机器人 |
| `discord/bot.ts` | Discord 机器人 |

### 配置系统

| 文件 | 作用 |
|------|------|
| `config/io.ts` | 配置读写 |
| `config/schema.ts` | Schema 定义 |
| `config/defaults.ts` | 默认配置 |

---

## 设计模式

### 1. 依赖注入

```typescript
// 使用 deps 模式
const deps = createDefaultDeps();
const service = new TaskService({ deps, broadcast });
```

### 2. 事件广播

```typescript
// 广播到所有连接的客户端
broadcast("event.name", payload, { dropIfSlow: true });

// 发送到特定连接
broadcastToConnIds(connIds, "event.name", payload);
```

### 3. 插件架构

```typescript
// 插件注册
registry.register(channelPlugin);

// 插件激活
plugin.activate(context);
```

### 4. 工具组合

```typescript
// 工具通过 wrapper 组合功能
tool = wrapToolWithAbortSignal(tool, abortSignal);
tool = wrapToolWithBeforeToolCallHook(tool, hooks);
tool = wrapToolWorkspaceRootGuard(tool, workspaceRoot);
```

---

## 性能考虑

### 1. 并发控制

- Gateway: 每个 Session 独立处理
- Tasks: 最多 3 个并发任务
- Agent: 按 Lane 分组并发控制

### 2. 缓存策略

- Model Catalog: 启动时缓存
- Skills: 文件监听增量更新
- Session Store: 内存缓存 + 持久化

### 3. 流式响应

- 所有 Agent 响应使用流式 API
- 支持中止和超时
- 背压控制

---

## 测试策略

### 单元测试

```bash
# 运行所有单元测试
pnpm test

# 运行特定文件
pnpm test gateway/server.test.ts
```

### E2E 测试

```bash
# 运行 E2E 测试
pnpm test:e2e

# 需要真实 API 的测试
LIVE_API=1 pnpm test:live
```

### 测试约定

- `*.test.ts` - 单元测试
- `*.e2e.test.ts` - 端到端测试
- `*.live.test.ts` - 真实 API 测试
- `*-harness.ts` - 测试工具

---

## 调试技巧

### 1. 日志系统

```bash
# 启用子系统日志
OPENCLAW_LOG=gateway,agents,cron openclaw gateway start

# 详细日志
DEBUG=openclaw:* openclaw gateway start
```

### 2. 开发模式

```bash
# 热重载
pnpm dev

# 调试模式
NODE_OPTIONS=--inspect openclaw gateway start
```

### 3. 状态检查

```bash
# 健康检查
curl http://localhost:18789/health

# 配置验证
openclaw doctor

# 日志查看
openclaw logs
```

---

---

## 工具系统详解

### 内置工具列表

| 工具名 | 功能 | 文件位置 |
|--------|------|----------|
| `exec` | 执行 Shell 命令 | `agents/bash-tools.exec.ts` |
| `process` | 后台进程管理 | `agents/bash-tools.process.ts` |
| `read` | 读取文件 | `agents/pi-tools.read.ts` |
| `write` | 写入文件 | (来自 pi-coding-agent) |
| `edit` | 精确编辑文件 | (来自 pi-coding-agent) |
| `apply_patch` | 应用补丁 | `agents/apply-patch.ts` |
| `browser` | 浏览器控制 | `agents/tools/browser-tool.ts` |
| `web_search` | 网页搜索 | `agents/tools/web-search.ts` |
| `web_fetch` | 获取网页内容 | `agents/tools/web-fetch.ts` |
| `image` | 图片分析 | `agents/tools/image-tool.ts` |
| `message` | 发送消息 | `agents/tools/message-tool.ts` |
| `sessions_spawn` | 创建子 Agent | `agents/tools/sessions-spawn-tool.ts` |
| `sessions_send` | 发送到会话 | `agents/tools/sessions-send-tool.ts` |
| `sessions_list` | 列出会话 | `agents/tools/sessions-list-tool.ts` |
| `sessions_history` | 会话历史 | `agents/tools/sessions-history-tool.ts` |
| `subagents` | 子 Agent 管理 | `agents/tools/subagents-tool.ts` |
| `cron` | 定时任务管理 | `agents/tools/cron-tool.ts` |
| `tasks_create` | 创建后台任务 | `agents/tools/tasks-tool.ts` |
| `gateway` | Gateway 控制 | `agents/tools/gateway-tool.ts` |
| `nodes` | 节点管理 | `agents/tools/nodes-tool.ts` |
| `canvas` | 画布操作 | `agents/tools/canvas-tool.ts` |
| `memory_search` | 记忆搜索 | `agents/tools/memory-tool.ts` |
| `tts` | 文字转语音 | `agents/tools/tts-tool.ts` |

### 工具策略系统

```typescript
// 工具策略管道
interface ToolPolicyPipeline {
  steps: ToolPolicyStep[];
}

// 策略步骤
type ToolPolicyStep =
  | { kind: "builtin"; allow: string[] }
  | { kind: "config"; policy: ToolPolicy }
  | { kind: "subagent"; depth: number }
  | { kind: "group"; policy: GroupPolicy };
```

### 工具 Wrapper 模式

```typescript
// 工具通过多层 wrapper 增强
function wrapTool(tool: AnyAgentTool, context: ToolContext) {
  // 1. 参数标准化
  tool = wrapToolParamNormalization(tool);

  // 2. 工作空间根目录保护
  tool = wrapToolWorkspaceRootGuard(tool, workspaceRoot);

  // 3. 中止信号支持
  tool = wrapToolWithAbortSignal(tool, abortSignal);

  // 4. Hook 钩子
  tool = wrapToolWithBeforeToolCallHook(tool, hooks);

  return tool;
}
```

---

## Subagent 子 Agent 系统

### 架构概览

```
┌─────────────────────────────────────────────────────────────┐
│                    Subagent System                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                  Requester Session                     │  │
│  │  sessions_spawn({ task, agentId, model, ... })        │  │
│  └───────────────────────────────────────────────────────┘  │
│                              │                               │
│                              ▼                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Subagent Registry                         │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │ runId │ childSessionKey │ requesterSessionKey  │  │  │
│  │  │ task  │ createdAt       │ outcome              │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
│                              │                               │
│                              ▼                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Isolated Session                          │  │
│  │  独立的 Agent 运行环境                                 │  │
│  │  独立的上下文和工具集                                  │  │
│  └───────────────────────────────────────────────────────┘  │
│                              │                               │
│                              ▼                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Announce Flow                             │  │
│  │  完成后向请求者发送通知                                │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 子 Agent 操作

| 操作 | 描述 | 实现位置 |
|------|------|----------|
| `spawn` | 创建子 Agent | `subagent-spawn.ts` |
| `steer` | 引导子 Agent | `subagent-registry.ts` |
| `kill` | 终止子 Agent | `subagent-registry.ts` |
| `list` | 列出子 Agent | `subagents-tool.ts` |

### 深度限制

```typescript
// 子 Agent 嵌套深度控制
const MAX_SUBAGENT_DEPTH = 3;

function getSubagentDepth(sessionKey: string): number {
  // 从 session store 读取深度
  // 每层递增
}
```

---

## Heartbeat 心跳系统

### 概述

Heartbeat 系统允许 Agent 定期执行主动任务。

```typescript
// 心跳触发
interface HeartbeatEvent {
  kind: "heartbeat";
  sessionKey: string;
  timestamp: number;
}

// 心跳处理
async function handleHeartbeat(event: HeartbeatEvent) {
  // 1. 检查 HEARTBEAT.md
  // 2. 执行定期任务
  // 3. 返回 HEARTBEAT_OK 或任务结果
}
```

### 心跳配置

```json
{
  "agents": {
    "defaults": {
      "heartbeat": {
        "intervalMs": 1800000,  // 30分钟
        "activeHours": { "start": 8, "end": 23 }
      }
    }
  }
}
```

---

## Memory 记忆系统

### 概述

记忆系统提供长期和短期记忆支持。

```
┌─────────────────────────────────────────────────────────────┐
│                    Memory System                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Long-term Memory                          │  │
│  │  ~/.openclaw/workspace/MEMORY.md                       │  │
│  │  持久化的知识和偏好                                     │  │
│  └───────────────────────────────────────────────────────┘  │
│                              │                               │
│                              ▼                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Daily Memory                              │  │
│  │  ~/.openclaw/workspace/memory/YYYY-MM-DD.md           │  │
│  │  每日记录和事件                                         │  │
│  └───────────────────────────────────────────────────────┘  │
│                              │                               │
│                              ▼                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Memory Search                             │  │
│  │  语义搜索 (基于向量相似度)                             │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 记忆工具

```typescript
// memory_search 工具
{
  name: "memory_search",
  description: "搜索 MEMORY.md 和 memory/*.md",
  parameters: {
    query: { type: "string" },
    maxResults: { type: "number", default: 5 },
    minScore: { type: "number", default: 0.5 }
  }
}

// memory_get 工具
{
  name: "memory_get",
  description: "安全读取记忆文件片段",
  parameters: {
    path: { type: "string" },
    from: { type: "number" },
    lines: { type: "number" }
  }
}
```

---

## 插件系统

### 插件结构

```typescript
interface Plugin {
  id: string;
  version: string;

  // 生命周期
  activate?: (context: PluginContext) => void | Promise<void>;
  deactivate?: () => void | Promise<void>;

  // 扩展点
  gatewayMethods?: string[];
  tools?: AnyAgentTool[];
  channels?: ChannelPlugin[];
  hooks?: HookDefinition[];
}
```

### 插件注册

```typescript
// src/plugins/registry.ts
class PluginRegistry {
  plugins: Plugin[] = [];
  channels: ChannelPluginEntry[] = [];

  register(plugin: Plugin) {
    this.plugins.push(plugin);
    // 注册扩展点
  }
}
```

### Hook 系统

```typescript
// Hook 类型
type HookType =
  | "beforeToolCall"
  | "afterToolCall"
  | "beforeAgentRun"
  | "afterAgentRun"
  | "onMessage"
  | "onResponse";

// Hook 配置
interface HookConfig {
  type: HookType;
  handler: string | HookHandler;
  priority?: number;
}
```

---

## 节点系统 (Nodes)

### 概述

节点系统支持远程设备连接和控制。

```
┌─────────────────────────────────────────────────────────────┐
│                    Node System                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Node Registry                             │  │
│  │  管理已配对的设备                                      │  │
│  └───────────────────────────────────────────────────────┘  │
│                              │                               │
│              ┌───────────────┼───────────────┐              │
│              ▼               ▼               ▼              │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐     │
│  │   iOS Node    │ │ Android Node  │ │ Desktop Node  │     │
│  │  (相机/位置)  │ │ (相机/位置)   │ │ (Shell/文件)  │     │
│  └───────────────┘ └───────────────┘ └───────────────┘     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 节点操作

| 操作 | 描述 |
|------|------|
| `status` | 节点状态 |
| `describe` | 节点详情 |
| `camera_snap` | 拍照 |
| `camera_clip` | 录像 |
| `screen_record` | 屏幕录制 |
| `location_get` | 获取位置 |
| `run` | 执行命令 |
| `invoke` | 调用功能 |
| `notify` | 发送通知 |

---

## 常见问题排查

### 1. Gateway 启动失败

```bash
# 检查端口占用
lsof -i :18789

# 检查配置
openclaw doctor

# 查看详细日志
DEBUG=* openclaw gateway start
```

### 2. 消息不响应

```bash
# 检查通道状态
openclaw channels status

# 检查会话
openclaw sessions list

# 检查 Agent 日志
openclaw logs --filter agents
```

### 3. 任务执行失败

```bash
# 查看任务状态
openclaw tasks list

# 查看错误日志
openclaw logs --filter tasks
```

### 4. 子 Agent 问题

```bash
# 列出子 Agent
openclaw sessions list --kinds isolated

# 查看子 Agent 日志
openclaw logs --filter subagent
```

---

## 更新日志

- **2026-02-19**: 初始版本，基于 OpenClaw 源码分析
  - 完整目录结构分析
  - 6 大核心组件详解
  - 数据流和架构图
  - API 端点索引
  - 扩展开发指南
  - 工具系统详解
  - Subagent 系统
  - Memory 系统
  - 插件系统
  - 节点系统
  - 问题排查指南
