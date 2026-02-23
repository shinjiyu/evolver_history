#!/bin/bash

# Agent Game 快速启动脚本

echo "🎮 启动深渊遗迹探险队..."
echo ""

cd "$(dirname "$0")"

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未找到 Node.js"
    echo "请先安装 Node.js: https://nodejs.org/"
    exit 1
fi

# 检查文件
if [ ! -f "start-game.js" ]; then
    echo "❌ 错误: 找不到 start-game.js"
    exit 1
fi

# 运行游戏
node start-game.js "$@"
