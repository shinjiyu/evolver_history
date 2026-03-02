#!/usr/bin/env node

/**
 * 自主探索系统 - Cron 任务
 * 
 * 频率: 每 6 小时
 * 功能: 执行产出导向的自主探索，生成有价值的报告
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const EXPLORER_PATH = '/root/.openclaw/workspace/autonomous-exploration/executor/smart-explore.js';
const LOG_FILE = '/root/.openclaw/workspace/logs/autonomous-exploration-cron.log';

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(message);
  fs.appendFileSync(LOG_FILE, logMessage);
}

async function main() {
  log('🚀 开始自主探索任务...');
  
  try {
    // 执行探索
    const output = execSync(`node ${EXPLORER_PATH}`, {
      encoding: 'utf8',
      timeout: 120000 // 2 分钟超时
    });
    
    log('✅ 探索任务完成');
    
    // 提取关键信息
    const lines = output.split('\n');
    for (const line of lines) {
      if (line.includes('任务:') || 
          line.includes('发现:') || 
          line.includes('建议:') ||
          line.includes('产出文件:')) {
        log(`   ${line.trim()}`);
      }
    }
    
    return { success: true };
    
  } catch (error) {
    log(`❌ 探索任务失败: ${error.message}`);
    return { success: false, error: error.message };
  }
}

main().then(result => {
  process.exit(result.success ? 0 : 1);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
