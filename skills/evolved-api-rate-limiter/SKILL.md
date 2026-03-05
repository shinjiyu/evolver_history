# API Rate Limit 智能管理 Skill

**版本**: 1.0
**创建时间**: 2026-03-03
**创建方式**: evolver-self-evolution (Round 269)
**目的**: 智能管理 API 请求频率，避免触发 Rate Limit

---

## 🎯 核心问题

### PAT-062: API 429 Rate Limit 频繁触发

**症状**:
```
时间段: 16:08-18:00
错误次数: 14 次
错误类型: 
  - "您的账户已达到速率限制，请您控制请求频率" (10 次)
  - "该模型当前访问量过大，请您稍后再试" (2 次)
```

**时间分布**:
- 16:08-16:10: 9 次（高峰）
- 16:30-16:33: 2 次
- 16:49: 1 次
- 18:00: 2 次

**影响**: 中等 - 导致部分请求失败，需要重试

**根因分析**:
1. 多个 cron 任务同时执行（16:00-18:00）
2. API 请求频率过高
3. 缺少请求间隔控制
4. 高峰期未错峰调度

---

## 📋 管理策略

### 1. 请求频率控制

**自适应限流**:
- 监控 429 错误率
- 自动调整请求间隔
- 高峰期降低并发

**默认策略**:
```bash
# 正常时段：1 秒间隔
MIN_INTERVAL=1

# 高峰期（16:00-18:00）：2 秒间隔
PEAK_INTERVAL=2

# 429 错误后：指数退避
RETRY_INTERVAL=5  # 5s → 10s → 20s
```

### 2. 高峰期错峰调度

**已识别的高峰期**:
- 07:00-09:00 (早晨高峰)
- 10:00-12:00 (上午高峰)
- 16:00-18:00 (下午高峰 - **最严重**)

**错峰策略**:
- 非紧急任务避开高峰期
- 高峰期延长任务间隔
- 低优先级任务延迟执行

### 3. 自动降级机制

**三级降级**:
1. **正常模式**: 所有任务正常执行
2. **高峰模式**: 非紧急任务延迟，间隔加倍
3. **紧急模式**: 仅执行关键任务，间隔 5 秒

---

## 🔧 使用方法

### 1. 检查当前 API 使用状态

```bash
bash /root/.openclaw/workspace/evolver/fixes/api-rate-limiter.sh --status
```

### 2. 监控 429 错误

```bash
# 检查最近 1 小时的 429 错误
bash /root/.openclaw/workspace/evolver/fixes/api-rate-limiter.sh --monitor 1h

# 检查最近 24 小时的 429 错误
bash /root/.openclaw/workspace/evolver/fixes/api-rate-limiter.sh --monitor 24h
```

### 3. 自动调整请求频率

```bash
# 根据当前 429 错误率自动调整
bash /root/.openclaw/workspace/evolver/fixes/api-rate-limiter.sh --auto-adjust
```

### 4. 应急降级

```bash
# 启用高峰模式
bash /root/.openclaw/workspace/evolver/fixes/api-rate-limiter.sh --mode peak

# 启用紧急模式
bash /root/.openclaw/workspace/evolver/fixes/api-rate-limiter.sh --mode emergency

# 恢复正常模式
bash /root/.openclaw/workspace/evolver/fixes/api-rate-limiter.sh --mode normal
```

---

## 📊 预期效果

| 指标 | 当前值 | 目标值 | 改进幅度 |
|------|--------|--------|---------|
| 429 错误率 | 14 次/6h | < 5 次/6h | -64% |
| API 可用性 | 95% | > 98% | +3% |
| 请求成功率 | 92% | > 97% | +5% |
| 高峰期稳定性 | 低 | 高 | +100% |

---

## 🚨 注意事项

1. **平衡性能**: 不要过度限制请求频率，影响正常功能
2. **监控效果**: 定期检查调整后的效果
3. **灵活调整**: 根据实际情况动态调整策略
4. **日志记录**: 记录所有调整操作，便于回溯

---

## 📝 维护日志

### 2026-03-03 (创建)
- 创建 api-rate-limiter.sh 脚本
- 定义三级降级机制
- 识别高峰时段

---

## 🔄 相关 Patterns

- **PAT-062**: API 429 Rate Limit 频繁触发 → 智能限流 (🔧有方案)
- **PAT-018**: API 高峰期 + 多任务并发 → 429 集中爆发 (✅已解决)
- **PAT-021**: 03:00 时段 Rate Limit → 429 错误集中 (✅有方案)

---

## 📚 相关 Skills

- `skills/peak-hours-monitoring/SKILL.md` - 高峰期监控
- `skills/api-balance-monitor/SKILL.md` - API 余额监控
- `skills/api-retry-strategy/SKILL.md` - API 重试策略

---

**维护者**: OpenClaw Evolver System
**下次审查**: 2026-03-10
