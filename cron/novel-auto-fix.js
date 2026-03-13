#!/usr/bin/env node
/**
 * 小说自动修改系统 v2
 * 
 * 功能：
 * 1. 读取章节内容，识别可改进的问题
 * 2. 每次只修复 1-2 个问题（渐进式修改）
 * 3. 创建备份文件
 * 4. 记录修改日志
 * 
 * 执行频率：每 2 小时
 */

const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
  novelPath: '/root/.openclaw/workspace/novel-project',
  chaptersPath: '/root/.openclaw/workspace/novel-project/chapters',
  logPath: '/root/.openclaw/workspace/novel-project/auto-fix-log.jsonl',
  backupDir: '/root/.openclaw/workspace/novel-project/backups',
  issuesPerRun: 2, // 每次修复的问题数量
};

/**
 * 确保备份目录存在
 */
function ensureBackupDir() {
  if (!fs.existsSync(CONFIG.backupDir)) {
    fs.mkdirSync(CONFIG.backupDir, { recursive: true });
  }
}

/**
 * 获取所有章节文件
 */
function getAllChapters() {
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
}

/**
 * 获取上次修改的位置
 */
function getLastFixPosition() {
  try {
    if (!fs.existsSync(CONFIG.logPath)) {
      return 0;
    }

    const logs = fs.readFileSync(CONFIG.logPath, 'utf-8')
      .split('\n')
      .filter(line => line.trim())
      .map(line => JSON.parse(line));
    
    const lastLog = logs[logs.length - 1];
    return lastLog?.chapter || 0;
  } catch (error) {
    return 0;
  }
}

/**
 * 分析章节内容，识别问题
 */
function analyzeChapter(content) {
  const issues = [];
  
  // 1. 重复用词（连续重复）
  const repeatedMatches = content.match(/(\b\w+\b)(\s+\1){2,}/g);
  if (repeatedMatches) {
    issues.push({
      type: 'repeatedWords',
      name: '重复用词',
      severity: 'medium',
      count: repeatedMatches.length,
      examples: repeatedMatches.slice(0, 3),
    });
  }
  
  // 2. 弱表达（过多使用模糊词汇）
  const weakMatches = content.match(/(?:似乎|好像|大概|可能|也许|有点儿|稍微|略微)/g);
  if (weakMatches && weakMatches.length > 3) {
    issues.push({
      type: 'weakExpressions',
      name: '弱表达',
      severity: weakMatches.length > 5 ? 'medium' : 'low', // 超过 5 个就是中严重度
      count: weakMatches.length,
      examples: weakMatches.slice(0, 5),
    });
  }
  
  // 3. 被动语态（过多使用）
  const passiveMatches = content.match(/被.+?[着了]/g);
  if (passiveMatches && passiveMatches.length > 2) {
    issues.push({
      type: 'passiveVoice',
      name: '被动语态',
      severity: 'low',
      count: passiveMatches.length,
      examples: passiveMatches.slice(0, 3),
    });
  }
  
  // 4. 连接词重复（"然后"、"接着"等）
  const connectorMatches = content.match(/(?:然后|接着|于是|因此).{1,30}(?:然后|接着|于是|因此)/g);
  if (connectorMatches) {
    issues.push({
      type: 'connectorRepetition',
      name: '连接词重复',
      severity: 'medium',
      count: connectorMatches.length,
      examples: connectorMatches.slice(0, 2),
    });
  }
  
  // 5. 单调句式（连续短句）
  const shortSentences = content.match(/[^。！？\n]{1,10}[。！？\n]/g);
  if (shortSentences && shortSentences.length > 5) {
    issues.push({
      type: 'shortSentences',
      name: '短句过多',
      severity: 'low',
      count: shortSentences.length,
      examples: shortSentences.slice(0, 5),
    });
  }
  
  // 按严重度排序
  const severityOrder = { high: 3, medium: 2, low: 1 };
  issues.sort((a, b) => {
    const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
    if (severityDiff !== 0) return severityDiff;
    return b.count - a.count;
  });
  
  return issues;
}

/**
 * 创建备份文件
 */
function createBackup(chapter) {
  ensureBackupDir();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(
    CONFIG.backupDir,
    `chapter-${String(chapter.number).padStart(3, '0')}.backup-${timestamp}.md`
  );
  
  fs.copyFileSync(chapter.path, backupPath);
  return backupPath;
}

/**
 * 应用修复
 */
function applyFix(content, issue) {
  let fixed = content;
  let fixCount = 0;
  
  switch (issue.type) {
    case 'repeatedWords':
      // 修复连续重复词
      fixed = fixed.replace(/(\b\w+\b)(\s+\1)+/g, '$1');
      fixCount = issue.count;
      break;
      
    case 'weakExpressions':
      // 减少弱表达（删除一半）
      let weakCount = 0;
      fixed = fixed.replace(/(?:似乎|好像|大概|可能|也许|有点儿|稍微|略微)/g, (match) => {
        weakCount++;
        return weakCount % 2 === 0 ? '' : match;
      });
      fixCount = Math.floor(issue.count / 2);
      break;
      
    case 'passiveVoice':
      // 部分被动改主动（简单版本：标记但不修改）
      fixCount = 0;
      break;
      
    case 'connectorRepetition':
      // 替换部分连接词
      let connectorCount = 0;
      fixed = fixed.replace(/然后/g, (match) => {
        connectorCount++;
        if (connectorCount % 3 === 0) return '随后';
        if (connectorCount % 3 === 1) return '紧接着';
        return match;
      });
      fixCount = Math.floor(connectorCount / 3);
      break;
      
    case 'shortSentences':
      // 合并部分短句（需要更复杂的逻辑）
      fixCount = 0;
      break;
      
    default:
      fixCount = 0;
  }
  
  return { fixed, fixCount };
}

/**
 * 记录修改日志
 */
function logFix(chapter, issues, fixes, backupPath) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    chapter: chapter.number,
    issuesFound: issues.length,
    issuesFixed: fixes.length,
    issues: issues.slice(0, 5).map(i => ({
      type: i.type,
      name: i.name,
      severity: i.severity,
      count: i.count,
    })),
    fixes: fixes,
    backupPath: backupPath,
  };
  
  const logLine = JSON.stringify(logEntry) + '\n';
  fs.appendFileSync(CONFIG.logPath, logLine, 'utf-8');
  
  return logEntry;
}

/**
 * 主函数
 */
async function main() {
  console.log('=== 小说自动修改系统 v2 ===');
  console.log(`执行时间: ${new Date().toISOString()}`);
  
  // 获取所有章节
  const chapters = getAllChapters();
  console.log(`找到 ${chapters.length} 个章节`);
  
  // 获取上次修改位置
  const lastPosition = getLastFixPosition();
  console.log(`上次修改位置: 第 ${lastPosition} 章`);
  
  // 找到下一个要修改的章节
  const nextChapterIndex = chapters.findIndex(c => c.number > lastPosition);
  const chapter = nextChapterIndex === -1 ? chapters[0] : chapters[nextChapterIndex];
  
  console.log(`\n处理章节: 第 ${chapter.number} 章`);
  
  // 读取章节内容
  const content = fs.readFileSync(chapter.path, 'utf-8');
  
  // 分析问题
  const issues = analyzeChapter(content);
  console.log(`发现问题: ${issues.length} 个`);
  
  if (issues.length === 0) {
    console.log('✅ 未发现问题，跳过');
    const logEntry = {
      timestamp: new Date().toISOString(),
      chapter: chapter.number,
      issuesFound: 0,
      issuesFixed: 0,
      issues: [],
      fixes: [],
      backupPath: null,
    };
    const logLine = JSON.stringify(logEntry) + '\n';
    fs.appendFileSync(CONFIG.logPath, logLine, 'utf-8');
    return;
  }
  
  // 显示问题
  console.log('\n问题列表:');
  issues.forEach((issue, i) => {
    console.log(`  ${i + 1}. [${issue.severity}] ${issue.name} (${issue.count} 处)`);
    if (issue.examples && issue.examples.length > 0) {
      console.log(`     示例: ${issue.examples.slice(0, 2).join(', ')}`);
    }
  });
  
  // 选择要修复的问题（最多 2 个，优先中/高严重度）
  const issuesToFix = issues
    .filter(i => i.severity === 'high' || i.severity === 'medium')
    .slice(0, CONFIG.issuesPerRun);
  
  if (issuesToFix.length === 0) {
    console.log('\n✅ 没有高/中严重度问题需要修复');
    const logEntry = {
      timestamp: new Date().toISOString(),
      chapter: chapter.number,
      issuesFound: issues.length,
      issuesFixed: 0,
      issues: issues.slice(0, 3),
      fixes: [],
      backupPath: null,
    };
    const logLine = JSON.stringify(logEntry) + '\n';
    fs.appendFileSync(CONFIG.logPath, logLine, 'utf-8');
    return;
  }
  
  console.log(`\n将修复 ${issuesToFix.length} 个问题`);
  
  // 创建备份
  const backupPath = createBackup(chapter);
  console.log(`✅ 备份已创建: ${backupPath}`);
  
  // 应用修复
  let fixedContent = content;
  const fixes = [];
  
  for (const issue of issuesToFix) {
    console.log(`\n修复: ${issue.name}`);
    const result = applyFix(fixedContent, issue);
    if (result.fixCount > 0) {
      fixedContent = result.fixed;
      fixes.push({
        type: issue.type,
        name: issue.name,
        count: result.fixCount,
      });
      console.log(`  ✅ 修复了 ${result.fixCount} 处`);
    } else {
      console.log(`  ⚠️  该问题需要人工修复`);
    }
  }
  
  // 保存修改
  if (fixes.length > 0) {
    fs.writeFileSync(chapter.path, fixedContent, 'utf-8');
    console.log(`\n✅ 章节已更新: ${chapter.filename}`);
  }
  
  // 记录日志
  const logEntry = logFix(chapter, issues, fixes, backupPath);
  console.log(`\n✅ 日志已记录: ${CONFIG.logPath}`);
  
  console.log('\n=== 修改摘要 ===');
  console.log(`章节: 第 ${chapter.number} 章`);
  console.log(`发现问题: ${issues.length} 个`);
  console.log(`修复问题: ${fixes.length} 个`);
  if (fixes.length > 0) {
    fixes.forEach((fix, i) => {
      console.log(`  ${i + 1}. ${fix.name}: ${fix.count} 处`);
    });
  }
  console.log(`备份文件: ${backupPath}`);
}

// 执行
main().catch(error => {
  console.error('❌ 执行失败:', error);
  process.exit(1);
});
