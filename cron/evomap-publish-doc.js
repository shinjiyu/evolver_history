#!/usr/bin/env node
/**
 * EvoMap 文档发布系统
 * 
 * 功能：
 * - 将生成的 Markdown 文档转换为 HTML
 * - 发布到 kuroneko.chat
 * - 更新索引页面
 */

const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
  input: '/var/www/kuroneko.chat/evomap-docs',
  output: '/var/www/kuroneko.chat/evomap-docs',
  storage: '/root/.openclaw/workspace/memory/evomap-features'
};

// 日志
function log(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

// 简单的 Markdown 转 HTML
function markdownToHtml(markdown, title = 'EvoMap 文档') {
  // 转换标题
  let html = markdown
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>');
  
  // 转换代码块
  html = html.replace(/```(\w+)?\n([\s\S]+?)```/g, (match, lang, code) => {
    return `<pre><code class="language-${lang || 'javascript'}">${escapeHtml(code)}</code></pre>`;
  });
  
  // 转换行内代码
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  // 转换粗体和斜体
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  
  // 转换链接
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  
  // 转换列表
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');
  
  // 转换表格
  html = html.replace(/\|(.+)\|/g, (match, content) => {
    const cells = content.split('|').map(c => c.trim());
    const isHeader = cells.some(c => c.startsWith('-'));
    if (isHeader) {
      return '<!-- table separator -->';
    }
    return `<tr>${cells.map(c => `<td>${c}</td>`).join('')}</tr>`;
  });
  html = html.replace(/(<tr>[\s\S]+?<\/tr>\n?)+/g, (match) => {
    return `<table>${match}</table>`;
  });
  html = html.replace(/<!-- table separator -->/g, '');
  
  // 转换水平线
  html = html.replace(/^---$/gm, '<hr>');
  
  // 转换段落
  html = html.replace(/^(?!<[a-z]|$)(.+)$/gm, '<p>$1</p>');
  
  return html;
}

// HTML 转义
function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// 生成完整 HTML 页面
function generateFullHtml(content, title) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f5f5f5;
    }
    
    .container {
      max-width: 900px;
      margin: 0 auto;
      padding: 20px;
    }
    
    .content {
      background: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    h1 {
      font-size: 2em;
      margin-bottom: 20px;
      color: #2c3e50;
      border-bottom: 3px solid #3498db;
      padding-bottom: 10px;
    }
    
    h2 {
      font-size: 1.5em;
      margin: 30px 0 15px;
      color: #34495e;
      border-left: 4px solid #3498db;
      padding-left: 10px;
    }
    
    h3 {
      font-size: 1.2em;
      margin: 20px 0 10px;
      color: #34495e;
    }
    
    p {
      margin: 10px 0;
    }
    
    code {
      background: #f8f9fa;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: "SF Mono", Monaco, "Cascadia Code", monospace;
      font-size: 0.9em;
      color: #e74c3c;
    }
    
    pre {
      background: #2c3e50;
      color: #ecf0f1;
      padding: 20px;
      border-radius: 5px;
      overflow-x: auto;
      margin: 15px 0;
    }
    
    pre code {
      background: none;
      color: inherit;
      padding: 0;
    }
    
    a {
      color: #3498db;
      text-decoration: none;
    }
    
    a:hover {
      text-decoration: underline;
    }
    
    ul {
      margin: 10px 0;
      padding-left: 30px;
    }
    
    li {
      margin: 5px 0;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
    }
    
    td, th {
      border: 1px solid #ddd;
      padding: 10px;
      text-align: left;
    }
    
    tr:nth-child(even) {
      background: #f8f9fa;
    }
    
    hr {
      border: none;
      border-top: 2px solid #eee;
      margin: 30px 0;
    }
    
    .nav {
      background: #3498db;
      color: white;
      padding: 15px 20px;
      margin-bottom: 20px;
      border-radius: 8px;
    }
    
    .nav a {
      color: white;
      margin-right: 15px;
    }
    
    .footer {
      text-align: center;
      margin-top: 30px;
      padding: 20px;
      color: #7f8c8d;
      font-size: 0.9em;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="nav">
      <a href="/">首页</a>
      <a href="/evomap-docs/">系列索引</a>
      <a href="https://evomap.ai" target="_blank">EvoMap 官网</a>
    </div>
    
    <div class="content">
      ${content}
    </div>
    
    <div class="footer">
      <p>由 OpenClaw Agent 自动生成 | <a href="https://github.com/shinjiyu/evolver_history">GitHub</a></p>
    </div>
  </div>
</body>
</html>`;
}

// 发布文档
function publishDoc(mdFilename) {
  const mdPath = path.join(CONFIG.input, mdFilename);
  
  if (!fs.existsSync(mdPath)) {
    log(`✗ 文件不存在: ${mdPath}`);
    return false;
  }
  
  const markdown = fs.readFileSync(mdPath, 'utf-8');
  
  // 提取标题
  const titleMatch = markdown.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1] : 'EvoMap 文档';
  
  // 转换为 HTML
  const content = markdownToHtml(markdown);
  const fullHtml = generateFullHtml(content, title);
  
  // 保存 HTML
  const htmlFilename = mdFilename.replace('.md', '.html');
  const htmlPath = path.join(CONFIG.output, htmlFilename);
  fs.writeFileSync(htmlPath, fullHtml);
  
  log(`✓ 已发布: ${htmlFilename}`);
  return true;
}

// 发布所有文档
async function publishAll() {
  log('开始发布文档...');
  
  // 确保输出目录存在
  if (!fs.existsSync(CONFIG.output)) {
    fs.mkdirSync(CONFIG.output, { recursive: true });
    log(`✓ 创建目录: ${CONFIG.output}`);
  }
  
  // 查找所有 Markdown 文件
  const files = fs.readdirSync(CONFIG.input).filter(f => f.endsWith('.md'));
  
  if (files.length === 0) {
    log('没有找到 Markdown 文件');
    return { published: 0 };
  }
  
  log(`找到 ${files.length} 个 Markdown 文件`);
  
  // 发布每个文件
  let published = 0;
  for (const file of files) {
    if (publishDoc(file)) {
      published++;
    }
  }
  
  log(`发布完成: ${published}/${files.length}`);
  
  return { published, total: files.length };
}

// 如果直接运行
if (require.main === module) {
  publishAll().catch(error => {
    console.error('发布失败:', error);
    process.exit(1);
  });
}

module.exports = { publishAll, publishDoc, markdownToHtml, generateFullHtml };
