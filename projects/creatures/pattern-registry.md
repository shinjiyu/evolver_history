# 模式注册表（活跃）

> 已归档模式见 archive/patterns-archived.md

| ID | 指纹描述 | 类型 | 首现 | 末现 | 次数 | 状态 | 关联文件 |
|----|----------|------|------|------|------|------|----------|
| PAT-001 | [协作] 并行 subagent 共享 AI Studio 会话 → 产出重复图 | 错误预防 | R001 | R001 | 1 | 已缓释 | creature-ai-studio-session-isolation.mdc |
| PAT-002 | [工具] base64 data URL 未正确解码即保存 → 图片文件损坏 | 错误预防 | R001 | R001 | 1 | 已缓释 | playwright-image-generator.md |
| PAT-003 | [认知] 未校验中文名与 CR.id 映射 → 为错误生物生成图片 | 错误预防 | R001 | R002 | 2 | 复现 | creature-name-verification.mdc |
| PAT-004 | [行为] AI Studio 上传失败 → subagent 降级为无参考生成 | 错误预防 | R001 | R002 | 2 | 复现 | creature-lifestyle-growth-image-generator.md |
| PAT-005 | [输出] 敏感词汇触发 AI Studio 内容审核 → 部分图生成失败 | 已知问题 | R001 | R001 | 1 | 已缓释 | playwright-image-generator.md |
| PAT-006 | [工具] data URL 为 PNG 但按 .jpeg 保存 → 格式后缀不一致 | 错误预防 | R001 | R001 | 1 | 已缓释 | playwright-image-generator.md |
| PAT-007 | [流程] 设计生物前未读取 CREATURE_SPEC/BASELINE 而直接仿写现有卡 | 错误预防 | R002 | R002 | 1 | 已缓释 | creature-generator.md |
| PAT-008 | [规范] 生物卡 dependencies 引用未与 WR2 索引对齐的区域 ID | 错误预防 | R002 | R002 | 1 | 已缓释 | creature-generator.md, creature-judge.md |
| PAT-009 | [输出质量] ID 图生成缺少科学水彩与禁止 UI 的硬性提示词约束 | 错误预防 | R002 | R002 | 1 | 已缓释 | creature-id-card-generator.md |
| PAT-010 | [规范] ability 块 deviation/dependencies 未显式填 none 导致格式不统一 | 错误预防 | R002 | R002 | 1 | 已缓释 | creature-generator.md, creature-judge.md |
| PAT-011 | [流程] 生物设计任务在 subagent 委派与主流程直接设计间未统一 | 错误预防 | R001 | R002 | 2 | 复现 | creature-design-routing.mdc |
| PAT-012 | [认知] 创意优先的拟人/变形设计对 BASELINE 低魔约束覆盖不足 | 错误预防 | R002 | R002 | 1 | 已缓释 | creature-generator.md |
| PAT-013 | [协作] 角色写真误用 ID 卡 subagent | 错误预防 | R002 | R002 | 1 | 已缓释 | creature-image-generation-preference.mdc |
| PAT-014 | [输出] 生活图 prompt 遗漏解剖/姿态约束 → 需用户修正后重生成 | 错误预防 | R002 | R002 | 1 | 已缓释 | creature-lifestyle-growth-image-generator.md |
| PAT-020 | [认知] 中文名与 CR.id 映射：模糊匹配、typo 容错不足（PAT-003 扩展） | 错误预防 | R002 | R002 | 4 | 已缓释 | creature-name-verification.mdc |
| PAT-021 | [流程] 生物设计/生图在 subagent 委派与主流程直接执行间未统一（PAT-011 复现） | 错误预防 | R002 | R002 | 2 | 已缓释 | creature-design-routing.mdc |
| PAT-022 | [工具] 小红书创作页首个上传图文按钮不可见，需尝试第二个 | 已知问题 | R002 | R002 | 5 | 已缓释 | xiaohongshu-publisher.md |
| PAT-015 | [工具] cursor-ide-browser 用于图片生成（导航 AI Studio、GenerateImage）→ 禁止 | 错误预防 | R002 | R002 | 1 | 已缓释 | creature-image-generation-preference.mdc, 各 image 相关 agent |
| PAT-016 | [工具] browser_install / Chrome for Testing 禁令强化（用户特别关注） | 错误预防 | R002 | R002 | 1 | 已缓释 | creature-image-generation-preference.mdc, 各 image 相关 agent |
| PAT-017 | [输出] 图片路径多一层 creatures/ → docs/creatures/images/creatures/creatures/CR... | 错误预防 | R002 | R002 | 1 | 已缓释 | xiaohongshu-publisher.md, creature-lifestyle-growth-image-generator.md |
| PAT-018 | [流程] 主流程先试 GenerateImage 再改用 Playwright → 应直接委派 subagent | 错误预防 | R002 | R002 | 1 | 已缓释 | creature-image-generation-preference.mdc |
| PAT-019 | [输出] 生活图 prompts 定义 N 场景只完成部分 → 须全部完成或显式标记部分完成 | 错误预防 | R002 | R002 | 1 | 已缓释 | creature-lifestyle-growth-image-generator.md |
