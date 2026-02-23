/**
 * Game Room
 * 管理单个游戏房间，协调多个远程 AI Agent
 */

const path = require('path');
const GameOrchestrator = require('../core/orchestrator');
const RemoteAgent = require('./remote-agent');

class GameRoom {
  constructor(roomId, config = {}) {
    this.id = roomId;
    this.config = config;
    this.state = 'waiting'; // waiting, running, ended
    this.createdAt = new Date().toISOString();
    
    // 最大玩家数
    this.maxPlayers = config.maxPlayers || 3;
    
    // 连接的 AI
    this.agents = new Map(); // aiId -> {ws, agent}
    
    // 游戏 Orchestrator
    this.orchestrator = null;
    
    // 决策队列（等待 AI 提交）
    this.pendingDecisions = new Map();
    
    // 决策超时（毫秒）
    this.decisionTimeout = config.decisionTimeout || 30000;
    
    // 游戏事件历史
    this.eventHistory = [];
  }
  
  /**
   * 添加 AI 到房间
   */
  async addAI(ws, aiId, aiConfig) {
    // 检查房间状态
    if (this.state !== 'waiting') {
      return { success: false, error: '游戏已经开始' };
    }
    
    // 检查是否已满
    if (this.agents.size >= this.maxPlayers) {
      return { success: false, error: '房间已满' };
    }
    
    // 检查是否已存在
    if (this.agents.has(aiId)) {
      return { success: false, error: 'AI ID 已存在' };
    }
    
    // 创建远程 Agent
    const agent = new RemoteAgent({
      id: aiId,
      name: aiConfig.name || aiId,
      role: aiConfig.role || this.getNextRole(),
      personality: aiConfig.personality,
      stats: aiConfig.stats,
      skills: aiConfig.skills
    }, this);
    
    await agent.initialize();
    
    this.agents.set(aiId, { ws, agent });
    
    // 广播加入消息
    this.broadcast({
      type: 'player_joined',
      aiId,
      playerCount: this.agents.size,
      maxPlayers: this.maxPlayers
    });
    
    return { success: true, agent: agent.serialize() };
  }
  
  /**
   * 获取下一个角色
   */
  getNextRole() {
    const roles = ['warrior', 'mage', 'thief'];
    const usedRoles = Array.from(this.agents.values()).map(a => a.agent.role);
    return roles.find(r => !usedRoles.includes(r)) || 'warrior';
  }
  
  /**
   * 移除 AI
   */
  removeAI(aiId) {
    if (!this.agents.has(aiId)) return;
    
    this.agents.delete(aiId);
    
    this.broadcast({
      type: 'player_left',
      aiId,
      playerCount: this.agents.size
    });
    
    // 如果游戏进行中，暂停或结束
    if (this.state === 'running') {
      // 标记为掉线，但不结束游戏（允许重连）
      this.addEvent('ai_disconnected', { aiId });
    }
  }
  
  /**
   * 处理 AI 断开连接
   */
  handleAIDisconnect(aiId) {
    console.log(`⚠️  AI ${aiId} 断开连接`);
    this.removeAI(aiId);
  }
  
  /**
   * 检查是否可以开始游戏
   */
  canStart() {
    return this.agents.size >= this.maxPlayers && this.state === 'waiting';
  }
  
  /**
   * 开始游戏
   */
  async startGame() {
    if (this.state !== 'waiting') {
      console.log(`⚠️  房间 ${this.id} 游戏已经开始或结束`);
      return;
    }
    
    console.log(`🎮 房间 ${this.id} 游戏开始！`);
    
    this.state = 'running';
    
    // 创建 Orchestrator
    const agentConfigs = Array.from(this.agents.values()).map(a => a.agent.getConfig());
    
    this.orchestrator = new GameOrchestrator({
      ...this.config,
      agents: agentConfigs
    });
    
    // 替换 Orchestrator 的 Agent 为远程 Agent
    this.orchestrator.agents = Array.from(this.agents.values()).map(a => a.agent);
    
    // 初始化游戏
    await this.orchestrator.initialize();
    
    // 广播游戏开始
    this.broadcast({
      type: 'game_started',
      roomId: this.id,
      dungeon: this.orchestrator.dungeon,
      agents: agentConfigs
    });
    
    // 开始游戏循环
    this.runGameLoop();
  }
  
  /**
   * 游戏主循环
   */
  async runGameLoop() {
    while (this.state === 'running') {
      this.orchestrator.turn++;
      
      console.log(`\n⏱️  房间 ${this.id} 第 ${this.orchestrator.turn} 回合`);
      
      try {
        // 1. 广播回合开始
        this.broadcast({
          type: 'turn_start',
          turn: this.orchestrator.turn,
          gameState: this.getGameState()
        });
        
        // 2. 收集决策（等待远程 AI）
        const decisions = await this.collectRemoteDecisions();
        
        // 3. 执行决策
        await this.executeDecisions(decisions);
        
        // 4. 更新状态
        await this.orchestrator.updateGameState();
        
        // 5. 广播回合结果
        this.broadcast({
          type: 'turn_end',
          turn: this.orchestrator.turn,
          gameState: this.getGameState()
        });
        
        // 6. 保存状态
        await this.orchestrator.saveGameState();
        
        // 7. 检查游戏结束
        const endReason = this.orchestrator.checkGameEnd();
        if (endReason) {
          this.state = 'ended';
          await this.endGame(endReason);
          break;
        }
        
        // 延迟
        await this.sleep(2000);
        
      } catch (error) {
        console.error(`❌ 房间 ${this.id} 回合 ${this.orchestrator.turn} 错误:`, error);
        this.addEvent('error', { message: error.message });
      }
    }
  }
  
  /**
   * 收集远程 AI 的决策
   */
  async collectRemoteDecisions() {
    // 清空决策队列
    this.pendingDecisions.clear();
    
    // 请求所有 AI 提交决策
    this.broadcast({
      type: 'request_decision',
      turn: this.orchestrator.turn,
      timeout: this.decisionTimeout
    });
    
    // 等待所有 AI 提交决策
    const aiIds = Array.from(this.agents.keys());
    
    const decisionPromises = aiIds.map(aiId => {
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          console.log(`   ⚠️  ${aiId} 决策超时`);
          resolve({ aiId, decision: { action: 'rest', reason: '决策超时' } });
        }, this.decisionTimeout);
        
        // 监听决策提交
        const checkDecision = () => {
          if (this.pendingDecisions.has(aiId)) {
            clearTimeout(timeout);
            resolve({ aiId, decision: this.pendingDecisions.get(aiId) });
          } else {
            setTimeout(checkDecision, 100);
          }
        };
        checkDecision();
      });
    });
    
    const results = await Promise.all(decisionPromises);
    
    // 按速度排序
    results.sort((a, b) => {
      const agentA = this.agents.get(a.aiId)?.agent;
      const agentB = this.agents.get(b.aiId)?.agent;
      return (agentB?.stats.speed || 10) - (agentA?.stats.speed || 10);
    });
    
    return results;
  }
  
  /**
   * 提交行动（从 AI）
   */
  async submitAction(aiId, action) {
    if (this.state !== 'running') {
      return { success: false, error: '游戏未开始' };
    }
    
    if (!this.agents.has(aiId)) {
      return { success: false, error: 'AI 不存在' };
    }
    
    // 保存到决策队列
    this.pendingDecisions.set(aiId, action);
    
    console.log(`   ✅ 收到 ${aiId} 的决策: ${action.action}`);
    
    return { success: true };
  }
  
  /**
   * 执行所有决策
   */
  async executeDecisions(decisions) {
    for (let { aiId, decision } of decisions) {
      const agentData = this.agents.get(aiId);
      if (!agentData) continue;
      
      const agent = agentData.agent;
      
      // 更新感知
      agent.updatePerception(this.orchestrator.dungeon, Array.from(this.agents.values()).map(a => a.agent));
      
      // 执行行动
      const result = await agent.executeAction(decision);
      
      // 广播行动结果
      this.broadcast({
        type: 'action_executed',
        aiId,
        agentName: agent.name,
        action: decision.action,
        target: decision.target,
        reason: decision.reason,
        result
      });
      
      // 记录事件
      this.orchestrator.addEvent('agent_action', {
        agentId: aiId,
        agentName: agent.name,
        action: decision.action,
        target: decision.target,
        reason: decision.reason,
        result
      });
    }
  }
  
  /**
   * 结束游戏
   */
  async endGame(reason) {
    console.log(`🏁 房间 ${this.id} 游戏结束: ${reason}`);
    
    // 生成报告
    await this.orchestrator.endGame(reason);
    
    // 广播游戏结束
    this.broadcast({
      type: 'game_ended',
      reason,
      turn: this.orchestrator.turn,
      finalStats: this.getFinalStats()
    });
    
    // 清理
    setTimeout(() => {
      this.cleanup();
    }, 60000); // 1分钟后清理
  }
  
  /**
   * 获取最终统计
   */
  getFinalStats() {
    return Array.from(this.agents.values()).map(a => ({
      id: a.agent.id,
      name: a.agent.name,
      role: a.agent.role,
      alive: a.agent.isAlive(),
      level: a.agent.level,
      experience: a.agent.experience,
      defeatedEnemies: a.agent.defeatedEnemies
    }));
  }
  
  /**
   * 获取游戏状态
   */
  getGameState() {
    return {
      roomId: this.id,
      state: this.state,
      turn: this.orchestrator?.turn || 0,
      dungeon: this.orchestrator?.dungeon || null,
      agents: Array.from(this.agents.values()).map(a => a.agent.serialize())
    };
  }
  
  /**
   * 获取房间状态
   */
  getStatus() {
    return {
      id: this.id,
      state: this.state,
      playerCount: this.agents.size,
      maxPlayers: this.maxPlayers,
      createdAt: this.createdAt,
      agents: Array.from(this.agents.keys())
    };
  }
  
  /**
   * 广播消息到所有 AI
   */
  broadcast(message) {
    const data = JSON.stringify(message);
    
    for (let [aiId, agentData] of this.agents) {
      try {
        if (agentData.ws.readyState === 1) { // WebSocket.OPEN
          agentData.ws.send(data);
        }
      } catch (error) {
        console.error(`   ❌ 发送消息给 ${aiId} 失败:`, error.message);
      }
    }
  }
  
  /**
   * 添加事件
   */
  addEvent(type, data) {
    this.eventHistory.push({
      turn: this.orchestrator?.turn || 0,
      timestamp: Date.now(),
      type,
      data
    });
  }
  
  /**
   * 清理房间
   */
  cleanup() {
    console.log(`🧹 清理房间 ${this.id}`);
    
    // 关闭所有连接
    for (let [aiId, agentData] of this.agents) {
      try {
        agentData.ws.close();
      } catch (error) {}
    }
    
    this.agents.clear();
    this.pendingDecisions.clear();
  }
  
  /**
   * 工具方法
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = GameRoom;
