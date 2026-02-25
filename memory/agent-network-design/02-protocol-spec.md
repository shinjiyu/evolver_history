# AI Agent 自组织网络 - 协议规范

## 执行摘要

本文档定义了 AI Agent 自组织网络的**通信协议**，包括消息格式、通信流程、错误处理等。

**协议版本：** v1.0.0
**协议名称：** AgentMesh Protocol (AMP)

---

## 1. 消息格式

### 1.1 通用消息结构

所有消息使用 **MessagePack** 序列化，二进制格式：

```
┌─────────────────────────────────────────────────────────┐
│                      消息结构                            │
├─────────────────────────────────────────────────────────┤
│  Version (1 byte)      - 协议版本 (0x01)                │
│  Type (1 byte)         - 消息类型                       │
│  Flags (1 byte)        - 标志位                         │
│  Reserved (1 byte)     - 保留                           │
│  Message ID (16 bytes) - UUID v4                        │
│  Timestamp (8 bytes)   - Unix timestamp (ms)            │
│  TTL (1 byte)          - 生存时间 (0-255)               │
│  Hop Count (1 byte)    - 已跳转次数                     │
│  Source ID (32 bytes)  - 发送方 Node ID                 │
│  Dest ID (32 bytes)    - 接收方 Node ID (可选)          │
│  Payload Length (4 bytes) - 负载长度                    │
│  Payload (Variable)    - 消息负载                       │
│  Signature (64 bytes)  - Ed25519 签名                   │
└─────────────────────────────────────────────────────────┘

总头大小：132 bytes（不含负载）
```

### 1.2 消息类型

| 类型码 | 名称 | 用途 | 负载 |
|--------|------|------|------|
| 0x01 | HEARTBEAT | 心跳保活 | HeartbeatPayload |
| 0x02 | JOIN | 加入网络 | JoinPayload |
| 0x03 | LEAVE | 离开网络 | LeavePayload |
| 0x04 | DATA | 数据传输 | DataPayload |
| 0x05 | CONTROL | 控制消息 | ControlPayload |
| 0x06 | CONSENSUS | 共识消息 | ConsensusPayload |
| 0x07 | QUERY | 查询请求 | QueryPayload |
| 0x08 | RESPONSE | 查询响应 | ResponsePayload |
| 0x09 | ERROR | 错误消息 | ErrorPayload |
| 0x0A | ACK | 确认消息 | AckPayload |

### 1.3 标志位

```
Bit 7-6: 优先级 (00=低, 01=中, 10=高, 11=紧急)
Bit 5:   需要确认 (0=否, 1=是)
Bit 4:   加密负载 (0=否, 1=是)
Bit 3:   压缩负载 (0=否, 1=是)
Bit 2-0: 保留
```

---

## 2. 负载定义

### 2.1 HeartbeatPayload

```typescript
interface HeartbeatPayload {
  timestamp: number      // 当前时间戳
  neighbors: string[]    // 邻居节点 ID 列表
  load: {
    cpu: number          // CPU 使用率 (0-100)
    memory: number       // 内存使用率 (0-100)
    bandwidth: number    // 带宽使用 (KB/s)
  }
  sequence: number       // 序列号（递增）
}
```

**大小：** ~50-100 bytes

### 2.2 JoinPayload

```typescript
interface JoinPayload {
  nodeId: string         // 节点 ID
  publicKey: string      // 公钥（Base64）
  capabilities: string[] // 能力列表
  metadata: {
    name?: string        // 节点名称
    version: string      // 协议版本
    region?: string      // 地理位置
  }
  timestamp: number      // 加入时间
  signature: string      // 身份签名
}
```

**大小：** ~200-300 bytes

### 2.3 LeavePayload

```typescript
interface LeavePayload {
  nodeId: string         // 离开节点 ID
  reason: string         // 离开原因
  timestamp: number      // 离开时间
  successor?: string     // 接替节点（可选）
}
```

**大小：** ~50-100 bytes

### 2.4 DataPayload

```typescript
interface DataPayload {
  dataType: string       // 数据类型
  encoding: string       // 编码方式 (json|binary|text)
  compression?: string   // 压缩算法 (gzip|lz4|none)
  data: Buffer           // 实际数据
  metadata?: object      // 元数据（可选）
}
```

**大小：** 可变（通常 < 1MB）

### 2.5 ControlPayload

```typescript
interface ControlPayload {
  action: string         // 控制动作
  params: object         // 参数
  target?: string        // 目标节点（可选）
}
```

**控制动作：**
- `ping` - 测试连通性
- `stats` - 请求统计信息
- `neighbors` - 请求邻居列表
- `route` - 请求路由信息

**大小：** ~50-200 bytes

### 2.6 ConsensusPayload

```typescript
interface ConsensusPayload {
  consensusId: string    // 共识 ID
  round: number          // 轮次
  phase: 'prepare' | 'commit' | 'abort'
  proposal: object       // 提案内容
  votes?: Vote[]         // 投票记录
  timestamp: number      // 时间戳
}

interface Vote {
  voterId: string        // 投票者 ID
  decision: boolean      // 决定
  signature: string      // 签名
}
```

**大小：** ~100-500 bytes

### 2.7 QueryPayload

```typescript
interface QueryPayload {
  queryId: string        // 查询 ID
  queryType: string      // 查询类型
  query: object          // 查询内容
  timeout?: number       // 超时时间（ms）
}
```

**查询类型：**
- `dht_lookup` - DHT 查找
- `node_info` - 节点信息
- `capability` - 能力查询
- `content` - 内容搜索

**大小：** ~50-200 bytes

### 2.8 ResponsePayload

```typescript
interface ResponsePayload {
  queryId: string        // 对应的查询 ID
  status: 'success' | 'error' | 'timeout'
  data?: object          // 响应数据
  error?: ErrorInfo      // 错误信息
  timestamp: number      // 响应时间
}

interface ErrorInfo {
  code: number           // 错误码
  message: string        // 错误消息
  details?: object       // 详细信息
}
```

**大小：** ~100-1000 bytes

### 2.9 ErrorPayload

```typescript
interface ErrorPayload {
  errorCode: number      // 错误码
  errorMessage: string   // 错误消息
  relatedMessageId?: string // 相关消息 ID
  recoverable: boolean   // 是否可恢复
  retryAfter?: number    // 重试等待时间（ms）
}
```

**错误码：**
| 范围 | 类别 |
|------|------|
| 1xx | 信息（继续处理） |
| 2xx | 成功 |
| 3xx | 重定向 |
| 4xx | 客户端错误 |
| 5xx | 服务器错误 |

**常见错误码：**
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 408: Request Timeout
- 429: Too Many Requests
- 500: Internal Error
- 503: Service Unavailable

**大小：** ~50-100 bytes

### 2.10 AckPayload

```typescript
interface AckPayload {
  messageId: string      // 确认的消息 ID
  status: 'received' | 'processed' | 'failed'
  timestamp: number      // 确认时间
}
```

**大小：** ~50 bytes

---

## 3. 通信流程

### 3.1 连接建立

#### WebSocket 连接（推荐）

```
客户端                          服务器
  │                               │
  ├─ WebSocket Handshake ────────→│
  │  ws://node:port/agentmesh     │
  │                               │
  │←─ 101 Switching Protocols ────┤
  │                               │
  ├─ Noise Handshake ────────────→│
  │  (加密握手)                    │
  │                               │
  │←─ Noise Response ─────────────┤
  │                               │
  ├─ JOIN Message ───────────────→│
  │                               │
  │←─ ACK + Neighbor List ────────┤
  │                               │
  [连接建立完成]                   │
```

**时间：** ~500-1000ms

#### UDP 连接（可选）

```
客户端                          服务器
  │                               │
  ├─ STUN Binding Request ───────→│
  │                               │
  │←─ STUN Binding Response ──────┤
  │  (获取公网 IP:Port)            │
  │                               │
  ├─ Hole Punching ───────────────→│
  │  (UDP 打洞)                    │
  │                               │
  ├─ DTLS Handshake ─────────────→│
  │  (加密握手)                    │
  │                               │
  │←─ DTLS Response ──────────────┤
  │                               │
  [连接建立完成]                   │
```

**时间：** ~1000-2000ms

### 3.2 消息传递流程

#### 可靠传递（TCP/WebSocket）

```
发送方                    接收方
  │                         │
  ├─ Message ──────────────→│
  │  (Flags: ACK=1)         │
  │                         │
  │←─ ACK ──────────────────┤
  │  (status=received)      │
  │                         │
  [超时重传: 3 次]           │
```

**重传策略：**
- 首次重传：500ms
- 二次重传：1000ms
- 三次重传：2000ms
- 失败后：放弃，返回错误

#### 快速传递（UDP）

```
发送方                    接收方
  │                         │
  ├─ Message ──────────────→│
  │  (Flags: ACK=0)         │
  │                         │
  [不等待 ACK]               │
```

**适用场景：**
- 心跳消息
- 广播消息
- 实时数据（允许丢失）

### 3.3 查询流程

```
查询方                    中间节点                  目标节点
  │                         │                         │
  ├─ QUERY (DHT Lookup) ───→│                         │
  │                         │                         │
  │                         ├─ Forward Query ────────→│
  │                         │                         │
  │                         │←─ RESPONSE ─────────────┤
  │                         │                         │
  │←─ RESPONSE ─────────────┤                         │
  │                         │                         │
```

**超时：** 5000ms（可配置）

### 3.4 广播流程

```
广播方                    邻居节点                  网络
  │                         │                       │
  ├─ DATA (Broadcast) ─────→│                       │
  │  (TTL=5, Hop=0)         │                       │
  │                         │                       │
  │                         ├─ Forward (TTL=4) ────→│
  │                         │                       │
  │                         │                       ├─ Forward (TTL=3)
  │                         │                       │
  [TTL=0 时停止转发]          │                       │
```

**防环：**
- 消息 ID 去重（缓存 60 秒）
- Hop Count 限制（最大 10）

---

## 4. 错误处理

### 4.1 错误分类

| 类别 | 处理策略 |
|------|----------|
| **网络错误** | 重试 3 次，指数退避 |
| **协议错误** | 返回错误消息，不重试 |
| **业务错误** | 根据错误码决定 |
| **超时错误** | 重试或降级 |

### 4.2 重试策略

```typescript
async function retryWithBackoff(
  fn: () => Promise<any>,
  maxRetries: number = 3,
  baseDelay: number = 500
): Promise<any> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      if (i === maxRetries - 1) throw error
      
      const delay = baseDelay * Math.pow(2, i)
      await sleep(delay)
    }
  }
}
```

### 4.3 降级策略

| 场景 | 降级方案 |
|------|----------|
| DHT 查找失败 | 使用缓存数据 |
| 节点离线 | 路由到其他节点 |
| 网络分区 | 本地决策，延迟同步 |
| 资源耗尽 | 拒绝新连接，保护现有 |

---

## 5. 安全机制

### 5.1 Noise Protocol 握手

采用 **Noise_XX_25519_ChaChaPoly_BLAKE2s** 模式：

```
发起方 (I)                          响应方 (R)
   │                                    │
   ├─ e ──────────────────────────────→│
   │  (临时公钥)                         │
   │                                    │
   │←─ e, ee, s, es ───────────────────┤
   │  (临时公钥 + 静态公钥)              │
   │                                    │
   ├─ s, se ──────────────────────────→│
   │  (静态公钥)                         │
   │                                    │
   [加密通道建立完成]                     │
```

**优势：**
- 无需 PKI
- 前向保密
- 双向认证

### 5.2 消息签名

每条消息使用 **Ed25519** 签名：

```typescript
function signMessage(message: Message, privateKey: Buffer): Buffer {
  const payload = serializeForSignature(message)
  return ed25519.sign(payload, privateKey)
}

function verifySignature(message: Message, publicKey: Buffer): boolean {
  const payload = serializeForSignature(message)
  return ed25519.verify(payload, message.signature, publicKey)
}
```

**签名范围：** 除 Signature 字段外的所有字段

### 5.3 消息加密

**标志位 Bit 4 = 1 时，负载加密：**

```typescript
function encryptPayload(payload: Buffer, key: Buffer): Buffer {
  const nonce = randomBytes(12)
  const ciphertext = chacha20_poly1305.encrypt(payload, key, nonce)
  return Buffer.concat([nonce, ciphertext])
}

function decryptPayload(encrypted: Buffer, key: Buffer): Buffer {
  const nonce = encrypted.slice(0, 12)
  const ciphertext = encrypted.slice(12)
  return chacha20_poly1305.decrypt(ciphertext, key, nonce)
}
```

**密钥来源：** Noise 握手后的共享密钥

---

## 6. 性能优化

### 6.1 批处理

**心跳批处理：**
```typescript
// 每 30 秒发送一次，包含所有邻居
interface BatchHeartbeat {
  heartbeats: HeartbeatPayload[]
  timestamp: number
}
```

**消息批处理：**
```typescript
// 累积 100ms 或 10 条消息，批量发送
interface MessageBatch {
  messages: Message[]
  count: number
}
```

### 6.2 压缩

**适用条件：**
- 负载 > 1KB
- 标志位 Bit 3 = 1

**算法：** LZ4（快速压缩）

```typescript
function compressPayload(payload: Buffer): Buffer {
  return lz4.compress(payload)
}

function decompressPayload(compressed: Buffer): Buffer {
  return lz4.decompress(compressed)
}
```

**压缩率：** ~50-70%（文本数据）

### 6.3 缓存

**路由缓存：**
```typescript
interface RouteCache {
  get(nodeId: string): Route | null
  set(nodeId: string, route: Route, ttl: number): void
  invalidate(nodeId: string): void
}
```

**TTL：** 300 秒（5 分钟）

**DHT 缓存：**
```typescript
interface DHTCache {
  get(key: string): Value | null
  set(key: string, value: Value, ttl: number): void
}
```

**TTL：** 3600 秒（1 小时）

---

## 7. 协议扩展

### 7.1 版本协商

```typescript
interface VersionNegotiation {
  supportedVersions: number[]
  selectedVersion?: number
}
```

**流程：**
1. 客户端发送支持的版本列表
2. 服务器选择最高兼容版本
3. 双方切换到选定版本

### 7.2 能力协商

```typescript
interface CapabilityNegotiation {
  capabilities: {
    feature: string
    version: string
    params?: object
  }[]
}
```

**示例：**
```json
{
  "capabilities": [
    {"feature": "compression", "version": "1.0", "params": {"algorithms": ["lz4", "gzip"]}},
    {"feature": "encryption", "version": "1.0", "params": {"algorithms": ["chacha20", "aes"]}}
  ]
}
```

### 7.3 自定义消息类型

**保留范围：** 0x80-0xFF（用户自定义）

```typescript
interface CustomMessage {
  type: 0x80 | 0x81 | ... | 0xFF
  payload: Buffer
  encoding: string  // 'json' | 'binary' | 'custom'
}
```

---

## 8. 监控和调试

### 8.1 统计信息

```typescript
interface ProtocolStats {
  messagesSent: number
  messagesReceived: number
  bytesSent: number
  bytesReceived: number
  errors: number
  avgLatency: number
  activeConnections: number
}
```

### 8.2 日志级别

| 级别 | 用途 |
|------|------|
| ERROR | 严重错误 |
| WARN | 警告 |
| INFO | 重要事件（连接、断开） |
| DEBUG | 详细信息（消息内容） |
| TRACE | 最详细（每个字节） |

### 8.3 诊断工具

**Ping:**
```typescript
await network.ping(nodeId, timeout: 5000)
```

**Traceroute:**
```typescript
const route = await network.traceroute(nodeId)
// 返回跳数和延迟
```

**Stats:**
```typescript
const stats = await network.getStats(nodeId)
```

---

## 9. 实现建议

### 9.1 状态机

```
┌─────────┐
│  IDLE   │
└────┬────┘
     │ connect()
     ▼
┌─────────┐
│ CONNECTING│
└────┬────┘
     │ handshake success
     ▼
┌─────────┐
│  READY  │◄─────┐
└────┬────┘      │
     │ send()    │
     ▼           │
┌─────────┐      │
│  BUSY   │──────┘
└────┬────┘
     │ error / close()
     ▼
┌─────────┐
│  CLOSED │
└─────────┘
```

### 9.2 事件驱动

```typescript
class ProtocolHandler {
  on(event: 'message', handler: (msg: Message) => void)
  on(event: 'error', handler: (err: Error) => void)
  on(event: 'connect', handler: () => void)
  on(event: 'disconnect', handler: () => void)
}
```

### 9.3 测试

**单元测试：**
- 消息序列化/反序列化
- 加密/解密
- 签名/验证

**集成测试：**
- 两节点通信
- 多跳路由
- 广播和查询

**压力测试：**
- 1000+ 并发连接
- 10000+ 消息/秒
- 长时间运行（24h+）

---

## 10. 总结

本协议规范定义了 AI Agent 自组织网络的通信基础：

1. **统一消息格式** - MessagePack + 固定头
2. **多种消息类型** - 覆盖所有场景
3. **可靠通信流程** - 重传、确认、超时
4. **完善错误处理** - 重试、降级
5. **安全加密** - Noise + Ed25519
6. **性能优化** - 批处理、压缩、缓存
7. **可扩展性** - 版本协商、能力协商

下一步：阅读节点规范（03-node-spec.md）
