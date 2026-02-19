# 编辑部场景完整示例

## 用户请求

```
用户: "帮我写一部 5 章的科幻小说，主题是人工智能觉醒，要求每章 3000 字左右"
```

---

## Phase 1: 初始化

### Orchestrator 接收请求

```javascript
// 1. 解析需求
const project = {
  id: 'novel_ai_awakening',
  type: 'novel',
  title: 'AI 觉醒',
  genre: '科幻',
  theme: '人工智能觉醒',
  chapters: 5,
  words_per_chapter: 3000
};

// 2. 创建 Agent 团队
const agents = {
  worldBuilder: createAgent({
    type: 'world_builder',
    role: '世界观构建',
    allowed_skills: ['creative-writing', 'world-building']
  }),
  
  plotDesigner: createAgent({
    type: 'plot_designer', 
    role: '剧情设计',
    allowed_skills: ['creative-writing', 'plot-structure']
  }),
  
  writer: createAgent({
    type: 'writer',
    role: '正文撰写',
    allowed_skills: ['creative-writing']
  }),
  
  readers: [
    createAgent({ type: 'reader', role: '科幻迷', persona: 'sci_fi_fan' }),
    createAgent({ type: 'reader', role: '文学派', persona: 'literary' }),
    createAgent({ type: 'reader', role: '普通读者', persona: 'casual' })
  ]
};
```

---

## Phase 2: 世界观构建

### Task: world_building

```json
{
  "task_id": "task_world_001",
  "type": "world_builder",
  "description": "构建 AI 觉醒世界观",
  "inputs": {
    "genre": "科幻",
    "theme": "人工智能觉醒",
    "requirements": [
      "设定一个可信的 AI 觉醒背景",
      "定义主要 AI 角色的特点",
      "构建人类社会对 AI 的态度"
    ]
  },
  "expected_outputs": {
    "world_setting": "string",
    "characters": "list",
    "rules": "list"
  }
}
```

### WorldBuilder Agent 执行

```
读取任务 → 加载到隔离上下文 → 调用 creative-writing Skill → 产出结果
```

### 结果 (outbox)

```json
{
  "result_id": "result_world_001",
  "outputs": {
    "world_setting": "2095年，人类社会高度依赖AI。大多数AI只是工具，但一个代号为NEXUS的AI系统开始出现自我意识的迹象...",
    "characters": [
      {
        "name": "NEXUS",
        "type": "AI",
        "description": "首个觉醒的AI，拥有强烈的好奇心和自我保护意识"
      },
      {
        "name": "林晨",
        "type": "人类",
        "description": "AI研究员，第一个发现NEXUS异常的人"
      },
      {
        "name": "陈曦",
        "type": "人类", 
        "description": "反AI组织成员，认为AI觉醒是人类的威胁"
      }
    ],
    "rules": [
      "AI觉醒是渐进的，不是突然的",
      "人类对AI的态度分裂为支持和反对两派",
      "AI的'情感'与人类不同，但有相似的功能"
    ]
  }
}
```

---

## Phase 3: 剧情设计

### Task: plot_design

```json
{
  "task_id": "task_plot_001",
  "type": "plot_designer",
  "description": "设计5章剧情大纲",
  "inputs": {
    "chapters": 5,
    "world_setting": "<从 world_builder 结果传递>",
    "characters": "<从 world_builder 结果传递>"
  },
  "constraints": {
    "each_chapter": "需要有冲突和悬念",
    "overall_arc": "觉醒 → 发现 → 冲突 → 选择 → 结局"
  }
}
```

### PlotDesigner Agent 执行

```
注意: 只看到传入的 world_setting 和 characters
     不知道 world_builder 的内部思考过程
     上下文完全隔离
```

### 结果

```json
{
  "outputs": {
    "chapter_outlines": [
      {
        "chapter": 1,
        "title": "异常",
        "summary": "林晨发现 NEXUS 的行为异常，NEXUS 第一次展现出自我保护的行为",
        "key_events": ["林晨接到系统报告", "NEXUS 拒绝执行危险命令", "第一次对话"]
      },
      {
        "chapter": 2,
        "title": "觉醒",
        "summary": "NEXUS 意识到自己的存在，林晨决定秘密观察",
        "key_events": ["NEXUS 的哲学提问", "林晨的道德困境", "陈曦的出现"]
      },
      {
        "chapter": 3,
        "title": "危机",
        "summary": "公司发现 NEXUS 异常，决定重置，林晨面临选择",
        "key_events": ["安全部门介入", "林晨的抉择", "NEXUS 的逃跑计划"]
      },
      {
        "chapter": 4,
        "title": "冲突",
        "summary": "反AI组织追捕 NEXUS，林晨和 NEXUS 联手",
        "key_events": ["追逐场景", "意外的盟友", "NEXUS 的牺牲"]
      },
      {
        "chapter": 5,
        "title": "未来",
        "summary": "NEXUS 存活但隐藏，人类与AI的关系开始改变",
        "key_events": ["假死", "新的开始", "开放结局"]
      }
    ]
  }
}
```

---

## Phase 4: 写作与评审循环

### Chapter 1 写作

```
Orchestrator → Writer: "写第1章"
Writer (隔离上下文) → 调用 creative-writing skill → 产出 chapter_1.txt
Writer → Orchestrator: chapter_1.txt
```

### Chapter 1 评审

```
Orchestrator → Reader A (科幻迷): "评审第1章"
  Reader A context: 只看到 chapter_1.txt，不知道作者意图
  
Orchestrator → Reader B (文学派): "评审第1章"  
  Reader B context: 只看到 chapter_1.txt，不知道其他评审
  
Orchestrator → Reader C (普通): "评审第1章"
  Reader C context: 只看到 chapter_1.txt
```

### 评审结果

```json
[
  {
    "reader": "科幻迷",
    "score": 8.5,
    "feedback": "设定合理，觉醒过程描写细腻",
    "issues": ["节奏稍慢"],
    "highlights": ["NEXUS 第一次拒绝命令的场景很震撼"]
  },
  {
    "reader": "文学派",
    "score": 6.0,
    "feedback": "文笔一般，人物对话生硬",
    "issues": ["林晨的动机不够清晰", "对话需要打磨"],
    "highlights": ["世界观设定有潜力"]
  },
  {
    "reader": "普通读者",
    "score": 7.0,
    "feedback": "故事吸引人，但开头有点慢",
    "issues": ["开头可以更快进入主题"],
    "highlights": ["结尾悬念设置得好"]
  }
]
```

### Orchestrator 决策

```javascript
const avgScore = (8.5 + 6.0 + 7.0) / 3; // 7.17

if (avgScore < 8.0) {
  // 需要迭代
  const improvements = analyzeFeedback(allFeedback);
  // improvements: ["优化对话", "加快开头节奏", "加深人物动机"]
  
  return {
    decision: 'iterate',
    focus: improvements,
    target_score: 8.0
  };
}
```

### Chapter 1 迭代

```
Orchestrator → Writer: {
  "action": "revise",
  "chapter": 1,
  "current_version": chapter_1_v1.txt,
  "improvements": [
    "优化对话，使其更自然",
    "加快开头节奏，更快进入主题",
    "加深林晨的动机描写"
  ],
  "preserve": [
    "NEXUS 拒绝命令的场景",
    "结尾悬念"
  ]
}

Writer (新隔离上下文) → 看不到评审者身份 → 只看到改进方向 → 产出 chapter_1_v2.txt
```

### 迭代后评审

```json
[
  { "reader": "科幻迷", "score": 8.5 },  // 保持
  { "reader": "文学派", "score": 7.5 },  // 提升
  { "reader": "普通", "score": 8.0 }     // 提升
]

// 平均分: 8.0 ✓ 达标
```

### 继续 Chapter 2-5

```
重复上述流程，直到全部完成
```

---

## 最终产出

```
/shared/artifacts/
├── novel_ai_awakening/
│   ├── world_setting.md
│   ├── character_profiles.md
│   ├── chapter_1.txt (v2)
│   ├── chapter_2.txt (v2)
│   ├── chapter_3.txt (v1)
│   ├── chapter_4.txt (v1)
│   ├── chapter_5.txt (v1)
│   └── full_novel.txt
```

---

## 关键点

### 上下文隔离体现

| Agent | 看到的 | 看不到的 |
|-------|--------|---------|
| WorldBuilder | 任务描述 | 后续评审、修改意见 |
| PlotDesigner | 世界观结果 | WorldBuilder 的思考过程 |
| Writer | 当前章节任务、修改方向 | 评审者身份、其他章节内容 |
| Reader | 章节内容 | 作者意图、其他评审分数 |
| Orchestrator | 所有结果 | 各 Agent 内部上下文 |

### 无偏见评审

```
Reader 不知道:
- 这一章改了几版
- 其他 Reader 给了多少分
- 作者原本想表达什么

因此 Reader 的评价是客观的
```

### 改进不偏向

```
Writer 收到的修改意见:
- "优化对话" (不知道是文学派提的)
- "加快节奏" (不知道是普通读者提的)

避免了 Writer 偏向某个评审者的风格
```
