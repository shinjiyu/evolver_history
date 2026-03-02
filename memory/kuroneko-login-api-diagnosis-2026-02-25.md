# Kuroneko.chat 登录 API 500 错误诊断报告

**诊断时间**: 2026-02-25 16:34
**问题状态**: ✅ **已修复**
**修复时间**: 2026-02-25 16:35
**影响范围**: 用户无法登录 kuroneko.chat（已恢复）

---

## 一、问题现象

| 检测项 | 结果 |
|--------|------|
| 网站访问 | ✅ 正常 (HTTP 200) |
| 登录页面 | ✅ 正常渲染 |
| 登录 API (`/api/auth/login`) | ❌ **500 错误** |
| CORS 配置 | ⚠️ 有限制 |

---

## 二、诊断过程

### 2.1 API 端点测试

```bash
# 测试 /api/auth/login (正确的端点)
curl -X POST https://kuroneko.chat/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'
```

**结果**: 500 内部服务器错误

### 2.2 后端日志分析

```
pymongo.errors.ServerSelectionTimeoutError: 
43.156.244.45:27017: [Errno 111] Connection refused
```

**关键发现**: MongoDB 连接失败！

### 2.3 MongoDB 状态检查

```bash
docker ps -a | grep mongo
```

| 容器名 | 状态 | 端口映射 |
|--------|------|----------|
| `mongodb` | ❌ **Exited (255)** | 27017→27017 |
| `mongodb-trading` | ✅ Up | **27018**→27017 |

### 2.4 后端配置检查

```env
# login-backend 环境变量
MONGODB_URI=mongodb://admin:252625@43.156.244.45:27017/admin?authSource=admin
```

**问题**: 后端连接到外部 IP `43.156.244.45:27017`，但该端口不可达。

---

## 三、问题根因

### 🔴 根因：MongoDB 连接失败

1. **配置的 MongoDB 地址**: `43.156.244.45:27017` (外部 IP)
2. **实际状态**: 
   - 该外部服务不可用或端口被阻止
   - 本地有运行中的 MongoDB，但在端口 **27018**
3. **结果**: 登录请求尝试连接数据库，超时后返回 500 错误

### 次要问题：CORS 配置

```
Access-Control-Allow-Origin: http://127.0.0.1:3000
```

CORS 只允许本地开发地址，可能影响前端跨域请求。

---

## 四、修复方案

### 方案 A：启动本地 MongoDB 容器（推荐）

```bash
# 1. 启动已停止的 mongodb 容器
docker start mongodb

# 2. 验证容器状态
docker ps | grep mongodb

# 3. 测试登录
curl -X POST https://kuroneko.chat/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'
```

### 方案 B：修改后端连接到本地 MongoDB

```bash
# 1. 进入容器
docker exec -it login-backend bash

# 2. 修改环境变量（如果支持热更新）
# 或重新部署容器，更新 MONGODB_URI 为：
# mongodb://admin:252625@host.docker.internal:27018/admin
```

### 方案 C：修复外部 MongoDB 连接

如果外部 MongoDB 服务应该可用，需要检查：
1. 远程服务器的 MongoDB 服务状态
2. 防火墙规则是否开放 27017 端口
3. MongoDB 配置是否允许远程连接

---

## 五、推荐操作

### 立即修复（最快）

```bash
# 启动本地 MongoDB 容器
docker start mongodb

# 等待 10 秒让服务启动
sleep 10

# 验证服务
docker logs mongodb --tail 5
```

### 长期方案

1. **统一数据库配置**: 将所有服务连接到同一个 MongoDB 实例
2. **使用 Docker 网络**: 避免使用外部 IP，改用容器名
3. **添加健康检查**: 确保 MongoDB 可用后再启动后端

---

## 六、验证步骤

修复后执行以下验证：

```bash
# 1. 检查 MongoDB 容器状态
docker ps | grep mongodb

# 2. 测试 MongoDB 连接
docker exec mongodb mongosh --eval "db.stats()"

# 3. 测试登录 API
curl -X POST https://kuroneko.chat/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'

# 4. 检查后端日志
docker logs login-backend --tail 20
```

---

## 七、系统架构图

```
┌─────────────────────────────────────────────────────────┐
│                    kuroneko.chat                         │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐     ┌──────────────┐                  │
│  │   Nginx      │────▶│  Nuxt.js     │                  │
│  │  (443/80)    │     │  (前端)       │                  │
│  └──────┬───────┘     └──────────────┘                  │
│         │                                                │
│         │ /api/auth/*                                    │
│         ▼                                                │
│  ┌──────────────┐     ┌──────────────┐                  │
│  │ login-backend│────▶│   MongoDB    │                  │
│  │  (5001)      │     │  (27017) ❌   │                  │
│  │  Python      │     │  已停止       │                  │
│  └──────────────┘     └──────────────┘                  │
│                              │                           │
│                              ▼                           │
│                       ┌──────────────┐                   │
│                       │ mongodb-     │                   │
│                       │ trading      │                   │
│                       │ (27018) ✅    │                   │
│                       └──────────────┘                   │
└─────────────────────────────────────────────────────────┘
```

---

## 八、总结

| 项目 | 状态 |
|------|------|
| 问题定位 | ✅ 完成 |
| 根因确认 | ✅ MongoDB 容器停止 |
| 修复方案 | ✅ 已提供 |
| 预计修复时间 | **< 1 分钟** |

**下一步**: ~~执行 `docker start mongodb` 启动数据库容器~~ ✅ **已完成**

---

## 九、修复结果

### 修复操作
```bash
docker start mongodb
```

### 验证结果

```bash
# 登录 API 测试
curl -X POST https://kuroneko.chat/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'
```

**响应**:
```json
{
  "message": "邮箱或密码错误",
  "success": false
}
HTTP_CODE: 401
```

### 结论

| 项目 | 修复前 | 修复后 |
|------|--------|--------|
| HTTP 状态码 | 500 | 401 ✅ |
| 响应内容 | 内部错误 | 业务错误（正常） |
| MongoDB 连接 | ❌ 失败 | ✅ 成功 |

**问题已完全解决！** 401 响应表示登录 API 正常工作，只是测试用户不存在或密码错误。
