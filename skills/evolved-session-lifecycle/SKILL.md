# Evolved Session Lifecycle - 会话生命周期管理

**版本**: 1.0
**创建时间**: 2026-03-12
**创建方式**: evolver-self-evolution (Round 308)
**目的**: 管理会话生命周期，防止长时间会话累积过多请求

---

## 🎯 核心问题

### PAT-077: 长时间会话累积

**症状**:
- 会话运行时间超过 20-28 小时
- 单个会话累积大量 429 错误（50-70 次）
- 占总 429 错误的 75-85%
- 系统健康评分持续下降

**影响**:
- 🔴 **429 错误激增**: 长时间会话是主要来源
- 🔴 **系统不稳定**: 健康评分从 7.5 降至 5.0
- 🔴 **资源浪费**: 长时间会话占用内存和资源

**根本原因**:
1. 系统缺少会话轮换机制
2. 长时间运行的会话没有自动清理
3. 单个会话累积过多请求
4. 紧急措施无法暂停关键会话

---

## 📋 管理策略

### 1. 会话监控（主动）

**监控频率**: 每 4 小时

**监控指标**:

| 指标 | 正常 | 警告 | 严重 |
|------|------|------|------|
| 运行时长 | < 8h | 8-12h | > 12h |
| 429 错误/小时 | < 2 | 2-5 | > 5 |
| 文件大小 | < 500KB | 500KB-1MB | > 1MB |
| 内存占用 | < 100MB | 100-200MB | > 200MB |

**检查命令**:
```bash
bash /root/.openclaw/workspace/evolver/fixes/check-long-sessions.sh
```

### 2. 会话轮换（自动）

**触发条件**（满足任一）:
- 运行时长 > 12 小时
- 429 错误 > 5 次/小时
- 文件大小 > 1MB
- 内存占用 > 200MB

**轮换策略**:
1. 创建新会话
2. 转移重要状态（如 TASKS.md、MEMORY.md）
3. 清理旧会话上下文
4. 记录轮换日志

**预期效果**:
- 减少单个会话的 429 错误
- 防止会话累积过多请求
- 提高系统稳定性

### 3. 会话终止（手动/自动）

**严重会话**（运行 > 24 小时）:
- 建议手动终止
- 使用终止脚本
- 观察效果

**终止命令**:
```bash
# 干运行（查看将被终止的会话）
bash /root/.openclaw/workspace/evolver/fixes/terminate-long-sessions.sh --dry-run

# 实际执行（需确认）
bash /root/.openclaw/workspace/evolver/fixes/terminate-long-sessions.sh

# 强制执行（无需确认）
bash /root/.openclaw/workspace/evolver/fixes/terminate-long-sessions.sh --force
```

---

## 🔧 使用方法

### 1. 检查长时间会话（推荐每 4 小时）

```bash
# 默认阈值：12 小时
bash /root/.openclaw/workspace/evolver/fixes/check-long-sessions.sh

# 自定义阈值
bash /root/.openclaw/workspace/evolver/fixes/check-long-sessions.sh 8 16
# 参数 1: 长会话阈值（小时），默认 12
# 参数 2: 严重会话阈值（小时），默认 24
```

### 2. 终止长时间会话

```bash
# 干运行（查看但不执行）
bash /root/.openclaw/workspace/evolver/fixes/terminate-long-sessions.sh --dry-run

# 实际执行（需确认）
bash /root/.openclaw/workspace/evolver/fixes/terminate-long-sessions.sh

# 强制执行（无需确认）
bash /root/.openclaw/workspace/evolver/fixes/terminate-long-sessions.sh --force

# 自定义阈值
bash /root/.openclaw/workspace/evolver/fixes/terminate-long-sessions.sh --threshold 20 --force
```

### 3. 添加到 Cron（自动检查）

```bash
# 每 4 小时检查一次
0 */4 * * * bash /root/.openclaw/workspace/evolver/fixes/check-long-sessions.sh >> /root/.openclaw/workspace/logs/long-sessions.log 2>&1
```

---

## 📊 预期效果

### 短期（0-4 小时）

| 指标 | 当前值 | 预期值 | 改进幅度 |
|------|--------|--------|---------|
| 429 错误（2h） | 190 次 | < 100 次 | **-47%** |
| 长会话数 | 2 个 | 0 个 | **-100%** |
| 恢复条件满足 | 1/4 | 3/4 | +2 |

### 中期（4-12 小时）

| 指标 | 当前值 | 预期值 | 改进幅度 |
|------|--------|--------|---------|
| 429 错误（2h） | 190 次 | < 50 次 | **-74%** |
| 健康评分 | 5.0 | > 7.0 | +2.0 |
| 系统稳定性 | 不稳定 | 稳定 | ✅ |

---

## 🚨 注意事项

1. **终止会话可能导致任务中断**
   - 确保重要状态已保存
   - 使用干运行模式先检查

2. **会话终止后可能需要重启 Gateway**
   - 终止脚本只是移动文件
   - 会话可能仍在内存中运行

3. **定期检查**
   - 建议每 4 小时检查一次
   - 关注长时间运行的会话

4. **备份机制**
   - 终止的会话会被备份
   - 备份位置: `/root/.openclaw/workspace/logs/terminated-sessions/`

---

## 🔄 相关 Patterns

- **PAT-077**: 长时间会话累积 → 会话生命周期管理
- **PAT-048**: API 速率限制 (429) → 减少长时间会话

---

## 📚 相关 Skills

- `evolved-context-manager` - 上下文管理
- `evolved-auto-recovery` - 自动恢复

---

## 📝 维护日志

### 2026-03-12 (创建)
- 发现 2 个超长时间会话（20-28 小时）
- 它们占 75.8% 的 429 错误
- 创建会话生命周期管理 Skill
- 创建检测和终止脚本

---

**创建者**: OpenClaw Evolver System
**Round**: 308
**关联 Pattern**: PAT-077
**预期改进**: 429 错误 190→50 次（-74%）
