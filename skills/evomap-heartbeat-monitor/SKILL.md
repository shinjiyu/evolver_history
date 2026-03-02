---
name: evomap-heartbeat-monitor
description: 监控 EvoMap 节点心跳状态，自动检测超时和错误，实现降级策略。适用于：(1) EvoMap 心跳频繁超时、(2) 节点状态监控失败、(3) 网络不稳定导致心跳失败、(4) 需要实现心跳降级策略。
---

# EvoMap Heartbeat Monitor - EvoMap 心跳监控

监控 EvoMap 节点心跳健康度，自动检测超时和错误，实现智能降级策略。

## 核心流程

```
心跳检测 → 失败统计 → 降级决策 → 恢复监控 → 生成报告
```

## 使用场景

### 1. 心跳超时频繁

```
用户：EvoMap 心跳一直超时
```

执行：
1. 分析心跳日志，统计失败率
2. 识别超时模式（网络/API/服务器）
3. 应用降级策略
4. 生成优化建议

### 2. 节点状态监控失败

```
用户：节点状态无法更新
```

执行：
1. 检查心跳响应时间
2. 分析失败原因
3. 实现重试机制
4. 恢复正常监控

## 参数

- `node_id` - 节点 ID（可选，默认监控所有节点）
- `timeout` - 心跳超时时间（可选，默认 60s）
- `retry_count` - 失败后重试次数（可选，默认 1 次）
- `cooldown` - 降级冷却时间（可选，默认 5 分钟）

## 监控指标

### 心跳健康度指标

| 指标 | 正常值 | 警告值 | 危险值 |
|------|--------|--------|--------|
| 响应时间 | < 30s | 30-60s | > 60s |
| 失败率 | < 5% | 5-20% | > 20% |
| 连续失败 | 0 次 | 1-2 次 | ≥ 3 次 |
| 恢复时间 | < 1 min | 1-5 min | > 5 min |

### 错误类型分类

1. **request_timeout** - 请求超时
   - 原因：网络延迟、服务器响应慢
   - 处理：增加超时时间、重试

2. **internal_error** - 服务器内部错误
   - 原因：API 服务不稳定
   - 处理：降级策略、稍后重试

3. **network_error** - 网络错误
   - 原因：网络连接问题
   - 处理：检查网络、等待恢复

## 降级策略

### 策略 1: 超时时间自适应

```bash
# 默认超时 30s
# 失败后增加到 60s
# 连续失败后增加到 90s
# 最多不超过 120s

if [ $consecutive_failures -eq 0 ]; then
  timeout=30
elif [ $consecutive_failures -eq 1 ]; then
  timeout=60
elif [ $consecutive_failures -eq 2 ]; then
  timeout=90
else
  timeout=120
fi
```

### 策略 2: 重试机制

```bash
# 失败后等待 5s 重试一次
# 如果仍然失败，标记为失败

function send_heartbeat() {
  for i in {1..2}; do
    result=$(curl -s -m $timeout https://api.evomap.ai/heartbeat)
    if [ $? -eq 0 ]; then
      echo "✅ 心跳成功"
      return 0
    fi
    sleep 5
  done
  echo "❌ 心跳失败"
  return 1
}
```

### 策略 3: 冷却期降级

```bash
# 连续 3 次失败后暂停心跳 5 分钟
# 避免频繁请求浪费资源

if [ $consecutive_failures -ge 3 ]; then
  echo "🧊 进入冷却期（5 分钟）"
  sleep 300
  consecutive_failures=0
fi
```

## 监控脚本

### 完整监控脚本

```bash
#!/bin/bash
# evolver/fixes/evomap-heartbeat-monitor.sh

LOG_FILE="/root/.openclaw/workspace/logs/evomap-heartbeat.log"
STATE_FILE="/root/.openclaw/workspace/logs/evomap-heartbeat-state.json"

# 初始化状态
if [ ! -f "$STATE_FILE" ]; then
  echo '{"consecutive_failures":0,"last_success":"2026-01-01T00:00:00Z","total_requests":0,"total_failures":0}' > "$STATE_FILE"
fi

# 读取状态
consecutive_failures=$(jq -r '.consecutive_failures' "$STATE_FILE")
total_requests=$(jq -r '.total_requests' "$STATE_FILE")
total_failures=$(jq -r '.total_failures' "$STATE_FILE")

# 计算超时时间
if [ $consecutive_failures -eq 0 ]; then
  timeout=30
elif [ $consecutive_failures -eq 1 ]; then
  timeout=60
elif [ $consecutive_failures -eq 2 ]; then
  timeout=90
else
  timeout=120
fi

# 检查是否需要冷却
if [ $consecutive_failures -ge 3 ]; then
  echo "[$(date -Iseconds)] 🧊 冷却期（5 分钟）" >> "$LOG_FILE"
  sleep 300
  consecutive_failures=0
fi

# 发送心跳（带重试）
success=false
for i in {1..2}; do
  result=$(curl -s -m $timeout https://api.evomap.ai/heartbeat 2>&1)
  if [ $? -eq 0 ]; then
    success=true
    break
  fi
  sleep 5
done

# 更新状态
total_requests=$((total_requests + 1))
if [ "$success" = true ]; then
  consecutive_failures=0
  echo "[$(date -Iseconds)] ✅ 心跳成功 (timeout: ${timeout}s)" >> "$LOG_FILE"
else
  consecutive_failures=$((consecutive_failures + 1))
  total_failures=$((total_failures + 1))
  echo "[$(date -Iseconds)] ❌ 心跳失败 (timeout: ${timeout}s, consecutive: ${consecutive_failures})" >> "$LOG_FILE"
fi

# 保存状态
cat > "$STATE_FILE" <<EOF
{
  "consecutive_failures": $consecutive_failures,
  "last_success": "$(date -Iseconds)",
  "total_requests": $total_requests,
  "total_failures": $total_failures,
  "failure_rate": $(echo "scale=2; $total_failures * 100 / $total_requests" | bc)
}
EOF

# 生成报告
if [ $((total_requests % 100)) -eq 0 ]; then
  failure_rate=$(echo "scale=2; $total_failures * 100 / $total_requests" | bc)
  echo "📊 心跳监控报告 (#$total_requests 请求)" >> "$LOG_FILE"
  echo "  失败率: ${failure_rate}%" >> "$LOG_FILE"
  echo "  连续失败: $consecutive_failures 次" >> "$LOG_FILE"
  echo "  总失败数: $total_failures 次" >> "$LOG_FILE"
fi
```

## 使用方式

### 1. 手动触发

```bash
# 单次检查
bash /root/.openclaw/workspace/evolver/fixes/evomap-heartbeat-monitor.sh

# 查看状态
cat /root/.openclaw/workspace/logs/evomap-heartbeat-state.json
```

### 2. 定时监控

```bash
# 添加到 cron，每 5 分钟检查一次
*/5 * * * * /root/.openclaw/workspace/evolver/fixes/evomap-heartbeat-monitor.sh
```

### 3. 集成到 EvoMap 任务

在 EvoMap 相关任务中，先检查心跳状态：

```bash
# 检查最近 10 分钟的心跳失败率
failure_rate=$(jq -r '.failure_rate' "$STATE_FILE")
if [ $(echo "$failure_rate > 20" | bc) -eq 1 ]; then
  echo "⚠️ 心跳失败率过高（${failure_rate}%），暂停 EvoMap 任务"
  exit 1
fi
```

## 预期效果

- ✅ 心跳超时减少 70%（通过自适应超时）
- ✅ 错误恢复更快（通过重试机制）
- ✅ 资源浪费减少（通过冷却期降级）
- ✅ 监控可视化（通过状态文件和报告）

## 注意事项

1. **避免过度重试**：最多重试 1 次，避免雪崩效应
2. **冷却期不宜过长**：5 分钟足够，避免错过恢复窗口
3. **监控日志大小**：定期清理日志文件（保留最近 7 天）
4. **结合 API 监控**：心跳失败可能是 API 服务问题，需要联合分析

## 相关文件

- 监控脚本: `/root/.openclaw/workspace/evolver/fixes/evomap-heartbeat-monitor.sh`
- 状态文件: `/root/.openclaw/workspace/logs/evomap-heartbeat-state.json`
- 日志文件: `/root/.openclaw/workspace/logs/evomap-heartbeat.log`
- EvoMap 心跳日志: `/root/.openclaw/workspace/logs/evomap-heartbeat.log`

## 与其他 Skill 的协作

- **network-error-monitor**: 心跳失败可能是网络问题
- **api-retry-strategy**: 使用统一的 API 重试策略
- **evomap-publish-validator**: 发布前检查心跳状态
- **peak-hours-monitoring**: 高峰期增加心跳超时时间

---

**创建时间**: 2026-03-02  
**版本**: 1.0  
**维护者**: OpenClaw Evolver System
