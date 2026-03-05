#!/usr/bin/env node
/**
 * EvoMap 功能监控与文档生成系统 - 主入口
 * 
 * 整合流程：
 * 1. 监控文档变化
 * 2. 测试 API 功能
 * 3. 生成文档
 * 4. 发布到网站
 */

const path = require('path');

// 配置
const CONFIG = {
  scripts: {
    monitor: '/root/.openclaw/workspace/cron/evomap-feature-monitor.js',
    tester: '/root/.openclaw/workspace/cron/evomap-feature-tester.js',
    generator: '/root/.openclaw/workspace/cron/evomap-doc-generator.js',
    publisher: '/root/.openclaw/workspace/cron/evomap-publish-doc.js'
  }
};

// 日志
function log(message) {
  const timestamp = new Date().toISOString();
  console.log(`\n${'='.repeat(60)}`);
  console.log(`[${timestamp}] ${message}`);
  console.log('='.repeat(60));
}

// 动态加载模块
function loadScript(scriptPath) {
  try {
    delete require.cache[require.resolve(scriptPath)];
    return require(scriptPath);
  } catch (error) {
    console.error(`✗ 加载脚本失败: ${scriptPath}`);
    console.error(error.message);
    return null;
  }
}

// 主函数
async function main() {
  log('EvoMap 功能监控与文档生成系统启动');
  
  const results = {
    timestamp: new Date().toISOString(),
    monitor: null,
    tester: null,
    generator: null,
    publisher: null
  };
  
  // 1. 监控文档变化
  log('步骤 1/4: 监控文档变化');
  const monitor = loadScript(CONFIG.scripts.monitor);
  if (monitor) {
    try {
      results.monitor = await monitor.monitor();
      console.log('✓ 监控完成');
    } catch (error) {
      console.error('✗ 监控失败:', error.message);
      results.monitor = { error: error.message };
    }
  }
  
  // 2. 测试 API 功能
  log('步骤 2/4: 测试 API 功能');
  const tester = loadScript(CONFIG.scripts.tester);
  if (tester) {
    try {
      results.tester = await tester.runTests();
      console.log('✓ 测试完成');
    } catch (error) {
      console.error('✗ 测试失败:', error.message);
      results.tester = { error: error.message };
    }
  }
  
  // 3. 生成文档
  log('步骤 3/4: 生成文档');
  const generator = loadScript(CONFIG.scripts.generator);
  if (generator) {
    try {
      results.generator = await generator.generateDocs();
      console.log('✓ 文档生成完成');
    } catch (error) {
      console.error('✗ 文档生成失败:', error.message);
      results.generator = { error: error.message };
    }
  }
  
  // 4. 发布到网站
  log('步骤 4/4: 发布到网站');
  const publisher = loadScript(CONFIG.scripts.publisher);
  if (publisher) {
    try {
      results.publisher = await publisher.publishAll();
      console.log('✓ 发布完成');
    } catch (error) {
      console.error('✗ 发布失败:', error.message);
      results.publisher = { error: error.message };
    }
  }
  
  // 输出摘要
  log('执行摘要');
  console.log('监控:', results.monitor ? (results.monitor.error ? '失败' : '成功') : '跳过');
  console.log('测试:', results.tester ? (results.tester.error ? '失败' : `通过 ${results.tester.summary?.passed}/${results.tester.summary?.total}`) : '跳过');
  console.log('生成:', results.generator ? (results.generator.error ? '失败' : `生成 ${results.generator.totalDocs} 篇`) : '跳过');
  console.log('发布:', results.publisher ? (results.publisher.error ? '失败' : `发布 ${results.publisher.published}/${results.publisher.total}`) : '跳过');
  
  return results;
}

// 如果直接运行
if (require.main === module) {
  main().catch(error => {
    console.error('系统执行失败:', error);
    process.exit(1);
  });
}

module.exports = { main };
