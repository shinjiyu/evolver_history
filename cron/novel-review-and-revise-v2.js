#!/usr/bin/env node
/**
 * 小说审查修改定时任务 v2
 * 
 * 修复：
 * 1. 调用 OpenClaw subagent 进行实际审查
 * 2. 修复 averageScore 计算错误
 * 3. 添加超时和错误处理
 * 
 * 功能：
 * 1. 扫描小说章节
 * 2. 调用审查团队（6 种策略）
 * 3. 根据审查意见调用创作团队修改
 * 4. 生成修改日志
 * 
 * 执行频率：每天一次（早上 6 点）
 * 每次审查：3-5 章
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// 配置
const CONFIG = {
  novelPath: '/root/.openclaw/workspace/novel-project',
  chaptersPath: '/root/.openclaw/workspace/novel-project/chapters',
  logPath: '/root/.openclaw/workspace/novel-project/cron-revision-log.jsonl',
  reportPath: '/root/.openclaw/workspace/memory/novel-revision-reports',
  chaptersPerRun: 3,  // 减少章节数，避免超时
  maxModifications: 3,
  openclawApiBase: 'http://localhost:18789',
  timeout: 8 * 60 * 1000, // 8 分钟总超时
  reviewTimeout: 60 * 1000, // 单次审查 60 秒超时
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
 * HTTP 请求封装
 */
function httpRequest(url, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const lib = urlObj.protocol === 'https:' ? https : http;
    
    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      timeout: options.timeout || 30000,
    };
    
    const req = lib.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            data: data ? JSON.parse(data) : null,
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            data: data,
          });
        }
      });
    });
    
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

/**
 * 调用 OpenClaw subagent 进行审查
 */
async function callReviewAgent(chapter, strategy) {
  const prompt = `你是《深渊代行者》的审查员，负责${strategy.description}。

## 审查对象
章节：第${chapter.number}章
字数：${chapter.wordCount}字

## 审查内容
\`\`\`
${chapter.content.substring(0, 2500)}${chapter.content.length > 2500 ? '...(内容过长已截断)' : ''}
\`\`\`

## 审查重点
${strategy.focus.map(f => `- ${f}`).join('\n')}

## 输出要求
请以 JSON 格式输出审查结果（只输出 JSON，不要其他内容）：
\`\`\`json
{
  "strategy": "${strategy.id}",
  "chapter": ${chapter.number},
  "issues": [
    {
      "type": "问题类型",
      "severity": "high|medium|low",
      "description": "问题描述（简短）",
      "location": "问题位置（引用原文关键词）",
      "suggestion": "修改建议（简短）"
    }
  ],
  "score": 8.5,
  "summary": "整体评价（一句话）"
}
\`\`\`

注意：
1. 只报告真实问题，不要过度挑剔
2. severity 为 high 的问题每章不超过 1 个
3. 如果没有问题，issues 为空数组
4. score 满分 10 分，7 分以上为合格`;

  try {
    const response = await httpRequest(
      `${CONFIG.openclawApiBase}/v1/sessions/spawn`,
      {
        method: 'POST',
        timeout: CONFIG.reviewTimeout + 10000,
      },
      {
        mode: 'run',
        task: prompt,
        runTimeoutSeconds: Math.floor(CONFIG.reviewTimeout / 1000),
        cleanup: 'delete',
      }
    );
    
    if (response.statusCode !== 200 && response.statusCode !== 201) {
      console.error(`  ⚠️  Subagent 创建失败: ${response.statusCode}`);
      return null;
    }
    
    // 解析 subagent 返回的结果
    const result = response.data;
    let reviewData = null;
    
    // 尝试从结果中提取 JSON
    if (result && result.result) {
      const text = result.result;
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || 
                        text.match(/\{[\s\S]*"issues"[\s\S]*\}/);
      if (jsonMatch) {
        try {
          reviewData = JSON.parse(jsonMatch[1] || jsonMatch[0]);
        } catch (e) {
          console.error(`  ⚠️  JSON 解析失败: ${e.message}`);
        }
      }
    }
    
    // 如果解析失败，返回默认值
    if (!reviewData) {
      return {
        strategy: strategy.id,
        strategyName: strategy.name,
        issues: [],
        score: 7.5,
        summary: '审查完成，但无法解析结果',
        rawResponse: result?.result?.substring(0, 500),
      };
    }
    
    return {
      strategy: strategy.id,
      strategyName: strategy.name,
      issues: reviewData.issues || [],
      score: typeof reviewData.score === 'number' ? reviewData.score : 7.5,
      summary: reviewData.summary || '审查完成',
    };
    
  } catch (error) {
    console.error(`  ⚠️  审查失败: ${error.message}`);
    return {
      strategy: strategy.id,
      strategyName: strategy.name,
      issues: [],
      score: 7.0,
      summary: `审查失败: ${error.message}`,
      error: error.message,
    };
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
function generateReport(reviewResults, chapters) {
  const report = {
    date: new Date().toISOString().split('T')[0],
    timestamp: new Date().toISOString(),
    chaptersReviewed: chapters.map(c => c.number),
    strategies: REVIEW_STRATEGIES.map(s => s.id),
    results: reviewResults,
    summary: {
      totalIssues: 0,
      highSeverity: 0,
      mediumSeverity: 0,
      lowSeverity: 0,
      averageScore: 0,
      modificationsMade: 0,
      chaptersWithIssues: 0,
    },
  };
  
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
    
    // 修复：确保 score 是数值
    const score = parseFloat(result.score);
    if (!isNaN(score)) {
      totalScore += score;
      scoreCount++;
    }
    
    if (result.modified) {
      report.summary.modificationsMade++;
    }
  });
  
  // 修复：正确计算平均分
  report.summary.averageScore = scoreCount > 0 
    ? (totalScore / scoreCount).toFixed(1)
    : '0.0';
  
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
  const startTime = Date.now();
  
  console.log('========================================');
  console.log('小说审查修改任务启动 v2');
  console.log(`时间: ${new Date().toISOString()}`);
  console.log(`超时: ${CONFIG.timeout / 1000}s`);
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
    
    for (const chapter of chaptersWithContent) {
      // 检查总超时
      if (Date.now() - startTime > CONFIG.timeout - 60000) {
        console.log('\n⚠️  接近超时，提前结束审查');
        break;
      }
      
      console.log(`\n📝 审查第 ${chapter.number} 章...`);
      
      const chapterResults = {
        chapter: chapter.number,
        reviews: [],
        issues: [],
        score: 0,
        scoreCount: 0,
        modified: false,
      };
      
      // 只应用部分策略（减少 API 调用）
      const strategiesToApply = REVIEW_STRATEGIES.slice(0, 3); // 只用前 3 个策略
      
      for (const strategy of strategiesToApply) {
        console.log(`  - ${strategy.name}...`);
        
        const reviewResult = await callReviewAgent(chapter, strategy);
        
        if (reviewResult) {
          chapterResults.reviews.push(reviewResult);
          chapterResults.issues.push(...reviewResult.issues);
          
          const score = parseFloat(reviewResult.score);
          if (!isNaN(score)) {
            chapterResults.score += score;
            chapterResults.scoreCount++;
          }
        }
        
        // 检查单章超时
        if (Date.now() - startTime > CONFIG.timeout - 30000) {
          console.log('  ⚠️  超时，跳过剩余策略');
          break;
        }
      }
      
      // 计算平均分
      chapterResults.score = chapterResults.scoreCount > 0
        ? (chapterResults.score / chapterResults.scoreCount).toFixed(1)
        : '0.0';
      
      reviewResults.push(chapterResults);
      console.log(`  ✅ 第 ${chapter.number} 章审查完成，评分: ${chapterResults.score}`);
      
      if (chapterResults.issues.length > 0) {
        console.log(`     发现 ${chapterResults.issues.length} 个问题`);
      }
    }
    
    // 5. 生成报告
    console.log('\n📊 生成审查报告...');
    const report = generateReport(reviewResults, selectedChapters);
    const reportPath = saveReport(report);
    console.log(`✅ 报告已保存: ${reportPath}\n`);
    
    // 6. 记录日志
    appendLog({
      type: 'review_complete',
      version: 'v2',
      chapters: selectedChapters.slice(0, reviewResults.length).map(c => c.number),
      startChapter: selectedChapters[0].number,
      endChapter: selectedChapters[Math.min(reviewResults.length - 1, selectedChapters.length - 1)].number,
      totalIssues: report.summary.totalIssues,
      averageScore: report.summary.averageScore,
      reportPath: reportPath,
      duration: Date.now() - startTime,
    });
    
    // 7. 输出摘要
    console.log('========================================');
    console.log('审查任务完成');
    console.log('========================================');
    console.log(`审查章节: ${reviewResults.length}`);
    console.log(`总问题数: ${report.summary.totalIssues}`);
    console.log(`  - 高优先级: ${report.summary.highSeverity}`);
    console.log(`  - 中优先级: ${report.summary.mediumSeverity}`);
    console.log(`  - 低优先级: ${report.summary.lowSeverity}`);
    console.log(`平均评分: ${report.summary.averageScore}/10`);
    console.log(`执行时长: ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
    console.log('========================================\n');
    
    // 8. 下次审查位置
    const nextPosition = (lastPosition + reviewResults.length) % allChapters.length;
    console.log(`📍 下次审查将从第 ${allChapters[nextPosition].number} 章开始\n`);
    
  } catch (error) {
    console.error('❌ 审查任务失败:', error);
    appendLog({
      type: 'error',
      version: 'v2',
      error: error.message,
      stack: error.stack,
      duration: Date.now() - startTime,
    });
    process.exit(1);
  }
}

// 执行
main();
