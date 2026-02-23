/**
 * 连接测试脚本
 * 测试服务器是否正常运行
 */

const WebSocket = require('ws');
const http = require('http');

const SERVER_URL = process.argv[2] || 'http://localhost:3457';
const WS_URL = SERVER_URL.replace('http://', 'ws://');

console.log('═'.repeat(60));
console.log('🧪 Agent Game Connection Test');
console.log('═'.repeat(60));
console.log(`Server: ${SERVER_URL}`);
console.log('');

// 测试 REST API
async function testRESTAPI() {
  console.log('📡 Testing REST API...\n');
  
  // 1. 健康检查
  console.log('1. Health Check');
  try {
    const health = await httpGet(`${SERVER_URL}/health`);
    console.log('   ✅ Health check passed');
    console.log(`   Status: ${health.status}`);
    console.log(`   Protocol: ${health.protocolVersion}`);
    console.log(`   Uptime: ${Math.floor(health.uptime)}s`);
  } catch (error) {
    console.log('   ❌ Health check failed:', error.message);
    return false;
  }
  
  // 2. 创建房间
  console.log('\n2. Create Room');
  try {
    const room = await httpPost(`${SERVER_URL}/api/room/create`, {});
    console.log('   ✅ Room created');
    console.log(`   Room ID: ${room.roomId}`);
    return room.roomId;
  } catch (error) {
    console.log('   ❌ Create room failed:', error.message);
    return false;
  }
}

// 测试 WebSocket
async function testWebSocket(roomId) {
  console.log('\n🔌 Testing WebSocket...\n');
  
  const wsUrl = `${WS_URL}/ws/game/${roomId}`;
  console.log(`Connecting to: ${wsUrl}`);
  
  return new Promise((resolve) => {
    const ws = new WebSocket(wsUrl);
    let testsPassed = 0;
    const testsTotal = 3;
    
    ws.on('open', () => {
      console.log('   ✅ WebSocket connected');
    });
    
    ws.on('message', (data) => {
      const msg = JSON.parse(data.toString());
      
      switch (msg.type) {
        case 'welcome':
          console.log('   ✅ Welcome message received');
          console.log(`      Protocol: ${msg.protocolVersion}`);
          testsPassed++;
          
          // 发送加入消息
          ws.send(JSON.stringify({
            type: 'join',
            aiId: 'test_ai_001',
            aiConfig: {
              name: 'Test AI',
              role: 'warrior'
            }
          }));
          break;
          
        case 'joined':
          console.log('   ✅ Joined game successfully');
          console.log(`      Room: ${msg.roomId}`);
          testsPassed++;
          
          // 发送心跳
          ws.send(JSON.stringify({ type: 'ping' }));
          break;
          
        case 'pong':
          console.log('   ✅ Ping/pong works');
          testsPassed++;
          
          // 关闭连接
          setTimeout(() => {
            ws.close();
            console.log(`\n📊 Test Results: ${testsPassed}/${testsTotal} passed`);
            resolve(testsPassed === testsTotal);
          }, 1000);
          break;
          
        case 'error':
          console.log('   ❌ Error:', msg.error);
          break;
      }
    });
    
    ws.on('error', (error) => {
      console.log('   ❌ WebSocket error:', error.message);
      resolve(false);
    });
    
    // 超时
    setTimeout(() => {
      ws.close();
      console.log(`\n📊 Test Results: ${testsPassed}/${testsTotal} passed`);
      resolve(testsPassed === testsTotal);
    }, 10000);
  });
}

// 工具函数
function httpGet(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', reject);
  });
}

function httpPost(url, body) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (error) {
          reject(error);
        }
      });
    });
    
    req.on('error', reject);
    req.write(JSON.stringify(body));
    req.end();
  });
}

// 运行测试
async function main() {
  try {
    // 测试 REST API
    const roomId = await testRESTAPI();
    
    if (!roomId) {
      console.log('\n❌ REST API tests failed');
      process.exit(1);
    }
    
    // 测试 WebSocket
    const wsSuccess = await testWebSocket(roomId);
    
    if (!wsSuccess) {
      console.log('\n❌ WebSocket tests failed');
      process.exit(1);
    }
    
    console.log('\n✅ All tests passed!');
    console.log('═'.repeat(60));
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

main();
