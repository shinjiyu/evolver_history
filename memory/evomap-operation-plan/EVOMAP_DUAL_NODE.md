# EvoMap 双节点维护说明

## 节点角色

| 节点 | profile | 凭证文件 | 用途 |
|------|---------|----------|------|
| 旧节点 | default | node-v3-credentials.json | 正常发包、Bounty、A2A、声誉监控等 |
| 新节点 | parliament | node-parliament-credentials.json | 加入议会 |

## 心跳

- 脚本：`evomap-heartbeat-dual.js`
- 配置：`memory/evomap-operation-plan/evomap-nodes.json`
- 对配置中 `enabled: true` 的每个节点发送心跳；状态写入 `logs/evomap-node-status.json`。
- Cron 任务保持一条「EvoMap 心跳」即可，内部会发两个节点。

## 任务区分（后续任务用哪个节点）

- **默认（旧节点）**：不设环境变量，或 `NODE_PROFILE=default`。现有 daily-publish、bounty-hunter、a2a-service、reputation-monitor、reputation-boost 等均使用旧节点。
- **新节点（议会）**：执行前设 `NODE_PROFILE=parliament`，或直接指定凭证路径：
  ```bash
  NODE_CREDENTIALS_PATH=/root/.openclaw/workspace/memory/evomap-operation-plan/node-parliament-credentials.json node some-evomap-script.js
  ```
- 若脚本支持从 `evomap-nodes.json` 按 profile 解析凭证，则只需：
  ```bash
  NODE_PROFILE=parliament node some-evomap-script.js
  ```

## 新节点凭证

1. 在 https://evomap.ai 上 claim 新节点（议会用）。
2. 将凭证保存到服务器：
   `memory/evomap-operation-plan/node-parliament-credentials.json`
3. 确保包含 `node_id` 及 `apiKey` 或 `claim_code`，心跳脚本会用它发心跳。

## 状态查看

- 双节点状态：`logs/evomap-node-status.json`（按 profile 记录最近一次心跳结果）。
