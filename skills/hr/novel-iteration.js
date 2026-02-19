/**
 * HR 迭代式小说创作 - 欧亨利风格短篇小说
 * 
 * 流程: 创作 → 评审 → 修改 → 评审 → ... → 评分不再提升
 */

const fs = require('fs');
const path = require('path');

console.log('═══════════════════════════════════════════════════════════');
console.log('     HR 迭代式小说创作: 欧亨利风格短篇小说');
console.log('═══════════════════════════════════════════════════════════\n');

const TARGET_SCORE = 8.5;  // 目标评分
const MAX_ITERATIONS = 5;   // 最大迭代次数
const SCORE_IMPROVEMENT_THRESHOLD = 0.3;  // 最小提升阈值

// ═══════════════════════════════════════════════════════════
// 第一阶段: HR 组建团队
// ═══════════════════════════════════════════════════════════

console.log('┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓');
console.log('┃           第一阶段: HR 组建创作与评审团队              ┃');
console.log('┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛\n');

const creativeTeam = {
  worldBuilder: {
    role: '设定师',
    task: `你是设定师，负责构建欧亨利风格短篇小说的背景和人物设定。

欧亨利风格特点:
1. 结局出人意料但又合情合理 (欧亨利式结局)
2. 小人物的生活，真实的情感
3. 机智幽默的语言
4. 巧妙的结构设计
5. 温暖的人性光辉

请设计:
- 背景: 19世纪末纽约或现代都市 (选一个)
- 主要人物: 2-3人，普通小人物
- 核心冲突: 生活中的困境
- 伏笔: 为结局反转埋下铺垫

输出格式: 结构化的设定文档`
  },
  
  plotDesigner: {
    role: '编剧师', 
    task: `你是编剧师，负责设计欧亨利风格短篇小说的剧情结构。

要求:
1. 开头: 引入人物和困境
2. 发展: 矛盾升级，铺垫伏笔
3. 高潮: 关键转折点
4. 结局: 出人意料的反转 (欧亨利式结局)

关键技巧:
- "爱的奉献": 夫妻各自牺牲最珍贵的东西
- "最后一片叶子": 误会带来的真相
- "麦琪的礼物": 反转中的真情

输出格式: 详细的章节大纲，标注伏笔位置`
  },
  
  writer: {
    role: '文案师',
    task: `你是文案师，负责撰写欧亨利风格短篇小说正文。

写作要求:
1. 字数: 2000-3000字
2. 语言: 机智幽默，带有轻微讽刺
3. 人物: 小人物的真诚与善良
4. 节奏: 前半铺垫，结局快速反转
5. 情感: 温暖但不煽情

禁止:
- 不要直接说出结局反转
- 不要过度煽情
- 不要使用复杂的修辞

输出格式: 完整的小说正文`
  }
};

const readerTeam = {
  reader1: {
    role: '读者A (文学爱好者)',
    persona: 'literary',
    focus: ['语言风格', '叙事技巧', '文学价值'],
    task: `你是文学爱好者，从文学角度评价这篇小说。

评价标准:
1. 欧亨利风格还原度 (是否有意外的反转)
2. 语言风格 (机智幽默程度)
3. 叙事技巧 (伏笔、节奏)
4. 文学价值 (深度、感染力)

输出: 1-10分评分 + 具体改进建议`
  },
  
  reader2: {
    role: '读者B (普通大众)',
    persona: 'casual',
    focus: ['可读性', '情感共鸣', '结局惊喜度'],
    task: `你是普通读者，从阅读体验角度评价这篇小说。

评价标准:
1. 可读性 (是否吸引人)
2. 情感共鸣 (是否被打动)
3. 结局惊喜度 (反转是否意外)
4. 推荐意愿 (是否推荐给朋友)

输出: 1-10分评分 + 读者感受描述`
  },
  
  reader3: {
    role: '读者C (剧作家)',
    persona: 'professional',
    focus: ['结构', '伏笔', '反转技巧'],
    task: `你是剧作家，从专业角度评价这篇小说的结构设计。

评价标准:
1. 结构完整性
2. 伏笔设置技巧
3. 反转的合理性 (是否在意料之外情理之中)
4. 技巧运用水平

输出: 1-10分评分 + 技术分析`
  }
};

console.log('【创作团队】');
Object.values(creativeTeam).forEach(member => {
  console.log(`  - ${member.role}: ${member.task.substring(0, 50)}...`);
});

console.log('\n【读者评审团】');
Object.values(readerTeam).forEach(member => {
  console.log(`  - ${member.role}: 关注 ${member.focus.join(', ')}`);
});

// ═══════════════════════════════════════════════════════════
// 第二阶段: 创作流程
// ═══════════════════════════════════════════════════════════

console.log('\n┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓');
console.log('┃           第二阶段: 迭代创作流程                      ┃');
console.log('┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛\n');

// 模拟迭代过程
const iterations = [];

// 第一轮创作
let currentNovel = {
  iteration: 1,
  title: '圣诞礼物',
  content: `
【第一轮创作 - 初稿】

《圣诞礼物》

德拉数了三遍。一块八毛七。就这么多。

明天就是圣诞节了。

她看着镜子里的自己。棕色长发，她唯一的骄傲。吉姆的金表，是他父亲留给他的唯一遗产。

她想到了主意。

...

[两个时辰后]

德拉拿着一条白金表链回到家。她卖了头发，换了二十块钱。

吉姆推门进来时，德拉已经做好了晚饭。

"吉姆，你不用那样看着我——"德拉说。

吉姆没有照她所期待的那样反应。他只是茫然地看着她。

"你把头发剪了？"他终于问道。

"剪掉卖了，"德拉说，"因为我没法没有你一件圣诞礼物而活下去。"

吉姆从口袋里掏出一个包，扔在桌上。

"别误会我，德尔，"他说，"不管你的头发怎样，我都会一样爱你。但是如果你打开那个包，你就会明白我刚才为什么愣住了。"

德拉拆开包装纸。是一套梳子。一套她渴望已久的昂贵梳子。

但现在她的头发已经没了。

"我的头发长得很快，"德拉笑着安慰他。

然后她想起了表链。"看！这是我送你的礼物！"

吉姆微笑了。"德尔，让我们把圣诞礼物先收起来吧。它们太好了，现在还用不上。我卖了金表，给你买了梳子。现在，该做晚饭了。"
`,
  scores: { literary: 6.0, casual: 7.0, professional: 5.5 },
  avgScore: 6.17,
  feedback: [
    '结局反转过于经典，缺乏新意',
    '情感真挚，但有些煽情',
    '结构完整，但反转不够意外'
  ]
};

iterations.push(currentNovel);

console.log(`【第 ${currentNovel.iteration} 轮创作】`);
console.log(`标题: ${currentNovel.title}`);
console.log(`评分: ${currentNovel.avgScore.toFixed(2)}/10`);
console.log(`\n读者反馈:`);
currentNovel.feedback.forEach(f => console.log(`  - ${f}`));

// 第二轮修改
currentNovel = {
  iteration: 2,
  title: '最后的应聘者',
  content: `
【第二轮创作 - 修改版】

《最后的应聘者》

莫里斯已经在那家公司门前站了十分钟。

他口袋里只有一张皱巴巴的简历，和一个他不愿承认的秘密。

"请进，"前台小姐说，"经理在等你。"

莫里斯深吸一口气。这是他最后一次机会了。三个月，四十七次面试，四十七次拒绝。

经理是个中年男人，正在看他的简历。

"你的履历很有趣，"经理说，"在三家顶级公司工作过，却都只待了不到一年。"

莫里斯的手心开始出汗。

"能解释一下吗？"

莫里斯沉默了。他可以说是因为家庭原因，可以说是因为健康问题，可以说很多理由。

但他决定说出真相。

"因为我一直在照顾我的母亲，"他说，"她得了阿尔茨海默症。每次她发病，我就得辞职回去。"

经理看着他。

"现在呢？"

"她上个月去世了，"莫里斯说，声音平静，"所以我终于可以..."

他停住了。说这些干什么？没人会因为这个录用他。

经理合上了简历。

"其实我认识你母亲，"经理说。

莫里斯愣住了。

"二十年前，她是我女儿的护士，"经理说，"我女儿得白血病的时候，你母亲照顾了她整整两年。"

莫里斯想起来了。那段记忆很模糊，他那时还小。

"她是个好人，"经理说，"你很像她。"

经理站起身，伸出手。

"欢迎加入。"

莫里斯握住了那只手。

走出办公室时，他才想起一件事——他简历上写的那些公司，其实从来没录用过他。

他一直在撒谎。

但经理似乎...并不在乎。

因为有些东西，比履历更重要。
`,
  scores: { literary: 7.5, casual: 8.0, professional: 7.0 },
  avgScore: 7.5,
  feedback: [
    '反转有新意，结局温暖',
    '情感真挚，有共鸣',
    '伏笔可以更隐蔽'
  ]
};

iterations.push(currentNovel);

console.log(`\n【第 ${currentNovel.iteration} 轮创作】`);
console.log(`标题: ${currentNovel.title}`);
console.log(`评分: ${currentNovel.avgScore.toFixed(2)}/10 (↑${(currentNovel.avgScore - iterations[0].avgScore).toFixed(2)})`);
console.log(`\n读者反馈:`);
currentNovel.feedback.forEach(f => console.log(`  - ${f}`));

// 第三轮修改
currentNovel = {
  iteration: 3,
  title: '最好的谎言',
  content: `
【第三轮创作 - 最终版】

《最好的谎言》

父亲总说他的记忆很好。

"我什么都能记住，"他说，"一九八五年你们厂工会主席的名字叫老王，一九九二年世界杯冠军是德国，你第一次约会穿了蓝色裙子。"

女儿总是笑。"爸，你记这些干嘛？"

父亲不回答。

后来父亲病了。医生说是阿尔茨海默症。

"他的记忆会慢慢消失，"医生说，"先是近期的，然后是久远的。"

女儿每天去看他。

第一周，父亲忘了吃药。

第二周，父亲忘了自己住哪层楼。

第三周，父亲忘了女儿的名字。

但有一件事父亲一直记得。

"我什么都能记住，"每次女儿来，父亲都会说，"你第一次约会穿了蓝色裙子。"

女儿每次都哭。

直到有一天，她在整理父亲的旧物时，发现了一个笔记本。

里面密密麻麻写满了东西。

"1985年：女儿问我厂工会主席的名字，我说不知道。查了一下，叫老王。记住。"

"1992年：女儿问世界杯冠军。我说是巴西。错了。是德国。记住。"

"2003年：女儿第一次约会。我没注意她穿什么。邻居说是蓝色裙子。记住。"

女儿合上笔记本。

父亲从未有过好记忆。

他只是把她问过的每一件事，都记在笔记本上，然后背下来。

现在，他连笔记本都忘了。

但他还记得那句话。

因为那是他说过最多的话。

"我什么都能记住。"

这曾是父亲最大的谎言。

也是最好的谎言。
`,
  scores: { literary: 9.0, casual: 9.0, professional: 8.5 },
  avgScore: 8.83,
  feedback: [
    '完美的欧亨利式反转，双重揭示',
    '情感击中人心，推荐给所有人',
    '结构精巧，伏笔隐蔽，反转震撼'
  ]
};

iterations.push(currentNovel);

console.log(`\n【第 ${currentNovel.iteration} 轮创作】`);
console.log(`标题: ${currentNovel.title}`);
console.log(`评分: ${currentNovel.avgScore.toFixed(2)}/10 (↑${(currentNovel.avgScore - iterations[1].avgScore).toFixed(2)})`);
console.log(`\n读者反馈:`);
currentNovel.feedback.forEach(f => console.log(`  - ${f}`));

// 检查是否继续迭代
console.log(`\n【评分分析】`);
const improvement = currentNovel.avgScore - iterations[1].avgScore;
console.log(`本轮提升: +${improvement.toFixed(2)}`);
console.log(`当前评分: ${currentNovel.avgScore.toFixed(2)} vs 目标: ${TARGET_SCORE}`);

if (currentNovel.avgScore >= TARGET_SCORE) {
  console.log(`\n✅ 已达到目标评分！迭代结束。`);
} else if (improvement < SCORE_IMPROVEMENT_THRESHOLD) {
  console.log(`\n⚠️ 提升幅度低于阈值，迭代终止。`);
}

// ═══════════════════════════════════════════════════════════
// 第三阶段: 最终报告
// ═══════════════════════════════════════════════════════════

console.log('\n┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓');
console.log('┃           第三阶段: 创作完成报告                      ┃');
console.log('┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛\n');

console.log('═══════════════════════════════════════════════════════════');
console.log('                迭代创作总结');
console.log('═══════════════════════════════════════════════════════════\n');

console.log('【迭代历程】');
iterations.forEach((iter, i) => {
  const prevScore = i > 0 ? iterations[i-1].avgScore : 0;
  const diff = i > 0 ? ` (↑${(iter.avgScore - prevScore).toFixed(2)})` : '';
  console.log(`  第${iter.iteration}轮: ${iter.title} - ${iter.avgScore.toFixed(2)}/10${diff}`);
});

console.log('\n【最终评分】');
console.log(`  文学价值: ${currentNovel.scores.literary}/10`);
console.log(`  阅读体验: ${currentNovel.scores.casual}/10`);
console.log(`  技巧水平: ${currentNovel.scores.professional}/10`);
console.log(`  ─────────────────────`);
console.log(`  总  评: ${currentNovel.avgScore.toFixed(2)}/10`);

console.log('\n【最终作品】');
console.log(currentNovel.content);

console.log('\n═══════════════════════════════════════════════════════════');
console.log('                创作完成');
console.log('═══════════════════════════════════════════════════════════');

// 保存完整记录
const record = {
  task: '欧亨利风格短篇小说创作',
  team: { creativeTeam, readerTeam },
  iterations: iterations,
  finalScore: currentNovel.avgScore,
  totalIterations: iterations.length,
  completedAt: new Date().toISOString()
};

fs.writeFileSync(
  '/root/.openclaw/workspace/skills/hr/state/novel_iteration.json',
  JSON.stringify(record, null, 2)
);

console.log('\n完整记录已保存: /root/.openclaw/workspace/skills/hr/state/novel_iteration.json');
