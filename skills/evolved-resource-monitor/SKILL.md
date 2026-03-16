---
name: evolved-resource-monitor
description: 系统资源监控和自动优化。适用于：(1) 内存使用率高、(2) 磁盘使用率高、(3) 系统负载高、(4) 需要自动优化。
---

# Evolved Resource Monitor - 系统资源监控和自动优化

实时监控系统资源使用，自动执行优化操作，保持系统健康。

## 核心问题

**PAT-123**: 系统资源使用上升
- 内存: 72.2% → 78.6%（+6.4%）
- 磁盘: 81% → 82%（+1%）
- 负载: 0.01 → 1.04（+10300%）
- 严重程度: 🟡 P1
- 影响: 系统性能可能下降

## 监控策略

### 策略 1: 内存监控

```bash
#!/bin/bash
# 内存监控阈值
MEMORY_WARNING=75
MEMORY_CRITICAL=85

# 获取当前内存使用率
memory_usage=$(free | awk '/Mem/{printf("%.1f"), $3/$2*100}')

if (( $(echo "$memory_usage > $MEMORY_CRITICAL" | bc -l) )); then
  echo "[CRITICAL] Memory usage: ${memory_usage}%"
  # 触发清理
  sync && echo 3 > /proc/sys/vm/drop_caches
  # 清理僵尸进程
  ps aux | awk '{if($8=="Z") print $2}' | xargs kill -9 2>/dev/null
elif (( $(echo "$memory_usage > $MEMORY_WARNING" | bc -l) )); then
  echo "[WARNING] Memory usage: ${memory_usage}%"
  # 清理缓存
  sync && echo 1 > /proc/sys/vm/drop_caches
else
  echo "[OK] Memory usage: ${memory_usage}%"
fi
```

### 策略 2: 磁盘监控

```bash
#!/bin/bash
# 磁盘监控阈值
DISK_WARNING=80
DISK_CRITICAL=90

# 获取当前磁盘使用率
disk_usage=$(df -h / | awk 'NR==2{print $5}' | tr -d '%')

if [ $disk_usage -gt $DISK_CRITICAL ]; then
  echo "[CRITICAL] Disk usage: ${disk_usage}%"
  # 触发紧急清理
  rm -rf /tmp/*
  find /root/.openclaw/workspace/logs -name "*.log" -mtime +1 -delete
  find /root/.openclaw/agents/main/sessions -name "*.jsonl" -mtime +1 -delete
elif [ $disk_usage -gt $DISK_WARNING ]; then
  echo "[WARNING] Disk usage: ${disk_usage}%"
  # 执行常规清理
  bash /root/.openclaw/workspace/evolver/fixes/execute-cleanup.sh
else
  echo "[OK] Disk usage: ${disk_usage}%"
fi
```

### 策略 3: 负载监控

```bash
#!/bin/bash
# 负载监控阈值（15 分钟平均）
LOAD_WARNING=2.0
LOAD_CRITICAL=5.0

# 获取当前负载
load_average=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $3}')

if (( $(echo "$load_average > $LOAD_CRITICAL" | bc -l) )); then
  echo "[CRITICAL] Load average: ${load_average}"
  # 查找高负载进程
  ps aux --sort=-%cpu | head -10
  # 重启高负载服务（如果有）
elif (( $(echo "$load_average > $LOAD_WARNING" | bc -l) )); then
  echo "[WARNING] Load average: ${load_average}"
  # 记录当前进程状态
  ps aux > /root/.openclaw/workspace/logs/process-snapshot.log
else
  echo "[OK] Load average: ${load_average}"
fi
```

## 自动优化示例

### 示例 1: 内存清理

```bash
#!/bin/bash
# clean-memory.sh

echo "=== 开始内存清理 ==="

# 1. 清理页面缓存
sync && echo 1 > /proc/sys/vm/drop_caches

# 2. 清理 dentries 和 inodes
sync && echo 2 > /proc/sys/vm/drop_caches

# 3. 清理所有缓存（谨慎使用）
# sync && echo 3 > /proc/sys/vm/drop_caches

# 4. 清理僵尸进程
zombie_count=$(ps aux | awk '{if($8=="Z") print $2}' | wc -l)
if [ $zombie_count -gt 0 ]; then
  echo "清理 $zombie_count 个僵尸进程"
  ps aux | awk '{if($8=="Z") print $2}' | xargs kill -9 2>/dev/null
fi

# 5. 清理孤儿进程
orphan_count=$(ps -eo ppid,pid | awk '$1==1 {print $2}' | wc -l)
echo "当前孤儿进程: $orphan_count 个"

# 6. 生成报告
memory_after=$(free | awk '/Mem/{printf("%.1f"), $3/$2*100}')
echo "清理后内存使用率: ${memory_after}%"
```

### 示例 2: 磁盘清理

```bash
#!/bin/bash
# clean-disk.sh

echo "=== 开始磁盘清理 ==="

# 1. 清理临时文件
tmp_size=$(du -sm /tmp 2>/dev/null | awk '{print $1}')
echo "临时文件: ${tmp_size}M"
rm -rf /tmp/* 2>/dev/null

# 2. 清理日志文件
logs_size=$(du -sm /var/log 2>/dev/null | awk '{print $1}')
echo "系统日志: ${logs_size}M"
find /var/log -name "*.log" -mtime +7 -delete 2>/dev/null

# 3. 清理 OpenClaw 日志
openclaw_logs=$(du -sm /root/.openclaw/workspace/logs 2>/dev/null | awk '{print $1}')
echo "OpenClaw 日志: ${openclaw_logs}M"
find /root/.openclaw/workspace/logs -name "*.log" -mtime +3 -delete 2>/dev/null

# 4. 清理会话文件
sessions_size=$(du -sm /root/.openclaw/agents/main/sessions 2>/dev/null | awk '{print $1}')
echo "会话文件: ${sessions_size}M"
find /root/.openclaw/agents/main/sessions -name "*.jsonl" -mtime +1 -delete 2>/dev/null

# 5. 清理包管理器缓存
# apt-get clean 2>/dev/null
# yum clean all 2>/dev/null

# 6. 生成报告
disk_after=$(df -h / | awk 'NR==2{print $5}')
echo "清理后磁盘使用率: ${disk_after}"
```

### 示例 3: 综合监控

```bash
#!/bin/bash
# resource-monitor.sh

WORKSPACE="/root/.openclaw/workspace"
LOG_FILE="$WORKSPACE/logs/resource-monitor.log"
ALERT_FILE="$WORKSPACE/logs/resource-alerts.log"

# 监控函数
monitor() {
  local metric=$1
  local value=$2
  local warning=$3
  local critical=$4
  
  if (( $(echo "$value > $critical" | bc -l) )); then
    echo "[$(date)] [CRITICAL] $metric: $value" | tee -a "$ALERT_FILE"
    return 2
  elif (( $(echo "$value > $warning" | bc -l) )); then
    echo "[$(date)] [WARNING] $metric: $value" | tee -a "$ALERT_FILE"
    return 1
  else
    echo "[$(date)] [OK] $metric: $value" >> "$LOG_FILE"
    return 0
  fi
}

# 监控内存
memory_usage=$(free | awk '/Mem/{printf("%.1f"), $3/$2*100}')
monitor "Memory" "$memory_usage" 75 85
memory_status=$?

# 监控磁盘
disk_usage=$(df -h / | awk 'NR==2{print $5}' | tr -d '%')
monitor "Disk" "$disk_usage" 80 90
disk_status=$?

# 监控负载
load_average=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $3}')
monitor "Load" "$load_average" 2.0 5.0
load_status=$?

# 如果有任何指标超过警告阈值，执行优化
if [ $memory_status -gt 0 ] || [ $disk_status -gt 0 ] || [ $load_status -gt 0 ]; then
  echo "[$(date)] 执行自动优化..." | tee -a "$LOG_FILE"
  bash /root/.openclaw/workspace/evolver/fixes/auto-optimize.sh
fi

# 返回最严重的状态
if [ $memory_status -eq 2 ] || [ $disk_status -eq 2 ] || [ $load_status -eq 2 ]; then
  exit 2  # CRITICAL
elif [ $memory_status -eq 1 ] || [ $disk_status -eq 1 ] || [ $load_status -eq 1 ]; then
  exit 1  # WARNING
else
  exit 0  # OK
fi
```

## 配置文件

```json
// resource-monitor-config.json
{
  "thresholds": {
    "memory": {
      "warning": 75,
      "critical": 85
    },
    "disk": {
      "warning": 80,
      "critical": 90
    },
    "load": {
      "warning": 2.0,
      "critical": 5.0
    }
  },
  "monitoring": {
    "interval": "*/5 * * * *",
    "logFile": "/root/.openclaw/workspace/logs/resource-monitor.log",
    "alertFile": "/root/.openclaw/workspace/logs/resource-alerts.log"
  },
  "optimization": {
    "autoClean": true,
    "cleanMemory": true,
    "cleanDisk": true,
    "restartServices": false
  }
}
```

## 最佳实践

1. **定期监控**: 每 5 分钟检查一次资源使用
2. **分级告警**: Warning (75%/80%/2.0) → Critical (85%/90%/5.0)
3. **自动优化**: 超过阈值时自动执行清理
4. **记录日志**: 所有监控和优化操作都记录日志
5. **避免过度优化**: 不要频繁清理，影响性能

## 相关 Skills

- `evolved-log-cleanup` - 日志清理
- `evolved-cleanup-executor` - 清理执行器
- `system-health-check` - 系统健康检查

## 相关 Pattern

- **PAT-123**: 系统资源使用上升
- **PAT-119**: 磁盘使用率超过警戒线

---

**创建日期**: 2026-03-15
**来源**: Round 328 - PAT-123 (系统资源使用上升)
**解决问题**: 内存、磁盘、负载监控和自动优化
