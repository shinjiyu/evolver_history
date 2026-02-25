# AI Agent 自组织网络 - 实现指南

## 执行摘要

本文档提供了 AI Agent 自组织网络的**实现指南**，包括技术栈选择、实现步骤、测试方法和最佳实践。

**实现版本：** v1.0.0

---

## 1. 技术栈选择

### 1.1 推荐技术栈

| 层次 | 推荐方案 | 备选方案 | 原因 |
|------|----------|----------|------|
| **语言** | TypeScript | Rust, Go | 与 OpenClaw 生态集成容易 |
| **运行时** | Node.js 18+ | Deno, Bun | 成熟稳定，生态丰富 |
| **传输层** | ws (WebSocket) | uWebSockets.js | 标准化，跨平台 |
| **序列化** | @msgpack/msgpack | protobufjs | 紧凑快速，易用 |
| **加密** | libsignal | libsodium.js | Noise Protocol 实现 |
| **DHT** | kademlia-dht | 自实现 | 成熟的 Kademlia 实现 |
| **存储** | level (LevelDB) | RocksDB, LMDB | 嵌入式，高性能 |
| **日志** | pino | winston | 高性能，结构化日志 |
| **测试** | Jest | Mocha, AVA | 全功能测试框架 |

### 1.2 依赖清单

```json
{
  "dependencies": {
    "@msgpack/msgpack": "^3.0.0",
    "ws": "^8.14.0",
    "libsignal": "^2.0.0",
    "kademlia-dht": "^1.0.0",
    "level": "^8.0.0",
    "pino": "^8.15.0",
    "uuid": "^9.0.0",
    "ed25519": "^0.0.5"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/ws": "^8.5.0",
    "typescript": "^5.2.0",
    "jest": "^29.7.0",
    "@types/jest": "^29.5.0",
    "ts-jest": "^29.1.0"
  }
}
```

---

## 2. 项目结构

### 2.1 推荐目录结构

```
agent-network/
├── src/
│   ├── core/
│   │   ├── Node.ts              # 节点主类
│   │   ├── NodeState.ts         # 状态管理
│   │   └── Config.ts            # 配置管理
│   │
│   ├── protocol/
│   │   ├── Message.ts           # 消息定义
│   │   ├── Serializer.ts        # 序列化
│   │   ├── Parser.ts            # 消息解析
│   │   └── Validator.ts         # 消息验证
│   │
│   ├── transport/
│   │   ├── Transport.ts         # 传输层抽象
│   │   ├── WebSocketTransport.ts # WebSocket 实现
│   │   ├── UDPTransport.ts      # UDP 实现（可选）
│   │   └── ConnectionPool.ts    # 连接池
│   │
│   ├── security/
│   │   ├── Crypto.ts            # 加密工具
│   │   ├── KeyPair.ts           # 密钥管理
│   │   ├── NoiseHandshake.ts    # Noise 握手
│   │   └── Signature.ts         # 签名验证
│   │
│   ├── routing/
│   │   ├── Router.ts            # 路由器
│   │   ├── DHT.ts               # 分布式哈希表
│   │   ├── RoutingTable.ts      # 路由表
│   │   └── Cache.ts             # 缓存
│   │
│   ├── consensus/
│   │   ├── Consensus.ts         # 共识引擎
│   │   ├── CRDT.ts              # CRDT 实现
│   │   └── Voting.ts            # 投票机制
│   │
│   ├── storage/
│   │   ├── Storage.ts           # 存储抽象
│   │   ├── LevelDB.ts           # LevelDB 实现
│   │   └── Cache.ts             # 缓存层
│   │
│   ├── monitor/
│   │   ├── Monitor.ts           # 监控
│   │   ├── Stats.ts             # 统计
│   │   └── HealthCheck.ts       # 健康检查
│   │
│   └── utils/
│       ├── Logger.ts            # 日志
│       ├── Backoff.ts           # 退避策略
│       └── Utils.ts             # 工具函数
│
├── tests/
│   ├── unit/                    # 单元测试
│   ├── integration/             # 集成测试
│   └── stress/                  # 压力测试
│
├── examples/
│   ├── basic-node.ts            # 基础节点示例
│   ├── custom-agent.ts          # 自定义 Agent 示例
│   └── cluster.ts               # 集群示例
│
├── docs/                        # 文档
├── scripts/                     # 脚本
├── package.json
├── tsconfig.json
└── README.md
```

---

## 3. 核心实现步骤

### 3.1 步骤 1：消息系统（1-2 天）

**目标：** 实现消息定义、序列化、解析

**实现清单：**
- [ ] 定义消息类型（Message.ts）
- [ ] 实现 MessagePack 序列化（Serializer.ts）
- [ ] 实现消息解析器（Parser.ts）
- [ ] 实现消息验证器（Validator.ts）
- [ ] 编写单元测试

**示例代码：**

```typescript
// src/protocol/Message.ts
import { v4 as uuidv4 } from 'uuid'

export enum MessageType {
  HEARTBEAT = 0x01,
  JOIN = 0x02,
  LEAVE = 0x03,
  DATA = 0x04,
  CONTROL = 0x05,
  CONSENSUS = 0x06,
  QUERY = 0x07,
  RESPONSE = 0x08,
  ERROR = 0x09,
  ACK = 0x0A
}

export class Message {
  version: number = 1
  type: MessageType
  flags: number = 0
  messageId: string
  timestamp: number
  ttl: number = 5
  hopCount: number = 0
  sourceId: string
  destId?: string
  payload: any
  signature?: Buffer
  
  constructor(type: MessageType, sourceId: string, payload: any) {
    this.type = type
    this.sourceId = sourceId
    this.payload = payload
    this.messageId = uuidv4()
    this.timestamp = Date.now()
  }
  
  setFlag(flag: number): void {
    this.flags |= flag
  }
  
  hasFlag(flag: number): boolean {
    return (this.flags & flag) !== 0
  }
}
```

```typescript
// src/protocol/Serializer.ts
import * as msgpack from '@msgpack/msgpack'
import { Message } from './Message'

export class Serializer {
  static serialize(message: Message): Buffer {
    const obj = {
      v: message.version,
      t: message.type,
      f: message.flags,
      id: message.messageId,
      ts: message.timestamp,
      ttl: message.ttl,
      hop: message.hopCount,
      src: message.sourceId,
      dst: message.destId,
      payload: message.payload,
      sig: message.signature
    }
    
    return Buffer.from(msgpack.encode(obj))
  }
  
  static deserialize(buffer: Buffer): Message {
    const obj = msgpack.decode(buffer) as any
    
    const message = new Message(obj.t, obj.src, obj.payload)
    message.version = obj.v
    message.flags = obj.f
    message.messageId = obj.id
    message.timestamp = obj.ts
    message.ttl = obj.ttl
    message.hopCount = obj.hop
    message.destId = obj.dst
    message.signature = obj.sig
    
    return message
  }
}
```

### 3.2 步骤 2：传输层（2-3 天）

**目标：** 实现 WebSocket 传输和连接池

**实现清单：**
- [ ] 实现传输层抽象（Transport.ts）
- [ ] 实现 WebSocket 传输（WebSocketTransport.ts）
- [ ] 实现连接池（ConnectionPool.ts）
- [ ] 实现心跳管理（HeartbeatManager.ts）
- [ ] 编写集成测试

**示例代码：**

```typescript
// src/transport/WebSocketTransport.ts
import WebSocket from 'ws'
import { EventEmitter } from 'events'
import { Serializer } from '../protocol/Serializer'
import { Message } from '../protocol/Message'

export class WebSocketTransport extends EventEmitter {
  private ws: WebSocket | null = null
  private url: string
  private reconnectAttempts: number = 0
  private maxReconnectAttempts: number = 5
  
  constructor(url: string) {
    super()
    this.url = url
  }
  
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.url)
      
      this.ws.on('open', () => {
        this.reconnectAttempts = 0
        this.emit('connected')
        resolve()
      })
      
      this.ws.on('message', (data: Buffer) => {
        try {
          const message = Serializer.deserialize(data)
          this.emit('message', message)
        } catch (error) {
          this.emit('error', error)
        }
      })
      
      this.ws.on('close', () => {
        this.emit('disconnected')
        this.handleReconnect()
      })
      
      this.ws.on('error', (error) => {
        this.emit('error', error)
        reject(error)
      })
    })
  }
  
  send(message: Message): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('Not connected')
    }
    
    const buffer = Serializer.serialize(message)
    this.ws.send(buffer)
  }
  
  private async handleReconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.emit('reconnect_failed')
      return
    }
    
    this.reconnectAttempts++
    const delay = Math.pow(2, this.reconnectAttempts) * 1000
    
    await new Promise(resolve => setTimeout(resolve, delay))
    
    try {
      await this.connect()
    } catch (error) {
      // Will retry again
    }
  }
  
  close(): void {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }
}
```

### 3.3 步骤 3：安全层（2-3 天）

**目标：** 实现 Noise Protocol 握手和消息签名

**实现清单：**
- [ ] 实现密钥对生成（KeyPair.ts）
- [ ] 实现 Noise 握手（NoiseHandshake.ts）
- [ ] 实现消息签名（Signature.ts）
- [ ] 实现加密/解密（Crypto.ts）
- [ ] 编写安全测试

**示例代码：**

```typescript
// src/security/KeyPair.ts
import * as ed from 'ed25519'
import * as crypto from 'crypto'

export class KeyPair {
  privateKey: Buffer
  publicKey: Buffer
  
  constructor(privateKey?: Buffer) {
    if (privateKey) {
      this.privateKey = privateKey
      this.publicKey = ed.GeneratePublicKey(privateKey)
    } else {
      // 生成新密钥对
      const seed = crypto.randomBytes(32)
      this.publicKey = ed.GeneratePublicKey(seed)
      this.privateKey = seed
    }
  }
  
  sign(data: Buffer): Buffer {
    return ed.Sign(data, this.privateKey)
  }
  
  verify(data: Buffer, signature: Buffer, publicKey?: Buffer): boolean {
    const key = publicKey || this.publicKey
    try {
      return ed.Verify(data, signature, key)
    } catch {
      return false
    }
  }
  
  getNodeId(): string {
    return crypto.createHash('sha256')
      .update(this.publicKey)
      .digest('hex')
      .substring(0, 32)
  }
}
```

### 3.4 步骤 4：路由和 DHT（3-4 天）

**目标：** 实现路由表和 DHT

**实现清单：**
- [ ] 实现路由表（RoutingTable.ts）
- [ ] 实现 Kademlia DHT（DHT.ts）
- [ ] 实现缓存（Cache.ts）
- [ ] 实现路由器（Router.ts）
- [ ] 编写路由测试

**示例代码：**

```typescript
// src/routing/DHT.ts
import { EventEmitter } from 'events'
import { RoutingTable } from './RoutingTable'
import { NodeInfo } from '../core/Node'

export class DHT extends EventEmitter {
  private routingTable: RoutingTable
  private k: number = 8  // Kademlia k 参数
  
  constructor(localNodeId: string) {
    super()
    this.routingTable = new RoutingTable(localNodeId, this.k)
  }
  
  async findNode(targetId: string): Promise<NodeInfo[]> {
    // 1. 检查本地
    const local = this.routingTable.findClosest(targetId)
    if (local.length > 0) return local
    
    // 2. 迭代查找
    return await this.iterativeFindNode(targetId)
  }
  
  private async iterativeFindNode(targetId: string): Promise<NodeInfo[]> {
    const queried = new Set<string>()
    const closest: NodeInfo[] = []
    
    // 初始查询 α 个最近节点
    let toQuery = this.routingTable.findClosest(targetId, 3)
    
    while (toQuery.length > 0) {
      const batch = toQuery.slice(0, 3)
      toQuery = toQuery.slice(3)
      
      // 并发查询
      const results = await Promise.all(
        batch.map(node => this.queryNode(node, targetId))
      )
      
      for (const nodes of results) {
        for (const node of nodes) {
          if (!queried.has(node.nodeId)) {
            queried.add(node.nodeId)
            closest.push(node)
            toQuery.push(node)
          }
        }
      }
      
      // 排序，保留最近的 k 个
      closest.sort((a, b) => 
        this.distance(a.nodeId, targetId) - this.distance(b.nodeId, targetId)
      )
      closest.splice(this.k)
      
      // 检查是否收敛
      if (this.isConverged(closest, targetId)) {
        break
      }
    }
    
    return closest
  }
  
  private distance(id1: string, id2: string): number {
    const buf1 = Buffer.from(id1, 'hex')
    const buf2 = Buffer.from(id2, 'hex')
    
    let dist = 0
    for (let i = 0; i < buf1.length; i++) {
      dist = (dist << 8) + (buf1[i] ^ buf2[i])
    }
    return dist
  }
  
  private isConverged(nodes: NodeInfo[], target: string): boolean {
    // 简化：如果最近节点距离不再减小，则收敛
    return true
  }
  
  async put(key: string, value: Buffer): Promise<void> {
    const nodes = await this.findNode(key)
    
    // 存储到最近的 k 个节点
    await Promise.all(
      nodes.map(node => this.storeToNode(node, key, value))
    )
  }
  
  async get(key: string): Promise<Buffer | null> {
    const nodes = await this.findNode(key)
    
    // 从最近的节点获取
    for (const node of nodes) {
      const value = await this.getFromNode(node, key)
      if (value) return value
    }
    
    return null
  }
}
```

### 3.5 步骤 5：节点主类（3-4 天）

**目标：** 实现节点主类，整合所有模块

**实现清单：**
- [ ] 实现节点状态机（NodeState.ts）
- [ ] 实现节点主类（Node.ts）
- [ ] 实现配置管理（Config.ts）
- [ ] 实现生命周期管理
- [ ] 编写集成测试

**示例代码：**

```typescript
// src/core/Node.ts
import { EventEmitter } from 'events'
import { NodeState } from './NodeState'
import { Config } from './Config'
import { KeyPair } from '../security/KeyPair'
import { WebSocketTransport } from '../transport/WebSocketTransport'
import { ConnectionPool } from '../transport/ConnectionPool'
import { DHT } from '../routing/DHT'
import { Router } from '../routing/Router'
import { Storage } from '../storage/Storage'
import { Monitor } from '../monitor/Monitor'
import { Logger } from '../utils/Logger'

export class Node extends EventEmitter {
  private state: NodeState = NodeState.OFFLINE
  private config: Config
  private keyPair: KeyPair
  private nodeId: string
  
  private transport: WebSocketTransport
  private connectionPool: ConnectionPool
  private dht: DHT
  private router: Router
  private storage: Storage
  private monitor: Monitor
  private logger: Logger
  
  constructor(config: Config) {
    super()
    this.config = config
    this.keyPair = new KeyPair(config.identity.privateKey)
    this.nodeId = this.keyPair.getNodeId()
    
    this.logger = new Logger(config.logging.level)
    this.transport = new WebSocketTransport(`ws://0.0.0.0:${config.network.listenPort}`)
    this.connectionPool = new ConnectionPool(config.network.maxNeighbors)
    this.dht = new DHT(this.nodeId)
    this.router = new Router(this.nodeId, this.dht, this.connectionPool)
    this.storage = new Storage(config.resources.maxStorage)
    this.monitor = new Monitor()
    
    this.setupHandlers()
  }
  
  private setupHandlers(): void {
    this.transport.on('message', (message) => {
      this.handleMessage(message)
    })
    
    this.connectionPool.on('node_offline', (nodeId) => {
      this.handleNodeOffline(nodeId)
    })
  }
  
  async start(): Promise<void> {
    this.logger.info('Starting node...')
    this.state = NodeState.BOOTSTRAP
    
    try {
      // 1. 启动传输层
      await this.transport.connect()
      
      // 2. 连接 Bootstrap 节点
      await this.connectBootstrapNodes()
      
      // 3. 加入网络
      await this.joinNetwork()
      
      // 4. 启动心跳
      this.startHeartbeat()
      
      // 5. 启动监控
      this.monitor.start()
      
      this.state = NodeState.ONLINE
      this.logger.info('Node started successfully')
      this.emit('started')
      
    } catch (error) {
      this.logger.error('Failed to start node:', error)
      this.state = NodeState.OFFLINE
      throw error
    }
  }
  
  async stop(): Promise<void> {
    this.logger.info('Stopping node...')
    this.state = NodeState.LEAVING
    
    try {
      // 1. 广播离开消息
      await this.broadcastLeave()
      
      // 2. 关闭连接
      this.connectionPool.closeAll()
      
      // 3. 停止监控
      this.monitor.stop()
      
      // 4. 关闭传输层
      this.transport.close()
      
      this.state = NodeState.OFFLINE
      this.logger.info('Node stopped successfully')
      this.emit('stopped')
      
    } catch (error) {
      this.logger.error('Error stopping node:', error)
      throw error
    }
  }
  
  async send(targetId: string, payload: any): Promise<void> {
    const message = this.createMessage(MessageType.DATA, payload, targetId)
    await this.router.route(message)
  }
  
  async broadcast(payload: any): Promise<void> {
    const message = this.createMessage(MessageType.DATA, payload)
    message.destId = BROADCAST_ID
    await this.router.broadcast(message)
  }
  
  private async handleMessage(message: Message): Promise<void> {
    // 1. 验证签名
    if (!this.verifyMessage(message)) {
      this.logger.warn('Invalid message signature')
      return
    }
    
    // 2. 检查去重
    if (this.isDuplicate(message)) {
      return
    }
    
    // 3. 路由决策
    const decision = this.router.decide(message)
    
    switch (decision.action) {
      case 'deliver':
        await this.deliverMessage(message)
        break
      case 'forward':
        await this.router.forward(message, decision.nextHop)
        break
      case 'broadcast':
        await this.router.broadcast(message)
        break
      case 'drop':
        this.logger.warn('Message dropped:', decision.reason)
        break
    }
  }
  
  getNodeId(): string {
    return this.nodeId
  }
  
  getState(): NodeState {
    return this.state
  }
  
  getStats(): any {
    return this.monitor.getStats()
  }
}
```

---

## 4. 测试策略

### 4.1 单元测试

**测试框架：** Jest

**测试范围：**
- 消息序列化/反序列化
- 加密/解密
- 签名/验证
- 路由算法
- DHT 查找

**示例：**

```typescript
// tests/unit/Serializer.test.ts
import { Serializer } from '../../src/protocol/Serializer'
import { Message, MessageType } from '../../src/protocol/Message'

describe('Serializer', () => {
  it('should serialize and deserialize message', () => {
    const original = new Message(
      MessageType.DATA,
      'node_123',
      { hello: 'world' }
    )
    original.destId = 'node_456'
    
    const buffer = Serializer.serialize(original)
    const deserialized = Serializer.deserialize(buffer)
    
    expect(deserialized.type).toBe(MessageType.DATA)
    expect(deserialized.sourceId).toBe('node_123')
    expect(deserialized.destId).toBe('node_456')
    expect(deserialized.payload).toEqual({ hello: 'world' })
  })
})
```

### 4.2 集成测试

**测试场景：**
- 两节点通信
- 多跳路由
- 节点加入/离开
- 广播消息

**示例：**

```typescript
// tests/integration/TwoNodes.test.ts
import { Node } from '../../src/core/Node'
import { Config } from '../../src/core/Config'

describe('Two Nodes Communication', () => {
  let node1: Node
  let node2: Node
  
  beforeAll(async () => {
    node1 = new Node(new Config({ network: { listenPort: 8081 } }))
    node2 = new Node(new Config({ 
      network: { 
        listenPort: 8082,
        bootstrapNodes: ['ws://localhost:8081']
      } 
    }))
    
    await node1.start()
    await node2.start()
  })
  
  afterAll(async () => {
    await node1.stop()
    await node2.stop()
  })
  
  it('should send message between nodes', async () => {
    const message = { text: 'Hello from node1' }
    
    const received = new Promise(resolve => {
      node2.on('message', (msg) => {
        resolve(msg)
      })
    })
    
    await node1.send(node2.getNodeId(), message)
    
    const msg = await received
    expect(msg.payload).toEqual(message)
  })
})
```

### 4.3 压力测试

**测试工具：** autocannon, clinic

**测试指标：**
- 吞吐量（消息/秒）
- 延迟（P50, P95, P99）
- 资源占用（CPU、内存）

**示例：**

```typescript
// tests/stress/Throughput.test.ts
import { Node } from '../../src/core/Node'

describe('Throughput Test', () => {
  it('should handle 1000 messages per second', async () => {
    const node1 = new Node(new Config())
    const node2 = new Node(new Config())
    
    await node1.start()
    await node2.start()
    
    const messageCount = 1000
    const startTime = Date.now()
    
    for (let i = 0; i < messageCount; i++) {
      node1.send(node2.getNodeId(), { index: i })
    }
    
    // 等待所有消息送达
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const duration = Date.now() - startTime
    const throughput = messageCount / (duration / 1000)
    
    console.log(`Throughput: ${throughput.toFixed(2)} msg/s`)
    expect(throughput).toBeGreaterThan(1000)
    
    await node1.stop()
    await node2.stop()
  })
})
```

---

## 5. 部署指南

### 5.1 本地开发

```bash
# 安装依赖
npm install

# 编译 TypeScript
npm run build

# 运行测试
npm test

# 启动节点
npm run start
```

### 5.2 Docker 部署

**Dockerfile:**

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist

EXPOSE 8080

CMD ["node", "dist/index.js"]
```

**docker-compose.yml:**

```yaml
version: '3.8'

services:
  node1:
    build: .
    ports:
      - "8081:8080"
    environment:
      - NODE_ID=node1
      - BOOTSTRAP_NODES=
  
  node2:
    build: .
    ports:
      - "8082:8080"
    environment:
      - NODE_ID=node2
      - BOOTSTRAP_NODES=ws://node1:8080
    depends_on:
      - node1
  
  node3:
    build: .
    ports:
      - "8083:8080"
    environment:
      - NODE_ID=node3
      - BOOTSTRAP_NODES=ws://node1:8080,ws://node2:8080
    depends_on:
      - node1
      - node2
```

### 5.3 Kubernetes 部署

**deployment.yaml:**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: agent-network
spec:
  replicas: 10
  selector:
    matchLabels:
      app: agent-network
  template:
    metadata:
      labels:
        app: agent-network
    spec:
      containers:
      - name: node
        image: agent-network:latest
        ports:
        - containerPort: 8080
        env:
        - name: BOOTSTRAP_NODES
          value: "ws://agent-network-service:8080"
---
apiVersion: v1
kind: Service
metadata:
  name: agent-network-service
spec:
  selector:
    app: agent-network
  ports:
  - port: 8080
    targetPort: 8080
  type: LoadBalancer
```

---

## 6. 性能优化

### 6.1 连接池优化

```typescript
// 优化前：每次都创建新连接
async function send(nodeId: string, message: Message) {
  const connection = await createConnection(nodeId)
  await connection.send(message)
  connection.close()
}

// 优化后：使用连接池
async function send(nodeId: string, message: Message) {
  const connection = this.connectionPool.get(nodeId)
  await connection.send(message)
  // 连接不关闭，复用
}
```

### 6.2 序列化优化

```typescript
// 使用 MessagePack 而非 JSON
const serialized = msgpack.encode(message)  // 更快更小
const deserialized = msgpack.decode(buffer)

// 而非
const serialized = JSON.stringify(message)
const deserialized = JSON.parse(buffer)
```

### 6.3 批处理优化

```typescript
class MessageBatcher {
  private batch: Message[] = []
  private timer: NodeJS.Timeout | null = null
  
  add(message: Message): void {
    this.batch.push(message)
    
    if (this.batch.length >= 10) {
      this.flush()
    } else if (!this.timer) {
      this.timer = setTimeout(() => this.flush(), 100)
    }
  }
  
  private flush(): void {
    if (this.batch.length === 0) return
    
    const batch = this.batch
    this.batch = []
    this.timer = null
    
    this.sendBatch(batch)
  }
}
```

---

## 7. 监控和调试

### 7.1 日志配置

```typescript
import pino from 'pino'

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard'
    }
  }
})
```

### 7.2 监控指标

```typescript
import { collectDefaultMetrics, Registry, Counter, Histogram } from 'prom-client'

const register = new Registry()
collectDefaultMetrics({ register })

const messagesSent = new Counter({
  name: 'agent_network_messages_sent_total',
  help: 'Total messages sent',
  registers: [register]
})

const messageLatency = new Histogram({
  name: 'agent_network_message_latency_seconds',
  help: 'Message latency in seconds',
  buckets: [0.1, 0.5, 1, 2, 5],
  registers: [register]
})
```

### 7.3 健康检查端点

```typescript
import express from 'express'

const app = express()

app.get('/health', (req, res) => {
  const health = node.performHealthCheck()
  res.status(health.status === 'healthy' ? 200 : 503).json(health)
})

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType)
  res.end(await register.metrics())
})

app.listen(9090)
```

---

## 8. 常见问题

### 8.1 NAT 穿透失败

**问题：** 节点无法连接

**解决方案：**
- 使用 STUN 服务器获取公网地址
- 使用 TURN 中继（最后手段）
- 配置端口转发

### 8.2 连接数过多

**问题：** 内存耗尽

**解决方案：**
- 限制最大连接数
- 定期清理不活跃连接
- 使用连接池

### 8.3 消息丢失

**问题：** 消息未送达

**解决方案：**
- 启用 ACK 机制
- 实现重传
- 使用持久化队列

---

## 9. 总结

本实现指南提供了完整的开发路线：

1. **技术栈** - TypeScript + Node.js 生态
2. **项目结构** - 清晰的模块划分
3. **实现步骤** - 5 个阶段，逐步推进
4. **测试策略** - 单元 + 集成 + 压力测试
5. **部署方案** - 本地 + Docker + K8s
6. **性能优化** - 连接池、序列化、批处理
7. **监控调试** - 日志、指标、健康检查

下一步：阅读集成方案（05-integration.md）
