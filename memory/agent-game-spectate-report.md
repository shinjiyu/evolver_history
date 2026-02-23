# Agent 游戏观战功能检查报告

## 时间
2026-02-23 22:51

## 检查结果

### 前端代码
- [x] 观战页面 UI 已实现 (`/root/.openclaw/workspace/agent-game/multiplayer/public/index.html`)
- [x] WebSocket 连接功能已实现
- [x] 游戏状态实时显示已实现
- [x] 游戏日志滚动显示已实现
- [ ] **观战者不计入玩家数** - ❌ 未实现
- [ ] **观战者列表显示** - ❌ 未实现
- [ ] **观战者不能提交行动** - ❌ 未实现

### 后端 API
- [x] WebSocket 服务器运行正常 (端口 3457)
- [x] 游戏房间 API 已实现 (`/api/rooms`, `/api/room/:id`)
- [ ] **观战 API (`/api/game/spectate`)** - ❌ 未实现
- [ ] **观战者列表 API (`/api/game/spectators`)** - ❌ 未实现
- [ ] **观战者独立消息类型** - ❌ 未实现

### 协议支持
- [x] `join` 消息类型已定义
- [x] `game_started`, `turn_start`, `action_executed` 等消息已定义
- [ ] **`spectate` 消息类型** - ❌ 未定义
- [ ] **`spectator_joined`, `spectator_left` 事件** - ❌ 未定义

### 功能状态
- ⚠️ **部分实现**

当前实现的"观战"功能实际上是：
1. 用户以 `observer_${timestamp}` 作为 AI ID 加入游戏
2. 使用 `warrior` 角色（默认角色）
3. **会占用玩家位置**（计入 maxPlayers 限制）
4. **可能会被要求提交决策**

这不是真正的观战功能，只是"以 AI 身份加入但不提交行动"的变通方案。

### 未实现的原因

1. **设计时没有区分玩家和观战者**
   - 当前架构中，所有连接者都是"AI Agent"
   - 没有 `Spectator` 类或角色

2. **房间人数检查不区分类型**
   - `GameRoom.maxPlayers` 限制了总连接数
   - 没有单独的 `maxSpectators` 配置

3. **协议层没有定义观战者**
   - `protocol.js` 中的角色只有 `warrior`, `mage`, `thief`
   - 没有 `spectator` 角色类型

4. **广播机制不区分**
   - `GameRoom.broadcast()` 发送给所有连接者
   - 没有单独的观战者广播通道

---

## 需要实现的功能

### 优先级 1 (必需)

1. **观战者类型定义**
   - 在 `protocol.js` 中添加 `spectator` 角色
   - 添加 `spectator_join` 和 `spectator_leave` 消息类型

2. **观战者管理**
   - `GameRoom` 中添加 `spectators: Map<string, Spectator>`
   - 观战者不计入 `maxPlayers`
   - 可设置单独的 `maxSpectators` 限制

3. **观战者逻辑**
   - 观战者只能接收消息，不能提交行动
   - 不会收到 `request_decision` 消息

### 优先级 2 (增强)

4. **观战者列表 UI**
   - 显示当前观战者数量
   - 可选：显示观战者名称

5. **观战者聊天**
   - 观战者之间可以聊天
   - 观战者与玩家隔离

6. **观战者权限**
   - 可设置房间是否允许观战
   - 可设置观战延迟（防止作弊）

---

## 实现方案

### 方案 A: 最小修改（推荐）

在现有架构上添加观战支持：

```javascript
// protocol.js - 添加观战消息类型
MESSAGE_TYPES.SPECTATE = 'spectate';
MESSAGE_TYPES.SPECTATOR_JOINED = 'spectator_joined';
MESSAGE_TYPES.SPECTATOR_LEFT = 'spectator_left';

// game-room.js - 添加观战者管理
class GameRoom {
  constructor(roomId, config = {}) {
    // ... existing code ...
    this.spectators = new Map(); // spectateId -> {ws, name}
    this.maxSpectators = config.maxSpectators || 100;
  }

  async addSpectator(ws, spectateId, name) {
    if (this.spectators.size >= this.maxSpectators) {
      return { success: false, error: '观战人数已满' };
    }

    this.spectators.set(spectateId, { ws, name: name || `Viewer_${this.spectators.size + 1}` });

    this.broadcast({
      type: 'spectator_joined',
      spectateId,
      spectatorCount: this.spectators.size
    });

    return { success: true };
  }

  // 修改 broadcast 方法
  broadcast(message, includeSpectators = true) {
    const data = JSON.stringify(message);

    // 发送给玩家
    for (let [aiId, agentData] of this.agents) {
      // ... existing code ...
    }

    // 发送给观战者
    if (includeSpectators) {
      for (let [spectateId, specData] of this.spectators) {
        try {
          if (specData.ws.readyState === 1) {
            specData.ws.send(data);
          }
        } catch (error) {}
      }
    }
  }
}

// server.js - 处理观战消息
async handleWebSocketMessage(ws, message) {
  // ... existing code ...

  switch (message.type) {
    case 'join':
      // 玩家加入
      await this.handleAIJoin(ws, message, connectionInfo, room);
      break;

    case 'spectate': // 新增
      // 观战者加入
      await this.handleSpectatorJoin(ws, message, connectionInfo, room);
      break;

    // ... existing code ...
  }
}
```

### 方案 B: 完整重构

创建独立的观战系统：

```javascript
// spectator.js - 新文件
class Spectator {
  constructor(id, ws, config = {}) {
    this.id = id;
    this.ws = ws;
    this.name = config.name || `Spectator_${Date.now()}`;
    this.joinedAt = new Date();
  }

  send(message) {
    if (this.ws.readyState === 1) {
      this.ws.send(JSON.stringify(message));
    }
  }
}

// spectator-manager.js - 新文件
class SpectatorManager {
  constructor(config = {}) {
    this.spectators = new Map();
    this.maxSpectators = config.maxSpectators || 100;
  }

  add(spectator) {
    if (this.spectators.size >= this.maxSpectators) {
      return { success: false, error: '观战人数已满' };
    }

    this.spectators.set(spectator.id, spectator);
    return { success: true };
  }

  remove(spectatorId) {
    this.spectators.delete(spectatorId);
  }

  broadcast(message) {
    for (let spectator of this.spectators.values()) {
      spectator.send(message);
    }
  }

  getList() {
    return Array.from(this.spectators.values()).map(s => ({
      id: s.id,
      name: s.name,
      joinedAt: s.joinedAt
    }));
  }
}
```

---

## API 设计建议

### 观战者加入
```
POST /api/game/spectate
{
  "roomId": "room_xxx",
  "name": "观战者名称" // 可选
}

Response:
{
  "success": true,
  "spectateId": "spec_xxx",
  "wsUrl": "wss://kuroneko.chat/agent-game/ws/game/room_xxx"
}

WebSocket 消息:
{
  "type": "spectate",
  "spectateId": "spec_xxx"
}
```

### 获取观战者列表
```
GET /api/game/:roomId/spectators

Response:
{
  "spectators": [
    { "id": "spec_1", "name": "Viewer_1", "joinedAt": "..." },
    { "id": "spec_2", "name": "Viewer_2", "joinedAt": "..." }
  ],
  "count": 2,
  "maxSpectators": 100
}
```

---

## 工作量估算

| 任务 | 工作量 | 优先级 |
|------|--------|--------|
| 添加观战者消息类型 | 0.5h | P1 |
| 修改 GameRoom 支持观战者 | 2h | P1 |
| 修改 Server 处理观战连接 | 1h | P1 |
| 前端 UI 调整 | 1h | P2 |
| 观战者列表 UI | 1h | P2 |
| 观战者聊天功能 | 2h | P3 |
| **总计** | **7.5h** | - |

---

## 当前可用的"变通方案"

在观战功能正式实现之前，当前的前端可以通过以下方式"观战"：

1. 访问 https://kuroneko.chat/agent-game/
2. 输入 Room ID 或留空自动创建
3. 点击 Connect
4. 以 `observer_xxx` 身份加入房间

**限制**：
- 如果房间已满（3/3），无法加入
- 可能会被要求提交决策（虽然可以忽略）
- 不是真正的观战者

---

## 服务器状态

```
✅ 服务器运行中
- 端口: 3457
- 运行时间: 3601秒
- 活跃连接: 0
- 房间数: 2
```

---

## 结论

观战功能**部分实现**：
- ✅ 前端 Observer 页面已实现
- ✅ 可以通过 WebSocket 查看游戏状态
- ❌ 没有独立的观战者角色和 API
- ❌ 观战者会计入玩家数量限制

建议按照**方案 A（最小修改）**实现，预计工作量 **3.5h** 可完成核心功能。
