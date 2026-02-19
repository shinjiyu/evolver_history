/**
 * Research Subagent
 * 
 * 负责信息收集、分析、调研
 */

const Subagent = require('./subagent-base');

class ResearchAgent extends Subagent {
  constructor() {
    super({
      id: 'research_agent_01',
      type: 'research',
      capabilities: ['research', 'analysis', 'investigation']
    });
  }

  async performTask(task, context) {
    const results = {
      findings: [],
      sources: [],
      recommendations: []
    };

    // 根据任务描述进行研究
    const description = task.description.toLowerCase();

    if (description.includes('收集') || description.includes('分析')) {
      // 模拟信息收集
      results.findings.push({
        topic: '相关技术调研',
        summary: '已收集相关信息',
        confidence: 0.85
      });
    }

    if (description.includes('需求') || description.includes('分析')) {
      results.findings.push({
        topic: '需求分析',
        summary: '已完成需求分析',
        key_points: ['功能需求', '性能需求', '安全需求']
      });
    }

    // 记录结果
    this.report(`研究任务完成: ${task.id}`, context.sharedStatePath || './shared-state.json');

    return results;
  }
}

module.exports = ResearchAgent;
