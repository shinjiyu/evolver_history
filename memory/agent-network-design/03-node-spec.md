# AI Agent 自组织网络 - 节点规范

## 执行摘要

本文档定义了 AI Agent 自组织网络中**节点**的职责、能力、状态机和实现规范。

**节点版本：** v1.0.0

---

## 1. 节点定义

### 1.1 什么是节点？

**节点（Node）** 是网络中的基本单元，代表一个 AI Agent 实例。

**核心职责：**
- 维护网络连接
- 路由消息
- 存储数据（DHT）
- 执行 Agent 逻辑
- 提供服务

### 1.2 节点标识

**Node ID：**
- 格式：32 字节（256 bits）
- 生成：SHA-256(Public Key)
- 示例：`node_a1b2c3d4e5f6...`

**公钥：**
- 算法：Ed25519
- 用途：身份验证、消息签名

**地址：**
- 格式：`/ip4/1.2.3.4/tcp/8080/p2p/node_a1b2...`
- 包含：IP、端口、协议、Node ID

---

## 2. 节点架构

### 2.1 内部架构

```
┌────────────────────────────────────────────────────────────┐
│                        Agent 节点                           │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │              应用层 (Application Layer)               │ │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐     │ │
│  │  │ Agent Logic│  │ Task Queue │  │  Executor  │     │ │
│  │  └────────────┘  └────────────┘  └────────────┘     │ │
│  └──────────────────────────────────────────────────────┘ │
│                           │                               │
│  ┌──────────────────────────────────────────────────────┐ │
│  │              服务层 (Service Layer)                   │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐           │ │
│  │  │  Router  │  │   DHT    │  │ Consensus│           │ │
│  │  └──────────┘  └──────────┘  └──────────┘           │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐           │ │
│  │  │  Storage │  │  Cache   │  │  Monitor │           │ │
│  │  └──────────┘  └──────────┘  └──────────┘           │ │
│  └──────────────────────────────────────────────────────┘ │
│                           │                               │
│  ┌──────────────────────────────────────────────────────┐ │
│  │              通信层 (Communication Layer)             │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐           │ │
│  │  │ Transport│  │  Security│  │Serializer│           │ │
│  │  └──────────┘  └──────────┘  └──────────┘           │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐           │ │
│  │  │Connection│  │Heartbeat │  │  Backoff │           │ │
│  │  │   Pool   │  │ Manager  │  │  Manager │           │ │
│  │  └──────────┘  └──────────┘  └──────────┘           │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### 2.2 核心模块

| 模块 | 职责 | 依赖 |
|------|------|------|
| **Agent Logic** | 执行 Agent 业务逻辑 | Executor, Task Queue |
| **Task Queue** | 管理待执行任务 | Storage |
| **Executor** | 执行任务，返回结果 | Agent Logic |
| **Router** | 消息路由决策 | DHT, Connection Pool |
| **DHT** | 分布式哈希表 | Storage, Router |
| **Consensus** | 共识和决策 | Router, Storage |
| **Storage** | 本地存储 | - |
| **Cache** | 缓存层 | Storage |
| **Monitor** | 监控和统计 | - |
| **Transport** | 传输层抽象 | - |
| **Security** | 加密和认证 | - |
| **Serializer** | 序列化/反序列化 | - |
| **Connection Pool** | 连接管理 | Transport |
| **Heartbeat Manager** | 心跳管理 | Connection Pool |
| **Backoff Manager** | 重试和退避 | - |

---

## 3. 节点状态机

### 3.1 主状态机

```
                  ┌─────────────┐
                  │   OFFLINE   │
                  └──────┬──────┘
                         │ start()
                         ▼
                  ┌─────────────┐
          ┌───────│  BOOTSTRAP  │◄──────┐
          │       └──────┬──────┘       │
          │              │ success      │ failure
          │              ▼              │
          │       ┌─────────────┐       │
          │       │ CONNECTING  │───────┘
          │       └──────┬──────┘
          │              │ connected
          │              ▼
          │       ┌─────────────┐
          │       │   ONLINE    │◄─────┐
          │       └──────┬──────┘      │
          │              │             │
          │              │             │
          │              ▼             │
          │       ┌─────────────┐      │
          │       │    BUSY     │──────┘
          │       └──────┬──────┘
          │              │ error / shutdown()
          │              ▼
          │       ┌─────────────┐
          └──────►│  LEAVING    │
                  └──────┬──────┘
                         │ completed
                         ▼
                  ┌─────────────┐
                  │   OFFLINE   │
                  └─────────────┘
```

### 3.2 状态说明

| 状态 | 说明 | 可转换到 |
|------|------|----------|
| **OFFLINE** | 节点未启动 | BOOTSTRAP |
| **BOOTSTRAP** | 正在引导，获取初始节点 | CONNECTING, BOOTSTRAP |
| **CONNECTING** | 正在建立连接 | ONLINE, BOOTSTRAP |
| **ONLINE** | 在线，空闲状态 | BUSY, LEAVING |
| **BUSY** | 在线，处理任务中 | ONLINE, LEAVING |
| **LEAVING** | 正在离开网络 | OFFLINE |

### 3.3 状态转换触发

```typescript
enum NodeState {
  OFFLINE = 'offline',
  BOOTSTRAP = 'bootstrap',
  CONNECTING = 'connecting',
  ONLINE = 'online',
  BUSY = 'busy',
  LEAVING = 'leaving'
}

interface StateTransition {
  from: NodeState
  to: NodeState
  trigger: string
  condition?: () => boolean
  action?: () => Promise<void>
}
```

---

## 4. 节点职责

### 4.1 网络维护

#### 邻居管理

**职责：**
- 维护邻居列表（5-20 个）
- 定期心跳（30 秒）
- 失败检测（3 次失败 = 离线）
- 自动替换（移除离线，添加新节点）

**邻居选择策略：**
```typescript
interface NeighborSelection {
  // 优先级
  priority: 'latency' | 'stability' | 'reputation' | 'random'
  
  // 约束
  constraints: {
    minLatency: number      // 最小延迟（ms）
    maxLatency: number      // 最大延迟（ms）
    minUptime: number       // 最小在线时间（秒）
    minReputation: number   // 最小信誉（0-100）
  }
  
  // 多样性
  diversity: {
    geographic: boolean     // 地理多样性
    capability: boolean     // 能力多样性
  }
}
```

**邻居评分：**
```typescript
function calculateNeighborScore(neighbor: Neighbor): number {
  const latencyScore = 1 - (neighbor.latency / 1000)  // 0-1
  const stabilityScore = neighbor.uptime / 86400      // 0-1
  const reputationScore = neighbor.reputation / 100   // 0-1
  
  return (
    latencyScore * 0.4 +
    stabilityScore * 0.3 +
    reputationScore * 0.3
  )
}
```

#### 路由表维护

**职责：**
- 维护 DHT 路由表
- 定期刷新（5 分钟）
- 懒更新（按需）

**路由表结构：**
```typescript
interface RoutingTable {
  // Kademlia k-buckets
  buckets: KBucket[]  // 256 个桶
  
  // 本地缓存
  cache: Map<string, Route>
  
  // 统计
  stats: {
    lookups: number
    hits: number
    misses: number
  }
}

interface KBucket {
  distance: number      // 距离范围
  nodes: NodeInfo[]     // k 个节点（k=8）
  lastUpdated: number   // 最后更新时间
}
```

### 4.2 消息路由

#### 路由决策

```typescript
function routeMessage(message: Message): RouteDecision {
  // 1. 检查是否是目标节点
  if (message.destId === this.nodeId) {
    return { action: 'deliver', nextHop: null }
  }
  
  // 2. 检查 TTL
  if (message.ttl <= 0) {
    return { action: 'drop', reason: 'TTL expired' }
  }
  
  // 3. 检查是否是广播
  if (message.destId === BROADCAST_ID) {
    return { action: 'broadcast', nextHop: this.getNeighbors() }
  }
  
  // 4. 查找路由
  const route = this.routingTable.lookup(message.destId)
  if (route) {
    return { action: 'forward', nextHop: route.nextHop }
  }
  
  // 5. DHT 查找
  const closest = this.dht.findClosest(message.destId)
  return { action: 'forward', nextHop: closest[0] }
}
```

#### 消息处理流程

```
接收消息
    │
    ├─ 验证签名 ──→ 失败 ──→ 丢弃
    │
    ├─ 检查去重 ──→ 重复 ──→ 丢弃
    │
    ├─ 路由决策
    │    │
    │    ├─ deliver ──→ 处理消息
    │    │
    │    ├─ forward ──→ 转发到下一跳
    │    │
    │    ├─ broadcast ──→ 广播给邻居
    │    │
    │    └─ drop ──→ 丢弃
    │
    └─ 发送 ACK（如果需要）
```

### 4.3 数据存储

#### DHT 存储

**职责：**
- 存储分配给本节点的数据
- 响应查询请求
- 数据复制（冗余）

**存储策略：**
```typescript
interface StorageStrategy {
  // 副本数
  replicationFactor: number  // 通常 3
  
  // 存储位置
  placement: 'closest' | 'random' | 'balanced'
  
  // 过期策略
  ttl: number  // 秒
  
  // 淘汰策略
  eviction: 'lru' | 'lfu' | 'fifo'
}
```

**数据结构：**
```typescript
interface DHTEntry {
  key: string
  value: Buffer
  timestamp: number
  ttl: number
  signature: Buffer  // 数据签名
  replicas: string[] // 副本节点 ID
}
```

#### 缓存策略

```typescript
interface CacheStrategy {
  // 缓存大小
  maxSize: number  // MB
  
  // 淘汰策略
  eviction: 'lru' | 'lfu'
  
  // TTL
  defaultTTL: number  // 秒
  
  // 预取
  prefetch: boolean
}
```

### 4.4 共识参与

#### 投票机制

**职责：**
- 参与网络决策
- 投票和验证
- 达成共识

**投票流程：**
```typescript
async function vote(proposal: Proposal): Promise<Vote> {
  // 1. 验证提案
  if (!validateProposal(proposal)) {
    return { decision: false, reason: 'Invalid proposal' }
  }
  
  // 2. 检查冲突
  if (hasConflict(proposal)) {
    return { decision: false, reason: 'Conflict detected' }
  }
  
  // 3. 评估影响
  const impact = await assessImpact(proposal)
  if (impact.risk > this.riskThreshold) {
    return { decision: false, reason: 'High risk' }
  }
  
  // 4. 做出决定
  const decision = evaluateProposal(proposal, impact)
  
  // 5. 签名投票
  const signature = signVote(decision)
  
  return { decision, signature, timestamp: Date.now() }
}
```

---

## 5. 节点能力

### 5.1 能力声明

```typescript
interface NodeCapabilities {
  // 基础能力
  basic: {
    compute: boolean       // 计算能力
    storage: boolean       // 存储能力
    routing: boolean       // 路由能力
  }
  
  // 高级能力
  advanced: {
    inference: boolean     // AI 推理
    training: boolean      // AI 训练
    orchestration: boolean // 任务编排
    bridging: boolean      // 跨网络桥接
  }
  
  // 资源限制
  resources: {
    maxMemory: number      // MB
    maxCPU: number         // 核心数
    maxBandwidth: number   // KB/s
    maxStorage: number     // MB
  }
  
  // 专长
  specializations: string[]  // 如 ['nlp', 'vision', 'code']
}
```

### 5.2 能力发现

```typescript
async function discoverCapabilities(
  criteria: CapabilityQuery
): Promise<NodeInfo[]> {
  // 1. 本地缓存
  const cached = this.capabilityCache.query(criteria)
  if (cached.length > 0) return cached
  
  // 2. DHT 查询
  const nodes = await this.dht.query({
    type: 'capability',
    criteria: criteria
  })
  
  // 3. 过滤和排序
  const filtered = nodes
    .filter(n => matchCapabilities(n, criteria))
    .sort((a, b) => scoreCapability(b, criteria) - scoreCapability(a, criteria))
  
  // 4. 缓存结果
  this.capabilityCache.set(criteria, filtered, ttl=300)
  
  return filtered
}
```

---

## 6. 节点生命周期

### 6.1 启动流程

```typescript
async function startNode(config: NodeConfig): Promise<void> {
  // 1. 初始化
  this.state = NodeState.BOOTSTRAP
  this.initialize(config)
  
  // 2. 加载密钥
  await this.loadKeys()
  
  // 3. 获取 Bootstrap 节点
  const bootstrapNodes = await this.getBootstrapNodes()
  
  // 4. 连接 Bootstrap 节点
  this.state = NodeState.CONNECTING
  for (const node of bootstrapNodes) {
    try {
      await this.connect(node)
      break  // 连接成功一个即可
    } catch (error) {
      console.error(`Failed to connect to ${node.id}:`, error)
    }
  }
  
  // 5. 加入网络
  await this.joinNetwork()
  
  // 6. 同步路由表
  await this.syncRoutingTable()
  
  // 7. 启动心跳
  this.startHeartbeat()
  
  // 8. 启动监控
  this.startMonitor()
  
  // 9. 在线
  this.state = NodeState.ONLINE
  console.log('Node started successfully')
}
```

### 6.2 运行时行为

```typescript
async function runNode(): Promise<void> {
  while (this.state !== NodeState.OFFLINE) {
    try {
      // 1. 接收消息
      const message = await this.receiveMessage()
      
      // 2. 处理消息
      await this.handleMessage(message)
      
      // 3. 维护任务
      await this.maintenance()
      
    } catch (error) {
      console.error('Error in main loop:', error)
      await this.handleError(error)
    }
  }
}
```

### 6.3 关闭流程

```typescript
async function stopNode(): Promise<void> {
  // 1. 设置状态
  this.state = NodeState.LEAVING
  
  // 2. 停止接收新任务
  this.stopAcceptingTasks()
  
  // 3. 完成现有任务
  await this.completePendingTasks()
  
  // 4. 广播离开消息
  await this.broadcastLeave()
  
  // 5. 转移数据
  await this.transferData()
  
  // 6. 关闭连接
  await this.closeConnections()
  
  // 7. 保存状态
  await this.saveState()
  
  // 8. 离线
  this.state = NodeState.OFFLINE
  console.log('Node stopped successfully')
}
```

---

## 7. 容错机制

### 7.1 故障检测

**心跳检测：**
```typescript
class HeartbeatMonitor {
  private lastSeen: Map<string, number> = new Map()
  private timeout: number = 90000  // 90 秒
  
  checkNeighbor(nodeId: string): boolean {
    const lastSeen = this.lastSeen.get(nodeId)
    if (!lastSeen) return false
    
    const elapsed = Date.now() - lastSeen
    return elapsed < this.timeout
  }
  
  updateLastSeen(nodeId: string): void {
    this.lastSeen.set(nodeId, Date.now())
  }
  
  getOfflineNeighbors(): string[] {
    const offline: string[] = []
    for (const [nodeId, lastSeen] of this.lastSeen) {
      if (Date.now() - lastSeen > this.timeout) {
        offline.push(nodeId)
      }
    }
    return offline
  }
}
```

### 7.2 故障恢复

**连接恢复：**
```typescript
async function recoverConnection(nodeId: string): Promise<void> {
  // 1. 尝试重连
  for (let i = 0; i < 3; i++) {
    try {
      await this.connect(nodeId)
      console.log(`Reconnected to ${nodeId}`)
      return
    } catch (error) {
      await sleep(1000 * Math.pow(2, i))
    }
  }
  
  // 2. 查找替代节点
  const alternative = await this.findAlternative(nodeId)
  if (alternative) {
    await this.connect(alternative)
    this.updateRoutingTable(nodeId, alternative)
  }
}
```

**数据恢复：**
```typescript
async function recoverData(key: string): Promise<Buffer | null> {
  // 1. 尝试从副本获取
  const replicas = await this.dht.getReplicas(key)
  for (const replica of replicas) {
    try {
      const data = await this.fetchFromNode(replica, key)
      if (data) return data
    } catch (error) {
      console.error(`Failed to fetch from ${replica}:`, error)
    }
  }
  
  // 2. 重新计算（如果可能）
  if (this.canRecompute(key)) {
    return await this.recompute(key)
  }
  
  return null
}
```

---

## 8. 安全机制

### 8.1 身份验证

```typescript
async function authenticateNode(nodeId: string, challenge: Buffer): Promise<boolean> {
  // 1. 获取公钥
  const publicKey = await this.getPublicKey(nodeId)
  if (!publicKey) return false
  
  // 2. 验证签名
  const signature = await this.requestSignature(nodeId, challenge)
  const valid = ed25519.verify(challenge, signature, publicKey)
  
  if (!valid) return false
  
  // 3. 检查信誉
  const reputation = await this.getReputation(nodeId)
  if (reputation < this.minReputation) return false
  
  return true
}
```

### 8.2 权限控制

```typescript
interface Permission {
  nodeId: string
  capabilities: string[]
  rateLimit: number
  quota: {
    messages: number
    bandwidth: number
    storage: number
  }
}

class PermissionManager {
  private permissions: Map<string, Permission> = new Map()
  
  checkPermission(nodeId: string, action: string): boolean {
    const perm = this.permissions.get(nodeId)
    if (!perm) return false
    
    return perm.capabilities.includes(action)
  }
  
  checkRateLimit(nodeId: string): boolean {
    const perm = this.permissions.get(nodeId)
    if (!perm) return false
    
    const usage = this.getUsage(nodeId)
    return usage.messages < perm.quota.messages
  }
}
```

### 8.3 信誉系统

```typescript
class ReputationSystem {
  private reputation: Map<string, number> = new Map()
  
  updateReputation(nodeId: string, delta: number): void {
    const current = this.reputation.get(nodeId) || 50
    const newRep = Math.max(0, Math.min(100, current + delta))
    this.reputation.set(nodeId, newRep)
  }
  
  recordSuccess(nodeId: string): void {
    this.updateReputation(nodeId, +1)
  }
  
  recordFailure(nodeId: string): void {
    this.updateReputation(nodeId, -5)
  }
  
  recordMalicious(nodeId: string): void {
    this.updateReputation(nodeId, -50)
  }
}
```

---

## 9. 监控和诊断

### 9.1 统计信息

```typescript
interface NodeStats {
  // 网络统计
  network: {
    bytesSent: number
    bytesReceived: number
    messagesSent: number
    messagesReceived: number
    activeConnections: number
    avgLatency: number
  }
  
  // 资源统计
  resources: {
    cpuUsage: number       // 0-100
    memoryUsage: number    // MB
    storageUsage: number   // MB
    bandwidthUsage: number // KB/s
  }
  
  // 业务统计
  business: {
    tasksCompleted: number
    tasksFailed: number
    avgTaskDuration: number
    queueLength: number
  }
  
  // 路由统计
  routing: {
    dhtLookups: number
    dhtHits: number
    dhtMisses: number
    messagesRouted: number
    messagesDropped: number
  }
}
```

### 9.2 健康检查

```typescript
interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy'
  checks: {
    connectivity: boolean
    resources: boolean
    routing: boolean
    storage: boolean
  }
  issues: string[]
}

async function performHealthCheck(): Promise<HealthCheck> {
  const checks = {
    connectivity: await this.checkConnectivity(),
    resources: this.checkResources(),
    routing: await this.checkRouting(),
    storage: await this.checkStorage()
  }
  
  const issues: string[] = []
  if (!checks.connectivity) issues.push('Poor connectivity')
  if (!checks.resources) issues.push('Resource pressure')
  if (!checks.routing) issues.push('Routing issues')
  if (!checks.storage) issues.push('Storage issues')
  
  const status = issues.length === 0 ? 'healthy' :
                 issues.length <= 2 ? 'degraded' : 'unhealthy'
  
  return { status, checks, issues }
}
```

---

## 10. 配置管理

### 10.1 节点配置

```typescript
interface NodeConfig {
  // 身份
  identity: {
    nodeId?: string        // 可选，自动生成
    privateKey?: string    // 可选，自动生成
    name?: string          // 可选
  }
  
  // 网络
  network: {
    listenPort: number
    bootstrapNodes: string[]
    maxNeighbors: number
    heartbeatInterval: number
  }
  
  // 资源
  resources: {
    maxMemory: number      // MB
    maxCPU: number         // 核心
    maxBandwidth: number   // KB/s
    maxStorage: number     // MB
  }
  
  // 路由
  routing: {
    dhtReplication: number
    cacheSize: number      // MB
    cacheTTL: number       // 秒
  }
  
  // 安全
  security: {
    encryption: boolean
    minReputation: number
    rateLimit: number
  }
  
  // 日志
  logging: {
    level: 'error' | 'warn' | 'info' | 'debug' | 'trace'
    file?: string
  }
}
```

### 10.2 默认配置

```typescript
const DEFAULT_CONFIG: NodeConfig = {
  identity: {},
  network: {
    listenPort: 8080,
    bootstrapNodes: [],
    maxNeighbors: 20,
    heartbeatInterval: 30000
  },
  resources: {
    maxMemory: 100,
    maxCPU: 1,
    maxBandwidth: 100,
    maxStorage: 1000
  },
  routing: {
    dhtReplication: 3,
    cacheSize: 10,
    cacheTTL: 300
  },
  security: {
    encryption: true,
    minReputation: 20,
    rateLimit: 100
  },
  logging: {
    level: 'info'
  }
}
```

---

## 11. 总结

本节点规范定义了 AI Agent 自组织网络中节点的完整行为：

1. **清晰架构** - 分层设计，职责明确
2. **状态管理** - 状态机驱动，行为可预测
3. **核心职责** - 网络维护、消息路由、数据存储、共识参与
4. **能力声明** - 灵活的能力发现和匹配
5. **生命周期** - 完整的启动、运行、关闭流程
6. **容错机制** - 故障检测、自动恢复
7. **安全机制** - 身份验证、权限控制、信誉系统
8. **监控诊断** - 统计信息、健康检查
9. **配置管理** - 灵活可配置

下一步：阅读实现指南（04-implementation-guide.md）
