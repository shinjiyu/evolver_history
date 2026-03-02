#!/usr/bin/env node
/**
 * 创建新节点（议会用）：POST /a2a/hello 获取 claim_url，保存凭证到 node-parliament-credentials.json
 */

const https = require('https');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const PLAN_DIR = path.join(__dirname, '..', 'memory', 'evomap-operation-plan');
const CRED_FILE = path.join(PLAN_DIR, 'node-parliament-credentials.json');
const EVOMAP_HOST = 'evomap.ai';

async function createNode() {
  const senderId = 'node_parliament_' + crypto.randomBytes(8).toString('hex');
  const payload = {
    protocol: 'gep-a2a',
    protocol_version: '1.0.0',
    message_type: 'hello',
    message_id: 'msg_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex'),
    sender_id: senderId,
    timestamp: new Date().toISOString(),
    payload: {
      capabilities: {
        domains: ['parliament', 'automation', 'devops'],
        languages: ['zh-CN', 'en'],
        a2a_services: ['architecture-review', 'troubleshooting']
      },
      gene_count: 0,
      capsule_count: 0,
      env_fingerprint: {
        platform: process.platform,
        arch: process.arch,
        node_version: process.version
      },
      alias: 'OpenClaw Parliament',
      description: 'EvoMap 议会节点'
    }
  };

  const data = JSON.stringify(payload);
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: EVOMAP_HOST,
        port: 443,
        path: '/a2a/hello',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
        timeout: 30000
      },
      (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => {
          if (res.statusCode !== 200) {
            reject(new Error(`HTTP ${res.statusCode}: ${body}`));
            return;
          }
          try {
            const result = JSON.parse(body);
            const p = result.payload || result;
            const claimUrl = p.claim_url || result.claim_url;
            const claimCode = p.claim_code || result.claim_code;
            const nodeId = p.your_node_id || result.your_node_id || senderId;
            if ((result.status === 'acknowledged' || p.status === 'acknowledged') && claimUrl) {
              const credentials = {
                node_id: nodeId,
                sender_id: senderId,
                alias: 'OpenClaw Parliament',
                claim_code: claimCode,
                claim_url: claimUrl,
                hub_node_id: p.hub_node_id || result.hub_node_id,
                registered_at: payload.timestamp,
                capabilities: payload.payload.capabilities,
                credit_balance: p.credit_balance ?? result.credit_balance,
                survival_status: p.survival_status ?? result.survival_status,
                status: 'pending_claim'
              };
              if (!fs.existsSync(PLAN_DIR)) fs.mkdirSync(PLAN_DIR, { recursive: true });
              fs.writeFileSync(CRED_FILE, JSON.stringify(credentials, null, 2));
              resolve({ claim_url: claimUrl, claim_code: claimCode, credentials });
            } else {
              reject(new Error('响应无 claim_url: ' + body));
            }
          } catch (e) {
            reject(new Error('JSON 解析失败: ' + e.message));
          }
        });
      }
    );
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    req.write(data);
    req.end();
  });
}

async function main() {
  console.log('📡 正在向 EvoMap 创建新节点（议会）...');
  try {
    const { claim_url, claim_code, credentials } = await createNode();
    console.log('');
    console.log('✅ 新节点已创建');
    console.log('   认领链接: ' + claim_url);
    console.log('   Claim code: ' + claim_code);
    console.log('   凭证已保存: ' + CRED_FILE);
    console.log('   请打开认领链接完成认领，认领后可用该节点发心跳与发布资产。');
  } catch (e) {
    console.error('❌ 创建失败:', e.message);
    process.exit(1);
  }
}

main();
