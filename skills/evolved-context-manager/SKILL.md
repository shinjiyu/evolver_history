# Evolved Context Manager

**版本**: 1.0
**创建时间**: 2026-03-10
**创建方式**: evolver-self-evolution (Round 298)
**目的**: 主动管理上下文窗口，防止超出限制

---

## 🎯 核心问题

### PAT-060: 上下文窗口超出（P0 紧急）

**症状**:
```
Unhandled stop reason: model_context_window_exceeded
Token 峰值: 163,625 (远超 GLM-5 128K 限制)
出现次数: 78 次 (Round 293)
健康评分: 5.5/10
```

**影响**:
- 🔴 **会话中断**: 长时间任务无法继续
- 🔴 **系统不稳定**: 健康评分下降
- 🔴 **资源浪费**: 大量 Token 消耗在重复请求上

**根本原因**:
1. 长时间运行的会话积累了过多上下文
2. 多个 cron 任务在同一会话中累积
3. 未实施上下文压缩策略
4. 缺少 Token 实时监控

---

## 📋 管理策略

### 1. Token 监控（主动）

**监控脚本**: `evolver/fixes/context-monitor.sh`

**监控频率**: 每 30 分钟（与心跳同步）

**告警阈值**:
| 级别 | Token 使用 | 状态 | 行动 |
|------|-----------|------|------|
| 正常 | < 80,000 | normal | 继续运行 |
| 警告 | 80,000-100,000 | warning | 准备压缩 |
| 严重 | > 100,000 | critical | **立即压缩** |

**当前状态**:
```json
{
  "current_tokens": 0,
  "status": "unknown",
  "last_check": "2026-03-10 04:30"
}
```

---

### 2. 上下文压缩（自动化）

**触发条件**:
- Token > 80,000（警告级别）
- 会话运行 > 4 小时
- 连续 cron 任务 > 3 个

**压缩策略**:

#### A. 历史消息压缩
- 保留最近 10 轮对话
- 压缩 10 轮前的对话为摘要
- 删除重复和冗余信息

#### B. 会话轮换
- 每运行 4 小时创建新会话
- 将重要状态转移到新会话
- 清理旧会话上下文

#### C. 子会话分担
- 长任务使用 `sessions_spawn` 创建子会话
- 子会话完成后自动清理
- 避免主会话累积过多上下文

---

### 3. 主动预防（推荐）

**定期检查**: 每小时

**预防措施**:
1. 在接近 80K tokens 时主动压缩
2. 长任务使用子会话
3. 避免在单个会话中执行过多 cron 任务

---

## 🔧 使用方法

### 1. 立即检查（手动）

```bash
# 检查当前 Token 使用
bash /root/.openclaw/workspace/evolver/fixes/context-monitor.sh
```

### 2. 主动压缩（手动）

```bash
# 压缩上下文
bash /root/.openclaw/workspace/evolver/fixes/context-compress.sh
```

### 3. 自动监控（推荐）

```bash
# 添加到 crontab（每 30 分钟）
*/30 * * * * /root/.openclaw/workspace/evolver/fixes/context-monitor.sh >> /root/.openclaw/workspace/logs/context-monitor.log 2>&1
```

### 4. 查看状态

```bash
# 查看当前状态
cat /root/.openclaw/workspace/logs/context-state.json

# 查看监控日志
tail -50 /root/.openclaw/workspace/logs/context-monitor.log
```

---

## 📊 预期效果

| 指标 | 当前值 | 目标值 | 改进幅度 |
|------|--------|--------|---------|
| Token 峰值 | 163,625 | < 100,000 | -39% |
| 上下文超限次数 | 78 次 | < 5 次 | -94% |
| 健康评分 | 5.5/10 | 8.5/10 | +3.0 |
| 会话稳定性 | 不稳定 | 稳定 | ✅ |

---

## 🚨 注意事项

1. **压缩可能导致信息丢失**：仅压缩旧消息，保留最近重要信息
2. **会话轮换会短暂中断**：选择低峰期执行（凌晨 4 点）
3. **监控 Token 需要权限**：需要访问 session 状态
4. **子会话有延迟**：创建子会话需要 1-2 秒

---

## 📝 维护日志

### 2026-03-10 (创建)
- 发现上下文窗口超出问题（78 次）
- 创建 Context Manager Skill
- 定义监控和压缩策略

---

## 🔄 相关 Patterns

- **PAT-060**: 上下文窗口超出 → 主动管理 (🔧有方案)
- **PAT-048**: API 速率限制 → 限流策略 (🔧有方案)

---

## 📚 相关 Skills

- `skills/evolved-auto-recovery/SKILL.md` - 自动恢复
- `skills/evolved-api-rate-limiter/SKILL.md` - API 限流

---

**维护者**: OpenClaw Evolver System
**下次审查**: 2026-03-11
