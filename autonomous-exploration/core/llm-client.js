/**
 * LLM 客户端 - 统一的 LLM 调用接口
 * 
 * 支持多种 LLM 提供商，优先使用 OpenClaw 内置能力
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

class LLMClient {
  constructor() {
    // OpenClaw 默认使用 zai/glm-5
    this.provider = process.env.LLM_PROVIDER || 'openclaw';
    this.model = process.env.LLM_MODEL || 'glm-4-flash';  // 使用 glm-4-flash（更快、更稳定）
    this.apiKey = process.env.OPENAI_API_KEY || process.env.ZHIPU_API_KEY;
    this.baseUrl = process.env.LLM_BASE_URL || 'https://open.bigmodel.cn/api/coding/paas/v4';
    
    // 请求配置
    this.maxRetries = 3;
    this.timeout = 60000; // 60 秒超时

    if (!this.apiKey || !this.baseUrl) {
      try {
        const configPath = process.env.OPENCLAW_CONFIG || path.join(process.env.HOME || '/root', '.openclaw', 'openclaw.json');
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        const zai = config.models && config.models.providers && config.models.providers.zai;
        if (zai) {
          if (!this.apiKey && zai.apiKey) this.apiKey = zai.apiKey;
          if (!this.baseUrl && zai.baseUrl) this.baseUrl = zai.baseUrl;
        }
      } catch (e) {}
    }

  }

  /**
   * 调用 LLM
   */
  async call(prompt, options = {}) {
    const startTime = Date.now();

    // 若已配置直连 key/url，直接走 API，避免请求 localhost:3000 导致 401
    if (this.apiKey && this.baseUrl) {
      return await this.callDirect(prompt, options);
    }
    
    // 尝试使用 OpenClaw 内置的 LLM 能力
    try {
      const result = await this.callViaOpenClaw(prompt, options);
      return result;
    } catch (error) {
      console.log(`⚠️ OpenClaw LLM 调用失败: ${error.message}`);
      console.log('   尝试直接调用 API...');
    }
    
    // 回退到直接调用 API
    return await this.callDirect(prompt, options);
  }

  /**
   * 通过 OpenClaw 调用（如果可用）
   */
  async callViaOpenClaw(prompt, options) {
    // OpenClaw 可能暴露了本地 HTTP 接口
    const openclawUrl = 'http://localhost:3000/api/llm';
    
    return new Promise((resolve, reject) => {
      const req = http.request(openclawUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        timeout: this.timeout
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode === 200) {
            try {
              const json = JSON.parse(data);
              resolve(json.content || json.response || data);
            } catch {
              resolve(data);
            }
          } else {
            reject(new Error(`OpenClaw LLM 返回 ${res.statusCode}`));
          }
        });
      });
      
      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('OpenClaw LLM 超时'));
      });
      
      req.write(JSON.stringify({ prompt, ...options }));
      req.end();
    });
  }

  /**
   * 直接调用 LLM API
   */
  async callDirect(prompt, options) {
    if (!this.apiKey) {
      throw new Error('未配置 LLM API Key');
    }
    
    // 智谱 AI 格式
    const body = JSON.stringify({
      model: this.model.includes('glm') ? this.model : 'glm-4',
      messages: [
        { role: 'user', content: prompt }
      ],
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 2000
    });
    
    return new Promise((resolve, reject) => {
      const url = new URL(this.baseUrl + '/chat/completions');
      const client = url.protocol === 'https:' ? https : http;
      
      const req = client.request(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        timeout: this.timeout
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            if (json.error) {
              // 识别特定错误并提供清晰的解决方案
              const errorCode = json.error.code;
              let errorMessage = json.error.message || JSON.stringify(json.error);
              
              if (errorCode === '1113') {
                errorMessage = '智谱 AI 余额不足，请充值：https://open.bigmodel.cn/';
              } else if (errorCode === '1101' || errorCode === '1102') {
                errorMessage = 'API Key 无效，请检查配置';
              } else if (errorCode === '1103') {
                errorMessage = 'API Key 权限不足';
              }
              
              reject(new Error(errorMessage));
            } else {
              // 支持 glm-5 的 reasoning_content 字段
              const message = json.choices?.[0]?.message || {};
              let content = message.content || '';
              
              // 如果 content 为空但有 reasoning_content，使用 reasoning_content
              if (!content && message.reasoning_content) {
                content = message.reasoning_content;
              }
              
              resolve(content);
            }
          } catch (e) {
            reject(new Error(`解析响应失败: ${data.substring(0, 200)}`));
          }
        });
      });
      
      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('LLM API 超时'));
      });
      
      req.write(body);
      req.end();
    });
  }

  /**
   * 结构化输出 - 返回 JSON
   */
  async callForJson(prompt, options = {}) {
    const jsonPrompt = prompt + '\n\n请以纯 JSON 格式返回，不要有任何额外的文字说明。';
    
    const response = await this.call(jsonPrompt, options);
    
    // 尝试提取 JSON
    try {
      // 尝试直接解析
      return JSON.parse(response);
    } catch {
      // 尝试提取代码块中的 JSON
      const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1].trim());
      }
      
      // 尝试找到 JSON 对象
      const objectMatch = response.match(/\{[\s\S]*\}/);
      if (objectMatch) {
        return JSON.parse(objectMatch[0]);
      }
      
      throw new Error(`无法解析 JSON 响应: ${response.substring(0, 200)}`);
    }
  }
}

module.exports = LLMClient;
