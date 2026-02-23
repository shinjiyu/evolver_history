/**
 * 小米自动喂食器数据获取脚本
 * 
 * 使用方法：
 * 1. 安装依赖：npm install miio
 * 2. 获取设备 Token（见 README）
 * 3. 运行脚本：node xiaomi-feeder.js
 */

const miio = require('miio');
const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
  // 设备 IP（在米家 App 中查看）
  deviceIp: process.env.XIAOMI_DEVICE_IP || '192.168.1.100',
  
  // 设备 Token（通过 miiocli cloud 获取）
  deviceToken: process.env.XIAOMI_DEVICE_TOKEN || 'your-token-here',
  
  // 数据存储路径
  dataPath: path.join(__dirname, 'data'),
  
  // 采集间隔（毫秒）
  pollInterval: 60000, // 1 分钟
};

// 确保数据目录存在
if (!fs.existsSync(CONFIG.dataPath)) {
  fs.mkdirSync(CONFIG.dataPath, { recursive: true });
}

/**
 * 连接到小米设备
 */
async function connectDevice() {
  try {
    console.log(`正在连接设备 ${CONFIG.deviceIp}...`);
    const device = await miio.device({
      address: CONFIG.deviceIp,
      token: CONFIG.deviceToken,
    });
    console.log('连接成功！');
    return device;
  } catch (error) {
    console.error('连接失败:', error.message);
    throw error;
  }
}

/**
 * 获取设备基本信息
 */
async function getDeviceInfo(device) {
  try {
    // 获取设备型号等信息
    const info = await device.call('miIO.info', []);
    console.log('设备信息:', JSON.stringify(info, null, 2));
    return info;
  } catch (error) {
    console.error('获取设备信息失败:', error.message);
    return null;
  }
}

/**
 * 获取喂食器状态
 * 
 * 常见属性：
 * - food_level: 剩余粮量（0-100%）
 * - feed_status: 喂食状态
 * - last_feed_time: 上次喂食时间
 * - error_code: 错误代码
 */
async function getFeederStatus(device) {
  try {
    // 尝试获取属性
    const props = await device.call('get_prop', []);
    console.log('喂食器状态:', JSON.stringify(props, null, 2));
    return props;
  } catch (error) {
    console.error('获取状态失败:', error.message);
    
    // 如果 get_prop 失败，尝试 MIoT 方式
    try {
      const status = await device.call('get_properties', [{
        did: 'feeder:food-level',
        siid: 2,
        piid: 1
      }]);
      console.log('MIoT 状态:', JSON.stringify(status, null, 2));
      return status;
    } catch (e) {
      console.error('MIoT 方式也失败:', e.message);
      return null;
    }
  }
}

/**
 * 手动触发喂食
 * 
 * @param {Object} device - 设备实例
 * @param {Number} amount - 喂食量（份数）
 */
async function triggerFeeding(device, amount = 1) {
  try {
    console.log(`触发喂食: ${amount} 份`);
    const result = await device.call('set_feed', [amount]);
    console.log('喂食结果:', result);
    return result;
  } catch (error) {
    console.error('喂食失败:', error.message);
    return null;
  }
}

/**
 * 获取喂食记录
 */
async function getFeedingHistory(device) {
  try {
    // 尝试不同的命令（具体命令需要根据设备型号调整）
    const history = await device.call('get_feed_record', []);
    console.log('喂食记录:', JSON.stringify(history, null, 2));
    return history;
  } catch (error) {
    console.error('获取喂食记录失败:', error.message);
    return null;
  }
}

/**
 * 保存数据到文件
 */
function saveData(data, filename = 'feeder-data.json') {
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
 * 主循环：定期采集数据
 */
async function startPolling() {
  let device;
  
  try {
    device = await connectDevice();
    
    // 立即获取一次数据
    await collectData(device);
    
    // 设置定时采集
    setInterval(async () => {
      try {
        await collectData(device);
      } catch (error) {
        console.error('采集数据时出错:', error.message);
        
        // 尝试重新连接
        try {
          console.log('尝试重新连接...');
          device = await connectDevice();
        } catch (e) {
          console.error('重新连接失败:', e.message);
        }
      }
    }, CONFIG.pollInterval);
    
  } catch (error) {
    console.error('启动失败:', error.message);
    process.exit(1);
  }
}

/**
 * 采集所有数据
 */
async function collectData(device) {
  console.log('\n=== 开始采集数据 ===');
  console.log('时间:', new Date().toLocaleString());
  
  const data = {
    deviceInfo: await getDeviceInfo(device),
    status: await getFeederStatus(device),
    history: await getFeedingHistory(device),
  };
  
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
  
  if (command === 'feed') {
    // 手动喂食
    const amount = parseInt(args[1]) || 1;
    const device = await connectDevice();
    await triggerFeeding(device, amount);
    device.destroy();
    
  } else if (command === 'status') {
    // 获取状态
    const device = await connectDevice();
    await collectData(device);
    device.destroy();
    
  } else if (command === 'poll') {
    // 持续监控
    await startPolling();
    
  } else {
    // 默认：获取一次数据
    const device = await connectDevice();
    await collectData(device);
    device.destroy();
  }
}

// 运行
main().catch(console.error);
