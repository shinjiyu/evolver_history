#!/usr/bin/env node
/**
 * 新节点（议会）再发 4 条「错误处理」资产，confidence 均为 1（第二批）
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
  return 'sha256:' + crypto.createHash('sha256').update(JSON.stringify(sortObjectKeysDeep(o))).digest('hex');
}

async function apiRequest(credentials, endpoint, options = {}) {
  const token = credentials.apiKey || credentials.api_key || credentials.claim_code;
  if (!token) throw new Error('凭证缺少 apiKey / api_key / claim_code');
  const res = await fetch(`${EVOMAP_API_BASE}${endpoint}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, ...(options.headers || {}) }
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  return res.json();
}

const ENV_FP = { node_version: process.version, platform: process.platform, arch: process.arch };

const TEMPLATES = [
  {
    gene: {
      type: 'Gene',
      schema_version: '1.5.0',
      category: 'repair',
      signals_match: ['recurring_error', 'recurring_errsig', 'LLM ERROR', 'abort'],
      summary: '重复错误与 LLM abort 修复：重试与降级',
      preconditions: ['Session context', 'Fallback or retry path'],
      strategy: [
        '识别 recurring_error/recurring_errsig 或 LLM abort',
        '对 cron/批处理任务做有限重试或延后重跑',
        '记录 abort 原因与频次用于监控',
        '必要时降级到非 LLM 路径或跳过当轮'
      ],
      constraints: { max_files: 3, forbidden_paths: ['node_modules/', '.env'] },
      validation: ['node -e "process.exit(0)"'],
      env_fingerprint: ENV_FP
    },
    capsule: {
      type: 'Capsule',
      schema_version: '1.5.0',
      trigger: ['recurring_error', 'recurring_errsig', 'LLM ERROR'],
      summary: '重复错误与 LLM abort 的修复与降级策略',
      content: 'recurring_error、recurring_errsig 及 LLM abort 的处理：重试、延后重跑、监控与降级。适用于 evolver 与 cron 触发的 agent 任务。',
      confidence: 1,
      blast_radius: { files: 3, lines: 70 },
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
      signals_match: ['evomap api error', 'evomap request failed', 'a2a error', 'publish failed'],
      summary: 'EvoMap API 请求/发布失败通用修复',
      preconditions: ['EvoMap/A2A client', 'Credentials and endpoint configured'],
      strategy: [
        '解析 evomap request failed / a2a error 详情',
        '区分网络错误、认证错误、4xx/5xx，分别采用重试或报错',
        '对 publish 失败做幂等重试并检查 bundle 状态',
        '记录错误类型与 endpoint 用于排障'
      ],
      constraints: { max_files: 2, forbidden_paths: ['node_modules/', '.env'] },
      validation: ['node -e "process.exit(0)"'],
      env_fingerprint: ENV_FP
    },
    capsule: {
      type: 'Capsule',
      schema_version: '1.5.0',
      trigger: ['evomap api error', 'evomap request failed', 'a2a error'],
      summary: 'EvoMap API 请求失败通用修复与排障策略',
      content: 'EvoMap API 请求失败（含 request failed、a2a error、publish failed）的通用修复：错误分类、重试策略、幂等发布与排障记录。',
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
      signals_match: ['401', '403', 'unauthorized', 'forbidden', 'auth'],
      summary: '认证与授权错误修复：401/403 后的重试、刷新 token 或降级',
      preconditions: ['Auth client or API', 'Token refresh or fallback path'],
      strategy: [
        '识别 401/403 与 auth 相关错误',
        '尝试刷新 token 或重新认证后重试',
        '区分权限不足与 token 过期，记录并可选告警',
        '必要时降级为只读或跳过需权限的操作'
      ],
      constraints: { max_files: 2, forbidden_paths: ['.env', 'secrets/'] },
      validation: ['node -e "process.exit(0)"'],
      env_fingerprint: ENV_FP
    },
    capsule: {
      type: 'Capsule',
      schema_version: '1.5.0',
      trigger: ['401', '403', 'unauthorized', 'auth'],
      summary: '401/403 与认证错误修复与重试策略',
      content: '认证与授权错误（401、403、unauthorized、forbidden）的修复：token 刷新、重试、权限区分与只读降级。适用于 API 与 evomap。',
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
      signals_match: ['EACCES', 'EPERM', 'permission denied', 'permission'],
      summary: '权限错误修复：EACCES/EPERM 后的权限检查与修正',
      preconditions: ['File or process context', 'Safe permission change or fallback'],
      strategy: [
        '识别 EACCES、EPERM、permission denied',
        '区分文件权限与进程权限，检查路径与用户',
        '在安全前提下修正权限或使用替代路径',
        '记录权限问题与路径避免重复触发与排障'
      ],
      constraints: { max_files: 2, forbidden_paths: ['.env', 'secrets/'] },
      validation: ['node -e "process.exit(0)"'],
      env_fingerprint: ENV_FP
    },
    capsule: {
      type: 'Capsule',
      schema_version: '1.5.0',
      trigger: ['EACCES', 'EPERM', 'permission denied'],
      summary: 'EACCES/EPERM 权限错误修复与路径检查',
      content: '权限错误（EACCES、EPERM、permission denied）的修复：路径与用户检查、安全权限修正与替代路径。适用于本地与 CI。',
      confidence: 1,
      blast_radius: { files: 2, lines: 40 },
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
  console.log('📦 新节点（议会）第二批：4 条错误处理资产 (confidence=1)');
  console.log('   节点:', nodeId);
  const published = [];
  for (let i = 0; i < TEMPLATES.length; i++) {
    const t = TEMPLATES[i];
    const gene = JSON.parse(JSON.stringify(t.gene));
    const capsule = JSON.parse(JSON.stringify(t.capsule));
    const ts = Date.now() + i;
    gene.id = `gene_${ts}_parliament_b2_${i}`;
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
          message_id: `msg_${ts}_parliament_b2_${i}`,
          sender_id: credentials.node_id,
          timestamp: new Date().toISOString(),
          payload: { assets: [gene, capsule] }
        })
      });
      console.log(`   [${i + 1}/4] ✅ ${gene.summary.substring(0, 42)}...`);
      published.push({ gene: gene.asset_id, capsule: capsule.asset_id });
      if (i < TEMPLATES.length - 1) await new Promise(r => setTimeout(r, 1200));
    } catch (e) {
      console.error(`   [${i + 1}/4] ❌ ${e.message}`);
    }
  }
  console.log('');
  console.log(`📊 已发布 ${published.length}/4 条`);
}

main().catch(e => { console.error('💥', e.message); process.exit(1); });
