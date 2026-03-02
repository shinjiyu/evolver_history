# 深渊代行者 API 令牌验证机制调查报告

**调查时间**：2026-02-26 19:16
**调查人员**：OpenClaw Agent
**问题来源**：用户反馈登录时接口调用失败

---

## 一、问题诊断

### 1.1 用户反馈
用户登录管理后台时，实际调用的接口是：
```
https://kuroneko.chat/abyss/api/admin/stats
```

### 1.2 根本原因
**Nginx 配置缺失**：没有 `/abyss/api/` 路径的代理配置，导致请求被转发到默认的 Nuxt.js 应用（端口 3001），返回 404 错误。

---

## 二、调查过程

### 2.1 服务端代码分析

**文件位置**：`/var/www/novel/abyss/api/server-v2.js`

**服务状态**：✅ 正在运行
- 进程：`node /var/www/novel/abyss/api/server-v2.js`
- 端口：3002
- PID：736767

### 2.2 令牌验证逻辑

**代码位置**：`server-v2.js` 第 26 行
```javascript
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'abyss_admin_2026';
```

**验证函数**：第 85-97 行
```javascript
function authenticateAdmin(req, res, next) {
    const token = req.headers['x-admin-token'] || req.body.admin_token;
    
    if (!token || token !== ADMIN_TOKEN) {
        return res.status(401).json({
            success: false,
            error: '未授权访问'
        });
    }
    
    next();
}
```

### 2.3 验证方式

**正确的验证方式**：
1. **方式一**：HTTP Header
   ```bash
   curl -H "X-Admin-Token: abyss_admin_2026" https://kuroneko.chat/abyss/api/admin/stats
   ```

2. **方式二**：Request Body（仅适用于 POST/PATCH）
   ```json
   {
     "admin_token": "abyss_admin_2026"
   }
   ```

**错误的验证方式**：
- ❌ `Authorization: Bearer abyss_admin_2026`（不支持）
- ❌ `?token=abyss_admin_2026`（不支持）

### 2.4 前端调用代码

**文件位置**：`/var/www/novel/abyss/admin.html` 第 429 行
```javascript
const API_BASE = '/abyss/api';
```

**登录验证代码**：第 439 行
```javascript
const response = await fetch(`${API_BASE}/admin/stats`, {
    headers: { 'X-Admin-Token': adminToken }
});
```

**结论**：前端代码正确，使用 `X-Admin-Token` Header 验证。

---

## 三、修复方案

### 3.1 Nginx 配置添加

**配置文件**：`/etc/nginx/nginx.conf`

**添加位置**：在 `error_page 404` 之前

**配置内容**：
```nginx
# ========== 深渊代行者批注系统 API ==========
location /abyss/api/ {
    proxy_pass http://127.0.0.1:3002/api/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # CORS
    add_header Access-Control-Allow-Origin * always;
    add_header Access-Control-Allow-Methods "GET, POST, PATCH, DELETE, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Content-Type, X-Admin-Token" always;
    
    if ($request_method = OPTIONS) {
        return 204;
    }
}

# 深渊代行者管理后台
location = /abyss/admin {
    return 301 /abyss/admin.html;
}

location /abyss/ {
    alias /var/www/novel/abyss/;
    index index.html;
    default_type text/html;
    location ~* \.(html|css|js|json)$ {
        expires 1h;
    }
}
# ========== End 深渊代行者 ==========
```

### 3.2 应用配置

**执行命令**：
```bash
# 1. 备份配置文件
cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.bak.20260226_1917

# 2. 测试配置
nginx -t

# 3. 重新加载
systemctl reload nginx
```

**执行结果**：✅ 成功

---

## 四、验证测试

### 4.1 API 接口测试

**测试命令**：
```bash
curl -H "X-Admin-Token: abyss_admin_2026" https://kuroneko.chat/abyss/api/admin/stats
```

**测试结果**：✅ 成功
```json
{
  "success": true,
  "data": {
    "total": 1,
    "pending": 0,
    "accepted": 1,
    "rejected": 0,
    "byType": {
      "suggestion": 1
    },
    "byChapter": {
      "5": {
        "total": 1,
        "pending": 0,
        "accepted": 1,
        "rejected": 0
      }
    }
  }
}
```

### 4.2 管理后台测试

**测试命令**：
```bash
curl -I https://kuroneko.chat/abyss/admin.html
```

**测试结果**：✅ 成功
```
HTTP/1.1 200 OK
Content-Type: text/html
Content-Length: 23211
```

### 4.3 完整流程测试

1. ✅ 访问 `https://kuroneko.chat/abyss/admin.html`
2. ✅ 输入令牌：`abyss_admin_2026`
3. ✅ 点击"登录"
4. ✅ 前端调用 `GET /abyss/api/admin/stats`
5. ✅ Nginx 代理到 `http://127.0.0.1:3002/api/admin/stats`
6. ✅ 服务器验证 `X-Admin-Token` Header
7. ✅ 返回统计数据
8. ✅ 前端显示管理界面

---

## 五、接口文档

### 5.1 认证方式

**所有管理接口都需要认证**

**认证方式**：在 HTTP Header 中添加 `X-Admin-Token`

**令牌值**：`abyss_admin_2026`

### 5.2 可用接口

| 接口 | 方法 | 功能 | 认证 |
|------|------|------|------|
| `/abyss/api/admin/stats` | GET | 获取统计数据 | ✅ |
| `/abyss/api/admin/annotations` | GET | 获取批注列表 | ✅ |
| `/abyss/api/admin/annotations/:id` | PATCH | 更新批注状态 | ✅ |
| `/abyss/api/admin/annotations/:id` | DELETE | 删除批注 | ✅ |
| `/abyss/api/annotations` | GET | 获取公开批注 | ❌ |
| `/abyss/api/annotations` | POST | 创建新批注 | ❌ |

### 5.3 示例请求

**获取统计数据**：
```bash
curl -H "X-Admin-Token: abyss_admin_2026" \
  https://kuroneko.chat/abyss/api/admin/stats
```

**获取批注列表**：
```bash
curl -H "X-Admin-Token: abyss_admin_2026" \
  https://kuroneko.chat/abyss/api/admin/annotations?status=pending
```

**采纳批注**：
```bash
curl -X PATCH \
  -H "X-Admin-Token: abyss_admin_2026" \
  -H "Content-Type: application/json" \
  -d '{"status":"accepted"}' \
  https://kuroneko.chat/abyss/api/admin/annotations/ann_20260226_abc123
```

---

## 六、安全建议

### 6.1 当前配置

- ✅ 使用 HTTPS 加密传输
- ✅ 令牌验证在服务端进行
- ✅ CORS 配置允许跨域

### 6.2 改进建议

1. **令牌强度**
   - 当前令牌：`abyss_admin_2026`（16 字符）
   - 建议使用更强的随机令牌（32+ 字符）
   - 示例：`openssl rand -hex 32`

2. **环境变量**
   - 当前：硬编码在代码中作为默认值
   - 建议：使用环境变量 `ADMIN_TOKEN`
   - 配置：`export ADMIN_TOKEN=$(openssl rand -hex 32)`

3. **访问控制**
   - 当前：任何知道令牌的人都可以访问
   - 建议：
     - 添加 IP 白名单
     - 添加速率限制
     - 记录访问日志

4. **令牌轮换**
   - 建议：定期更换令牌（每月/每季度）
   - 流程：
     1. 生成新令牌
     2. 更新环境变量
     3. 重启服务
     4. 通知管理员

---

## 七、总结

### 7.1 问题
- **原因**：Nginx 配置缺失 `/abyss/api/` 代理
- **影响**：外部无法访问管理 API

### 7.2 解决方案
- **措施**：添加 Nginx 代理配置
- **结果**：✅ 问题已解决

### 7.3 令牌信息
- **令牌值**：`abyss_admin_2026`
- **验证方式**：`X-Admin-Token` Header
- **存储位置**：环境变量 `ADMIN_TOKEN` 或代码默认值

### 7.4 访问地址
- **管理后台**：https://kuroneko.chat/abyss/admin.html
- **API 基础路径**：`https://kuroneko.chat/abyss/api/`
- **统计接口**：`https://kuroneko.chat/abyss/api/admin/stats`

---

**报告完成时间**：2026-02-26 19:19
**状态**：✅ 问题已解决，系统正常运行
