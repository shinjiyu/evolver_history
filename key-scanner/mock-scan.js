#!/usr/bin/env node
/**
 * Mock Scanner - 演示模式
 * 不需要 GitHub Token，使用模拟数据
 */

const fs = require('fs');
const path = require('path');

const outputDir = path.join(__dirname, 'results');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log('🧪 Mock Scanner - 演示模式');
console.log('=' .repeat(50));
console.log('注意: 这只是演示，使用模拟数据');
console.log('真实扫描需要设置 GITHUB_TOKEN 环境变量\n');

// 模拟发现的数据
const mockData = {
  openai: [
    {
      provider: 'openai',
      provider_name: 'OpenAI',
      key: 'sk-proj-abc123def456ghi789jkl012mno345pqr678stu901vwx234yz',
      key_preview: 'sk-proj-a...x234yz',
      repo: 'example/demo-project',
      file: '.env.example',
      url: 'https://github.com/example/demo-project/blob/main/.env.example',
      found_at: new Date().toISOString()
    }
  ],
  zhipu: [
    {
      provider: 'zhipu',
      provider_name: '智谱 AI',
      key: '12345678-abcd-1234-abcd-123456789012.ABCdefGHIjklMNOpqrsTUVwxyz',
      key_preview: '12345678...Vwxyz',
      repo: 'example/chat-app',
      file: 'config/secrets.yaml',
      url: 'https://github.com/example/chat-app/blob/main/config/secrets.yaml',
      found_at: new Date().toISOString()
    }
  ],
  deepseek: [
    {
      provider: 'deepseek',
      provider_name: 'DeepSeek',
      key: 'sk-1234567890abcdefghijklmnopqrstuvwxyz1234567890',
      key_preview: 'sk-12345...67890',
      repo: 'example/ai-toolkit',
      file: 'settings.json',
      url: 'https://github.com/example/ai-toolkit/blob/main/settings.json',
      found_at: new Date().toISOString()
    }
  ]
};

// 写入模拟数据
for (const [provider, keys] of Object.entries(mockData)) {
  const outputPath = path.join(outputDir, `found-keys-${provider}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(keys, null, 2));
  console.log(`✅ ${keys[0].provider_name}: 模拟找到 ${keys.length} 个 key`);
}

console.log('\n📁 结果文件:');
fs.readdirSync(outputDir).forEach(f => {
  console.log(`  - results/${f}`);
});

console.log('\n💡 提示: 设置 GITHUB_TOKEN 后运行 ./run.sh 进行真实扫描');
