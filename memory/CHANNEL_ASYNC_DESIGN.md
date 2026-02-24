# Channel 异步处理架构设计

## 问题分析

### 1. 当前流程是否会阻塞？

**结论：是的，存在潜在阻塞问题。**

#### 关键代码路径分析

1. **Channel 消息入口**（以 Feishu 为例）
   - `/extensions/feishu/src/bot.ts` - `handleFeishuMessage()`
   - 该函数会 **await** `dispatchReplyFromConfig()`

```typescript
// bot.ts 第 967 行
const { queuedFinal, counts } = await core.channel.reply.dispatchReplyFromConfig({
  ctx: ctxPayload,
  cfg,
  dispatcher,
  replyOptions,
});
```

2. **dispatchReplyFromConfig** 
   - `/src/auto-reply/reply/dispatch-from-config.ts`
   - 调用 `getReplyFromConfig()` 获取回复
   - 这个调用会触发完整的 agent 执行

3. **Agent 执行**
   - `getReplyFromConfig()` → `getReply()` → `runEmbeddedPiAgent()`
   - 这是一个 **同步等待** 的过程
   - 执行时间可能从几秒到几分钟不等

4. **超时机制**
   - `/src/agents/timeout.ts` - `resolveAgentTimeoutMs()`
   - 默认超时：`cfg.agents?.timeoutSeconds ?? 600`（10分钟）
   - **问题**：超时只是中断执行，不会将任务转移到后台

#### 阻塞影响

| 场景 | 影响 |
|------|------|
| WebSocket 连接 | 长时间无响应可能导致连接断开 |
| Webhook 模式 | Feishu 可能重试发送消息（超时重试） |
| 用户体验 | 用户等待时间长，无进度反馈 |
| 系统资源 | 长时间占用 event loop |

### 2. 长任务如何处理？

#### 现有机制

1. **超时中断**
   - `AbortController` 机制
   - 超时后中断 agent 执行
   - 用户收到部分结果或错误

2. **TaskService（后台任务）**
   - `/src/tasks/service.ts`
   - 支持创建后台任务
   - 任务在隔离 session 中执行
   - 完成后通过 broadcast 发送事件

3. **Cron Isolated Agent**
   - `/src/cron/isolated-agent/run.ts`
   - 支持在隔离环境中执行 agent
   - 支持结果回传

#### 问题

- **没有自动检测长任务的机制**
- **没有自动将长任务分派到后台的逻辑**
- **缺少进度同步事件机制**

### 3. 事件广播机制

#### 现有组件

1. **Agent 事件系统**
   - `/src/infra/agent-events.ts`
   - `emitAgentEvent()` - 发送 agent 事件
   - `onAgentEvent()` - 订阅 agent 事件

2. **Gateway 广播**
   - `/src/gateway/server-broadcast.ts`
   - `broadcast()` - 广播到所有 WS 客户端
   - `broadcastToConnIds()` - 定向广播

3. **Chat 事件处理**
   - `/src/gateway/server-chat.ts`
   - `createAgentEventHandler()` - 处理 agent 事件
   - 发送 `delta`、`final`、`error` 状态

---

## 目标架构设计

### 核心原则

1. **快速响应**：channel 消息收到后立即返回确认
2. **后台执行**：长任务自动分派到后台执行
3. **进度同步**：通过事件实时同步执行进度
4. **优雅降级**：后台任务失败时能通知用户

### 架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                      Channel Message Flow                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Feishu/Telegram/etc.                                            │
│       │                                                          │
│       ▼                                                          │
│  ┌───────────────┐    ┌─────────────────┐                       │
│  │ handleXxxMsg  │───►│ TaskClassifier  │                       │
│  └───────────────┘    └────────┬────────┘                       │
│                                │                                 │
│              ┌─────────────────┴─────────────────┐              │
│              ▼                                   ▼              │
│     ┌────────────────┐                ┌──────────────────┐      │
│     │  Quick Task    │                │  Long Task       │      │
│     │  (inline)      │                │  (background)    │      │
│     └───────┬────────┘                └────────┬─────────┘      │
│             │                                  │                 │
│             ▼                                  ▼                 │
│     ┌────────────────┐                ┌──────────────────┐      │
│     │ dispatchReply  │                │ TaskService      │      │
│     │ (await)        │                │ .createTask()    │      │
│     └───────┬────────┘                └────────┬─────────┘      │
│             │                                  │                 │
│             ▼                                  ▼                 │
│     ┌────────────────┐                ┌──────────────────┐      │
│     │ Reply to User  │                │ runCronIsolated  │      │
│     └────────────────┘                │ AgentTurn        │      │
│                                         └────────┬─────────┘      │
│                                                  │                 │
│                                                  ▼                 │
│                                         ┌──────────────────┐      │
│                                         │ Progress Events  │      │
│                                         │ (broadcast)      │      │
│                                         └────────┬─────────┘      │
│                                                  │                 │
│                                                  ▼                 │
│                                         ┌──────────────────┐      │
│                                         │ Notify User      │      │
│                                         │ (via channel)    │      │
│                                         └──────────────────┘      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 具体实现步骤

### Phase 1: 任务分类器

#### 1.1 创建任务分类模块

**文件**: `/src/auto-reply/task-classifier.ts`

```typescript
import type { OpenClawConfig } from "../config/config.js";
import type { FinalizedMsgContext } from "./templating.js";

export type TaskClassification = {
  kind: "quick" | "long";
  estimatedSeconds?: number;
  reason?: string;
};

export type TaskClassifierOptions = {
  cfg: OpenClawConfig;
  ctx: FinalizedMsgContext;
};

/**
 * 分类任务类型，决定是立即执行还是后台执行
 */
export function classifyTask(options: TaskClassifierOptions): TaskClassification {
  const { cfg, ctx } = options;
  
  // 1. 检查命令类型
  const commandBody = ctx.CommandBody ?? ctx.BodyForCommands ?? "";
  
  // 快速命令列表（立即执行）
  const quickPatterns = [
    /^\/status\b/i,
    /^\/help\b/i,
    /^\/model\b/i,
    /^\/clear\b/i,
    /^\/stop\b/i,
    /^\/abort\b/i,
  ];
  
  for (const pattern of quickPatterns) {
    if (pattern.test(commandBody)) {
      return { kind: "quick", reason: "quick-command" };
    }
  }
  
  // 2. 检查是否是查询类（通常较快）
  const queryPatterns = [
    /^(what|who|when|where|is|are|can|do|does)\b/i,
    /^\?/,
  ];
  
  for (const pattern of queryPatterns) {
    if (pattern.test(commandBody.trim())) {
      return { kind: "quick", estimatedSeconds: 30, reason: "query" };
    }
  }
  
  // 3. 检查是否明显是长任务
  const longTaskPatterns = [
    /write\s+(a\s+)?(long\s+)?(article|essay|report|story|novel)/i,
    /analyze\s+(all|the\s+entire|complete)/i,
    /search\s+and\s+(summarize|compile|collect)/i,
    /create\s+(a\s+)?(comprehensive|detailed|full)/i,
    /review\s+(all|every|the\s+whole)/i,
  ];
  
  for (const pattern of longTaskPatterns) {
    if (pattern.test(commandBody)) {
      return { kind: "long", estimatedSeconds: 300, reason: "complex-task" };
    }
  }
  
  // 4. 基于消息长度估计
  const messageLength = commandBody.length;
  if (messageLength > 2000) {
    return { kind: "long", estimatedSeconds: 180, reason: "long-message" };
  }
  
  // 5. 检查是否有附件（通常需要更长时间）
  if (ctx.Images && ctx.Images.length > 0) {
    return { kind: "quick", estimatedSeconds: 60, reason: "image-analysis" };
  }
  
  // 6. 默认：短任务
  return { kind: "quick", estimatedSeconds: 30, reason: "default" };
}

/**
 * 检查是否应该强制后台执行
 */
export function shouldForceBackground(options: TaskClassifierOptions): boolean {
  const { cfg, ctx } = options;
  
  // 1. 检查 session 配置
  // 可以在 session entry 中设置 `backgroundMode: true`
  
  // 2. 检查 channel 配置
  // 某些 channel 可能要求所有任务后台执行
  
  // 3. 检查系统负载
  // 如果系统负载高，可以强制后台执行
  
  return false;
}
```

#### 1.2 配置支持

在 `OpenClawConfig` 中添加：

```typescript
// /src/config/types.ts
export type TaskClassifierConfig = {
  /** 启用自动任务分类 */
  enabled?: boolean;
  /** 超过此时长的任务自动转为后台执行（秒） */
  backgroundThresholdSeconds?: number;
  /** 快速命令模式列表 */
  quickCommandPatterns?: string[];
  /** 长任务模式列表 */
  longTaskPatterns?: string[];
};

export type AgentsConfig = {
  // ... existing fields
  taskClassifier?: TaskClassifierConfig;
};
```

### Phase 2: 后台任务调度

#### 2.1 扩展 TaskService

**文件**: `/src/tasks/service.ts`

添加从 channel 消息创建任务的方法：

```typescript
export class TaskService {
  // ... existing code
  
  /**
   * 从 channel 消息创建后台任务
   */
  createTaskFromChannel(params: {
    ctx: FinalizedMsgContext;
    cfg: OpenClawConfig;
    classification: TaskClassification;
  }): Task {
    const { ctx, cfg, classification } = params;
    
    // 生成任务描述
    const taskMessage = this.buildTaskMessage(ctx, classification);
    
    return this.createTask({
      message: taskMessage,
      agentId: resolveSessionAgentId({ sessionKey: ctx.SessionKey, config: cfg }),
      model: ctx.ModelOverride,
      thinking: ctx.ThinkingLevel,
      timeoutSeconds: cfg.agents?.timeoutSeconds ?? 600,
      originSessionKey: ctx.SessionKey,
      originChannel: ctx.OriginatingChannel ?? ctx.Surface,
      originTo: ctx.OriginatingTo ?? ctx.To,
    });
  }
  
  private buildTaskMessage(
    ctx: FinalizedMsgContext,
    classification: TaskClassification
  ): string {
    const parts: string[] = [];
    
    // 添加上下文
    if (ctx.SenderName) {
      parts.push(`From: ${ctx.SenderName}`);
    }
    if (ctx.GroupSubject) {
      parts.push(`Group: ${ctx.GroupSubject}`);
    }
    
    // 添加原始消息
    parts.push('');
    parts.push(ctx.BodyForCommands ?? ctx.Body ?? '');
    
    // 添加预估时间提示
    if (classification.estimatedSeconds) {
      const minutes = Math.ceil(classification.estimatedSeconds / 60);
      parts.push('');
      parts.push(`[Estimated time: ~${minutes} minute${minutes > 1 ? 's' : ''}]`);
    }
    
    return parts.join('\n');
  }
}
```

#### 2.2 进度事件类型

**文件**: `/src/tasks/types.ts`

```typescript
export type TaskProgressEvent = {
  taskId: string;
  sessionKey?: string;
  progress: number; // 0-100
  stage: string;
  message?: string;
  timestamp: number;
};

export type TaskEvent =
  | { action: "created"; taskId: string; task: Task }
  | { action: "started"; taskId: string }
  | { action: "progress"; taskId: string; progress: TaskProgressEvent }
  | { action: "finished"; taskId: string; status: "completed" | "failed" | "cancelled"; result?: string; error?: string; durationMs?: number; totalTokens?: number }
  | { action: "updated"; taskId: string; patch: Partial<Task> };
```

### Phase 3: 消息处理流程修改

#### 3.1 修改 dispatchReplyFromConfig

**文件**: `/src/auto-reply/reply/dispatch-from-config.ts`

```typescript
import { classifyTask, shouldForceBackground, type TaskClassification } from "../task-classifier.js";

export type DispatchFromConfigOptions = {
  // ... existing options
  /** 强制后台执行 */
  forceBackground?: boolean;
  /** 后台任务回调 */
  onTaskQueued?: (taskId: string, classification: TaskClassification) => void;
};

export async function dispatchReplyFromConfig(params: {
  ctx: FinalizedMsgContext;
  cfg: OpenClawConfig;
  dispatcher: ReplyDispatcher;
  replyOptions?: Omit<GetReplyOptions, "onToolResult" | "onBlockReply">;
  replyResolver?: typeof getReplyFromConfig;
  taskService?: TaskService;
  dispatchOptions?: DispatchFromConfigOptions;
}): Promise<DispatchFromConfigResult> {
  const { ctx, cfg, dispatcher, taskService, dispatchOptions } = params;
  
  // 1. 分类任务
  const classification = classifyTask({ cfg, ctx });
  const forceBackground = dispatchOptions?.forceBackground ?? shouldForceBackground({ cfg, ctx });
  const threshold = cfg.agents?.taskClassifier?.backgroundThresholdSeconds ?? 120;
  
  // 2. 决定执行模式
  const shouldRunInBackground = 
    forceBackground ||
    (cfg.agents?.taskClassifier?.enabled !== false && 
     classification.kind === "long" &&
     (classification.estimatedSeconds ?? 0) > threshold);
  
  if (shouldRunInBackground && taskService) {
    // 3. 后台执行模式
    return dispatchToBackground({
      ctx,
      cfg,
      dispatcher,
      taskService,
      classification,
      onTaskQueued: dispatchOptions?.onTaskQueued,
    });
  }
  
  // 4. 内联执行模式（现有逻辑）
  return dispatchInline(params);
}

async function dispatchToBackground(params: {
  ctx: FinalizedMsgContext;
  cfg: OpenClawConfig;
  dispatcher: ReplyDispatcher;
  taskService: TaskService;
  classification: TaskClassification;
  onTaskQueued?: (taskId: string, classification: TaskClassification) => void;
}): Promise<DispatchFromConfigResult> {
  const { ctx, cfg, dispatcher, taskService, classification, onTaskQueued } = params;
  
  // 1. 创建后台任务
  const task = taskService.createTaskFromChannel({
    ctx,
    cfg,
    classification,
  });
  
  // 2. 立即发送确认消息
  const ackMessage = buildAckMessage(task, classification);
  await dispatcher.deliver(ackMessage, { kind: "final" });
  
  // 3. 通知调用者
  onTaskQueued?.(task.id, classification);
  
  return {
    queuedFinal: true,
    counts: { final: 1, delta: 0, tool: 0, reply: 0 },
    taskId: task.id,
  };
}

function buildAckMessage(
  task: Task,
  classification: TaskClassification
): ReplyPayload {
  const estimatedMinutes = classification.estimatedSeconds 
    ? Math.ceil(classification.estimatedSeconds / 60)
    : null;
  
  let text = `✅ 任务已加入后台队列\n\n`;
  text += `📋 任务ID: \`${task.id.slice(0, 8)}\`\n`;
  
  if (estimatedMinutes) {
    text += `⏱️ 预计耗时: ~${estimatedMinutes} 分钟\n`;
  }
  
  text += `\n我会持续通知你进度，完成后会在这里回复你。`;
  
  return { text };
}
```

#### 3.2 修改 Channel 处理器

**文件**: `/extensions/feishu/src/bot.ts`

```typescript
import { TaskService } from "../../../src/tasks/service.js";

// 在 handleFeishuMessage 中添加 taskService 支持
export async function handleFeishuMessage(params: {
  cfg: ClawdbotConfig;
  event: FeishuMessageEvent;
  botOpenId?: string;
  runtime?: RuntimeEnv;
  chatHistories?: Map<string, HistoryEntry[]>;
  accountId?: string;
  taskService?: TaskService; // 新增
}): Promise<void> {
  // ... existing code ...
  
  // 修改 dispatch 调用
  const { queuedFinal, counts, taskId } = await core.channel.reply.dispatchReplyFromConfig({
    ctx: ctxPayload,
    cfg,
    dispatcher,
    replyOptions,
    taskService: params.taskService, // 传递 taskService
    dispatchOptions: {
      onTaskQueued: (id, classification) => {
        log(`feishu[${account.accountId}]: task queued: ${id} (${classification.reason})`);
      },
    },
  });
  
  // ... rest of code ...
}
```

### Phase 4: 进度同步机制

#### 4.1 Agent 事件到 Channel 的桥接

**文件**: `/src/tasks/progress-bridge.ts`

```typescript
import type { TaskService } from "./service.js";
import type { AgentEventPayload } from "../infra/agent-events.js";
import { onAgentEvent } from "../infra/agent-events.js";

export type ProgressBridgeOptions = {
  taskService: TaskService;
  sendToChannel: (params: {
    channel: string;
    to: string;
    message: string;
  }) => Promise<void>;
  progressIntervalMs?: number;
};

/**
 * 将后台任务的进度同步到原 channel
 */
export function createProgressBridge(options: ProgressBridgeOptions) {
  const { taskService, sendToChannel, progressIntervalMs = 30000 } = options;
  
  const taskProgress = new Map<string, {
    lastUpdate: number;
    lastMessage: string;
    stage: string;
  }>();
  
  // 监听 agent 事件
  const unsubscribe = onAgentEvent((evt: AgentEventPayload) => {
    // 查找对应的 task
    const task = findTaskByRunId(evt.runId);
    if (!task) return;
    
    // 更新进度
    const existing = taskProgress.get(task.id) ?? {
      lastUpdate: 0,
      lastMessage: "",
      stage: "",
    };
    
    // 根据事件类型更新
    if (evt.stream === "tool") {
      existing.stage = evt.data?.name ?? existing.stage;
    } else if (evt.stream === "assistant") {
      const text = evt.data?.text ?? "";
      if (text.length > existing.lastMessage.length) {
        existing.lastMessage = text.slice(-200); // 保留最后 200 字符
      }
    }
    
    existing.lastUpdate = Date.now();
    taskProgress.set(task.id, existing);
  });
  
  // 定期检查是否需要发送进度更新
  const interval = setInterval(async () => {
    const now = Date.now();
    
    for (const [taskId, progress] of taskProgress) {
      if (now - progress.lastUpdate < progressIntervalMs) continue;
      
      const task = taskService.getTask(taskId);
      if (!task || task.status !== "running") {
        taskProgress.delete(taskId);
        continue;
      }
      
      // 发送进度更新
      if (task.originChannel && task.originTo) {
        const message = buildProgressMessage(task, progress);
        await sendToChannel({
          channel: task.originChannel,
          to: task.originTo,
          message,
        }).catch(() => {});
      }
    }
  }, progressIntervalMs);
  
  return {
    unsubscribe: () => {
      unsubscribe();
      clearInterval(interval);
    },
  };
}

function findTaskByRunId(runId: string): Task | undefined {
  // 实现：通过 runId 查找对应的 task
  // 需要在 TaskService 中维护 runId -> taskId 的映射
  return undefined;
}

function buildProgressMessage(task: Task, progress: {
  stage: string;
  lastMessage: string;
}): string {
  let msg = `🔄 任务进行中...\n\n`;
  msg += `📋 任务: ${task.id.slice(0, 8)}\n`;
  
  if (progress.stage) {
    msg += `🔧 当前操作: ${progress.stage}\n`;
  }
  
  if (progress.lastMessage) {
    const preview = progress.lastMessage.slice(0, 100);
    msg += `\n> ${preview}${progress.lastMessage.length > 100 ? '...' : ''}`;
  }
  
  return msg;
}
```

#### 4.2 任务完成通知

**文件**: `/src/tasks/completion-notify.ts`

```typescript
import type { Task, TaskEvent } from "./types.js";
import type { TaskService } from "./service.js";

export type CompletionNotifierOptions = {
  taskService: TaskService;
  sendToChannel: (params: {
    channel: string;
    to: string;
    message: string;
  }) => Promise<void>;
};

/**
 * 任务完成时发送通知
 */
export function createCompletionNotifier(options: CompletionNotifierOptions) {
  const { taskService, sendToChannel } = options;
  
  // 监听 task 事件
  taskService.onEvent((evt: TaskEvent) => {
    if (evt.action !== "finished") return;
    
    const task = taskService.getTask(evt.taskId);
    if (!task?.originChannel || !task?.originTo) return;
    
    const message = buildCompletionMessage(task, evt);
    
    sendToChannel({
      channel: task.originChannel,
      to: task.originTo,
      message,
    }).catch((err) => {
      console.error(`Failed to send completion notification: ${err}`);
    });
  });
}

function buildCompletionMessage(task: Task, evt: TaskEvent): string {
  if (evt.action !== "finished") return "";
  
  if (evt.status === "completed") {
    let msg = `✅ 任务完成！\n\n`;
    msg += `📋 任务ID: ${task.id.slice(0, 8)}\n`;
    
    if (evt.durationMs) {
      const seconds = Math.round(evt.durationMs / 1000);
      msg += `⏱️ 耗时: ${seconds} 秒\n`;
    }
    
    if (evt.totalTokens) {
      msg += `📊 Tokens: ${evt.totalTokens.toLocaleString()}\n`;
    }
    
    if (task.result) {
      msg += `\n---\n${task.result}`;
    }
    
    return msg;
  } else if (evt.status === "failed") {
    let msg = `❌ 任务失败\n\n`;
    msg += `📋 任务ID: ${task.id.slice(0, 8)}\n`;
    
    if (evt.error) {
      msg += `\n错误: ${evt.error}`;
    }
    
    return msg;
  } else {
    return `⏹️ 任务已取消\n\n📋 任务ID: ${task.id.slice(0, 8)}`;
  }
}
```

---

## 测试方案

### 1. 单元测试

```typescript
// /src/auto-reply/task-classifier.test.ts
import { classifyTask } from "./task-classifier.js";
import type { FinalizedMsgContext } from "./templating.js";

describe("task-classifier", () => {
  it("should classify quick commands", () => {
    const ctx = { CommandBody: "/status" } as FinalizedMsgContext;
    const result = classifyTask({ cfg: {}, ctx });
    expect(result.kind).toBe("quick");
    expect(result.reason).toBe("quick-command");
  });
  
  it("should classify long tasks", () => {
    const ctx = { 
      CommandBody: "write a comprehensive report about AI" 
    } as FinalizedMsgContext;
    const result = classifyTask({ cfg: {}, ctx });
    expect(result.kind).toBe("long");
    expect(result.reason).toBe("complex-task");
  });
  
  it("should estimate based on message length", () => {
    const longMessage = "x".repeat(3000);
    const ctx = { CommandBody: longMessage } as FinalizedMsgContext;
    const result = classifyTask({ cfg: {}, ctx });
    expect(result.kind).toBe("long");
    expect(result.estimatedSeconds).toBeGreaterThan(60);
  });
});
```

### 2. 集成测试

```typescript
// /src/tasks/integration.test.ts
import { TaskService } from "./service.js";
import { classifyTask } from "../auto-reply/task-classifier.js";

describe("TaskService integration", () => {
  let taskService: TaskService;
  
  beforeEach(() => {
    taskService = new TaskService({
      deps: mockDeps,
      broadcast: mockBroadcast,
    });
  });
  
  it("should create background task from channel message", async () => {
    const ctx = {
      SessionKey: "test:session",
      CommandBody: "analyze all files in the project",
      OriginatingChannel: "feishu",
      OriginatingTo: "user:abc123",
    } as FinalizedMsgContext;
    
    const classification = classifyTask({ cfg: {}, ctx });
    expect(classification.kind).toBe("long");
    
    const task = taskService.createTaskFromChannel({
      ctx,
      cfg: {},
      classification,
    });
    
    expect(task.status).toBe("queued");
    expect(task.originChannel).toBe("feishu");
    expect(task.originTo).toBe("user:abc123");
  });
});
```

### 3. 端到端测试

```typescript
// /tests/e2e/background-task-flow.test.ts
describe("Background task flow", () => {
  it("should dispatch long task to background and notify completion", async () => {
    // 1. 发送长任务消息
    const response = await sendFeishuMessage({
      chatId: "test-chat",
      message: "write a detailed analysis of the crypto market",
    });
    
    // 2. 应该立即收到确认
    expect(response.ack).toBe(true);
    expect(response.taskId).toBeDefined();
    
    // 3. 等待任务完成
    const completion = await waitForTaskCompletion(response.taskId, {
      timeout: 120000,
    });
    
    // 4. 应该收到完成通知
    expect(completion.status).toBe("completed");
    expect(completion.notificationSent).toBe(true);
  });
});
```

---

## 实施路线图

### Phase 1（1-2 天）
- [ ] 实现 `task-classifier.ts`
- [ ] 添加配置支持
- [ ] 编写单元测试

### Phase 2（2-3 天）
- [ ] 扩展 `TaskService`
- [ ] 实现 `createTaskFromChannel()`
- [ ] 修改 `dispatchReplyFromConfig()`

### Phase 3（2-3 天）
- [ ] 实现 `progress-bridge.ts`
- [ ] 实现 `completion-notify.ts`
- [ ] 修改 channel 处理器

### Phase 4（1-2 天）
- [ ] 集成测试
- [ ] 端到端测试
- [ ] 文档更新

---

## 风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 任务分类不准确 | 用户体验下降 | 提供手动切换选项 |
| 后台任务积压 | 系统响应变慢 | 实现任务队列限制 |
| 进度更新频繁 | Channel 被刷屏 | 添加节流机制 |
| 通知发送失败 | 用户无反馈 | 实现重试机制 |

---

## 附录：关键文件列表

| 文件路径 | 用途 |
|----------|------|
| `/src/auto-reply/task-classifier.ts` | 任务分类器（新增） |
| `/src/auto-reply/reply/dispatch-from-config.ts` | 消息分发（修改） |
| `/src/tasks/service.ts` | 任务服务（扩展） |
| `/src/tasks/progress-bridge.ts` | 进度同步（新增） |
| `/src/tasks/completion-notify.ts` | 完成通知（新增） |
| `/extensions/feishu/src/bot.ts` | Feishu 消息处理（修改） |
| `/src/gateway/server-methods/chat.ts` | Chat 处理（参考） |
| `/src/gateway/server-chat.ts` | Agent 事件处理（参考） |


<!-- 🤪 混沌代理路过 -->
<!-- 一切皆是文件，除了这个文件，它是混沌。 -->
<!-- 在码农的世界里，咖啡是生命之源。☕ -->
<!-- 🎭 混沌结束 -->
