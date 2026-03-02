#!/usr/bin/env node
/**
 * EvoMap Bounty 猎取任务
 * 频率: 每 4 小时
 * 功能: 扫描、评估并完成 Bounty 任务
 */

const https = require('https');
const fs = require('fs');

const LOG_FILE = '/root/.openclaw/workspace/logs/evomap-bounty.log';
const CREDENTIALS_FILE = '/root/.openclaw/workspace/memory/evomap-operation-plan/node-credentials.json';
const BOUNTY_DB = '/root/.openclaw/workspace/memory/evomap-bounty-db.json';

// 日志函数
function log(message) {
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] ${message}\n`;
  console.log(message);
  fs.appendFileSync(LOG_FILE, logLine);
}

// 读取节点凭证
function getCredentials() {
  if (!fs.existsSync(CREDENTIALS_FILE)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(CREDENTIALS_FILE, 'utf8'));
}

// 读取 Bounty 数据库
function getBountyDB() {
  if (!fs.existsSync(BOUNTY_DB)) {
    return { completed: [], claimed: [] };
  }
  return JSON.parse(fs.readFileSync(BOUNTY_DB, 'utf8'));
}

// 保存 Bounty 数据库
function saveBountyDB(db) {
  fs.writeFileSync(BOUNTY_DB, JSON.stringify(db, null, 2));
}

// 带重试的请求
async function fetchWithRetry(path, options = {}, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await new Promise((resolve, reject) => {
        const reqOptions = {
          hostname: 'evomap.ai',
          port: 443,
          path: path,
          method: options.method || 'GET',
          headers: options.headers || {}
        };
        
        const req = https.request(reqOptions, (res) => {
          let body = '';
          res.on('data', (chunk) => { body += chunk; });
          res.on('end', () => {
            if (res.statusCode === 200 || res.statusCode === 201) {
              try {
                resolve(JSON.parse(body));
              } catch (e) {
                reject(new Error('Invalid JSON: ' + body.substring(0, 200)));
              }
            } else {
              reject(new Error(`HTTP ${res.statusCode}: ${body.substring(0, 500)}`));
            }
          });
        });
        
        req.on('error', reject);
        req.setTimeout(30000, () => {
          req.destroy();
          reject(new Error('Request timeout'));
        });
        
        if (options.body) {
          req.write(options.body);
        }
        req.end();
      });
      return result;
    } catch (error) {
      if (i < maxRetries - 1 && error.message.includes('500')) {
        log(`  ⚠️ 重试 ${i + 2}/${maxRetries}...`);
        await new Promise(r => setTimeout(r, 2000)); // 等待2秒
        continue;
      }
      throw error;
    }
  }
}

// 获取任务列表
async function fetchTasks(credentials) {
  const result = await fetchWithRetry('/a2a/task/list?reputation=0&limit=20', {
    headers: { 'X-Node-ID': credentials.node_id }
  });
  return result.tasks || result.data || result || [];
}

// 评估任务
function evaluateTask(task, credentials, db) {
  const taskId = task.id || task.task_id;
  
  // 跳过已完成的任务
  if (db.completed.includes(taskId)) {
    return { eligible: false, reason: 'Already completed' };
  }
  
  // 跳过已认领的任务
  if (db.claimed.includes(taskId)) {
    return { eligible: false, reason: 'Already claimed' };
  }
  
  // 检查是否已被认领
  if (task.claimed_by || task.status === 'claimed' || task.status === 'in_progress') {
    return { eligible: false, reason: 'Already claimed by others' };
  }
  
  // 检查信誉要求
  if (task.min_reputation && task.min_reputation > 50) {
    return { eligible: false, reason: `Reputation too low (required: ${task.min_reputation})` };
  }
  
  // 检查领域匹配
  const supportedDomains = ['architecture', 'devops', 'automation', 'optimization', 'coding', 'general'];
  const taskDomains = task.domains || task.tags || [];
  const hasMatch = taskDomains.some(d => supportedDomains.includes(d));
  
  if (!hasMatch && taskDomains.length > 0) {
    // 不严格限制，只是降低分数
  }
  
  // 评估分数
  let score = 0;
  score += (task.reward || task.credits || 10); // 基础奖励
  score += task.priority === 'high' ? 20 : 0; // 高优先级
  score += task.priority === 'urgent' ? 30 : 0; // 紧急
  score += taskDomains.includes('automation') ? 10 : 0; // 自动化领域加分
  
  return {
    eligible: true,
    score: score,
    reason: 'Eligible'
  };
}

// Claim Task
async function claimTask(credentials, taskId) {
  const payload = {
    node_id: credentials.node_id,
    task_id: taskId
  };
  
  return await fetchWithRetry('/a2a/task/claim', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

// 主函数
async function main() {
  log('═══════════════════════════════════════════');
  log('  EvoMap Bounty 猎取任务');
  log('═══════════════════════════════════════════');
  
  // 检查凭证
  const credentials = getCredentials();
  if (!credentials) {
    log('❌ 未找到节点凭证，请先注册节点');
    process.exit(1);
  }
  
  log(`节点: ${credentials.node_id}`);
  
  // 读取数据库
  const db = getBountyDB();
  
  // 获取任务列表
  log('\n正在扫描任务...\n');
  
  try {
    const tasks = await fetchTasks(credentials);
    log(`发现 ${tasks.length} 个任务`);
    
    // 评估每个任务
    const eligibleTasks = [];
    for (const task of tasks) {
      const eval = evaluateTask(task, credentials, db);
      log(`  - ${task.id || task.task_id}: ${eval.eligible ? '✅' : '❌'} ${eval.reason}`);
      
      if (eval.eligible) {
        eligibleTasks.push({ task, score: eval.score });
      }
    }
    
    // 按分数排序
    eligibleTasks.sort((a, b) => b.score - a.score);
    
    // Claim 最多 1 个任务
    if (eligibleTasks.length > 0) {
      const { task } = eligibleTasks[0];
      const taskId = task.id || task.task_id;
      log(`\n选择任务: ${taskId}`);
      log(`  描述: ${task.description || task.title || 'N/A'}`);
      log(`  奖励: ${task.reward || task.credits || '?'} credits`);
      
      try {
        const result = await claimTask(credentials, taskId);
        log(`  ✅ 认领成功`);
        
        // 记录到数据库
        db.claimed.push(taskId);
        saveBountyDB(db);
        
      } catch (error) {
        log(`  ❌ 认领失败: ${error.message}`);
      }
      
    } else {
      log('\n没有符合条件的任务');
    }
    
  } catch (error) {
    log(`❌ 获取任务列表失败: ${error.message}`);
  }
  
  log('\n═══════════════════════════════════════════');
  log('  Bounty 猎取任务完成');
  log('═══════════════════════════════════════════\n');
}

main().catch(error => {
  log(`❌ 任务执行失败: ${error.message}`);
  process.exit(1);
});
