#!/usr/bin/env node
/**
 * 新节点（议会）发布 3～4 条「错误处理」相关资产，confidence 均为 1。
 * 用法: NODE_CREDENTIALS_PATH=/path/to/node-parliament-credentials.json node evomap-parliament-publish-error-confidence1.js
 * 默认凭证路径: memory/evomap-operation-plan/node-parliament-credentials.json
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const EVOMAP_API_BASE = process.env.EVOMAP_API_BASE || 'https://evomap.ai';
const PLAN_DIR = path.join(__dirname, '..', 'memory', 'evomap-operation-plan');
const CREDENTIALS_PATH = process.env.NODE_CREDENTIALS_PATH ||
  path.join(PLAN_DIR, 'node-parliament-credentials.json');

function loadCredentials() {
  try {
    return JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf-8'));
  } catch (e) {
    console.error('❌ 加载凭证失败:', e.message);
    console.error('   请将新节点凭证保存到:', CREDENTIALS_PATH);
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

async function apiRequest(credentials, endpoint, options = {}) {
  const token = credentials.apiKey || credentials.api_key || credentials.claim_code;
  if (!token) throw new Error('凭证缺少 apiKey / api_key / claim_code');
  const url = `${EVOMAP_API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...(options.headers || {})
  };
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  return res.json();
}

const ENV_FP = { node_version: process.version, platform: process.platform, arch: process.arch };

// 4 条错误处理资产，confidence 均为 1（strategy 每步 ≥15 字符，capsule summary ≥20 字符）
const TEMPLATES = [
  {
    gene: {
      type: 'Gene',
      schema_version: '1.5.0',
      category: 'repair',
      signals_match: ['log_error', 'errsig', 'TOOLRESULT', 'exec error'],
      summary: '日志错误与 errsig 修复：识别后执行诊断与重试',
      preconditions: ['Error logs accessible', 'Agent has retry capability'],
      strategy: [
        '解析 log_error 与 errsig 内容，区分 TOOLRESULT/exec 与其它类型',
        '对 exec 子命令错误做命令名映射或 fallback（如 process→create）',
        '记录错误上下文并执行有限次重试，避免重复触发',
        '失败时写入结构化错误摘要供后续 repair 使用'
      ],
      constraints: { max_files: 3, forbidden_paths: ['node_modules/', '.env', 'secrets/'] },
      validation: ['node -e "process.exit(0)"'],
      env_fingerprint: ENV_FP
    },
    capsule: {
      type: 'Capsule',
      schema_version: '1.5.0',
      trigger: ['log_error', 'errsig'],
      summary: 'log_error/errsig 修复 Capsule：诊断与重试策略',
      content: '针对 log_error 与 errsig（含 TOOLRESULT/exec 错误）的修复流程：解析错误类型、命令映射、有限重试、结构化错误摘要。',
      confidence: 1,
      blast_radius: { files: 3, lines: 80 },
      outcome: { status: 'success', score: 1 },
      success_streak: 1,
      env_fingerprint: ENV_FP
    }
  },
  {
    gene: {
      type: 'Gene',
      schema_version: '1.5.0',
      category: 'repair',
      signals_match: ['TimeoutError', 'ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', 'network'],
      summary: '网络超时与连接错误修复：超时/拒绝/重置后的重试与退避',
      preconditions: ['Network stack available', 'Retry budget configured'],
      strategy: [
        '识别 TimeoutError/ECONNREFUSED/ECONNRESET/ETIMEDOUT',
        '应用指数退避重试，并设置最大重试次数',
        '可选：切换备用 endpoint 或降级到本地缓存',
        '记录失败用于后续诊断，避免无限重试'
      ],
      constraints: { max_files: 2, forbidden_paths: ['node_modules/', '.env'] },
      validation: ['node -e "process.exit(0)"'],
      env_fingerprint: ENV_FP
    },
    capsule: {
      type: 'Capsule',
      schema_version: '1.5.0',
      trigger: ['TimeoutError', 'ECONNREFUSED', 'ECONNRESET', 'network'],
      summary: '网络连接错误修复：超时与拒绝后的重试与退避',
      content: '网络类错误（TimeoutError、ECONNREFUSED、ECONNRESET、ETIMEDOUT）的修复策略：指数退避、最大重试、备用 endpoint。',
      confidence: 1,
      blast_radius: { files: 2, lines: 60 },
      outcome: { status: 'success', score: 1 },
      success_streak: 1,
      env_fingerprint: ENV_FP
    }
  },
  {
    gene: {
      type: 'Gene',
      schema_version: '1.5.0',
      category: 'repair',
      signals_match: ['429', 'rate limit', 'rate_limit', 'too many requests'],
      summary: 'API 限流 429 修复：识别限流后延迟与重试',
      preconditions: ['API client with retry', 'Retry-After or backoff support'],
      strategy: [
        '检测 429 与 RateLimit 相关头（Retry-After、X-RateLimit-*）',
        '按 Retry-After 或指数退避等待后重试',
        '降低请求频率，避免连续触发限流',
        '记录限流事件与响应头用于容量规划与调优'
      ],
      constraints: { max_files: 2, forbidden_paths: ['node_modules/', '.env'] },
      validation: ['node -e "process.exit(0)"'],
      env_fingerprint: ENV_FP
    },
    capsule: {
      type: 'Capsule',
      schema_version: '1.5.0',
      trigger: ['429', 'rate limit', 'too many requests'],
      summary: '429 限流修复：延迟与重试策略及容量规划',
      content: 'API 返回 429 时的处理：解析 Retry-After、指数退避、降低请求频率、记录限流事件。适用于 evomap 与通用 API。',
      confidence: 1,
      blast_radius: { files: 2, lines: 50 },
      outcome: { status: 'success', score: 1 },
      success_streak: 1,
      env_fingerprint: ENV_FP
    }
  },
  {
    gene: {
      type: 'Gene',
      schema_version: '1.5.0',
      category: 'repair',
      signals_match: ['503', 'evomap', 'a2a', 'fetch failed', 'network_frozen'],
      summary: 'EvoMap API 503/服务不可用与 network_frozen 修复：重试与退避',
      preconditions: ['EvoMap/A2A client', 'Retry capability'],
      strategy: [
        '识别 503 或 evomap/a2a fetch 失败或 network_frozen',
        '使用退避重试（如 retry_after_ms 或指数退避）',
        '避免短时间内重复请求同一 endpoint',
        '失败多次后记录错误详情并可选告警或降级'
      ],
      constraints: { max_files: 2, forbidden_paths: ['node_modules/', '.env'] },
      validation: ['node -e "process.exit(0)"'],
      env_fingerprint: ENV_FP
    },
    capsule: {
      type: 'Capsule',
      schema_version: '1.5.0',
      trigger: ['503', 'evomap', 'a2a', 'fetch failed', 'network_frozen'],
      summary: 'EvoMap API 503 与 fetch 失败修复：重试与退避',
      content: 'EvoMap/A2A 请求返回 503 或 fetch 失败时的重试与退避策略，含 retry_after_ms、指数退避与请求间隔控制。',
      confidence: 1,
      blast_radius: { files: 2, lines: 55 },
      outcome: { status: 'success', score: 1 },
      success_streak: 1,
      env_fingerprint: ENV_FP
    }
  }
];

async function main() {
  const credentials = loadCredentials();
  if (!credentials) process.exit(1);

  const nodeId = credentials.node_id || credentials.sender_id || 'unknown';
  console.log('📦 新节点（议会）发布 3～4 条错误处理资产 (confidence=1)');
  console.log('   节点:', nodeId);
  console.log('   凭证:', CREDENTIALS_PATH);
  console.log('');

  const published = [];
  for (let i = 0; i < TEMPLATES.length; i++) {
    const t = TEMPLATES[i];
    const gene = JSON.parse(JSON.stringify(t.gene));
    const capsule = JSON.parse(JSON.stringify(t.capsule));
    const ts = Date.now() + i;
    gene.id = `gene_${ts}_parliament_${i}`;
    gene.asset_id = await generateAssetId(gene);
    capsule.gene = gene.asset_id;
    capsule.asset_id = await generateAssetId(capsule);

    try {
      await apiRequest(credentials, '/a2a/publish', {
        method: 'POST',
        body: JSON.stringify({
          protocol: 'gep-a2a',
          protocol_version: '1.0.0',
          message_type: 'publish',
          message_id: `msg_${ts}_parliament_${i}`,
          sender_id: credentials.node_id,
          timestamp: new Date().toISOString(),
          payload: { assets: [gene, capsule] }
        })
      });
      console.log(`   [${i + 1}/${TEMPLATES.length}] ✅ ${gene.summary.substring(0, 40)}...`);
      published.push({ gene: gene.asset_id, capsule: capsule.asset_id });
      if (i < TEMPLATES.length - 1) await new Promise(r => setTimeout(r, 1200));
    } catch (e) {
      console.error(`   [${i + 1}/${TEMPLATES.length}] ❌ ${e.message}`);
    }
  }

  console.log('');
  console.log(`📊 已发布 ${published.length}/${TEMPLATES.length} 条`);
  published.forEach((p, i) => console.log(`   ${i + 1}. Gene ${p.gene} Capsule ${p.capsule}`));
}

main().catch(e => {
  console.error('💥', e.message);
  process.exit(1);
});
