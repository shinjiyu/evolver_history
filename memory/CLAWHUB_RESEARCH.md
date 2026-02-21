# ClawHub Skills 调研报告

**调研日期**: 2026-02-21  
**调研工具**: ClawHub CLI v0.7.0

---

## 1. ClawHub 简介

ClawHub (https://clawhub.com 或 https://clawhub.ai) 是 OpenClaw 官方的 Skills 注册中心，提供：
- **搜索功能**: 向量搜索找到相关 skills
- **安装功能**: 一键安装 skills 到 workspace
- **发布功能**: 将自定义 skills 发布到社区
- **版本管理**: 支持 semantic versioning

### 安装 ClawHub CLI

```bash
npm install -g clawhub
```

---

## 2. 本地已安装 Skills

### 内置 Skills (`/root/openclaw-fork/skills/`)
共 **51** 个内置 skills，主要包括：

| 分类 | Skills |
|------|--------|
| **沟通渠道** | discord, slack, telegram, whatsapp, signal, imessage, bluebubbles, irc, matrix, msteams, googlechat, zalo |
| **工具集成** | github, notion, obsidian, trello, things-mac, apple-notes, apple-reminders, bear-notes |
| **语音/TTS** | sag, voice-call, openai-whisper, openai-whisper-api, sherpa-onnx-tts |
| **AI/ML** | gemini, openai-image-gen, oracle, summarize |
| **媒体处理** | video-frames, nano-pdf, songsee, gifgrep |
| **设备控制** | canvas, camsnap, peekaboo, sonoscli, spotify-player |
| **开发工具** | coding-agent, tmux, skill-creator, healthcheck |
| **其他** | weather, 1password, food-order, himalaya (email) |

### Workspace 自定义 Skills (`/root/.openclaw/workspace/skills/`)
共 **6** 个自定义 skills：

| Skill | 用途 |
|-------|------|
| `adversarial-evaluation` | 对抗式评估 - 正反方辩论进行中立评估 |
| `cross-evolution` | 交叉进化框架 - Agent 自我改进 |
| `hr` | 智能团队招募与协作编排 |
| `log-to-skill` | 从日志分析生成 Skill |
| `neutral-judge-experiments` | 中立判断实验 |
| `skill-doctor` | 诊断并修复现有 Skill 问题 |

---

## 3. ClawHub 高价值 Skills 推荐

基于搜索结果和相关度评分 (向量相似度)，推荐以下 **10** 个高价值 skills：

### 🏆 Top 10 推荐清单

| 排名 | Skill | 版本 | 评分 | 用途 | 推荐理由 |
|------|-------|------|------|------|----------|
| 1 | **devops** | v1.0.0 | 3.557 | DevOps 运维管理 | 内置 DevOps 最佳实践，适合服务器运维场景 |
| 2 | **notion** | v1.0.0 | 3.657 | Notion API 集成 | 知识库管理，与飞书类似但更灵活 |
| 3 | **gcalcli-calendar** | v3.0.0 | 3.560 | Google 日历管理 | 完整的日历 CRUD 操作 |
| 4 | **test-runner** | v1.0.0 | 3.559 | 测试运行器 | 自动化测试，CI/CD 集成 |
| 5 | **mcp-skill** | v1.0.0 | 3.565 | MCP 协议集成 | 支持 Anthropic Model Context Protocol |
| 6 | **api-gateway** | v1.0.42 | 3.594 | API 网关管理 | API 设计和管理最佳实践 |
| 7 | **security-auditor** | v1.0.0 | 3.458 | 安全审计 | 代码安全扫描和漏洞检测 |
| 8 | **evolver** | v1.14.0 | - | Agent 自进化引擎 | 分析运行时行为，持续改进 |
| 9 | **coding** | v1.0.3 | 3.467 | 代码编写助手 | 通用编码能力增强 |
| 10 | **imap-smtp-email** | v0.0.2 | 3.523 | 邮件处理 | IMAP/SMTP 邮件收发 |

---

## 4. 分类推荐

### 🔒 安全类

| Skill | 评分 | 描述 |
|-------|------|------|
| security-auditor | 3.458 | 代码安全审计 |
| security-audit-toolkit | 3.427 | 安全审计工具集 |
| clawdbot-security-check | 3.454 | 安全检查机器人 |
| information-security-manager-iso27001 | 3.312 | ISO27001 信息安全管理 |

### 📧 邮件类

| Skill | 评分 | 描述 |
|-------|------|------|
| imap-smtp-email | 3.523 | IMAP/SMTP 协议 |
| email-daily-summary | 3.468 | 每日邮件摘要 |
| fastmail-jmap | 1.0.0 | Fastmail JMAP 协议 |
| sendclaw-email | 3.371 | 免费邮箱创建 |

### 📊 数据库类

| Skill | 评分 | 描述 |
|-------|------|------|
| database-operations | 3.414 | 数据库操作 |
| snowflake-mcp | 3.450 | Snowflake MCP 连接 |
| sql-toolkit | 0.946 | SQL 工具集 |
| duckdb-cli-ai-skills | 0.876 | DuckDB CLI |

### 🤖 AI Agent 类

| Skill | 评分 | 描述 |
|-------|------|------|
| ai-agent-helper | 3.397 | AI Agent 帮助 |
| evolver | - | 自进化引擎 |
| agent-orchestrator | 1.072 | Agent 编排 |
| solo-swarm | 1.5.0 | 3 个并行研究 Agent |

### 📝 代码审查类

| Skill | 评分 | 描述 |
|-------|------|------|
| code-review | 3.501 | 代码审查 |
| receiving-code-review | 3.501 | 接收代码审查 |
| pr-code-reviewer | 2.322 | PR 代码审查 |
| critical-code-reviewer | 2.410 | 批判性代码审查 |

### 🔗 MCP (Model Context Protocol) 类

| Skill | 评分 | 描述 |
|-------|------|------|
| mcp-skill | 3.565 | MCP 技能框架 |
| playwright-mcp | 3.543 | Playwright MCP |
| atlassian-mcp | 3.488 | Jira/Confluence MCP |
| clickup-mcp | 3.481 | ClickUp MCP |
| filesystem-mcp | 2.107 | 文件系统 MCP |

### 🗓️ 日历类

| Skill | 评分 | 描述 |
|-------|------|------|
| gcalcli-calendar | 3.560 | Google 日历 |
| macos-calendar | 3.378 | macOS 日历 |
| feishu-calendar | 3.457 | 飞书日历 |
| lark-calendar | 3.491 | Lark 日历 |

---

## 5. 特色 Skills 推荐

### 🚀 evolver - Agent 自进化引擎
```bash
clawhub install evolver
```
**特点**: 分析 Agent 运行时行为，自动识别改进机会，支持持续学习

### 🎯 solo-swarm - 多 Agent 协作
```bash
clawhub install solo-swarm
```
**特点**: 启动 3 个并行研究 Agent（市场、用户、竞品），适合创业调研

### 📊 fundamental-stock-analysis - 股票基本面分析
```bash
clawhub install fundamental-stock-analysis
```
**特点**: 基本面分析 + 同行排名，适合投资决策

### 🎨 cheapest-image - 最便宜 AI 图像生成
```bash
clawhub install cheapest-image
```
**特点**: ~$0.003/张，成本极低的 AI 图像生成

### 🍳 recipe-video-extractor - 食谱视频提取
```bash
clawhub install recipe-video-extractor
```
**特点**: 从烹饪视频中提取结构化食谱

---

## 6. 安装命令

### 安装单个 Skill
```bash
# 安装到当前目录的 skills/ 文件夹
clawhub install devops

# 安装到指定目录
clawhub install notion --workdir /root/.openclaw/workspace

# 安装特定版本
clawhub install evolver --version 1.14.0
```

### 批量安装推荐
```bash
# 基础工具集
clawhub install devops
clawhub install test-runner
clawhub install security-auditor

# 集成工具
clawhub install gcalcli-calendar
clawhub install imap-smtp-email

# MCP 支持
clawhub install mcp-skill
```

### 更新已安装 Skills
```bash
# 更新单个
clawhub update evolver

# 更新全部
clawhub update --all
```

---

## 7. 总结

### 本地 vs ClawHub 对比

| 方面 | 本地内置 | ClawHub |
|------|----------|---------|
| Skills 数量 | ~51 | 数百+ |
| 更新频率 | 跟随版本发布 | 实时更新 |
| 定制性 | 需修改源码 | 可独立安装 |
| 社区贡献 | 有限 | 开放平台 |

### 推荐安装优先级

1. **高优先级** (立即安装):
   - `devops` - 运维必备
   - `security-auditor` - 安全审计
   - `evolver` - Agent 进化

2. **中优先级** (按需安装):
   - `mcp-skill` - MCP 协议支持
   - `gcalcli-calendar` - 日历集成
   - `imap-smtp-email` - 邮件处理

3. **低优先级** (特定场景):
   - `solo-swarm` - 多 Agent 协作
   - `fundamental-stock-analysis` - 股票分析
   - 其他垂直领域 skills

---

**报告生成时间**: 2026-02-21 15:30 (Asia/Shanghai)
