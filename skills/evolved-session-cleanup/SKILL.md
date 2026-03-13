---
name: evolved-session-cleanup
description: 会话生命周期自动管理。适用于：(1) 长时间会话累积、(2) 需要自动清理过期会话、(3) 资源占用过高、(4) 429 错误频繁。
---

# Evolved Session Cleanup - 会话生命周期自动管理

自动清理长时间运行的会话，释放系统资源，减少 429 错误。

## 核心问题

**PAT-091 / PAT-098**: 长时间会话激增
- 出现次数: 891 → 897 个（持续增长）
- 严重程度: 🔴 P0
- 影响: 资源占用、429 错误、系统响应变慢

## 清理策略

### 策略 1: 分级清理

```javascript
// 根据会话时长分级处理
const cleanupLevels = {
  // 超过 24 小时 - 强制终止
  critical: {
    maxAgeHours: 24,
    action: 'terminate',
    notify: true
  },
  // 超过 12 小时 - 标记并警告
  warning: {
    maxAgeHours: 12,
    action: 'mark',
    notify: false
  },
  // 超过 6 小时 - 检查活跃度
  attention: {
    maxAgeHours: 6,
    action: 'check_activity',
    notify: false
  }
};
```

### 策略 2: 活跃度检测

```javascript
// 检查会话是否活跃
async function isSessionActive(sessionFile) {
  const stats = fs.statSync(sessionFile);
  const lastModified = stats.mtime;
  const now = new Date();
  const inactiveHours = (now - lastModified) / (1000 * 60 * 60);
  
  // 超过 2 小时无活动视为不活跃
  return inactiveHours < 2;
}
```

### 策略 3: 安全清理

```javascript
// 安全清理会话
async function safeCleanupSession(sessionFile) {
  // 1. 备份重要会话
  if (isImportantSession(sessionFile)) {
    await backupSession(sessionFile);
  }
  
  // 2. 记录清理日志
  await logCleanup(sessionFile);
  
  // 3. 执行清理
  await fs.unlink(sessionFile);
  
  // 4. 更新统计
  await updateCleanupStats();
}
```

## 实施示例

### 示例 1: 定期清理 Cron

```bash
#!/bin/bash
# 每小时运行一次

# 清理超过 24 小时的会话
find /root/.openclaw/agents/main/sessions -name "*.jsonl" -mtime +1 -type f -delete

# 记录清理数量
cleaned=$(find /root/.openclaw/agents/main/sessions -name "*.jsonl" -mtime +1 -type f 2>/dev/null | wc -l)
echo "[$(date)] Cleaned $cleaned sessions older than 24h" >> /root/.openclaw/workspace/logs/session-cleanup.log
```

### 示例 2: 智能清理脚本

```javascript
// smart-session-cleanup.js
const fs = require('fs');
const path = require('path');

const SESSIONS_DIR = '/root/.openclaw/agents/main/sessions';
const LOG_FILE = '/root/.openclaw/workspace/logs/session-cleanup.log';

async function cleanup() {
  const files = fs.readdirSync(SESSIONS_DIR);
  const now = Date.now();
  let cleaned = 0;
  let kept = 0;
  
  for (const file of files) {
    if (!file.endsWith('.jsonl')) continue;
    
    const filePath = path.join(SESSIONS_DIR, file);
    const stats = fs.statSync(filePath);
    const ageHours = (now - stats.mtimeMs) / (1000 * 60 * 60);
    
    if (ageHours > 24) {
      // 超过 24 小时，清理
      fs.unlinkSync(filePath);
      cleaned++;
    } else {
      kept++;
    }
  }
  
  // 记录日志
  const logEntry = `[${new Date().toISOString()}] Cleaned: ${cleaned}, Kept: ${kept}\n`;
  fs.appendFileSync(LOG_FILE, logEntry);
  
  return { cleaned, kept };
}

cleanup().then(console.log);
```

## 配置文件

```json
// session-cleanup-config.json
{
  "maxAgeHours": {
    "critical": 24,
    "warning": 12,
    "attention": 6
  },
  "cleanupInterval": "0 * * * *",
  "backupImportant": true,
  "logFile": "/root/.openclaw/workspace/logs/session-cleanup.log",
  "statsFile": "/root/.openclaw/workspace/logs/session-cleanup-stats.json"
}
```

## 最佳实践

1. **定期清理**: 每小时自动清理超过 24 小时的会话
2. **分级处理**: 根据会话时长采取不同措施
3. **备份重要**: 清理前备份重要会话
4. **记录日志**: 详细记录清理操作
5. **监控效果**: 定期检查清理效果

## 相关 Skills

- `subagent-lifecycle-manager` - 子代理生命周期管理
- `evolved-api-rate-limiter` - API 速率限制
- `emergency-response` - 紧急响应

## 相关 Pattern

- **PAT-091**: 长时间会话激增
- **PAT-098**: 长时间会话持续增长
- **PAT-062**: 429 Rate Limit 频繁触发

---

**创建日期**: 2026-03-13
**来源**: Round 317 - PAT-098 (长时间会话 897 个)
**解决问题**: 897 个长时间会话
