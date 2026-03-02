#!/usr/bin/env node
/**
 * 小说自动评审系统
 * 
 * 功能：
 * 1. 四种评审模式轮换执行
 * 2. 使用 HR Skill 招募评审团队
 * 3. 评审后自动修改
 * 
 * 模式：
 * - 模式1：连续章节一致性评审
 * - 模式2：长距离章节一致性评审
 * - 模式3：灵感评审
 * - 模式4：常规文学评审
 */

const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
  novelDir: '/root/.openclaw/workspace/novel-project/chapters',
  reviewDir: '/root/.openclaw/workspace/memory/novel-reviews',
  stateFile: '/root/.openclaw/workspace/memory/novel-reviews/state.json',
  maxChapters: 60,  // 最多评审到第60章
};

// 四种评审模式
const REVIEW_MODES = [
  {
    id: 'consecutive',
    name: '连续章节一致性评审',
    description: '评审2个连续章节，检查前后是否有矛盾（人物、情节、设定）',
    prompt: `你是一位专业的小说编辑，负责检查连续章节的一致性。

请评审以下两个连续章节，重点关注：

## 检查项目
1. **人物一致性**
   - 人物性格是否前后一致
   - 人物动机是否连贯
   - 人物关系是否合理

2. **情节连贯性**
   - 事件时间线是否合理
   - 因果关系是否清晰
   - 伏笔和呼应是否一致

3. **设定一致性**
   - 世界观规则是否一致
   - 能力设定是否矛盾
   - 物品/地点描述是否统一

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
    prompt: `你是一位专业的小说编辑，负责检查长距离章节的一致性。

请评审以下两个相距较远的章节，重点关注：

## 检查项目
1. **设定演变**
   - 核心设定是否保持一致
   - 规则解释是否矛盾
   - 世界观是否有逻辑漏洞

2. **人物成长**
   - 人物成长轨迹是否合理
   - 性格变化是否有铺垫
   - 能力提升是否符合设定

3. **伏笔呼应**
   - 早期伏笔是否得到呼应
   - 是否有未解释的悬念
   - 是否有重复的情节

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
    description: '寻找可以改进的点子，提出更有创意的情节/对话/场景，只提供建议不强制修改',
    prompt: `你是一位创意顾问，负责为小说提供灵感和改进建议。

请评审以下章节，寻找可以提升的点子：

## 评审方向
1. **情节创新**
   - 是否有更出人意料的发展？
   - 是否有更深刻的主题探索？
   - 是否有更紧张刺激的冲突？

2. **对话优化**
   - 哪些对话可以更生动？
   - 哪些对话可以更有深意？
   - 哪些对话可以更符合人物性格？

3. **场景强化**
   - 哪些场景可以更有画面感？
   - 哪些场景可以更有情感张力？
   - 哪些场景可以更有象征意义？

4. **人物深化**
   - 哪些人物可以更立体？
   - 哪些动机可以更复杂？
   - 哪些关系可以更有层次？

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
    prompt: `你是一位资深文学编辑，负责评审小说的文学质量。

请评审以下章节的文学表现：

## 评审维度
1. **文笔质量**
   - 用词是否准确生动
   - 句式是否丰富多变
   - 是否有冗余表达
   - 是否有错别字或语病

2. **节奏控制**
   - 叙事节奏是否流畅
   - 情节推进是否合理
   - 是否有拖沓或仓促的部分

3. **对话表现**
   - 对话是否自然
   - 是否符合人物身份
   - 是否推动情节发展

4. **人物塑造**
   - 人物是否立体
   - 行为是否符合性格
   - 心理描写是否到位

## 输出格式
### 文笔问题
- [问题] [位置] [修改建议]

### 错别字/语病
- [错误] → [正确]

### 节奏问题
- [问题描述] [位置] [建议]

### 对话问题
- [问题] [人物] [建议]

### 人物塑造问题
- [问题] [人物] [建议]

### 总体评分
- 文笔: X/10
- 节奏: X/10
- 对话: X/10
- 人物: X/10`
  }
];

/**
 * 读取评审状态
 */
function readState() {
  try {
    if (fs.existsSync(CONFIG.stateFile)) {
      return JSON.parse(fs.readFileSync(CONFIG.stateFile, 'utf8'));
    }
  } catch (e) {
    console.error('读取状态文件失败:', e.message);
  }
  
  // 默认状态
  return {
    lastModeIndex: -1,
    lastChapterIndex: 0,
    totalReviews: 0,
    lastReviewTime: null
  };
}

/**
 * 保存评审状态
 */
function saveState(state) {
  try {
    fs.writeFileSync(CONFIG.stateFile, JSON.stringify(state, null, 2));
  } catch (e) {
    console.error('保存状态文件失败:', e.message);
  }
}

/**
 * 获取章节列表
 */
function getChapters() {
  const files = fs.readdirSync(CONFIG.novelDir);
  const chapters = [];
  
  // 提取章节编号
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
  
  // 去重（优先使用 revised 版本）
  const chapterMap = new Map();
  for (const ch of chapters) {
    const existing = chapterMap.get(ch.num);
    if (!existing || ch.isRevised) {
      chapterMap.set(ch.num, ch);
    }
  }
  
  // 排序
  return Array.from(chapterMap.values()).sort((a, b) => a.num - b.num);
}

/**
 * 选择下一个评审任务
 */
function selectNextReview(state, chapters) {
  // 轮换模式
  const nextModeIndex = (state.lastModeIndex + 1) % REVIEW_MODES.length;
  const mode = REVIEW_MODES[nextModeIndex];
  
  let chapter1, chapter2;
  
  switch (mode.id) {
    case 'consecutive':
      // 连续章节：选择下一对
      chapter1 = chapters[state.lastChapterIndex % chapters.length];
      chapter2 = chapters[(state.lastChapterIndex + 1) % chapters.length];
      state.lastChapterIndex = (state.lastChapterIndex + 2) % chapters.length;
      break;
      
    case 'long_distance':
      // 长距离章节：首尾对比
      chapter1 = chapters[0];
      chapter2 = chapters[chapters.length - 1];
      break;
      
    case 'inspiration':
    case 'literary':
      // 单章节评审：选择下一章
      chapter1 = chapters[state.lastChapterIndex % chapters.length];
      chapter2 = null;
      state.lastChapterIndex = (state.lastChapterIndex + 1) % chapters.length;
      break;
  }
  
  state.lastModeIndex = nextModeIndex;
  
  return {
    mode,
    chapter1,
    chapter2
  };
}

/**
 * 读取章节内容
 */
function readChapter(chapter) {
  if (!chapter) return '';
  return fs.readFileSync(chapter.path, 'utf8');
}

/**
 * 生成评审提示词
 */
function generateReviewPrompt(review, mode) {
  let prompt = mode.prompt + '\n\n';
  
  prompt += `---\n\n`;
  prompt += `## 待评审章节\n\n`;
  
  if (review.chapter1) {
    prompt += `### 第${review.chapter1.num}章\n\n`;
    prompt += '```markdown\n';
    prompt += readChapter(review.chapter1);
    prompt += '\n```\n\n';
  }
  
  if (review.chapter2) {
    prompt += `### 第${review.chapter2.num}章\n\n`;
    prompt += '```markdown\n';
    prompt += readChapter(review.chapter2);
    prompt += '\n```\n\n';
  }
  
  return prompt;
}

/**
 * 保存评审报告
 */
function saveReviewReport(review, report) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `review-${review.mode.id}-${timestamp}.md`;
  const filepath = path.join(CONFIG.reviewDir, filename);
  
  let content = `# ${review.mode.name}\n\n`;
  content += `**时间**: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}\n\n`;
  content += `**模式**: ${review.mode.description}\n\n`;
  
  if (review.chapter1) {
    content += `**章节**: 第${review.chapter1.num}章`;
    if (review.chapter2) {
      content += ` - 第${review.chapter2.num}章`;
    }
    content += '\n\n';
  }
  
  content += `---\n\n`;
  content += report;
  
  fs.writeFileSync(filepath, content);
  console.log(`评审报告已保存: ${filename}`);
  
  return filepath;
}

/**
 * 生成 HR 团队招募指令
 */
function generateHRCommand(review) {
  const mode = review.mode;
  
  // 根据模式选择团队角色
  let teamRoles = [];
  let workflow = '';
  
  switch (mode.id) {
    case 'consecutive':
      teamRoles = [
        '逻辑审核员 - 检查情节逻辑和因果关系',
        '设定管理员 - 检查世界观和设定一致性',
        '人物分析师 - 检查人物行为和动机'
      ];
      workflow = '并行分析 → 汇总问题 → 提出修改方案';
      break;
      
    case 'long_distance':
      teamRoles = [
        '设定考古学家 - 追踪设定演变',
        '人物成长分析师 - 分析人物弧光',
        '伏笔管理员 - 检查伏笔和呼应'
      ];
      workflow = '并行分析 → 交叉验证 → 综合报告';
      break;
      
    case 'inspiration':
      teamRoles = [
        '创意顾问 - 提供情节创新建议',
        '对话优化师 - 优化对话表现',
        '场景设计师 - 强化场景效果'
      ];
      workflow = '头脑风暴 → 筛选建议 → 优先级排序';
      break;
      
    case 'literary':
      teamRoles = [
        '文字编辑 - 检查用词和语法',
        '节奏分析师 - 分析叙事节奏',
        '人物塑造顾问 - 评估人物表现'
      ];
      workflow = '并行评审 → 汇总问题 → 修改建议';
      break;
  }
  
  return {
    teamRoles,
    workflow,
    reviewPrompt: generateReviewPrompt(review, mode)
  };
}

/**
 * 主函数
 */
async function main() {
  console.log('=== 小说自动评审系统 ===');
  console.log(`时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}\n`);
  
  // 读取状态
  const state = readState();
  console.log(`已执行评审次数: ${state.totalReviews}`);
  console.log(`上次模式: ${state.lastModeIndex >= 0 ? REVIEW_MODES[state.lastModeIndex].name : '无'}`);
  
  // 获取章节列表
  const chapters = getChapters();
  console.log(`\n可用章节数: ${chapters.length}`);
  
  if (chapters.length === 0) {
    console.log('错误: 没有找到章节文件');
    return;
  }
  
  // 选择下一个评审任务
  const review = selectNextReview(state, chapters);
  console.log(`\n本次评审模式: ${review.mode.name}`);
  if (review.chapter1) {
    console.log(`章节: 第${review.chapter1.num}章`);
    if (review.chapter2) {
      console.log(` - 第${review.chapter2.num}章`);
    }
  }
  
  // 生成 HR 团队招募指令
  const hrCommand = generateHRCommand(review);
  
  console.log('\n=== HR 团队招募指令 ===');
  console.log('\n团队角色:');
  hrCommand.teamRoles.forEach((role, i) => {
    console.log(`  ${i + 1}. ${role}`);
  });
  console.log(`\n协作流程: ${hrCommand.workflow}`);
  
  // 生成评审提示词（保存到文件，供 subagent 使用）
  const promptFile = path.join(CONFIG.reviewDir, 'current-prompt.md');
  fs.writeFileSync(promptFile, hrCommand.reviewPrompt);
  console.log(`\n评审提示词已保存: current-prompt.md`);
  
  // 更新状态
  state.totalReviews++;
  state.lastReviewTime = new Date().toISOString();
  saveState(state);
  
  console.log('\n=== 评审准备完成 ===');
  console.log('请使用以下命令启动评审团队:');
  console.log('');
  console.log('HR，组建小说评审团队完成以下任务:');
  console.log('');
  console.log(`**目标**: ${review.mode.name}`);
  console.log(`**描述**: ${review.mode.description}`);
  console.log('');
  console.log('**团队角色**:');
  hrCommand.teamRoles.forEach(role => {
    console.log(`- ${role}`);
  });
  console.log('');
  console.log(`**协作流程**: ${hrCommand.workflow}`);
  console.log('');
  console.log('**评审内容**: 见 current-prompt.md 文件');
  console.log('');
  console.log('**输出要求**:');
  console.log('- 发现的问题列表（标注严重程度）');
  console.log('- 具体修改建议');
  console.log('- 总体评分');
  console.log('- 修改后的章节内容（如有必要）');
  
  // 输出 JSON 格式供程序调用
  const output = {
    mode: review.mode,
    chapters: review.chapter1 ? [
      review.chapter1.num,
      review.chapter2 ? review.chapter2.num : null
    ].filter(Boolean) : [],
    hrCommand: {
      teamRoles: hrCommand.teamRoles,
      workflow: hrCommand.workflow,
      promptFile: promptFile
    },
    state: {
      totalReviews: state.totalReviews,
      lastModeIndex: state.lastModeIndex,
      lastChapterIndex: state.lastChapterIndex
    }
  };
  
  // 保存输出
  const outputFile = path.join(CONFIG.reviewDir, 'review-task.json');
  fs.writeFileSync(outputFile, JSON.stringify(output, null, 2));
  console.log(`\n任务配置已保存: review-task.json`);
}

// 执行
main().catch(console.error);
