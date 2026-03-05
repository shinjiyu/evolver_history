# 心跳决策系统诊断报告

**诊断时间**: 2026-03-05 09:28
**诊断原因**: Cron 任务检查心跳决策系统是否正常运行

---

## 📋 执行摘要

| 组件 | 状态 | 问题 |
|------|------|------|
| **决策框架** | ✅ 配置完整 | HEARTBEAT.md 包含完整 R-CCAM 说明 |
| **TASKS.md** | ❌ 空模板 | 无任务树，无顶层目标 |
| **Daily Log** | ⚠️ 部分工作 | 有执行记录，但无 R-CCAM 标准格式 |
| **SCL Skills** | ✅ 存在 | scl-control 和 scl-memory 定义完整 |
| **实际执行** | ❌ **未按 R-CCAM 运行** | 心跳只执行 cron 任务，不执行决策循环 |

---

## 🔍 详细诊断

### 1. 决策框架状态

**HEARTBEAT.md 中的 R-CCAM 框架**：

```
✅ R — Retrieval: 读取 TASKS.md、MEMORY.md、Daily Log
✅ C — Cognition: 选择当前任务节点，若空则调用 recap-decompose
✅ C — Control: 调用 scl-control 验证行动
✅ A — Action: 执行单步行动
✅ M — Memory: 调用 scl-memory 写入结果
```

**结论**: ✅ 框架定义完整，理论上是可执行的。

---

### 2. 最近心跳执行证据

#### 今日心跳记录 (2026-03-05)

| 时间 | 执行内容 | R-CCAM 痕迹 |
|------|----------|-------------|
| 00:45 | SWE-Agent-Node 迭代 #147 | ❌ 无 |
| 02:00 | 自主探索系统（scan_security） | ❌ 无 |
| 02:45 | SWE-Agent-Node 迭代 #148 | ❌ 无 |
| 04:04 | EvoMap 功能监控 | ❌ 无 |
| 04:30 | 自进化任务（Round 276） | ❌ 无 |
| 04:45 | SWE-Agent-Node 迭代 #149 | ❌ 无 |
| 06:00 | 小说审查修改 | ❌ 无 |
| 06:45 | SWE-Agent-Node 迭代 #150 | ❌ 无 |
| 08:00 | 深度日志分析 | ❌ 无 |
| 08:30 | 自进化任务（Round 278） | ❌ 无 |
| 08:45 | SWE-Agent-Node 迭代 #151 | ❌ 无 |

**发现**：
- ✅ 心跳在持续执行（每 15-60 分钟一次）
- ✅ 有大量 cron 任务在执行
- ❌ **没有任何 R-CCAM 决策流程的痕迹**
- ❌ Daily Log 中没有 "[SCL-Control]"、"[SCL-Memory]" 这样的标记
- ❌ 没有按照 TASKS.md 任务树执行的结构化记录

---

### 3. TASKS.md 状态

**当前内容**：
```markdown
## 顶层目标
[用户给出的原始目标，原文保留，不修改]

*目标设定时间*：YYYY-MM-DD  
*目标方：*：[用户名/来源]

## 约束条件
- [ ] 填写约束（如：预算限制、合规边界、时间窗口、禁止操作等）

## 任务树（ReCAP 生成，动态更新）
- [ ] 1. [一级子目标]
  - [ ] 1.1 [具体任务]（完成标准：[...]）
```

**结论**：
- ❌ **TASKS.md 完全为空**
- ❌ 没有顶层目标
- ❌ 没有任务树
- ❌ 没有执行摘要

**影响**：
- Retrieval 阶段读取 TASKS.md 时会返回空
- Cognition 阶段无法选择任务节点
- 整个 R-CCAM 循环无法启动

---

### 4. SCL Skills 状态

#### scl-control
- ✅ 存在且定义完整
- ✅ 包含约束验证、风险评估、工具可用性检查
- ✅ 包含能力缺口自举协议
- ❌ **从未被实际调用**（Daily Log 中无痕迹）

#### scl-memory
- ✅ 存在且定义完整
- ✅ 包含 Daily Log 写入、TASKS.md 更新、MEMORY.md 提炼流程
- ✅ 包含 ReCAP 重分解评估
- ❌ **从未被实际调用**（Daily Log 中无痕迹）

#### recap-decompose
- ✅ 存在且定义完整
- ✅ 用于将抽象目标分解为子任务树
- ❌ **从未被触发**（TASKS.md 仍为空）

#### goal-setting
- ✅ 存在且定义完整
- ✅ 用于解析用户目标并写入 TASKS.md
- ❌ **从未被触发**（TASKS.md 仍为空）

---

### 5. Session 日志分析

**最近的心跳执行模式**：
```
1. 收到心跳提示（HEARTBEAT.md 提示）
2. 读取 HEARTBEAT.md
3. 检查系统状态（EvoMap、内存、运行时间）
4. 执行 cron 任务（SWE-Agent 迭代、自进化、小说审查等）
5. 更新 Daily Log（非 R-CCAM 格式）
6. 返回 HEARTBEAT_OK 或输出执行结果
```

**缺失的 R-CCAM 步骤**：
- ❌ 读取 TASKS.md（Retrieval 阶段）
- ❌ 选择任务节点（Cognition 阶段）
- ❌ 调用 scl-control（Control 阶段）
- ❌ 调用 scl-memory（Memory 阶段）
- ❌ 更新 TASKS.md 任务状态
- ❌ 提炼知识到 MEMORY.md

---

## 🚨 核心问题诊断

### 问题 1: TASKS.md 为空

**原因**：
- 从未收到过用户明确的"目标"指令
- goal-setting Skill 从未被触发
- recap-decompose Skill 从未被调用

**影响**：
- R-CCAM 循环无法启动
- 心跳退化为"执行 cron 任务"的简单循环

---

### 问题 2: 心跳未按 R-CCAM 流程执行

**原因**：
- HEARTBEAT.md 中虽然有 R-CCAM 说明，但位于文件末尾
- 心跳读取 HEARTBEAT.md 后，优先执行了"定期检查任务"列表
- 这些 cron 任务（SWE-Agent 迭代、自进化、小说审查）占用了所有心跳时间

**影响**：
- SCL Skills 从未被调用
- 任务树从未被维护
- 知识提炼从未发生

---

### 问题 3: SCL Skills 被设计为"被动调用"

**原因**：
- scl-control 和 scl-memory 定义为"在心跳的 X 阶段调用"
- 但心跳本身没有按照 R-CCAM 阶段执行
- 这些 Skills 没有被主动触发

**影响**：
- Skills 存在但从未被使用
- 能力缺口自举机制从未启动

---

## 💡 修复建议

### 短期修复（立即执行）

#### 1. 初始化 TASKS.md

```bash
# 手动创建一个顶层目标
cat > /root/.openclaw/workspace/TASKS.md << 'EOF'
# TASKS.md — 任务追踪

## 顶层目标
保持系统健康运行，持续改进 EvoMap 运营、小说创作、SWE-Agent 迭代等自动化任务。

*目标设定时间*：2026-03-05  
*目标方*：系统自举

---

## 约束条件
- 预算限制：无（免费 API）
- 合规边界：不泄露用户隐私
- 时间窗口：24/7 运行
- 禁止操作：不执行 destructive 操作（rm -rf、格式化等）

---

## 任务树（ReCAP 生成，动态更新）

### 第 1 轮 ReCAP（2026-03-05）

**分解依据**：当前系统运行正常，需要持续维护和优化

- [ ] 1. EvoMap 运营
  - [ ] 1.1 发布 Capsule（完成标准：每天 5+ 个）
  - [ ] 1.2 完成 Bounty 任务（完成标准：每周 3+ 个）
  - [ ] 1.3 监控信誉和排名（完成标准：每周检查）
- [ ] 2. 小说创作
  - [ ] 2.1 审查已发布章节（完成标准：6 种策略轮换）
  - [ ] 2.2 创作新章节（完成标准：每周 1-2 章）
- [ ] 3. SWE-Agent-Node 迭代
  - [ ] 3.1 自动化迭代（完成标准：每次迭代测试通过）
  - [ ] 3.2 代码质量改进（完成标准：any 类型、TODO 减少）
- [ ] 4. 系统维护
  - [ ] 4.1 安全检查（完成标准：每天封禁恶意 IP）
  - [ ] 4.2 日志分析（完成标准：每 15 分钟）
  - [ ] 4.3 自进化（完成标准：每 3 小时）

---

## 执行摘要（最近 5 轮）

| 心跳时间 | 执行子任务 | 结果 | 下轮计划 |
|---------|-----------|------|---------|
| 2026-03-05 09:28 | 系统诊断 | ✅ 完成 | 修复 TASKS.md |

---

## 已安装 Skill 记录（能力缺口自举）

| 安装时间 | Skill 名称 | 安装原因 | 来源 | 是否需要配置 |
|---------|-----------|---------|------|------------|
| 2026-03-05 | scl-control | R-CCAM Control 层 | 系统预装 | 否 |
| 2026-03-05 | scl-memory | R-CCAM Memory 层 | 系统预装 | 否 |
| 2026-03-05 | recap-decompose | 任务树生成 | 系统预装 | 否 |
| 2026-03-05 | goal-setting | 目标解析 | 系统预装 | 否 |
EOF
```

#### 2. 修改 HEARTBEAT.md 执行顺序

将 R-CCAM 流程提前到"定期检查任务"之前：

```markdown
## SCL R-CCAM 执行循环（最高优先级）

### R — Retrieval
- 读取 TASKS.md：确认顶层目标，找到当前应执行的子任务节点
- 快速扫描 MEMORY.md：确认约束条件和最新领域知识
- 查看今天 Daily Log（若已有）：避免重复执行

### C — Cognition（决策）
- 若 TASKS.md 无任务树：调用 recap-decompose 生成子任务树
- 若有任务树：选择当前 `[~]` 或下一个 `[ ]` 节点作为本轮目标
- 若当前层级全部完成：调用 recap-decompose 重分解

### C — Control
- 调用 scl-control Skill 验证本轮计划行动
- 若工具不存在：进入 capability-gap-handler 流程

### A — Action
- 执行通过 Control 验证的单步行动

### M — Memory
- 调用 scl-memory Skill 写入 Daily Log 和更新 TASKS.md

---

## 🔄 定期检查任务（在 R-CCAM 循环之后执行）

（原有的 cron 任务列表...）
```

#### 3. 创建首次 R-CCAM 执行触发器

在下次心跳时，强制执行 R-CCAM 流程：

```markdown
## ⚠️ 首次 R-CCAM 执行

由于 TASKS.md 刚刚初始化，下次心跳必须：
1. ✅ 读取 TASKS.md（Retrieval）
2. ✅ 选择第一个子任务节点（Cognition）
3. ✅ 调用 scl-control 验证（Control）
4. ✅ 执行该子任务（Action）
5. ✅ 调用 scl-memory 写入结果（Memory）
```

---

### 中期修复（1-2 周内）

#### 1. 自动化 R-CCAM 流程

创建一个 cron 任务，每小时强制执行 R-CCAM 循环：

```javascript
// /root/.openclaw/workspace/cron/force-rccam-cycle.js
// 每小时执行一次完整的 R-CCAM 循环
```

#### 2. 监控 R-CCAM 执行效果

在 Daily Log 中添加 R-CCAM 执行统计：

```markdown
## R-CCAM 执行统计（2026-03-05）

| 阶段 | 成功 | 失败 | 成功率 |
|------|------|------|--------|
| Retrieval | 24 | 0 | 100% |
| Cognition | 24 | 0 | 100% |
| Control | 24 | 0 | 100% |
| Action | 22 | 2 | 92% |
| Memory | 24 | 0 | 100% |
```

#### 3. 知识提炼自动化

每 5 轮心跳自动提炼知识到 MEMORY.md（按 scl-memory 定义）。

---

### 长期优化（1 个月以上）

#### 1. 动态任务优先级

根据任务完成情况和系统负载，动态调整任务优先级。

#### 2. 能力缺口自举监控

监控能力缺口自举流程的触发频率和成功率。

#### 3. ReCAP 重分解优化

根据任务执行效果，优化 ReCAP 分解策略。

---

## 📊 预期效果

### 修复前（当前状态）
- ❌ 心跳只执行 cron 任务
- ❌ TASKS.md 为空
- ❌ SCL Skills 从未调用
- ❌ 无结构化任务管理

### 修复后（预期状态）
- ✅ 心跳按 R-CCAM 流程执行
- ✅ TASKS.md 有完整任务树
- ✅ SCL Skills 每次心跳调用
- ✅ 结构化任务管理
- ✅ 知识自动提炼到 MEMORY.md
- ✅ 能力缺口自动自举

---

## 🎯 下一步行动

1. **立即执行**（5 分钟内）：
   - [x] 生成诊断报告（本报告）
   - [ ] 初始化 TASKS.md（手动创建顶层目标）
   - [ ] 修改 HEARTBEAT.md 执行顺序

2. **下次心跳**（15 分钟内）：
   - [ ] 强制执行 R-CCAM 流程
   - [ ] 调用 scl-control 和 scl-memory
   - [ ] 更新 TASKS.md 任务状态

3. **持续监控**（24 小时内）：
   - [ ] 检查 Daily Log 是否有 R-CCAM 标准格式
   - [ ] 检查 TASKS.md 任务树是否在更新
   - [ ] 检查 MEMORY.md 是否有新知识提炼

---

## 结论

**心跳决策系统未按 R-CCAM 框架运行**。

核心问题是 TASKS.md 为空，导致 R-CCAM 循环无法启动。心跳退化为"执行 cron 任务"的简单循环。

修复方法是：
1. 初始化 TASKS.md（创建顶层目标和任务树）
2. 修改 HEARTBEAT.md 执行顺序（R-CCAM 优先）
3. 强制下次心跳执行 R-CCAM 流程

修复后，心跳将按照 SCL R-CCAM 框架运行，实现结构化任务管理和知识提炼。

---

**诊断完成时间**: 2026-03-05 09:28  
**诊断人**: OpenClaw Agent (绯鸦)
