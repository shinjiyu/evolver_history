#!/bin/bash
# 增量扫描脚本 - 每3小时运行
# 结果追加到 all-scans.log

cd /root/.openclaw/workspace/key-scanner

LOG_FILE="/root/.openclaw/workspace/key-scanner/results/all-scans.log"
JSON_FILE="/root/.openclaw/workspace/key-scanner/results/scans-history.json"

echo "========================================" >> "$LOG_FILE"
echo "扫描时间: $(date '+%Y-%m-%d %H:%M:%S')" >> "$LOG_FILE"

# 运行扫描
node scanner-with-validation.js 2>&1 | tee -a "$LOG_FILE"

# 追加汇总到 JSON 历史
if [ -f results/verified-keys.json ]; then
  # 初始化历史文件
  if [ ! -f "$JSON_FILE" ]; then
    echo '{"scans": []}' > "$JSON_FILE"
  fi
  
  # 读取当前结果并追加到历史
  CURRENT=$(cat results/verified-keys.json | jq -c '.')
  TIMESTAMP=$(date -Iseconds)
  
  # 追加新记录
  jq ".scans += [{\"time\": \"$TIMESTAMP\", \"summary\": $CURRENT}]" "$JSON_FILE" > "${JSON_FILE}.tmp" && mv "${JSON_FILE}.tmp" "$JSON_FILE"
fi

echo "✅ 扫描完成: $(date '+%Y-%m-%d %H:%M:%S')" >> "$LOG_FILE"
