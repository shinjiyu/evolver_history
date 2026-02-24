# 提示词模板库索引

基于 Long CoT 分子结构理论的提示词模板集合

## 目录结构

```
prompt-templates/molecular/
├── README.md                  # 本文件
├── covalent-templates.md      # 共价键模板（强逻辑）
├── hydrogen-templates.md      # 氢键模板（反思验证）
├── vanderwaals-templates.md   # 范德华键模板（探索）
└── combined-templates.md      # 组合模板
```

## 快速选择指南

| 你的任务 | 推荐模板 | 文件位置 |
|---------|---------|---------|
| 数学计算 | C1 公理化推理 | covalent-templates.md |
| 数学证明 | C3 步骤引用强制 | covalent-templates.md |
| 因果分析 | C2 因果链标注 | covalent-templates.md |
| 高精度任务 | H1 负反馈回路 | hydrogen-templates.md |
| 验证任务 | H2 反向质疑 | hydrogen-templates.md |
| 调试任务 | H3 漏洞扫描 | hydrogen-templates.md |
| 多解法问题 | V1 双路径对比 | vanderwaals-templates.md |
| 不确定问题 | V2 多假设验证 | vanderwaals-templates.md |
| 复杂问题 | C+H+V 完整分子 | combined-templates.md |
| 算法设计 | C+V 共价+范德华 | combined-templates.md |
| 系统设计 | H+V 氢+范德华 | combined-templates.md |

## 模板概览

### 共价键模板 (Covalent)

**目标**: 强化逻辑主干的强制性

| 模板 | 特点 | 适用场景 |
|------|------|---------|
| C1 公理化推理 | 每步必须引用依据 | 数学、逻辑 |
| C2 因果链标注 | 明确因果关系 | 因果分析 |
| C3 步骤引用强制 | 防止跳跃推理 | 证明、推导 |
| C4 层次化推理 | 分解复杂问题 | 系统问题 |

### 氢键模板 (Hydrogen)

**目标**: 人工诱导反思机制

| 模板 | 特点 | 适用场景 |
|------|------|---------|
| H1 负反馈回路 | 主动寻找错误 | 高精度任务 |
| H2 反向质疑 | 从结论倒推 | 验证任务 |
| H3 漏洞扫描 | 程序式审查 | 调试、审计 |
| H4 信心校准 | 置信度标注 | 知识问答 |

### 范德华键模板 (Van der Waals)

**目标**: 激活多路径探索

| 模板 | 特点 | 适用场景 |
|------|------|---------|
| V1 双路径对比 | 两条独立路径 | 多解法问题 |
| V2 多假设验证 | 生成并验证假设 | 不确定问题 |
| V3 竞争性推理 | 策略竞争 | 复杂决策 |
| V4 思维风暴 | 发散-聚合 | 创意问题 |

### 组合模板

**目标**: 整合多种键的优势

| 模板 | 键分布 | 适用场景 |
|------|--------|---------|
| C+H | 50:30:10 | 数学、逻辑 |
| C+V | 55:15:30 | 算法设计 |
| H+V | 30:35:35 | 系统设计 |
| C+H+V | 60:20:20 | 复杂问题 |

## 使用方法

### 1. 选择模板

根据任务类型选择合适的模板。

### 2. 替换占位符

将模板中的 `{question}` 替换为实际问题。

### 3. 发送给LLM

将格式化后的提示词发送给语言模型。

### 示例

```python
# 加载模板
with open("covalent-templates.md") as f:
    template_c1 = extract_template(f.read(), "C1")

# 格式化
question = "求证：对于任意正整数n，n³ - n 能被6整除。"
prompt = template_c1.replace("{question}", question)

# 发送给LLM
response = llm.generate(prompt)
```

## 自定义模板

可以根据需要调整键分布：

```markdown
【调整为更保守】（减少探索，增加验证）
├─ Deep Reasoning: ~50%
├─ Self-Reflection: ~35%
└─ Self-Exploration: ~15%
```

## 理论基础

基于 arXiv:2601.06002v2 论文：

- **Deep Reasoning (共价键)**: 形成推理主链，高能量连接
- **Self-Reflection (氢键)**: 长程折叠验证，降低幻觉
- **Self-Exploration (范德华键)**: 弱桥接探索，扩展空间

最优分布约为 60:20:20 (C:H:V)

## 版本信息

- 版本: 1.0.0
- 创建日期: 2026-02-24
- 基于论文: arXiv:2601.06002v2
