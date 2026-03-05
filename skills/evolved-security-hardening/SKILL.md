# 安全加固 Skill

**版本**: 1.0
**创建时间**: 2026-03-03
**创建方式**: evolver-self-evolution (Round 268)
**目的**: 自动检测和防御安全威胁，保护系统免受恶意攻击

---

## 🎯 核心问题

### PAT-061: 恶意 IP 扫描敏感文件

**症状**:
```
恶意 IP: 45.156.87.205
扫描时间: 2026-03-03 11:56
扫描路径: /download/.env, /new/.env, /old/.env, /.env.production, /v2/.env
请求结果: 全部返回 404（无数据泄露）
```

**影响**:
- 消耗服务器资源
- 可能是自动化扫描工具
- 可能继续尝试其他攻击

**风险等级**: 🟡 中等（已拦截，但需要主动防御）

---

## 📋 安全策略

### 1. 威胁检测机制

**自动检测**:
- 扫描 .env、.git、config 等敏感文件
- 高频请求（> 100 次/分钟）
- SQL 注入尝试
- 路径遍历攻击
- 已知恶意 User-Agent

**检测脚本**: `/root/.openclaw/workspace/evolver/fixes/threat-detector.sh`

### 2. 自动防御机制

**响应策略**:
1. **记录威胁**: 保存到威胁日志
2. **临时封禁**: 自动添加到 iptables（需要 elevated 权限）
3. **永久封禁**: 严重威胁添加到黑名单
4. **告警通知**: 发送通知给管理员

**防御脚本**: `/root/.openclaw/workspace/evolver/fixes/ip-blocker.sh`

### 3. Nginx 安全配置

**增强配置**:
- 禁止访问敏感文件（.env、.git、.htaccess）
- 限制请求频率（Rate Limiting）
- 添加安全 Headers
- 记录恶意请求

**配置脚本**: `/root/.openclaw/workspace/evolver/fixes/nginx-security-enhance.sh`

---

## 🔧 使用方法

### 1. 威胁检测

```bash
# 检查最近的威胁
bash /root/.openclaw/workspace/evolver/fixes/threat-detector.sh --check

# 分析最近 24 小时的日志
bash /root/.openclaw/workspace/evolver/fixes/threat-detector.sh --analyze 24h

# 生成威胁报告
bash /root/.openclaw/workspace/evolver/fixes/threat-detector.sh --report
```

### 2. IP 封禁

```bash
# 封禁单个 IP（需要 elevated 权限）
bash /root/.openclaw/workspace/evolver/fixes/ip-blocker.sh --block 45.156.87.205

# 查看当前封禁列表
bash /root/.openclaw/workspace/evolver/fixes/ip-blocker.sh --list

# 解封 IP
bash /root/.openclaw/workspace/evolver/fixes/ip-blocker.sh --unblock 45.156.87.205

# 自动封禁威胁 IP
bash /root/.openclaw/workspace/evolver/fixes/ip-blocker.sh --auto
```

### 3. Nginx 安全增强

```bash
# 应用安全配置
bash /root/.openclaw/workspace/evolver/fixes/nginx-security-enhance.sh --apply

# 验证配置
bash /root/.openclaw/workspace/evolver/fixes/nginx-security-enhance.sh --verify

# 回滚配置
bash /root/.openclaw/workspace/evolver/fixes/nginx-security-enhance.sh --rollback
```

---

## 📊 预期效果

| 指标 | 当前值 | 目标值 | 改进幅度 |
|------|--------|--------|---------|
| 恶意请求拦截 | 被动 | 主动 | +100% |
| 威胁检测时间 | 手动检查 | 自动检测 | -95% |
| 安全事件响应 | 手动 | 自动 | -90% |
| 系统安全评分 | 6/10 | 9/10 | +50% |

---

## 🚨 注意事项

1. **权限要求**: IP 封禁需要 elevated 权限（sudo）
2. **误封禁风险**: 自动封禁可能误封合法 IP，建议先审查
3. **配置备份**: 修改 Nginx 配置前会自动备份
4. **日志轮转**: 威胁日志需要定期清理，避免占用过多空间

---

## 📝 维护日志

### 2026-03-03 (创建)
- 创建 threat-detector.sh 脚本
- 创建 ip-blocker.sh 脚本
- 创建 nginx-security-enhance.sh 脚本
- 封禁恶意 IP 45.156.87.205

---

## 🔄 相关 Patterns

- **PAT-061**: 恶意 IP 扫描敏感文件 → 自动检测和防御 (🔧有方案)
- **PAT-041**: SSH 扫描攻击 → 安全加固 (🔧有方案)

---

## 📚 相关 Skills

- `skills/emergency-response/SKILL.md` - 紧急响应
- `skills/safe-operations/SKILL.md` - 安全操作

---

**维护者**: OpenClaw Evolver System
**下次审查**: 2026-03-10
