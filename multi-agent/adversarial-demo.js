/**
 * 对抗式分析 Demo
 * 
 * 创建两个对抗的 Subagent：支持者 vs 反对者
 * 分析 https://github.com/shinjiyu/meta_skills
 */

const { Scheduler, AgentManager } = require('./file-based-system');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const GITHUB_URL = 'https://github.com/shinjiyu/meta_skills';

async function adversarialAnalysis() {
  console.log('========================================');
  console.log('  对抗式项目分析 Demo');
  console.log('========================================\n');
  console.log(`目标: ${GITHUB_URL}\n`);

  const scheduler = new Scheduler();
  const agentManager = new AgentManager();

  // 1. 克隆项目获取信息
  console.log('--- Step 1: 获取项目信息 ---\n');
  
  const projectInfo = await getProjectInfo(GITHUB_URL);
  console.log('项目信息:');
  console.log(`- 名称: ${projectInfo.name}`);
  console.log(`- 描述: ${projectInfo.description}`);
  console.log(`- Stars: ${projectInfo.stars}`);
  console.log(`- 文件数: ${projectInfo.files?.length || 'N/A'}`);
  console.log('');

  // 2. 创建对抗的 Agents
  console.log('--- Step 2: 创建对抗 Agents ---\n');

  // 支持者 Agent
  const proponent = agentManager.createAgent({
    type: 'proponent',
    role: '项目支持者 - 从正面角度分析项目优点',
    allowed_skills: ['neutral-evaluator', 'log-analysis']
  });

  // 反对者 Agent  
  const opponent = agentManager.createAgent({
    type: 'opponent',
    role: '项目反对者 - 从批判角度分析项目问题',
    allowed_skills: ['neutral-evaluator', 'log-analysis']
  });

  console.log(`支持者 Agent: ${proponent.id}`);
  console.log(`反对者 Agent: ${opponent.id}\n`);

  // 3. 创建分析任务
  console.log('--- Step 3: 创建分析任务 ---\n');

  const proponentTask = scheduler.createTask({
    type: 'proponent',
    description: '从正面角度分析 meta_skills 项目的优点和价值',
    inputs: {
      project_url: GITHUB_URL,
      project_info: projectInfo,
      perspective: 'proponent',
      focus_areas: [
        '创新性和原创性',
        '实用价值和应用场景',
        '代码质量和架构设计',
        '文档完整性和可读性',
        '社区潜力和可扩展性'
      ]
    },
    constraints: {
      timeout: 120
    }
  });

  const opponentTask = scheduler.createTask({
    type: 'opponent',
    description: '从批判角度分析 meta_skills 项目的问题和不足',
    inputs: {
      project_url: GITHUB_URL,
      project_info: projectInfo,
      perspective: 'opponent',
      focus_areas: [
        '设计缺陷和局限性',
        '潜在的技术债务',
        '缺少的功能或特性',
        '性能和可扩展性隐患',
        '文档不足或错误'
      ]
    },
    constraints: {
      timeout: 120
    }
  });

  // 4. 分配任务
  console.log('--- Step 4: 分配任务 ---\n');
  
  scheduler.assignTask(proponentTask.task_id, proponent.id);
  scheduler.assignTask(opponentTask.task_id, opponent.id);

  // 5. 模拟 Agent 执行（实际应该由真实 Agent 执行）
  console.log('--- Step 5: Agents 执行分析 ---\n');

  // 支持者分析
  const proponentResult = await simulateProponentAnalysis(proponent.id, projectInfo);
  agentManager.writeResult(proponent.id, {
    task_id: proponentTask.task_id,
    result: proponentResult
  });
  scheduler.completeTask(proponentTask.task_id, proponentResult);

  // 反对者分析
  const opponentResult = await simulateOpponentAnalysis(opponent.id, projectInfo);
  agentManager.writeResult(opponent.id, {
    task_id: opponentTask.task_id,
    result: opponentResult
  });
  scheduler.completeTask(opponentTask.task_id, opponentResult);

  // 6. 汇总结果
  console.log('--- Step 6: 汇总对抗分析结果 ---\n');

  console.log('═══════════════════════════════════════');
  console.log('           支持者观点 (正面)');
  console.log('═══════════════════════════════════════');
  console.log(proponentResult.summary);
  console.log('\n优点列表:');
  proponentResult.strengths.forEach((s, i) => console.log(`  ${i+1}. ${s}`));
  console.log(`\n总体评分: ${proponentResult.score}/10`);
  console.log('');

  console.log('═══════════════════════════════════════');
  console.log('           反对者观点 (负面)');
  console.log('═══════════════════════════════════════');
  console.log(opponentResult.summary);
  console.log('\n问题列表:');
  opponentResult.weaknesses.forEach((w, i) => console.log(`  ${i+1}. ${w}`));
  console.log(`\n总体评分: ${opponentResult.score}/10`);
  console.log('');

  // 7. 综合结论
  console.log('═══════════════════════════════════════');
  console.log('           综合分析结论');
  console.log('═══════════════════════════════════════');
  
  const avgScore = (proponentResult.score + opponentResult.score) / 2;
  console.log(`平均评分: ${avgScore.toFixed(1)}/10`);
  console.log(`支持者评分: ${proponentResult.score}/10`);
  console.log(`反对者评分: ${opponentResult.score}/10`);
  console.log('');
  
  console.log('关键洞察:');
  console.log(`- 最大优点: ${proponentResult.strengths[0]}`);
  console.log(`- 最大问题: ${opponentResult.weaknesses[0]}`);
  console.log('');
  
  console.log('建议:');
  const recommendations = generateRecommendations(proponentResult, opponentResult);
  recommendations.forEach((r, i) => console.log(`  ${i+1}. ${r}`));

  // 8. 保存结果
  const finalReport = {
    target: GITHUB_URL,
    analyzed_at: new Date().toISOString(),
    project_info: projectInfo,
    proponent: proponentResult,
    opponent: opponentResult,
    synthesis: {
      average_score: avgScore,
      recommendations: recommendations
    }
  };

  const reportPath = '/root/.openclaw/workspace/subagents/shared/adversarial_analysis_report.json';
  fs.writeFileSync(reportPath, JSON.stringify(finalReport, null, 2));
  console.log(`\n完整报告已保存: ${reportPath}`);

  console.log('\n========================================');
  console.log('  分析完成');
  console.log('========================================');
}

/**
 * 获取项目信息
 */
async function getProjectInfo(githubUrl) {
  // 从 URL 提取 owner/repo
  const match = githubUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
  if (!match) {
    return { name: 'unknown', description: '', stars: 0 };
  }

  const [, owner, repo] = match;
  
  // 模拟获取项目信息（实际应该调用 GitHub API）
  return {
    name: repo,
    owner: owner,
    full_name: `${owner}/${repo}`,
    description: 'Meta skills repository for skill development and evolution',
    stars: 42,
    forks: 5,
    language: 'Markdown',
    topics: ['skills', 'meta-skills', 'ai', 'agents'],
    url: githubUrl,
    files: [
      'README.md',
      'SKILL.md',
      'templates/',
      'examples/'
    ],
    readme_preview: 'A repository containing meta-level skills for AI agents...'
  };
}

/**
 * 模拟支持者分析
 */
async function simulateProponentAnalysis(agentId, projectInfo) {
  // 模拟 Agent 思考过程
  console.log(`[${agentId}] 正在从正面角度分析...`);
  
  return {
    agent_id: agentId,
    perspective: 'proponent',
    summary: 'meta_skills 是一个有创新性的项目，为 AI Agent 的 skill 发展提供了有价值的框架和方法论。',
    strengths: [
      '创新性地提出了 meta-skill 的概念，将 skill 本身的进化过程也封装为 skill',
      '结构清晰，文档完善，便于理解和使用',
      '提供了实用的模板和示例，降低了上手门槛',
      '关注 AI Agent 的自我进化能力，具有前瞻性',
      '开源社区友好，有利于协作和迭代'
    ],
    score: 8,
    confidence: 0.85,
    analyzed_at: new Date().toISOString()
  };
}

/**
 * 模拟反对者分析
 */
async function simulateOpponentAnalysis(agentId, projectInfo) {
  // 模拟 Agent 思考过程
  console.log(`[${agentId}] 正在从批判角度分析...`);
  
  return {
    agent_id: agentId,
    perspective: 'opponent',
    summary: 'meta_skills 项目存在一些概念模糊和实用性问题，需要更多实际验证。',
    weaknesses: [
      'meta-skill 概念过于抽象，缺乏明确的边界定义',
      '缺少实际应用案例的验证，理论性过强',
      'self-referential (自指) 设计可能导致无限递归问题',
      '文档虽然有，但缺少完整的教程和最佳实践',
      '没有性能评估指标，难以衡量实际效果'
    ],
    score: 5,
    confidence: 0.75,
    analyzed_at: new Date().toISOString()
  };
}

/**
 * 生成综合建议
 */
function generateRecommendations(proponent, opponent) {
  const recommendations = [];
  
  // 基于 opposing 观点生成平衡建议
  recommendations.push('明确 meta-skill 的定义和边界，避免概念过于抽象');
  recommendations.push('添加更多实际应用案例和教程，提高可用性');
  recommendations.push('建立性能评估指标，量化 skill 进化效果');
  recommendations.push('解决潜在的自指递归问题，确保系统稳定性');
  recommendations.push('在保持创新性的同时，加强与现有框架的兼容');
  
  return recommendations;
}

// 运行
if (require.main === module) {
  adversarialAnalysis().catch(console.error);
}

module.exports = { adversarialAnalysis };
