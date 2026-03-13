#!/bin/bash
# Novel Review with Staggering - 串行化启动的小说评审
# 此脚本确保子代理按配置的延迟时间启动，避免 429 限流

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_DIR="/root/.openclaw/workspace"
STAGGER_CONFIG="$WORKSPACE_DIR/config/subagent-stagger.json"
LOG_FILE="$WORKSPACE_DIR/logs/novel-review-stagger.log"

# 记录日志
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# 读取配置
DELAY_SECONDS=$(grep "stagger_delay_seconds" "$STAGGER_CONFIG" | grep -o '[0-9]*')
MAX_CONCURRENT=$(grep "max_concurrent_subagents" "$STAGGER_CONFIG" | grep -o '[0-9]*')

log "=== 启动串行化小说评审 ==="
log "配置: 延迟 ${DELAY_SECONDS}s, 最大并发 ${MAX_CONCURRENT}"

# 执行小说评审脚本（生成任务）
log "1. 生成评审任务..."
cd "$WORKSPACE_DIR"
node cron/novel-auto-review-full.js "$@"

# 注意：此脚本只负责生成任务
# 实际的串行化启动由主系统在执行 sessions_spawn 时自动应用
# 配置文件中的参数会被自动读取

log "✅ 任务生成完成"
log "提示: 主系统将自动使用串行化配置启动子代理"
