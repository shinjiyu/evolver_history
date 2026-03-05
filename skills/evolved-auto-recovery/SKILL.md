# 系统自动恢复 Skill

**版本**: 1.0
**创建时间**: 2026-03-04
**创建方式**: evolver-self-evolution (Round 273)
**目的**: 自动检测并恢复系统异常状态

---

## 🎯 核心问题

### PAT-066: Gateway 内存持续增长导致系统资源紧张（严重）

**症状**:
```
时间: 08:37 → 12:31 (4 小时)
Gateway 内存: 1422 MB → 1576 MB (+154 MB, +11%)
系统可用内存: 748 MB → 605 MB (-143 MB, -19%)
状态: warning → critical
```

**影响**:
- 🔴 **严重告警**: Gateway 内存 > 1500 MB
- 🔴 **系统紧张**: 可用内存 < 20%
- 🔴 **持续恶化**: 内存持续增长
- 🟡 **OOM 风险**: 可能导致进程被杀死

**根因分析**:
1. Gateway 长时间运行（从 03-03 启动，已运行 36+ 小时）
2. 内存泄漏未完全解决
3. 缺少自动重启机制
4. Swap 未配置导致无缓冲

**改进**: 创建自动恢复机制，当检测到严重状态时自动重启

---

## 📋 恢复策略

### 1. 自动检测（已实现）

**监控脚本**: `gateway-memory-monitor.sh`

**检测频率**: 每 30 分钟

**告警阈值**:
| 级别 | Gateway 内存 | 系统可用内存 | 状态 |
|------|--------------|--------------|------|
| 正常 | < 1024 MB | > 30% | normal |
| 警告 | 1024-1500 MB | 20-30% | warning |
| 严重 | > 1500 MB | < 20% | critical |

**当前状态**:
```json
{
  "gateway_memory_mb": 1576,
  "system_available_mb": 605,
  "available_percent": 16,
  "status": "critical"
}
```

---

### 2. 自动恢复（新增）

**触发条件**:
- Gateway 内存 > 1500 MB
- 或系统可用内存 < 15%

**恢复操作**:
```bash
#!/bin/bash
# Gateway 自动恢复脚本

# 1. 检测严重状态
if [ "$STATUS" = "critical" ]; then
    log "🔴 检测到严重状态，启动自动恢复..."
    
    # 2. 记录恢复前状态
    log "📊 恢复前: Gateway ${GATEWAY_MEM}MB, 可用 ${AVAIL_MEM}MB"
    
    # 3. 执行重启
    bash /root/.openclaw/workspace/evolver/fixes/gateway-restart.sh
    
    # 4. 验证恢复
    # 5. 记录恢复后状态
    # 6. 发送通知
fi
```

---

### 3. 主动预防（推荐）

**定期重启**: 每天凌晨 4 点

**Swap 配置**: 配置 2 GB Swap

**内存限制**: 限制 Gateway 最大内存为 1 GB

---

## 🔧 使用方法

### 1. 立即恢复（紧急）

```bash
# 手动重启 Gateway
bash /root/.openclaw/workspace/evolver/fixes/gateway-restart.sh
```

### 2. 自动恢复（推荐）

```bash
# 添加到 crontab（每 30 分钟检查）
*/30 * * * * /root/.openclaw/workspace/evolver/fixes/gateway-auto-recovery.sh
```

### 3. 定期重启（预防）

```bash
# 每天凌晨 4 点重启
0 4 * * * /root/.openclaw/workspace/evolver/fixes/gateway-restart.sh
```

### 4. 查看状态

```bash
# 查看当前状态
cat /root/.openclaw/workspace/logs/gateway-memory-state.json

# 查看监控日志
tail -50 /root/.openclaw/workspace/logs/gateway-memory.log
```

---

## 📊 预期效果

| 指标 | 当前值 | 目标值 | 改进幅度 |
|------|--------|--------|---------|
| Gateway 内存 | 1576 MB | < 800 MB | -49% |
| 系统可用内存 | 605 MB (16%) | > 1500 MB (>40%) | +148% |
| 系统状态 | critical | normal | ✅ |
| OOM 风险 | 高 | 低 | -80% |

---

## 🚨 注意事项

1. **重启会导致短暂服务中断**（< 10 秒）
2. **选择低峰期重启**（凌晨 4 点）
3. **监控重启后的服务状态**
4. **记录重启历史**

---

## 📝 维护日志

### 2026-03-04 (创建)
- 检测到 Gateway 内存持续增长（1422 → 1576 MB）
- 创建自动恢复机制
- 定义恢复策略和阈值

---

## 🔄 相关 Patterns

- **PAT-066**: Gateway 内存持续增长 → 自动恢复 (🔧有方案)
- **PAT-065**: Gateway 内存占用过高 → 优化策略 (🔧有方案)
- **PAT-042**: Swap 未配置 → 紧急配置 (🔧有方案)

---

## 📚 相关 Skills

- `skills/evolved-gateway-optimizer/SKILL.md` - Gateway 优化
- `skills/emergency-response/SKILL.md` - 紧急响应

---

**维护者**: OpenClaw Evolver System
**下次审查**: 2026-03-11
