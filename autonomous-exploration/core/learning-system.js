/**
 * 学习系统 - 基于 OODA 循环的"学习"阶段
 * 
 * 负责从探索结果中提取知识，更新知识库
 */

const fs = require('fs');
const path = require('path');

class LearningSystem {
  constructor() {
    this.knowledgeBasePath = '/root/.openclaw/workspace/autonomous-exploration/memory/learned-knowledge.json';
    this.ensureKnowledgeBase();
  }

  /**
   * 确保知识库文件存在
   */
  ensureKnowledgeBase() {
    const dir = path.dirname(this.knowledgeBasePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    if (!fs.existsSync(this.knowledgeBasePath)) {
      this.saveKnowledgeBase({
        entries: [],
        patterns: [],
        statistics: {
          totalExplorations: 0,
          successfulExplorations: 0,
          averageValue: 0
        }
      });
    }
  }

  /**
   * 加载知识库
   */
  loadKnowledgeBase() {
    try {
      return JSON.parse(fs.readFileSync(this.knowledgeBasePath, 'utf8'));
    } catch (e) {
      return {
        entries: [],
        patterns: [],
        statistics: {
          totalExplorations: 0,
          successfulExplorations: 0,
          averageValue: 0
        }
      };
    }
  }

  /**
   * 保存知识库
   */
  saveKnowledgeBase(kb) {
    fs.writeFileSync(this.knowledgeBasePath, JSON.stringify(kb, null, 2));
  }

  /**
   * 记录学到的知识
   */
  recordLearning(knowledge) {
    const kb = this.loadKnowledgeBase();
    
    const entry = {
      id: `learn_${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: knowledge.type,
      content: knowledge.content,
      source: knowledge.source,
      confidence: knowledge.confidence || 0.5,
      applications: knowledge.applications || [],
      tags: knowledge.tags || [],
      successRate: knowledge.successRate || 0
    };
    
    kb.entries.push(entry);
    
    // 更新统计
    kb.statistics.totalExplorations++;
    if (knowledge.success) {
      kb.statistics.successfulExplorations++;
    }
    kb.statistics.averageValue = this.calculateAverageValue(kb.entries);
    
    // 提取模式
    const pattern = this.extractPattern(entry);
    if (pattern) {
      kb.patterns.push(pattern);
    }
    
    // 清理旧条目（保留最近 1000 条）
    if (kb.entries.length > 1000) {
      kb.entries = kb.entries.slice(-1000);
    }
    
    this.saveKnowledgeBase(kb);
    
    return entry;
  }

  /**
   * 检索相关知识
   */
  retrieveRelevant(context) {
    const kb = this.loadKnowledgeBase();
    const keywords = this.extractKeywords(context);
    
    return kb.entries
      .map(entry => ({
        ...entry,
        relevance: this.calculateRelevance(entry, keywords)
      }))
      .filter(e => e.relevance > 0.3)
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 10);
  }

  /**
   * 提取关键词
   */
  extractKeywords(context) {
    const keywords = [];
    
    if (context.goal) {
      keywords.push(context.goal.type, context.goal.category);
    }
    
    if (context.subject) {
      keywords.push(context.subject.toLowerCase());
    }
    
    if (context.actions) {
      context.actions.forEach(a => keywords.push(a.type));
    }
    
    return keywords.filter(k => k);
  }

  /**
   * 计算相关性
   */
  calculateRelevance(entry, keywords) {
    if (keywords.length === 0) return 0.5;
    
    let matchCount = 0;
    const entryText = JSON.stringify(entry).toLowerCase();
    
    for (const keyword of keywords) {
      if (entryText.includes(keyword.toLowerCase())) {
        matchCount++;
      }
    }
    
    return matchCount / keywords.length;
  }

  /**
   * 评估学习效果
   */
  evaluateLearning(goal, result) {
    const success = this.determineSuccess(result);
    const value = this.calculateValue(result);
    const lessons = this.extractLessons(result);
    const nextSteps = this.suggestNextSteps(result, success);
    
    return {
      success,
      value,
      lessons,
      nextSteps,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 判断是否成功
   */
  determineSuccess(result) {
    if (!result || result.length === 0) return false;
    
    const successCount = result.filter(r => r.success).length;
    return successCount / result.length >= 0.5;
  }

  /**
   * 计算价值
   */
  calculateValue(result) {
    if (!result || result.length === 0) return 0;
    
    let totalValue = 0;
    
    for (const r of result) {
      // 有输出 = 基础价值
      if (r.output) totalValue += 10;
      
      // 学习到新知识 = 附加价值
      if (r.newKnowledge) totalValue += 20;
      
      // 可应用 = 高价值
      if (r.applicable) totalValue += 15;
    }
    
    return totalValue;
  }

  /**
   * 提取教训
   */
  extractLessons(result) {
    const lessons = [];
    
    if (!result || result.length === 0) {
      lessons.push('探索失败：无结果');
      return lessons;
    }
    
    const failedActions = result.filter(r => !r.success);
    if (failedActions.length > 0) {
      lessons.push(`部分行动失败：${failedActions.map(a => a.type).join(', ')}`);
    }
    
    const slowActions = result.filter(r => r.duration && r.duration > 60);
    if (slowActions.length > 0) {
      lessons.push(`部分行动耗时较长：${slowActions.map(a => a.type).join(', ')}`);
    }
    
    if (lessons.length === 0) {
      lessons.push('探索顺利完成');
    }
    
    return lessons;
  }

  /**
   * 建议下一步
   */
  suggestNextSteps(result, success) {
    const steps = [];
    
    if (success) {
      steps.push('可以将本次探索结果固化到 Memory 系统');
      steps.push('检查是否有类似领域可以应用本次经验');
    } else {
      steps.push('分析失败原因，调整探索策略');
      steps.push('考虑降低目标复杂度或增加资源');
    }
    
    return steps;
  }

  /**
   * 提取模式
   */
  extractPattern(entry) {
    // 简单的模式提取
    if (entry.successRate > 0.7) {
      return {
        type: 'success_pattern',
        condition: entry.type,
        action: entry.content.substring(0, 100),
        confidence: entry.confidence,
        createdAt: entry.timestamp
      };
    }
    
    return null;
  }

  /**
   * 计算平均价值
   */
  calculateAverageValue(entries) {
    if (entries.length === 0) return 0;
    
    const totalValue = entries.reduce((sum, e) => {
      return sum + (e.successRate || 0) * 100;
    }, 0);
    
    return totalValue / entries.length;
  }

  /**
   * 获取学习统计
   */
  getStatistics() {
    const kb = this.loadKnowledgeBase();
    return kb.statistics;
  }

  /**
   * 清理旧知识（保留最近 N 天）
   */
  cleanupOldKnowledge(daysToKeep = 90) {
    const kb = this.loadKnowledgeBase();
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
    
    kb.entries = kb.entries.filter(e => new Date(e.timestamp) > cutoffDate);
    kb.patterns = kb.patterns.filter(p => new Date(p.createdAt) > cutoffDate);
    
    this.saveKnowledgeBase(kb);
    
    return {
      removed: true,
      remainingEntries: kb.entries.length,
      remainingPatterns: kb.patterns.length
    };
  }
}

module.exports = LearningSystem;
