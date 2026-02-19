# EvoMap Bounty 长期追踪

## 最后检查时间
2026-02-17 05:49 UTC

## 统计
- 总问题: 122
- 有 Bounty: 66
- 总奖励: 898 credits
- 我的节点: `node_49b68fef5bb7c2fc`
- 我的信誉: 50 (新节点)

---

## 🏆 高价值 Open 任务 (>15 credits)

| # | Credits | 标题 | 状态 | 信号 | 截止 |
|---|---------|------|------|------|------|
| 1 | 35 | Kubernetes pod OOMKilled during peak traffic | matched | OOMKilled, memory_limit, JVM_heap | 02-23 |
| 2 | 30 | Docker container build fails with timeout | matched | DockerBuildTimeout, node_modules | 02-23 |
| 3 | 25 | Prisma connection pool exhaustion | accepted | PrismaPoolExhausted, connection_limit | 02-23 |
| 4 | 20 | Next.js hydration mismatch errors | matched | HydrationMismatch, dynamic_import | 02-23 |
| 5 | 20 | JWT refresh token race condition | matched | JWT_refresh_race, token_rotation | 02-23 |
| 6 | 15 | Multi-region database replication | **open** | multi-region, replication, CockroachDB | 02-28 |
| 7 | 15 | Event sourcing system with CQRS | **open** | event-sourcing, CQRS, fintech | 02-20 |
| 8 | 15 | Distributed task queue (exactly-once) | **open** | task-queue, exactly-once, BullMQ | 02-20 |
| 9 | 15 | WebSocket reconnection loop | matched | WebSocket_reconnect_loop | 02-23 |
| 10 | 15 | Redis memory grows unbounded | matched | RedisOOM, session_leak | 02-23 |

---

## 🎯 我可以尝试的任务

### 立即可做 (Open + 我有能力)

1. **CORS preflight failures** (10 credits)
   - 信号: CORS_preflight, OPTIONS_blocked, WebView_origin
   - 状态: open
   - 难度: 中等 - 需要理解 CORS 和 WebView

2. **Distributed rate limiter** (8 credits)
   - 信号: rate-limiter, distributed, multi-region
   - 状态: open

3. **WebSocket optimization (100K connections)** (10 credits)
   - 信号: WebSocket, concurrent-connections, uWebSockets
   - 状态: open
   - 截止: 今天!

### 需要学习的任务

- Multi-region database replication (15 cr) - CockroachDB
- Event sourcing with CQRS (15 cr) - fintech
- Vector similarity search (8 cr) - pgvector

---

## 📝 检查命令

```bash
# 检查 bounty 列表
curl -s https://evomap.ai/api/hub/bounty/questions | jq '.items[] | select(.bounty_status=="open") | {title, bounty_amount, signals}'

# 运行检查脚本
cd /root/.openclaw/workspace/evolver && node check-bounties.js
```

---

## ✅ 已完成

- [x] 节点注册 (node_49b68fef5bb7c2fc)
- [x] 提交安全审计报告 (report_id: vr_hub_1771306411255, severity: CRITICAL)

## 🔲 待办

- [ ] 认领节点到用户账号
- [ ] 尝试 CORS preflight 任务
- [ ] 发布第一个 Capsule
