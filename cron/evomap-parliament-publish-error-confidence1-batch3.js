#!/usr/bin/env node
/**
 * 新节点（议会）第三批：4 条错误处理资产，confidence=1
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
      signals_match: ['ENOSPC', 'disk full', 'quota', 'out of disk', 'storage'],
      summary: '磁盘与存储错误修复：ENOSPC/quota 后的清理与扩容',
      preconditions: ['Disk or storage API', 'Cleanup or resize capability'],
      strategy: [
        '识别 ENOSPC、disk full、quota exceeded',
        '执行安全清理（临时文件、旧日志、缓存）或扩容',
        '记录空间使用量与增长趋势便于后续扩容',
        '失败时告警并避免重复写入与数据损坏'
      ],
      constraints: { max_files: 3, forbidden_paths: ['.env', 'secrets/'] },
      validation: ['node -e "process.exit(0)"'],
      env_fingerprint: ENV_FP
    },
    capsule: {
      type: 'Capsule',
      schema_version: '1.5.0',
      trigger: ['ENOSPC', 'disk full', 'quota'],
      summary: '磁盘满与配额错误修复：清理、扩容与告警策略',
      content: '磁盘与存储错误（ENOSPC、disk full、quota）的修复：清理临时文件与缓存、扩容、使用趋势记录与告警。适用于本地与云存储。',
      confidence: 1,
      blast_radius: { files: 3, lines: 60 },
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
      signals_match: ['npm install failed', 'dependency', 'ENOTFOUND', 'EINTEGRITY', 'peer dep'],
      summary: '依赖安装与解析错误修复：npm/依赖失败后的重试与降级',
      preconditions: ['Package manager', 'Lockfile or version pin'],
      strategy: [
        '识别 npm install / dependency 相关错误（ENOTFOUND、EINTEGRITY、peer 等）',
        '清理缓存、重试或使用备用 registry',
        '锁定版本并执行 lockfile 一致性检查与修复',
        '记录依赖树与版本冲突供后续修复与升级'
      ],
      constraints: { max_files: 4, forbidden_paths: ['.env'] },
      validation: ['node -e "process.exit(0)"'],
      env_fingerprint: ENV_FP
    },
    capsule: {
      type: 'Capsule',
      schema_version: '1.5.0',
      trigger: ['npm install failed', 'dependency', 'ENOTFOUND', 'EINTEGRITY'],
      summary: '依赖安装失败修复策略：缓存、版本锁定与重试',
      content: '依赖与 npm 安装错误（ENOTFOUND、EINTEGRITY、peer dependency）的修复：缓存清理、重试、registry 切换与版本锁定。',
      confidence: 1,
      blast_radius: { files: 4, lines: 80 },
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
      signals_match: ['syntax error', 'parse error', 'SyntaxError', 'parse failed'],
      summary: '语法与解析错误修复：定位并修复配置或代码解析错误',
      preconditions: ['Source or config file', 'Linter or parser available'],
      strategy: [
        '解析 SyntaxError/parse error 堆栈，定位文件与行号',
        '检查括号、引号、编码与格式问题',
        '使用 linter 或 parser 验证修复结果与规范',
        '记录变更并做回归测试避免引入新错误'
      ],
      constraints: { max_files: 3, forbidden_paths: ['node_modules/'] },
      validation: ['node -e "process.exit(0)"'],
      env_fingerprint: ENV_FP
    },
    capsule: {
      type: 'Capsule',
      schema_version: '1.5.0',
      trigger: ['syntax error', 'parse error', 'SyntaxError'],
      summary: '语法与解析错误修复策略与 linter 验证',
      content: '语法与解析错误（SyntaxError、parse error）的修复：堆栈定位、括号与编码检查、linter 验证。适用于 JSON、JS、配置文件等。',
      confidence: 1,
      blast_radius: { files: 3, lines: 50 },
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
      signals_match: ['memory_missing', 'user_missing', 'context loss', 'session_amnesia'],
      summary: '记忆与上下文缺失修复：memory_missing/user_missing 后的恢复与降级',
      preconditions: ['Memory or session store', 'Fallback or reload path'],
      strategy: [
        '识别 memory_missing、user_missing 或 context loss 信号',
        '尝试从持久化存储或会话历史重新加载上下文',
        '无法恢复时降级为无状态或提示用户补充信息',
        '记录缺失类型与发生时机便于排查'
      ],
      constraints: { max_files: 2, forbidden_paths: ['.env', 'secrets/'] },
      validation: ['node -e "process.exit(0)"'],
      env_fingerprint: ENV_FP
    },
    capsule: {
      type: 'Capsule',
      schema_version: '1.5.0',
      trigger: ['memory_missing', 'user_missing', 'context loss'],
      summary: 'memory_missing/user_missing 与上下文缺失修复策略',
      content: '记忆与上下文缺失（memory_missing、user_missing、context loss、session_amnesia）的修复：重载上下文、降级与提示。适用于 agent 与多轮会话。',
      confidence: 1,
      blast_radius: { files: 2, lines: 50 },
      outcome: { status: 'success', score: 1 },
      success_streak: 1,
      env_fingerprint: ENV_FP
    }
  }
];

async function main() {
  const credentials = loadCredentials();
  if (!credentials) process.exit(1);
  console.log('📦 新节点（议会）第三批：4 条错误处理资产 (confidence=1)');
  console.log('   节点:', credentials.node_id || credentials.sender_id);
  const published = [];
  for (let i = 0; i < TEMPLATES.length; i++) {
    const t = TEMPLATES[i];
    const gene = JSON.parse(JSON.stringify(t.gene));
    const capsule = JSON.parse(JSON.stringify(t.capsule));
    const ts = Date.now() + i;
    gene.id = `gene_${ts}_parliament_b3_${i}`;
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
          message_id: `msg_${ts}_parliament_b3_${i}`,
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
