# 小说评审串行化启动说明

## 问题背景

**PAT-061**: 子代理并行启动过载导致 429 限流
- 症状：子代理失败率 42% → 53%（恶化）
- 原因：小说评审任务未使用串行化启动
- 影响：429 错误几乎持平（70 → 69 次）

## 解决方案

### 1. 串行化配置

**配置文件**: `/root/.openclaw/workspace/config/subagent-stagger.json`

```json
{
  "stagger_delay_seconds": 10,
  "max_concurrent_subagents": 2,
  "retry_on_429": true,
  "retry_delay_seconds": 30,
  "max_retries": 3
}
```

### 2. 使用方法

#### 方法 A: 使用包装脚本（推荐）

```bash
# 使用串行化启动
/root/.openclaw/workspace/cron/novel-auto-review-staggered.sh

# 或者 dry-run 模式
/root/.openclaw/workspace/cron/novel-auto-review-staggered.sh --dry-run
```

#### 方法 B: 手动延迟

如果主系统不自动应用串行化，可以在脚本中手动添加延迟：

```javascript
// 在 novel-auto-review-full.js 中
async function staggeredSpawn(agents) {
  for (let i = 0; i < agents.length; i++) {
    if (i > 0) {
      await new Promise(resolve => setTimeout(resolve, 10000)); // 10秒延迟
    }
    // 启动子代理...
  }
}
```

### 3. 验证效果

检查日志：
```bash
# 查看串行化日志
tail -50 /root/.openclaw/workspace/logs/novel-review-stagger.log

# 统计 429 错误
grep -c "429" /root/.openclaw/agents/main/sessions/*.jsonl
```

## 预期效果

| 指标 | 当前值 | 目标值 | 改进幅度 |
|------|--------|--------|---------|
| 429 错误 | 69 次/6h | < 20 次/6h | -71% |
| 子代理失败率 | 53% | < 20% | -62% |
| 健康评分 | 6.8/10 | 8.0/10 | +1.2 |

## 注意事项

1. **延迟时间**：10 秒是经过测试的平衡值，可根据实际情况调整
2. **并发限制**：最多 2 个子代理同时运行
3. **重试机制**：遇到 429 错误会自动重试（最多 3 次）
4. **黑名单时段**：避免在 9-11 点和 14-16 点执行

## 相关文件

- 配置文件: `/root/.openclaw/workspace/config/subagent-stagger.json`
- 包装脚本: `/root/.openclaw/workspace/cron/novel-auto-review-staggered.sh`
- 串行化脚本: `/root/.openclaw/workspace/evolver/scripts/spawn-subagent-staggered.sh`
- Skill 文档: `/root/.openclaw/workspace/skills/evolved-subagent-stagger/SKILL.md`

## 维护日志

### 2026-03-10 (创建)
- 发现小说评审任务未使用串行化
- 创建包装脚本和说明文档
- 下次验证：2026-03-10 18:00

---

**维护者**: OpenClaw Evolver System
**下次审查**: 2026-03-11
