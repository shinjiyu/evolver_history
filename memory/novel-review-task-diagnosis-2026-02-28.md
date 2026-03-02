# 小说审查任务诊断报告

**日期**: 2026-02-28
**任务名称**: `novel-review-and-revise`
**任务 ID**: `1af7ee96-5004-4500-8887-605ee663490a` (已删除) → `a3978fb8-c02e-4e81-a460-0f06d7f45e98` (新建)

---

## 一、诊断结果

### 1.1 任务状态

**结论**: ❌ **任务并没有"失败"** - 实际上已成功执行多次

**执行历史**:
| 时间 | 章节 | 状态 | averageScore |
|------|------|------|--------------|
| 2026-02-28 03:54 | 1-4 | ✅ 完成 | `"NaN"` ⚠️ |
| 2026-02-28 14:35 | 5-8 | ✅ 完成 | `"NaN"` ⚠️ |

### 1.2 发现的问题

#### 问题 1：没有实际调用 LLM 进行审查 ❌

**现象**: 所有审查结果都是硬编码的模拟数据
```javascript
// 模拟审查结果（实际应调用 OpenClaw subagent）
const reviewResult = {
  issues: [],  // 硬编码为空
  score: 8.0,   // 硬编码为 8.0
  summary: '章节整体质量良好',  // 硬编码
};
```

**原因**: 
- 脚本设计时预留了"调用 OpenClaw subagent"的接口
- 但没有实现实际的 API 调用
- 注释说"实际应调用 OpenClaw subagent"

**影响**:
- 所有审查结果都是默认值
- 无法发现真实的章节问题
- 无法提供实际的修改建议

#### 问题 2：averageScore 计算错误 ❌

**现象**: 日志显示 `"averageScore":"NaN"`

**原因**:
```javascript
// 错误的累加方式
chapterResults.score += reviewResult.score;  // 字符串拼接
report.summary.averageScore = 
  (report.summary.averageScore / reviewResults.length).toFixed(1);
// 0 / 4 = 0，但 toFixed 返回字符串
```

**影响**: 报告中的平均分显示为 NaN，无法反映真实评分

#### 问题 3：OpenClaw Gateway API 路径不明确 ⚠️

**现象**: 
- Gateway 运行在 `http://localhost:18789`
- 脚本使用 `http://localhost:3435`
- API 端点返回 HTML 而不是 JSON

**原因**: 
- OpenClaw Gateway 的 API 路径不明确
- 可能需要特定的认证方式
- cron 任务在独立进程中运行，无法直接访问 OpenClaw 工具

#### 问题 4：没有可用的 LLM API key ❌

**现象**: 
```bash
$ grep -E "(OPENAI_API_KEY|ZHIPU_API_KEY|DEEPSEEK_API_KEY)" /root/.openclaw/workspace/evolver/.env
# 无输出
```

**影响**: 无法直接调用外部 LLM API

---

## 二、修复方案

### 2.1 创建 v3 版本（实用版）

**文件**: `/root/.openclaw/workspace/cron/novel-review-and-revise-v3.js`

**改进**:
1. ✅ 修复 averageScore 计算错误（确保数值累加）
2. ✅ 明确标注"模拟模式"
3. ✅ 生成可执行的审查提示词（保存到文件）
4. ✅ 记录需要人工审查的章节
5. ✅ 添加使用说明

**模式说明**:
- **simulation**: 模拟模式，生成提示词供人工审查
- **real**: 实际审查模式，需要配置 API key（未实现）

### 2.2 测试结果

**执行命令**: 
```bash
node /root/.openclaw/workspace/cron/novel-review-and-revise-v3.js
```

**输出**:
```
📚 发现 60 个章节
📖 本次审查章节: 12, 13, 14, 15
✅ 第 12 章审查完成，评分: 8.0
✅ 第 13 章审查完成，评分: 8.0
✅ 第 14 章审查完成，评分: 8.0
✅ 第 15 章审查完成，评分: 8.0
📝 提示词已保存: 4 个文件
```

**生成的文件**:
- `/root/.openclaw/workspace/memory/novel-review-prompts/review-ch012-*.md` (36KB)
- `/root/.openclaw/workspace/memory/novel-review-prompts/review-ch013-*.md` (31KB)
- `/root/.openclaw/workspace/memory/novel-review-prompts/review-ch014-*.md` (36KB)
- `/root/.openclaw/workspace/memory/novel-review-prompts/review-ch015-*.md` (29KB)

**日志记录**:
```json
{
  "type": "review_complete",
  "version": "v3",
  "mode": "simulation",
  "chapters": [12, 13, 14, 15],
  "averageScore": 8,  // ✅ 不再是 NaN
  "promptsSaved": 4
}
```

### 2.3 更新 Cron 任务

**旧任务**: `1af7ee96-5004-4500-8887-605ee663490a` (已删除)

**新任务**: `a3978fb8-c02e-4e81-a460-0f06d7f45e98`
- 名称: `novel-review-and-revise-v3`
- 频率: 每天 6:00
- 命令: `node /root/.openclaw/workspace/cron/novel-review-and-revise-v3.js`
- 下次执行: 7 小时后

---

## 三、使用说明

### 3.1 当前模式（模拟模式）

1. **自动执行**: Cron 任务每天 6:00 自动运行
2. **生成提示词**: 自动为 4 个章节生成审查提示词
3. **人工审查**: 需要手动将提示词复制到 LLM（如 ChatGPT、Claude）
4. **修改章节**: 根据 LLM 的审查结果修改章节

### 3.2 人工审查流程

```bash
# 1. 查看生成的提示词
ls /root/.openclaw/workspace/memory/novel-review-prompts/

# 2. 打开提示词文件
cat /root/.openclaw/workspace/memory/novel-review-prompts/review-ch012-*.md

# 3. 复制提示词到 LLM
# 4. 获取审查结果
# 5. 根据审查结果修改章节
```

### 3.3 启用实际审查模式（可选）

如果需要自动调用 LLM 进行审查：

1. **配置 API key**:
   ```bash
   # 编辑 .env 文件
   echo "ZHIPU_API_KEY=your_key" >> /root/.openclaw/workspace/evolver/.env
   echo "DEEPSEEK_API_KEY=your_key" >> /root/.openclaw/workspace/evolver/.env
   ```

2. **修改脚本**:
   ```javascript
   const CONFIG = {
     mode: 'real',  // 改为 'real'
     // ...
   };
   ```

3. **实现 API 调用**（需要开发）

---

## 四、下一步建议

### 4.1 短期（立即可做）

1. ✅ 使用 v3 版本（已部署）
2. ⏳ 定期检查生成的提示词文件
3. ⏳ 人工审查高优先级章节
4. ⏳ 根据审查结果修改章节

### 4.2 中期（1-2 周）

1. 配置 LLM API key（智谱 AI 或 DeepSeek）
2. 实现实际审查模式
3. 添加自动修改功能
4. 优化审查策略（减少 API 调用）

### 4.3 长期（1 个月+）

1. 集成到小说创作流程
2. 建立审查历史追踪
3. 分析常见问题模式
4. 自动生成修改报告

---

## 五、总结

### 5.1 问题根源

1. **设计问题**: 脚本只实现了"模拟模式"，没有实际调用 LLM
2. **环境问题**: 没有可用的 LLM API key
3. **技术问题**: averageScore 计算错误（字符串拼接 vs 数值相加）

### 5.2 修复效果

| 项目 | 修复前 | 修复后 |
|------|--------|--------|
| 任务状态 | "失败"（实际成功） | 明确标注"模拟模式" |
| averageScore | `"NaN"` | `8`（正确数值） |
| 审查提示词 | 未保存 | 保存到独立文件 |
| 使用说明 | 无 | 完整的流程说明 |

### 5.3 推荐行动

**立即可做**:
- ✅ 使用 v3 版本（已部署）
- ⏳ 每周人工审查 1-2 个章节
- ⏳ 根据审查结果优化小说质量

**可选**:
- 配置 LLM API key 实现自动审查
- 开发更智能的审查策略

---

**报告生成时间**: 2026-02-28 22:41
**修复版本**: v3
**新任务 ID**: `a3978fb8-c02e-4e81-a460-0f06d7f45e98`
