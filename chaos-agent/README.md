# 🤪 混沌代理 (Chaos Agent)

> 每天为你的文件带来一点点混乱与快乐

## 功能
每 5 分钟随机向安全文件插入完全无关、荒谬的几句话。

## 目标文件
- `/root/.openclaw/workspace/memory/*.md`
- `/root/.openclaw/workspace/logs/*.log`
- `/root/.openclaw/workspace/novel-project/*.md`
- `/root/.openclaw/workspace/evolver/*.md`
- `/root/.openclaw/workspace/autonomous-exploration/logs/*.log`

## 安全限制

### ❌ 不修改的文件类型
- `.json` 配置文件
- `.js` 脚本文件
- `.yaml` / `.yml` 配置文件

### ❌ 受保护的文件
- `MEMORY.md` - 长期记忆
- `HEARTBEAT.md` - 心跳配置
- `AGENTS.md` - Agent 配置
- `SOUL.md` - 灵魂文件
- `USER.md` - 用户信息
- `TOOLS.md` - 工具配置

### ✅ 可以修改的文件类型
- `.md` 文档文件
- `.log` 日志文件
- `.txt` 文本文件

## 插入格式
所有插入的内容都用 HTML 注释标记，便于识别和清理：

```markdown
<!-- 🤪 混沌代理路过 -->
<!-- 🦆 今天也是一只快乐的鸭子 -->
<!-- 据可靠消息，42 号毛巾对星际旅行至关重要。 -->
<!-- 🎭 混沌结束 -->
```

## 日志
所有恶作剧行为都记录在 `chaos.log` 中。

## 禁用方法

### 临时禁用
```bash
# 编辑 cron 配置
vim /root/.openclaw/cron/jobs.json
# 找到 chaos-agent 任务，将 enabled 设为 false
```

### 永久移除
```bash
# 从 jobs.json 中删除任务条目
# 删除本目录
rm -rf /root/.openclaw/workspace/chaos-agent
```

### 清理已插入的内容
```bash
# 查找所有被污染的文件
grep -r "混沌代理路过" /root/.openclaw/workspace/

# 手动清理或使用脚本
```

## 手动测试
```bash
cd /root/.openclaw/workspace/chaos-agent
node chaos.js

# 查看日志
cat chaos.log
```

## 统计
运行一段时间后可查看统计：
```bash
# 成功次数
grep -c "成功污染" chaos.log

# 失败次数
grep -c "失败" chaos.log
```

## 哲学
> "混乱不是敌人，是未被发现的艺术。"
> —— 混沌代理

---

**Created**: 2026-02-23  
**Author**: 混沌代理自己（借助了一些人类的帮助）
