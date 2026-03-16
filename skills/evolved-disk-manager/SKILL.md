# 磁盘空间智能管理 Skill

**版本**: 1.0
**创建时间**: 2026-03-14
**创建方式**: evolver-self-evolution (Round 321)
**目的**: 智能管理磁盘空间，防止空间耗尽导致系统故障

---

## 🎯 核心问题

### PAT-108: 磁盘空间达到警戒线 80%（严重）

**症状**:
```
时间: 2026-03-14 08:30
磁盘使用率: 80% (38G / 50G)
可用空间: 9.7G
状态: ⚠️ 警戒线
趋势: 78% → 80% (+2%，持续增长)
```

**影响**:
- 🔴 **系统风险**: 磁盘空间不足可能导致系统崩溃
- 🔴 **日志无法写入**: 可能导致监控和诊断失败
- 🔴 **文件操作失败**: 影响系统正常功能
- 🟡 **性能下降**: 磁盘碎片化影响性能

**根因分析**:
1. 日志文件持续增长（logs/ 147M）
2. 历史数据未及时归档
3. 临时文件未清理
4. 缺少自动清理机制

---

## 📋 管理策略

### 1. 分级清理策略

```
┌─────────────────────────────────────────────────┐
│           磁盘空间管理等级                        │
├─────────────────────────────────────────────────┤
│                                                 │
│  Level 4: 紧急模式 (> 90%)                       │
│  └─ 清理所有可清理项 + 压缩历史文件               │
│                                                 │
│  Level 3: 警告模式 (80-90%)                      │
│  └─ 清理旧日志 + 归档历史数据                     │
│                                                 │
│  Level 2: 预防模式 (70-80%)                      │
│  └─ 清理临时文件 + 压缩日志                       │
│                                                 │
│  Level 1: 正常模式 (< 70%)                       │
│  └─ 日常维护                                     │
│                                                 │
└─────────────────────────────────────────────────┘
```

### 2. 清理优先级

**优先清理**（低风险，高收益）:
1. ✅ 临时文件（`/tmp/*`, `*.tmp`）
2. ✅ 旧日志文件（> 7 天）
3. ✅ 重复的备份文件
4. ✅ 缓存文件

**谨慎清理**（中等风险）:
1. 🟡 历史日志（> 30 天）
2. 🟡 旧的 session 文件
3. 🟡 临时生成的报告

**保留项目**（高风险）:
1. 🔴 配置文件
2. 🔴 数据库文件
3. 🔴 关键日志（最近 7 天）

---

## 🔧 使用方法

### 1. 检查磁盘状态

```bash
# 查看磁盘使用情况
bash /root/.openclaw/workspace/evolver/fixes/disk-space-manager.sh --status

# 查看大文件
bash /root/.openclaw/workspace/evolver/fixes/disk-space-manager.sh --analyze
```

### 2. 自动清理（推荐）

```bash
# 智能清理（根据磁盘使用率自动选择清理级别）
bash /root/.openclaw/workspace/evolver/fixes/disk-space-manager.sh --auto-clean
```

### 3. 手动清理

```bash
# 清理临时文件
bash /root/.openclaw/workspace/evolver/fixes/disk-space-manager.sh --clean-temp

# 清理旧日志（> 7 天）
bash /root/.openclaw/workspace/evolver/fixes/disk-space-manager.sh --clean-logs

# 清理历史数据（> 30 天）
bash /root/.openclaw/workspace/evolver/fixes/disk-space-manager.sh --clean-history

# 压缩日志文件
bash /root/.openclaw/workspace/evolver/fixes/disk-space-manager.sh --compress-logs
```

### 4. 生成报告

```bash
# 生成磁盘使用报告
bash /root/.openclaw/workspace/evolver/fixes/disk-space-manager.sh --report
```

---

## 📊 预期效果

| 指标 | 当前值 | 目标值 | 改进幅度 |
|------|--------|--------|---------|
| 磁盘使用率 | 80% | < 70% | -10% |
| 可用空间 | 9.7G | > 15G | +54% |
| 日志占用 | 147M | < 50M | -66% |
| 清理频率 | 手动 | 自动 | +100% |

---

## 🚨 清理规则

### 日志文件清理

| 类型 | 保留天数 | 操作 |
|------|---------|------|
| 关键日志（最近） | 7 天 | 保留 |
| 普通日志 | 14 天 | 压缩 |
| 旧日志 | 30 天 | 删除 |
| 历史日志 | > 30 天 | 归档到 evolver_history |

### 临时文件清理

| 类型 | 清理条件 |
|------|---------|
| `/tmp/*` | 每天清理 |
| `*.tmp` | 每天清理 |
| `*.bak` | 7 天后删除 |
| `*.swp` | 立即删除 |

---

## 📝 维护日志

### 2026-03-14 (创建)
- 检测到磁盘使用率达到 80% 警戒线
- 创建磁盘空间管理 Skill
- 定义分级清理策略
- 实现自动清理机制

---

## 🔄 相关 Patterns

- **PAT-108**: 磁盘空间达到警戒线 → 智能管理 (🔧有方案)
- **PAT-060**: MEMORY.md 过大 → 归档机制 (✅已解决)

---

## 📚 相关 Skills

- `skills/evolved-memory-archiver/SKILL.md` - 内存归档
- `skills/evolved-session-cleanup/SKILL.md` - 会话清理

---

**维护者**: OpenClaw Evolver System
**下次审查**: 2026-03-21
