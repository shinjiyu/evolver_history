#!/usr/bin/env node
/**
 * 快速扫描 - 只扫描关键 providers
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// 加载配置
const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));
const outputDir = path.join(__dirname, config.output_dir);

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const githubToken = process.env.GITHUB_TOKEN || config.github_token.replace('${GITHUB_TOKEN}', '');
if (!githubToken) {
  console.error('❌ 错误: 未找到 GITHUB_TOKEN');
  process.exit(1);
}

const TARGET_PROVIDERS = ['openai', 'anthropic', 'deepseek', 'zhipu'];

function githubSearch(query) {
  return new Promise((resolve, reject) => {
    const maxFiles = config.max_files_per_query || 20;
    const options = {
      hostname: 'api.github.com',
      path: `/search/code?q=${encodeURIComponent(query)}&per_page=${maxFiles}`,
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
        if (res.statusCode === 403) {
          reject(new Error('Rate limit exceeded'));
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          return;
        }
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

function extractKeys(text, pattern) {
  const regex = new RegExp(pattern, 'g');
  const matches = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    matches.push(match[0]);
  }
  return [...new Set(matches)];
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

async function scanProvider(providerId, providerConfig) {
  console.log(`\n🔍 扫描 ${providerConfig.name}...`);
  const results = [];

  // 只用第一个查询
  const query = providerConfig.search_queries[0];
  console.log(`  查询: ${query}`);
  
  try {
    const searchResult = await githubSearch(query);
    
    if (!searchResult.items || searchResult.items.length === 0) {
      console.log(`  未找到结果`);
      return [];
    }

    console.log(`  找到 ${searchResult.items.length} 个文件`);

    for (const item of searchResult.items) {
      try {
        await new Promise(r => setTimeout(r, config.rate_limit_delay_ms));
        
        const content = await getFileContent(item.url);
        const keys = extractKeys(content, providerConfig.pattern);
        
        for (const key of keys) {
          results.push({
            provider: providerId,
            provider_name: providerConfig.name,
            key: key,
            key_preview: key.substring(0, 10) + '...' + key.substring(key.length - 5),
            repo: item.repository.full_name,
            file: item.path,
            url: item.html_url,
            found_at: new Date().toISOString()
          });
        }
      } catch (e) {
        console.log(`  ⚠️ 获取文件失败: ${e.message}`);
      }
    }
  } catch (e) {
    console.log(`  ❌ 查询失败: ${e.message}`);
  }

  // 去重
  const uniqueResults = [];
  const seen = new Set();
  for (const r of results) {
    if (!seen.has(r.key)) {
      seen.add(r.key);
      uniqueResults.push(r);
    }
  }

  if (uniqueResults.length > 0) {
    const outputPath = path.join(outputDir, `found-keys-${providerId}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(uniqueResults, null, 2));
    console.log(`  ✅ 找到 ${uniqueResults.length} 个 key`);
  } else {
    console.log(`  ℹ️ 未找到有效 key`);
  }

  return uniqueResults;
}

async function main() {
  console.log('🚀 GitHub API Key Scanner (快速模式)');
  console.log('='.repeat(50));
  console.log(`目标: ${TARGET_PROVIDERS.join(', ')}`);
  
  const allResults = {};

  for (const providerId of TARGET_PROVIDERS) {
    if (!config.providers[providerId]) continue;
    
    try {
      const results = await scanProvider(providerId, config.providers[providerId]);
      if (results.length > 0) {
        allResults[providerId] = results;
      }
    } catch (e) {
      console.error(`❌ 扫描 ${providerId} 失败:`, e.message);
    }
    
    await new Promise(r => setTimeout(r, config.rate_limit_delay_ms));
  }

  console.log('\n📊 扫描完成');
  console.log('='.repeat(50));
  let total = 0;
  for (const [provider, keys] of Object.entries(allResults)) {
    console.log(`  ${config.providers[provider].name}: ${keys.length} 个`);
    total += keys.length;
  }
  console.log(`\n总计: ${total} 个 key`);
  
  // 保存汇总
  const summaryPath = path.join(outputDir, 'scan-summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify({
    scanned_at: new Date().toISOString(),
    providers_scanned: TARGET_PROVIDERS,
    total_keys: total,
    breakdown: Object.fromEntries(Object.entries(allResults).map(([k, v]) => [k, v.length]))
  }, null, 2));
}

main().catch(console.error);
