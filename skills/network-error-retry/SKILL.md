# 网络错误重试机制 Skill

---
name: network-error-retry
description: 网络错误自动重试机制。适用于：(1) 遇到 network_error、ECONNRESET、ETIMEDOUT 等网络错误、(2) API 调用失败需要重试、(3) 不稳定网络环境下的操作、(4) 需要提高网络请求成功率。
---

# Network Error Retry - 网络错误重试机制

自动处理网络错误，提高 API 调用和远程操作的成功率。

## 核心问题

**PAT-051**: Network Error 激增
- 出现次数: 20 次（最近 6 小时）
- 影响范围: API 调用、远程通信
- 根本原因:
  1. 网络连接不稳定
  2. 缺少自动重试机制
  3. 网络抖动导致连接中断

## 重试策略

### 策略 1: 指数退避重试

**推荐用于**: API 调用、网络请求

```python
import time
import random

def retry_with_backoff(func, max_retries=3, base_delay=1):
    """
    指数退避重试机制
    
    Args:
        func: 要执行的函数
        max_retries: 最大重试次数（默认 3 次）
        base_delay: 基础延迟秒数（默认 1 秒）
    
    Returns:
        函数执行结果
    
    Raises:
        最后一次失败时的异常
    """
    for attempt in range(max_retries):
        try:
            return func()
        except (NetworkError, ConnectionError, TimeoutError) as e:
            if attempt == max_retries - 1:
                raise  # 最后一次重试失败，抛出异常
            
            # 计算延迟：指数退避 + 随机抖动
            delay = base_delay * (2 ** attempt) + random.uniform(0, 1)
            
            print(f"⚠️ 网络错误 (尝试 {attempt + 1}/{max_retries}): {e}")
            print(f"   等待 {delay:.2f} 秒后重试...")
            time.sleep(delay)
    
    raise Exception("不应到达此处")
```

**示例使用**:
```python
# API 调用
def call_api():
    response = api_client.get("/endpoint")
    return response

result = retry_with_backoff(call_api, max_retries=3)
```

### 策略 2: 固定间隔重试

**推荐用于**: 简单操作、快速重试

```python
def retry_fixed_interval(func, max_retries=3, delay=2):
    """
    固定间隔重试机制
    
    Args:
        func: 要执行的函数
        max_retries: 最大重试次数
        delay: 固定延迟秒数
    """
    for attempt in range(max_retries):
        try:
            return func()
        except (NetworkError, ConnectionError) as e:
            if attempt == max_retries - 1:
                raise
            
            print(f"⚠️ 重试 {attempt + 1}/{max_retries}...")
            time.sleep(delay)
```

### 策略 3: 条件重试

**推荐用于**: 特定错误类型需要特殊处理

```python
def retry_conditional(func, max_retries=3, retry_on=None):
    """
    条件重试机制
    
    Args:
        func: 要执行的函数
        max_retries: 最大重试次数
        retry_on: 需要重试的错误类型列表
    """
    if retry_on is None:
        retry_on = [NetworkError, ConnectionError, TimeoutError]
    
    for attempt in range(max_retries):
        try:
            return func()
        except Exception as e:
            # 检查是否是需要重试的错误类型
            should_retry = any(isinstance(e, error_type) for error_type in retry_on)
            
            if not should_retry or attempt == max_retries - 1:
                raise
            
            print(f"⚠️ 错误: {e.__class__.__name__}: {e}")
            time.sleep(2 ** attempt)  # 指数退避
```

## 错误类型识别

### 可重试的错误

| 错误类型 | 描述 | 推荐重试次数 |
|----------|------|--------------|
| `NetworkError` | 网络连接错误 | 3-5 次 |
| `ConnectionError` | 连接失败 | 3 次 |
| `TimeoutError` | 请求超时 | 2-3 次 |
| `ECONNRESET` | 连接被重置 | 3 次 |
| `ETIMEDOUT` | 连接超时 | 2-3 次 |
| `HTTP 502/503/504` | 服务器错误 | 3 次 |

### 不可重试的错误

| 错误类型 | 描述 | 处理方式 |
|----------|------|----------|
| `HTTP 400` | 请求参数错误 | 修复请求 |
| `HTTP 401/403` | 认证失败 | 检查凭证 |
| `HTTP 404` | 资源不存在 | 检查路径 |
| `HTTP 429` | 速率限制 | 降低频率 |

## 最佳实践

### ✅ 推荐做法

1. **使用指数退避**
   ```python
   # ✅ 好的做法
   retry_with_backoff(api_call, max_retries=3, base_delay=1)
   
   # ❌ 避免
   for i in range(100):  # 过多重试
       try:
           return api_call()
       except:
           time.sleep(0.1)  # 延迟太短
   ```

2. **添加随机抖动**
   ```python
   # ✅ 好的做法 - 避免惊群效应
   delay = base_delay * (2 ** attempt) + random.uniform(0, 1)
   
   # ❌ 避免 - 所有客户端同时重试
   delay = base_delay * (2 ** attempt)
   ```

3. **记录重试日志**
   ```python
   try:
       result = retry_with_backoff(func)
   except Exception as e:
       print(f"❌ 重试 {max_retries} 次后仍然失败: {e}")
       raise
   ```

4. **区分错误类型**
   ```python
   try:
       result = api_call()
   except NetworkError as e:
       # 网络错误 - 可重试
       result = retry_with_backoff(api_call)
   except ValueError as e:
       # 参数错误 - 不可重试
       raise
   ```

### ❌ 避免做法

1. **不要无限重试**
   ```python
   # ❌ 危险
   while True:
       try:
           return api_call()
       except:
           pass
   ```

2. **不要忽略错误**
   ```python
   # ❌ 错误的做法
   try:
       result = api_call()
   except:
       pass  # 吞掉所有错误
   ```

3. **不要重试不可重试的错误**
   ```python
   # ❌ 无意义的重试
   for i in range(10):
       try:
           return api_call()  # HTTP 401 认证失败
       except:
           time.sleep(1)
   ```

## 与 OpenClaw 工具集成

### exec 工具

```markdown
## 网络命令重试

**场景**: 执行网络命令（curl, wget, git clone 等）

**策略**:
1. 使用 shell 脚本包装
2. 添加重试逻辑
3. 设置超时时间

**示例**:
```bash
#!/bin/bash
# 带重试的网络命令

max_retries=3
retry_delay=2

for i in $(seq 1 $max_retries); do
    if curl --max-time 10 "https://api.example.com"; then
        echo "✅ 成功"
        exit 0
    else
        echo "⚠️ 尝试 $i/$max_retries 失败"
        if [ $i -lt $max_retries ]; then
            sleep $retry_delay
            retry_delay=$((retry_delay * 2))
        fi
    fi
done

echo "❌ 重试 $max_retries 次后仍然失败"
exit 1
```
```

### web_fetch 工具

```markdown
## 网页抓取重试

**场景**: 使用 web_fetch 工具抓取网页

**策略**:
1. 捕获网络错误
2. 使用指数退避重试
3. 设置最大重试次数

**示例**:
```javascript
async function fetchWithRetry(url, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await web_fetch({ url: url });
        } catch (error) {
            if (error.message.includes('network') || 
                error.message.includes('timeout')) {
                console.log(`⚠️ 重试 ${i+1}/${maxRetries}...`);
                await sleep(Math.pow(2, i) * 1000);
            } else {
                throw error;  // 非网络错误，不重试
            }
        }
    }
    throw new Error('重试失败');
}
```
```

## 监控和日志

### 重试统计

```python
class RetryStats:
    def __init__(self):
        self.total_attempts = 0
        self.success_on_first_try = 0
        self.success_after_retry = 0
        self.total_failures = 0
    
    def record(self, attempts, success):
        self.total_attempts += attempts
        if success:
            if attempts == 1:
                self.success_on_first_try += 1
            else:
                self.success_after_retry += 1
        else:
            self.total_failures += 1
    
    def report(self):
        total = self.success_on_first_try + self.success_after_retry + self.total_failures
        print(f"📊 重试统计:")
        print(f"  首次成功: {self.success_on_first_try}/{total} ({self.success_on_first_try/total*100:.1f}%)")
        print(f"  重试成功: {self.success_after_retry}/{total} ({self.success_after_retry/total*100:.1f}%)")
        print(f"  最终失败: {self.total_failures}/{total} ({self.total_failures/total*100:.1f}%)")
```

### 日志记录

```python
import logging

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def retry_with_logging(func, max_retries=3):
    for attempt in range(max_retries):
        try:
            result = func()
            if attempt > 0:
                logger.info(f"✅ 第 {attempt + 1} 次尝试成功")
            return result
        except NetworkError as e:
            logger.warning(f"⚠️ 第 {attempt + 1} 次尝试失败: {e}")
            if attempt == max_retries - 1:
                logger.error(f"❌ 重试 {max_retries} 次后仍然失败")
                raise
            delay = 2 ** attempt
            logger.info(f"   等待 {delay} 秒后重试...")
            time.sleep(delay)
```

## 相关 Pattern

- **PAT-051**: Network Error 激增（本 Skill 解决）
- **PAT-049**: Gateway 超时（需要配合超时配置）
- **PAT-052**: Task Aborted（需要配合任务恢复）

## 与其他 Skills 配合

- `api-retry-strategy` - API 重试策略
- `safe-operations` - 安全操作检查
- `subagent-lifecycle-manager` - 子代理生命周期管理

---

**创建日期**: 2026-02-28
**来源**: Round 255 - PAT-051 (Network Error 激增)
**解决问题**: 20+ 次网络错误
