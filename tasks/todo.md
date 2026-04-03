# 开发计划

## 任务1: 修复 VOC 情感筛选联动错误
- [x] 1.1 阅读 `src/pages/ChatMode.tsx` 中 VOC 统计数据计算逻辑
- [x] 1.2 修改 `filteredTotal` 和 `vocStats`：当只选中某几种情感时，对应的 sentiment 统计应正确联动（只显示选中情感的统计，未选中的显示 0）
- [x] 1.3 验证修改后的联动逻辑（各组合情况：只选正面、正面+负面、全选等）

## 任务2: 调研方案 & 访谈大纲支持对话式迭代修改
- [x] 2.1 阅读 `src/pages/FormalResearch.tsx`、`src/api/server.ts`、`src/prompts/research/plan-generator.ts`
- [x] 2.2 在前端接入真实 `/api/generate-plan` 调用，替换当前的静态 HTML mock
- [x] 2.3 新增 `/api/generate-refine-questions` 后端接口：接收用户修改意图，返回 3-5 个反问问题（单选/多选）
- [x] 2.4 新增 `/api/refine-plan` 后端接口：接收原始方案 + 用户反馈，返回修改后的 `researchPlan` 和 `interviewGuide`
- [x] 2.5 设计前端对话式修改 UI（左侧对话区底部输入框 → AI 反问 → 用户回答 → 生成新版本）
- [x] 2.6 实现版本历史管理（调研方案 1.0 / 2.0 / ...，访谈大纲 1.0 / 2.0 / ...），支持用户自由切换并选择其一进入下一步
- [x] 2.7 自测：验证生成、反问、修改、版本切换的完整流程

## 集成与收尾
- [x] 3.1 运行项目构建/类型检查，确保无编译错误
- [ ] 3.2 更新 `tasks/lessons.md`（如有修正）
