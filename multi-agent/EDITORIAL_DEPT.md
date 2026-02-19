# 编辑部多Agent协作系统

## 架构设计

```
┌─────────────────────────────────────────────────────────────────┐
│                         用户请求                                 │
│                    "帮我写一部科幻小说"                          │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      主编 Orchestrator                           │
│                                                                 │
│  职责：                                                         │
│  - 解析用户需求                                                 │
│  - 制定写作计划                                                 │
│  - 分配任务给编辑                                               │
│  - 收集读者反馈                                                 │
│  - 决定是否迭代                                                 │
│  - 最终交付                                                     │
└─────────────────────────┬───────────────────────────────────────┘
                          │
          ┌───────────────┴───────────────┐
          │                               │
          ▼                               ▼
┌─────────────────────┐         ┌─────────────────────┐
│      编辑部         │         │      评审部         │
│   (EditorialDept)   │         │   (ReviewDept)      │
└──────────┬──────────┘         └──────────┬──────────┘
           │                               │
     ┌─────┼─────┬─────┐             ┌─────┼─────┐
     │     │     │     │             │     │     │
     ▼     ▼     ▼     ▼             ▼     ▼     ▼
┌───────┐┌───────┐┌───────┐     ┌───────┐┌───────┐┌───────┐
│设定师 ││剧情师 ││文案师 │     │读者A  ││读者B  ││读者C  │
│       ││       ││       │     │       ││       ││       │
│世界构建││剧情设计││文字撰写│     │科幻迷  ││文学派  ││普通读者│
└───────┘└───────┘└───────┘     └───────┘└───────┘└───────┘
```

## Subagent 类型定义

### 1. 编辑部 (EditorialDept)

#### 设定师 (WorldBuilder)
```javascript
{
  id: 'world_builder',
  role: '设定师',
  capabilities: ['world-building', 'character-design', 'setting-consistency'],
  inputs: ['genre', 'theme', 'target_length'],
  outputs: ['world_setting', 'characters', 'magic_system', 'timeline']
}
```

#### 剧情师 (PlotDesigner)
```javascript
{
  id: 'plot_designer',
  role: '剧情师',
  capabilities: ['plot-structure', 'pacing', 'conflict-design', 'climax'],
  inputs: ['world_setting', 'characters', 'target_chapters'],
  outputs: ['chapter_outline', 'plot_points', 'conflicts', 'resolution']
}
```

#### 文案师 (Writer)
```javascript
{
  id: 'writer',
  role: '文案师',
  capabilities: ['prose-writing', 'dialogue', 'description', 'style'],
  inputs: ['chapter_outline', 'characters', 'style_guide'],
  outputs: ['chapter_content', 'word_count']
}
```

### 2. 评审部 (ReviewDept)

#### 读者 Agent (Reader)
```javascript
{
  id: 'reader_${type}',
  role: '读者',
  personality: 'sci-fi_fan | literary | casual | critic',
  inputs: ['chapter_content'],
  outputs: {
    score: 1-10,
    feedback: 'string',
    highlights: ['good_parts'],
    issues: ['bad_parts'],
    suggestions: ['improvement_ideas']
  }
}
```

### 3. 主编 (ChiefEditor / Orchestrator)

```javascript
{
  id: 'chief_editor',
  role: '主编',
  capabilities: [
    'task-decomposition',
    'agent-coordination',
    'quality-control',
    'iteration-decision',
    'final-delivery'
  ],
  
  workflow: {
    planning: [
      '解析用户需求',
      '制定写作大纲',
      '分配章节任务'
    ],
    
    execution: [
      '监控进度',
      '处理阻塞',
      '质量把控'
    ],
    
    review: [
      '收集读者反馈',
      '汇总评分',
      '分析问题'
    ],
    
    iteration: [
      '决定是否迭代',
      '制定修改计划',
      '分配修改任务'
    ]
  }
}
```

## 通信协议

### 任务消息
```javascript
{
  type: 'task',
  task_id: 'chapter_001',
  from: 'chief_editor',
  to: 'writer',
  action: 'write_chapter',
  payload: {
    chapter_number: 1,
    outline: '...',
    characters: ['主角A', '配角B'],
    style: '紧张刺激',
    word_count_target: 3000
  }
}
```

### 反馈消息
```javascript
{
  type: 'feedback',
  task_id: 'chapter_001',
  from: 'reader_sci_fi',
  payload: {
    score: 8,
    feedback: '节奏紧凑，但人物动机不够清晰',
    highlights: ['开场的悬念设置很好'],
    issues: ['反派出现太突兀'],
    suggestions: ['可以增加反派的前期铺垫']
  }
}
```

### 迭代决策
```javascript
{
  type: 'iteration_decision',
  from: 'chief_editor',
  payload: {
    decision: 'iterate',  // or 'accept', 'reject'
    reason: '平均分7.2，低于8分阈值',
    focus_areas: ['人物塑造', '反派铺垫'],
    target_score: 8.5,
    max_iterations: 3
  }
}
```

## 共享状态 (shared-state.json)

```javascript
{
  project_id: 'novel_sci_fi_001',
  title: '星际迷途',
  genre: '科幻',
  
  status: {
    phase: 'reviewing',  // planning | writing | reviewing | iterating | completed
    current_chapter: 3,
    total_chapters: 10,
    iteration_count: 1
  },
  
  world: {
    setting: '...由设定师产出...',
    characters: [...],
    timeline: [...]
  },
  
  chapters: {
    '1': {
      outline: '...',
      content: '...',
      word_count: 3200,
      reviews: [
        { reader: 'sci_fi', score: 8, feedback: '...' },
        { reader: 'literary', score: 6, feedback: '...' },
        { reader: 'casual', score: 7, feedback: '...' }
      ],
      avg_score: 7.0,
      iteration: 1,
      status: 'needs_revision'
    }
  },
  
  metrics: {
    total_words: 9600,
    avg_score: 7.0,
    target_score: 8.0
  }
}
```

## 工作流程示例

### 第一轮：初稿
```
1. 用户: "写一部10章的硬科幻小说"
2. 主编 → 设定师: "构建世界观和人物"
3. 设定师 → 主编: {设定完成}
4. 主编 → 剧情师: "设计10章剧情大纲"
5. 剧情师 → 主编: {大纲完成}
6. 主编 → 文案师: "写第1-3章" (并行)
7. 文案师 → 主编: {章节完成}
8. 主编 → 读者们: "评审第1-3章"
9. 读者们 → 主编: {评分和反馈}
10. 主编决策: "平均分7.0，需要迭代"
```

### 第二轮：迭代
```
11. 主编分析反馈 → 发现问题: "人物单薄"
12. 主编 → 设定师: "深化主角背景"
13. 设定师 → 主编: {更新设定}
14. 主编 → 文案师: "重写第1-3章，注重人物"
15. 文案师 → 主编: {新版本}
16. 主编 → 读者们: "重新评审"
17. 读者们 → 主编: {新评分: 8.2}
18. 主编决策: "达标，继续写第4-6章"
```

---

## OpenClaw 集成方案

### 方案：Skills + 文件通信

```
/root/.openclaw/workspace/skills/
└── editorial-dept/
    ├── skill.md              # 主入口
    ├── orchestrator.js       # 主编逻辑
    ├── agents/
    │   ├── world-builder.js  # 设定师
    │   ├── plot-designer.js  # 剧情师
    │   ├── writer.js         # 文案师
    │   └── reader.js         # 读者模板
    └── state/
        └── shared-state.json # 共享状态
```

这样可以通过 `use_skill editorial-dept` 启动整个编辑部。
