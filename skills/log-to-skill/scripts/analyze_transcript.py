#!/usr/bin/env python3
"""
分析 OpenClaw session transcript，提取可复用的模式
用法: python analyze_transcript.py <transcript.jsonl>
"""

import json
import sys
from collections import Counter
from pathlib import Path


def load_transcript(path: str) -> list[dict]:
    """加载 jsonl 格式的 transcript"""
    messages = []
    with open(path, 'r') as f:
        for line in f:
            if line.strip():
                messages.append(json.loads(line))
    return messages


def extract_tool_calls(messages: list[dict]) -> list[dict]:
    """提取所有工具调用"""
    tool_calls = []
    for msg in messages:
        content = msg.get('content', [])
        if isinstance(content, list):
            for item in content:
                if item.get('type') == 'toolCall':
                    tool_calls.append({
                        'name': item.get('name'),
                        'arguments': item.get('arguments', {}),
                    })
    return tool_calls


def find_patterns(tool_calls: list[dict]) -> dict:
    """识别工具调用模式"""
    # 统计工具使用频率
    tool_counts = Counter(tc['name'] for tc in tool_calls)
    
    # 找出工具序列
    sequences = []
    current_seq = []
    for tc in tool_calls:
        if tc['name'] in ['read', 'write', 'edit', 'exec']:
            current_seq.append(tc['name'])
        else:
            if len(current_seq) >= 2:
                sequences.append(tuple(current_seq))
            current_seq = []
    
    if len(current_seq) >= 2:
        sequences.append(tuple(current_seq))
    
    seq_counts = Counter(sequences)
    
    return {
        'tool_counts': tool_counts.most_common(10),
        'sequences': seq_counts.most_common(5),
    }


def extract_parameters(tool_calls: list[dict]) -> dict:
    """提取常用参数"""
    params_by_tool = {}
    for tc in tool_calls:
        name = tc['name']
        args = tc['arguments']
        if name not in params_by_tool:
            params_by_tool[name] = []
        params_by_tool[name].append(args)
    
    # 分析每个工具的参数变化
    param_analysis = {}
    for tool, args_list in params_by_tool.items():
        if not args_list:
            continue
        
        # 找出所有参数键
        all_keys = set()
        for args in args_list:
            all_keys.update(args.keys())
        
        # 分析每个参数的值变化
        param_values = {k: [] for k in all_keys}
        for args in args_list:
            for k in all_keys:
                param_values[k].append(args.get(k))
        
        # 判断哪些参数是固定的，哪些是变化的
        fixed = {}
        variable = []
        for k, values in param_values.items():
            unique = set(str(v) for v in values if v is not None)
            if len(unique) == 1:
                fixed[k] = values[0]
            else:
                variable.append(k)
        
        param_analysis[tool] = {
            'fixed': fixed,
            'variable': variable,
            'usage_count': len(args_list),
        }
    
    return param_analysis


def suggest_skill_structure(patterns: dict, params: dict) -> str:
    """建议 skill 结构"""
    lines = ["# 建议的 Skill 结构\n"]
    
    # 根据复杂度建议
    tool_count = sum(count for _, count in patterns['tool_counts'])
    seq_count = len(patterns['sequences'])
    
    if tool_count < 5:
        lines.append("简单流程，建议只用 SKILL.md")
    elif tool_count < 20:
        lines.append("中等复杂，建议 SKILL.md + scripts/")
    else:
        lines.append("复杂流程，建议完整结构：SKILL.md + scripts/ + references/")
    
    lines.append("\n## 高频工具")
    for tool, count in patterns['tool_counts'][:5]:
        lines.append(f"- {tool}: {count} 次")
    
    if patterns['sequences']:
        lines.append("\n## 重复序列")
        for seq, count in patterns['sequences'][:3]:
            lines.append(f"- {' → '.join(seq)}: {count} 次")
    
    lines.append("\n## 参数分析")
    for tool, analysis in list(params.items())[:5]:
        if analysis['variable']:
            lines.append(f"- {tool} 可参数化: {', '.join(analysis['variable'])}")
    
    return '\n'.join(lines)


def main():
    if len(sys.argv) < 2:
        print("用法: python analyze_transcript.py <transcript.jsonl>")
        sys.exit(1)
    
    path = sys.argv[1]
    if not Path(path).exists():
        print(f"文件不存在: {path}")
        sys.exit(1)
    
    print(f"分析 transcript: {path}\n")
    
    messages = load_transcript(path)
    print(f"总消息数: {len(messages)}")
    
    tool_calls = extract_tool_calls(messages)
    print(f"工具调用数: {len(tool_calls)}")
    
    patterns = find_patterns(tool_calls)
    params = extract_parameters(tool_calls)
    
    print("\n" + suggest_skill_structure(patterns, params))


if __name__ == '__main__':
    main()
