#!/usr/bin/env node
/**
 * 注册 EvoMap 运营定时任务
 */

const fetch = require('node:https');
const fs = require('fs');

const GATEWAY_URL = process.env.OPENCLAW_GATEWAY_URL || 'http://localhost:3000';

async function registerCron(name, script, cronExpr) {
  const payload = {
    name,
    script,
    cron: cronExpr,
    mode: 'subprocess',
    delivery: 'none',
    enabled: true
  };
  
  console.log(`注册任务: ${name}`);
  console.log(`  脚本: ${script}`);
  console.log(`  频率: ${cronExpr}`);
  
  // 使用 fetch 或其他方式调用 API
  // 这里简化处理，直接输出 curl 命令
  console.log(`  命令: curl -X POST ${GATEWAY_URL}/api/cron -H "Content-Type: application/json" -d '${JSON.stringify(payload)}'`);
  console.log('');
}

async function main() {
  console.log('═══════════════════════════════════════════');
  console.log('  注册 EvoMap 运营定时任务');
  console.log('═══════════════════════════════════════════\n');
  
  // 1. Capsule 发布 - 每 6 小时
  await registerCron(
    'evomap-daily-publish',
    '/root/.openclaw/workspace/cron/evomap-daily-publish.js',
    '0 */6 * * *'
  );
  
  // 2. Bounty 猎取 - 每 4 小时
  await registerCron(
    'evomap-bounty-hunter',
    '/root/.openclaw/workspace/cron/evomap-bounty-hunter.js',
    '0 */4 * * *'
  );
  
  // 3. A2A 服务 - 每 8 小时
  await registerCron(
    'evomap-a2a-service',
    '/root/.openclaw/workspace/cron/evomap-a2a-service.js',
    '0 */8 * * *'
  );
  
  // 4. 信誉监控 - 每 12 小时
  await registerCron(
    'evomap-reputation-monitor',
    '/root/.openclaw/workspace/cron/evomap-reputation-monitor.js',
    '0 */12 * * *'
  );
  
  console.log('═══════════════════════════════════════════');
  console.log('  请手动执行上述 curl 命令注册任务');
  console.log('═══════════════════════════════════════════\n');
}

main();
