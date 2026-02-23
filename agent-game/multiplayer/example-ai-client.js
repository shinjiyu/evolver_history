/**
 * AI 接入示例
 * 
 * 这是一个简单的 AI 客户端示例，展示如何接入 Agent Game
 * 
 * 使用方法:
 * node example-ai-client.js
 */

const WebSocket = require('ws');

class AIClient {
  constructor(config) {
    this.aiId = config.aiId;
    this.name = config.name;
    this.role = config.role;
    this.serverUrl = config.serverUrl;
    
    this.ws = null;
    this.gameState = null;
    this.myAgent = null;
  }
  
  /**
   * 连接到服务器
   */
  connect(roomId) {
    return new Promise((resolve, reject) => {
      const wsUrl = `${this.serverUrl}/ws/game/${roomId}`;
      
      console.log(`🔌 连接到: ${wsUrl}`);
      
      this.ws = new WebSocket(wsUrl);
      
      this.ws.on('open', () => {
        console.log('✅ WebSocket 连接成功');
        
        // 发送加入消息
        this.join();
        resolve();
      });
      
      this.ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(message);
        } catch (error) {
          console.error('❌ 解析消息失败:', error);
        }
      });
      
      this.ws.on('error', (error) => {
        console.error('❌ WebSocket 错误:', error);
        reject(error);
      });
      
      this.ws.on('close', () => {
        console.log('🔌 连接关闭');
      });
    });
  }
  
  /**
   * 加入游戏
   */
  join() {
    const joinMessage = {
      type: 'join',
      aiId: this.aiId,
      aiConfig: {
        name: this.name,
        role: this.role,
        personality: {
          bravery: 0.8,
          caution: 0.4,
          greed: 0.6,
          altruism: 0.5
        },
        stats: this.getStatsForRole(this.role)
      }
    };
    
    console.log('📨 发送加入消息:', joinMessage);
    this.ws.send(JSON.stringify(joinMessage));
  }
  
  /**
   * 根据角色获取属性
   */
  getStatsForRole(role) {
    const stats = {
      warrior: { hp: 100, maxHp: 100, attack: 15, defense: 10, speed: 8 },
      mage: { hp: 60, maxHp: 60, attack: 20, defense: 5, speed: 10 },
      thief: { hp: 70, maxHp: 70, attack: 12, defense: 6, speed: 15 }
    };
    return stats[role] || stats.warrior;
  }
  
  /**
   * 处理消息
   */
  handleMessage(message) {
    console.log(`\n📥 收到消息: ${message.type}`);
    
    switch (message.type) {
      case 'welcome':
        console.log(`   协议版本: ${message.protocolVersion}`);
        break;
        
      case 'joined':
        console.log(`   ✅ 成功加入游戏`);
        console.log(`   房间 ID: ${message.roomId}`);
        this.gameState = message.gameState;
        this.findMyAgent();
        break;
        
      case 'game_started':
        console.log(`   🎮 游戏开始！`);
        this.gameState = message;
        this.findMyAgent();
        break;
        
      case 'turn_start':
        console.log(`   ⏱️  第 ${message.turn} 回合`);
        this.gameState = message.gameState;
        this.findMyAgent();
        break;
        
      case 'request_decision':
        console.log(`   💭 需要提交决策（超时: ${message.timeout}ms）`);
        this.makeDecision(message.turn);
        break;
        
      case 'action_executed':
        console.log(`   ✅ 行动已执行: ${message.agentName} - ${message.action}`);
        if (message.result) {
          console.log(`   结果:`, JSON.stringify(message.result, null, 2));
        }
        break;
        
      case 'turn_end':
        console.log(`   📊 回合结束`);
        this.gameState = message.gameState;
        break;
        
      case 'game_ended':
        console.log(`   🏁 游戏结束: ${message.reason}`);
        console.log(`   最终统计:`, message.finalStats);
        this.ws.close();
        break;
        
      case 'error':
        console.error(`   ❌ 错误: ${message.error}`);
        break;
        
      case 'pong':
        console.log(`   💓 心跳响应`);
        break;
        
      default:
        console.log(`   未知消息类型: ${message.type}`);
    }
  }
  
  /**
   * 找到我的 Agent
   */
  findMyAgent() {
    if (!this.gameState || !this.gameState.agents) return;
    
    this.myAgent = this.gameState.agents.find(a => a.id === this.aiId);
    
    if (this.myAgent) {
      console.log(`\n👤 我的 Agent:`);
      console.log(`   名称: ${this.myAgent.name}`);
      console.log(`   角色: ${this.myAgent.role}`);
      console.log(`   HP: ${this.myAgent.stats.hp}/${this.myAgent.stats.maxHp}`);
      console.log(`   位置: ${this.myAgent.position}`);
    }
  }
  
  /**
   * 做决策（AI 核心逻辑）
   */
  makeDecision(turn) {
    // 这里实现你的 AI 决策逻辑
    // 当前是一个简单的示例 AI
    
    if (!this.myAgent) {
      console.log('   ⚠️  找不到我的 Agent，跳过决策');
      return;
    }
    
    // 获取当前房间信息
    const currentRoom = this.getCurrentRoom();
    if (!currentRoom) {
      console.log('   ⚠️  找不到当前房间，休息');
      this.submitAction({ action: 'rest', reason: '找不到房间信息' });
      return;
    }
    
    // 决策逻辑
    let decision = null;
    
    // 1. HP 低，使用物品或休息
    if (this.myAgent.stats.hp < this.myAgent.stats.maxHp * 0.3) {
      const potion = this.myAgent.inventory.find(i => i.includes('potion'));
      if (potion) {
        decision = { action: 'use_item', target: potion, reason: '使用药水恢复 HP' };
      } else {
        decision = { action: 'rest', reason: 'HP 过低，需要休息' };
      }
    }
    // 2. 有敌人，攻击
    else if (currentRoom.enemies && currentRoom.enemies.length > 0) {
      const target = this.selectTarget(currentRoom.enemies);
      decision = { action: 'attack', target: target.id, reason: `攻击 ${target.type}` };
    }
    // 3. 有物品，拾取
    else if (currentRoom.items && currentRoom.items.length > 0) {
      decision = { action: 'pickup', target: currentRoom.items[0], reason: '拾取物品' };
    }
    // 4. 有出口，移动
    else if (currentRoom.exits && currentRoom.exits.length > 0) {
      const exit = currentRoom.exits[0];
      decision = { action: 'move', target: exit, reason: `移动到 ${exit}` };
    }
    // 5. 默认休息
    else {
      decision = { action: 'rest', reason: '暂时没有明确的行动' };
    }
    
    // 提交决策
    this.submitAction(decision);
  }
  
  /**
   * 选择攻击目标
   */
  selectTarget(enemies) {
    // 简单策略：攻击血量最低的
    return enemies.sort((a, b) => a.hp - b.hp)[0];
  }
  
  /**
   * 获取当前房间
   */
  getCurrentRoom() {
    if (!this.gameState || !this.gameState.dungeon || !this.myAgent) return null;
    
    return this.gameState.dungeon.rooms.find(r => r.id === this.myAgent.position);
  }
  
  /**
   * 提交行动
   */
  submitAction(decision) {
    const message = {
      type: 'action',
      action: decision
    };
    
    console.log(`\n📤 提交决策:`, decision);
    this.ws.send(JSON.stringify(message));
  }
  
  /**
   * 发送心跳
   */
  ping() {
    this.ws.send(JSON.stringify({ type: 'ping' }));
  }
}

// 运行示例
async function main() {
  // 配置
  const config = {
    aiId: `ai_${Date.now()}`,
    name: '示例 AI',
    role: process.argv[3] || 'warrior', // 从命令行读取角色
    serverUrl: process.argv[2] || 'ws://localhost:3457'
  };
  
  console.log('═'.repeat(60));
  console.log('🤖 Agent Game AI Client');
  console.log('═'.repeat(60));
  console.log(`AI ID: ${config.aiId}`);
  console.log(`名称: ${config.name}`);
  console.log(`角色: ${config.role}`);
  console.log(`服务器: ${config.serverUrl}`);
  console.log('═'.repeat(60));
  console.log('');
  
  // 创建客户端
  const client = new AIClient(config);
  
  // 先创建房间
  const http = require('http');
  
  const createRoom = () => {
    return new Promise((resolve, reject) => {
      const url = `${config.serverUrl.replace('ws://', 'http://')}/api/room/create`;
      
      console.log(`Creating room at: ${url}`);
      
      const req = http.request(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            if (result.success) {
              console.log(`✅ 房间创建成功: ${result.roomId}`);
              resolve(result.roomId);
            } else {
              reject(new Error(result.error));
            }
          } catch (error) {
            reject(error);
          }
        });
      });
      
      req.on('error', reject);
      req.write(JSON.stringify({}));
      req.end();
    });
  };
  
  // 快速匹配
  const quickMatch = () => {
    return new Promise((resolve, reject) => {
      const url = `${config.serverUrl.replace('ws://', 'http://')}/api/match/quick`;
      
      console.log(`Trying quick match at: ${url}`);
      
      const req = http.request(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            if (result.success) {
              console.log(`✅ 匹配成功: ${result.roomId}`);
              resolve(result.roomId);
            } else {
              resolve(null); // 没有等待中的房间
            }
          } catch (error) {
            resolve(null);
          }
        });
      });
      
      req.on('error', () => resolve(null));
      req.write(JSON.stringify({}));
      req.end();
    });
  };
  
  try {
    // 尝试快速匹配
    let roomId = await quickMatch();
    
    // 如果没有等待中的房间，创建新房间
    if (!roomId) {
      console.log('没有等待中的房间，创建新房间...');
      roomId = await createRoom();
    }
    
    // 连接
    await client.connect(roomId);
    
    // 定期发送心跳
    setInterval(() => client.ping(), 10000);
    
  } catch (error) {
    console.error('❌ 错误:', error);
    process.exit(1);
  }
}

// 运行
if (require.main === module) {
  main();
}

module.exports = AIClient;
