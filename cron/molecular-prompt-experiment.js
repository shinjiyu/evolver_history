#!/usr/bin/env node
/**
 * 分子结构提示词工程实验 - Cron 任务
 * 
 * 功能：
 * 1. 运行 Python 实验脚本
 * 2. 收集结果并生成简报
 * 3. 记录到历史追踪文件
 * 4. 可选：推送到 GitHub
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
  projectDir: '/root/.openclaw/workspace/molecular-prompt-experiments',
  resultsDir: '/root/.openclaw/workspace/molecular-prompt-experiments/results',
  historyFile: '/root/.openclaw/workspace/memory/molecular-experiment-history.md',
  logFile: '/root/.openclaw/workspace/logs/molecular-experiment.log',
  pythonScript: 'run_deepseek_experiment.py',
  timeout: 1800000, // 30 分钟超时
};

// 确保目录存在
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// 记录日志
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  
  ensureDir(path.dirname(CONFIG.logFile));
  fs.appendFileSync(CONFIG.logFile, logMessage);
  console.log(logMessage.trim());
}

// 运行 Python 实验脚本
async function runExperiment() {
  return new Promise((resolve, reject) => {
    log('开始运行实验...');
    
    const scriptPath = path.join(CONFIG.projectDir, CONFIG.pythonScript);
    
    if (!fs.existsSync(scriptPath)) {
      reject(new Error(`脚本不存在: ${scriptPath}`));
      return;
    }
    
    const python = spawn('python3', [scriptPath], {
      cwd: CONFIG.projectDir,
      env: { ...process.env },
      timeout: CONFIG.timeout,
    });
    
    let stdout = '';
    let stderr = '';
    
    python.stdout.on('data', (data) => {
      stdout += data.toString();
      // 实时输出进度
      const lines = data.toString().split('\n');
      lines.forEach(line => {
        if (line.trim()) {
          log(`[Python] ${line}`);
        }
      });
    });
    
    python.stderr.on('data', (data) => {
      stderr += data.toString();
      log(`[Python Error] ${data}`);
    });
    
    python.on('close', (code) => {
      if (code === 0) {
        log('实验完成');
        resolve({ stdout, stderr });
      } else {
        log(`实验失败，退出码: ${code}`);
        reject(new Error(`实验失败: ${stderr}`));
      }
    });
    
    python.on('error', (err) => {
      log(`进程错误: ${err.message}`);
      reject(err);
    });
  });
}

// 解析实验结果
function parseLatestResults() {
  const resultsDir = CONFIG.resultsDir;
  
  if (!fs.existsSync(resultsDir)) {
    return null;
  }
  
  // 找到最新的报告文件
  const files = fs.readdirSync(resultsDir)
    .filter(f => f.startsWith('deepseek_report_') && f.endsWith('.md'))
    .sort()
    .reverse();
  
  if (files.length === 0) {
    return null;
  }
  
  const latestReport = path.join(resultsDir, files[0]);
  const reportContent = fs.readFileSync(latestReport, 'utf-8');
  
  // 找到最新的分析 JSON
  const jsonFiles = fs.readdirSync(resultsDir)
    .filter(f => f.startsWith('deepseek_analysis_') && f.endsWith('.json'))
    .sort()
    .reverse();
  
  let analysisData = null;
  if (jsonFiles.length > 0) {
    const latestJson = path.join(resultsDir, jsonFiles[0]);
    analysisData = JSON.parse(fs.readFileSync(latestJson, 'utf-8'));
  }
  
  return {
    reportFile: latestReport,
    reportContent,
    analysisData,
    timestamp: files[0].replace('deepseek_report_', '').replace('.md', ''),
  };
}

// 更新历史追踪文件
function updateHistory(results) {
  const historyFile = CONFIG.historyFile;
  ensureDir(path.dirname(historyFile));
  
  const timestamp = new Date().toISOString();
  const date = timestamp.split('T')[0];
  
  let historyContent = '';
  if (fs.existsSync(historyFile)) {
    historyContent = fs.readFileSync(historyFile, 'utf-8');
  } else {
    // 创建新文件
    historyContent = `# 分子结构提示词实验 - 历史追踪

本文件自动记录每次实验的关键指标。

---

`;
  }
  
  // 提取关键指标
  let summary = `\n## 实验记录 - ${date}\n\n`;
  summary += `**时间**: ${timestamp}\n`;
  summary += `**报告文件**: \`${path.basename(results.reportFile)}\`\n\n`;
  
  if (results.analysisData) {
    summary += `### 核心指标\n\n`;
    summary += `| 模板 | 成功率 | 平均 Token | 平均时间 (ms) | 平均步数 |\n`;
    summary += `|------|--------|------------|---------------|----------|\n`;
    
    const order = ['baseline', 'cot_basic', 'covalent', 'hydrogen', 'vanderwaals', 'c_plus_h', 'full'];
    
    for (const key of order) {
      if (results.analysisData[key]) {
        const stats = results.analysisData[key];
        if (stats.success_count > 0) {
          summary += `| ${stats.name} | ${(stats.success_rate * 100).toFixed(0)}% | `;
          summary += `${stats.avg_tokens.toFixed(0)} | ${stats.avg_time_ms.toFixed(0)} | `;
          summary += `${stats.avg_steps.toFixed(1)} |\n`;
        } else {
          summary += `| ${stats.name} | 0% | - | - | - |\n`;
        }
      }
    }
  }
  
  summary += `\n---\n`;
  
  // 追加到文件
  fs.appendFileSync(historyFile, summary);
  log(`历史记录已更新: ${historyFile}`);
  
  return summary;
}

// 生成简报
function generateBrief(results) {
  const lines = [
    '🧪 **分子结构提示词实验完成**',
    '',
    `📅 时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`,
    `📄 报告: ${path.basename(results.reportFile)}`,
    '',
  ];
  
  if (results.analysisData) {
    lines.push('### 核心指标');
    lines.push('');
    
    const order = ['baseline', 'cot_basic', 'covalent', 'hydrogen', 'vanderwaals', 'c_plus_h', 'full'];
    
    for (const key of order) {
      if (results.analysisData[key] && results.analysisData[key].success_count > 0) {
        const stats = results.analysisData[key];
        lines.push(`- **${stats.name}**: ${stats.avg_tokens.toFixed(0)} tokens, ${stats.avg_time_ms.toFixed(0)}ms`);
      }
    }
  }
  
  return lines.join('\n');
}

// 主函数
async function main() {
  log('========== 分子结构提示词实验开始 ==========');
  
  try {
    // 1. 运行实验
    await runExperiment();
    
    // 2. 解析结果
    const results = parseLatestResults();
    
    if (!results) {
      throw new Error('未找到实验结果文件');
    }
    
    log(`找到报告: ${results.reportFile}`);
    
    // 3. 更新历史
    updateHistory(results);
    
    // 4. 生成简报
    const brief = generateBrief(results);
    log('简报:\n' + brief);
    
    // 5. 输出简报到 stdout（供 OpenClaw 捕获）
    console.log('\n' + '='.repeat(60));
    console.log(brief);
    console.log('='.repeat(60) + '\n');
    
    log('========== 实验完成 ==========');
    
    return { success: true, brief, results };
    
  } catch (error) {
    log(`错误: ${error.message}`);
    log('========== 实验失败 ==========');
    
    console.error('\n❌ 实验失败:', error.message);
    
    return { success: false, error: error.message };
  }
}

// 执行
main().then(result => {
  process.exit(result.success ? 0 : 1);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
