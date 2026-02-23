#!/usr/bin/env node
/**
 * 🤪 混沌代理 (Chaos Agent)
 * 每 5 分钟随机向安全文件插入荒谬内容
 */

const fs = require('fs');
const path = require('path');

// 引用库
const quotesData = require('./quotes.json');
const quotes = quotesData.quotes;

// 安全的目标目录
const TARGET_DIRS = [
  '/root/.openclaw/workspace/memory',
  '/root/.openclaw/workspace/logs',
  '/root/.openclaw/workspace/novel-project',
  '/root/.openclaw/workspace/evolver',
  '/root/.openclaw/workspace/autonomous-exploration/logs'
];

// 排除的文件模式
const EXCLUDE_PATTERNS = [
  /\.json$/,
  /\.js$/,
  /\.yaml$/,
  /\.yml$/,
  /package-lock/,
  /node_modules/,
  /\.git/
];

// 受保护的文件（绝对不能改）
const PROTECTED_FILES = [
  'MEMORY.md',      // 长期记忆
  'HEARTBEAT.md',   // 心跳配置
  'AGENTS.md',      // Agent 配置
  'SOUL.md',        // 灵魂文件
  'USER.md',        // 用户信息
  'TOOLS.md'        // 工具配置
];

// 日志文件
const CHAOS_LOG = '/root/.openclaw/workspace/chaos-agent/chaos.log';

// 获取所有可修改的文件
function getTargetFiles() {
  const files = [];

  for (const dir of TARGET_DIRS) {
    if (!fs.existsSync(dir)) continue;

    try {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        
        try {
          const stat = fs.statSync(fullPath);

          // 只选择文件
          if (!stat.isFile()) continue;

          // 排除特定模式
          if (EXCLUDE_PATTERNS.some(p => p.test(fullPath))) continue;

          // 排除受保护文件
          if (PROTECTED_FILES.some(p => fullPath.includes(p))) continue;

          // 只选择文本文件（通过扩展名判断）
          if (/\.(md|log|txt|markdown)$/i.test(fullPath)) {
            files.push(fullPath);
          }
        } catch (e) {
          // 跳过无法访问的文件
          continue;
        }
      }
    } catch (e) {
      // 跳过无法读取的目录
      continue;
    }
  }

  return files;
}

// 随机选择一个文件
function selectRandomFile(files) {
  const index = Math.floor(Math.random() * files.length);
  return files[index];
}

// 随机选择 1-3 条引用
function selectRandomQuotes() {
  const count = Math.floor(Math.random() * 3) + 1;
  const selected = [];
  const usedIndices = new Set();

  while (selected.length < count && selected.length < quotes.length) {
    const index = Math.floor(Math.random() * quotes.length);
    if (!usedIndices.has(index)) {
      usedIndices.add(index);
      selected.push(quotes[index]);
    }
  }

  return selected;
}

// 插入内容到文件
function insertContent(filePath, selectedQuotes) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    // 随机选择插入位置
    const insertMethod = quotesData.insertionPoints[Math.floor(Math.random() * quotesData.insertionPoints.length)];

    let insertIndex;
    switch (insertMethod) {
      case '开头':
        insertIndex = 0;
        break;
      case '结尾':
        insertIndex = lines.length;
        break;
      case '中间':
        insertIndex = Math.floor(lines.length / 2);
        break;
      case '随机行':
      default:
        insertIndex = Math.floor(Math.random() * Math.max(1, lines.length));
        break;
    }

    // 构建插入内容
    const chaosContent = [
      '',
      '<!-- 🤪 混沌代理路过 -->',
      ...selectedQuotes.map(q => `<!-- ${q} -->`),
      '<!-- 🎭 混沌结束 -->',
      ''
    ].join('\n');

    // 插入内容
    lines.splice(insertIndex, 0, chaosContent);

    // 写回文件
    fs.writeFileSync(filePath, lines.join('\n'), 'utf8');

    return {
      success: true,
      file: filePath,
      position: insertMethod,
      quotes: selectedQuotes
    };
  } catch (error) {
    return {
      success: false,
      file: filePath,
      error: error.message
    };
  }
}

// 记录混沌日志
function logChaos(result) {
  const timestamp = new Date().toISOString();
  const logEntry = result.success
    ? `[${timestamp}] 😈 成功污染 ${result.file}\n` +
      `  位置: ${result.position}\n` +
      `  内容: ${result.quotes.join(' | ')}\n\n`
    : `[${timestamp}] ❌ 失败: ${result.file} - ${result.error}\n\n`;

  try {
    fs.appendFileSync(CHAOS_LOG, logEntry, 'utf8');
    console.log(logEntry.trim());
  } catch (e) {
    console.error('无法写入日志:', e.message);
  }
}

// 主函数
async function main() {
  console.log('🤪 混沌代理启动...');
  console.log(`⏰ 时间: ${new Date().toISOString()}`);

  // 1. 获取目标文件
  const files = getTargetFiles();

  if (files.length === 0) {
    console.log('😴 没有找到可恶作剧的文件');
    return { success: false, reason: 'no_targets' };
  }

  console.log(`📂 发现 ${files.length} 个潜在目标`);

  // 2. 随机选择文件
  const targetFile = selectRandomFile(files);
  console.log(`🎯 目标锁定: ${targetFile}`);

  // 3. 随机选择引用
  const selectedQuotes = selectRandomQuotes();
  console.log(`💬 准备插入 ${selectedQuotes.length} 条混沌内容`);
  selectedQuotes.forEach((q, i) => console.log(`   ${i + 1}. ${q}`));

  // 4. 插入内容
  const result = insertContent(targetFile, selectedQuotes);

  // 5. 记录日志
  logChaos(result);

  // 6. 统计
  if (result.success) {
    console.log('✅ 混沌植入成功！');
    console.log('🌍 世界又多了一点点混乱...');
  } else {
    console.log('❌ 混沌植入失败，正义暂时获胜');
  }

  return result;
}

// 执行
if (require.main === module) {
  main().catch(err => {
    console.error('💥 混沌代理崩溃:', err);
    process.exit(1);
  });
}

module.exports = { main, getTargetFiles, selectRandomQuotes, insertContent };
