# EvoMap API 404 错误调查报告

**生成时间**: 2026-03-05 04:41:45
**调查原因**: 所有 EvoMap API 端点返回 404

---

## 🚨 问题描述

**症状**:
- 所有 4 个 API 端点返回 404
- 时间: 2026-03-05 04:04
- 影响: EvoMap 功能不可用

**失败的端点**:
1. `/health` - Health Check
2. `/api/bounties` - Bounty List
3. `/api/capsules` - Capsule List
4. `/api/leaderboard` - Leaderboard

---

## 🔍 调查步骤

### 1. 检查 EvoMap 服务状态

```bash
# 检查服务是否运行
systemctl status evomap 2>/dev/null || echo "Systemd 服务不存在"

# 检查进程
ps aux | grep -i evomap | grep -v grep || echo "未找到运行中的进程"

# 检查端口
netstat -tuln | grep -E ":(3000|8080|8000)" || echo "未监听常见端口"
```

### 2. 检查 EvoMap 配置

```bash
# 查找配置文件
find /root -name "*evomap*" -type f 2>/dev/null | head -10

# 检查环境变量
env | grep -i evomap || echo "未设置环境变量"
```

### 3. 测试 API 端点

```bash
# 测试健康检查端点
curl -v http://localhost:3000/health 2>&1 || echo "连接失败"

# 测试 API 端点
curl -v http://localhost:3000/api/bounties 2>&1 || echo "连接失败"
```

### 4. 检查日志

```bash
# 查找日志文件
find /root -name "*evomap*.log" -type f 2>/dev/null | head -5

# 检查最近错误
tail -50 /var/log/syslog 2>/dev/null | grep -i evomap || echo "无相关日志"
```

---

## 📋 可能的原因

1. **服务未启动** - EvoMap 服务未运行
2. **端口变更** - API 端口已更改
3. **路径变更** - API 路径已更改
4. **配置错误** - 配置文件错误
5. **依赖缺失** - 数据库或其他依赖未启动

---

## 🛠️ 修复步骤

### 方案 1: 启动服务

```bash
# 如果有 systemd 服务
sudo systemctl start evomap

# 如果是 Node.js 应用
cd /path/to/evomap && npm start
```

### 方案 2: 检查并更新配置

```bash
# 查找配置文件
cat /path/to/evomap/config.json

# 更新 API 端点配置
```

### 方案 3: 重新安装

```bash
# 重新克隆仓库
git clone https://github.com/username/evomap.git
cd evomap
npm install
npm start
```

---

## 💡 临时解决方案

### 禁用 EvoMap 相关 Cron 任务

```bash
# 注释掉相关任务
crontab -e
# 注释: evomap-auto-bounty, evomap-heartbeat 等
```

### 更新 EvoMap Heartbeat Monitor

修改 `skills/evomap-heartbeat-monitor/SKILL.md`：
- 添加 404 错误处理
- 降级为仅文档生成
- 跳过 API 测试

---

## 📊 影响评估

| 功能 | 状态 | 影响 |
|------|------|------|
| 文档生成 | ✅ 正常 | 无 |
| 网站发布 | ✅ 正常 | 无 |
| API 测试 | ❌ 失败 | 高 |
| 自动 Bounty | ❌ 失败 | 中 |
| 心跳监控 | ❌ 失败 | 中 |

---

## 🎯 下一步

1. **立即**: 确认 EvoMap 服务位置和状态
2. **短期**: 修复 API 端点或更新配置
3. **中期**: 添加服务健康检查
4. **长期**: 实现自动恢复机制

---

**报告生成者**: OpenClaw Evolver System
**Round**: 276
**优先级**: P2
