/**
 * Game Orchestrator
 * 管理游戏主循环，协调所有 Agent
 */

const fs = require('fs').promises;
const path = require('path');
const Agent = require('../agents/agent');
const DungeonGenerator = require('./dungeon-generator');

class GameOrchestrator {
  constructor(config = {}) {
    this.gameId = `game_${Date.now()}`;
    this.turn = 0;
    this.maxTurns = config.maxTurns || 100;
    this.state = 'initializing';
    this.config = config;
    
    // 游戏状态
    this.dungeon = null;
    this.agents = [];
    this.events = [];
    this.humanAdvice = null;
    
    // 数据路径
    this.dataDir = path.join(__dirname, '../data');
    this.logDir = path.join(__dirname, '../logs');
  }

  /**
   * 初始化游戏
   */
  async initialize() {
    console.log('🎮 初始化深渊遗迹探险队...\n');
    
    // 确保目录存在
    await this.ensureDirectories();
    
    // 生成地牢
    console.log('🏰 生成地牢...');
    this.dungeon = await DungeonGenerator.generate({
      level: this.config.level || 1,
      roomCount: this.config.roomCount || 7
    });
    console.log(`   ✓ 地牢 ${this.dungeon.id} 生成完成 (${this.dungeon.rooms.length} 个房间)\n`);
    
    // 创建 Agent
    console.log('👥 组建探险队...');
    const agentConfigs = this.config.agents || this.getDefaultAgents();
    for (let config of agentConfigs) {
      const agent = new Agent(config, this);
      await agent.initialize();
      this.agents.push(agent);
      console.log(`   ✓ ${agent.name} (${agent.role}) 加入队伍`);
    }
    console.log('');
    
    // 保存初始状态
    await this.saveGameState();
    
    this.state = 'running';
    console.log('✅ 游戏初始化完成！\n');
    console.log('═'.repeat(60));
    console.log('');
  }

  /**
   * 游戏主循环
   */
  async gameLoop() {
    while (this.state === 'running' && this.turn < this.maxTurns) {
      this.turn++;
      
      console.log(`\n⏱️  第 ${this.turn} 回合`);
      console.log('─'.repeat(60));
      
      try {
        // 1. 感知阶段
        await this.updatePerceptions();
        
        // 2. 决策阶段（并行）
        const decisions = await this.collectDecisions();
        
        // 3. 执行阶段（按速度排序）
        await this.executeDecisions(decisions);
        
        // 4. 更新状态
        await this.updateGameState();
        
        // 5. 记录事件
        await this.logEvents();
        
        // 6. 保存状态
        await this.saveGameState();
        
        // 7. 检查游戏结束
        const endReason = this.checkGameEnd();
        if (endReason) {
          this.state = 'ended';
          await this.endGame(endReason);
          break;
        }
        
        // 延迟
        await this.sleep(1000);
        
      } catch (error) {
        console.error(`❌ 回合 ${this.turn} 错误:`, error.message);
        this.addEvent('error', { message: error.message });
      }
    }
    
    if (this.turn >= this.maxTurns) {
      await this.endGame('max_turns_reached');
    }
  }

  /**
   * 更新所有 Agent 的感知
   */
  async updatePerceptions() {
    for (let agent of this.agents) {
      if (agent.isAlive()) {
        agent.updatePerception(this.dungeon, this.agents);
      }
    }
  }

  /**
   * 收集所有 Agent 的决策（并行）
   */
  async collectDecisions() {
    const aliveAgents = this.agents.filter(a => a.isAlive());
    
    // 并行决策
    const decisionPromises = aliveAgents.map(async agent => {
      try {
        const decision = await agent.decide(this.humanAdvice);
        return { agent, decision };
      } catch (error) {
        console.error(`   ⚠️  ${agent.name} 决策失败: ${error.message}`);
        return { agent, decision: { action: 'rest', reason: '决策失败' } };
      }
    });
    
    const results = await Promise.all(decisionPromises);
    
    // 按速度排序
    results.sort((a, b) => b.agent.stats.speed - a.agent.stats.speed);
    
    return results;
  }

  /**
   * 执行所有决策
   */
  async executeDecisions(decisions) {
    for (let { agent, decision } of decisions) {
      await this.executeAgentDecision(agent, decision);
    }
  }

  /**
   * 执行单个 Agent 的决策
   */
  async executeAgentDecision(agent, decision) {
    console.log(`\n🤖 ${agent.name}: ${decision.action}${decision.target ? ` → ${decision.target}` : ''}`);
    console.log(`   💭 ${decision.reason}`);
    
    const result = await agent.executeAction(decision);
    
    // 记录事件
    this.addEvent('agent_action', {
      agentId: agent.id,
      agentName: agent.name,
      action: decision.action,
      target: decision.target,
      reason: decision.reason,
      result: result
    });
    
    // 如果有战斗，处理战斗结果
    if (result.combat) {
      await this.handleCombatResult(result.combat);
    }
    
    // 如果有物品获得
    if (result.items) {
      this.addEvent('item_pickup', {
        agentId: agent.id,
        items: result.items
      });
    }
  }

  /**
   * 处理战斗结果
   */
  async handleCombatResult(combat) {
    // 移除死亡的敌人
    for (let enemy of combat.defeatedEnemies || []) {
      this.addEvent('enemy_defeated', { enemy });
    }
    
    // 记录 Agent 伤害
    for (let damage of combat.agentDamages || []) {
      this.addEvent('agent_damaged', damage);
    }
  }

  /**
   * 更新游戏状态
   */
  async updateGameState() {
    // 更新地牢状态（敌人刷新、陷阱重置等）
    // TODO: 实现动态更新
    
    // 检查是否有 Agent 升级
    for (let agent of this.agents) {
      if (agent.checkLevelUp()) {
        this.addEvent('level_up', {
          agentId: agent.id,
          agentName: agent.name,
          newLevel: agent.level
        });
      }
    }
  }

  /**
   * 记录事件到日志
   */
  async logEvents() {
    const logFile = path.join(this.logDir, `game_${this.gameId}.log`);
    const recentEvents = this.events.slice(-5);
    
    for (let event of recentEvents) {
      const logLine = `[Turn ${this.turn}] [${event.type}] ${JSON.stringify(event.data)}\n`;
      await fs.appendFile(logFile, logLine);
    }
  }

  /**
   * 保存游戏状态
   */
  async saveGameState() {
    const stateFile = path.join(this.dataDir, 'game-state.json');
    
    const state = {
      gameId: this.gameId,
      turn: this.turn,
      state: this.state,
      dungeon: this.dungeon,
      agents: this.agents.map(a => a.serialize()),
      events: this.events.slice(-100)  // 只保留最近 100 个事件
    };
    
    await fs.writeFile(stateFile, JSON.stringify(state, null, 2));
  }

  /**
   * 检查游戏结束条件
   */
  checkGameEnd() {
    // 所有 Agent 死亡
    const aliveAgents = this.agents.filter(a => a.isAlive());
    if (aliveAgents.length === 0) {
      return 'all_agents_dead';
    }
    
    // 到达 Boss 房并击败 Boss
    const bossRoom = this.dungeon.rooms.find(r => r.type === 'boss');
    if (bossRoom && bossRoom.cleared) {
      return 'boss_defeated';
    }
    
    // 找到宝藏
    // TODO: 实现宝藏条件
    
    return null;
  }

  /**
   * 结束游戏
   */
  async endGame(reason) {
    console.log('\n');
    console.log('═'.repeat(60));
    console.log('🏁 探险结束！\n');
    console.log(`结束原因: ${this.getEndReasonText(reason)}`);
    console.log(`总回合数: ${this.turn}`);
    
    // 统计
    console.log('\n📊 探险统计:');
    for (let agent of this.agents) {
      console.log(`   ${agent.name}:`);
      console.log(`     - 存活: ${agent.isAlive() ? '是' : '否'}`);
      console.log(`     - 等级: ${agent.level}`);
      console.log(`     - 经验: ${agent.experience}`);
      console.log(`     - 击败敌人: ${agent.defeatedEnemies}`);
    }
    
    // 生成最终报告
    await this.generateReport(reason);
    
    console.log('\n✅ 感谢游玩！\n');
  }

  /**
   * 生成探险报告
   */
  async generateReport(reason) {
    const reportFile = path.join(this.logDir, `report_${this.gameId}.md`);
    
    let report = `# 深渊遗迹探险报告\n\n`;
    report += `**探险 ID**: ${this.gameId}\n`;
    report += `**地牢等级**: ${this.dungeon.level}\n`;
    report += `**总回合数**: ${this.turn}\n`;
    report += `**结束原因**: ${this.getEndReasonText(reason)}\n\n`;
    
    report += `## 探险队成员\n\n`;
    for (let agent of this.agents) {
      report += `### ${agent.name} (${agent.role})\n`;
      report += `- 存活: ${agent.isAlive() ? '是' : '否'}\n`;
      report += `- 等级: ${agent.level}\n`;
      report += `- 经验: ${agent.experience}\n`;
      report += `- 击败敌人: ${agent.defeatedEnemies}\n`;
      report += `- 获得物品: ${agent.inventory.length}\n\n`;
    }
    
    report += `## 重要事件\n\n`;
    const importantEvents = this.events.filter(e => 
      ['level_up', 'enemy_defeated', 'agent_died', 'treasure_found'].includes(e.type)
    );
    for (let event of importantEvents) {
      report += `- [Turn ${event.turn}] ${event.type}: ${JSON.stringify(event.data)}\n`;
    }
    
    await fs.writeFile(reportFile, report);
    console.log(`📄 探险报告已保存: ${reportFile}`);
  }

  /**
   * 接收人类建议
   */
  receiveHumanAdvice(advice) {
    this.humanAdvice = advice;
    console.log(`\n💡 人类顾问建议: "${advice}"\n`);
  }

  /**
   * 添加事件
   */
  addEvent(type, data) {
    this.events.push({
      turn: this.turn,
      timestamp: Date.now(),
      type: type,
      data: data
    });
  }

  /**
   * 工具方法
   */
  async ensureDirectories() {
    await fs.mkdir(this.dataDir, { recursive: true });
    await fs.mkdir(this.logDir, { recursive: true });
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getDefaultAgents() {
    return [
      {
        id: 'warrior_01',
        name: '凯恩',
        role: 'warrior',
        personality: { bravery: 0.9, caution: 0.3, greed: 0.6, altruism: 0.5 },
        stats: { hp: 100, maxHp: 100, attack: 15, defense: 10, speed: 8 },
        skills: ['charge', 'shield_bash', 'taunt']
      },
      {
        id: 'mage_01',
        name: '艾莉丝',
        role: 'mage',
        personality: { bravery: 0.5, caution: 0.7, greed: 0.4, altruism: 0.8 },
        stats: { hp: 60, maxHp: 60, attack: 20, defense: 5, speed: 10 },
        skills: ['fireball', 'heal', 'shield']
      },
      {
        id: 'thief_01',
        name: '罗格',
        role: 'thief',
        personality: { bravery: 0.6, caution: 0.5, greed: 0.9, altruism: 0.2 },
        stats: { hp: 70, maxHp: 70, attack: 12, defense: 6, speed: 15 },
        skills: ['backstab', 'steal', 'detect_trap']
      }
    ];
  }

  getEndReasonText(reason) {
    const reasons = {
      'all_agents_dead': '全军覆没',
      'boss_defeated': '击败 Boss，探险成功',
      'max_turns_reached': '达到最大回合数',
      'treasure_found': '找到宝藏'
    };
    return reasons[reason] || reason;
  }
}

module.exports = GameOrchestrator;
