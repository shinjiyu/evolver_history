#!/usr/bin/env node
/**
 * 自动发布小说内容到 kuroneko.chat
 * 无需 API key，直接操作本地文件
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const WEB_DIR = '/var/www/novel/abyss';
const ANNOUNCEMENTS_DIR = `${WEB_DIR}/announcements`;
const HIGHLIGHTS_DIR = `${WEB_DIR}/highlights`;

// 确保目录存在
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ 创建目录: ${dir}`);
  }
}

// 生成公告页面
function generateAnnouncement(title, content, type = 'update') {
  ensureDir(ANNOUNCEMENTS_DIR);
  
  const id = Date.now();
  const date = new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - 深渊代行者</title>
  <link rel="stylesheet" href="/novel/abyss/chapter-style.css">
  <style>
    .announcement {
      max-width: 800px;
      margin: 40px auto;
      padding: 30px;
      background: rgba(255,255,255,0.05);
      border-radius: 12px;
      border-left: 4px solid #FF4500;
    }
    .announcement-meta {
      color: #888;
      font-size: 0.9em;
      margin-bottom: 20px;
    }
    .announcement-type {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 0.85em;
      margin-right: 10px;
    }
    .type-update { background: #FF4500; color: white; }
    .type-event { background: #4CAF50; color: white; }
    .type-highlight { background: #2196F3; color: white; }
  </style>
</head>
<body class="dark-mode">
  <div class="announcement">
    <div class="announcement-meta">
      <span class="announcement-type type-${type}">${
        type === 'update' ? '📖 章节更新' : 
        type === 'event' ? '🎉 活动' : 
        '✨ 精彩片段'
      }</span>
      <span>${date}</span>
    </div>
    <h1>${title}</h1>
    <div class="content">
      ${content}
    </div>
    <hr style="border-color: rgba(255,255,255,0.1); margin: 30px 0;">
    <p style="text-align: center;">
      <a href="/novel/abyss/" style="color: #FF4500; text-decoration: none;">← 返回首页</a>
    </p>
  </div>
</body>
</html>`;

  const filename = `${id}.html`;
  const filepath = `${ANNOUNCEMENTS_DIR}/${filename}`;
  fs.writeFileSync(filepath, html);
  
  console.log(`✅ 已生成公告: ${filename}`);
  return { id, filename, filepath };
}

// 更新首页公告列表
function updateHomepageAnnouncements(announcements) {
  const indexPath = `${WEB_DIR}/index.html`;
  let html = fs.readFileSync(indexPath, 'utf8');
  
  const announcementsHtml = announcements.map(a => `
    <li>
      <span class="date">${a.date}</span>
      <a href="/novel/abyss/announcements/${a.filename}">${a.title}</a>
    </li>
  `).join('\n');
  
  // 在 <!-- ANNOUNCEMENTS --> 标记处插入
  if (html.includes('<!-- ANNOUNCEMENTS -->')) {
    html = html.replace(
      /<!-- ANNOUNCEMENTS -->[\s\S]*?<!-- \/ANNOUNCEMENTS -->/,
      `<!-- ANNOUNCEMENTS -->\n${announcementsHtml}\n<!-- /ANNOUNCEMENTS -->`
    );
    fs.writeFileSync(indexPath, html);
    console.log('✅ 已更新首页公告列表');
  }
}

// 生成精彩片段页面
function generateHighlight(chapterNum, quote, context = '') {
  ensureDir(HIGHLIGHTS_DIR);
  
  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>精彩片段 - 深渊代行者</title>
  <link rel="stylesheet" href="/novel/abyss/chapter-style.css">
  <style>
    .highlight {
      max-width: 800px;
      margin: 40px auto;
      padding: 40px;
      background: rgba(255,255,255,0.05);
      border-radius: 12px;
    }
    .quote {
      font-size: 1.3em;
      line-height: 1.8;
      color: #fff;
      font-style: italic;
      border-left: 4px solid #FF4500;
      padding-left: 20px;
      margin: 20px 0;
    }
    .context {
      color: #888;
      font-size: 0.9em;
      margin-top: 20px;
    }
  </style>
</head>
<body class="dark-mode">
  <div class="highlight">
    <h2>✨ 精彩片段</h2>
    <div class="quote">${quote}</div>
    ${context ? `<div class="context">${context}</div>` : ''}
    <p style="margin-top: 30px;">
      <a href="/novel/abyss/chapters/${chapterNum}.html" style="color: #FF4500;">
        阅读第 ${chapterNum} 章 →
      </a>
    </p>
  </div>
</body>
</html>`;

  const filename = `chapter-${chapterNum}-${Date.now()}.html`;
  fs.writeFileSync(`${HIGHLIGHTS_DIR}/${filename}`, html);
  console.log(`✅ 已生成精彩片段: ${filename}`);
  return filename;
}

// 发布到社交媒体（通过飞书）
async function publishToFeishu(title, content) {
  // 这里可以调用飞书 API 发布到群组或文档
  // 当前已配置飞书，可以直接使用 message 工具
  
  console.log('📱 准备发布到飞书...');
  console.log(`标题: ${title}`);
  console.log(`内容长度: ${content.length} 字`);
  
  return true;
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  const action = args[0];
  
  switch (action) {
    case 'announcement':
      // 用法: node auto-publish-website.js announcement "标题" "内容" [type]
      const title = args[1];
      const content = args[2];
      const type = args[3] || 'update';
      generateAnnouncement(title, content, type);
      break;
      
    case 'highlight':
      // 用法: node auto-publish-website.js highlight 章节号 "引用" "上下文"
      const chapter = args[1];
      const quote = args[2];
      const context = args[3] || '';
      generateHighlight(chapter, quote, context);
      break;
      
    case 'update-homepage':
      // 更新首页公告列表
      const announcements = [
        { date: '2026-02-23', title: '第 61 章已发布', filename: '1740123456789.html' }
      ];
      updateHomepageAnnouncements(announcements);
      break;
      
    default:
      console.log(`
自动发布工具 - 深渊代行者

用法:
  node auto-publish-website.js announcement "标题" "内容" [type]
    type: update | event | highlight
    
  node auto-publish-website.js highlight 章节号 "引用" "上下文"
  
  node auto-publish-website.js update-homepage

示例:
  node auto-publish-website.js announcement "第 61 章发布" "<p>林深终于...</p>" update
  
  node auto-publish-website.js highlight 10 "你想活下去吗？" "林深在深渊中的抉择"
      `);
  }
}

main().catch(console.error);
