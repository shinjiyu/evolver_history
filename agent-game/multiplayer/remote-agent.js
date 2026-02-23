/**
 * Remote Agent
 * 代表远程 AI 控制的 Agent
 */

const Agent = require('../agents/agent');

class RemoteAgent extends Agent {
  constructor(config, orchestrator) {
    super(config, orchestrator);
    
    // 远程 Agent 特有属性
    this.connectionStatus = 'connected'; // connected, disconnected, timeout
    this.lastHeartbeat = Date.now();
    this.decisionCount = 0;
    this.timeoutCount = 0;
  }
  
  /**
   * 决策（远程 AI 的决策通过 WebSocket 接收）
   */
  async decide(humanAdvice = null) {
    // 对于远程 Agent，决策是从外部接收的，这里不实现
    // 实际决策在 GameRoom.collectRemoteDecisions() 中处理
    return { action: 'rest', reason: '等待远程决策' };
  }
  
  /**
   * 更新心跳
   */
  updateHeartbeat() {
    this.lastHeartbeat = Date.now();
    this.connectionStatus = 'connected';
  }
  
  /**
   * 检查连接状态
   */
  checkConnection(timeout = 60000) {
    if (Date.now() - this.lastHeartbeat > timeout) {
      this.connectionStatus = 'timeout';
      return false;
    }
    return this.connectionStatus === 'connected';
  }
  
  /**
   * 记录决策
   */
  recordDecision(decision) {
    this.decisionCount++;
    this.addMemory({
      type: 'action',
      content: `${decision.action} → ${decision.target || 'self'}`
    });
  }
  
  /**
   * 获取配置（用于初始化）
   */
  getConfig() {
    return {
      id: this.id,
      name: this.name,
      role: this.role,
      personality: this.personality,
      stats: this.stats,
      skills: this.skills,
      goals: this.goals
    };
  }
  
  /**
   * 序列化（包含远程 Agent 特有信息）
   */
  serialize() {
    return {
      ...super.serialize(),
      connectionStatus: this.connectionStatus,
      decisionCount: this.decisionCount,
      timeoutCount: this.timeoutCount
    };
  }
}

module.exports = RemoteAgent;
