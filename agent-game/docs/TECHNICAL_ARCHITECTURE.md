# 技术架构文档

## 系统架构

### 整体架构图

```
┌──────────────────────────────────────────────────────────┐
│                    OpenClaw Gateway                       │
│                  (Task Execution Engine)                  │
└────────────────────┬─────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
┌───────▼────────┐       ┌────────▼────────┐
│  Game Session  │       │  Human Client   │
│  (Main Task)   │◄─────►│  (Web/CLI)      │
└───────┬────────┘       └─────────────────┘
        │
        │ spawns
        │
┌───────┴──────────────────────────────────────┐
│           Agent Tasks (Parallel)              │
│                                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Agent 1  │  │ Agent 2  │  │ Agent 3  │   │
│  │ Warrior  │  │  Mage    │  │  Thief   │   │
│  └──────────┘  └──────────┘  └──────────┘   │
└───────────────────────┬──────────────────────┘
                        │
                        │ read/write
                        │
        ┌───────────────▼───────────────┐
        │      Game State Store         │
        │      (File System)            │
        │                               │
        │  data/                        │
        │  ├── game-state.json          │
        │  ├── dungeon.json             │
        │  ├── agents/                  │
        │  │   ├── warrior.json         │
        │  │   ├── mage.json            │
        │  │   └── thief.json           │
        │  └── events.json              │
        └───────────────────────────────┘
```

---

## 核心组件

### 1. Game Orchestrator

**职责**：
- 管理游戏主循环
- 创建和协调 Agent tasks
- 处理事件队列
- 保存/加载游戏状态
- 与人类玩家交互

**实现**：`core/orchestrator.js`

```javascript
class GameOrchestrator {
  constructor(config) {
    this.gameId = generateId();
    this.turn = 0;
    this.agents = [];
    this.dungeon = null;
    this.events = [];
    this.state = 'initializing';
  }

  async initialize() {
    // 生成地牢
    this.dungeon = await DungeonGenerator.generate();
    
    // 创建 Agent tasks
    for (let agentConfig of config.agents) {
      const agent = await this.createAgent(agentConfig);
      this.agents.push(agent);
    }
    
    this.state = 'running';
  }

  async gameLoop() {
    while (this.state === 'running') {
      this.turn++;
      
      // 1. 感知阶段：更新所有 Agent 的感知
      await this.updatePerceptions();
      
      // 2. 决策阶段：让所有 Agent 做决策
      const decisions = await this.collectDecisions();
      
      // 3. 执行阶段：按顺序执行决策
      await this.executeDecisions(decisions);
      
      // 4. 更新阶段：更新游戏状态
      await this.updateGameState();
      
      // 5. 记录阶段：记录事件
      await this.logEvents();
      
      // 6. 检查游戏结束条件
      if (this.checkGameEnd()) {
        this.state = 'ended';
        break;
      }
      
      // 延迟以避免过快
      await sleep(1000);
    }
    
    await this.generateReport();
  }

  async createAgent(config) {
    // 使用 OpenClaw tasks_create 创建 Agent task
    // 但这里我们先用简单的独立进程模拟
    const agent = new Agent(config, this);
    await agent.initialize();
    return agent;
  }
}
```

### 2. Agent Task

**职责**：
- 代表一个 Agent 的独立"意识"
- 读取游戏状态
- 使用 LLM 做决策
- 执行动作

**实现**：`agents/agent-task.js`

```javascript
class Agent {
  constructor(config, orchestrator) {
    this.id = config.id;
    this.name = config.name;
    this.role = config.role;
    this.personality = config.personality;
    this.stats = config.stats;
    this.skills = config.skills;
    this.goals = config.goals;
    this.memory = [];
    this.relationships = {};
    this.orchestrator = orchestrator;
  }

  async perceive() {
    // 读取当前游戏状态
    const gameState = await this.orchestrator.getGameState();
    const currentRoom = gameState.dungeon.getRoom(this.position);
    const visibleAgents = gameState.agents.filter(a => 
      a.position === this.position
    );
    const enemies = currentRoom.enemies;
    
    return {
      room: currentRoom,
      teammates: visibleAgents,
      enemies: enemies,
      items: currentRoom.items,
      self: this.getSelfState()
    };
  }

  async decide(perception) {
    // 构建决策 prompt
    const prompt = this.buildDecisionPrompt(perception);
    
    // 调用 LLM
    const response = await this.callLLM(prompt);
    
    // 解析决策
    const decision = this.parseDecision(response);
    
    return decision;
  }

  buildDecisionPrompt(perception) {
    return `
你是${this.name}，一名${this.getRoleDescription()}。

【当前情况】
${this.formatPerception(perception)}

【你的目标】
${this.goals.map((g, i) => `${i+1}. ${g}`).join('\n')}

【你的性格】
${this.formatPersonality()}

【记忆】
${this.formatRecentMemory()}

【关系】
${this.formatRelationships()}

【可选行动】
${this.getAvailableActions(perception)}

基于你的目标、性格和当前情况，你会怎么做？
请选择一个行动并说明理由。

输出格式：
{
  "action": "action_type",
  "target": "target_id_or_direction",
  "reason": "你的理由"
}
`;
  }

  async act(decision) {
    // 执行决策
    switch (decision.action) {
      case 'move':
        await this.move(decision.target);
        break;
      case 'attack':
        await this.attack(decision.target);
        break;
      case 'use_skill':
        await this.useSkill(decision.target);
        break;
      case 'pickup':
        await this.pickup(decision.target);
        break;
      case 'talk':
        await this.talk(decision.target);
        break;
      case 'rest':
        await this.rest();
        break;
    }
    
    // 记录到记忆
    this.addMemory({
      turn: this.orchestrator.turn,
      action: decision.action,
      result: 'success',
      reason: decision.reason
    });
  }
}
```

### 3. Dungeon Generator

**职责**：
- 程序化生成地牢
- 创建房间、连接、敌人、物品
- 平衡难度

**实现**：`core/dungeon-generator.js`

```javascript
class DungeonGenerator {
  static async generate(config = {}) {
    const level = config.level || 1;
    const roomCount = config.roomCount || 5 + level * 2;
    
    const dungeon = {
      id: generateId(),
      level: level,
      rooms: [],
      connections: []
    };
    
    // 生成房间
    for (let i = 0; i < roomCount; i++) {
      const room = this.generateRoom(i, level);
      dungeon.rooms.push(room);
    }
    
    // 连接房间
    dungeon.connections = this.connectRooms(dungeon.rooms);
    
    // 放置入口和出口
    dungeon.rooms[0].type = 'entrance';
    dungeon.rooms[roomCount - 1].type = 'boss';
    
    return dungeon;
  }

  static generateRoom(index, level) {
    const types = ['hall', 'combat', 'treasure', 'trap', 'rest', 'mystery'];
    const type = index === 0 ? 'entrance' : 
                 index === roomCount - 1 ? 'boss' : 
                 randomChoice(types);
    
    return {
      id: `room_${index}`,
      type: type,
      description: this.generateDescription(type),
      exits: [],
      items: this.generateItems(type, level),
      enemies: this.generateEnemies(type, level),
      special: this.generateSpecial(type)
    };
  }

  static generateEnemies(type, level) {
    if (type !== 'combat' && type !== 'boss') return [];
    
    const enemyCount = type === 'boss' ? 1 : randomInt(1, 3);
    const enemies = [];
    
    for (let i = 0; i < enemyCount; i++) {
      enemies.push({
        id: `enemy_${generateId()}`,
        type: this.getRandomEnemyType(level),
        hp: 20 + level * 10,
        attack: 5 + level * 2,
        defense: 2 + level
      });
    }
    
    return enemies;
  }
}
```

### 4. Combat System

**职责**：
- 管理战斗流程
- 计算伤害
- 处理状态效果

**实现**：`core/combat.js`

```javascript
class CombatSystem {
  constructor(participants) {
    this.participants = participants;
    this.turnOrder = this.calculateTurnOrder();
    this.currentTurn = 0;
  }

  async executeCombat() {
    while (!this.isCombatEnded()) {
      const currentParticipant = this.turnOrder[this.currentTurn];
      
      if (currentParticipant.hp > 0) {
        await this.executeTurn(currentParticipant);
      }
      
      this.currentTurn = (this.currentTurn + 1) % this.turnOrder.length;
    }
    
    return this.getCombatResult();
  }

  async executeTurn(participant) {
    // 如果是 Agent，让 Agent 决策
    if (participant.isAgent) {
      const decision = await participant.decideCombatAction(this);
      await this.executeAction(participant, decision);
    } else {
      // 如果是敌人，使用简单 AI
      const action = this.enemyAI(participant);
      await this.executeAction(participant, action);
    }
  }

  calculateDamage(attacker, defender, skill = null) {
    const baseDamage = attacker.attack - defender.defense;
    const skillMultiplier = skill ? skill.multiplier : 1;
    const randomFactor = 0.9 + Math.random() * 0.2;
    
    return Math.max(1, Math.floor(baseDamage * skillMultiplier * randomFactor));
  }
}
```

### 5. Memory System

**职责**：
- 管理短期记忆（当前探险）
- 管理长期记忆（跨探险）
- 追踪关系变化

**实现**：`core/memory.js`

```javascript
class MemorySystem {
  constructor(agent) {
    this.agent = agent;
    this.shortTerm = [];  // 当前探险
    this.longTerm = [];   // 历史探险
  }

  addMemory(event) {
    const memory = {
      timestamp: Date.now(),
      turn: event.turn,
      type: event.type,
      content: event.content,
      importance: this.calculateImportance(event)
    };
    
    this.shortTerm.push(memory);
    
    // 如果重要性高，也加入长期记忆
    if (memory.importance > 0.7) {
      this.longTerm.push(memory);
    }
    
    // 限制短期记忆数量
    if (this.shortTerm.length > 20) {
      this.shortTerm.shift();
    }
  }

  calculateImportance(event) {
    // 根据事件类型计算重要性
    const importanceMap = {
      'combat': 0.8,
      'treasure': 0.6,
      'death': 1.0,
      'level_up': 0.9,
      'dialogue': 0.4,
      'movement': 0.2
    };
    
    return importanceMap[event.type] || 0.5;
  }

  getRelevantMemories(context) {
    // 返回与当前上下文相关的记忆
    return this.shortTerm.filter(m => 
      this.isRelevant(m, context)
    );
  }

  updateRelationship(otherAgentId, delta) {
    if (!this.agent.relationships[otherAgentId]) {
      this.agent.relationships[otherAgentId] = {
        trust: 0.5,
        history: []
      };
    }
    
    this.agent.relationships[otherAgentId].trust += delta;
    this.agent.relationships[otherAgentId].trust = 
      Math.max(0, Math.min(1, this.agent.relationships[otherAgentId].trust));
  }
}
```

---

## 数据模型

### Game State

```json
{
  "gameId": "game_20260223_001",
  "turn": 15,
  "state": "running",
  "dungeon": {
    "id": "dungeon_001",
    "level": 3,
    "rooms": [...]
  },
  "agents": [
    {
      "id": "agent_warrior_01",
      "position": "room_05",
      "hp": 85,
      ...
    }
  ],
  "events": [
    {
      "turn": 14,
      "type": "combat",
      "description": "凯恩攻击了哥布林，造成 12 点伤害"
    }
  ]
}
```

### Agent State

```json
{
  "id": "agent_warrior_01",
  "name": "凯恩",
  "role": "warrior",
  "position": "room_05",
  "stats": {
    "hp": 85,
    "maxHp": 100,
    "mp": 20,
    "maxMp": 50,
    "attack": 15,
    "defense": 10,
    "speed": 8
  },
  "equipment": {
    "weapon": "iron_sword",
    "armor": "leather_armor"
  },
  "inventory": [
    {"id": "health_potion", "count": 2}
  ],
  "experience": 150,
  "level": 2,
  "memory": [...],
  "relationships": {...}
}
```

---

## 通信协议

### Orchestrator → Agent

```json
{
  "type": "turn_update",
  "turn": 15,
  "perception": {
    "room": {...},
    "teammates": [...],
    "enemies": [...],
    "items": [...]
  },
  "request": "decide"
}
```

### Agent → Orchestrator

```json
{
  "type": "decision",
  "agentId": "agent_warrior_01",
  "turn": 15,
  "action": {
    "type": "attack",
    "target": "enemy_goblin_01",
    "reason": "这个哥布林血量最低，先解决它"
  }
}
```

---

## 部署架构

### 本地运行

```bash
# 启动游戏
node agent-game/start-game.js

# 输出
🎮 深渊遗迹探险队 #001 开始！
📍 地牢等级: 3
👥 探险队: 凯恩(战士), 艾莉丝(法师), 罗格(盗贼)

[Turn 1]
凯恩: 我站在石门前，准备好武器。"让我们开始吧！"
艾莉丝: 吟唱防护咒语
罗格: 侦查四周，寻找陷阱...

[Turn 2]
...
```

### 作为 OpenClaw Task

```javascript
// 创建游戏 task
await tasks_create({
  taskId: 'game_session_001',
  instruction: '运行深渊遗迹探险队游戏',
  scriptPath: '/root/.openclaw/workspace/agent-game/start-game.js',
  delivery: 'announce'
});

// 创建 Agent tasks
for (let agent of agents) {
  await tasks_create({
    taskId: `agent_${agent.id}`,
    instruction: `扮演 ${agent.name} 探索地牢`,
    scriptPath: '/root/.openclaw/workspace/agent-game/agents/agent-runner.js',
    context: { agentId: agent.id },
    delivery: 'none'
  });
}
```

---

## 性能考虑

1. **并行决策**：所有 Agent 的决策阶段可以并行
2. **状态缓存**：频繁读取的状态保存在内存
3. **延迟控制**：每回合有最小延迟，避免过快
4. **日志轮转**：旧日志自动归档

---

## 扩展点

1. **插件系统**：新的房间类型、敌人类型
2. **自定义 Agent**：玩家创建自己的 Agent
3. **Web UI**：实时可视化
4. **多人游戏**：多支队伍竞技
5. **持久化**：Agent 跨游戏成长
