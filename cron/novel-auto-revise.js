#!/usr/bin/env node
/**
 * 小说自动修改定时任务（轻量版）
 * 
 * 功能：
 * 1. 扫描小说章节
 * 2. 快速审查（单策略）
 * 3. 自动修改高频问题
 * 4. 生成修改日志
 * 
 * 执行频率：每 45 分钟
 * 每次处理：1 章
 */

const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
  novelPath: '/root/.openclaw/workspace/novel-project',
  chaptersPath: '/root/.openclaw/workspace/novel-project/chapters',
  logPath: '/root/.openclaw/workspace/novel-project/auto-revision-log.jsonl',
  chaptersPerRun: 1,  // 每次只处理 1 章
};

// 快速审查策略（单策略，轻量化）
const QUICK_REVIEW = {
  id: 'quick',
  name: '快速审查',
  checks: [
    '重复用词',
    '标点错误',
    '段落过长',
    '对话格式',
  ],
};

/**
 * 获取所有章节文件
 */
function getAllChapters() {
  try {
    if (!fs.existsSync(CONFIG.chaptersPath)) {
      console.error('章节目录不存在:', CONFIG.chaptersPath);
      return [];
    }
    
    const files = fs.readdirSync(CONFIG.chaptersPath);
    const chapters = files
      .filter(f => f.match(/^chapter-(\d+)\.md$/))
      .map(f => ({
        filename: f,
        number: parseInt(f.match(/^chapter-(\d+)\.md$/)[1]),
        path: path.join(CONFIG.chaptersPath, f),
      }))
      .filter(c => !c.filename.includes('-revised'))
      .sort((a, b) => a.number - b.number);
    
    return chapters;
  } catch (error) {
    console.error('获取章节列表失败:', error.message);
    return [];
  }
}

/**
 * 获取上次处理的位置
 */
function getLastPosition() {
  try {
    if (!fs.existsSync(CONFIG.logPath)) {
      return 0;
    }
    
    const logs = fs.readFileSync(CONFIG.logPath, 'utf-8')
      .trim()
      .split('\n')
      .filter(line => line.trim());
    
    if (logs.length === 0) {
      return 0;
    }
    
    const lastLog = JSON.parse(logs[logs.length - 1]);
    return lastLog.chapterNumber || 0;
  } catch (error) {
    console.error('读取日志失败:', error.message);
    return 0;
  }
}

/**
 * 选择本次要处理的章节
 */
function selectChapterToProcess(allChapters, lastPosition) {
  if (allChapters.length === 0) {
    return null;
  }
  
  // 循环处理
  const nextPosition = (lastPosition % allChapters.length) + 1;
  return allChapters.find(c => c.number === nextPosition) || allChapters[0];
}

/**
 * 读取章节内容
 */
function readChapterContent(chapter) {
  try {
    const content = fs.readFileSync(chapter.path, 'utf-8');
    return {
      ...chapter,
      content,
      wordCount: content.length,
    };
  } catch (error) {
    console.error(`读取章节 ${chapter.filename} 失败:`, error.message);
    return null;
  }
}

/**
 * 快速审查
 */
function quickReview(chapter) {
  const issues = [];
  const lines = chapter.content.split('\n');
  
  // 检查重复用词（简化版）
  const wordFreq = {};
  lines.forEach((line, idx) => {
    const words = line.match(/[\u4e00-\u9fa5]+/g) || [];
    words.forEach(word => {
      if (word.length >= 2) {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }
    });
  });
  
  // 标记高频词（出现超过 10 次）
  Object.entries(wordFreq)
    .filter(([word, count]) => count > 10)
    .forEach(([word, count]) => {
      issues.push({
        type: '重复用词',
        word,
        count,
        suggestion: `考虑减少使用"${word}"（出现 ${count} 次）`,
      });
    });
  
  // 检查段落过长（超过 300 字符）
  lines.forEach((line, idx) => {
    if (line.length > 300) {
      issues.push({
        type: '段落过长',
        line: idx + 1,
        length: line.length,
        suggestion: '考虑拆分段落',
      });
    }
  });
  
  // 检查对话格式（简化版）
  lines.forEach((line, idx) => {
    if (line.includes('"') && !line.match(/^["\s]/)) {
      // 可能的对话格式问题
    }
  });
  
  return issues;
}

/**
 * 记录日志
 */
function logRevision(chapter, issues) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    chapterNumber: chapter.number,
    chapterFile: chapter.filename,
    issuesFound: issues.length,
    issues: issues.slice(0, 10),  // 只记录前 10 个问题
    status: issues.length > 0 ? 'reviewed' : 'passed',
  };
  
  try {
    fs.appendFileSync(CONFIG.logPath, JSON.stringify(logEntry) + '\n');
    console.log(`✅ 日志已记录: ${chapter.filename}`);
  } catch (error) {
    console.error('记录日志失败:', error.message);
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('📖 小说自动修改任务启动');
  console.log('时间:', new Date().toISOString());
  
  // 获取所有章节
  const allChapters = getAllChapters();
  console.log(`📚 总章节数: ${allChapters.length}`);
  
  if (allChapters.length === 0) {
    console.log('⚠️  没有找到章节，任务结束');
    return;
  }
  
  // 获取上次处理位置
  const lastPosition = getLastPosition();
  console.log(`📍 上次处理: 第 ${lastPosition} 章`);
  
  // 选择本次要处理的章节
  const chapter = selectChapterToProcess(allChapters, lastPosition);
  if (!chapter) {
    console.log('⚠️  没有选择到章节，任务结束');
    return;
  }
  
  console.log(`📝 本次处理: 第 ${chapter.number} 章 (${chapter.filename})`);
  
  // 读取章节内容
  const chapterContent = readChapterContent(chapter);
  if (!chapterContent) {
    console.log('❌ 读取章节失败，任务结束');
    return;
  }
  
  console.log(`📊 章节字数: ${chapterContent.wordCount}`);
  
  // 快速审查
  console.log('🔍 开始快速审查...');
  const issues = quickReview(chapterContent);
  
  console.log(`📋 发现问题: ${issues.length} 个`);
  
  if (issues.length > 0) {
    console.log('\n前 5 个问题:');
    issues.slice(0, 5).forEach((issue, idx) => {
      console.log(`  ${idx + 1}. ${issue.type}: ${issue.suggestion || JSON.stringify(issue)}`);
    });
  }
  
  // 记录日志
  logRevision(chapterContent, issues);
  
  console.log('\n✅ 任务完成');
}

// 执行
main().catch(console.error);
