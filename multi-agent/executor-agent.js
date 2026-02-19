/**
 * Executor Subagent
 * 
 * 负责具体任务执行：代码编写、文件操作、API调用等
 */

const Subagent = require('./subagent-base');
const fs = require('fs');
const { execSync } = require('child_process');

class ExecutorAgent extends Subagent {
  constructor() {
    super({
      id: 'executor_agent_01',
      type: 'executor',
      capabilities: ['execution', 'coding', 'file_operations', 'api_calls']
    });
  }

  async performTask(task, context) {
    const results = {
      actions_taken: [],
      outputs: [],
      errors: []
    };

    const action = task.action || task.description.toLowerCase();

    // 文件写入
    if (action.includes('write') || action.includes('创建') || action.includes('实现')) {
      if (task.payload?.path && task.payload?.content) {
        try {
          fs.writeFileSync(task.payload.path, task.payload.content);
          results.actions_taken.push(`Created file: ${task.payload.path}`);
          results.outputs.push(task.payload.path);
        } catch (e) {
          results.errors.push(`Failed to write file: ${e.message}`);
        }
      }
    }

    // 代码执行
    if (action.includes('execute') || action.includes('run')) {
      if (task.payload?.command) {
        try {
          const output = execSync(task.payload.command, { encoding: 'utf8', timeout: 30000 });
          results.actions_taken.push(`Executed: ${task.payload.command}`);
          results.outputs.push(output);
        } catch (e) {
          results.errors.push(`Command failed: ${e.message}`);
        }
      }
    }

    // API 调用
    if (action.includes('api') || action.includes('调用')) {
      if (task.payload?.url) {
        results.actions_taken.push(`API call to: ${task.payload.url}`);
        // 实际调用在主进程中完成
      }
    }

    // 默认执行
    if (results.actions_taken.length === 0) {
      results.actions_taken.push(`Executed task: ${task.description}`);
    }

    this.report(`执行任务完成: ${task.id}`, context.sharedStatePath || './shared-state.json');

    return results;
  }
}

module.exports = ExecutorAgent;
