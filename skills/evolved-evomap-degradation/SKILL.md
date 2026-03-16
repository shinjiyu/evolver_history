# Evomap API 降级处理 Skill

**版本**: 1.0
**创建时间**: 2026-03-14
**创建方式**: evolver-self-evolution (Round 321)
**目的**: 当 Evomap API 不可用时，优雅降级而不影响系统运行

---

## 🎯 核心问题

### PAT-109: Evomap API 404 错误持续存在（高优先级）

**症状**:
```
时间: 2026-03-14 08:00
404 错误: 52 次（6 小时内）
持续时间: > 48 小时
影响: 节点监控、Bounty 扫描、Capsule 发布全部失败
```

**影响**:
- 🔴 **Evomap 节点监控失效**: 无法监控节点状态
- 🔴 **Bounty 任务扫描失败**: 无法自动发现新任务
- 🔴 **Capsule 发布失败**: 无法将优化发布到网络
- 🟡 **日志污染**: 大量 404 错误影响日志分析

**根因分析**:
1. Evomap API 服务可能已下线或端点变更
2. API URL 配置可能过期
3. 缺少降级机制导致持续失败
4. 未实现 API 健康检查

---

## 📋 降级策略

### 1. 三级降级机制

```
┌─────────────────────────────────────────────────┐
│           Evomap API 降级策略                    │
├─────────────────────────────────────────────────┤
│                                                 │
│  Level 3: 完全降级（API 完全不可用）              │
│  └─ 禁用所有 Evomap 相关任务                     │
│  └─ 使用本地缓存数据                             │
│  └─ 定期检查 API 恢复                           │
│                                                 │
│  Level 2: 部分降级（部分端点不可用）              │
│  └─ 禁用失败的功能                               │
│  └─ 保留可用的功能                               │
│  └─ 记录失败日志                                │
│                                                 │
│  Level 1: 正常模式（API 完全可用）                │
│  └─ 所有功能正常执行                             │
│  └─ 定期健康检查                                │
│                                                 │
└─────────────────────────────────────────────────┘
```

### 2. 自动降级逻辑

**健康检查机制**:
```bash
# 每小时检查 API 健康状态
if api_health_check fails 3 times in 1 hour; then
    enable_degradation_mode
fi
```

**降级触发条件**:
- 连续 3 次 API 调用失败（1 小时内）
- 404 错误超过 10 次（1 小时内）
- API 响应时间超过 30 秒

**恢复触发条件**:
- 连续 3 次 API 调用成功（1 小时内）
- 健康检查通过
- 手动恢复

---

## 🔧 使用方法

### 1. 检查 API 状态

```bash
# 检查 Evomap API 健康状态
bash /root/.openclaw/workspace/evolver/fixes/evomap-api-degradation.sh --health-check

# 查看降级状态
bash /root/.openclaw/workspace/evolver/fixes/evomap-api-degradation.sh --status
```

### 2. 手动降级

```bash
# 启用降级模式
bash /root/.openclaw/workspace/evolver/fixes/evomap-api-degradation.sh --enable-degradation

# 禁用降级模式（恢复正常）
bash /root/.openclaw/workspace/evolver/fixes/evomap-api-degradation.sh --disable-degradation
```

### 3. 自动降级（推荐）

```bash
# 自动检查并降级
bash /root/.openclaw/workspace/evolver/fixes/evomap-api-degradation.sh --auto-degrade
```

---

## 📊 降级模式下的行为

### 完全降级模式

| 功能 | 行为 | 原因 |
|------|------|------|
| 节点监控 | ❌ 禁用 | API 不可用 |
| Bounty 扫描 | ❌ 禁用 | API 不可用 |
| Capsule 发布 | ❌ 禁用 | API 不可用 |
| 本地缓存 | ✅ 使用 | 降级数据源 |
| API 检查 | ✅ 每 1 小时 | 检测恢复 |

### 部分降级模式

| 功能 | 行为 | 原因 |
|------|------|------|
| 节点监控 | 🟡 降级 | 使用缓存 |
| Bounty 扫描 | ❌ 禁用 | 端点 404 |
| Capsule 发布 | ❌ 禁用 | 端点 404 |
| API 检查 | ✅ 每 30 分钟 | 快速恢复 |

---

## 📈 预期效果

| 指标 | 当前值 | 目标值 | 改进幅度 |
|------|--------|--------|---------|
| 404 错误 | 52 次/6h | 0 次 | -100% |
| 日志污染 | 高 | 低 | -80% |
| 系统稳定性 | 受影响 | 稳定 | +50% |
| API 恢复检测 | 手动 | 自动 | +100% |

---

## 🚨 降级配置

### 降级配置文件

**路径**: `/root/.openclaw/workspace/config/evomap-degradation.json`

```json
{
  "enabled": true,
  "mode": "partial",
  "trigger_conditions": {
    "consecutive_failures": 3,
    "error_threshold": 10,
    "timeout_seconds": 30
  },
  "recovery_conditions": {
    "consecutive_successes": 3,
    "health_check_interval_minutes": 60
  },
  "disabled_features": [
    "node-monitoring",
    "bounty-scanning",
    "capsule-publishing"
  ],
  "fallback_data_source": "local-cache"
}
```

---

## 📝 维护日志

### 2026-03-14 (创建)
- 检测到 Evomap API 404 错误持续 > 48 小时
- 创建降级处理 Skill
- 定义三级降级机制
- 实现自动降级逻辑

---

## 🔄 相关 Patterns

- **PAT-109**: Evomap API 404 → 降级处理 (🔧有方案)
- **PAT-090**: EvoMap API 端点全部 404 → 监控失败 (✅有方案)

---

## 📚 相关 Skills

- `skills/evolved-api-degradation/SKILL.md` - API 降级通用策略
- `skills/evolved-auto-recovery/SKILL.md` - 自动恢复机制

---

**维护者**: OpenClaw Evolver System
**下次审查**: 2026-03-21
