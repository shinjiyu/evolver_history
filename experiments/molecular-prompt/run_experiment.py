"""
Long CoT 分子结构提示词工程对比实验

基于论文 arXiv:2601.06002v2
实验目标：验证不同"键"模板对推理质量的影响

兼容 Python 3.6+
"""

from __future__ import print_function
import json
import os
import sys
import time
from datetime import datetime
from typing import Dict, List, Any, Optional
from enum import Enum

# Python 3.6 兼容：不使用 dataclasses
def dataclass(cls):
    """简化的 dataclass 装饰器"""
    def __init__(self, **kwargs):
        for key, value in kwargs.items():
            setattr(self, key, value)
    cls.__init__ = __init__
    return cls

def asdict(obj):
    """将对象转换为字典"""
    return {k: v for k, v in obj.__dict__.items() if not k.startswith('_')}

# 添加复现项目路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'reproduction-molecular-cot'))

# ============================================
# 实验配置
# ============================================

EXPERIMENT_DIR = os.path.dirname(os.path.abspath(__file__))
RESULTS_DIR = os.path.join(EXPERIMENT_DIR, 'results')
TEMPLATES_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'prompt-templates', 'molecular')

# 确保结果目录存在
os.makedirs(RESULTS_DIR, exist_ok=True)


class TemplateType(Enum):
    """模板类型"""
    BASELINE = "baseline"           # 基线：普通CoT
    COVALENT = "covalent"           # 仅共价键
    HYDROGEN = "hydrogen"           # 仅氢键
    VAN_DER_WAALS = "van_der_waals" # 仅范德华键
    C_PLUS_H = "c_plus_h"           # 共价+氢
    C_PLUS_V = "c_plus_v"           # 共价+范德华
    H_PLUS_V = "h_plus_v"           # 氢+范德华
    C_PLUS_H_PLUS_V = "c_plus_h_plus_v"  # 完整分子


@dataclass
class Problem:
    """问题定义"""
    id: str
    category: str
    difficulty: str
    question: str
    answer: str
    key_steps: int


@dataclass
class ExperimentResult:
    """实验结果"""
    experiment_id: str
    timestamp: str
    model: str
    problem_id: str
    template_type: str
    question: str
    response_text: str
    tokens_used: int
    response_time_ms: float
    correctness: float
    coherence: float
    hallucination_rate: float
    exploration_breadth: float
    efficiency: int
    bond_analysis: Dict[str, float]
    notes: str


# ============================================
# 问题集
# ============================================

PROBLEMS: List[Problem] = [
    # 数学推理
    Problem(
        id="MATH-001",
        category="math",
        difficulty="easy",
        question="一个袋子里有5个红球和3个蓝球。随机取出2个球，都是红球的概率是多少？",
        answer="5/14",
        key_steps=4
    ),
    Problem(
        id="MATH-002",
        category="math",
        difficulty="medium",
        question="求证：对于任意正整数n，n³ - n 能被6整除。",
        answer="证明完成",
        key_steps=5
    ),
    
    # 逻辑推理
    Problem(
        id="LOGIC-001",
        category="logic",
        difficulty="easy",
        question="""有三个人：甲、乙、丙。一个是医生，一个是教师，一个是工程师。
已知：
1. 丙比教师年龄大
2. 甲和教师的年龄不同
3. 教师比乙年龄小
请问每个人的职业是什么？""",
        answer="甲=工程师, 乙=医生, 丙=教师",
        key_steps=4
    ),
    Problem(
        id="LOGIC-002",
        category="logic",
        difficulty="medium",
        question="""一个岛上有骑士和无赖。骑士总是说真话，无赖总是说假话。
你遇到A和B两个人。A说："我们两个都是无赖。"
请问A和B分别是什么身份？""",
        answer="A是无赖，B是骑士",
        key_steps=5
    ),
    
    # 常识推理
    Problem(
        id="CS-001",
        category="commonsense",
        difficulty="easy",
        question="小明把一杯热水放进冰箱，一杯冷水放在桌上。半小时后，哪杯水更凉？为什么？",
        answer="冰箱里的水更凉",
        key_steps=3
    ),
    Problem(
        id="CS-002",
        category="commonsense",
        difficulty="medium",
        question="为什么在高海拔地区煮面条需要更长时间？",
        answer="气压低导致沸点降低",
        key_steps=4
    ),
    
    # 代码调试
    Problem(
        id="CODE-001",
        category="code",
        difficulty="easy",
        question="""找出以下代码的bug：
def factorial(n):
    if n == 0:
        return 0
    return n * factorial(n-1)

print(factorial(5))""",
        answer="n==0时应返回1，不是0",
        key_steps=3
    ),
    Problem(
        id="CODE-002",
        category="code",
        difficulty="medium",
        question="""以下代码为什么效率很低？如何优化？
def find_duplicates(arr):
    result = []
    for i in range(len(arr)):
        for j in range(i+1, len(arr)):
            if arr[i] == arr[j] and arr[i] not in result:
                result.append(arr[i])
    return result""",
        answer="使用set优化到O(n)",
        key_steps=4
    ),
    
    # 开放问题
    Problem(
        id="OPEN-001",
        category="open",
        difficulty="medium",
        question="设计一个简单的刷单检测系统，列出至少3个检测指标。",
        answer="开放性答案",
        key_steps=8
    ),
    Problem(
        id="OPEN-002",
        category="open",
        difficulty="hard",
        question="分析远程工作对员工心理健康的影响，并提出2-3条企业应对建议。",
        answer="开放性答案",
        key_steps=10
    ),
]


# ============================================
# 模板定义
# ============================================

TEMPLATES = {
    TemplateType.BASELINE: """
请仔细思考以下问题，并给出你的推理过程和最终答案。

问题：
{question}
""",

    TemplateType.COVALENT: """
【目标】构建严密的逻辑链条，每一步都有明确的逻辑依据

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
{question}
""",

    TemplateType.HYDROGEN: """
【目标】在每个关键步骤后主动寻找错误

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
{question}
""",

    TemplateType.VAN_DER_WAALS: """
【目标】同时探索两条不同的推理路径，对比结果

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
{question}
""",

    TemplateType.C_PLUS_H: """
【目标】构建严密的逻辑链，并在关键节点进行反思验证

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
{question}
""",

    TemplateType.C_PLUS_H_PLUS_V: """
【目标】构建具有稳定分子结构的完整推理过程

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
{question}
""",
}


# ============================================
# 实验执行器
# ============================================

class ExperimentRunner:
    """实验执行器"""
    
    def __init__(self, model_name: str = "zai/glm-5"):
        self.model_name = model_name
        self.results: List[ExperimentResult] = []
        
    def load_prompt_template(self, template_type: TemplateType) -> str:
        """加载提示词模板"""
        return TEMPLATES.get(template_type, TEMPLATES[TemplateType.BASELINE])
    
    def format_prompt(self, template: str, question: str) -> str:
        """格式化提示词"""
        return template.format(question=question)
    
    def simulate_llm_call(self, prompt: str) -> Dict[str, Any]:
        """
        模拟LLM调用（实际使用时替换为真实API调用）
        
        注意：这是一个模拟实现，实际使用需要连接到真实的LLM API
        """
        # 模拟响应时间
        start_time = time.time()
        
        # 这里应该调用真实的LLM API
        # 由于环境限制，使用模拟响应
        
        # 模拟响应
        response_text = self._generate_mock_response(prompt)
        
        elapsed_ms = (time.time() - start_time) * 1000
        
        return {
            "text": response_text,
            "tokens_used": len(response_text.split()) * 1.5,  # 估算token数
            "response_time_ms": elapsed_ms,
        }
    
    def _generate_mock_response(self, prompt: str) -> str:
        """生成模拟响应（用于测试）"""
        # 简单的模拟响应
        if "probability" in prompt.lower() or "概率" in prompt:
            return """
[AXIOM-1] 袋子里有5个红球和3个蓝球，总共8个球
[AXIOM-2] 第一次取红球的概率是5/8
[STEP-1] 因为 [AXIOM-1][AXIOM-2]，第一次取红球后剩4红3蓝
[STEP-2] 因为 [STEP-1]，第二次取红球概率是4/7
[STEP-3] 因为 [STEP-1][STEP-2]，两球都是红球的概率 = (5/8) × (4/7) = 20/56 = 5/14

答案：5/14
"""
        return "[模拟响应] 这是一个模拟的回答。"
    
    def evaluate_response(self, response: str, problem: Problem) -> Dict[str, float]:
        """评估响应质量"""
        # 简化的评估逻辑（实际应该使用更复杂的方法）
        
        # 正确性评估
        correctness = 1.0 if problem.answer in response or problem.answer == "开放性答案" else 0.5
        
        # 逻辑连贯性（基于响应长度和结构）
        coherence = min(5.0, len(response.split('\n')) / 5)
        
        # 幻觉率（简化：检查是否有无依据的断言）
        hallucination_indicators = ["肯定", "一定", "绝对", "must", "definitely"]
        hallucination_rate = sum(1 for w in hallucination_indicators if w in response.lower()) / max(1, len(response.split()))
        
        # 探索广度
        exploration_keywords = ["或者", "另一种", "also", "alternatively", "maybe"]
        exploration_breadth = min(5.0, sum(1 for k in exploration_keywords if k in response.lower()) + 2)
        
        # 效率（步骤数/预期步骤数）
        steps = len([l for l in response.split('\n') if l.strip() and (l.startswith('[') or l.startswith('步骤'))])
        efficiency = max(1, min(10, problem.key_steps * 2 - abs(steps - problem.key_steps)))
        
        return {
            "correctness": correctness,
            "coherence": coherence,
            "hallucination_rate": hallucination_rate,
            "exploration_breadth": exploration_breadth,
            "efficiency": efficiency,
        }
    
    def analyze_bonds(self, response: str) -> Dict[str, float]:
        """分析响应中的键分布"""
        total = len(response)
        if total == 0:
            return {"covalent": 0.25, "hydrogen": 0.25, "van_der_waals": 0.25, "normal": 0.25}
        
        # 基于关键词的简单分析
        covalent_keywords = ["因此", "所以", "because", "therefore", "thus", "[D-", "[STEP-"]
        hydrogen_keywords = ["等待", "但是", "检查", "wait", "but", "verify", "[R-"]
        vdw_keywords = ["或者", "也许", "替代", "or", "maybe", "alternative", "[E-"]
        
        covalent_count = sum(response.lower().count(k.lower()) for k in covalent_keywords)
        hydrogen_count = sum(response.lower().count(k.lower()) for k in hydrogen_keywords)
        vdw_count = sum(response.lower().count(k.lower()) for k in vdw_keywords)
        
        total_keywords = covalent_count + hydrogen_count + vdw_count + 1
        
        return {
            "covalent": covalent_count / total_keywords,
            "hydrogen": hydrogen_count / total_keywords,
            "van_der_waals": vdw_count / total_keywords,
            "normal": max(0.1, 1 - (covalent_count + hydrogen_count + vdw_count) / total_keywords),
        }
    
    def run_single_experiment(
        self,
        problem: Problem,
        template_type: TemplateType,
    ) -> ExperimentResult:
        """运行单个实验"""
        
        # 加载模板并格式化
        template = self.load_prompt_template(template_type)
        prompt = self.format_prompt(template, problem.question)
        
        # 调用LLM（模拟）
        response = self.simulate_llm_call(prompt)
        
        # 评估响应
        evaluation = self.evaluate_response(response["text"], problem)
        
        # 分析键分布
        bond_analysis = self.analyze_bonds(response["text"])
        
        # 创建结果
        result = ExperimentResult(
            experiment_id=f"EXP-{datetime.now().strftime('%Y%m%d%H%M%S')}-{problem.id}",
            timestamp=datetime.now().isoformat(),
            model=self.model_name,
            problem_id=problem.id,
            template_type=template_type.value,
            question=problem.question,
            response_text=response["text"],
            tokens_used=int(response["tokens_used"]),
            response_time_ms=response["response_time_ms"],
            correctness=evaluation["correctness"],
            coherence=evaluation["coherence"],
            hallucination_rate=evaluation["hallucination_rate"],
            exploration_breadth=evaluation["exploration_breadth"],
            efficiency=int(evaluation["efficiency"]),
            bond_analysis=bond_analysis,
            notes="",
        )
        
        return result
    
    def run_full_experiment(
        self,
        problems: List[Problem] = None,
        template_types: List[TemplateType] = None,
        save_results: bool = True,
    ) -> List[ExperimentResult]:
        """运行完整实验"""
        
        if problems is None:
            problems = PROBLEMS
        
        if template_types is None:
            template_types = [
                TemplateType.BASELINE,
                TemplateType.COVALENT,
                TemplateType.HYDROGEN,
                TemplateType.C_PLUS_H,
                TemplateType.C_PLUS_H_PLUS_V,
            ]
        
        results = []
        total = len(problems) * len(template_types)
        
        print(f"开始实验，共 {total} 个测试用例")
        print("="*60)
        
        for i, problem in enumerate(problems):
            print(f"\n问题 {i+1}/{len(problems)}: {problem.id}")
            
            for j, template_type in enumerate(template_types):
                print(f"  模板 {j+1}/{len(template_types)}: {template_type.value}...", end=" ")
                
                result = self.run_single_experiment(problem, template_type)
                results.append(result)
                
                print(f"完成 (正确性: {result.correctness:.2f})")
        
        self.results = results
        
        if save_results:
            self.save_results(results)
        
        print("\n" + "="*60)
        print("实验完成！")
        
        return results
    
    def save_results(self, results: List[ExperimentResult], filename: str = None):
        """保存结果"""
        if filename is None:
            filename = f"experiment_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        
        filepath = os.path.join(RESULTS_DIR, filename)
        
        data = [asdict(r) for r in results]
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        print(f"结果已保存到: {filepath}")
        
        return filepath
    
    def analyze_results(self, results: List[ExperimentResult] = None) -> Dict[str, Any]:
        """分析实验结果"""
        if results is None:
            results = self.results
        
        if not results:
            return {"error": "没有结果可分析"}
        
        # 按模板类型分组
        by_template = {}
        for r in results:
            if r.template_type not in by_template:
                by_template[r.template_type] = []
            by_template[r.template_type].append(r)
        
        # 计算每个模板的平均指标
        analysis = {}
        for template_type, template_results in by_template.items():
            n = len(template_results)
            
            analysis[template_type] = {
                "样本数": n,
                "平均正确性": sum(r.correctness for r in template_results) / n,
                "平均连贯性": sum(r.coherence for r in template_results) / n,
                "平均幻觉率": sum(r.hallucination_rate for r in template_results) / n,
                "平均探索广度": sum(r.exploration_breadth for r in template_results) / n,
                "平均效率": sum(r.efficiency for r in template_results) / n,
                "平均Token数": sum(r.tokens_used for r in template_results) / n,
                "平均响应时间(ms)": sum(r.response_time_ms for r in template_results) / n,
                "平均键分布": {
                    "共价键": sum(r.bond_analysis["covalent"] for r in template_results) / n,
                    "氢键": sum(r.bond_analysis["hydrogen"] for r in template_results) / n,
                    "范德华键": sum(r.bond_analysis["van_der_waals"] for r in template_results) / n,
                    "普通": sum(r.bond_analysis["normal"] for r in template_results) / n,
                },
            }
        
        return analysis
    
    def print_analysis(self, analysis: Dict[str, Any]):
        """打印分析结果"""
        print("\n" + "="*80)
        print("实验结果分析")
        print("="*80)
        
        for template_type, stats in analysis.items():
            print(f"\n{template_type}:")
            print("-"*40)
            for key, value in stats.items():
                if isinstance(value, dict):
                    print(f"  {key}:")
                    for k, v in value.items():
                        print(f"    {k}: {v:.4f}")
                else:
                    if isinstance(value, float):
                        print(f"  {key}: {value:.4f}")
                    else:
                        print(f"  {key}: {value}")


# ============================================
# 主程序
# ============================================

def main():
    """主程序入口"""
    print("="*60)
    print("Long CoT 分子结构提示词工程对比实验")
    print("="*60)
    
    # 创建实验执行器
    runner = ExperimentRunner(model_name="zai/glm-5")
    
    # 运行实验
    results = runner.run_full_experiment(
        problems=PROBLEMS[:4],  # 使用前4个问题进行测试
        template_types=[
            TemplateType.BASELINE,
            TemplateType.COVALENT,
            TemplateType.C_PLUS_H,
            TemplateType.C_PLUS_H_PLUS_V,
        ],
        save_results=True,
    )
    
    # 分析结果
    analysis = runner.analyze_results(results)
    runner.print_analysis(analysis)
    
    print("\n实验完成！结果已保存。")


if __name__ == "__main__":
    main()
