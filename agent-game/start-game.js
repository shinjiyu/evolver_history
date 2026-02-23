#!/usr/bin/env node

/**
 * 深渊遗迹探险队 - 启动脚本
 * 
 * 这是一个 AI Agent 驱动的协作探险游戏
 * 多个 AI Agent 组队探索随机生成的地牢
 */

const GameOrchestrator = require('./core/orchestrator');

// 游戏配置
const gameConfig = {
  level: 1,           // 地牢等级
  roomCount: 7,       // 房间数量
  maxTurns: 50,       // 最大回合数
  
  // Agent 配置
  agents: [
    {
      id: 'warrior_01',
      name: '凯恩',
      role: 'warrior',
      personality: {
        bravery: 0.9,    // 勇敢
        caution: 0.3,    // 谨慎
        greed: 0.6,      // 贪婪
        altruism: 0.5    // 利他
      },
      stats: {
        hp: 100,
        maxHp: 100,
        attack: 15,
        defense: 10,
        speed: 8
      },
      skills: ['charge', 'shield_bash', 'taunt'],
      goals: ['保护队友', '击败敌人', '探索地牢']
    },
    {
      id: 'mage_01',
      name: '艾莉丝',
      role: 'mage',
      personality: {
        bravery: 0.5,
        caution: 0.7,
        greed: 0.4,
        altruism: 0.8
      },
      stats: {
        hp: 60,
        maxHp: 60,
        attack: 20,
        defense: 5,
        speed: 10
      },
      skills: ['fireball', 'heal', 'shield'],
      goals: ['支援队友', '积累知识', '寻找魔法物品']
    },
    {
      id: 'thief_01',
      name: '罗格',
      role: 'thief',
      personality: {
        bravery: 0.6,
        caution: 0.5,
        greed: 0.9,
        altruism: 0.2
      },
      stats: {
        hp: 70,
        maxHp: 70,
        attack: 12,
        defense: 6,
        speed: 15
      },
      skills: ['backstab', 'steal', 'detect_trap'],
      goals: ['收集宝藏', '发现秘密', '保持安全']
    }
  ]
};

// 主函数
async function main() {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║          🏰 深渊遗迹探险队 🏰                              ║');
  console.log('║                                                            ║');
  console.log('║   一个 AI Agent 驱动的协作探险游戏                          ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('');
  
  // 创建游戏编排器
  const game = new GameOrchestrator(gameConfig);
  
  try {
    // 初始化游戏
    await game.initialize();
    
    // 开始游戏循环
    await game.gameLoop();
    
  } catch (error) {
    console.error('\n❌ 游戏错误:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// 处理未捕获的错误
process.on('uncaughtException', (error) => {
  console.error('\n❌ 未捕获的错误:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('\n❌ 未处理的 Promise 拒绝:', reason);
  process.exit(1);
});

// 运行
main();
