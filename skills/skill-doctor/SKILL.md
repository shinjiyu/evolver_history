---
name: skill-doctor
description: 诊断并修复现有 OpenClaw skill 的问题，提升质量。适用于：(1) skill 触发不正常、(2) skill 内容需要优化、(3) 用户说"修一下这个skill"、"优化skill"、"skill有问题"、(4) skill 结构不符合规范。
---

# Skill Doctor - Skill 诊断与修复

对单个现有 skill 进行诊断、修复和改进。

## 与 log-to-skill 的区别

| | log-to-skill | skill-doctor |
|---|---|---|
| **输入** | 日志/对话历史 | 现有 skill |
| **目的** | 创建新 skill | 修复/改进现有 skill |
| **流程** | 提取模式 → 生成 | 诊断 → 修复 → 验证 |

## 核心流程

```
读取 skill → 诊断问题 → 分类修复 → 验证结果
```

### Step 1: 读取目标 Skill

首先确认要修复的 skill：

```bash
# 列出可用 skills
ls -la /root/.openclaw/workspace/skills/
ls -la /usr/lib/node_modules/openclaw/skills/

# 读取目标 skill
read <skill-path>/SKILL.md
```

### Step 2: 诊断检查清单

#### A. 结构检查

- [ ] `SKILL.md` 存在
- [ ] 有 YAML frontmatter
- [ ] frontmatter 有 `name` 字段
- [ ] frontmatter 有 `description` 字段
- [ ] 文件夹名与 skill name 一致
- [ ] 没有 README.md 等非必要文件

#### B. 内容检查

- [ ] description 足够详细，包含触发场景
- [ ] description 不会太长（< 200 字符）
- [ ] 有清晰的步骤/流程
- [ ] 参数说明完整（如有参数）
- [ ] 没有冗余解释

#### C. 触发性检查

- [ ] description 包含明确的触发关键词
- [ ] name 不与其他 skill 冲突
- [ ] 描述的场景足够具体

#### D. 可执行性检查

- [ ] 脚本有执行权限
- [ ] 脚本语法正确（如有脚本）
- [ ] 依赖的路径/工具可用
- [ ] 示例命令可以直接执行

### Step 3: 常见问题与修复

#### 问题 1: Description 太简单

**症状**：`description: "处理PDF文件"`

**修复**：
```yaml
description: PDF 文件处理，包括合并、拆分、旋转、提取文字。适用于：(1) 用户说"处理PDF"、"合并PDF"、(2) 需要操作 .pdf 文件。
```

#### 问题 2: 缺少触发场景

**症状**：description 没有说明何时使用

**修复**：添加"适用于：..."列表
```yaml
description: |
  <功能描述>。适用于：
  (1) <场景1>
  (2) <场景2>
  (3) <场景3>
```

#### 问题 3: 内容太冗长

**症状**：SKILL.md 超过 500 行，大量重复内容

**修复**：
- 移动详细文档到 `references/`
- 精简 SKILL.md 到核心流程
- 用脚本替代长段文字

#### 问题 4: 脚本无执行权限

**症状**：`scripts/*.sh` 或 `scripts/*.py` 不能直接执行

**修复**：
```bash
chmod +x scripts/*.sh scripts/*.py
```

#### 问题 5: 文件夹名与 name 不一致

**症状**：文件夹 `pdf-tool` 但 name 是 `pdf-processor`

**修复**：统一命名，推荐重命名文件夹

### Step 4: 自动修复

对于可自动修复的问题，直接修改：

```bash
# 添加脚本执行权限
chmod +x <skill>/scripts/*

# 读取并修改 SKILL.md
read <skill>/SKILL.md
edit <skill>/SKILL.md "old text" "new text"
```

### Step 5: 手动修复建议

对于需要判断的问题，输出建议：

```markdown
## 诊断结果

**Skill**: <name>
**路径**: <path>

### 问题列表

1. [严重] description 缺少触发场景
   - 建议：添加"适用于：..."部分

2. [中等] SKILL.md 过长（800行）
   - 建议：拆分到 references/

3. [轻微] 脚本缺少 shebang
   - 建议：在脚本开头添加 #!/bin/bash

### 推荐修复顺序

1. 先修复严重问题
2. 测试触发
3. 再优化内容
```

### Step 6: 验证修复

修复后验证：

1. **语法检查**：YAML frontmatter 格式正确
2. **触发测试**：description 包含足够关键词
3. **执行测试**：按 SKILL.md 步骤可执行

## 输出格式

诊断完成后输出：

```markdown
# Skill 诊断报告

**Skill**: <name>
**状态**: <健康/需修复/严重问题>

## 问题汇总

| 优先级 | 类型 | 描述 | 状态 |
|--------|------|------|------|
| P0 | 结构 | 缺少 frontmatter | ✅ 已修复 |
| P1 | 内容 | description 太简单 | ⚠️ 需手动 |
| P2 | 结构 | README.md 多余 | ✅ 已删除 |

## 改进建议

1. <建议1>
2. <建议2>
3. <建议3>

## 修复后的 SKILL.md

<如果做了修改，显示 diff 或新内容>
```

## 特殊场景

### 场景 1: Skill 完全无法触发

1. 检查是否在配置中注册
2. 检查 description 是否有匹配关键词
3. 检查 name 是否冲突

### 场景 2: Skill 执行报错

1. 读取脚本内容
2. 检查依赖是否安装
3. 检查路径是否正确
4. 添加错误处理

### 场景 3: Skill 需要重构

1. 分析当前结构
2. 提取可复用部分
3. 重新组织文件
4. 更新 SKILL.md

---

使用此 skill 时，指定要诊断的 skill 名称或路径，我会输出诊断报告和修复建议。
