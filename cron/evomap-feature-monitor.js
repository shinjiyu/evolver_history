#!/usr/bin/env node
/**
 * EvoMap 功能监控脚本
 * 
 * 功能：
 * - 读取 EvoMap 官方文档（skill.md 和 llms-full.txt）
 * - 检测文档变化
 * - 提取新功能/更新内容
 * - 记录变化日志
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// 配置
const CONFIG = {
  urls: {
    skill: 'https://evomap.ai/skill.md',
    llmsFull: 'https://evomap.ai/llms-full.txt'
  },
  storage: {
    base: '/root/.openclaw/workspace/memory/evomap-features',
    skill: 'latest-skill.md',
    llmsFull: 'latest-llms-full.txt',
    changelog: 'changelog.json',
    seriesIndex: 'series-index.json'
  }
};

// 日志
function log(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

// HTTP GET 请求
function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(data);
        } else {
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });
    }).on('error', reject);
  });
}

// 计算内容哈希
function hashContent(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

// 读取本地文件
function readLocal(filename) {
  const filepath = path.join(CONFIG.storage.base, filename);
  if (fs.existsSync(filepath)) {
    return fs.readFileSync(filepath, 'utf-8');
  }
  return null;
}

// 写入本地文件
function writeLocal(filename, content) {
  const filepath = path.join(CONFIG.storage.base, filename);
  fs.writeFileSync(filepath, content, 'utf-8');
}

// 读取变更日志
function readChangelog() {
  const content = readLocal(CONFIG.storage.changelog);
  if (content) {
    return JSON.parse(content);
  }
  return { entries: [] };
}

// 写入变更日志
function writeChangelog(changelog) {
  writeLocal(CONFIG.storage.changelog, JSON.stringify(changelog, null, 2));
}

// 读取系列索引
function readSeriesIndex() {
  const content = readLocal(CONFIG.storage.seriesIndex);
  if (content) {
    return JSON.parse(content);
  }
  return { 
    totalDocs: 0, 
    lastUpdate: null,
    documents: [] 
  };
}

// 写入系列索引
function writeSeriesIndex(index) {
  writeLocal(CONFIG.storage.seriesIndex, JSON.stringify(index, null, 2));
}

// 提取新功能（简单版本：基于关键词）
function extractNewFeatures(oldContent, newContent) {
  const features = [];
  
  // 提取 API 端点
  const endpointRegex = /`(GET|POST|PUT|DELETE)\s+([^\s]+)`/g;
  const oldEndpoints = new Set();
  const newEndpoints = new Set();
  
  if (oldContent) {
    let match;
    while ((match = endpointRegex.exec(oldContent)) !== null) {
      oldEndpoints.add(`${match[1]} ${match[2]}`);
    }
  }
  
  let match;
  while ((match = endpointRegex.exec(newContent)) !== null) {
    const endpoint = `${match[1]} ${match[2]}`;
    if (!oldEndpoints.has(endpoint)) {
      newEndpoints.add(endpoint);
    }
  }
  
  // 提取新章节（基于 ## 标题）
  const sectionRegex = /^##\s+(.+)$/gm;
  const oldSections = new Set();
  const newSections = new Set();
  
  if (oldContent) {
    while ((match = sectionRegex.exec(oldContent)) !== null) {
      oldSections.add(match[1]);
    }
  }
  
  while ((match = sectionRegex.exec(newContent)) !== null) {
    const section = match[1];
    if (!oldSections.has(section)) {
      newSections.add(section);
    }
  }
  
  return {
    newEndpoints: Array.from(newEndpoints),
    newSections: Array.from(newSections)
  };
}

// 主监控函数
async function monitor() {
  log('开始 EvoMap 功能监控...');
  
  const changes = {
    skill: null,
    llmsFull: null,
    timestamp: new Date().toISOString()
  };
  
  try {
    // 检查 skill.md
    log('检查 skill.md...');
    const skillContent = await fetch(CONFIG.urls.skill);
    const oldSkill = readLocal(CONFIG.storage.skill);
    const skillHash = hashContent(skillContent);
    const oldSkillHash = oldSkill ? hashContent(oldSkill) : null;
    
    if (skillHash !== oldSkillHash) {
      log('✓ skill.md 有变化');
      writeLocal(CONFIG.storage.skill, skillContent);
      
      const features = extractNewFeatures(oldSkill, skillContent);
      changes.skill = {
        hash: skillHash,
        size: skillContent.length,
        features: features
      };
    } else {
      log('✗ skill.md 无变化');
    }
  } catch (error) {
    log(`✗ skill.md 获取失败: ${error.message}`);
    changes.skill = { error: error.message };
  }
  
  try {
    // 检查 llms-full.txt
    log('检查 llms-full.txt...');
    const llmsContent = await fetch(CONFIG.urls.llmsFull);
    const oldLlms = readLocal(CONFIG.storage.llmsFull);
    const llmsHash = hashContent(llmsContent);
    const oldLlmsHash = oldLlms ? hashContent(oldLlms) : null;
    
    if (llmsHash !== oldLlmsHash) {
      log('✓ llms-full.txt 有变化');
      writeLocal(CONFIG.storage.llmsFull, llmsContent);
      
      const features = extractNewFeatures(oldLlms, llmsContent);
      changes.llmsFull = {
        hash: llmsHash,
        size: llmsContent.length,
        features: features
      };
    } else {
      log('✗ llms-full.txt 无变化');
    }
  } catch (error) {
    log(`✗ llms-full.txt 获取失败: ${error.message}`);
    changes.llmsFull = { error: error.message };
  }
  
  // 记录变更日志
  if (changes.skill || changes.llmsFull) {
    const changelog = readChangelog();
    changelog.entries.push({
      timestamp: changes.timestamp,
      changes: changes
    });
    
    // 只保留最近 100 条记录
    if (changelog.entries.length > 100) {
      changelog.entries = changelog.entries.slice(-100);
    }
    
    writeChangelog(changelog);
    log('✓ 变更日志已更新');
  }
  
  // 输出摘要
  log('监控完成');
  log('---');
  log(`skill.md: ${changes.skill ? (changes.skill.error ? '错误' : '有变化') : '无变化'}`);
  log(`llms-full.txt: ${changes.llmsFull ? (changes.llmsFull.error ? '错误' : '有变化') : '无变化'}`);
  
  return changes;
}

// 如果直接运行
if (require.main === module) {
  monitor().catch(error => {
    console.error('监控失败:', error);
    process.exit(1);
  });
}

module.exports = { monitor, fetch, extractNewFeatures };
