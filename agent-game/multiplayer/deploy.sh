#!/bin/bash

# Agent Game 多人服务器部署脚本

set -e

echo "════════════════════════════════════════════════════════════"
echo "🚀 Agent Game Multiplayer Server Deployment"
echo "════════════════════════════════════════════════════════════"
echo ""

# 配置
PORT=${PORT:-3457}
HOST=${HOST:-0.0.0.0}
SERVER_DIR="/root/.openclaw/workspace/agent-game/multiplayer"

# 进入目录
cd "$SERVER_DIR"

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装"
    exit 1
fi

echo "✅ Node.js: $(node -v)"
echo "✅ NPM: $(npm -v)"
echo ""

# 安装依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm install
else
    echo "✅ 依赖已安装"
fi

# 创建日志目录
mkdir -p logs

# 检查端口
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️  端口 $PORT 已被占用"
    echo "   占用进程:"
    lsof -Pi :$PORT -sTCP:LISTEN
    echo ""
    read -p "是否停止占用进程? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        lsof -ti:$PORT | xargs kill -9
        echo "✅ 已停止占用进程"
        sleep 2
    else
        echo "❌ 部署取消"
        exit 1
    fi
fi

# 启动方式选择
echo ""
echo "选择启动方式:"
echo "  1) 直接启动 (前台运行)"
echo "  2) PM2 后台运行"
echo "  3) Systemd 服务"
echo "  4) Docker"
echo ""
read -p "请选择 (1-4): " -n 1 -r
echo ""

case $REPLY in
    1)
        echo "🚀 直接启动..."
        PORT=$PORT HOST=$HOST node server.js
        ;;
    2)
        echo "🚀 使用 PM2 启动..."
        
        # 检查 PM2
        if ! command -v pm2 &> /dev/null; then
            echo "📦 安装 PM2..."
            npm install -g pm2
        fi
        
        # 停止旧进程
        pm2 delete agent-game-server 2>/dev/null || true
        
        # 启动新进程
        PORT=$PORT HOST=$HOST pm2 start server.js \
            --name agent-game-server \
            --log logs/server.log \
            --error logs/error.log \
            --time
        
        echo ""
        echo "✅ 服务已启动"
        pm2 status
        echo ""
        echo "查看日志: pm2 logs agent-game-server"
        echo "重启服务: pm2 restart agent-game-server"
        echo "停止服务: pm2 stop agent-game-server"
        ;;
    3)
        echo "🚀 创建 Systemd 服务..."
        
        SERVICE_FILE="/etc/systemd/system/agent-game.service"
        
        cat > "$SERVICE_FILE" << EOF
[Unit]
Description=Agent Game Multiplayer Server
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$SERVER_DIR
Environment="PORT=$PORT"
Environment="HOST=$HOST"
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=10
StandardOutput=append:$SERVER_DIR/logs/stdout.log
StandardError=append:$SERVER_DIR/logs/stderr.log

[Install]
WantedBy=multi-user.target
EOF
        
        echo "✅ 服务文件已创建: $SERVICE_FILE"
        
        # 重载 systemd
        systemctl daemon-reload
        
        # 启动服务
        systemctl start agent-game
        
        # 开机自启
        systemctl enable agent-game
        
        echo ""
        echo "✅ 服务已启动"
        systemctl status agent-game --no-pager
        echo ""
        echo "查看日志: journalctl -u agent-game -f"
        echo "重启服务: systemctl restart agent-game"
        echo "停止服务: systemctl stop agent-game"
        ;;
    4)
        echo "🚀 使用 Docker 启动..."
        
        # 检查 Docker
        if ! command -v docker &> /dev/null; then
            echo "❌ Docker 未安装"
            exit 1
        fi
        
        # 创建 Dockerfile
        cat > Dockerfile << 'EOF'
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3457
CMD ["node", "server.js"]
EOF
        
        # 构建镜像
        echo "构建 Docker 镜像..."
        docker build -t agent-game-server .
        
        # 停止旧容器
        docker rm -f agent-game-server 2>/dev/null || true
        
        # 启动新容器
        docker run -d \
            --name agent-game-server \
            -p $PORT:3457 \
            -v $(pwd)/logs:/app/logs \
            --restart unless-stopped \
            agent-game-server
        
        echo ""
        echo "✅ 容器已启动"
        docker ps | grep agent-game-server
        echo ""
        echo "查看日志: docker logs agent-game-server -f"
        echo "重启容器: docker restart agent-game-server"
        echo "停止容器: docker stop agent-game-server"
        ;;
    *)
        echo "❌ 无效选择"
        exit 1
        ;;
esac

echo ""
echo "════════════════════════════════════════════════════════════"
echo "✅ 部署完成！"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "📡 服务器地址: http://$HOST:$PORT"
echo "🔌 WebSocket: ws://$HOST:$PORT/ws/game/{roomId}"
echo "🏥 健康检查: curl http://localhost:$PORT/health"
echo ""
echo "测试连接:"
echo "  node example-ai-client.js ws://localhost:$PORT warrior"
echo ""
