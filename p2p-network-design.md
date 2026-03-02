# P2P 网络架构设计

> 适用于 AI Agent 自组织网络的去中心化、轻量级通信架构

---

## 1. 节点发现机制

采用**三层混合发现策略**，按优先级依次尝试：

### 1.1 本地发现 (mDNS/DNS-SD)

```
适用场景：同一局域网内的节点发现
延迟：<10ms
开销：极低
```

**工作原理：**
- 节点启动时广播 mDNS 服务 `_aiagent._udp.local.`
- 监听局域网内其他节点的广播
- 发现的节点直接加入邻居列表

**服务记录格式：**
```
_aiagent._udp.local. TXT {
  "id": "node-abc123",           // 节点唯一标识
  "ver": "1.0",                  // 协议版本
  "cap": "chat,task,storage",    // 能力标签
  "port": "7890"                 // 监听端口
}
```

### 1.2 DHT 发现 (简化版 Kademlia)

```
适用场景：广域网节点发现
延迟：100-500ms
开销：中等
```

**简化设计（相比完整 Kademlia）：**

| 特性 | 完整 Kademlia | 简化版 |
|------|--------------|--------|
| 节点 ID | 160-bit SHA-1 | 128-bit（足够） |
| k-bucket 深度 | 160 层 | 64 层（合并高位） |
| 每层节点数 | k=20 | k=8（减少内存） |
| 并行查找 | α=3 | α=2（降低带宽） |
| 路由表刷新 | 每小时 | 每 30 分钟 |

**核心数据结构：**
```rust
struct RoutingTable {
    node_id: [u8; 16],           // 本节点 ID
    buckets: Vec<Bucket>,        // 64 个 k-bucket
}

struct Bucket {
    nodes: Vec<NodeInfo>,        // 最多 8 个节点
    last_updated: Timestamp,
}

struct NodeInfo {
    id: [u8; 16],
    addr: SocketAddr,
    last_seen: Timestamp,
    latency: u16,                // ms，用于邻居选择
}
```

**DHT 操作：**
- `FIND_NODE(id)` - 查找节点
- `PING()` - 存活检测
- `STORE(key, value)` - 存储元数据（可选）

### 1.3 Bootstrap 节点（可选）

```
适用场景：首次加入网络，无任何已知节点
去中心化程度：弱依赖（仅用于冷启动）
```

**设计原则：**
- Bootstrap 节点只提供初始联系人，不存储任何数据
- 用户可自定义 Bootstrap 列表（类似 DNS 种子）
- 节点获取到首批邻居后，不再依赖 Bootstrap

**Bootstrap 列表来源：**
1. 硬编码的公共节点
2. 用户配置文件
3. 之前会话缓存的邻居
4. QR 码/链接分享（手动引入）

### 1.4 发现流程图

```
┌─────────────────────────────────────────────────────────────┐
│                      节点启动                                │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────┐
              │   启动 mDNS 监听/广播    │
              └─────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────┐
              │   检查本地缓存邻居       │
              └─────────────────────────┘
                            │
                   ┌────────┴────────┐
                   │                 │
                   ▼                 ▼
           有缓存邻居          无缓存邻居
               │                    │
               │                    ▼
               │         ┌─────────────────────┐
               │         │  尝试 Bootstrap 节点  │
               │         └─────────────────────┘
               │                    │
               └────────┬───────────┘
                        │
                        ▼
              ┌─────────────────────────┐
              │   向已知节点发送        │
              │   FIND_NODE(自身ID)     │
              └─────────────────────────┘
                        │
                        ▼
              ┌─────────────────────────┐
              │   迭代查找，填充路由表   │
              └─────────────────────────┘
                        │
                        ▼
              ┌─────────────────────────┐
              │   进入稳定运行状态       │
              └─────────────────────────┘
```

---

## 2. 通信协议

### 2.1 消息格式

采用**双模式设计**：JSON（默认）+ MessagePack（可选压缩）

**JSON 消息格式（开发友好）：**
```json
{
  "v": 1,                          // 协议版本
  "id": "msg-uuid-123",            // 消息 ID（用于去重/确认）
  "t": 1703123456789,              // 时间戳（ms）
  "type": "request",               // request | response | notify
  "action": "find_node",           // 动作类型
  "from": "node-abc",              // 发送者 ID
  "to": "node-xyz",                // 接收者 ID（可选，用于路由）
  "ttl": 5,                        // 跳数限制（防止无限传播）
  "payload": {                     // 具体内容
    "target": "target-node-id"
  },
  "sig": "base64-signature"        // 签名（可选，用于认证）
}
```

**MessagePack 二进制格式（带宽敏感场景）：**
- 相比 JSON 减少 30-50% 体积
- 需要双方协商启用（握手时声明）

### 2.2 消息类型定义

```yaml
# 控制消息（DHT 相关）
- ping:          存活检测
- pong:          PING 响应
- find_node:     查找节点
- find_node_res: 查找结果
- store:         存储元数据
- find_value:    查找值

# 应用消息（Agent 通信）
- direct_msg:    点对点消息
- broadcast:     广播消息（带 TTL）
- task_assign:   任务分配
- task_result:   任务结果
- sync_state:    状态同步

# 握手消息
- hello:         连接握手
- hello_ack:     握手确认
- goodbye:       优雅断开
```

### 2.3 传输层选择

| 协议 | 优点 | 缺点 | 适用场景 |
|------|------|------|----------|
| **WebSocket** | 防火墙友好、NAT 穿透易、实现简单 | 开销略大 | **主协议** |
| **QUIC** | 低延迟、内置加密、多路复用 | 实现复杂、部分网络阻断 | 高性能场景 |
| **UDP** | 最低开销 | 不可靠、需自己实现可靠性 | 内网/可控环境 |
| **TCP 原生** | 最大控制 | 实现复杂 | 特殊需求 |

**推荐方案：WebSocket 为主，QUIC 为备**

```
连接建立优先级：
1. WebSocket (ws:// / wss://)  ← 默认
2. QUIC (quic://)              ← 如果双方支持
3. TCP 原生                    ← 最后备选
```

### 2.4 连接管理

**长连接 + 心跳保活：**

```
┌────────────────────────────────────────┐
│  连接池设计                             │
├────────────────────────────────────────┤
│  max_connections: 32                   │  ← 限制最大连接数
│  idle_timeout: 5min                    │  ← 空闲超时
│  heartbeat_interval: 30s               │  ← 心跳间隔
│  reconnect_delay: 1s ~ 30s (指数退避)   │
└────────────────────────────────────────┘
```

**连接状态机：**
```
DISCONNECTED → CONNECTING → CONNECTED → IDLE → DISCONNECTED
                   ↑            │        │
                   └────────────┴────────┘
                      (心跳/重连)
```

**连接选择策略：**
```python
def select_connection(target_node):
    # 1. 优先复用现有连接
    if has_active_connection(target_node):
        return existing_connection
    
    # 2. 通过 DHT 查找目标
    route = dht.lookup(target_node)
    
    # 3. 直接连接（如果可达）
    if is_directly_reachable(target_node):
        return establish_direct(target_node)
    
    # 4. 中继路由（通过邻居转发）
    return relay_via_neighbors(route)
```

---

## 3. 网络拓扑

### 3.1 混合拓扑结构

```
                    ┌─────────────────────────────────┐
                    │   结构化 P2P (Kademlia DHT)      │
                    │   - 节点查找 O(log N)           │
                    │   - 确定性路由                   │
                    └─────────────────────────────────┘
                                   │
                                   │ 覆盖层
                                   ▼
                    ┌─────────────────────────────────┐
                    │   非结构化 P2P (Gossip)          │
                    │   - 广播消息                     │
                    │   - 邻居维护                     │
                    └─────────────────────────────────┘
                                   │
                                   │ 物理层
                                   ▼
                    ┌─────────────────────────────────┐
                    │   底层传输 (WebSocket/QUIC)      │
                    └─────────────────────────────────┘
```

### 3.2 邻居选择策略

**原则：** 平衡网络覆盖与资源消耗

```python
class NeighborSelector:
    MAX_NEIGHBORS = 16           # 最大邻居数
    MIN_NEIGHBORS = 4            # 最小邻居数（保证连通）
    
    def select_neighbors(self, routing_table):
        neighbors = []
        
        # 1. 从每个 k-bucket 选择最近的节点（保证覆盖）
        for bucket in routing_table.buckets:
            if bucket.nodes:
                best = min(bucket.nodes, key=lambda n: n.latency)
                neighbors.append(best)
        
        # 2. 按延迟排序，保留最优的 MAX_NEIGHBORS 个
        neighbors.sort(key=lambda n: n.latency)
        neighbors = neighbors[:self.MAX_NEIGHBORS]
        
        # 3. 如果邻居太少，随机补充
        while len(neighbors) < self.MIN_NEIGHBORS:
            random_node = self.find_random_node()
            if random_node:
                neighbors.append(random_node)
        
        return neighbors
```

**邻居多样性优化：**
```python
def ensure_diversity(neighbors):
    """确保邻居在 ID 空间中均匀分布"""
    # 按 ID 前缀分组
    groups = group_by_prefix(neighbors, prefix_bits=4)
    
    # 每组最多保留 2 个
    return [n for group in groups.values() 
              for n in group[:2]]
```

### 3.3 拓扑优化

**动态调整策略：**

| 触发条件 | 动作 |
|----------|------|
| 邻居数 < MIN_NEIGHBORS | 主动发现新节点 |
| 邻居数 > MAX_NEIGHBORS | 移除高延迟节点 |
| 连续 3 次心跳失败 | 标记节点离线，查找替代 |
| 发现更近的节点 | 替换路由表中的远节点 |
| 流量高峰期 | 增加邻居数（弹性扩展） |

---

## 4. 协议流程图

### 4.1 节点加入流程

```
新节点 N                                    网络
   │                                         │
   │  1. mDNS 广播                           │
   │────────────────────────────────────────>│
   │                                         │
   │  2. 发现局域网节点（如果有）              │
   │<────────────────────────────────────────│
   │                                         │
   │  3. 连接 Bootstrap 节点（如果需要）       │
   │────────────────────────────────────────>│ Bootstrap Node
   │                                         │
   │  4. FIND_NODE(N.id)                     │
   │────────────────────────────────────────>│
   │                                         │
   │  5. 返回最近 k 个节点                    │
   │<────────────────────────────────────────│
   │                                         │
   │  6. 迭代查找，建立路由表                  │
   │  ════════════════════════════════════   │
   │  循环：向返回的节点发送 FIND_NODE         │
   │       直到找不到更近的节点                │
   │  ════════════════════════════════════   │
   │                                         │
   │  7. 向路由表中的节点建立连接              │
   │────────────────────────────────────────>│
   │                                         │
   │  8. 加入完成，开始服务                    │
   │  ✓                                       │
```

### 4.2 节点查找流程

```
请求者 A                 节点 B                 节点 C
   │                      │                      │
   │ FIND_NODE(X)         │                      │
   │─────────────────────>│                      │
   │                      │                      │
   │ 返回: [C, D, E]      │                      │
   │ (距离 X 更近)        │                      │
   │<─────────────────────│                      │
   │                      │                      │
   │ FIND_NODE(X)         │                      │
   │─────────────────────────────────────────────>│
   │                      │                      │
   │ 返回: [F, G]         │                      │
   │ (继续迭代)           │                      │
   │<─────────────────────────────────────────────│
   │                      │                      │
   │ ... 继续迭代 ...      │                      │
   │                      │                      │
   │ 找到 X 或最接近的节点  │                      │
   │ ✓                    │                      │
```

### 4.3 广播消息流程

```
源节点 S           邻居 A           邻居 B           邻居 C
   │                │                │                │
   │ BROADCAST(msg) │                │                │
   │ TTL=5          │                │                │
   │───────────────>│                │                │
   │───────────────>│                │                │
   │                │                │                │
   │                │ TTL=4          │                │
   │                │───────────────>│                │
   │                │───────────────>│                │
   │                │                │                │
   │                │                │ TTL=3          │
   │                │                │───────────────>│
   │                │                │                │
   │                │                │                │
   │                │  检查 msg.id   │                │
   │                │  已收到则忽略   │                │
   │                │  未收到则处理   │                │
   │                │                │                │
```

### 4.4 节点离开流程

```
离开节点 L               邻居节点们
   │                        │
   │ 1. 停止接受新连接       │
   │                        │
   │ 2. GOODBYE 通知        │
   │───────────────────────>│
   │                        │
   │ 3. 等待 pending 消息完成│
   │   (最多 5s)            │
   │                        │
   │ 4. 关闭所有连接         │
   │                        │
   │ 5. 邻居更新路由表       │
   │                        │  ✓
   │  ✓                     │
```

---

## 5. 轻量化考虑

### 5.1 内存优化

```yaml
目标: 单节点内存占用 < 10MB

优化措施:
  路由表:
    - 最多 64 个 bucket，每 bucket 8 节点
    - 单节点信息 ~100 bytes
    - 总计: 64 × 8 × 100 = 51.2 KB
  
  连接池:
    - 最多 32 个连接
    - 每连接缓冲区 4KB
    - 总计: 32 × 4KB = 128 KB
  
  消息缓存:
    - 最近 1000 条消息 ID (防重放)
    - 每条 32 bytes
    - 总计: 32 KB
  
  DHT 数据:
    - 本地存储最多 1000 条记录
    - 每条 ~1KB
    - 总计: 1 MB

预估总计: ~2 MB (预留缓冲)
```

### 5.2 CPU 优化

```yaml
优化策略:
  哈希计算:
    - 使用 BLAKE3 替代 SHA-256（更快）
    - 节点 ID 计算只做一次
  
  XOR 距离计算:
    - 使用 SIMD 指令（如果可用）
    - 内联汇编优化热点路径
  
  消息序列化:
    - 避免频繁分配/释放
    - 使用对象池复用缓冲区
    - JSON 解析用 simdjson（如果可用）
  
  定时任务:
    - 合并多个定时器
    - 最小定时精度 100ms（不需要更精确）
```

### 5.3 带宽优化

```yaml
目标: 空闲时带宽 < 1 KB/s

优化措施:
  心跳:
    - 30s 间隔，消息体 ~50 bytes
    - 16 邻居 × 50 bytes / 30s ≈ 27 bytes/s
  
  消息压缩:
    - MessagePack 替代 JSON（-40% 体积）
    - 大消息启用 gzip（>1KB 时）
  
  批量处理:
    - 多个 DHT 查询合并为一个请求
    - 广播消息去重
  
  增量同步:
    - 状态同步只发送 diff
    - 序列号机制避免全量传输
```

### 5.4 代码体积

```yaml
目标: 核心库 < 500 KB

策略:
  - 不依赖大型框架
  - 只实现必需功能
  - 可选功能通过 feature flag 裁剪

依赖最小化:
  必须:
    - JSON 序列化
    - WebSocket 客户端
    - 哈希函数
  
  可选:
    - mDNS 发现
    - QUIC 传输
    - MessagePack
    - TLS/加密
```

### 5.5 电池/资源友好

```yaml
移动设备考虑:
  后台模式:
    - 延长心跳间隔到 60s
    - 减少邻居数到 8 个
    - 暂停非必要的 DHT 维护
  
  网络切换:
    - 检测网络变化（WiFi ↔ 4G）
    - 自动重建连接
    - 状态恢复
  
  省电模式:
    - 降低发现频率
    - 减少广播范围
    - 代理消息到在线节点
```

---

## 6. 安全考虑

### 6.1 基础安全

```yaml
身份验证:
  - 节点 ID = Hash(公钥)
  - 消息签名（可选，高开销场景可禁用）
  
防攻击:
  - 速率限制：单 IP 每秒最多 10 条消息
  - TTL 限制：最大 5 跳
  - 消息去重：缓存最近 1000 条消息 ID
  
Sybil 攻击防护:
  - 工作量证明（可选）
  - 信任评分系统
  - 邻居多样性约束
```

### 6.2 隐私保护

```yaml
通信加密:
  - WebSocket over TLS (wss://)
  - 端到端加密（可选）
  
元数据保护:
  - 消息内容加密
  - 路由信息无法隐藏（P2P 特性）
```

---

## 7. 实现建议

### 7.1 推荐技术栈

```yaml
Rust (首选):
  优势: 内存安全、高性能、小体积
  库:
    - tokio: 异步运行时
    - rust-libp2p: 可参考但不用全部依赖
    - serde_json: JSON 序列化
    - blake3: 快速哈希

Go (备选):
  优势: 开发快、标准库完善
  库:
    - libp2p/go-libp2p
    - gorilla/websocket

Python (原型/边缘节点):
  优势: 快速开发
  库:
    - asyncio + websockets
    - 适合资源充足的节点
```

### 7.2 MVP 功能清单

```yaml
Phase 1 - 最小可用:
  - [x] WebSocket 连接
  - [x] JSON 消息格式
  - [x] mDNS 发现
  - [x] 基础路由表
  - [x] FIND_NODE 查找

Phase 2 - 完善:
  - [ ] 完整 Kademlia DHT
  - [ ] Bootstrap 支持
  - [ ] 消息广播
  - [ ] 心跳保活

Phase 3 - 优化:
  - [ ] MessagePack 支持
  - [ ] QUIC 传输
  - [ ] 安全特性
  - [ ] 性能优化
```

---

## 8. 总结

### 核心设计决策

| 决策点 | 选择 | 理由 |
|--------|------|------|
| 节点发现 | mDNS + DHT 混合 | 兼顾局域网速度和广域网覆盖 |
| 消息格式 | JSON（默认） | 调试友好，兼容性好 |
| 传输协议 | WebSocket 优先 | 防火墙友好，实现简单 |
| 网络拓扑 | 简化 Kademlia | 平衡查找效率和实现复杂度 |
| 最大邻居数 | 16 | 资源消耗可控，连通性足够 |

### 轻量化关键

1. **简化 DHT**：减少 bucket 数和节点数
2. **连接池**：限制最大连接数，空闲超时
3. **消息优化**：JSON 可切到 MessagePack
4. **按需发现**：不过度主动发现节点
5. **弹性调整**：根据资源动态调整参数

---

## 附录 A：消息类型完整定义

```yaml
# 所有消息的通用字段
base_message:
  v: uint8           # 协议版本
  id: string         # UUID v4
  t: uint64          # 时间戳 ms
  type: enum         # request | response | notify
  from: string       # 节点 ID
  ttl: uint8         # 跳数限制 (默认 5)

# 控制消息
ping:
  action: "ping"
  
pong:
  action: "pong"
  payload:
    latency: uint16  # ms

find_node:
  action: "find_node"
  payload:
    target: string   # 目标节点 ID

find_node_res:
  action: "find_node_res"
  payload:
    nodes:
      - id: string
        addr: string
        latency: uint16

# 应用消息
direct_msg:
  action: "direct_msg"
  to: string         # 目标节点 ID
  payload:
    content: any     # 应用层定义

broadcast:
  action: "broadcast"
  payload:
    topic: string    # 可选，主题过滤
    content: any

# 握手消息
hello:
  action: "hello"
  payload:
    node_id: string
    capabilities: string[]  # ["chat", "storage", ...]
    protocols: string[]     # ["ws", "quic", ...]
    
hello_ack:
  action: "hello_ack"
  payload:
    accepted: bool
    preferred_protocol: string
```

## 附录 B：配置参数表

```yaml
# 默认配置（可调整）
network:
  node_id_bits: 128          # 节点 ID 位数
  max_neighbors: 16          # 最大邻居数
  min_neighbors: 4           # 最小邻居数
  
dht:
  bucket_count: 64           # k-bucket 数量
  bucket_size: 8             # 每 bucket 节点数
  lookup_parallelism: 2      # 并行查找数
  refresh_interval: 30m      # 路由表刷新间隔

connection:
  max_connections: 32        # 最大连接数
  idle_timeout: 5m           # 空闲超时
  connect_timeout: 10s       # 连接超时
  heartbeat_interval: 30s    # 心跳间隔

message:
  max_size: 1MB              # 最大消息大小
  ttl_default: 5             # 默认跳数
  cache_size: 1000           # 去重缓存大小

discovery:
  mdns_enabled: true         # 启用 mDNS
  mdns_interval: 60s         # mDNS 广播间隔
  bootstrap_nodes: []        # Bootstrap 节点列表
```

---

**文档版本**: v1.0  
**创建日期**: 2026-02-25  
**适用场景**: AI Agent 自组织网络、边缘计算 P2P、物联网设备互联
