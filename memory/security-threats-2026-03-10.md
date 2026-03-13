# 安全威胁报告 - 2026-03-10

## 🚨 威胁汇总

| IP | 类型 | 严重程度 | 访问次数 | 状态 |
|---|------|---------|---------|------|
| 20.196.201.163 | WordPress 漏洞扫描 | 🔴 高 | 37 | ⏳ 待封禁 |
| 20.219.132.149 | WordPress 漏洞扫描 | 🔴 高 | 43 | ⏳ 待封禁 |
| 13.74.146.113 | WordPress 插件漏洞扫描 | 🔴 高 | 4 | ⏳ 待封禁 |
| 147.182.200.94 | l9scan 自动扫描器 | 🔴 高 | 8 | ⏳ 待封禁 |
| 180.93.243.46 | .env 文件扫描 | 🟡 中等 | 4 | ⏳ 待封禁 |
| 104.244.74.39 | Python aiohttp 扫描器 | 🟡 中等 | 4 | ⏳ 待封禁 |
| 68.183.180.73 | l9scan API 扫描器 | 🟡 中等 | 1 | ⏳ 待封禁 |
| 74.235.162.254 | zgrab 扫描器 | 🟡 中等 | 1 | ⏳ 待封禁 |
| 185.224.128.251 | 配置文件扫描 | 🟡 中等 | 2 | ⏳ 待封禁 |
| 162.243.162.106 | zgrab 扫描器 | 🟡 中等 | 1 | ⏳ 待封禁 |
| 135.222.40.118 | zgrab 扫描器 | 🟡 中等 | 1 | ⏳ 待封禁 |
| 40.124.173.235 | zgrab 扫描器 | 🟡 中等 | 2 | ⏳ 待封禁 |
| 20.169.105.34 | zgrab 扫描器 | 🟡 中等 | 1 | ⏳ 待封禁 |

**总计**: 13 个可疑 IP，109 次恶意请求

## 🔒 威胁详情

### 1. 20.196.201.163 - WordPress 漏洞扫描 🔴

**严重程度**: 高

**访问时间**: 2026-03-10 06:05:06-08

**访问次数**: 37 次

**扫描目标**:
- WordPress 核心文件：`wp-admin/`, `wp-content/`, `wp-includes/`
- 可疑 PHP 文件：`haha.php`, `bolt.php`, `admin.php`, `wp-act.php`
- WordPress 插件和主题漏洞

**User-Agent**: `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36`

**风险**: 寻找 WordPress 漏洞，尝试上传 webshell 或获取服务器权限

---

### 2. 180.93.243.46 - .env 文件扫描 🟡

**严重程度**: 中等

**访问时间**: 2026-03-10 03:51:50-56

**扫描目标**: `/.env`

**User-Agent**: `Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.129 Safari/537.36`

**风险**: 尝试获取敏感配置信息（数据库密码、API 密钥等）

**状态**: 已返回 404（文件不存在）

---

### 3. 74.235.162.254 - 自动扫描器 🟡

**严重程度**: 中等

**访问时间**: 2026-03-10 06:05:27

**扫描目标**: `/ReportServer`

**User-Agent**: `Mozilla/5.0 zgrab/0.x`

**风险**: 已知扫描器，自动化扫描服务器漏洞

---

### 4. 185.224.128.251 - 配置文件扫描 🟡

**严重程度**: 中等

**访问时间**: 2026-03-10 07:45:59-46:01

**扫描目标**: `/admin/config.php`

**User-Agent**:
- `Mozilla/5.0 (Macintosh; Intel Mac OS X 14.3) AppleWebKit/614.31.14 (KHTML, like Gecko) Version/17.0.96 Safari/614.31.14`
- `Mozilla/5.0 (X11; Linux i686) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36`

**风险**: 尝试获取配置文件，寻找数据库连接信息

**状态**: 已返回 404

---

### 5. 162.243.162.106 - 自动扫描器 🟡

**严重程度**: 中等

**访问时间**: 2026-03-10 08:11:03

**扫描目标**: `/`

**User-Agent**: `Mozilla/5.0 zgrab/0.x`

**风险**: 已知扫描器，自动化扫描服务器漏洞

---

### 6. 135.222.40.118 - 自动扫描器 🟡

**严重程度**: 中等

**访问时间**: 2026-03-10 09:51:24

**扫描目标**: `/version`

**User-Agent**: `Mozilla/5.0 zgrab/0.x`

**风险**: 已知扫描器，尝试获取服务器版本信息

---

### 7. 40.124.173.235 - 自动扫描器 🟡

**严重程度**: 中等

**访问时间**: 2026-03-10 10:17:41

**扫描目标**: `/`, 异常请求 `MGLNDD_43.156.244.45_443`

**User-Agent**: `Mozilla/5.0 zgrab/0.x`

**风险**: 已知扫描器，自动化扫描服务器漏洞

---

### 8. 20.169.105.34 - 自动扫描器 🟡

**严重程度**: 中等

**访问时间**: 2026-03-10 10:33:34

**扫描目标**: `/developmentserver/metadatauploader`

**User-Agent**: `Mozilla/5.0 zgrab/0.x`

**风险**: 已知扫描器，尝试寻找开发服务器漏洞

---

### 9. 13.74.146.113 - WordPress 插件漏洞扫描 🔴

**严重程度**: 高

**访问时间**: 2026-03-10 12:51:22-23

**访问次数**: 4 次

**扫描目标**:
- `/wp-content/plugins/hellopress/wp_filemanager.php`
- `/wp-scxy.php`

**风险**: 寻找 WordPress 插件漏洞，尝试上传 webshell 或获取服务器权限

**状态**: 已返回 404

---

### 10. 20.219.132.149 - WordPress 漏洞扫描 🔴

**严重程度**: 高

**访问时间**: 2026-03-10 15:31:00-01

**访问次数**: 43 次

**扫描目标**:
- WordPress 核心文件：`wp-admin/`, `wp-content/`, `wp-includes/`
- PHP 文件：`class-t.api.php`, `file.php`, `info.php`, `wp-good.php`
- WordPress 目录：`/wp-content/uploads/`, `/wp-includes/js/`, `/cgi-bin/`

**User-Agent**: `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36`

**风险**: 寻找 WordPress 漏洞，尝试上传 webshell 或获取服务器权限

**状态**: 已返回 404

---

### 11. 147.182.200.94 - l9scan 自动扫描器 🔴

**严重程度**: 高

**访问时间**: 2026-03-10 17:40:26-38

**访问次数**: 8 次

**扫描目标**:
- WordPress REST API: `/?rest_route=/wp/v2/users/`
- 敏感文件: `/.vscode/sftp.json`, `/trace.axd`, `/@vite/env`
- 调试接口: `/debug/default/view?panel=config`
- API 文档: `/v2/api-docs`

**User-Agent**: `Mozilla/5.0 (l9scan/2.0.5343e2434323e2635313e23343; +https://github.com/LeakIX/l9scan)`

**风险**: 已知扫描器 LeakIX/l9scan，自动化扫描服务器漏洞和敏感信息

**状态**: 已返回 301

---

### 12. 104.244.74.39 - Python aiohttp 扫描器 🟡

**严重程度**: 中等

**访问时间**: 2026-03-10 17:39:55-56

**访问次数**: 4 次

**扫描目标**:
- `/.env`
- `/.env.local`
- `/.env.prod`
- `/.env.dev`

**User-Agent**: `Python/3.13 aiohttp/3.11.18`

**风险**: 自动化扫描环境变量文件，尝试获取敏感配置

**状态**: 已返回 404

---

### 13. 68.183.180.73 - l9scan API 扫描器 🟡

**严重程度**: 中等

**访问时间**: 2026-03-10 17:40:27

**访问次数**: 1 次

**扫描目标**: `/v2/api-docs`

**User-Agent**: `Mozilla/5.0 (l9scan/2.0.5343e2434323e2635313e23343; +https://github.com/LeakIX/l9scan)`

**风险**: 已知扫描器，寻找 API 文档泄露

**状态**: 已返回 404

---

## 🚨 应对措施

### 立即封禁所有威胁 IP

```bash
# 封禁 WordPress 扫描器（高优先级）
sudo iptables -I INPUT -s 20.196.201.163 -j DROP
sudo iptables -I INPUT -s 20.219.132.149 -j DROP
sudo iptables -I INPUT -s 13.74.146.113 -j DROP

# 封禁 .env 扫描器
sudo iptables -I INPUT -s 180.93.243.46 -j DROP

# 封禁自动扫描器
sudo iptables -I INPUT -s 74.235.162.254 -j DROP
sudo iptables -I INPUT -s 162.243.162.106 -j DROP
sudo iptables -I INPUT -s 135.222.40.118 -j DROP
sudo iptables -I INPUT -s 40.124.173.235 -j DROP
sudo iptables -I INPUT -s 20.169.105.34 -j DROP

# 封禁配置文件扫描器
sudo iptables -I INPUT -s 185.224.128.251 -j DROP

# 保存规则
sudo iptables-save > /etc/iptables/rules.v4
```

### 或使用封禁脚本

```bash
# 封禁所有威胁 IP
sudo bash /root/.openclaw/workspace/evolver/fixes/ip-blocker.sh --block 20.196.201.163 "WordPress 漏洞扫描 - 37 次恶意请求"
sudo bash /root/.openclaw/workspace/evolver/fixes/ip-blocker.sh --block 180.93.243.46 ".env 文件扫描"
sudo bash /root/.openclaw/workspace/evolver/fixes/ip-blocker.sh --block 74.235.162.254 "自动扫描器 - zgrab"
sudo bash /root/.openclaw/workspace/evolver/fixes/ip-blocker.sh --block 185.224.128.251 "配置文件扫描"
```

### 验证封禁效果

```bash
# 检查 iptables 规则
sudo iptables -L INPUT -n | grep DROP

# 检查封禁列表
cat /root/.openclaw/workspace/logs/blocked-ips.txt
```

---

## 🛡️ 安全加固建议

### 1. ✅ 已实施

- Nginx 配置禁止访问隐藏文件（.env, .git 等）
- Nginx 配置禁止直接访问 PHP 文件（除非必要）
- 定期安全扫描（自主探索系统）

### 2. ⚠️ 建议实施

1. **安装 fail2ban**
   ```bash
   sudo apt-get install fail2ban
   sudo systemctl enable fail2ban
   sudo systemctl start fail2ban
   ```

2. **配置 fail2ban nginx 规则**
   ```bash
   # /etc/fail2ban/jail.local
   [nginx-botsearch]
   enabled = true
   port = http,https
   filter = nginx-botsearch
   logpath = /var/log/nginx/access.log
   maxretry = 2
   bantime = 86400
   ```

3. **定期检查访问日志**
   ```bash
   # 每天检查
   tail -100 /var/log/nginx/access.log | grep -E "\.env|\.git|wp-|admin/config"
   ```

4. **监控异常 User-Agent**
   ```bash
   # 检查可疑 User-Agent
   cat /var/log/nginx/access.log | grep -E "zgrab|sqlmap|nikto|masscan" | awk '{print $1}' | sort | uniq
   ```

---

## 📊 趋势分析

| 时间 | 可疑 IP | 变化 | 累计增长 | 恶意请求 |
|------|---------|------|---------|---------|
| 06:01 | 1 | - | 基准 | - |
| 08:08 | 4 | +300% | 4x | - |
| 10:00 | 6 | +50% | 6x | - |
| 12:06 | 8 | +33% | 8x | - |
| 14:00 | 9 | +13% | 9x | 53 |
| 16:06 | 10 | +11% | **10x** 🔴 | **96** |

**结论**: 威胁数量持续增长（10 小时内增长 900%），恶意请求数量几乎翻倍（53 → 96），建议立即封禁所有可疑 IP，并考虑部署自动化防御系统（fail2ban）。

**注意**: 
- 15:00-16:00 是错误高峰期（根据历史数据），系统负载可能较高
- WordPress 相关扫描占主导（3 个高优先级威胁，84 次请求）
- 新增的 20.219.132.149 是今天最活跃的扫描器（43 次请求）

---

## 📂 相关文件

- **探索报告**: `/root/.openclaw/workspace/autonomous-exploration/reports/exploration-1773101290805.json`
- **输出文件**: `/root/.openclaw/workspace/autonomous-exploration/outputs/scan_security-1773101290805.json`
- **封禁脚本**: `/root/.openclaw/workspace/evolver/fixes/ip-blocker.sh`
- **封禁列表**: `/root/.openclaw/workspace/logs/blocked-ips.txt`

---

*生成时间: 2026-03-10 08:08*
*生成方式: 自主探索系统*

---

### 11. 147.182.200.94 - l9scan 自动扫描器 🔴

**严重程度**: 高

**访问时间**: 2026-03-10 17:40:26-38

**访问次数**: 8 次

**扫描目标**:
- WordPress REST API: `/?rest_route=/wp/v2/users/`
- 敏感配置文件: `/.vscode/sftp.json`
- API 文档: `/v2/api-docs`, `/trace.axd`
- 调试端点: `/debug/default/view?panel=config`
- 其他: `/@vite/env`, `OPTIONS /`

**User-Agent**: `Mozilla/5.0 (l9scan/2.0.5343e2434323e2635313e23343; +https://github.com/LeakIX/l9scan)`

**风险**: 已知扫描器，自动化扫描服务器漏洞和敏感信息

**状态**: 已返回 301/404

---

### 12. 104.244.74.39 - Python aiohttp 扫描器 🟡

**严重程度**: 中等

**访问时间**: 2026-03-10 17:39:55-56

**访问次数**: 4 次

**扫描目标**:
- `/.env`
- `/.env.local`
- `/.env.prod`
- `/.env.dev`

**User-Agent**: `Python/3.13 aiohttp/3.11.18`

**风险**: 使用 Python 脚本扫描环境变量文件，寻找敏感配置

**状态**: 已返回 404

---

### 13. 68.183.180.73 - l9scan API 扫描器 🟡

**严重程度**: 中等

**访问时间**: 2026-03-10 17:40:27

**访问次数**: 1 次

**扫描目标**: `/v2/api-docs`

**User-Agent**: `Mozilla/5.0 (l9scan/2.0.5343e2434323e2635313e23343; +https://github.com/LeakIX/l9scan)`

**风险**: 已知扫描器，寻找 API 文档泄露

**状态**: 已返回 404
