#!/bin/bash
# 小说发布脚本

NOVEL_DIR="/root/.openclaw/workspace/novel-project"
WEB_DIR="/var/www/novel/abyss"

# 生成HTML模板
generate_html() {
    local chapter_num=$1
    local title=$2
    local content=$3
    
    cat << EOF
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - 深渊代行者</title>
    <link rel="stylesheet" href="/novel/abyss/chapter-style.css">
</head>
<body>
    <div class="chapter-container">
        <nav class="chapter-nav">
            <a href="/novel/abyss/" class="home-link">← 返回目录</a>
            <div class="nav-buttons">
                $([ $chapter_num -gt 1 ] && echo "<a href=\"/novel/abyss/chapters/$((chapter_num-1)).html\" class=\"prev-chapter\">上一章</a>")
                $([ $chapter_num -lt 40 ] && echo "<a href=\"/novel/abyss/chapters/$((chapter_num+1)).html\" class=\"next-chapter\">下一章</a>")
            </div>
        </nav>
        <article class="content">
            <h1>${title}</h1>
            ${content}
        </article>
        <nav class="chapter-nav bottom">
            <div class="nav-buttons">
                $([ $chapter_num -gt 1 ] && echo "<a href=\"/novel/abyss/chapters/$((chapter_num-1)).html\" class=\"prev-chapter\">上一章</a>")
                $([ $chapter_num -lt 40 ] && echo "<a href=\"/novel/abyss/chapters/$((chapter_num+1)).html\" class=\"next-chapter\">下一章</a>")
            </div>
        </nav>
    </div>
</body>
</html>
EOF
}

# 转换Markdown为HTML
convert_md_to_html() {
    local md_file=$1
    local content=$(cat "$md_file")
    
    # 移除YAML frontmatter和章节标题
    content=$(echo "$content" | sed '/^# /d' | sed '/^---$/d' | sed '/^\*字数/d')
    
    # 转换Markdown段落为HTML
    content=$(echo "$content" | sed 's/^---$/<hr>/g')
    content=$(echo "$content" | sed 's/^\*\*（\(.*\)）\*\*$/<p style="text-align: center; font-weight: bold;">\1<\/p>/g')
    
    # 将段落包装在<p>标签中
    local html_content=""
    local in_paragraph=false
    local current_para=""
    
    while IFS= read -r line; do
        if [[ -z "$line" ]]; then
            if [[ -n "$current_para" ]]; then
                html_content+="<p>$current_para</p>\n"
                current_para=""
            fi
        elif [[ "$line" == "<hr>" ]]; then
            if [[ -n "$current_para" ]]; then
                html_content+="<p>$current_para</p>\n"
                current_para=""
            fi
            html_content+="<div class=\"divider\">* * *</div>\n"
        elif [[ "$line" =~ ^\<p\ style ]]; then
            if [[ -n "$current_para" ]]; then
                html_content+="<p>$current_para</p>\n"
                current_para=""
            fi
            html_content+="$line\n"
        else
            current_para+="$line"
        fi
    done <<< "$content"
    
    if [[ -n "$current_para" ]]; then
        html_content+="<p>$current_para</p>"
    fi
    
    echo -e "$html_content"
}

# 发布章节
publish_chapter() {
    local chapter_num=$1
    local md_file="$NOVEL_DIR/chapters/chapter-$(printf '%03d' $chapter_num).md"
    
    if [[ ! -f "$md_file" ]]; then
        echo "⚠️ 章节 $chapter_num 源文件不存在"
        return
    fi
    
    # 提取标题
    local title=$(grep "^# " "$md_file" | head -1 | sed 's/^# //')
    if [[ -z "$title" ]]; then
        title="第${chapter_num}章"
    fi
    
    # 转换内容
    local content=$(convert_md_to_html "$md_file")
    
    # 生成HTML
    local html_file="$WEB_DIR/chapters/${chapter_num}.html"
    generate_html "$chapter_num" "$title" "$content" > "$html_file"
    
    echo "✅ 已发布: $title → $html_file"
}

echo "📚 开始发布《深渊代行者》..."
echo ""

# 发布第14-60章（可扩展）
for i in $(seq 14 60); do
    publish_chapter $i
done

echo ""
echo "🎉 发布完成！"
echo "📖 访问: https://kuroneko.chat/novel/abyss/"
