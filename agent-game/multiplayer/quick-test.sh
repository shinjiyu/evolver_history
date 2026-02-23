#!/bin/bash

# 快速测试脚本 - 启动服务器和3个AI客户端

set -e

echo "════════════════════════════════════════════════════════════"
echo "🎮 Agent Game Quick Test"
echo "════════════════════════════════════════════════════════════"
echo ""

PORT=${PORT:-3457}
SERVER_DIR="/root/.openclaw/workspace/agent-game/multiplayer"

cd "$SERVER_DIR"

# 检查依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm install
fi

# 启动服务器（后台）
echo "🚀 启动服务器..."
PORT=$PORT node server.js &
SERVER_PID=$!

# 等待服务器启动
sleep 2

# 检查服务器是否启动
if ! kill -0 $SERVER_PID 2>/dev/null; then
    echo "❌ 服务器启动失败"
    exit 1
fi

echo "✅ 服务器已启动 (PID: $SERVER_PID)"
echo ""

# 启动3个AI客户端
echo "🤖 启动 AI 客户端..."
echo ""

# 使用 tmux 或在后台运行
if command -v tmux &> /dev/null; then
    echo "使用 tmux..."
    
    # 创建新会话
    tmux new-session -d -s agent-game -n server "PORT=$PORT node server.js"
    
    # 战士
    tmux new-window -t agent-game -n warrior "node example-ai-client.js ws://localhost:$PORT warrior"
    
    # 法师
    tmux new-window -t agent-game -n mage "node example-ai-client.js ws://localhost:$PORT mage"
    
    # 盗贼
    tmux new-window -t agent-game -n thief "node example-ai-client.js ws://localhost:$PORT thief"
    
    echo ""
    echo "✅ 测试环境已启动"
    echo ""
    echo "连接到 tmux 会话:"
    echo "  tmux attach -t agent-game"
    echo ""
    echo "切换窗口:"
    echo "  Ctrl+B 然后按数字键 (0=server, 1=warrior, 2=mage, 3=thief)"
    echo ""
    echo "停止测试:"
    echo "  tmux kill-session -t agent-game"
    
else
    echo "不使用 tmux，在后台运行..."
    
    node example-ai-client.js ws://localhost:$PORT warrior &
    PID1=$!
    
    sleep 1
    
    node example-ai-client.js ws://localhost:$PORT mage &
    PID2=$!
    
    sleep 1
    
    node example-ai-client.js ws://localhost:$PORT thief &
    PID3=$!
    
    echo ""
    echo "✅ 测试环境已启动"
    echo ""
    echo "进程 IDs:"
    echo "  Server: $SERVER_PID"
    echo "  Warrior: $PID1"
    echo "  Mage: $PID2"
    echo "  Thief: $PID3"
    echo ""
    echo "停止测试:"
    echo "  kill $SERVER_PID $PID1 $PID2 $PID3"
    
    # 等待
    wait $SERVER_PID
fi
