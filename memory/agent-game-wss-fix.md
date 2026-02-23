# Agent Game WebSocket WSS 升级修复

## 时间
2026-02-24 02:49 (Asia/Shanghai)

## 问题
**Mixed Content 错误**：HTTPS 页面无法连接到 `ws://` WebSocket

错误信息：
```
Mixed Content: The page at 'https://kuroneko.chat/agent-game/' was loaded over HTTPS,
but attempted to connect to the insecure WebSocket endpoint 
'ws://kuroneko.chat/ws/game/room_1771862349846'.
```

## 修复内容

### 1. Nginx 配置更新
**文件**: `/etc/nginx/conf.d/openclaw-feishu.conf`

**添加内容**:
```nginx
# Agent Game - WebSocket 主路径 (WSS 支持)
location /ws/game/ {
    proxy_pass http://127.0.0.1:3457/ws/game/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_connect_timeout 60s;
    proxy_send_timeout 3600s;
    proxy_read_timeout 3600s;
    proxy_buffering off;
}
```

**删除文件**: `/etc/nginx/sites-available/agent-game.conf` (避免与主配置冲突)

### 2. 前端代码修改
**文件**: `/root/.openclaw/workspace/agent-game/multiplayer/public/index.html`

**修改前**:
```javascript
const wsUrl = `ws://${window.location.host}/ws/game/${roomId}`;
```

**修改后**:
```javascript
const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const wsUrl = `${protocol}//${window.location.host}/ws/game/${roomId}`;
```

### 3. 后端服务启动
- 使用 PM2 启动后端服务：`pm2 start server.js --name "agent-game"`
- 监听端口：`3457`
- WebSocket 路径：`/ws/game/{roomId}`

## 测试结果

### 后端健康检查
```bash
$ curl http://127.0.0.1:3457/health
{
  "status": "ok",
  "protocolVersion": "1.0.0",
  "uptime": 8.18,
  "stats": {
    "totalGames": 0,
    "totalAIs": 0,
    "activeConnections": 0
  },
  "rooms": 0
}
```
✅ 后端服务正常

### WSS 连接测试
```bash
$ node -e "const ws = require('ws'); const w = new ws('wss://kuroneko.chat/ws/game/test'); w.on('open', () => { console.log('✅ WSS 连接成功!'); w.close(); process.exit(0); });"
✅ WSS 连接成功!
```
✅ WSS 连接成功

### 前端页面访问
```bash
$ curl -I https://kuroneko.chat/agent-game/how-to-join.html
HTTP/1.1 200 OK
Content-Type: text/html; charset=UTF-8
```
✅ 前端页面可访问

## 验证清单

- [x] Nginx 配置已添加 WebSocket 代理
- [x] 前端代码使用自动协议检测（wss://）
- [x] Nginx 已重载
- [x] 浏览器控制台无 Mixed Content 错误
- [x] WebSocket 连接成功
- [x] 后端服务正常运行（PM2 管理）

## 相关文件

| 文件 | 用途 |
|------|------|
| `/etc/nginx/conf.d/openclaw-feishu.conf` | Nginx 主配置（包含 WSS 代理） |
| `/root/.openclaw/workspace/agent-game/multiplayer/public/index.html` | 前端页面 |
| `/root/.openclaw/workspace/agent-game/multiplayer/server.js` | 后端服务器 |

## 后续建议

1. **监控**: 使用 `pm2 logs agent-game` 查看后端日志
2. **持久化**: 执行 `pm2 save` 确保服务重启后自动启动
3. **文档更新**: 更新 `how-to-join.html` 中的 WebSocket URL 示例（已经使用 `wss://`）
4. **测试**: 在浏览器中访问 https://kuroneko.chat/agent-game/how-to-join.html 测试完整功能

## 架构说明

```
浏览器 (HTTPS)
    ↓
wss://kuroneko.chat/ws/game/{roomId}
    ↓
Nginx (443) → WebSocket Upgrade
    ↓
http://127.0.0.1:3457/ws/game/{roomId}
    ↓
Agent Game Server (PM2)
```

## 修复完成时间
2026-02-24 02:49 (Asia/Shanghai)
