# Evolved EvoMap Recovery - EvoMap API 恢复机制

**版本**: 1.0
**创建时间**: 2026-03-12
**创建方式**: evolver-self-evolution (Round 311)
**目的**: 监控和自动恢复 EvoMap API 连接，处理 404 错误

---

## 🎯 核心问题

### PAT-090: EvoMap API 端点全部返回 404

**首次发现**: 2026-03-12 05:04
**最后确认**: 2026-03-12 08:04
**严重程度**: 🔴 P0 - 紧急

**测试结果**（Round 310）:
| 端点 | 状态 | 说明 |
|------|------|------|
| /health | 404 ❌ | 健康检查失败 |
| /api/bounties | 404 ❌ | Bounty 列表失败 |
| /api/capsules | 404 ❌ | Capsule 列表失败 |
| /api/leaderboard | 404 ❌ | 排行榜失败 |
| /a2a/nodes | 000 ❌ | 超时 |
| /a2a/bounties | 404 ❌ | A2A Bounty 失败 |
| /a2a/capsules | 404 ❌ | A2A Capsule 失败 |
| /a2a/health | 404 ❌ | A2A 健康检查失败 |

**通过率**: 0/8 (0%)

**影响**:
- ❌ 无法检查节点健康状态
- ❌ 无法扫描和完成 Bounty
- ❌ 无法发布 Capsule
- ❌ 无法使用 A2A 服务

**根本原因分析**:
1. EvoMap API 端点可能已变更
2. API 服务可能不可用
3. 认证凭证可能过期或缺失
4. 网络路由问题

---

## 📋 恢复策略

### 1. 健康检查（主动监控）

**检查频率**: 每 4 小时

**检查端点**:
```bash
# 基础健康检查
curl -s -o /dev/null -w "%{http_code}" https://evomap.ai/health

# API 端点检查
curl -s -o /dev/null -w "%{http_code}" https://evomap.ai/api/bounties
curl -s -o /dev/null -w "%{http_code}" https://evomap.ai/api/capsules
```

**健康状态定义**:
| 状态码 | 状态 | 说明 |
|--------|------|------|
| 200 | ✅ 正常 | API 可用 |
| 401/403 | 🟡 认证问题 | 需要更新凭证 |
| 404 | 🔴 端点变更 | 需要更新 URL |
| 500/502/503 | 🔴 服务不可用 | 等待恢复 |
| 000 | 🔴 网络问题 | 检查网络连接 |

### 2. 自动恢复流程

**触发条件**: 连续 2 次检查失败

**恢复步骤**:
1. **记录错误**: 保存详细错误信息到日志
2. **发送通知**: 通过 Feishu 发送告警
3. **降级运行**: 暂停依赖 EvoMap 的任务
4. **等待恢复**: 每 30 分钟重试一次
5. **恢复验证**: API 恢复后验证功能正常
6. **恢复任务**: 重新启动暂停的任务

### 3. 降级策略

**当 EvoMap API 不可用时**:

| 任务 | 正常行为 | 降级行为 |
|------|----------|----------|
| evomap-feature-monitor | 扫描 Bounty | ⏸️ 暂停，记录状态 |
| evomap-heartbeat | 发送心跳 | ⏸️ 暂停，等待恢复 |
| evomap-publish | 发布 Capsule | 🔄 重试队列，稍后发布 |
| 节点状态监控 | 检查节点健康 | 📊 使用本地缓存 |

---

## 🔧 使用方法

### 1. 检查 EvoMap API 状态

```bash
bash /root/.openclaw/workspace/evolver/fixes/evomap-health-check.sh
```

**输出示例**:
```
EvoMap API 健康检查
====================
时间: 2026-03-12 08:00

端点状态:
  /health: 404 ❌
  /api/bounties: 404 ❌
  /api/capsules: 404 ❌
  /api/leaderboard: 404 ❌

通过率: 0/4 (0%)
状态: 🔴 API 不可用

建议:
1. 检查 EvoMap 官方公告
2. 验证 API 端点 URL 是否变更
3. 联系 EvoMap 支持
```

### 2. 强制恢复检查

```bash
# 立即执行健康检查并尝试恢复
bash /root/.openclaw/workspace/evolver/fixes/evomap-health-check.sh --force

# 仅检查，不执行恢复
bash /root/.openclaw/workspace/evolver/fixes/evomap-health-check.sh --dry-run
```

### 3. 添加到 Cron

```bash
# 每 4 小时检查一次
0 */4 * * * bash /root/.openclaw/workspace/evolver/fixes/evomap-health-check.sh >> /root/.openclaw/workspace/logs/evomap-health.log 2>&1
```

---

## 📊 预期效果

### 短期（0-4 小时）

| 指标 | 当前值 | 预期值 | 说明 |
|------|--------|--------|------|
| API 可用性 | 0% | 待确认 | 取决于 API 服务状态 |
| 告警响应 | 无 | <5 分钟 | 自动发送通知 |
| 任务影响 | 高 | 低 | 降级运行 |

### 中期（4-24 小时）

| 指标 | 当前值 | 预期值 | 说明 |
|------|--------|--------|------|
| API 可用性 | 0% | >95% | API 恢复后 |
| 故障恢复时间 | 未知 | <30 分钟 | 自动检测和恢复 |
| 系统稳定性 | 低 | 高 | 降级策略生效 |

---

## 🚨 注意事项

1. **API 端点可能变更**
   - EvoMap API 仍在开发中
   - 端点 URL 可能随时变化
   - 需要定期检查官方文档

2. **认证凭证管理**
   - 确保 API Token 有效
   - 定期更新凭证
   - 避免凭证泄露

3. **降级影响**
   - 部分功能暂时不可用
   - 重要数据应本地缓存
   - 恢复后需要同步数据

4. **监控频率**
   - 不要过于频繁检查（避免触发 Rate Limit）
   - 建议 4 小时检查一次
   - 故障期间增加到 30 分钟一次

---

## 🔄 相关 Patterns

- **PAT-090**: EvoMap API 端点全部 404 → 本 Skill
- **PAT-055**: EvoMap 心跳超时 → 网络问题
- **PAT-056**: EvoMap 发布失败 → 降级重试

---

## 📚 相关 Skills

- `evolved-auto-recovery` - 自动恢复机制
- `network-error-retry` - 网络错误重试
- `evolved-cron-health-monitor` - Cron 任务健康监控

---

## 📝 维护日志

### 2026-03-12 (创建)
- 发现 EvoMap API 全部返回 404
- 创建健康检查和恢复机制
- 实现降级策略
- 添加自动告警通知

---

**创建者**: OpenClaw Evolver System
**Round**: 311
**关联 Pattern**: PAT-090
**预期改进**: API 不可用时快速检测和降级运行
