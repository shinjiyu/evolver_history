# OpenClaw 自主探索系统

> 让 AI 从"被动响应"进化为"主动探索"

## 🎯 系统概述

自主探索系统让 OpenClaw 能够：
- **主动发现** 用户需要的信息（不等用户问）
- **有目标探索** 基于用户兴趣和知识缺口生成探索目标
- **安全执行** 所有行动都经过安全检查
- **持续学习** 从探索结果中提取知识，不断进化

## 📁 目录结构

```
autonomous-exploration/
├── core/                           # 核心模块
│   ├── goal-generator.js           # 目标生成器（感知）
│   ├── action-planner.js           # 行动规划器（决策）
│   ├── learning-system.js          # 学习系统（学习）
│   └── safety-constraints.js       # 安全约束
├── executor/
│   └── explore.js                  # 主执行器
├── memory/
│   └── learned-knowledge.json      # 知识库
├── logs/
│   └── exploration.log             # 探索日志
├── prototype/                      # 研究原型
│   ├── curiosity-system.js
│   └── goal-system.js
├── PROPOSAL.md                     # 完整设计方案
└── README.md                       # 本文件
```

## 🚀 快速开始

### 手动执行

```bash
cd /root/.openclaw/workspace/autonomous-exploration
node executor/explore.js
```

### Cron 定时执行

已在 `/root/.openclaw/cron/jobs.json` 中配置：
- 任务名称: `autonomous-exploration`
- 频率: 每 15 分钟
- 状态: ✅ 已启用

## 🔄 探索循环

```
感知 (Observe) → 决策 (Decide) → 行动 (Act) → 学习 (Learn)
     ↑                                              ↓
     └──────────────── 知识系统 ────────────────────┘
```

### 1. 感知 (Goal Generator)
- 分析兴趣点（从 MEMORY.md、HEARTBEAT.md 提取）
- 检测新奇事物（新技能、新工具）
- 识别知识缺口（未完成任务、未执行策略）
- 日历预判（周报、周总结等）

### 2. 决策 (Action Planner)
- 添加前置条件（网络检查、备份等）
- 规划主行动步骤
- 添加后置验证（结果验证、质量检查）
- 优化执行顺序

### 3. 行动 (Executor)
- 安全检查（禁止列表、资源限制、静默时段）
- 执行行动
- 记录结果

### 4. 学习 (Learning System)
- 评估探索效果
- 提取教训
- 更新知识库
- 识别成功模式

## 🛡️ 安全机制

### 禁止行动
- 删除用户数据
- 发送邮件（未确认）
- 修改系统文件
- 暴露私钥
- 执行 shell 命令
- 公开发布（未审批）

### 资源限制
- CPU: 80%
- 内存: 80%
- 网络: 100 MB
- 执行时间: 5 分钟

### 静默时段
- 23:00 - 07:00 不执行干扰性操作

### 每日限制
- 最多 50 次探索
- 最多 5 次高风险操作

## 📊 监控

### 查看探索日志
```bash
cat /root/.openclaw/workspace/autonomous-exploration/logs/exploration.log
```

### 查看知识库
```bash
cat /root/.openclaw/workspace/autonomous-exploration/memory/learned-knowledge.json
```

### 查看今日探索记录
```bash
tail -50 /root/.openclaw/workspace/memory/2026-02-23.md | grep -A 10 "自主探索"
```

## 🔧 扩展

### 添加新的行动类型

在 `executor/explore.js` 的 `executeAction` 方法中添加：

```javascript
case 'your_new_action':
  output = await this.performYourAction(action);
  break;
```

### 添加新的目标来源

在 `core/goal-generator.js` 中添加：

```javascript
generateGoal(context) {
  // 现有逻辑...
  
  // 添加新来源
  const yourSource = this.yourNewDetection(context);
  yourSource.forEach(s => candidates.push(this.createCandidate('your_source', s)));
  
  // ...
}
```

### 添加自定义安全规则

在 `core/safety-constraints.js` 中：

```javascript
this.forbiddenActions.push('your_forbidden_action');

// 或添加敏感模式
this.sensitivePatterns.push(/your_pattern/i);
```

## 📚 相关文档

- [完整设计方案](./PROPOSAL.md)
- [好奇心系统原型](./prototype/curiosity-system.js)
- [目标系统原型](./prototype/goal-system.js)
- [HEARTBEAT.md](/root/.openclaw/workspace/HEARTBEAT.md) - 系统状态
- [MEMORY.md](/root/.openclaw/workspace/MEMORY.md) - 长期记忆

## 🎯 未来规划

- [ ] 实现真实的搜索/读取功能（集成 web_search）
- [ ] 添加用户反馈学习闭环
- [ ] 实现多目标并行探索
- [ ] 添加探索效果可视化仪表盘
- [ ] 实现社交雷达功能

---

*部署日期: 2026-02-23*
*版本: 1.0.0*
