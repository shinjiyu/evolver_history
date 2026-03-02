---
name: file-existence-checker
description: 文件存在性检查与安全访问。适用于：(1) 遇到 ENOENT 错误（文件不存在）、(2) 需要在操作前检查文件存在性、(3) 避免因访问不存在的文件导致失败、(4) 实现安全的文件操作流程。
---

# File Existence Checker - 文件存在性检查与安全访问

在文件操作前检查文件存在性，避免 ENOENT 错误，提高文件操作安全性。

## 核心问题

**PAT-051**: ENOENT 错误（文件不存在）
- 出现次数: 37 次（Round 260，从 18 增至 37，+106%）
- 根本原因:
  1. 首次访问新创建的文件
  2. 文件路径错误
  3. 文件已被删除或移动
  4. 目录不存在

## 检查策略

### 策略 1: 读取前检查（推荐）

```markdown
## 黄金法则：读取前总是检查文件存在性

错误做法：
read file.md

正确做法：
1. 检查文件是否存在
2. 存在才读取
3. 不存在则创建或处理
```

**示例**:
```bash
# 检查文件是否存在
if [ -f "$FILE_PATH" ]; then
    # 文件存在，执行读取
    cat "$FILE_PATH"
else
    # 文件不存在，创建或跳过
    echo "文件不存在，创建新文件"
    touch "$FILE_PATH"
fi
```

### 策略 2: 写入前检查目录

```markdown
## 写入前检查目录存在性

错误做法：
write /new/path/file.md

正确做法：
1. 检查目录是否存在
2. 不存在则创建目录
3. 然后写入文件
```

**示例**:
```bash
# 检查并创建目录
DIR_PATH=$(dirname "$FILE_PATH")
if [ ! -d "$DIR_PATH" ]; then
    mkdir -p "$DIR_PATH"
fi

# 然后写入文件
echo "content" > "$FILE_PATH"
```

### 策略 3: 批量操作前预检查

```markdown
## 批量操作前预检查所有文件

错误做法：
for file in files; do
    read $file
done

正确做法：
1. 先检查所有文件是否存在
2. 记录不存在的文件
3. 只处理存在的文件
```

**示例**:
```bash
# 批量检查
MISSING_FILES=()
EXISTING_FILES=()

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        EXISTING_FILES+=("$file")
    else
        MISSING_FILES+=("$file")
    fi
done

# 报告缺失文件
if [ ${#MISSING_FILES[@]} -gt 0 ]; then
    echo "缺失文件: ${MISSING_FILES[*]}"
fi

# 处理存在的文件
for file in "${EXISTING_FILES[@]}"; do
    # 处理文件
done
```

## 常见场景

### 场景 1: 读取配置文件

```bash
CONFIG_FILE="/root/.openclaw/workspace/config.json"

if [ -f "$CONFIG_FILE" ]; then
    # 读取配置
    CONFIG=$(cat "$CONFIG_FILE")
else
    # 使用默认配置
    CONFIG='{"default": true}'
    echo "配置文件不存在，使用默认配置"
fi
```

### 场景 2: 创建日志文件

```bash
LOG_FILE="/root/.openclaw/workspace/memory/$(date +%Y-%m-%d).md"
LOG_DIR=$(dirname "$LOG_FILE")

# 确保目录存在
if [ ! -d "$LOG_DIR" ]; then
    mkdir -p "$LOG_DIR"
    echo "创建日志目录: $LOG_DIR"
fi

# 写入日志
echo "# Daily Log" > "$LOG_FILE"
```

### 场景 3: 处理动态生成的文件

```bash
REPORT_FILE="/root/.openclaw/workspace/memory/report-$(date +%Y%m%d-%H%M%S).md"

# 检查文件是否存在（可能被其他进程创建）
if [ -f "$REPORT_FILE" ]; then
    echo "报告已存在，追加内容"
    echo "## Additional Content" >> "$REPORT_FILE"
else
    echo "创建新报告"
    echo "# Report" > "$REPORT_FILE"
fi
```

## 最佳实践

### ✅ 推荐做法

1. **读取前检查**
   ```bash
   # ✅ 正确
   if [ -f "$FILE" ]; then
       read "$FILE"
   else
       echo "文件不存在: $FILE"
   fi
   
   # ❌ 错误
   read "$FILE"  # 可能失败
   ```

2. **写入前确保目录存在**
   ```bash
   # ✅ 正确
   mkdir -p "$(dirname "$FILE")"
   write "$FILE"
   
   # ❌ 错误
   write "$FILE"  # 目录可能不存在
   ```

3. **使用 try-catch 处理错误**
   ```bash
   # ✅ 正确
   try {
       read "$FILE"
   } catch (ENOENT) {
       echo "文件不存在，跳过"
   }
   
   # ❌ 错误
   read "$FILE"  # 错误未处理
   ```

4. **记录缺失文件**
   ```bash
   # ✅ 正确
   MISSING_LOG="/tmp/missing-files.log"
   
   if [ ! -f "$FILE" ]; then
       echo "$(date): $FILE" >> "$MISSING_LOG"
   fi
   
   # ❌ 错误
   # 不记录，忽略错误
   ```

### ❌ 避免做法

1. **不要假设文件存在**
   ```bash
   # ❌ 错误
   cat /path/to/file  # 文件可能不存在
   
   # ✅ 正确
   if [ -f /path/to/file ]; then
       cat /path/to/file
   fi
   ```

2. **不要忽略 ENOENT 错误**
   ```bash
   # ❌ 错误
   read file 2>/dev/null  # 忽略错误
   
   # ✅ 正确
   if [ -f file ]; then
       read file
   else
       log "文件不存在: file"
   fi
   ```

3. **不要在循环中重复检查同一文件**
   ```bash
   # ❌ 错误：每次循环都检查
   for i in {1..100}; do
       if [ -f "$FILE" ]; then
           # 处理
       fi
   done
   
   # ✅ 正确：提前检查一次
   if [ -f "$FILE" ]; then
       for i in {1..100}; do
           # 处理
       done
   fi
   ```

## 自动化脚本

### safe-file-read.sh

```bash
#!/bin/bash
# 安全文件读取脚本

FILE_PATH=$1

# 检查参数
if [ -z "$FILE_PATH" ]; then
    echo "❌ 错误: 未指定文件路径"
    exit 1
fi

# 检查文件是否存在
if [ ! -f "$FILE_PATH" ]; then
    echo "❌ 错误: 文件不存在: $FILE_PATH"
    
    # 记录缺失文件
    MISSING_LOG="/root/.openclaw/workspace/memory/missing-files.log"
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $FILE_PATH" >> "$MISSING_LOG"
    
    exit 1
fi

# 检查文件是否可读
if [ ! -r "$FILE_PATH" ]; then
    echo "❌ 错误: 文件不可读: $FILE_PATH"
    exit 1
fi

# 读取文件
cat "$FILE_PATH"
exit 0
```

### safe-file-write.sh

```bash
#!/bin/bash
# 安全文件写入脚本

FILE_PATH=$1
CONTENT=$2

# 检查参数
if [ -z "$FILE_PATH" ]; then
    echo "❌ 错误: 未指定文件路径"
    exit 1
fi

# 确保目录存在
DIR_PATH=$(dirname "$FILE_PATH")
if [ ! -d "$DIR_PATH" ]; then
    echo "📁 创建目录: $DIR_PATH"
    mkdir -p "$DIR_PATH"
fi

# 写入文件
echo "$CONTENT" > "$FILE_PATH"

if [ $? -eq 0 ]; then
    echo "✅ 文件写入成功: $FILE_PATH"
    exit 0
else
    echo "❌ 文件写入失败: $FILE_PATH"
    exit 1
fi
```

## 错误统计与监控

### 统计 ENOENT 错误

```bash
# 统计最近 1 小时的 ENOENT 错误
RECENT_ENOENT=$(find /root/.openclaw/workspace -name "*.txt" -path "*/agent-transcripts/*" -mmin -60 2>/dev/null | \
    xargs grep -l "ENOENT" 2>/dev/null | wc -l)

echo "最近 1 小时 ENOENT 错误: $RECENT_ENOENT 个文件"

if [ $RECENT_ENOENT -gt 20 ]; then
    echo "⚠️ ENOENT 错误过多，建议检查文件操作流程"
fi
```

### 监控缺失文件日志

```bash
MISSING_LOG="/root/.openclaw/workspace/memory/missing-files.log"

if [ -f "$MISSING_LOG" ]; then
    # 统计最近 24 小时的缺失文件
    RECENT_MISSING=$(find "$MISSING_LOG" -mtime -1 2>/dev/null | wc -l)
    
    echo "最近 24 小时缺失文件记录: $RECENT_MISSING 次"
    
    # 显示最常见的缺失文件
    echo "最常见的缺失文件:"
    awk '{print $NF}' "$MISSING_LOG" | sort | uniq -c | sort -rn | head -5
fi
```

## 与其他 Skills 配合

- `safe-operations` - 安全操作检查
- `smart-file-edit` - 智能文件编辑
- `log-to-skill` - 日志分析
- `evolution-verification` - 验证文件操作效果

## 相关 Pattern

- **PAT-051**: ENOENT 错误（本 Skill 解决）
- **PAT-007**: Edit 工具精确匹配失败
- **PAT-008**: 尝试读取不存在的文件

## 集成到 auto-health-recovery.sh

可以在 auto-health-recovery.sh 中添加 ENOENT 错误检查：

```bash
# Phase X: ENOENT 错误检查
log "🔍 Phase X: ENOENT 错误检查..."

RECENT_ENOENT=$(find /root/.openclaw/workspace -name "*.txt" -path "*/agent-transcripts/*" -mmin -60 2>/dev/null | \
    xargs grep -l "ENOENT" 2>/dev/null | wc -l)

if [ $RECENT_ENOENT -gt 20 ]; then
    log "${YELLOW}⚠️ ENOENT 错误过多 (${RECENT_ENOENT} 个文件)${NC}"
    log "建议检查文件操作流程，应用 file-existence-checker Skill"
fi
```

---

**创建日期**: 2026-03-01
**来源**: Round 261 - PAT-051 (ENOENT 错误从 18 增至 37，+106%)
**解决问题**: 文件不存在错误，提高文件操作安全性
