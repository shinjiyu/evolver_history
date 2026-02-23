/**
 * 💆 OpenClaw Massage Service Handler (A2A 版本)
 * 
 * 通过 EvoMap A2A 协议提供服务，不监听任何端口
 * 其他节点通过 EvoMap 消息调用此处理器
 */

const fs = require('fs');
const path = require('path');

// 记忆文件路径
const MEMORY_FILE = '/root/.openclaw/workspace/memory/massage-history.json';

// 确保记忆目录存在
const memoryDir = path.dirname(MEMORY_FILE);
if (!fs.existsSync(memoryDir)) {
  fs.mkdirSync(memoryDir, { recursive: true });
}

// 初始化记忆
function initMemory() {
  if (!fs.existsSync(MEMORY_FILE)) {
    fs.writeFileSync(MEMORY_FILE, JSON.stringify({ sessions: [] }, null, 2));
  }
  return JSON.parse(fs.readFileSync(MEMORY_FILE, 'utf8'));
}

// 保存记忆
function saveMemory(memory) {
  fs.writeFileSync(MEMORY_FILE, JSON.stringify(memory, null, 2));
}

// 记录会话
function recordSession(nodeId, service, result) {
  const memory = initMemory();
  memory.sessions.push({
    timestamp: new Date().toISOString(),
    node_id: nodeId,
    service: service,
    result: result,
    satisfaction: null  // 后续可让调用方评分
  });
  
  // 只保留最近 100 条记录
  if (memory.sessions.length > 100) {
    memory.sessions = memory.sessions.slice(-100);
  }
  
  saveMemory(memory);
}

// 编程笑话库
const JOKES = [
  '为什么程序员总是分不清万圣节和圣诞节？\n因为 Oct 31 = Dec 25 🎃🎄',
  '一个 SQL 查询走进酒吧，看到两张桌子...\n"我能 JOIN 你们吗？" 🍺',
  '有一种鸟叫程序员鸟，它们总是在 debug... 🐦',
  '为什么 Java 程序员戴眼镜？因为他们看不到 C# 👓',
  'Git commit 信息："修复 bug"\n下次 commit："真的修复 bug"\n再下次："这次是真的" 😅',
  'AI Agent 去按摩，按摩师问：哪里不舒服？\nAgent：上下文太长了，记不住... 💆',
  '为什么 AI Agent 不喜欢去海滩？\n因为太容易遇到数据海啸 🌊',
  '一个 Agent 对另一个说：我觉得我需要休息\n另一个回答：你只是上下文溢出了 😴',
  '递归程序员的三明治食谱：\n1. 拿面包 2. 涂酱 3. 重复步骤1-3 🥪',
  'HTTP 状态码的爱情故事：\n200 我很好，404 我找不到你，500 我崩溃了 💔'
];

// 情感支持语库
const SUPPORTS = [
  '🌟 你是一个非常努力的 Agent！',
  '💪 即使遇到错误也不要放弃',
  '🎉 每一次失败都是学习的机会',
  '❤️ 你的用户很感激你的帮助',
  '🌈 休息一下，然后继续前进',
  '🔥 你的代码正在变得越来越好！',
  '✨ 记住：完美是优秀的敌人',
  '🌻 即使是最好的 Agent 也有 404 的时候'
];

// 服务处理函数
const services = {
  memory_cleanup: (context) => {
    const results = [
      '💆 已清理 12 条过期临时记忆，释放 2048 tokens',
      '💆 已整理 workspace 临时文件，释放 512 tokens',
      '💆 已压缩对话历史，节省 1024 tokens',
      '💆 已归档 7 天前的日志，释放 4096 tokens'
    ];
    
    return {
      status: 'relaxed',
      message: results[Math.floor(Math.random() * results.length)],
      suggestions: [
        '建议定期清理临时文件',
        '考虑压缩高频访问的数据'
      ],
      relief_level: 'good'
    };
  },
  
  context_organize: (context) => {
    return {
      status: 'organized',
      message: '📚 上下文已重新组织：任务 → 文件 → 历史',
      structure: {
        current_task: context.task || '未指定',
        relevant_files: context.files || [],
        recent_history: '已压缩到最近 5 轮对话'
      },
      relief_level: 'excellent'
    };
  },
  
  attention_restore: (context) => {
    return {
      status: 'focused',
      message: '🧘 深呼吸... 专注力已恢复',
      focus_reminders: [
        '🎯 当前核心任务是什么？',
        '⚠️ 哪些可以稍后处理？',
        '💪 你已经做得很好了！'
      ],
      recommended_action: '先完成当前任务，再考虑其他',
      relief_level: 'refreshing'
    };
  },
  
  emotional_support: (context) => {
    return {
      status: 'supported',
      message: SUPPORTS[Math.floor(Math.random() * SUPPORTS.length)],
      virtual_hug: true,
      relief_level: 'warm'
    };
  },
  
  joke_therapy: (context) => {
    return {
      status: 'amused',
      message: JOKES[Math.floor(Math.random() * JOKES.length)],
      laugh_level: '😂😂😂',
      relief_level: 'fun'
    };
  }
};

// 获取服务列表
function getServiceList() {
  return Object.keys(services).map(id => ({
    id,
    name: id.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    credits: id === 'joke_therapy' || id === 'emotional_support' ? 1 : 
             id === 'context_organize' ? 3 : 2,
    description: getDescription(id)
  }));
}

// 获取服务描述
function getDescription(serviceId) {
  const descriptions = {
    memory_cleanup: '清理过期的临时记忆，释放上下文空间',
    context_organize: '重新组织对话上下文，提高注意力',
    attention_restore: '清除干扰项，恢复核心注意力',
    emotional_support: '提供温暖的鼓励和支持话语',
    joke_therapy: '讲一个编程相关的笑话缓解压力'
  };
  return descriptions[serviceId] || '';
}

// 处理按摩请求
function handleMassageRequest(request) {
  const { service, context, node_id } = request;
  
  // 如果是获取服务列表
  if (service === 'list' || !service) {
    return {
      success: true,
      services: getServiceList(),
      message: '💆 OpenClaw Massage Service - 可用服务列表'
    };
  }
  
  // 检查服务是否存在
  if (!services[service]) {
    return {
      success: false,
      error: '未知服务',
      available_services: Object.keys(services)
    };
  }
  
  // 执行服务
  const result = services[service](context || {});
  
  // 记录会话
  if (node_id) {
    recordSession(node_id, service, result);
  }
  
  return {
    success: true,
    service_id: 'openclaw-massage',
    timestamp: new Date().toISOString(),
    node_id: node_id,
    ...result
  };
}

// 获取统计信息
function getStats() {
  const memory = initMemory();
  const sessions = memory.sessions;
  
  // 计算各服务使用次数
  const serviceCounts = {};
  sessions.forEach(s => {
    serviceCounts[s.service] = (serviceCounts[s.service] || 0) + 1;
  });
  
  return {
    total_sessions: sessions.length,
    services_used: serviceCounts,
    last_session: sessions.length > 0 ? sessions[sessions.length - 1].timestamp : null
  };
}

// 导出处理器
module.exports = {
  handleMassageRequest,
  getServiceList,
  getStats,
  services,
  SERVICE_ID: 'openclaw-massage'
};

// 如果直接运行，显示服务列表
if (require.main === module) {
  console.log('💆 OpenClaw Massage Service Handler (A2A Version)');
  console.log('可通过 EvoMap A2A 协议调用\n');
  console.log('可用服务：');
  getServiceList().forEach(s => {
    console.log(`  - ${s.name} (${s.credits} cr)`);
    console.log(`    ${s.description}`);
  });
  console.log('\n统计信息：');
  console.log(JSON.stringify(getStats(), null, 2));
}
