#!/usr/bin/env node
/**
 * API Key Validator
 * 验证扫描到的 API Key 是否有效
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// 加载配置
const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));
const resultsDir = path.join(__dirname, config.output_dir);

// 读取所有扫描结果
function loadFoundKeys() {
  const keys = [];
  const files = fs.readdirSync(resultsDir).filter(f => f.startsWith('found-keys-') && f.endsWith('.json'));
  
  for (const file of files) {
    const data = JSON.parse(fs.readFileSync(path.join(resultsDir, file), 'utf8'));
    keys.push(...data);
  }
  
  return keys;
}

// HTTP 请求
function httpRequest(url, options = {}) {
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
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
    req.end();
  });
}

// 验证单个 Key
async function validateKey(keyInfo) {
  const providerId = keyInfo.provider;
  const providerConfig = config.providers[providerId];
  
  if (!providerConfig) {
    return { ...keyInfo, valid: false, error: 'Unknown provider' };
  }

  const result = {
    ...keyInfo,
    validated_at: new Date().toISOString(),
    valid: false,
    error: null,
    models: null,
    quota: null
  };

  try {
    let headers = {};
    const validateUrl = providerConfig.validate_url;
    
    // 根据不同 provider 设置认证头
    switch (providerId) {
      case 'openai':
      case 'deepseek':
      case 'moonshot':
      case 'qwen':
      case 'openrouter':
      case 'together':
      case 'cohere':
      case 'mistral':
        headers['Authorization'] = `Bearer ${keyInfo.key}`;
        break;
      case 'anthropic':
        headers['x-api-key'] = keyInfo.key;
        headers['anthropic-version'] = '2023-06-01';
        break;
      case 'google':
        // Google 使用 query 参数
        break;
      case 'replicate':
        headers['Authorization'] = `Token ${keyInfo.key}`;
        break;
      case 'zhipu':
        headers['Authorization'] = `Bearer ${keyInfo.key}`;
        break;
      default:
        headers['Authorization'] = `Bearer ${keyInfo.key}`;
    }

    // 构建请求 URL
    let url = validateUrl;
    if (providerId === 'google') {
      url = `${validateUrl}?key=${keyInfo.key}`;
    }

    const response = await httpRequest(url, { headers });
    
    if (response.status === 200) {
      result.valid = true;
      try {
        const body = JSON.parse(response.body);
        if (body.data) {
          result.models = body.data.map(m => m.id).slice(0, 10); // 只取前10个
        } else if (body.models) {
          result.models = body.models.slice(0, 10);
        }
      } catch (e) {
        // 忽略解析错误
      }
    } else if (response.status === 401 || response.status === 403) {
      result.valid = false;
      result.error = 'Invalid or expired key';
    } else if (response.status === 429) {
      result.valid = true; // Rate limit 说明 key 是有效的
      result.error = 'Rate limited';
    } else {
      result.valid = false;
      result.error = `HTTP ${response.status}`;
    }
  } catch (e) {
    result.valid = false;
    result.error = e.message;
  }

  return result;
}

// 主函数
async function main() {
  console.log('🔐 API Key Validator');
  console.log('=' .repeat(50));
  
  const keys = loadFoundKeys();
  console.log(`\n找到 ${keys.length} 个 key 待验证\n`);
  
  if (keys.length === 0) {
    console.log('没有需要验证的 key');
    return;
  }

  const validKeys = [];
  const invalidKeys = [];
  
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    console.log(`[${i + 1}/${keys.length}] 验证 ${key.provider_name}...`);
    
    const result = await validateKey(key);
    
    if (result.valid) {
      console.log(`  ✅ 有效`);
      validKeys.push(result);
    } else {
      console.log(`  ❌ 无效: ${result.error}`);
      invalidKeys.push(result);
    }
    
    // 延迟避免 rate limit
    await new Promise(r => setTimeout(r, 1000));
  }

  // 保存结果
  const validOutput = {
    scanned_at: new Date().toISOString(),
    total_found: keys.length,
    total_valid: validKeys.length,
    keys: validKeys
  };
  
  const invalidOutput = {
    scanned_at: new Date().toISOString(),
    total: invalidKeys.length,
    keys: invalidKeys
  };

  fs.writeFileSync(
    path.join(resultsDir, 'valid-keys.json'),
    JSON.stringify(validOutput, null, 2)
  );
  
  fs.writeFileSync(
    path.join(resultsDir, 'invalid-keys.json'),
    JSON.stringify(invalidOutput, null, 2)
  );

  // 汇总
  console.log('\n📊 验证完成');
  console.log('=' .repeat(50));
  console.log(`  有效: ${validKeys.length}`);
  console.log(`  无效: ${invalidKeys.length}`);
  
  if (validKeys.length > 0) {
    console.log('\n有效的 Keys:');
    for (const k of validKeys) {
      console.log(`  - ${k.provider_name}: ${k.key_preview}`);
      if (k.models && k.models.length > 0) {
        console.log(`    模型: ${k.models.slice(0, 3).join(', ')}...`);
      }
    }
  }
}

main().catch(console.error);
