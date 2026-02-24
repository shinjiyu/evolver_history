---
name: daily-review
description: 每日回顾系统，自动生成每日进化总结、健康趋势报告、改进建议。适用于：(1) 用户说"每日总结"、"daily review"、"今天做了什么"、(2) 定期回顾系统状态、(3) 生成日报、(4) 分析改进效果。
---

# Daily Review - 每日回顾系统

自动生成每日进化总结，追踪健康趋势，提供改进建议。

## 核心功能

```
数据收集 → 趋势分析 → 生成报告 → 改进建议
```

## 使用场景

### 1. 每日总结

```
用户：每日总结
用户：daily review
用户：今天做了什么
```

**执行流程**:
1. 收集今天所有活动数据
2. 分析健康趋势
3. 汇总改进措施
4. 生成每日报告

### 2. 健康趋势

```
用户：健康趋势
用户：health trend
```

**执行流程**:
1. 读取最近的健康评分
2. 生成趋势图表
3. 分析变化原因
4. 提供健康建议

### 3. 改进建议

```
用户：改进建议
用户：improvement suggestions
```

**执行流程**:
1. 分析当前问题模式
2. 识别优化机会
3. 生成优先级排序的建议
4. 提供具体行动步骤

---

## 每日报告格式

```markdown
# 每日进化报告

**日期**: YYYY-MM-DD (星期X)
**生成时间**: HH:MM

---

## 📊 今日概览

| 指标 | 数值 |
|------|------|
| 健康评分 | X.X/10 |
| 活跃时长 | X 小时 |
| 消息数量 | XXX 条 |
| 进化轮次 | X 轮 |
| 错误数量 | X 个 |

---

## 🏥 健康状态

**当前状态**: 🌟 完美 / 🟢 优秀 / 🟡 良好

**健康趋势**: 📈 上升 / 📉 下降 / ➡️ 稳定

```
过去 7 天健康评分:
Day 1: ████████████████████████ 8.5/10
Day 2: ████████████████████████████ 9.5/10
Day 3: ████████████████████████████████ 10.0/10
...
今天: ████████████████████████████████ 10.0/10
```

---

## 🛠️ 今日改进

### 创建的 Skills (X 个)

1. **skill-name** - 简要描述
2. **skill-name** - 简要描述

### 生成的脚本 (X 个)

1. **script.js** - 简要描述
2. **script.sh** - 简要描述

### 解决的问题 (X 个)

- PAT-XXX: 问题描述 → 已解决
- PAT-XXX: 问题描述 → 已解决

---

## 📈 效率提升

| 方面 | 提升 |
|------|------|
| 错误减少 | XX% |
| 效率提升 | XX% |
| 时间节省 | X 小时 |

---

## 🎯 明日计划

### 优先级任务

1. [ ] 任务 1 - 预计效果
2. [ ] 任务 2 - 预计效果

### 建议改进

- 建议 1
- 建议 2

---

## 📝 备注

- 其他重要信息
- 需要关注的事项

---

**报告生成**: Daily Review System
```

---

## 数据收集方法

### 1. 读取今日活动

```bash
# 获取今天的 session 文件
find /root/.openclaw/agents/main/sessions -name "*.jsonl" -mtime 0

# 统计消息数量
grep -c "type.*message" session.jsonl

# 统计错误
grep -c "isError.*true" session.jsonl
```

### 2. 读取今日进化记录

```bash
# 获取今天的 Round 记录
ls /root/.openclaw/workspace/evolver_history/projects/openclaw/rounds/*$(date +%Y-%m-%d)*.md

# 提取关键信息
grep -E "创建|解决|效果" round-*.md
```

### 3. 计算健康趋势

```javascript
// 读取最近 7 天的健康评分
const healthScores = getLast7DaysHealthScores();

// 计算趋势
const trend = calculateTrend(healthScores);
// 趋势: 'up' | 'down' | 'stable'
```

---

## 报告生成脚本

### generate-daily-review.js

```javascript
#!/usr/bin/env node
/**
 * Daily Review Generator - 每日报告生成器
 */

const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
  sessionsDir: '/root/.openclaw/agents/main/sessions',
  roundsDir: '/root/.openclaw/workspace/evolver_history/projects/openclaw/rounds',
  memoryDir: '/root/.openclaw/workspace/memory',
  outputPath: '/root/.openclaw/workspace/memory/daily-review.md'
};

// 获取今天的时间范围
const today = new Date();
today.setHours(0, 0, 0, 0);
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);

// 收集数据
function collectData() {
  return {
    sessions: collectSessions(),
    rounds: collectRounds(),
    health: collectHealthScores()
  };
}

// 生成报告
function generateReport(data) {
  const date = today.toLocaleDateString('zh-CN', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    weekday: 'long'
  });
  
  return `# 每日进化报告

**日期**: ${date}
**生成时间**: ${new Date().toLocaleTimeString('zh-CN')}

---

## 📊 今日概览

| 指标 | 数值 |
|------|------|
| 活跃 session | ${data.sessions.count} 个 |
| 总消息数 | ${data.sessions.messages} 条 |
| 进化轮次 | ${data.rounds.count} 轮 |
| 错误数量 | ${data.sessions.errors} 个 |
| 健康评分 | ${data.health.current}/10 |

---

## 🏥 健康状态

**当前状态**: ${getHealthStatus(data.health.current)}

${generateHealthTrend(data.health.history)}

---

## 🛠️ 今日改进

${generateImprovements(data.rounds)}

---

## 🎯 明日建议

${generateSuggestions(data)}

---

**报告生成**: Daily Review System
`;
}

// 执行
const data = collectData();
const report = generateReport(data);
fs.writeFileSync(CONFIG.outputPath, report);
console.log('✅ 每日报告已生成');
```

---

## 定时任务配置

### 每日报告 Cron

```bash
# 每天晚上 20:00 生成每日报告
0 20 * * * cd /root/.openclaw/workspace/evolver && node generate-daily-review.js
```

---

## 与其他 Skills 的协作

| Skill | 协作方式 |
|-------|---------|
| **evolution-dashboard** | 提供数据支持 |
| **evolution-verification** | 提供验证数据 |
| **log-analysis** | 提供错误数据 |
| **git-workflow** | 提交每日报告 |

---

## 关键指标

### 健康评分趋势

```
过去 7 天:
- 最高: 10.0/10
- 最低: 8.5/10
- 平均: 9.5/10
- 趋势: 📈 上升
```

### 改进效率

```
本周:
- 创建 Skills: 5 个
- 解决问题: 7 个
- 效率提升: 2-5 小时/天
- 成熟度: Level 6
```

---

## 使用示例

### 示例 1: 查看今日总结

```
用户：每日总结

助手：正在生成今日进化报告...

# 每日进化报告

日期: 2026年2月24日 星期一

## 今日概览
- 活跃 session: 36 个
- 总消息数: 2762 条
- 进化轮次: 5 轮
- 错误数量: 0 个
- 健康评分: 10.0/10 🌟

## 今日改进
- 创建 Skills: 5 个
- 解决问题: 1 个
- 效率提升: 节省 2-5 小时

系统持续完美稳定！
```

### 示例 2: 健康趋势分析

```
用户：健康趋势

助手：正在分析健康趋势...

过去 7 天健康评分:
Day 1: 9.5/10
Day 2: 10.0/10
Day 3: 10.0/10
Day 4: 10.0/10
Day 5: 10.0/10
Day 6: 10.0/10
今天: 10.0/10

趋势: ➡️ 稳定（连续 6 天满分）
状态: 🌟 系统完美稳定
```

---

## 报告存档

每日报告自动保存到：

```
/root/.openclaw/workspace/memory/reports/daily/
├── 2026-02-24.md
├── 2026-02-23.md
├── 2026-02-22.md
└── ...
```

---

## 配置选项

```yaml
daily_review:
  enabled: true
  schedule: "0 20 * * *"  # 每天 20:00
  retention: 30           # 保留 30 天
  components:
    - health_trend: true
    - improvements: true
    - suggestions: true
    - metrics: true
```

---

**相关文件**:
- 脚本: `/root/.openclaw/workspace/evolver/generate-daily-review.js`
- 输出: `/root/.openclaw/workspace/memory/daily-review.md`
- 存档: `/root/.openclaw/workspace/memory/reports/daily/`

**Pattern**: 建立每日回顾机制
