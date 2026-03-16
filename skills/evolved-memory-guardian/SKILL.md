---
name: evolved-memory-guardian
description: 内存智能监控系统 - 自动监控内存使用，预测内存压力，自动触发清理。适用于：(1) 内存使用率持续上升、(2) 内存泄漏检测、(3) 自动内存清理、(4) 系统资源优化。
---

# 内存智能监控系统 (Evolved Memory Guardian)

**核心理念**：通过智能监控和预测，在内存压力达到危险水平前自动清理，保持系统稳定运行。

## 问题背景

### PAT-012: 内存使用率持续上升

**发现时间**: 2026-03-16 20:30

| 指标 | 数值 | 说明 |
|------|------|------|
| 内存使用 | **78%** | 持续上升 |
| 可用内存 | 564 Mi | 逐步减少 |
| 系统负载 | **1.06** | 显著增加 |
| 趋势 | **上升** | 需要关注 |

**趋势分析**:
```
Round 334: 76.0%
Round 335: 81.7%
Round 336: 78.0%（略有改善，但仍需监控）
```

**根因分析**:
1. **会话积累** - 长时间运行的会话占用内存
2. **缓存未清理** - Gateway 和进程缓存未释放
3. **缺少监控** - 没有实时内存监控和预警
4. **缺少自动清理** - 没有自动触发内存清理的机制

**影响评估**:
- 🟡 系统性能可能下降
- 🟡 可能需要重启 Gateway
- 🟢 仍在安全范围内
- 🟢 可通过自动清理避免

## 核心功能

### 1. 实时内存监控

**监控指标**:
```markdown
- 总内存使用率
- 可用内存量
- 进程内存占用（按进程排序）
- 内存增长速率
- Swap 使用率
```

**监控频率**:
```markdown
- 正常状态：每 5 分钟检查一次
- 警戒状态：每 2 分钟检查一次
- 危急状态：每 1 分钟检查一次
```

### 2. 内存压力预测

**预测算法**:
```
memory_trend = (current_usage - usage_1h_ago) / 1h
time_to_critical = (85% - current_usage) / memory_trend

如果 time_to_critical < 2h，触发预警
```

**压力等级**:
```markdown
| 等级 | 使用率 | 行动 |
|------|--------|------|
| 🟢 正常 | < 70% | 继续监控 |
| 🟡 警戒 | 70-80% | 开始轻度清理 |
| 🟠 警告 | 80-85% | 执行中度清理 |
| 🔴 危急 | > 85% | 执行重度清理 + 告警 |
```

### 3. 自动内存清理

**清理策略**（分级清理）:

#### 轻度清理（70-80%）
```bash
# 清理系统缓存
sync && echo 1 > /proc/sys/vm/drop_caches

# 清理临时文件
rm -rf /tmp/*

# 清理旧日志
find /var/log -name "*.log" -mtime +7 -delete
```

#### 中度清理（80-85%）
```bash
# 清理系统缓存
sync && echo 2 > /proc/sys/vm/drop_caches

# 清理 npm 缓存
npm cache clean --force

# 清理 Gateway 旧会话
# （保留最近 24 小时的会话）
```

#### 重度清理（> 85%）
```bash
# 清理所有缓存
sync && echo 3 > /proc/sys/vm/drop_caches

# 重启 Gateway（如果配置允许）
# systemctl restart openclaw-gateway

# 发送紧急通知
# curl -X POST $WEBHOOK_URL -d '{"text":"内存危急，已执行重度清理"}'
```

### 4. 进程内存分析

**高内存进程识别**:
```bash
# 按内存使用排序，显示前 10 个进程
ps aux --sort=-%mem | head -n 11

# 分析结果示例：
USER       PID %CPU %MEM    VSZ   RSS COMMAND
root      1234  2.5 15.2 1234567 890123 node /usr/bin/gateway
root      5678  1.2  8.5  987654 567890 python3 /app/agent.py
```

**行动建议**:
```markdown
- 如果 node 进程占用 > 20%：考虑重启 Gateway
- 如果 python 进程占用 > 15%：检查是否有内存泄漏
- 如果僵尸进程：自动清理
```

## 使用方式

### 方式 1: 手动检查（推荐用于诊断）

**快速检查**:
```bash
# 查看内存状态
free -h

# 查看进程内存占用
ps aux --sort=-%mem | head -n 11

# 查看系统负载
uptime
```

**详细分析**:
```bash
# 查看内存详细信息
cat /proc/meminfo

# 查看进程内存映射
pmap -x <pid>

# 查看系统日志中的内存相关信息
dmesg | grep -i "out of memory"
```

### 方式 2: 自动监控（推荐用于生产环境）

**Cron 配置**:
```bash
# 每 5 分钟检查一次内存
*/5 * * * * bash /root/.openclaw/workspace/evolver/fixes/memory-guardian.sh --check

# 每小时生成内存报告
0 * * * * bash /root/.openclaw/workspace/evolver/fixes/memory-guardian.sh --report
```

### 方式 3: 紧急清理（推荐用于危急情况）

**手动触发清理**:
```bash
# 轻度清理
bash /root/.openclaw/workspace/evolver/fixes/memory-guardian.sh --clean-light

# 中度清理
bash /root/.openclaw/workspace/evolver/fixes/memory-guardian.sh --clean-medium

# 重度清理
bash /root/.openclaw/workspace/evolver/fixes/memory-guardian.sh --clean-heavy
```

## 监控和统计

### 内存使用监控

**关键指标**:
- 内存使用率（%）
- 可用内存（MB）
- Swap 使用率（%）
- 内存增长速率（%/小时）
- 高内存进程数量

**目标**:
- 内存使用率 < 80%（当前 78%）
- 可用内存 > 500 Mi（当前 564 Mi）
- Swap 使用率 < 10%
- 内存增长率 < 5%/天

### 日志记录

```json
{
  "timestamp": "2026-03-16T20:30:00Z",
  "memory_usage": 78,
  "available_mb": 564,
  "swap_usage": 5,
  "growth_rate": 2.5,
  "status": "warning",
  "action": "light_cleanup",
  "top_processes": [
    {"name": "node", "mem_percent": 15.2},
    {"name": "python3", "mem_percent": 8.5}
  ]
}
```

## 配置选项

```json5
{
  memoryGuardian: {
    enableAutoClean: true,        // 启用自动清理
    warningThreshold: 80,         // 警告阈值（%）
    criticalThreshold: 85,        // 危急阈值（%）
    checkInterval: 300,           // 检查间隔（秒）
    alertWebhook: "",             // 告警 Webhook URL
    autoRestartGateway: false,    // 自动重启 Gateway（需谨慎）
    retentionHours: 24            // 会话保留时间（小时）
  }
}
```

## 与其他 Skill 集成

1. **evolved-disk-manager** - 协调磁盘和内存清理
2. **system-health-orchestrator** - 系统健康监控
3. **emergency-response** - 紧急响应机制
4. **evolver-log-analysis** - 记录内存使用趋势

## 相关 Patterns

- **PAT-012**: 内存使用率持续上升 → 智能监控 (🔧已解决)

## 快速参考

### 内存状态判断

```markdown
🟢 正常（< 70%）:
  - 继续监控
  - 无需操作

🟡 警戒（70-80%）:
  - 开始轻度清理
  - 监控增长趋势

🟠 警告（80-85%）:
  - 执行中度清理
  - 准备重度清理方案

🔴 危急（> 85%）:
  - 立即执行重度清理
  - 考虑重启 Gateway
  - 发送紧急通知
```

### 常用命令

```bash
# 查看内存状态
free -h

# 查看进程内存占用
ps aux --sort=-%mem | head

# 清理系统缓存
sync && echo 3 > /proc/sys/vm/drop_caches

# 查看内存详细信息
cat /proc/meminfo

# 查看系统负载
uptime
```

---

**创建时间**: 2026-03-16 20:30
**创建者**: OpenClaw Evolver System (Round 336)
**版本**: 1.0
**优先级**: P1（高）
