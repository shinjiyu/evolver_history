---
name: log-to-skill
description: 分析日志/对话历史，提炼可复用流程，自动生成 OpenClaw skills。适用于：(1) 用户说"从日志生成skill"、"把这段流程做成skill"、(2) 发现重复执行相同操作序列、(3) 想把某个工作流固化下来、(4) 分析 session transcript 提取模式。
---

# Log to Skill - 日志转技能

将日志、对话历史或操作记录转化为可复用的 OpenClaw skill。

## 核心流程

```
输入日志 → 识别模式 → 提炼流程 → 生成 SKILL.md → 打包分发
```

### Step 1: 收集输入

支持的输入类型：
- **Session transcript** - 会话记录文件（`.jsonl`）
- **对话历史** - 直接粘贴的对话内容
- **Shell 日志** - 命令执行记录
- **用户描述** - 口述的工作流程

如果是文件，先读取内容：
```
read /root/.openclaw/workspace/<session-id>.jsonl
```

### Step 2: 分析模式

分析日志时关注：

**重复出现的模式：**
- 多次执行的相同命令序列
- 反复使用的参数组合
- 前置条件 → 执行 → 后处理的固定流程

**可参数化的部分：**
- 变化的值（路径、名称、ID）→ 变成参数
- 固定的结构 → 硬编码到 skill

**依赖项：**
- 需要的工具（curl, jq, python 等）
- 外部 API 或服务
- 前置配置

### Step 3: 设计 Skill 结构

根据复杂度选择结构：

**简单流程（< 5 步）**
```
skill-name/
└── SKILL.md    # 全部指令在 md 里
```

**中等复杂（5-15 步）**
```
skill-name/
├── SKILL.md
└── scripts/
    └── main.sh   # 核心脚本
```

**复杂流程（> 15 步或有变体）**
```
skill-name/
├── SKILL.md
├── scripts/
│   ├── setup.sh
│   └── execute.sh
└── references/
    └── advanced.md
```

### Step 4: 生成 SKILL.md

模板结构：

```markdown
---
name: <skill-name>
description: <一句话描述>。适用于：<触发场景列表>
---

# <Skill 名称>

<简短介绍，1-2 句>

## 快速开始

<最常用的使用方式，1 个示例>

## 参数

- `<param1>` - 说明
- `<param2>` - 说明（可选，默认值）

## 流程

1. <步骤1>
2. <步骤2>
3. <步骤3>

## 脚本

<如果有脚本，说明调用方式>

## 注意事项

<坑点、限制、依赖>
```

### Step 5: 验证并打包

1. 验证 skill 结构：
```bash
# 检查必需文件
ls -la <skill-dir>/SKILL.md
```

2. 测试 skill 内容：
- frontmatter 是否有 name 和 description
- 描述是否足够详细，能让 agent 知道何时触发
- 流程是否清晰可执行

3. 打包（如果需要）：
```bash
cd <skill-dir> && zip -r ../<skill-name>.skill .
```

## 分析技巧

### 识别可自动化的信号

日志中出现以下模式时，说明可以提炼成 skill：

1. **高频重复** - 同样的命令/流程出现 3 次以上
2. **参数模式** - 只有路径/名称变化，结构不变
3. **前置检查** - 每次都先检查某个条件
4. **错误处理** - 每次都有相同的失败恢复逻辑

### 提炼通用流程的方法

1. **抽象参数**
   - 把具体值替换为 `<param>` 占位符
   - 标注哪些是必需的，哪些有默认值

2. **分离关注点**
   - 核心逻辑 → SKILL.md
   - 复杂脚本 → scripts/
   - 参考文档 → references/

3. **精简指令**
   - 删除冗余解释
   - 保留关键步骤
   - 用代码代替长文本

## 输出规范

生成的 skill 应该：

✅ **要做的：**
- name 使用小写 + 连字符（如 `deploy-service`）
- description 包含触发场景
- 流程步骤具体可执行
- 参数有默认值

❌ **不要做的：**
- 不要在 description 写使用指南
- 不要创建 README.md 等非必要文件
- 不要写太长的 SKILL.md（< 500 行）

## 示例

**输入：** 用户多次执行部署流程的日志

**输出：**
```
deploy-api/
├── SKILL.md
└── scripts/
    └── deploy.sh
```

SKILL.md 内容：
```markdown
---
name: deploy-api
description: 部署 API 服务到生产环境。适用于：用户说"部署"、"发布"、"上线 API"。
---

# Deploy API

部署 Node.js API 服务。

## 参数

- `service` - 服务名称（必需）
- `env` - 环境名称（可选，默认 production）

## 流程

1. 拉取最新代码
2. 安装依赖
3. 运行测试
4. 构建镜像
5. 推送到仓库
6. 更新部署

## 脚本

\`\`\`bash
scripts/deploy.sh <service> [env]
\`\`\`
```

---

使用此 skill 时，提供日志或描述，我会自动生成可用的 skill 包。
