# 内存智能优化 Skill

**版本**: 1.0
**创建时间**: 2026-03-14
**创建方式**: evolver-self-evolution (Round 322)
**目的**: 智能管理内存使用，防止内存耗尽导致系统故障

---

## 🎯 核心问题

### PAT-111: 内存使用率达到 80%（严重）

**症状**:
```
时间: 2026-03-14 12:30
内存使用率: 80% (2.9Gi / 3.6Gi)
可用内存: 484Mi
趋势: +9%（从 71% → 80%）
状态: 🔴 需要关注
```

**影响**:
- 🔴 **系统性能下降**: 内存不足影响系统响应速度
- 🔴 **进程风险**: 可能触发 OOM Killer
- 🔴 **任务执行失败**: 内存密集型任务可能失败
- 🟡 **系统不稳定**: 内存压力导致系统不稳定

**根因分析**:
1. Gateway 内存占用高（长时间运行）
2. 长时间会话未清理
3. 日志文件占用内存（缓存）
4. 缺少内存监控和自动优化

---

## 📋 管理策略

### 1. 分级内存管理

```
┌─────────────────────────────────────────────────┐
│           内存管理等级                            │
├─────────────────────────────────────────────────┤
│                                                 │
│  Level 4: 紧急模式 (> 90%)                       │
│  └─ 强制清理 + 重启服务 + 告警                    │
│                                                 │
│  Level 3: 警告模式 (80-90%)                      │
│  └─ 清理长时间会话 + 优化缓存                     │
│                                                 │
│  Level 2: 预防模式 (70-80%)                      │
│  └─ 清理缓存 + 优化日志                          │
│                                                 │
│  Level 1: 正常模式 (< 70%)                       │
│  └─ 日常维护                                     │
│                                                 │
└─────────────────────────────────────────────────┘
```

### 2. 内存优化措施

**立即优化**（低风险）:
1. ✅ 清理文件系统缓存（`sync; echo 3 > /proc/sys/vm/drop_caches`）
2. ✅ 清理长时间会话（> 12 小时）
3. ✅ 压缩日志文件
4. ✅ 清理临时文件

**谨慎优化**（中等风险）:
1. 🟡 重启 Gateway（如果内存 > 1.5GB）
2. 🟡 清理旧的 session 文件
3. 🟡 优化数据库缓存

**高级优化**（高风险）:
1. 🔴 调整系统参数（vm.swappiness）
2. 🔴 配置 Swap（如果未配置）
3. 🔴 限制进程内存使用

---

## 🔧 使用方法

### 1. 检查内存状态

```bash
# 查看内存使用情况
bash /root/.openclaw/workspace/evolver/fixes/memory-optimizer.sh --status

# 分析内存占用
bash /root/.openclaw/workspace/evolver/fixes/memory-optimizer.sh --analyze
```

### 2. 自动优化（推荐）

```bash
# 智能优化（根据内存使用率自动选择优化级别）
bash /root/.openclaw/workspace/evolver/fixes/memory-optimizer.sh --auto-optimize
```

### 3. 手动优化

```bash
# 清理缓存
bash /root/.openclaw/workspace/evolver/fixes/memory-optimizer.sh --clean-cache

# 清理长时间会话
bash /root/.openclaw/workspace/evolver/fixes/memory-optimizer.sh --clean-sessions

# 重启 Gateway（谨慎）
bash /root/.openclaw/workspace/evolver/fixes/memory-optimizer.sh --restart-gateway

# 紧急优化
bash /root/.openclaw/workspace/evolver/fixes/memory-optimizer.sh --emergency
```

### 4. 配置内存阈值

```bash
# 设置警告阈值
bash /root/.openclaw/workspace/evolver/fixes/memory-optimizer.sh --config warning_threshold=80

# 设置紧急阈值
bash /root/.openclaw/workspace/evolver/fixes/memory-optimizer.sh --config emergency_threshold=90
```

---

## 📊 预期效果

| 指标 | 当前值 | 目标值 | 改进幅度 |
|------|--------|--------|---------|
| 内存使用率 | 80% | < 70% | -10% |
| 可用内存 | 484Mi | > 1Gi | +106% |
| Gateway 内存 | 1.5GB+ | < 1GB | -33% |
| 系统稳定性 | 下降 | 稳定 | +50% |

---

## 🚨 自动优化机制

### 触发条件

1. **内存使用率 > 80%**
   - 自动清理缓存
   - 清理长时间会话
   - 优化日志文件

2. **内存使用率 > 90%**
   - 紧急清理所有可清理项
   - 重启 Gateway（如果内存 > 1.5GB）
   - 发送告警

3. **可用内存 < 200Mi**
   - 紧急优化
   - 清理所有缓存
   - 重启高内存占用进程

### 恢复条件

1. **内存使用率 < 70%**
   - 恢复正常运行
   - 停止优化措施

2. **可用内存 > 1Gi**
   - 恢复正常
   - 定期维护

---

## 📝 维护日志

### 2026-03-14 (创建)
- 检测到内存使用率达到 80%（+9%）
- 创建内存智能优化 Skill
- 定义分级管理策略
- 实现自动优化机制

---

## 🔄 相关 Patterns

- **PAT-111**: 内存使用率达到 80% → 智能优化 (🔧有方案)
- **PAT-066**: Gateway 内存持续增长 → 自动恢复 (✅已解决)

---

## 📚 相关 Skills

- `skills/evolved-gateway-optimizer/SKILL.md` - Gateway 优化
- `skills/evolved-session-cleanup/SKILL.md` - 会话清理
- `skills/evolved-auto-recovery/SKILL.md` - 自动恢复

---

**维护者**: OpenClaw Evolver System
**下次审查**: 2026-03-21
