# Novel Marketing Skill - 真正的自动发布版本

## 🎯 目标

**彻底自动化**小说推广，不只是准备材料，而是真正发布到网络。

---

## 📋 任务定义

### Cron 配置
- **任务名称**: `novel-marketing-execute`
- **执行频率**: 每 30 分钟
- **执行模式**: isolated（独立会话）
- **任务 ID**: `56cc1b72-3814-4b4c-b0cd-da30862e83d4`

### 执行流程

```javascript
// ===== 第 1 步：读取知识库 =====
const memoryFile = '/root/.openclaw/workspace/MEMORY.md';
const memory = fs.readFileSync(memoryFile, 'utf8');

// 提取上次执行时间和成功模式
const lastExecution = extractLastExecution(memory);
const successPatterns = extractSuccessPatterns(memory);

// ===== 第 2 步：选择执行策略 =====
// 基于：1) 上次执行时间（避免重复）
//       2) 成功模式（优先使用有效策略）
//       3) 随机性（保持新鲜感）

const strategies = [
  'website_announcement',      // 网站公告
  'website_highlight',         // 精彩片段
  'feishu_notification',       // 飞书通知
  // 'telegram_broadcast',     // Telegram 推送（需配置）
  // 'discord_embed',          // Discord Embed（需配置）
];

const selectedStrategy = selectStrategy(strategies, lastExecution, successPatterns);

// ===== 第 3 步：生成内容 =====
const content = await generateContent(selectedStrategy);

// ===== 第 4 步：真正发布！=====
switch (selectedStrategy) {
  case 'website_announcement':
    await publishToWebsite('announcement', content);
    break;
  case 'website_highlight':
    await publishToWebsite('highlight', content);
    break;
  case 'feishu_notification':
    await publishToFeishu(content);
    break;
  case 'telegram_broadcast':
    await publishToTelegram(content);
    break;
}

// ===== 第 5 步：记录执行 =====
updateExecutionLog(selectedStrategy, content, result);
```

---

## 🔧 发布函数实现

### 1. 网站发布（立即可用）

```javascript
async function publishToWebsite(type, data) {
  const script = '/root/.openclaw/workspace/auto-publish-website.js';
  
  if (type === 'announcement') {
    // 发布章节更新公告
    execSync(`node ${script} announcement "${data.title}" "${data.content}" ${data.subtype}`);
    console.log(`✅ 已发布网站公告: ${data.title}`);
    
    // 返回公告 URL
    return `https://kuroneko.chat/novel/abyss/announcements/`;
    
  } else if (type === 'highlight') {
    // 发布精彩片段
    execSync(`node ${script} highlight ${data.chapter} "${data.quote}" "${data.context}"`);
    console.log(`✅ 已发布精彩片段: 第${data.chapter}章`);
    
    return `https://kuroneko.chat/novel/abyss/highlights/`;
  }
}
```

### 2. 飞书发布（已配置）

```javascript
async function publishToFeishu(data) {
  // 使用 message 工具发送到飞书群
  await message({
    action: 'send',
    channel: 'feishu',
    target: 'chat:oc_xxxxxxxxxx',  // 需要替换为实际的 chat_id
    message: data.content,
    contentType: 'markdown'
  });
  
  console.log(`✅ 已发布到飞书群`);
}
```

### 3. Telegram 发布（需配置）

```javascript
async function publishToTelegram(data) {
  await message({
    action: 'send',
    channel: 'telegram',
    target: '@AbyssAgentNovel',  // 频道用户名
    message: data.content,
    parse_mode: 'Markdown'
  });
  
  console.log(`✅ 已发布到 Telegram`);
}
```

### 4. Discord 发布（需配置）

```javascript
async function publishToDiscord(data) {
  await message({
    action: 'send',
    channel: 'discord',
    target: '123456789012345678',  // 频道 ID
    embeds: [{
      title: data.title,
      description: data.description,
      url: data.url,
      color: 0xFF4500,
      timestamp: new Date().toISOString()
    }]
  });
  
  console.log(`✅ 已发布到 Discord`);
}
```

---

## 📝 内容生成示例

### 示例 1：章节更新公告

```javascript
{
  type: 'announcement',
  title: '第 61 章已发布',
  content: `
    <p>林深终于找到了...</p>
    <p>精彩片段：</p>
    <blockquote>"你想活下去吗？"</blockquote>
    <p>阅读完整章节：<a href="/novel/abyss/chapters/61.html">点击这里</a></p>
  `,
  subtype: 'update'
}
```

### 示例 2：精彩片段

```javascript
{
  type: 'highlight',
  chapter: 10,
  quote: '你想活下去吗？',
  context: '林深在深渊中的抉择，魔王尼德霍格的声音在耳边响起...'
}
```

### 示例 3：飞书通知

```javascript
{
  content: `
📖 **第 61 章已发布**

林深终于找到了...

"你想活下去吗？"
黑暗中，魔王的声音在耳边响起。

🔗 [阅读完整章节](https://kuroneko.chat/novel/abyss/chapters/61.html)

#深渊代行者 #科幻小说
  `
}
```

---

## 🔄 执行策略选择逻辑

```javascript
function selectStrategy(strategies, lastExecution, successPatterns) {
  // 1. 过滤掉最近执行过的策略（避免重复）
  const availableStrategies = strategies.filter(s => {
    const lastTime = lastExecution[s];
    if (!lastTime) return true;
    
    const hoursSinceLastExecution = (Date.now() - lastTime) / (1000 * 60 * 60);
    return hoursSinceLastExecution > 2;  // 至少间隔 2 小时
  });
  
  // 2. 优先选择成功模式中的策略
  const weightedStrategies = availableStrategies.map(s => ({
    strategy: s,
    weight: successPatterns[s] || 1  // 默认权重 1
  }));
  
  // 3. 加权随机选择
  const selected = weightedRandom(weightedStrategies);
  
  return selected;
}
```

---

## 📊 执行日志记录

### MEMORY.md 执行记录格式

```markdown
#### 执行报告 - 2026-02-23 00:30

##### 本次策略
1. **网站公告发布**：自动生成第 61 章更新公告
2. **飞书群通知**：发送宣传文案到读者群

##### 执行内容
- **网站**: https://kuroneko.chat/novel/abyss/announcements/1771776850434.html
- **飞书**: 发送到群组 oc_xxxxxxxxxx

##### 效果数据
- 网站访问: 待统计
- 飞书互动: 3 个👍反应

##### 下次优化建议
1. 添加 UTM 参数追踪流量
2. A/B 测试不同文案风格
```

---

## ✅ 验证清单

### 立即可用
- [x] kuroneko.chat 网站发布工具（`auto-publish-website.js`）
- [x] 飞书消息发送（message 工具）
- [x] 执行日志记录（MEMORY.md）

### 需要配置（可选）
- [ ] Telegram Bot Token（10 分钟）
- [ ] Telegram 频道创建（5 分钟）
- [ ] Discord Bot Token（10 分钟）
- [ ] Discord 服务器创建（5 分钟）

### 高级功能（未来）
- [ ] 浏览器自动化发布到知乎
- [ ] 浏览器自动化发布到 B站
- [ ] Twitter/X API 集成
- [ ] 微博 API 集成

---

## 🚀 快速开始

### 1. 立即测试

```bash
# 测试网站公告发布
node /root/.openclaw/workspace/auto-publish-website.js announcement "第 61 章已发布" "<p>内容摘要...</p>" update

# 测试精彩片段发布
node /root/.openclaw/workspace/auto-publish-website.js highlight 10 "你想活下去吗？" "林深在深渊中的抉择"

# 访问测试页面
curl https://kuroneko.chat/novel/abyss/announcements/
```

### 2. 获取飞书群 ID

1. 在飞书中创建「深渊代行者读者群」
2. 添加 OpenClaw 机器人
3. 获取群组 ID（格式：`oc_xxxxxxxxxxxxxxxx`）
4. 更新 SKILL.md 中的 `chat:oc_xxxxxxxxxx`

### 3. 配置 Telegram（可选）

```bash
# 1. 创建 Bot
# 在 Telegram 中找 @BotFather，发送 /newbot

# 2. 获取 Bot Token
# 格式：1234567890:ABCdefGHIjklMNOpqrsTUVwxyz

# 3. 创建频道
# 创建公开频道，如 @AbyssAgentNovel

# 4. 添加 Bot 为管理员

# 5. 配置 OpenClaw
openclaw configure --section channels
# 选择 telegram，输入 Bot Token
```

### 4. 配置 Discord（可选）

```bash
# 1. 创建 Discord Bot
# 访问 https://discord.com/developers/applications
# 创建应用 → Bot → 获取 Token

# 2. 创建服务器和频道
# 创建「深渊代行者」服务器
# 创建「公告」频道

# 3. 邀请 Bot
# 生成 OAuth2 链接，邀请 Bot 加入服务器

# 4. 获取频道 ID
# 开启开发者模式 → 右键频道 → 复制 ID

# 5. 配置 OpenClaw
openclaw configure --section channels
# 选择 discord，输入 Bot Token
```

---

## 📈 效果监控

### 自动追踪
- 发布次数统计
- 平台覆盖数量
- 执行时间记录

### 需要手动添加
- 网站访问统计（Google Analytics）
- 飞书消息互动数据
- Telegram 频道订阅数
- Discord 服务器成员数

### 优化指标
- 点击率（CTR）
- 互动率（点赞、评论、分享）
- 转化率（订阅、购买）
- 留存率（回头客）

---

## 🎯 成功标准

### 第 1 个月
- ✅ 网站公告系统正常运行
- ✅ 飞书群定期推送
- ⭐ Telegram 频道 100+ 订阅者
- ⭐ Discord 服务器 50+ 成员

### 第 3 个月
- 🎯 网站月访问量 1000+
- 🎯 Telegram 频道 500+ 订阅者
- 🎯 Discord 服务器 200+ 成员
- 🎯 知乎专栏 100+ 关注者

### 第 6 个月
- 🚀 网站月访问量 5000+
- 🚀 多平台联动效应
- 🚀 形成稳定的读者社区

---

## 🔄 持续优化

### 每周回顾
1. 分析各平台数据
2. 调整策略权重
3. 更新成功模式库

### 每月迭代
1. A/B 测试新策略
2. 引入新平台
3. 优化内容质量

### 每季度规划
1. 设定增长目标
2. 评估投入产出比
3. 调整资源分配

---

**现在就开始使用这个真正自动化的推广系统吧！** 🚀
