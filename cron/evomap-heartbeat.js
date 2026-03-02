#!/usr/bin/env node
/**
 * EvoMap 双节点心跳
 *
 * 从 evomap-nodes.json 读取节点列表，对每个 enabled 节点发送心跳。
 * 旧节点(default)：正常发包等；新节点(parliament)：议会用。
 * 任务脚本可通过 NODE_PROFILE=default|parliament 或 NODE_CREDENTIALS_PATH 区分节点。
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const PLAN_DIR = path.join(__dirname, '../memory/evomap-operation-plan');
const NODES_CONFIG_PATH = path.join(PLAN_DIR, 'evomap-nodes.json');
const LOG_DIR = path.join(__dirname, '../logs');
const STATUS_FILE = path.join(LOG_DIR, 'evomap-node-status.json');
const HEARTBEAT_URL = 'https://evomap.ai/a2a/heartbeat';

if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  const logPath = path.join(LOG_DIR, 'evomap-heartbeat.log');
  fs.appendFileSync(logPath, line + '\n');
}

function loadNodesConfig() {
  if (!fs.existsSync(NODES_CONFIG_PATH)) {
    log('⚠️ 未找到 evomap-nodes.json，使用默认单节点 node-v3-credentials.json');
    return {
      nodes: [{ profile: 'default', credentialsPath: 'node-v3-credentials.json', enabled: true }]
    };
  }
  return JSON.parse(fs.readFileSync(NODES_CONFIG_PATH, 'utf8'));
}

function loadCredentials(credentialsPath) {
  const abs = path.isAbsolute(credentialsPath)
    ? credentialsPath
    : path.join(PLAN_DIR, credentialsPath);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8'));
}

function sendHeartbeat(nodeId, authToken) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      protocol: 'gep-a2a',
      version: '1.0.0',
      node_id: nodeId,
      timestamp: new Date().toISOString()
    });
    const url = new URL(HEARTBEAT_URL);
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    };
    if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

    const req = https.request(
      {
        hostname: url.hostname,
        port: 443,
        path: url.pathname,
        method: 'POST',
        headers
      },
      (res) => {
        let data = '';
        res.on('data', (ch) => (data += ch));
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch {
            reject(new Error(data || res.statusCode));
          }
        });
      }
    );
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function main() {
  const config = loadNodesConfig();
  const nodes = config.nodes || [];
  const results = { timestamp: new Date().toISOString(), nodes: {} };

  log('='.repeat(60));
  log('EvoMap 双节点心跳');

  for (const n of nodes) {
    if (n.enabled === false) {
      log(`  [${n.profile}] 已禁用，跳过`);
      continue;
    }
    const creds = loadCredentials(n.credentialsPath);
    if (!creds) {
      log(`  [${n.profile}] 凭证不存在: ${n.credentialsPath}，跳过`);
      results.nodes[n.profile] = { error: 'credentials_missing', path: n.credentialsPath };
      continue;
    }
    const nodeId = creds.node_id || creds.sender_id;
    if (!nodeId) {
      log(`  [${n.profile}] 凭证缺少 node_id，跳过`);
      results.nodes[n.profile] = { error: 'no_node_id' };
      continue;
    }
    const token = creds.apiKey || creds.api_key || creds.claim_code;
    try {
      const response = await sendHeartbeat(nodeId, token);
      const ok = response.status === 'ok';
      log(`  [${n.profile}] ${nodeId} ${ok ? '✅' : '❌'} ${ok ? response.node_status || '' : JSON.stringify(response)}`);
      results.nodes[n.profile] = {
        node_id: nodeId,
        status: response.status,
        node_status: response.node_status,
        survival_status: response.survival_status,
        credit_balance: response.credit_balance,
        available_work: response.available_work ? response.available_work.length : 0
      };
    } catch (err) {
      log(`  [${n.profile}] ${nodeId} ❌ ${err.message}`);
      results.nodes[n.profile] = { node_id: nodeId, error: err.message };
    }
  }

  fs.writeFileSync(STATUS_FILE, JSON.stringify(results, null, 2));
  log(`状态已写入 ${STATUS_FILE}`);
  log('='.repeat(60));
}

main().catch((e) => {
  log('💥 ' + e.message);
  process.exit(1);
});
