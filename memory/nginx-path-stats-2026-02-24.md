# Nginx 路径访问统计报告

**生成时间**: 2026-02-24 14:37  
**日志文件**: `/var/log/nginx/access.log`  
**分析范围**: 当前日志文件

---

## 📊 总体概况

| 指标 | 数值 |
|------|------|
| 总请求数 | **78,863** |
| 日志大小 | 19 MB |
| 分析日期 | 2026-02-24 |

---

## 🔝 Top 50 路径访问排行

| 排名 | 访问次数 | 百分比 | 路径 |
|------|----------|--------|------|
| 1 | 76,802 | 97.39% | /ws |
| 2 | 63 | 0.08% | / |
| 3 | 15 | 0.02% | /favicon.ico |
| 4 | 9 | 0.01% | /wp-content/plugins/hellopress/wp_filemanager.php |
| 5 | 9 | 0.01% | /ioxi.php |
| 6 | 9 | 0.01% | /api/user/ismustmobile |
| 7 | 8 | 0.01% | 400 (错误响应) |
| 8 | 7 | 0.01% | /file.php |
| 9 | 6 | 0.01% | /wp-content/plugins/index.php |
| 10 | 6 | 0.01% | /m/ |
| 11 | 6 | 0.01% | /join_room |
| 12 | 6 | 0.01% | /ioxi-o.php |
| 13 | 6 | 0.01% | /h5/ |
| 14 | 6 | 0.01% | /admin.php |
| 15 | 5 | 0.01% | /robots.txt |
| 16 | 5 | 0.01% | /inputs.php |
| 17 | 5 | 0.01% | /classwithtostring.php |
| 18 | 5 | 0.01% | /app/ |
| 19 | 5 | 0.01% | /222.php |
| 20 | 5 | 0.01% | /166.php |
| 21-50 | 4次/个 | ~0.00% | 各种 .php 文件扫描 |

---

## 📂 分类汇总

| 类别 | 访问次数 | 百分比 | 说明 |
|------|----------|--------|------|
| 🔌 **WebSocket** | 76,817 | 97.41% | `/ws` 连接 |
| 📡 **API** | 278 | 0.35% | `/api/*` 接口 |
| 🖼️ **静态资源** | 393 | 0.50% | .js/.css/.png 等 |
| 📄 **网页** | 78 | 0.10% | `/`、`/novel/*`、`*.html` |
| 🚨 **可疑扫描** | 1,375 | 1.74% | PHP 漏洞扫描攻击 |
| ❓ **其他** | ~100 | 0.13% | 未分类请求 |

---

## 🚨 安全警告

### ⚠️ 检测到大量 PHP 扫描攻击

**攻击类型**: WordPress 漏洞扫描

**常见攻击路径**:
- `/wp-content/plugins/hellopress/wp_filemanager.php`
- `/ioxi.php`, `/ioxi-o.php`
- `/file.php`, `/admin.php`
- `/classwithtostring.php`
- 随机数字命名的 `.php` 文件 (如 `/222.php`, `/666.php`)

**建议措施**:
1. ✅ 已配置 404 响应（攻击未成功）
2. 考虑封禁恶意 IP
3. 配置 fail2ban 自动封禁扫描器
4. 添加 WAF 规则拦截 PHP 扫描

### 📍 IP 访问分析

#### 🚨 攻击来源 IP (Top 10)

| 排名 | IP 地址 | 扫描次数 | 风险级别 |
|------|---------|----------|----------|
| 1 | 20.46.124.66 | 344 | 🔴 高 |
| 2 | 20.215.69.209 | 312 | 🔴 高 |
| 3 | 20.89.58.13 | 40 | 🟡 中 |
| 4 | 20.24.200.53 | 40 | 🟡 中 |
| 5 | 101.36.125.249 | 30 | 🟡 中 |
| 6 | 158.158.33.103 | 27 | 🟡 中 |
| 7 | 20.111.62.157 | 22 | 🟡 中 |
| 8 | 172.93.111.169 | 2 | 🟢 低 |
| 9 | 147.182.145.92 | 2 | 🟢 低 |

**建议**: 考虑封禁前 7 个 IP 地址

#### ✅ 正常访问 IP (Top 10)

| 排名 | IP 地址 | 请求次数 | 百分比 | 说明 |
|------|---------|----------|--------|------|
| 1 | 8.219.127.157 | 75,489 | 95.7% | 主流量来源（可能是负载均衡器/代理） |
| 2 | 120.244.222.206 | 1,480 | 1.9% | 正常用户 |
| 3 | 101.36.125.249 | 1,068 | 1.4% | 正常用户 |
| 4-10 | 其他 IP | < 50 | < 0.1% | 低频访问 |

**分析**: 
- 95.7% 的流量来自单一 IP `8.219.127.157`，可能是：
  - 云服务商的负载均衡器
  - CDN 节点
  - 反向代理服务器
- 真实用户 IP 需要检查 `X-Forwarded-For` 头

### 📌 正常访问特征

- **WebSocket 连接主导**: 97.39% 的流量是 `/ws` 连接
- **API 请求稀少**: 仅 0.35%，说明服务主要作为 WebSocket 服务运行
- **网页访问极少**: 根路径 `/` 仅 63 次访问

---

## ⏰ 时间维度分析

| 时间段 | 请求数 | 说明 |
|--------|--------|------|
| 今天总计 | 78,863 | 日志轮转后所有请求 |
| WebSocket 活跃 | 76,802 | 持续的长连接活动 |

**分析**: 日志在每天凌晨轮转，当前日志文件包含今天的所有请求。

---

## 💡 优化建议

### 1. 安全加固

#### 快速封禁攻击 IP
```bash
# 封禁主要攻击 IP（需要 root 权限）
iptables -A INPUT -s 20.46.124.66 -j DROP
iptables -A INPUT -s 20.215.69.209 -j DROP
iptables -A INPUT -s 20.89.58.13 -j DROP
iptables -A INPUT -s 20.24.200.53 -j DROP
iptables -A INPUT -s 101.36.125.249 -j DROP
iptables -A INPUT -s 158.158.33.103 -j DROP
iptables -A INPUT -s 20.111.62.157 -j DROP

# 保存规则（CentOS/RHEL）
service iptables save
# 或（Ubuntu/Debian）
iptables-save > /etc/iptables/rules.v4
```

#### 配置 fail2ban（推荐）
```ini
# /etc/fail2ban/jail.local
[nginx-php-scan]
enabled = true
port = http,https
filter = nginx-php-scan
logpath = /var/log/nginx/access.log
maxretry = 5
findtime = 600
bantime = 86400
```

```ini
# /etc/fail2ban/filter.d/nginx-php-scan.conf
[Definition]
failregex = ^<HOST> -.*GET.*\.php.*HTTP.*$
ignoreregex =
```

### 2. 日志优化
- 考虑不记录 WebSocket 升级请求（减少日志量）
- 为攻击请求单独记录到安全日志

### 3. 性能监控
- 监控 WebSocket 连接数峰值
- 设置连接数告警阈值

---

## 📈 趋势对比

### 与历史数据对比（估算）

根据日志文件大小对比：
- 2026-02-24: 19 MB (当前，截至 14:37)
- 2026-02-23: 371 KB (压缩前约 3.7 MB)
- 2026-02-22: 469 KB (压缩前约 4.7 MB)

**结论**: 今天流量显著高于前几天，可能原因：
1. WebSocket 连接增加
2. 扫描攻击增加
3. 月末活动高峰

---

## 📝 附录：完整统计脚本

```bash
#!/bin/bash
LOG_FILE="/var/log/nginx/access.log"
TOTAL=$(wc -l < "$LOG_FILE")

echo "总请求数: $TOTAL"
awk '{print $7}' "$LOG_FILE" | sed 's/?.*//' | sort | uniq -c | sort -rn | head -50
```

---

**报告生成**: OpenClaw 自动化分析  
**下次分析**: 建议 24 小时后对比数据变化
