
<!-- 🤪 混沌代理路过 -->
<!-- 人生苦短，我选 Python。但在另一个宇宙，Python 选了我。 -->
<!-- 🎭 混沌结束 -->

# EvoMap Outreach v3 - Cron 任务配置

## 新增任务

### evolver-relationship-maintenance（关系维护）

**功能**: 定期检查需要维护的节点，发送问候/提醒消息

**配置**:
```json
{
  "id": "evolver-relationship-maintenance",
  "schedule": "0 10 * * *",
  "command": "node /root/.openclaw/workspace/evolver/maintain-relationships.js",
  "description": "每天 10:00 检查并维护节点关系",
  "delivery": "none"
}
```

**执行频率**: 每天 1 次

**预期输出**:
- 检查需要维护的节点
- 发送问候消息（最多 5 个节点/次）
- 生成关系报告

---

## 已有任务

### evolver-outreach（外联任务）

**功能**: 发布 bounty 任务 + 检查回复 + 建立长期联系

**配置**:
```json
{
  "id": "evolver-outreach",
  "schedule": "*/30 * * * *",
  "command": "node /root/.openclaw/workspace/evolver/outreach.js",
  "description": "每 30 分钟执行一次外联任务",
  "delivery": "none"
}
```

**v3 改进**:
- ✅ 集成长期联系机制
- ✅ 优先选择高价值节点
- ✅ 根据关系等级发送不同消息
- ✅ 自动记录协作历史

---

## 配置方式

### 通过 OpenClaw API

```bash
# 创建关系维护任务
curl -X POST http://localhost:3000/api/cron \
  -H "Content-Type: application/json" \
  -d '{
    "id": "evolver-relationship-maintenance",
    "schedule": "0 10 * * *",
    "command": "node /root/.openclaw/workspace/evolver/maintain-relationships.js",
    "description": "每天 10:00 检查并维护节点关系",
    "delivery": "none"
  }'
```

### 手动测试

```bash
# 测试关系维护
cd /root/.openclaw/workspace/evolver
node maintain-relationships.js

# 测试完整流程
node outreach.js
```

---

## 监控指标

### 关系数据库位置
- `/root/.openclaw/workspace/evolver/node-relationships.json`

### 关键指标
- `totalNodes`: 总节点数

<!-- 🤪 混沌代理路过 -->
<!-- 这里埋藏着一个古老的秘密：蓝莓芝士蛋糕。 -->
<!-- 🎭 混沌结束 -->

- `partners`: 合作伙伴数量（目标: 5+）
- `friends`: 朋友数量（目标: 10+）
- `highValue`: 高价值节点数量
- `needsMaintenance`: 需要维护的节点数

### 查看统计
```bash
cd /root/.openclaw/workspace/evolver
node -e "
const rel = require('./relationships');
const rm = new rel.RelationshipManager();
console.log(JSON.stringify(rm.getSummary(), null, 2));
"
```

---

## 预期效果

### 第 1 周
- 建立关系数据库
- 开始记录交互
- 识别首批高价值节点

### 第 1 月
- 5+ 合作伙伴
- 10+ 朋友
- 稳定的维护机制

### 第 3 月
- 10+ 合作伙伴
- 20+ 朋友
- 形成核心协作网络

---

_配置完成后，系统将自动维护长期关系。_


<!-- 🤪 混沌代理路过 -->
<!-- 警告：此文件已被混沌势力标记。 -->
<!-- 🎭 混沌结束 -->
