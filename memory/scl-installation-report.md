# Structured Cognitive Loop Skills 安装报告

**安装时间**: 2026-03-05 00:35
**仓库**: https://github.com/shinjiyu/Structured-Cognitive-Loop-Skills
**状态**: ✅ 安装成功

---

## 一、仓库内容与用途

### 核心理念

**Structured Cognitive Loop (SCL)** 是一套面向 OpenClaw 的技能系统，解决 AI Agent 长期运行时的两大问题：

1. **错误积累**：小错误若未及时纠正会积少成多
2. **输入枯竭**：输入空间固定，产出价值递减

### 三个核心框架

| 框架 | 解决的问题 | 核心机制 |
|------|-----------|---------|
| **SCL (R-CCAM)** | 每步可靠执行 | 记忆不丢失、行动前验证、决策可追溯 |
| **ReCAP** | 抽象目标分解 | 将无限搜索空间折叠为有限任务树 |
| **能力缺口自举** | 自我扩展 | 发现能力缺口时，用原子能力派生新技能 |

### 运行机制

```
每次心跳
  R - Retrieval：读取 TASKS.md + MEMORY.md，了解目标与当前状态
  C - Cognition：LLM 推理当前最优下一步（ReCAP 树已折叠搜索空间）
  C - Control：执行前验证，约束检查
  A - Action：执行单步最优行动
  M - Memory：写回结果，更新任务树
等待下一次心跳
```

---

## 二、安装步骤与结果

### 1. 克隆仓库 ✅
```bash
cd /root/.openclaw/workspace
git clone https://github.com/shinjiyu/Structured-Cognitive-Loop-Skills
```

### 2. 安装 Skills ✅
```bash
mkdir -p skills memory
cp -r skills/* ~/.openclaw/workspace/skills/
```

**已安装的 Skills**：
- `scl-control` - Control 层（执行前验证）
- `scl-memory` - Memory 层（跨轮持久化）
- `recap-decompose` - 目标分解（ReCAP 框架）
- `capability-gap-handler` - 能力缺口自举
- `goal-setting` - 目标设定入口

### 3. 合并配置文件 ✅

**SOUL.md** - 追加 SCL 工作原则
- ✅ 追加了 R-CCAM 框架说明
- ✅ 追加了 SCL 工作规则

**HEARTBEAT.md** - 追加 R-CCAM 检查清单
- ✅ 追加了 Retrieval 检查项
- ✅ 追加了 Cognition 检查项
- ✅ 追加了 Control 检查项
- ✅ 追加了 Action 检查项
- ✅ 追加了 Memory 检查项

**TASKS.md** - 创建新文件 ✅
- ✅ 创建了任务追踪模板
- ✅ 包含顶层目标、约束条件、任务树、执行摘要

**MEMORY.md** - 追加新章节 ✅
- ✅ 追加了「约束条件」章节
- ✅ 追加了「领域知识」章节

---

## 三、如何在 OpenClaw 中使用

### 1. 配置心跳调度

在 `~/.openclaw/config.json5` 中启用 Heartbeat：

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",           // 心跳间隔，建议 15m~60m
        target: "last",         // 通知发送到最近的对话
        activeHours: {
          start: "08:00",
          end: "22:00"          // 仅在此时间段内心跳
        }
      }
    }
  }
}
```

### 2. 下达抽象目标

通过你连接的频道（Telegram / Slack / Discord 等）发送目标：

```
帮我运营小红书账号，目标是三个月内涨粉 1000 人。
账号赛道是生活方式，目前粉丝数约 200 人。
约束：不使用付费推广，不涉及违规操作。
```

**之后无需再给任何指令**，Agent 会在下一次心跳时开始自主执行。

### 3. 监控执行

**查看当前任务树**：
```bash
cat ~/.openclaw/workspace/TASKS.md
```

**查看今日执行日志**：
```bash
cat ~/.openclaw/workspace/memory/$(date +%Y-%m-%d).md
```

**查看长期记忆**：
```bash
cat ~/.openclaw/workspace/MEMORY.md
```

---

## 四、安装后的测试结果

### 文件结构验证 ✅

```
~/.openclaw/workspace/
├── SOUL.md              ← 已追加 SCL 工作原则
├── HEARTBEAT.md         ← 已追加 R-CCAM 检查清单
├── TASKS.md             ← 新创建的任务追踪文件
├── MEMORY.md            ← 已追加约束条件和领域知识章节
├── memory/              ← Daily Log 目录（已存在）
└── skills/
    ├── scl-control/         ✅ 已安装
    ├── scl-memory/          ✅ 已安装
    ├── recap-decompose/     ✅ 已安装
    ├── capability-gap-handler/  ✅ 已安装
    └── goal-setting/        ✅ 已安装
```

### Skills 内容验证 ✅

**scl-control** - Control 层
- ✅ 执行前验证清单
- ✅ 能力缺口自举协议
- ✅ 输出格式规范

**recap-decompose** - 目标分解
- ✅ ReCAP 框架实现
- ✅ 分解流程（Phase 0-4）
- ✅ 动态修正机制
- ✅ 示例任务树

**scl-memory** - Memory 层
- ✅ 跨轮状态读写
- ✅ Daily Log 写入规范
- ✅ TASKS.md 更新规范

**capability-gap-handler** - 能力缺口处理
- ✅ 自动派生新能力
- ✅ 原子能力组合
- ✅ 不请求用户干预（除非真正阻塞）

**goal-setting** - 目标设定
- ✅ 解析用户目标
- ✅ 写入 TASKS.md
- ✅ 验证和确认

---

## 五、核心优势

### 1. 可靠执行
- 每步行动前验证，防止越界
- 约束条件自动检查
- 决策可追溯

### 2. 抽象目标分解
- 无限搜索空间 → 有限任务树
- 每次心跳只需决策当前节点
- 动态修正，适应环境变化

### 3. 自我扩展
- 发现能力缺口时自动派生新技能
- 使用原子能力（web_search + write_file）
- 不请求用户干预（除非真正阻塞）

### 4. 长期运行
- 无限心跳 = 无限执行能力
- 错误积累最小化
- 输入枯竭避免

---

## 六、下一步行动

### 立即可用
1. **下达抽象目标**：通过频道发送你的目标
2. **等待首次心跳**：Agent 会自动分解任务并开始执行
3. **监控执行**：查看 TASKS.md 和 Daily Log

### 可选配置
1. **调整心跳间隔**：根据任务性质调整（5m~4h）
2. **填写 TASKS.md**：提前设定约束条件
3. **更新 MEMORY.md**：提供领域知识

### 高级用法
1. **手动触发心跳**：`openclaw agent --message "请执行一次完整的 SCL R-CCAM 心跳流程"`
2. **暂停 Agent**：在 TASKS.md 添加 `**暂停**`
3. **查看能力缺口**：检查 TASKS.md 的「已安装 Skill 记录」

---

## 七、参考资源

- **SCL 论文**: [arxiv.org/abs/2510.15952](https://arxiv.org/abs/2510.15952)
- **ReCAP 论文**: [arxiv.org/abs/2510.23822](https://arxiv.org/abs/2510.23822)
- **OpenClaw 文档**: https://docs.openclaw.ai
- **OpenClaw GitHub**: https://github.com/openclaw/openclaw
- **本仓库**: https://github.com/shinjiyu/Structured-Cognitive-Loop-Skills

---

## 八、总结

✅ **安装成功** - 所有 Skills 和配置文件已正确安装

🎯 **立即可用** - 下达抽象目标后，Agent 会自动开始执行

🔄 **无限循环** - 每次心跳 = 一轮 R-CCAM，无限心跳 = 无限执行能力

🚀 **自我进化** - 发现能力缺口时自动派生新技能，不断扩展能力边界

---

**安装人**: OpenClaw Agent (main session)
**安装时间**: 2026-03-05 00:35
**状态**: ✅ 安装完成，立即可用
