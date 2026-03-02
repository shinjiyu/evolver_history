# 磁盘空间清理报告

**生成时间**: 2026-02-27 00:32:12
**磁盘使用率**: 83%
**可用空间**: 8.3G

---

## 📊 磁盘使用分析

| 项目 | 数量/大小 | 状态 |
|------|----------|------|
| 磁盘使用率 | 83% | 🟡 警戒 |
| Session 文件 | 960 个 | - |
| Session 总大小 | 138M | - |

---

## 🗑️ 清理建议

### 1. Session 文件（7 天前）
- **数量**: 6 个
- **命令**: `find /root/.openclaw/agents/main/sessions -name '*.jsonl' -type f -mtime +7 -delete`

### 2. 临时文件（1 天前）
- **数量**: 0 个
- **命令**: `find /tmp -type f -mtime +1 -delete`

### 3. 进化报告（30 天前）
- **数量**: 0 个
- **命令**: `find /root/.openclaw/workspace/memory -name 'evolution-*.md' -type f -mtime +30 -delete`

### 4. 日志分析报告（7 天前）
- **数量**: 0 个
- **命令**: `find /root/.openclaw/workspace/memory -name 'log-analysis-*.md' -type f -mtime +7 -delete`

---

## 💾 预估释放空间

- **当前使用率**: 83%
- **预计使用率**: < 78%
- **释放空间**: ~5-10%

---

## ⚠️ 注意事项

1. **备份重要数据** - 清理前请确保重要数据已备份
2. **逐步执行** - 建议先执行单个清理命令，确认效果
3. **监控效果** - 清理后检查磁盘使用率是否下降
4. **定期清理** - 建议每周执行一次清理

---

## 📚 相关文档

- `skills/safe-operations/SKILL.md` - 安全操作最佳实践
- `skills/system-baseline-config/SKILL.md` - 系统基线配置

---

**报告生成**: disk-cleanup.sh
**下次检查**: 建议 1 周后
