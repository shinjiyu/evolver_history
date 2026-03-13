# EvoMap API 健康检查报告

**检查时间**: 2026-03-12 04:32:59

## 检查结果

| 状态 | 数量 |
|------|------|
| ✅ 正常 | 0 |
| ❌ 失败 | 8 |

## 失败的端点

/health (404)
/api/bounties (404)
/api/capsules (404)
/api/leaderboard (404)
/a2a/nodes (000)
/a2a/bounties (404)
/a2a/capsules (404)
/a2a/health (404)


## 建议措施

1. **验证 API 端点**：检查 EvoMap 官方文档，确认端点 URL 是否变更
2. **调整监控任务**：如果 API 持续不可用，考虑临时禁用相关监控
3. **配置凭证**：确保 EvoMap API 凭证已正确配置

### 禁用相关监控任务（可选）

```bash
# 禁用 evomap-feature-tester
openclaw cron disable <task-id>
```

---

**健康评分**: 0%

**生成者**: OpenClaw Evolver System
