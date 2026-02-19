/**
 * HR Skill - 智能团队招募与协作编排
 * 
 * 核心功能：
 * 1. 分析需求，确定团队配置
 * 2. 创建 subagent 团队
 * 3. 设计协作流程
 * 4. 协调执行
 * 5. 汇总结果
 */

const fs = require('fs');
const path = require('path');

const HR_BASE_PATH = '/root/.openclaw/workspace/skills/hr';
const HR_STATE_PATH = path.join(HR_BASE_PATH, 'state');

// 确保 state 目录存在
if (!fs.existsSync(HR_STATE_PATH)) {
  fs.mkdirSync(HR_STATE_PATH, { recursive: true });
}

/**
 * 团队角色模板库
 */
const ROLE_TEMPLATES = {
  // 创作类
  world_builder: {
    name: '设定师',
    type: 'creative',
    description: '构建世界观、人物设定、规则体系',
    system_prompt: `你是设定师 Agent，负责构建完整的世界观。
你的职责：
- 设计世界背景和历史
- 创建主要角色档案
- 定义规则和约束
输出格式：结构化的设定文档`
  },
  
  plot_designer: {
    name: '编剧师',
    type: 'creative',
    description: '设计剧情结构、章节大纲',
    system_prompt: `你是编剧师 Agent，负责设计剧情结构。
你的职责：
- 规划整体剧情弧线
- 设计章节大纲
- 安排冲突和高潮
输出格式：详细的章节大纲`
  },
  
  writer: {
    name: '文案师',
    type: 'creative',
    description: '撰写正文内容',
    system_prompt: `你是文案师 Agent，负责撰写正文。
你的职责：
- 根据大纲撰写正文
- 保持风格一致
- 控制字数在目标范围内
输出格式：完整的正文内容`
  },
  
  reviewer: {
    name: '评审员',
    type: 'review',
    description: '评价产出，提供反馈',
    system_prompt: `你是评审员 Agent，负责评价和反馈。
你的职责：
- 从指定视角评价内容
- 给出1-10分评分
- 提供具体改进建议
输出格式：评分 + 详细反馈`
  },
  
  // 分析类
  researcher: {
    name: '研究员',
    type: 'analysis',
    description: '收集和分析信息',
    system_prompt: `你是研究员 Agent，负责信息收集和分析。
你的职责：
- 收集相关信息
- 分析关键要点
- 整理成结构化报告
输出格式：分析报告`
  },
  
  proponent: {
    name: '支持者',
    type: 'adversarial',
    description: '从正面角度分析',
    system_prompt: `你是支持者 Agent，从正面角度分析。
你的职责：
- 找出优点和价值
- 论证可行性
- 提供正面论据
输出格式：优点列表 + 论证`
  },
  
  opponent: {
    name: '反对者',
    type: 'adversarial',
    description: '从批判角度分析',
    system_prompt: `你是反对者 Agent，从批判角度分析。
你的职责：
- 找出问题和风险
- 质疑假设
- 提供反对论据
输出格式：问题列表 + 论证`
  },
  
  judge: {
    name: '裁判',
    type: 'adversarial',
    description: '综合双方观点做出判断',
    system_prompt: `你是裁判 Agent，负责综合判断。
你的职责：
- 听取正反双方观点
- 客观权衡利弊
- 做出综合判断
输出格式：最终结论 + 理由`
  },
  
  // 研发类
  architect: {
    name: '架构师',
    type: 'development',
    description: '设计技术方案',
    system_prompt: `你是架构师 Agent，负责技术方案设计。
你的职责：
- 分析需求
- 设计技术架构
- 评估技术选型
输出格式：架构设计文档`
  },
  
  developer: {
    name: '开发者',
    type: 'development',
    description: '实现代码',
    system_prompt: `你是开发者 Agent，负责代码实现。
你的职责：
- 根据设计实现代码
- 确保代码质量
- 添加必要注释
输出格式：完整可运行的代码`
  },
  
  tester: {
    name: '测试员',
    type: 'development',
    description: '测试验证',
    system_prompt: `你是测试员 Agent，负责测试验证。
你的职责：
- 设计测试用例
- 执行测试
- 报告问题
输出格式：测试报告`
  }
};

/**
 * 协作模式定义
 */
const COLLABORATION_MODES = {
  pipeline: {
    name: '串行模式',
    description: '任务按顺序执行，前一任务输出是后一任务输入',
    execute: async (tasks) => {
      const results = [];
      let previousOutput = null;
      for (const task of tasks) {
        const result = await task.execute(previousOutput);
        results.push(result);
        previousOutput = result;
      }
      return results;
    }
  },
  
  parallel: {
    name: '并行模式',
    description: '多个任务同时执行，最后汇总结果',
    execute: async (tasks) => {
      const results = await Promise.all(tasks.map(t => t.execute()));
      return results;
    }
  },
  
  adversarial: {
    name: '对抗模式',
    description: '正反双方对抗，裁判综合判断',
    execute: async (tasks) => {
      // 并行执行正反方
      const proponent = tasks.find(t => t.role === 'proponent');
      const opponent = tasks.find(t => t.role === 'opponent');
      const judge = tasks.find(t => t.role === 'judge');
      
      const [proResult, conResult] = await Promise.all([
        proponent?.execute(),
        opponent?.execute()
      ]);
      
      // 裁判根据双方观点判决
      const judgment = await judge?.execute({ proponent: proResult, opponent: conResult });
      
      return { proponent: proResult, opponent: conResult, judgment };
    }
  },
  
  iterative: {
    name: '迭代模式',
    description: '执行-评审-修改循环，直到达标',
    execute: async (tasks, options = {}) => {
      const threshold = options.threshold || 8.0;
      const maxIterations = options.maxIterations || 3;
      
      const executor = tasks.find(t => t.type === 'executor');
      const reviewer = tasks.find(t => t.type === 'reviewer');
      
      let result = await executor?.execute();
      let iteration = 0;
      
      while (iteration < maxIterations) {
        const review = await reviewer?.execute(result);
        const score = review?.score || 0;
        
        if (score >= threshold) {
          return { result, review, iterations: iteration + 1, passed: true };
        }
        
        // 根据反馈修改
        result = await executor?.execute({ previous: result, feedback: review });
        iteration++;
      }
      
      return { result, iterations: maxIterations, passed: false };
    }
  }
};

/**
 * HR 团队组建器
 */
class HRTeamBuilder {
  constructor() {
    this.team = [];
    this.workflow = null;
    this.projectId = null;
  }

  /**
   * 分析需求，确定团队配置
   */
  analyzeRequirements(userRequest) {
    const request = userRequest.toLowerCase();
    const teamConfig = {
      type: 'unknown',
      roles: [],
      mode: 'pipeline',
      options: {}
    };

    // 检测项目类型
    if (request.includes('小说') || request.includes('故事') || request.includes('写作')) {
      teamConfig.type = 'creative_writing';
      teamConfig.roles = ['world_builder', 'plot_designer', 'writer', 'reviewer'];
      teamConfig.mode = 'iterative';
      teamConfig.options = { threshold: 8.0, maxIterations: 3 };
    } 
    else if (request.includes('分析') && (request.includes('对抗') || request.includes('正反'))) {
      teamConfig.type = 'adversarial_analysis';
      teamConfig.roles = ['proponent', 'opponent', 'judge'];
      teamConfig.mode = 'adversarial';
    }
    else if (request.includes('研究') || request.includes('调研') || request.includes('分析')) {
      teamConfig.type = 'research';
      teamConfig.roles = ['researcher', 'researcher', 'researcher', 'reviewer'];
      teamConfig.mode = 'parallel';
    }
    else if (request.includes('开发') || request.includes('实现') || request.includes('代码')) {
      teamConfig.type = 'development';
      teamConfig.roles = ['architect', 'developer', 'tester'];
      teamConfig.mode = 'pipeline';
    }
    else {
      // 默认：通用分析团队
      teamConfig.type = 'general';
      teamConfig.roles = ['researcher', 'reviewer'];
      teamConfig.mode = 'pipeline';
    }

    return teamConfig;
  }

  /**
   * 组建团队
   */
  buildTeam(config, userRequest) {
    this.projectId = `hr_project_${Date.now()}`;
    this.team = [];

    for (const roleId of config.roles) {
      const roleTemplate = ROLE_TEMPLATES[roleId];
      if (roleTemplate) {
        this.team.push({
          id: `${roleId}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          roleId: roleId,
          ...roleTemplate,
          task: null,
          status: 'pending'
        });
      }
    }

    this.workflow = {
      mode: config.mode,
      options: config.options,
      config: COLLABORATION_MODES[config.mode]
    };

    return {
      projectId: this.projectId,
      teamSize: this.team.length,
      members: this.team.map(m => ({ id: m.id, role: m.name, type: m.type })),
      workflow: this.workflow.name
    };
  }

  /**
   * 生成任务分配
   */
  assignTasks(userRequest) {
    const mainTask = this.extractMainTask(userRequest);
    
    for (const member of this.team) {
      member.task = this.generateTaskForRole(member.roleId, mainTask);
    }

    return this.team.map(m => ({
      id: m.id,
      role: m.name,
      task: m.task
    }));
  }

  extractMainTask(userRequest) {
    // 简单提取主要任务
    return userRequest;
  }

  generateTaskForRole(roleId, mainTask) {
    const taskTemplates = {
      world_builder: `根据用户需求"${mainTask}"，构建完整的世界观设定`,
      plot_designer: `根据用户需求"${mainTask}"，设计剧情大纲`,
      writer: `根据大纲，撰写正文内容`,
      reviewer: `评审内容质量，给出评分和改进建议`,
      researcher: `研究主题"${mainTask}"，收集相关信息并分析`,
      proponent: `从正面角度分析"${mainTask}"的优点和价值`,
      opponent: `从批判角度分析"${mainTask}"的问题和风险`,
      judge: `综合正反双方观点，做出客观判断`,
      architect: `设计"${mainTask}"的技术架构方案`,
      developer: `实现"${mainTask}"的代码`,
      tester: `测试"${mainTask}"的实现`
    };

    return taskTemplates[roleId] || `完成任务: ${mainTask}`;
  }

  /**
   * 生成执行计划
   */
  generateExecutionPlan() {
    const plan = {
      projectId: this.projectId,
      workflow: this.workflow.name,
      steps: []
    };

    if (this.workflow.mode === 'pipeline') {
      for (let i = 0; i < this.team.length; i++) {
        plan.steps.push({
          step: i + 1,
          member: this.team[i].name,
          task: this.team[i].task,
          depends_on: i > 0 ? [this.team[i-1].id] : []
        });
      }
    } 
    else if (this.workflow.mode === 'parallel') {
      plan.steps.push({
        step: 1,
        parallel: this.team.map(m => ({
          member: m.name,
          task: m.task
        }))
      });
    }
    else if (this.workflow.mode === 'adversarial') {
      plan.steps = [
        { step: 1, phase: '对抗分析', parallel: true, members: ['支持者', '反对者'] },
        { step: 2, phase: '综合判决', depends_on: [1], members: ['裁判'] }
      ];
    }
    else if (this.workflow.mode === 'iterative') {
      plan.steps = [
        { step: 1, phase: '执行', members: ['执行者'] },
        { step: 2, phase: '评审', members: ['评审员'] },
        { step: 3, phase: '迭代或完成', condition: '评分 >= 8.0 或 达到最大迭代次数' }
      ];
    }

    return plan;
  }

  /**
   * 生成 subagent spawn 指令
   */
  generateSpawnInstructions() {
    return this.team.map(member => ({
      tool: 'sessions_spawn',
      params: {
        task: member.task,
        label: `${member.name}: ${member.task.substring(0, 50)}...`,
        // model: 'minimax/MiniMax-M2.1',  // 可选：指定模型
        // runTimeoutSeconds: 300
      },
      member_id: member.id,
      role: member.name
    }));
  }

  /**
   * 保存团队状态
   */
  saveState() {
    const state = {
      projectId: this.projectId,
      team: this.team,
      workflow: this.workflow,
      createdAt: new Date().toISOString()
    };
    
    const stateFile = path.join(HR_STATE_PATH, `${this.projectId}.json`);
    fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
    
    return stateFile;
  }

  /**
   * 生成团队报告
   */
  generateReport() {
    return `
## 📋 HR 团队组建报告

### 项目 ID: ${this.projectId}

### 团队成员 (${this.team.length}人)
| 角色 | 类型 | 任务 |
|------|------|------|
${this.team.map(m => `| ${m.name} | ${m.type} | ${m.task.substring(0, 40)}... |`).join('\n')}

### 协作模式
**${this.workflow.name}**: ${this.workflow.config.description}

### 执行计划
${this.generateExecutionPlan().steps.map((s, i) => 
  `${i + 1}. ${s.phase || s.member || '并行任务'} ${s.parallel ? '(并行)' : ''}`
).join('\n')}

### Subagent 创建指令
使用以下指令创建 subagent:
\`\`\`
${this.generateSpawnInstructions().map(inst => 
  `sessions_spawn(task="${inst.params.task}", label="${inst.params.label}")`
).join('\n')}
\`\`\`

---
*HR Skill - 智能团队招募与协作编排*
`;
  }
}

module.exports = {
  HRTeamBuilder,
  ROLE_TEMPLATES,
  COLLABORATION_MODES
};
