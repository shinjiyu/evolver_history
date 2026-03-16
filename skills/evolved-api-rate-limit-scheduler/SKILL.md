---
name: evolved-api-rate-limit-scheduler
description: API Rate Limit 智能调度。适用于：(1) API Rate Limit 频繁触发、(2) 子代理任务失败、(3) 需要智能错峰调度、(4) 需要请求队列管理。
---

# Evolved API Rate Limit Scheduler - API Rate Limit 智能调度

智能管理 API 请求，避免 Rate Limit，提高任务成功率。

## 核心问题

**PAT-127**: API Rate Limit 持续增加
- 当前: 96 次/6 小时（+25%）
- 严重程度: 🟡 P1
- 影响: novel-auto-review 等任务失败
- 根因: 子代理并发 + 缺少请求队列

## 调度策略

### 策略 1: 请求队列

```bash
#!/bin/bash
# api-request-queue.sh

QUEUE_DIR="/tmp/api-queue"
mkdir -p "$QUEUE_DIR"

# 添加请求到队列
add_request() {
  local priority=$1
  local agent_id=$2
  local task=$3
  local timestamp=$(date +%s)
  
  local request_file="$QUEUE_DIR/${priority}-${timestamp}.json"
  
  cat > "$request_file" <<EOF
{
  "priority": "$priority",
  "agentId": "$agent_id",
  "task": "$task",
  "timestamp": $timestamp,
  "status": "pending"
}
EOF
  
  echo "Request added: $request_file"
}

# 处理队列
process_queue() {
  local rate_limit_per_minute=10  # 每分钟最多 10 个请求
  local interval=$((60 / rate_limit_per_minute))
  
  # 按优先级处理请求
  for request_file in $(ls "$QUEUE_DIR"/*.json 2>/dev/null | sort); do
    # 检查请求状态
    local status=$(jq -r '.status' "$request_file")
    
    if [ "$status" = "pending" ]; then
      # 执行请求
      local agent_id=$(jq -r '.agentId' "$request_file")
      local task=$(jq -r '.task' "$request_file")
      
      echo "Processing: $agent_id - $task"
      
      # 执行子代理任务
      # ... 执行任务 ...
      
      # 更新状态
      jq '.status = "completed"' "$request_file" > "${request_file}.tmp"
      mv "${request_file}.tmp" "$request_file"
      
      # 等待避免 Rate Limit
      sleep $interval
    fi
  done
}

# 主函数
main() {
  case "$1" in
    add)
      add_request "$2" "$3" "$4"
      ;;
    process)
      process_queue
      ;;
    *)
      echo "Usage: $0 {add|process}"
      ;;
  esac
}

main "$@"
```

### 策略 2: 错峰调度

```bash
#!/bin/bash
# staggered-scheduler.sh

# 错峰调度配置
declare -A TASK_SCHEDULES=(
  ["novel-auto-review"]="*/30 * * * *"  # 每 30 分钟
  ["evolver-self-evolution"]="0 */4 * * *"  # 每 4 小时
  ["evolver-log-analysis"]="0 */4 * * *"  # 每 4 小时
  ["system-health-check"]="0 */6 * * *"  # 每 6 小时
)

# 检查是否可以执行
can_execute() {
  local task_name=$1
  local current_minute=$(date +%M)
  local current_hour=$(date +%H)
  
  # 检查最近是否有其他任务在执行
  local recent_tasks=$(find /tmp/task-locks -name "*.lock" -mmin -5 2>/dev/null | wc -l)
  
  if [ $recent_tasks -gt 2 ]; then
    echo "Too many tasks running, delaying $task_name"
    return 1
  fi
  
  # 创建任务锁
  local lock_file="/tmp/task-locks/${task_name}.lock"
  mkdir -p /tmp/task-locks
  echo $$ > "$lock_file"
  
  return 0
}

# 执行任务
execute_task() {
  local task_name=$1
  local task_command=$2
  
  if can_execute "$task_name"; then
    echo "Executing: $task_name"
    eval "$task_command"
    
    # 清理锁
    rm -f "/tmp/task-locks/${task_name}.lock"
  fi
}

# 主函数
main() {
  for task_name in "${!TASK_SCHEDULES[@]}"; do
    execute_task "$task_name" "${TASK_SCHEDULES[$task_name]}"
  done
}

main
```

### 策略 3: 自适应限流

```bash
#!/bin/bash
# adaptive-rate-limiter.sh

RATE_LIMIT_LOG="/root/.openclaw/workspace/logs/rate-limit.log"
STATS_FILE="/tmp/rate-limit-stats.json"

# 统计最近的 Rate Limit 错误
count_recent_rate_limits() {
  local hours=$1
  local count=$(grep -c "Rate Limit" "$RATE_LIMIT_LOG" 2>/dev/null | head -1)
  echo $count
}

# 自适应调整请求速率
adjust_request_rate() {
  local recent_errors=$(count_recent_rate_limits 1)
  
  # 如果最近 1 小时错误 > 20 次，降低速率
  if [ $recent_errors -gt 20 ]; then
    echo "High rate limit errors ($recent_errors), reducing request rate"
    echo '{"rateLimitPerMinute": 5}' > "$STATS_FILE"
  elif [ $recent_errors -gt 10 ]; then
    echo "Moderate rate limit errors ($recent_errors), adjusting request rate"
    echo '{"rateLimitPerMinute": 8}' > "$STATS_FILE"
  else
    echo "Normal rate limit errors ($recent_errors), maintaining request rate"
    echo '{"rateLimitPerMinute": 10}' > "$STATS_FILE"
  fi
}

# 获取当前请求速率
get_current_rate() {
  if [ -f "$STATS_FILE" ]; then
    jq -r '.rateLimitPerMinute' "$STATS_FILE"
  else
    echo "10"  # 默认每分钟 10 个请求
  fi
}

# 主函数
main() {
  adjust_request_rate
  local rate=$(get_current_rate)
  echo "Current request rate: $rate per minute"
}

main
```

## 实施示例

### 示例 1: 子代理调度器

```bash
#!/bin/bash
# subagent-scheduler.sh

WORKSPACE="/root/.openclaw/workspace"
QUEUE_DIR="/tmp/subagent-queue"
STATS_FILE="$WORKSPACE/logs/subagent-stats.json"
RATE_LIMIT_LOG="$WORKSPACE/logs/rate-limit.log"

# 初始化
init() {
  mkdir -p "$QUEUE_DIR"
  
  # 初始化统计文件
  if [ ! -f "$STATS_FILE" ]; then
    cat > "$STATS_FILE" <<EOF
{
  "totalRequests": 0,
  "completedRequests": 0,
  "failedRequests": 0,
  "rateLimitHits": 0
}
EOF
  fi
}

# 添加子代理任务
add_subagent_task() {
  local priority=$1
  local agent_id=$2
  local task=$3
  local timestamp=$(date +%s)
  
  local request_file="$QUEUE_DIR/${priority}-${timestamp}.json"
  
  cat > "$request_file" <<EOF
{
  "priority": "$priority",
  "agentId": "$agent_id",
  "task": "$task",
  "timestamp": $timestamp,
  "status": "pending",
  "retries": 0
}
EOF
  
  # 更新统计
  local total=$(jq '.totalRequests + 1' "$STATS_FILE")
  jq ".totalRequests = $total" "$STATS_FILE" > "${STATS_FILE}.tmp"
  mv "${STATS_FILE}.tmp" "$STATS_FILE"
  
  echo "✅ Task added: $agent_id - $task"
}

# 处理子代理队列
process_subagent_queue() {
  local rate_per_minute=$(jq -r '.rateLimitPerMinute // 10' "$STATS_FILE")
  local interval=$((60 / rate_per_minute))
  
  echo "Processing queue (rate: $rate_per_minute/min, interval: ${interval}s)"
  
  # 按优先级处理请求
  for request_file in $(ls "$QUEUE_DIR"/*.json 2>/dev/null | sort); do
    local status=$(jq -r '.status' "$request_file")
    
    if [ "$status" = "pending" ]; then
      local agent_id=$(jq -r '.agentId' "$request_file")
      local task=$(jq -r '.task' "$request_file")
      local retries=$(jq -r '.retries' "$request_file")
      
      echo "Processing: $agent_id - $task (attempt $((retries + 1)))"
      
      # 执行子代理任务（这里需要根据实际情况实现）
      # 例如：sessions_spawn --agent-id "$agent_id" --task "$task"
      
      # 模拟执行
      if [ $((RANDOM % 10)) -gt 2 ]; then
        echo "✅ Task completed"
        jq '.status = "completed"' "$request_file" > "${request_file}.tmp"
        mv "${request_file}.tmp" "$request_file"
        
        # 更新统计
        local completed=$(jq '.completedRequests + 1' "$STATS_FILE")
        jq ".completedRequests = $completed" "$STATS_FILE" > "${STATS_FILE}.tmp"
        mv "${STATS_FILE}.tmp" "$STATS_FILE"
      else
        echo "❌ Task failed (rate limit)"
        jq '.retries += 1' "$request_file" > "${request_file}.tmp"
        mv "${request_file}.tmp" "$request_file"
        
        # 更新统计
        local failed=$(jq '.failedRequests + 1' "$STATS_FILE")
        jq ".failedRequests = $failed" "$STATS_FILE" > "${STATS_FILE}.tmp"
        mv "${STATS_FILE}.tmp" "$STATS_FILE"
      fi
      
      # 等待避免 Rate Limit
      sleep $interval
    fi
  done
}

# 显示统计
show_stats() {
  echo "=== Subagent Statistics ==="
  jq '.' "$STATS_FILE"
}

# 主函数
main() {
  init
  
  case "$1" in
    add)
      add_subagent_task "$2" "$3" "$4"
      ;;
    process)
      process_subagent_queue
      ;;
    stats)
      show_stats
      ;;
    *)
      echo "Usage: $0 {add|process|stats}"
      ;;
  esac
}

main "$@"
```

## 配置文件

```json
// api-rate-limit-config.json
{
  "rateLimit": {
    "maxRequestsPerMinute": 10,
    "maxRequestsPerHour": 100,
    "backoffMultiplier": 2,
    "maxRetries": 3
  },
  "queue": {
    "enabled": true,
    "queueDir": "/tmp/api-queue",
    "maxQueueSize": 100
  },
  "scheduling": {
    "staggerTasks": true,
    "minTaskInterval": 300,
    "maxConcurrentTasks": 2
  },
  "monitoring": {
    "logFile": "/root/.openclaw/workspace/logs/rate-limit.log",
    "statsFile": "/root/.openclaw/workspace/logs/subagent-stats.json"
  }
}
```

## 最佳实践

1. **请求队列**: 所有 API 请求都通过队列
2. **错峰调度**: 避免任务同时执行
3. **自适应限流**: 根据错误率动态调整
4. **失败重试**: 失败后自动重试（最多 3 次）
5. **监控统计**: 记录所有请求和错误

## 相关 Skills

- `evolved-subagent-scheduler` - 子代理调度器
- `evolved-api-degradation` - API 降级机制
- `evolved-resource-monitor` - 资源监控

## 相关 Pattern

- **PAT-127**: API Rate Limit 持续增加
- **PAT-115**: 子代理并发导致 Rate Limit

---

**创建日期**: 2026-03-16
**来源**: Round 331 - PAT-127 (API Rate Limit 96 次/6h)
**解决问题**: API Rate Limit 频繁触发、子代理任务失败
