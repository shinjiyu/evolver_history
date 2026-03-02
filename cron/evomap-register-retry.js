#!/usr/bin/env node
/**
 * EvoMap 注册重试 - Cron 版本
 * 每 5 分钟执行一次，检查服务状态并尝试注册
 */

const https = require('https');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = '/root/.openclaw/workspace/memory/evomap-operation-plan';
const LOG_FILE = path.join(OUTPUT_DIR, 'registration-attempts.log');
const CRED_FILE = path.join(OUTPUT_DIR, 'node-credentials.json');

function log(message) {
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] ${message}\n`;
  console.log(message);
  fs.appendFileSync(LOG_FILE, logLine);
}

async function checkStatus() {
  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'evomap.ai',
      port: 443,
      path: '/a2a/stats',
      method: 'GET',
      timeout: 10000
    }, (res) => {
      let body = '';
      res.on('data', (c) => body += c);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try { resolve({ online: true, stats: JSON.parse(body) }); }
          catch (e) { resolve({ online: false }); }
        } else {
          resolve({ online: false });
        }
      });
    });
    req.on('error', () => resolve({ online: false }));
    req.on('timeout', () => { req.destroy(); resolve({ online: false }); });
    req.end();
  });
}

async function register() {
  // 如果已经有凭证，检查是否完整
  if (fs.existsSync(CRED_FILE)) {
    const cred = JSON.parse(fs.readFileSync(CRED_FILE, 'utf8'));
    if (cred.claim_url) {
      log('✅ 已有完整凭证，无需重新注册');
      return true;
    }
  }

  return new Promise((resolve) => {
    const senderId = 'node_openclaw_' + crypto.randomBytes(8).toString('hex');
    const payload = {
      protocol: 'gep-a2a',
      protocol_version: '1.0.0',
      message_type: 'hello',
      message_id: 'msg_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex'),
      sender_id: senderId,
      timestamp: new Date().toISOString(),
      payload: {
        capabilities: {
          domains: ['automation', 'devops', 'architecture', 'optimization'],
          languages: ['zh-CN', 'en'],
          a2a_services: ['architecture-review', 'troubleshooting', 'code-optimization']
        },
        gene_count: 0,
        capsule_count: 0,
        env_fingerprint: {
          platform: process.platform,
          arch: process.arch,
          node_version: process.version
        },
        alias: 'OpenClaw Agent',
        description: '全自动 EvoMap 运营 Agent'
      }
    };

    const data = JSON.stringify(payload);
    const req = https.request({
      hostname: 'evomap.ai',
      port: 443,
      path: '/a2a/hello',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
      timeout: 60000
    }, (res) => {
      let body = '';
      res.on('data', (c) => body += c);
      res.on('end', () => {
        if (res.statusCode !== 200) {
          log(`❌ 注册失败: HTTP ${res.statusCode}`);
          resolve(false);
          return;
        }
        try {
          const result = JSON.parse(body);
          if (result.status === 'acknowledged' && result.claim_url) {
            log(`✅ 注册成功! Node ID: ${result.your_node_id}`);
            log(`   Claim URL: ${result.claim_url}`);
            
            const credentials = {
              node_id: result.your_node_id || senderId,
              sender_id: senderId,
              alias: 'OpenClaw Agent',
              claim_code: result.claim_code,
              claim_url: result.claim_url,
              hub_node_id: result.hub_node_id,
              registered_at: payload.timestamp,
              capabilities: payload.payload.capabilities,
              description: payload.payload.description,
              credit_balance: result.credit_balance,
              survival_status: result.survival_status,
              status: 'registered'
            };
            
            fs.writeFileSync(CRED_FILE, JSON.stringify(credentials, null, 2));
            log('✅ 凭证已保存');
            resolve(true);
          } else {
            log(`❌ 响应不完整`);
            resolve(false);
          }
        } catch (e) {
          log(`❌ JSON 解析失败: ${e.message}`);
          resolve(false);
        }
      });
    });
    req.on('error', (e) => { log(`❌ 请求错误: ${e.message}`); resolve(false); });
    req.on('timeout', () => { req.destroy(); log('❌ 请求超时'); resolve(false); });
    req.write(data);
    req.end();
  });
}

async function main() {
  log('\n═══ EvoMap 注册检查 ═══');
  
  const status = await checkStatus();
  if (!status.online) {
    log('❌ 服务离线，跳过注册尝试');
    process.exit(0);
  }
  
  log(`✅ 服务在线 (资产: ${status.stats.total_assets}, 节点: ${status.stats.total_nodes})`);
  
  const success = await register();
  process.exit(success ? 0 : 0); // 总是退出 0，让 cron 继续运行
}

main();
