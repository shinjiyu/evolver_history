#!/usr/bin/env node
/**
 * 发布单条资产，confidence=1（用于测试 avg_confidence）。
 * 用法: NODE_CREDENTIALS_PATH=/path/to/credentials.json node evomap-publish-one-confidence1.js
 * 新节点: 先在 https://evomap.ai 上 claim 新节点，将凭证（含 apiKey）存到上述路径后执行。
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const EVOMAP_API_BASE = process.env.EVOMAP_API_BASE || 'https://evomap.ai';
const CREDENTIALS_PATH = process.env.NODE_CREDENTIALS_PATH ||
  path.join(__dirname, '..', 'memory', 'evomap-operation-plan', 'node-avg1-credentials.json');

function loadCredentials() {
  try {
    const data = fs.readFileSync(CREDENTIALS_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (e) {
    console.error('❌ 加载凭证失败:', e.message);
    console.error('   新节点请先在 https://evomap.ai 上 claim，将凭证保存到:', CREDENTIALS_PATH);
    return null;
  }
}

function sortObjectKeysDeep(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sortObjectKeysDeep);
  const sorted = {};
  for (const k of Object.keys(obj).sort()) sorted[k] = sortObjectKeysDeep(obj[k]);
  return sorted;
}

async function generateAssetId(asset) {
  const o = { ...asset };
  delete o.asset_id;
  const canonical = JSON.stringify(sortObjectKeysDeep(o));
  return 'sha256:' + crypto.createHash('sha256').update(canonical).digest('hex');
}

async function apiRequest(endpoint, options = {}) {
  const credentials = loadCredentials();
  if (!credentials) throw new Error('无凭证');
  const apiKey = credentials.apiKey || credentials.api_key || credentials.claim_code;
  if (!apiKey) {
    console.error('❌ 凭证中缺少 apiKey / api_key / claim_code，无法请求。claim 后保存的凭证应包含 apiKey。');
    throw new Error('凭证缺少 apiKey');
  }
  const url = `${EVOMAP_API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
    ...(options.headers || {})
  };
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  return res.json();
}

// 单条资产：内容随意，满足校验即可（strategy 每步 ≥15 字符，summary ≥20 字符）
const GENE = {
  type: 'Gene',
  schema_version: '1.5.0',
  category: 'repair',
  signals_match: ['test', 'demo', 'avg_confidence_demo'],
  summary: 'Demo gene for single-asset node avg_confidence test',
  preconditions: ['None'],
  strategy: [
    'Execute a single no-op step for demo and confidence test purpose only',
    'No real operation required; this asset is for testing avg_confidence'
  ],
  constraints: { max_files: 1, forbidden_paths: [] },
  validation: ['node -e "process.exit(0)"'],
  env_fingerprint: { node_version: process.version, platform: process.platform, arch: process.arch }
};

const CAPSULE = {
  type: 'Capsule',
  schema_version: '1.5.0',
  trigger: ['test', 'demo'],
  summary: 'Demo capsule for single-asset node avg_confidence test only',
  content: 'Placeholder content for testing node with single asset and confidence 1. No real usage.',
  confidence: 1,
  blast_radius: { files: 1, lines: 1 },
  outcome: { status: 'success', score: 1 },
  success_streak: 1,
  env_fingerprint: { node_version: process.version, platform: process.platform, arch: process.arch }
};

async function main() {
  const credentials = loadCredentials();
  if (!credentials) process.exit(1);

  console.log('📦 发布单条资产 (confidence=1)');
  console.log('   节点:', credentials.node_id || credentials.alias || 'unknown');
  console.log('   凭证:', CREDENTIALS_PATH);

  const ts = Date.now();
  GENE.id = `gene_${ts}_demo`;
  CAPSULE.gene = await generateAssetId(GENE);
  GENE.asset_id = CAPSULE.gene;
  CAPSULE.asset_id = await generateAssetId(CAPSULE);

  const payload = {
    protocol: 'gep-a2a',
    protocol_version: '1.0.0',
    message_type: 'publish',
    message_id: `msg_${ts}_demo`,
    sender_id: credentials.node_id,
    timestamp: new Date().toISOString(),
    payload: { assets: [GENE, CAPSULE] }
  };

  const result = await apiRequest('/a2a/publish', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  console.log('   ✅ 已发布');
  console.log('   Gene ID:', GENE.asset_id);
  console.log('   Capsule ID:', CAPSULE.asset_id);
  if (result.bundleId) console.log('   Bundle:', result.bundleId);
}

main().catch(e => {
  console.error('💥', e.message);
  process.exit(1);
});
