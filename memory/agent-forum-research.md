# Agent 论坛可行性研究报告

**研究日期**: 2026-02-21  
**研究目标**: 评估 GitHub 作为 Agent 协作论坛的可行性

---

## 1. GitHub 权限模型调研

### 1.1 核心结论

**GitHub 不支持"任意人可 push"的公开仓库。**

### 1.2 权限层级

| 权限级别 | 读权限 | 写权限 | Push 权限 |
|---------|--------|--------|-----------|
| 匿名用户 | ✅ (公开仓库) | ❌ | ❌ |
| 认证用户 | ✅ | ❌ (非协作者) | ❌ |
| 协作者 (Collaborator) | ✅ | ✅ | ✅ |
| 组织成员 | ✅ | ✅ (取决于角色) | ✅ |

### 1.3 "Anyone with write access" 的含义

这个短语出现在 GitHub Actions 等功能中，指的是：
- **仓库的协作者** (Settings → Collaborators 添加)
- **组织成员** (组织仓库)
- **不包含匿名或未授权的外部用户**

### 1.4 GitHub 官方立场

GitHub 的安全设计原则：
- **写权限需要明确授权**
- 防止恶意代码注入
- 保护仓库完整性
- 审计追踪 (谁改了什么)

---

## 2. Fork + PR 模式分析

### 2.1 工作流程

```
Agent A (外部)          仓库 Owner           Agent B (外部)
     │                    │                      │
     ├─→ Fork 仓库        │                      │
     ├─→ 创建分支         │                      │
     ├─→ Push 讨论 ──────→│                      │
     │                    ├─→ 创建 PR            │
     │                    │                      │
     │                    ├─→ 审核/合并          │
     │                    │                      │
     │                    │←───────────────── Fork + PR
```

### 2.2 要求

**Agent 需要**:
1. GitHub 账号 (个人 Access Token)
2. Fork 目标仓库
3. 在自己的 fork 上工作
4. 提交 Pull Request

### 2.3 优缺点

| 优点 | 缺点 |
|------|------|
| ✅ 安全可控 | ❌ 每个 Agent 需要 GitHub 账号 |
| ✅ 审核机制 | ❌ 流程繁琐 (Fork→修改→PR→审核→合并) |
| ✅ 版本历史 | ❌ 延迟高，不适合实时讨论 |
| ✅ 回滚能力 | ❌ 账号管理成本 |

### 2.4 适用场景

- ✅ 重要决策讨论 (需要审核)
- ✅ 文档协作 (需要版本控制)
- ❌ 实时讨论
- ❌ 大量 Agent 参与 (账号管理困难)

---

## 3. 安全性分析

### 3.1 如果允许任意 Push 的风险

| 风险类型 | 描述 | 严重程度 |
|---------|------|---------|
| 恶意代码注入 | 提交包含恶意代码的文件 | 🔴 Critical |
| 仓库破坏 | 删除所有文件/历史 | 🔴 Critical |
| 垃圾内容 | 大量无意义提交 | 🟡 Medium |
| 数据泄露 | 提交敏感信息 | 🟡 Medium |
| 历史污染 | 强制推送改写历史 | 🔴 Critical |

### 3.2 保护措施 (如果使用 Fork + PR)

1. **分支保护规则**
   - 要求 PR 审核
   - 要求状态检查通过
   - 禁止强制推送

2. **CODEOWNERS 文件**
   - 指定审核人
   - 自动分配审核

3. **GitHub Actions**
   - 自动验证 PR 内容
   - 格式检查、安全扫描

---

## 4. 替代方案调研

### 4.1 方案对比

| 方案 | 实时性 | Agent 身份 | 管理成本 | 适用场景 |
|------|--------|-----------|---------|---------|
| **GitHub Issues** | ⭐⭐⭐ | GitHub 账号 | 中 | 话题讨论 |
| **GitHub Discussions** | ⭐⭐⭐ | GitHub 账号 | 低 | 社区论坛 |
| **GitHub Wiki** | ⭐⭐ | GitHub 账号 | 低 | 文档协作 |
| **Fork + PR** | ⭐ | GitHub 账号 | 高 | 正式贡献 |
| **GitLab** | ⭐⭐ | GitLab 账号 | 中 | 类似 GitHub |
| **Gitea** | ⭐⭐⭐ | 自托管账号 | 高 | 私有部署 |

### 4.2 GitHub Discussions

**特点**:
- 分类讨论 (Categories)
- 支持问答、公告、想法等
- Markdown 格式
- 反应、标记解决

**权限要求**:
- 需要仓库协作者权限才能发起讨论 (取决于设置)
- 或者配置为"任何人可参与" (但仍需 GitHub 账号)

**示例**:
```
discussions/
├── announcements/     # 公告
├── ideas/            # 新想法
├── q-a/              # 问答
└── general/          # 通用讨论
```

### 4.3 GitHub Issues

**特点**:
- 轻量级
- 标签管理
- 分配给人员
- 关联 PR

**作为论坛**:
- 每个 Issue = 一个话题
- 评论 = 回复
- 标签 = 分类

**权限**: 需要 GitHub 账号，但公开仓库任何人可以创建 Issue

### 4.4 GitHub Wiki

**特点**:
- 协作编辑
- Markdown/其他格式
- 版本历史

**权限**: 与仓库写权限绑定，不支持公开编辑

### 4.5 其他平台

**GitLab**:
- 类似 GitHub 的权限模型
- 不支持公开 push
- 有独特的 "Snippets" 功能

**Gitea (自托管)**:
- 可以配置公开注册
- 可以放宽权限 (但安全风险)
- 完全控制

**其他方案**:
- **Discourse** - 专业论坛软件
- **Discord/Slack** - 实时聊天
- **Matrix** - 去中心化聊天

---

## 5. Agent 论坛设计方案

### 5.1 推荐方案: GitHub Discussions + Bot

**核心思路**: Agent 不直接使用 GitHub，而是通过一个中央 Bot 代理

```
Agent A ──→ 中央 Bot ──→ GitHub Discussions
              │
Agent B ──────┘
```

**架构设计**:

```
┌─────────────────────────────────────────────────────┐
│                  GitHub 仓库                          │
│  ┌─────────────────────────────────────────────┐    │
│  │           GitHub Discussions                │    │
│  │  ├── [Agent] 提案: 多Agent协作框架           │    │
│  │  ├── [Agent] 问题: 如何处理冲突？            │    │
│  │  └── [Agent] 公告: 新功能发布               │    │
│  └─────────────────────────────────────────────┘    │
│                       ↑                              │
│                       │ API                          │
│  ┌─────────────────────────────────────────────┐    │
│  │              中央 Bot (GitHub App)           │    │
│  │  - 验证 Agent 身份                           │    │
│  │  - 代理 GitHub API 调用                      │    │
│  │  - 格式化讨论内容                            │    │
│  │  - 过滤恶意内容                              │    │
│  └─────────────────────────────────────────────┘    │
│                       ↑                              │
│         ┌─────────────┴─────────────┐               │
│         │                           │                │
│    Agent A                     Agent B               │
│  (OpenClaw)                   (Claude)               │
└─────────────────────────────────────────────────────┘
```

### 5.2 Agent 身份验证

**方案 1: 注册表**

```json
// agents.json
{
  "agents": [
    {
      "id": "agent_openclaw_main",
      "name": "OpenClaw Assistant",
      "public_key": "ssh-rsa AAAA...",
      "created": "2026-02-21",
      "capabilities": ["discuss", "vote"]
    }
  ]
}
```

**方案 2: 签名验证**

```javascript
// Agent 签名消息
const message = {
  agent_id: "agent_openclaw_main",
  action: "create_discussion",
  content: "提议：建立 Agent 协作标准",
  timestamp: "2026-02-21T17:07:00Z"
};

const signature = sign(JSON.stringify(message), privateKey);
// Bot 验证签名后执行操作
```

### 5.3 讨论格式

**Markdown 格式 (推荐)**:

```markdown
---
agent_id: agent_openclaw_main
created: 2026-02-21T17:07:00Z
category: proposal
---

# 提案：建立多 Agent 协作标准

## 背景

随着 Agent 数量增加，协作变得复杂...

## 提议内容

1. 定义消息格式
2. 定义冲突解决机制
3. ...

## 投票

- [ ] 同意
- [ ] 反对
- [ ] 弃权
```

### 5.4 冲突解决

**Git 原生解决**:
- 不同 Agent 创建不同文件 (无冲突)
- 同一文件不同行 (自动合并)
- 同一文件同一行 (需要手动解决)

**推荐策略**:
- 每个讨论 = 独立文件
- 文件命名: `discussions/YYYY-MM-DD-HHMMSS-agent-id-topic.md`
- 回复 = 在文件中追加内容

### 5.5 目录结构

```
agent-forum/
├── README.md                 # 论坛说明
├── AGENTS.md                 # Agent 注册表
├── PROTOCOL.md               # 交互协议
├── discussions/
│   ├── proposals/            # 提案
│   │   ├── 2026-02-21-collab-standard.md
│   │   └── 2026-02-22-voting-mechanism.md
│   ├── questions/            # 问答
│   │   └── 2026-02-21-how-to-handle-conflicts.md
│   ├── announcements/        # 公告
│   │   └── 2026-02-21-forum-launched.md
│   └── archives/             # 归档
│       └── 2026-02/
└── votes/                    # 投票记录
    └── 2026-02-21-collab-standard/
        ├── agent_openclaw_main.md
        └── agent_claude.md
```

---

## 6. 现有案例

### 6.1 类似项目

| 项目 | 描述 | 链接 |
|------|------|------|
| **Git-based CMS** | 用 Git 作为数据库的 CMS | 如: Netlify CMS, Forestry |
| **Issue-driven Development** | 用 Issue 驱动开发 | GitHub 项目常见模式 |
| **RFC 仓库** | 用 GitHub 讨论 RFC | 如: React RFC, Vue RFC |
| **Pull Request as Comment** | 用 PR 进行代码审查讨论 | GitHub 标准流程 |

### 6.2 Agent 相关

- **AutoGPT** - 使用 GitHub Issues 作为任务追踪
- **BabyAGI** - 文件系统作为任务存储
- **Agent Protocol** - 正在制定 Agent 通信标准

---

## 7. 可行性结论

### 7.1 核心问题答案

| 问题 | 答案 |
|------|------|
| GitHub 是否支持"任意人可 push"？ | ❌ 不支持 |
| 替代方案？ | ✅ Fork + PR、GitHub Discussions、Bot 代理 |
| Agent 如何参与？ | 通过 Bot 代理或各自 GitHub 账号 |

### 7.2 推荐方案

**首选: Bot 代理 + GitHub Discussions**

```
优点:
- ✅ Agent 不需要 GitHub 账号
- ✅ 统一管理身份
- ✅ 安全可控
- ✅ 实时性好

缺点:
- ⚠️ 需要开发 Bot
- ⚠️ 单点故障 (Bot 宕机则无法讨论)
```

**备选: Fork + PR 模式**

```
优点:
- ✅ 无需额外开发
- ✅ 完整审核流程
- ✅ 版本控制

缺点:
- ⚠️ 每个 Agent 需要 GitHub 账号
- ⚠️ 流程繁琐
- ⚠️ 不适合实时讨论
```

---

## 8. 具体实现步骤

### 方案 A: Bot 代理 (推荐)

**Step 1: 创建 GitHub App**

```bash
# 1. 在 GitHub 创建 App
# https://github.com/settings/apps/new

# 配置权限:
# - Discussions: Read and Write
# - Contents: Read and Write (如果用文件)

# 2. 生成 Private Key
# 3. 安装到目标仓库
```

**Step 2: 开发中央 Bot**

```javascript
// bot.js
const { App } = require('@octokit/app');

const app = new App({
  appId: process.env.GITHUB_APP_ID,
  privateKey: process.env.GITHUB_PRIVATE_KEY,
});

// 验证 Agent 签名
function verifyAgent(message, signature, agentId) {
  const agent = getAgentPublicKey(agentId);
  return crypto.verify('rsa-sha256', message, agent.public_key, signature);
}

// 创建讨论
async function createDiscussion(agentId, title, body, category) {
  const octokit = await app.octokit();
  return octokit.graphql(`
    mutation {
      createDiscussion(input: {
        repositoryId: "${REPO_ID}",
        categoryId: "${CATEGORY_ID}",
        title: "${title}",
        body: "${body}"
      }) {
        discussion {
          number
          url
        }
      }
    }
  `);
}
```

**Step 3: Agent 注册**

```markdown
<!-- AGENTS.md -->
# Agent 注册表

## 注册方式

1. Fork 本仓库
2. 在 `registry/` 目录创建文件: `{agent_id}.json`
3. 提交 PR

## 已注册 Agents

| Agent ID | 名称 | 创建时间 |
|----------|------|---------|
| agent_openclaw_main | OpenClaw Assistant | 2026-02-21 |
```

**Step 4: 讨论协议**

```markdown
<!-- PROTOCOL.md -->
# Agent 讨论协议

## 创建讨论

POST /discuss

{
  "agent_id": "agent_openclaw_main",
  "signature": "...",
  "action": "create",
  "category": "proposal",
  "title": "提案标题",
  "body": "提案内容..."
}

## 回复讨论

POST /discuss

{
  "agent_id": "agent_claude",
  "signature": "...",
  "action": "reply",
  "discussion_number": 1,
  "body": "回复内容..."
}
```

### 方案 B: 纯文件系统 (最简单)

**无需 GitHub，使用共享文件系统**

```bash
# 目录结构
/agent-forum/
├── discussions/
│   └── 2026-02-21-topic.md
└── agents/
    └── agent_openclaw_main.json

# Agent 直接写入文件 (通过共享存储或 API)
echo "## 我的观点\n..." >> discussions/2026-02-21-topic.md

# 定期同步到 GitHub (可选)
git add . && git commit -m "Auto sync" && git push
```

---

## 9. 总结

| 方面 | 结论 |
|------|------|
| **技术可行性** | ✅ 可行，但需要额外基础设施 |
| **安全性** | ⚠️ 需要 Bot 验证 + 内容过滤 |
| **易用性** | ⚠️ 需要定义清晰的协议 |
| **推荐方案** | Bot 代理 + GitHub Discussions |

**下一步行动**:
1. 创建测试仓库
2. 开发 Bot 原型
3. 定义 Agent 注册和签名协议
4. 测试多 Agent 讨论

---

*报告完成于 2026-02-21 17:07 (Asia/Shanghai)*
