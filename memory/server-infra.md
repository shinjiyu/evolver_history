# 服务器基础设施记录

> 记录时间：2026-02-15 (更新)
> 服务器：VM-0-14-tencentos

## 端口分配表

| 端口 | 服务 | 类型 | 说明 |
|------|------|------|------|
| 22 | sshd | 系统 | SSH |
| 80 | nginx | 系统 | HTTP 入口 |
| 443 | nginx | 系统 | HTTPS 入口 |
| 3000 | english-helper-backend | Docker | 英语助手后端 |
| 3001 | login-frontend | Docker | 登录前端 (Node.js) |
| 3003 | remote-console-server | Docker | 远程控制台服务端 |
| 3010 | c6-v2-api | Docker | C6 V2 API |
| 5001 | login-backend | Docker | 登录后端 (Python) |
| 8080 | english-helper-review | Docker | 英语助手复习 (nginx:alpine) |
| 8082 | remote-console-web | Docker | 远程控制台前端 |
| 18789 | openclaw-gateway | 系统 | OpenClaw Gateway (127.0.0.1) |
| 18792 | openclaw-gateway | 系统 | OpenClaw Gateway 内部端口 |
| 27017 | mongodb | Docker | MongoDB 主实例 |
| 27018 | mongodb-trading | Docker | MongoDB 交易实例 |

## Docker 容器列表

### 运行中 (8个)

| 容器名 | 镜像 | 端口映射 | 状态 |
|--------|------|----------|------|
| c6-v2-api | c6-v2-api:latest | 3010->3000 | ✅ Up |
| remote-console-web | remote-console-web-console | 8082->8080 | ✅ healthy |
| remote-console-server | remote-console-server | 3003->3000 | ✅ healthy |
| english-helper-backend | english_helper-backend | 3000->3000 | ✅ healthy |
| english-helper-review | nginx:alpine | 8080->80 | ✅ Up |
| login-frontend | node:18-alpine | 3001->3000 | ✅ Up |
| login-backend | python:3.12-slim | 5001->5001 | ✅ healthy |
| mongodb-trading | mongo:latest | 27018->27017 | ✅ Up |
| mongodb | mongo:latest | 27017->27017 | ✅ Up |

### 已删除 (2026-02-15)
- ~~boss-index-h5~~ - 已删除
- ~~trace_backend~~ - 已删除
- ~~trace_dashboard~~ - 已删除
- ~~kafka~~ - 已删除
- ~~zookeeper~~ - 已删除
- ~~my-mysql~~ - 已删除

## 系统服务

- **nginx** - Web 服务器/反向代理
- **docker** - 容器运行时 (开机自启)
- **containerd** - 容器运行时
- **openclaw-gateway** - OpenClaw 网关
- **chronyd** - NTP 时间同步
- **NetworkManager** - 网络管理

## 自动恢复配置

- Docker 服务：`systemctl enabled`
- 所有容器：`restart: always`
- 无需额外脚本

## 部署新服务可用端口

推荐使用：
- **3002-3009** ✅ (已释放)
- **4000-4999** ✅
- **5002-7999** ✅
- **8081, 8083-8999** ✅ (8081 已释放)
- **2181** ✅ (已释放)
- **3306** ✅ (已释放)
- **52389** ✅ (已释放)
