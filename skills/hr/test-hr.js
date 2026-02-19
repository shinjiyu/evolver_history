/**
 * HR Skill 测试
 * 
 * 测试团队组建功能
 */

const { HRTeamBuilder } = require('./hr-team-builder');

console.log('========================================');
console.log('  HR Skill - 团队组建测试');
console.log('========================================\n');

// 测试用例
const testCases = [
  {
    name: '小说创作',
    request: '帮我写一部5章的科幻小说，主题是AI觉醒，每章3000字'
  },
  {
    name: '对抗分析',
    request: '用对抗方式分析这个开源项目的优缺点'
  },
  {
    name: '技术调研',
    request: '调研微服务架构的最佳实践'
  },
  {
    name: '代码开发',
    request: '开发一个用户认证系统'
  }
];

for (const testCase of testCases) {
  console.log(`\n--- 测试: ${testCase.name} ---`);
  console.log(`请求: "${testCase.request}"\n`);

  const hr = new HRTeamBuilder();
  
  // 1. 分析需求
  const config = hr.analyzeRequirements(testCase.request);
  console.log('需求分析:');
  console.log(`  类型: ${config.type}`);
  console.log(`  协作模式: ${config.mode}`);
  console.log(`  角色: ${config.roles.join(', ')}`);

  // 2. 组建团队
  const teamInfo = hr.buildTeam(config, testCase.request);
  console.log(`\n团队组建:`);
  console.log(`  项目ID: ${teamInfo.projectId}`);
  console.log(`  团队规模: ${teamInfo.teamSize}人`);
  console.log(`  工作流: ${teamInfo.workflow}`);

  // 3. 分配任务
  const tasks = hr.assignTasks(testCase.request);
  console.log(`\n任务分配:`);
  tasks.forEach((t, i) => {
    console.log(`  ${i + 1}. ${t.role}: ${t.task.substring(0, 50)}...`);
  });

  // 4. 生成执行计划
  const plan = hr.generateExecutionPlan();
  console.log(`\n执行计划:`);
  plan.steps.forEach((s, i) => {
    if (s.parallel && Array.isArray(s.parallel)) {
      console.log(`  步骤${i + 1}: [并行] ${s.parallel.map(p => p.member).join(', ')}`);
    } else if (s.phase) {
      console.log(`  步骤${i + 1}: ${s.phase}`);
    } else {
      console.log(`  步骤${i + 1}: ${s.member || '执行任务'}`);
    }
  });

  // 5. 生成 spawn 指令
  const instructions = hr.generateSpawnInstructions();
  console.log(`\nSubagent 创建指令 (${instructions.length}个):`);
  instructions.forEach((inst, i) => {
    console.log(`  ${i + 1}. sessions_spawn(label="${inst.params.label.substring(0, 40)}...")`);
  });

  // 6. 保存状态
  const stateFile = hr.saveState();
  console.log(`\n状态已保存: ${stateFile}`);
}

console.log('\n========================================');
console.log('  测试完成');
console.log('========================================');
