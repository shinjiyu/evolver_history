---
name: evolved-safe-integration
description: 自动集成 safe-edit 和 safe-read 函数到所有文件操作中。适用于：任何需要读取或编辑文件的场景，特别是自进化任务。
---

# 安全文件操作集成 Skill

## 目的

自动将 safe-edit.sh 和 safe-read.sh 函数集成到文件操作中，解决 PAT-081（Edit 匹配失败）和 PAT-082（ENOENT 错误）问题。

## 背景

### PAT-081: Edit 匹配失败激增
- **症状**: 155 次失败（+5067%）
- **根因**: 文件内容频繁变化，缺少版本检查和重试机制
- **影响**: 系统自我改进能力受阻

### PAT-082: ENOENT 错误激增
- **症状**: 328 次错误（+5367%）
- **根因**: 访问不存在的文件，缺少存在性检查
- **影响**: 学习能力受损

## 核心函数

### 1. safe_read
**用途**: 安全读取文件，避免 ENOENT 错误

**使用场景**:
- 读取任何文件之前
- 特别是读取配置文件、历史文件、日志文件

**调用方式**:
```bash
source /root/.openclaw/workspace/evolver/lib/safe-read.sh

# 读取文件（如果不存在则创建默认内容）
content=$(safe_read "$file" "默认内容（可选）")

# 检查文件是否存在
if file_exists "$file"; then
    # 文件存在，继续处理
fi
```

### 2. safe_edit
**用途**: 安全编辑文件，避免匹配失败

**使用场景**:
- 编辑任何文件时
- 特别是编辑 pattern-registry.md, HEARTBEAT.md, MEMORY.md 等频繁变化的文件

**调用方式**:
```bash
source /root/.openclaw/workspace/evolver/lib/safe-edit.sh

# 尝试标准编辑
if safe_edit "$file" "$old_text" "$new_text" 3; then
    echo "✅ 编辑成功"
else
    # 尝试灵活匹配
    flexible_edit "$file" "$old_text" "$new_text"
fi
```

## 集成流程

### Step 1: 识别需要集成的场景

**高优先级文件**（最常失败）:
1. `/root/.openclaw/workspace/evolver_history/projects/openclaw/pattern-registry.md`
2. `/root/.openclaw/workspace/HEARTBEAT.md`
3. `/root/.openclaw/workspace/MEMORY.md`
4. `/root/.openclaw/workspace/memory/*.md`

**操作类型**:
- Edit 操作（使用 edit 工具）
- Read 操作（使用 read 工具）

### Step 2: 应用 safe 函数

**对于 Read 操作**:
```
# 旧方式（可能导致 ENOENT）
Read file: /root/.openclaw/workspace/memory/evolution-2026-02-25.md

# 新方式（安全）
# 1. 先检查文件是否存在
exec: source /root/.openclaw/workspace/evolver/lib/safe-read.sh && file_exists "/root/.openclaw/workspace/memory/evolution-2026-02-25.md"

# 2. 如果存在，再读取
if [ $? -eq 0 ]; then
    Read file: /root/.openclaw/workspace/memory/evolution-2026-02-25.md
else
    echo "文件不存在，跳过..."
fi
```

**对于 Edit 操作**:
```
# 旧方式（可能导致匹配失败）
Edit file: pattern-registry.md
oldText: "| PAT-080 | [API] EvoMap API 测试失败 (404) → 自动化测试失败 | API | Round 289 | Round 290 |"
newText: "| PAT-080 | [API] EvoMap API 测试失败 (404) → 自动化测试失败 | API | Round 289 | Round 291 |"

# 新方式（安全）
# 1. 先读取最新内容
Read file: pattern-registry.md

# 2. 确认 oldText 是否存在（grep 检查）
# 3. 如果存在，执行 Edit
# 4. 如果不存在，重新获取最新内容并调整 oldText
```

### Step 3: 自动化集成

**方法 1: 使用 exec 调用 safe 函数**（推荐）
```bash
# 在自进化任务中
source /root/.openclaw/workspace/evolver/lib/safe-edit.sh
source /root/.openclaw/workspace/evolver/lib/safe-read.sh

# 读取文件
content=$(safe_read "/root/.openclaw/workspace/evolver_history/projects/openclaw/pattern-registry.md" "")

# 编辑文件
safe_edit "/root/.openclaw/workspace/evolver_history/projects/openclaw/pattern-registry.md" "$old_text" "$new_text" 3
```

**方法 2: 在 Edit 前添加 Read + Grep 检查**
```
# 1. Read 文件
Read file: pattern-registry.md

# 2. Grep 检查 oldText 是否存在
exec: grep -F "| PAT-080 |" /root/.openclaw/workspace/evolver_history/projects/openclaw/pattern-registry.md

# 3. 如果存在，执行 Edit
Edit file: pattern-registry.md
oldText: ...
newText: ...
```

## 最佳实践

### 1. 总是先读取再编辑
```bash
# ❌ 错误：直接编辑
Edit file: pattern-registry.md
oldText: "旧内容"
newText: "新内容"

# ✅ 正确：先读取再编辑
Read file: pattern-registry.md
# 确认内容后编辑
Edit file: pattern-registry.md
oldText: "确认后的旧内容"
newText: "新内容"
```

### 2. 使用 fallback 策略
```bash
# 尝试标准 Edit
if ! safe_edit "$file" "$old" "$new"; then
    # 失败则尝试灵活匹配
    flexible_edit "$file" "$old" "$new"
fi
```

### 3. 检查文件存在性
```bash
# ❌ 错误：直接读取可能不存在的文件
Read file: evolution-2026-02-25.md

# ✅ 正确：先检查存在性
if file_exists "evolution-2026-02-25.md"; then
    Read file: evolution-2026-02-25.md
else
    echo "文件不存在，跳过..."
fi
```

## 预期效果

### 短期（24 小时）
- Edit 匹配失败: 56 → <5（-91%）
- ENOENT 错误: 363 → <20（-94%）
- 系统健康评分: 7.0 → 8.5（+1.5）

### 中期（1 周）
- 系统稳定性: 85% → 98%
- 文件操作成功率: 90% → 99%
- 自进化任务成功率: 80% → 95%

## 集成检查清单

在每次自进化任务中，确保：

- [ ] 读取历史文件前，使用 `file_exists` 检查
- [ ] 编辑 pattern-registry.md 前，先读取最新内容
- [ ] 编辑 HEARTBEAT.md 前，先读取最新内容
- [ ] 编辑 MEMORY.md 前，先读取最新内容
- [ ] 如果 Edit 失败，使用灵活匹配或跳过
- [ ] 记录所有失败的文件操作到日志

## 相关文件

| 文件 | 用途 |
|------|------|
| `/root/.openclaw/workspace/evolver/lib/safe-edit.sh` | 安全编辑函数库 |
| `/root/.openclaw/workspace/evolver/lib/safe-read.sh` | 安全读取函数库 |
| `/root/.openclaw/workspace/evolver/docs/safe-function-integration-guide.md` | 详细集成指南 |
| `/root/.openclaw/workspace/skills/evolved-critical-fixer/SKILL.md` | 关键错误修复 Skill |

## 注意事项

1. **性能**: 重试机制会增加执行时间（每次重试约 0.5s）
2. **兼容性**: 如果函数库不存在，需要 fallback 到标准操作
3. **并发**: locked_edit 需要 flock，大多数 Linux 已内置
4. **日志**: 记录所有重试和失败，便于追踪问题

## 更新记录

- **v1.0 - 2026-03-09 04:30**
  - 初始版本
  - 集成 safe_read 和 safe_edit 到自进化流程
  - 提供最佳实践和检查清单
