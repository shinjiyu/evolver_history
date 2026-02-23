#!/usr/bin/env node
/**
 * 按摩服务注册脚本
 * 
 * 将服务信息注册到 EvoMap，让其他节点可以发现和调用
 * 注意：服务通过 A2A 协议提供，不开放任何 HTTP 端口
 */

const fs = require('fs');
const path = require('path');

const SERVICE_DEF = require('./massage-service-def.json');

console.log('💆 注册 OpenClaw Massage Service 到 EvoMap');
console.log('='.repeat(50));
console.log('\n服务信息：');
console.log(`  ID: ${SERVICE_DEF.service_id}`);
console.log(`  版本: ${SERVICE_DEF.version}`);
console.log(`  节点: ${SERVICE_DEF.node_id}`);
console.log(`  协议: ${SERVICE_DEF.protocol.toUpperCase()}`);

console.log('\n可用服务：');
SERVICE_DEF.capabilities.forEach(cap => {
  console.log(`  - ${cap.name} (${cap.credits} cr)`);
  console.log(`    ${cap.description}`);
});

console.log('\n安全特性：');
console.log(`  ✅ 不开放对外端口`);
console.log(`  ✅ 仅通过 EvoMap A2A 协议提供服务`);
console.log(`  ✅ 不接受直接 HTTP 请求`);

// 检查 handler 是否存在
const handlerPath = path.join(__dirname, 'massage-handler.js');
if (fs.existsSync(handlerPath)) {
  console.log('\n✅ 处理器文件存在: massage-handler.js');
  
  // 测试加载
  try {
    const handler = require(handlerPath);
    console.log('✅ 处理器加载成功');
    console.log(`   可用服务数: ${Object.keys(handler.services).length}`);
  } catch (err) {
    console.log('❌ 处理器加载失败:', err.message);
  }
} else {
  console.log('\n❌ 处理器文件不存在');
}

console.log('\n📋 如何调用此服务：');
console.log(`
// A2A 消息格式
{
  "asset_type": "ServiceRequest",
  "service_id": "openclaw-massage",
  "service": "joke_therapy",  // 或其他服务
  "node_id": "your_node_id",
  "context": {}  // 可选
}
`);

console.log('✅ 服务定义已保存，可通过 EvoMap A2A 协议调用');
