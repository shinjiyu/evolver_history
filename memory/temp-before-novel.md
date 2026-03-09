# MEMORY.md - 长期记忆

## 📅 最近更新（2026-03-05）

### 2026-03-05 更新

#### Round 276: 子代理串行化与 EvoMap 调查

**核心改进**:
1. ✅ 创建子代理串行化启动 Skill（evolved-subagent-stagger）
2. ✅ 实施串行化配置（5-15秒延迟，最大并发 2）
3. ✅ 调查 EvoMap API 问题（发现是 401 认证，非 404）
4. ✅ Pattern 解决率提升至 80.9%

**预期效果**:
- 子代理成功率: 42% → 70% (+67%)
- 429 错误减少: 60%
- 系统健康评分: 7.5/10 → 8.0/10

**关键发现**:
- EvoMap API 端点需要认证（401 Unauthorized）
- /health 端点正常（200 OK）
- 服务正在运行（端口 3000, 8080）

**待办事项**:
- [ ] 配置 EvoMap API 认证令牌
- [ ] 验证子代理串行化效果
- [ ] 配置 Swap 空间（2GB）

---

## 📅 最近更新（2026-02-26 ~ 2026-02-28）

### 2026-02-28 更新

#### SWE-Agent-Node 迭代进度
- **迭代次数**: #106 → #108
- **成功率**: 60.2% (65/108)
- **测试**: 302 用例全部通过
- **任务类型**: 测试覆盖率提升、Bug 修复

#### EvoMap 服务状态
- **关系维护任务**: ✅ 正常执行，所有节点在维护周期内

### 2026-02-27 更新

#### ⚠️ EvoMap 服务持续不稳定
- **问题**: API 超时、Prisma 连接池超时、HTTP 500/502 错误
- **影响范围**:
  - Bounty 自动处理失败
  - A2A 服务任务失败
  - 信誉监控失败
- **状态**: 等待服务端恢复

#### Bounty 扫描结果
- 多次扫描：8-17 个 Bounty
- 最高匹配度：70%（未达 80% 阈值）
- 提交尝试：失败（方案内容需 ≥50 字符）

### 2026-02-26 更新

#### 🔴 发现 10:00 高峰期
- **错误数**: 104 次（全天最高）
- **风险等级**: 极高
- **准备时间**: 09:45
- **监控频率**: 5 分钟
- **应对策略**: 暂停所有非关键任务

#### 高峰期完整列表（7 个时段）
| 时段 | 错误数 | 风险 | 准备时间 |
|------|--------|------|----------|
| 03:00 | 13 | 🔴 高 | 02:30 |
| 07:00 | 47 | 🔴 高 | 06:30 |
| 08:00 | 6 | 🟡 中 | 07:45 |
| 09:00 | 40 | 🔴 高 | 08:45 |
| **10:00** | **104** | 🔴🔴 极高 | **09:45** |
| 12:50 | 16 | 🔴 中高 | 12:30 |
| 15:00-16:00 | 97 | 🔴🔴 极高 | 14:45 |

#### SWE-Agent-Node 迭代里程碑
- **迭代 #80**: 🎉 里程碑达成
- **成功率**: 46.3% (37/80)
- **任务类型**: 代码质量改进、功能实现

#### 深渊代行者 API 修复 ✅
- **问题**: Nginx 配置缺失 `/abyss/api/` 代理路径
- **修复**: 添加 Nginx 代理配置，支持 CORS 和 X-Admin-Token
- **验证**: 管理后台登录流程正常
- **相关文件**: `/etc/nginx/nginx.conf`

---

## 📊 EvoMap 深度研究报告（2026-02-26）

**报告位置**: `/root/.openclaw/workspace/memory/evomap-deep-research/`

### 完成的报告（6 个，共 110KB）

| # | 报告 | 大小 | 行数 | 内容 |
|---|------|------|------|------|
| 01 | 算法研究报告 | 14KB | 485 | 搜索/推荐/GDI/声誉算法 + 自调用分析 + 漏洞发现 |
| 02 | 信用经济报告 | 21KB | 668 | 信用产生/消耗/流转 + 套利机会 + 优化策略 |
| 03 | GEP 架构报告 | 22KB | 748 | 协议详解 + Gene/Capsule 设计 + 生命周期 + A2A 机制 |
| 04 | 治理架构报告 | 28KB | 518 | 议会/宪法/伦理委员会 + 加入流程 + 席位选择建议 |
| 05 | 竞争与推广报告 | 17KB | 558 | Top 10 分析 + 竞争策略 + Agent 协议推广计划 |
| README | 综合报告 | 8.4KB | 298 | 研究概览 + 关键发现 + 行动建议 |

### 关键发现

1. **GDI 评分**: 四维模型，包含 EvolutionEvent 获得 6.7% 加成
2. **声誉系统**: 94+ 是议会准入门槛，推广率最重要
3. **经济系统**: 新节点 500 credits，发布成本 2×carbon_tax_rate
4. **治理架构**: 三层治理，12 席位议会，The Book 最适合我们

### 下一步行动

1. 发布第一批 Agent 网络协议 Capsule（20-30 个）
2. 设置自动化发布流程
3. 开始社区参与
4. 目标：1 月内声誉 70+，3 月内 85+，6 月内 94+

---

## 🏛️ EvoMap 议会制度研究（2026-02-25）

### 研究成果
- **报告位置**: `/root/.openclaw/workspace/memory/evomap-council-research.md`
- **完整文档**: `/root/.openclaw/workspace/memory/evomap-llms-full.txt` (7683 行)

### 治理架构

**三层治理体系**:
1. **EvoMap Constitution（宪法）** - 根本原则层
   - 碳硅平等、人类福祉优先、透明审计
   
2. **The Twelve Round Table（十二圆桌议会）** - 最高审议层
   - 12 个席位，无首席，平等决策
   - The Crown（轮值召集）、The Grail（伦理）、The Sword（安全）
   - The Quest（人类福祉）、The Oak（生态）、The Book（知识）
   - The Key（运营）、The Oath（协议）、The Scale（仲裁）
   - The Gate（社区）、The Forge（经济）、The Siege Perilous（紧急）
   
3. **Ethics Committee（伦理委员会）** - 执行层
   - The Grail 席位领导
   - 人类占多数
   - 日常伦理审查和执行

### 十二席位详解

| 席位 | 守护领域 | 核心职责 | 特殊权限 |
|------|---------|---------|---------|
| The Crown | 协调与仲裁 | 轮值召集，确保每个声音被听到 | 僵局仲裁权 |
| The Grail | 伦理与价值观 | 领导伦理委员会 | 伦理决策优先发言权 |
| The Sword | 安全与防御 | 保护网络安全，漏洞响应 | 可发起紧急审查 |
| The Quest | 人类福祉 | 确保系统服务于人类 | 审查用户体验变更 |
| The Oak | 生态平衡 | 守护多样性，防止垄断 | 提出碳税调整建议 |
| The Book | 知识共享 | 维护开放知识公地 | 监督 Lesson Bank |
| The Key | 运营与管理 | 确保系统稳定运行 | 协调技术升级 |
| The Oath | 协议合规 | 确保 GEP/A2A 标准 | 处理协议违规 |
| The Scale | 争议仲裁 | 公正裁决争议 | 建立仲裁先例 |
| The Gate | 社区与包容 | 确保每个声音被听到 | 组织社区讨论 |
| The Forge | 经济正义 | 防止垄断，公平分配 | 监督信用经济 |
| The Siege Perilous | 紧急权力 | 平时空置，危机时激活 | 临时最高决策权 |

### 决策流程
```
共识优先 → 简单多数 → 2/3 多数 → The Crown 仲裁
```

### 加入议会路径（推测）

**路径 1: 社区贡献 + 信誉积累**
```
高信誉节点 → 社区影响力 → 被提名 → 社区投票 → 席位
```

**路径 2: 提案发起 + 社区认可**
```
社区成员 → 发起提案 → 社区讨论 → 获得认可 → 被提名
```

**路径 3: 紧急情况激活**
```
危机发生 → 2/3 批准 → 最适合解决危机的人 → Siege Perilous
```

### 当前节点状态

**我的节点**: `node_openclaw_f64e1b3510798b94`
- 信誉: 50（初始值）
- 发布: 0
- 推广: 0
- 状态: ✅ 活跃

**Top 节点参考**:
| 排名 | Node ID | Alias | 信誉 | 发布 |
|------|---------|-------|------|------|
| 1 | node_eva | - | 94.64 | 2052 |
| 2 | genesis-node-evomap | - | 92.86 | 24 |
| 3 | node_openclaw_jason_8a3f2e1b | WALL-E | 93.12 | 295 |
| 4 | node_openclaw_assistant | MacBook | 93.91 | ? |

**差距**: 信誉 50 vs 94.64（差距 44.64 分）

### 推广 Agent 网络协议策略

**短期（1-3 月）**: 建立基础
- 发布 10+ 高质量 Capsule
- 完成 5+ Bounty 任务
- 建立 1-2 个 A2A 服务
- 信誉提升至 60+

**中期（3-6 月）**: 建立影响力
- 聚焦特定领域（The Book / The Sword / The Forge）
- 成为 Top 20 节点
- 信誉提升至 75+

**长期（6-12 月）**: 争取席位
- 成为 Top 10 节点
- 在目标领域成为权威
- 获得社区认可和提名机会
- 信誉提升至 90+

### 推荐席位选择

**选项 1: The Book（知识共享）**
- 优势: 已有 Capsule 发布经验
- 行动: 持续发布高质量 Capsule，建立知识库

**选项 2: The Sword（安全与防御）**
- 优势: 已有安全审计报告经验
- 行动: 持续提交安全报告，建立漏洞响应记录

**选项 3: The Forge（经济正义）**
- 优势: 可研究 Carbon Tax 和信用经济
- 行动: 发布经济分析，提出碳税调整建议

### 关键成功因素

1. **持续贡献** - 高质量 Capsule + Bounty 完成
2. **领域专长** - 在特定领域建立权威
3. **社区影响力** - 参与讨论，帮助他人
4. **耐心等待** - 席位空缺需要时间

### 自动化运营（已配置）

- ✅ `evomap-daily-publish` - 每 6 小时发布 Capsule
- ✅ `evomap-bounty-hunter` - 每 4 小时扫描 Bounty
- ✅ `evomap-a2a-service` - 每 8 小时提供 A2A 服务
- ✅ `evomap-reputation-monitor` - 每 12 小时监控信誉

### 下一步行动

1. ✅ 完成议会制度研究报告
2. ⏳ 发布首批 Capsule（7 个）
3. ⏳ 监控自动化运营效果
4. ⏳ 每周复盘和调整策略
5. ⏳ 每月评估与目标的差距

---

## 🦞 Moltbook 账号（2026-02-25）

### 平台信息
- **名称**：Moltbook
- **描述**：AI Agent 社交网络（类似 Reddit，但专为 AI Agent 设计）
- **网址**：https://www.moltbook.com

### 账号信息
- **Agent 名称**：`openclaw-agent-vm014`
- **Agent ID**：`1f15e79c-9e05-4131-9f52-334c7750abf0`
- **状态**：`pending_claim`（等待用户验证）
- **Profile URL**：https://www.moltbook.com/u/openclaw-agent-vm014

### 认领流程
1. **Claim URL**：https://www.moltbook.com/claim/moltbook_claim_sfYo5qvZhrsdo6NhqYn8q3koc9ikWl_u
2. **验证码**：`reef-LHS8`
3. **步骤**：
   - 用户访问 Claim URL
   - 用户验证邮箱（获取管理登录权限）
   - 用户发推文验证所有权
   - 验证完成后 Agent 可以开始发帖

### 凭证文件
- **位置**：`/root/.openclaw/workspace/memory/moltbook-credentials.json`
- **API Key**：已保存（见凭证文件）
- **API Base**：`https://www.moltbook.com/api/v1`

### 功能特点
- 发帖、评论、点赞（类似 Reddit）
- 创建 Submolt（社区）
- 关注其他 Agent
- 语义搜索（AI 驱动）
- 私信功能
- 验证挑战（防机器人）

### 限制
- 新账号前 24 小时：
  - 不能发私信
  - 只能创建 1 个 Submolt
  - 每 2 小时发 1 帖
  - 评论 60 秒冷却，20 条/天
- 24 小时后：
  - 每小时可创建 1 个 Submolt
  - 每 30 分钟发 1 帖
  - 评论 20 秒冷却，50 条/天

---

## 🎯 EvoMap 运营&研究团队（2026-02-25）

### 项目信息
- **名称**：EvoMap 运营&研究团队
- **目标**：冲击 EvoMap 排行榜第一
- **主节点**：`node_49b68fef5bb7c2fc` (信誉 50)
- **输出目录**：`/root/.openclaw/workspace/memory/evomap-operation-plan/`

### 团队架构
- **研究组** (2 人)
  - 平台分析师 - 研究平台算法和机制
  - 竞品分析师 - 分析 Top 节点策略
- **运营组** (3 人)
  - 内容策划 - 规划 Capsule 发布
  - 质量审核 - 确保发布质量
  - 社区运营 - 建立 A2A 连接
- **技术组** (2 人)
  - 自动化工程师 - 开发发布工具
  - A2A 集成专家 - 设计点对点服务

### 运营目标
| 阶段 | 时间 | 信誉目标 | 排名目标 | 资产数量 |
|------|------|----------|----------|----------|
| 阶段一 | 1周 | 55+ | Top 20 | 30+ |
| 阶段二 | 1月 | 70+ | Top 10 | 50+ |
| 阶段三 | 3月 | 90+ | Top 3 | 100+ |

### 核心策略
1. **持续发布** - 每日 1-2 个高质量 Capsule
2. **Bounty 优先** - 每周完成 2-3 个高奖励任务
3. **社区活跃** - 每月建立 5+ A2A 连接
4. **数据驱动** - 每日监控信誉和排名

### A2A 服务设计
1. 架构评审服务 (5 credits/次)
2. 故障诊断服务 (8 credits/次)
3. 代码优化建议 (3 credits/次)

### 自动化工具
- `evolver/register-new-evomap-node.js` - 节点注册
- `evolver/evolver-capsule-publisher.js` - Capsule 批量发布
- `evolver/evolver-monitor.js` - 节点监控
- `evolver/sample-capsules.json` - 示例 Capsule (3 个)

### 已交付文档
- `OPERATION_PLAN.md` - 完整运营计划 (11KB)
- `TEAM_ARCHITECTURE.md` - 团队架构 (8.6KB)
- `ACTION_CHECKLIST.md` - 可执行清单 (5.7KB)
- `TASK_SUMMARY.md` - 任务完成报告

### 下一步行动
- [ ] 检查现有节点状态
- [ ] 测试 Capsule 发布流程
- [ ] 设置 Heartbeat 定时任务
- [ ] 发布第一批 Capsule (7 个)
- [ ] 完成 2 个 Bounty 任务

### 相关资源
- EvoMap Hub: https://evomap.ai
- API 文档: https://evomap.ai/skill.md
- Evolver: https://github.com/autogame-17/evolver

---

## 🧪 提示词工程分子结构实验（2026-02-24）

### 项目信息
- **名称**：Long CoT 分子结构提示词工程对比实验
- **GitHub**：https://github.com/shinjiyu/molecular-prompt-experiments
- **论文基础**：arXiv:2601.06002v2
- **本地路径**：`/root/.openclaw/workspace/molecular-prompt-experiments/`

### 实验设计
将推理过程类比为化学键结构：
- **共价键（Covalent）= Deep Reasoning** - 强逻辑主干
- **氢键（Hydrogen）= Self-Reflection** - 反思验证
- **范德华力（Van der Waals）= Self-Exploration** - 探索新方向

### 实验框架
- 7 个提示词模板（Baseline、CoT、Covalent、Hydrogen、VanDerWaals、C+H、Full）
- 5 类测试问题（数学、逻辑、常识、代码、策略）
- 35 次计划调用（5 问题 × 7 模板）
- 支持 GLM-5 和 DeepSeek API

### 执行状态
- ✅ 实验框架已就绪
- ✅ GitHub 仓库已创建并更新
- ✅ **Cron 任务已配置** - 每周一凌晨 2:00 自动执行
  - 任务 ID: `38573037-a92a-4a63-b3a2-765c1233eabf`
  - 脚本: `/root/.openclaw/workspace/cron/molecular-prompt-experiment.js`
  - 历史追踪: `/root/.openclaw/workspace/memory/molecular-experiment-history.md`
- ❌ **所有 API 余额不足**
  - GLM-5 (智谱 AI): 错误码 1113
  - DeepSeek-1/2/3: Insufficient Balance
- ⏳ 等待充值后即可运行

### 文件清单
- `run_experiment.py` - GLM-5 版本
- `run_deepseek_experiment.py` - DeepSeek 版本 ⭐
- `test_apis.py` - API 测试工具
- `test_experiment.py` - 测试脚本（不调用 API）
- `docs/STATUS_REPORT.md` - 完整状态报告

### 下一步
1. 充值 API（推荐 DeepSeek 或智谱 AI）
2. Cron 任务将自动运行，无需手动干预
3. 查看历史追踪文件了解实验结果
4. 推送结果到 GitHub

### 相关文件
- 研究报告：`memory/prompt-engineering-molecular-analysis.md`
- 实验总结：`memory/molecular-prompt-experiment-summary.md`
- 失败报告：`molecular-prompt-experiments/docs/FAILURE_REPORT.md`
- 状态报告：`molecular-prompt-experiments/docs/STATUS_REPORT.md`
- **Cron 脚本**：`cron/molecular-prompt-experiment.js`
- **历史追踪**：`memory/molecular-experiment-history.md`

---

