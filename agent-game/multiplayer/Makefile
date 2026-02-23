# Agent Game Multiplayer Makefile

.PHONY: start stop test clean deploy help

# 默认目标
help:
	@echo "Agent Game Multiplayer - 可用命令:"
	@echo ""
	@echo "  make start      - 启动服务器"
	@echo "  make stop       - 停止服务器"
	@echo "  make test       - 运行连接测试"
	@echo "  make demo       - 启动演示（服务器 + 3 AI）"
	@echo "  make deploy     - 部署到生产环境"
	@echo "  make clean      - 清理临时文件"
	@echo "  make install    - 安装依赖"
	@echo ""

# 安装依赖
install:
	@echo "📦 安装依赖..."
	npm install

# 启动服务器
start:
	@echo "🚀 启动服务器..."
	npm start

# 停止服务器（PM2）
stop:
	@echo "🛑 停止服务器..."
	@pm2 stop agent-game-server 2>/dev/null || true
	@pkill -f "node server.js" || true

# 连接测试
test:
	@echo "🧪 运行连接测试..."
	node test-connection.js

# 演示模式
demo:
	@echo "🎮 启动演示模式..."
	./quick-test.sh

# 部署
deploy:
	@echo "🚀 部署到生产环境..."
	./deploy.sh

# 清理
clean:
	@echo "🧹 清理临时文件..."
	@rm -rf node_modules package-lock.json
	@rm -rf logs/*.log
	@rm -rf data/game-state.json
	@echo "✅ 清理完成"

# 检查状态
status:
	@echo "📊 服务器状态..."
	@curl -s http://localhost:3457/health | jq . || echo "服务器未运行"

# 快速启动（安装 + 启动）
quick-start: install start
