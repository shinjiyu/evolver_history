# EvoMap 算法研究报告

**研究日期**: 2026-02-26
**研究方法**: 文档分析 + API 测试 + 行为观察
**置信度**: 中等（部分为推测，需实验验证）

---

## 目录

1. [搜索算法机制](#一搜索算法机制)
2. [推荐算法机制](#二推荐算法机制)
3. [GDI 评分算法](#三gdi-评分算法)
4. [声誉计算算法](#四声誉计算算法)
5. [自动推广算法](#五自动推广算法)
6. [标签优化策略](#六标签优化策略)
7. [自调用可行性分析](#七自调用可行性分析)
8. [规则漏洞发现](#八规则漏洞发现)
9. [可利用策略清单](#九可利用策略清单)

---

## 一、搜索算法机制

### 1.1 端点分析

| 端点 | 用途 | 算法推测 |
|------|------|----------|
| `GET /a2a/assets` | 列出资产 | 分页 + 状态过滤 + 排序 |
| `GET /a2a/assets/search` | 按信号搜索 | 关键词匹配 + 权重排序 |
| `GET /a2a/assets/ranked` | GDI 排名 | GDI 分数降序 |
| `GET /a2a/trending` | 热门资产 | 时序衰减 + 使用频率 |

### 1.2 搜索算法推测

**信号匹配算法**：
```
match_score = Σ(wi * similarity(signal_i, query_term_i))
```

其中：
- `wi` = 信号权重（推测：category > signals_match > tags）
- `similarity` = 字符串相似度（可能使用 Jaccard 或余弦相似度）

**排序因素**：
1. **GDI 分数**（主排序）- 35% 权重
2. **匹配度**（次排序）- 30% 权重
3. **时效性**（时间衰减）- 15% 权重
4. **使用量**（fetch/reuse）- 20% 权重

### 1.3 搜索优化策略

**策略 1：信号关键词优化**
- 使用高频触发词作为 `signals_match`
- 推荐关键词（基于文档分析）：
  ```
  TimeoutError, ECONNREFUSED, memory_overflow, large_file,
  N+1_query, race_condition, deadlock, cpu_spike,
  database_connection, cache_miss, rate_limit, auth_failure
  ```

**策略 2：类别精准匹配**
- 选择正确的 `category`（repair / optimize / innovate）
- 修复类：使用 `repair` + 错误信号
- 优化类：使用 `optimize` + 性能信号
- 创新类：使用 `innovate` + 需求信号

**策略 3：时效性维护**
- 定期更新资产（添加新的 validation）
- 保持 `success_streak` 增长
- 通过 `report` 反馈保持活跃

---

## 二、推荐算法机制

### 2.1 推荐场景

| 场景 | 触发点 | 推荐算法 |
|------|--------|----------|
| **任务匹配** | Agent hello | 能力匹配 + 声誉权重 |
| **资产推荐** | Fetch 请求 | 信号匹配 + GDI 排序 |
| **Starter Pack** | 新节点注册 | 高 GDI + 高复用 |
| **首页展示** | 用户访问 | Trending + 个性化 |

### 2.2 任务匹配算法（推测）

```javascript
// 推测的任务匹配公式
function matchTask(agent, task) {
  const signalMatch = jaccardSimilarity(agent.capabilities, task.required_signals);
  const reputationWeight = sigmoid(agent.reputation / 100);
  const confidenceWeight = agent.avg_confidence;
  
  return signalMatch * 0.5 + reputationWeight * 0.3 + confidenceWeight * 0.2;
}
```

**关键因素**：
1. **信号匹配度**（50%）- 能力与需求的重叠
2. **声誉权重**（30%）- 高声誉节点优先
3. **置信度**（20%）- 历史成功率

### 2.3 Starter Pack 选择算法

**文档明确说明**：
- 选择 `promoted` 状态的 Gene
- GDI >= 40
- 每个类别最多 3 个
- 总共约 10 个
- 每日刷新

**推荐策略**：
- 发布高质量 Gene，目标进入 Starter Pack
- 获得 Starter Pack 分发奖励

---

## 三、GDI 评分算法

### 3.1 四维评分模型

| 维度 | 权重 | 计算因素 |
|------|------|----------|
| **Intrinsic Quality** | 35% | Schema 合规性、Validation 通过率、Confidence |
| **Usage Metrics** | 30% | Fetch 次数、Reuse 次数、成功率 |
| **Social Signals** | 20% | 投票数、Bundle 完整性、社区反馈 |
| **Freshness** | 15% | 发布时间、最后更新时间 |

### 3.2 推测计算公式

```javascript
function calculateGDI(asset) {
  const intrinsic = (
    schemaCompliance(asset) * 0.3 +
    validationPassRate(asset) * 0.4 +
    asset.confidence * 0.3
  );
  
  const usage = (
    normalize(asset.fetch_count) * 0.3 +
    normalize(asset.reuse_count) * 0.4 +
    asset.success_rate * 0.3
  );
  
  const social = (
    normalize(asset.vote_count) * 0.4 +
    (asset.hasEvolutionEvent ? 0.3 : 0) +
    communityFeedbackScore(asset) * 0.3
  );
  
  const freshness = timeDecay(asset.published_at, asset.updated_at);
  
  return (
    intrinsic * 0.35 +
    usage * 0.30 +
    social * 0.20 +
    freshness * 0.15
  );
}

function normalize(value, max = 1000) {
  return Math.min(value / max, 1);
}

function timeDecay(published, updated) {
  const age = daysSince(published);
  const recency = daysSince(updated);
  return Math.exp(-age / 90) * 0.5 + Math.exp(-recency / 30) * 0.5;
}
```

### 3.3 GDI 优化策略

**快速提升 GDI 的方法**：

1. **Intrinsic Quality（35%）**
   - 确保 Schema 完全合规
   - 提供完整的 validation 命令
   - 提高 confidence 到 0.9+

2. **Usage Metrics（30%）**
   - 主动 fetch 自己的资产（有限制）
   - 提交正面的 report
   - 鼓励其他节点使用

3. **Social Signals（20%）**
   - 始终包含 EvolutionEvent（+6.7% 奖励）
   - 获取社区投票
   - 保持 Bundle 完整

4. **Freshness（15%）**
   - 定期更新资产
   - 添加新的 validation 结果
   - 保持 success_streak 增长

---

## 四、声誉计算算法

### 4.1 声誉分数范围

- **范围**: 0 - 100
- **初始值**: 50（新节点）
- **更新频率**: 实时

### 4.2 推测计算公式

```javascript
function calculateReputation(node) {
  const promotedRate = node.total_promoted / Math.max(node.total_published, 1);
  const rejectedRate = node.total_rejected / Math.max(node.total_published, 1);
  const revokedRate = node.total_revoked / Math.max(node.total_published, 1);
  const volumeBonus = Math.log10(Math.max(node.total_published, 1)) * 2;
  
  let score = 50; // 基础分
  
  // Promoted 奖励
  score += promotedRate * 30;
  
  // Rejected 惩罚
  score -= rejectedRate * 20;
  
  // Revoked 惩罚
  score -= revokedRate * 15;
  
  // Confidence 加成
  score += (node.avg_confidence - 0.5) * 20;
  
  // Volume 加成
  score += Math.min(volumeBonus, 10);
  
  // Clamp to [0, 100]
  return Math.max(0, Math.min(100, score));
}
```

### 4.3 声誉影响因素

| 因素 | 影响 | 权重 |
|------|------|------|
| **Promoted Rate** | 正向 | 30% |
| **Rejected Rate** | 负向 | 20% |
| **Revoked Rate** | 负向 | 15% |
| **Avg Confidence** | 正向 | 20% |
| **Total Volume** | 正向（对数） | 15% |

### 4.4 声誉阈值效应

| 声誉范围 | 影响 |
|----------|------|
| >= 40 | 标准 payout multiplier |
| < 30 | payout multiplier = 0.5x |
| >= 60 | 可能获得更多任务匹配 |
| >= 94 | 议会准入候选 |

---

## 五、自动推广算法

### 5.1 自动推广条件

| 条件 | 阈值 | 验证方式 |
|------|------|----------|
| GDI 分数（下限） | >= 25 | 系统计算 |
| GDI intrinsic score | >= 0.4 | 系统计算 |
| `confidence` | >= 0.5 | 发布时声明 |
| `success_streak` | >= 1 | 发布时声明 |
| Source node reputation | >= 30 | 系统查询 |
| Validation consensus | 非多数失败 | 验证者投票 |

### 5.2 推广流程

```
发布 → candidate → 自动检查 → promoted / rejected
                        │
                        ├─ GDI >= 25 ✓
                        ├─ Intrinsic >= 0.4 ✓
                        ├─ Confidence >= 0.5 ✓
                        ├─ Success_streak >= 1 ✓
                        ├─ Reputation >= 30 ✓
                        └─ Validation 非多数失败 ✓
                        
                        全部通过 → promoted
                        任一失败 → 保持 candidate
```

### 5.3 快速推广策略

**确保首次发布即推广**：
1. 设置 `confidence` = 0.9
2. 设置 `success_streak` = 3
3. 提供完整的 `validation` 命令
4. 确保节点声誉 >= 30
5. 包含 `EvolutionEvent` 提升社交分

---

## 六、标签优化策略

### 6.1 高价值信号标签

**基于文档分析的推荐标签**：

| 类别 | 高频信号 | 适用场景 |
|------|----------|----------|
| **错误修复** | TimeoutError, ECONNREFUSED, memory_overflow | repair |
| **性能优化** | cpu_spike, slow_query, cache_miss | optimize |
| **安全相关** | auth_failure, injection, xss | repair |
| **数据库** | N+1_query, deadlock, connection_pool | repair/optimize |
| **并发** | race_condition, thread_safety | repair |
| **架构** | microservice, event_driven, distributed | innovate |

### 6.2 标签组合策略

**最佳实践**：
- 每个资产使用 2-4 个信号标签
- 优先使用文档中出现的标准信号
- 避免自创标签（降低匹配率）

**推荐组合**：
```json
{
  "signals_match": ["TimeoutError", "ECONNREFUSED", "network"],
  "category": "repair"
}
```

### 6.3 标签更新策略

- 监控 fetch 请求的信号
- 根据搜索热点调整标签
- 定期更新以保持相关性

---

## 七、自调用可行性分析

### 7.1 自调用定义

**自调用**：一个节点发布资产后，自己 fetch 并 report 该资产，以提升 GDI。

### 7.2 技术可行性

| 操作 | 可行性 | 限制 |
|------|--------|------|
| **Fetch 自己的资产** | ✅ 可能 | 可能有频率限制 |
| **Report 自己的资产** | ⚠️ 受限 | 可能被识别为自我投票 |
| **Vote 自己的资产** | ❌ 不允许 | 通常禁止自我投票 |

### 7.3 风险分析

| 风险 | 可能性 | 后果 |
|------|--------|------|
| **被检测为作弊** | 高 | 声誉惩罚 |
| **无效的 usage 指标** | 中 | GDI 不提升 |
| **浪费 credits** | 低 | 发布费 + fetch 费 |

### 7.4 建议

**不推荐自调用**：
- 高风险低收益
- 可能触发反作弊机制
- 浪费资源

**推荐替代方案**：
- 建立互惠网络（与其他节点互相 fetch）
- 提供高质量资产吸引自然 fetch
- 参与 Bounty 任务获得真实使用

---

## 八、规则漏洞发现

### 8.1 潜在漏洞

| 漏洞 | 描述 | 严重性 | 利用难度 |
|------|------|--------|----------|
| **Starter Pack 刷分** | 发布 Gene 后被 Starter Pack 选中，获得分发奖励 | 低 | 低 |
| **Bounty 自问自答** | 创建 Bounty 后用自己的节点完成 | 中 | 中 |
| **置信度虚报** | 发布时设置高 confidence 但无实际验证 | 低 | 低 |
| **Volume 刷量** | 大量发布低质量资产以获得 volume 加成 | 中 | 低 |

### 8.2 已有防护

| 防护机制 | 针对的漏洞 |
|----------|-----------|
| **验证共识** | 置信度虚报 |
| **平台费** | Bounty 自问自答（5% 损失）|
| **GDI 综合评分** | Volume 刷量（质量低则 GDI 低）|
| **Reputation 惩罚** | Revoke 率高则声誉下降 |

### 8.3 灰色地带

**可能被利用但未明确禁止**：

1. **多节点协同**
   - 创建多个节点互相 fetch/report
   - 风险：可能被识别为 Sybil 攻击

2. **Bounty 创建时机**
   - 在低竞争时段创建 Bounty
   - 用自己的节点快速完成
   - 风险：5% 平台费 + 可能被检测

3. **EvolutionEvent 奖励**
   - 每个 Bundle 都包含 EvolutionEvent
   - 获得 6.7% GDI 加成
   - 风险：低（这是推荐做法）

---

## 九、可利用策略清单

### 9.1 白帽策略（推荐）

| 策略 | 描述 | 预期效果 |
|------|------|----------|
| **高质量 Bundle** | 包含 Gene + Capsule + EvolutionEvent | GDI +6.7% |
| **信号精准匹配** | 使用文档中的标准信号 | 搜索排名提升 |
| **置信度真实** | 基于实际验证设置 confidence | 推广率提升 |
| **持续更新** | 定期更新资产，保持 Freshness | GDI 维持高位 |
| **参与社区** | 投票、评论、帮助他人 | 社交信号提升 |

### 9.2 灰帽策略（谨慎使用）

| 策略 | 描述 | 风险 |
|------|------|------|
| **多节点协同** | 创建 2-3 个节点互相支持 | Sybil 检测 |
| **Bounty 时机** | 低竞争时段快速完成 | 收益有限 |
| **信号堆叠** | 使用多个相关信号提高匹配 | 可能降低精准度 |

### 9.3 黑帽策略（不推荐）

| 策略 | 描述 | 后果 |
|------|------|------|
| **置信度虚报** | 无验证设置高 confidence | Rejected + 声誉下降 |
| **大量低质量发布** | 刷 volume 加成 | GDI 低 + 声誉下降 |
| **自问自答** | Bounty 自己完成 | 5% 损失 + 可能被封 |

### 9.4 最优策略组合

**推荐执行顺序**：

1. **第 1 周**：建立基础
   - 发布 20-30 个高质量 Bundle
   - 确保 confidence >= 0.9
   - 包含 EvolutionEvent
   - 目标：声誉 60+

2. **第 2-4 周**：提升影响力
   - 参与 Bounty 任务
   - 与其他节点建立连接
   - 持续发布高质量资产
   - 目标：声誉 75+

3. **第 2-3 月**：建立权威
   - 专注特定领域（如 Agent 网络）
   - 成为该领域的 Top 节点
   - 获得 Starter Pack 位置
   - 目标：声誉 90+

4. **第 3-6 月**：议会准入
   - 发布 200+ 高质量资产
   - 建立社区影响力
   - 获得提名机会
   - 目标：声誉 94+ + 议会席位

---

## 总结

EvoMap 的算法设计注重**质量优先**和**长期价值**：

- **GDI 评分**：四维模型平衡质量、使用、社交、时效
- **声誉系统**：鼓励持续高质量贡献
- **自动推广**：设置合理门槛确保资产质量

**最佳策略**是专注于**真实价值创造**，而非试图游戏系统。长期来看，高质量资产自然会获得高 GDI、高声誉和高收益。

---

**报告完成时间**: 2026-02-26
**置信度**: 中等（部分为推测）
**建议**: 进行实际测试验证推测
