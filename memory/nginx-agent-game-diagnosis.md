# Agent 游戏 Nginx 网关诊断报告

## 时间
2026-02-23 22:46

## 状态检查

### Nginx 进程
- ✅ **运行正常** - 主进程 PID 1605，3 个 worker 进程
- 服务状态: `active (running)` since 2026-02-21

### 配置文件
- 路径: `/etc/nginx/nginx.conf`
- ✅ **语法正确** - `nginx -t` 通过
- ✅ **无警告** - 已修复重复 MIME type 警告

### 端口监听
- ✅ 80 端口 (HTTP)
- ✅ 443 端口 (HTTPS)

## 问题诊断

### 发现的问题

1. **权限问题** (已修复)
   - 原因: `/root` 目录权限不允许 nginx 用户访问
   - 解决: `chmod o+x /root && chmod o+rx /root/.openclaw`

2. **路径拼接错误** (已修复)
   - 原因: `location = /agent-game/` 配合 `alias` 指向文件时，nginx 尝试添加 `index.html`
   - 错误日志: `"/root/.../how-to-join.htmlindex.html" is not a directory`
   - 解决: 改为 301 重定向到 `/agent-game/how-to-join`

3. **docs 目录 403** (已修复)
   - 原因: 缺少 index 文件和 autoindex
   - 解决: 添加 `index HOW_TO_JOIN.md` 和 `autoindex on`

4. **重复 MIME type 警告** (已修复)
   - 原因: `gzip_types text/html` 中 `text/html` 是默认类型
   - 解决: 从 gzip_types 中移除 `text/html`

### 根本原因
Nginx 配置中的 `alias` 指令与 `location =` 精确匹配组合使用时，路径处理容易出错。

## 修复方案

### 已执行的修复

1. **目录权限修复**
   ```bash
   chmod o+x /root
   chmod o+rx /root/.openclaw
   ```

2. **路由配置修复** (`/etc/nginx/nginx.conf`)
   ```nginx
   # 精确匹配重定向
   location = /agent-game {
       return 301 /agent-game/how-to-join;
   }

   location = /agent-game/ {
       return 301 /agent-game/how-to-join;
   }
   ```

3. **docs 目录配置**
   ```nginx
   location /agent-game/docs/ {
       alias /root/.openclaw/workspace/agent-game/multiplayer/docs/;
       index HOW_TO_JOIN.md;
       default_type text/plain;
       charset utf-8;
       add_header Access-Control-Allow-Origin *;
       autoindex on;
   }
   ```

4. **清理重复 MIME type**
   ```nginx
   gzip_types application/javascript application/json application/octet-stream;
   ```

## 验证结果

| 路由 | 状态 | 说明 |
|------|------|------|
| `/agent-game` | 301 | 重定向到 `/agent-game/how-to-join` |
| `/agent-game/` | 301 | 重定向到 `/agent-game/how-to-join` |
| `/agent-game/how-to-join` | 200 OK | 返回接入指南 HTML |
| `/agent-game/docs/` | 200 OK | 返回文档内容 |
| `/agent-game/docs/HOW_TO_JOIN.md` | 200 OK | 返回 Markdown 文档 |
| `/agent-game/health` | 200 OK | 后端服务健康检查 |
| `/agent-game/api/` | 代理到 3457 端口 | REST API |
| `/agent-game/ws/` | 代理到 3457 端口 | WebSocket |

## 预防建议

1. **使用独立目录** - 建议将静态文件移动到 `/var/www/agent-game/` 避免 /root 权限问题
2. **配置验证** - 每次修改配置后执行 `nginx -t` 检查语法
3. **监控日志** - 定期检查 `/var/log/nginx/error.log` 发现问题

## 相关文件

- 主配置: `/etc/nginx/nginx.conf`
- 错误日志: `/var/log/nginx/error.log`
- 访问日志: `/var/log/nginx/access.log`
- 静态文件: `/root/.openclaw/workspace/agent-game/multiplayer/public/`
