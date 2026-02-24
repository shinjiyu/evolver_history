---
name: skills-index
description: Skills 索引系统，统一管理和导航所有 Skills。适用于：(1) 查看所有可用 Skills、(2) 搜索 Skills、(3) 用户说"有哪些 Skills"、"Skills 列表"、(4) 了解 Skills 间协作关系。
---

# Skills Index - Skills 索引系统

统一管理和导航所有 Skills，提供搜索、分类、协作关系说明。

## 核心功能

```
索引 Skills → 分类展示 → 搜索 → 协作关系
```

## 使用场景

### 1. 查看所有 Skills

```
用户：有哪些 Skills
用户：Skills 列表
用户：list skills
```

**执行流程**:
1. 扫描 skills 目录
2. 读取每个 Skill 的元数据
3. 按分类展示
4. 显示统计信息

### 2. 搜索 Skills

```
用户：搜索 git 相关的 Skill
用户：find skill about git
```

**执行流程**:
1. 解析搜索关键词
2. 搜索 Skill 名称、描述、内容
3. 返回匹配结果
4. 显示相关度

### 3. 查看分类

```
用户：查看核心 Skills
用户：show core skills
```

**执行流程**:
1. 读取分类配置
2. 过滤对应分类的 Skills
3. 展示分类详情

---

## Skills 分类

### 核心系统 Skills

| Skill | 描述 | 用途 |
|-------|------|------|
| **safe-operations** | 安全操作 | 避免文件操作错误 |
| **evolution-verification** | 进化验证 | 验证优化效果 |
| **evolution-dashboard** | 进化仪表板 | 进化历程可视化 |
| **daily-review** | 每日回顾 | 每日总结报告 |

### 工作流 Skills

| Skill | 描述 | 用途 |
|-------|------|------|
| **git-workflow** | Git 工作流 | 标准化 Git 操作 |
| **api-key-configurator** | API Key 配置 | 管理 API Keys |

### 业务 Skills

| Skill | 描述 | 用途 |
|-------|------|------|
| **hr** | HR 管理 | 团队招募协作 |
| **novel-marketing** | 小说推广 | 营销自动化 |
| **adversarial-evaluation** | 对抗评估 | 质量评估 |

### 辅助 Skills

| Skill | 描述 | 用途 |
|-------|------|------|
| **log-to-skill** | 日志转 Skill | 从日志生成 Skill |
| **skill-doctor** | Skill 医生 | 诊断修复 Skills |
| **cross-evolution** | 跨项目进化 | 进化框架 |
| **neutral-judge-experiments** | 中立判断实验 | 实验框架 |
| **auto-platform-registration** | 平台注册 | 自动化注册 |

---

## Skills 协作关系

```
┌─────────────────────────────────────────────────────────────┐
│                     Skills 生态系统                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐    ┌──────────────────┐                  │
│  │ safe-        │    │ evolution-       │                  │
│  │ operations   │───▶│ verification     │                  │
│  └──────────────┘    └────────┬─────────┘                  │
│                               │                            │
│                               ▼                            │
│  ┌──────────────┐    ┌──────────────────┐                  │
│  │ daily-       │◀───│ evolution-       │                  │
│  │ review       │    │ dashboard        │                  │
│  └──────────────┘    └──────────────────┘                  │
│                                                             │
│  ┌──────────────┐    ┌──────────────────┐                  │
│  │ git-         │    │ api-key-         │                  │
│  │ workflow     │    │ configurator     │                  │
│  └──────────────┘    └──────────────────┘                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**协作关系说明**:

1. **safe-operations** → **evolution-verification**
   - 安全操作后验证效果

2. **evolution-dashboard** → **daily-review**
   - 仪表板数据支持每日报告

3. **log-to-skill** → **skill-doctor**
   - 生成的 Skills 可能需要诊断

4. **cross-evolution** → 所有 Skills
   - 提供进化框架支持

---

## Skills 索引报告格式

```markdown
# Skills 索引报告

**生成时间**: YYYY-MM-DD HH:MM
**Skills 总数**: XX 个
**分类数**: X 个

---

## 📊 统计概览

| 分类 | 数量 |
|------|------|
| 核心系统 | 4 |
| 工作流 | 2 |
| 业务 | 3 |
| 辅助 | 5 |
| **总计** | **14** |

---

## 📂 分类详情

### 核心系统 Skills (4 个)

1. **safe-operations**
   - 描述: 安全的文件操作
   - 创建: 2026-02-24
   - 大小: 4.2 KB

2. **evolution-verification**
   - 描述: 进化效果验证
   - 创建: 2026-02-24
   - 大小: 4.8 KB

...

---

## 🔍 搜索索引

| 关键词 | Skills |
|--------|--------|
| git | git-workflow |
| api | api-key-configurator |
| 进化 | evolution-verification, evolution-dashboard |
| 验证 | evolution-verification |
| 安全 | safe-operations |

---

## 📈 使用统计

| Skill | 引用次数 | 状态 |
|-------|---------|------|
| safe-operations | 10+ | 活跃 |
| git-workflow | 5+ | 活跃 |
| ... | ... | ... |

---

**报告生成**: Skills Index System
```

---

## 索引生成脚本

### generate-skills-index.js

```javascript
#!/usr/bin/env node
/**
 * Skills Index Generator - Skills 索引生成器
 */

const fs = require('fs');
const path = require('path');

const CONFIG = {
  skillsDir: '/root/.openclaw/workspace/skills',
  outputPath: '/root/.openclaw/workspace/memory/skills-index.md'
};

// 分类定义
const CATEGORIES = {
  core: ['safe-operations', 'evolution-verification', 'evolution-dashboard', 'daily-review'],
  workflow: ['git-workflow', 'api-key-configurator'],
  business: ['hr', 'novel-marketing', 'adversarial-evaluation'],
  auxiliary: ['log-to-skill', 'skill-doctor', 'cross-evolution', 'neutral-judge-experiments', 'auto-platform-registration']
};

// 扫描 Skills
function scanSkills() {
  const skills = [];
  
  const dirs = fs.readdirSync(CONFIG.skillsDir)
    .filter(f => fs.existsSync(path.join(CONFIG.skillsDir, f, 'SKILL.md')));
  
  dirs.forEach(dir => {
    const skillPath = path.join(CONFIG.skillsDir, dir, 'SKILL.md');
    const content = fs.readFileSync(skillPath, 'utf8');
    const stats = fs.statSync(skillPath);
    
    // 提取元数据
    const nameMatch = content.match(/^name:\s*(.+)$/m);
    const descMatch = content.match(/^description:\s*(.+)$/m);
    
    skills.push({
      dir,
      name: nameMatch ? nameMatch[1] : dir,
      description: descMatch ? descMatch[1].substring(0, 100) : '',
      size: (content.length / 1024).toFixed(1),
      created: stats.mtime.toLocaleDateString('zh-CN'),
      category: getCategory(dir)
    });
  });
  
  return skills;
}

function getCategory(skillDir) {
  for (const [cat, skills] of Object.entries(CATEGORIES)) {
    if (skills.includes(skillDir)) return cat;
  }
  return 'other';
}

// 生成报告
function generateReport(skills) {
  // ... 生成索引报告
}

// 执行
const skills = scanSkills();
const report = generateReport(skills);
fs.writeFileSync(CONFIG.outputPath, report);
console.log('✅ Skills 索引已生成');
```

---

## 搜索功能

### 关键词索引

```javascript
const KEYWORDS = {
  'git': ['git-workflow'],
  'api': ['api-key-configurator'],
  'key': ['api-key-configurator'],
  '进化': ['evolution-verification', 'evolution-dashboard'],
  '验证': ['evolution-verification'],
  '安全': ['safe-operations'],
  '文件': ['safe-operations'],
  '回顾': ['daily-review'],
  '报告': ['daily-review', 'evolution-dashboard'],
  'hr': ['hr'],
  '团队': ['hr'],
  '推广': ['novel-marketing'],
  '评估': ['adversarial-evaluation'],
  '医生': ['skill-doctor'],
  '日志': ['log-to-skill']
};

function searchSkills(keyword) {
  const results = [];
  for (const [key, skills] of Object.entries(KEYWORDS)) {
    if (key.includes(keyword.toLowerCase())) {
      results.push(...skills);
    }
  }
  return [...new Set(results)];
}
```

---

## 使用示例

### 示例 1: 查看所有 Skills

```
用户：有哪些 Skills

助手：正在扫描 Skills 目录...

# Skills 索引报告

Skills 总数: 14 个

## 核心系统 Skills (4 个)
- safe-operations: 安全的文件操作
- evolution-verification: 进化效果验证
- evolution-dashboard: 进化仪表板
- daily-review: 每日回顾

## 工作流 Skills (2 个)
- git-workflow: Git 工作流
- api-key-configurator: API Key 配置

## 业务 Skills (3 个)
- hr: HR 管理
- novel-marketing: 小说推广
- adversarial-evaluation: 对抗评估

## 辅助 Skills (5 个)
- log-to-skill: 日志转 Skill
- skill-doctor: Skill 医生
- cross-evolution: 跨项目进化
- neutral-judge-experiments: 中立判断实验
- auto-platform-registration: 平台注册
```

### 示例 2: 搜索 Skills

```
用户：搜索 git 相关的 Skill

助手：搜索结果:

找到 1 个匹配的 Skill:

1. **git-workflow**
   - 描述: Git 工作流标准化助手
   - 分类: 工作流
   - 创建: 2026-02-24
   
   使用场景:
   - 自动生成提交信息
   - 标准化 Git 操作
   - 快速推送
```

---

## 定期更新

### 索引更新 Cron

```bash
# 每天更新 Skills 索引
0 6 * * * cd /root/.openclaw/workspace/evolver && node generate-skills-index.js
```

---

## 配置选项

```yaml
skills_index:
  enabled: true
  schedule: "0 6 * * *"  # 每天 6:00
  categories:
    - core: ['safe-operations', 'evolution-verification', ...]
    - workflow: ['git-workflow', 'api-key-configurator']
    - business: ['hr', 'novel-marketing', ...]
    - auxiliary: ['log-to-skill', 'skill-doctor', ...]
```

---

**相关文件**:
- 脚本: `/root/.openclaw/workspace/evolver/generate-skills-index.js`
- 输出: `/root/.openclaw/workspace/memory/skills-index.md`

**Pattern**: 建立 Skills 索引机制
