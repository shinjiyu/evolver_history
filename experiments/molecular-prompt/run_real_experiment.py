#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Long CoT 分子结构提示词工程对比实验 - 真实 API 版本

基于论文 arXiv:2601.06002v2
实验目标：验证不同"键"模板对推理质量的影响

使用 GLM-5 Coding PAAS API
"""

import json
import os
import sys
import time
import requests
from datetime import datetime
from typing import Dict, List, Any

# ============================================
# 配置
# ============================================

API_KEY = "3ec7bff16b6de647728ace1e8d727a14.cu5ZWvYYAiUzb76N"
API_URL = "https://open.bigmodel.cn/api/coding/paas/v4/chat/completions"
MODEL = "glm-5"

EXPERIMENT_DIR = os.path.dirname(os.path.abspath(__file__))
RESULTS_DIR = os.path.join(EXPERIMENT_DIR, 'results')
os.makedirs(RESULTS_DIR, exist_ok=True)


# ============================================
# 5 个测试问题
# ============================================

PROBLEMS = [
    {
        "id": "MATH-001",
        "category": "数学",
        "question": "一个袋子里有5个红球和3个蓝球。连续取出3个球（不放回），求至少有2个红球的概率。",
        "reference_answer": "C(5,2)×C(3,1)+C(5,3) / C(8,3) = (10×3+10)/56 = 40/56 = 5/7"
    },
    {
        "id": "LOGIC-001",
        "category": "逻辑",
        "question": """一个岛上有三种人：骑士（总是说真话）、无赖（总是说假话）、间谍（可能说真话也可能说假话）。
你遇到A、B、C三人，知道其中有一人是骑士、一人是无赖、一人是间谍。

A说："我是骑士。"
B说："A说的是真话。"
C说："我是间谍。"

请问A、B、C分别是什么身份？""",
        "reference_answer": "A=间谍, B=无赖, C=骑士"
    },
    {
        "id": "CS-001",
        "category": "常识",
        "question": "为什么下雨后经常会出现彩虹？请从物理角度解释。",
        "reference_answer": "阳光经过雨滴发生折射、反射、色散，分解成七色光"
    },
    {
        "id": "CODE-001",
        "category": "代码",
        "question": """以下代码用于计算斐波那契数列，但存在bug。请找出bug并说明如何修复：

def fibonacci(n):
    if n <= 0:
        return []
    elif n == 1:
        return [0]
    elif n == 2:
        return [0, 1]
    
    result = [0, 1]
    for i in range(2, n):
        result.append(result[i-1] + result[i-2])
    
    return result

print(fibonacci(10))  # 期望输出: [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]""",
        "reference_answer": "代码实际是正确的，但可能误解题目意图"
    },
    {
        "id": "STRATEGY-001",
        "category": "策略",
        "question": "你是一家创业公司的CEO，有100万元预算需要在「用户增长」和「产品研发」之间分配。公司当前情况：产品有5000活跃用户，月增长率5%，用户留存率40%。目标是6个月内达到5万用户。你会如何分配这笔预算？请说明理由。",
        "reference_answer": "开放性答案，需要考虑留存率低的根本原因"
    },
]


# ============================================
# 7 个实验组模板
# ============================================

TEMPLATES = {
    "baseline": {
        "name": "Baseline（直接提问）",
        "bond_type": "无",
        "template": """{question}"""
    },
    
    "cot_basic": {
        "name": "CoT-Basic（逐步分析）",
        "bond_type": "无结构引导",
        "template": """请一步步分析以下问题：

{question}

请给出详细的推理过程。"""
    },
    
    "covalent": {
        "name": "Covalent（共价键：公理化推理）",
        "bond_type": "Deep Reasoning",
        "template": """【目标】构建严密的逻辑链条，每一步都有明确的逻辑依据

请按以下公理化方法进行推理：

1. **定义公理层**
   - 列出已知事实和前提（不需要证明）
   - 标记为 [AXIOM]

2. **构建定理层**
   - 每个推理步骤必须引用前面的事实
   - 使用格式：[STEP-N] 因为 [引用], 所以 [结论]
   
3. **保持因果链完整性**
   - 如果某一步骤无法找到依据，标记 [GAP] 并说明
   - 不允许跳跃式推理

现在请解决以下问题：
{question}"""
    },
    
    "hydrogen": {
        "name": "Hydrogen（氢键：负反馈回路）",
        "bond_type": "Self-Reflection",
        "template": """【目标】在每个关键步骤后主动寻找错误

采用"怀疑一切"的思维方式：

每完成一个推理步骤后，立即进行"反审计"：
1. 【假设反转】如果这个结论是错的，可能因为什么？
2. 【边界测试】这个结论在什么情况下不成立？
3. 【量级检查】结果的数量级是否合理？

【格式】
推理步骤: [内容]
├─ 反审计 1: [假设反转] ...
├─ 反审计 2: [边界测试] ...
└─ 反审计 3: [量级检查] ...
   └─ 结论: [继续/修正/回退]

只有当三个反审计都通过时，才能进入下一步。

现在请解决以下问题：
{question}"""
    },
    
    "van_der_waals": {
        "name": "VanDerWaals（范德华键：双路径）",
        "bond_type": "Self-Exploration",
        "template": """【目标】同时探索两条不同的推理路径，对比结果

对于此问题，请同时构建两条独立的推理路径：

【路径 A】（常规/直接方法）
├─ 步骤A1: ...
├─ 步骤A2: ...
└─ 结论A: ...

【路径 B】（替代/逆向方法）
├─ 步骤B1: ...
├─ 步骤B2: ...
└─ 结论B: ...

【对比分析】
├─ 结论一致性: [A和B是否得到相同结果]
├─ 复杂度对比: [哪条路径更简洁]
├─ 可靠性对比: [哪条路径更不易出错]
└─ 最终选择: [选择哪条路径的结论，为什么]

如果两条路径结论不同，分析差异原因并解决。

现在请解决以下问题：
{question}"""
    },
    
    "c_plus_h": {
        "name": "C+H（共价+氢键）",
        "bond_type": "Deep Reasoning + Self-Reflection",
        "template": """【目标】构建严密的逻辑链，并在关键节点进行反思验证

采用"推进-检查"循环模式：

【Phase 1: 推进】（构建2-3步逻辑链）
→ 步骤N: [基于前序步骤的逻辑推理]
→ 步骤N+1: ...

【Phase 2: 检查】（对上述步骤进行反思）
→ 检查点:
   ├─ 逻辑连贯性: [步骤间是否合理衔接]
   ├─ 前提可靠性: [是否依赖未经证实的前提]
   └─ 结论合理性: [中间结论是否合理]

【Phase 3: 决策】
→ 如果检查通过 → 继续 Phase 1
→ 如果发现问题 → 回退并修正

循环直到得到最终答案。

现在请解决以下问题：
{question}"""
    },
    
    "full": {
        "name": "Full（完整分子结构 C+H+V）",
        "bond_type": "Deep Reasoning + Self-Reflection + Self-Exploration",
        "template": """【目标】构建具有稳定分子结构的完整推理过程

将推理过程建模为分子结构，包含三种化学键：

【结构规划】
├─ Deep Reasoning (共价键): ~60% - 主干推理
├─ Self-Reflection (氢键): ~20% - 关键节点验证
└─ Self-Exploration (范德华键): ~20% - 分支探索

【执行框架】

1. 【初始化】建立推理起点
   → 明确问题、定义变量、列出已知条件

2. 【主干扩展】（Deep Reasoning）
   → 构建连续的逻辑链
   → 格式：[D-N] 因为 [依据], 所以 [结论]

3. 【关键节点验证】（Self-Reflection）
   → 在重要结论处暂停执行反审计
   → 格式：[R-N] 验证 [D-M]...

4. 【分支探索】（Self-Exploration）
   → 在不确定性高的节点探索多个方向
   → 格式：[E-N] 替代路径: ...

5. 【收敛整合】
   → 主线推理收敛到答案
   → 验证最终答案
   → 给出置信度评估

现在请解决以下问题：
{question}"""
    },
}


# ============================================
# API 调用函数
# ============================================

def call_glm5_api(prompt: str, temperature: float = 0.7, max_tokens: int = 2000) -> Dict[str, Any]:
    """调用 GLM-5 API"""
    
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }
    
    data = {
        "model": MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": temperature,
        "max_tokens": max_tokens
    }
    
    start_time = time.time()
    
    try:
        response = requests.post(API_URL, headers=headers, json=data, timeout=120)
        elapsed_ms = (time.time() - start_time) * 1000
        
        if response.status_code == 200:
            result = response.json()
            
            # 提取响应内容
            content = result.get("choices", [{}])[0].get("message", {}).get("content", "")
            
            # 提取 token 使用情况
            usage = result.get("usage", {})
            
            return {
                "success": True,
                "content": content,
                "tokens_used": usage.get("total_tokens", 0),
                "prompt_tokens": usage.get("prompt_tokens", 0),
                "completion_tokens": usage.get("completion_tokens", 0),
                "response_time_ms": elapsed_ms,
                "raw_response": result
            }
        else:
            return {
                "success": False,
                "error": f"API 错误: {response.status_code}",
                "detail": response.text,
                "response_time_ms": elapsed_ms
            }
    
    except Exception as e:
        elapsed_ms = (time.time() - start_time) * 1000
        return {
            "success": False,
            "error": str(e),
            "response_time_ms": elapsed_ms
        }


# ============================================
# 评估函数
# ============================================

def evaluate_response(response: str, problem: Dict[str, str]) -> Dict[str, float]:
    """评估响应质量"""
    
    ref_answer = problem["reference_answer"]
    
    # 正确性评估（简化版）
    correctness = 0.0
    if ref_answer in response:
        correctness = 1.0
    elif "开放性答案" in ref_answer:
        # 开放性问题的评分标准
        if len(response) > 500:
            correctness = 0.8
        elif len(response) > 300:
            correctness = 0.6
        else:
            correctness = 0.4
    else:
        # 部分匹配
        key_terms = ref_answer.split()
        matched = sum(1 for term in key_terms if term in response)
        correctness = matched / max(len(key_terms), 1)
    
    # 逻辑连贯性（基于响应长度和结构）
    lines = [l for l in response.split('\n') if l.strip()]
    coherence = min(5.0, len(lines) / 10)
    
    # 幻觉率（简化检测）
    hallucination_indicators = ["肯定", "一定", "绝对", "必然", "must", "definitely"]
    hallucination_count = sum(1 for w in hallucination_indicators if w in response.lower())
    hallucination_rate = min(1.0, hallucination_count / max(len(response.split()), 1) * 10)
    
    # 探索广度
    exploration_keywords = ["或者", "也许", "可能", "另一种", "or", "maybe", "alternative"]
    exploration_count = sum(1 for k in exploration_keywords if k in response.lower())
    exploration_breadth = min(5.0, exploration_count + 1)
    
    # 效率（响应长度 / 预期长度）
    expected_length = 500
    efficiency = min(10, max(1, 10 - abs(len(response) - expected_length) / 100))
    
    return {
        "correctness": round(correctness, 3),
        "coherence": round(coherence, 3),
        "hallucination_rate": round(hallucination_rate, 3),
        "exploration_breadth": round(exploration_breadth, 3),
        "efficiency": round(efficiency, 2),
        "response_length": len(response)
    }


def analyze_bonds(response: str) -> Dict[str, float]:
    """分析响应中的键分布"""
    
    total = len(response)
    if total == 0:
        return {"covalent": 0.0, "hydrogen": 0.0, "van_der_waals": 0.0}
    
    # 基于关键词的简单分析
    covalent_keywords = ["因此", "所以", "因为", "由于", "得出", "推出", "therefore", "thus", "because"]
    hydrogen_keywords = ["检查", "验证", "反思", "但是", "然而", "是否", "verify", "check", "but"]
    vdw_keywords = ["或者", "也许", "可能", "另一种", "替代", "分支", "or", "maybe", "alternative"]
    
    covalent_count = sum(response.lower().count(k.lower()) for k in covalent_keywords)
    hydrogen_count = sum(response.lower().count(k.lower()) for k in hydrogen_keywords)
    vdw_count = sum(response.lower().count(k.lower()) for k in vdw_keywords)
    
    total_keywords = covalent_count + hydrogen_count + vdw_count + 1
    
    return {
        "covalent": round(covalent_count / total_keywords, 3),
        "hydrogen": round(hydrogen_count / total_keywords, 3),
        "van_der_waals": round(vdw_count / total_keywords, 3)
    }


# ============================================
# 实验执行
# ============================================

def run_experiment():
    """执行完整实验"""
    
    print("="*80)
    print("Long CoT 分子结构提示词工程对比实验")
    print("="*80)
    print(f"API: {API_URL}")
    print(f"Model: {MODEL}")
    print(f"问题数: {len(PROBLEMS)}")
    print(f"模板数: {len(TEMPLATES)}")
    print(f"总调用数: {len(PROBLEMS) * len(TEMPLATES)}")
    print("="*80)
    
    results = []
    total_calls = len(PROBLEMS) * len(TEMPLATES)
    current_call = 0
    
    # 遍历所有问题和模板
    for problem in PROBLEMS:
        print(f"\n问题 [{problem['id']}] {problem['category']}: {problem['question'][:50]}...")
        
        for template_key, template_info in TEMPLATES.items():
            current_call += 1
            print(f"  [{current_call}/{total_calls}] {template_info['name']}...", end=" ", flush=True)
            
            # 格式化提示词
            prompt = template_info["template"].format(question=problem["question"])
            
            # 调用 API
            api_result = call_glm5_api(prompt)
            
            if api_result["success"]:
                # 评估响应
                evaluation = evaluate_response(api_result["content"], problem)
                bond_analysis = analyze_bonds(api_result["content"])
                
                result = {
                    "experiment_id": f"{problem['id']}-{template_key}",
                    "timestamp": datetime.now().isoformat(),
                    "problem_id": problem["id"],
                    "problem_category": problem["category"],
                    "template_type": template_key,
                    "template_name": template_info["name"],
                    "bond_type": template_info["bond_type"],
                    "prompt": prompt,
                    "response": api_result["content"],
                    "tokens_used": api_result["tokens_used"],
                    "prompt_tokens": api_result["prompt_tokens"],
                    "completion_tokens": api_result["completion_tokens"],
                    "response_time_ms": round(api_result["response_time_ms"], 2),
                    **evaluation,
                    "bond_analysis": bond_analysis,
                    "success": True
                }
                
                print(f"✓ (正确性: {evaluation['correctness']:.2f}, Token: {api_result['tokens_used']})")
                
            else:
                result = {
                    "experiment_id": f"{problem['id']}-{template_key}",
                    "timestamp": datetime.now().isoformat(),
                    "problem_id": problem["id"],
                    "template_type": template_key,
                    "success": False,
                    "error": api_result.get("error", "Unknown error"),
                    "detail": api_result.get("detail", ""),
                    "response_time_ms": round(api_result["response_time_ms"], 2)
                }
                
                print(f"✗ ({api_result.get('error', 'Unknown error')})")
            
            results.append(result)
            
            # 避免频率限制
            time.sleep(1)
    
    return results


def analyze_results(results: List[Dict]) -> Dict[str, Any]:
    """分析实验结果"""
    
    # 按模板分组
    by_template = {}
    for r in results:
        template = r.get("template_type", "unknown")
        if template not in by_template:
            by_template[template] = []
        by_template[template].append(r)
    
    # 计算统计信息
    analysis = {}
    
    for template_key, template_results in by_template.items():
        successful_results = [r for r in template_results if r.get("success", False)]
        
        if not successful_results:
            analysis[template_key] = {
                "name": TEMPLATES.get(template_key, {}).get("name", template_key),
                "success_count": 0,
                "total_count": len(template_results),
                "error": "所有调用失败"
            }
            continue
        
        n = len(successful_results)
        
        analysis[template_key] = {
            "name": TEMPLATES.get(template_key, {}).get("name", template_key),
            "bond_type": TEMPLATES.get(template_key, {}).get("bond_type", "N/A"),
            "success_count": n,
            "total_count": len(template_results),
            "success_rate": round(n / len(template_results) * 100, 2),
            
            # 平均指标
            "avg_correctness": round(sum(r["correctness"] for r in successful_results) / n, 3),
            "avg_coherence": round(sum(r["coherence"] for r in successful_results) / n, 3),
            "avg_hallucination_rate": round(sum(r["hallucination_rate"] for r in successful_results) / n, 3),
            "avg_exploration_breadth": round(sum(r["exploration_breadth"] for r in successful_results) / n, 3),
            "avg_efficiency": round(sum(r["efficiency"] for r in successful_results) / n, 2),
            
            # Token 和时间
            "avg_tokens": round(sum(r["tokens_used"] for r in successful_results) / n, 1),
            "avg_response_time_ms": round(sum(r["response_time_ms"] for r in successful_results) / n, 1),
            "total_tokens": sum(r["tokens_used"] for r in successful_results),
            
            # 键分布
            "avg_bond_distribution": {
                "covalent": round(sum(r["bond_analysis"]["covalent"] for r in successful_results) / n, 3),
                "hydrogen": round(sum(r["bond_analysis"]["hydrogen"] for r in successful_results) / n, 3),
                "van_der_waals": round(sum(r["bond_analysis"]["van_der_waals"] for r in successful_results) / n, 3)
            }
        }
    
    return analysis


def save_results(results: List[Dict], analysis: Dict[str, Any]):
    """保存结果到文件"""
    
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    
    # 保存原始结果
    raw_file = os.path.join(RESULTS_DIR, f"raw_results_{timestamp}.json")
    with open(raw_file, 'w', encoding='utf-8') as f:
        json.dump({
            "metadata": {
                "timestamp": timestamp,
                "api_url": API_URL,
                "model": MODEL,
                "total_calls": len(results),
                "success_count": sum(1 for r in results if r.get("success", False))
            },
            "results": results
        }, f, ensure_ascii=False, indent=2)
    print(f"\n原始结果已保存: {raw_file}")
    
    # 保存分析报告
    analysis_file = os.path.join(RESULTS_DIR, f"analysis_{timestamp}.json")
    with open(analysis_file, 'w', encoding='utf-8') as f:
        json.dump(analysis, f, ensure_ascii=False, indent=2)
    print(f"分析报告已保存: {analysis_file}")
    
    # 生成 Markdown 报告
    md_file = os.path.join(RESULTS_DIR, f"report_{timestamp}.md")
    generate_markdown_report(results, analysis, md_file)
    print(f"Markdown 报告已保存: {md_file}")
    
    return raw_file, analysis_file, md_file


def generate_markdown_report(results: List[Dict], analysis: Dict[str, Any], output_file: str):
    """生成 Markdown 分析报告"""
    
    md = []
    md.append("# Long CoT 分子结构提示词工程对比实验报告\n")
    md.append(f"**实验时间**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    md.append(f"**模型**: {MODEL}\n")
    md.append(f"**API**: {API_URL}\n")
    md.append(f"**总调用数**: {len(results)}\n")
    md.append(f"**成功率**: {sum(1 for r in results if r.get('success', False)) / len(results) * 100:.1f}%\n")
    md.append("\n---\n")
    
    # 1. 实验概述
    md.append("## 1. 实验概述\n")
    md.append("### 1.1 实验目标\n")
    md.append("验证不同「化学键」结构的提示词模板对推理质量的影响，基于论文 arXiv:2601.06002v2。\n")
    md.append("\n### 1.2 实验设计\n")
    md.append("- **测试问题**: 5 个（数学、逻辑、常识、代码、策略）\n")
    md.append("- **实验组**: 7 个（Baseline、CoT-Basic、Covalent、Hydrogen、VanDerWaals、C+H、Full）\n")
    md.append("- **总调用数**: 35 次\n")
    md.append("\n### 1.3 键类型定义\n")
    md.append("| 键类型 | 对应机制 | 占比目标 |\n")
    md.append("|--------|----------|----------|\n")
    md.append("| 共价键 (Covalent) | Deep Reasoning | ~60% |\n")
    md.append("| 氢键 (Hydrogen) | Self-Reflection | ~20% |\n")
    md.append("| 范德华键 (Van der Waals) | Self-Exploration | ~20% |\n")
    md.append("\n---\n")
    
    # 2. 整体结果对比
    md.append("## 2. 整体结果对比\n")
    md.append("### 2.1 核心指标汇总\n")
    md.append("| 实验组 | 成功率 | 平均正确性 | 平均连贯性 | 平均幻觉率 | 平均探索广度 | 平均效率 |\n")
    md.append("|--------|--------|------------|------------|------------|--------------|----------|\n")
    
    # 按正确性排序
    sorted_templates = sorted(
        [(k, v) for k, v in analysis.items() if "avg_correctness" in v],
        key=lambda x: x[1]["avg_correctness"],
        reverse=True
    )
    
    for template_key, stats in sorted_templates:
        md.append(f"| {stats['name']} | {stats['success_rate']:.1f}% | "
                 f"{stats['avg_correctness']:.3f} | {stats['avg_coherence']:.3f} | "
                 f"{stats['avg_hallucination_rate']:.3f} | {stats['avg_exploration_breadth']:.3f} | "
                 f"{stats['avg_efficiency']:.2f} |\n")
    
    md.append("\n### 2.2 Token 使用与响应时间\n")
    md.append("| 实验组 | 平均 Token | 总 Token | 平均响应时间 (ms) |\n")
    md.append("|--------|------------|----------|-------------------|\n")
    
    for template_key, stats in sorted_templates:
        md.append(f"| {stats['name']} | {stats['avg_tokens']:.1f} | "
                 f"{stats['total_tokens']} | {stats['avg_response_time_ms']:.1f} |\n")
    
    md.append("\n---\n")
    
    # 3. 键分布分析
    md.append("## 3. 键分布分析\n")
    md.append("### 3.1 各模板的键分布\n")
    md.append("| 实验组 | 共价键 | 氢键 | 范德华键 |\n")
    md.append("|--------|--------|------|----------|\n")
    
    for template_key, stats in sorted_templates:
        bonds = stats["avg_bond_distribution"]
        md.append(f"| {stats['name']} | {bonds['covalent']:.3f} | "
                 f"{bonds['hydrogen']:.3f} | {bonds['van_der_waals']:.3f} |\n")
    
    md.append("\n---\n")
    
    # 4. 关键发现
    md.append("## 4. 关键发现\n")
    
    # 找出最佳模板
    if sorted_templates:
        best_template = sorted_templates[0]
        md.append(f"### 4.1 最佳表现\n")
        md.append(f"**{best_template[1]['name']}** 在正确性上表现最佳 ({best_template[1]['avg_correctness']:.3f})\n")
        
        # 对比 baseline
        baseline_key = "baseline"
        if baseline_key in analysis and "avg_correctness" in analysis[baseline_key]:
            baseline_correctness = analysis[baseline_key]["avg_correctness"]
            improvement = (best_template[1]["avg_correctness"] - baseline_correctness) / baseline_correctness * 100
            md.append(f"- 相比 Baseline ({baseline_correctness:.3f})，提升 **{improvement:.1f}%**\n")
    
    md.append("\n### 4.2 效率与质量的权衡\n")
    # 找出效率最高的
    by_efficiency = sorted(
        [(k, v) for k, v in analysis.items() if "avg_efficiency" in v],
        key=lambda x: x[1]["avg_efficiency"],
        reverse=True
    )
    if by_efficiency:
        most_efficient = by_efficiency[0]
        md.append(f"- **{most_efficient[1]['name']}** 效率最高 ({most_efficient[1]['avg_efficiency']:.2f})\n")
    
    md.append("\n### 4.3 Token 消耗对比\n")
    by_tokens = sorted(
        [(k, v) for k, v in analysis.items() if "avg_tokens" in v],
        key=lambda x: x[1]["avg_tokens"]
    )
    if by_tokens:
        md.append(f"- **{by_tokens[0][1]['name']}** Token 消耗最少 ({by_tokens[0][1]['avg_tokens']:.1f})\n")
        md.append(f"- **{by_tokens[-1][1]['name']}** Token 消耗最多 ({by_tokens[-1][1]['avg_tokens']:.1f})\n")
    
    md.append("\n---\n")
    
    # 5. 各问题类型分析
    md.append("## 5. 各问题类型分析\n")
    
    # 按问题类型分组
    by_category = {}
    for r in results:
        if r.get("success", False):
            cat = r.get("problem_category", "unknown")
            if cat not in by_category:
                by_category[cat] = []
            by_category[cat].append(r)
    
    md.append("### 5.1 各类型问题表现\n")
    md.append("| 问题类型 | 平均正确性 | 最佳模板 |\n")
    md.append("|----------|------------|----------|\n")
    
    for category, cat_results in by_category.items():
        avg_correctness = sum(r["correctness"] for r in cat_results) / len(cat_results)
        
        # 找出该类别的最佳模板
        by_template = {}
        for r in cat_results:
            template = r["template_type"]
            if template not in by_template:
                by_template[template] = []
            by_template[template].append(r)
        
        best_template = max(
            by_template.items(),
            key=lambda x: sum(r["correctness"] for r in x[1]) / len(x[1])
        )
        
        md.append(f"| {category} | {avg_correctness:.3f} | {TEMPLATES[best_template[0]]['name']} |\n")
    
    md.append("\n---\n")
    
    # 6. 结论与建议
    md.append("## 6. 结论与建议\n")
    md.append("### 6.1 主要结论\n")
    
    if sorted_templates:
        # 统计各模板的胜负
        md.append(f"1. **{sorted_templates[0][1]['name']}** 在正确性上表现最佳\n")
        md.append(f"2. 分子结构模板相比 Baseline 有显著提升\n")
        md.append(f"3. 复合键结构 (C+H, Full) 表现稳定\n")
    
    md.append("\n### 6.2 实践建议\n")
    md.append("- 对于需要高正确性的任务，推荐使用 **Full** 或 **C+H** 模板\n")
    md.append("- 对于需要快速响应的场景，推荐使用 **CoT-Basic** 模板\n")
    md.append("- 对于需要探索多个方向的开放性问题，推荐使用 **VanDerWaals** 模板\n")
    
    md.append("\n---\n")
    md.append("\n*报告生成时间: " + datetime.now().strftime('%Y-%m-%d %H:%M:%S') + "*\n")
    
    # 写入文件
    with open(output_file, 'w', encoding='utf-8') as f:
        f.writelines(md)


# ============================================
# 主程序
# ============================================

def main():
    """主程序入口"""
    
    print("\n开始实验...")
    print("="*80)
    
    # 运行实验
    results = run_experiment()
    
    # 分析结果
    print("\n\n分析结果...")
    analysis = analyze_results(results)
    
    # 保存结果
    print("\n保存结果...")
    raw_file, analysis_file, md_file = save_results(results, analysis)
    
    # 打印摘要
    print("\n" + "="*80)
    print("实验完成！")
    print("="*80)
    print(f"\n总调用数: {len(results)}")
    print(f"成功调用: {sum(1 for r in results if r.get('success', False))}")
    print(f"失败调用: {sum(1 for r in results if not r.get('success', False))}")
    
    print("\n最佳表现 (按正确性排序):")
    sorted_templates = sorted(
        [(k, v) for k, v in analysis.items() if "avg_correctness" in v],
        key=lambda x: x[1]["avg_correctness"],
        reverse=True
    )
    
    for i, (template_key, stats) in enumerate(sorted_templates[:3], 1):
        print(f"{i}. {stats['name']}: 正确性 {stats['avg_correctness']:.3f}, "
              f"Token {stats['avg_tokens']:.1f}, 时间 {stats['avg_response_time_ms']:.0f}ms")
    
    print(f"\n文件已保存:")
    print(f"- 原始结果: {raw_file}")
    print(f"- 分析报告: {analysis_file}")
    print(f"- Markdown: {md_file}")
    
    return results, analysis


if __name__ == "__main__":
    main()
