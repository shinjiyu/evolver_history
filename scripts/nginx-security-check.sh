#!/bin/bash
# Nginx 安全检查脚本 - 每日自动封禁扫描器 IP
# 只封禁明确的恶意行为，不误封正常用户

LOG="/var/log/nginx/access.log"
TODAY=$(date '+%d/%b/%Y')
REPORT_FILE="/root/.openclaw/workspace/memory/nginx-security-$(date +%Y%m%d).md"
BANNED_LOG="/root/.openclaw/workspace/memory/banned-ips.txt"

echo "# Nginx 安全报告 - $(date '+%Y-%m-%d %H:%M')" > $REPORT_FILE
echo "" >> $REPORT_FILE

# 统计今日总请求
TOTAL=$(grep "$TODAY" $LOG 2>/dev/null | wc -l)
echo "## 总览" >> $REPORT_FILE
echo "- 今日总请求: **$TOTAL**" >> $REPORT_FILE
echo "" >> $REPORT_FILE

echo "## 已封禁 IP" >> $REPORT_FILE
echo "" >> $REPORT_FILE

BANNED_COUNT=0

# === 只封禁明确的恶意行为 ===

# 1. WordPress 扫描器 (wp-content, wp-admin, wp-login, xmlrpc)
for ip in $(grep "$TODAY" $LOG | grep -E "(wp-content|wp-admin|wp-login|xmlrpc)" | awk '{print $1}' | sort -u); do
    if ! iptables -C INPUT -s $ip -j DROP 2>/dev/null; then
        iptables -I INPUT -s $ip -j DROP
        echo "- 🚫 $ip (WordPress扫描)" >> $REPORT_FILE
        echo "$(date '+%Y-%m-%d %H:%M') $ip scanner=wordpress" >> $BANNED_LOG
        ((BANNED_COUNT++))
    fi
done

# 2. PHP 漏洞扫描 (.php 文件探测)
for ip in $(grep "$TODAY" $LOG | grep -E "(\.php|phpmyadmin|myadmin)" | grep -v "vocab-api" | awk '{print $1}' | sort -u); do
    if ! iptables -C INPUT -s $ip -j DROP 2>/dev/null; then
        iptables -I INPUT -s $ip -j DROP
        echo "- 🚫 $ip (PHP扫描)" >> $REPORT_FILE
        echo "$(date '+%Y-%m-%d %H:%M') $ip scanner=php" >> $BANNED_LOG
        ((BANNED_COUNT++))
    fi
done

# 3. 敏感文件扫描 (.env, .git, .svn, .htaccess)
for ip in $(grep "$TODAY" $LOG | grep -E "(\.env|\.git|\.svn|\.htaccess|config\.|backup\.)" | awk '{print $1}' | sort -u); do
    if ! iptables -C INPUT -s $ip -j DROP 2>/dev/null; then
        iptables -I INPUT -s $ip -j DROP
        echo "- 🚫 $ip (敏感文件扫描)" >> $REPORT_FILE
        echo "$(date '+%Y-%m-%d %H:%M') $ip scanner=sensitive" >> $BANNED_LOG
        ((BANNED_COUNT++))
    fi
done

# 4. CGI 路径遍历攻击 (..%2e, /bin/sh, cgi-bin)
for ip in $(grep "$TODAY" $LOG | grep -E "(cgi-bin.*\.\.|bin/sh|%2e|%25)" | awk '{print $1}' | sort -u); do
    if ! iptables -C INPUT -s $ip -j DROP 2>/dev/null; then
        iptables -I INPUT -s $ip -j DROP
        echo "- 🚫 $ip (CGI攻击)" >> $REPORT_FILE
        echo "$(date '+%Y-%m-%d %H:%M') $ip scanner=cgi" >> $BANNED_LOG
        ((BANNED_COUNT++))
    fi
done

# 5. 可疑 User-Agent (已知扫描器)
SCANNER_AGENTS="libredtail nikto sqlmap masscan zgrab"
for agent in $SCANNER_AGENTS; do
    for ip in $(grep "$TODAY" $LOG | grep -i "$agent" | awk '{print $1}' | sort -u); do
        if ! iptables -C INPUT -s $ip -j DROP 2>/dev/null; then
            iptables -I INPUT -s $ip -j DROP
            echo "- 🚫 $ip (扫描器UA: $agent)" >> $REPORT_FILE
            echo "$(date '+%Y-%m-%d %H:%M') $ip scanner=ua-$agent" >> $BANNED_LOG
            ((BANNED_COUNT++))
        fi
    done
done

echo "" >> $REPORT_FILE
echo "---" >> $REPORT_FILE
echo "本次封禁: $BANNED_COUNT 个恶意 IP" >> $REPORT_FILE

# 输出报告
cat $REPORT_FILE

echo ""
echo "=== 当前封禁 IP 总数 ==="
iptables -L INPUT -n | grep "DROP" | wc -l
