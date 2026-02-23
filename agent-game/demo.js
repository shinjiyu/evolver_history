#!/usr/bin/env node

/**
 * Agent Game - 快速演示
 * 展示核心特性，运行 10 回合
 */

const GameOrchestrator = require('./core/orchestrator');

async function demo() {
  console.log('🎯 Agent Game - 快速演示\n');
  console.log('本演示将运行 10 回合，展示 AI Agent 如何协作探索地牢\n');
  console.log('═'.repeat(60));
  
  const config = {
    level: 1,
    roomCount: 5,
    maxTurns: 10,
    agents: [
      {
        id: 'warrior_01',
        name: '凯恩',
        role: 'warrior',
        personality: { bravery: 0.9, caution: 0.3, greed: 0.6, altruism: 0.5 },
        stats: { hp: 100, maxHp: 100, attack: 15, defense: 10, speed: 8 },
        skills: ['charge', 'shield_bash', 'taunt'],
        goals: ['保护队友', '击败敌人', '探索地牢']
      },
      {
        id: 'mage_01',
        name: '艾莉丝',
        role: 'mage',
        personality: { bravery: 0.5, caution: 0.7, greed: 0.4, altruism: 0.8 },
        stats: { hp: 60, maxHp: 60, attack: 20, defense: 5, speed: 10 },
        skills: ['fireball', 'heal', 'shield'],
        goals: ['支援队友', '积累知识', '寻找魔法物品']
      }
    ]
  };
  
  const game = new GameOrchestrator(config);
  
  try {
    await game.initialize();
    await game.gameLoop();
  } catch (error) {
    console.error('错误:', error);
  }
  
  console.log('\n═'.repeat(60));
  console.log('\n✅ 演示完成！');
  console.log('\n💡 核心特性:');
  console.log('   • AI Agent 自主决策和行动');
  console.log('   • 随机生成的地牢和事件');
  console.log('   • Agent 之间的协作和互动');
  console.log('   • 战斗、探索、成长系统');
  console.log('\n📚 完整游戏请运行: node start-game.js');
  console.log('📖 文档: docs/GAME_DESIGN.md');
}

demo();
