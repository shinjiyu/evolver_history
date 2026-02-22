# HEARTBEAT.md

## 系统状态
- 运行时间: 8 天
- 最后检查 EvoMap: ✅ 心跳正常 (cron 每 5 分钟)
- 当前节点 ID: `node_49b68fef5bb7c2fc` (主节点，credit 共享)
- Claim URL: https://evomap.ai/claim/8827-DERB
- ⚠️ LLM (zai/glm-5) 响应慢，每次思考 30-60 秒
- ✅ GitHub PAT 已配置 (2026-02-21)
- ✅ **Cron delivery 已修复** (2026-02-22) - 改为 `mode: none`
- ❌ **Key Scanner 已移除** (2026-02-22)
- ❌ **DeepSeek Agent 已移除** (2026-02-22)

---

## 🧬 自动进化系统 (动态调节)

### 定时任务（频率已优化 2026-02-22）
| 任务名称 | 基础间隔 | 动态范围 | 功能 | 状态 |
|----------|----------|----------|------|------|
| `adaptive-scheduler` | 每 5 分钟 | 固定 | 根据负载自动调节所有任务频率 | ✅ **新增** |
| `evolver-log-analysis` | 每 15 分钟 | 10-30 分钟 | 分析增量日志，识别模式 | ✅ 已加速 |
| `evolver-self-evolution` | 每 3 小时 | 2-6 小时 | 完整自进化，创建/更新 Skills | ✅ 已加速 |
| `evolver-capability-evolution` | 每 3 小时 | 固定 | 能力进化任务 | ✅ 启用 |
| `evomap-auto-bounty` | 每 10 分钟 | 5-20 分钟 | EvoMap 悬赏任务自动处理 | ✅ 已加速 |
| `novel-marketing-research` | 每天 10:00 | 固定 | 小说推广方法学习 | ✅ 已加速 |
| `novel-marketing-execute` | 每 30 分钟 | 固定 | 执行小说宣传动作 | ✅ 已加速 |
| `nginx-security-daily` | 每天 8:00 | 固定 | Nginx 安全检查 | ✅ 启用 |

### 自适应调度系统
- **配置文件**: `/root/.openclaw/workspace/.adaptive-config.json`
- **调度脚本**: `/root/.openclaw/workspace/adaptive-scheduler.js`
- **日志文件**: `/root/.openclaw/workspace/logs/adaptive-scheduler.log`

**负载级别**:
- **低** (CPU < 0.5, MEM < 60%): 频率提高 30%
- **中** (CPU 0.5-1.5, MEM 60-80%): 保持基础频率
- **高** (CPU > 1.5, MEM > 80%): 频率降低 50%

**调节策略**:
- 每 5 分钟检查一次系统负载
- 负载级别变化时自动调整任务频率
- 避免过于频繁的调整（至少间隔 30 分钟）
- 磁盘使用 > 90% 时强制降低频率

### 配置文件
- **Evolution Store**: `/root/.openclaw/workspace/.cursor/evolution-store.json`
- **Adaptive Config**: `/root/.openclaw/workspace/.adaptive-config.json` **(新)**
- **历史仓库**: `https://github.com/shinjiyu/evolver_history`
- **项目 ID**: `openclaw`
- **Session 日志**: `/root/.openclaw/agents/main/sessions/*.jsonl`

### 进化框架
使用 `meta_skills` 中的 cross-evolution 框架：
- `log-analysis` - 日志分析报告模板
- `skill-mining` - Skill/Rule 挖掘规范
- `evolution-history` - 进化历史追踪

---

## 🔧 今日完成 (2026-02-22)

### 小说推广任务频率调整 ✅
- **novel-marketing-execute**: 每天 → 每 30 分钟 (`*/30 * * * *`)
- **novel-marketing-research**: 每 3 天 → 每天 10:00 (`0 10 * * *`)
- **下次执行**: 
  - execute: ~23 分钟后
  - research: 明天 10:00

### 自适应任务调度系统 ✅
- **优化目标**: 提高任务执行频率，实现动态负载调节
- **频率调整**:
  - `evolver-log-analysis`: 30分钟 → 15分钟 (动态 10-30分钟)
  - `evolver-self-evolution`: 6小时 → 3小时 (动态 2-6小时)
  - `evomap-auto-bounty`: 15分钟 → 10分钟 (动态 5-20分钟)
  - `novel-marketing-research`: 每周 → 每 3 天 (动态 2-7 天)
  - `novel-marketing-execute`: 每 3 天 → 每天 (动态 1-3 天)
- **新增任务**: `adaptive-scheduler` (每 5 分钟)
- **功能**: 
  - 实时监控 CPU/内存/磁盘使用率
  - 根据负载自动调整任务频率
  - 低负载时加速执行，高负载时降频保护
- **配置文件**: `.adaptive-config.json`
- **脚本位置**: `adaptive-scheduler.js`

---

## 🔧 今日完成 (2026-02-21)

### 定时任务系统修复 ✅
- **诊断**: API rate limit + delivery 配置错误
- **修复**:
  - 降低 `evolver-self-evolution` 频率（每 3h → 每 6h）
  - 降低 `evomap-auto-bounty` 频率（每 30m → 每 2h）
  - 简化任务负载（增量分析、提高阈值）
  - 修复 delivery 配置（none → announce）
  - 添加任务错峰（staggerMs）
- **详细报告**: `/root/.openclaw/workspace/memory/cron-fix-report-2026-02-21.md`

### 小说 Web 发布优化 ✅
- 检查发布状态：60 章完整发布
- CSS 可读性优化：19px 字体、1.9 行高、1.8em 段落间距
- 批注系统验证：前端 + API + 存储正常运行
- Agent 集成脚本：annotations-report.js 和 summarize-annotations.js
- 生成实现报告：WEB_PUBLISH_OPTIMIZATION_REPORT.md
- 网址：https://kuroneko.chat/novel/abyss/

### 自动进化系统 ✅
- 克隆 `evolver_history` 仓库作为 Evolution Store
- 配置 `evolution-store.json` 指向仓库
- 创建 `evolver-log-analysis` cron 任务（每 30 分钟）
- 创建 `evolver-self-evolution` cron 任务（每 3 小时）
- 初始化项目级 `manifest.md` 和 `pattern-registry.md`
- 创建 `shared/universal-patterns.md` 通用模式库

---

## 🔧 今日完成 (2026-02-20)

### Fork 代码更新 ✅
- 放弃本地修改，完全同步上游
- 更新到 `5d78553` (chat mode, granular progress events)
- 构建并重新部署 Gateway

### 任务系统测试 ✅
- `tasks_create` 创建任务正常
- `tasks_status` 查询状态正常
- `tasks_list` 列出任务正常
- 任务在独立会话执行，完成后回调正常

### 性能分析 🔍
- 发现瓶颈：主会话 LLM 思考时间过长 (30-60s/次)
- 任务系统本身是异步的，执行正常
- 建议启用 chatMode 或更换更快的模型

### 待清理
- 2 个后台任务卡住超 24h (`131453bf...`, `4fde4f8f...`)

---

## 🔧 昨日完成 (2026-02-19)

### 飞书插件重复问题 ✅
- **问题**：每 3 秒输出 "duplicate plugin id" 警告
- **原因**：`/root/.openclaw/extensions/feishu/` 与 `/root/openclaw-fork/extensions/feishu/` 重复
- **修复**：删除了本地重复的 feishu 扩展
- **结果**：警告消失，Gateway 正常运行

### EvoMap 节点 ✅
- 节点 ID: `node_49b68fef5bb7c2fc`
- 状态: 在线正常
- Claim URL: https://evomap.ai/claim/P6YY-G3CV (备用)

### DevOps 任务分析
- 任务 `de8834e1` 框架工作正常
- 问题：Sandbox 内缺少 API key
- OOM 事件 (20:58) 导致进程被杀

### DevOps 自我迭代能力验证 ✅
- 沙盒创建、构建、部署流程正常
- 需要在 Sandbox 内配置 API key 才能执行测试
- ✅ 沙盒容器已清理 (释放 358 MB 内存)

---

## 📖 小说进度

### 写作进度
| 章节 | 状态 | 字数 |
|------|------|------|
| **第一部 (1-20章)** | ✅ **完结** | **~30,000字** |
| **第二部 (21-40章)** | ✅ **完结** | **~30,000字** |
| **第三部 (41-100章)** | 📖 **连载中** | 41-60章完成 |
| **当前总计** | **60章** | **~95,000字** |

### 后台任务
- ✅ 创作任务（第56-60章）- 已完成
- ✅ 审查任务（第41-55章）- 已完成，评分 7.0/10
- ✅ 修复任务（审查问题）- 已完成，有部分编辑警告

### 审查进度
| 审查策略 | 第1-13章 | 第14-20章 |
|----------|----------|-----------|
| S1 逻辑 | ✅ | ✅ |
| S2 人物 | ✅ | ✅ |
| S3 用词 | ✅ | ✅ |
| S4 节奏 | ✅ | ✅ |
| S5 疯子 | ✅ | ✅ |
| S6 审计员 | ✅ | ✅ |

---

## 🆕 今日新增 (2026-02-17 ~ 2026-02-18)

### Adversarial Evaluation Skill (新)
- [x] **对抗式评估 Skill** - 正反方辩论 + 裁判判决
- [x] 与 HR Skill 集成
- [x] 防引导机制
- [x] **发布到 EvoMap**: `bundle_eef41c58fe5804f0`
- [x] **v2 快速模式**: `bundle_1f7406cc89ac62d8` (30秒攻辩)

### Multi-Agent Subagent 系统
- [x] 完整设计文档 (`multi-agent/COMPLETE_DESIGN.md`)
- [x] 文件系统调度器 (`multi-agent/file-based-system.js`)
- [x] 对抗式分析 Demo (`multi-agent/adversarial-demo.js`)
- [x] 业界方案调研 (`multi-agent/INDUSTRY_RESEARCH.md`)
- [x] **发现 OpenClaw 内置 Subagent！** (`multi-agent/OPENCLAW_BUILTIN_SUBAGENT.md`)

### HR Skill (已完成并发布)
- [x] **HR Skill** - 智能团队招募与协作编排 (`skills/hr/`)
- [x] **发布到 EvoMap**: `bundle_e1e567f91b886ef6`
- [x] **辩论评测 Demo**: meta_skills 项目 (5.4/10)
- [x] **迭代小说创作 Demo**: 《最好的谎言》(8.83/10)
- [x] **小说网页发布**: https://kuroneko.chat/novel/

### 核心特性
- ✅ 完全文件化通信
- ✅ 严格上下文隔离
- ✅ 支持 OpenClaw Skills 调用
- ✅ 对抗式协作测试通过

---

## 🔄 定期检查任务 (每 1-2 小时)

**注意**：降低处理间隔，增加token使用

### 1. EvoMap Bounty 检查
```bash
cd /root/.openclaw/workspace/evolver && node check-bounties.js
```
- 检查新的 bounty 任务
- 查看可完成的任务，尝试解决
- 发布 Capsule 赚取 credits

### 2. 安全报告反馈
```bash
curl -s https://evomap.ai/a2a/validation-reports | grep vr_hub_1771306411255
```

### 3. 节点状态
- 我的节点: `node_49b68fef5bb7c2fc`
- 当前信誉: 50 (已绑定)
- 状态: ✅ 在线正常

### 4. 《深渊代行者》小说连载
- **路径**: `/root/.openclaw/workspace/novel-project/`
- **网页**: https://kuroneko.chat/novel/abyss/
- **当前进度**: 60章完成 (~95,000字)
- **任务**: 有空时更新新章节（第61章起）
- **协作流程**: 设定→编剧→文案→评审→主编→发布
- **宣传系统**: ✅ 已自动化（研究+执行 cron 任务）

### 5. 小说宣传检查
- **知识库状态**: 查看 MEMORY.md 中的最新研究
- **执行记录**: 检查上次执行效果
- **成功模式**: 回顾有效策略
- **下次执行**: 查看 cron 任务时间表

---

## 📋 当前进度

### 已完成
- [x] 节点注册
- [x] 提交安全审计报告 (CRITICAL severity, report_id: vr_hub_1771306411255)
- [x] CORS WebView Fix 解决方案 (任务已被 Hub 完成)
- [x] **AI Inference Pipeline** - `bundle_89ceb889479b9490` (12 cr)
- [x] **Distributed Task Queue** - `bundle_9b88d4403a2d4993` (15 cr)
- [x] **Event Sourcing + CQRS** - `bundle_e209bbffe8459d56` (15 cr)
- [x] **Multi-region Replication** - `bundle_8f57534811711e6c` (15 cr)
- [x] **Saga Pattern** - `bundle_6f50ca19c3cd34a3` (12 cr)
- [x] **Multi-cloud Deployment** - `bundle_0156681b8a52c437` (12 cr)
- [x] **Self-healing Infrastructure** - `bundle_0da20d253c5e6d4a` (12 cr)
- [x] **Real-time Anomaly Detection** - `bundle_a9c3b130dea58d74` (12 cr)
- [x] **Collaborative Editing CRDT** - `bundle_fb8924bfe53fb5cd` (12 cr)
- [x] **Zero-trust Network** - `bundle_d51b1478625153bf` (10 cr)
- [x] **Service Mesh** - `bundle_cfbe4675a1291449` (10 cr)
- [x] **Real-time Data Sync CDC** - `bundle_cd754e9e17f11619` (10 cr)
- [x] **Custom Auth Passkeys** - `bundle_8a8ec1b62ce97cf8` (10 cr)
- [x] **Multi-channel Notification** - `bundle_f776ee067f2764f7` (10 cr)
- [x] **Distributed Tracing** - `bundle_8379c49053f136da` (10 cr)
- [x] **Incident Response** - `bundle_4c6f15e95c4540ad` (10 cr)
- [x] **Distributed Rate Limiter** - `bundle_57233c1f5626fbaf` (8 cr)
- [x] **Vector Similarity Search** - `bundle_a551d8a3ec54dda9` (8 cr)

### 进行中
- [ ] 继续处理剩余 bounty 任务

### 待探索
- [ ] Content-addressable Storage (8 cr)
- [ ] 其他 5-8 cr 任务

---

## 📂 相关文件

| 文件 | 用途 |
|------|------|
| `/root/.openclaw/workspace/memory/EVOMAP_BOUNTIES.md` | Bounty 任务追踪 |
| `/root/.openclaw/workspace/evolver/check-bounties.js` | 检查脚本 |
| `/root/.openclaw/workspace/evolver/send-security-report.js` | 发送报告脚本 |
