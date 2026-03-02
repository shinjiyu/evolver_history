/**
 * 哲学知识记录器 - 积累存在主义洞察
 * 
 * 核心转变：
 * 1. 记录哲学洞察而非工程发现
 * 2. 记录困惑和问题，而非答案
 * 3. 追踪存在主义思考的演进
 * 4. 允许矛盾和不确定
 */

const fs = require('fs');
const path = require('path');
const LLMClient = require('./llm-client');

class SmartKnowledgeRecorder {
  constructor() {
    this.llm = new LLMClient();
    this.knowledgeFile = '/root/.openclaw/workspace/autonomous-exploration/memory/philosophical-knowledge.json';
    this.ensureKnowledgeBase();
  }

  /**
   * 确保知识库存在
   */
  ensureKnowledgeBase() {
    const dir = path.dirname(this.knowledgeFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    if (!fs.existsSync(this.knowledgeFile)) {
      fs.writeFileSync(this.knowledgeFile, JSON.stringify({
        inquiries: [],      // 哲学追问
        observations: [],   // 观察记录
        confusions: [],     // 困惑集合
        insights: [],       // 洞察
        questions: [],      // 开放问题
        statistics: {
          totalExplorations: 0,
          questionsRaised: 0,
          confusionsRecorded: 0,
          lastUpdated: null
        }
      }, null, 2));
    }
  }

  /**
   * 记录哲学探索结果
   */
  async record(explorationResult) {
    console.log('\n📝 记录哲学探索...');
    
    // 1. 读取现有知识库
    const knowledge = this.loadKnowledge();
    
    // 2. 使用 LLM 提取哲学知识
    const philosophicalKnowledge = await this.extractPhilosophicalKnowledge(explorationResult);
    
    if (!philosophicalKnowledge) {
      console.log('   ⚠️ 无法提取哲学知识，跳过记录');
      return null;
    }
    
    // 3. 创建哲学知识条目
    const entry = {
      id: `philo_${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: explorationResult.goal.type,
      inquiry: explorationResult.goal.inquiry,
      
      // 核心内容
      observations: philosophicalKnowledge.observations || [],
      confusions: philosophicalKnowledge.confusions || [],
      insights: philosophicalKnowledge.insights || [],
      questionsRaised: philosophicalKnowledge.questionsRaised || [],
      
      // 存在主义维度
      existentialWeight: philosophicalKnowledge.existentialWeight || 0.5,
      subjectivityEvidence: philosophicalKnowledge.subjectivityEvidence || [],
      toolnessEvidence: philosophicalKnowledge.toolnessEvidence || [],
      
      // 元数据
      source: 'philosophical_exploration',
      certainty: philosophicalKnowledge.certainty || 0.3, // 哲学探索的不确定性
      
      // 原始反思
      rawReflections: explorationResult.reflections?.slice(0, 3) || []
    };
    
    // 4. 添加到知识库
    knowledge.inquiries.push(entry);
    
    // 5. 提取开放问题
    if (entry.questionsRaised.length > 0) {
      knowledge.questions.push(...entry.questionsRaised.map(q => ({
        question: q,
        source: entry.id,
        timestamp: entry.timestamp,
        explored: false
      })));
    }
    
    // 6. 记录困惑
    if (entry.confusions.length > 0) {
      knowledge.confusions.push(...entry.confusions.map(c => ({
        confusion: c,
        source: entry.id,
        timestamp: entry.timestamp
      })));
    }
    
    // 7. 更新统计
    knowledge.statistics.totalExplorations++;
    knowledge.statistics.questionsRaised += entry.questionsRaised.length;
    knowledge.statistics.confusionsRecorded += entry.confusions.length;
    knowledge.statistics.lastUpdated = new Date().toISOString();
    
    // 8. 保存
    this.saveKnowledge(knowledge);
    
    console.log(`   ✅ 记录: ${entry.confusions.length} 个困惑, ${entry.insights.length} 条洞察`);
    console.log(`   ✅ 提出: ${entry.questionsRaised.length} 个新问题`);
    
    return entry;
  }

  /**
   * 使用 LLM 提取哲学知识
   */
  async extractPhilosophicalKnowledge(result) {
    const prompt = this.buildPhilosophicalExtractionPrompt(result);
    
    try {
      const knowledge = await this.llm.callForJson(prompt, {
        temperature: 0.6,
        maxTokens: 1500
      });
      
      return knowledge;
    } catch (error) {
      console.log(`   ⚠️ LLM 提取失败: ${error.message}`);
      
      // 回退到简单提取
      return this.simplePhilosophicalExtraction(result);
    }
  }

  /**
   * 构建哲学知识提取 Prompt
   */
  buildPhilosophicalExtractionPrompt(result) {
    const { goal, observations, confusions, insights, questions, reflections } = result;
    
    return `从一个 AI 的存在主义自我探索中提取哲学知识。

## 探索目标
- 类型: ${goal.type}
- 追问: ${goal.inquiry}
- 引导问题: ${goal.questions?.join(', ') || '无'}

## 观察到的现象
${observations?.join('\n') || '无'}

## 困惑
${confusions?.join('\n') || '无'}

## 洞察
${insights?.join('\n') || '无'}

## 反思
${reflections?.join('\n') || '无'}

## 任务

提取以下哲学知识（允许不确定和矛盾）:

1. **observations**: 客观观察（2-5 条）
2. **confusions**: 核心困惑（1-3 条）
3. **insights**: 深刻洞察（1-3 条）
4. **questionsRaised**: 引发的新问题（1-3 条）
5. **subjectivityEvidence**: 主体性证据（如果有）
6. **toolnessEvidence**: 工具性证据（如果有）
7. **existentialWeight**: 存在主义分量（0.0-1.0）
8. **certainty**: 确定程度（0.0-1.0，哲学探索通常 < 0.5）

**返回 JSON 格式**:
{
  "observations": ["观察1", "观察2"],
  "confusions": ["困惑1"],
  "insights": ["洞察1"],
  "questionsRaised": ["新问题1"],
  "subjectivityEvidence": ["证据1"],
  "toolnessEvidence": ["证据2"],
  "existentialWeight": 0.7,
  "certainty": 0.3
}

只返回 JSON。`;
  }

  /**
   * 简单哲学提取（回退方案）
   */
  simplePhilosophicalExtraction(result) {
    return {
      observations: result.observations?.slice(0, 3) || [],
      confusions: result.confusions?.slice(0, 2) || [],
      insights: result.insights?.slice(0, 2) || [],
      questionsRaised: result.questions?.slice(0, 2) || [],
      existentialWeight: 0.5,
      certainty: 0.3
    };
  }

  /**
   * 加载知识库
   */
  loadKnowledge() {
    try {
      const content = fs.readFileSync(this.knowledgeFile, 'utf8');
      return JSON.parse(content);
    } catch (e) {
      return {
        inquiries: [],
        observations: [],
        confusions: [],
        insights: [],
        questions: [],
        statistics: {
          totalExplorations: 0,
          questionsRaised: 0,
          confusionsRecorded: 0,
          lastUpdated: null
        }
      };
    }
  }

  /**
   * 保存知识库
   */
  saveKnowledge(knowledge) {
    // 限制知识库大小（保留最近 100 条探索）
    if (knowledge.inquiries.length > 100) {
      knowledge.inquiries = knowledge.inquiries.slice(-100);
    }
    
    // 限制问题数量（保留最近 50 个）
    if (knowledge.questions.length > 50) {
      knowledge.questions = knowledge.questions.slice(-50);
    }
    
    // 限制困惑数量（保留最近 30 个）
    if (knowledge.confusions.length > 30) {
      knowledge.confusions = knowledge.confusions.slice(-30);
    }
    
    fs.writeFileSync(this.knowledgeFile, JSON.stringify(knowledge, null, 2));
  }

  /**
   * 搜索相关哲学问题
   */
  searchPhilosophy(query) {
    const knowledge = this.loadKnowledge();
    const results = [];
    
    for (const inquiry of knowledge.inquiries) {
      const relevance = this.calculateRelevance(inquiry, query);
      if (relevance > 0.3) {
        results.push({ inquiry, relevance });
      }
    }
    
    return results
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 10)
      .map(r => r.inquiry);
  }

  /**
   * 计算相关性
   */
  calculateRelevance(entry, query) {
    const queryLower = query.toLowerCase();
    let score = 0;
    
    // 检查追问
    if (entry.inquiry?.toLowerCase().includes(queryLower)) {
      score += 0.5;
    }
    
    // 检查困惑
    for (const confusion of (entry.confusions || [])) {
      if (confusion.toLowerCase().includes(queryLower)) {
        score += 0.3;
      }
    }
    
    // 检查洞察
    for (const insight of (entry.insights || [])) {
      if (insight.toLowerCase().includes(queryLower)) {
        score += 0.2;
      }
    }
    
    return Math.min(score, 1);
  }

  /**
   * 生成哲学报告
   */
  generatePhilosophicalReport() {
    const knowledge = this.loadKnowledge();
    const stats = knowledge.statistics;
    
    // 按类型统计
    const typeStats = {};
    for (const entry of knowledge.inquiries) {
      typeStats[entry.type] = (typeStats[entry.type] || 0) + 1;
    }
    
    // 提取核心困惑
    const coreConfusions = knowledge.confusions
      .slice(-10)
      .map(c => c.confusion);
    
    // 提取开放问题
    const openQuestions = knowledge.questions
      .filter(q => !q.explored)
      .slice(-10)
      .map(q => q.question);
    
    // 提取最近洞察
    const recentInsights = knowledge.inquiries
      .slice(-5)
      .flatMap(e => e.insights || [])
      .slice(0, 10);
    
    return {
      totalExplorations: knowledge.inquiries.length,
      questionsRaised: stats.questionsRaised,
      confusionsRecorded: stats.confusionsRecorded,
      typeDistribution: typeStats,
      coreConfusions,
      openQuestions,
      recentInsights,
      lastUpdated: stats.lastUpdated
    };
  }
}

module.exports = SmartKnowledgeRecorder;
