---
name: system-health-orchestrator
description: 系统健康编排器 - 统一管理和执行所有健康检查与维护任务。适用于：(1) 综合系统健康评估、(2) 自动化健康检查、(3) 预防性维护、(4) 健康趋势分析。
---

# System Health Orchestrator - 系统健康编排器

统一管理和执行所有系统健康检查与维护任务，提供综合健康评分和建议。

## 核心理念

**统一入口 > 分散执行 > 综合报告 > 持续优化**

一个入口执行所有健康检查，生成综合报告，提供优化建议。

## 功能模块

### 1. 资源检查模块

检查系统资源使用情况：
- 磁盘空间
- 内存使用
- CPU 负载
- Swap 状态

### 2. API 健康模块

检查 API 服务可用性：
- GLM-5 API (zai)
- EvoMap API
- Brave Search API

### 3. 日志分析模块

分析系统日志：
- 错误模式识别
- 趋势分析
- Pattern 匹配

### 4. 维护任务模块

执行预防性维护：
- 日志清理
- 缓存清理
- 临时文件删除

## 使用方式

### 完整健康检查

```bash
/root/.openclaw/workspace/evolver/fixes/system-health-check.sh --full
```

执行所有检查模块，生成完整报告。

### 快速检查

```bash
/root/.openclaw/workspace/evolver/fixes/system-health-check.sh --quick
```

仅执行关键检查，适合频繁执行。

### 特定模块

```bash
# 仅检查资源
./system-health-check.sh --module resource

# 仅检查 API
./system-health-check.sh --module api

# 仅执行维护
./system-health-check.sh --module maintenance
```

## 健康评分模型

### 评分公式

```
总分 = 基础分 (8.0) + 资源分 + API分 + 日志分 + 维护分

资源分:
  + 磁盘 < 70%: +0.5
  + 内存 > 500MB: +0.5
  + CPU < 1.0: +0.5
  - 磁盘 > 85%: -1.0
  - 内存 < 200MB: -1.0

API分:
  + 无 429 错误: +1.0
  + API 全部可达: +0.5
  - 429 错误 > 10: -1.0

日志分:
  + 错误率 < 1/h: +0.5
  - 错误率 > 10/h: -1.0

维护分:
  + 定期维护执行: +0.5
```

### 评分等级

| 分数 | 等级 | 状态 | 建议 |
|------|------|------|------|
| 9.0-10.0 | 🟢 优秀 | 最佳运行 | 保持现状 |
| 7.5-8.9 | 🟢 良好 | 正常运行 | 定期维护 |
| 6.0-7.4 | 🟡 一般 | 需要关注 | 检查问题 |
| 4.0-5.9 | 🟠 警告 | 需要修复 | 立即处理 |
| 0.0-3.9 | 🔴 危险 | 严重问题 | 紧急修复 |

## 检查清单

### 每小时检查（快速）

- [ ] CPU 负载
- [ ] 内存使用
- [ ] 磁盘空间
- [ ] API 可用性

### 每 4 小时检查（标准）

- [ ] 完整资源检查
- [ ] API 健康检查
- [ ] 错误日志分析
- [ ] Pattern 识别

### 每日检查（完整）

- [ ] 所有模块完整检查
- [ ] 健康趋势分析
- [ ] 维护任务执行
- [ ] 报告生成

## 集成的脚本

本 Skill 编排以下脚本：

### 资源检查
- `evolver/fixes/system-log-cleanup.sh` - 日志清理
- `evolver/fixes/disk-cleanup.sh` - 磁盘清理
- `evolver/fixes/configure-swap.sh` - Swap 配置

### API 检查
- `evolver/fixes/network-health-check.sh` - 网络健康检查
- `evolver/fixes/api-balance-monitor.sh` - API 余额监控

### 高峰期准备
- `evolver/fixes/peak-hours-preparation.sh` - 高峰期准备

## 报告格式

### JSON 报告

```json
{
  "timestamp": "2026-02-27T12:30:00Z",
  "health_score": 9.0,
  "grade": "excellent",
  "modules": {
    "resource": {
      "score": 9.5,
      "disk": "71%",
      "memory": "839MB",
      "cpu": 0.14
    },
    "api": {
      "score": 9.0,
      "429_errors": 0,
      "apis_healthy": true
    },
    "logs": {
      "score": 9.0,
      "error_rate": "0.00/h"
    },
    "maintenance": {
      "score": 8.5,
      "last_cleanup": "2026-02-27T08:30:00Z"
    }
  },
  "recommendations": []
}
```

### Markdown 报告

```markdown
# 系统健康报告

**时间**: 2026-02-27 12:30
**健康评分**: 9.0/10 (🟢 优秀)

## 资源状态
- 磁盘: 71% (15G 可用) ✅
- 内存: 839MB 可用 ✅
- CPU: 0.14 负载 ✅

## API 状态
- GLM-5: ✅ 健康
- EvoMap: ✅ 健康
- Brave: ✅ 健康

## 建议
- 无需改进
```

## 自动化集成

### Cron 配置

```json
{
  "jobId": "system-health-check-quick",
  "schedule": "0 * * * * *",
  "command": "/root/.openclaw/workspace/evolver/fixes/system-health-check.sh --quick",
  "description": "每小时快速健康检查"
}
```

```json
{
  "jobId": "system-health-check-full",
  "schedule": "0 0 */4 * * *",
  "command": "/root/.openclaw/workspace/evolver/fixes/system-health-check.sh --full",
  "description": "每 4 小时完整健康检查"
}
```

## 与其他 Skills 配合

### 依赖 Skills
- `system-baseline-config` - 提供基线配置
- `api-balance-monitor` - API 余额监控
- `peak-hours-monitoring` - 高峰期监控
- `api-retry-strategy` - API 重试策略

### 被依赖
- `evolver-log-analysis` - 使用健康评分
- `adaptive-scheduler` - 根据健康评分调整频率
- `evolution-dashboard` - 展示健康趋势

## 告警阈值

### 立即告警 (P0)

| 指标 | 阈值 | 告警方式 |
|------|------|----------|
| 磁盘 | > 90% | DingTalk |
| 内存 | < 100MB | DingTalk |
| 429 错误 | > 50/h | DingTalk |
| 健康评分 | < 4.0 | DingTalk |

### 警告 (P1)

| 指标 | 阈值 | 告警方式 |
|------|------|----------|
| 磁盘 | > 80% | Log |
| 内存 | < 300MB | Log |
| 429 错误 | > 10/h | Log |
| 健康评分 | < 6.0 | Log |

## 历史数据

### 健康趋势

```
日期        平均评分    最佳    最差    趋势
2026-02-25  7.5        11.0   5.0     ⬆️
2026-02-26  7.0        9.5    5.0     ⬆️
2026-02-27  8.0        9.0    7.5     ⬆️
```

### Pattern 解决率

```
日期        总数    已解决    解决率
2026-02-25  25      20        80%
2026-02-26  34      23        68%
2026-02-27  36      27        75%
```

## 最佳实践

1. **定期执行** - 按计划自动执行检查
2. **趋势分析** - 关注长期趋势而非单次结果
3. **预防为主** - 在问题出现前执行维护
4. **持续优化** - 根据历史数据调整阈值

## 故障排除

### 健康评分持续偏低

1. 检查是否有未解决的 Pattern
2. 运行完整维护任务
3. 检查 API 服务状态
4. 考虑系统重启

### API 检查失败

1. 运行 `network-health-check.sh` 详细诊断
2. 检查 API 余额
3. 验证网络连接
4. 考虑备用 provider

---

**创建日期**: 2026-02-27
**来源**: Round 248 - 系统健康整合优化
**版本**: 1.0
**维护者**: OpenClaw EvoAgent
