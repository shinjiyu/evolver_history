---
name: evolved-file-existence-checker
description: 文件存在性检查器 - 在 Read/Edit 前检查文件存在性，避免 ENOENT 错误。适用于：(1) Read 前检查、(2) Edit 前检查、(3) 目录创建、(4) 文件操作安全性。
---

# 文件存在性检查器 (Evolved File Existence Checker)

**核心理念**：通过预检查文件存在性，避免 ENOENT 错误，提高文件操作成功率。

## 问题背景

### PAT-009: 文件不存在错误频繁出现

**发现时间**: 2026-03-16 08:30

| 指标 | 数值 | 说明 |
|------|------|------|
| 错误次数 | **100 次** | 过去 12 小时 |
| 错误类型 | ENOENT | no such file or directory |
| 影响 | **Read/Edit 操作** | 严重 |

**错误示例**:
```
"error","tool":"read","error":"ENOENT: no such file or directory, access '/root/.openclaw/workspace/evolver_history/pattern-registry.md'"

"error","tool":"read","error":"ENOENT: no such file or directory, access '/root/.openclaw/workspace/evolver/nginx-security.sh'"

"error","tool":"read","error":"ENOENT: no such file or directory, access '/root/.openclaw/skills/recap-decompose/SKILL.md'"
```

**根因分析**:
1. **缺少预检查** - Read 前未检查文件是否存在
2. **路径错误** - 文件路径不正确
3. **文件被删除** - 文件已被清理或删除
4. **目录不存在** - 父目录不存在

**影响评估**:
- 🔴 Read 操作失败率增加
- 🔴 后续依赖该文件的 Edit 操作也会失败
- 🟡 影响自动化脚本执行
- 🟢 可通过预检查避免

## 核心功能

### 1. 文件存在性检查

**基本检查**:
```bash
# 检查文件是否存在
if [ -f "/path/to/file" ]; then
  echo "文件存在"
else
  echo "文件不存在"
fi
```

**高级检查**:
```bash
# 检查文件是否存在且可读
if [ -f "/path/to/file" ] && [ -r "/path/to/file" ]; then
  echo "文件存在且可读"
else
  echo "文件不存在或不可读"
fi
```

### 2. 目录存在性检查

**基本检查**:
```bash
# 检查目录是否存在
if [ -d "/path/to/directory" ]; then
  echo "目录存在"
else
  echo "目录不存在"
fi
```

**自动创建目录**:
```bash
# 如果目录不存在，自动创建
mkdir -p "/path/to/directory"
```

### 3. 批量检查

**检查多个文件**:
```bash
files=(
  "/root/.openclaw/workspace/MEMORY.md"
  "/root/.openclaw/workspace/TASKS.md"
  "/root/.openclaw/workspace/memory/2026-03-16.md"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "✅ $file"
  else
    echo "❌ $file (不存在)"
  fi
done
```

## 使用方式

### 方式 1: Read 前检查（推荐）

**错误做法**:
```
❌ 直接 Read，假设文件存在
read({ path: "file.md" })
```

**正确做法**:
```
✅ 先检查，再 Read
const result = read({ path: "file.md" })
if (result.error && result.error.includes("ENOENT")) {
  console.log("文件不存在，使用默认值")
  // 创建文件或使用默认内容
  write({ path: "file.md", content: "# 默认内容" })
} else {
  // 使用读取的内容
  console.log(result.content)
}
```

### 方式 2: Edit 前检查

**错误做法**:
```
❌ 直接 Edit，假设文件存在
edit({
  path: "file.md",
  oldText: "旧内容",
  newText: "新内容"
})
```

**正确做法**:
```
✅ 先 Read 检查，再 Edit
const result = read({ path: "file.md" })
if (result.error) {
  console.log("文件不存在，跳过 Edit")
} else {
  edit({
    path: "file.md",
    oldText: "旧内容",
    newText: "新内容"
  })
}
```

### 方式 3: 创建文件前检查

**最佳实践**:
```
✅ 检查文件是否存在，不存在则创建
const result = read({ path: "file.md" })
if (result.error && result.error.includes("ENOENT")) {
  // 文件不存在，创建新文件
  write({ path: "file.md", content: "# 新文件\n\n初始内容" })
  console.log("文件已创建")
} else {
  // 文件已存在，追加内容
  const newContent = result.content + "\n\n## 新章节\n\n新内容"
  write({ path: "file.md", content: newContent })
  console.log("内容已追加")
}
```

## 常见场景和解决方案

### 场景 1: 读取配置文件

**问题**: 配置文件可能不存在

**解决方案**:
```markdown
1. ✅ 尝试 Read
2. ✅ 如果 ENOENT，使用默认配置
3. ✅ 可选：创建配置文件

const config = read({ path: "config.json" })
if (config.error) {
  // 使用默认配置
  const defaultConfig = { setting: "default" }
  // 可选：创建配置文件
  write({ path: "config.json", content: JSON.stringify(defaultConfig) })
  return defaultConfig
} else {
  return JSON.parse(config.content)
}
```

### 场景 2: 编辑日志文件

**问题**: 日志文件可能还未创建

**解决方案**:
```markdown
1. ✅ 检查文件是否存在
2. ✅ 不存在则创建
3. ✅ 追加日志内容

const today = "2026-03-16"
const logFile = `logs/${today}.log`

const result = read({ path: logFile })
if (result.error) {
  // 创建新日志文件
  write({ path: logFile, content: `[${new Date().toISOString()}] 日志开始\n` })
} else {
  // 追加日志
  const newContent = result.content + `[${new Date().toISOString()}] 新日志条目\n`
  write({ path: logFile, content: newContent })
}
```

### 场景 3: 读取 Skills 文件

**问题**: Skill 文件可能不存在

**解决方案**:
```markdown
1. ✅ 尝试 Read
2. ✅ 如果 ENOENT，跳过或使用默认 Skill
3. ✅ 记录日志

const skillPath = "skills/my-skill/SKILL.md"
const result = read({ path: skillPath })

if (result.error) {
  console.log(`Skill 不存在: ${skillPath}`)
  // 使用默认 Skill 或跳过
  return null
} else {
  // 解析 Skill
  return parseSkill(result.content)
}
```

### 场景 4: 批量处理文件

**问题**: 某些文件可能不存在

**解决方案**:
```markdown
1. ✅ 遍历文件列表
2. ✅ 对每个文件检查存在性
3. ✅ 跳过不存在的文件

const files = ["file1.md", "file2.md", "file3.md"]
const results = []

for (const file of files) {
  const result = read({ path: file })
  if (result.error) {
    console.log(`跳过不存在的文件: ${file}`)
    continue
  }
  results.push(result.content)
}
```

## 目录管理

### 1. 自动创建目录

**最佳实践**:
```markdown
在创建文件前，确保目录存在

// 使用 write 会自动创建目录
write({
  path: "/path/to/new/directory/file.md",
  content: "内容"
})

// write 工具会自动创建不存在的目录
```

### 2. 检查目录存在性

**手动检查**:
```bash
# 检查目录
if [ ! -d "/path/to/directory" ]; then
  mkdir -p "/path/to/directory"
fi
```

### 3. 批量创建目录

```bash
directories=(
  "/root/.openclaw/workspace/memory"
  "/root/.openclaw/workspace/skills/new-skill"
  "/root/.openclaw/workspace/evolver/fixes"
)

for dir in "${directories[@]}"; do
  if [ ! -d "$dir" ]; then
    mkdir -p "$dir"
    echo "✅ 创建目录: $dir"
  else
    echo "✓ 目录已存在: $dir"
  fi
done
```

## 错误处理最佳实践

### 1. 优雅降级

**原则**: 文件不存在时，使用默认值或跳过

```markdown
function safeRead(path, defaultValue = null) {
  const result = read({ path })
  if (result.error) {
    console.log(`文件不存在: ${path}，使用默认值`)
    return defaultValue
  }
  return result.content
}
```

### 2. 自动创建

**原则**: 文件不存在时，自动创建

```markdown
function ensureFile(path, defaultContent = "") {
  const result = read({ path })
  if (result.error) {
    write({ path, content: defaultContent })
    console.log(`文件已创建: ${path}`)
    return defaultContent
  }
  return result.content
}
```

### 3. 重试机制

**原则**: 失败后重试

```markdown
async function readWithRetry(path, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    const result = read({ path })
    if (!result.error) {
      return result.content
    }
    console.log(`读取失败 (${i + 1}/${maxRetries}): ${path}`)
    await sleep(1000) // 等待 1 秒
  }
  throw new Error(`读取失败: ${path}`)
}
```

## 监控和统计

### ENOENT 错误监控

**指标**:
- ENOENT 错误总次数
- 按路径分类的错误次数
- 成功避免的次数（通过预检查）

**目标**:
- ENOENT 错误 < 5 次/天（当前 100 次/12小时）
- 预检查覆盖率 > 90%

### 日志记录

```json
{
  "timestamp": "2026-03-16T08:30:00Z",
  "operation": "read",
  "path": "file.md",
  "status": "file_not_found",
  "action": "use_default",
  "precheckUsed": true
}
```

## 配置选项

```json5
{
  fileExistenceChecker: {
    enablePrecheck: true,         // 启用预检查
    autoCreateMissing: true,      // 自动创建缺失文件
    logMissingFiles: true,        // 记录缺失文件
    defaultContent: "",           // 默认内容
    createDirectories: true,      // 自动创建目录
    alertOnHighErrorRate: true    // 高错误率时告警
  }
}
```

## 与其他 Skill 集成

1. **evolved-edit-best-practices** - Edit 前检查文件存在性
2. **safe-operations** - 安全操作最佳实践
3. **log-to-skill** - 记录文件操作日志

## 相关 Patterns

- **PAT-009**: 文件不存在错误 → 存在性检查 (🔧已解决)
- **PAT-008**: Edit 操作失败 → 最佳实践 (已解决)

## 快速参考

### Read 前检查模板

```markdown
const result = read({ path: "file.md" })
if (result.error && result.error.includes("ENOENT")) {
  // 文件不存在
  console.log("文件不存在")
  // 选项 1: 使用默认值
  // 选项 2: 创建文件
  // 选项 3: 跳过
} else {
  // 文件存在，使用内容
  console.log(result.content)
}
```

### Edit 前检查模板

```markdown
const result = read({ path: "file.md" })
if (result.error) {
  console.log("文件不存在，跳过 Edit")
} else {
  // 文件存在，执行 Edit
  edit({
    path: "file.md",
    oldText: "旧内容",
    newText: "新内容"
  })
}
```

### Write 前检查模板

```markdown
const result = read({ path: "file.md" })
if (result.error) {
  // 文件不存在，创建新文件
  write({ path: "file.md", content: "初始内容" })
} else {
  // 文件存在，更新内容
  write({ path: "file.md", content: "更新内容" })
}
```

---

**创建时间**: 2026-03-16 08:30
**创建者**: OpenClaw Evolver System (Round 333)
**版本**: 1.0
**优先级**: P0（最高）
