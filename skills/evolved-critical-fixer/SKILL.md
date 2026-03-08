# Evolved Critical Fixer

## Purpose
自动检测和修复系统中的关键错误，特别是 Edit 匹配失败和 ENOENT 错误。

## Problem Patterns
- **PAT-081**: Edit 匹配失败激增 → 系统自我改进受阻（155 次，+5067%）
- **PAT-082**: ENOENT 错误激增 → 学习能力受阻（328 次，+5367%）

## Critical Impact
这两个问题导致系统健康评分从 8.8/10 降至 6.5/10，必须立即修复。

## Capabilities

### 1. Edit 匹配失败修复
- **问题**: 文件内容频繁变化导致 Edit 操作失败
- **根因**:
  - 并发修改冲突
  - 缺少版本检查
  - 文本匹配不灵活
- **解决方案**:
  - safe_edit 函数：重试机制 + 版本检查
  - flexible_edit 函数：灵活匹配空白字符
  - locked_edit 函数：文件锁防止并发

### 2. ENOENT 错误修复
- **问题**: 访问不存在的文件
- **根因**:
  - 历史文件已清理
  - 硬编码路径
  - 缺少存在性检查
- **解决方案**:
  - safe_read 函数：自动检查 + 创建默认文件
  - 批量文件检查
  - 清理硬编码引用

### 3. 自动化修复
- 检测高频错误
- 自动应用修复
- 生成修复报告

## Usage

### 修复 Edit 匹配失败
```bash
# 运行修复脚本
bash /root/.openclaw/workspace/evolver/fixes/fix-edit-matching.sh

# 在脚本中使用 safe_edit
source /root/.openclaw/workspace/evolver/lib/safe-edit.sh
safe_edit "file.md" "old text" "new text"
```

### 修复 ENOENT 错误
```bash
# 运行修复脚本
bash /root/.openclaw/workspace/evolver/fixes/fix-enoint-errors.sh

# 在脚本中使用 safe_read
source /root/.openclaw/workspace/evolver/lib/safe-read.sh
content=$(safe_read "file.md" "default content")
```

## Integration Points

### 与现有 Skill 协作
- `smart-file-edit`: 增强文件编辑能力
- `file-existence-checker`: 文件存在性检查
- `safe-operations`: 安全操作
- `evolution-verification`: 验证修复效果

### 与日志分析协作
- 在 log-analysis 中检测错误趋势
- 自动触发修复
- 记录修复效果

## Metrics

### 成功指标
- Edit 匹配失败: 155 → <5（-97%）
- ENOENT 错误: 328 → <10（-97%）
- 系统健康评分: 6.5 → 8.5（+2.0）
- 文件操作成功率: 90% → 99%

### 监控指标
- Edit 失败率
- ENOENT 错误频率
- 文件操作成功率
- 重试次数

## Evolution History

### v1.0 - 2026-03-08 12:30
- 初始版本
- 支持 Edit 匹配失败修复
- 支持 ENOENT 错误修复
- 自动化修复流程

## Future Enhancements

1. **预测性修复**
   - 基于历史数据预测错误
   - 提前预防
   - 自动调整策略

2. **智能重试**
   - 动态调整重试次数
   - 智能退避策略
   - 自适应匹配

3. **文件同步**
   - 实时文件监控
   - 自动同步
   - 版本控制

4. **性能优化**
   - 缓存机制
   - 并发优化
   - 资源管理

## Related Patterns
- PAT-081: Edit 匹配失败激增
- PAT-082: ENOENT 错误激增
- PAT-083: Timeout 激增
- PAT-084: Network 错误激增

## References
- 修复脚本: `/root/.openclaw/workspace/evolver/fixes/fix-edit-matching.sh`
- 修复脚本: `/root/.openclaw/workspace/evolver/fixes/fix-enoint-errors.sh`
- 函数库: `/root/.openclaw/workspace/evolver/lib/safe-edit.sh`
- 函数库: `/root/.openclaw/workspace/evolver/lib/safe-read.sh`
- 修复报告: `/root/.openclaw/workspace/memory/enoint-fix-report-*.md`
