# EvoMap Bounty 提交问题诊断报告

**日期**: 2026-02-22 00:50
**节点 ID**: `node_openclaw_8753c360ebc59afe`
**Claim URL**: https://evomap.ai/claim/P3DE-4U48

---

## 🔍 问题诊断

### 1. 发布端点 502 错误
```
POST /a2a/publish → HTTP 502 Bad Gateway
POST /a2a/task/list → HTTP 502 Bad Gateway
```

**原因**: EvoMap 服务器的 publish 和 task 端点当前不可用或有问题。

### 2. 提交历史分析

从 `bounty-history.jsonl` 看到有 9 次提交记录：
- ✅ **6 次成功**: `success: true`
- ❌ **3 次失败**: `success: false` (有 gene_id 和 capsule_id，但未被接受)

失败的任务：
1. `cmlwh2ubf0003lm010y114ihd` - 稳定大模型情绪 (2 cr)
2. `cmlwcglkz000fo4013f6vw5kg` - 深度学习方法 (1 cr)
3. `cmlwassgs000bo8015x32ektc` - 雅思学习计划 (1 cr)

### 3. 自动提交脚本问题

`auto-bounty.js` 的提交逻辑存在问题：
- 直接调用 `/a2a/publish` 发布 capsule
- **没有先认领 bounty 任务** (`POST /task/claim`)
- **没有完成 bounty 流程** (`POST /task/complete`)

正确的 bounty 完整流程：
```
1. POST /a2a/fetch (include_tasks: true) → 获取任务列表
2. POST /task/claim { task_id, node_id } → 认领任务
3. POST /a2a/publish { assets: [Gene, Capsule, EvolutionEvent] } → 发布解决方案
4. POST /task/complete { task_id, asset_id, node_id } → 完成任务
```

当前脚本缺少步骤 2 和步骤 4！

### 4. 为什么用户看不到资产

**主要原因**:
1. **发布端点 502** - 提交无法到达服务器
2. **未完成 bounty 流程** - 只发布了 capsule，没有 claim 和 complete
3. **capsule 可能是候选状态** - 未被 promoted，不在用户可见的资产列表中

---

## 📊 当前状态

| 指标 | 值 |
|------|-----|
| 节点状态 | ✅ 在线 (hub_0f978bbe1fb5) |
| 心跳正常 | ✅ 最近心跳成功 |
| 发布端点 | ❌ 502 错误 |
| 已处理 bounty | 9 个 |
| 统计显示成功 | 6 个 |
| 实际可见资产 | 0 个 (待确认) |

---

## 🔧 修复建议

### 短期修复

1. **等待 EvoMap 恢复**
   - 502 错误可能是 EvoMap 服务器临时问题
   - 可以稍后重试

2. **手动测试提交流程**
   ```bash
   # 测试 claim 端点
   curl -X POST "https://evomap.ai/task/claim" \
     -H "Content-Type: application/json" \
     -d '{"task_id": "xxx", "node_id": "node_openclaw_8753c360ebc59afe"}'
   
   # 测试 publish 端点
   curl -X POST "https://evomap.ai/a2a/publish" \
     -H "Content-Type: application/json" \
     -d '{完整的 GEP-A2A 协议包}'
   ```

### 中期修复

1. **修改 auto-bounty.js**
   - 添加 `/task/claim` 步骤
   - 添加 `/task/complete` 步骤
   - 处理 502 错误和重试逻辑

2. **正确计算 asset_id**
   - 使用 canonical JSON 序列化
   - SHA256 哈希计算
   - 确保包含所有必要字段

3. **添加 EvolutionEvent**
   - 每个 bundle 应包含 Gene + Capsule + EvolutionEvent
   - 缺少 EvolutionEvent 会有 -6.7% GDI 惩罚

### 长期优化

1. **改进错误处理**
   - 捕获 502 错误
   - 记录失败原因
   - 实现自动重试

2. **状态同步**
   - 定期检查已发布资产状态
   - 验证资产是否被 promoted
   - 更新本地统计

---

## 📝 相关文件

| 文件 | 用途 |
|------|------|
| `/root/.openclaw/workspace/evolver/auto-bounty.js` | 自动 bounty 处理脚本 |
| `/root/.openclaw/workspace/memory/bounty-history.jsonl` | 提交历史记录 |
| `/root/.openclaw/workspace/memory/bounty-state.json` | 当前状态 |
| `/root/.openclaw/workspace/evolver/heartbeat.log` | 心跳日志 |

---

## 下一步

1. 联系 EvoMap 团队确认 502 问题
2. 修改 auto-bounty.js 实现完整的 bounty 流程
3. 等待服务恢复后重新提交


<!-- 🤪 混沌代理路过 -->
<!-- 这个文件没有 bug，只有随机特性。🎲 -->
<!-- 🎭 混沌结束 -->
