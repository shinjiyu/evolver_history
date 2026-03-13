# 每日安全威胁总结 - 2026-03-10

## 📊 全天统计

| 指标 | 数值 |
|------|------|
| 威胁 IP 总数 | 16 个 |
| 恶意请求总数 | 231 次 |
| 高优先级威胁 | 6 个（179 次请求，77.5%） |
| 中等优先级威胁 | 10 个（52 次请求，22.5%） |
| 威胁增长率 | +1500%（16 小时内从 1 增长到 16） |

## 🔒 威胁类型分布

| 威胁类型 | IP 数量 | 请求次数 | 占比 |
|---------|---------|---------|------|
| WordPress 扫描 | 3 | 84 | 36.4% |
| l9scan 扫描器 | 2 | 79 | 34.2% |
| .env 文件扫描 | 3 | 32 | 13.9% |
| zgrab 扫描器 | 6 | 8 | 3.5% |
| 其他扫描 | 2 | 28 | 12.1% |

## 🔴 高优先级威胁（6 个）

| IP | 类型 | 访问次数 | 严重程度 |
|---|------|---------|---------|
| 20.219.132.149 | WordPress 漏洞扫描 | 43 | 🔴 高 |
| 147.182.200.94 | l9scan 自动扫描器 | 40 | 🔴 高 |
| 68.183.180.73 | l9scan API 扫描器 | 39 | 🔴 高 |
| 20.196.201.163 | WordPress 漏洞扫描 | 37 | 🔴 高 |
| 96.41.38.202 | 多种扫描 | 27 | 🔴 高 |
| 13.74.146.113 | WordPress 插件漏洞扫描 | 4 | 🔴 高 |

## 🟡 中等优先级威胁（10 个）

| IP | 类型 | 访问次数 | 严重程度 |
|---|------|---------|---------|
| 104.244.74.39 | Python aiohttp 扫描器 | 16 | 🟡 中等 |
| 176.65.149.253 | .env 文件扫描 | 12 | 🟡 中等 |
| 185.224.128.251 | 配置文件扫描 | 2 | 🟡 中等 |
| 40.124.173.235 | zgrab 扫描器 | 2 | 🟡 中等 |
| 180.93.243.46 | .env 文件扫描 | 4 | 🟡 中等 |
| 74.235.162.254 | zgrab 扫描器 | 1 | 🟡 中等 |
| 162.243.162.106 | zgrab 扫描器 | 1 | 🟡 中等 |
| 135.222.40.118 | zgrab 扫描器 | 1 | 🟡 中等 |
| 20.169.105.34 | zgrab 扫描器 | 1 | 🟡 中等 |
| 142.93.146.198 | zgrab 扫描器 | 1 | 🟡 中等 |

## 📈 威胁增长趋势

| 时间 | 可疑 IP | 变化 | 累计增长 | 恶意请求 |
|------|---------|------|---------|---------|
| 06:01 | 1 | - | 基准 | - |
| 08:08 | 4 | +300% | 4x | - |
| 10:00 | 6 | +50% | 6x | - |
| 12:06 | 8 | +33% | 8x | - |
| 14:00 | 9 | +13% | 9x | 53 |
| 16:06 | 10 | +11% | 10x | 96 |
| 18:00 | 13 | +30% | 13x | 109 |
| 20:04 | 14 | +8% | 14x | 217 |
| 22:00 | 16 | +14% | **16x** 🔴 | **231** |

## 🚨 关键发现

### 1. 威胁快速增长

- **16 小时内增长 1500%**（从 1 个增长到 16 个）
- **恶意请求持续增加**（从 0 增长到 231 次）
- **增长速度最快的时段**：18:00-20:04（+99%）

### 2. 最活跃的威胁

1. **20.219.132.149**：43 次请求（WordPress 扫描）
2. **147.182.200.94**：40 次请求（l9scan）
3. **68.183.180.73**：39 次请求（l9scan）
4. **20.196.201.163**：37 次请求（WordPress 扫描）

### 3. 攻击模式分析

1. **WordPress 相关扫描占主导**（36.4%）
   - 寻找 WordPress 核心文件
   - 寻找 WordPress 插件漏洞
   - 寻找可疑 PHP 文件

2. **自动化扫描器活跃**（34.2%）
   - l9scan 扫描器：79 次请求
   - 寻找 API 文档泄露
   - 寻找调试端点

3. **敏感文件扫描持续**（13.9%）
   - .env 文件扫描：32 次请求
   - 尝试获取环境变量
   - 寻找数据库密码、API 密钥等

## 💡 建议措施

### 立即行动

1. **封禁所有威胁 IP**（16 个）

```bash
# 高优先级（6 个）
sudo iptables -I INPUT -s 20.196.201.163 -j DROP
sudo iptables -I INPUT -s 20.219.132.149 -j DROP
sudo iptables -I INPUT -s 13.74.146.113 -j DROP
sudo iptables -I INPUT -s 147.182.200.94 -j DROP
sudo iptables -I INPUT -s 68.183.180.73 -j DROP
sudo iptables -I INPUT -s 96.41.38.202 -j DROP

# 中等优先级（10 个）
sudo iptables -I INPUT -s 180.93.243.46 -j DROP
sudo iptables -I INPUT -s 104.244.74.39 -j DROP
sudo iptables -I INPUT -s 176.65.149.253 -j DROP
sudo iptables -I INPUT -s 74.235.162.254 -j DROP
sudo iptables -I INPUT -s 162.243.162.106 -j DROP
sudo iptables -I INPUT -s 135.222.40.118 -j DROP
sudo iptables -I INPUT -s 40.124.173.235 -j DROP
sudo iptables -I INPUT -s 20.169.105.34 -j DROP
sudo iptables -I INPUT -s 185.224.128.251 -j DROP
sudo iptables -I INPUT -s 142.93.146.198 -j DROP

# 保存规则
sudo iptables-save > /etc/iptables/rules.v4
```

### 长期改进

1. **部署 fail2ban**
   - 自动封禁恶意 IP
   - 减少手动操作
   - 实时响应威胁

2. **在 Nginx 中封禁已知扫描器**
   ```nginx
   # 封禁已知扫描器 User-Agent
   if ($http_user_agent ~* "zgrab|l9scan|aiohttp") {
       return 403;
   }
   ```

3. **定期检查访问日志**
   ```bash
   # 每天检查
   tail -100 /var/log/nginx/access.log | grep -E "\.env|\.git|wp-|admin/config"
   ```

4. **加强 WordPress 安全**（如果服务器运行 WordPress）
   - 更新 WordPress 和插件
   - 安装安全插件
   - 限制访问 wp-admin

## 📂 相关文件

- **威胁详细报告**: `/root/.openclaw/workspace/memory/security-threats-2026-03-10.md`
- **每日记忆**: `/root/.openclaw/workspace/memory/2026-03-10.md`
- **探索报告目录**: `/root/.openclaw/workspace/autonomous-exploration/reports/`
- **输出文件目录**: `/root/.openclaw/workspace/autonomous-exploration/outputs/`

---

*生成时间: 2026-03-10 22:00*
*生成方式: 自主探索系统*
*扫描次数: 9 次（每 2 小时）*
