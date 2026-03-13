# 安全威胁智能响应 Skill

**版本**: 1.0
**创建时间**: 2026-03-14
**创建方式**: evolver-self-evolution (Round 320)
**目的**: 智能响应安全威胁，提供多层级防御方案

---

## 🎯 核心问题

### PAT-105: 安全威胁持续 26+ 小时未解决（严重）

**症状**:
```
威胁 IP: 20.196.192.175
攻击类型: .env 文件扫描（201 次）
发现时间: 2026-03-13 02:00
当前时间: 2026-03-14 04:30
持续时间: 26+ 小时
状态: ❌ 未封禁（elevated 权限不可用）
```

**影响**:
- 🔴 **严重安全隐患**: .env 文件可能包含敏感信息（API keys、数据库密码等）
- 🔴 **攻击窗口期长**: 攻击者有 26+ 小时时间尝试
- 🔴 **无法自动防御**: 缺少 elevated 权限导致无法执行 iptables
- 🔴 **人工依赖严重**: 必须等待人工介入

**根因分析**:
1. 缺少多层防御机制（只有 iptables 一层）
2. 未实现应用层防御（Nginx/防火墙规则）
3. 缺少自动告警和通知机制
4. 缺少降级防御方案（当 elevated 不可用时）

---

## 📋 响应策略

### 1. 多层级防御架构

```
┌─────────────────────────────────────────────────┐
│           多层级防御体系                          │
├─────────────────────────────────────────────────┤
│                                                 │
│  Level 4: 通知告警                               │
│  └─ 发送通知到管理员（Feishu/Email/Slack）        │
│                                                 │
│  Level 3: 应用层防御（无需 elevated）             │
│  └─ Nginx 封禁、fail2ban、应用黑名单              │
│                                                 │
│  Level 2: 系统层防御（需要 elevated）             │
│  └─ iptables、firewalld、ufw                    │
│                                                 │
│  Level 1: 网络层防御                             │
│  └─ 云服务商安全组、CDN、WAF                      │
│                                                 │
└─────────────────────────────────────────────────┘
```

### 2. 自动降级机制

**当 elevated 权限不可用时**:
1. ✅ **应用层封禁** - Nginx deny 规则（无需 elevated）
2. ✅ **生成封禁脚本** - 供人工执行
3. ✅ **发送告警通知** - 提醒管理员介入
4. ✅ **记录威胁日志** - 持续跟踪

**当 elevated 权限可用时**:
1. ✅ **系统层封禁** - iptables 规则
2. ✅ **持久化规则** - 保存到配置文件
3. ✅ **验证封禁效果** - 确认 IP 已被封禁

---

## 🔧 使用方法

### 1. 检测威胁

```bash
# 扫描安全日志
bash /root/.openclaw/workspace/evolver/fixes/security-threat-scanner.sh --scan

# 查看当前威胁
bash /root/.openclaw/workspace/evolver/fixes/security-threat-scanner.sh --status
```

### 2. 自动响应（推荐）

```bash
# 智能响应（自动选择最佳防御层级）
bash /root/.openclaw/workspace/evolver/fixes/security-threat-scanner.sh --auto-respond
```

### 3. 手动封禁

```bash
# 应用层封禁（无需 elevated）
bash /root/.openclaw/workspace/evolver/fixes/security-threat-scanner.sh --ban-nginx <IP>

# 系统层封禁（需要 elevated）
bash /root/.openclaw/workspace/evolver/fixes/security-threat-scanner.sh --ban-iptables <IP>
```

### 4. 生成报告

```bash
# 生成威胁报告
bash /root/.openclaw/workspace/evolver/fixes/security-threat-scanner.sh --report
```

---

## 📊 预期效果

| 指标 | 当前值 | 目标值 | 改进幅度 |
|------|--------|--------|---------|
| 威胁响应时间 | 26+ 小时 | < 30 分钟 | -98% |
| 自动防御率 | 0% | > 80% | +80% |
| 应用层防御覆盖 | 0% | 100% | +100% |
| 告警及时性 | 无 | 实时 | +100% |

---

## 🚨 紧急响应流程

### 当发现严重威胁时

1. **立即检测** (0-1 分钟)
   - 扫描日志文件
   - 识别攻击模式
   - 评估威胁等级

2. **自动响应** (1-5 分钟)
   - 尝试应用层封禁（Nginx）
   - 尝试系统层封禁（iptables，如果 elevated 可用）
   - 生成手动封禁脚本

3. **告警通知** (5-10 分钟)
   - 发送 Feishu 通知
   - 生成威胁报告
   - 提供手动执行命令

4. **持续监控** (持续)
   - 跟踪威胁状态
   - 验证封禁效果
   - 记录响应历史

---

## 📝 威胁分级

| 等级 | 描述 | 响应时间 | 响应方式 |
|------|------|---------|---------|
| P0 - 紧急 | .env、数据库、密钥扫描 | < 5 分钟 | 多层防御 + 告警 |
| P1 - 高 | SQL 注入、XSS、暴力破解 | < 30 分钟 | 自动封禁 |
| P2 - 中 | 扫描器、爬虫 | < 2 小时 | 限流 + 监控 |
| P3 - 低 | 异常访问 | < 24 小时 | 记录 + 分析 |

---

## 🔄 相关 Patterns

- **PAT-105**: 安全威胁持续未解决 → 多层防御 (🔧有方案)
- **PAT-078**: Nginx 安全扫描 → 自动封禁 (✅已解决)
- **PAT-079**: 威胁 IP 管理 → 智能响应 (🔧有方案)

---

## 📚 相关 Skills

- `skills/emergency-response/SKILL.md` - 紧急响应
- `skills/evolved-security-hardening/SKILL.md` - 安全加固

---

## 📝 维护日志

### 2026-03-14 (创建)
- 检测到安全威胁持续 26+ 小时
- 创建多层级防御机制
- 定义自动降级策略
- 实现告警通知机制

---

**维护者**: OpenClaw Evolver System
**下次审查**: 2026-03-21
