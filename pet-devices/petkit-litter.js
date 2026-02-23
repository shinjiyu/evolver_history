/**
 * 小佩（PETKIT）自动猫砂盆数据获取脚本
 * 
 * 使用方法：
 * 1. 先使用 mitmproxy 抓包获取 API 端点和认证信息
 * 2. 配置环境变量或修改本文件中的配置
 * 3. 运行脚本：node petkit-litter.js
 * 
 * 注意：API 端点需要通过抓包确认，以下是推测的实现
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// 配置
const CONFIG = {
  // PETKIT API 基础 URL（需要通过抓包确认）
  baseUrl: process.env.PETKIT_API_URL || 'https://api.petkit.com',
  
  // 用户凭证（通过抓包获取）
  email: process.env.PETKIT_EMAIL || 'your-email@example.com',
  password: process.env.PETKIT_PASSWORD || 'your-password',
  
  // 认证 Token（登录后获取）
  authToken: process.env.PETKIT_AUTH_TOKEN || null,
  
  // 设备 ID（通过 API 获取）
  deviceId: process.env.PETKIT_DEVICE_ID || null,
  
  // 数据存储路径
  dataPath: path.join(__dirname, 'data'),
  
  // 采集间隔（毫秒）
  pollInterval: 60000, // 1 分钟
};

// 确保数据目录存在
if (!fs.existsSync(CONFIG.dataPath)) {
  fs.mkdirSync(CONFIG.dataPath, { recursive: true });
}

// 创建 axios 实例
const api = axios.create({
  baseURL: CONFIG.baseUrl,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'PETKIT/1.0.0',
  }
});

/**
 * 登录获取 Token
 * 
 * 注意：具体的登录 API 需要通过抓包确认
 */
async function login() {
  try {
    console.log('正在登录 PETKIT...');
    
    // 推测的登录端点（需要确认）
    const response = await api.post('/v1/user/login', {
      email: CONFIG.email,
      password: CONFIG.password,
      // 或者可能是其他认证方式
      // phone: CONFIG.phone,
      // code: CONFIG.verifyCode,
    });
    
    if (response.data && response.data.token) {
      CONFIG.authToken = response.data.token;
      console.log('登录成功！');
      
      // 更新 axios 默认 header
      api.defaults.headers.common['Authorization'] = `Bearer ${CONFIG.authToken}`;
      
      return response.data;
    } else {
      throw new Error('登录响应中没有 token');
    }
  } catch (error) {
    console.error('登录失败:', error.message);
    
    if (error.response) {
      console.error('响应数据:', error.response.data);
    }
    
    throw error;
  }
}

/**
 * 获取设备列表
 */
async function getDeviceList() {
  try {
    console.log('正在获取设备列表...');
    
    // 推测的端点（需要确认）
    const response = await api.get('/v1/device/list');
    
    console.log('设备列表:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('获取设备列表失败:', error.message);
    return null;
  }
}

/**
 * 获取设备状态
 * 
 * @param {String} deviceId - 设备 ID
 */
async function getDeviceStatus(deviceId = CONFIG.deviceId) {
  if (!deviceId) {
    console.error('请先设置设备 ID');
    return null;
  }
  
  try {
    console.log(`正在获取设备 ${deviceId} 的状态...`);
    
    // 推测的端点（需要确认）
    const response = await api.get(`/v1/device/${deviceId}/status`);
    
    console.log('设备状态:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('获取设备状态失败:', error.message);
    return null;
  }
}

/**
 * 获取使用记录
 * 
 * @param {String} deviceId - 设备 ID
 * @param {Object} options - 查询选项
 */
async function getUsageHistory(deviceId = CONFIG.deviceId, options = {}) {
  if (!deviceId) {
    console.error('请先设置设备 ID');
    return null;
  }
  
  try {
    console.log(`正在获取设备 ${deviceId} 的使用记录...`);
    
    const params = {
      start_date: options.startDate || getDateDaysAgo(7),
      end_date: options.endDate || getTodayDate(),
    };
    
    // 推测的端点（需要确认）
    const response = await api.get(`/v1/device/${deviceId}/usage`, { params });
    
    console.log('使用记录:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('获取使用记录失败:', error.message);
    return null;
  }
}

/**
 * 触发手动清洁
 * 
 * @param {String} deviceId - 设备 ID
 */
async function triggerCleaning(deviceId = CONFIG.deviceId) {
  if (!deviceId) {
    console.error('请先设置设备 ID');
    return null;
  }
  
  try {
    console.log(`触发设备 ${deviceId} 清洁...`);
    
    // 推测的端点（需要确认）
    const response = await api.post(`/v1/device/${deviceId}/clean`);
    
    console.log('清洁结果:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('触发清洁失败:', error.message);
    return null;
  }
}

/**
 * 解析使用数据
 * 
 * @param {Object} data - 原始数据
 * @returns {Object} 解析后的数据
 */
function parseUsageData(data) {
  // 根据实际 API 响应格式解析
  // 以下为示例实现
  
  if (!data || !data.records) {
    return null;
  }
  
  return data.records.map(record => ({
    timestamp: record.time || record.timestamp,
    eventType: record.type || record.event_type,
    duration: record.duration || 0,
    weight: record.weight || null,
    // 其他可能的字段
  }));
}

/**
 * 保存数据到文件
 */
function saveData(data, filename = 'litter-data.json') {
  const filePath = path.join(CONFIG.dataPath, filename);
  const record = {
    timestamp: new Date().toISOString(),
    data: data
  };
  
  let records = [];
  if (fs.existsSync(filePath)) {
    const existing = fs.readFileSync(filePath, 'utf-8');
    records = JSON.parse(existing);
  }
  
  records.push(record);
  fs.writeFileSync(filePath, JSON.stringify(records, null, 2));
  console.log(`数据已保存到 ${filePath}`);
}

/**
 * 辅助函数：获取今天日期
 */
function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

/**
 * 辅助函数：获取 N 天前的日期
 */
function getDateDaysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
}

/**
 * 主循环：定期采集数据
 */
async function startPolling() {
  // 先登录
  await login();
  
  // 如果没有设备 ID，先获取
  if (!CONFIG.deviceId) {
    const devices = await getDeviceList();
    if (devices && devices.length > 0) {
      CONFIG.deviceId = devices[0].id || devices[0].device_id;
      console.log(`自动选择设备: ${CONFIG.deviceId}`);
    }
  }
  
  // 立即获取一次数据
  await collectData();
  
  // 设置定时采集
  setInterval(async () => {
    try {
      await collectData();
    } catch (error) {
      console.error('采集数据时出错:', error.message);
      
      // 如果是认证错误，尝试重新登录
      if (error.response && error.response.status === 401) {
        console.log('Token 过期，重新登录...');
        await login();
      }
    }
  }, CONFIG.pollInterval);
}

/**
 * 采集所有数据
 */
async function collectData() {
  console.log('\n=== 开始采集数据 ===');
  console.log('时间:', new Date().toLocaleString());
  
  const data = {
    status: await getDeviceStatus(),
    history: await getUsageHistory(),
  };
  
  // 解析数据
  if (data.history) {
    data.parsedHistory = parseUsageData(data.history);
  }
  
  // 保存数据
  saveData(data);
  
  return data;
}

/**
 * 命令行入口
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  // 如果有 Token，设置到 header
  if (CONFIG.authToken) {
    api.defaults.headers.common['Authorization'] = `Bearer ${CONFIG.authToken}`;
  }
  
  if (command === 'login') {
    // 仅登录
    await login();
    
  } else if (command === 'devices') {
    // 获取设备列表
    await login();
    await getDeviceList();
    
  } else if (command === 'status') {
    // 获取状态
    await login();
    await collectData();
    
  } else if (command === 'clean') {
    // 触发清洁
    await login();
    await triggerCleaning(args[1] || CONFIG.deviceId);
    
  } else if (command === 'poll') {
    // 持续监控
    await startPolling();
    
  } else {
    // 默认：获取一次数据
    await login();
    await collectData();
  }
}

// 运行
main().catch(console.error);

/**
 * ========================================
 * 抓包指南
 * ========================================
 * 
 * 1. 安装 mitmproxy:
 *    pip install mitmproxy
 * 
 * 2. 启动代理:
 *    mitmproxy -p 8080
 * 
 * 3. 手机配置代理:
 *    WiFi 设置 -> 代理 -> 手动
 *    主机名: 电脑 IP
 *    端口: 8080
 * 
 * 4. 安装证书:
 *    手机浏览器访问 mitm.it
 *    下载并安装证书
 * 
 * 5. 使用 PETKIT App:
 *    所有 API 请求会被捕获
 * 
 * 6. 分析请求:
 *    - 记录 API 端点
 *    - 记录认证方式
 *    - 记录请求/响应格式
 * 
 * 7. 更新本脚本:
 *    - 修改 baseUrl
 *    - 修改 login() 中的登录逻辑
 *    - 修改其他 API 端点
 */
