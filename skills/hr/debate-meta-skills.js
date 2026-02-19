/**
 * HR 辩论评测 - meta_skills 项目
 * 
 * 使用 HR Skill 招募正反方评测员进行交互式辩论
 */

const { HRTeamBuilder, ROLE_TEMPLATES } = require('/root/.openclaw/workspace/skills/hr/hr-team-builder.js');
const https = require('https');
const fs = require('fs');
const path = require('path');

const TARGET_REPO = 'https://github.com/shinjiyu/meta_skills';

console.log('========================================');
console.log('  HR 辩论评测: meta_skills 项目');
console.log('========================================\n');
console.log(`目标: ${TARGET_REPO}\n`);

async function fetchRepoInfo() {
  return new Promise((resolve) => {
    https.get(`https://api.github.com/repos/shinjiyu/meta_skills`, {
      headers: { 'User-Agent': 'OpenClaw-HR' }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve({});
        }
      });
    }).on('error', () => resolve({}));
  });
}

async function main() {
  // 1. 获取项目信息
  console.log('--- Step 1: 获取项目信息 ---\n');
  const repoInfo = await fetchRepoInfo();
  
  console.log('项目信息:');
  console.log(`  名称: ${repoInfo.name || 'meta_skills'}`);
  console.log(`  描述: ${repoInfo.description || 'N/A'}`);
  console.log(`  Stars: ${repoInfo.stargazers_count || 'N/A'}`);
  console.log(`  语言: ${repoInfo.language || 'N/A'}`);
  console.log(`  URL: ${repoInfo.html_url || TARGET_REPO}`);
  console.log('');

  // 2. HR 组建辩论团队
  console.log('--- Step 2: HR 组建辩论团队 ---\n');
  
  const hr = new HRTeamBuilder();
  const request = `用对抗方式对 ${TARGET_REPO} 进行交互式辩论评测`;
  
  const config = hr.analyzeRequirements(request);
  console.log('需求分析:');
  console.log(`  类型: ${config.type}`);
  console.log(`  协作模式: ${config.mode}`);
  console.log(`  角色: ${config.roles.join(', ')}`);
  console.log('');

  const teamInfo = hr.buildTeam(config, request);
  console.log('团队组建:');
  console.log(`  项目ID: ${teamInfo.projectId}`);
  console.log(`  团队规模: ${teamInfo.teamSize}人`);
  console.log('');

  // 3. 定制任务分配
  console.log('--- Step 3: 定制任务分配 ---\n');
  
  const debateTasks = {
    proponent: {
      role: '支持者 (Proponent)',
      task: `你是支持者 Agent，从正面角度评测 GitHub 项目: ${TARGET_REPO}

项目信息:
- 名称: ${repoInfo.name || 'meta_skills'}
- 描述: ${repoInfo.description || 'Meta skills repository'}
- Stars: ${repoInfo.stargazers_count || 'N/A'}

你的职责:
1. 分析项目的创新性和价值
2. 找出设计优点和技术亮点
3. 论证其实用性和应用前景
4. 针对反方可能的质疑准备反驳

输出格式:
## 正方观点

### 核心优点
1. ...
2. ...
3. ...

### 价值论证
...

### 针对反方的反驳
...
`,
      stance: 'positive'
    },
    
    opponent: {
      role: '反对者 (Opponent)', 
      task: `你是反对者 Agent，从批判角度评测 GitHub 项目: ${TARGET_REPO}

项目信息:
- 名称: ${repoInfo.name || 'meta_skills'}
- 描述: ${repoInfo.description || 'Meta skills repository'}
- Stars: ${repoInfo.stargazers_count || 'N/A'}

你的职责:
1. 找出项目的设计缺陷和局限性
2. 质疑其概念的可行性和实用性
3. 指出潜在风险和技术债务
4. 针对正方的论点准备质疑

输出格式:
## 反方观点

### 核心问题
1. ...
2. ...
3. ...

### 风险论证
...

### 针对正方的质疑
...
`,
      stance: 'negative'
    },
    
    judge: {
      role: '裁判 (Judge)',
      task: `你是裁判 Agent，综合正反双方观点做出客观判断。

项目: ${TARGET_REPO}

你的职责:
1. 听取正反双方的论点
2. 评估双方论证的说服力
3. 权衡项目的实际价值
4. 给出综合评判和最终评分

输出格式:
## 综合评判

### 正方优势论点
...

### 反方有效质疑
...

### 综合分析
...

### 最终评分
- 创新性: X/10
- 实用性: X/10
- 完成度: X/10
- 总评: X/10

### 建议采纳程度
[强烈推荐 / 推荐尝试 / 谨慎使用 / 不推荐]

### 理由
...
`,
      stance: 'neutral'
    }
  };

  console.log('任务分配:');
  for (const [key, value] of Object.entries(debateTasks)) {
    console.log(`\n【${value.role}】`);
    console.log(`立场: ${value.stance}`);
    console.log(`任务: ${value.task.substring(0, 100)}...`);
  }

  // 4. 生成 Subagent Spawn 指令
  console.log('\n\n--- Step 4: Subagent 创建指令 ---\n');
  
  const spawnInstructions = [
    {
      tool: 'sessions_spawn',
      params: {
        task: debateTasks.proponent.task,
        label: `支持者: 正面评测 ${TARGET_REPO}`,
        model: 'glm-4-plus'
      }
    },
    {
      tool: 'sessions_spawn', 
      params: {
        task: debateTasks.opponent.task,
        label: `反对者: 批判评测 ${TARGET_REPO}`,
        model: 'glm-4-plus'
      }
    },
    {
      tool: 'sessions_spawn',
      params: {
        task: debateTasks.judge.task,
        label: `裁判: 综合评判 ${TARGET_REPO}`,
        model: 'glm-4-plus'
      }
    }
  ];

  console.log('复制以下指令到 OpenClaw 对话中创建 Subagent:\n');
  console.log('```');
  for (const inst of spawnInstructions) {
    console.log(`spawn subagent with:`);
    console.log(`  task: "${inst.params.label}"`);
    console.log(`  model: ${inst.params.model}`);
    console.log('');
  }
  console.log('```\n');

  // 5. 生成交互式辩论流程
  console.log('--- Step 5: 交互式辩论流程 ---\n');
  
  const debateFlow = `
## 辩论流程

### 第一轮: 开篇陈述
1. **支持者** 发表正面观点 (2分钟)
2. **反对者** 发表批判观点 (2分钟)

### 第二轮: 交叉质询  
3. **支持者** 质疑反方观点
4. **反对者** 质疑正方观点

### 第三轮: 总结陈词
5. **支持者** 总结陈词
6. **反对者** 总结陈词

### 最终: 裁判判决
7. **裁判** 综合评判，给出最终评分

---

## 执行方式

由于 OpenClaw Subagent 是独立运行的，建议:

1. **并行启动**: 同时创建支持者和反对者两个 subagent
2. **等待结果**: 使用 \`/subagents list\` 查看状态
3. **收集观点**: 使用 \`/subagents log <id>\` 查看输出
4. **启动裁判**: 收集正反方观点后，启动裁判 subagent
5. **最终裁决**: 裁判综合双方观点给出判决
`;

  console.log(debateFlow);

  // 6. 保存辩论配置
  const debateConfig = {
    target: TARGET_REPO,
    repoInfo: repoInfo,
    projectId: teamInfo.projectId,
    team: Object.keys(debateTasks).map(k => ({
      role: debateTasks[k].role,
      stance: debateTasks[k].stance
    })),
    spawnInstructions: spawnInstructions,
    createdAt: new Date().toISOString()
  };

  const configPath = `/root/.openclaw/workspace/skills/hr/state/debate_${Date.now()}.json`;
  fs.writeFileSync(configPath, JSON.stringify(debateConfig, null, 2));
  console.log(`\n辩论配置已保存: ${configPath}`);

  // 7. 模拟辩论输出
  console.log('\n--- Step 6: 模拟辩论输出 ---\n');
  
  console.log('═══════════════════════════════════════════════════');
  console.log('           模拟辩论结果 (示例)');
  console.log('═══════════════════════════════════════════════════\n');

  console.log('【支持者观点】');
  console.log('┌─────────────────────────────────────────────────┐');
  console.log('│ meta_skills 的核心优点:                         │');
  console.log('│                                                 │');
  console.log('│ 1. 创新性: 首次提出 meta-skill 概念              │');
  console.log('│    - 将 skill 进化本身封装为 skill               │');
  console.log('│    - 实现了 AI 自我改进的框架                    │');
  console.log('│                                                 │');
  console.log('│ 2. 实用价值:                                    │');
  console.log('│    - 提供标准化的 skill 开发模板                 │');
  console.log('│    - 降低 skill 开发门槛                        │');
  console.log('│    - 促进 skill 生态发展                        │');
  console.log('│                                                 │');
  console.log('│ 3. 技术亮点:                                    │');
  console.log('│    - 清晰的层级结构设计                         │');
  console.log('│    - 完善的文档体系                             │');
  console.log('│    - 开源社区友好                               │');
  console.log('└─────────────────────────────────────────────────┘\n');

  console.log('【反对者观点】');
  console.log('┌─────────────────────────────────────────────────┐');
  console.log('│ meta_skills 的核心问题:                         │');
  console.log('│                                                 │');
  console.log('│ 1. 概念模糊:                                    │');
  console.log('│    - meta-skill 边界定义不清                    │');
  console.log('│    - 与普通 skill 区分标准不明                  │');
  console.log('│    - 可能导致无限递归                           │');
  console.log('│                                                 │');
  console.log('│ 2. 实用性存疑:                                  │');
  console.log('│    - 缺少真实应用案例验证                       │');
  console.log('│    - 理论性强，落地困难                         │');
  console.log('│    - 学习成本可能很高                           │');
  console.log('│                                                 │');
  console.log('│ 3. 技术风险:                                    │');
  console.log('│    - 自指设计可能导致死循环                     │');
  console.log('│    - 没有性能评估指标                           │');
  console.log('│    - 文档仍需完善                               │');
  console.log('└─────────────────────────────────────────────────┘\n');

  console.log('【裁判判决】');
  console.log('┌─────────────────────────────────────────────────┐');
  console.log('│ 综合评判:                                       │');
  console.log('│                                                 │');
  console.log('│ 正方优势论点:                                   │');
  console.log('│ - meta-skill 概念确实具有创新性                 │');
  console.log('│ - 文档和模板降低了上手门槛                      │');
  console.log('│ - 对 AI 自我进化有探索价值                      │');
  console.log('│                                                 │');
  console.log('│ 反方有效质疑:                                   │');
  console.log('│ - 概念边界确实需要更清晰定义                    │');
  console.log('│ - 缺少实际案例是硬伤                            │');
  console.log('│ - 自指风险需要机制防范                          │');
  console.log('│                                                 │');
  console.log('│ 最终评分:                                       │');
  console.log('│ 创新性: 8/10   实用性: 5/10   完成度: 6/10      │');
  console.log('│ 总评: 6.5/10                                    │');
  console.log('│                                                 │');
  console.log('│ 建议采纳程度: 谨慎使用 / 推荐尝试               │');
  console.log('│                                                 │');
  console.log('│ 理由: 项目概念创新但落地不足，适合技术探索      │');
  console.log('│ 和实验性项目，生产环境建议等待更多验证。        │');
  console.log('└─────────────────────────────────────────────────┘\n');

  console.log('═══════════════════════════════════════════════════');
  console.log('           辩论评测完成');
  console.log('═══════════════════════════════════════════════════\n');

  console.log('========================================');
  console.log('  HR 辩论评测流程结束');
  console.log('========================================');
}

main().catch(console.error);
