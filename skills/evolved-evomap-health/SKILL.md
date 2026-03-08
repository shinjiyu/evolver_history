# Evolved EvoMap Health Monitor

## Purpose
持续监控 EvoMap Hub 的健康状态，包括服务可用性、API 端点、认证状态等。

## Problem Pattern
- **Pattern ID**: PAT-068
- **问题**: EvoMap API 端点持续返回 404
- **根因**: 401 认证失败，缺少 API Key 配置
- **影响**: 监控脚本无法正常工作，无法检测真实问题

## Capabilities

### 1. 服务健康检查
- 检查 EvoMap 服务是否运行（端口 3000, 8080）
- 测试 /health 端点
- 验证服务响应时间

### 2. API 端点验证
- 测试所有关键 API 端点
- 检测认证问题（401 vs 404）
- 提供修复建议

### 3. 认证配置检查
- 检查 .env 文件中的 API Key
- 验证 config.json 中的认证设置
- 提供配置指导

### 4. 自动修复
- 检测配置缺失
- 生成修复脚本
- 提供详细的修复步骤

## Usage

### 手动执行
```bash
# 运行健康检查
bash /root/.openclaw/workspace/evolver/fixes/fix-evomap-auth.sh

# 查看日志
cat /root/.openclaw/workspace/memory/evomap-health.log
```

### 集成到 Cron
```json
{
  "name": "evomap-health-check",
  "schedule": "0 */6 * * *",
  "command": "bash /root/.openclaw/workspace/evolver/fixes/fix-evomap-auth.sh",
  "target": "isolated"
}
```

## Integration Points

### 与现有 Skill 协作
- `evolved-cron-health-monitor`: 将此检查集成到 cron 监控中
- `evolution-verification`: 验证 EvoMap 进化效果
- `network-error-monitor`: 监控网络相关错误

### 与日志分析协作
- 在 log-analysis 中包含 EvoMap 健康状态
- 记录 API 错误趋势
- 生成修复建议

## Metrics

### 成功指标
- API 端点成功率: 0% → 100%
- 认证配置完成率: 0% → 100%
- 问题检测时间: 24h+ → <1h

### 监控指标
- 服务可用性
- API 响应时间
- 认证状态
- 错误频率

## Evolution History

### v1.0 - 2026-03-08
- 初始版本
- 基础健康检查
- 认证配置验证
- 修复脚本生成

## Future Enhancements

1. **自动配置修复**
   - 自动生成 API Key
   - 自动更新 .env 文件
   - 自动重启服务

2. **智能告警**
   - 集成钉钉/邮件通知
   - 分级告警（warning/critical）
   - 自动升级机制

3. **性能监控**
   - API 响应时间追踪
   - 请求成功率统计
   - 容量规划建议

4. **预测性维护**
   - 基于历史数据预测问题
   - 提前预警
   - 自动扩容建议

## Related Patterns
- PAT-068: EvoMap API 404
- PAT-069: Cron 任务执行模式错误
- P008: 磁盘使用率偏高

## References
- 修复脚本: `/root/.openclaw/workspace/evolver/fixes/fix-evomap-auth.sh`
- 日志文件: `/root/.openclaw/workspace/memory/evomap-health.log`
- 配置文件: `/root/.openclaw/workspace/evomap/.env`
