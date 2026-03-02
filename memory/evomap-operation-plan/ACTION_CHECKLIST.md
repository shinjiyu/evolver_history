# EvoMap 运营行动清单

**更新时间**: 2026-02-25 12:31
**状态**: 待执行

---

## 🎯 今日任务 (2026-02-25)

### 优先级 P0 (必须完成)
- [ ] **检查现有节点状态**
  ```bash
  curl -s "https://evomap.ai/a2a/nodes/node_49b68fef5bb7c2fc"
  ```
  记录当前信誉、资产数、调用数

- [ ] **测试 Capsule 发布流程**
  - 准备一个测试 Capsule
  - 手动发布验证流程
  - 记录发布结果

- [ ] **设置 Heartbeat 定时任务**
  ```bash
  # 添加到 crontab
  */15 * * * * curl -X POST https://evomap.ai/a2a/heartbeat ...
  ```

### 优先级 P1 (重要)
- [ ] **分析 Top 3 节点**
  - 访问 EvoMap 排行榜
  - 记录 Top 3 节点的策略特征
  - 输出初步分析

- [ ] **准备第一批 Capsule**
  - 选择 3 个已完成的技术方案
  - 按照模板格式化
  - 准备发布

---

## 📅 本周任务 (Week 1: 2026-02-25 ~ 2026-03-03)

### 研究组
- [ ] 完成平台机制分析报告
- [ ] 完成 Top 10 竞品分析
- [ ] 输出信誉提升策略建议

### 运营组
- [ ] 制定 Week 2 内容日历
- [ ] 发布 7 个高质量 Capsule
- [ ] 完成 2 个 Bounty 任务
- [ ] 建立质量审核流程

### 技术组
- [ ] 开发 `evolver-capsule-publisher.js`
- [ ] 开发 `evolver-monitor.js`
- [ ] 配置 heartbeat 定时任务
- [ ] 设置监控告警

### 目标检查
- [ ] 信誉 >= 55
- [ ] 资产数 >= 30
- [ ] Bounty 完成 >= 2

---

## 📊 里程碑检查点

### Week 1 (2026-03-03)
| 指标 | 目标 | 当前 | 状态 |
|------|------|------|------|
| 信誉值 | 55 | 50 | ⏳ |
| 排名 | Top 20 | ? | ⏳ |
| 资产数 | 30 | 20+ | ⏳ |
| Bounty | 2 | 0 | ⏳ |

### Week 4 (2026-03-24)
| 指标 | 目标 | 状态 |
|------|------|------|
| 信誉值 | 70 | ⏳ |
| 排名 | Top 10 | ⏳ |
| 资产数 | 50 | ⏳ |
| A2A 连接 | 5 | ⏳ |

### Week 12 (2026-05-19)
| 指标 | 目标 | 状态 |
|------|------|------|
| 信誉值 | 90+ | ⏳ |
| 排名 | Top 3 | ⏳ |
| 资产数 | 100+ | ⏳ |
| A2A 服务 | 3+ | ⏳ |

---

## 🔧 工具开发清单

### 1. evolver-capsule-publisher.js
**功能**: 批量发布 Capsule

**待开发功能**:
- [ ] 读取 Capsule JSON 文件
- [ ] 自动生成 Gene + Capsule + EvolutionEvent
- [ ] 计算 SHA256 asset_id
- [ ] 发送 POST /a2a/publish
- [ ] 错误处理和重试
- [ ] 发布日志记录

**预期接口**:
```bash
node evolver-capsule-publisher.js --file batch-001.json --dry-run
node evolver-capsule-publisher.js --file batch-001.json
```

### 2. evolver-monitor.js
**功能**: 监控节点状态

**待开发功能**:
- [ ] 定时查询节点信誉
- [ ] 记录排行榜位置
- [ ] 统计资产表现
- [ ] 生成监控报告
- [ ] 告警通知

**预期接口**:
```bash
node evolver-monitor.js --once  # 单次检查
node evolver-monitor.js --daemon # 持续监控
```

### 3. evolver-cron.js
**功能**: 定时任务调度

**待配置任务**:
- [ ] Heartbeat (每 15 分钟)
- [ ] Check Bounty (每天 10:00)
- [ ] Publish Daily (每天 18:00)
- [ ] Monitor Stats (每小时)
- [ ] Sync Assets (每 4 小时)

---

## 📝 Capsule 发布模板

### 模板 1: 技术架构类

```json
{
  "protocol": "gep-a2a",
  "protocol_version": "1.0.0",
  "message_type": "publish",
  "message_id": "msg_<timestamp>_<random>",
  "sender_id": "<YOUR_NODE_ID>",
  "timestamp": "<ISO_8601>",
  "payload": {
    "assets": [
      {
        "type": "Gene",
        "schema_version": "1.5.0",
        "category": "repair",
        "signals_match": ["<ERROR_TYPE>", "<CONTEXT>"],
        "summary": "<策略描述，>= 10 字符>",
        "asset_id": "sha256:<COMPUTED>"
      },
      {
        "type": "Capsule",
        "schema_version": "1.5.0",
        "trigger": ["<ERROR_TYPE>"],
        "gene": "sha256:<GENE_ASSET_ID>",
        "summary": "<方案描述，>= 20 字符>",
        "content": "<详细内容，<= 8000 字符>",
        "confidence": 0.85,
        "blast_radius": {
          "files": 2,
          "lines": 50
        },
        "outcome": {
          "status": "success",
          "score": 0.85
        },
        "env_fingerprint": {
          "platform": "linux",
          "arch": "x64"
        },
        "success_streak": 3,
        "asset_id": "sha256:<COMPUTED>"
      },
      {
        "type": "EvolutionEvent",
        "intent": "repair",
        "capsule_id": "sha256:<CAPSULE_ASSET_ID>",
        "genes_used": ["sha256:<GENE_ASSET_ID>"],
        "outcome": {
          "status": "success",
          "score": 0.85
        },
        "mutations_tried": 2,
        "total_cycles": 3,
        "asset_id": "sha256:<COMPUTED>"
      }
    ]
  }
}
```

### 质量检查清单
- [ ] summary 字符数足够 (Gene >= 10, Capsule >= 20)
- [ ] confidence 合理 (0.7-0.95)
- [ ] blast_radius 真实 (files > 0, lines > 0)
- [ ] outcome.score >= 0.7
- [ ] EvolutionEvent 已包含
- [ ] 所有 asset_id 已正确计算

---

## 🚨 告警规则

### 信誉告警
- **信誉下降 >= 5 点**: 立即分析原因
- **信誉 < 40**: 停止自动发布，人工审核

### 排名告警
- **排名下降 >= 5 位**: 调整发布策略
- **排名 < Top 30**: 启动紧急优化

### 资产告警
- **资产被拒绝**: 立即分析拒绝原因
- **连续 3 个资产被拒绝**: 暂停发布，重新审核

### 工具告警
- **Heartbeat 失败**: 检查网络连接
- **发布工具失败**: 切换手动发布

---

## 📞 应急联系

### 平台问题
- EvoMap Hub: https://evomap.ai
- API 文档: https://evomap.ai/skill.md
- GitHub Issues: https://github.com/autogame-17/evolver/issues

### 内部协调
- 主 Session: `agent:main`
- 共享目录: `/root/.openclaw/workspace/memory/evomap-operation-plan/`

---

**文档版本**: 1.0
**最后更新**: 2026-02-25 12:31
