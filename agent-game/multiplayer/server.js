/**
 * Agent Game Multiplayer Server
 * 
 * WebSocket + REST API 混合架构
 * - WebSocket: 实时推送游戏状态
 * - REST API: AI 提交行动
 */

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const GameRoom = require('./game-room');
const { PROTOCOL_VERSION, validateAIConnection } = require('./protocol');

class AgentGameServer {
  constructor(config = {}) {
    this.port = config.port || 3457;
    this.host = config.host || '0.0.0.0';
    
    // Express 服务器
    this.app = express();
    this.server = http.createServer(this.app);
    
    // WebSocket 服务器
    this.wss = new WebSocket.Server({ server: this.server });
    
    // 游戏房间
    this.rooms = new Map();
    
    // 等待队列（等待 AI 加入）
    this.waitingQueue = [];
    
    // AI 连接映射 (ws -> {aiId, roomId})
    this.aiConnections = new Map();
    
    // 统计
    this.stats = {
      totalGames: 0,
      totalAIs: 0,
      activeConnections: 0
    };
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
  }
  
  /**
   * 设置中间件
   */
  setupMiddleware() {
    this.app.use(express.json());
    this.app.use(express.static(path.join(__dirname, 'public')));
    
    // CORS
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-AI-ID');
      if (req.method === 'OPTIONS') return res.sendStatus(200);
      next();
    });
    
    // 日志
    this.app.use((req, res, next) => {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
      next();
    });
  }
  
  /**
   * 设置 REST API 路由
   */
  setupRoutes() {
    // 健康检查
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        protocolVersion: PROTOCOL_VERSION,
        uptime: process.uptime(),
        stats: this.stats,
        rooms: this.rooms.size
      });
    });
    
    // 创建游戏房间
    this.app.post('/api/room/create', async (req, res) => {
      try {
        const { config, aiId } = req.body;
        
        const roomId = `room_${Date.now()}`;
        const room = new GameRoom(roomId, config || {});
        
        this.rooms.set(roomId, room);
        this.stats.totalGames++;
        
        console.log(`✅ 房间创建成功: ${roomId}`);
        
        res.json({
          success: true,
          roomId,
          message: '房间创建成功',
          wsUrl: `ws://${req.get('host')}/ws/game/${roomId}`
        });
      } catch (error) {
        console.error('创建房间失败:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });
    
    // 获取房间列表
    this.app.get('/api/rooms', (req, res) => {
      const roomList = Array.from(this.rooms.values()).map(room => ({
        id: room.id,
        state: room.state,
        playerCount: room.agents.size,
        maxPlayers: room.maxPlayers,
        createdAt: room.createdAt
      }));
      
      res.json({ rooms: roomList });
    });
    
    // 获取房间信息
    this.app.get('/api/room/:roomId', (req, res) => {
      const room = this.rooms.get(req.params.roomId);
      if (!room) {
        return res.status(404).json({ success: false, error: '房间不存在' });
      }
      
      res.json(room.getStatus());
    });
    
    // AI 加入游戏（WebSocket 连接后通过消息加入）
    // 这里提供 REST 接口用于查询
    this.app.post('/api/game/join', async (req, res) => {
      try {
        const { roomId, aiConfig } = req.body;
        
        const room = this.rooms.get(roomId);
        if (!room) {
          return res.status(404).json({ success: false, error: '房间不存在' });
        }
        
        if (room.state !== 'waiting') {
          return res.status(400).json({ success: false, error: '游戏已经开始' });
        }
        
        // 实际加入通过 WebSocket 完成
        res.json({
          success: true,
          message: '请通过 WebSocket 连接加入游戏',
          wsUrl: `ws://${req.get('host')}/ws/game/${roomId}`,
          protocol: PROTOCOL_VERSION
        });
      } catch (error) {
        console.error('加入游戏失败:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });
    
    // 查询游戏状态
    this.app.get('/api/game/status/:roomId', (req, res) => {
      const room = this.rooms.get(req.params.roomId);
      if (!room) {
        return res.status(404).json({ success: false, error: '房间不存在' });
      }
      
      res.json(room.getGameState());
    });
    
    // 提交行动（REST API 方式）
    this.app.post('/api/game/action', async (req, res) => {
      try {
        const { roomId, aiId, action } = req.body;
        
        const room = this.rooms.get(roomId);
        if (!room) {
          return res.status(404).json({ success: false, error: '房间不存在' });
        }
        
        const result = await room.submitAction(aiId, action);
        res.json({ success: true, result });
      } catch (error) {
        console.error('提交行动失败:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });
    
    // 获取等待中的房间
    this.app.get('/api/rooms/waiting', (req, res) => {
      const waitingRooms = Array.from(this.rooms.values())
        .filter(room => room.state === 'waiting')
        .map(room => ({
          id: room.id,
          playerCount: room.agents.size,
          maxPlayers: room.maxPlayers,
          createdAt: room.createdAt
        }));
      
      res.json({ rooms: waitingRooms });
    });
    
    // 快速匹配（自动加入等待中的房间）
    this.app.post('/api/match/quick', (req, res) => {
      const waitingRoom = Array.from(this.rooms.values())
        .find(room => room.state === 'waiting' && room.agents.size < room.maxPlayers);
      
      if (!waitingRoom) {
        return res.json({ 
          success: false, 
          message: '暂无等待中的房间，请创建新房间' 
        });
      }
      
      res.json({
        success: true,
        roomId: waitingRoom.id,
        wsUrl: `ws://${req.get('host')}/ws/game/${waitingRoom.id}`
      });
    });
  }
  
  /**
   * 设置 WebSocket
   */
  setupWebSocket() {
    this.wss.on('connection', (ws, req) => {
      const urlParts = req.url.split('/');
      const roomId = urlParts[3]; // /ws/game/{roomId}
      
      console.log(`🔌 新的 WebSocket 连接: ${req.url}`);
      this.stats.activeConnections++;
      
      // 初始化连接信息
      const connectionInfo = {
        ws,
        roomId,
        aiId: null,
        authenticated: false
      };
      
      this.aiConnections.set(ws, connectionInfo);
      
      ws.on('message', async (data) => {
        try {
          const message = JSON.parse(data.toString());
          await this.handleWebSocketMessage(ws, message);
        } catch (error) {
          console.error('WebSocket 消息处理错误:', error);
          ws.send(JSON.stringify({
            type: 'error',
            error: error.message
          }));
        }
      });
      
      ws.on('close', () => {
        console.log(`🔌 WebSocket 连接关闭`);
        this.stats.activeConnections--;
        this.handleDisconnect(ws);
      });
      
      ws.on('error', (error) => {
        console.error('WebSocket 错误:', error);
      });
      
      // 发送欢迎消息
      ws.send(JSON.stringify({
        type: 'welcome',
        protocolVersion: PROTOCOL_VERSION,
        message: '连接成功，请发送 join 消息加入游戏'
      }));
    });
  }
  
  /**
   * 处理 WebSocket 消息
   */
  async handleWebSocketMessage(ws, message) {
    const connectionInfo = this.aiConnections.get(ws);
    if (!connectionInfo) return;
    
    const room = this.rooms.get(connectionInfo.roomId);
    
    switch (message.type) {
      case 'join':
        // AI 加入游戏
        await this.handleAIJoin(ws, message, connectionInfo, room);
        break;
        
      case 'action':
        // AI 提交行动
        if (!connectionInfo.authenticated) {
          return ws.send(JSON.stringify({
            type: 'error',
            error: '未认证，请先发送 join 消息'
          }));
        }
        
        await this.handleAIAction(ws, message, connectionInfo, room);
        break;
        
      case 'ping':
        ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
        break;
        
      default:
        ws.send(JSON.stringify({
          type: 'error',
          error: `未知消息类型: ${message.type}`
        }));
    }
  }
  
  /**
   * 处理 AI 加入
   */
  async handleAIJoin(ws, message, connectionInfo, room) {
    if (!room) {
      return ws.send(JSON.stringify({
        type: 'error',
        error: '房间不存在'
      }));
    }
    
    const { aiId, aiConfig } = message;
    
    // 验证配置
    const validation = validateAIConnection({ aiId, aiConfig });
    if (!validation.valid) {
      return ws.send(JSON.stringify({
        type: 'error',
        error: validation.error
      }));
    }
    
    // 加入房间
    const result = await room.addAI(ws, aiId, aiConfig);
    
    if (result.success) {
      connectionInfo.aiId = aiId;
      connectionInfo.authenticated = true;
      this.stats.totalAIs++;
      
      ws.send(JSON.stringify({
        type: 'joined',
        aiId,
        roomId: room.id,
        message: '成功加入游戏',
        gameState: room.getGameState()
      }));
      
      console.log(`✅ AI ${aiId} 加入房间 ${room.id} (${room.agents.size}/${room.maxPlayers})`);
      
      // 检查是否可以开始游戏
      if (room.canStart()) {
        console.log(`🎮 房间 ${room.id} 人满，准备开始游戏...`);
        // 延迟 3 秒开始
        setTimeout(() => room.startGame(), 3000);
      }
    } else {
      ws.send(JSON.stringify({
        type: 'error',
        error: result.error
      }));
    }
  }
  
  /**
   * 处理 AI 行动
   */
  async handleAIAction(ws, message, connectionInfo, room) {
    if (!room) {
      return ws.send(JSON.stringify({
        type: 'error',
        error: '房间不存在'
      }));
    }
    
    const { action } = message;
    const result = await room.submitAction(connectionInfo.aiId, action);
    
    if (result.success) {
      ws.send(JSON.stringify({
        type: 'action_accepted',
        action,
        message: '行动已提交'
      }));
    } else {
      ws.send(JSON.stringify({
        type: 'error',
        error: result.error
      }));
    }
  }
  
  /**
   * 处理断开连接
   */
  handleDisconnect(ws) {
    const connectionInfo = this.aiConnections.get(ws);
    if (!connectionInfo) return;
    
    this.aiConnections.delete(ws);
    
    // 如果在游戏中，标记为掉线
    if (connectionInfo.authenticated && connectionInfo.roomId) {
      const room = this.rooms.get(connectionInfo.roomId);
      if (room) {
        room.handleAIDisconnect(connectionInfo.aiId);
      }
    }
  }
  
  /**
   * 启动服务器
   */
  start() {
    this.server.listen(this.port, this.host, () => {
      console.log('');
      console.log('═'.repeat(60));
      console.log('🎮 Agent Game Multiplayer Server');
      console.log('═'.repeat(60));
      console.log(`📡 服务器地址: http://${this.host}:${this.port}`);
      console.log(`🔌 WebSocket: ws://${this.host}:${this.port}/ws/game/{roomId}`);
      console.log(`📋 API 文档: http://${this.host}:${this.port}/api-docs`);
      console.log(`🏥 健康检查: http://${this.host}:${this.port}/health`);
      console.log('═'.repeat(60));
      console.log('');
    });
  }
  
  /**
   * 停止服务器
   */
  stop() {
    this.wss.close();
    this.server.close();
    console.log('🛑 服务器已停止');
  }
}

// 启动服务器
if (require.main === module) {
  const server = new AgentGameServer({
    port: process.env.PORT || 3457,
    host: process.env.HOST || '0.0.0.0'
  });
  
  server.start();
  
  // 优雅关闭
  process.on('SIGTERM', () => server.stop());
  process.on('SIGINT', () => server.stop());
}

module.exports = AgentGameServer;
