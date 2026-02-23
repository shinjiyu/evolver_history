/**
 * Agent Class
 * 代表一个探险队成员
 */

const fs = require('fs').promises;
const path = require('path');

class Agent {
  constructor(config, orchestrator) {
    this.orchestrator = orchestrator;
    
    // 基础属性
    this.id = config.id;
    this.name = config.name;
    this.role = config.role;
    
    // 性格
    this.personality = config.personality || {
      bravery: 0.5,
      caution: 0.5,
      greed: 0.5,
      altruism: 0.5
    };
    
    // 属性
    this.stats = config.stats || {
      hp: 100,
      maxHp: 100,
      attack: 10,
      defense: 5,
      speed: 10
    };
    
    // 技能
    this.skills = config.skills || [];
    
    // 装备
    this.equipment = config.equipment || {};
    
    // 物品栏
    this.inventory = config.inventory || [];
    
    // 位置
    this.position = 'room_0';  // 起始位置
    
    // 等级和经验
    this.level = 1;
    this.experience = 0;
    this.defeatedEnemies = 0;
    
    // 目标
    this.goals = config.goals || this.getDefaultGoals();
    
    // 记忆
    this.memory = [];
    this.maxMemory = 20;
    
    // 关系
    this.relationships = {};
    
    // 当前感知
    this.perception = null;
  }

  /**
   * 初始化 Agent
   */
  async initialize() {
    // 加载历史记忆（如果有）
    // TODO: 从文件加载
  }

  /**
   * 更新感知
   */
  updatePerception(dungeon, allAgents) {
    const currentRoom = dungeon.rooms.find(r => r.id === this.position);
    const teammates = allAgents.filter(a => 
      a.id !== this.id && a.position === this.position && a.isAlive()
    );
    
    this.perception = {
      room: currentRoom,
      teammates: teammates,
      enemies: currentRoom.enemies || [],
      items: currentRoom.items || [],
      exits: currentRoom.exits || [],
      self: this.getSelfState()
    };
  }

  /**
   * 使用 LLM 做决策
   */
  async decide(humanAdvice = null) {
    const prompt = this.buildDecisionPrompt(humanAdvice);
    
    // 这里应该调用 LLM
    // 但为了 MVP，我们使用简单的规则决策
    const decision = await this.makeDecision(humanAdvice);
    
    return decision;
  }

  /**
   * 构建决策 Prompt
   */
  buildDecisionPrompt(humanAdvice) {
    let prompt = `
你是${this.name}，一名${this.getRoleDescription()}。

【当前情况】
位置: ${this.perception.room.name || this.perception.room.id}
房间类型: ${this.perception.room.type}
HP: ${this.stats.hp}/${this.stats.maxHp}
队友: ${this.perception.teammates.map(t => t.name).join(', ') || '无'}
敌人: ${this.perception.enemies.map(e => e.type).join(', ') || '无'}
可见物品: ${this.perception.items.join(', ') || '无'}
出口: ${this.perception.exits.join(', ')}

【你的目标】
${this.goals.map((g, i) => `${i+1}. ${g}`).join('\n')}

【你的性格】
- 勇敢: ${this.personality.bravery}
- 谨慎: ${this.personality.caution}
- 贪婪: ${this.personality.greed}
- 利他: ${this.personality.altruism}

【近期记忆】
${this.formatRecentMemory()}
`;
    
    if (humanAdvice) {
      prompt += `\n【人类顾问建议】\n${humanAdvice}\n`;
    }
    
    prompt += `\n【可选行动】\n${this.getAvailableActions()}\n`;
    
    prompt += `\n基于你的目标、性格和当前情况，你会怎么做？`;
    
    return prompt;
  }

  /**
   * 简单决策逻辑（MVP）
   * TODO: 替换为真正的 LLM 调用
   */
  async makeDecision(humanAdvice) {
    const actions = [];
    
    // 1. 如果有敌人，考虑战斗
    if (this.perception.enemies.length > 0) {
      const target = this.selectTarget();
      actions.push({
        action: 'attack',
        target: target.id,
        reason: `${target.type} 威胁着我们，我先攻击它！`,
        priority: 10
      });
    }
    
    // 2. 如果有物品，考虑拾取
    if (this.perception.items.length > 0 && this.personality.greed > 0.5) {
      const item = this.perception.items[0];
      actions.push({
        action: 'pickup',
        target: item,
        reason: `这个 ${item} 看起来很有价值`,
        priority: this.personality.greed * 8
      });
    }
    
    // 3. 如果 HP 低，考虑休息或使用物品
    if (this.stats.hp < this.stats.maxHp * 0.3) {
      const potion = this.inventory.find(i => i.includes('potion'));
      if (potion) {
        actions.push({
          action: 'use_item',
          target: potion,
          reason: `我需要恢复一些 HP`,
          priority: 9
        });
      } else {
        actions.push({
          action: 'rest',
          target: null,
          reason: `我需要休息一下`,
          priority: 8
        });
      }
    }
    
    // 4. 如果有出口，考虑移动
    if (this.perception.exits.length > 0) {
      const exit = this.selectExit();
      actions.push({
        action: 'move',
        target: exit,
        reason: `继续探索，前往 ${exit}`,
        priority: this.personality.bravery * 6
      });
    }
    
    // 5. 如果有队友，考虑交谈
    if (this.perception.teammates.length > 0 && Math.random() < 0.2) {
      const teammate = this.perception.teammates[0];
      actions.push({
        action: 'talk',
        target: teammate.id,
        reason: `和 ${teammate.name} 交流一下`,
        priority: 3
      });
    }
    
    // 如果有人类建议，提高相关行动的优先级
    if (humanAdvice) {
      // 简单匹配：如果建议中包含某个关键词，提高对应行动的优先级
      for (let action of actions) {
        if (humanAdvice.toLowerCase().includes(action.action)) {
          action.priority += 5;
          action.reason += ` (听从人类顾问的建议)`;
        }
      }
    }
    
    // 选择优先级最高的行动
    actions.sort((a, b) => b.priority - a.priority);
    
    return actions[0] || { action: 'rest', reason: '暂时没有明确的行动' };
  }

  /**
   * 选择攻击目标
   */
  selectTarget() {
    const enemies = this.perception.enemies;
    
    // 策略1：攻击血量最低的
    if (this.personality.greed > 0.7) {
      return enemies.sort((a, b) => a.hp - b.hp)[0];
    }
    
    // 策略2：攻击攻击力最高的
    if (this.personality.bravery > 0.7) {
      return enemies.sort((a, b) => b.attack - a.attack)[0];
    }
    
    // 默认：随机选择
    return enemies[Math.floor(Math.random() * enemies.length)];
  }

  /**
   * 选择出口
   */
  selectExit() {
    const exits = this.perception.exits;
    
    // 优先选择未访问过的房间
    const unvisitedExits = exits.filter(e => 
      !this.memory.some(m => m.content && m.content.includes(e))
    );
    
    if (unvisitedExits.length > 0) {
      return unvisitedExits[Math.floor(Math.random() * unvisitedExits.length)];
    }
    
    return exits[Math.floor(Math.random() * exits.length)];
  }

  /**
   * 执行行动
   */
  async executeAction(decision) {
    const result = {};
    
    switch (decision.action) {
      case 'attack':
        result.combat = await this.performAttack(decision.target);
        break;
        
      case 'move':
        await this.performMove(decision.target);
        result.moved = true;
        break;
        
      case 'pickup':
        result.items = await this.performPickup(decision.target);
        break;
        
      case 'use_item':
        await this.performUseItem(decision.target);
        break;
        
      case 'rest':
        await this.performRest();
        break;
        
      case 'talk':
        await this.performTalk(decision.target);
        break;
        
      default:
        console.log(`   ⚠️  未知行动: ${decision.action}`);
    }
    
    // 添加到记忆
    this.addMemory({
      type: 'action',
      content: `${decision.action} → ${decision.target || 'self'}`
    });
    
    return result;
  }

  /**
   * 执行攻击
   */
  async performAttack(targetId) {
    const enemy = this.perception.enemies.find(e => e.id === targetId);
    if (!enemy) {
      console.log(`   ⚠️  找不到目标 ${targetId}`);
      return null;
    }
    
    // 计算伤害
    const damage = Math.max(1, this.stats.attack - enemy.defense);
    enemy.hp -= damage;
    
    console.log(`   ⚔️  攻击 ${enemy.type}，造成 ${damage} 点伤害 (${enemy.hp}/${enemy.maxHp})`);
    
    const combat = {
      target: enemy,
      damage: damage,
      defeatedEnemies: []
    };
    
    // 检查敌人是否死亡
    if (enemy.hp <= 0) {
      console.log(`   💀 ${enemy.type} 被击败！`);
      combat.defeatedEnemies.push(enemy);
      this.defeatedEnemies++;
      this.experience += enemy.experience || 10;
      
      // 从房间移除敌人
      const room = this.perception.room;
      room.enemies = room.enemies.filter(e => e.id !== enemy.id);
    }
    
    // 敌人反击（如果还活着）
    if (enemy.hp > 0) {
      const counterDamage = Math.max(1, enemy.attack - this.stats.defense);
      this.stats.hp -= counterDamage;
      console.log(`   🤕 ${enemy.type} 反击，造成 ${counterDamage} 点伤害 (${this.stats.hp}/${this.stats.maxHp})`);
      
      combat.agentDamages = [{
        agentId: this.id,
        damage: counterDamage
      }];
    }
    
    return combat;
  }

  /**
   * 执行移动
   */
  async performMove(roomId) {
    const targetRoom = this.orchestrator.dungeon.rooms.find(r => r.id === roomId);
    if (!targetRoom) {
      console.log(`   ⚠️  找不到房间 ${roomId}`);
      return;
    }
    
    this.position = roomId;
    console.log(`   🚶 移动到 ${targetRoom.name || roomId}`);
    
    // 房间描述
    if (targetRoom.description) {
      console.log(`   📜 ${targetRoom.description}`);
    }
  }

  /**
   * 拾取物品
   */
  async performPickup(itemId) {
    const room = this.perception.room;
    const itemIndex = room.items.indexOf(itemId);
    
    if (itemIndex === -1) {
      console.log(`   ⚠️  找不到物品 ${itemId}`);
      return [];
    }
    
    // 从房间移除物品
    room.items.splice(itemIndex, 1);
    
    // 添加到物品栏
    this.inventory.push(itemId);
    console.log(`   🎒 获得 ${itemId}`);
    
    return [itemId];
  }

  /**
   * 使用物品
   */
  async performUseItem(itemId) {
    const itemIndex = this.inventory.indexOf(itemId);
    if (itemIndex === -1) {
      console.log(`   ⚠️  物品栏中没有 ${itemId}`);
      return;
    }
    
    // 简单效果：恢复 HP
    if (itemId.includes('potion')) {
      const healAmount = 30;
      this.stats.hp = Math.min(this.stats.maxHp, this.stats.hp + healAmount);
      console.log(`   💚 使用 ${itemId}，恢复 ${healAmount} HP (${this.stats.hp}/${this.stats.maxHp})`);
    }
    
    // 移除物品
    this.inventory.splice(itemIndex, 1);
  }

  /**
   * 休息
   */
  async performRest() {
    const healAmount = Math.floor(this.stats.maxHp * 0.1);
    this.stats.hp = Math.min(this.stats.maxHp, this.stats.hp + healAmount);
    console.log(`   😴 休息片刻，恢复 ${healAmount} HP (${this.stats.hp}/${this.stats.maxHp})`);
  }

  /**
   * 与队友交谈
   */
  async performTalk(targetId) {
    const teammate = this.perception.teammates.find(t => t.id === targetId);
    if (!teammate) {
      console.log(`   ⚠️  找不到队友 ${targetId}`);
      return;
    }
    
    // 简单对话
    const dialogues = [
      `"我们继续前进吧，${teammate.name}。"`,
      `"小心点，这里感觉不对劲。"`,
      `"你还好吗，${teammate.name}？"`,
      `"发现什么了吗？"`
    ];
    
    const dialogue = dialogues[Math.floor(Math.random() * dialogues.length)];
    console.log(`   💬 ${dialogue}`);
    
    // 改善关系
    if (!this.relationships[targetId]) {
      this.relationships[targetId] = { trust: 0.5 };
    }
    this.relationships[targetId].trust = Math.min(1, this.relationships[targetId].trust + 0.05);
  }

  /**
   * 检查升级
   */
  checkLevelUp() {
    const expNeeded = this.level * 100;
    if (this.experience >= expNeeded) {
      this.level++;
      this.experience -= expNeeded;
      
      // 提升属性
      this.stats.maxHp += 10;
      this.stats.hp = this.stats.maxHp;
      this.stats.attack += 2;
      this.stats.defense += 1;
      
      console.log(`   🎉 ${this.name} 升级到 ${this.level} 级！`);
      return true;
    }
    return false;
  }

  /**
   * 添加记忆
   */
  addMemory(memory) {
    this.memory.push({
      turn: this.orchestrator.turn,
      timestamp: Date.now(),
      ...memory
    });
    
    // 限制记忆数量
    if (this.memory.length > this.maxMemory) {
      this.memory.shift();
    }
  }

  /**
   * 序列化
   */
  serialize() {
    return {
      id: this.id,
      name: this.name,
      role: this.role,
      personality: this.personality,
      stats: this.stats,
      skills: this.skills,
      equipment: this.equipment,
      inventory: this.inventory,
      position: this.position,
      level: this.level,
      experience: this.experience,
      defeatedEnemies: this.defeatedEnemies,
      goals: this.goals,
      memory: this.memory.slice(-10),
      relationships: this.relationships
    };
  }

  /**
   * 工具方法
   */
  isAlive() {
    return this.stats.hp > 0;
  }

  getSelfState() {
    return {
      hp: this.stats.hp,
      maxHp: this.stats.maxHp,
      level: this.level,
      inventory: this.inventory
    };
  }

  getRoleDescription() {
    const roles = {
      'warrior': '勇敢的战士',
      'mage': '智慧的法師',
      'thief': '敏捷的盗贼'
    };
    return roles[this.role] || this.role;
  }

  getDefaultGoals() {
    const goals = {
      'warrior': ['保护队友', '击败敌人', '探索地牢'],
      'mage': ['积累知识', '支援队友', '寻找魔法物品'],
      'thief': ['收集宝藏', '发现秘密', '保持安全']
    };
    return goals[this.role] || ['探索地牢'];
  }

  formatRecentMemory() {
    const recent = this.memory.slice(-5);
    if (recent.length === 0) return '无';
    return recent.map(m => `- [Turn ${m.turn}] ${m.content || m.type}`).join('\n');
  }

  getAvailableActions() {
    const actions = [];
    
    if (this.perception.enemies.length > 0) {
      actions.push(`attack (攻击敌人)`);
    }
    
    if (this.perception.items.length > 0) {
      actions.push(`pickup (拾取物品)`);
    }
    
    if (this.perception.exits.length > 0) {
      actions.push(`move (移动到其他房间)`);
    }
    
    if (this.inventory.length > 0) {
      actions.push(`use_item (使用物品)`);
    }
    
    if (this.perception.teammates.length > 0) {
      actions.push(`talk (与队友交谈)`);
    }
    
    actions.push(`rest (休息)`);
    
    return actions.map((a, i) => `${i+1}. ${a}`).join('\n');
  }
}

module.exports = Agent;
