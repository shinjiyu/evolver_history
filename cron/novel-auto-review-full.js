#!/usr/bin/env node
/**
 * 小说自动评审完整流程
 * 
 * 功能：
 * 1. 生成评审任务（四种模式轮换）
 * 2. 使用 subagent 进行实际评审
 * 3. 汇总评审结果
 * 4. 应用修改到小说文件
 * 
 * 使用方法：
 * node novel-auto-review-full.js [--dry-run]
 */

const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
  novelDir: '/root/.openclaw/workspace/novel-project/chapters',
  reviewDir: '/root/.openclaw/workspace/memory/novel-reviews',
  stateFile: '/root/.openclaw/workspace/memory/novel-reviews/state.json',
  maxChapters: 60,
  dryRun: process.argv.includes('--dry-run')
};

// 四种评审模式
const REVIEW_MODES = [
  {
    id: 'consecutive',
    name: '连续章节一致性评审',
    description: '评审2个连续章节，检查前后是否有矛盾（人物、情节、设定）',
    roles: [
      '逻辑审核员 - 检查情节逻辑和因果关系',
      '设定管理员 - 检查世界观和设定一致性',
      '人物分析师 - 检查人物行为和动机'
    ],
    workflow: '并行分析 → 汇总问题 → 提出修改方案',
    promptTemplate: `你是一位专业的小说编辑，负责检查连续章节的一致性。

请评审以下两个连续章节，重点关注：

## 检查项目
1. **人物一致性** - 人物性格、动机、关系是否连贯
2. **情节连贯性** - 事件时间线、因果关系是否合理
3. **设定一致性** - 世界观规则、能力设定是否矛盾

## 输出格式
### 发现的问题
- [问题描述] [章节位置] [严重程度: 高/中/低]

### 修改建议
- [具体修改方案]

### 总体评分
- 连贯性: X/10
- 一致性: X/10`
  },
  {
    id: 'long_distance',
    name: '长距离章节一致性评审',
    description: '评审相距较远的章节，检查设定是否前后一致，人物发展是否合理',
    roles: [
      '设定考古学家 - 追踪设定演变',
      '人物成长分析师 - 分析人物弧光',
      '伏笔管理员 - 检查伏笔和呼应'
    ],
    workflow: '并行分析 → 交叉验证 → 综合报告',
    promptTemplate: `你是一位专业的小说编辑，负责检查长距离章节的一致性。

请评审以下两个相距较远的章节，重点关注：

## 检查项目
1. **设定演变** - 核心设定、规则解释是否矛盾
2. **人物成长** - 人物成长轨迹、性格变化是否有铺垫
3. **伏笔呼应** - 早期伏笔是否得到呼应，是否有未解释的悬念

## 输出格式
### 发现的问题
- [问题描述] [章节位置] [严重程度: 高/中/低]

### 修改建议
- [具体修改方案]

### 总体评分
- 设定一致性: X/10
- 人物成长: X/10
- 伏笔管理: X/10`
  },
  {
    id: 'inspiration',
    name: '灵感评审',
    description: '寻找可以改进的点子，提出更有创意的情节/对话/场景',
    roles: [
      '创意顾问 - 提供情节创新建议',
      '对话优化师 - 优化对话表现',
      '场景设计师 - 强化场景效果'
    ],
    workflow: '头脑风暴 → 筛选建议 → 优先级排序',
    promptTemplate: `你是一位创意顾问，负责为小说提供灵感和改进建议。

请评审以下章节，寻找可以提升的点子：

## 评审方向
1. **情节创新** - 是否有更出人意料的发展？
2. **对话优化** - 哪些对话可以更生动？
3. **场景强化** - 哪些场景可以更有画面感？

## 输出格式
### 灵感建议（按优先级排序）
1. **[建议类型]**
   - 当前: [现状]
   - 建议: [改进方案]
   - 预期效果: [提升效果]
   - 实施难度: 高/中/低

### 总体评价
- 创意潜力: X/10
- 可提升空间: X/10`
  },
  {
    id: 'literary',
    name: '常规文学评审',
    description: '评审文笔、节奏、对话、人物塑造，用词是否准确，是否有错别字',
    roles: [
      '文字编辑 - 检查用词和语法',
      '节奏分析师 - 分析叙事节奏',
      '人物塑造顾问 - 评估人物表现'
    ],
    workflow: '并行评审 → 汇总问题 → 修改建议',
    promptTemplate: `你是一位资深文学编辑，负责评审小说的文学质量。

请评审以下章节的文学表现：

## 评审维度
1. **文笔质量** - 用词、句式、冗余表达、错别字
2. **节奏控制** - 叙事节奏、情节推进
3. **对话表现** - 对话是否自然、是否符合人物身份
4. **人物塑造** - 人物是否立体、心理描写是否到位

## 输出格式
### 文笔问题
- [问题] [位置] [修改建议]

### 错别字/语病
- [错误] → [正确]

### 总体评分
- 文笔: X/10
- 节奏: X/10
- 对话: X/10
- 人物: X/10`
  }
];

/**
 * 读取/保存状态
 */
function readState() {
  try {
    if (fs.existsSync(CONFIG.stateFile)) {
      return JSON.parse(fs.readFileSync(CONFIG.stateFile, 'utf8'));
    }
  } catch (e) {
    console.error('读取状态失败:', e.message);
  }
  return {
    lastModeIndex: -1,
    lastChapterIndex: 0,
    totalReviews: 0,
    lastReviewTime: null
  };
}

function saveState(state) {
  try {
    fs.writeFileSync(CONFIG.stateFile, JSON.stringify(state, null, 2));
  } catch (e) {
    console.error('保存状态失败:', e.message);
  }
}

/**
 * 获取章节列表
 */
function getChapters() {
  const files = fs.readdirSync(CONFIG.novelDir);
  const chapters = [];
  
  for (const file of files) {
    const match = file.match(/chapter-(\d+)(-revised)?\.md$/);
    if (match) {
      const num = parseInt(match[1]);
      if (num <= CONFIG.maxChapters) {
        chapters.push({
          num,
          file,
          path: path.join(CONFIG.novelDir, file),
          isRevised: !!match[2]
        });
      }
    }
  }
  
  // 去重（优先 revised）
  const chapterMap = new Map();
  for (const ch of chapters) {
    const existing = chapterMap.get(ch.num);
    if (!existing || ch.isRevised) {
      chapterMap.set(ch.num, ch);
    }
  }
  
  return Array.from(chapterMap.values()).sort((a, b) => a.num - b.num);
}

/**
 * 选择下一个评审任务
 */
function selectNextReview(state, chapters) {
  const nextModeIndex = (state.lastModeIndex + 1) % REVIEW_MODES.length;
  const mode = REVIEW_MODES[nextModeIndex];
  
  let chapter1, chapter2;
  
  switch (mode.id) {
    case 'consecutive':
      chapter1 = chapters[state.lastChapterIndex % chapters.length];
      chapter2 = chapters[(state.lastChapterIndex + 1) % chapters.length];
      state.lastChapterIndex = (state.lastChapterIndex + 2) % chapters.length;
      break;
      
    case 'long_distance':
      chapter1 = chapters[0];
      chapter2 = chapters[chapters.length - 1];
      break;
      
    case 'inspiration':
    case 'literary':
      chapter1 = chapters[state.lastChapterIndex % chapters.length];
      chapter2 = null;
      state.lastChapterIndex = (state.lastChapterIndex + 1) % chapters.length;
      break;
  }
  
  state.lastModeIndex = nextModeIndex;
  
  return { mode, chapter1, chapter2 };
}

/**
 * 读取章节内容
 */
function readChapter(chapter) {
  if (!chapter) return '';
  return fs.readFileSync(chapter.path, 'utf8');
}

/**
 * 生成完整的评审任务
 */
function generateReviewTask(review) {
  const { mode, chapter1, chapter2 } = review;
  
  // 生成完整提示词
  let fullPrompt = mode.promptTemplate + '\n\n---\n\n## 待评审章节\n\n';
  
  if (chapter1) {
    fullPrompt += `### 第${chapter1.num}章\n\n\`\`\`markdown\n${readChapter(chapter1)}\n\`\`\`\n\n`;
  }
  
  if (chapter2) {
    fullPrompt += `### 第${chapter2.num}章\n\n\`\`\`markdown\n${readChapter(chapter2)}\n\`\`\`\n\n`;
  }
  
  return {
    mode: {
      id: mode.id,
      name: mode.name,
      description: mode.description,
      roles: mode.roles,
      workflow: mode.workflow
    },
    chapters: [
      chapter1 ? chapter1.num : null,
      chapter2 ? chapter2.num : null
    ].filter(Boolean),
    prompt: fullPrompt
  };
}

/**
 * 生成 HR 招募指令
 */
function generateHRCommand(task) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const promptFile = path.join(CONFIG.reviewDir, `prompt-${timestamp}.md`);
  
  // 保存提示词
  fs.writeFileSync(promptFile, task.prompt);
  
  // 生成 HR 命令
  const command = `HR，组建小说评审团队完成以下任务：

**目标**: ${task.mode.name}
**描述**: ${task.mode.description}
**章节**: 第${task.chapters.join('章, 第')}章

**团队角色**:
${task.mode.roles.map(r => `- ${r}`).join('\n')}

**协作流程**: ${task.mode.workflow}

**评审内容**: 见 ${promptFile}

**输出要求**:
- 发现的问题列表（标注严重程度）
- 具体修改建议
- 总体评分
- 修改后的章节内容（如有必要）`;
  
  return {
    command,
    promptFile,
    roles: task.mode.roles,
    workflow: task.mode.workflow
  };
}

/**
 * 保存评审报告
 */
function saveReviewReport(task, hrCommand) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `review-task-${task.mode.id}-${timestamp}.md`;
  const filepath = path.join(CONFIG.reviewDir, filename);
  
  let content = `# ${task.mode.name} - 评审任务\n\n`;
  content += `**时间**: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}\n\n`;
  content += `**模式**: ${task.mode.description}\n\n`;
  content += `**章节**: 第${task.chapters.join('章, 第')}章\n\n`;
  content += `---\n\n`;
  content += `## HR 招募指令\n\n`;
  content += '```\n';
  content += hrCommand.command;
  content += '\n```\n\n';
  content += `## 团队角色\n\n`;
  hrCommand.roles.forEach((role, i) => {
    content += `${i + 1}. ${role}\n`;
  });
  content += `\n**协作流程**: ${hrCommand.workflow}\n`;
  
  fs.writeFileSync(filepath, content);
  
  return filepath;
}

/**
 * 主函数
 */
async function main() {
  console.log('=== 小说自动评审系统（完整流程）===');
  console.log(`时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`);
  console.log(`模式: ${CONFIG.dryRun ? 'DRY RUN (不执行实际评审)' : '正常执行'}\n`);
  
  // 读取状态
  const state = readState();
  console.log(`已执行评审次数: ${state.totalReviews}`);
  console.log(`上次模式: ${state.lastModeIndex >= 0 ? REVIEW_MODES[state.lastModeIndex].name : '无'}`);
  
  // 获取章节
  const chapters = getChapters();
  console.log(`可用章节: ${chapters.length}章\n`);
  
  if (chapters.length === 0) {
    console.log('错误: 没有找到章节文件');
    process.exit(1);
  }
  
  // 选择下一个评审
  const review = selectNextReview(state, chapters);
  console.log(`=== 本次评审 ===`);
  console.log(`模式: ${review.mode.name}`);
  console.log(`描述: ${review.mode.description}`);
  console.log(`章节: 第${review.chapter1.num}章${review.chapter2 ? ` - 第${review.chapter2.num}章` : ''}\n`);
  
  // 生成任务
  const task = generateReviewTask(review);
  console.log(`团队角色:`);
  task.mode.roles.forEach((role, i) => {
    console.log(`  ${i + 1}. ${role}`);
  });
  console.log(`协作流程: ${task.mode.workflow}\n`);
  
  // 生成 HR 命令
  const hrCommand = generateHRCommand(task);
  console.log(`=== HR 招募指令 ===`);
  console.log(`提示词文件: ${path.basename(hrCommand.promptFile)}\n`);
  console.log(hrCommand.command);
  console.log('\n---\n');
  
  // 保存报告
  const reportPath = saveReviewReport(task, hrCommand);
  console.log(`评审任务已保存: ${path.basename(reportPath)}\n`);
  
  // 更新状态
  state.totalReviews++;
  state.lastReviewTime = new Date().toISOString();
  saveState(state);
  
  console.log(`=== 状态更新 ===`);
  console.log(`总评审次数: ${state.totalReviews}`);
  console.log(`下次模式: ${REVIEW_MODES[(state.lastModeIndex + 1) % REVIEW_MODES.length].name}\n`);
  
  // 输出 JSON（供程序调用）
  const output = {
    success: true,
    task: {
      mode: task.mode,
      chapters: task.chapters,
      promptFile: hrCommand.promptFile
    },
    hrCommand: {
      command: hrCommand.command,
      roles: hrCommand.roles,
      workflow: hrCommand.workflow
    },
    state: {
      totalReviews: state.totalReviews,
      lastModeIndex: state.lastModeIndex,
      lastChapterIndex: state.lastChapterIndex
    },
    timestamp: new Date().toISOString()
  };
  
  const outputFile = path.join(CONFIG.reviewDir, 'last-task.json');
  fs.writeFileSync(outputFile, JSON.stringify(output, null, 2));
  console.log(`任务配置已保存: last-task.json`);
  
  // 如果是 dry run，到此结束
  if (CONFIG.dryRun) {
    console.log('\n=== DRY RUN 完成 ===');
    console.log('未执行实际评审。如需执行，请去掉 --dry-run 参数。');
    return;
  }
  
  // 实际执行评审（需要 OpenClaw 环境）
  console.log('\n=== 执行评审 ===');
  console.log('请将以下 HR 命令发送给 OpenClaw 执行评审：');
  console.log('\n```');
  console.log(hrCommand.command);
  console.log('```\n');
  
  console.log('或者使用 sessions_spawn 创建 subagent 团队：');
  console.log('');
  for (let i = 0; i < hrCommand.roles.length; i++) {
    const role = hrCommand.roles[i].split(' - ')[0];
    console.log(`sessions_spawn task="阅读 ${hrCommand.promptFile} 并作为${role}完成评审" label="小说评审-${role}"`);
  }
}

// 执行
main().catch(console.error);
