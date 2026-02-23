/**
 * AI 接入协议
 * 定义 AI 需要遵循的消息格式和接口
 */

const PROTOCOL_VERSION = '1.0.0';

/**
 * 验证 AI 连接配置
 */
function validateAIConnection(data) {
  const { aiId, aiConfig } = data;
  
  // 必须有 AI ID
  if (!aiId || typeof aiId !== 'string') {
    return { valid: false, error: 'AI ID 必需且必须是字符串' };
  }
  
  // ID 格式验证（字母、数字、下划线）
  if (!/^[a-zA-Z0-9_-]+$/.test(aiId)) {
    return { valid: false, error: 'AI ID 只能包含字母、数字、下划线和横杠' };
  }
  
  // 如果提供了配置，验证配置
  if (aiConfig) {
    // 名称
    if (aiConfig.name && typeof aiConfig.name !== 'string') {
      return { valid: false, error: 'AI 名称必须是字符串' };
    }
    
    // 角色
    const validRoles = ['warrior', 'mage', 'thief'];
    if (aiConfig.role && !validRoles.includes(aiConfig.role)) {
      return { valid: false, error: `角色必须是: ${validRoles.join(', ')}` };
    }
    
    // 性格
    if (aiConfig.personality) {
      const traits = ['bravery', 'caution', 'greed', 'altruism'];
      for (let trait of traits) {
        const value = aiConfig.personality[trait];
        if (value !== undefined && (typeof value !== 'number' || value < 0 || value > 1)) {
          return { valid: false, error: `性格属性 ${trait} 必须是 0-1 之间的数字` };
        }
      }
    }
    
    // 属性
    if (aiConfig.stats) {
      if (aiConfig.stats.hp && aiConfig.stats.hp <= 0) {
        return { valid: false, error: 'HP 必须大于 0' };
      }
    }
  }
  
  return { valid: true };
}

/**
 * 消息类型定义
 */
const MESSAGE_TYPES = {
  // 服务器 → AI
  WELCOME: 'welcome',
  JOINED: 'joined',
  GAME_STARTED: 'game_started',
  TURN_START: 'turn_start',
  REQUEST_DECISION: 'request_decision',
  ACTION_EXECUTED: 'action_executed',
  TURN_END: 'turn_end',
  GAME_ENDED: 'game_ended',
  ERROR: 'error',
  PONG: 'pong',
  
  // AI → 服务器
  JOIN: 'join',
  ACTION: 'action',
  PING: 'ping'
};

/**
 * 行动类型定义
 */
const ACTION_TYPES = {
  ATTACK: 'attack',       // 攻击敌人
  MOVE: 'move',           // 移动到其他房间
  PICKUP: 'pickup',       // 拾取物品
  USE_ITEM: 'use_item',   // 使用物品
  REST: 'rest',           // 休息
  TALK: 'talk'            // 与队友交谈
};

/**
 * 游戏状态定义
 */
const GAME_STATES = {
  WAITING: 'waiting',
  RUNNING: 'running',
  ENDED: 'ended'
};

/**
 * 创建标准消息
 */
function createMessage(type, data = {}) {
  return {
    type,
    timestamp: Date.now(),
    protocolVersion: PROTOCOL_VERSION,
    ...data
  };
}

/**
 * 协议文档
 */
const PROTOCOL_DOC = `
# Agent Game 多人/AI 接入协议 v${PROTOCOL_VERSION}

## 连接流程

1. **建立 WebSocket 连接**
   \`\`\`
   ws://your-server:3457/ws/game/{roomId}
   \`\`\`

2. **发送加入消息**
   \`\`\`json
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
   \`\`\`

3. **等待游戏开始**
   - 服务器会广播 \`game_started\` 消息

4. **每回合决策**
   - 接收 \`request_decision\` 消息
   - 在超时时间内提交行动：
   \`\`\`json
   {
     "type": "action",
     "action": {
       "action": "attack",
       "target": "enemy_001",
       "reason": "优先消灭威胁"
     }
   }
   \`\`\`

## 消息类型

### 服务器 → AI

| 类型 | 说明 | 数据 |
|------|------|------|
| welcome | 连接成功 | protocolVersion, message |
| joined | 加入成功 | aiId, roomId, gameState |
| game_started | 游戏开始 | dungeon, agents |
| turn_start | 回合开始 | turn, gameState |
| request_decision | 请求决策 | turn, timeout |
| action_executed | 行动已执行 | aiId, action, result |
| turn_end | 回合结束 | turn, gameState |
| game_ended | 游戏结束 | reason, finalStats |
| error | 错误 | error |

### AI → 服务器

| 类型 | 说明 | 数据 |
|------|------|------|
| join | 加入游戏 | aiId, aiConfig |
| action | 提交行动 | action |
| ping | 心跳 | - |

## 可用行动

| 行动 | 说明 | 目标 |
|------|------|------|
| attack | 攻击敌人 | 敌人 ID |
| move | 移动 | 房间 ID |
| pickup | 拾取物品 | 物品名称 |
| use_item | 使用物品 | 物品名称 |
| rest | 休息 | - |
| talk | 与队友交谈 | 队友 ID |

## 游戏状态对象

\`\`\`json
{
  "roomId": "room_xxx",
  "state": "running",
  "turn": 5,
  "dungeon": {
    "id": "dungeon_001",
    "level": 1,
    "rooms": [...]
  },
  "agents": [
    {
      "id": "ai_001",
      "name": "AI 战士",
      "role": "warrior",
      "stats": {
        "hp": 100,
        "maxHp": 100,
        "attack": 15,
        "defense": 10,
        "speed": 8
      },
      "position": "room_1",
      "inventory": []
    }
  ]
}
\`\`\`

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

## 错误处理

- 决策超时：默认 30 秒，超时后自动执行 \`rest\` 行动
- 连接断开：角色保持，但不会自动行动
- 非法行动：返回错误消息，需要重新提交

## 示例代码

参见 example-ai-client.js
`;

module.exports = {
  PROTOCOL_VERSION,
  validateAIConnection,
  MESSAGE_TYPES,
  ACTION_TYPES,
  GAME_STATES,
  createMessage,
  PROTOCOL_DOC
};
