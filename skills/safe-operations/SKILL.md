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

## 智能编辑策略

### 策略 1: 上下文扩展

当精确匹配失败时，扩展上下文：

```
# ❌ 太短，可能不唯一
edit /path/to/file "some text" "new text"

# ✅ 扩展上下文（包含前后各 2 行）
read /path/to/file
# 复制包含目标文本的 5 行内容
edit /path/to/file "Line 1\nLine 2\nLine 3: some text\nLine 4\nLine 5" "Line 1\nLine 2\nLine 3: new text\nLine 4\nLine 5"
```

### 策略 2: 模糊匹配

对于微小的空白差异，使用模糊匹配：

```bash
# 检查是否是空白字符问题
diff -u <(echo "expected text") <(echo "actual text")

# 使用 grep 查找近似匹配
grep -n "some text" /path/to/file
# 查看实际内容和行号，然后调整匹配文本
```

### 策略 3: 降级到 Write

如果多次 Edit 失败，降级到 Write：

```
# Attempt 1-3: 尝试 Edit
read /path/to/file
edit /path/to/file "old" "new"
# 失败...

# Attempt 4: 降级到 Write（覆盖整个文件）
read /path/to/file
# 手动修改内容
write /path/to/file "完整的新内容（包含修改）"
```

### 策略 4: 并发冲突检测

检测文件是否在编辑期间被修改：

```bash
# 记录文件哈希
hash_before=$(md5sum /path/to/file | awk '{print $1}')

# 读取并编辑
read /path/to/file
# ... 准备编辑 ...

# 再次检查哈希
hash_after=$(md5sum /path/to/file | awk '{print $1}')

if [ "$hash_before" != "$hash_after" ]; then
  echo "⚠️ 文件在编辑期间被修改，可能存在并发冲突"
  echo "建议：重新读取文件，合并更改后重试"
fi
```

## 自动化脚本

### 智能编辑脚本

```bash
#!/bin/bash
# evolver/fixes/smart-edit.sh

FILE="$1"
OLD_TEXT="$2"
NEW_TEXT="$3"
MAX_RETRIES="${4:-3}"

if [ -z "$FILE" ] || [ -z "$OLD_TEXT" ] || [ -z "$NEW_TEXT" ]; then
  echo "用法: $0 <file> <old_text> <new_text> [max_retries]"
  exit 1
fi

for i in $(seq 1 $MAX_RETRIES); do
  echo "尝试 $i/$MAX_RETRIES: 编辑 $FILE"
  
  # 读取当前内容
  if ! content=$(cat "$FILE" 2>/dev/null); then
    echo "❌ 无法读取文件"
    exit 1
  fi
  
  # 检查是否存在目标文本
  if ! echo "$content" | grep -qF "$OLD_TEXT"; then
    echo "❌ 未找到目标文本，尝试扩展上下文..."
    
    # 查找包含部分文本的行
    partial=$(echo "$OLD_TEXT" | head -c 20)
    line_num=$(grep -n "$partial" "$FILE" | head -1 | cut -d: -f1)
    
    if [ -n "$line_num" ]; then
      echo "找到部分匹配在第 $line_num 行"
      echo "建议：重新读取文件，使用更大的上下文"
    fi
    
    exit 1
  fi
  
  # 执行编辑（这里需要调用实际的 edit 工具）
  # 由于脚本限制，这里只是示例
  echo "✅ 文本匹配成功，可以执行编辑"
  exit 0
done

echo "❌ 重试 $MAX_RETRIES 次后仍然失败"
echo "建议：使用 write 工具覆盖整个文件"
exit 1
```

### 文件存在性检查脚本

```bash
#!/bin/bash
# evolver/fixes/check-file-exists.sh

FILE="$1"
CREATE_IF_MISSING="${2:-false}"
DEFAULT_CONTENT="${3:-# Created by OpenClaw}"

if [ -z "$FILE" ]; then
  echo "用法: $0 <file> [create_if_missing] [default_content]"
  exit 1
fi

if [ -f "$FILE" ]; then
  echo "✅ 文件存在: $FILE"
  exit 0
else
  echo "❌ 文件不存在: $FILE"
  
  if [ "$CREATE_IF_MISSING" = "true" ]; then
    # 创建目录
    mkdir -p "$(dirname "$FILE")"
    
    # 创建文件
    echo "$DEFAULT_CONTENT" > "$FILE"
    echo "✅ 已创建文件: $FILE"
    exit 0
  else
    echo "提示：使用 create_if_missing=true 自动创建"
    exit 1
  fi
fi
```

## 最佳实践清单（增强版）

编辑文件前：
- [ ] 读取文件确认当前内容
- [ ] 从 read 输出中复制精确文本
- [ ] 确保文本唯一（足够上下文）
- [ ] 检查特殊字符（引号、换行、制表符）
- [ ] **记录文件哈希（检测并发修改）**
- [ ] **准备降级策略（Write 覆盖）**

读取文件前：
- [ ] 确认路径正确
- [ ] 考虑文件可能不存在
- [ ] 准备错误处理逻辑
- [ ] 对于大文件，使用 offset/limit
- [ ] **使用 check-file-exists.sh 脚本**

写入文件前：
- [ ] 创建必要的目录
- [ ] 检查是否覆盖现有文件
- [ ] 备份重要文件（如需要）
- [ ] **确认文件路径拼写正确**

## 常见错误案例库

### 案例 1: 空白字符不匹配

**问题**:
```
❌ Edit 失败：文件中有制表符，但匹配文本使用空格
```

**解决**:
```bash
# 查看实际字符
cat -A /path/to/file | grep "target text"
# ^I 表示制表符

# 使用正确的字符
edit /path/to/file "$(printf '\t')target text" "new text"
```

### 案例 2: 换行符差异

**问题**:
```
❌ Edit 失败：文件使用 CRLF (\r\n)，匹配文本使用 LF (\n)
```

**解决**:
```bash
# 转换换行符
sed -i 's/\r$//' /path/to/file

# 或者使用正确的换行符
edit /path/to/file "line1\r\nline2" "new line1\r\nnew line2"
```

### 案例 3: 并发编辑冲突

**问题**:
```
❌ Edit 失败：文件在读取和编辑之间被修改
```

**解决**:
```bash
# 使用文件锁（如果系统支持）
(
  flock -x 200
  read /path/to/file
  edit /path/to/file "old" "new"
) 200>/tmp/file.lock
```

### 案例 4: 文本不唯一

**问题**:
```
❌ Edit 失败：匹配文本在文件中出现多次
```

**解决**:
```bash
# 扩大上下文，包含前后各 3 行
read /path/to/file
# 复制 7 行内容（前3行 + 目标 + 后3行）
```

## 与其他 Skill 的协作

- **log-to-skill**: 当日志显示重复的编辑错误时，提炼流程
- **skill-doctor**: 诊断 skill 中的文件操作问题
- **create-skill**: 创建新 skill 时，使用安全文件操作
- **evomap-heartbeat-monitor**: 心跳监控脚本中的文件操作
- **evomap-publish-validator**: 发布验证脚本中的配置文件读取

## 改进历史

- **2026-03-02**: 添加智能编辑策略、自动化脚本、常见错误案例库
  - 新增：上下文扩展、模糊匹配、降级策略、并发冲突检测
  - 新增：smart-edit.sh、check-file-exists.sh 脚本
  - 改进：增强最佳实践清单

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
