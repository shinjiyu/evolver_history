/**
 * Dungeon Generator
 * 程序化生成地牢
 */

class DungeonGenerator {
  /**
   * 生成地牢
   */
  static async generate(config = {}) {
    const level = config.level || 1;
    const roomCount = config.roomCount || 5 + Math.floor(level * 1.5);
    
    const dungeon = {
      id: `dungeon_${Date.now()}`,
      level: level,
      rooms: [],
      connections: []
    };
    
    console.log(`   生成 ${roomCount} 个房间...`);
    
    // 生成房间
    for (let i = 0; i < roomCount; i++) {
      const room = this.generateRoom(i, roomCount, level);
      dungeon.rooms.push(room);
    }
    
    // 连接房间
    dungeon.connections = this.connectRooms(dungeon.rooms);
    
    // 更新房间的出口
    for (let connection of dungeon.connections) {
      const room1 = dungeon.rooms.find(r => r.id === connection.from);
      const room2 = dungeon.rooms.find(r => r.id === connection.to);
      
      if (room1 && !room1.exits.includes(room2.id)) {
        room1.exits.push(room2.id);
      }
      if (room2 && !room2.exits.includes(room1.id)) {
        room2.exits.push(room1.id);
      }
    }
    
    return dungeon;
  }

  /**
   * 生成单个房间
   */
  static generateRoom(index, totalRooms, level) {
    // 确定房间类型
    let type;
    if (index === 0) {
      type = 'entrance';
    } else if (index === totalRooms - 1) {
      type = 'boss';
    } else {
      const types = ['hall', 'combat', 'treasure', 'trap', 'rest', 'mystery'];
      const weights = [0.2, 0.3, 0.15, 0.15, 0.1, 0.1];
      type = this.weightedRandomChoice(types, weights);
    }
    
    const room = {
      id: `room_${index}`,
      name: this.getRoomName(type),
      type: type,
      description: this.generateDescription(type, level),
      exits: [],
      items: this.generateItems(type, level),
      enemies: this.generateEnemies(type, level),
      special: this.generateSpecial(type, level),
      visited: false,
      cleared: false
    };
    
    return room;
  }

  /**
   * 连接房间
   */
  static connectRooms(rooms) {
    const connections = [];
    
    // 线性连接（保证可以通关）
    for (let i = 0; i < rooms.length - 1; i++) {
      connections.push({
        from: rooms[i].id,
        to: rooms[i + 1].id
      });
    }
    
    // 添加一些分支连接
    for (let i = 0; i < rooms.length - 2; i++) {
      if (Math.random() < 0.3) {  // 30% 概率添加分支
        connections.push({
          from: rooms[i].id,
          to: rooms[i + 2].id
        });
      }
    }
    
    return connections;
  }

  /**
   * 生成房间名称
   */
  static getRoomName(type) {
    const names = {
      'entrance': ['古老入口', '石门大厅', '遗迹入口'],
      'hall': ['宽敞大厅', '走廊', '前厅'],
      'combat': ['战斗场地', '竞技场', '厮杀之地'],
      'treasure': ['宝物室', '藏宝间', '财富之厅'],
      'trap': ['陷阱走廊', '机关房', '危险区域'],
      'rest': ['休息营地', '安全屋', '篝火旁'],
      'mystery': ['神秘房间', '符文室', '祭坛'],
      'boss': ['Boss 房间', '王座之间', '深渊核心']
    };
    
    const options = names[type] || ['未知房间'];
    return options[Math.floor(Math.random() * options.length)];
  }

  /**
   * 生成房间描述
   */
  static generateDescription(type, level) {
    const descriptions = {
      'entrance': [
        '你站在古老的石门前，感受到地下城深处的寒气。',
        '入口处的符文微微发光，似乎在警告着什么。',
        '破旧的阶梯向下延伸，消失在黑暗中。'
      ],
      'hall': [
        '宽敞的大厅，墙壁上有奇怪的符文。',
        '石柱林立，地面布满灰尘和碎石。',
        '昏暗的灯光下，你能看到远处的影子在晃动。'
      ],
      'combat': [
        '战斗痕迹遍布，地上有干涸的血迹。',
        '空气中弥漫着铁锈和血腥的味道。',
        '这里显然经历过激烈的战斗。'
      ],
      'treasure': [
        '宝箱静静地放在角落，散发着诱人的光芒。',
        '金币和宝石散落在地上，闪烁着微光。',
        '古老的展示架上摆放着珍贵的物品。'
      ],
      'trap': [
        '你的直觉告诉你，这里充满了危险。',
        '地面的石板有些松动，小心脚下！',
        '墙壁上的机关似乎随时会触发。'
      ],
      'rest': [
        '这里有一堆篝火的痕迹，看起来很安全。',
        '阳光从裂缝中透进来，让你感到一丝温暖。',
        '墙上刻着前人留下的标记，这里是休息点。'
      ],
      'mystery': [
        '神秘的符文在空中漂浮，你感到一股魔力。',
        '祭坛上放着奇怪的物品，似乎有某种仪式。',
        '虚空中传来低语，你能听懂吗？'
      ],
      'boss': [
        '沉重的压力笼罩着这里，你知道BOSS就在前方。',
        '巨大的王座伫立在房间尽头，等待着挑战者。',
        '深渊的气息扑面而来，最终的挑战即将开始。'
      ]
    };
    
    const options = descriptions[type] || ['一个普通的房间。'];
    return options[Math.floor(Math.random() * options.length)];
  }

  /**
   * 生成物品
   */
  static generateItems(type, level) {
    const items = [];
    
    const itemChances = {
      'entrance': 0.2,
      'hall': 0.3,
      'combat': 0.4,
      'treasure': 0.9,
      'trap': 0.2,
      'rest': 0.6,
      'mystery': 0.7,
      'boss': 0.8
    };
    
    if (Math.random() < (itemChances[type] || 0.3)) {
      const possibleItems = this.getPossibleItems(level);
      const itemCount = type === 'treasure' ? 
        Math.floor(Math.random() * 3) + 1 : 
        Math.floor(Math.random() * 2);
      
      for (let i = 0; i < itemCount; i++) {
        const item = possibleItems[Math.floor(Math.random() * possibleItems.length)];
        if (!items.includes(item)) {
          items.push(item);
        }
      }
    }
    
    return items;
  }

  /**
   * 获取可能的物品
   */
  static getPossibleItems(level) {
    const common = ['health_potion', 'mana_potion', 'torch', 'rope'];
    const uncommon = ['iron_sword', 'leather_armor', 'magic_scroll', 'gold_coins'];
    const rare = ['enchanted_gem', 'ancient_artifact', 'rare_herb'];
    
    const items = [...common];
    
    if (level >= 2) items.push(...uncommon);
    if (level >= 4) items.push(...rare);
    
    return items;
  }

  /**
   * 生成敌人
   */
  static generateEnemies(type, level) {
    if (type !== 'combat' && type !== 'boss') {
      return [];
    }
    
    const enemies = [];
    const enemyCount = type === 'boss' ? 1 : Math.floor(Math.random() * 3) + 1;
    
    for (let i = 0; i < enemyCount; i++) {
      const enemyType = type === 'boss' ? 
        this.getBossType(level) : 
        this.getEnemyType(level);
      
      const enemy = {
        id: `enemy_${Date.now()}_${i}`,
        type: enemyType.name,
        hp: enemyType.baseHp + level * 10,
        maxHp: enemyType.baseHp + level * 10,
        attack: enemyType.baseAttack + level * 2,
        defense: enemyType.baseDefense + level,
        experience: enemyType.experience * level,
        isBoss: type === 'boss'
      };
      
      enemies.push(enemy);
    }
    
    return enemies;
  }

  /**
   * 获取敌人类型
   */
  static getEnemyType(level) {
    const enemyTypes = [
      { name: '哥布林', baseHp: 20, baseAttack: 5, baseDefense: 2, experience: 10 },
      { name: '骷髅兵', baseHp: 30, baseAttack: 8, baseDefense: 3, experience: 15 },
      { name: '史莱姆', baseHp: 25, baseAttack: 4, baseDefense: 1, experience: 8 },
      { name: '暗影狼', baseHp: 35, baseAttack: 10, baseDefense: 2, experience: 20 },
      { name: '石像鬼', baseHp: 50, baseAttack: 12, baseDefense: 8, experience: 30 }
    ];
    
    // 根据等级选择合适的敌人
    const availableTypes = enemyTypes.filter(e => e.baseHp <= level * 20 + 30);
    return availableTypes[Math.floor(Math.random() * availableTypes.length)] || enemyTypes[0];
  }

  /**
   * 获取 Boss 类型
   */
  static getBossType(level) {
    const bossTypes = [
      { name: '地牢守护者', baseHp: 100, baseAttack: 15, baseDefense: 10, experience: 100 },
      { name: '深渊领主', baseHp: 150, baseAttack: 20, baseDefense: 12, experience: 150 },
      { name: '古神化身', baseHp: 200, baseAttack: 25, baseDefense: 15, experience: 200 }
    ];
    
    return bossTypes[Math.min(level - 1, bossTypes.length - 1)] || bossTypes[0];
  }

  /**
   * 生成特殊事件
   */
  static generateSpecial(type, level) {
    if (type !== 'mystery' && type !== 'trap') {
      return null;
    }
    
    const specials = {
      'mystery': [
        { type: 'riddle', description: '墙上有一个谜题需要解答' },
        { type: 'blessing', description: '祭坛上有神秘的祝福' },
        { type: 'curse', description: '触碰这里会受到诅咒' },
        { type: 'portal', description: '一个传送门出现在眼前' }
      ],
      'trap': [
        { type: 'spike_trap', description: '地面有尖刺陷阱', damage: 20 },
        { type: 'poison_gas', description: '毒气陷阱', damage: 15 },
        { type: 'falling_rocks', description: '落石陷阱', damage: 25 }
      ]
    };
    
    const options = specials[type];
    return options ? options[Math.floor(Math.random() * options.length)] : null;
  }

  /**
   * 加权随机选择
   */
  static weightedRandomChoice(items, weights) {
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < items.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return items[i];
      }
    }
    
    return items[items.length - 1];
  }
}

module.exports = DungeonGenerator;
