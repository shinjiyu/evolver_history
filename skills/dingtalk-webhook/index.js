/**
 * 钉钉 Webhook 机器人
 * 
 * 用于发送消息到钉钉群
 */

const crypto = require('crypto');

// 配置缓存
let config = null;

/**
 * 加载配置
 */
function loadConfig() {
  if (config) return config;
  
  try {
    const fs = require('fs');
    const path = require('path');
    const toolsPath = path.join(process.env.OPENCLAW_WORKSPACE || '/root/.openclaw/workspace', 'TOOLS.md');
    
    if (fs.existsSync(toolsPath)) {
      const content = fs.readFileSync(toolsPath, 'utf-8');
      // 简单解析 YAML 配置
      const webhookMatch = content.match(/webhooks:\s*\n([\s\S]*?)(?=\n\s*\w+:|\n\s*$)/);
      const secretsMatch = content.match(/secrets:\s*\n([\s\S]*?)(?=\n\s*\w+:|\n\s*$)/);
      
      config = {
        webhooks: {},
        secrets: {}
      };
      
      if (webhookMatch) {
        const lines = webhookMatch[1].split('\n');
        lines.forEach(line => {
          const match = line.match(/^\s*(\w+):\s*(.+)$/);
          if (match) {
            config.webhooks[match[1]] = match[2].trim();
          }
        });
      }
      
      if (secretsMatch) {
        const lines = secretsMatch[1].split('\n');
        lines.forEach(line => {
          const match = line.match(/^\s*(\w+):\s*(.+)$/);
          if (match) {
            config.secrets[match[1]] = match[2].trim();
          }
        });
      }
    }
  } catch (e) {
    console.error('加载钉钉配置失败:', e.message);
  }
  
  config = config || { webhooks: {}, secrets: {} };
  return config;
}

/**
 * 生成签名
 */
function generateSign(timestamp, secret) {
  if (!secret) return '';
  
  const stringToSign = `${timestamp}\n${secret}`;
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(stringToSign);
  return encodeURIComponent(hmac.digest('base64'));
}

/**
 * 发送钉钉消息
 * 
 * @param {Object} options
 * @param {string} options.webhook - Webhook 名称或 URL
 * @param {string} options.content - 消息内容
 * @param {string} [options.msgtype='text'] - 消息类型：text, markdown, link, actionCard
 * @param {string[]} [options.atUserIds] - @的用户 ID 列表
 * @param {boolean} [options.atAll] - 是否 @所有人
 * @param {string} [options.title] - Markdown 标题
 */
async function sendDingtalkMessage(options) {
  const { 
    webhook = 'default',
    content,
    msgtype = 'text',
    atUserIds = [],
    atAll = false,
    title = '消息通知'
  } = options;
  
  const cfg = loadConfig();
  
  // 获取 webhook URL
  let webhookUrl = cfg.webhooks[webhook] || webhook;
  
  if (!webhookUrl) {
    throw new Error(`Webhook "${webhook}" not found in configuration`);
  }
  
  // 获取签名密钥
  const secret = cfg.secrets[webhook] || cfg.secrets['default'];
  
  // 生成签名
  const timestamp = Date.now();
  const sign = generateSign(timestamp, secret);
  
  // 构建完整 URL
  let fullUrl = webhookUrl;
  if (sign) {
    const separator = webhookUrl.includes('?') ? '&' : '?';
    fullUrl = `${webhookUrl}${separator}timestamp=${timestamp}&sign=${sign}`;
  }
  
  // 构建消息体
  let body;
  
  if (msgtype === 'text') {
    body = {
      msgtype: 'text',
      text: { content },
      at: {
        atUserIds,
        isAtAll: atAll
      }
    };
  } else if (msgtype === 'markdown') {
    body = {
      msgtype: 'markdown',
      markdown: {
        title,
        text: content
      },
      at: {
        atUserIds,
        isAtAll: atAll
      }
    };
  } else if (msgtype === 'link') {
    body = {
      msgtype: 'link',
      link: {
        title,
        text: content,
        messageUrl: options.messageUrl || '',
        picUrl: options.picUrl || ''
      }
    };
  } else {
    throw new Error(`Unsupported msgtype: ${msgtype}`);
  }
  
  // 发送请求
  const response = await fetch(fullUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  
  const result = await response.json();
  
  if (result.errcode !== 0) {
    throw new Error(`DingTalk API error: ${result.errmsg} (code: ${result.errcode})`);
  }
  
  return {
    success: true,
    messageId: result?.messageId
  };
}

/**
 * 快捷方法：发送文本
 */
async function sendText(webhook, content, atUserIds = [], atAll = false) {
  return sendDingtalkMessage({
    webhook,
    content,
    msgtype: 'text',
    atUserIds,
    atAll
  });
}

/**
 * 快捷方法：发送 Markdown
 */
async function sendMarkdown(webhook, title, content, atUserIds = [], atAll = false) {
  return sendDingtalkMessage({
    webhook,
    content,
    title,
    msgtype: 'markdown',
    atUserIds,
    atAll
  });
}

/**
 * 快捷方法：发送告警
 */
async function sendAlert(title, content, atAll = false) {
  return sendMarkdown('alert', title, content, [], atAll);
}

module.exports = {
  sendDingtalkMessage,
  sendText,
  sendMarkdown,
  sendAlert,
  loadConfig,
  generateSign
};
