---
name: subagent-lifecycle-manager
description: 子代理生命周期管理。适用于：(1) 需要创建、监控或终止子代理、(2) 遇到 "Unknown subagent target" 错误、(3) 想要安全地管理子代理生命周期、(4) 需要在执行操作前检查子代理状态。
---

# Subagent Lifecycle Manager - 子代理生命周期管理

安全、可靠地管理 OpenClaw 子代理的完整生命周期，避免 "Unknown subagent target" 错误。

## 核心问题

**PAT-045**: Unknown subagent target
- 出现次数: 2+ 次
- 根本原因:
  1. 子代理已完成并自动清理
  2. 在 kill 前未检查子代理是否存在
  3. 使用过期的子代理 ID

## 生命周期阶段

### 1. 创建阶段

```markdown
## 最佳实践
- 使用 `sessions_spawn` 创建子代理
- 保存返回的 session ID
- 记录子代理的用途和创建时间
```

**示例**:
```javascript
// 创建子代理
const result = await sessions_spawn({
  task: "分析日志并生成报告",
  mode: "run",  // 或 "session"
  agentId: "log-analyzer",
  timeoutSeconds: 600
});

// 保存 ID
const subagentId = result.sessionId;
console.log(`子代理已创建: ${subagentId}`);
```

### 2. 监控阶段

```markdown
## 检查子代理状态
- 使用 `subagents list` 查看活跃子代理
- 定期检查长时间运行的子代理
- 监控资源使用情况
```

**示例**:
```javascript
// 列出所有活跃子代理
const activeSubagents = await subagents({ action: 'list' });

// 检查特定子代理是否存在
const exists = activeSubagents.some(s => s.sessionId === targetId);
```

### 3. 终止阶段（关键）

```markdown
## ⚠️ 黄金法则：终止前必须检查存在性

错误做法：
await subagents({ action: 'kill', target: targetId });

正确做法：
1. 先列出活跃子代理
2. 检查目标是否存在
3. 存在才执行 kill

## 🚨 PAT-050 (Unknown subagent) 根本原因（更新 2026-03-01）
- 56+ 次错误（Round 254-257，增长 115%）
- 根因：在 kill 前未检查存在性
- 解决：必须使用安全终止流程
```

**安全终止流程**:
```javascript
// Step 1: 获取活跃子代理列表
const activeSubagents = await subagents({ action: 'list' });

// Step 2: 检查目标是否存在
const targetExists = activeSubagents.find(s => 
  s.sessionId === targetId || s.label === targetLabel
);

// Step 3: 根据存在性决定操作
if (targetExists) {
  await subagents({ action: 'kill', target: targetId });
  console.log(`✅ 子代理 ${targetId} 已终止`);
} else {
  console.log(`ℹ️ 子代理 ${targetId} 已不存在（可能已完成）`);
  // 可选：清理本地记录
}
```

## 工具使用规范

### subagents 工具

| Action | 用途 | 安全性 |
|--------|------|--------|
| `list` | 列出活跃子代理 | ✅ 安全，可随时调用 |
| `kill` | 终止子代理 | ⚠️ 需先检查存在性 |
| `steer` | 向子代理发送指令 | ⚠️ 需先检查存在性 |

### sessions_spawn 工具

| Mode | 用途 | 自动清理 |
|------|------|----------|
| `run` | 一次性任务 | ✅ 完成后自动清理 |
| `session` | 持久会话 | ❌ 需手动 kill |

## 常见场景

### 场景 1: 等待子代理完成

```javascript
// 创建一次性子代理
const result = await sessions_spawn({
  task: "分析日志",
  mode: "run",
  timeoutSeconds: 600
});

// 不需要手动 kill - run 模式会自动清理
console.log("子代理将在完成后自动清理");
```

### 场景 2: 手动终止长时间运行的子代理

```javascript
// 创建持久会话
const result = await sessions_spawn({
  task: "持续监控",
  mode: "session",
  label: "monitor-001"
});

// ... 一段时间后 ...

// 安全终止
const active = await subagents({ action: 'list' });
if (active.find(s => s.label === "monitor-001")) {
  await subagents({ 
    action: 'kill', 
    target: "monitor-001"  // 可以用 label 或 sessionId
  });
}
```

### 场景 3: 批量清理子代理

```javascript
// 获取所有活跃子代理
const activeSubagents = await subagents({ action: 'list' });

// 按条件筛选（例如：运行时间超过1小时）
const toKill = activeSubagents.filter(s => {
  const runtime = Date.now() - s.createdAt;
  return runtime > 3600000; // 1小时
});

// 逐个安全终止
for (const subagent of toKill) {
  console.log(`终止子代理: ${subagent.sessionId}`);
  await subagents({ action: 'kill', target: subagent.sessionId });
}
```

## 错误处理

### 错误: Unknown subagent target

**原因**: 尝试操作不存在的子代理

**解决方案**:
```javascript
// ❌ 错误做法
try {
  await subagents({ action: 'kill', target: targetId });
} catch (error) {
  // 忽略错误
}

// ✅ 正确做法
const active = await subagents({ action: 'list' });
if (active.find(s => s.sessionId === targetId)) {
  await subagents({ action: 'kill', target: targetId });
} else {
  console.log(`子代理 ${targetId} 已不存在，跳过终止`);
}
```

### 错误: 子代理超时

**原因**: 子代理运行时间超过 timeoutSeconds

**解决方案**:
```javascript
// 增加超时时间
await sessions_spawn({
  task: "复杂分析任务",
  mode: "run",
  timeoutSeconds: 1800  // 30分钟
});
```

## 最佳实践

### ✅ 推荐做法

1. **创建时记录**
   ```javascript
   const subagent = await sessions_spawn({...});
   // 记录到文件或变量
   activeSubagents.set(subagent.sessionId, {
     task: "分析日志",
     createdAt: Date.now()
   });
   ```

2. **终止前检查**
   ```javascript
   const active = await subagents({ action: 'list' });
   const exists = active.find(s => s.sessionId === targetId);
   if (exists) {
     await subagents({ action: 'kill', target: targetId });
   }
   ```

3. **使用 label 便于管理**
   ```javascript
   await sessions_spawn({
     task: "...",
     label: `task-${Date.now()}`  // 唯一标识
   });
   ```

4. **定期清理**
   ```javascript
   // 每4小时检查一次
   setInterval(async () => {
     const active = await subagents({ action: 'list' });
     console.log(`当前活跃子代理: ${active.length} 个`);
   }, 14400000);
   ```

### ❌ 避免做法

1. **不要假设子代理存在**
   ```javascript
   // ❌ 错误
   await subagents({ action: 'kill', target: oldId });
   
   // ✅ 正确
   const active = await subagents({ action: 'list' });
   if (active.find(s => s.sessionId === oldId)) {
     await subagents({ action: 'kill', target: oldId });
   }
   ```

2. **不要频繁创建短生命周期子代理**
   ```javascript
   // ❌ 错误：每个小任务都创建子代理
   for (const file of files) {
     await sessions_spawn({ task: `处理 ${file}` });
   }
   
   // ✅ 正确：批量处理
   await sessions_spawn({ task: `批量处理 ${files.length} 个文件` });
   ```

3. **不要忽略子代理错误**
   ```javascript
   // ❌ 错误
   try {
     await subagents({ action: 'kill', target: id });
   } catch (e) {}
   
   // ✅ 正确
   const active = await subagents({ action: 'list' });
   if (active.find(s => s.sessionId === id)) {
     try {
       await subagents({ action: 'kill', target: id });
     } catch (e) {
       console.error(`终止子代理失败: ${e.message}`);
     }
   }
   ```

## 与其他 Skills 配合

- `safe-operations` - 安全操作检查
- `evolution-verification` - 验证子代理效果
- `log-to-skill` - 分析子代理执行日志

## 相关 Pattern

- **PAT-045**: Unknown subagent target（本 Skill 解决）
- **PAT-044**: Task aborted（需要配合任务恢复机制）

---

**创建日期**: 2026-02-28
**来源**: Round 252 - PAT-045 (Unknown subagent target)
**解决问题**: 2+ 次子代理管理失败
