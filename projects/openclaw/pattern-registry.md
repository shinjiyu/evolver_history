# 模式注册表（活跃）

> 已归档模式见 archive/patterns-archived.md

| ID | 指纹描述 | 类型 | 首现 | 末现 | 次数 | 状态 | 关联文件 |
|----|----------|------|------|------|------|------|----------|
| PAT-001 | [流程] 创建定时任务 + 安装进化 skill → 自动化自我改进 | 流程 | Round 002 | Round 004 | 3 | 活跃 | rounds/round-002-2026-02-21-1737.md |
| PAT-002 | [技术] 分析现有架构 + 设计多用户父子实例 → 系统扩展规划 | 技术 | Round 003 | Round 004 | 2 | 活跃 | rounds/round-003-2026-02-21-1800.md |
| PAT-003 | [技术] 429 错误 + 多任务失败 → API 余额耗尽 | 错误 | Round 004 | Round 187 | 99+ | 持续 | rounds/round-004-2026-02-21-2232.md |
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
| PAT-018 | [调度] API 高峰期 (07:00-09:00) + 多任务并发 → 429 集中爆发 | 调度 | Round 187 | Round 195 | 91 | ✅已解决 | skills/peak-hours-monitoring/SKILL.md |
| PAT-019 | [配置] Git remote 指向错误仓库 → 进化历史同步失败 | 配置 | Round 188 | Round 188 | 1 | ✅已解决 | memory/evolution-2026-02-25-0405.md |

| PAT-020 | [流程] 高峰期监控经验固化 → 预防性监控策略 | 流程 | Round 189 | Round 189 | 1 | ✅已解决 | skills/peak-hours-monitoring/SKILL.md |

> 活跃模式 20 个，**12 个已解决/恢复，8 个持续监控，系统健康评分 9/10（08:00 关键时段 0 错误），18 Skills，高峰期监控机制已建立** ✅
