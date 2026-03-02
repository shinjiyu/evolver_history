---
name: network-error-monitor
description: 网络错误监控与自动恢复。适用于：(1) 遇到 network_error 错误、(2) API 调用失败、(3) 远程通信中断、(4) 需要自动重试和恢复网络请求。
---

# Network Error Monitor - 网络错误监控与自动恢复

监控网络错误并自动执行恢复操作，提高系统网络稳定性。

## 核心问题

**PAT-051**: Network Error
- 出现次数: 74 次（Round 261，从 48 增至 74，+54%）
- 根本原因:
  1. 网络不稳定
  2. API 服务端问题
  3. Gateway 连接超时
  4. DNS 解析失败
  5. **新问题（2026-03-01 16:00）**: 多个 cron 任务并发触发 API 竞争

## 监控维度

### 1. 网络连通性

```bash
# 检查外网连通性
ping -c 1 -W 5 8.8.8.8

# 检查 DNS 解析
nslookup api.openai.com

# 检查 Gateway 状态
systemctl is-active openclaw-gateway
```

### 2. API 健康检查

```bash
# 检查最近 1 小时的 network_error
find /root/.openclaw/workspace -name "*.txt" -path "*/agent-transcripts/*" -mmin -60 | \
    xargs grep -l "network_error" | wc -l
```

### 3. Gateway 连接

```bash
# 检查 Gateway 内存
ps aux | grep openclaw-gateway | awk '{print $6}'

# 检查 Gateway 超时
grep -r "Gateway timeout" /root/.openclaw/workspace/memory/*.md | wc -l
```

## 自动恢复策略

### 策略 1: 指数退避重试

```javascript
async function retryWithBackoff(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.message.includes('network_error')) {
        const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
        console.log(`网络错误，${delay}ms 后重试 (${i+1}/${maxRetries})`);
        await new Promise(r => setTimeout(r, delay));
      } else {
        throw error;
      }
    }
  }
  throw new Error('重试次数耗尽');
}
```

### 策略 2: 网络状态缓存

```javascript
// 缓存网络状态，避免频繁检查
const networkCache = {
  lastCheck: 0,
  status: 'unknown',
  ttl: 300000 // 5 分钟
};

async function checkNetworkStatus() {
  const now = Date.now();
  if (now - networkCache.lastCheck < networkCache.ttl) {
    return networkCache.status;
  }
  
  try {
    await ping('8.8.8.8');
    networkCache.status = 'healthy';
  } catch (e) {
    networkCache.status = 'unhealthy';
  }
  
  networkCache.lastCheck = now;
  return networkCache.status;
}
```

### 策略 3: Gateway 自动重启

```bash
# 如果 Gateway 超时过多，自动重启
GATEWAY_TIMEOUTS=$(grep -r "Gateway timeout" /root/.openclaw/workspace/memory/*.md 2>/dev/null | wc -l)

if [ $GATEWAY_TIMEOUTS -gt 10 ]; then
    echo "Gateway 超时过多，执行重启..."
    /root/.openclaw/workspace/evolver/fixes/gateway-emergency-restart.sh
fi
```

## 监控脚本

### network-health-check.sh

```bash
#!/bin/bash
# 网络健康检查脚本

# 1. 检查外网连通性
if ! ping -c 1 -W 5 8.8.8.8 > /dev/null 2>&1; then
    echo "⚠️ 外网连接异常"
    exit 1
fi

# 2. 检查 DNS 解析
if ! nslookup api.openai.com > /dev/null 2>&1; then
    echo "⚠️ DNS 解析失败"
    exit 1
fi

# 3. 检查 Gateway 状态
GATEWAY_STATUS=$(systemctl is-active openclaw-gateway 2>/dev/null || echo "unknown")
if [ "$GATEWAY_STATUS" != "active" ]; then
    echo "⚠️ Gateway 未运行"
    exit 1
fi

# 4. 检查最近 1 小时的 network_error
RECENT_ERRORS=$(find /root/.openclaw/workspace -name "*.txt" -path "*/agent-transcripts/*" -mmin -60 2>/dev/null | \
    xargs grep -l "network_error" 2>/dev/null | wc -l)

if [ $RECENT_ERRORS -gt 10 ]; then
    echo "⚠️ 最近 1 小时有 ${RECENT_ERRORS} 个文件包含 network_error"
    exit 1
fi

echo "✅ 网络状态正常"
exit 0
```

## 最佳实践

### ✅ 推荐做法

1. **实施指数退避**
   ```javascript
   // 所有 API 调用都应该有重试机制
   const result = await retryWithBackoff(() => api.call());
   ```

2. **缓存网络状态**
   ```javascript
   // 避免频繁检查网络状态
   const status = await checkNetworkStatus();
   if (status === 'unhealthy') {
       // 等待网络恢复
   }
   ```

3. **监控错误趋势**
   ```bash
   # 定期检查 network_error 数量
   0 * * * * /root/.openclaw/workspace/evolver/fixes/network-health-check.sh
   ```

4. **自动恢复**
   ```bash
   # 如果检测到网络问题，自动执行恢复
   if network-health-check.sh; then
       echo "网络正常"
   else
       gateway-emergency-restart.sh
   fi
   ```

### ❌ 避免做法

1. **不要忽略网络错误**
   ```javascript
   // ❌ 错误
   try {
       await api.call();
   } catch (e) {
       // 忽略
   }
   
   // ✅ 正确
   try {
       await retryWithBackoff(() => api.call());
   } catch (e) {
       log.error('网络错误重试失败', e);
   }
   ```

2. **不要频繁检查网络**
   ```javascript
   // ❌ 错误：每次调用都检查
   for (const item of items) {
       if (await checkNetwork()) {
           await api.call(item);
       }
   }
   
   // ✅ 正确：使用缓存
   const networkOk = await checkNetworkStatus();
   if (networkOk === 'healthy') {
       for (const item of items) {
           await api.call(item);
       }
   }
   ```

3. **不要在没有重试的情况下调用 API**
   ```javascript
   // ❌ 错误
   const result = await api.call();
   
   // ✅ 正确
   const result = await retryWithBackoff(() => api.call());
   ```

## 与其他 Skills 配合

- `network-error-retry` - 网络错误重试机制
- `api-retry-strategy` - API 重试策略
- `gateway-maintenance` - Gateway 维护
- `emergency-response` - 紧急响应

## 相关 Pattern

- **PAT-051**: Network Error（本 Skill 解决）
- **PAT-049**: Gateway 超时
- **PAT-029**: network_error 频繁

## 监控指标

| 指标 | 正常值 | 警告值 | 严重值 |
|------|--------|--------|--------|
| 外网连通性 | ✅ | ❌ | ❌ |
| DNS 解析 | ✅ | ❌ | ❌ |
| Gateway 状态 | active | inactive | unknown |
| network_error (1h) | <5 | 5-10 | >10 |
| Gateway 超时 (1h) | <3 | 3-10 | >10 |

## 🚨 紧急应对措施（2026-03-01 更新）

当 Network Error > 50 次/6h 时：
1. **立即执行 cron-stagger.sh**
   ```bash
   /root/.openclaw/workspace/evolver/fixes/cron-stagger.sh --apply
   ```
2. **检查 Gateway 状态**
   ```bash
   systemctl status openclaw-gateway
   ```
3. **监控 API 使用情况**
   - 检查智谱 AI 账户配额
   - 考虑降低请求频率

## 自动化集成

### Cron 任务

```bash
# 每小时检查网络状态
0 * * * * /root/.openclaw/workspace/evolver/fixes/network-health-check.sh

# 每 4 小时执行完整健康检查
0 */4 * * * /root/.openclaw/workspace/evolver/fixes/auto-health-recovery.sh
```

### 与 auto-health-recovery.sh 集成

auto-health-recovery.sh 已经包含了网络检查（Phase 4），本 Skill 提供更详细的网络监控和恢复策略。

---

**创建日期**: 2026-03-01
**来源**: Round 259 - PAT-051 (Network Error 新增 27 次)
**解决问题**: 网络错误监控和自动恢复
