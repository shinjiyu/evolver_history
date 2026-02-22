#!/usr/bin/env node
/**
 * 深渊代行者 - 批注汇总报告生成器
 * 用途：分析批注数据，生成修改建议报告
 */

const fs = require('fs').promises;
const path = require('path');

const DATA_DIR = '/var/www/novel/abyss/api/data';
const ANNOTATIONS_FILE = path.join(DATA_DIR, 'annotations.json');
const REPORT_DIR = path.join(__dirname, 'annotation-reports');

async function loadAnnotations() {
    try {
        const data = await fs.readFile(ANNOTATIONS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.log('⚠️  暂无批注数据');
        return { annotations: [], stats: {} };
    }
}

function getTypeLabel(type) {
    const labels = {
        typo: '🐛 错别字',
        suggestion: '💡 建议',
        question: '❓ 疑问',
        like: '❤️ 喜欢',
        comment: '💬 评论',
        correction: '✏️ 修正'
    };
    return labels[type] || type;
}

function getPriority(type) {
    const priorities = {
        typo: 1,      // 高优先级
        correction: 1,
        question: 2,  // 中优先级
        suggestion: 2,
        comment: 3,   // 低优先级
        like: 3
    };
    return priorities[type] || 3;
}

async function generateReport() {
    console.log('📊 批注汇总报告生成器\n');
    console.log('=' .repeat(60));
    
    const data = await loadAnnotations();
    const annotations = data.annotations;
    
    if (annotations.length === 0) {
        console.log('\n✅ 当前没有批注需要处理\n');
        return;
    }
    
    // 按章节分组
    const byChapter = {};
    annotations.forEach(ann => {
        const ch = ann.chapter;
        if (!byChapter[ch]) {
            byChapter[ch] = [];
        }
        byChapter[ch].push(ann);
    });
    
    // 按类型统计
    const byType = {};
    annotations.forEach(ann => {
        const type = ann.type;
        if (!byType[type]) {
            byType[type] = [];
        }
        byType[type].push(ann);
    });
    
    // 按状态统计
    const byStatus = { pending: 0, accepted: 0, rejected: 0 };
    annotations.forEach(ann => {
        const status = ann.status || 'pending';
        byStatus[status]++;
    });
    
    // 打印摘要
    console.log(`\n📈 总体统计\n`);
    console.log(`总批注数：${annotations.length}`);
    console.log(`待处理：${byStatus.pending}`);
    console.log(`已采纳：${byStatus.accepted}`);
    console.log(`已拒绝：${byStatus.rejected}`);
    
    console.log(`\n📝 按类型统计\n`);
    Object.entries(byType)
        .sort((a, b) => getPriority(a[0]) - getPriority(b[0]))
        .forEach(([type, items]) => {
            console.log(`${getTypeLabel(type)}: ${items.length} 条`);
        });
    
    console.log(`\n📖 按章节统计\n`);
    Object.keys(byChapter)
        .map(Number)
        .sort((a, b) => a - b)
        .forEach(ch => {
            const items = byChapter[ch];
            const pending = items.filter(i => i.status === 'pending').length;
            console.log(`第 ${ch} 章: ${items.length} 条 (待处理: ${pending})`);
        });
    
    // 生成详细报告
    await fs.mkdir(REPORT_DIR, { recursive: true });
    
    const timestamp = new Date().toISOString().slice(0, 10);
    const reportFile = path.join(REPORT_DIR, `report-${timestamp}.md`);
    
    let report = `# 批注汇总报告 - ${timestamp}\n\n`;
    report += `## 📊 总体统计\n\n`;
    report += `- **总批注数**: ${annotations.length}\n`;
    report += `- **待处理**: ${byStatus.pending}\n`;
    report += `- **已采纳**: ${byStatus.accepted}\n`;
    report += `- **已拒绝**: ${byStatus.rejected}\n\n`;
    
    report += `## 🐛 高优先级 - 错别字/修正\n\n`;
    const typoAnnotations = [...(byType.typo || []), ...(byType.correction || [])];
    if (typoAnnotations.length > 0) {
        typoAnnotations.forEach(ann => {
            report += `### 第 ${ann.chapter} 章\n`;
            report += `**原文**: "${ann.selectedText || ann.paragraph_text}"\n\n`;
            report += `**批注**: ${ann.content}\n\n`;
            report += `**时间**: ${ann.createdAt || ann.created_at}\n\n`;
            report += `---\n\n`;
        });
    } else {
        report += `_暂无错别字批注_\n\n`;
    }
    
    report += `## 💡 中优先级 - 建议/疑问\n\n`;
    const suggestionAnnotations = [...(byType.suggestion || []), ...(byType.question || [])];
    if (suggestionAnnotations.length > 0) {
        suggestionAnnotations.forEach(ann => {
            report += `### 第 ${ann.chapter} 章\n`;
            report += `**原文**: "${ann.selectedText || ann.paragraph_text}"\n\n`;
            report += `**批注**: ${ann.content}\n\n`;
            report += `**时间**: ${ann.createdAt || ann.created_at}\n\n`;
            report += `---\n\n`;
        });
    } else {
        report += `_暂无建议批注_\n\n`;
    }
    
    report += `## ❤️ 低优先级 - 评论/喜欢\n\n`;
    const likeAnnotations = [...(byType.like || []), ...(byType.comment || [])];
    if (likeAnnotations.length > 0) {
        report += `共 ${likeAnnotations.length} 条\n\n`;
    } else {
        report += `_暂无评论批注_\n\n`;
    }
    
    report += `## 📝 修改建议清单\n\n`;
    report += `| 章节 | 类型 | 原文 | 批注 | 状态 |\n`;
    report += `|------|------|------|------|------|\n`;
    
    annotations
        .filter(ann => getPriority(ann.type) <= 2)
        .sort((a, b) => {
            if (a.chapter !== b.chapter) return a.chapter - b.chapter;
            return getPriority(a.type) - getPriority(b.type);
        })
        .forEach(ann => {
            const text = (ann.selectedText || ann.paragraph_text || '').substring(0, 20);
            const content = ann.content.substring(0, 30);
            report += `| ${ann.chapter} | ${getTypeLabel(ann.type)} | ${text}... | ${content}... | ${ann.status} |\n`;
        });
    
    await fs.writeFile(reportFile, report, 'utf8');
    console.log(`\n✅ 详细报告已生成: ${reportFile}\n`);
    
    // 生成 JSON 格式供 Agent 使用
    const agentData = {
        generatedAt: new Date().toISOString(),
        stats: {
            total: annotations.length,
            pending: byStatus.pending,
            byPriority: {
                high: typoAnnotations.length,
                medium: suggestionAnnotations.length,
                low: likeAnnotations.length
            }
        },
        actionItems: typoAnnotations.map(ann => ({
            chapter: ann.chapter,
            type: ann.type,
            originalText: ann.selectedText || ann.paragraph_text,
            suggestion: ann.content,
            priority: 'high',
            id: ann.id
        }))
    };
    
    const agentFile = path.join(REPORT_DIR, 'agent-data.json');
    await fs.writeFile(agentFile, JSON.stringify(agentData, null, 2), 'utf8');
    console.log(`🤖 Agent 数据已生成: ${agentFile}\n`);
}

// 执行
generateReport().catch(err => {
    console.error('❌ 生成报告失败:', err);
    process.exit(1);
});
