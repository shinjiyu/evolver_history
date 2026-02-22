# 小说自动发布方案 - 完整指南

## 🎯 目标

让 novel-marketing-execute 任务真正把内容发布到网络上，而不是只准备材料。

---

## 📊 方案对比

| 方案 | 难度 | 效果 | 所需配置 | 推荐度 |
|------|------|------|----------|--------|
| kuroneko.chat 网站 | ⭐☆☆☆☆ | ⭐⭐⭐☆☆ | 无 | ⭐⭐⭐⭐⭐ |
| 飞书群/文档 | ⭐⭐☆☆☆ | ⭐⭐☆☆☆ | 已配置 | ⭐⭐⭐⭐☆ |
| Telegram 频道 | ⭐⭐⭐☆☆ | ⭐⭐⭐⭐☆ | Bot Token | ⭐⭐⭐⭐☆ |
| Discord 服务器 | ⭐⭐⭐☆☆ | ⭐⭐⭐⭐☆ | Bot Token | ⭐⭐⭐⭐☆ |
| 浏览器自动化（知乎/B站） | ⭐⭐⭐⭐☆ | ⭐⭐⭐⭐⭐ | 账号登录 | ⭐⭐⭐☆☆ |
| Twitter/X API | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | API Key + OAuth | ⭐⭐☆☆☆ |

---

## 🥇 方案 1：kuroneko.chat 网站（立即可用）

### 优势
- ✅ 完全自主控制
- ✅ 无需任何 API 配置
- ✅ 可以立即实施
- ✅ SEO 友好
- ✅ 可嵌入任何页面

### 可实现功能
1. **自动发布章节公告** - 每次更新自动生成公告页面
2. **精彩片段页面** - 从章节中提取高光时刻
3. **「最新动态」板块** - 首页自动更新
4. **读者互动页面** - 投票、讨论、问答
5. **RSS 订阅** - 自动生成 RSS feed

### 实现步骤

#### 第 1 步：使用已创建的工具

```bash
# 工具位置: /root/.openclaw/workspace/auto-publish-website.js

# 发布章节更新公告
node auto-publish-website.js announcement "第 61 章已发布" "林深终于找到了..." update

# 发布精彩片段
node auto-publish-website.js highlight 10 "你想活下去吗？" "林深在深渊中的抉择"

# 更新首页公告列表
node auto-publish-website.js update-homepage
```

#### 第 2 步：集成到 cron 任务

修改 `novel-marketing-execute` 任务，添加网站发布逻辑：

```javascript
// 在 novel-marketing-execute 任务中添加
const { execSync } = require('child_process');

function publishToWebsite(type, data) {
  const script = '/root/.openclaw/workspace/auto-publish-website.js';
  
  if (type === 'announcement') {
    execSync(`node ${script} announcement "${data.title}" "${data.content}" ${data.subtype}`);
  } else if (type === 'highlight') {
    execSync(`node ${script} highlight ${data.chapter} "${data.quote}" "${data.context}"`);
  }
  
  console.log('✅ 已发布到 kuroneko.chat');
}
```

#### 第 3 步：添加 RSS 订阅

创建 `/var/www/novel/abyss/rss.xml`：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>深渊代行者</title>
    <link>https://kuroneko.chat/novel/abyss/</link>
    <description>科幻悬疑小说《深渊代行者》更新订阅</description>
    <language>zh-CN</language>
    
    <!-- 自动添加新条目 -->
    <item>
      <title>第 60 章已发布</title>
      <link>https://kuroneko.chat/novel/abyss/chapters/60.html</link>
      <description>林深终于...</description>
      <pubDate>2026-02-22</pubDate>
    </item>
  </channel>
</rss>
```

---

## 🥈 方案 2：飞书群/文档（已配置）

### 当前状态
- ✅ 飞书已配置（appId: cli_a91be84bd6b85cc5）
- ✅ 可以发送消息到群组
- ✅ 可以创建/编辑飞书文档

### 可实现功能
1. **自动发布到飞书群** - 每次更新自动通知
2. **飞书文档同步** - 章节内容自动同步到飞书知识库
3. **飞书卡片消息** - 精美的宣传卡片

### 实现步骤

#### 第 1 步：获取目标群组 ID

在飞书中创建「深渊代行者读者群」，获取 chat_id

#### 第 2 步：使用 message 工具

```javascript
// 在 novel-marketing-execute 任务中
await message({
  action: 'send',
  channel: 'feishu',
  target: 'chat:oc_xxxxxxxxxx',  // 替换为实际 chat_id
  message: `📖 **第 61 章已发布**

林深终于找到了...

🔗 https://kuroneko.chat/novel/abyss/chapters/61.html`,
  contentType: 'markdown'
});
```

#### 第 3 步：创建飞书文档

```javascript
// 使用 feishu_doc 工具
await feishu_doc({
  action: 'create',
  title: '深渊代行者 - 宣传文案库',
  folder_token: 'fldxxxxxxxxxx',
  content: `# 宣传文案库

## 最新文案
- [2026-02-22] 金句卡片...
`
});
```

---

## 🥉 方案 3：Telegram 频道（推荐）

### 优势
- ✅ OpenClaw 内置支持
- ✅ 适合推送通知
- ✅ 订阅者可以收到即时通知
- ✅ 支持 Markdown 格式

### 所需配置

#### 第 1 步：创建 Telegram Bot

1. 在 Telegram 中找到 @BotFather
2. 发送 `/newbot`
3. 按提示创建 bot，获得 token（格式：`1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`）

#### 第 2 步：创建频道

1. 创建一个公开频道（如 @AbyssAgentNovel）
2. 将 bot 添加为频道管理员

#### 第 3 步：配置 OpenClaw

编辑 `/root/.openclaw/openclaw.json`：

```json5
{
  channels: {
    telegram: {
      enabled: true,
      accounts: {
        main: {
          botToken: "1234567890:ABCdefGHIjklMNOpqrsTUVwxyz",
          username: "AbyssAgentBot"
        }
      }
    }
  }
}
```

#### 第 4 步：自动发布

```javascript
// 在 novel-marketing-execute 任务中
await message({
  action: 'send',
  channel: 'telegram',
  target: '@AbyssAgentNovel',  // 频道用户名
  message: `📖 *第 61 章已发布*

林深终于找到了...

[阅读完整章节](https://kuroneko.chat/novel/abyss/chapters/61.html)

#深渊代行者 #科幻小说`,
  parse_mode: 'Markdown'
});
```

---

## 🏅 方案 4：Discord 服务器

### 优势
- ✅ OpenClaw 内置支持
- ✅ 适合社区建设
- ✅ 支持 Embed 富文本
- ✅ 可以创建多个频道（公告、讨论、投票）

### 所需配置

#### 第 1 步：创建 Discord Bot

1. 访问 https://discord.com/developers/applications
2. 创建新应用，添加 Bot
3. 获取 Bot Token
4. 开通必要权限（Send Messages, Embed Links）
5. 生成 OAuth2 邀请链接，将 bot 邀请到服务器

#### 第 2 步：配置 OpenClaw

```json5
{
  channels: {
    discord: {
      enabled: true,
      accounts: {
        main: {
          botToken: "MTk4NjIyNDgzNDcNTY2ODQ0.GlKqPa.KtZvR4VgTfN6aOkJ0C2g5wVzQx8Q",
          clientId: "1986224834566789"
        }
      }
    }
  }
}
```

#### 第 3 步：自动发布

```javascript
// 在 novel-marketing-execute 任务中
await message({
  action: 'send',
  channel: 'discord',
  target: '123456789012345678',  // 频道 ID
  embeds: [{
    title: '📖 第 61 章已发布',
    description: '林深终于找到了...',
    url: 'https://kuroneko.chat/novel/abyss/chapters/61.html',
    color: 0xFF4500,
    timestamp: new Date().toISOString(),
    footer: {
      text: '深渊代行者',
      icon_url: 'https://kuroneko.chat/novel/abyss/static/icon.png'
    }
  }]
});
```

---

## 🎨 方案 5：浏览器自动化（知乎/B站）

### 优势
- ✅ 可以发布到任何网站
- ✅ 模拟人类操作，不易被封
- ✅ 可以处理验证码、登录等

### 劣势
- ❌ 需要账号登录
- ❌ 可能遇到反爬虫
- ❌ 维护成本较高

### 实现步骤（知乎示例）

#### 第 1 步：使用 browser 工具

```javascript
// 在 novel-marketing-execute 任务中

// 1. 启动浏览器
await browser({
  action: 'start',
  profile: 'openclaw'
});

// 2. 打开知乎
await browser({
  action: 'open',
  targetUrl: 'https://www.zhihu.com',
  profile: 'openclaw'
});

// 3. 等待用户登录（或使用保存的 cookies）
// 可以先手动登录一次，保存 cookies

// 4. 发布文章
await browser({
  action: 'navigate',
  targetUrl: 'https://zhuanlan.zhihu.com/write'
});

// 5. 填写标题和内容
await browser({
  action: 'act',
  request: {
    kind: 'type',
    ref: 'input[placeholder*="标题"]',
    text: '为什么要写一个「被迫成为恶魔」的主角？'
  }
});

// 6. 填写正文（需要找到编辑器）
await browser({
  action: 'act',
  request: {
    kind: 'type',
    ref: '.public-DraftEditor-content',
    text: articleContent,
    slowly: true  // 模拟人类输入
  }
});

// 7. 点击发布按钮
await browser({
  action: 'act',
  request: {
    kind: 'click',
    ref: 'button:has-text("发布")'
  }
});
```

### 注意事项
- 需要先手动登录一次，保存 cookies
- 建议添加随机延迟，模拟人类操作
- 可能需要处理验证码（使用 2captcha 等服务）
- 不同网站的选择器需要单独适配

---

## 🚀 推荐实施方案（分阶段）

### 第 1 阶段（立即实施）
- ✅ **kuroneko.chat 网站** - 使用已创建的 `auto-publish-website.js`
- ✅ **飞书群** - 已配置，可以直接使用

**预期效果：**
- 每次更新自动生成公告页面
- 自动发送通知到飞书群
- SEO 持续优化

### 第 2 阶段（1 周内）
- ⭐ **Telegram 频道** - 配置 Bot（10 分钟）
- ⭐ **RSS 订阅** - 添加 RSS feed

**预期效果：**
- 读者可以订阅 Telegram 频道
- RSS 订阅者自动收到更新

### 第 3 阶段（2-4 周内）
- 🎯 **Discord 服务器** - 建立社区（20 分钟）
- 🎯 **浏览器自动化** - 发布到知乎/B站（需要测试）

**预期效果：**
- 建立读者社区
- 扩大到知乎、B站等平台

---

## 📝 具体执行清单

### 立即可以做的
1. ✅ 测试 `auto-publish-website.js` 工具
2. ✅ 修改 `novel-marketing-execute` 任务，添加网站发布逻辑
3. ✅ 在飞书群测试消息发送

### 本周可以做的
4. ⭐ 创建 Telegram Bot，配置 OpenClaw
5. ⭐ 创建 Telegram 频道，测试自动发布
6. ⭐ 添加 RSS feed 生成

### 未来可以做的
7. 🎯 创建 Discord 服务器
8. 🎯 配置 Discord Bot
9. 🎯 测试浏览器自动化发布到知乎
10. 🎯 测试浏览器自动化发布到 B站

---

## 🔧 技术细节

### Cron 任务配置示例

修改 `novel-marketing-execute` 任务：

```javascript
// /root/.openclaw/workspace/evolver/novel-marketing-execute.js

const { execSync } = require('child_process');

async function executeMarketing() {
  // 1. 生成宣传文案（已有逻辑）
  const content = await generateMarketingContent();
  
  // 2. 发布到网站（新增）
  execSync(`node /root/.openclaw/workspace/auto-publish-website.js announcement "${content.title}" "${content.summary}" update`);
  
  // 3. 发布到飞书（新增）
  await message({
    action: 'send',
    channel: 'feishu',
    target: 'chat:oc_xxxxxxxxxx',
    message: content.fullText
  });
  
  // 4. 发布到 Telegram（配置后启用）
  // await message({
  //   action: 'send',
  //   channel: 'telegram',
  //   target: '@AbyssAgentNovel',
  //   message: content.telegramFormat
  // });
  
  console.log('✅ 自动发布完成');
}

module.exports = { executeMarketing };
```

---

## 💡 最佳实践

1. **不要一次性发布到所有平台** - 错峰发布，避免触发反垃圾机制
2. **内容要差异化** - 不同平台使用不同的文案风格
3. **添加追踪参数** - 使用 UTM 参数追踪流量来源
4. **监控效果** - 记录每个平台的点击量、互动数据
5. **保持人性化** - 避免过于机械的发布模式

---

## 🎯 总结

**最简单且立即可用的方案：**
1. ✅ kuroneko.chat 网站（已实现工具）
2. ✅ 飞书群（已配置）

**最推荐的组合：**
- kuroneko.chat（官网） + Telegram（推送） + Discord（社区）

**技术要求最低：**
- kuroneko.chat + 飞书 = 无需任何新配置

**覆盖面最广：**
- kuroneko.chat + Telegram + Discord + 知乎 + B站

---

**现在就可以开始使用 `auto-publish-website.js` 工具，让小说宣传真正自动化起来！**
