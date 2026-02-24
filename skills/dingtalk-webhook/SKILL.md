# 钉钉 Webhook 机器人

通过钉钉群 Webhook 发送消息通知。

## 使用方法

1. 在钉钉群设置中创建自定义机器人
2. 获取 Webhook URL 和签名密钥（可选）
3. 配置到 TOOLS.md
4. 使用 message 工具发送消息

## 配置

在 TOOLS.md 中添加：

```yaml
dingtalk:
  webhooks:
    default: https://oapi.dingtalk.com/robot/send?access_token=YOUR_TOKEN
    alert: https://oapi.dingtalk.com/robot/send?access_token=ALERT_TOKEN
  secrets:
    default: SECxxx  # 加签密钥（可选）
```

## 示例

### 发送文本消息

```
发送钉钉消息: 这是一条测试消息
```

### 发送 Markdown 消息

```
发送钉钉 Markdown:
# 告警通知
- 时间: 2026-02-24 21:00
- 级别: CRITICAL
```

### @特定用户

```
发送钉钉消息 @张三: 请查看告警
```

## 功能

- ✅ 发送文本消息
- ✅ 发送 Markdown 消息
- ✅ @特定用户
- ✅ @所有人
- ✅ 加签验证
- ❌ 接收消息（需要企业内部应用）

## 注意事项

1. 每个机器人每分钟最多发送 20 条消息
2. 建议使用加签提高安全性
3. Webhook 机器人只能发送，不能接收
