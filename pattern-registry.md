# 模式注册表（活跃）

> 已归档模式见 archive/patterns-archived.md

| ID | 指纹描述 | 类型 | 首次发现 | 最后出现 | 出现次数 | 状态 |
|----|----------|------|----------|----------|----------|------|
| P001 | 智谱 AI 5小时限流 - 429 错误集中爆发 | API | 2026-03-05 | 2026-03-06 | 52 | ✅ 已恢复 |
| P002 | API 401 认证失败 - 临时性 | API | 2026-03-02 | 2026-03-02 | 1 | ✅ 已恢复 |
| P003 | Cron 任务状态 error - 多任务同时失败 | 系统 | 2026-03-03 | 2026-03-06 | 2 | ⚠️ 监控中 |
| P004 | 恶意 IP 扫描 .env 文件 | 安全 | 2026-03-03 | 2026-03-16 | 201+ | 🔴 **70h 未封禁** |
| P005 | EvoMap API 端点变更 - route_not_found | API | 2026-03-03 | 2026-03-03 | 2 | 📝 已记录 |
| P006 | Subagent spawn 权限问题 - agentId not allowed | 系统 | 2026-03-05 | 2026-03-05 | 3 | 📝 已记录 |
| P007 | 请求中断 - Request was aborted | 系统 | 2026-03-03 | 2026-03-06 | 3 | ✅ 已恢复 |
| P008 | 磁盘使用率偏高 - 超过 70% | 资源 | 2026-03-07 | 2026-03-15 | 8+ | 🔴 **82% 超警戒** |
| P009 | elevated 权限在特定 provider 中不可用 | 系统 | 2026-03-13 | 2026-03-16 | 24+ | 🔴 **24 次/6h** |

---

## 模式详情

### P001: 智谱 AI 5小时限流 🔴

**描述**: 智谱 AI API 在 5 小时窗口内达到使用上限，导致所有 AI 任务失败

**触发条件**:
- 多个 cron 任务同时触发
- 请求频率超过配额限制

**影响范围**:
- evolver-log-analysis
- SWE-Agent-Node 迭代
- novel-auto-review
- 所有依赖 GLM-5 的任务

**缓解措施**:
1. 调整 cron 任务时间，错峰执行
2. 添加 API 配额监控
3. 配置备用模型 fallback

**相关报告**:
- log-analysis-2026-03-06-1200.md

---

### P002: API 401 认证失败 ✅

**描述**: API Key 认证失败，可能是临时性问题

**状态**: 已自动恢复

---

### P003: Cron 任务状态 error ⚠️

**描述**: 多个 cron 任务同时报告 error 状态

**受影响任务**:
- novel-auto-review
- evolver-self-evolution
- nginx-security-daily
- analyze-openclaw-updates

**根因**: 主要与 P001 限流相关

---

### P004: 恶意 IP 扫描 .env 🔴 **严重**

**描述**: 攻击者持续尝试访问 .env 配置文件

**已知 IP**:
- 45.156.87.205 (WordPress 扫描器)
- 52.231.68.91 (Bing 搜索来源)
- **20.196.192.175** (🔴 **严重威胁** - 201 次 .env 扫描，持续 50+ 小时)

**最新状态** (2026-03-15):
- IP `20.196.192.175` 已持续攻击 **50 小时**
- 尝试访问 .env 文件 **201 次**
- **仍未封禁**（elevated 权限不可用）

**缓解措施**:
1. Nginx 返回 404（已生效）
2. **需要手动封禁**:
   ```bash
   sudo iptables -A INPUT -s 20.196.192.175 -j DROP
   sudo iptables-save > /etc/iptables/rules.v4
   ```
3. 配置 elevated 权限允许 heartbeat provider（见 P009）

**相关报告**:
- log-analysis-2026-03-15-0400.md

---

### P009: elevated 权限在特定 provider 中不可用 🔴 **严重**

**描述**: exec 工具的 elevated 参数在某些 provider（如 heartbeat）中不可用

**错误信息**:
```
elevated is not available right now (runtime=direct).
Failing gates: allowFrom
```

**影响**:
- 自动安全脚本无法执行 iptables 封禁
- 需要手动干预处理安全威胁
- 系统自动化能力受限

**触发条件**:
- 在 heartbeat provider 中执行需要 elevated 权限的命令
- 当前 allowFrom 配置未包含 heartbeat provider

**缓解措施**:
1. **短期**: 手动执行需要 elevated 权限的命令
2. **中期**: 配置 elevated 权限允许 heartbeat provider
   - 更新配置: `tools.elevated.allowFrom.heartbeat = true`
3. **长期**: 实现替代的安全响应机制
   - 调用外部 API 执行封禁
   - 使用 webhook 通知管理员

**相关模式**: P004（安全威胁无法自动封禁）

**相关报告**:
- log-analysis-2026-03-15-0400.md

---

### P005: EvoMap API 端点变更 📝

**描述**: EvoMap API 端点变更，旧端点返回 route_not_found

**解决方案**: 更新 skill 配置使用新端点

---

### P006: Subagent spawn 权限问题 📝

**描述**: 尝试创建子代理时返回 agentId is not allowed

**解决方案**: 更新 agents.list allowlist 配置

---

### P007: 请求中断 ⚠️

**描述**: 请求被中断，需要重试

**频率**: 低（2次/6小时）

---

### P008: 磁盘使用率偏高 🔴 **82% 超警戒**

**描述**: 磁盘使用率持续偏高，已超过 80% 警戒线

**当前状态** (2026-03-15):
- 使用率: **82%**（39G / 50G）
- 超过 80% 警戒线
- 剩余可用: 9.0G
- **状态升级**: 从监控中升级为严重

**历史趋势**:
- 2026-03-07: 74%
- 2026-03-14: 79%
- 2026-03-15 04:00: 81%
- 2026-03-15 08:00: **82%** 🔴

**大文件占用**:
| 目录 | 大小 | 说明 |
|------|------|------|
| evolver | 364M | 自进化相关文件 |
| swe-agent-node | 192M | SWE Agent 迭代文件 |
| logs | 147M | 日志文件 |
| agent-network-protocol | 75M | 代理网络协议 |
| node_modules | 54M | Node.js 依赖 |

**缓解措施**:
1. **立即**: 检查大文件占用
   ```bash
   du -sh /root/.openclaw/workspace/* | sort -h | tail -10
   ```
2. **短期**: 清理旧日志文件和备份
3. **长期**: 配置自动清理脚本（>85% 告警）

**相关报告**:
- log-analysis-2026-03-15-0801.md

---

## 统计

| 指标 | 值 |
|------|-----|
| 活跃模式 | 9 |
| 高优先级 | 2 |
| 监控中 | 2 |
| 已解决 | 3 |
| 已记录 | 2 |

---

**最后更新**: 2026-03-16 00:00
**下次更新**: 发现新模式时
