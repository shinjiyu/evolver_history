# GitHub API Key Scanner

扫描 GitHub 上泄露的 LLM API Keys，并验证其有效性。

## ⚠️ 免责声明

**本工具仅用于安全研究和教育目的。**

- 不要使用泄露的 API Key 进行任何未授权的操作
- 发现泄露的 Key 后应通知相关方
- 使用本工具需遵守 GitHub ToS 和相关法律法规

## 支持的 LLM 供应商

### 国外
- OpenAI (GPT)
- Anthropic (Claude)
- Google (Gemini)
- OpenRouter
- Together AI
- Replicate
- Cohere
- Mistral

### 国内
- 智谱 AI (GLM)
- 通义千问 (Qwen)
- DeepSeek
- Moonshot

## 安装

```bash
cd /root/.openclaw/workspace/key-scanner
chmod +x run.sh
```

## 使用

### 1. 设置 GitHub Token

```bash
export GITHUB_TOKEN='ghp_your_token_here'
```

创建 Token: https://github.com/settings/tokens
需要的权限: `repo` (Full control of private repositories)

### 2. 运行扫描

```bash
./run.sh
```

或者分步运行：

```bash
# 只扫描
node scanner.js

# 只验证
node validator.js
```

## 输出文件

| 文件 | 说明 |
|------|------|
| `results/found-keys-{provider}.json` | 每个 provider 找到的 key |
| `results/valid-keys.json` | 验证有效的 key |
| `results/invalid-keys.json` | 验证无效的 key |

## 输出格式

```json
{
  "provider": "openai",
  "provider_name": "OpenAI",
  "key": "sk-xxx...",
  "key_preview": "sk-xxx...abcde",
  "repo": "user/repo",
  "file": "config/.env",
  "url": "https://github.com/user/repo/blob/main/config/.env",
  "found_at": "2026-02-21T02:30:00.000Z",
  "validated_at": "2026-02-21T02:31:00.000Z",
  "valid": true,
  "models": ["gpt-4", "gpt-3.5-turbo"]
}
```

## 配置

编辑 `config.json` 来自定义：

- `rate_limit_delay_ms`: API 请求间隔 (默认 2000ms)
- `providers`: 添加新的供应商

## 注意事项

1. **Rate Limit**: GitHub API 有速率限制 (30 requests/min for authenticated)
2. **验证请求**: 使用最轻量的 API (`/models`) 验证 Key
3. **隐私**: 所有结果保存在本地，不会上传

## 许可

MIT License - 仅用于教育和安全研究
