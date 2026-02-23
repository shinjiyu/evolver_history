#!/usr/bin/env node

/**
 * 移除所有 Cron 任务的时间限制
 * 将 timeoutSeconds 设置为 0 表示无限制
 */

const fs = require('fs');
const path = require('path');

const JOBS_FILE = '/root/.openclaw/cron/jobs.json';
const BACKUP_FILE = '/root/.openclaw/cron/jobs.json.backup-before-remove-timeout';

async function main() {
  console.log('🔧 开始移除 Cron 任务时间限制...\n');

  // 1. 读取当前配置
  console.log('📖 读取配置文件:', JOBS_FILE);
  const jobsData = JSON.parse(fs.readFileSync(JOBS_FILE, 'utf8'));

  // 2. 备份原配置
  console.log('💾 备份原配置到:', BACKUP_FILE);
  fs.writeFileSync(BACKUP_FILE, JSON.stringify(jobsData, null, 2));

  // 3. 统计修改
  const stats = {
    total: jobsData.jobs.length,
    modified: 0,
    alreadyUnlimited: 0,
    noTimeout: 0
  };

  // 4. 修改每个任务
  console.log('\n📝 处理任务:');
  for (const job of jobsData.jobs) {
    const jobName = job.name || job.id;
    
    if (job.payload && job.payload.kind === 'agentTurn') {
      const currentTimeout = job.payload.timeoutSeconds;
      
      if (currentTimeout === 0) {
        console.log(`  ✅ ${jobName}: 已是无限制 (timeoutSeconds=0)`);
        stats.alreadyUnlimited++;
      } else if (typeof currentTimeout === 'number') {
        console.log(`  🔓 ${jobName}: ${currentTimeout}s → 0 (无限制)`);
        job.payload.timeoutSeconds = 0;
        stats.modified++;
      } else {
        console.log(`  ➕ ${jobName}: 未设置 → 0 (无限制)`);
        job.payload.timeoutSeconds = 0;
        stats.modified++;
      }
    } else {
      console.log(`  ⏭️  ${jobName}: 非 agentTurn 任务，跳过`);
      stats.noTimeout++;
    }
  }

  // 5. 保存修改
  console.log('\n💾 保存修改到:', JOBS_FILE);
  fs.writeFileSync(JOBS_FILE, JSON.stringify(jobsData, null, 2));

  // 6. 输出统计
  console.log('\n📊 统计:');
  console.log(`  总任务数: ${stats.total}`);
  console.log(`  已修改: ${stats.modified}`);
  console.log(`  已无限制: ${stats.alreadyUnlimited}`);
  console.log(`  无需修改: ${stats.noTimeout}`);

  console.log('\n✅ 完成！所有 agentTurn 任务现在无时间限制。');
  console.log('\n⚠️  注意: 需要重启 OpenClaw Gateway 使更改生效。');
  console.log('   命令: openclaw gateway restart');
}

main().catch(err => {
  console.error('❌ 错误:', err);
  process.exit(1);
});
