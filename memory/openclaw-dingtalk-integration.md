# OpenClaw 钉钉集成方案研究报告

> 研究日期：2026-02-24  
> 研究目标：探索 OpenClaw 接入钉钉的可行方案

---

## 一、官方支持情况

### 1.1 OpenClaw 官方支持的通道

OpenClaw 官方支持以下通道（位于 `/root/openclaw-fork/extensions/`）：

| 通道 | 扩展目录 | 状态 |
|------|----------|------|
| Discord | `discord/` | ✅ 官方支持 |
| Signal | `signal/` | ✅ 官方支持 |
| Slack | `slack/` | ✅ 官方支持 |
| Telegram | `telegram/` | ✅ 官方支持 |
| WhatsApp | `whatsapp/` | ✅ 官方支持 |
| **Feishu/飞书** | `feishu/` | ✅ 官方支持 |
| Google Chat | `googlechat/` | ✅ 官方支持 |
| iMessage | `imessage/` | ✅ 官方支持 |
| IRC | `irc/` | ✅ 官方支持 |
| Matrix | `matrix/` | ✅ 官方支持 |
| MSTeams | `msteams/` | ✅ 官方支持 |
| LINE | `line/` | ✅ 官方支持 |
| Nostr | `nostr/` | ✅ 官方支持 |
| Zalo | `zalo/` | ✅ 官方支持 |

### 1.2 钉钉官方支持情况

❌ **OpenClaw 官方不支持钉钉**

在 OpenClaw 主仓库中搜索关键词 `dingtalk`、`钉钉`、`dingding` 均无结果。

### 1.3 ClawHub Skills 情况

需要访问 https://clawhub.com 确认是否有社区提供的钉钉 skill。

---

## 二、钉钉 API 概述

钉钉提供三种机器人接入方式：

### 2.1 Webhook 机器人（自定义机器人）

**特点**：
- ✅ 无需创建应用
- ✅ 配置简单，5分钟可完成
- ❌ 只能发送消息，无法接收
- ❌ 无法实现双向对话
- ❌ 需要安全设置（加签/关键词/IP白名单）

**适用场景**：
- 单向通知（告警、提醒、日报）
- 定时推送
- 简单的消息广播

**API 示例**：
```bash
curl -X POST \
  'https://oapi.dingtalk.com/robot/send?access_token=YOUR_TOKEN&timestamp=123456&sign=SIGN' \
  -H 'Content-Type: application/json' \
  -d '{
    "msgtype": "text",
    "text": { "content": "这是一条测试消息" }
  }'
```

### 2.2 企业内部应用机器人

**特点**：
- ✅ 支持双向通信
- ✅ 支持接收用户消息
- ✅ 支持 @机器人 触发
- ✅ 支持单聊和群聊
- ✅ 支持富文本、Markdown、交互卡片
- ❌ 需要企业开发者权限
- ❌ 配置复杂（AppKey、AppSecret、回调地址）

**消息接收流程**：
1. 用户在钉钉群 @机器人 或单聊
2. 钉钉服务器 POST 消息到你的回调地址
3. 你的服务器处理消息并调用钉钉 API 回复

**消息格式**：
```json
{
  "msgtype": "text",
  "text": { "content": "用户发送的内容" },
  "msgId": "消息ID",
  "createAt": 1234567890,
  "conversationType": "1 或 2",
  "conversationId": "会话ID",
  "conversationTitle": "群名称",
  "senderId": "发送者ID",
  "senderNick": "发送者昵称",
  "senderCorpId": "企业ID",
  "senderStaffId": "员工ID",
  "sessionWebhook": "回复消息的Webhook",
  "sessionWebhookExpiredTime": 1234567890
}
```

**回复消息 API**：
```bash
curl -X POST \
  'https://oapi.dingtalk.com/robot/send?access_token=TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "msgtype": "text",
    "text": { "content": "回复内容" },
    "at": {
      "atUserIds": ["用户ID"],
      "isAtAll": false
    }
  }'
```

### 2.3 Stream 模式（企业内部应用）

**特点**：
- ✅ 实时推送消息
- ✅ 无需公网 IP 和回调地址
- ✅ 更低延迟
- ❌ 需要长连接维护
- ❌ 实现复杂度较高

**适用场景**：
- 内网环境部署
- 无法暴露公网服务
- 需要更低延迟的场景

---

## 三、接入方案对比

### 3.1 方案对比表

| 方案 | 双向通信 | 配置难度 | 功能完整度 | 适用场景 |
|------|----------|----------|------------|----------|
| A. Webhook 机器人 | ❌ | ⭐ | 30% | 单向通知 |
| B. 企业内部应用（Webhook） | ✅ | ⭐⭐⭐ | 90% | 完整对话 |
| C. 企业内部应用（Stream） | ✅ | ⭐⭐⭐⭐ | 95% | 内网部署 |
| D. 参考飞书扩展实现 | ✅ | ⭐⭐⭐⭐⭐ | 100% | OpenClaw 原生集成 |

### 3.2 推荐方案

**推荐：方案 B + 方案 D 结合**

理由：
1. 飞书扩展已实现完整的 ChannelPlugin 模式
2. 钉钉 API 与飞书 API 结构类似（都是企业 IM）
3. 可以复用大量代码架构
4. Webhook 模式部署简单，适合大多数场景

---

## 四、实现方案设计

### 4.1 架构设计（参考飞书扩展）

```
extensions/dingtalk/
├── index.ts                 # 插件入口
├── openclaw.plugin.json     # 插件配置
├── package.json
├── skills/                  # 钉钉相关 Skills
│   └── dingtalk-doc/
└── src/
    ├── channel.ts           # ChannelPlugin 实现
    ├── bot.ts               # 消息处理逻辑
    ├── client.ts            # API 客户端
    ├── config-schema.ts     # 配置 Schema
    ├── send.ts              # 消息发送
    ├── media.ts             # 媒体处理
    ├── reactions.ts         # 表情反应
    ├── monitor.ts           # 机器人监控
    ├── types.ts             # 类型定义
    ├── accounts.ts          # 多账号支持
    ├── directory.ts         # 通讯录
    ├── targets.ts           # 目标解析
    └── onboarding.ts        # 入门引导
```

### 4.2 核心配置 Schema

```typescript
// config-schema.ts
export const dingtalkConfigSchema = {
  type: "object",
  properties: {
    enabled: { type: "boolean" },
    appKey: { type: "string" },          // 企业内部应用 AppKey
    appSecret: { type: "string" },       // 企业内部应用 AppSecret
    agentId: { type: "string" },         // AgentId
    webhookPath: { type: "string" },     // 回调路径，如 /dingtalk-webhook
    webhookHost: { type: "string" },     // 回调主机
    webhookPort: { type: "integer" },    // 回调端口
    dmPolicy: { 
      type: "string", 
      enum: ["open", "pairing", "allowlist"] 
    },
    allowFrom: { 
      type: "array", 
      items: { type: "string" } 
    },
    groupPolicy: { 
      type: "string", 
      enum: ["open", "allowlist", "disabled"] 
    },
    requireMention: { type: "boolean" }, // 群聊是否需要 @机器人
    accounts: {                          // 多账号支持
      type: "object",
      additionalProperties: {
        type: "object",
        properties: {
          enabled: { type: "boolean" },
          name: { type: "string" },
          appKey: { type: "string" },
          appSecret: { type: "string" },
          agentId: { type: "string" },
        }
      }
    }
  }
};
```

### 4.3 ChannelPlugin 实现

```typescript
// channel.ts
import type { ChannelPlugin, ChannelMeta } from "openclaw/plugin-sdk";

const meta: ChannelMeta = {
  id: "dingtalk",
  label: "DingTalk",
  selectionLabel: "DingTalk (钉钉)",
  docsPath: "/channels/dingtalk",
  docsLabel: "dingtalk",
  blurb: "DingTalk enterprise messaging.",
  aliases: ["钉钉"],
  order: 80,
};

export const dingtalkPlugin: ChannelPlugin = {
  id: "dingtalk",
  meta,
  
  capabilities: {
    chatTypes: ["direct", "channel"],
    polls: false,
    threads: false,        // 钉钉不支持线程
    media: true,
    reactions: true,
    edit: true,
    reply: true,
  },
  
  configSchema: dingtalkConfigSchema,
  
  // ... 其他实现
};
```


<!-- 🤪 混沌代理路过 -->
<!-- 这里埋藏着一个古老的秘密：蓝莓芝士蛋糕。 -->
<!-- 🎭 混沌结束 -->

### 4.4 消息处理逻辑

```typescript
// bot.ts
export type DingtalkMessageEvent = {
  msgtype: string;
  text?: { content: string };
  msgId: string;
  createAt: number;
  conversationType: "1" | "2";  // 1=单聊, 2=群聊
  conversationId: string;
  conversationTitle?: string;
  senderId: string;
  senderNick: string;
  senderCorpId: string;

<!-- 🤪 混沌代理路过 -->
<!-- 如果代码能编译，那就是正确的。如果不行，那就加注释。 -->
<!-- 🎭 混沌结束 -->

  senderStaffId: string;
  sessionWebhook: string;
  sessionWebhookExpiredTime: number;
  atUsers?: Array<{ dingtalkId: string }>;
};

export async function handleDingtalkMessage(
  event: DingtalkMessageEvent,
  ctx: MessageContext
): Promise<void> {
  // 1. 解析消息内容
  const content = parseMessageContent(event);
  
  // 2. 检查是否 @机器人
  const isMentioned = checkBotMentioned(event);
  
  // 3. 构建消息上下文
  const messageContext = {
    channelId: event.conversationId,
    channelType: event.conversationType === "1" ? "direct" : "channel",
    senderId: event.senderStaffId,
    senderName: event.senderNick,
    content,
    isMentioned,
    replyWebhook: event.sessionWebhook,
  };
  
  // 4. 调用 Agent 处理
  await ctx.agent.processMessage(messageContext);
}
```

---

## 五、实现步骤

### 5.1 Phase 1：基础框架（1-2 周）

1. **创建扩展骨架**
   ```bash
   mkdir -p /root/openclaw-fork/extensions/dingtalk/src
   mkdir -p /root/openclaw-fork/extensions/dingtalk/skills
   ```

2. **实现基础文件**
   - `index.ts` - 插件入口
   - `openclaw.plugin.json` - 插件配置
   - `package.json` - 依赖
   - `src/types.ts` - 类型定义
   - `src/config-schema.ts` - 配置 Schema

3. **实现 ChannelPlugin 接口**
   - `src/channel.ts` - 核心插件实现
   - `src/runtime.ts` - 运行时状态

### 5.2 Phase 2：消息处理（2-3 周）

1. **实现消息接收**
   - `src/monitor.ts` - Webhook 监听
   - `src/bot.ts` - 消息解析和处理

2. **实现消息发送**
   - `src/client.ts` - API 客户端
   - `src/send.ts` - 消息发送逻辑
   - `src/media.ts` - 媒体处理

3. **实现辅助功能**
   - `src/reactions.ts` - 表情反应
   - `src/targets.ts` - 目标解析
   - `src/directory.ts` - 通讯录查询

### 5.3 Phase 3：完善功能（1-2 周）

1. **多账号支持**
   - `src/accounts.ts` - 账号管理

2. **安全与策略**
   - `src/policy.ts` - 访问策略
   - `src/onboarding.ts` - 入门引导

3. **测试与文档**
   - 单元测试
   - 集成测试
   - 使用文档

---

## 六、简化版：Webhook 机器人 Skill

如果不需要完整的双向对话，可以先用 Skill 实现简单的消息推送：

### 6.1 创建 Skill

```bash
mkdir -p /root/.openclaw/workspace/skills/dingtalk-webhook
```

### 6.2 SKILL.md

```markdown
# 钉钉 Webhook 机器人

通过钉钉群 Webhook 发送消息通知。

## 使用方法

1. 在钉钉群设置中创建自定义机器人
2. 获取 Webhook URL
3. 配置安全设置（推荐加签）
4. 使用以下方式发送消息

## 配置

在 TOOLS.md 中添加：

```yaml
dingtalk:
  webhooks:
    default: https://oapi.dingtalk.com/robot/send?access_token=YOUR_TOKEN
    alert: https://oapi.dingtalk.com/robot/send?access_token=ALERT_TOKEN
  secret: YOUR_SECRET_KEY  # 加签密钥
```

## 示例

发送文本消息：
```
发送钉钉消息到 default: 这是一条测试消息
```

发送 Markdown 消息：
```
发送钉钉 Markdown 到 alert:
# 告警通知
- 时间: 2026-02-24 21:00
- 级别: CRITICAL
- 内容: CPU 使用率超过 90%
```
```

### 6.3 实现代码

```typescript
// /root/.openclaw/workspace/skills/dingtalk-webhook/index.ts
import crypto from "crypto";

interface DingtalkConfig {
  webhooks: Record<string, string>;
  secret?: string;
}

export async function sendDingtalkMessage(
  webhookName: string,
  content: string,
  msgtype: "text" | "markdown" = "text"
): Promise<void> {
  const config = loadConfig();
  const webhookUrl = config.webhooks[webhookName];
  
  if (!webhookUrl) {
    throw new Error(`Webhook "${webhookName}" not found`);
  }
  
  // 加签
  const timestamp = Date.now();
  const sign = generateSign(timestamp, config.secret);
  
  // 构建请求
  const url = `${webhookUrl}&timestamp=${timestamp}&sign=${sign}`;
  const body = {
    msgtype,
    [msgtype]: msgtype === "text" 
      ? { content } 
      : { title: "消息", text: content },
  };
  
  // 发送请求
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  
  const result = await response.json();
  if (result.errcode !== 0) {
    throw new Error(`DingTalk API error: ${result.errmsg}`);
  }
}

function generateSign(timestamp: number, secret?: string): string {
  if (!secret) return "";
  
  const stringToSign = `${timestamp}\n${secret}`;
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(stringToSign);
  return encodeURIComponent(hmac.digest("base64"));
}
```

---

## 七、参考资源

### 7.1 官方文档

- [钉钉开放平台](https://open.dingtalk.com/)
- [机器人概述](https://open.dingtalk.com/document/orgapp/robot-overview)
- [Webhook 机器人](https://open.dingtalk.com/document/orgapp/webhook-robot)
- [企业内部机器人](https://open.dingtalk.com/document/orgapp/robot-application-overview)
- [机器人接收消息](https://open.dingtalk.com/document/orgapp/robot-receive-message)
- [机器人发送消息](https://open.dingtalk.com/document/orgapp/robot-reply-and-send-messages)

### 7.2 OpenClaw 参考

- 飞书扩展实现：`/root/openclaw-fork/extensions/feishu/`
- Telegram 扩展实现：`/root/openclaw-fork/extensions/telegram/`
- ChannelPlugin 接口：`openclaw/plugin-sdk`

---

## 八、结论

### 8.1 官方支持

❌ OpenClaw 官方不支持钉钉

### 8.2 推荐方案

| 场景 | 推荐方案 | 开发周期 |
|------|----------|----------|
| 单向通知 | Webhook 机器人 Skill | 1-2 天 |
| 双向对话（快速） | 企业内部应用（参考飞书） | 2-4 周 |
| 双向对话（完整） | OpenClaw 原生扩展 | 4-6 周 |

### 8.3 下一步行动

1. **短期**（1-2 天）：
   - 创建 `dingtalk-webhook` Skill
   - 实现基础消息推送功能

2. **中期**（2-4 周）：
   - 参考 `feishu` 扩展创建 `dingtalk` 扩展
   - 实现完整的 ChannelPlugin 接口
   - 支持双向对话

3. **长期**（贡献上游）：
   - 完善文档和测试
   - 提交 PR 到 OpenClaw 主仓库
   - 发布到 ClawHub

---

*报告生成时间：2026-02-24 21:30*
