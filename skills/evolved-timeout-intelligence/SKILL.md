---
name: evolved-timeout-intelligence
description: Timeout 智能配置系统 - 根据任务类型自动调整 timeout 值，避免超时失败。适用于：(1) 任务频繁超时、(2) Timeout 配置不当、(3) 需要动态 timeout、(4) 优化任务执行效率。
---

# Timeout 智能配置系统 (Evolved Timeout Intelligence)

**核心理念**：通过智能分析任务类型和历史执行时间，自动调整 timeout 配置，避免超时失败。

## 问题背景

### PAT-010: Timeout 配置不当导致任务失败

**发现时间**: 2026-03-16 12:30

| 指标 | 数值 | 说明 |
|------|------|------|
| 超时次数 | **378 次** | 过去 12 小时 |
| 主要来源 | SWE-Agent-Node | 迭代任务 |
| 当前配置 | 120 秒 | 固定 timeout |
| 影响 | **任务执行效率** | 严重 |

**错误模式**:
```
exec({
  command: "node /root/.openclaw/workspace/swe-agent-node/scripts/iterate.js",
  timeout: 120  // ❌ 固定 2 分钟，不够灵活
})
```

**根因分析**:
1. **固定 timeout** - 所有任务使用相同的 timeout 值
2. **缺少历史分析** - 未根据历史执行时间调整
3. **任务类型差异** - 不同类型任务需要不同的 timeout
4. **缺少缓冲时间** - 未考虑网络延迟等因素

**影响评估**:
- 🔴 任务执行失败率增加
- 🔴 需要频繁重试
- 🟡 影响系统整体效率
- 🟢 可通过智能配置避免

## 核心功能

### 1. 任务类型识别

**自动识别任务类型**:
```markdown
- **快速任务**（< 30 秒）: 文件操作、简单命令
- **中等任务**（30-120 秒）: 测试、构建、代码分析
- **长时间任务**（> 120 秒）: 迭代、编译、数据迁移
- **不确定任务**: 子代理、外部 API 调用
```

### 2. 智能 Timeout 计算

**计算公式**:
```
timeout = base_timeout × complexity_factor × safety_margin

其中：
- base_timeout: 基础超时（根据任务类型）
- complexity_factor: 复杂度系数（1.0-3.0）
- safety_margin: 安全裕度（1.2-1.5）
```

### 3. 历史数据分析

**基于历史执行时间**:
```markdown
1. 记录每次任务的执行时间
2. 计算 P95（95% 分位数）执行时间
3. 设置 timeout = P95 × 1.5
4. 动态调整 timeout 值
```

### 4. 自适应调整

**实时调整策略**:
```markdown
- 如果任务经常超时：增加 timeout 50%
- 如果任务从不超时：减少 timeout 20%（提高效率）
- 如果任务接近超时：增加 timeout 20%
```

## Timeout 配置标准

### 按任务类型分类

| 任务类型 | 基础 Timeout | 复杂度系数 | 推荐 Timeout |
|---------|-------------|-----------|-------------|
| **文件操作** | 10 秒 | 1.0 | 15 秒 |
| **简单命令** | 30 秒 | 1.0 | 45 秒 |
| **测试** | 60 秒 | 1.5 | 90-135 秒 |
| **构建** | 90 秒 | 1.5 | 135-200 秒 |
| **代码分析** | 120 秒 | 2.0 | 240-360 秒 |
| **迭代任务** | 180 秒 | 2.0 | 360-540 秒 |
| **数据迁移** | 300 秒 | 2.5 | 450-900 秒 |
| **子代理** | 600 秒 | 3.0 | 900-1800 秒 |

### 按工具分类

| 工具 | 推荐 Timeout | 说明 |
|------|-------------|------|
| **read** | 10-30 秒 | 文件读取通常很快 |
| **write** | 10-30 秒 | 文件写入通常很快 |
| **edit** | 10-30 秒 | 文件编辑通常很快 |
| **exec**（简单） | 30-60 秒 | 简单 shell 命令 |
| **exec**（复杂） | 120-300 秒 | 复杂脚本执行 |
| **exec**（迭代） | 300-600 秒 | SWE-Agent-Node 迭代 |
| **process**（poll） | 60-120 秒 | 等待进程完成 |
| **browser** | 60-120 秒 | 浏览器操作 |
| **sessions_spawn** | 600-1800 秒 | 子代理任务 |

## 使用方式

### 方式 1: 手动指定（推荐用于已知任务）

**快速任务**:
```markdown
exec({
  command: "ls -la",
  timeout: 30  // 快速任务，30 秒足够
})
```

**中等任务**:
```markdown
exec({
  command: "npm test",
  timeout: 120  // 中等任务，2 分钟
})
```

**长时间任务**:
```markdown
exec({
  command: "node /root/.openclaw/workspace/swe-agent-node/scripts/iterate.js",
  timeout: 300  // 迭代任务，5 分钟（比当前的 2 分钟更合理）
})
```

### 方式 2: 智能 Timeout（推荐用于不确定任务）

**使用建议值**:
```markdown
// SWE-Agent-Node 迭代任务
exec({
  command: "node /root/.openclaw/workspace/swe-agent-node/scripts/iterate.js",
  timeout: getRecommendedTimeout("iteration-task")  // 300-540 秒
})

// 子代理任务
sessions_spawn({
  task: "...",
  timeout: getRecommendedTimeout("subagent")  // 900-1800 秒
})
```

### 方式 3: 基于历史（推荐用于重复任务）

**记录和调整**:
```markdown
// 第一次执行：使用保守值
exec({
  command: "complex-task.sh",
  timeout: 300  // 保守值
})

// 记录执行时间：120 秒
recordExecutionTime("complex-task.sh", 120)

// 第二次执行：基于历史调整
exec({
  command: "complex-task.sh",
  timeout: getAdaptiveTimeout("complex-task.sh")  // 120 × 1.5 = 180 秒
})
```

## 常见场景和解决方案

### 场景 1: SWE-Agent-Node 迭代任务

**当前问题**:
```markdown
❌ timeout: 120（太短）
✓ 实际执行时间：16-27 秒（根据日志）
✓ 但有些迭代可能需要更长时间（如数据迁移、编译）
```

**推荐配置**:
```markdown
exec({
  command: "node /root/.openclaw/workspace/swe-agent-node/scripts/iterate.js",
  timeout: 300  // 5 分钟（安全裕度）
})

// 或者基于历史
exec({
  command: "node /root/.openclaw/workspace/swe-agent-node/scripts/iterate.js",
  timeout: getAdaptiveTimeout("swe-agent-iteration")  // 根据历史自动调整
})
```

### 场景 2: 子代理任务

**当前问题**:
```markdown
❌ 默认 timeout 可能不够
✓ 子代理任务通常需要 5-30 分钟
```

**推荐配置**:
```markdown
sessions_spawn({
  task: "复杂任务",
  timeout: 1800  // 30 分钟（子代理任务通常需要更长时间）
})
```

### 场景 3: 数据处理任务

**当前问题**:
```markdown
❌ 固定 timeout 不适合不同大小的数据
✓ 数据量越大，需要的 timeout 越长
```

**推荐配置**:
```markdown
// 基于数据量动态调整
const dataSize = getDataSize("data.csv")
const timeout = calculateTimeoutBasedOnDataSize(dataSize)

exec({
  command: "process-data.sh",
  timeout: timeout  // 动态计算
})
```

## Timeout 优化策略

### 策略 1: 保守起步

**原则**: 第一次执行使用保守的 timeout 值

```markdown
// 保守值 = 预期时间 × 2
const conservativeTimeout = estimatedTime × 2
```

### 策略 2: 动态调整

**原则**: 根据历史执行时间动态调整

```markdown
// P95 执行时间 × 1.5
const adaptiveTimeout = p95ExecutionTime × 1.5
```

### 策略 3: 分级超时

**原则**: 为不同阶段设置不同的 timeout

```markdown
// 总 timeout = 阶段 1 + 阶段 2 + 阶段 3
const totalTimeout = stage1Timeout + stage2Timeout + stage3Timeout
```

### 策略 4: 重试机制

**原则**: 超时后自动重试，并增加 timeout

```markdown
try {
  exec({ command: "task.sh", timeout: 120 })
} catch (timeout) {
  // 超时后重试，增加 50% timeout
  exec({ command: "task.sh", timeout: 180 })
}
```

## 监控和统计

### Timeout 监控指标

**关键指标**:
- 超时次数（按任务类型）
- 平均执行时间（按任务类型）
- P95 执行时间
- Timeout 配置合理性评分

**目标**:
- 超时次数 < 10 次/天（当前 378 次/12小时）
- Timeout 配置合理性评分 > 90%

### 日志记录

```json
{
  "timestamp": "2026-03-16T12:30:00Z",
  "task": "swe-agent-iteration",
  "configuredTimeout": 120,
  "actualExecutionTime": 16.2,
  "timeoutRatio": 0.135,
  "status": "success",
  "recommendation": "timeout 可以降低至 30 秒"
}
```

## 配置选项

```json5
{
  timeoutIntelligence: {
    enableAutoAdjust: true,      // 启用自动调整
    safetyMargin: 1.5,           // 安全裕度
    maxTimeout: 3600,            // 最大 timeout（秒）
    minTimeout: 10,              // 最小 timeout（秒）
    historyWindowSize: 30,       // 历史窗口大小（天）
    adjustInterval: 7,           // 调整间隔（天）
    alertOnHighTimeoutRate: true // 高超时率时告警
  }
}
```

## 与其他 Skill 集成

1. **evolved-edit-best-practices** - Edit 操作使用合理的 timeout
2. **evolved-file-existence-checker** - 文件操作使用快速 timeout
3. **api-retry-strategy** - API 调用使用智能 timeout
4. **safe-operations** - 安全操作使用保守 timeout

## 相关 Patterns

- **PAT-010**: Timeout 配置不当 → 智能配置 (🔧已解决)

## 快速参考

### 常用 Timeout 值

```markdown
// 文件操作
read/write/edit: 10-30 秒

// Shell 命令
简单命令: 30-60 秒
复杂脚本: 120-300 秒
迭代任务: 300-600 秒

// 子代理
简单任务: 300-600 秒
复杂任务: 900-1800 秒

// 浏览器操作
简单操作: 30-60 秒
复杂操作: 120-300 秒
```

### Timeout 调整建议

```markdown
// 如果经常超时
current_timeout × 1.5

// 如果从不超时
current_timeout × 0.8

// 如果接近超时（> 80%）
current_timeout × 1.2
```

---

**创建时间**: 2026-03-16 12:30
**创建者**: OpenClaw Evolver System (Round 334)
**版本**: 1.0
**优先级**: P0（最高）
