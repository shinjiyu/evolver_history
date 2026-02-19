/**
 * Multi-Agent Workflow Demo
 * 
 * 演示如何使用多 agent 协作完成复杂任务
 */

const Orchestrator = require('./orchestrator');
const ResearchAgent = require('./research-agent');
const ExecutorAgent = require('./executor-agent');
const VerifierAgent = require('./verifier-agent');

async function runWorkflow(userGoal) {
  console.log('========================================');
  console.log('  Multi-Agent Collaboration Workflow');
  console.log('========================================\n');

  // 1. 初始化 Orchestrator
  const orchestrator = new Orchestrator({
    sharedStatePath: '/root/.openclaw/workspace/multi-agent/shared-state.json'
  });

  // 2. 注册 Subagents
  const researchAgent = new ResearchAgent();
  const executorAgent = new ExecutorAgent();
  const verifierAgent = new VerifierAgent();

  orchestrator.registerAgent(researchAgent);
  orchestrator.registerAgent(executorAgent);
  orchestrator.registerAgent(verifierAgent);

  console.log(`Registered ${orchestrator.agents.size} agents\n`);

  // 3. 接收并分解任务
  console.log('--- Task Decomposition ---');
  const subtasks = orchestrator.receiveTask(userGoal, {
    constraints: ['high quality', 'fast execution']
  });

  console.log(`\nDecomposed into ${subtasks.length} subtasks:`);
  subtasks.forEach((t, i) => {
    console.log(`  ${i + 1}. [${t.type}] ${t.description} (${t.priority})`);
  });
  console.log('');

  // 4. 执行任务 (模拟)
  console.log('--- Task Execution ---');
  for (const task of subtasks) {
    console.log(`\nProcessing: ${task.id}`);
    const result = await orchestrator.assignTask(task);
    console.log(`Result: ${result.success ? 'SUCCESS' : 'FAILED'}`);
  }

  // 5. 获取进度
  console.log('\n--- Progress ---');
  const progress = orchestrator.getProgress();
  console.log(JSON.stringify(progress, null, 2));

  // 6. 汇报最终结果
  const summary = orchestrator.reportFinalResult();

  return summary;
}

// 运行示例
if (require.main === module) {
  const userGoal = process.argv[2] || '研究和实现一个 API 代理服务器并验证功能';
  runWorkflow(userGoal).catch(console.error);
}

module.exports = { runWorkflow };
