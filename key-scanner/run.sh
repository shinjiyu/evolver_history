#!/bin/bash
set -e

echo "🚀 GitHub API Key Scanner"
echo "================================"
echo ""

# 检查环境变量
if [ -z "$GITHUB_TOKEN" ]; then
    echo "❌ 错误: 未设置 GITHUB_TOKEN 环境变量"
    echo ""
    echo "请设置环境变量:"
    echo "  export GITHUB_TOKEN='your-github-token'"
    echo ""
    echo "创建 Token: https://github.com/settings/tokens"
    echo "需要的权限: repo (Full control of private repositories)"
    exit 1
fi

# 运行扫描
echo "📡 开始扫描 GitHub..."
node scanner.js

echo ""
echo "🔐 开始验证 Keys..."
node validator.js

echo ""
echo "✅ 完成！结果保存在 results/ 目录"
ls -la results/
