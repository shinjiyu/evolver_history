# Long CoT 分子结构提示词工程实验

基于 arXiv:2601.06002v2 论文的提示词工程研究

## 快速开始

```bash
cd /root/.openclaw/workspace/experiments/molecular-prompt
python run_experiment.py
```

## 文件结构

```
experiments/molecular-prompt/
├── run_experiment.py     # 主实验脚本
├── results/              # 实验结果存储
├── README.md             # 本文件
└── analysis_report.md    # 分析报告（实验后生成）
```

## 实验设计

### 测试模板

| 模板 | 类型 | 预期优势 |
|------|------|---------|
| Baseline | 普通CoT | 基线参考 |
| Covalent | 共价键 | 逻辑严密 |
| Hydrogen | 氢键 | 错误率低 |
| C+H | 共价+氢 | 严密+可靠 |
| C+H+V | 完整分子 | 全面最优 |

### 测试问题

- 数学推理 (2题)
- 逻辑推理 (2题)
- 常识推理 (2题)
- 代码调试 (2题)
- 开放问题 (2题)

### 评估维度

1. **正确性** (40%): 答案是否正确
2. **逻辑连贯性** (20%): 步骤间逻辑是否合理
3. **幻觉率** (20%): 无依据断言的比例
4. **探索广度** (10%): 是否考虑多种可能
5. **效率** (10%): 达到答案所需步骤

## 预期假设

- H1: C+H+V > C+H > 单一模板 > Baseline
- H2: 数学问题偏好C模板，开放问题偏好V模板
- H3: 最优键分布约为 60:20:20 (C:H:V)

## 扩展实验

### 使用真实LLM API

修改 `run_experiment.py` 中的 `simulate_llm_call` 方法：

```python
def simulate_llm_call(self, prompt: str) -> Dict[str, Any]:
    # 替换为真实API调用
    import openai
    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}],
    )
    return {
        "text": response.choices[0].message.content,
        "tokens_used": response.usage.total_tokens,
        "response_time_ms": elapsed_ms,
    }
```

### 添加更多问题

在 `run_experiment.py` 的 `PROBLEMS` 列表中添加新问题：

```python
Problem(
    id="NEW-001",
    category="math",
    difficulty="hard",
    question="你的问题...",
    answer="预期答案",
    key_steps=6,
),
```

## 结果解读

实验完成后，查看 `results/` 目录下的 JSON 文件，或运行：

```python
from run_experiment import ExperimentRunner

runner = ExperimentRunner()
results = runner.load_results("results/experiment_results_xxx.json")
analysis = runner.analyze_results(results)
runner.print_analysis(analysis)
```

## 参考

- 论文: arXiv:2601.06002v2
- 研究报告: `/root/.openclaw/workspace/memory/prompt-engineering-molecular-analysis.md`
- 模板库: `/root/.openclaw/workspace/prompt-templates/molecular/`
