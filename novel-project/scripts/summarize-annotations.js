#!/usr/bin/env node
/**
 * 深渊代行者 - 批注汇总脚本
 * 读取批注数据，按类型分类，生成修改建议报告
 */

const fs = require('fs').promises;
const path = require('path');

const ANNOTATIONS_FILE = '/var/www/novel/abyss/api/data/annotations.json';
const OUTPUT_DIR = '/root/.openclaw/workspace/novel-project/annotation-reports';

async function main() {
    console.log('📝 批注汇总分析\n');
    console.log('='.repeat(60));
    
    // 读取批注数据
    let data;
    try {
        const content = await fs.readFile(ANNOTATIONS_FILE, 'utf8');
        data = JSON.parse(content);
    } catch (error) {
        console.log('⚠️  无法读取批注数据或数据为空\n');
        console.log('✅ 批注系统已就绪，等待读者批注\n');
        return;
    }
    
    const annotations = data.annotations || [];
    
    if (annotations.length === 0) {
        console.log('\n✅ 当前没有批注\n');
        console.log('💡 提示：读者可以在阅读时选中文字添加批注\n');
        return;
    }
    
    // 按类型分类
    const byType = {
        typo: [],      // 错别字
        suggestion: [], // 建议
        question: [],   // 疑问
        like: [],       // 喜欢
        comment: []     // 评论
    };
    
    annotations.forEach(ann => {
        const type = ann.type || 'comment';
        if (byType[type]) {
            byType[type].push(ann);
        }
    });
    
    // 按章节分类
    const byChapter = {};
    annotations.forEach(ann => {
        const ch = ann.chapter;
        if (!byChapter[ch]) byChapter[ch] = [];
        byChapter[ch].push(ann);
    });
    
    // 按状态统计
    const byStatus = {
        pending: annotations.filter(a => a.status === 'pending').length,
        accepted: annotations.filter(a => a.status === 'accepted').length,
        rejected: annotations.filter(a => a.status === 'rejected').length
    };
    
    // 打印摘要
    console.log('\n📊 总体统计\n');
    console.log(`总批注数：${annotations.length}`);
    console.log(`待处理：${byStatus.pending}`);
    console.log(`已采纳：${byStatus.accepted}`);
    console.log(`已拒绝：${byStatus.rejected}`);
    
    console.log('\n📋 按类型分类\n');
    console.log(`🐛 错别字：${byType.typo.length} 条`);
    console.log(`💡 建议：${byType.suggestion.length} 条`);
    console.log(`❓ 疑问：${byType.question.length} 条`);
    console.log(`❤️ 喜欢：${byType.like.length} 条`);
    console.log(`💬 评论：${byType.comment.length} 条`);
    
    console.log('\n📖 按章节分布\n');
    Object.keys(byChapter)
        .map(Number)
        .sort((a, b) => a - b)
        .forEach(ch => {
            const items = byChapter[ch];
            console.log(`第 ${ch} 章：${items.length} 条`);
        });
    
    // 生成详细报告
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
    
    const timestamp = new Date().toISOString().slice(0, 10);
    const reportFile = path.join(OUTPUT_DIR, `summary-${timestamp}.md`);
    
    let report = `# 批注汇总报告 - ${timestamp}\n\n`;
    report += `## 📊 总体统计\n\n`;
    report += `- **总批注数**: ${annotations.length}\n`;
    report += `- **待处理**: ${byStatus.pending}\n`;
    report += `- **已采纳**: ${byStatus.accepted}\n`;
    report += `- **已拒绝**: ${byStatus.rejected}\n\n`;
    
    // 高优先级：错别字
    if (byType.typo.length > 0) {
        report += `## 🐛 高优先级 - 错别字 (${byType.typo.length} 条)\n\n`;
        byType.typo.forEach(ann => {
            report += `### 第 ${ann.chapter} 章\n`;
            report += `**选中文字**: "${ann.selectedText || ann.paragraph_text}"\n\n`;
            report += `**批注内容**: ${ann.content}\n\n`;
            report += `**状态**: ${ann.status || 'pending'}\n\n`;
            report += `**提交时间**: ${ann.createdAt || ann.created_at}\n\n`;
            report += `---\n\n`;
        });
    }
    
    // 中优先级：建议和疑问
    const mediumPriority = [...byType.suggestion, ...byType.question];
    if (mediumPriority.length > 0) {
        report += `## 💡 中优先级 - 建议与疑问 (${mediumPriority.length} 条)\n\n`;
        mediumPriority.forEach(ann => {
            const typeLabel = ann.type === 'suggestion' ? '建议' : '疑问';
            report += `### 第 ${ann.chapter} 章 [${typeLabel}]\n`;
            report += `**选中文字**: "${ann.selectedText || ann.paragraph_text}"\n\n`;
            report += `**批注内容**: ${ann.content}\n\n`;
            report += `**状态**: ${ann.status || 'pending'}\n\n`;
            report += `---\n\n`;
        });
    }
    
    // 低优先级：喜欢和评论
    const lowPriority = [...byType.like, ...byType.comment];
    if (lowPriority.length > 0) {
        report += `## ❤️ 低优先级 - 喜欢与评论 (${lowPriority.length} 条)\n\n`;
        report += `_共收到 ${lowPriority.length} 条正面反馈_\n\n`;
    }
    
    // 修改建议清单
    const actionItems = [...byType.typo, ...byType.suggestion, ...byType.question]
        .sort((a, b) => {
            if (a.chapter !== b.chapter) return a.chapter - b.chapter;
            const priority = { typo: 1, suggestion: 2, question: 2 };
            return (priority[a.type] || 3) - (priority[b.type] || 3);
        });
    
    if (actionItems.length > 0) {
        report += `## 📝 修改建议清单\n\n`;
        report += `| 章节 | 类型 | 选中文字 | 批注 | 状态 |\n`;
        report += `|------|------|----------|------|------|\n`;
        
        actionItems.forEach(ann => {
            const text = (ann.selectedText || ann.paragraph_text || '').substring(0, 15);
            const content = (ann.content || '').substring(0, 20);
            const typeLabel = { typo: '错字', suggestion: '建议', question: '疑问' }[ann.type] || ann.type;
            report += `| ${ann.chapter} | ${typeLabel} | ${text}... | ${content}... | ${ann.status || 'pending'} |\n`;
        });
    }
    
    await fs.writeFile(reportFile, report, 'utf8');
    console.log(`\n✅ 详细报告已生成: ${reportFile}\n`);
    
    // 生成 JSON 数据供 Agent 使用
    const agentData = {
        generatedAt: new Date().toISOString(),
        stats: {
            total: annotations.length,
            pending: byStatus.pending,
            accepted: byStatus.accepted,
            rejected: byStatus.rejected,
            byType: {
                typo: byType.typo.length,
                suggestion: byType.suggestion.length,
                question: byType.question.length,
                like: byType.like.length,
                comment: byType.comment.length
            },
            byPriority: {
                high: byType.typo.length,
                medium: byType.suggestion.length + byType.question.length,
                low: byType.like.length + byType.comment.length
            }
        },
        actionItems: actionItems.map(ann => ({
            id: ann.id,
            chapter: ann.chapter,
            type: ann.type,
            originalText: ann.selectedText || ann.paragraph_text,
            suggestion: ann.content,
            status: ann.status || 'pending',
            priority: ann.type === 'typo' ? 'high' : 'medium',
            createdAt: ann.createdAt || ann.created_at
        }))
    };
    
    const agentFile = path.join(OUTPUT_DIR, 'agent-summary.json');
    await fs.writeFile(agentFile, JSON.stringify(agentData, null, 2), 'utf8');
    console.log(`🤖 Agent 数据已生成: ${agentFile}\n`);
    
    // 打印关键信息
    if (byType.typo.length > 0) {
        console.log('⚠️  发现错别字批注，建议优先处理\n');
    }
    
    if (byStatus.pending > 0) {
        console.log(`💡 还有 ${byStatus.pending} 条待处理批注\n`);
    }
}

// 执行
main().catch(err => {
    console.error('❌ 执行失败:', err);
    process.exit(1);
});
