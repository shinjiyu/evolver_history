#!/usr/bin/env node

/**
 * 自适应任务调度器
 * 根据系统负载动态调整 cron 任务频率
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');

const execAsync = util.promisify(exec);

const CONFIG_FILE = '/root/.openclaw/workspace/.adaptive-config.json';
const LOG_FILE = '/root/.openclaw/workspace/logs/adaptive-scheduler.log';

// 任务配置：[任务ID, 任务名称, 最小间隔(分钟), 最大间隔(分钟), 权重, 单位]
const TASKS = [
  ['bdd4f71b-65a8-4b51-a0ce-958f1d38e48d', 'evolver-log-analysis', 10, 30, 1.2, 'minutes'],
  ['e66b45d2-9e23-460e-9820-43461e9752ec', 'evolver-self-evolution', 2, 6, 1.0, 'hours'],
  ['b8cfd3df-5d3c-46f8-a74a-87762ece5dee', 'evomap-auto-bounty', 5, 20, 1.5, 'minutes'],
  // 小说推广任务 - 更频繁的调度
  ['d7e7f142-afb3-46ba-b0b8-cda828a1109e', 'novel-marketing-research', 2, 6, 1.5, 'hours'], // 每 2-6 小时
  ['56cc1b72-3814-4b4c-b0cd-da30862e83d4', 'novel-marketing-execute', 30, 60, 1.5, 'minutes'], // 每 30-60 分钟
];

// 负载阈值
const LOAD_THRESHOLDS = {
  cpu_low: 0.5,      // CPU 负载 < 0.5 = 低
  cpu_medium: 1.5,   // CPU 负载 < 1.5 = 中
  mem_low: 0.6,      // 内存使用 < 60% = 低
  mem_medium: 0.8,   // 内存使用 < 80% = 中
  disk_high: 0.9,    // 磁盘使用 > 90% = 高
};

async function getSystemMetrics() {
  try {
    // CPU 负载 (1分钟平均)
    const { stdout: loadavg } = await execAsync('cat /proc/loadavg');
    const cpuLoad = parseFloat(loadavg.split(' ')[0]);
    
    // 内存使用
    const { stdout: memInfo } = await execAsync('free -b | grep Mem');
    const memParts = memInfo.split(/\s+/);
    const memTotal = parseInt(memParts[1]);
    const memUsed = parseInt(memParts[2]);
    const memPercent = memUsed / memTotal;
    
    // 磁盘使用
    const { stdout: diskInfo } = await execAsync('df -B1 / | tail -1');
    const diskParts = diskInfo.split(/\s+/);
    const diskTotal = parseInt(diskParts[1]);
    const diskUsed = parseInt(diskParts[2]);
    const diskPercent = diskUsed / diskTotal;
    
    return {
      cpuLoad,
      memPercent,
      diskPercent,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('获取系统指标失败:', error);
    return null;
  }
}

function calculateLoadLevel(metrics) {
  if (!metrics) return 'medium';
  
  const { cpuLoad, memPercent, diskPercent } = metrics;
  
  // 磁盘空间紧张，强制低频
  if (diskPercent > LOAD_THRESHOLDS.disk_high) {
    return 'high';
  }
  
  // 综合评分
  let score = 0;
  
  // CPU 评分 (0-40)
  if (cpuLoad < LOAD_THRESHOLDS.cpu_low) score += 40;
  else if (cpuLoad < LOAD_THRESHOLDS.cpu_medium) score += 20;
  else score += 0;
  
  // 内存评分 (0-40)
  if (memPercent < LOAD_THRESHOLDS.mem_low) score += 40;
  else if (memPercent < LOAD_THRESHOLDS.mem_medium) score += 20;
  else score += 0;
  
  // 磁盘评分 (0-20)
  if (diskPercent < 0.7) score += 20;
  else if (diskPercent < 0.85) score += 10;
  else score += 0;
  
  // 根据总评分确定负载级别
  if (score >= 70) return 'low';
  if (score >= 40) return 'medium';
  return 'high';
}

function getFrequencyMultiplier(loadLevel) {
  switch (loadLevel) {
    case 'low': return 0.5;    // 低负载：间隔减半，频率翻倍
    case 'medium': return 1.0; // 中负载：保持当前频率
    case 'high': return 2.0;   // 高负载：间隔加倍，频率减半
    default: return 1.0;
  }
}

async function readCurrentConfig() {
  try {
    const data = await fs.readFile(CONFIG_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return {
      loadLevel: 'medium',
      multiplier: 1.0,
      lastCheck: null,
      adjustments: {}
    };
  }
}

async function writeConfig(config) {
  await fs.mkdir(path.dirname(CONFIG_FILE), { recursive: true });
  await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2));
}

async function adjustTaskFrequency(taskId, taskName, minInterval, maxInterval, multiplier, unit = 'minutes') {
  // 使用 maxInterval 作为基准，乘以 multiplier 得到新间隔
  // multiplier < 1 表示提高频率（间隔缩短）
  // multiplier > 1 表示降低频率（间隔延长）
  let baseInterval = Math.round((minInterval + maxInterval) / 2); // 中间值作为基准
  let newInterval = Math.round(baseInterval * multiplier);
  
  // 限制在最小和最大范围内
  newInterval = Math.max(minInterval, Math.min(maxInterval, newInterval));
  
  // 生成 cron 表达式
  let cronExpr;
  if (unit === 'hours') {
    cronExpr = `0 */${newInterval} * * *`;
  } else if (unit === 'days') {
    cronExpr = `0 10 */${newInterval} * *`;
  } else {
    cronExpr = `*/${newInterval} * * * *`;
  }
  
  try {
    // 直接修改 jobs.json 文件
    const jobsFile = '/root/.openclaw/cron/jobs.json';
    const data = await fs.readFile(jobsFile, 'utf-8');
    const jobs = JSON.parse(data);
    
    for (const job of jobs.jobs || []) {
      if (job.id === taskId || job.name === taskName) {
        job.schedule.expr = cronExpr;
        job.schedule.tz = 'Asia/Shanghai';
      }
    }
    
    await fs.writeFile(jobsFile, JSON.stringify(jobs, null, 2));
    return { success: true, newInterval, cronExpr };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function log(message) {
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] ${message}\n`;
  
  try {
    await fs.mkdir(path.dirname(LOG_FILE), { recursive: true });
    await fs.appendFile(LOG_FILE, logLine);
  } catch (error) {
    console.error('写入日志失败:', error);
  }
  
  console.log(logLine.trim());
}

async function main() {
  await log('=== 开始自适应调度检查 ===');
  
  // 1. 获取系统指标
  const metrics = await getSystemMetrics();
  if (!metrics) {
    await log('错误：无法获取系统指标，保持当前配置');
    return;
  }
  
  await log(`系统指标 - CPU: ${metrics.cpuLoad.toFixed(2)}, 内存: ${(metrics.memPercent * 100).toFixed(1)}%, 磁盘: ${(metrics.diskPercent * 100).toFixed(1)}%`);
  
  // 2. 计算负载级别
  const loadLevel = calculateLoadLevel(metrics);
  const multiplier = getFrequencyMultiplier(loadLevel);
  
  await log(`负载级别: ${loadLevel}, 频率倍数: ${multiplier}`);
  
  // 3. 读取当前配置
  const config = await readCurrentConfig();
  
  // 4. 如果负载级别没变化，且距离上次调整不超过 30 分钟，跳过
  if (config.loadLevel === loadLevel && config.lastCheck) {
    const lastCheck = new Date(config.lastCheck);
    const now = new Date();
    const minutesSinceLastCheck = (now - lastCheck) / 1000 / 60;
    
    if (minutesSinceLastCheck < 30) {
      await log(`负载级别未变化，且距离上次调整仅 ${minutesSinceLastCheck.toFixed(1)} 分钟，跳过调整`);
      return;
    }
  }
  
  // 5. 调整任务频率
  const adjustments = {};
  
  for (const [taskId, taskName, minInterval, maxInterval, weight, unit] of TASKS) {
    // 应用权重调整倍数
    const adjustedMultiplier = multiplier * weight;
    const result = await adjustTaskFrequency(taskId, taskName, minInterval, maxInterval, adjustedMultiplier, unit);
    
    adjustments[taskName] = {
      ...result,
      multiplier: adjustedMultiplier,
      unit
    };
    
    if (result.success) {
      await log(`✓ ${taskName}: 新间隔 ${result.newInterval} ${unit} (${result.cronExpr})`);
    } else {
      await log(`✗ ${taskName}: 调整失败 - ${result.error}`);
    }
  }
  
  // 6. 更新配置文件
  const newConfig = {
    loadLevel,
    multiplier,
    lastCheck: new Date().toISOString(),
    metrics,
    adjustments
  };
  
  await writeConfig(newConfig);
  await log('配置已更新');
  
  // 7. 生成摘要
  const successCount = Object.values(adjustments).filter(a => a.success).length;
  await log(`=== 调整完成: ${successCount}/${TASKS.length} 个任务成功调整 ===`);
}

main().catch(error => {
  console.error('自适应调度器执行失败:', error);
  process.exit(1);
});
