---
name: evolved-gateway-memory-optimizer
description: Gateway 内存优化。适用于：(1) Gateway 内存占用过高、(2) 系统内存不足、(3) Gateway 性能下降、(4) 需要自动重启。
---

# Evolved Gateway Memory Optimizer - Gateway 内存优化

自动监控和优化 Gateway 内存使用，防止内存泄漏。

## 核心问题

**PAT-125**: Gateway 内存占用过高
- 占用: 47.6% 系统内存（1.7GB）
- 严重程度: 🔴 P0
- 影响: 系统内存使用率高（87.1%）
- 根因: Gateway 可能存在内存泄漏

## 监控策略

### 策略 1: Gateway 内存监控

```bash
#!/bin/bash
# 监控 Gateway 内存使用

GATEWAY_MEMORY_THRESHOLD=40  # 40% 系统内存
SYSTEM_MEMORY_CRITICAL=85    # 85% 系统内存

# 获取 Gateway 内存占用
gateway_memory=$(ps aux | grep openclaw-gateway | grep -v grep | awk '{print int($4)}')
system_memory=$(free | awk '/Mem/{printf("%.0f"), $3/$2*100}')

if [ $gateway_memory -gt $GATEWAY_MEMORY_THRESHOLD ]; then
  echo "[WARNING] Gateway memory: ${gateway_memory}%"
  
  # 如果系统内存也高，重启 Gateway
  if [ $system_memory -gt $SYSTEM_MEMORY_CRITICAL ]; then
    echo "[CRITICAL] System memory: ${system_memory}%, restarting Gateway..."
    pkill -f openclaw-gateway
    sleep 2
    cd /root/.openclaw && nohup openclaw gateway run --force > /dev/null 2>&1 &
  fi
fi
```

### 策略 2: 定期重启

```bash
#!/bin/bash
# 每天重启 Gateway 释放内存

# 检查 Gateway 运行时间
gateway_uptime=$(ps -eo pid,etime,cmd | grep openclaw-gateway | grep -v grep | awk '{print $2}')

# 如果运行超过 24 小时，重启
if [[ $gateway_uptime =~ [0-9]+- ]]; then
  echo "Gateway running for $gateway_uptime, restarting..."
  pkill -f openclaw-gateway
  sleep 2
  cd /root/.openclaw && nohup openclaw gateway run --force > /dev/null 2>&1 &
fi
```

### 策略 3: 内存压力缓解

```bash
#!/bin/bash
# 系统内存压力缓解

MEMORY_WARNING=75
MEMORY_CRITICAL=85

system_memory=$(free | awk '/Mem/{printf("%.0f"), $3/$2*100}')

if [ $system_memory -gt $MEMORY_CRITICAL ]; then
  echo "[CRITICAL] System memory: ${system_memory}%"
  
  # 1. 清理缓存
  sync && echo 3 > /proc/sys/vm/drop_caches
  
  # 2. 清理僵尸进程
  ps aux | awk '{if($8=="Z") print $2}' | xargs kill -9 2>/dev/null
  
  # 3. 重启 Gateway（如果占用 > 40%）
  gateway_memory=$(ps aux | grep openclaw-gateway | grep -v grep | awk '{print int($4)}')
  if [ $gateway_memory -gt 40 ]; then
    echo "Restarting Gateway (using ${gateway_memory}% memory)..."
    pkill -f openclaw-gateway
    sleep 2
    cd /root/.openclaw && nohup openclaw gateway run --force > /dev/null 2>&1 &
  fi
elif [ $system_memory -gt $MEMORY_WARNING ]; then
  echo "[WARNING] System memory: ${system_memory}%"
  sync && echo 1 > /proc/sys/vm/drop_caches
fi
```

## 实施示例

### 示例 1: Gateway 内存监控脚本

```bash
#!/bin/bash
# gateway-memory-monitor.sh

WORKSPACE="/root/.openclaw/workspace"
LOG_FILE="$WORKSPACE/logs/gateway-memory.log"
ALERT_FILE="$WORKSPACE/logs/gateway-memory-alerts.log"

# 获取当前状态
gateway_memory=$(ps aux | grep openclaw-gateway | grep -v grep | awk '{print $4}')
system_memory=$(free | awk '/Mem/{printf("%.1f"), $3/$2*100}')
gateway_pid=$(ps aux | grep openclaw-gateway | grep -v grep | awk '{print $2}')

# 记录日志
echo "[$(date)] Gateway: ${gateway_memory}%, System: ${system_memory}%, PID: $gateway_pid" >> "$LOG_FILE"

# 检查阈值
if (( $(echo "$gateway_memory > 40" | bc -l) )); then
  echo "[$(date)] [ALERT] Gateway using ${gateway_memory}% system memory" | tee -a "$ALERT_FILE"
  
  # 如果系统内存也高，重启 Gateway
  if (( $(echo "$system_memory > 85" | bc -l) )); then
    echo "[$(date)] [CRITICAL] Restarting Gateway..." | tee -a "$ALERT_FILE"
    pkill -f openclaw-gateway
    sleep 2
    cd /root/.openclaw && nohup openclaw gateway run --force > /dev/null 2>&1 &
    
    # 等待并验证
    sleep 5
    new_memory=$(ps aux | grep openclaw-gateway | grep -v grep | awk '{print $4}')
    echo "[$(date)] Gateway restarted, new memory: ${new_memory}%" | tee -a "$ALERT_FILE"
  fi
fi
```

### 示例 2: 自动重启脚本

```bash
#!/bin/bash
# gateway-auto-restart.sh

# 检查 Gateway 是否运行超过 24 小时
gateway_uptime=$(ps -eo pid,etime,cmd | grep openclaw-gateway | grep -v grep | awk '{print $2}')

# 检查是否包含天（格式: days-HH:MM:SS）
if [[ $gateway_uptime =~ ^[0-9]+- ]]; then
  days=$(echo $gateway_uptime | cut -d'-' -f1)
  
  if [ $days -ge 1 ]; then
    echo "Gateway running for $days days, restarting to free memory..."
    
    # 重启 Gateway
    pkill -f openclaw-gateway
    sleep 2
    cd /root/.openclaw && nohup openclaw gateway run --force > /dev/null 2>&1 &
    
    echo "Gateway restarted successfully"
  fi
fi
```

## 配置文件

```json
// gateway-memory-config.json
{
  "thresholds": {
    "gatewayMemory": {
      "warning": 30,
      "critical": 40
    },
    "systemMemory": {
      "warning": 75,
      "critical": 85
    }
  },
  "monitoring": {
    "interval": "*/10 * * * *",
    "logFile": "/root/.openclaw/workspace/logs/gateway-memory.log",
    "alertFile": "/root/.openclaw/workspace/logs/gateway-memory-alerts.log"
  },
  "restart": {
    "autoRestart": true,
    "maxUptimeDays": 1,
    "restartOnCritical": true
  }
}
```

## 最佳实践

1. **定期监控**: 每 10 分钟检查 Gateway 内存
2. **自动重启**: Gateway 运行超过 24 小时自动重启
3. **内存阈值**: Gateway 占用 >40% 时告警
4. **系统压力**: 系统内存 >85% 时自动重启 Gateway
5. **日志记录**: 所有操作都记录日志

## 相关 Skills

- `evolved-resource-monitor` - 系统资源监控
- `evolved-memory-archiver` - 内存归档
- `system-health-check` - 系统健康检查

## 相关 Pattern

- **PAT-125**: Gateway 内存占用过高
- **PAT-123**: 系统资源使用上升

---

**创建日期**: 2026-03-15
**来源**: Round 329 - PAT-125 (Gateway 占用 47.6% 内存)
**解决问题**: Gateway 内存泄漏、系统内存不足
