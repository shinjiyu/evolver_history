# 模式注册表（活跃）

> 已归档模式见 archive/patterns-archived.md

| ID | 指纹描述 | 类型 | 首现 | 末现 | 次数 | 状态 | 关联文件 |
|----|----------|------|------|------|------|------|----------|
| PAT-001 | [流程] 创建定时任务 + 安装进化 skill → 自动化自我改进 | 流程 | Round 002 | Round 004 | 3 | 活跃 | rounds/round-002-2026-02-21-1737.md |
| PAT-002 | [技术] 分析现有架构 + 设计多用户父子实例 → 系统扩展规划 | 技术 | Round 003 | Round 004 | 2 | 活跃 | rounds/round-003-2026-02-21-1800.md |
| PAT-003 | [技术] 429 错误 + 多任务失败 → API 余额耗尽 | 错误 | Round 004 | Round 197 | 99+ | ✅已稳定 | skills/system-baseline-config/SKILL.md |
| PAT-004 | [配置] web_search 工具缺少 Brave API Key → 功能不可用 | 配置 | Round 080 | Round 170 | 58+ | 🔧有方案 | skills/api-key-configurator/SKILL.md |
| PAT-005 | [连接] Gateway 关闭 (1008) + 配对要求 → 远程功能受限 | 连接 | Round 080 | Round 080 | 9 | 新增 | rounds/round-080-2026-02-23-0400.md |
| PAT-006 | [功能] cron 任务调用不存在的 log-analysis skill → 分析失败 | 功能缺失 | Round 080 | Round 080 | 3 | 新增 | rounds/round-080-2026-02-23-0400.md |
| PAT-007 | [操作] Edit 工具精确匹配失败 → 文件编辑重试 | 操作 | Round 164 | Round 187 | 28+ | 持续 | memory/log-analysis-2026-02-24-0255.md |
| PAT-008 | [文件] 尝试读取不存在的文件 → ENOENT 错误 | 文件 | Round 164 | Round 187 | 28 | 持续 | memory/log-analysis-2026-02-24-0255.md |
| PAT-009 | [API] EvoMap API Rate Limit (429) → evomap-auto-bounty 失败 | API | Round 166 | Round 169 | 229 | ✅已解决 | memory/verification-round-168-1771885395593.md |
| PAT-010 | [API] EvoMap API Server Error (5xx) → API 调用失败 | API | Round 166 | Round 169 | 53 | ✅已解决 | memory/verification-round-168-1771885395593.md |
| PAT-011 | [配置] evomap-auto-bounty 调用过于频繁 → 触发速率限制 | 配置 | Round 166 | Round 169 | 216 | ✅已解决 | memory/log-analysis-2026-02-24-0526.md |
| PAT-012 | [API] API 5xx 错误增长 → EvoMap 服务不稳定 | API | Round 168 | Round 169 | 39 | ✅已解决 | memory/verification-round-168-1771885395593.md |
| PAT-013 | [调度] adaptive-scheduler 执行过频 (26.7/hour) → 资源浪费 | 调度 | Round 168 | Round 169 | 160 | ✅已解决 | memory/log-analysis-2026-02-24-0526.md |
| PAT-014 | [调度] evolver-log-analysis 执行过频 (16.3/hour) → 资源浪费 | 调度 | Round 168 | Round 169 | 98 | ✅已解决 | memory/log-analysis-2026-02-24-0526.md |
| PAT-015 | [流程] 缺少效果验证 → 无法量化优化效果 | 流程 | Round 168 | Round 169 | 1 | ✅已解决 | skills/evolution-verification/SKILL.md |
| PAT-016 | [调度] 任务频率上升 (8/h) → API 错误增加 | 调度 | Round 177 | Round 181 | 12 | ✅已稳定 | memory/log-analysis-2026-02-24-1155.md |
| PAT-017 | [外部] 外部 API 服务不稳定 (500) → 系统错误飙升 | 外部 | Round 182 | Round 183 | 15 | ✅已恢复 | memory/log-analysis-2026-02-24-1331.md |
| PAT-018 | [调度] API 高峰期 (07:00-09:00) + 多任务并发 → 429 集中爆发 | 调度 | Round 187 | Round 197 | 71 | ✅已解决 | skills/peak-hours-monitoring/SKILL.md |
| PAT-019 | [配置] Git remote 指向错误仓库 → 进化历史同步失败 | 配置 | Round 188 | Round 188 | 1 | ✅已解决 | memory/evolution-2026-02-25-0405.md |
| PAT-020 | [流程] 高峰期监控经验固化 → 预防性监控策略 | 流程 | Round 189 | Round 189 | 1 | ✅已解决 | skills/peak-hours-monitoring/SKILL.md |
| PAT-021 | [API] 03:00 时段 Rate Limit + 任务并发 → 429 错误集中 | API | Round 203 | Round 204 | 13 | ✅有方案 | skills/peak-hours-monitoring/SKILL.md |
| PAT-022 | [API] 12:50 时段 Rate Limit 突发 → 429 错误高峰 | API | Round 206 | Round 207 | 16 | ✅已过去 | memory/log-analysis-2026-02-25-1300.md |
| PAT-023 | [API] 15:00-16:00 时段 Rate Limit 激增 → 429 严重爆发 | API | Round 213 | Round 244 | 97→0 | ✅✅已解决 | skills/peak-hours-monitoring/SKILL.md |
| PAT-024 | [API] 10:00 时段 Rate Limit 极高 → 429 最高峰 (104次) | API | Round 219 | Round 243 | 104→1 | ✅已解决 | skills/peak-hours-monitoring/SKILL.md |
| PAT-025 | [账户] API 余额耗尽 + 429 错误 → 所有任务失败 | 账户 | Round 220 | Round 241 | 136+ | ✅有方案 | skills/api-balance-monitor/SKILL.md |

| PAT-026 | [调度] Cron 任务过载 (15+ 并发) → 资源竞争 | 调度 | Round 220 | Round 221 | 15+ | 🟠高风险 | memory/log-analysis-2026-02-26-0800.md |
| PAT-027 | [API] Request aborted 错误 → 任务中断 | API | Round 221 | Round 221 | 10 | 🔴极高风险 | memory/log-analysis-2026-02-26-1200.md |
| PAT-028 | [API] GLM-5 Rate Limit 频繁 (429) → 872+ 次失败 | API | Round 225 | Round 227 | 872→0 | ✅✅已恢复 | memory/log-analysis-2026-02-27-1200.md |
| PAT-029 | [网络] network_error 频繁 → API 调用失败 | 网络 | Round 225 | Round 227 | 30→0 | ✅✅已恢复 | memory/log-analysis-2026-02-27-1200.md |
| PAT-030 | [API] EvoMap API 超时 → 自动化任务失败 | API | Round 225 | Round 227 | 0 | ✅✅稳定 | memory/log-analysis-2026-02-27-1200.md |
| PAT-031 | [任务] Task aborted → 任务被迫中止 | 任务 | Round 225 | Round 227 | 0 | ✅✅稳定 | memory/log-analysis-2026-02-27-1200.md |
| PAT-032 | [操作] Edit 工具匹配失败 → 文件更新重试 | 操作 | Round 225 | Round 227 | 0 | ✅已恢复 | memory/log-analysis-2026-02-27-1200.md |
| PAT-033 | [进程] Process SIGTERM → 请求中断 | 进程 | Round 225 | Round 227 | 1 | 🟢低风险 | memory/log-analysis-2026-02-27-1200.md |
| PAT-034 | [资源] 磁盘空间不足 → 81%→71% (14G 剩余) | 资源 | Round 226 | Round 230 | 1 | ✅✅稳定 | memory/log-analysis-2026-02-28-0000.md |
| PAT-035 | [资源] 内存紧张 → 375MB→838MB 可用 | 资源 | Round 226 | Round 230 | 1 | ✅✅已恢复 | memory/log-analysis-2026-02-28-0000.md |
| PAT-036 | [资源] Gateway 内存泄漏 → 1.8GB→1.4GB | 资源 | Round 228 | Round 230 | 1 | ✅已缓解 | memory/log-analysis-2026-02-28-0000.md |
| PAT-037 | [资源] CPU 负载波动 → 0.16-0.41 | 资源 | Round 228 | Round 230 | 1 | 🟢低风险 | memory/log-analysis-2026-02-28-0000.md |
| PAT-038 | [内存] Gateway 内存泄漏 → 175MB/h (已重启) | 内存 | Round 229 | Round 230 | 1 | ✅✅已解决 | memory/log-analysis-2026-02-28-0000.md |
| PAT-039 | [系统] 可用内存耗尽 → 已恢复至 838MB | 系统 | Round 229 | Round 230 | 1 | ✅✅已恢复 | memory/log-analysis-2026-02-28-0000.md |
| PAT-040 | [API] 429 速率限制 → 33 次 (12:00-16:00) | API | Round 230 | Round 230 | 33 | 🟡高风险 | memory/log-analysis-2026-02-28-0000.md |
| PAT-041 | [安全] SSH 扫描攻击 → 39 次 (5个攻击源) | 安全 | Round 230 | Round 230 | 39 | 🟡中风险 | memory/log-analysis-2026-02-28-0000.md |
| PAT-042 | [配置] Swap 未配置 → 无内存缓冲 | 配置 | Round 230 | Round 230 | 1 | 🟡中风险 | memory/log-analysis-2026-02-28-0000.md |
| PAT-043 | [连接] Gateway 超时 (10s) → 远程通信中断 | 连接 | Round 252 | Round 254 | 3→12 | 🔴高风险 | memory/log-analysis-2026-02-28-1200.md |
| PAT-044 | [任务] Task aborted → 任务被迫中止 | 任务 | Round 252 | Round 254 | 2→26 | 🔴高风险 | memory/log-analysis-2026-02-28-1200.md |
| PAT-045 | [代理] Unknown subagent target → 子代理管理失败 | 代理 | Round 252 | Round 254 | 2→26 | 🔴高风险 | memory/log-analysis-2026-02-28-1200.md |
| PAT-046 | [操作] Edit 匹配失败 → 文件编辑重试 | 操作 | Round 252 | Round 258 | 11→28 | 🔧有方案 | skills/smart-file-edit/SKILL.md |
| PAT-047 | [文件] ENOENT 路径错误 → 文件读取失败 | 文件 | Round 252 | Round 254 | 1→2 | 🟢低风险 | memory/log-analysis-2026-02-28-1200.md |
| PAT-048 | [API] 429 速率限制激增 → 196 次失败 | API | Round 254 | Round 259 | 76→178 | 🟡改善中 | skills/peak-hours-monitoring/SKILL.md |
| PAT-049 | [连接] Gateway 超时激增 → 22 次通信中断 | 连接 | Round 254 | Round 259 | 12→11 | ✅已改善 | memory/log-analysis-2026-03-01-0800.md |
| PAT-050 | [代理] Unknown subagent 激增 → 56 次管理失败 | 代理 | Round 254 | Round 258 | 26→56 | 🔧有方案 | skills/subagent-lifecycle-manager/SKILL.md |
| PAT-051 | [网络] Network error 激增 → 42 次 API 调用失败 | 网络 | Round 254 | Round 259 | 20→27 | 🔧有方案 | skills/network-error-monitor/SKILL.md |
| PAT-052 | [任务] Task aborted 激增 → 48 次任务中断 | 任务 | Round 254 | Round 257 | 26→48 | 🔴高风险 | memory/log-analysis-2026-03-01-0000.md |
| PAT-053 | [文件] EISDIR 错误 → 尝试读取目录 | 文件 | Round 254 | Round 257 | 1 | 🟢低风险 | memory/log-analysis-2026-03-01-0000.md |

> 活跃模式 53 个，**39 个已解决/有方案/改善中，14 个持续监控/高风险，系统健康评分 5.8/10（🟡 需要关注），26 Skills，23 修复脚本，系统基线配置已建立** 🟡

---

## Round 241 改进记录

**时间**: 2026-02-26 04:31
**重点**: API 余额监控体系建设

### 发现的问题

1. **PAT-025（新）**: API 余额耗尽危机
   - 影响：136+ 次 429 余额不足错误
   - 时段：03:40-04:50 高频触发
   - 系统健康评分：9.5 → 6.5（降至危险等级）
   - 影响：所有任务失败

2. **PAT-024**: 10:00 高峰期（104 次错误）
   - 状态：🔴🔴🔴 极高风险
   - 更新：添加详细应对策略

### 实施的改进

**A. 创建新 Skill**:
1. `skills/api-balance-monitor/SKILL.md`
   - API 余额监控策略
   - 三阶段预警机制（预警期/警戒期/危急期）
   - 自动降级策略
   - 余额检测方法
   - 通知机制
   - 恢复策略

**B. 改进现有 Skill**:
1. `skills/peak-hours-monitoring/SKILL.md`
   - 添加 10:00 最严重高峰期（104 次错误）
   - 更新高峰期时间表（5 个高峰期）
   - 优化应对策略

**C. 生成修复脚本**:
1. `evolver/fixes/api-balance-monitor.sh`
   - 自动检测余额不足风险
   - 生成预警报告
   - 提供降级建议

**D. 更新进化历史**:
1. 更新 PAT-025 状态：🔴极高风险 → ✅有方案
2. Pattern 解决率：20/26 → 21/26 (80.8%)

### 文件变更

**新建**:
- `skills/api-balance-monitor/SKILL.md`
- `evolver/fixes/api-balance-monitor.sh`
- `memory/evolution-2026-02-26-0431.md`

**修改**:
- `skills/peak-hours-monitoring/SKILL.md`
- `evolver_history/projects/openclaw/pattern-registry.md`

### 预期效果

- API 余额耗尽预警提前量 > 6 小时
- 自动降级成功率 > 90%
- 系统恢复时间 < 1 小时
- 10:00 高峰期准备充分

### 下一步

1. **紧急**: 充值 API 账户（智谱 AI GLM-5）
2. **监控**: 运行 api-balance-monitor.sh 脚本
3. **验证**: 充值后验证系统恢复
4. **优化**: 根据实际情况调整预警阈值

---

## Round 222 更新 (2026-02-26 16:00)

### 状态更新
- **PAT-025**: 429 错误增加至 870 次（+4.4%）
- **PAT-027**: aborted 错误减少至 7 次
- **系统健康评分**: 5.0/10（从 5.5 下降）

### 紧急行动
1. **充值 API 账户**（智谱 AI GLM-5）
2. 配置 Brave API Key
3. 减少 chaos-agent-001 频率

### 错误趋势
- 04:00 → 764 次
- 08:00 → 798 次 (+4.5%)
- 12:00 → 833 次 (+4.4%)
- 16:00 → 870 次 (+4.4%)
- **24h 累计增长**: +28%

---

## Round 223 更新 (2026-02-26 20:00)

### 新增模式

| ID | 指纹描述 | 类型 | 首现 | 末现 | 次数 | 状态 |
|----|----------|------|------|------|------|------|
| PAT-028 | [网络] Request aborted + network_error → 任务中断 | 网络 | Round 223 | Round 223 | 12 | 🔴极高风险 |

### 状态更新
- **PAT-025**: 429 错误增加至 913 次（+4.9%，增长率加速）
- **PAT-027**: aborted 错误减少至 7 次
- **PAT-028**: 新增网络错误模式（12 次）
- **系统健康评分**: 4.5/10（从 5.0 下降）

### 关键发现
1. **429 错误增长率加速**: 4.4% → 4.9%
2. **模型过载激增**: +130%（从 10 次增至 23 次）
3. **网络不稳定**: 新增网络错误模式
4. **exec 占比超 50%**: 工具调用模式变化

### 紧急行动
1. **充值 API 账户**（智谱 AI GLM-5）- 最紧急
2. 调查网络错误根因
3. 减少 chaos-agent-001 频率（27.5/h → 15/h）

### 错误趋势
- 04:00 → 764 次
- 08:00 → 798 次 (+4.5%)
- 12:00 → 833 次 (+4.4%)
- 16:00 → 870 次 (+4.4%)
- 20:00 → 913 次 (+4.9%) ⬅️ 增长率加速
- **24h 累计增长**: +19.5%

### 预测
如果不充值：
- **00:00**: ~958 次 (+4.9%)
- **04:00**: ~1005 次 (+4.9%)
- **48h 累计增长**: ~+31.5%

---

## Round 224 更新 (2026-02-27 00:00)

### 状态更新
- **PAT-025**: 429 错误增加至 935 次（+2.4%，增长率下降）
- **PAT-028**: 网络错误恶化至 17 次（+41.7%）
- **系统健康评分**: 4.8/10（从 4.5 上升）

### 正面信号
1. **429 错误增长率下降**: 4.9% → 2.4%
2. **工具调用 100% 稳定**: isError=true = 0
3. **深夜时段自我调节**: 系统可能受益于低流量时段

### 429 错误趋势分析
```
04:00 → 764 次 (基准)
08:00 → 798 次 (+4.5%)
12:00 → 833 次 (+4.4%)
16:00 → 870 次 (+4.4%)
20:00 → 913 次 (+4.9%)
00:00 → 935 次 (+2.4%) ⬅️ 增长率下降 ✅
```

### 紧急行动
1. **充值 API 账户**（智谱 AI GLM-5）- 最紧急
2. 调查网络错误恶化原因
3. 利用深夜时段进行系统维护

### 预测
如果充值：
- **充值后 4h**: ~50 次（-95%）
- **充值后 8h**: ~10 次（-99%）
