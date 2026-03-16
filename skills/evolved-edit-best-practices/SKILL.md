---
name: evolved-edit-best-practices
description: Edit 操作最佳实践 - 减少 Edit 失败，提高操作成功率。适用于：(1) Edit 操作频繁失败、(2) 文本匹配失败、(3) 重复文本处理、(4) 大文件编辑。
---

# Edit 操作最佳实践 (Evolved Edit Best Practices)

**核心理念**：通过预检查和最佳实践，将 Edit 操作成功率从当前的低水平提升至接近 100%。

## 问题背景

### PAT-008: Edit 操作频繁失败

**发现时间**: 2026-03-16 08:30

| 指标 | 数值 | 说明 |
|------|------|------|
| 失败次数 | **161 次** | 过去 12 小时 |
| 失败类型 | 文本不匹配 | Could not find exact text |
| 重复文本 | 9 次 | Found X occurrences |
| 影响 | **所有 Edit 操作** | 严重 |

**错误类型分布**:
```
1. "Could not find the exact text" - 161 次（96%）
2. "Found X occurrences" - 9 次（4%）
3. 其他错误 - 少量
```

**示例错误**:
```
"error","tool":"edit","error":"Could not find the exact text in /root/.openclaw/workspace/memory/2026-03-15.md. The old text must match exactly including all whitespace and newlines."

"error","tool":"edit","error":"Found 2 occurrences of the text in /root/.openclaw/workspace/TASKS.md. The text must be unique. Please provide more context to make it unique."
```

**根因分析**:
1. **文本不匹配** - 空格、换行、缩进不一致
2. **缺少预检查** - Edit 前未读取文件确认文本
3. **上下文不足** - 使用简短文本导致重复匹配
4. **文件更新** - 文件内容已变化，旧文本不存在

## 核心原则

### 1. 永远先 Read，再 Edit

**错误做法**:
```
❌ 直接 Edit，假设文本存在
edit({
  path: "file.md",
  oldText: "## 标题",
  newText: "## 新标题"
})
```

**正确做法**:
```
✅ 先 Read 确认，再 Edit
const content = read({ path: "file.md" })
if (content.includes("## 标题")) {
  edit({
    path: "file.md",
    oldText: "## 标题",
    newText: "## 新标题"
  })
} else {
  console.log("文本不存在，跳过 Edit")
}
```

### 2. 提供足够的上下文

**错误做法**:
```
❌ 使用简短文本（容易重复）
oldText: "## 标题"
```

**正确做法**:
```
✅ 包含上下文（确保唯一）
oldText: `## 标题

这是第一段内容。
- 列表项 1
- 列表项 2`
```

### 3. 精确匹配，包括空白字符

**错误做法**:
```
❌ 忽略空格和换行
oldText: "## 标题\n内容"
```

**正确做法**:
```
✅ 精确复制原文（包括所有空格、换行、缩进）
oldText: "## 标题\n\n内容\n  - 缩进项"
```

## 最佳实践流程

### 标准流程（推荐）

```markdown
## Step 1: Read 文件
read({ path: "file.md" })

## Step 2: 确认文本存在
if (文本存在) {
  ## Step 3: 提取精确文本（复制粘贴）
  oldText = 从 Read 结果中精确复制
  
  ## Step 4: 检查唯一性
  if (文本重复) {
    扩大上下文，使其唯一
  }
  
  ## Step 5: Edit
  edit({
    path: "file.md",
    oldText: oldText,  // 精确复制的文本
    newText: "新内容"
  })
} else {
  记录日志，跳过 Edit
}
```

### 快速流程（已确认文本存在）

```markdown
## 适用于：你刚 Read 过文件，确定文本存在

edit({
  path: "file.md",
  oldText: "精确文本",  // 必须从 Read 结果中复制
  newText: "新内容"
})
```

## 常见错误和解决方案

### 错误 1: 文本不匹配

**错误信息**:
```
Could not find the exact text in file.md. The old text must match exactly including all whitespace and newlines.
```

**原因**:
1. 空格不一致（空格 vs 制表符）
2. 换行不一致（\n vs \r\n）
3. 缩进不一致
4. 文本已被修改

**解决方案**:
```markdown
1. ✅ 重新 Read 文件
2. ✅ 从 Read 结果中**精确复制**文本
3. ✅ 确保包含所有空白字符
4. ✅ 如果文件可能已修改，重新确认
```

### 错误 2: 文本重复

**错误信息**:
```
Found 2 occurrences of the text in file.md. The text must be unique. Please provide more context to make it unique.
```

**原因**:
- 文本太短，在文件中出现多次

**解决方案**:
```markdown
1. ✅ 扩大上下文（包含更多行）
2. ✅ 包含独特的标识符
3. ✅ 使用更长的文本块

示例：
❌ oldText: "- 列表项"（重复 5 次）
✅ oldText: "## 章节 1\n\n- 列表项\n\n## 章节 2"（唯一）
```

### 错误 3: 文件不存在

**错误信息**:
```
ENOENT: no such file or directory, access 'file.md'
```

**原因**:
- 文件不存在或路径错误

**解决方案**:
```markdown
1. ✅ Edit 前先 Read 检查文件存在性
2. ✅ 使用 write 创建文件（如果不存在）
3. ✅ 检查路径是否正确

if (read({ path: "file.md" }).success) {
  edit({ ... })
} else {
  write({ path: "file.md", content: "初始内容" })
}
```

## Edit 操作类型和策略

### 1. 替换单行

**适用场景**: 替换单个配置项、标题等

**最佳实践**:
```markdown
✅ 包含上下文
oldText: `## 配置

api_key: "old_key"`

newText: `## 配置

api_key: "new_key"`
```

### 2. 替换多行

**适用场景**: 替换代码块、列表等

**最佳实践**:
```markdown
✅ 精确复制整个块
oldText: `function old() {
  console.log("old")
}`

newText: `function new() {
  console.log("new")
}`
```

### 3. 插入内容

**适用场景**: 在特定位置插入新内容

**最佳实践**:
```markdown
✅ 包含插入点前后的内容
oldText: `## 标题 1

## 标题 2`

newText: `## 标题 1

### 新子标题

## 标题 2`
```

### 4. 删除内容

**适用场景**: 删除某个部分

**最佳实践**:
```markdown
✅ 包含删除内容前后的内容
oldText: `## 标题 1

要删除的内容

## 标题 2`

newText: `## 标题 1

## 标题 2`
```

## 特殊情况处理

### 情况 1: 大文件 Edit

**问题**: 大文件可能有多个相似的文本块

**解决方案**:
```markdown
1. ✅ 使用更大的上下文
2. ✅ 包含文件特有的标识符
3. ✅ 考虑先 Read 特定行范围

read({ path: "large.md", offset: 100, limit: 50 })
```

### 情况 2: 频繁更新的文件

**问题**: 文件可能在 Read 和 Edit 之间被修改

**解决方案**:
```markdown
1. ✅ Read 和 Edit 在同一操作中完成
2. ✅ 使用时间戳或版本号验证
3. ✅ 失败后重新 Read 再 Edit
```

### 情况 3: 自动化脚本 Edit

**问题**: 脚本中的 Edit 可能因文件变化而失败

**解决方案**:
```markdown
1. ✅ 添加错误处理和重试
2. ✅ 失败后重新 Read
3. ✅ 记录失败日志

try {
  edit({ ... })
} catch (error) {
  log("Edit failed, re-reading file")
  content = read({ path: "file.md" })
  // 重新提取文本，再次尝试
}
```

## 性能优化

### 1. 批量 Edit

**错误做法**:
```
❌ 多次 Edit 同一文件
edit({ path: "file.md", oldText: "A", newText: "A1" })
edit({ path: "file.md", oldText: "B", newText: "B1" })
edit({ path: "file.md", oldText: "C", newText: "C1" })
```

**正确做法**:
```
✅ 一次 Edit 包含所有更改
edit({
  path: "file.md",
  oldText: `A
B
C`,
  newText: `A1
B1
C1`
})
```

### 2. 避免不必要的 Edit

**检查是否需要 Edit**:
```markdown
if (currentContent === newContent) {
  console.log("内容相同，跳过 Edit")
  return
}
```

## 监控和统计

### Edit 成功率监控

**指标**:
- Edit 总次数
- 成功次数
- 失败次数（按类型分类）
- 成功率

**目标**:
- 成功率 > 95%（当前 < 50%）
- 失败次数 < 5 次/天（当前 161 次/12小时）

### 日志记录

**记录内容**:
```json
{
  "timestamp": "2026-03-16T08:30:00Z",
  "operation": "edit",
  "path": "file.md",
  "status": "failed",
  "errorType": "text_not_found",
  "oldTextLength": 50,
  "retryCount": 0
}
```

## 配置选项

```json5
{
  editBestPractices: {
    alwaysReadFirst: true,        // 总是先 Read
    minContextLines: 2,           // 最少上下文行数
    maxRetryAttempts: 2,          // 最大重试次数
    logFailures: true,            // 记录失败日志
    targetSuccessRate: 0.95,      // 目标成功率
    alertOnLowSuccessRate: true   // 低成功率时告警
  }
}
```

## 与其他 Skill 集成

1. **file-existence-checker** - Edit 前检查文件存在性
2. **safe-operations** - 安全操作最佳实践
3. **git-workflow** - Edit 后自动提交

## 相关 Patterns

- **PAT-008**: Edit 操作频繁失败 → 最佳实践 (🔧已解决)
- **PAT-009**: 文件不存在错误 → 存在性检查 (待创建)

---

**创建时间**: 2026-03-16 08:30
**创建者**: OpenClaw Evolver System (Round 333)
**版本**: 1.0
**优先级**: P0（最高）
