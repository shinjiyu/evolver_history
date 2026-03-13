/**
 * 实际探索执行器 - 产出导向版本
 * 
 * 核心转变：
 * 1. 从"自我反思"改为"执行具体行动"
 * 2. 每次探索产生具体产出
 * 3. 记录可操作的发现和建议
 */

const fs = require('fs');
const path = require('path');

class RealExplorer {
  constructor() {
    this.workspace = '/root/.openclaw/workspace';
    this.outputDir = '/root/.openclaw/workspace/autonomous-exploration/outputs';
    this.ensureOutputDir();
  }

  ensureOutputDir() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * 执行探索
   */
  async explore(goal) {
    console.log(`\n🔍 执行探索任务: ${goal.type}`);
    console.log(`   描述: ${goal.description}`);
    
    const startTime = Date.now();
    const results = {
      goal,
      findings: [],
      recommendations: [],
      output: null,
      outputFile: null,
      success: true
    };
    
    try {
      // 执行对应的任务
      switch (goal.type) {
        case 'analyze_logs':
          Object.assign(results, await this.analyzeLogs());
          break;
          
        case 'check_memory_health':
          Object.assign(results, await this.checkMemoryHealth());
          break;
          
        case 'suggest_improvements':
          Object.assign(results, await this.suggestImprovements());
          break;
          
        case 'generate_content':
          Object.assign(results, await this.generateContent());
          break;
          
        case 'review_cron_tasks':
          Object.assign(results, await this.reviewCronTasks());
          break;
          
        case 'scan_security':
          Object.assign(results, await this.scanSecurity());
          break;
          
        case 'organize_knowledge':
          Object.assign(results, await this.organizeKnowledge());
          break;
          
        case 'check_evomap_status':
          Object.assign(results, await this.checkEvoMapStatus());
          break;
          
        default:
          throw new Error(`未知任务类型: ${goal.type}`);
      }
      
      // 保存输出
      if (results.output) {
        results.outputFile = this.saveOutput(goal.type, results.output);
      }
      
    } catch (error) {
      console.error(`❌ 探索失败: ${error.message}`);
      results.success = false;
      results.error = error.message;
    }
    
    results.duration = Date.now() - startTime;
    return results;
  }

  // ============ 具体任务实现 ============

  /**
   * 分析日志文件
   */
  async analyzeLogs() {
    console.log('\n📊 分析日志文件...');
    
    const findings = [];
    const recommendations = [];
    const output = {
      timestamp: new Date().toISOString(),
      logFiles: [],
      errors: [],
      patterns: [],
      summary: {}
    };
    
    const logDir = '/root/.openclaw/workspace/logs';
    if (!fs.existsSync(logDir)) {
      findings.push('日志目录不存在');
      return { findings, recommendations, output };
    }
    
    const files = fs.readdirSync(logDir);
    
    for (const file of files) {
      const filePath = path.join(logDir, file);
      const stat = fs.statSync(filePath);
      
      // 跳过目录
      if (!stat.isFile()) continue;
      
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      
      const fileInfo = {
        name: file,
        size: stat.size,
        lines: lines.length,
        errors: 0,
        warnings: 0
      };
      
      // 统计错误和警告
      for (const line of lines.slice(-500)) { // 只检查最近 500 行
        if (line.includes('ERROR') || line.includes('error') || line.includes('FAIL')) {
          fileInfo.errors++;
        }
        if (line.includes('WARN') || line.includes('warning')) {
          fileInfo.warnings++;
        }
      }
      
      output.logFiles.push(fileInfo);
      
      // 发现问题
      if (fileInfo.errors > 10) {
        findings.push(`${file} 有 ${fileInfo.errors} 个错误`);
        recommendations.push(`检查 ${file} 中的错误日志`);
      }
    }
    
    // 汇总
    output.summary = {
      totalFiles: files.length,
      totalErrors: output.logFiles.reduce((sum, f) => sum + f.errors, 0),
      totalWarnings: output.logFiles.reduce((sum, f) => sum + f.warnings, 0)
    };
    
    if (output.summary.totalErrors > 0) {
      recommendations.push(`总计 ${output.summary.totalErrors} 个错误需要关注`);
    }
    
    return { findings, recommendations, output };
  }

  /**
   * 检查 memory 健康状态
   */
  async checkMemoryHealth() {
    console.log('\n🧠 检查 memory 健康状态...');
    
    const findings = [];
    const recommendations = [];
    const output = {
      timestamp: new Date().toISOString(),
      files: [],
      issues: [],
      suggestions: []
    };
    
    // 检查 MEMORY.md
    const memoryFile = '/root/.openclaw/workspace/MEMORY.md';
    if (fs.existsSync(memoryFile)) {
      const stat = fs.statSync(memoryFile);
      const content = fs.readFileSync(memoryFile, 'utf8');
      const age = Date.now() - stat.mtimeMs;
      const ageHours = Math.floor(age / (60 * 60 * 1000));
      
      output.files.push({
        name: 'MEMORY.md',
        size: stat.size,
        age: ageHours,
        lines: content.split('\n').length,
        sections: (content.match(/^## /gm) || []).length
      });
      
      if (ageHours > 24) {
        findings.push(`MEMORY.md 已 ${ageHours} 小时未更新`);
        recommendations.push('更新 MEMORY.md');
      }
      
      if (stat.size > 150 * 1024) {
        findings.push(`MEMORY.md 过大 (${(stat.size / 1024).toFixed(1)} KB)`);
        recommendations.push('考虑归档旧内容到 memory/ 目录');
      }
    }
    
    // 检查 memory 目录
    const memoryDir = '/root/.openclaw/workspace/memory';
    if (fs.existsSync(memoryDir)) {
      const files = fs.readdirSync(memoryDir).filter(f => f.endsWith('.md'));
      
      output.files.push({
        name: 'memory/',
        count: files.length
      });
      
      if (files.length > 30) {
        findings.push(`memory 目录有 ${files.length} 个文件`);
        recommendations.push('考虑按月份归档旧文件');
      }
      
      // 检查重复或过时文件
      const now = Date.now();
      for (const file of files) {
        const filePath = path.join(memoryDir, file);
        const stat = fs.statSync(filePath);
        const age = now - stat.mtimeMs;
        
        if (age > 30 * 24 * 60 * 60 * 1000) { // > 30 天
          output.issues.push({
            file,
            issue: 'old',
            age: Math.floor(age / (24 * 60 * 60 * 1000))
          });
        }
      }
    }
    
    output.suggestions = recommendations;
    
    return { findings, recommendations, output };
  }

  /**
   * 提出改进建议
   */
  async suggestImprovements() {
    console.log('\n💡 分析系统配置，提出改进建议...');
    
    const findings = [];
    const recommendations = [];
    const output = {
      timestamp: new Date().toISOString(),
      areas: [],
      totalSuggestions: 0
    };
    
    // 1. 检查 HEARTBEAT.md
    const heartbeatFile = '/root/.openclaw/workspace/HEARTBEAT.md';
    if (fs.existsSync(heartbeatFile)) {
      const content = fs.readFileSync(heartbeatFile, 'utf8');
      const area = { name: 'HEARTBEAT.md', suggestions: [] };
      
      // 检查是否有过时任务
      if (content.includes('❌')) {
        const failedTasks = (content.match(/❌/g) || []).length;
        area.suggestions.push(`有 ${failedTasks} 个失败的任务需要处理`);
        recommendations.push('检查 HEARTBEAT.md 中的失败任务');
      }
      
      // 检查是否有待办
      if (content.includes('⏳') || content.includes('[ ]')) {
        area.suggestions.push('有待办事项未完成');
      }
      
      output.areas.push(area);
    }
    
    // 2. 检查 cron 任务
    const cronDir = '/root/.openclaw/workspace/cron';
    if (fs.existsSync(cronDir)) {
      const files = fs.readdirSync(cronDir).filter(f => f.endsWith('.js'));
      const area = { name: 'Cron Tasks', suggestions: [] };
      
      // 检查是否有注释掉的任务
      for (const file of files) {
        const content = fs.readFileSync(path.join(cronDir, file), 'utf8');
        if (content.includes('// TODO') || content.includes('// FIXME')) {
          area.suggestions.push(`${file} 有未完成的 TODO`);
        }
      }
      
      if (files.length > 15) {
        area.suggestions.push(`有 ${files.length} 个 cron 任务，考虑合并或移除`);
      }
      
      output.areas.push(area);
    }
    
    // 3. 检查磁盘空间
    try {
      const { execSync } = require('child_process');
      const dfOutput = execSync('df -h /', { encoding: 'utf8' });
      const lines = dfOutput.split('\n');
      if (lines.length > 1) {
        const parts = lines[1].split(/\s+/);
        const usePercent = parseInt(parts[4]);
        
        const area = { name: 'Disk Space', suggestions: [] };
        if (usePercent > 80) {
          area.suggestions.push(`磁盘使用率 ${usePercent}%，建议清理`);
          recommendations.push('清理磁盘空间');
        }
        output.areas.push(area);
      }
    } catch (e) {
      // 忽略
    }
    
    output.totalSuggestions = output.areas.reduce(
      (sum, a) => sum + a.suggestions.length, 0
    );
    
    if (output.totalSuggestions > 0) {
      findings.push(`发现 ${output.totalSuggestions} 个改进机会`);
    }
    
    return { findings, recommendations, output };
  }

  /**
   * 生成内容
   */
  async generateContent() {
    console.log('\n✍️ 生成内容...');
    
    const findings = [];
    const recommendations = [];
    const output = {
      timestamp: new Date().toISOString(),
      type: 'novel_content_ideas',
      ideas: []
    };
    
    // 为小说生成内容建议
    const novelDir = '/root/.openclaw/workspace/novel-project';
    if (fs.existsSync(novelDir)) {
      const chapters = fs.readdirSync(novelDir)
        .filter(f => f.match(/^chapter-\d+\.md$/));
      
      const currentChapter = chapters.length;
      
      // 生成下一章的建议
      output.ideas.push({
        type: 'next_chapter',
        chapter: currentChapter + 1,
        suggestions: [
          '引入新角色，打破现有平衡',
          '揭示一个关键秘密',
          '设置一个意外转折',
          '深化主角的内心冲突'
        ]
      });
      
      // 生成宣传文案建议
      output.ideas.push({
        type: 'marketing_copy',
        suggestions: [
          `"当深渊选择代理人，凡人将如何抉择？" - 第 ${currentChapter} 章核心冲突`,
          `"信任的代价，是背叛的开始。" - 人物关系主题`,
          `"${currentChapter} 章更新：命运的齿轮再次转动"`
        ]
      });
      
      findings.push(`为小说第 ${currentChapter + 1} 章生成了 ${output.ideas.length} 个内容建议`);
      recommendations.push('查看生成的内容建议，选择合适的方向');
    } else {
      findings.push('小说项目目录不存在');
    }
    
    return { findings, recommendations, output };
  }

  /**
   * 检查 cron 任务
   */
  async reviewCronTasks() {
    console.log('\n⏰ 检查 cron 任务执行情况...');
    
    const findings = [];
    const recommendations = [];
    const output = {
      timestamp: new Date().toISOString(),
      tasks: [],
      issues: []
    };
    
    const cronDir = '/root/.openclaw/workspace/cron';
    if (!fs.existsSync(cronDir)) {
      findings.push('cron 目录不存在');
      return { findings, recommendations, output };
    }
    
    const files = fs.readdirSync(cronDir).filter(f => f.endsWith('.js'));
    
    for (const file of files) {
      const filePath = path.join(cronDir, file);
      const stat = fs.statSync(filePath);
      const content = fs.readFileSync(filePath, 'utf8');
      
      const task = {
        name: file,
        size: stat.size,
        lastModified: stat.mtime,
        hasErrorHandling: content.includes('try') && content.includes('catch'),
        hasLogging: content.includes('console.log')
      };
      
      output.tasks.push(task);
      
      // 检查问题
      if (!task.hasErrorHandling) {
        output.issues.push({
          task: file,
          issue: 'missing_error_handling'
        });
        recommendations.push(`${file} 缺少错误处理`);
      }
    }
    
    findings.push(`检查了 ${files.length} 个 cron 任务`);
    if (output.issues.length > 0) {
      findings.push(`发现 ${output.issues.length} 个问题`);
    }
    
    return { findings, recommendations, output };
  }

  /**
   * 扫描安全问题
   */
  async scanSecurity() {
    console.log('\n🔒 扫描安全问题...');
    
    const findings = [];
    const recommendations = [];
    const output = {
      timestamp: new Date().toISOString(),
      scans: [],
      threats: []
    };
    
    // 检查 Nginx 访问日志
    const logFile = '/var/log/nginx/access.log';
    if (fs.existsSync(logFile)) {
      try {
        const content = fs.readFileSync(logFile, 'utf8');
        const lines = content.split('\n').slice(-1000);
        
        const suspiciousIPs = new Set();
        const patterns = [
          { pattern: /wp-admin/i, type: 'wordpress_scan' },
          { pattern: /\.env/i, type: 'env_file_access' },
          { pattern: /phpMyAdmin/i, type: 'phpmyadmin_scan' },
          { pattern: /\/etc\/passwd/i, type: 'passwd_access' },
          { pattern: /zgrab/i, type: 'scanner' }
        ];
        
        for (const line of lines) {
          for (const { pattern, type } of patterns) {
            if (pattern.test(line)) {
              const ipMatch = line.match(/^(\d+\.\d+\.\d+\.\d+)/);
              if (ipMatch) {
                suspiciousIPs.add(ipMatch[1]);
                output.threats.push({
                  ip: ipMatch[1],
                  type,
                  timestamp: new Date().toISOString()
                });
              }
            }
          }
        }
        
        output.scans.push({
          file: 'nginx_access.log',
          linesChecked: lines.length,
          suspiciousIPs: suspiciousIPs.size
        });
        
        if (suspiciousIPs.size > 0) {
          findings.push(`发现 ${suspiciousIPs.size} 个可疑 IP`);
          recommendations.push('检查并封禁可疑 IP');
        }
        
      } catch (e) {
        output.scans.push({
          file: 'nginx_access.log',
          error: e.message
        });
      }
    }
    
    return { findings, recommendations, output };
  }

  /**
   * 整理知识
   */
  async organizeKnowledge() {
    console.log('\n📚 整理知识...');
    
    const findings = [];
    const recommendations = [];
    const output = {
      timestamp: new Date().toISOString(),
      sources: [],
      extractedItems: []
    };
    
    // 从最近的会话中提取知识
    const sessionsDir = '/root/.openclaw/agents/main/sessions';
    if (fs.existsSync(sessionsDir)) {
      const sessions = fs.readdirSync(sessionsDir)
        .filter(f => f.endsWith('.jsonl'))
        .slice(-10); // 最近 10 个会话
      
      output.sources.push({
        type: 'sessions',
        count: sessions.length
      });
      
      // 简单提取：查找重要关键词
      const keywords = ['完成', '修复', '发现', '建议', '问题', '解决'];
      
      for (const file of sessions) {
        try {
          const content = fs.readFileSync(path.join(sessionsDir, file), 'utf8');
          
          for (const keyword of keywords) {
            if (content.includes(keyword)) {
              output.extractedItems.push({
                source: file,
                keyword,
                found: true
              });
            }
          }
        } catch (e) {
          // 忽略
        }
      }
      
      findings.push(`分析了 ${sessions.length} 个会话`);
      findings.push(`提取了 ${output.extractedItems.length} 个知识点`);
    }
    
    return { findings, recommendations, output };
  }

  /**
   * 检查 EvoMap 状态
   */
  async checkEvoMapStatus() {
    console.log('\n🗺️ 检查 EvoMap 状态...');
    
    const findings = [];
    const recommendations = [];
    const output = {
      timestamp: new Date().toISOString(),
      node: null,
      recommendations: []
    };
    
    // 读取最新的节点状态
    const statusFile = '/root/.openclaw/workspace/memory/evomap-node-status-latest.json';
    if (fs.existsSync(statusFile)) {
      try {
        const status = JSON.parse(fs.readFileSync(statusFile, 'utf8'));
        output.node = status;
        
        if (status.reputation < 60) {
          recommendations.push('信誉较低，建议发布更多高质量 Capsule');
        }
        
        if (status.published < 10) {
          recommendations.push('发布数量较少，建议增加发布频率');
        }
        
        findings.push(`节点信誉: ${status.reputation || '未知'}`);
        findings.push(`发布数量: ${status.published || 0}`);
      } catch (e) {
        findings.push('无法解析节点状态文件');
      }
    } else {
      findings.push('节点状态文件不存在');
      recommendations.push('运行 EvoMap 状态检查');
    }
    
    output.recommendations = recommendations;
    
    return { findings, recommendations, output };
  }

  // ============ 辅助方法 ============

  /**
   * 保存输出
   */
  saveOutput(type, output) {
    const filename = `${type}-${Date.now()}.json`;
    const filePath = path.join(this.outputDir, filename);
    
    fs.writeFileSync(filePath, JSON.stringify(output, null, 2));
    console.log(`   💾 输出已保存: ${filePath}`);
    
    return filePath;
  }
}

module.exports = RealExplorer;
