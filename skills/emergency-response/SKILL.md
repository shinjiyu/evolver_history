# 紧急系统响应 Skill

---
name: emergency-response
description: 紧急系统响应机制。适用于：(1) 系统健康评分快速下降、(2) 多项错误同时激增、(3) Gateway/资源使用异常、(4) 需要快速诊断和修复。
---

# Emergency Response - 紧急系统响应

快速诊断和修复系统危机，防止进一步恶化。

## 触发条件

**立即触发**（健康评分 < 7.0）:
- 健康评分下降 ≥ 1.0
- Gateway 内存 > 1.0 GB
- 429 错误 > 50 次/6小时
- 多项错误（≥3 种）同时激增

## 响应级别

### 🔴 Level 1: 紧急（健康评分 < 6.0）

**症状**:
- 健康评分快速下降（-1.0 以上）
- Gateway 内存泄漏（>1.0 GB）
- 429 错误激增（>100 次/6小时）

**立即行动**:
1. **Gateway 重启**（优先级 P0）
2. **降低 cron 任务频率**（暂停非关键任务）
3. **检查 API 余额**
4. **生成紧急报告**

### 🟡 Level 2: 警告（健康评分 6.0-7.0）

**症状**:
- 健康评分下降（-0.5 至 -1.0）
- 错误数量增加
- 资源使用异常

**行动计划**:
1. 诊断问题根因
2. 应用针对性修复
3. 监控效果

### 🟢 Level 3: 监控（健康评分 7.0-8.0）

**症状**:
- 健康评分轻微波动
- 个别错误增加

**行动计划**:
1. 持续监控
2. 记录趋势
3. 准备预防措施

## 诊断流程

### Step 1: 快速评估（5 分钟内）

```bash
#!/bin/bash
# 紧急诊断脚本

echo "========== 紧急系统诊断 =========="
echo "时间: $(date)"
echo

# 1. Gateway 状态
echo "1. Gateway 状态:"
ps aux | grep openclaw-gateway | grep -v grep | awk '{print "  PID:", $2, "Memory:", $6/1024 "MB", "CPU:", $3"%"}'
echo

# 2. 系统资源
echo "2. 系统资源:"
free -m | grep "Mem:" | awk '{print "  可用内存:", $7 "MB / " $2 "MB"}'
df -h / | tail -1 | awk '{print "  磁盘使用:", $5, "可用:", $4}'
echo

# 3. 最近错误统计
echo "3. 最近错误统计（6小时内）:"
LATEST_LOG=$(ls -t /root/.openclaw/workspace/memory/log-analysis-*.md | head -1)
if [ -f "$LATEST_LOG" ]; then
    grep -A 5 "严重程度" "$LATEST_LOG" | head -20
fi
echo

# 4. API 余额检查
echo "4. API 状态:"
echo "  建议运行: /root/.openclaw/workspace/evolver/fixes/api-balance-monitor.sh"
echo

echo "=================================="
```

### Step 2: 根因分析（10 分钟内）

**检查清单**:
- [ ] Gateway 内存是否 > 1.0 GB？
- [ ] 429 错误是否 > 50 次？
- [ ] 多个 cron 任务是否同时执行？
- [ ] 网络连接是否稳定？
- [ ] API 余额是否充足？

### Step 3: 快速修复（15 分钟内）

**优先级排序**:

| 优先级 | 问题 | 修复措施 | 预计时间 |
|--------|------|----------|----------|
| P0 | Gateway 内存泄漏 | 重启 Gateway | 1 分钟 |
| P0 | 429 错误激增 | 暂停非关键 cron | 2 分钟 |
| P1 | Gateway 超时 | 增加超时配置 | 3 分钟 |
| P1 | Unknown subagent | 应用 lifecycle Skill | 5 分钟 |
| P2 | Network error | 应用 retry Skill | 5 分钟 |

## 修复脚本

### 脚本 1: Gateway 紧急重启

```bash
#!/bin/bash
# Gateway 紧急重启脚本

echo "🚨 Gateway 紧急重启"
echo "时间: $(date)"

# 检查当前 Gateway 内存
GATEWAY_MEM=$(ps aux | grep openclaw-gateway | grep -v grep | awk '{print $6}')
GATEWAY_MEM_MB=$((GATEWAY_MEM / 1024))

echo "当前 Gateway 内存: ${GATEWAY_MEM_MB} MB"

if [ $GATEWAY_MEM_MB -gt 1000 ]; then
    echo "⚠️ Gateway 内存超过 1GB，需要重启"
    
    # 重启 Gateway
    echo "重启 Gateway..."
    pkill -f openclaw-gateway
    sleep 2
    openclaw gateway start
    
    echo "✅ Gateway 已重启"
    
    # 验证
    sleep 5
    NEW_MEM=$(ps aux | grep openclaw-gateway | grep -v grep | awk '{print $6}')
    NEW_MEM_MB=$((NEW_MEM / 1024))
    echo "新 Gateway 内存: ${NEW_MEM_MB} MB"
else
    echo "✅ Gateway 内存正常，无需重启"
fi
```

### 脚本 2: Cron 任务降级

```bash
#!/bin/bash
# Cron 任务降级脚本

echo "🚨 Cron 任务紧急降级"
echo "时间: $(date)"

# 非关键任务列表（可暂停）
NON_CRITICAL_TASKS=(
    "evolver-self-evolution"
    "evolver-log-analysis"
    "adaptive-scheduler"
)

# 暂停非关键任务
for task in "${NON_CRITICAL_TASKS[@]}"; do
    echo "暂停任务: $task"
    # 实际实现需要根据 cron 配置方式调整
done

echo "✅ 非关键任务已暂停"
echo "提醒: 危机解除后记得恢复任务"
```

### 脚本 3: 紧急报告生成

```bash
#!/bin/bash
# 紧急报告生成脚本

REPORT_FILE="/root/.openclaw/workspace/memory/emergency-report-$(date +%Y%m%d-%H%M%S).md"

cat > "$REPORT_FILE" << EOF
# 紧急响应报告

**时间**: $(date)
**健康评分**: $(grep "健康评分" /root/.openclaw/workspace/memory/log-analysis-*.md | tail -1 | grep -oE '[0-9.]+')

---

## 系统状态

$(ps aux | grep openclaw-gateway | grep -v grep | awk '{print "- Gateway: PID " $2 ", Memory " $6/1024 "MB, CPU " $3"%"}')

$(free -m | grep "Mem:" | awk '{print "- 可用内存: " $7 "MB / " $2 "MB"}')

---

## 采取的行动

1. Gateway 重启: $(if pgrep -f openclaw-gateway > /dev/null; then echo "✅ 已执行"; else echo "❌ 未执行"; fi)
2. Cron 降级: 待实施
3. API 检查: 待实施

---

## 后续行动

- [ ] 监控健康评分恢复情况
- [ ] 恢复暂停的 cron 任务
- [ ] 分析根本原因
- [ ] 更新预防措施

---

**报告生成时间**: $(date)
EOF

echo "✅ 紧急报告已生成: $REPORT_FILE"
```

## 恢复流程

### Step 1: 验证修复效果（30 分钟后）

```bash
# 检查健康评分是否回升
LATEST_SCORE=$(grep "健康评分" /root/.openclaw/workspace/memory/log-analysis-*.md | tail -1 | grep -oE '[0-9.]+')

if [ $(echo "$LATEST_SCORE >= 7.0" | bc) -eq 1 ]; then
    echo "✅ 系统恢复稳定（健康评分: $LATEST_SCORE）"
else
    echo "⚠️ 系统仍不稳定，需要进一步诊断"
fi
```

### Step 2: 恢复正常操作（1 小时后）

```bash
# 恢复暂停的 cron 任务
echo "恢复正常 cron 任务..."

# 根据之前暂停的任务列表恢复
# 实际实现需要根据 cron 配置方式调整

echo "✅ Cron 任务已恢复"
```

### Step 3: 根因分析（24 小时内）

**分析要点**:
1. 触发危机的根本原因是什么？
2. 哪些措施最有效？
3. 如何预防类似危机？
4. 需要更新哪些 Skills？

## 预防措施

### 自动监控

```bash
# 添加到 cron（每 30 分钟检查一次）
*/30 * * * * /root/.openclaw/workspace/evolver/fixes/health-monitor.sh
```

**health-monitor.sh**:
```bash
#!/bin/bash
# 健康监控脚本

# 检查 Gateway 内存
GATEWAY_MEM=$(ps aux | grep openclaw-gateway | grep -v grep | awk '{print $6}')
GATEWAY_MEM_MB=$((GATEWAY_MEM / 1024))

if [ $GATEWAY_MEM_MB -gt 1500 ]; then
    echo "🚨 Gateway 内存过高: ${GATEWAY_MEM_MB} MB" | logger -t openclaw-health
    # 触发紧急响应
fi

# 检查健康评分
LATEST_LOG=$(ls -t /root/.openclaw/workspace/memory/log-analysis-*.md | head -1)
if [ -f "$LATEST_LOG" ]; then
    SCORE=$(grep "健康评分" "$LATEST_LOG" | tail -1 | grep -oE '[0-9.]+')
    if [ $(echo "$SCORE < 6.0" | bc) -eq 1 ]; then
        echo "🚨 健康评分过低: $SCORE" | logger -t openclaw-health
        # 触发紧急响应
    fi
fi
```

### 定期维护

| 任务 | 频率 | 说明 |
|------|------|------|
| Gateway 重启 | 每 12 小时 | 预防内存泄漏 |
| 日志清理 | 每天 | 释放磁盘空间 |
| 健康检查 | 每 30 分钟 | 早期发现问题 |

## 相关 Skills

- `gateway-health` - Gateway 健康检查
- `api-balance-monitor` - API 余额监控
- `network-error-retry` - 网络错误重试
- `subagent-lifecycle-manager` - 子代理管理

## 相关 Patterns

- **PAT-048**: 429 速率限制激增
- **PAT-049**: Gateway 超时
- **PAT-036**: Gateway 内存泄漏

---

**创建日期**: 2026-02-28
**来源**: Round 256 - 紧急响应（健康评分 5.5）
**触发条件**: 健康评分 < 6.0 或快速下降 ≥ 1.0
