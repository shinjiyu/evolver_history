/**
 * File-Based Subagent System - Demo
 * 
 * 演示基于文件的 Agent 协作
 */

const { Scheduler, AgentManager } = require('./file-based-system');

async function demo() {
  console.log('========================================');
  console.log('  File-Based Subagent System Demo');
  console.log('========================================\n');

  // 1. 初始化系统
  const scheduler = new Scheduler();
  const agentManager = new AgentManager();

  // 2. 创建 Agents
  console.log('--- Creating Agents ---\n');
  
  const researcher = agentManager.createAgent({
    type: 'researcher',
    role: '信息收集与分析',
    allowed_skills: ['log-analysis', 'neutral-evaluator']
  });
  
  const executor = agentManager.createAgent({
    type: 'executor',
    role: '执行操作',
    allowed_skills: ['skill-creator', 'feishu-doc']
  });

  const reviewer = agentManager.createAgent({
    type: 'reviewer',
    role: '结果审核',
    allowed_skills: ['neutral-evaluator']
  });

  // 3. 创建任务
  console.log('\n--- Creating Tasks ---\n');
  
  const task1 = scheduler.createTask({
    type: 'researcher',
    description: '分析 OpenClaw 日志，找出常见错误模式',
    inputs: {
      log_path: '/root/.openclaw/logs'
    }
  });

  const task2 = scheduler.createTask({
    type: 'executor',
    description: '根据分析结果创建一个错误处理 Skill',
    inputs: {},
    depends_on: [task1.task_id]
  });

  const task3 = scheduler.createTask({
    type: 'reviewer',
    description: '审核生成的 Skill 质量',
    inputs: {},
    depends_on: [task2.task_id]
  });

  // 4. 分配任务
  console.log('\n--- Assigning Tasks ---\n');
  
  scheduler.assignTask(task1.task_id, researcher.id);
  scheduler.assignTask(task2.task_id, executor.id);
  scheduler.assignTask(task3.task_id, reviewer.id);

  // 5. 查看 Agent 状态
  console.log('\n--- Agent Status ---\n');
  
  const agents = scheduler.listAgents();
  for (const agent of agents) {
    console.log(`${agent.id}: ${agent.status} - ${agent.current_task || 'no task'}`);
  }

  // 6. 模拟任务完成
  console.log('\n--- Simulating Task Completion ---\n');
  
  // Researcher 完成任务
  const researchResult = {
    findings: ['发现 5 种常见错误模式', '最频繁: API 超时'],
    recommendations: ['建议创建重试 Skill']
  };
  scheduler.completeTask(task1.task_id, researchResult);
  
  // 写入结果到 researcher 的 outbox
  agentManager.writeResult(researcher.id, {
    task_id: task1.task_id,
    result: researchResult
  });

  // 查看更新后的状态
  console.log('Updated agent status:');
  for (const agent of scheduler.listAgents()) {
    console.log(`  ${agent.id}: ${agent.status}`);
  }

  // 7. 查看目录结构
  console.log('\n--- File Structure ---\n');
  
  const { execSync } = require('child_process');
  const output = execSync(`find /root/.openclaw/workspace/subagents -type f -name "*.json" | head -20`).toString();
  console.log(output);

  // 8. 清理（可选）
  // console.log('\n--- Cleanup ---\n');
  // agentManager.destroyAgent(researcher.id);
  // agentManager.destroyAgent(executor.id);
  // agentManager.destroyAgent(reviewer.id);

  console.log('========================================');
  console.log('  Demo Complete');
  console.log('========================================');
}

// 运行 demo
if (require.main === module) {
  demo().catch(console.error);
}

module.exports = { demo };
