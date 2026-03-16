# Feishu 通知配置助手 Skill

**版本**: 1.0
**创建时间**: 2026-03-14
**创建方式**: evolver-self-evolution (Round 323)
**目的**: 帮助配置 Feishu 通知，解决配置缺失问题

---

## 🎯 核心问题

### PAT-112: Feishu 配置缺失导致任务失败（中优先级）

**症状**:
```
错误: feishu account "default" not configured
影响任务: nginx-security-daily, 安全告警
持续时间: > 24 小时
出现次数: 14 次
```

**影响**:
- 🟡 **安全日志无法推送**: Nginx 安全检查结果无法通知
- 🟡 **任务状态误报**: 任务显示 error 但实际可能正常执行
- 🟡 **告警无法送达**: 安全威胁无法及时通知
- 🟢 **不影响核心功能**: 安全检查本身可能正常执行

**根本原因**:
1. Feishu webhook URL 未配置
2. 缺少配置文件或配置文件为空
3. 任务依赖 Feishu 推送，但未检查配置
4. 缺少配置指南

---

## 📋 配置步骤

### 1. 获取 Feishu Webhook URL

**步骤**:
1. 打开 Feishu（飞书）应用
2. 进入需要接收通知的群组
3. 点击群组设置 → 群机器人 → 添加机器人
4. 选择"自定义机器人"
5. 设置机器人名称（如：OpenClaw 安全告警）
6. 复制生成的 Webhook URL

**示例 URL**:
```
https://open.feishu.cn/open-apis/bot/v2/hook/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

### 2. 配置 Webhook URL

**方法 1: 直接编辑配置文件**

```bash
# 编辑配置文件
nano /root/.openclaw/workspace/config/feishu-webhook.txt

# 替换 YOUR_WEBHOOK_URL_HERE 为实际的 Webhook URL
```

**方法 2: 使用命令行**

```bash
# 设置 Webhook URL
echo "https://open.feishu.cn/open-apis/bot/v2/hook/YOUR-ACTUAL-WEBHOOK" > /root/.openclaw/workspace/config/feishu-webhook.txt
```

### 3. 验证配置

```bash
# 测试 Feishu 通知
bash /root/.openclaw/workspace/evolver/fixes/test-feishu-notification.sh
```

---

## 🔧 使用方法

### 1. 检查配置状态

```bash
# 检查 Feishu 配置
bash /root/.openclaw/workspace/evolver/fixes/feishu-config-helper.sh --check
```

### 2. 配置 Webhook

```bash
# 交互式配置
bash /root/.openclaw/workspace/evolver/fixes/feishu-config-helper.sh --config

# 或直接设置
bash /root/.openclaw/workspace/evolver/fixes/feishu-config-helper.sh --set-webhook "YOUR_WEBHOOK_URL"
```

### 3. 测试通知

```bash
# 发送测试消息
bash /root/.openclaw/workspace/evolver/fixes/feishu-config-helper.sh --test
```

---

## 📊 预期效果

| 指标 | 当前值 | 目标值 | 改进幅度 |
|------|--------|--------|---------|
| 配置状态 | 未配置 | 已配置 | +100% |
| 任务成功率 | error | success | +100% |
| 告警送达率 | 0% | 100% | +100% |

---

## 🚨 配置最佳实践

### 1. Webhook URL 安全

- ✅ **不要提交到代码仓库**: 将 webhook URL 添加到 .gitignore
- ✅ **限制权限**: 确保配置文件只有 root 可读
- ✅ **定期轮换**: 建议每 3 个月更换一次 webhook

### 2. 通知策略

**通知类型**:
- 🔴 **紧急告警**: 安全威胁、系统故障
- 🟡 **重要通知**: 任务失败、配置错误
- 🟢 **日常报告**: 每日总结、统计信息

**通知频率**:
- 紧急告警: 立即发送
- 重要通知: 15 分钟内发送
- 日常报告: 每天 8:00 发送

### 3. 降级机制

**当 Feishu 不可用时**:
1. 记录到本地日志
2. 尝试备用通知渠道（Email、Slack）
3. 不影响核心功能执行

---

## 📝 维护日志

### 2026-03-14 (创建)
- 检测到 Feishu 配置缺失问题
- 创建 Feishu 通知配置助手 Skill
- 创建配置文件模板
- 提供配置步骤指南

---

## 🔄 相关 Patterns

- **PAT-112**: Feishu 配置缺失 → 配置助手 (🔧有方案)

---

## 📚 相关 Skills

- `skills/evolved-security-response/SKILL.md` - 安全响应（需要 Feishu 通知）

---

**维护者**: OpenClaw Evolver System
**下次审查**: 2026-03-21
