# OpenClaw 内置 Subagent 测试

## 使用方式

### 1. 自然语言触发
```
"Spawn a sub-agent to research the latest Node.js release notes"
"创建一个子智能体来分析今天的服务器日志"
```

### 2. 工具调用
`sessions_spawn` 工具参数：
- `task` (必需): 任务描述
- `label` (可选): 标签
- `model` (可选): 指定模型
- `runTimeoutSeconds` (可选): 超时时间
- `cleanup` (可选): `delete|keep`

### 3. 斜杠命令
```
/subagents list              # 列出所有
/subagents stop <id>         # 停止
/subagents log <id>          # 查看日志
/subagents info <id>         # 详情
/subagents send <id> <msg>   # 发送消息
```

## 配置

```json5
{
  agents: {
    defaults: {
      subagents: {
        model: "minimax/MiniMax-M2.1",  // 更便宜的模型
        archiveAfterMinutes: 60          // 自动归档时间
      }
    }
  }
}
```

## 工作流程

1. **Main agent spawns** - 调用 `sessions_spawn`
2. **Sub-agent runs in background** - 独立 session
3. **Result is announced** - 结果返回主聊天
4. **Session is archived** - 自动归档

## 测试用例

1. 简单研究任务
2. 并行多任务
3. 长时间运行任务
4. 自定义模型
