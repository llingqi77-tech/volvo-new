# Volvo Insight 前端项目

一个面向研究团队的 AI 研究工作台前端应用，覆盖文档知识库、人设生成、专家/客户智能体对话、正式研究流程、任务中心与个人中心。

---

## 1. 技术栈

- `React 19`
- `TypeScript`
- `Vite`
- `Tailwind CSS`
- `Lucide React`（图标）
- `Recharts`（图表）
- `pdfjs-dist`（前端 PDF 解析）

---

## 2. 项目功能概览

### 2.1 知识库管理

- PDF 上传（点击/拖拽）
- 上传时可选择文档归属：
  - 洞察报告
  - 整车知识
  - 行业报告
- 文档支持查看、删除、搜索和按分类筛选
- 任务中心中“已归档”报告会自动入库到知识库

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
  - 联网开关
  - 报告导出
- 客户智能体：
  - 入口页支持提问与上传 PDF
  - 上传后解析客户信息并生成人设卡片
  - 对话流支持逐步分析与完整问题选项保留展示（不压缩）

### 2.4 正式研究流程

- StepStart：文本输入 + 语音输入 + PDF 附件
- 动态核验：AI 逐题提问（单选/多选），带思考过程
- 三栏执行页：方案/大纲/人群选择可交互调整
- 细分市场分析（人群画像调整）：
  - 自动匹配多个 CDP 画像
  - 支持对标签进行全局调整
  - 生成新画像、生成模拟人设
  - 人设卡片可点进详情（CDP/VOC/七维雷达）
- 报告详情页：支持下载 PDF

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

### 3.3 启动开发环境

```bash
npm run dev
```

默认地址（本项目配置）：

- `http://localhost:3000`

### 3.4 构建生产包

```bash
npm run build
```

### 3.5 本地预览生产包

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
    FormalResearch.tsx
    TaskCenter.tsx
    ProfileCenter.tsx
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
npm run dev
npm run build
npm run preview
npm run lint
```

---

## 7. 说明

- 当前“退出登录”为演示行为（前端提示），未接真实鉴权。
- PDF 下载与部分 AI 对话为前端模拟流程，后续可接后端服务增强。
