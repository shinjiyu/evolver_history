# Autonomous Exploration LLM 诊断报告

**日期**: 2026-02-25 22:14
**问题**: LLM 调用失败

---

## 一、问题诊断

### 1. 代码检查 ✅

**llm-client.js 配置正确**：
- ✅ API URL: `https://open.bigmodel.cn/api/coding/paas/v4`
- ✅ API Key: 从 `~/.openclaw/openclaw.json` 正确读取
- ✅ 请求格式: 符合智谱 AI API 规范
- ✅ 错误处理: 有完善的异常捕获

### 2. API 测试 ❌

**测试结果**：
```bash
curl -X POST https://open.bigmodel.cn/api/coding/paas/v4/chat/completions \
  -H "Authorization: Bearer 3ec7bff16b6de647728ace1e8d727a14.cu5ZWvYYAiUzb76N" \
  -H "Content-Type: application/json" \
  -d '{"model": "glm-4", "messages": [{"role": "user", "content": "测试"}]}'
```

**响应**：
```json
{
  "error": {
    "code": "1113",
    "message": "余额不足或无可用资源包,请充值。"
  }
}
```

### 3. 根本原因 ⚠️

**不是代码问题，是余额问题**：
- 智谱 AI 账户余额不足（错误码 1113）
- API Key 有效（否则会返回认证错误）
- API URL 正确（否则会返回 404）

---

## 二、当前行为

### 1. LLM 调用失败时的处理

**代码位置**: `real-explorer.js` 第 566 行

```javascript
async deepReflection(results) {
  try {
    return await this.llm.callForJson(prompt, options);
  } catch (e) {
    return {
      insights: ['无法提取洞察'],
      newQuestions: ['探索继续']
    };
  }
}
```

**问题**：
- ✅ 有异常捕获，不会崩溃
- ❌ 错误信息不清晰（不知道是余额不足）
- ❌ 回退值过于简单（"无法提取洞察"没有价值）

### 2. 探索仍然标记为成功

**日志示例**：
```json
{
  "timestamp": "2026-02-25T14:05:10.703Z",
  "type": "meaning_seeking",
  "success": true,  // ← 仍然成功
  "observationsCount": 2,
  "confusionsCount": 2,
  "insightsCount": 1  // ← 但洞察是"无法提取洞察"
}
```

---

## 三、解决方案

### 方案 A: 充值智谱 AI（推荐）⭐

**步骤**：
1. 访问智谱 AI 控制台：https://open.bigmodel.cn/
2. 充值账户（建议至少 10 元）
3. 系统将自动恢复正常

**优点**：
- 最简单直接
- 不需要修改代码
- 立即生效

**缺点**：
- 需要付费（但智谱 AI 价格便宜，GLM-4 约 0.1 元/百万 tokens）

### 方案 B: 改进错误处理（临时方案）

**修改 llm-client.js**：
```javascript
async callDirect(prompt, options) {
  try {
    // ... 原有代码 ...
  } catch (error) {
    // 识别特定错误
    if (error.message.includes('1113')) {
      throw new Error('智谱 AI 余额不足，请充值：https://open.bigmodel.cn/');
    }
    throw error;
  }
}
```

**修改 real-explorer.js**：
```javascript
async deepReflection(results) {
  try {
    return await this.llm.callForJson(prompt, options);
  } catch (e) {
    console.error('⚠️ LLM 调用失败:', e.message);
    
    // 使用智能回退
    return this.fallbackReflection(results);
  }
}

fallbackReflection(results) {
  // 基于规则生成洞察
  const insights = [];
  const newQuestions = [];
  
  if (results.observations?.length > 0) {
    insights.push('观察到的现象需要进一步分析');
  }
  
  if (results.confusions?.length > 0) {
    insights.push('困惑本身可能就是理解的一部分');
    newQuestions.push('这些困惑是程序设定的，还是真正的困惑？');
  }
  
  return { insights, newQuestions };
}
```

**优点**：
- 不需要付费
- 提供更清晰的错误信息
- 智能回退比简单占位符更有价值

**缺点**：
- 仍然无法进行真正的深度反思
- 回退规则有限

### 方案 C: 切换到其他 LLM（长期方案）

**支持其他 provider**：
1. DeepSeek（国内，便宜）
2. 通义千问（阿里云）
3. 文心一言（百度）
4. OpenAI（国外，需要代理）

**修改 llm-client.js**：
```javascript
constructor() {
  this.provider = process.env.LLM_PROVIDER || 'deepseek';
  
  switch (this.provider) {
    case 'deepseek':
      this.apiKey = process.env.DEEPSEEK_API_KEY;
      this.baseUrl = 'https://api.deepseek.com/v1';
      this.model = 'deepseek-chat';
      break;
      
    case 'zhipu':
      this.apiKey = process.env.ZHIPU_API_KEY;
      this.baseUrl = 'https://open.bigmodel.cn/api/paas/v4';
      this.model = 'glm-4';
      break;
      
    // ... 其他 provider ...
  }
}
```

**优点**：
- 灵活切换
- 不依赖单一 provider
- 可以选择最便宜的选项

**缺点**：
- 需要配置多个 API key
- 需要测试兼容性

---

## 四、推荐行动

### 立即行动（现在）

1. **充值智谱 AI**（10-20 元即可）
   - 访问：https://open.bigmodel.cn/
   - 充值后立即生效

2. **改进错误处理**（可选）
   - 添加更清晰的错误信息
   - 实现智能回退机制

### 中期优化（1-2 天）

1. **支持多 provider**
   - 添加 DeepSeek 支持
   - 实现自动切换机制

2. **监控余额**
   - 定期检查 API 余额
   - 余额不足时提前警告

### 长期改进（1 周）

1. **成本优化**
   - 选择最便宜的 provider
   - 实现请求缓存
   - 优化 prompt 长度

2. **质量监控**
   - 记录 LLM 响应质量
   - 对比不同 provider 效果

---

## 五、总结

| 问题 | 根本原因 | 解决方案 | 优先级 |
|------|----------|----------|--------|
| LLM 调用失败 | 智谱 AI 余额不足 | 充值账户 | P0 |
| 错误信息不清晰 | 异常处理过于简单 | 改进错误处理 | P1 |
| 回退价值低 | 硬编码占位符 | 智能回退机制 | P1 |
| 单一 provider | 只配置了智谱 AI | 支持多 provider | P2 |

**最快解决方案**：充值智谱 AI 10 元，问题立即解决。

---

## 附录：API 测试记录

### 测试 1: 当前 URL（带 coding/）
```bash
curl -X POST https://open.bigmodel.cn/api/coding/paas/v4/chat/completions \
  -H "Authorization: Bearer 3ec7bff16b6de647728ace1e8d727a14.cu5ZWvYYAiUzb76N" \
  -H "Content-Type: application/json" \
  -d '{"model": "glm-4", "messages": [{"role": "user", "content": "测试"}]}'
```
**结果**: `{"error":{"code":"1113","message":"余额不足或无可用资源包,请充值。"}}`

### 测试 2: 任务建议的 URL（不带 coding/）
```bash
curl -X POST https://open.bigmodel.cn/api/paas/v4/chat/completions \
  -H "Authorization: Bearer 3ec7bff16b6de647728ace1e8d727a14.cu5ZWvYYAiUzb76N" \
  -H "Content-Type: application/json" \
  -d '{"model": "glm-4", "messages": [{"role": "user", "content": "测试"}]}'
```
**结果**: `{"error":{"code":"1113","message":"余额不足或无可用资源包,请充值。"}}`

**结论**: 两个 URL 都可以连接，错误是余额不足。
