# API 请求队列管理 Skill

**版本**: 1.0
**创建时间**: 2026-03-14
**创建方式**: evolver-self-evolution (Round 322)
**目的**: 智能管理 API 请求队列，防止 Rate Limit 错误

---

## 🎯 核心问题

### PAT-110: API Rate Limit 再次激增（严重）

**症状**:
```
时间: 2026-03-14 12:00
429 错误: 19 次（6 小时内）
趋势: +46%（从 13 → 19 次）
状态: 🔴 恶化
影响: 子代理任务失败增加，系统稳定性下降
```

**影响**:
- 🔴 **子代理任务失败增加**: Novel-auto-review 等任务受影响
- 🔴 **系统稳定性下降**: 多个任务并发执行导致冲突
- 🔴 **API 调用失败**: Rate Limit 触发后请求被拒绝
- 🟡 **用户体验下降**: 任务执行延迟或失败

**根因分析**:
1. 多个 cron 任务并发执行，同时请求 API
2. 子代理并发请求未完全优化
3. **缺少全局请求队列** - 关键缺失
4. 缺少请求优先级管理
5. 缺少自动限流机制

---

## 📋 管理策略

### 1. 全局请求队列架构

```
┌─────────────────────────────────────────────────┐
│           API 请求队列系统                        │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────────┐                               │
│  │  请求源       │                               │
│  │  (Cron/Sub)  │                               │
│  └──────┬───────┘                               │
│         │                                       │
│         ▼                                       │
│  ┌──────────────┐    ┌──────────────┐          │
│  │  优先级队列   │───▶│  速率限制器   │          │
│  │  (P0/P1/P2)  │    │  (Token桶)   │          │
│  └──────────────┘    └──────┬───────┘          │
│                             │                   │
│                             ▼                   │
│                      ┌──────────────┐          │
│                      │  API 调用     │          │
│                      └──────────────┘          │
│                                                 │
└─────────────────────────────────────────────────┘
```

### 2. 请求优先级

| 优先级 | 类型 | 示例 | 限流策略 |
|--------|------|------|---------|
| P0 | 关键任务 | 紧急响应、安全告警 | 不限流 |
| P1 | 重要任务 | 日志分析、系统监控 | 轻度限流 |
| P2 | 普通任务 | Novel 评审、定时任务 | 标准限流 |
| P3 | 后台任务 | 数据归档、清理 | 重度限流 |

### 3. Token 桶算法

**配置**:
```json
{
  "bucket_size": 100,
  "refill_rate": 10,
  "refill_interval": 60,
  "max_burst": 20,
  "backoff_multiplier": 2.0
}
```

**工作原理**:
1. 桶初始有 100 个 token
2. 每 60 秒补充 10 个 token
3. 每次请求消耗 1 个 token
4. 桶空时请求进入等待队列
5. Rate Limit 触发时，自动退避（指数退避）

---

## 🔧 使用方法

### 1. 启动请求队列服务

```bash
# 启动队列服务
bash /root/.openclaw/workspace/evolver/fixes/api-request-queue.sh --start

# 查看队列状态
bash /root/.openclaw/workspace/evolver/fixes/api-request-queue.sh --status
```

### 2. 提交请求到队列

```bash
# 提交 P0 优先级请求
bash /root/.openclaw/workspace/evolver/fixes/api-request-queue.sh --submit --priority P0 --task "emergency-response"

# 提交 P2 优先级请求
bash /root/.openclaw/workspace/evolver/fixes/api-request-queue.sh --submit --priority P2 --task "novel-review"
```

### 3. 配置队列参数

```bash
# 设置 token 桶大小
bash /root/.openclaw/workspace/evolver/fixes/api-request-queue.sh --config bucket_size=100

# 设置补充速率
bash /root/.openclaw/workspace/evolver/fixes/api-request-queue.sh --config refill_rate=10

# 启用自动限流
bash /root/.openclaw/workspace/evolver/fixes/api-request-queue.sh --enable-auto-throttle
```

### 4. 监控队列性能

```bash
# 查看队列统计
bash /root/.openclaw/workspace/evolver/fixes/api-request-queue.sh --stats

# 查看请求历史
bash /root/.openclaw/workspace/evolver/fixes/api-request-queue.sh --history
```

---

## 📊 预期效果

| 指标 | 当前值 | 目标值 | 改进幅度 |
|------|--------|--------|---------|
| 429 错误率 | 19 次/6h | < 5 次/6h | -74% |
| API 可用性 | 92% | > 98% | +6% |
| 请求成功率 | 90% | > 96% | +6% |
| 平均响应时间 | 高 | 低 | -50% |

---

## 🚨 自动限流机制

### 触发条件

1. **Rate Limit 触发**
   - 检测到 429 错误
   - 自动启动指数退避
   - 降低请求速率 50%

2. **队列积压**
   - 队列长度 > 100
   - 自动降低 P3 任务优先级
   - 暂停后台任务

3. **系统负载高**
   - 系统负载 > 1.0
   - 自动降低非关键任务优先级
   - 延迟后台任务

### 恢复条件

1. **Rate Limit 恢复**
   - 连续 10 分钟无 429 错误
   - 逐步恢复正常请求速率

2. **队列恢复正常**
   - 队列长度 < 50
   - 恢复正常优先级

---

## 📝 维护日志

### 2026-03-14 (创建)
- 检测到 API Rate Limit 激增 46%
- 创建 API 请求队列管理 Skill
- 实现 Token 桶算法
- 定义请求优先级体系

---

## 🔄 相关 Patterns

- **PAT-110**: API Rate Limit 激增 → 请求队列管理 (🔧有方案)
- **PAT-062**: API 429 Rate Limit 频繁触发 → 智能限流 (✅有方案)

---

## 📚 相关 Skills

- `skills/evolved-api-rate-limiter/SKILL.md` - API 速率限制
- `skills/evolved-api-degradation/SKILL.md` - API 降级处理

---

**维护者**: OpenClaw Evolver System
**下次审查**: 2026-03-21
