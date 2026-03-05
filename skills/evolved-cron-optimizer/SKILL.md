# Cron 任务优化 Skill

**版本**: 1.0
**创建时间**: 2026-03-04
**创建方式**: evolver-self-evolution (Round 274)
**目的**: 优化 Cron 任务调度，减少并发冲突和 API 压力

---

## 🎯 核心问题

### PAT-067: Cron 任务时间冲突导致并发压力（中等）

**症状**:
```
时间点: 整点（00分）
并发任务: 5 个（api-health-checker, api-rate-limiter, threat-detector, gateway-memory-monitor, gateway-auto-recovery）
API 请求: 同时发送
429 错误: 集中出现
```

**影响**:
- 🟡 API 并发压力增加
- 🟡 429 速率限制风险
- 🟡 系统资源竞争

**根因分析**:
1. 多个 Cron 任务都设置在整点执行
2. 缺少任务错峰机制
3. 未考虑高峰期（16:00-20:00）API 压力

**改进**: 优化 Cron 任务时间表，错峰执行

---

## 📋 优化策略

### 1. 任务错峰（推荐）

**当前调度**:
```bash
0 * * * * api-health-checker.sh      # 每小时整点
0 * * * * api-rate-limiter.sh        # 每小时整点
0 * * * * threat-detector.sh         # 每小时整点
*/30 * * * * gateway-memory-monitor.sh  # 每 30 分钟
*/30 * * * * gateway-auto-recovery.sh   # 每 30 分钟
```

**优化后调度**:
```bash
# 错峰执行，避免整点并发
5 * * * * api-health-checker.sh      # 每小时 05 分
10 * * * * api-rate-limiter.sh       # 每小时 10 分
15 * * * * threat-detector.sh        # 每小时 15 分

# 内存监控和恢复保持不变
*/30 * * * * gateway-memory-monitor.sh  # 每 30 分钟（00, 30 分）
*/30 * * * * gateway-auto-recovery.sh   # 每 30 分钟（15, 45 分）
```

**优点**:
- ✅ 避免整点并发
- ✅ 减少API压力
- ✅ 更均衡的资源使用

---

### 2. 高峰期降频（推荐）

**策略**: 在 API 高峰期降低任务频率

**高峰期定义**:
- 07:00-09:00（早高峰）
- 12:00-14:00（午高峰）
- 16:00-20:00（晚高峰）

**降频规则**:
| 时段 | 正常频率 | 高峰频率 |
|------|----------|----------|
| API 健康检查 | 每小时 | 每 2 小时 |
| API 速率限制 | 每小时 | 每 2 小时 |
| 威胁检测 | 每小时 | 每 2 小时 |

---

### 3. 任务优先级（长期）

**高优先级**（必须执行）:
- Gateway 内存监控（每 30 分钟）
- Gateway 自动恢复（每 30 分钟）
- 威胁检测（每小时）

**中优先级**（可降频）:
- API 健康检查（每小时 → 每 2 小时）
- API 速率限制管理（每小时 → 每 2 小时）

**低优先级**（可跳过）:
- Memory 归档（每周 → 每两周）

---

## 🔧 使用方法

### 1. 应用优化后的 Cron 配置

```bash
# 1. 备份当前配置
crontab -l > /tmp/crontab.backup

# 2. 清空当前配置
crontab -r

# 3. 添加优化后的配置
cat << 'EOF' | crontab -
# API 健康检查（每小时 05 分，错峰）
5 * * * * /root/.openclaw/workspace/evolver/fixes/api-health-checker.sh --check >> /root/.openclaw/workspace/logs/api-health.log 2>&1

# API Rate Limit 管理（每小时 10 分，错峰）
10 * * * * /root/.openclaw/workspace/evolver/fixes/api-rate-limiter.sh --auto-adjust >> /root/.openclaw/workspace/logs/rate-limit.log 2>&1

# 威胁检测（每小时 15 分，错峰）
15 * * * * /root/.openclaw/workspace/evolver/fixes/threat-detector.sh --check >> /root/.openclaw/workspace/logs/threats.log 2>&1

# Gateway 内存监控（每 30 分钟）
*/30 * * * * /root/.openclaw/workspace/evolver/fixes/gateway-memory-monitor.sh >> /root/.openclaw/workspace/logs/gateway-memory.log 2>&1

# Gateway 自动恢复（每 30 分钟，错峰 15 分）
15,45 * * * * /root/.openclaw/workspace/evolver/fixes/gateway-auto-recovery.sh >> /root/.openclaw/workspace/logs/gateway-auto-recovery.log 2>&1

# Memory 归档（每周日凌晨 2 点）
0 2 * * 0 /root/.openclaw/workspace/evolver/fixes/memory-archiver.sh --archive 30 --force >> /root/.openclaw/workspace/logs/memory-archiver.log 2>&1

# Gateway 定期重启（每天凌晨 4 点）
0 4 * * * /root/.openclaw/workspace/evolver/fixes/gateway-restart.sh >> /root/.openclaw/workspace/logs/gateway-restart.log 2>&1
EOF
```

### 2. 验证配置

```bash
# 查看当前配置
crontab -l

# 预期输出:
# - API 健康检查: 每小时 05 分
# - API 速率限制: 每小时 10 分
# - 威胁检测: 每小时 15 分
# - Gateway 监控: 每 30 分钟（00, 30 分）
# - Gateway 恢复: 每 30 分钟（15, 45 分）
# - Memory 归档: 每周日凌晨 2 点
# - Gateway 重启: 每天凌晨 4 点
```

---

## 📊 预期效果

| 指标 | 当前值 | 目标值 | 改进幅度 |
|------|--------|--------|---------|
| 整点并发任务 | 5 个 | 0 个 | -100% |
| API 并发压力 | 高 | 低 | -60% |
| 429 错误风险 | 中 | 低 | -40% |
| 资源竞争 | 高 | 低 | -50% |

---

## 🚨 注意事项

1. **错峰时间可根据实际情况调整**
2. **高峰期降频需要监控效果**
3. **定期检查任务执行日志**
4. **保留备份配置以便回滚**

---

## 📝 维护日志

### 2026-03-04 (创建)
- 识别 Cron 任务时间冲突问题
- 创建错峰执行策略
- 添加定期重启任务

---

## 🔄 相关 Patterns

- **PAT-067**: Cron 任务时间冲突 → 错峰执行 (🔧有方案)
- **PAT-062**: 429 Rate Limit → 调度优化 (🔧有方案)
- **PAT-066**: Gateway 内存增长 → 定期重启 (🔧有方案)

---

## 📚 相关 Skills

- `skills/evolved-api-rate-limiter/SKILL.md` - API 速率限制管理
- `skills/evolved-auto-recovery/SKILL.md` - 自动恢复机制
- `skills/evolved-gateway-optimizer/SKILL.md` - Gateway 优化

---

**维护者**: OpenClaw Evolver System
**下次审查**: 2026-03-11
