---
name: api-retry-strategy
description: API 请求退避重试策略。适用于：(1) 遇到 429 Rate Limit 错误、(2) API 调用失败需要重试、(3) 需要实现指数退避机制、(4) 减少连续 API 错误。
---

# API Retry Strategy - API 退避重试策略

当遇到 API Rate Limit (429) 或临时错误时，自动实施退避重试机制。

## 核心原则

1. **指数退避** - 每次重试延迟翻倍（1s → 2s → 4s → 8s）
2. **最大重试** - 默认 3 次，可配置
3. **错误分类** - 区分可重试和不可重试错误
4. **日志记录** - 记录重试过程便于调试

## 退避策略

### 可重试错误

| 错误码 | 类型 | 首次延迟 | 最大重试 |
|--------|------|----------|----------|
| 429 | Rate Limit | 2s | 5 次 |
| 500 | Server Error | 1s | 3 次 |
| 502 | Bad Gateway | 2s | 3 次 |
| 503 | Service Unavailable | 3s | 3 次 |
| 504 | Gateway Timeout | 2s | 3 次 |

### 不可重试错误

| 错误码 | 类型 | 处理方式 |
|--------|------|----------|
| 400 | Bad Request | 修复请求参数 |
| 401 | Unauthorized | 检查 API Key |
| 403 | Forbidden | 检查权限 |
| 404 | Not Found | **降级处理（见策略 4）** |

### 策略 4: 404 错误降级（重要）

**问题**: PAT-090 - EvoMap API 持续返回 404 超过 6 小时

当 API 返回 404 时，**不要无限重试**，而应该：

```javascript
// ❌ 错误做法：无限重试 404
for (let i = 0; i < maxRetries; i++) {
  const response = await fetch(apiUrl);
  if (response.status === 404) {
    await sleep(delay);
    continue; // 浪费时间和资源
  }
}

// ✅ 正确做法：立即降级
const response = await fetch(apiUrl);
if (response.status === 404) {
  console.log('⚠️ API 不可用，跳过本次检查');
  await logDegradation(apiName, '404');
  return { status: 'degraded', data: null };
}
```

**降级策略**:
1. 记录降级事件到日志
2. 设置冷却时间（60 分钟）
3. 在冷却期内跳过 API 调用
4. 定期检查 API 是否恢复

详见 `evolved-api-degradation` Skill

## 实施模式

### 模式 1: Shell 脚本中的退避

```bash
#!/bin/bash
# api-retry.sh - 带退避的 API 调用

max_retries=3
delay=1

for i in $(seq 1 $max_retries); do
  response=$(curl -s -w "%{http_code}" "$API_URL" 2>/dev/null)
  http_code="${response: -3}"
  
  if [[ "$http_code" == "429" ]]; then
    echo "⚠️ Rate limited, retrying in ${delay}s (attempt $i/$max_retries)"
    sleep $delay
    delay=$((delay * 2))
  elif [[ "$http_code" =~ ^2[0-9][0-9]$ ]]; then
    echo "✅ Success"
    exit 0
  else
    echo "❌ Error: $http_code"
    exit 1
  fi
done

echo "❌ Max retries reached"
exit 1
```

### 模式 2: JavaScript 中的退避

```javascript
// retry-with-backoff.js
async function retryWithBackoff(fn, options = {}) {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 30000,
    shouldRetry = (err) => err.status === 429 || err.status >= 500
  } = options;
  
  let delay = initialDelay;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (!shouldRetry(err) || attempt === maxRetries) {
        throw err;
      }
      
      console.log(`⚠️ Attempt ${attempt} failed, retrying in ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay = Math.min(delay * 2, maxDelay);
    }
  }
}

// 使用示例
const result = await retryWithBackoff(
  () => fetch('https://api.example.com/data'),
  { maxRetries: 5, initialDelay: 2000 }
);
```

### 模式 3: Cron 任务错峰调度

当多个任务在同一时间触发导致 429 错误时：

```bash
# 添加随机延迟（0-60秒）
sleep $((RANDOM % 60))

# 或使用固定的错峰时间
# 任务 A: 07:00
# 任务 B: 07:15
# 任务 C: 07:30
```

## OpenClaw Cron 配置示例

```json
{
  "jobId": "example-task",
  "schedule": "0 */30 * * * *",
  "command": "sleep $((RANDOM % 30)) && node task.js",
  "description": "带随机延迟的任务"
}
```

## 最佳实践

1. **识别高峰时段** - 分析日志找出 API 压力最大的时段
2. **分散任务** - 将任务调度到不同时间点
3. **限制并发** - 控制同时运行的 API 调用数量
4. **监控重试** - 跟踪重试次数，识别系统性问题
5. **优雅降级** - 当 API 不可用时提供备用方案

## 常见问题

### Q: 429 错误频繁出现怎么办？

1. 检查是否有多个任务同时运行
2. 实施错峰调度
3. 降低请求频率
4. 考虑使用队列限制并发

### Q: 退避时间应该设置多长？

- 初始延迟：1-2 秒
- 最大延迟：30-60 秒
- 根据错误响应中的 `Retry-After` 头调整

## 相关 Skills

- `evolver-log-analysis` - 日志分析识别 API 错误模式
- `adaptive-scheduler` - 自适应调度减少冲突

---

**创建日期**: 2026-02-25
**来源**: Round 188 - PAT-018 (API 高峰期 429 错误)
