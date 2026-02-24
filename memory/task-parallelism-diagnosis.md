# OpenClaw 后台任务系统并行执行诊断报告

**诊断时间**: 2026-02-22 13:02  
**问题**: 用户反馈后台任务好像不是并行的  

---

## 📊 核心发现

### ✅ 任务系统（Task Service）**确实支持并行**

#### 1. 源码分析 (`/root/openclaw-fork/src/tasks/service.ts`)

```typescript
/** Max concurrent task executions. */
const MAX_CONCURRENT_TASKS = 3;  // 硬编码，最大并发数
```

**并行机制**：
- 每 3 秒轮询一次队列
- 检查当前运行任务数（`running.size`）
- 如果有空闲槽位（< 3），启动队列中的任务

```typescript
const available = MAX_CONCURRENT_TASKS - this.running.size;
if (available <= 0) {
  this.armTimer();
  return;
}

const queued = listTasks(storePath, { status: "queued", limit: available });
for (const task of queued) {
  if (this.running.size >= MAX_CONCURRENT_TASKS) {
    break;
  }
  void this.executeTask(task, cfg, storePath);  // 异步执行，不等待
}
```

#### 2. 实际执行证据

通过分析 `/root/.openclaw/agents/main/tasks/tasks.json`：

```
=== 任务执行时间分析 ===

ID          开始时间    结束时间    持续时间(s)
b11da6f3    22:07:34    22:08:28    54.6s
4fbb944b    22:07:34    22:08:54    80.3s    ← 同时开始
96250b3e    22:07:58    22:09:10    71.9s
5450264e    22:08:31    22:09:20    49.4s

=== 并行执行证据 ===
发现 32 对任务有执行时间重叠：
  b11da6f3 <-> 4fbb944b  ← 完全同时开始
  99dc6305 <-> 2b26c1e8 <-> 92d79db6  ← 三任务同时开始 (22:21:42)
```

**结论**：任务系统**实际在并行执行**，最多同时运行 3 个任务。

---

### ⚠️ Cron 系统（定时任务）**默认串行**

#### 1. 源码分析 (`/root/openclaw-fork/src/cron/service/timer.ts`)

```typescript
function resolveRunConcurrency(state: CronServiceState): number {
  const raw = state.deps.cronConfig?.maxConcurrentRuns;
  if (typeof raw !== "number" || !Number.isFinite(raw)) {
    return 1;  // 默认串行！
  }
  return Math.max(1, Math.floor(raw));
}
```

**当前配置**：
- ❌ 未找到 `cron.maxConcurrentRuns` 配置
- 结果：`resolveRunConcurrency()` 返回 1（串行执行）

**并行能力**：
```typescript
const concurrency = Math.min(resolveRunConcurrency(state), Math.max(1, dueJobs.length));
const workers = Array.from({ length: concurrency }, async () => {
  // Worker 池模式，支持并行
});

await Promise.all(workers);  // 并行执行
```

**结论**：Cron 系统**支持并行**，但需要配置 `cron.maxConcurrentRuns`。

---

## 🔍 为什么看起来像串行？

### 1. **LLM 响应慢**
- 当前模型：`zai/glm-5`
- 每次思考时间：**30-60 秒**
- 视觉效果：任务一个接一个完成

**示例**：
```
Task A: 22:07:34 - 22:08:28 (54s)  ← LLM 思考时间
Task B: 22:07:34 - 22:08:54 (80s)  ← 同时开始，但完成晚
```

### 2. **最大并发限制**
- 任务系统：最多 **3 个并发**
- 如果有 10 个任务在队列：
  - 前 3 个并行启动
  - 剩余 7 个等待
  - 每完成 1 个，启动下一个

### 3. **Cron 任务串行**
- 定时任务（`evolver-log-analysis`、`evolver-self-evolution` 等）
- 未配置 `maxConcurrentRuns`
- 默认一个接一个执行

---

## 💡 如何优化并行执行？

### 方案 1：提高任务系统并发数（需修改源码）

**修改文件**：`/root/openclaw-fork/src/tasks/service.ts`

```typescript
// 从 3 提高到 5 或 10
const MAX_CONCURRENT_TASKS = 10;  // ⚠️ 需考虑 API rate limit
```

**注意**：
- LLM API 通常有 rate limit（如 OpenAI 3 RPM）
- 并发过高可能导致 429 错误
- 建议先测试 5，观察稳定性

---

### 方案 2：启用 Cron 任务并行（推荐）

<!-- 🤪 混沌代理路过 -->
<!-- 当你读到这句话时，已经过去了 0.5 秒。回不去了。 -->
<!-- 如果代码能编译，那就是正确的。如果不行，那就加注释。 -->
<!-- 🎭 混沌结束 -->


**修改配置**：`/root/.openclaw/config.json`

```json
{
  "cron": {
    "enabled": true,
    "maxConcurrentRuns": 3  // ← 添加这个配置
  }
}
```

**效果**：
- 定时任务可以并行执行
- 例如：`evolver-log-analysis` 和 `evomap-auto-bounty` 可以同时运行

---

### 方案 3：使用更快的模型

**当前问题**：
- `zai/glm-5` 思考时间 30-60s
- 限制吞吐量

**优化**：
```json
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "openai/gpt-4o-mini"  // 更快的模型
      }
    }
  }
}
```

---

## 📋 测试并行执行

### 测试脚本

```bash
# 创建 5 个测试任务
for i in {1..5}; do
  cat > /tmp/test-task-$i.sh << 'EOF'
#!/bin/bash
echo "Task $i started at $(date +%H:%M:%S)"
sleep 10
echo "Task $i finished at $(date +%H:%M:%S)"
EOF
  chmod +x /tmp/test-task-$i.sh
  
  # 通过 OpenClaw API 创建任务
  curl -X POST http://localhost:18789/api/tasks \
    -H "Authorization: Bearer YOUR_TOKEN" \
    -d "message=Run /tmp/test-task-$i.sh"
done

# 查看任务执行时间
sleep 30
cat /root/.openclaw/agents/main/tasks/tasks.json | \
  python3 -c "import json, sys; [print(t['id'][:8], '->', t.get('startedAt'), '->', t.get('completedAt')) for t in json.load(sys.stdin)['tasks'] if t.get('startedAt')]"
```

**预期结果**：
- 前 3 个任务同时开始
- 第 4、5 个等待前面完成后启动

---

## 📊 系统资源状况

```
CPU: 2 核，负载 0.25 (低)
内存: 3.6G 总计，1.9G 可用 (充足)
```

**结论**：系统资源**不是瓶颈**，可以支持更高的并发。

---

## 🎯 总结与建议

### 现状
| 系统 | 并行能力 | 当前配置 | 实际效果 |
|------|---------|---------|---------|
| **Task Service** | ✅ 支持（最多 3） | 硬编码 | ✅ **正在并行** |
| **Cron Service** | ✅ 支持 | ❌ 未配置 | ⚠️ **串行执行** |

### 为什么看起来是串行？
1. **LLM 思考慢**（30-60s）
2. **Cron 任务串行**（未配置并发）
3. **最大并发 3**（不够高）

### 推荐优化方案

#### 短期（立即可做）
```bash
# 1. 启用 Cron 并行
cat > /tmp/cron-config.json << 'EOF'
{
  "cron": {
    "maxConcurrentRuns": 3
  }
}
EOF

# 2. 重启 Gateway
systemctl restart openclaw-gateway
```

#### 中期（需要测试）
```typescript
// 提高 Task 并发数
// 文件: /root/openclaw-fork/src/tasks/service.ts
const MAX_CONCURRENT_TASKS = 5;  // 从 3 提高到 5
```

#### 长期（可选）
- 切换到更快的模型（如 `gpt-4o-mini`）
- 监控 LLM API rate limit
- 考虑队列优先级

---

## 📌 关键证据文件

- 任务执行日志：`/root/.openclaw/agents/main/tasks/tasks.json`
- Cron 配置：`/root/.openclaw/config.json`（需创建）
- 源码：
  - `/root/openclaw-fork/src/tasks/service.ts` (L12: `MAX_CONCURRENT_TASKS`)
  - `/root/openclaw-fork/src/cron/service/timer.ts` (L40: `resolveRunConcurrency`)

---

**报告生成时间**: 2026-02-22 13:02  
**诊断结果**: ✅ 任务系统已支持并行，但受 LLM 速度和 Cron 配置限制
