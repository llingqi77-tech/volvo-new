# OpenRouter API 集成说明

## 配置完成 ✅

已将项目从 Gemini API 迁移到 OpenRouter 的 Step-3.5 模型。

### 当前配置

- **API 提供商**: OpenRouter (https://openrouter.ai)
- **模型**: `stepfun/step-3.5-flash:free`
- **API Key**: 已配置在 `.env` 文件中

### 文件变更

#### 1. 环境配置
- ✅ `.env.example` - 更新为 OpenRouter 配置模板
- ✅ `.env` - 创建实际配置文件（包含真实 API Key）
- ✅ `vite.config.ts` - 更新环境变量注入逻辑

#### 2. 新增文件
- ✅ `src/lib/openrouter-client.ts` - OpenRouter API 客户端（支持流式响应）
- ✅ `src/lib/usage-examples.tsx` - 使用示例（展示如何替换模拟代码）
- ✅ `src/pages/ApiTest.tsx` - API 测试页面

#### 3. 修改文件
- ✅ `src/App.tsx` - 添加 API 测试页面路由
- ✅ `src/components/Sidebar.tsx` - 添加"API 测试"菜单项

---

## 快速开始

### 1. 验证配置

启动开发服务器：

```bash
cd D:/volvo/volvo-new
npm run dev
```

访问 API 测试页面：
- 在侧边栏点击"API 测试"
- 或直接访问 http://localhost:3000（然后点击侧边栏的"API 测试"）

### 2. 测试 API

在测试页面：
1. 查看"当前配置"区域，确认 API Key 和模型已正确加载
2. 在输入框输入测试消息，例如："你好，请介绍一下自己"
3. 点击"发送测试"按钮
4. 观察流式响应是否正常

**预期结果**：
- 状态显示为"✓ 已配置"
- 点击发送后，AI 响应会逐字显示（流式输出）
- 响应内容应该是中文，符合 Step-3.5 模型的特点

---

## 集成到现有功能

### 方案 1：快速替换（推荐用于验证）

在 `ChatMode.tsx` 中替换模拟代码：

```typescript
// 导入 API 客户端
import { streamChatCompletion } from '../lib/openrouter-client';

// 替换原有的 setTimeout 模拟代码
const handleSendMessage = async (question: string) => {
  const assistantId = `c-a-${Date.now()}`;
  setCustomerMessages(prev => [...prev, {
    id: assistantId,
    role: 'assistant',
    text: ''
  }]);

  await streamChatCompletion(
    [
      { role: 'system', content: '你是一位专业的汽车行业研究专家。' },
      { role: 'user', content: question }
    ],
    {
      onChunk: (chunk) => {
        setCustomerMessages(prev => prev.map(msg =>
          msg.id === assistantId ? { ...msg, text: msg.text + chunk } : msg
        ));
      }
    }
  );
};
```

### 方案 2：完整集成（生产环境）

参考 `src/lib/usage-examples.tsx` 中的完整示例：
- 示例 1：聊天模式集成
- 示例 2：动态核验问题生成
- 示例 3：三栏分析界面集成

---

## API 客户端功能

### `streamChatCompletion(messages, options)`

流式聊天完成（推荐）

**参数**：
- `messages`: 消息数组，格式为 `{ role: 'system' | 'user' | 'assistant', content: string }[]`
- `options.onChunk`: 接收每个文本片段的回调函数
- `options.onComplete`: 流式响应完成时的回调（可选）
- `options.onError`: 错误处理回调（可选）

**示例**：
```typescript
await streamChatCompletion(
  [
    { role: 'system', content: '你是专业助手' },
    { role: 'user', content: '用户问题' }
  ],
  {
    onChunk: (text) => console.log(text),
    onComplete: () => console.log('完成'),
    onError: (err) => console.error(err)
  }
);
```

### `chatCompletion(messages)`

非流式聊天完成（简单场景）

**参数**：
- `messages`: 消息数组

**返回**：
- `Promise<string>`: 完整的 AI 响应文本

**示例**：
```typescript
const response = await chatCompletion([
  { role: 'system', content: '你是专业助手' },
  { role: 'user', content: '用户问题' }
]);
console.log(response);
```

---

## OpenRouter 特性

### 优势
1. **统一接口**：兼容 OpenAI API 格式，易于迁移
2. **多模型支持**：可随时切换到其他模型（Claude、GPT-4 等）
3. **免费额度**：Step-3.5-flash:free 提供免费调用
4. **流式响应**：支持 Server-Sent Events (SSE)

### 速率限制
- 免费模型可能有 RPM（每分钟请求数）限制
- 建议实现请求队列和重试机制（生产环境）

### 切换模型

修改 `.env` 文件中的 `OPENROUTER_MODEL`：

```bash
# 切换到 Claude Sonnet
OPENROUTER_MODEL="anthropic/claude-3.5-sonnet"

# 切换到 GPT-4
OPENROUTER_MODEL="openai/gpt-4-turbo"

# 切换到 Gemini
OPENROUTER_MODEL="google/gemini-pro"
```

查看所有可用模型：https://openrouter.ai/models

---

## 下一步计划

### Phase 1：基础验证（当前）
- [x] 配置 OpenRouter API
- [x] 创建 API 客户端
- [x] 添加测试页面
- [ ] 验证 API 调用正常

### Phase 2：功能集成
- [ ] 替换 ChatMode 的模拟代码
- [ ] 集成到动态核验流程
- [ ] 实现三栏分析功能

### Phase 3：分析框架集成
- [ ] 创建 JTBD/KANO/STP 提示词文件
- [ ] 实现分析引擎
- [ ] 添加框架选择器

---

## 故障排查

### 问题 1：API Key 未加载

**症状**：测试页面显示"✗ 未配置"

**解决方案**：
1. 确认 `.env` 文件存在于项目根目录
2. 重启开发服务器（`npm run dev`）
3. 检查 `vite.config.ts` 中的 `define` 配置

### 问题 2：CORS 错误

**症状**：浏览器控制台显示跨域错误

**解决方案**：
- OpenRouter 支持浏览器直接调用，无需后端代理
- 确保请求头包含 `HTTP-Referer` 和 `X-Title`（已在客户端中配置）

### 问题 3：流式响应中断

**症状**：响应只显示部分内容就停止

**解决方案**：
1. 检查网络连接
2. 查看浏览器控制台是否有错误
3. 尝试非流式 API（`chatCompletion`）排查问题

### 问题 4：速率限制

**症状**：返回 429 错误

**解决方案**：
- 等待 1 分钟后重试
- 考虑升级到付费模型
- 实现请求队列和指数退避重试

---

## 技术支持

- OpenRouter 文档：https://openrouter.ai/docs
- Step-3.5 模型信息：https://openrouter.ai/models/stepfun/step-3.5-flash
- 项目问题反馈：联系开发团队

---

## 安全提示

⚠️ **重要**：
- `.env` 文件已添加到 `.gitignore`，不会提交到 Git
- 不要在代码中硬编码 API Key
- 生产环境建议使用环境变量或密钥管理服务
- 定期轮换 API Key
