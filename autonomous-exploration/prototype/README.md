# OpenClaw 自主目标系统原型

> 实现日期：2026-02-23
> 研究主题：目标自主设定

## 概述

这是一个实现了目标自主设定能力的研究原型，包含：

- **目标分解**：将模糊目标分解为具体可执行的子目标
- **冲突检测**：识别目标间的资源、时间、逻辑冲突
- **平衡策略**：平衡长期目标和短期任务的资源分配
- **动态调整**：根据执行历史自动优化策略

## 快速开始

### 运行示例

```bash
cd /root/.openclaw/workspace/autonomous-exploration/prototype
node goal-system.js
```

### 作为模块使用

```javascript
const { 
  AutonomousGoalSystem, 
  Goal 
} = require('./goal-system');

const system = new AutonomousGoalSystem();

// 处理新目标
const result = await system.processGoal('了解 RAG 最新进展', {
  type: 'information_gathering',
  level: 2
});

// 添加长期目标
const longTermGoal = new Goal({
  description: '建立完整的用户兴趣图谱',
  type: 'task_execution',
  level: 3,
  priority: 0.8,
  progress: 0.3
});
system.addLongTermGoal(longTermGoal);
```

## 核心组件

### 1. Goal（目标类）

```javascript
const goal = new Goal({
  description: '目标描述',
  type: 'information_gathering', // information_gathering, task_execution, learning, exploration
  level: 1, // 1=操作, 2=战术, 3=战略, 4=愿景
  source: 'explicit', // explicit, interest, anomaly, curiosity, calendar
  priority: 0.8,
  deadline: Date.now() + 86400000, // 24小时后
  metadata: { /* 自定义数据 */ }
});
```

### 2. GoalDecomposer（目标分解器）

支持的目标类型和分解策略：

| 目标类型 | 分解策略 | 示例 |
|----------|----------|------|
| `information_gathering` | 搜索 → 整理 → 汇总 | "了解 RAG 最新进展" |
| `task_execution` | 准备 → 执行 → 验证 | "实现文件自动整理" |
| `learning` | 基础 → 进阶 → 实践 | "学习 Prompt Engineering" |
| `exploration` | 广泛搜索 → 识别趋势 → 评估价值 | "探索 No-Code 工具" |

### 3. GoalConflictDetector（冲突检测器）

检测三类冲突：

| 冲突类型 | 检测条件 | 解决策略 |
|----------|----------|----------|
| **资源冲突** | 两个目标需要同一资源 | 串行执行 |
| **时间冲突** | 执行时间重叠 | 按优先级排序 |
| **逻辑冲突** | 目标相互矛盾 | 用户决策 |

### 4. GoalBalancer（目标平衡器）

资源分配策略：

```
默认分配：
├─ 长期目标：30%
├─ 短期任务：50%
└─ 反应式预留：20%

动态调整：
  if 长期目标进度 < 30%: 增加长期资源
  if 突发事件率 > 30%: 增加反应式预留
```

## 目标评分系统

```javascript
score(goal) = relevance × novelty × feasibility × safety × source_weight

其中：
  relevance: 与用户兴趣的相关性 [0-1]
  novelty: 信息新颖度 [0-1]
  feasibility: 执行可行性 [0-1]
  safety: 安全性评估 [0-1]
  source_weight: 来源权重 [0-1]

决策规则:
  score >= 0.7 → 立即执行
  0.4 <= score < 0.7 → 加入队列
  score < 0.4 → 丢弃
```

## API 参考

### AutonomousGoalSystem

```javascript
// 处理新目标
const result = await system.processGoal(description, options);

// 添加长期目标
system.addLongTermGoal(goal);

// 执行历史
system.executionHistory // Array<ExecutionRecord>
```

### Goal

```javascript
// 计算目标分数
const score = goal.calculateScore(userModel);

// 判断是否可执行
const executable = goal.isExecutable();

// 更新进度
goal.updateProgress(0.5); // 50%
```

## 示例输出

```
============================================================
🤖 OpenClaw 自主目标系统
============================================================

🎯 分解目标: "了解 RAG 最新进展"
   ✓ 生成 4 个子目标

📊 规划目标执行 (可用时间: 60分钟)
   ✓ 长期目标: 0 项
   ✓ 短期任务: 2 项
   ✓ 反应式预留: 12 分钟

📋 执行计划:
────────────────────────────────────────────────────────────

✅ 短期任务:
   1. 汇总搜索结果并生成报告 (优先级: 0.21)
   2. 搜索最近1个月的rag相关文章 (优先级: 0.19)

============================================================
```

## 下一步开发

- [ ] 集成到 Heartbeat 机制
- [ ] 添加用户模型支持
- [ ] 实现目标执行器
- [ ] 添加可视化界面
- [ ] 实现学习闭环

## 相关文档

- [PROPOSAL.md](../PROPOSAL.md) - 完整方案设计
- [2026-02-23.md](../memory/2026-02-23.md) - 研究日志

## 许可

MIT
