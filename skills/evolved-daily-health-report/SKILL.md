---
name: evolved-daily-health-report
description: 每日系统健康报告 - 自动生成每日健康报告，汇总系统状态、资源使用、错误趋势、改进建议。适用于：(1) 每日系统回顾、(2) 健康趋势分析、(3) 自动化监控、(4) 持续改进追踪。
---

# 每日系统健康报告 (Evolved Daily Health Report)

**核心理念**：通过自动化每日健康报告，持续监控系统状态，识别趋势，提出改进建议。

## 问题背景

### PAT-013: 缺少自动化健康报告

**发现时间**: 2026-03-17 00:30

| 指标 | 数值 | 说明 |
|------|------|------|
| 系统运行 | **19 天** | 长期运行 |
| 健康评分 | **8.0/10** | 优秀 |
| 监控方式 | **手动** | 需要自动化 |
| 报告频率 | **不定期** | 需要定期 |

**问题分析**:
1. **缺少定期报告** - 没有每日自动生成的健康报告
2. **趋势分析不足** - 缺少长期趋势分析
3. **改进追踪困难** - 难以追踪改进措施的效果
4. **监控效率低** - 需要手动检查系统状态

**影响评估**:
- 🟡 监控效率低
- 🟡 趋势分析困难
- 🟡 改进效果难以量化
- 🟢 可通过自动化改善

## 核心功能

### 1. 自动化健康检查

**检查项目**:
```markdown
- 系统资源（CPU、内存、磁盘、负载）
- 运行时间
- 错误趋势（429 错误、Edit 失败、ENOENT 错误）
- Skills 数量
- 已解决 Patterns
- 系统健康评分
```

**检查频率**:
```markdown
- 每日 1 次（00:00）
- 生成报告并保存
- 可选：发送通知
```

### 2. 趋势分析

**对比维度**:
```markdown
- 与昨天对比（日环比）
- 与上周同期对比（周环比）
- 与上月同期对比（月环比）
- 长期趋势（30 天）
```

**关键指标**:
```markdown
- 健康评分趋势
- 资源使用趋势
- 错误数量趋势
- Skills 增长趋势
- Patterns 解决趋势
```

### 3. 改进建议生成

**自动识别改进机会**:
```markdown
- 如果内存使用 > 80%：建议执行内存清理
- 如果 429 错误增速 > 15%：建议优化 API 调用
- 如果健康评分下降：分析原因并提供建议
- 如果磁盘使用 > 85%：建议清理磁盘
```

### 4. 报告格式

**标准报告格式**:
```markdown
# 每日系统健康报告 - YYYY-MM-DD

## 📊 系统概览
- 健康评分
- 运行时间
- 主要指标

## 📈 趋势分析
- 日环比
- 周环比
- 月环比

## 🚨 发现的问题
- P0 问题
- P1 问题
- P2 问题

## ✅ 改进进展
- 新增 Skills
- 已解决 Patterns
- 改进措施效果

## 💡 改进建议
- 短期建议
- 中期建议
- 长期建议

## 📝 行动项
- 待处理事项
- 已完成事项
```

## 使用方式

### 方式 1: 自动生成（推荐用于生产环境）

**Cron 配置**:
```bash
# 每天 00:00 生成健康报告
0 0 * * * bash /root/.openclaw/workspace/evolver/fixes/daily-health-report.sh
```

### 方式 2: 手动生成（推荐用于诊断）

**生成报告**:
```bash
# 生成今天的健康报告
bash /root/.openclaw/workspace/evolver/fixes/daily-health-report.sh

# 生成指定日期的健康报告
bash /root/.openclaw/workspace/evolver/fixes/daily-health-report.sh --date 2026-03-17
```

### 方式 3: 查看历史报告

**查看报告列表**:
```bash
# 列出所有健康报告
ls -lt /root/.openclaw/workspace/memory/health-report-*.md

# 查看最新报告
cat /root/.openclaw/workspace/memory/health-report-$(date +%Y-%m-%d).md
```

## 报告内容

### 1. 系统概览

**基本信息**:
```markdown
| 指标 | 数值 | 状态 |
|------|------|------|
| 健康评分 | 8.0/10 | ✅ |
| 运行时间 | 19 天 8 小时 | ✅ |
| 内存使用 | 58% | ✅ |
| 磁盘使用 | 75% | 🟡 |
| 系统负载 | 0.23 | ✅ |
```

### 2. 趋势分析

**日环比**:
```markdown
| 指标 | 昨天 | 今天 | 变化 |
|------|------|------|------|
| 健康评分 | 7.5/10 | 8.0/10 | ✅ +0.5 |
| 内存使用 | 78% | 58% | ✅ -20% |
| 429 错误 | 130 | 141 | 🟡 +8.5% |
```

**周环比**:
```markdown
| 指标 | 上周 | 本周 | 变化 |
|------|------|------|------|
| 健康评分 | 7.0/10 | 8.0/10 | ✅ +1.0 |
| Skills 数量 | 80 | 88 | ✅ +10% |
| 已解决 Patterns | 5 | 8 | ✅ +60% |
```

### 3. 错误分析

**错误统计**:
```markdown
| 错误类型 | 数量 | 趋势 | 状态 |
|---------|------|------|------|
| 429 错误 | 141 | +8.5% | 🟡 稳定 |
| Edit 失败 | 持续 | -42% | ✅ 改善 |
| ENOENT 错误 | 持续 | -40% | ✅ 改善 |
```

### 4. 改进进展

**新增 Skills**:
```markdown
- Round 333: evolved-edit-best-practices
- Round 334: evolved-timeout-intelligence
- Round 335: evolved-cron-optimizer
- Round 336: evolved-memory-guardian
- Round 337: evolved-daily-health-report（本 Skill）
```

**已解决 Patterns**:
```markdown
- PAT-006: 磁盘使用率（Round 332）
- PAT-008: Edit 操作失败（Round 333）
- PAT-009: 文件不存在错误（Round 333）
- PAT-010: Timeout 配置不当（Round 334）
- PAT-011: Cron 任务调度冲突（Round 335）
- PAT-012: 内存使用率持续上升（Round 336）
```

### 5. 改进建议

**自动生成建议**:
```markdown
## 短期建议（1-3 天）
1. 监控 API Rate Limit 趋势（增速 8.5%，稳定）
2. 观察 Edit 和 ENOENT 错误的改善趋势

## 中期建议（1-2 周）
1. 考虑实现全局请求队列
2. 增强错误恢复机制

## 长期建议（1-2 月）
1. 持续优化系统架构
2. 增加自动化监控和告警
```

## 配置选项

```json5
{
  dailyHealthReport: {
    enable: true,                 // 启用每日报告
    generateTime: "00:00",        // 生成时间
    savePath: "memory/",          // 保存路径
    sendNotification: false,      // 发送通知
    webhookUrl: "",               // Webhook URL
    retentionDays: 30,            // 报告保留天数
    enableTrendAnalysis: true     // 启用趋势分析
  }
}
```

## 与其他 Skill 集成

1. **evolver-log-analysis** - 使用日志分析数据
2. **evolved-memory-guardian** - 使用内存监控数据
3. **system-health-orchestrator** - 系统健康监控
4. **evolution-verification** - 验证改进措施效果

## 相关 Patterns

- **PAT-013**: 缺少自动化健康报告 → 每日报告 (🔧已解决)

## 快速参考

### 报告生成命令

```bash
# 生成今天的报告
bash daily-health-report.sh

# 生成指定日期的报告
bash daily-health-report.sh --date 2026-03-17

# 查看最新报告
cat /root/.openclaw/workspace/memory/health-report-$(date +%Y-%m-%d).md

# 列出所有报告
ls -lt /root/.openclaw/workspace/memory/health-report-*.md
```

### 报告文件命名

```
health-report-YYYY-MM-DD.md

示例：
health-report-2026-03-17.md
```

---

**创建时间**: 2026-03-17 00:30
**创建者**: OpenClaw Evolver System (Round 337)
**版本**: 1.0
**优先级**: P2（中）
