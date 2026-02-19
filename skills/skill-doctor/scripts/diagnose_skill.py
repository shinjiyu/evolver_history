#!/usr/bin/env python3
"""
诊断 OpenClaw skill 的问题
用法: python diagnose_skill.py <skill-directory>
"""

import os
import re
import sys
from pathlib import Path
from typing import List, Dict


def check_structure(skill_dir: Path) -> List[Dict]:
    """检查 skill 结构"""
    issues = []
    
    # 检查 SKILL.md
    skill_md = skill_dir / "SKILL.md"
    if not skill_md.exists():
        issues.append({
            'level': 'P0',
            'type': 'structure',
            'desc': 'SKILL.md 不存在',
            'auto_fix': False,
        })
        return issues  # 没有SKILL.md，后续检查无意义
    
    # 检查文件夹名
    folder_name = skill_dir.name
    # 从 SKILL.md 读取 name
    
    # 检查非必要文件
    unnecessary = ['README.md', 'INSTALL.md', 'CHANGELOG.md', 'TODO.md']
    for f in unnecessary:
        if (skill_dir / f).exists():
            issues.append({
                'level': 'P2',
                'type': 'structure',
                'desc': f'存在非必要文件: {f}',
                'auto_fix': True,
                'fix': f'删除 {skill_dir / f}',
            })
    
    return issues


def check_frontmatter(skill_dir: Path) -> List[Dict]:
    """检查 YAML frontmatter"""
    issues = []
    skill_md = skill_dir / "SKILL.md"
    
    if not skill_md.exists():
        return issues
    
    content = skill_md.read_text()
    
    # 检查 frontmatter 存在
    if not content.startswith('---'):
        issues.append({
            'level': 'P0',
            'type': 'frontmatter',
            'desc': '缺少 YAML frontmatter',
            'auto_fix': False,
        })
        return issues
    
    # 提取 frontmatter
    parts = content.split('---', 2)
    if len(parts) < 3:
        issues.append({
            'level': 'P0',
            'type': 'frontmatter',
            'desc': 'frontmatter 格式错误',
            'auto_fix': False,
        })
        return issues
    
    frontmatter = parts[1].strip()
    
    # 检查 name
    if not re.search(r'^name:\s*\S+', frontmatter, re.MULTILINE):
        issues.append({
            'level': 'P0',
            'type': 'frontmatter',
            'desc': '缺少 name 字段',
            'auto_fix': False,
        })
    
    # 检查 description
    if not re.search(r'^description:\s*', frontmatter, re.MULTILINE):
        issues.append({
            'level': 'P0',
            'type': 'frontmatter',
            'desc': '缺少 description 字段',
            'auto_fix': False,
        })
    
    # 检查 description 长度
    desc_match = re.search(r'^description:\s*["\']?(.+?)["\']?\s*$', frontmatter, re.MULTILINE | re.DOTALL)
    if desc_match:
        desc = desc_match.group(1).strip()
        if len(desc) < 20:
            issues.append({
                'level': 'P1',
                'type': 'content',
                'desc': f'description 太短 ({len(desc)} 字符): {desc[:50]}...',
                'auto_fix': False,
            })
        if len(desc) > 300:
            issues.append({
                'level': 'P2',
                'type': 'content',
                'desc': f'description 太长 ({len(desc)} 字符)',
                'auto_fix': False,
            })
        # 检查是否有触发场景
        if '适用于' not in desc and 'use when' not in desc.lower():
            issues.append({
                'level': 'P1',
                'type': 'trigger',
                'desc': 'description 缺少触发场景说明',
                'auto_fix': False,
            })
    
    return issues


def check_scripts(skill_dir: Path) -> List[Dict]:
    """检查脚本文件"""
    issues = []
    scripts_dir = skill_dir / "scripts"
    
    if not scripts_dir.exists():
        return issues
    
    for script in scripts_dir.iterdir():
        if script.is_file() and (script.suffix in ['.sh', '.py'] or not script.suffix):
            # 检查执行权限
            if not os.access(script, os.X_OK):
                issues.append({
                    'level': 'P2',
                    'type': 'script',
                    'desc': f'脚本无执行权限: scripts/{script.name}',
                    'auto_fix': True,
                    'fix': f'chmod +x {script}',
                })
            
            # 检查 shebang
            content = script.read_text()
            if script.suffix == '.sh' and not content.startswith('#!/bin/bash') and not content.startswith('#!/usr/bin/env bash'):
                issues.append({
                    'level': 'P2',
                    'type': 'script',
                    'desc': f'Shell 脚本缺少 shebang: scripts/{script.name}',
                    'auto_fix': False,
                })
            if script.suffix == '.py' and not content.startswith('#!/usr/bin/env python') and not content.startswith('#!/usr/bin/python'):
                issues.append({
                    'level': 'P2',
                    'type': 'script',
                    'desc': f'Python 脚本缺少 shebang: scripts/{script.name}',
                    'auto_fix': False,
                })
    
    return issues


def check_content(skill_dir: Path) -> List[Dict]:
    """检查 SKILL.md 内容"""
    issues = []
    skill_md = skill_dir / "SKILL.md"
    
    if not skill_md.exists():
        return issues
    
    content = skill_md.read_text()
    lines = content.split('\n')
    
    # 检查行数
    if len(lines) > 500:
        issues.append({
            'level': 'P1',
            'type': 'content',
            'desc': f'SKILL.md 过长 ({len(lines)} 行)，建议拆分到 references/',
            'auto_fix': False,
        })
    
    # 检查是否有代码块
    code_blocks = re.findall(r'```', content)
    if len(code_blocks) > 20:
        issues.append({
            'level': 'P2',
            'type': 'content',
            'desc': f'代码块过多 ({len(code_blocks)//2} 个)，考虑移到脚本',
            'auto_fix': False,
        })
    
    return issues


def diagnose_skill(skill_dir: str) -> dict:
    """完整诊断"""
    skill_path = Path(skill_dir)
    
    if not skill_path.exists():
        return {'error': f'Skill 目录不存在: {skill_dir}'}
    
    all_issues = []
    all_issues.extend(check_structure(skill_path))
    all_issues.extend(check_frontmatter(skill_path))
    all_issues.extend(check_scripts(skill_path))
    all_issues.extend(check_content(skill_path))
    
    # 按优先级排序
    priority_order = {'P0': 0, 'P1': 1, 'P2': 2}
    all_issues.sort(key=lambda x: priority_order.get(x['level'], 99))
    
    return {
        'skill': skill_path.name,
        'path': str(skill_path),
        'issues': all_issues,
        'issue_count': len(all_issues),
        'health': 'healthy' if not all_issues else ('needs_fix' if any(i['level'] == 'P0' for i in all_issues) else 'minor_issues'),
    }


def print_report(result: dict):
    """打印诊断报告"""
    print(f"\n{'='*60}")
    print(f"Skill 诊断报告")
    print(f"{'='*60}")
    print(f"Skill: {result.get('skill', 'unknown')}")
    print(f"路径: {result.get('path', 'unknown')}")
    
    health = result.get('health', 'unknown')
    health_emoji = {'healthy': '✅', 'needs_fix': '❌', 'minor_issues': '⚠️'}.get(health, '❓')
    print(f"状态: {health_emoji} {health}")
    print(f"问题数: {result.get('issue_count', 0)}")
    
    issues = result.get('issues', [])
    if issues:
        print(f"\n{'='*60}")
        print("问题列表")
        print(f"{'='*60}")
        
        for i, issue in enumerate(issues, 1):
            level = issue.get('level', '?')
            level_emoji = {'P0': '🔴', 'P1': '🟡', 'P2': '🟢'}.get(level, '⚪')
            auto = '🔧' if issue.get('auto_fix') else '✋'
            print(f"\n{i}. [{level_emoji} {level}] {issue.get('type', 'unknown')}")
            print(f"   {issue.get('desc', 'no description')}")
            print(f"   {auto} {'可自动修复' if issue.get('auto_fix') else '需手动处理'}")
            if issue.get('fix'):
                print(f"   修复: {issue.get('fix')}")
    else:
        print("\n🎉 没有发现问题！")
    
    print(f"\n{'='*60}\n")


def main():
    if len(sys.argv) < 2:
        print("用法: python diagnose_skill.py <skill-directory>")
        print("\n示例:")
        print("  python diagnose_skill.py /root/.openclaw/workspace/skills/log-to-skill")
        sys.exit(1)
    
    skill_dir = sys.argv[1]
    result = diagnose_skill(skill_dir)
    
    if 'error' in result:
        print(f"错误: {result['error']}")
        sys.exit(1)
    
    print_report(result)
    
    # 返回退出码
    sys.exit(0 if result.get('health') == 'healthy' else 1)


if __name__ == '__main__':
    main()
