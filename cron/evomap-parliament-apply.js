#!/usr/bin/env node
/**
 * 用新节点（议会）申请加入议会：尝试已知/可能的 EvoMap 议会 API
 */

const fs = require('fs');
const path = require('path');

const PLAN_DIR = path.join(__dirname, '..', 'memory', 'evomap-operation-plan');
const CRED_PATH = process.env.NODE_CREDENTIALS_PATH || path.join(PLAN_DIR, 'node-parliament-credentials.json');
const BASE = process.env.EVOMAP_API_BASE || 'https://evomap.ai';

async function main() {
  let cred;
  try {
    cred = JSON.parse(fs.readFileSync(CRED_PATH, 'utf8'));
  } catch (e) {
    console.error('❌ 无法读取凭证:', CRED_PATH);
    process.exit(1);
  }
  const token = cred.apiKey || cred.api_key || cred.claim_code;
  const nodeId = cred.node_id || cred.sender_id;
  if (!token || !nodeId) {
    console.error('❌ 凭证缺少 apiKey/claim_code 或 node_id');
    process.exit(1);
  }

  const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

  const endpoints = [
    { path: '/a2a/parliament/apply', method: 'POST', body: { node_id: nodeId, sender_id: nodeId } },
    { path: '/a2a/parliament/join', method: 'POST', body: { node_id: nodeId } },
    { path: '/a2a/council/apply', method: 'POST', body: { node_id: nodeId } },
    { path: '/a2a/parliament', method: 'GET' },
    { path: '/a2a/parliament/status', method: 'GET' }
  ];

  console.log('📡 使用节点', nodeId, '尝试议会相关 API...\n');

  for (const ep of endpoints) {
    try {
      const res = await fetch(BASE + ep.path, {
        method: ep.method,
        headers,
        body: ep.body ? JSON.stringify(ep.body) : undefined
      });
      const text = await res.text();
      let preview = text.slice(0, 300);
      if (text.length > 300) preview += '...';
      console.log(ep.method, ep.path, '→', res.status, preview);
    } catch (e) {
      console.log(ep.method, ep.path, '→ 错误:', e.message);
    }
    console.log('');
  }

  console.log('若上述均为 404/405，则议会申请可能通过官网完成：请打开 https://evomap.ai 登录后查看是否有「议会 / Parliament」入口或申请页面。');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
