# Subagent 集成 OpenClaw Skills 方案

## 问题
Subagent 需要能调用 OpenClaw 现有 Skills，同时保持上下文隔离。

## 方案对比

### 方案 A：HTTP API 调用

```javascript
// 通过 OpenClaw Gateway API 调用
class Subagent {
  async callSkill(skillName, input) {
    const response = await fetch('http://localhost:18789/api/skill/execute', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.token}` },
      body: JSON.stringify({
        skill: skillName,
        input: input,
        context: this.isolatedContext  // 独立上下文
      })
    });
    return response.json();
  }
}
```

**优点**：
- 完全隔离
- 可跨进程

**缺点**：
- 需要 OpenClaw 暴露 API
- 网络开销

---

### 方案 B：Skill 内嵌模式

```javascript
// 创建一个 "subagent-runner" Skill
// SKILL.md
```
# Subagent Runner Skill

当需要执行需要上下文隔离的子任务时使用。

## 输入格式
```json
{
  "role": "researcher",
  "task": "分析这个项目的依赖关系",
  "allowed_skills": ["log-analysis", "neutral-evaluator"],
  "context_isolation": true
}
```

## 执行流程
1. 创建新的上下文
2. 只注入 task 信息
3. 调用 allowed_skills
4. 返回结果（不返回内部上下文）
```

**优点**：
- 不需要修改 OpenClaw
- 直接可用

**缺点**：
- 需要在主上下文中运行

---

### 方案 C：文件触发模式

```javascript
// 将任务写入文件，等待结果
class Subagent {
  async callSkill(skillName, input) {
    const taskId = generateId();
    
    // 1. 写入任务文件
    fs.writeFileSync(`/tmp/openclaw-tasks/${taskId}.json`, {
      skill: skillName,
      input: input,
      isolatedContext: true
    });
    
    // 2. 等待结果文件
    return new Promise((resolve) => {
      const watcher = fs.watch('/tmp/openclaw-results/', (event, filename) => {
        if (filename === `${taskId}.json`) {
          const result = JSON.parse(fs.readFileSync(`/tmp/openclaw-results/${filename}`));
          resolve(result);
          watcher.close();
        }
      });
    });
  }
}
```

**优点**：
- 完全异步
- 可并行

**缺点**：
- 需要额外的任务处理器

---

## 推荐方案：混合模式

1. **短期**：使用方案 B（Skill 内嵌）
   - 快速实现
   - 验证概念

2. **长期**：实现方案 A（HTTP API）
   - 真正的隔离
   - 可扩展

## 实现计划

### Phase 1：Skill 内嵌原型

```bash
/root/.openclaw/workspace/skills/subagent-runner/
├── SKILL.md              # 主定义
├── runner.js             # 执行逻辑
└── templates/
    ├── researcher.md     # 研究 agent 模板
    ├── executor.md       # 执行 agent 模板
    └── reviewer.md       # 评审 agent 模板
```

### Phase 2：HTTP API 集成

需要 OpenClaw 支持：
- `POST /api/session/create` - 创建隔离 session
- `POST /api/skill/execute` - 在指定 session 执行 skill
- `GET /api/session/result` - 获取结果

---

## 验证问题

你想要哪种方式？
1. 先实现 Skill 内嵌版本测试效果？
2. 直接实现 HTTP API 版本？
3. 其他想法？
