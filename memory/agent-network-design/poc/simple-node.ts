/**
 * AI Agent 自组织网络 - PoC 实现
 * 
 * 这是一个简化的原型实现，演示核心概念：
 * - 节点发现
 * - 消息传递
 * - 简单路由
 */

import WebSocket from 'ws'
import { EventEmitter } from 'events'
import * as crypto from 'crypto'

// ============================================
// 1. 消息定义
// ============================================

enum MessageType {
  HEARTBEAT = 'heartbeat',
  JOIN = 'join',
  LEAVE = 'leave',
  DATA = 'data',
  QUERY = 'query',
  RESPONSE = 'response'
}

interface Message {
  type: MessageType
  sourceId: string
  destId?: string
  payload: any
  timestamp: number
  ttl?: number
}

// ============================================
// 2. 节点信息
// ============================================

interface NodeInfo {
  id: string
  address: string
  port: number
  lastSeen: number
}

// ============================================
// 3. 简单节点实现
// ============================================

class SimpleNode extends EventEmitter {
  private id: string
  private port: number
  private server: WebSocket.Server | null = null
  private neighbors: Map<string, { ws: WebSocket, info: NodeInfo }> = new Map()
  private messageCache: Set<string> = new Set()
  private logger: Console
  
  constructor(port: number) {
    super()
    this.id = this.generateNodeId()
    this.port = port
    this.logger = console
  }
  
  /**
   * 生成节点 ID
   */
  private generateNodeId(): string {
    return crypto.randomBytes(16).toString('hex')
  }
  
  /**
   * 启动节点
   */
  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server = new WebSocket.Server({ port: this.port })
      
      this.server.on('connection', (ws, req) => {
        this.handleConnection(ws, req)
      })
      
      this.server.on('listening', () => {
        this.logger.log(`[Node ${this.id.substring(0, 8)}] Started on port ${this.port}`)
        this.startHeartbeat()
        resolve()
      })
      
      this.server.on('error', (error) => {
        reject(error)
      })
    })
  }
  
  /**
   * 停止节点
   */
  async stop(): Promise<void> {
    // 广播离开消息
    await this.broadcast({
      type: MessageType.LEAVE,
      sourceId: this.id,
      payload: { reason: 'shutdown' },
      timestamp: Date.now()
    })
    
    // 关闭所有连接
    for (const [nodeId, { ws }] of this.neighbors) {
      ws.close()
    }
    this.neighbors.clear()
    
    // 关闭服务器
    if (this.server) {
      return new Promise((resolve) => {
        this.server!.close(() => {
          this.logger.log(`[Node ${this.id.substring(0, 8)}] Stopped`)
          resolve()
        })
      })
    }
  }
  
  /**
   * 连接到其他节点
   */
  async connect(address: string, port: number): Promise<void> {
    const url = `ws://${address}:${port}`
    
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(url)
      
      ws.on('open', () => {
        // 发送加入消息
        const joinMessage: Message = {
          type: MessageType.JOIN,
          sourceId: this.id,
          payload: {
            address: 'localhost',
            port: this.port
          },
          timestamp: Date.now()
        }
        
        ws.send(JSON.stringify(joinMessage))
        resolve()
      })
      
      ws.on('message', (data: Buffer) => {
        this.handleMessage(data, ws)
      })
      
      ws.on('close', () => {
        this.handleDisconnect(ws)
      })
      
      ws.on('error', (error) => {
        reject(error)
      })
    })
  }
  
  /**
   * 处理新连接
   */
  private handleConnection(ws: WebSocket, req: any): void {
    ws.on('message', (data: Buffer) => {
      this.handleMessage(data, ws)
    })
    
    ws.on('close', () => {
      this.handleDisconnect(ws)
    })
  }
  
  /**
   * 处理消息
   */
  private handleMessage(data: Buffer, ws: WebSocket): void {
    try {
      const message: Message = JSON.parse(data.toString())
      
      // 去重
      const messageKey = `${message.sourceId}-${message.timestamp}`
      if (this.messageCache.has(messageKey)) {
        return
      }
      this.messageCache.add(messageKey)
      
      // 清理旧缓存
      if (this.messageCache.size > 1000) {
        const arr = Array.from(this.messageCache)
        this.messageCache = new Set(arr.slice(-500))
      }
      
      // 处理不同类型的消息
      switch (message.type) {
        case MessageType.JOIN:
          this.handleJoin(message, ws)
          break
        case MessageType.LEAVE:
          this.handleLeave(message)
          break
        case MessageType.HEARTBEAT:
          this.handleHeartbeat(message)
          break
        case MessageType.DATA:
          this.handleData(message)
          break
        case MessageType.QUERY:
          this.handleQuery(message, ws)
          break
        default:
          this.logger.log(`[Node ${this.id.substring(0, 8)}] Unknown message type: ${message.type}`)
      }
    } catch (error) {
      this.logger.error('Error handling message:', error)
    }
  }
  
  /**
   * 处理加入消息
   */
  private handleJoin(message: Message, ws: WebSocket): void {
    const nodeInfo: NodeInfo = {
      id: message.sourceId,
      address: message.payload.address,
      port: message.payload.port,
      lastSeen: Date.now()
    }
    
    this.neighbors.set(message.sourceId, { ws, info: nodeInfo })
    this.logger.log(`[Node ${this.id.substring(0, 8)}] Node joined: ${message.sourceId.substring(0, 8)} (total: ${this.neighbors.size})`)
    
    // 发送邻居列表
    const response: Message = {
      type: MessageType.RESPONSE,
      sourceId: this.id,
      payload: {
        neighbors: Array.from(this.neighbors.values()).map(n => n.info)
      },
      timestamp: Date.now()
    }
    
    ws.send(JSON.stringify(response))
  }
  
  /**
   * 处理离开消息
   */
  private handleLeave(message: Message): void {
    if (this.neighbors.has(message.sourceId)) {
      this.neighbors.delete(message.sourceId)
      this.logger.log(`[Node ${this.id.substring(0, 8)}] Node left: ${message.sourceId.substring(0, 8)} (total: ${this.neighbors.size})`)
    }
  }
  
  /**
   * 处理心跳消息
   */
  private handleHeartbeat(message: Message): void {
    const neighbor = this.neighbors.get(message.sourceId)
    if (neighbor) {
      neighbor.info.lastSeen = Date.now()
    }
  }
  
  /**
   * 处理数据消息
   */
  private handleData(message: Message): void {
    // 检查是否是目标节点
    if (message.destId === this.id || !message.destId) {
      // 触发事件
      this.emit('message', message)
    } else if (message.ttl && message.ttl > 0) {
      // 转发消息
      this.forwardMessage(message)
    }
  }
  
  /**
   * 处理查询消息
   */
  private handleQuery(message: Message, ws: WebSocket): void {
    const response: Message = {
      type: MessageType.RESPONSE,
      sourceId: this.id,
      payload: {
        neighbors: Array.from(this.neighbors.values()).map(n => n.info)
      },
      timestamp: Date.now()
    }
    
    ws.send(JSON.stringify(response))
  }
  
  /**
   * 处理断开连接
   */
  private handleDisconnect(ws: WebSocket): void {
    for (const [nodeId, neighbor] of this.neighbors) {
      if (neighbor.ws === ws) {
        this.neighbors.delete(nodeId)
        this.logger.log(`[Node ${this.id.substring(0, 8)}] Node disconnected: ${nodeId.substring(0, 8)} (total: ${this.neighbors.size})`)
        break
      }
    }
  }
  
  /**
   * 转发消息
   */
  private forwardMessage(message: Message): void {
    const forwarded: Message = {
      ...message,
      ttl: (message.ttl || 5) - 1
    }
    
    // 广播给所有邻居（简单泛洪）
    for (const [nodeId, { ws }] of this.neighbors) {
      if (nodeId !== message.sourceId) {
        try {
          ws.send(JSON.stringify(forwarded))
        } catch (error) {
          this.logger.error(`Error forwarding to ${nodeId}:`, error)
        }
      }
    }
  }
  
  /**
   * 发送消息
   */
  async send(targetId: string, payload: any): Promise<void> {
    const message: Message = {
      type: MessageType.DATA,
      sourceId: this.id,
      destId: targetId,
      payload: payload,
      timestamp: Date.now(),
      ttl: 5
    }
    
    // 直接发送（如果已连接）
    const neighbor = this.neighbors.get(targetId)
    if (neighbor) {
      neighbor.ws.send(JSON.stringify(message))
    } else {
      // 广播（简单路由）
      await this.broadcast(message)
    }
  }
  
  /**
   * 广播消息
   */
  async broadcast(message: Message): Promise<void> {
    for (const [nodeId, { ws }] of this.neighbors) {
      if (nodeId !== message.sourceId) {
        try {
          ws.send(JSON.stringify(message))
        } catch (error) {
          this.logger.error(`Error broadcasting to ${nodeId}:`, error)
        }
      }
    }
  }
  
  /**
   * 启动心跳
   */
  private startHeartbeat(): void {
    setInterval(() => {
      const heartbeat: Message = {
        type: MessageType.HEARTBEAT,
        sourceId: this.id,
        payload: { timestamp: Date.now() },
        timestamp: Date.now()
      }
      
      for (const [nodeId, { ws }] of this.neighbors) {
        try {
          ws.send(JSON.stringify(heartbeat))
        } catch (error) {
          // 连接可能已断开
        }
      }
      
      // 检查邻居是否在线
      const now = Date.now()
      for (const [nodeId, neighbor] of this.neighbors) {
        if (now - neighbor.info.lastSeen > 90000) {  // 90 秒
          this.neighbors.delete(nodeId)
          this.logger.log(`[Node ${this.id.substring(0, 8)}] Node timeout: ${nodeId.substring(0, 8)}`)
        }
      }
    }, 30000)  // 30 秒
  }
  
  /**
   * 获取节点 ID
   */
  getId(): string {
    return this.id
  }
  
  /**
   * 获取邻居数量
   */
  getNeighborCount(): number {
    return this.neighbors.size
  }
}

// ============================================
// 4. 测试脚本
// ============================================

async function test() {
  console.log('=== AI Agent 自组织网络 PoC 测试 ===\n')
  
  // 创建 3 个节点
  const node1 = new SimpleNode(8081)
  const node2 = new SimpleNode(8082)
  const node3 = new SimpleNode(8083)
  
  // 启动节点
  await node1.start()
  await node2.start()
  await node3.start()
  
  console.log('\n--- 节点已启动 ---\n')
  
  // 连接节点
  await node2.connect('localhost', 8081)  // node2 -> node1
  await node3.connect('localhost', 8081)  // node3 -> node1
  
  // 等待连接建立
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  console.log('\n--- 节点已连接 ---')
  console.log(`Node 1 邻居数: ${node1.getNeighborCount()}`)
  console.log(`Node 2 邻居数: ${node2.getNeighborCount()}`)
  console.log(`Node 3 邻居数: ${node3.getNeighborCount()}`)
  
  // 监听消息
  node1.on('message', (msg: Message) => {
    console.log(`\n[Node 1] Received message from ${msg.sourceId.substring(0, 8)}:`, msg.payload)
  })
  
  node2.on('message', (msg: Message) => {
    console.log(`\n[Node 2] Received message from ${msg.sourceId.substring(0, 8)}:`, msg.payload)
  })
  
  node3.on('message', (msg: Message) => {
    console.log(`\n[Node 3] Received message from ${msg.sourceId.substring(0, 8)}:`, msg.payload)
  })
  
  console.log('\n--- 测试消息传递 ---\n')
  
  // 测试 1: 点对点消息
  console.log('测试 1: Node 2 -> Node 1 (点对点)')
  await node2.send(node1.getId(), { text: 'Hello from Node 2!' })
  await new Promise(resolve => setTimeout(resolve, 500))
  
  // 测试 2: 广播消息
  console.log('\n测试 2: Node 1 广播')
  await node1.broadcast({
    type: MessageType.DATA,
    sourceId: node1.getId(),
    payload: { text: 'Broadcast from Node 1!' },
    timestamp: Date.now()
  })
  await new Promise(resolve => setTimeout(resolve, 500))
  
  // 测试 3: 多跳路由
  console.log('\n测试 3: Node 3 -> Node 2 (通过 Node 1)')
  await node3.send(node2.getId(), { text: 'Hello from Node 3 via routing!' })
  await new Promise(resolve => setTimeout(resolve, 500))
  
  console.log('\n--- 测试完成 ---\n')
  
  // 停止节点
  await node1.stop()
  await node2.stop()
  await node3.stop()
  
  console.log('\n=== 测试结束 ===')
}

// 运行测试
test().catch(console.error)
