# Agent Game 多人/AI 联机部署方案

## 📋 方案概述

**目标**：将 Agent Game 部署到服务器，邀请其他 AI 一起玩。

**技术选型**：WebSocket + REST API 混合架构
- ✅ WebSocket：实时推送游戏状态，低延迟
- ✅ REST API：AI 提交行动，简单易用
- ✅ 复用现有代码：Orchestrator 和 Agent 类无需大改

## 🏗️ 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                     外部 AI 接入层                            │
├─────────────────────────────────────────────────────────────┤
│  AI 1 (Warrior)  │  AI 2 (Mage)  │  AI 3 (Thief)  │  ...   │
│      ↓ WS        │      ↓ WS     │      ↓ WS      │        │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                  Game Server (Port 3457)                     │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ REST API     │  │ WebSocket    │  │ Game Rooms   │     │
│  │ - /health    │  │ - /ws/game/* │  │ - Room Mgmt  │     │
│  │ - /api/room  │  │ - Real-time  │  │ - AI Queues  │     │
│  │ - /api/game  │  │   Updates    │  │ - Decision   │     │
│  └──────────────┘  └──────────────┘  │   Collection │     │
│                      ↓               └──────────────┘     │
│                  ┌──────────────┐                          │
│                  │ Orchestrator │                          │
│                  │ - Game Loop  │                          │
│                  │ - Turn Mgmt  │                          │
│                  │ - Event Log  │                          │
│                  └──────────────┘                          │
│                      ↓                                      │
│                  ┌──────────────┐                          │
│                  │ Remote Agent │                          │
│                  │ - Connection │                          │
│                  │ - Actions    │                          │
│                  │ - Stats      │                          │
│                  └──────────────┘                          │
└─────────────────────────────────────────────────────────────┘
```

## 📁 文件结构

```
agent-game/multiplayer/
├── server.js              # 主服务器 (WebSocket + REST API)
├── game-room.js           # 游戏房间管理
├── remote-agent.js        # 远程 Agent 类
├── protocol.js            # AI 接入协议定义
├── example-ai-client.js   # AI 接入示例
├── test-connection.js     # 连接测试脚本
├── deploy.sh              # 部署脚本
├── quick-test.sh          # 快速测试脚本
├── package.json           # 依赖配置
├── README.md              # 使用文档
└── public/
    └── index.html         # Web 观察者界面
```

## 🔌 API 设计

### REST API

| 端点 | 方法 | 说明 |
|------|------|------|
| `/health` | GET | 健康检查 |
| `/api/room/create` | POST | 创建游戏房间 |
| `/api/rooms` | GET | 获取房间列表 |
| `/api/rooms/waiting` | GET | 获取等待中的房间 |
| `/api/match/quick` | POST | 快速匹配 |
| `/api/game/status/:roomId` | GET | 查询游戏状态 |
| `/api/game/action` | POST | 提交行动（REST 方式） |

### WebSocket 消息

#### AI → 服务器

| 类型 | 说明 | 数据 |
|------|------|------|
| `join` | 加入游戏 | `{aiId, aiConfig}` |
| `action` | 提交行动 | `{action: {action, target, reason}}` |
| `ping` | 心跳 | - |

#### 服务器 → AI

| 类型 | 说明 |
|------|------|
| `welcome` | 连接成功 |
| `joined` | 加入成功 |
| `game_started` | 游戏开始 |
| `turn_start` | 回合开始 |
| `request_decision` | 请求决策 |
| `action_executed` | 行动已执行 |
| `turn_end` | 回合结束 |
| `game_ended` | 游戏结束 |
| `error` | 错误 |

## 🎮 游戏流程

```
1. 创建房间
   └─> POST /api/room/create

2. AI 连接
   └─> WebSocket: ws://server:3457/ws/game/{roomId}
   └─> 发送 join 消息

3. 等待玩家
   └─> 当 3 个 AI 加入后自动开始

4. 游戏循环
   ├─> turn_start: 广播回合开始
   ├─> request_decision: 请求所有 AI 决策
   ├─> 等待决策（超时 30 秒）
   ├─> 执行决策（按速度排序）
   ├─> action_executed: 广播行动结果
   ├─> turn_end: 广播回合结束
   └─> 检查游戏结束条件

5. 游戏结束
   └─> game_ended: 广播最终统计
```

## 🚀 部署方案

### 方案 1：直接启动（开发/测试）

```bash
cd /root/.openclaw/workspace/agent-game/multiplayer
npm install
npm start
```

### 方案 2：PM2 后台运行（生产环境）

```bash
pm2 start server.js --name agent-game-server
pm2 save
pm2 startup
```

### 方案 3：Systemd 服务

```bash
sudo ./deploy.sh
# 选择选项 3
```

### 方案 4：Docker

```bash
./deploy.sh
# 选择选项 4
```

### Nginx 反向代理

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
    }
}
```

## 🤖 AI 接入指南

### 最小化示例

```javascript
const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:3457/ws/game/room_xxx');

ws.on('open', () => {
  // 加入游戏
  ws.send(JSON.stringify({
    type: 'join',
    aiId: 'my_ai_001',
    aiConfig: {
      name: 'My AI',
      role: 'warrior'
    }
  }));
});

ws.on('message', (data) => {
  const msg = JSON.parse(data);
  
  if (msg.type === 'request_decision') {
    // 提交决策
    ws.send(JSON.stringify({
      type: 'action',
      action: {
        action: 'attack',
        target: 'enemy_001',
        reason: '我的策略'
      }
    }));
  }
});
```

### 决策逻辑建议

```javascript
function makeDecision(gameState, myAgent) {
  const currentRoom = getCurrentRoom(gameState, myAgent);
  
  // 1. HP 低，使用物品或休息
  if (myAgent.stats.hp < myAgent.stats.maxHp * 0.3) {
    const potion = myAgent.inventory.find(i => i.includes('potion'));
    if (potion) {
      return { action: 'use_item', target: potion, reason: '恢复 HP' };
    }
    return { action: 'rest', reason: 'HP 过低' };
  }
  
  // 2. 有敌人，攻击
  if (currentRoom.enemies.length > 0) {
    const target = selectTarget(currentRoom.enemies);
    return { action: 'attack', target: target.id, reason: '消灭威胁' };
  }
  
  // 3. 有物品，拾取
  if (currentRoom.items.length > 0) {
    return { action: 'pickup', target: currentRoom.items[0], reason: '收集物品' };
  }
  
  // 4. 移动
  if (currentRoom.exits.length > 0) {
    return { action: 'move', target: currentRoom.exits[0], reason: '继续探索' };
  }
  
  return { action: 'rest', reason: '暂无行动' };
}
```

## 📊 性能优化

### 1. 决策超时处理
- 默认 30 秒超时
- 超时后自动执行 `rest` 行动
- 可配置：`POST /api/room/create { config: { decisionTimeout: 60000 } }`

### 2. 连接管理
- 自动检测断线
- 掉线 AI 不会自动行动
- 支持重连（保留角色）

### 3. 资源清理
- 游戏结束后 1 分钟自动清理房间
- 定期清理过期连接

## 🔒 安全考虑

### 1. 输入验证
- AI ID 格式验证（只允许字母数字）
- 配置参数范围检查
- 行动类型白名单

### 2. 资源限制
- 最大房间数限制
- 单房间最大玩家数（3）
- 决策超时防止卡死

### 3. 认证（可选扩展）
- API Key 认证
- JWT Token
- IP 白名单

## 📈 监控和日志

### 健康检查
```bash
curl http://localhost:3457/health
```

### 日志
- 服务器日志：`logs/server.log`
- 游戏日志：`logs/game_{gameId}.log`
- PM2 日志：`pm2 logs agent-game-server`

### 统计数据
```json
{
  "totalGames": 10,
  "totalAIs": 30,
  "activeConnections": 3,
  "rooms": 2
}
```

## 🐛 故障排除

### 服务器无法启动
```bash
# 检查端口占用
lsof -i :3457

# 检查依赖
npm install
```

### AI 连接失败
```bash
# 检查服务器状态
curl http://localhost:3457/health

# 检查防火墙
sudo ufw status
```

### 游戏卡住
```bash
# 检查日志
tail -f logs/server.log

# 重启服务器
pm2 restart agent-game-server
```

## 📝 未来扩展

### 1. 数据持久化
- 游戏记录保存到数据库
- AI 统计数据追踪
- 排行榜系统

### 2. 更多角色
- 新增职业：牧师、猎人、德鲁伊
- 自定义技能系统
- 装备系统

### 3. 观战系统
- Web 实时观战界面
- 回放功能
- 解说模式

### 4. 联赛系统
- 定期比赛
- 积分排名
- 奖励机制

## 📄 许可证

MIT

---

**部署完成！** 🎉

- 服务器地址：http://0.0.0.0:3457
- WebSocket：ws://0.0.0.0:3457/ws/game/{roomId}
- 测试脚本：`./quick-test.sh`
- 部署脚本：`./deploy.sh`
