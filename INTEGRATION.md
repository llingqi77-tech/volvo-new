# Volvo Research Workbench - 提示词集成完成

## 概述

已成功将 atypica.AI 的提示词系统复用到 volvo-new 项目的正式研究部分。系统现在支持：

1. **自动研究分类**：AI 自动判断研究类型（6 种）和分析框架（4 种）
2. **动态验证问题**：根据分类结果和用户回答动态生成 5 轮验证问题
3. **分析框架集成**：JTBD、KANO、STP、Journey Map 四种分析框架

## 架构变更

### 新增文件

```
src/
├── prompts/
│   ├── research/
│   │   ├── index.ts              # 统一导出
│   │   ├── classifier.ts         # 研究分类（6 种 kind + 4 种 framework）
│   │   ├── dynamic-verify.ts     # 动态验证问题生成
│   │   ├── analysis.ts           # 分析执行提示词
│   │   └── report.ts             # 报告生成提示词（待集成）
│   └── frameworks/
│       ├── index.ts              # 统一导出
│       ├── jtbd.ts               # Jobs-to-be-Done 框架
│       ├── kano.ts               # KANO 模型
│       ├── stp.ts                # STP 营销模型
│       └── journey-map.ts        # 用户旅程地图
├── lib/
│   ├── analysis-engine.ts        # 分析引擎
│   ├── report-generator.ts       # 报告生成器
│   └── types/
│       ├── analysis.ts           # 分析相关类型
│       └── report.ts             # 报告相关类型
└── api/
    └── server.ts                 # Express API 服务器
```

### 修改文件

- `src/pages/FormalResearch.tsx`：集成分类和动态验证
- `src/lib/openrouter-client.ts`：修复 Node.js 环境兼容性
- `vite.config.ts`：添加 API 代理配置
- `package.json`：添加 API 服务器启动脚本

## 研究类型（6 种）

| 类型 | 说明 | 触发条件 |
|------|------|----------|
| `testing` | 测试型 | 比较、验证、A/B 测试 |
| `insights` | 洞察型 | 了解用户、发现问题、行为分析 |
| `creation` | 创造型 | 设计方案、头脑风暴、创意生成 |
| `planning` | 规划型 | 制定策略、规划路线图 |
| `productRnD` | 产品研发 | 创新机会、新产品灵感 |
| `misc` | 综合型 | 多目标复合研究 |

## 分析框架（4 种）

| 框架 | 说明 | 适用场景 |
|------|------|----------|
| `jtbd` | Jobs-to-be-Done | 用户决策/需求理解 |
| `kano` | KANO 模型 | 功能优先级/属性分类 |
| `stp` | STP 营销模型 | 市场定位/细分 |
| `journey-map` | 用户旅程地图 | 使用流程/体验分析 |

## 使用方法

### 1. 启动开发环境

```bash
# 同时启动前端和 API 服务器
npm run dev:all

# 或分别启动
npm run dev    # 前端（端口 3000）
npm run api    # API 服务器（端口 3001）
```

### 2. 用户流程

1. **Step 1 - 输入研究问题**
   - 用户在第一个页面输入研究问题
   - 点击"开始研究"

2. **Step 2 - 动态验证（自动分类）**
   - AI 自动分析输入，判断研究类型和框架
   - 显示分类结果（kind + framework + rationale）
   - 根据分类结果动态生成 5 轮验证问题
   - 每轮问题基于之前的回答生成

3. **Step 3 - 三列界面**
   - 显示研究类型和分析框架
   - 展示调研方案、访谈大纲、人群选择

4. **后续步骤**
   - 人群画像调整
   - 确认执行
   - 生成报告

### 3. API 端点

#### POST /api/classify-research

自动判断研究类型和分析框架。

**请求**：
```json
{
  "userInput": "比较 BMW iX 和 Audi e-tron 在豪华电动 SUV 市场的竞争力"
}
```

**响应**：
```json
{
  "kind": "testing",
  "framework": "stp",
  "rationale": "用户明确比较两款车型，属于测试型研究。涉及市场定位和细分，适合使用 STP 框架。",
  "confidence": "high"
}
```

#### POST /api/generate-question

根据分类结果和之前的回答生成下一个验证问题。

**请求**：
```json
{
  "userInput": "比较 BMW iX 和 Audi e-tron...",
  "classification": {
    "kind": "testing",
    "framework": "stp",
    "rationale": "..."
  },
  "previousAnswers": [
    {
      "question": "目标消费者年龄段？",
      "answer": ["36-45岁"]
    }
  ],
  "round": 2
}
```

**响应**：
```json
{
  "question": {
    "id": "q2",
    "mode": "single",
    "title": "研究地域优先级？",
    "options": ["北欧", "中国一线城市", "北美", "东南亚"]
  }
}
```

## 测试

```bash
# 运行集成测试
npx tsx src/test-api-integration.ts
```

测试覆盖：
- ✅ 研究分类（classifier）
- ✅ 动态问题生成（dynamic-verify）
- ✅ OpenRouter API 调用
- ✅ JSON 解析和错误处理

## 技术栈

- **前端**：React 19 + Vite + TypeScript
- **后端**：Express + TypeScript
- **AI**：OpenRouter API（Step-3.5 模型）
- **样式**：Tailwind CSS v4

## 环境变量

```env
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL=stepfun/step-3.5-flash:free
API_PORT=3001
```

## 下一步

- [ ] 集成分析引擎到 Step 3（三列界面）
- [ ] 报告生成提示词集成（已创建，待调整）
- [ ] 添加更多分析框架（GE-McKinsey、情感地图）
- [ ] 优化问题生成策略
- [ ] 添加用户反馈机制

## 注意事项

1. **Step-3.5 模型特性**：
   - 返回 `reasoning` 字段而非 `content`
   - 已在 `openrouter-client.ts` 中处理

2. **Node.js 兼容性**：
   - 已修复 `window` 对象引用
   - 支持服务端和客户端环境

3. **代理配置**：
   - Vite 代理 `/api` 到 `localhost:3001`
   - 确保两个服务器同时运行

## 参考

- atypica.AI 原始实现：`D:/atypica/atypica-llm-app`
- 分析框架文档：`public/分析框架.md`
- OpenRouter API：https://openrouter.ai/docs
