#!/bin/bash
# 小说发布后自动更新首页目录
# 解决 edit 工具的精确匹配问题

NOVEL_DIR="/root/.openclaw/workspace/novel-project"
WEB_DIR="/var/www/novel/abyss"

# 统计已发布章节数
CHAPTER_COUNT=$(ls -1 $WEB_DIR/chapters/*.html 2>/dev/null | wc -l)

# 获取最新章节信息
LATEST_CH=$(ls -1 $WEB_DIR/chapters/*.html 2>/dev/null | tail -1 | sed 's/.*\///' | sed 's/.html//')

echo "已发布章节: $CHAPTER_COUNT"
echo "最新章节: $LATEST_CH"

# 重新生成首页（使用模板）
cat > $WEB_DIR/index.html << 'HTMLEOF'
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>深渊代行者</title>
    <link rel="stylesheet" href="/novel/abyss/static/style.css">
    <style>
        .book-info { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 40px; border-radius: 15px; margin-bottom: 30px; text-align: center; color: #fff; }
        .book-info h1 { font-size: 2.5em; margin-bottom: 10px; text-shadow: 2px 2px 4px rgba(0,0,0,0.5); }
        .book-info .author { color: #888; margin-bottom: 20px; }
        .book-info .intro { max-width: 600px; margin: 0 auto; line-height: 1.8; color: #ccc; }
        .book-info .tags { margin-top: 20px; }
        .book-info .tag { display: inline-block; background: rgba(255,255,255,0.1); padding: 5px 15px; border-radius: 20px; margin: 5px; font-size: 0.9em; }
        .status-badge { display: inline-block; background: #2196F3; color: white; padding: 5px 15px; border-radius: 20px; font-size: 0.9em; margin-top: 15px; }
        .section-title { font-size: 1.5em; color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; margin: 30px 0 20px 0; }
        .chapter-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; list-style: none; padding: 0; }
        .chapter-list li { background: #f8f9fa; border-radius: 8px; transition: all 0.3s ease; }
        .chapter-list li:hover { background: #e9ecef; transform: translateY(-2px); }
        .chapter-list a { display: block; padding: 12px 15px; color: #333; text-decoration: none; }
        .stats { display: flex; justify-content: center; gap: 30px; margin-top: 20px; color: #aaa; font-size: 0.9em; }
    </style>
</head>
<body>
    <header>
        <div class="book-info">
            <h1>深渊代行者</h1>
            <p class="author">作者：黑猫</p>
            <div class="intro">
                <p>林深被队友背叛，推入了传说中的深渊。</p>
                <p>在深渊里，他与魔王签订了契约，成为了"代行者"。</p>
                <p>从此，他开始了一场关于救赎、选择与希望的旅程。</p>
            </div>
            <div class="tags">
                <span class="tag">奇幻</span>
                <span class="tag">冒险</span>
                <span class="tag">救赎</span>
                <span class="tag">连载中</span>
            </div>
            <div class="stats">
                <span>📝 CHAPTER_COUNT章</span>
                <span>📖 ~WORD_COUNT万字</span>
                <span>⭐ 8.0/10</span>
            </div>
            <span class="status-badge">📖 第三部连载中</span>
        </div>
    </header>
    <main>
HTMLEOF

# 生成章节列表
generate_chapter_list() {
    local start=$1
    local end=$2
    for i in $(seq $start $end); do
        if [ -f "$WEB_DIR/chapters/${i}.html" ]; then
            # 从HTML文件提取标题
            title=$(grep -o '<h1>.*</h1>' "$WEB_DIR/chapters/${i}.html" | head -1 | sed 's/<h1>//;s/<\/h1>//')
            if [ -z "$title" ]; then
                title="第${i}章"
            fi
            echo "            <li><a href=\"/novel/abyss/chapters/${i}.html\">${title}</a></li>"
        fi
    done
}

# 添加第一部标题
echo "        <h2 class=\"section-title\">第一部：代行者（1-20章）✅</h2>" >> $WEB_DIR/index.html
echo "        <ul class=\"chapter-list\">" >> $WEB_DIR/index.html
generate_chapter_list 1 20 >> $WEB_DIR/index.html
echo "        </ul>" >> $WEB_DIR/index.html

# 添加第二部标题
echo "        <h2 class=\"section-title\">第二部：救赎之路（21-40章）✅</h2>" >> $WEB_DIR/index.html
echo "        <ul class=\"chapter-list\">" >> $WEB_DIR/index.html
generate_chapter_list 21 40 >> $WEB_DIR/index.html
echo "        </ul>" >> $WEB_DIR/index.html

# 添加第三部标题
echo "        <h2 class=\"section-title\">第三部：深渊归来（41-100章）📖 连载中</h2>" >> $WEB_DIR/index.html
echo "        <ul class=\"chapter-list\">" >> $WEB_DIR/index.html
generate_chapter_list 41 100 >> $WEB_DIR/index.html
echo "            <li style=\"color: #999; padding: 12px 15px;\">更多章节待更新...</li>" >> $WEB_DIR/index.html
echo "        </ul>" >> $WEB_DIR/index.html

# 添加footer
cat >> $WEB_DIR/index.html << 'FOOTEREOF'
    </main>
    <footer>
        <p>© 2026 深渊代行者 | 第三部连载中</p>
    </footer>
</body>
</html>
FOOTEREOF

# 替换占位符
WORD_COUNT=$((CHAPTER_COUNT * 1500 / 10000))
sed -i "s/CHAPTER_COUNT/$CHAPTER_COUNT/g" $WEB_DIR/index.html
sed -i "s/WORD_COUNT/$WORD_COUNT/g" $WEB_DIR/index.html

echo "✅ 首页已更新"
