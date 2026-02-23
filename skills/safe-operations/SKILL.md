---
name: safe-operations
description: 安全的文件操作和编辑工具，避免常见错误。适用于：(1) 需要编辑文件但担心匹配失败、(2) 文件可能不存在需要先检查、(3) 需要重试机制的编辑操作、(4) 用户说"安全编辑"、"检查文件是否存在"。
---

# Safe Operations - 安全操作

提供带错误检查和重试机制的文件操作，避免常见错误：
- Edit 精确匹配失败
- 文件不存在 (ENOENT)
- 权限问题

## 核心流程

```
操作请求 → 预检查 → 执行 → 错误处理 → 重试（如需要）
```

## 使用场景

### 1. 安全编辑文件

当需要编辑文件时，避免 "Could not find the exact text" 错误：

**传统方式（易出错）**：
```
edit /path/to/file "old text" "new text"
```

**安全方式**：
```
# Step 1: 先读取文件确认内容
read /path/to/file

# Step 2: 从文件中复制精确的文本（包括空格和换行）

# Step 3: 执行编辑
edit /path/to/file "精确匹配的文本（从read结果复制）" "新文本"
```

**最佳实践**：
1. ✅ 总是先 `read` 文件
2. ✅ 从 read 结果中复制精确文本（包括所有空格、缩进、换行）
3. ✅ 选择足够的上下文确保唯一性
4. ❌ 不要从记忆或笔记中复制文本
5. ❌ 不要猜测文件内容

### 2. 检查文件是否存在

在读取文件前检查是否存在：

```bash
# 方法 1: 使用 read 的错误处理
read /path/to/file
# 如果文件不存在，会返回错误，不会中断执行

# 方法 2: 使用 exec 检查
exec test -f /path/to/file && echo "exists" || echo "not found"

# 方法 3: 创建目录（如果需要）
exec mkdir -p /path/to/directory
```

### 3. 安全文件创建

创建文件前确保目录存在：

```
# Step 1: 创建目录
exec mkdir -p /path/to/directory

# Step 2: 写入文件
write /path/to/directory/file.md "content"
```

## 常见错误及解决方案

### 错误 1: Edit 匹配失败

**原因**：
- 文件内容已改变
- 空白字符不匹配（空格 vs 制表符、换行符差异）
- 文本不够唯一（多处匹配）
- 从记忆中复制而非实际文件

**解决方案**：
1. 重新读取文件：`read /path/to/file`
2. 从 read 输出中精确复制要替换的文本
3. 扩大上下文使文本唯一
4. 如果文件很大，使用 `offset` 和 `limit` 定位

**示例**：
```
# ❌ 错误：猜测内容
edit /root/.openclaw/workspace/test.md "some text" "new text"

# ✅ 正确：先读取再编辑
read /root/.openclaw/workspace/test.md
# 假设输出：
# Line 1: Hello World
# Line 2: some text here
# Line 3: End

edit /root/.openclaw/workspace/test.md "Line 2: some text here" "Line 2: new text here"
```

### 错误 2: 文件不存在 (ENOENT)

**原因**：
- 路径错误
- 目录未创建
- 文件确实不存在

**解决方案**：
1. 检查路径拼写
2. 创建必要的目录：`exec mkdir -p $(dirname /path/to/file)`
3. 如果是必需文件，先创建：`write /path/to/file "# Created"`

**示例**：
```
# ❌ 错误：直接读取不存在的文件
read /root/.openclaw/workspace/new-project/config.md
# Error: ENOENT: no such file or directory

# ✅ 正确：先检查并创建
exec test -f /root/.openclaw/workspace/new-project/config.md || \
  write /root/.openclaw/workspace/new-project/config.md "# Config\n\nAdd configuration here."
```

### 错误 3: 权限禁止

**原因**：
- 文件权限不足
- 目录权限不足

**解决方案**：
1. 检查权限：`exec ls -la /path/to/file`
2. 修改权限（如果允许）：`exec chmod 644 /path/to/file`
3. 使用 sudo（如果需要且允许）

## 重试机制

对于可能失败的操作，实现自动重试：

### 手动重试流程

```
# Attempt 1: 尝试编辑
edit /path/to/file "old" "new"
# 如果失败...

# Attempt 2: 重新读取并重试
read /path/to/file
edit /path/to/file "精确的old（从read复制）" "new"

# Attempt 3: 如果仍然失败，使用 write 覆盖
read /path/to/file
# 复制整个文件内容，手动修改，然后
write /path/to/file "修改后的完整内容"
```

### 自动重试策略

对于脚本和自动化任务，实现以下重试策略：

```javascript
async function safeEdit(filePath, oldText, newText, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // 1. 读取当前内容
      const content = await readFile(filePath);
      
      // 2. 检查是否存在目标文本
      if (!content.includes(oldText)) {
        throw new Error('Text not found in file');
      }
      
      // 3. 执行编辑
      await editFile(filePath, oldText, newText);
      
      console.log(`Edit succeeded on attempt ${attempt}`);
      return true;
    } catch (error) {
      console.log(`Attempt ${attempt} failed: ${error.message}`);
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // 等待后重试
      await sleep(1000 * attempt);
    }
  }
}
```

## 最佳实践清单

编辑文件前：
- [ ] 读取文件确认当前内容
- [ ] 从 read 输出中复制精确文本
- [ ] 确保文本唯一（足够上下文）
- [ ] 检查特殊字符（引号、换行、制表符）

读取文件前：
- [ ] 确认路径正确
- [ ] 考虑文件可能不存在
- [ ] 准备错误处理逻辑
- [ ] 对于大文件，使用 offset/limit

写入文件前：
- [ ] 创建必要的目录
- [ ] 检查是否覆盖现有文件
- [ ] 备份重要文件（如需要）

## 与其他 Skill 的协作

- **log-to-skill**: 当日志显示重复的编辑错误时，提炼流程
- **skill-doctor**: 诊断 skill 中的文件操作问题
- **create-skill**: 创建新 skill 时，使用安全文件操作

## 工具函数

以下辅助函数可在脚本中使用：

### 检查文件是否存在
```bash
file_exists() {
  test -f "$1"
}

# 用法
if file_exists "/path/to/file"; then
  echo "File exists"
else
  echo "File not found"
fi
```

### 安全读取（带默认值）
```bash
safe_read() {
  local file="$1"
  local default="${2:-}"
  
  if [ -f "$file" ]; then
    cat "$file"
  else
    echo "$default"
  fi
}
```

### 确保目录存在
```bash
ensure_dir() {
  local dir="$1"
  mkdir -p "$dir"
}

# 用法
ensure_dir "/path/to/directory"
```

---

**相关模式**:
- PAT-007: Edit 工具精确匹配失败
- PAT-008: 尝试读取不存在的文件

**改进来源**: evolver-log-analysis 发现的重复问题（16 次 Edit 失败，8 次 ENOENT）
