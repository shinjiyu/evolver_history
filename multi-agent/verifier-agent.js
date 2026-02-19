/**
 * Verifier Subagent
 * 
 * 负责结果验证、测试、质量检查
 */

const Subagent = require('./subagent-base');
const fs = require('fs');

class VerifierAgent extends Subagent {
  constructor() {
    super({
      id: 'verifier_agent_01',
      type: 'verifier',
      capabilities: ['verification', 'testing', 'quality_check']
    });
  }

  async performTask(task, context) {
    const results = {
      checks: [],
      passed: true,
      issues: []
    };

    // 文件存在性检查
    if (task.payload?.files_to_check) {
      for (const file of task.payload.files_to_check) {
        const exists = fs.existsSync(file);
        results.checks.push({
          type: 'file_exists',
          target: file,
          passed: exists
        });
        if (!exists) {
          results.passed = false;
          results.issues.push(`File not found: ${file}`);
        }
      }
    }

    // 代码语法检查
    if (task.payload?.code_to_verify) {
      try {
        // 简单的语法检查
        new Function(task.payload.code_to_verify);
        results.checks.push({
          type: 'syntax_check',
          passed: true
        });
      } catch (e) {
        results.checks.push({
          type: 'syntax_check',
          passed: false,
          error: e.message
        });
        results.passed = false;
        results.issues.push(`Syntax error: ${e.message}`);
      }
    }

    // 依赖任务完成检查
    if (task.depends_on && context.tasks) {
      const dependentTask = context.tasks[task.depends_on];
      if (dependentTask?.status !== 'completed') {
        results.checks.push({
          type: 'dependency_check',
          target: task.depends_on,
          passed: false
        });
        results.passed = false;
        results.issues.push(`Dependency not completed: ${task.depends_on}`);
      } else {
        results.checks.push({
          type: 'dependency_check',
          target: task.depends_on,
          passed: true
        });
      }
    }

    // 默认验证
    if (results.checks.length === 0) {
      results.checks.push({
        type: 'general_verification',
        passed: true,
        note: 'No specific checks defined, defaulting to pass'
      });
    }

    this.report(`验证任务完成: ${task.id} - ${results.passed ? 'PASS' : 'FAIL'}`, 
      context.sharedStatePath || './shared-state.json');

    return results;
  }
}

module.exports = VerifierAgent;
