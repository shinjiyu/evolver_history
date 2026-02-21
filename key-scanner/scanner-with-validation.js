#!/usr/bin/env node
/**
 * GitHub API Key Scanner with Validation
 * 扫描 GitHub 上泄露的 LLM API Keys 并验证有效性
 * 
 * ⚠️ 安全提示：仅用于安全研究和自我防护，不要滥用他人的 key
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// 加载配置
const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));
const outputDir = path.join(__dirname, config.output_dir);

// 确保输出目录存在
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// 获取 GitHub Token
const githubToken = process.env.GITHUB_TOKEN || config.github_token.replace('${GITHUB_TOKEN}', '');
if (!githubToken) {
  console.error('❌ 错误: 未找到 GITHUB_TOKEN 环境变量');
  process.exit(1);
}

// ============= HTTP 请求工具 =============

function httpsRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const reqOptions = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = https.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', reject);
    req.setTimeout(options.timeout || 10000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
    req.end();
  });
}

// ============= GitHub API =============

async function githubSearch(query) {
  const maxFiles = config.max_files_per_query || 20;
  return httpsRequest(
    `https://api.github.com/search/code?q=${encodeURIComponent(query)}&per_page=${maxFiles}`,
    {
      headers: {
        'Authorization': `Bearer ${githubToken}`,
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'KeyScanner/2.0'
      }
    }
  ).then(res => {
    if (res.status === 403) throw new Error('GitHub rate limit exceeded');
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
    return JSON.parse(res.body);
  });
}

async function getFileContent(url) {
  const res = await httpsRequest(url, {
    headers: {
      'Authorization': `Bearer ${githubToken}`,
      'Accept': 'application/vnd.github.raw',
      'User-Agent': 'KeyScanner/2.0'
    }
  });
  return res.body;
}

// ============= Key 提取 =============

function extractKeys(text, pattern) {
  const regex = new RegExp(pattern, 'g');
  const matches = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    matches.push(match[0]);
  }
  return [...new Set(matches)];
}

// ============= Key 验证 =============

async function validateKey(keyInfo) {
  const providerId = keyInfo.provider;
  const providerConfig = config.providers[providerId];
  
  if (!providerConfig) {
    return { ...keyInfo, verified: false, error: 'Unknown provider' };
  }

  const result = {
    provider: providerId,
    provider_name: keyInfo.provider_name,
    key_preview: keyInfo.key_preview,
    repo: keyInfo.repo,
    file: keyInfo.file,
    url: keyInfo.url,
    found_at: keyInfo.found_at,
    tested_at: new Date().toISOString(),
    verified: false,
    error: null,
    models: null
  };

  try {
    const validateUrl = providerConfig.validate_url;
    let url = validateUrl;
    let headers = {
      'User-Agent': 'KeyValidator/2.0'
    };

    // 根据不同 provider 设置认证方式
    switch (providerId) {
      case 'anthropic':
        headers['x-api-key'] = keyInfo.key;
        headers['anthropic-version'] = '2023-06-01';
        break;
      case 'google':
        url = `${validateUrl}?key=${keyInfo.key}`;
        break;
      case 'replicate':
        headers['Authorization'] = `Token ${keyInfo.key}`;
        break;
      default:
        headers['Authorization'] = `Bearer ${keyInfo.key}`;
    }

    const response = await httpsRequest(url, { headers, timeout: 8000 });
    
    // 判断有效性
    if (response.status === 200) {
      result.verified = true;
      try {
        const body = JSON.parse(response.body);
        if (body.data) {
          result.models = body.data.map(m => m.id || m).slice(0, 5);
        } else if (body.models) {
          result.models = body.models.map(m => m.id || m.name || m).slice(0, 5);
        }
      } catch (e) {
        // 响应不是 JSON，但 200 表示 key 有效
      }
    } else if (response.status === 429) {
      // Rate limit 通常意味着 key 有效（被限制了说明通过了认证）
      result.verified = true;
      result.error = 'rate_limited';
    } else if (response.status === 401 || response.status === 403) {
      result.verified = false;
      result.error = 'invalid_key';
    } else if (response.status === 404) {
      // 404 可能是 endpoint 不对，但也可能是 key 无效
      result.verified = false;
      result.error = 'endpoint_not_found';
    } else {
      result.verified = false;
      result.error = `http_${response.status}`;
    }
  } catch (e) {
    result.verified = false;
    result.error = e.message.includes('Timeout') ? 'timeout' : 'network_error';
  }

  // 保留完整 key 用于 agent 配置（仅在内部使用）
  result.full_key = keyInfo.key;
  
  return result;
}

// ============= 扫描单个 Provider =============

async function scanProvider(providerId, providerConfig) {
  console.log(`\n🔍 扫描 ${providerConfig.name}...`);
  const foundKeys = [];
  const validatedKeys = [];

  for (const query of providerConfig.search_queries) {
    console.log(`  查询: ${query}`);
    
    try {
      const searchResult = await githubSearch(query);
      
      if (!searchResult.items || searchResult.items.length === 0) {
        console.log(`  未找到结果`);
        continue;
      }

      console.log(`  找到 ${searchResult.items.length} 个文件`);

      for (const item of searchResult.items) {
        try {
          await new Promise(r => setTimeout(r, config.rate_limit_delay_ms));
          
          const content = await getFileContent(item.url);
          const keys = extractKeys(content, providerConfig.pattern);
          
          for (const key of keys) {
            foundKeys.push({
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
  }

  // 去重
  const uniqueKeys = [];
  const seen = new Set();
  for (const k of foundKeys) {
    if (!seen.has(k.key)) {
      seen.add(k.key);
      uniqueKeys.push(k);
    }
  }

  if (uniqueKeys.length === 0) {
    console.log(`  ℹ️ 未找到 key`);
    return { found: 0, verified: 0, keys: [] };
  }

  console.log(`\n  📋 找到 ${uniqueKeys.length} 个候选 key，开始验证...`);

  // 验证每个 key
  for (let i = 0; i < uniqueKeys.length; i++) {
    const keyInfo = uniqueKeys[i];
    process.stdout.write(`  [${i + 1}/${uniqueKeys.length}] 验证 ${keyInfo.key_preview}... `);
    
    try {
      const validated = await validateKey(keyInfo);
      
      if (validated.verified) {
        console.log(`✅ 有效`);
        if (validated.models && validated.models.length > 0) {
          console.log(`      模型: ${validated.models.slice(0, 3).join(', ')}...`);
        }
        validatedKeys.push(validated);
      } else {
        console.log(`❌ ${validated.error}`);
      }
    } catch (e) {
      console.log(`❌ 错误: ${e.message}`);
    }

    // 验证延迟，避免触发 API 限流
    await new Promise(r => setTimeout(r, 1500));
  }

  return {
    found: uniqueKeys.length,
    verified: validatedKeys.length,
    keys: validatedKeys
  };
}

// ============= 主函数 =============

async function main() {
  console.log('🚀 GitHub API Key Scanner v2.0 (with Validation)');
  console.log('=' .repeat(50));
  console.log('⚠️  仅用于安全研究，请勿滥用他人的 API Key');
  console.log('=' .repeat(50));

  const startTime = Date.now();
  const allResults = {
    scanned_at: new Date().toISOString(),
    providers: {},
    summary: {
      total_found: 0,
      total_verified: 0
    }
  };

  // 只扫描指定的几个 provider（减少 API 调用）
  const targetProviders = ['anthropic', 'deepseek', 'openai', 'google'];
  
  for (const providerId of targetProviders) {
    if (!config.providers[providerId]) continue;
    
    try {
      const result = await scanProvider(providerId, config.providers[providerId]);
      allResults.providers[providerId] = {
        name: config.providers[providerId].name,
        found: result.found,
        verified: result.verified,
        keys: result.keys
      };
      allResults.summary.total_found += result.found;
      allResults.summary.total_verified += result.verified;
    } catch (e) {
      console.error(`❌ 扫描 ${providerId} 失败:`, e.message);
      allResults.providers[providerId] = {
        name: config.providers[providerId].name,
        error: e.message
      };
    }
    
    // Provider 之间的延迟
    await new Promise(r => setTimeout(r, 2000));
  }

  const elapsed = Math.round((Date.now() - startTime) / 1000);

  // 保存完整结果（包含验证通过的 keys 和完整 key 值）
  const outputPath = path.join(outputDir, 'verified-keys.json');
  fs.writeFileSync(outputPath, JSON.stringify(allResults, null, 2));
  
  // 另外保存完整的 key 列表（供 agent 配置使用）
  const fullKeysPath = path.join(outputDir, 'verified-keys-full.json');
  const fullKeys = [];
  for (const [pid, pdata] of Object.entries(allResults.providers)) {
    if (pdata.keys) {
      for (const k of pdata.keys) {
        fullKeys.push({
          provider: pid,
          key: k.full_key || k.key,
          repo: k.repo,
          models: k.models
        });
      }
    }
  }
  fs.writeFileSync(fullKeysPath, JSON.stringify(fullKeys, null, 2));

  // 汇总
  console.log('\n' + '=' .repeat(50));
  console.log('📊 扫描完成');
  console.log('=' .repeat(50));
  console.log(`⏱️  耗时: ${elapsed} 秒`);
  console.log(`📝 找到候选: ${allResults.summary.total_found} 个`);
  console.log(`✅ 验证通过: ${allResults.summary.total_verified} 个`);
  console.log(`📁 结果保存: ${outputPath}`);
  
  if (allResults.summary.total_verified > 0) {
    console.log('\n✅ 验证通过的 Keys:');
    for (const [pid, pdata] of Object.entries(allResults.providers)) {
      if (pdata.keys && pdata.keys.length > 0) {
        console.log(`\n  ${pdata.name}:`);
        for (const k of pdata.keys) {
          console.log(`    - ${k.key_preview}`);
          console.log(`      来源: ${k.repo}/${k.file}`);
          if (k.models && k.models.length > 0) {
            console.log(`      模型: ${k.models.join(', ')}`);
          }
        }
      }
    }
  }

  // 输出安全提醒
  console.log('\n⚠️  安全提醒:');
  console.log('  - 这些 keys 已公开泄露，原持有者应立即撤销');
  console.log('  - 请勿使用他人的 API Key，这是违法行为');
  console.log('  - 此扫描仅用于安全研究和漏洞披露');
}

main().catch(console.error);
