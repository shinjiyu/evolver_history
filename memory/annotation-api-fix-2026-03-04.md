# 批注 API 修复报告

**修复时间**: 2026-03-04 19:48
**任务 ID**: 038c00f1-9881-4878-9b0a-257cb623f216
**修复人员**: OpenClaw Agent

---

## 问题诊断

### 症状
用户反馈 `/api/annotations` 接口不通

### 根本原因
1. **服务未运行**: 批注服务进程不存在
2. **端口不匹配**: 服务器代码监听端口 3000，但 Nginx 代理到端口 3002

### 诊断过程
1. 检查 Nginx 配置 → 发现配置正确
2. 检查后端服务进程 → 未运行
3. 检查服务代码位置 → `/var/www/novel/abyss/api/server.js`
4. 检查端口配置 → 代码监听 3000，Nginx 代理到 3002

---

## 修复步骤

### 1. 修改服务端口
```bash
# 修改 server.js 监听端口为 3002
sed -i 's/PORT || 3000/PORT || 3002/' /var/www/novel/abyss/api/server.js
```

### 2. 启动服务
```bash
cd /var/www/novel/abyss/api
pm2 start server.js --name "abyss-annotation-api"
pm2 save
```

### 3. 验证修复
```bash
# 直接访问
curl http://127.0.0.1:3002/api/annotations
# ✅ 返回正常

# 通过 Nginx 访问
curl https://kuroneko.chat/api/annotations
# ✅ 返回正常

curl https://kuroneko.chat/abyss/api/annotations
# ✅ 返回正常
```

---

## 修复结果

### ✅ 成功
- 服务已启动并运行在端口 3002
- 两个 API 路径都正常工作
- PM2 已保存配置，确保开机自启

### 服务信息
- **服务名称**: `abyss-annotation-api`
- **PID**: 716388
- **端口**: 3002
- **状态**: online
- **内存**: 20.7 MB
- **管理**: PM2

---

## API 使用指南

### 可用端点

| 端点 | 方法 | 说明 | 认证 |
|------|------|------|------|
| `/api/annotations` | GET | 获取所有批注 | ❌ |
| `/api/annotations` | POST | 提交新批注 | ❌ |
| `/api/admin/annotations` | GET | 管理员获取所有批注 | ✅ |
| `/api/admin/annotations/:id` | PATCH | 更新批注状态 | ✅ |
| `/api/admin/annotations/:id` | DELETE | 删除批注 | ✅ |
| `/api/admin/stats` | GET | 获取统计信息 | ✅ |
| `/api/health` | GET | 健康检查 | ❌ |

### 两个访问路径

1. **通用路径**: `https://kuroneko.chat/api/annotations`
2. **小说专用路径**: `https://kuroneko.chat/abyss/api/annotations`

### 使用示例

**获取所有批注**:
```bash
curl https://kuroneko.chat/api/annotations
```

**提交新批注**:
```bash
curl -X POST https://kuroneko.chat/api/annotations \
  -H "Content-Type: application/json" \
  -d '{
    "chapter": 5,
    "paragraph_id": "p_5_280",
    "content": "这是一个测试批注",
    "type": "suggestion",
    "author": "测试读者"
  }'
```

**健康检查**:
```bash
curl https://kuroneko.chat/abyss/api/health
# 返回: {"success":true,"message":"深渊代行者批注系统运行正常","version":"1.0.0"}
```

**管理员操作** (需要 Token):
```bash
curl -X PATCH https://kuroneko.chat/api/admin/annotations/{id} \
  -H "Content-Type: application/json" \
  -H "X-Admin-Token: abyss_admin_2026" \
  -d '{"status": "accepted"}'
```

---

## 管理命令

### 查看服务状态
```bash
pm2 status abyss-annotation-api
```

### 查看日志
```bash
pm2 logs abyss-annotation-api
```

### 重启服务
```bash
pm2 restart abyss-annotation-api
```

### 停止服务
```bash
pm2 stop abyss-annotation-api
```

---

## 相关文件

| 文件 | 路径 |
|------|------|
| 服务代码 | `/var/www/novel/abyss/api/server.js` |
| 数据文件 | `/var/www/novel/abyss/api/data/annotations.json` |
| 统计文件 | `/var/www/novel/abyss/api/data/chapter_stats.json` |
| Nginx 配置 | `/etc/nginx/nginx.conf` |
| PM2 配置 | `/root/.pm2/dump.pm2` |

---

## 预防措施

1. ✅ **PM2 自动重启**: 服务异常退出时自动重启
2. ✅ **开机自启**: PM2 已保存配置
3. ✅ **健康检查端点**: `/abyss/api/health` 可用于监控
4. ⚠️ **建议**: 添加监控告警，当服务停止时发送通知

---

## 后续优化建议

1. **添加监控**: 使用 PM2 Plus 或自定义脚本监控服务状态
2. **日志轮转**: 配置 PM2 日志轮转，避免日志文件过大
3. **环境变量**: 将管理员 Token 移到环境变量中
4. **数据库**: 考虑将 JSON 文件迁移到 SQLite 或其他数据库
5. **速率限制**: 添加 API 速率限制，防止滥用

---

**修复完成时间**: 2026-03-04 19:50
**总耗时**: ~2 分钟
