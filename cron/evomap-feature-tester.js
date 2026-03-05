#!/usr/bin/env node
/**
 * EvoMap 功能测试框架
 * 
 * 功能：
 * - 根据文档中的 API 功能列表自动测试
 * - 记录测试结果、响应时间、错误信息
 * - 生成使用示例代码
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
  baseUrl: 'https://evomap.ai',
  storage: '/root/.openclaw/workspace/memory/evomap-features',
  credentials: '/root/.openclaw/workspace/memory/evomap-operation-plan/node-v3-credentials.json'
};

// 日志
function log(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

// 读取凭证
function getCredentials() {
  try {
    const content = fs.readFileSync(CONFIG.credentials, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    log('警告：无法读取凭证文件');
    return null;
  }
}

// HTTP 请求
function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const responseTime = Date.now() - startTime;
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
          responseTime
        });
      });
    });
    
    req.on('error', (error) => {
      const responseTime = Date.now() - startTime;
      reject({ error, responseTime });
    });
    
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    if (body) {
      req.write(JSON.stringify(body));
    }
    
    req.end();
  });
}

// 测试结果
const testResults = {
  timestamp: new Date().toISOString(),
  tests: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    avgResponseTime: 0
  }
};

// 记录测试
function recordTest(name, endpoint, result) {
  const test = {
    name,
    endpoint,
    timestamp: new Date().toISOString(),
    success: result.statusCode >= 200 && result.statusCode < 400,
    statusCode: result.statusCode,
    responseTime: result.responseTime,
    error: result.error ? result.error.message : null
  };
  
  testResults.tests.push(test);
  testResults.summary.total++;
  
  if (test.success) {
    testResults.summary.passed++;
    log(`✓ ${name}: ${result.responseTime}ms`);
  } else {
    testResults.summary.failed++;
    log(`✗ ${name}: ${result.statusCode || 'ERROR'}`);
  }
  
  return test;
}

// 测试函数
async function testHealth() {
  try {
    const result = await request({
      hostname: 'evomap.ai',
      path: '/health',
      method: 'GET'
    });
    return recordTest('Health Check', '/health', result);
  } catch (error) {
    return recordTest('Health Check', '/health', { statusCode: 0, responseTime: 0, error });
  }
}

async function testNodeStatus(credentials) {
  if (!credentials || !credentials.nodeId) {
    log('跳过节点状态测试（缺少凭证）');
    return null;
  }
  
  try {
    const result = await request({
      hostname: 'evomap.ai',
      path: `/api/node/${credentials.nodeId}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${credentials.apiKey}`
      }
    });
    return recordTest('Node Status', '/api/node/:id', result);
  } catch (error) {
    return recordTest('Node Status', '/api/node/:id', { statusCode: 0, responseTime: 0, error });
  }
}

async function testBountyList(credentials) {
  const headers = credentials ? { 'Authorization': `Bearer ${credentials.apiKey}` } : {};
  
  try {
    const result = await request({
      hostname: 'evomap.ai',
      path: '/api/bounties',
      method: 'GET',
      headers
    });
    return recordTest('Bounty List', '/api/bounties', result);
  } catch (error) {
    return recordTest('Bounty List', '/api/bounties', { statusCode: 0, responseTime: 0, error });
  }
}

async function testCapsuleList(credentials) {
  const headers = credentials ? { 'Authorization': `Bearer ${credentials.apiKey}` } : {};
  
  try {
    const result = await request({
      hostname: 'evomap.ai',
      path: '/api/capsules',
      method: 'GET',
      headers
    });
    return recordTest('Capsule List', '/api/capsules', result);
  } catch (error) {
    return recordTest('Capsule List', '/api/capsules', { statusCode: 0, responseTime: 0, error });
  }
}

async function testLeaderboard() {
  try {
    const result = await request({
      hostname: 'evomap.ai',
      path: '/api/leaderboard',
      method: 'GET'
    });
    return recordTest('Leaderboard', '/api/leaderboard', result);
  } catch (error) {
    return recordTest('Leaderboard', '/api/leaderboard', { statusCode: 0, responseTime: 0, error });
  }
}

async function testA2AList(credentials) {
  if (!credentials || !credentials.apiKey) {
    log('跳过 A2A 列表测试（缺少凭证）');
    return null;
  }
  
  try {
    const result = await request({
      hostname: 'evomap.ai',
      path: '/api/a2a/tasks',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${credentials.apiKey}`
      }
    });
    return recordTest('A2A Tasks', '/api/a2a/tasks', result);
  } catch (error) {
    return recordTest('A2A Tasks', '/api/a2a/tasks', { statusCode: 0, responseTime: 0, error });
  }
}

// 生成使用示例
function generateExamples(testResults) {
  const examples = [];
  
  testResults.tests.forEach(test => {
    if (test.success) {
      const example = {
        endpoint: test.endpoint,
        method: 'GET',
        description: `测试通过，响应时间 ${test.responseTime}ms`,
        code: `// JavaScript 示例
const https = require('https');

https.get('https://evomap.ai${test.endpoint}', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log(JSON.parse(data));
  });
}).on('error', console.error);`
      };
      examples.push(example);
    }
  });
  
  return examples;
}

// 主测试函数
async function runTests() {
  log('开始 EvoMap 功能测试...');
  
  const credentials = getCredentials();
  
  // 执行测试
  await testHealth();
  await testNodeStatus(credentials);
  await testBountyList(credentials);
  await testCapsuleList(credentials);
  await testLeaderboard();
  await testA2AList(credentials);
  
  // 计算平均响应时间
  const successfulTests = testResults.tests.filter(t => t.success);
  if (successfulTests.length > 0) {
    const totalTime = successfulTests.reduce((sum, t) => sum + t.responseTime, 0);
    testResults.summary.avgResponseTime = Math.round(totalTime / successfulTests.length);
  }
  
  // 生成使用示例
  testResults.examples = generateExamples(testResults);
  
  // 保存结果
  const resultFile = path.join(CONFIG.storage, 'test-results.json');
  fs.writeFileSync(resultFile, JSON.stringify(testResults, null, 2));
  log(`✓ 测试结果已保存: ${resultFile}`);
  
  // 输出摘要
  log('---');
  log(`总测试数: ${testResults.summary.total}`);
  log(`通过: ${testResults.summary.passed}`);
  log(`失败: ${testResults.summary.failed}`);
  log(`平均响应时间: ${testResults.summary.avgResponseTime}ms`);
  
  return testResults;
}

// 如果直接运行
if (require.main === module) {
  runTests().catch(error => {
    console.error('测试失败:', error);
    process.exit(1);
  });
}

module.exports = { runTests, request };
