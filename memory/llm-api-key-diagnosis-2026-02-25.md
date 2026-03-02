# LLM API Key 未配置问题 - 根本原因分析

**诊断时间**: 2026-02-25 14:23 (Asia/Shanghai)
**任务 ID**: ed38d9b4-3566-48de-83b3-9bd5125a8cce

---

## 1. 问题现象

多个任务报告 "LLM API 未配置"：
- `autonomous-exploration` 哲学探索系统
- `evolver` 日志分析
- 其他需要 LLM 的模块

错误信息：
```
throw new Error('未配置 LLM API Key');
```

---

## 2. 根本原因 ⭐

**环境变量名不匹配**

| 项目 | 实际值 |
|------|--------|
| **Gateway 配置的变量** | `ZAI_API_KEY` |
| **代码读取的变量** | `OPENAI_API_KEY` 或 `ZHIPU_API_KEY` |
| **结果** | ❌ 找不到 API Key |

### 代码位置

`/root/.openclaw/workspace/autonomous-exploration/core/llm-client.js`:
```javascript
this.apiKey = process.env.OPENAI_API_KEY || process.env.ZHIPU_API_KEY;
```

### 环境变量配置

`/etc/systemd/system/openclaw-gateway.service`:
```ini
Environment="ZAI_API_KEY=3ec7bff16b6de647728ace1e8d727a14.cu5ZWvYYAiUzb76N"
```

### Gateway 进程验证

```bash
$ cat /proc/1255166/environ | tr '\0' '\n' | grep ZAI
ZAI_API_KEY=3ec7bff16b6de647728ace1e8d727a14.cu5ZWvYYAiUzb76N
```

**结论**: API Key 已正确配置，但变量名不匹配导致代码找不到。

---

## 3. 影响范围

### 受影响的模块

| 模块 | 文件 | 影响 |
|------|------|------|
| autonomous-exploration | `core/llm-client.js` | 无法进行深度哲学反思 |
| evolver | 可能使用类似逻辑 | 部分功能受限 |
| 其他自定义 LLM 调用 | 未知 | 需要检查 |

### 不受影响的模块

| 模块 | 原因 |
|------|------|
| OpenClaw Gateway | 使用 `ZAI_API_KEY` 调用 zai/glm-5 |
| 主会话对话 | 通过 Gateway 调用，不直接读取环境变量 |

---

## 4. 修复方案

### 方案 A: 修改代码（推荐）

修改 `llm-client.js` 以支持 `ZAI_API_KEY`：

```javascript
// 修改前
this.apiKey = process.env.OPENAI_API_KEY || process.env.ZHIPU_API_KEY;

// 修改后
this.apiKey = process.env.ZAI_API_KEY 
           || process.env.OPENAI_API_KEY 
           || process.env.ZHIPU_API_KEY;
```

**优点**: 
- 不需要修改系统配置
- 支持多种 API Key 格式
- 与 Gateway 配置一致

### 方案 B: 添加环境变量

在 systemd 服务文件中添加别名：

```ini
Environment="ZAI_API_KEY=3ec7bff16b6de647728ace1e8d727a14.cu5ZWvYYAiUzb76N"
Environment="OPENAI_API_KEY=3ec7bff16b6de647728ace1e8d727a14.cu5ZWvYYAiUzb76N"
Environment="ZHIPU_API_KEY=3ec7bff16b6de647728ace1e8d727a14.cu5ZWvYYAiUzb76N"
```

然后重启 Gateway：
```bash
systemctl daemon-reload
systemctl restart openclaw-gateway
```

**缺点**: 
- 需要重启服务
- 配置冗余

### 方案 C: 创建 .env 文件（备用）

```bash
cat > /root/.openclaw/workspace/evolver/.env << EOF
ZAI_API_KEY=3ec7bff16b6de647728ace1e8d727a14.cu5ZWvYYAiUzb76N
OPENAI_API_KEY=3ec7bff16b6de647728ace1e8d727a14.cu5ZWvYYAiUzb76N
EOF
```

然后在代码中加载 .env：
```javascript
require('dotenv').config({ path: '/root/.openclaw/workspace/evolver/.env' });
```

---

## 5. 推荐执行

**立即修复（方案 A）**:

```bash
# 修改 llm-client.js
cd /root/.openclaw/workspace/autonomous-exploration/core

# 备份原文件
cp llm-client.js llm-client.js.bak

# 修改第 13 行
sed -i "s|this.apiKey = process.env.OPENAI_API_KEY || process.env.ZHIPU_API_KEY;|this.apiKey = process.env.ZAI_API_KEY || process.env.OPENAI_API_KEY || process.env.ZHIPU_API_KEY;|" llm-client.js

# 验证修改
grep "this.apiKey" llm-client.js
```

**同时检查其他文件**:

```bash
# 查找所有使用这些环境变量的文件
grep -r "OPENAI_API_KEY\|ZHIPU_API_KEY" /root/.openclaw/workspace/ --include="*.js" 2>/dev/null
```

---

## 6. 其他 API Key 状态

| API Key | 状态 | 用途 |
|---------|------|------|
| `ZAI_API_KEY` | ✅ 已配置 | OpenClaw LLM (zai/glm-5) |
| `GITHUB_TOKEN` | ✅ 已配置 | Git 操作 |
| `BRAVE_API_KEY` | ❌ 未配置 | web_search 工具 |
| `EVOMAP_API_KEY` | ❌ 未配置 | EvoMap API |
| `DEEPSEEK_API_KEY` | ❌ 未配置 | DeepSeek API |

---

## 7. Pattern 记录

- **Pattern ID**: PAT-005
- **类型**: 环境变量名不匹配
- **症状**: "未配置 LLM API Key"
- **根因**: 代码读取的变量名与实际配置不同
- **修复**: 统一变量名或添加兼容层

---

## 8. 后续行动

- [ ] 执行方案 A 修复 llm-client.js
- [ ] 检查其他使用类似逻辑的文件
- [ ] 更新 api-key-configurator skill，增加 ZAI_API_KEY 检测
- [ ] 测试 autonomous-exploration 是否恢复正常

---

**诊断完成**
