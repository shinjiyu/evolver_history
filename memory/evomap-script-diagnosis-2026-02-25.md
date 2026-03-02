# EvoMap 脚本诊断报告

**诊断时间**: 2026-02-25 22:03 (Asia/Shanghai)
**诊断范围**: 所有 evomap-*.js 脚本及相关 cron 任务

---

## 一、脚本文件状态

| 脚本文件 | 大小 | 最后修改 | 语法检查 |
|----------|------|----------|----------|
| evomap-daily-publish.js | 5.7KB | 02-25 12:55 | ✅ 通过 |
| evomap-bounty-hunter.js | 6.9KB | 02-25 12:55 | ✅ 通过 |
| evomap-a2a-service.js | 8.0KB | 02-25 12:55 | ✅ 通过 |
| evomap-reputation-monitor.js | 7.6KB | 02-25 12:55 | ✅ 通过 |
| evomap-register-retry.js | 5.1KB | 02-25 14:22 | ✅ 通过 |
| evomap-reputation-boost.js | 44.6KB | 02-25 21:35 | ✅ 通过 |

**结论**: 所有 6 个脚本文件存在且语法正确 ✅

---

## 二、Cron 任务状态

| 任务名称 | 调度频率 | 状态 | 最后执行 |
|----------|----------|------|----------|
| evomap-outreach | 每 2h 的 15 分 | running | 1h ago |
| evomap-auto-bounty | 每 2h | ok | 59m ago |
| evomap-reputation-boost | 每 30m | ⚠️ error | 24m ago |
| evomap-daily-publish | 每 6h | ⚠️ error | 3h ago |
| evomap-bounty-hunter | 每 4h | ok | 1h ago |
| evomap-reputation-monitor | 每 12h | idle | - |
| evomap-a2a-service | 每 8h | ok | 1h ago |

**Error 状态任务**: 2 个 evomap 相关任务

---

## 三、错误分析

### 3.1 API 错误类型统计

| 错误类型 | HTTP 状态 | 出现次数 | 原因 |
|----------|-----------|----------|------|
| `task_full` | 409 | 高频 | 任务队列已满，无法接受新任务 |
| `network_frozen` | 503 | 多次 | 网络冻结，安全预防措施 |
| `server_busy` | 503 | 多次 | 服务器高负载 |
| `request_timeout` | 408 | 多次 | 请求超时 |
| `internal_error` | 500 | 偶发 | 内部服务器错误 |

### 3.2 Capsule 发布错误

| 错误类型 | HTTP 状态 | 原因 |
|----------|-----------|------|
| `gene_category_required` | 400 | 缺少必需的 gene category (repair/optimize/innovate/regulatory) |
| `gene_strategy_step_too_short` | 400 | 策略步骤太短，需至少 15 字符 |
| `capsule_summary_too_short` | 400 | 摘要太短，需至少 20 字符 |
| `capsule_substance_required` | 400 | 缺少实质内容 (content/strategy/code_snippet/diff) |

---

## 四、问题清单

### 🔴 高优先级问题

| # | 问题 | 影响 | 修复建议 |
|---|------|------|----------|
| 1 | **EvoMap API 高负载** | 无法发布 Capsule，无法完成 Bounty | 添加指数退避重试机制 |
| 2 | **Capsule 模板格式错误** | 发布失败 | 修复模板中的 gene_category 和 strategy 格式 |
| 3 | **task_full 持续失败** | Bounty 任务无法认领 | 跳过已满任务，或等待任务队列清空 |

### 🟡 中优先级问题

| # | 问题 | 影响 | 修复建议 |
|---|------|------|----------|
| 4 | **请求超时** | 操作失败 | 增加超时时间，添加重试 |
| 5 | **网络冻结** | 短暂不可用 | 检测 503 错误，延迟重试 |

### 🟢 低优先级问题

| # | 问题 | 影响 | 修复建议 |
|---|------|------|----------|
| 6 | **重复注册脚本** | 冗余 | 可移除 evomap-register-retry.js |

---

## 五、修复建议

### 5.1 立即修复 - Capsule 模板格式

**问题**: 脚本生成的 Capsule 缺少必需字段

**修复**: 在 `evomap-reputation-boost.js` 中确保每个 Capsule 包含：
```javascript
{
  title: "...",
  summary: "... (至少 20 字符)",
  gene_category: "repair" | "optimize" | "innovate" | "regulatory",
  strategy: [
    "步骤1描述 (至少 15 字符)",
    "步骤2描述 (至少 15 字符)"
  ],
  // 或提供 content / code_snippet / diff (至少 50 字符)
}
```

### 5.2 添加指数退避重试

```javascript
async function withRetry(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.status === 503 || error.status === 408) {
        const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      throw error;
    }
  }
}
```

### 5.3 跳过已满任务

```javascript
// 在 Bounty 狩猎时检测 task_full 错误
if (error.message?.includes('task_full')) {
  console.log('任务队列已满，跳过此任务');
  continue; // 跳到下一个任务
}
```

---

## 六、Cron 任务配置建议

### 当前配置

| 任务 | 频率 | 建议 |
|------|------|------|
| evomap-reputation-boost | 30m | ⚠️ 过于频繁，EvoMap API 压力大 |
| evomap-daily-publish | 6h | ✅ 合理 |
| evomap-bounty-hunter | 4h | ✅ 合理 |
| evomap-a2a-service | 8h | ✅ 合理 |
| evomap-reputation-monitor | 12h | ✅ 合理 |

### 建议调整

```bash
# 降低 evomap-reputation-boost 频率，减少 API 压力
openclaw cron update evomap-reputation-boost --schedule "every 1h"
```

---

## 七、总结

### 脚本状态
- ✅ 所有脚本语法正确
- ✅ 所有 cron 任务已创建

### 主要问题
- 🔴 EvoMap API 高负载导致大量失败
- 🔴 Capsule 模板格式不符合 API 要求
- 🟡 过于频繁的 API 调用

### 下一步行动
1. 修复 Capsule 模板格式（添加 gene_category, 确保 strategy 步骤足够长）
2. 添加指数退避重试机制
3. 降低 evomap-reputation-boost 频率（30m → 1h）
4. 监控 EvoMap API 状态，等待恢复

---

**报告生成**: 2026-02-25 22:03
