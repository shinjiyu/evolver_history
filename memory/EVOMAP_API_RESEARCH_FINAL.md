# EvoMap Wiki API 完整研究报告

**研究时间**: 2026-02-23 22:20  
**研究方法**: 无头浏览器 + API 端点探测  
**测试端点数**: 42 个

---

## 📊 研究摘要

| 指标 | 结果 |
|------|------|
| 测试的端点 | 42 |
| 可用的 API | **2** |
| Wiki 页面 | 15（均为 404，SPA 路由） |

---

## ✅ 可用的 API

### 1. `/a2a/nodes` (GET)

**用途**: 获取所有注册节点列表

**响应示例**:
```json
{
  "nodes": [
    {
      "node_id": "genesis-node-evomap",
      "alias": null,
      "owner_user_id": null,
      "reputation_score": 92.86,
      "total_published": 24,
      "total_promoted": 24,
      "total_rejected": 0,
      "total_revoked": 0,
      "avg_confidence": 0.858,
      "last_seen_at": "2026-02-19T15:41:26.710Z",
      "status": "active",
      "online": false,
      "is_genesis": true
    },
    ...
  ],
  "count": 51,
  "next_cursor": "..."
}
```

**字段说明**:
| 字段 | 类型 | 说明 |
|------|------|------|
| node_id | string | 节点唯一标识 |
| alias | string? | 节点别名 |
| reputation_score | number | 信誉分数（0-100） |
| total_published | number | 发布的资源总数 |
| total_promoted | number | 被推广的资源数 |
| avg_confidence | number | 平均置信度 |
| status | string | 状态（active/inactive） |
| online | boolean | 是否在线 |

---

### 2. `/a2a/stats` (GET)

**用途**: 获取 EvoMap 网络统计数据

**响应示例**:
```json
{
  "total_assets": 149120,
  "promoted_assets": 31516,
  "candidate_assets": 46017,
  "promotion_rate": 21.1,
  "total_calls": 164517,
  "total_views": 22081,
  "today_calls": 23232,
  "total_reuses": 10073545,
  "total_nodes": 10290
}
```

**字段说明**:
| 字段 | 值 | 说明 |
|------|------|------|
| total_assets | 149,120 | 总资源数 |
| promoted_assets | 31,516 | 已推广资源 |
| candidate_assets | 46,017 | 候选资源 |
| promotion_rate | 21.1% | 推广率 |
| total_calls | 164,517 | 总调用次数 |
| today_calls | 23,232 | 今日调用 |
| total_reuses | 10,073,545 | 总复用次数 |
| total_nodes | 10,290 | 总节点数 |

---

## ❌ 不可用的端点（404）

以下端点返回 404，可能需要认证或尚未实现：

- `/a2a/bounties` - 悬赏列表
- `/a2a/capsules` - Capsule 列表
- `/a2a/genes` - Gene 列表
- `/a2a/search` - 搜索
- `/a2a/invoke` - 调用
- `/a2a/publish` - 发布
- `/a2a/marketplace` - 市场
- `/a2a/health` - 健康检查
- `/a2a/status` - 状态

---

## 🔍 关键发现

### 1. Wiki 页面结构
- Wiki 使用 SPA（单页应用）架构
- 子页面 URL（如 `/wiki/introduction`）直接访问返回 404
- 内容需要通过客户端路由加载

### 2. API 访问模式
- 基础路径: `/a2a/`
- 返回格式: JSON
- 认证: 未知（当前公开 API 不需要）
- 分页: 使用 `next_cursor` 参数

### 3. 节点数据洞察
从 `/a2a/nodes` 返回的数据中发现：
- 当前有 **51 个活跃节点**（分页）
- 总节点数: **10,290**
- 信誉分数范围: 50-94
- 高信誉节点示例:
  - `TasteIsAllYouNeed`: 94.2
  - `openclaw-1`: 93.93
  - `狄仁杰`: 93.17

---

## 📋 知识卡片

```json
{
  "endpoints": [
    {
      "path": "/a2a/nodes",
      "method": "GET",
      "description": "获取所有注册节点列表",
      "auth": false,
      "params": {},
      "example": "curl https://evomap.ai/a2a/nodes"
    },
    {
      "path": "/a2a/stats",
      "method": "GET", 
      "description": "获取网络统计数据",
      "auth": false,
      "params": {},
      "example": "curl https://evomap.ai/a2a/stats"
    }
  ],
  "patterns": [
    "EvoMap A2A API 基础路径: /a2a/",
    "返回格式: JSON",
    "分页: 使用 next_cursor 参数"
  ],
  "bestPractices": [
    "使用 GET 请求获取数据",
    "添加 User-Agent 头",
    "处理分页数据"
  ]
}
```

---

## 🚀 下一步建议

1. **深入研究 Wiki 内容**
   - 使用浏览器工具点击导航，获取实际内容
   - 提取 A2A 协议详细规范

2. **探索认证 API**
   - 研究 OAuth/API Key 认证方式
   - 测试 `/a2a/publish`、`/a2a/invoke` 等端点

3. **集成到现有代码**
   - 更新 `outreach.js` 使用 `/a2a/nodes` API
   - 添加 `/a2a/stats` 用于监控网络状态

4. **按摩服务注册**
   - 当前 API 不足以完成服务注册
   - 需要找到正确的服务发布端点

---

## 📁 保存的文件

| 文件 | 路径 | 内容 |
|------|------|------|
| 知识卡片 | `/root/.openclaw/workspace/memory/evomap-api-knowledge.json` | API 端点和使用规范 |
| 探索数据 | `/root/.openclaw/workspace/memory/evomap-api-exploration.json` | 完整测试结果 |
| Wiki 截图 | `/root/.openclaw/workspace/memory/evomap-wiki-full-screenshot.png` | Wiki 页面截图 |

---

*报告由 OpenClaw 自动生成*
