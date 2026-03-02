#!/usr/bin/env node
/**
 * 小说自动评审执行器
 * 
 * 功能：
 * 1. 生成评审任务
 * 2. 使用 subagent 进行实际评审
 * 3. 收集评审结果
 * 4. 应用修改（如有）
 */

const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
  novelDir: '/root/.openclaw/workspace/novel-project/chapters',
  reviewDir: '/root/.openclaw/workspace/memory/novel-reviews',
  taskFile: '/root/.openclaw/workspace/memory/novel-reviews/review-task.json',
  promptFile: '/root/.openclaw/workspace/memory/novel-reviews/current-prompt.md',
};

/**
 * 读取评审任务
 */
function readTask() {
  try {
    if (fs.existsSync(CONFIG.taskFile)) {
      return JSON.parse(fs.readFileSync(CONFIG.taskFile, 'utf8'));
    }
  } catch (e) {
    console.error('读取任务文件失败:', e.message);
  }
  return null;
}

/**
 * 读取评审提示词
 */
function readPrompt() {
  try {
    if (fs.existsSync(CONFIG.promptFile)) {
      return fs.readFileSync(CONFIG.promptFile, 'utf8');
    }
  } catch (e) {
    console.error('读取提示词文件失败:', e.message);
  }
  return null;
}

/**
 * 为 subagent 生成评审提示词
 */
function generateSubagentPrompt(task, prompt, roleIndex) {
  const role = task.hrCommand.teamRoles[roleIndex];
  const [roleName, roleDesc] = role.split(' - ');
  
  return `你是一位专业的小说评审员。

## 你的角色
**${roleName}**
${roleDesc}

## 评审任务
**模式**: ${task.mode.name}
**描述**: ${task.mode.description}
**章节**: 第${task.chapters.join('章, 第')}章

## 评审内容
${prompt}

## 输出要求
请以 JSON 格式输出评审结果：
\`\`\`json
{
  "role": "${roleName}",
  "findings": [
    {
      "type": "问题类型",
      "location": "章节位置",
      "description": "问题描述",
      "severity": "high/medium/low",
      "suggestion": "修改建议"
    }
  ],
  "overallScore": {
    "维度1": 8,
    "维度2": 7
  },
  "summary": "总体评价"
}
\`\`\`

请开始评审：`;
}

/**
 * 生成汇总提示词
 */
function generateSummaryPrompt(task, reviews) {
  return `你是评审团队的主编，负责汇总各位评审员的意见。

## 评审模式
**${task.mode.name}**: ${task.mode.description}

## 评审章节
第${task.chapters.join('章, 第')}章

## 各评审员意见
${reviews.map((r, i) => `
### ${task.hrCommand.teamRoles[i]}
${r}
`).join('\n')}

## 汇总要求
1. 整合所有评审员发现的问题
2. 去除重复问题
3. 按严重程度排序
4. 提出统一的修改方案
5. 生成最终评分

## 输出格式
\`\`\`json
{
  "summary": {
    "totalIssues": 数字,
    "highSeverity": 数字,
    "mediumSeverity": 数字,
    "lowSeverity": 数字
  },
  "consolidatedFindings": [
    {
      "type": "问题类型",
      "location": "章节位置",
      "description": "问题描述",
      "severity": "high/medium/low",
      "suggestion": "修改建议",
      "agreedBy": ["评审员1", "评审员2"]
    }
  ],
  "overallScore": {
    "连贯性": 8,
    "一致性": 7
  },
  "recommendedActions": [
    "行动1",
    "行动2"
  ],
  "shouldRevise": true/false
}
\`\`\`

请开始汇总：`;
}

/**
 * 保存评审结果
 */
function saveReviewResult(task, summary, reviews) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `review-result-${task.mode.id}-${timestamp}.md`;
  const filepath = path.join(CONFIG.reviewDir, filename);
  
  let content = `# ${task.mode.name} - 评审报告\n\n`;
  content += `**时间**: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}\n\n`;
  content += `**模式**: ${task.mode.description}\n\n`;
  content += `**章节**: 第${task.chapters.join('章, 第')}章\n\n`;
  content += `---\n\n`;
  
  content += `## 📊 评审汇总\n\n`;
  if (summary.summary) {
    content += `- 总问题数: ${summary.summary.totalIssues || 0}\n`;
    content += `- 高严重度: ${summary.summary.highSeverity || 0}\n`;
    content += `- 中严重度: ${summary.summary.mediumSeverity || 0}\n`;
    content += `- 低严重度: ${summary.summary.lowSeverity || 0}\n\n`;
  }
  
  if (summary.overallScore) {
    content += `### 评分\n\n`;
    for (const [key, value] of Object.entries(summary.overallScore)) {
      content += `- ${key}: ${value}/10\n`;
    }
    content += '\n';
  }
  
  if (summary.consolidatedFindings && summary.consolidatedFindings.length > 0) {
    content += `## 🔍 发现的问题\n\n`;
    summary.consolidatedFindings.forEach((finding, i) => {
      content += `### ${i + 1}. ${finding.type}\n\n`;
      content += `- **位置**: ${finding.location}\n`;
      content += `- **描述**: ${finding.description}\n`;
      content += `- **严重程度**: ${finding.severity}\n`;
      content += `- **修改建议**: ${finding.suggestion}\n`;
      if (finding.agreedBy) {
        content += `- **认同者**: ${finding.agreedBy.join(', ')}\n`;
      }
      content += '\n';
    });
  }
  
  if (summary.recommendedActions && summary.recommendedActions.length > 0) {
    content += `## ✅ 推荐行动\n\n`;
    summary.recommendedActions.forEach((action, i) => {
      content += `${i + 1}. ${action}\n`;
    });
    content += '\n';
  }
  
  content += `## 📝 各评审员意见\n\n`;
  reviews.forEach((review, i) => {
    content += `### ${task.hrCommand.teamRoles[i]}\n\n`;
    content += review + '\n\n';
  });
  
  content += `---\n\n`;
  content += `**是否需要修订**: ${summary.shouldRevise ? '是' : '否'}\n`;
  
  fs.writeFileSync(filepath, content);
  console.log(`评审报告已保存: ${filename}`);
  
  return filepath;
}

/**
 * 主函数
 */
async function main() {
  console.log('=== 小说自动评审执行器 ===');
  console.log(`时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}\n`);
  
  // 读取任务
  const task = readTask();
  if (!task) {
    console.log('错误: 没有找到评审任务');
    console.log('请先运行 novel-auto-review.js 生成任务');
    return;
  }
  
  // 读取提示词
  const prompt = readPrompt();
  if (!prompt) {
    console.log('错误: 没有找到评审提示词');
    return;
  }
  
  console.log(`评审模式: ${task.mode.name}`);
  console.log(`评审章节: 第${task.chapters.join('章, 第')}章`);
  console.log(`团队角色: ${task.hrCommand.teamRoles.length}人\n`);
  
  // 生成各角色的提示词
  console.log('=== 生成评审任务 ===\n');
  const subagentPrompts = task.hrCommand.teamRoles.map((_, i) => 
    generateSubagentPrompt(task, prompt, i)
  );
  
  // 保存提示词（供手动测试）
  subagentPrompts.forEach((p, i) => {
    const filename = `subagent-prompt-${i}.md`;
    fs.writeFileSync(path.join(CONFIG.reviewDir, filename), p);
    console.log(`已保存: ${filename}`);
  });
  
  // 生成汇总提示词
  const summaryPromptTemplate = generateSummaryPrompt(task, subagentPrompts.map((_, i) => `[评审员${i + 1}意见]`));
  fs.writeFileSync(path.join(CONFIG.reviewDir, 'summary-prompt-template.md'), summaryPromptTemplate);
  console.log('已保存: summary-prompt-template.md\n');
  
  console.log('=== 评审任务准备完成 ===\n');
  console.log('评审流程:');
  console.log('1. 为每个角色创建 subagent（使用 sessions_spawn）');
  console.log('2. 分配对应的评审提示词');
  console.log('3. 并行执行评审');
  console.log('4. 收集结果');
  console.log('5. 使用主编 subagent 汇总');
  console.log('6. 应用修改（如需要）');
  console.log('\n---\n');
  
  // 输出 OpenClaw 命令
  console.log('OpenClaw 命令示例:');
  console.log('');
  console.log('```');
  for (let i = 0; i < task.hrCommand.teamRoles.length; i++) {
    const role = task.hrCommand.teamRoles[i].split(' - ')[0];
    console.log(`// 创建 ${role} subagent`);
    console.log(`sessions_spawn task="请阅读 /root/.openclaw/workspace/memory/novel-reviews/subagent-prompt-${i}.md 并完成评审" label="小说评审-${role}"`);
  }
  console.log('```');
  console.log('\n---\n');
  
  // 生成 JSON 输出
  const output = {
    task,
    subagentPrompts: subagentPrompts.map((p, i) => ({
      role: task.hrCommand.teamRoles[i],
      promptFile: `subagent-prompt-${i}.md`
    })),
    summaryPromptTemplate: 'summary-prompt-template.md'
  };
  
  fs.writeFileSync(path.join(CONFIG.reviewDir, 'execution-plan.json'), JSON.stringify(output, null, 2));
  console.log('执行计划已保存: execution-plan.json');
}

// 执行
main().catch(console.error);
