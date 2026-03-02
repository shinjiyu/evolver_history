#!/usr/bin/env node
/**
 * 小说审查修改定时任务 v3（实用版）
 * 
 * 修复：
 * 1. 修复 averageScore 计算错误
 * 2. 明确标注"模拟模式"
 * 3. 生成可执行的审查提示词
 * 4. 记录需要人工审查的章节
 * 
 * 说明：
 * - 由于没有可用的 LLM API key，本脚本采用"模拟模式"
 * - 生成的提示词保存到文件，可用于后续人工审查
 * - 如果配置了 API key，可以切换到"实际审查模式"
 * 
 * 执行频率：每天一次（早上 6 点）
 * 每次审查：3-5 章
 */

const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
  novelPath: '/root/.openclaw/workspace/novel-project',
  chaptersPath: '/root/.openclaw/workspace/novel-project/chapters',
  logPath: '/root/.openclaw/workspace/novel-project/cron-revision-log.jsonl',
  reportPath: '/root/.openclaw/workspace/memory/novel-revision-reports',
  promptsPath: '/root/.openclaw/workspace/memory/novel-review-prompts',
  chaptersPerRun: 4,
  maxModifications: 3,
  mode: 'simulation', // 'simulation' 或 'real'（需要 API key）
};

// 审查策略定义
const REVIEW_STRATEGIES = [
  {
    id: 'S1',
    name: '逻辑审查',
    description: '检查因果关系和时间线',
    focus: ['因果关系', '时间线', '伏笔回收', '逻辑跳跃'],
  },
  {
    id: 'S2',
    name: '人物审查',
    description: '检查人物行为一致性和动机',
    focus: ['行为一致性', '动机合理性', '人物弧光', '对话真实性'],
  },
  {
    id: 'S3',
    name: '用词审查',
    description: '统计高频词，标记重复',
    focus: ['高频词', '陈词滥调', '用词重复', '表达单一'],
  },
  {
    id: 'S4',
    name: '节奏审查',
    description: '分析每章的情绪曲线',
    focus: ['开场吸引力', '中段节奏', '高潮强度', '结尾钩子'],
  },
  {
    id: 'S5',
    name: '疯子审查',
    description: '用疯子思维攻击剧情',
    focus: ['剧情漏洞', '设定问题', '主角光环', '不合理行为'],
  },
  {
    id: 'S6',
    name: '审计员审查',
    description: '严谨检查可疑点',
    focus: ['可疑点', '未解释现象', '矛盾之处', '缺失细节'],
  },
];

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
 * 获取上次审查的位置
 */
function getLastReviewPosition() {
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
    return lastLog.endChapter || 0;
  } catch (error) {
    console.error('读取日志失败:', error.message);
    return 0;
  }
}

/**
 * 选择本次要审查的章节
 */
function selectChaptersToReview(allChapters, startPosition) {
  const startIndex = startPosition % allChapters.length;
  const selected = [];
  
  for (let i = 0; i < CONFIG.chaptersPerRun; i++) {
    const index = (startIndex + i) % allChapters.length;
    selected.push(allChapters[index]);
  }
  
  return selected;
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
 * 生成审查提示词
 */
function generateReviewPrompt(chapter, strategy) {
  return `你是《深渊代行者》的审查员，负责${strategy.description}。

## 审查对象
章节：第${chapter.number}章
字数：${chapter.wordCount}字

## 审查内容
\`\`\`
${chapter.content.substring(0, 3000)}${chapter.content.length > 3000 ? '...' : ''}
\`\`\`

## 审查重点
${strategy.focus.map(f => `- ${f}`).join('\n')}

## 输出要求
请以 JSON 格式输出审查结果：
\`\`\`json
{
  "strategy": "${strategy.id}",
  "chapter": ${chapter.number},
  "issues": [
    {
      "type": "问题类型",
      "severity": "high|medium|low",
      "description": "问题描述",
      "location": "问题位置（引用原文）",
      "suggestion": "修改建议"
    }
  ],
  "score": 8.5,
  "summary": "整体评价"
}
\`\`\`

注意：
1. 只报告真实问题，不要过度挑剔
2. severity 为 high 的问题每章不超过 2 个
3. 修改建议要具体可执行
4. score 满分 10 分，7 分以上为合格`;
}

/**
 * 保存审查提示词（用于人工审查）
 */
function saveReviewPrompts(chapter, prompts) {
  if (!fs.existsSync(CONFIG.promptsPath)) {
    fs.mkdirSync(CONFIG.promptsPath, { recursive: true });
  }
  
  const filename = `review-ch${String(chapter.number).padStart(3, '0')}-${Date.now()}.md`;
  const filepath = path.join(CONFIG.promptsPath, filename);
  
  const content = `# 第${chapter.number}章审查提示词

**生成时间**: ${new Date().toISOString()}
**模式**: ${CONFIG.mode === 'simulation' ? '模拟模式（需人工审查）' : '实际审查模式'}

---

${prompts.map((p, i) => `## 审查策略 ${i + 1}: ${p.strategyName}

\`\`\`
${p.prompt}
\`\`\`

`).join('\n---\n\n')}

---

## 使用说明

1. 复制上述提示词
2. 粘贴到 LLM（如 ChatGPT、Claude 等）
3. 获取审查结果
4. 根据审查结果修改章节
`;
  
  fs.writeFileSync(filepath, content, 'utf-8');
  return filepath;
}

/**
 * 记录日志
 */
function appendLog(logEntry) {
  const logLine = JSON.stringify({
    ...logEntry,
    timestamp: new Date().toISOString(),
  }) + '\n';
  
  fs.appendFileSync(CONFIG.logPath, logLine, 'utf-8');
}

/**
 * 生成审查报告
 */
function generateReport(reviewResults, chapters, promptsSaved) {
  const report = {
    date: new Date().toISOString().split('T')[0],
    timestamp: new Date().toISOString(),
    mode: CONFIG.mode,
    modeDescription: CONFIG.mode === 'simulation' 
      ? '模拟模式：生成提示词，需人工审查' 
      : '实际审查模式：自动调用 LLM',
    chaptersReviewed: chapters.map(c => c.number),
    strategies: REVIEW_STRATEGIES.map(s => s.id),
    promptsSaved: promptsSaved,
    results: reviewResults,
    summary: {
      totalIssues: 0,
      highSeverity: 0,
      mediumSeverity: 0,
      lowSeverity: 0,
      averageScore: 0,
      modificationsMade: 0,
      chaptersWithIssues: 0,
      note: CONFIG.mode === 'simulation' 
        ? '模拟模式：所有评分为默认值，需人工审查获取实际结果'
        : '',
    },
  };
  
  // 统计问题
  let totalScore = 0;
  let scoreCount = 0;
  
  reviewResults.forEach(result => {
    if (result.issues && result.issues.length > 0) {
      report.summary.chaptersWithIssues++;
      result.issues.forEach(issue => {
        report.summary.totalIssues++;
        if (issue.severity === 'high') report.summary.highSeverity++;
        else if (issue.severity === 'medium') report.summary.mediumSeverity++;
        else report.summary.lowSeverity++;
      });
    }
    
    // 修复：确保 score 是数值再累加
    const score = parseFloat(result.score);
    if (!isNaN(score)) {
      totalScore += score;
      scoreCount++;
    }
    
    if (result.modified) {
      report.summary.modificationsMade++;
    }
  });
  
  // 修复：正确计算平均分，避免 NaN
  report.summary.averageScore = scoreCount > 0 
    ? parseFloat((totalScore / scoreCount).toFixed(1))
    : 0.0;
  
  return report;
}

/**
 * 保存报告
 */
function saveReport(report) {
  if (!fs.existsSync(CONFIG.reportPath)) {
    fs.mkdirSync(CONFIG.reportPath, { recursive: true });
  }
  
  const filename = `review-${report.date}-${Date.now()}.json`;
  const filepath = path.join(CONFIG.reportPath, filename);
  
  fs.writeFileSync(filepath, JSON.stringify(report, null, 2), 'utf-8');
  
  return filepath;
}

/**
 * 主执行函数
 */
async function main() {
  console.log('========================================');
  console.log('小说审查修改任务启动 v3');
  console.log(`时间: ${new Date().toISOString()}`);
  console.log(`模式: ${CONFIG.mode === 'simulation' ? '模拟（需人工审查）' : '实际审查'}`);
  console.log('========================================\n');
  
  try {
    // 1. 获取所有章节
    const allChapters = getAllChapters();
    console.log(`📚 发现 ${allChapters.length} 个章节\n`);
    
    if (allChapters.length === 0) {
      console.log('❌ 没有找到章节文件');
      return;
    }
    
    // 2. 选择本次要审查的章节
    const lastPosition = getLastReviewPosition();
    const selectedChapters = selectChaptersToReview(allChapters, lastPosition);
    console.log(`📖 本次审查章节: ${selectedChapters.map(c => c.number).join(', ')}\n`);
    
    // 3. 读取章节内容
    const chaptersWithContent = selectedChapters
      .map(readChapterContent)
      .filter(c => c !== null);
    
    if (chaptersWithContent.length === 0) {
      console.log('❌ 没有可用的章节内容');
      return;
    }
    
    // 4. 执行审查
    console.log('🔍 开始审查...\n');
    const reviewResults = [];
    const promptsSaved = [];
    
    for (const chapter of chaptersWithContent) {
      console.log(`\n📝 审查第 ${chapter.number} 章...`);
      
      const chapterResults = {
        chapter: chapter.number,
        reviews: [],
        issues: [],
        score: 0,
        modified: false,
      };
      
      const chapterPrompts = [];
      
      for (const strategy of REVIEW_STRATEGIES) {
        console.log(`  - ${strategy.name}...`);
        
        // 生成审查提示词
        const prompt = generateReviewPrompt(chapter, strategy);
        chapterPrompts.push({
          strategy: strategy.id,
          strategyName: strategy.name,
          prompt: prompt,
        });
        
        // 模拟审查结果（实际应调用 LLM）
        if (CONFIG.mode === 'simulation') {
          const reviewResult = {
            strategy: strategy.id,
            strategyName: strategy.name,
            issues: [],
            score: 8.0,
            summary: '模拟审查：需人工审查获取实际结果',
            mode: 'simulation',
          };
          
          chapterResults.reviews.push(reviewResult);
          chapterResults.issues.push(...reviewResult.issues);
          chapterResults.score += reviewResult.score;
        } else {
          // TODO: 实际调用 LLM API
          console.log(`    ⚠️  实际审查模式未实现`);
        }
      }
      
      // 计算平均分
      chapterResults.score = 
        (chapterResults.score / REVIEW_STRATEGIES.length).toFixed(1);
      
      // 5. 保存审查提示词（用于人工审查）
      const promptsFile = saveReviewPrompts(chapter, chapterPrompts);
      promptsSaved.push({
        chapter: chapter.number,
        file: promptsFile,
      });
      console.log(`  📝 提示词已保存: ${promptsFile}`);
      
      reviewResults.push(chapterResults);
      console.log(`  ✅ 第 ${chapter.number} 章审查完成，评分: ${chapterResults.score}`);
    }
    
    // 6. 生成报告
    console.log('\n📊 生成审查报告...');
    const report = generateReport(reviewResults, selectedChapters, promptsSaved);
    const reportPath = saveReport(report);
    console.log(`✅ 报告已保存: ${reportPath}\n`);
    
    // 7. 记录日志
    appendLog({
      type: 'review_complete',
      version: 'v3',
      mode: CONFIG.mode,
      chapters: selectedChapters.map(c => c.number),
      startChapter: selectedChapters[0].number,
      endChapter: selectedChapters[selectedChapters.length - 1].number,
      totalIssues: report.summary.totalIssues,
      averageScore: report.summary.averageScore,
      reportPath: reportPath,
      promptsSaved: promptsSaved.length,
    });
    
    // 8. 输出摘要
    console.log('========================================');
    console.log('审查任务完成');
    console.log('========================================');
    console.log(`模式: ${CONFIG.mode === 'simulation' ? '模拟（需人工审查）' : '实际审查'}`);
    console.log(`章节范围: ${selectedChapters[0].number} - ${selectedChapters[selectedChapters.length - 1].number}`);
    console.log(`总问题数: ${report.summary.totalIssues}（模拟值）`);
    console.log(`平均评分: ${report.summary.averageScore}/10（模拟值）`);
    console.log(`提示词文件: ${promptsSaved.length} 个`);
    console.log(`报告路径: ${reportPath}`);
    console.log('========================================\n');
    
    // 9. 下次审查位置
    const nextPosition = (lastPosition + CONFIG.chaptersPerRun) % allChapters.length;
    console.log(`📍 下次审查将从第 ${allChapters[nextPosition].number} 章开始\n`);
    
    // 10. 提示人工审查
    if (CONFIG.mode === 'simulation') {
      console.log('⚠️  当前为模拟模式，请执行以下步骤进行实际审查：');
      console.log('1. 查看提示词文件：', CONFIG.promptsPath);
      console.log('2. 复制提示词到 LLM（如 ChatGPT、Claude 等）');
      console.log('3. 根据审查结果修改章节');
      console.log('4. 配置 API key 后可启用实际审查模式\n');
    }
    
  } catch (error) {
    console.error('❌ 审查任务失败:', error);
    appendLog({
      type: 'error',
      version: 'v3',
      error: error.message,
      stack: error.stack,
    });
    process.exit(1);
  }
}

// 执行
main();
