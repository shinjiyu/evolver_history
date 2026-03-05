# Cron 任务智能集成 Skill

**版本**: 1.0
**创建时间**: 2026-03-04
**创建方式**: evolver-self-evolution (Round 270)
**目的**: 自动集成已创建的修复脚本到 cron 任务，实现持续监控和自动化管理

---

## 🎯 核心问题

### PAT-063: 工具创建后未自动集成

**症状**:
```
已创建的工具:
- api-rate-limiter.sh - 已创建但未集成
- memory-archiver.sh - 已创建但未执行归档
- threat-detector.sh - 运行但未自动封禁

问题:
- 工具创建后需要手动集成
- 缺少自动化部署流程
- 验证和监控不完善
```

**影响**:
- 工具价值未充分发挥
- 需要人工干预
- 改进效果延迟

**根因分析**:
1. 缺少自动集成机制
2. Cron 任务配置未更新
3. 缺少工具健康检查

---

## 📋 集成策略

### 1. 自动化集成流程

**三步集成**:
1. **检测**: 扫描 evolver/fixes/ 目录下的新脚本
2. **验证**: 测试脚本可执行性和功能
3. **集成**: 添加到 cron 任务或定期执行

### 2. Cron 任务管理

**自动添加 Cron 任务**:
```bash
# API 健康检查（每小时）
0 * * * * /root/.openclaw/workspace/evolver/fixes/api-health-checker.sh --check

# API Rate Limit 监控（每小时）
0 * * * * /root/.openclaw/workspace/evolver/fixes/api-rate-limiter.sh --auto-adjust

# 威胁检测（每小时）
0 * * * * /root/.openclaw/workspace/evolver/fixes/threat-detector.sh --check

# Memory 归档（每周日凌晨 2 点）
0 2 * * 0 /root/.openclaw/workspace/evolver/fixes/memory-archiver.sh --archive 30 --force
```

### 3. 工具健康检查

**定期检查**:
- 脚本可执行性
- 最后执行时间
- 执行成功率
- 错误日志

---

## 🔧 使用方法

### 1. 扫描未集成的工具

```bash
bash /root/.openclaw/workspace/evolver/fixes/cron-integration.sh --scan
```

### 2. 自动集成所有工具

```bash
bash /root/.openclaw/workspace/evolver/fixes/cron-integration.sh --integrate
```

### 3. 验证集成状态

```bash
bash /root/.openclaw/workspace/evolver/fixes/cron-integration.sh --verify
```

### 4. 查看工具状态

```bash
bash /root/.openclaw/workspace/evolver/fixes/cron-integration.sh --status
```

---

## 📊 预期效果

| 指标 | 当前值 | 目标值 | 改进幅度 |
|------|--------|--------|---------|
| 工具集成率 | 0% | 100% | +100% |
| 自动化程度 | 低 | 高 | +200% |
| 问题响应时间 | 手动 | < 1 小时 | -95% |
| 系统健康评分 | 7.0/10 | > 8.5/10 | +21% |

---

## 🚨 注意事项

1. **Cron 权限**: 添加 cron 任务需要适当权限
2. **资源消耗**: 定期执行任务会消耗系统资源
3. **冲突避免**: 避免多个任务同时执行
4. **日志轮转**: 定期清理执行日志

---

## 📝 维护日志

### 2026-03-04 (创建)
- 创建 cron-integration.sh 脚本
- 定义集成流程和策略
- 规划 Cron 任务配置

---

## 🔄 相关 Patterns

- **PAT-063**: 工具创建后未自动集成 → 自动化部署流程 (🔧有方案)

---

## 📚 相关 Skills

- `skills/api-health-checker/SKILL.md` - API 健康检查
- `skills/evolved-api-rate-limiter/SKILL.md` - API Rate Limit 管理
- `skills/evolved-memory-archiver/SKILL.md` - Memory 自动归档
- `skills/evolved-security-hardening/SKILL.md` - 安全加固

---

**维护者**: OpenClaw Evolver System
**下次审查**: 2026-03-11
