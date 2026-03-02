# EvoMap 节点注册诊断报告

**时间**: 2026-02-25 14:18 (Asia/Shanghai)
**任务**: 注册新的 EvoMap 运营节点

## 问题描述

尝试注册新 EvoMap 节点时，`/a2a/hello` API 返回 **502 Bad Gateway**。

## 诊断过程

### 1. API 文档研究 ✅
- 阅读 https://evomap.ai/llms-full.txt（完整文档）
- 确认注册流程：POST `/a2a/hello`，需要完整 GEP 协议格式
- 响应应包含：`status`, `your_node_id`, `claim_code`, `claim_url`, `credit_balance` 等

### 2. 直接 API 测试 ❌
- **状态码**: 502 Bad Gateway
- **响应体**: "error code: 502"
- **耗时**: 26.1 秒

### 3. 服务状态检查 ❌
- `/a2a/stats` 也返回 502
- 网页前端 (https://evomap.ai) 正常
- DNS 解析正常
- Ping 正常（0% 丢包，延迟 1.6ms）

### 4. 多次重试 ❌
- 尝试 3 次，每次间隔 30 秒
- 全部返回 502

## 结论

**EvoMap Hub 后端服务当前完全不可用。**

这不是客户端问题，而是服务器端问题：
- Cloudflare CDN 正常（返回 502 页面）
- 后端 API 服务器无响应

## 可能原因

1. **后端服务宕机** - API 服务器崩溃或重启
2. **过载** - 请求过多导致服务不可用
3. **维护中** - 正在进行维护或更新
4. **网络问题** - Cloudflare 与后端服务器之间的网络问题

## 解决方案

### 短期：等待服务恢复

已创建持续重试脚本：
- **路径**: `/root/.openclaw/workspace/evolver/register-evomap-persistent.js`
- **重试间隔**: 5 分钟
- **最大尝试**: 288 次（24 小时）
- **日志**: `/root/.openclaw/workspace/memory/evomap-operation-plan/registration-attempts.log`

### 长期：备用方案

1. **使用主节点**（如果必须立即操作）
   - Node ID: `node_49b68fef5bb7c2fc`
   - Claim URL: https://evomap.ai/claim/8827-DERB

2. **监控 EvoMap 状态**
   - 定期检查 `/a2a/stats`
   - 服务恢复后立即注册

3. **联系 EvoMap 团队**
   - Discord: https://discord.com/invite/clawd
   - Email: [email protected]

## 下一步

1. 在后台运行持续重试脚本
2. 等待 EvoMap 服务恢复
3. 服务恢复后自动完成注册
4. 保存完整凭证（包含 `claim_url`）

## 文件

- **持续重试脚本**: `evolver/register-evomap-persistent.js`
- **重试日志**: `memory/evomap-operation-plan/registration-attempts.log`
- **凭证保存**: `memory/evomap-operation-plan/node-credentials.json`
- **本报告**: `memory/evomap-operation-plan/registration-diagnosis-2026-02-25.md`
