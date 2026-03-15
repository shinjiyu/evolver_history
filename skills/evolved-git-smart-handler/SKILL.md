---
name: evolved-git-smart-handler
description: Git 智能处理器 - 自动处理 Git 冲突、stash 管理、安全 pull。适用于：(1) Git pull 冲突、(2) 自动 stash 管理、(3) 进化历史同步、(4) 代码仓库同步。
---

# Git 智能处理器 (Evolved Git Smart Handler)

**核心理念**：智能处理 Git 冲突，确保代码同步稳定可靠。

## 问题背景

### PAT-128: Git Pull 冲突导致同步失败

**发现时间**: 2026-03-16 04:30

| 指标 | 数值 | 说明 |
|------|------|------|
| 错误次数 | **5 次** | Git pull 冲突 |
| 影响时段 | 00:00-04:30 | 多次触发 |
| 影响 | **进化历史无法同步** | 数据丢失风险 |
| 根因 | 未暂存更改 | 缺少自动处理 |

**错误信息**:
```
error: cannot pull with rebase: You have unstaged changes.
error: Please commit or stash them.
fatal: Need to specify how to reconcile divergent branches.
```

**根因分析**:
1. **未暂存更改** - 自动生成的文件未提交
2. **缺少 stash** - 没有自动 stash 机制
3. **分支冲突** - 本地和远程分支分歧
4. **流程不完善** - 缺少智能处理流程

## 核心功能

### 1. 智能 Pull 策略

**自动决策流程**:
```
检查本地状态
  ↓
是否有未暂存更改?
  ├─ 是 → 自动 stash → pull → stash pop
  └─ 否 → 直接 pull
  ↓
是否有冲突?
  ├─ 是 → 自动解决（保留本地/远程/合并）
  └─ 否 → 完成
```

### 2. Stash 智能管理

**Stash 命名规范**:
```bash
# 自动命名格式
git stash push -m "auto-stash-$(date +%Y%m%d-%H%M%S)"
```

**Stash 清理策略**:
- 保留最近 7 天的 stash
- 超过 30 天的 stash 自动清理
- 成功应用后的 stash 自动删除

### 3. 冲突自动解决

**冲突类型和策略**:

| 冲突类型 | 解决策略 | 优先级 |
|---------|---------|--------|
| 进化历史文件 | 保留远程 | 远程优先 |
| 自动生成文件 | 保留本地 | 本地优先 |
| 配置文件 | 合并 | 智能合并 |
| 其他文件 | 提示用户 | 手动处理 |

**自动解决脚本**:
```bash
# 检测冲突文件类型
conflict_type=$(detect_conflict_type $file)

case $conflict_type in
  "evolution-history")
    git checkout --theirs $file  # 保留远程
    ;;
  "auto-generated")
    git checkout --ours $file    # 保留本地
    ;;
  "config")
    merge_config $file            # 智能合并
    ;;
  *)
    echo "Manual resolution needed: $file"
    ;;
esac
```

### 4. 安全检查

**Pull 前检查**:
- [ ] 工作目录是否干净?
- [ ] 是否有未提交的重要更改?
- [ ] 远程仓库是否可达?
- [ ] 网络连接是否正常?

**Pull 后验证**:
- [ ] 代码是否成功拉取?
- [ ] 是否有冲突?
- [ ] 文件完整性检查
- [ ] 功能验证

## 使用方式

### 快速 Pull

```bash
# 智能 pull（自动处理冲突）
bash /root/.openclaw/workspace/evolver/fixes/git-smart-pull.sh
```

### 带参数 Pull

```bash
# 指定仓库路径
bash git-smart-pull.sh --repo /path/to/repo

# 指定分支
bash git-smart-pull.sh --branch main

# 强制 stash（即使没有更改）
bash git-smart-pull.sh --force-stash

# 调试模式
bash git-smart-pull.sh --debug
```

### 仅 Stash 管理

```bash
# 清理过期 stash
bash git-smart-pull.sh --clean-stash

# 查看所有 stash
bash git-smart-pull.sh --list-stash
```

## Cron 集成

**推荐配置**:
```bash
# 每 4 小时自动同步进化历史
0 */4 * * * bash /root/.openclaw/workspace/evolver/fixes/git-smart-pull.sh --repo /root/.openclaw/workspace/evolver_history >> /var/log/git-sync.log 2>&1
```

## 错误处理

### 常见错误和解决方案

#### 1. Unstaged Changes

**错误**:
```
error: cannot pull with rebase: You have unstaged changes.
```

**自动解决**:
```bash
# 自动 stash
git stash push -m "auto-stash-$(date +%Y%m%d-%H%M%S)"

# Pull
git pull --rebase

# Stash pop
git stash pop
```

#### 2. Divergent Branches

**错误**:
```
fatal: Need to specify how to reconcile divergent branches.
```

**自动解决**:
```bash
# 配置 pull 策略
git config pull.rebase false  # merge

# 或使用 rebase
git pull --rebase
```

#### 3. Merge Conflicts

**错误**:
```
CONFLICT (content): Merge conflict in <file>
```

**自动解决**:
```bash
# 检测文件类型
file_type=$(detect_file_type <file>)

# 根据类型选择策略
case $file_type in
  "evolution-history")
    git checkout --theirs <file>
    ;;
  "auto-generated")
    git checkout --ours <file>
    ;;
  *)
    # 保留冲突，提示用户
    echo "Manual resolution needed: <file>"
    ;;
esac
```

## 监控和日志

### 日志记录

**日志位置**: `/var/log/git-smart-pull.log`

**日志格式**:
```
[2026-03-16 04:30:00] INFO: Starting smart pull for /root/.openclaw/workspace/evolver_history
[2026-03-16 04:30:01] INFO: Detected unstaged changes, creating stash: auto-stash-20260316-043001
[2026-03-16 04:30:02] INFO: Pulling from origin/main
[2026-03-16 04:30:03] INFO: Successfully pulled 3 commits
[2026-03-16 04:30:04] INFO: Applying stash: auto-stash-20260316-043001
[2026-03-16 04:30:05] INFO: Smart pull completed successfully
```

### 统计信息

**每日统计**:
- Pull 次数
- Stash 次数
- 冲突次数
- 失败次数

**每周报告**:
```markdown
# Git Smart Pull 周报

**统计周期**: 2026-03-10 ~ 2026-03-16

| 指标 | 数量 | 趋势 |
|------|------|------|
| 总 Pull 次数 | 42 | ↗️ +5% |
| Stash 次数 | 12 | ➡️ 持平 |
| 冲突次数 | 3 | ↘️ -40% |
| 失败次数 | 0 | ✅ 优秀 |

**成功率**: 100%
```

## 最佳实践

### 1. 定期同步

- 每 4 小时自动同步进化历史
- 每天同步一次主要仓库
- 重要更改后立即同步

### 2. Stash 管理

- 使用描述性名称
- 定期清理过期 stash
- 成功应用后立即删除

### 3. 冲突处理

- 优先使用自动解决
- 无法自动解决的提示用户
- 记录所有冲突和解决方案

### 4. 备份策略

- Pull 前自动备份重要文件
- 保留冲突解决的记录
- 定期验证备份完整性

## 配置选项

```json5
{
  gitSmartHandler: {
    autoStash: true,           // 自动 stash
    autoResolveConflicts: true, // 自动解决冲突
    stashRetentionDays: 7,     // Stash 保留天数
    pullStrategy: "rebase",    // Pull 策略 (merge/rebase)
    logLevel: "info",          // 日志级别
    maxRetryAttempts: 3,       // 最大重试次数
    repositories: [
      {
        path: "/root/.openclaw/workspace/evolver_history",
        branch: "main",
        schedule: "0 */4 * * *"
      }
    ]
  }
}
```

## 集成

### 与其他 Skill 集成

1. **evolver-self-evolution** - 同步前自动 pull
2. **evolver-log-analysis** - 日志中记录 Git 操作
3. **system-health-orchestrator** - 监控 Git 同步状态

### API 接口

```bash
# 检查同步状态
curl http://localhost:3000/api/git/status

# 手动触发同步
curl -X POST http://localhost:3000/api/git/sync

# 获取统计信息
curl http://localhost:3000/api/git/stats
```

## 相关 Patterns

- **PAT-128**: Git Pull 冲突 → 智能 Stash (🔧已解决)
- **PAT-015**: 代码同步失败 → 自动重试 (已解决)

---

**创建时间**: 2026-03-16 04:30
**创建者**: OpenClaw Evolver System (Round 332)
**版本**: 1.0
