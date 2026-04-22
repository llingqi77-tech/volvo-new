# Volvo Insight 前端项目

一个面向研究团队的 AI 研究工作台前端应用，覆盖文档知识库、人设生成、专家/客户智能体对话、正式研究流程、任务中心与个人中心。

---

## 🚀 快速启动

### Windows 用户

双击运行 `start-dev.bat`，或在命令行中执行：

```cmd
start-dev.bat
```

### Mac/Linux 用户

```bash
./start-dev.sh
```

### 手动启动

```bash
# 推荐：一条命令同时启动前端（3000）与 API（3001）
npm run dev

# 仅前端（不启动 API，正式研究等 /api 接口将不可用）
npm run dev:client

# 仅 API
npm run api
```

### 访问地址

- **前端界面**：http://localhost:3000/volvo-new/
- **API 服务器**：http://localhost:3001

---

## 1. 技术栈

- `React 19`
- `TypeScript`
- `Vite`
- `Tailwind CSS`
- `Lucide React`（图标）
- `Recharts`（图表）
- `pdfjs-dist`（前端 PDF 解析）
- `Express`（API 服务器）
- `OpenRouter API`（AI 模型调用）

---

## 2. 项目功能概览

### 2.1 知识库管理

- PDF 上传（点击/拖拽）
- 上传时可选择文档归属：
  - 洞察报告
  - 整车知识
  - 行业报告
- 文档支持查看、删除、搜索和按分类筛选
- 任务中心中"已归档"报告会自动入库到知识库

### 2.2 人设库管理

- 人设卡片浏览与标签筛选
- 新建自定义人设
- 人设详情页包含：
  - CDP 标签
  - VOC 原始文本
  - 七维雷达图（人口与成长轨迹、心理动因、心理特征维度、行为维度、需求与痛点维度、技术接受度维度、社会关系维度）

### 2.3 聊天模式

- 专家智能体：
  - 可连续对话
  - 知识范围可选（洞察/整车/行业）
  - 垂媒检索开关
  - 报告导出
- 客户智能体：
  - 入口页支持提问与上传 PDF
  - 上传后解析客户信息并生成人设卡片
  - 对话流支持逐步分析与完整问题选项保留展示（不压缩）

### 2.4 正式研究流程（✨ 新增 AI 自动分类）

- **StepStart**：文本输入 + 语音输入 + PDF 附件
- **动态核验（AI 自动分类）**：
  - AI 自动判断研究类型（6 种）：testing/insights/creation/planning/productRnD/misc
  - AI 自动选择分析框架（4 种）：JTBD/KANO/STP/Journey Map
  - 根据分类结果动态生成 5 轮验证问题
  - 每轮问题基于之前的回答智能生成
- **三栏执行页**：方案/大纲/人群选择可交互调整
- **细分市场分析（人群画像调整）**：
  - 自动匹配多个 CDP 画像
  - 支持对标签进行全局调整
  - 生成新画像、生成模拟人设
  - 人设卡片可点进详情（CDP/VOC/七维雷达）
- **报告详情页**：支持下载 PDF

### 2.5 任务中心

- 分类：
  - 全部
  - 已评审
  - 已归档
- 流程约束：先评审再归档
- 归档后自动写入知识库（避免重复标题）

### 2.6 个人中心与菜单

- 左侧底部个人区（头像 + 邮箱）可上弹菜单
- 顶部头像点击后为完整右侧抽屉菜单
- 菜单项包括个人信息、我的项目、退出登录

---

## 3. 本地启动

### 3.1 环境要求

- Node.js 18+（建议 LTS）
- npm 9+

### 3.2 安装依赖

```bash
npm install
```

### 3.3 配置环境变量

创建 `.env` 文件（如果不存在）：

```env
OPENROUTER_API_KEY="sk-or-v1-..."
OPENROUTER_MODEL="stepfun/step-3.5-flash:free"
```

### 3.4 启动开发环境

```bash
# 推荐：同时启动前端和 API
npm run dev

# 或使用启动脚本
./start-dev.sh  # Mac/Linux
start-dev.bat   # Windows
```

默认地址：

- 前端：`http://localhost:3000/volvo-new/`
- API：`http://localhost:3001`

### 3.5 构建生产包

```bash
npm run build
```

### 3.6 本地预览生产包

```bash
npm run preview
```

---

## 4. 目录结构（核心）

```text
src/
  components/
    Sidebar.tsx
    Topbar.tsx
    Modal.tsx
  pages/
    KnowledgeBase.tsx
    PersonaLibrary.tsx
    ChatMode.tsx
    FormalResearch.tsx      # ✨ 集成了 AI 自动分类
    TaskCenter.tsx
    ProfileCenter.tsx
  prompts/                  # ✨ 新增：AI 提示词系统
    research/
      classifier.ts         # 研究分类（6 种 kind + 4 种 framework）
      dynamic-verify.ts     # 动态验证问题生成
      analysis.ts           # 分析执行
      report.ts             # 报告生成
    frameworks/
      jtbd.ts              # Jobs-to-be-Done 框架
      kano.ts              # KANO 模型
      stp.ts               # STP 营销模型
      journey-map.ts       # 用户旅程地图
  lib/
    openrouter-client.ts   # OpenRouter API 客户端
    analysis-engine.ts     # 分析引擎
    report-generator.ts    # 报告生成器
  api/                     # ✨ 新增：API 服务器
    server.ts              # Express 服务器
  App.tsx
  index.css
```

---

## 5. 业务状态联动说明

- `App.tsx` 维护全局 `docs` 和 `tasks`
- `TaskCenter` 在归档时触发写入知识库
- `KnowledgeBase` 读取并展示统一文档状态

---

## 6. 常见命令

```bash
npm run dev        # 前端（3000）+ API（3001）
npm run dev:client # 仅前端
npm run api        # 仅 API（端口 3001）
npm run build      # 构建生产版本
npm run preview    # 预览生产版本
npm run lint       # TypeScript 类型检查
```

---

## 7. 🐛 故障排除

### 问题 1：端口被占用

**症状**：`Error: listen EADDRINUSE: address already in use :::3001`

**解决方案**：

Windows:
```cmd
netstat -ano | findstr :3001
taskkill /F /PID <PID>
```

Mac/Linux:
```bash
lsof -ti:3001 | xargs kill -9
```

### 问题 2：API 返回 "OPENROUTER_API_KEY is not configured"

**解决方案**：

1. 确认 `.env` 文件存在于项目根目录
2. 检查 `.env` 文件内容是否正确
3. 重启 API 服务器

### 问题 3：前端页面卡在"AI 正在分析..."

**可能原因**：
1. API 服务器未启动
2. 网络请求失败

**解决方案**：

1. 确认 API 服务器正在运行：
   ```bash
   curl http://localhost:3001/api/classify-research -X POST \
     -H "Content-Type: application/json" \
     -d '{"userInput":"test"}'
   ```

2. 检查浏览器控制台（F12）的错误信息

3. 使用 `npm run dev` 同时启动前端和 API

---

## 8. ✨ 新功能：AI 自动研究分类

### 研究类型（6 种）

| 类型 | 说明 | 触发条件 |
|------|------|----------|
| `testing` | 测试型 | 比较、验证、A/B 测试 |
| `insights` | 洞察型 | 了解用户、发现问题、行为分析 |
| `creation` | 创造型 | 设计方案、头脑风暴、创意生成 |
| `planning` | 规划型 | 制定策略、规划路线图 |
| `productRnD` | 产品研发 | 创新机会、新产品灵感 |
| `misc` | 综合型 | 多目标复合研究 |

### 分析框架（4 种）

| 框架 | 说明 | 适用场景 |
|------|------|----------|
| `jtbd` | Jobs-to-be-Done | 用户决策/需求理解 |
| `kano` | KANO 模型 | 功能优先级/属性分类 |
| `stp` | STP 营销模型 | 市场定位/细分 |
| `journey-map` | 用户旅程地图 | 使用流程/体验分析 |

### API 端点

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
  "rationale": "...",
  "confidence": "high"
}
```

#### POST /api/generate-question

根据分类结果和之前的回答生成下一个验证问题。

详细文档请查看：[INTEGRATION.md](./INTEGRATION.md)

---

## 9. 说明

- 当前"退出登录"为演示行为（前端提示），未接真实鉴权。
- PDF 下载与部分 AI 对话为前端模拟流程，后续可接后端服务增强。
- AI 自动分类功能已集成到正式研究流程的 Step 2（动态核验）。
