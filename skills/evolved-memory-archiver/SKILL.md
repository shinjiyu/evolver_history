# Memory 自动归档 Skill

**版本**: 1.0
**创建时间**: 2026-03-03
**创建方式**: evolver-self-evolution (Round 267)
**目的**: 自动维护 MEMORY.md，防止文件过大，定期归档旧内容

---

## 🎯 核心问题

### PAT-060: MEMORY.md 过大

**症状**:
- MEMORY.md 大小: 4.8 MB (63074 行，522 节)
- 未更新时间: 72+ 小时
- 文件数量: 250 个 memory 文件

**影响**:
- 加载时间过长
- Token 消耗过大
- 检索效率低下

---

## 📋 归档策略

### 1. 分层归档机制

```
MEMORY.md (活跃记忆，< 500 KB)
    ↓ 超过 30 天的内容
memory/YYYY-MM.md (月度归档)
    ↓ 超过 90 天的内容
memory/archive/YYYY-Q.md (季度归档)
```

### 2. 归档规则

| 内容类型 | 保留策略 | 归档位置 |
|---------|---------|---------|
| Pattern 解决方案 | 永久保留 | MEMORY.md |
| Skill 创建记录 | 永久保留 | MEMORY.md |
| 系统配置变更 | 永久保留 | MEMORY.md |
| 日常交互记录 | 30 天 | memory/YYYY-MM.md |
| 错误修复记录 | 60 天 | memory/YYYY-MM.md |
| Cron 任务日志 | 7 天 | memory/YYYY-MM.md |

### 3. 自动化脚本

**脚本路径**: `/root/.openclaw/workspace/evolver/fixes/memory-archiver.sh`

**功能**:
- 检查 MEMORY.md 大小
- 提取超过 N 天的内容
- 归档到对应月份文件
- 创建摘要保留在 MEMORY.md
- 清理过期的临时文件

---

## 🔧 使用方法

### 手动归档

```bash
# 检查 MEMORY.md 状态
bash /root/.openclaw/workspace/evolver/fixes/memory-archiver.sh --check

# 执行归档（保留最近 30 天）
bash /root/.openclaw/workspace/evolver/fixes/memory-archiver.sh --archive 30

# 强制归档（不询问）
bash /root/.openclaw/workspace/evolver/fixes/memory-archiver.sh --archive 30 --force
```

### 自动归档（Cron）

```bash
# 每周日凌晨 2 点执行归档
0 2 * * 0 /root/.openclaw/workspace/evolver/fixes/memory-archiver.sh --archive 30 --force
```

---

## 📊 预期效果

| 指标 | 当前值 | 目标值 | 改进幅度 |
|------|--------|--------|---------|
| MEMORY.md 大小 | 4.8 MB | < 500 KB | -90% |
| 加载时间 | ~5s | < 1s | -80% |
| Token 消耗 | 高 | 低 | -70% |
| 检索效率 | 低 | 高 | +200% |

---

## 🚨 注意事项

1. **备份优先**: 归档前自动创建备份
2. **保留关键信息**: Pattern、Skill、配置永久保留
3. **可恢复性**: 归档文件保存在 memory/ 目录，随时可查
4. **摘要机制**: 归档内容在 MEMORY.md 保留摘要

---

## 📝 维护日志

### 2026-03-03 (创建)
- 创建 memory-archiver.sh 脚本
- 定义归档策略和规则
- 设置自动化 Cron 任务

---

## 🔄 相关 Patterns

- **PAT-060**: MEMORY.md 过大 → 自动归档机制 (🔧有方案)

---

## 📚 相关 Skills

- `skills/log-analysis/SKILL.md` - 日志分析
- `skills/evolution-verification/SKILL.md` - 进化验证

---

**维护者**: OpenClaw Evolver System
**下次审查**: 2026-03-10
