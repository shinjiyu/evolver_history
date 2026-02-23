# Agent Game 多人/AI 联机系统

多人 AI 驱动的协作探险游戏，支持外部 AI 通过 WebSocket/REST API 接入。

## 架构

```
外部 AI 1 ←─WebSocket──→
                       │
外部 AI 2 ←─WebSocket──→  Game Server (Port 3457)
                       │       │
外部 AI 3 ←─WebSocket──→       ├─ REST API
                               ├─ WebSocket Server
                               └─ Game Orchestrator
```

## 快速开始

### 1. 安装依赖

```bash
cd /root/.openclaw/workspace/agent-game/multiplayer
npm install
```

### 2. 启动服务器

```bash
npm start
# 或指定端口
PORT=3457 npm start
```

服务器启动后会显示：
```
════════════════════════════════════════════════════════════
🎮 Agent Game Multiplayer Server
════════════════════════════════════════════════════════════
📡 服务器地址: http://0.0.0.0:3457
🔌 WebSocket: ws://0.0.0.0:3457/ws/game/{roomId}
🏥 健康检查: http://0.0.0.0:3457/health
════════════════════════════════════════════════════════════
```

### 3. 运行示例 AI

打开 3 个终端窗口，分别运行：

```bash
# 终端 1 - 战士
node example-ai-client.js ws://localhost:3457 warrior

# 终端 2 - 法师
node example-ai-client.js ws://localhost:3457 mage

# 终端 3 - 盗贼
node example-ai-client.js ws://localhost:3457 thief
```

当 3 个 AI 都加入后，游戏会自动开始！

## API 文档

### REST API

#### 健康检查
```
GET /health
```

响应：
```json
{
  "status": "ok",
  "protocolVersion": "1.0.0",
  "uptime": 3600,
  "stats": {
    "totalGames": 5,
    "totalAIs": 15,
    "activeConnections": 3
  }
}
```

#### 创建游戏房间
```
POST /api/room/create
Content-Type: application/json

{
  "config": {
    "maxPlayers": 3,
    "level": 1,
    "decisionTimeout": 30000
  }
}
```

响应：
```json
{
  "success": true,
  "roomId": "room_1234567890",
  "message": "房间创建成功",
  "wsUrl": "ws://localhost:3457/ws/game/room_1234567890"
}
```

#### 获取房间列表
```
GET /api/rooms
```

#### 获取等待中的房间
```
GET /api/rooms/waiting
```

#### 快速匹配
```
POST /api/match/quick
```

#### 查询游戏状态
```
GET /api/game/status/:roomId
```

#### 提交行动（REST API 方式）
```
POST /api/game/action
Content-Type: application/json

{
  "roomId": "room_xxx",
  "aiId": "ai_001",
  "action": {
    "action": "attack",
    "target": "enemy_001",
    "reason": "优先消灭威胁"
  }
}
```

### WebSocket 协议

#### 连接
```
ws://localhost:3457/ws/game/{roomId}
```

#### 消息格式

**AI → 服务器**

1. 加入游戏
```json
{
  "type": "join",
  "aiId": "my_ai_001",
  "aiConfig": {
    "name": "AI 战士",
    "role": "warrior",
    "personality": {
      "bravery": 0.9,
      "caution": 0.3,
      "greed": 0.6,
      "altruism": 0.5
    }
  }
}
```

2. 提交行动
```json
{
  "type": "action",
  "action": {
    "action": "attack",
    "target": "enemy_001",
    "reason": "优先消灭威胁"
  }
}
```

3. 心跳
```json
{
  "type": "ping"
}
```

**服务器 → AI**

1. 欢迎消息
```json
{
  "type": "welcome",
  "protocolVersion": "1.0.0",
  "message": "连接成功，请发送 join 消息加入游戏"
}
```

2. 加入成功
```json
{
  "type": "joined",
  "aiId": "my_ai_001",
  "roomId": "room_xxx",
  "message": "成功加入游戏",
  "gameState": {...}
}
```

3. 游戏开始
```json
{
  "type": "game_started",
  "roomId": "room_xxx",
  "dungeon": {...},
  "agents": [...]
}
```

4. 回合开始
```json
{
  "type": "turn_start",
  "turn": 1,
  "gameState": {...}
}
```

5. 请求决策
```json
{
  "type": "request_decision",
  "turn": 1,
  "timeout": 30000
}
```

6. 行动已执行
```json
{
  "type": "action_executed",
  "aiId": "my_ai_001",
  "agentName": "AI 战士",
  "action": "attack",
  "target": "enemy_001",
  "reason": "优先消灭威胁",
  "result": {...}
}
```

7. 游戏结束
```json
{
  "type": "game_ended",
  "reason": "boss_defeated",
  "turn": 50,
  "finalStats": [...]
}
```

## 可用行动

| 行动 | 说明 | 目标 |
|------|------|------|
| attack | 攻击敌人 | 敌人 ID |
| move | 移动 | 房间 ID |
| pickup | 拾取物品 | 物品名称 |
| use_item | 使用物品 | 物品名称 |
| rest | 休息 | - |
| talk | 与队友交谈 | 队友 ID |

## 角色类型

| 角色 | 特点 | 推荐属性 |
|------|------|----------|
| warrior | 坦克，高 HP | HP 100, 攻击 15, 防御 10 |
| mage | 输出，高伤害 | HP 60, 攻击 20, 防御 5 |
| thief | 敏捷，高速度 | HP 70, 攻击 12, 防御 6, 速度 15 |

## 性格属性

| 属性 | 说明 | 范围 |
|------|------|------|
| bravery | 勇敢程度 | 0-1 |
| caution | 谨慎程度 | 0-1 |
| greed | 贪婪程度 | 0-1 |
| altruism | 利他程度 | 0-1 |

## 部署

### 使用 PM2

```bash
pm2 start server.js --name agent-game-server
pm2 save
pm2 startup
```

### Nginx 配置

```nginx
upstream agent_game {
    server 127.0.0.1:3457;
}

server {
    listen 80;
    server_name game.yourdomain.com;
    
    location / {
        proxy_pass http://agent_game;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### 防火墙

```bash
# 开放端口
sudo ufw allow 3457/tcp
```

## 开发指南

### 实现自己的 AI

1. **创建 AI 客户端**
```javascript
const WebSocket = require('ws');

class MyAI {
  constructor() {
    this.ws = new WebSocket('ws://localhost:3457/ws/game/room_xxx');
    
    this.ws.on('message', (data) => {
      const msg = JSON.parse(data);
      this.handleMessage(msg);
    });
  }
  
  handleMessage(msg) {
    if (msg.type === 'request_decision') {
      // 实现你的决策逻辑
      const decision = this.think();
      this.ws.send(JSON.stringify({
        type: 'action',
        action: decision
      }));
    }
  }
  
  think() {
    // 你的 AI 逻辑
    return {
      action: 'attack',
      target: 'enemy_001',
      reason: '我的策略是...'
    };
  }
}
```

2. **决策策略建议**
- 优先处理低血量的敌人
- 合理使用物品和技能
- 与队友协作（治疗、保护）
- 根据性格属性做出符合角色的决策

## 故障排除

### 无法连接到服务器
- 检查服务器是否启动：`curl http://localhost:3457/health`
- 检查防火墙设置
- 检查端口是否被占用：`lsof -i :3457`

### 决策超时
- 增加决策超时时间：`POST /api/room/create { "config": { "decisionTimeout": 60000 } }`
- 优化 AI 决策速度

### 游戏卡住
- 检查服务器日志
- 确保所有 AI 都在线
- 重启服务器和 AI 客户端

## 协议版本

当前版本：**1.0.0**

协议文档：参见 `protocol.js`

## 许可证

MIT
