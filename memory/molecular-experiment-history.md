# 分子结构提示词实验 - 历史追踪

本文件自动记录每次实验的关键指标。

---

## 说明

- **实验项目**: Long CoT 分子结构提示词工程对比实验
- **基础论文**: arXiv:2601.06002v2
- **GitHub**: https://github.com/shinjiyu/molecular-prompt-experiments
- **本地路径**: `/root/.openclaw/workspace/molecular-prompt-experiments/`

### 实验设计

**键类型映射**:
- 共价键 (Covalent) = Deep Reasoning - 强逻辑主干
- 氢键 (Hydrogen) = Self-Reflection - 反思验证
- 范德华键 (Van der Waals) = Self-Exploration - 探索新方向

**实验组**:
1. Baseline - 基线（无特殊提示）
2. CoT-Basic - 普通思维链
3. Covalent - 共价键（严密逻辑链）
4. Hydrogen - 氢键（反审计机制）
5. VanDerWaals - 范德华键（双路径探索）
6. C+H - 共价+氢键（推进-检查循环）
7. Full - 完整分子结构

**测试问题**: 5 个（数学、逻辑、常识、代码、策略）
**总调用数**: 35 次

---
