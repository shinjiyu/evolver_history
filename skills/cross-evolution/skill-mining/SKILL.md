---
name: skill-mining
description: Skill 挖掘技能 - 从日志分析结果中提炼可复用的 Skill/Rule。适用于：(1) 用户说"生成 skill"、"提炼模式"、(2) 需要将重复工作流固化、(3) 需要将领域知识编码。
---

# Skill 挖掘技能

从日志分析结果中提炼可复用的 Skill/Rule。

## 输入来源

1. `log-analysis` 的输出报告
2. 直接分析会话日志
3. 用户描述的工作流程

## 模式识别

### 5 种模式类型

| 类型 | 判定标准 | 落地形式 |
|------|----------|----------|
| **重复工作流** | 同一步骤序列出现 ≥2 次 | Skill（Workflow） |
| **领域知识** | 特定技术栈的非通用知识 | Skill（Knowledge） |
| **专业角色** | 需要特定人格/视角 | Subagent/Skill |
| **错误预防** | 相同错误重复出现 | Skill（注意事项） |
| **工具编排** | 固定的工具组合序列 | Skill（流程） |

## 生成流程

### Step 1: 收集模式

从日志分析报告中提取：
- 重复出现的步骤序列
- 常见的错误和解决方案
- 领域特定的知识

### Step 2: 抽象化

将具体操作抽象为可复用的模板：

```
具体：执行 docker ps, docker logs xxx, docker exec xxx
抽象：容器诊断流程 → 列出容器 → 查看日志 → 进入容器
```

### Step 3: 生成 Skill 文件

```markdown
---
name: <skill-name>
description: <一句话描述>。适用于：<触发场景>
---

# <Skill 名称>

<简短介绍>

## 快速开始

<最常用的使用方式>

## 流程

1. <步骤1>
2. <步骤2>
3. <步骤3>

## 参数

- `<param1>` - 说明

## 注意事项

- <坑点1>
- <坑点2>

## 示例

<具体示例>
```

### Step 4: 验证

- [ ] frontmatter 有 name 和 description
- [ ] description 包含触发场景
- [ ] 流程步骤具体可执行
- [ ] 没有与现有 Skill 重复

### Step 5: 写入

```bash
# 写入新 Skill
write /root/.openclaw/workspace/skills/<skill-name>/SKILL.md
```

## 质量检查

### 置信度标注

| 来源 | 置信度 |
|------|--------|
| 单次会话 | 低，标注"待验证" |
| 2-3 次会话 | 中 |
| ≥5 次会话 | 高 |

### 一致性检查

- [ ] 不与已有 Skill 矛盾
- [ ] 不与已有 Skill 重复
- [ ] 抽象层次适当

## 历史追踪

生成后写入进化历史：

```markdown
## [日期] 新增 Skill: <name>
- 来源：日志分析 Round N
- 置信度：高/中/低
- 关联模式：PAT-XXX
```

---

使用此技能时，说"生成 skill"或"用 skill-mining 提炼"。
