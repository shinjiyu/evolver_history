# Evolved Permission Guard

## Purpose
自动检测和修复权限配置问题，确保系统各项功能正常运行。

## Problem Patterns
- **PAT-077**: Elevated 权限不可用 → 心跳任务自动化失败
- **PAT-078**: Subagent agentId 限制 → 小说评审功能受限

## Capabilities

### 1. 权限配置检查
- 检查 OpenClaw 配置文件
- 验证 Elevated 权限配置
- 检查 Sessions_spawn 权限策略

### 2. 自动诊断
- 识别权限缺失问题
- 分析根因
- 生成修复建议

### 3. 配置验证
- 验证配置文件格式
- 检查关键配置项
- 提供配置最佳实践

### 4. 修复指导
- 提供详细的修复步骤
- 生成配置模板
- 支持手动和自动修复

## Usage

### 手动执行
```bash
# 运行权限诊断
bash /root/.openclaw/workspace/evolver/fixes/diagnose-permissions.sh

# 查看诊断报告
cat /root/.openclaw/workspace/memory/permission-diagnosis.log
```

### 集成到系统
```bash
# 添加到 Cron 定期检查
# 在 OpenClaw 配置中添加:
{
  "name": "permission-health-check",
  "schedule": "0 0 * * *",
  "command": "bash /root/.openclaw/workspace/evolver/fixes/diagnose-permissions.sh"
}
```

## Integration Points

### 与现有 Skill 协作
- `evolved-cron-health-monitor`: 权限问题影响 Cron 任务
- `subagent-lifecycle-manager`: Subagent 权限管理
- `system-health-orchestrator`: 系统健康检查

### 与日志分析协作
- 在 log-analysis 中包含权限问题检测
- 记录权限错误趋势
- 生成修复建议

## Known Issues

### PAT-077: Elevated 权限不可用
**症状**:
- 错误: `elevated is not available right now (runtime=direct)`
- 心跳任务无法修改 HEARTBEAT.md

**根因**:
- Direct runtime 模式下不支持 elevated 权限
- 需要调整任务执行方式或权限配置

**修复方案**:
1. **方案 A**: 将需要 elevated 的操作移到独立任务
2. **方案 B**: 在 OpenClaw 配置中启用 elevated 支持
3. **方案 C**: 使用 sudo 执行特定操作

### PAT-078: Subagent agentId 限制
**症状**:
- 错误: `agentId is not allowed for sessions_spawn (allowed: none)`
- 小说评审无法创建专业化子代理

**根因**:
- 权限策略不允许指定 agentId
- 当前配置: `allowed: none`

**修复方案**:
1. **方案 A**: 修改权限策略，允许特定 agentId
2. **方案 B**: 使用默认子代理，不指定 agentId
3. **方案 C**: 将功能拆分为独立任务

## Metrics

### 成功指标
- 权限错误: 7 次 → 0 次
- 任务成功率: 95% → 99%
- 自动化覆盖率: 80% → 95%

### 监控指标
- Elevated 权限可用性
- Subagent 创建成功率
- 权限配置变更频率

## Evolution History

### v1.0 - 2026-03-08
- 初始版本
- 支持 Elevated 和 Subagent 权限检查
- 自动诊断和修复建议

## Future Enhancements

1. **自动修复**
   - 自动调整配置文件
   - 自动应用最佳实践
   - 支持回滚机制

2. **智能告警**
   - 权限问题实时通知
   - 严重程度分级
   - 自动升级机制

3. **权限审计**
   - 记录权限变更历史
   - 定期权限审查
   - 安全合规检查

4. **预测性维护**
   - 基于历史数据预测权限问题
   - 提前预警
   - 自动预防措施

## Related Patterns
- PAT-077: Elevated 权限不可用
- PAT-078: Subagent agentId 限制
- PAT-069: Cron 任务执行模式错误

## References
- 诊断脚本: `/root/.openclaw/workspace/evolver/fixes/diagnose-permissions.sh`
- 配置文件: `/root/.openclaw/config.json`
- 权限策略: `/root/.openclaw/policies.json`
