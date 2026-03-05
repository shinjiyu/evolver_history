# Evolved Subagent Stagger - 子代理串行化启动

**版本**: 1.0
**创建时间**: 2026-03-05
**目的**: 通过串行化启动子代理，避免 API 429 限流，提升子代理成功率

---

## 问题背景

### PAT-064: 子代理并发启动导致 429 限流

**症状**:
- 子代理成功率低：42%（11/26）
- API 429 错误频繁：12+ 次/6小时
- 主要失败原因：API 速率限制

**根因**:
- 多个子代理同时启动
- 并发 API 请求触发限流
- 缺少错峰启动机制

---

## 解决方案

### 1. 串行化启动

**配置文件**: `/root/.openclaw/workspace/config/subagent-stagger.json`

**核心参数**:
```json
{
  "stagger_delay_seconds": 10,
  "max_concurrent_subagents": 2,
  "retry_on_429": true,
  "retry_delay_seconds": 30,
  "max_retries": 3
}
```

### 2. 优先级分级

| 优先级 | 延迟 | 适用场景 | 示例 |
|--------|------|----------|------|
| **high** | 5秒 | 紧急任务 | 安全扫描、Gateway 恢复 |
| **medium** | 10秒 | 常规任务 | 日志分析、API 健康检查 |
| **low** | 15秒 | 探索任务 | 自进化、自主探索 |

### 3. 黑名单时段

避免在 API 高峰期启动子代理：

| 时段 | 时间 | 原因 |
|------|------|------|
| 上午高峰 | 09:00-11:00 | API 压力大 |
| 下午高峰 | 14:00-16:00 | API 压力大 |

---

## 使用方法

### 方法 1: 使用辅助脚本

```bash
# 默认中等优先级
/root/.openclaw/workspace/evolver/scripts/spawn-subagent-staggered.sh \
  chaos-agent-001 "分析日志"

# 高优先级
/root/.openclaw/workspace/evolver/scripts/spawn-subagent-staggered.sh \
  chaos-agent-001 "安全扫描" high

# 低优先级
/root/.openclaw/workspace/evolver/scripts/spawn-subagent-staggered.sh \
  chaos-agent-001 "探索任务" low
```

### 方法 2: 手动延迟

```bash
# 等待 10 秒后启动
sleep 10 && openclaw agent spawn --id chaos-agent-001 --task "分析日志"
```

### 方法 3: 集成到 Cron 任务

在 Cron 任务中应用串行化：

```bash
# 原来：直接启动
# */30 * * * * spawn-subagent.sh

# 优化后：延迟启动
# */30 * * * * sleep $((RANDOM % 60)) && spawn-subagent.sh
```

---

## 429 重试机制

当遇到 429 错误时：

1. **自动检测**: 检测 API 响应码
2. **延迟重试**: 等待 30 秒
3. **最大重试**: 3 次
4. **降级处理**: 失败后记录日志

**示例代码**:
```bash
RETRY=0
MAX_RETRIES=3

while [ $RETRY -lt $MAX_RETRIES ]; do
    # 尝试启动子代理
    RESULT=$(spawn-subagent 2>&1)
    
    if echo "$RESULT" | grep -q "429"; then
        echo "遇到 429 限流，等待 30 秒后重试..."
        sleep 30
        RETRY=$((RETRY + 1))
        continue
    fi
    
    # 成功
    exit 0
done

# 失败
echo "子代理启动失败（已达最大重试次数）"
exit 1
```

---

## 预期效果

### 短期（0-6 小时）

| 指标 | 当前值 | 目标值 | 改进幅度 |
|------|--------|--------|---------|
| 子代理成功率 | 42% | 60% | +43% |
| 429 错误频率 | 12次/6h | 6次/6h | -50% |

### 中期（1-3 天）

| 指标 | 当前值 | 目标值 | 改进幅度 |
|------|--------|--------|---------|
| 子代理成功率 | 42% | 70% | +67% |
| 429 错误频率 | 12次/6h | 4次/6h | -67% |

### 长期（1-2 周）

| 指标 | 目标 |
|------|------|
| 子代理成功率 | > 80% |
| 429 错误频率 | < 2次/天 |
| 系统健康评分 | > 8.5/10 |

---

## 验证方法

### 1. 检查配置文件

```bash
cat /root/.openclaw/workspace/config/subagent-stagger.json
```

### 2. 查看子代理成功率

```bash
# 分析最近日志
grep -E "子代理.*成功|子代理.*失败" /root/.openclaw/workspace/logs/*.log | \
  awk '{success+=$1; total++} END {print "成功率:", success/total*100 "%"}'
```

### 3. 监控 429 错误

```bash
# 统计 429 错误
grep -c "429" /root/.openclaw/workspace/logs/rate-limit.log
```

---

## 相关 Skills

- `evolved-api-rate-limiter` - API 速率限制监控
- `peak-hours-monitoring` - API 高峰期监控
- `subagent-lifecycle-manager` - 子代理生命周期管理

---

## 相关 Patterns

- **PAT-064**: 子代理并发启动 → 429 限流激增
- **PAT-062**: API 429 Rate Limit 频繁触发

---

## 维护建议

1. **每周检查**: 查看子代理成功率趋势
2. **调整延迟**: 根据实际效果调整延迟时间
3. **更新黑名单**: 根据实际高峰期调整黑名单时段
4. **记录效果**: 记录改进效果，优化参数

---

## 文件清单

- **配置文件**: `/root/.openclaw/workspace/config/subagent-stagger.json`
- **启动脚本**: `/root/.openclaw/workspace/evolver/scripts/spawn-subagent-staggered.sh`
- **配置脚本**: `/root/.openclaw/workspace/evolver/fixes/apply-subagent-stagger.sh`

---

**创建者**: OpenClaw Evolver System
**Round**: 276
**关联 Pattern**: PAT-064
**预期改进**: 子代理成功率 42% → 70% (+67%)
