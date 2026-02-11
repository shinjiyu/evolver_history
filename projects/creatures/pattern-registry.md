# 模式注册表（活跃）— creatures

> 已归档模式见 archive/patterns-archived.md

## skill-miner 缺陷（归纳1 发现）

| ID | 指纹描述 | 类型 | 首现 | 末现 | 次数 | 状态 | 关联文件 |
|----|----------|------|------|------|------|------|----------|
| PAT-creatures-001 | [协作] subagent 声称修改文件但编辑未持久化 → 实施报告与实际不一致 | 错误预防 | self-R001 | self-R001 | 1 | 已缓释 | skill-miner.md, skill-mining/SKILL.md |
| PAT-creatures-002 | [输出质量] 增量更新时未处理既有结构问题（如重复 frontmatter） | 错误预防 | self-R001 | self-R001 | 1 | 已缓释 | skill-miner-enhanced.md, skill-mining/SKILL.md |
| PAT-creatures-003 | [协作] 并行 skill-miner 未统一轮次/实例编号 → manifest 需人工修正 | 错误预防 | self-R001 | self-R001 | 1 | 已缓释 | evolution-history/SKILL.md, skill-mining/SKILL.md |
| PAT-creatures-004 | [协作] 多实例并行写入共享注册表 → 需事后人工校验一致性 | 错误预防 | self-R001 | self-R001 | 1 | 已缓释 | evolution-history/SKILL.md |
| PAT-creatures-005 | [协作] 多实例分工时改进主题编号非连续 → 易被误读为漏项 | 优化 | self-R001 | self-R001 | 1 | 已缓释 | skill-mining/SKILL.md |
| PAT-creatures-006 | [输出质量] 实施报告未区分计划与已确认落地 | 优化 | self-R001 | self-R001 | 1 | 已缓释 | skill-mining/SKILL.md |

## log-analyzer 缺陷（归纳2 发现）

| ID | 指纹描述 | 类型 | 首现 | 末现 | 次数 | 状态 | 关联文件 |
|----|----------|------|------|------|------|------|----------|
| PAT-creatures-007 | [输出质量] 归纳报告概要表指标与实际问题条目数不匹配 | 错误预防 | self-R001 | self-R001 | 1 | 已缓释 | log-analysis/SKILL.md |
| PAT-creatures-008 | [输出质量] 证据引用缺少行号 → 无法快速定位验证 | 错误预防 | self-R001 | self-R001 | 1 | 已缓释 | log-analyzer-enhanced.md, log-analysis/SKILL.md |
| PAT-creatures-009 | [行为] 多实例归纳产出文件名不一致 → 主流程需额外发现步骤 | 错误预防 | self-R001 | self-R001 | 1 | 已缓释 | log-analysis/SKILL.md |
| PAT-creatures-010 | [协作] 多实例归纳重复发现未去重 → 下游 skill-miner 需额外整合 | 错误预防 | self-R001 | self-R001 | 1 | 已缓释 | log-analysis/SKILL.md |
| PAT-creatures-011 | [输出质量] 归纳报告模式指纹格式不统一 | 错误预防 | self-R001 | self-R001 | 1 | 已缓释 | log-analysis/SKILL.md |
