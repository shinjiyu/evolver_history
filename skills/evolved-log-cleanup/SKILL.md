---
name: evolved-log-cleanup
description: 日志自动清理。适用于：(1) 日志目录过大、(2) 磁盘空间不足、(3) 日志文件累积过多、(4) 需要定期清理。
---

# Evolved Log Cleanup - 日志自动清理

自动清理旧日志文件，释放磁盘空间，保持系统清洁。

## 核心问题

**PAT-116**: 日志目录过大（147M）
- 严重程度: 🟡 P1
- 影响: 磁盘使用增加（75% → 81%）
- 根因: 缺少自动清理机制

## 清理策略

### 策略 1: 按时间清理

```bash
# 清理超过 7 天的日志
find /root/.openclaw/workspace/logs -name "*.log" -mtime +7 -type f -delete

# 清理超过 30 天的归档日志
find /root/.openclaw/workspace/logs -name "*.log.*" -mtime +30 -type f -delete
```

### 策略 2: 按大小清理

```bash
# 清理超过 100MB 的日志
find /root/.openclaw/workspace/logs -name "*.log" -size +100M -type f -exec gzip {} \;

# 清理超过 50MB 的归档日志
find /root/.openclaw/workspace/logs -name "*.log.*.gz" -size +50M -type f -delete
```

### 策略 3: 按类型清理

```bash
# 清理临时日志
find /root/.openclaw/workspace/logs -name "*.tmp" -type f -delete

# 清理空日志
find /root/.openclaw/workspace/logs -name "*.log" -empty -type f -delete
```

## 实施示例

### 示例 1: 定期清理 Cron

```bash
#!/bin/bash
# 每天凌晨 2 点运行
# 0 2 * * * bash /root/.openclaw/workspace/evolver/fixes/log-cleanup.sh

LOGS_DIR="/root/.openclaw/workspace/logs"
ARCHIVE_DIR="/root/.openclaw/workspace/logs/archive"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# 创建归档目录
mkdir -p "$ARCHIVE_DIR"

# 1. 归档超过 7 天的日志
find "$LOGS_DIR" -name "*.log" -mtime +7 -type f -exec gzip {} \;
find "$LOGS_DIR" -name "*.log.gz" -type f -exec mv {} "$ARCHIVE_DIR/" \;

# 2. 删除超过 30 天的归档
find "$ARCHIVE_DIR" -name "*.gz" -mtime +30 -type f -delete

# 3. 清理临时文件
find "$LOGS_DIR" -name "*.tmp" -type f -delete

# 4. 清理空文件
find "$LOGS_DIR" -name "*.log" -empty -type f -delete

# 5. 记录清理日志
echo "[$TIMESTAMP] Log cleanup completed" >> "$LOGS_DIR/log-cleanup.log"
```

### 示例 2: 智能清理脚本

```bash
#!/bin/bash
# smart-log-cleanup.sh

LOGS_DIR="/root/.openclaw/workspace/logs"
MAX_SIZE_MB=200
RETENTION_DAYS=7

# 计算当前日志目录大小
current_size=$(du -sm "$LOGS_DIR" | awk '{print $1}')

if [ $current_size -gt $MAX_SIZE_MB ]; then
  echo "⚠️  日志目录过大: ${current_size}MB > ${MAX_SIZE_MB}MB"
  echo "开始清理..."
  
  # 1. 删除最旧的日志
  find "$LOGS_DIR" -name "*.log" -type f -printf '%T@ %p\n' | \
    sort -rn | \
    tail -n +$(($current_size - $MAX_SIZE_MB + 50)) | \
    awk '{print $2}' | \
    xargs rm -f
  
  # 2. 压缩剩余的旧日志
  find "$LOGS_DIR" -name "*.log" -mtime +$RETENTION_DAYS -type f -exec gzip {} \;
  
  # 3. 记录清理日志
  new_size=$(du -sm "$LOGS_DIR" | awk '{print $1}')
  echo "[$(date)] Cleaned ${current_size}MB → ${new_size}MB" >> "$LOGS_DIR/log-cleanup.log"
else
  echo "✅ 日志目录大小正常: ${current_size}MB"
fi
```

## 配置文件

```json
// log-cleanup-config.json
{
  "logsDir": "/root/.openclaw/workspace/logs",
  "archiveDir": "/root/.openclaw/workspace/logs/archive",
  "maxSizeMB": 200,
  "retentionDays": 7,
  "archiveRetentionDays": 30,
  "cleanupInterval": "0 2 * * *",
  "compressOldLogs": true,
  "deleteEmptyLogs": true,
  "deleteTempFiles": true
}
```

## 最佳实践

1. **定期清理**: 每天凌晨 2 点自动清理
2. **归档策略**: 7 天后压缩，30 天后删除
3. **大小限制**: 日志目录不超过 200MB
4. **保留重要**: 保留最近的错误日志和系统日志
5. **记录清理**: 记录清理操作和效果

## 相关 Skills

- `evolved-session-cleanup` - 会话清理
- `system-health-check` - 系统健康检查
- `disk-usage-monitor` - 磁盘使用监控

## 相关 Pattern

- **PAT-116**: 日志目录过大

---

**创建日期**: 2026-03-15
**来源**: Round 326 - PAT-116 (日志目录 147M)
**解决问题**: 磁盘使用增加（75% → 81%）
