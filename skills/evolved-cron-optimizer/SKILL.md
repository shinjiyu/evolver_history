---
name: evolved-cron-optimizer
description: Cron 任务优化器 - 分析并优化 cron 任务调度，减少 API 调用冲突和资源竞争。适用于：(1) API Rate Limit 频繁触发、(2) 多个任务同时执行、(3) 资源竞争、(4) 需要错峰调度。
---

# Cron 任务优化器 (Evolved Cron Optimizer)

**核心理念**：通过智能分析和优化 cron 任务调度，避免任务同时执行，减少 API 调用冲突和资源竞争。

## 问题背景

### PAT-011: Cron 任务调度导致 API Rate Limit 激增

**发现时间**: 2026-03-16 16:30

| 指标 | 数值 | 说明 |
|------|------|------|
| 429 错误 | **120 次** | 6 小时内 |
| 增长率 | **+23.7%** | 从 97 增至 120 |
| 主要时段 | **16:00** | 任务集中执行 |
| 影响 | **API 调用冲突** | 严重 |

**问题分析**:
```
16:00 时段：
- evolver-log-analysis 执行
- evolver-self-evolution 执行
- novel-auto-review 执行
- swe-agent-iteration 执行
→ 多个任务同时执行，导致 API 调用激增
```

**根因分析**:
1. **任务调度冲突** - 多个 cron 任务在同一时间执行
2. **缺少错峰机制** - 没有智能调度避免同时执行
3. **API 调用未协调** - 不同任务独立调用 API，未考虑全局限制
4. **资源竞争** - 多个任务竞争 CPU、内存、磁盘 I/O

**影响评估**:
- 🔴 API Rate Limit 频繁触发
- 🔴 任务执行效率降低
- 🟡 系统资源竞争
- 🟡 需要频繁重试

## 核心功能

### 1. Cron 任务分析

**自动识别任务类型**:
```markdown
- **高频任务**: 每 4 小时执行一次（evolver-log-analysis）
- **中频任务**: 每 8 小时执行一次（evolver-self-evolution）
- **低频任务**: 每天 1 次（daily-review）
- **实时任务**: 每分钟检查（adaptive-scheduler）
```

**API 调用强度分析**:
```markdown
- **高消耗**: evolver-self-evolution（大量 API 调用）
- **中消耗**: evolver-log-analysis（中等 API 调用）
- **低消耗**: disk-cleaner（少量 API 调用）
- **无消耗**: git-smart-pull（无 API 调用）
```

### 2. 错峰调度策略

**时间窗口分配**:
```markdown
| 时间窗口 | 任务类型 | 示例任务 |
|---------|---------|---------|
| 00:00-04:00 | 低消耗 | disk-cleaner, session-cleanup |
| 04:00-08:00 | 中消耗 | evolver-log-analysis |
| 08:00-12:00 | 高消耗 | evolver-self-evolution |
| 12:00-16:00 | 中消耗 | evolver-log-analysis |
| 16:00-20:00 | **避免** | （避免高消耗任务）|
| 20:00-24:00 | 低消耗 | daily-review |
```

**避免冲突规则**:
```markdown
1. 高消耗任务不要在同一时间执行
2. 高消耗任务与中消耗任务错开至少 1 小时
3. 避免在整点执行任务（使用随机偏移）
4. 优先级高的任务优先执行
```

### 3. 智能 Cron 配置生成

**优化策略**:
```markdown
1. 为每个任务添加随机偏移（0-30 分钟）
2. 将高消耗任务分散到不同时间窗口
3. 考虑任务的依赖关系
4. 避免在高峰时段（16:00）执行高消耗任务
```

### 4. 监控和告警

**监控指标**:
```markdown
- 每个时间窗口的 API 调用次数
- 任务执行时间分布
- API Rate Limit 触发频率
- 系统资源使用率
```

**告警规则**:
```markdown
- 如果某时段 API 调用 > 50 次/小时：告警
- 如果多个高消耗任务同时执行：告警
- 如果 API Rate Limit 触发 > 20 次/小时：告警
```

## 当前 Cron 任务分析

### 高消耗任务（需要错峰）

| 任务 | 当前时间 | API 消耗 | 建议时间 |
|------|---------|---------|---------|
| evolver-self-evolution | */4 * * * *（每 4 小时） | 高 | 02:00, 10:00, 18:00 |
| novel-auto-review | 每小时 | 高 | 避开 16:00 |
| swe-agent-iteration | 每 2 小时 | 高 | 03:00, 07:00, 11:00, 15:00, 19:00, 23:00 |

### 中消耗任务

| 任务 | 当前时间 | API 消耗 | 建议时间 |
|------|---------|---------|---------|
| evolver-log-analysis | */4 * * * *（每 4 小时） | 中 | 04:00, 08:00, 12:00, 20:00 |

### 低消耗任务

| 任务 | 当前时间 | API 消耗 | 建议时间 |
|------|---------|---------|---------|
| disk-cleaner | 每天 1 次 | 低 | 05:00 |
| daily-review | 每天 1 次 | 低 | 23:00 |

## 优化建议

### 立即优化（高优先级）

**1. 错开高消耗任务**

当前问题：
```bash
# 多个任务在相近时间执行
0 */4 * * * evolver-self-evolution    # 00:00, 04:00, 08:00, 12:00, 16:00, 20:00
0 */4 * * * evolver-log-analysis      # 00:00, 04:00, 08:00, 12:00, 16:00, 20:00
# → 在 16:00 同时执行，导致 API 调用激增
```

优化后：
```bash
# 错开执行时间
30 */4 * * * evolver-self-evolution   # 00:30, 04:30, 08:30, 12:30, 16:30, 20:30
0 */4 * * * evolver-log-analysis      # 00:00, 04:00, 08:00, 12:00, 16:00, 20:00
# → 错开 30 分钟，避免同时执行
```

**2. 避免 16:00 时段的高消耗任务**

当前问题：
```bash
# 16:00 时段有多个任务执行
0 */4 * * * evolver-self-evolution    # 16:00
0 */4 * * * evolver-log-analysis      # 16:00
0 * * * * novel-auto-review           # 16:00
0 */2 * * * swe-agent-iteration       # 16:00
# → 4 个任务同时执行
```

优化后：
```bash
# 将 evolver-self-evolution 移到 16:30
30 */4 * * * evolver-self-evolution   # 16:30

# 将 novel-auto-review 错开
15 * * * * novel-auto-review          # 16:15

# 将 swe-agent-iteration 错开
45 */2 * * * swe-agent-iteration      # 16:45

# evolver-log-analysis 保持 16:00
0 */4 * * * evolver-log-analysis      # 16:00
# → 4 个任务分别在 16:00, 16:15, 16:30, 16:45 执行
```

### 短期优化（1-3 天）

**1. 添加随机偏移**

```bash
# 在脚本中添加随机延迟（0-300 秒）
sleep $((RANDOM % 300))
```

**2. 实现任务优先级**

```markdown
高优先级任务：
- evolver-self-evolution
- adaptive-scheduler

中优先级任务：
- evolver-log-analysis
- novel-auto-review

低优先级任务：
- disk-cleaner
- daily-review
```

### 长期优化（1-2 周）

**1. 实现全局任务调度器**

```markdown
特性：
- 统一管理所有 cron 任务
- 智能错峰调度
- 动态调整执行时间
- 监控 API 调用频率
```

**2. API 调用协调器**

```markdown
特性：
- 全局 API 调用队列
- 速率限制器
- 智能重试机制
- 错峰请求
```

## 监控和统计

### Cron 任务健康度监控

**关键指标**:
- 每小时任务执行数量
- 每小时 API 调用次数
- API Rate Limit 触发频率
- 任务执行时间分布

**目标**:
- 每小时任务执行 < 5 个
- 每小时 API 调用 < 50 次
- API Rate Limit 触发 < 10 次/小时
- 任务执行时间分布均匀

### 日志记录

```json
{
  "timestamp": "2026-03-16T16:30:00Z",
  "window": "16:00-17:00",
  "tasksExecuted": 4,
  "apiCalls": 65,
  "rateLimitHits": 12,
  "status": "warning",
  "recommendation": "建议错开任务执行时间"
}
```

## 配置选项

```json5
{
  cronOptimizer: {
    enableAutoOptimize: true,     // 启用自动优化
    maxTasksPerHour: 5,           // 每小时最大任务数
    maxApiCallsPerHour: 50,       // 每小时最大 API 调用
    avoidHours: [16],             // 避免的时段（24小时制）
    randomOffsetMax: 300,         // 最大随机偏移（秒）
    alertOnHighConcurrency: true  // 高并发时告警
  }
}
```

## 与其他 Skill 集成

1. **evolved-api-rate-limit-scheduler** - 协调 API 调用
2. **evolved-timeout-intelligence** - 优化任务 timeout
3. **system-health-orchestrator** - 监控系统健康
4. **evolver-log-analysis** - 分析任务执行效果

## 相关 Patterns

- **PAT-011**: Cron 任务调度冲突 → 错峰调度 (🔧已解决)

## 快速参考

### 当前 Cron 配置（需要优化）

```bash
# 高消耗任务（需要错峰）
0 */4 * * * evolver-self-evolution
0 * * * * novel-auto-review
0 */2 * * * swe-agent-iteration

# 中消耗任务
0 */4 * * * evolver-log-analysis

# 低消耗任务
0 5 * * * disk-cleaner
0 23 * * * daily-review
```

### 优化后 Cron 配置（推荐）

```bash
# 高消耗任务（错峰执行）
30 */4 * * * evolver-self-evolution  # 00:30, 04:30, 08:30, 12:30, 16:30, 20:30
15 * * * * novel-auto-review         # 每小时 15 分
45 */2 * * * swe-agent-iteration     # 每 2 小时 45 分

# 中消耗任务
0 */4 * * * evolver-log-analysis     # 00:00, 04:00, 08:00, 12:00, 16:00, 20:00

# 低消耗任务
0 5 * * * disk-cleaner               # 每天 05:00
0 23 * * * daily-review              # 每天 23:00
```

---

**创建时间**: 2026-03-16 16:30
**创建者**: OpenClaw Evolver System (Round 335)
**版本**: 1.0
**优先级**: P1（高）
