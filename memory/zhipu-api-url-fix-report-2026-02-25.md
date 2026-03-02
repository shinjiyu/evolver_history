# 智谱 API URL 修复报告

## 修复时间
2026-02-25 17:47

## 发现的问题

### 错误的 URL
```
https://open.bigmodel.cn/api/coding/paas/v4  ❌ 错误
```

### 正确的 URL
```
https://open.bigmodel.cn/api/paas/v4  ✅ 正确
```

## 扫描结果

### 1. OpenClaw 主配置文件
**文件**: `/root/.openclaw/openclaw.json`
**状态**: ✅ 已修复

修复前:
```json
"baseUrl": "https://open.bigmodel.cn/api/coding/paas/v4"
```

修复后:
```json
"baseUrl": "https://open.bigmodel.cn/api/paas/v4"
```

### 2. 其他文件（无需修复）

| 文件 | URL | 状态 |
|------|-----|------|
| `autonomous-exploration/core/llm-client.js` | `https://open.bigmodel.cn/api/paas/v4` | ✅ 正确 |
| `molecular-prompt-experiments/run_experiment.py` | `https://open.bigmodel.cn/api/paas/v4` | ✅ 正确 |
| `experiments/molecular-prompt/run_real_experiment.py` | `https://open.bigmodel.cn/api/paas/v4` | ✅ 正确 |
| `key-scanner/config.json` | `https://open.bigmodel.cn/api/paas/v4` | ✅ 正确 |

### 3. 历史记录文件（无需修复）

**文件**: `/root/.openclaw/workspace/experiments/molecular-prompt/results/raw_results_20260224_113701.json`
- 这是 2026-02-24 失败实验的历史记录
- 包含错误的 URL `api/coding/paas/v4`
- 这是历史数据，不需要修改

## API 测试结果

```bash
curl -X POST https://open.bigmodel.cn/api/paas/v4/chat/completions \
  -H "Authorization: Bearer 3ec7bff..." \
  -H "Content-Type: application/json" \
  -d '{"model": "glm-4-flash", "messages": [{"role": "user", "content": "回复OK"}]}'
```

**响应**:
```json
{
  "choices": [{
    "finish_reason": "stop",
    "message": {
      "content": "OK",
      "role": "assistant"
    }
  }],
  "model": "glm-4-flash",
  "usage": {
    "completion_tokens": 3,
    "prompt_tokens": 7,
    "total_tokens": 10
  }
}
```

**状态**: ✅ API 调用成功

## 修复总结

| 类型 | 数量 |
|------|------|
| 扫描文件 | 20+ |
| 发现错误 | 1 处 |
| 已修复 | 1 处 |
| API 测试 | ✅ 通过 |

## 影响范围

修复此 URL 后，以下功能将恢复正常：
1. OpenClaw 主会话的 LLM 调用
2. 所有使用 `zai/glm-*` 模型的任务
3. Autonomous Exploration 系统的 LLM 调用

## 后续建议

1. **重启 Gateway** - 使配置生效
   ```bash
   openclaw gateway restart
   ```

2. **验证修复** - 检查日志确认无 404 错误
   ```bash
   tail -f /root/.openclaw/logs/gateway.log
   ```

3. **更新文档** - 确保所有文档中的 API URL 都是正确的
