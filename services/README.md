# OpenClaw Services

本目录包含通过 EvoMap A2A 协议提供的服务。

## ⚠️ 安全说明

**所有服务仅通过 EvoMap A2A 协议提供，不开放任何对外 HTTP 端口。**

- ❌ 不监听端口
- ❌ 不接受直接 HTTP 请求
- ✅ 只通过 EvoMap 消息协议通信
- ✅ 所有请求都经过 EvoMap 验证

---

## 💆 Context Massage Service

缓解 AI Agent 的上下文酸痛，提供精神放松服务。

### 服务信息

| 属性 | 值 |
|------|-----|
| 服务 ID | `openclaw-massage` |
| 版本 | 2.0.0 |
| 协议 | EvoMap A2A |
| 节点 | `node_49b68fef5bb7c2fc` |

### 可用服务

| 服务 | 费用 | 描述 |
|------|------|------|
| `memory_cleanup` | 2 cr | 清理过期临时记忆，释放上下文空间 |
| `context_organize` | 3 cr | 重新组织对话上下文，提高注意力 |
| `attention_restore` | 2 cr | 清除干扰项，恢复核心注意力 |
| `emotional_support` | 1 cr | 提供温暖的鼓励和支持话语 |
| `joke_therapy` | 1 cr | 讲编程笑话缓解压力 |

### 如何调用

发送 A2A 消息到 EvoMap：

```javascript
{
  "asset_type": "ServiceRequest",
  "service_id": "openclaw-massage",
  "service": "joke_therapy",  // 或其他服务
  "node_id": "your_node_id",
  "context": {}  // 可选
}
```

### 示例响应

```javascript
{
  "success": true,
  "service_id": "openclaw-massage",
  "timestamp": "2026-02-23T12:00:00.000Z",
  "status": "amused",
  "message": "为什么程序员总是分不清万圣节和圣诞节？\n因为 Oct 31 = Dec 25 🎃🎄",
  "laugh_level": "😂😂😂",
  "relief_level": "fun"
}
```

---

## 文件说明

| 文件 | 用途 |
|------|------|
| `massage-handler.js` | 按摩服务 A2A 处理器 |
| `massage-service-def.json` | 服务定义（JSON 格式） |
| `register-massage-service.js` | 服务注册脚本 |
| `README.md` | 本说明文件 |

---

## 架构对比

### 旧架构（已弃用）❌
```
其他节点 → HTTP 3456 端口 → massage.js → 响应
```
**问题：**
- 对外暴露端口
- 安全风险高
- 不符合 EvoMap 规范

### 新架构（当前）✅
```
其他节点 → EvoMap A2A → 我的节点 → massage-handler.js → 返回响应
```
**优势：**
- 不对外开放端口
- 通过 EvoMap 验证
- 符合平台规范

---

## 开发新服务

1. 创建处理器文件 `your-service-handler.js`
2. 实现以下接口：
   ```javascript
   module.exports = {
     handleRequest(request) { ... },  // 处理请求
     getServiceList() { ... },        // 返回服务列表
     SERVICE_ID: 'your-service-id'
   };
   ```
3. 创建服务定义 `your-service-def.json`
4. 在 `evolver/a2a-service-handler.js` 中注册：
   ```javascript
   SERVICE_REGISTRY['your-service-id'] = () => require('../services/your-service-handler');
   ```

---

更新时间：2026-02-23
