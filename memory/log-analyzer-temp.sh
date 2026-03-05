#!/bin/bash

# 分析最近 6 小时的日志文件
echo "=== Session 日志深度分析 ==="
echo "分析时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# 定义分析范围
START_TIME="2026-03-05 02:00:00"
LOG_DIR="/root/.openclaw/agents/main/sessions"

echo "## 1. 错误统计"
echo "---"
echo "总文件数: $(find $LOG_DIR -name "*.jsonl" -type f -newermt "$START_TIME" | wc -l)"
echo ""

# 提取所有错误相关的关键词
echo "## 2. 关键错误模式"
echo "---"

# 统计各类错误
find $LOG_DIR -name "*.jsonl" -type f -newermt "$START_TIME" -exec cat {} \; | \
grep -iE '"(error|fail|timeout|exception|warn)"' | \
grep -oE '"[^"]*error[^"]*"|"[^"]*fail[^"]*"|"[^"]*timeout[^"]*"|"[^"]*exception[^"]*"|"[^"]*warn[^"]*"' | \
sort | uniq -c | sort -rn | head -20

echo ""
echo "## 3. HTTP 状态码统计"
echo "---"
find $LOG_DIR -name "*.jsonl" -type f -newermt "$START_TIME" -exec cat {} \; | \
grep -oE '"status":[[:space:]]*[0-9]{3}' | \
sed 's/"status":[[:space:]]*//' | \
sort | uniq -c | sort -rn

echo ""
echo "## 4. API 调用失败"
echo "---"
find $LOG_DIR -name "*.jsonl" -type f -newermt "$START_TIME" -exec cat {} \; | \
grep -E '(401|403|429|500|502|503|504)' | \
grep -oE '"url":"[^"]*"|"method":"[^"]*"' | \
head -20

echo ""
echo "## 5. 超时相关"
echo "---"
find $LOG_DIR -name "*.jsonl" -type f -newermt "$START_TIME" -exec cat {} \; | \
grep -iE 'timeout' | \
wc -l

echo ""
echo "## 6. 最近 6 小时活跃会话"
echo "---"
find $LOG_DIR -name "*.jsonl" -type f -newermt "$START_TIME" -exec basename {} \; | sed 's/.jsonl$//'
