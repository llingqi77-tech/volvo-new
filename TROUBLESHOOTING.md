# 动态验证问题卡住 - 故障排除

## 问题描述

用户输入研究问题后，在生成第三个验证问题时卡住，无法继续。

## 已修复的问题

### 1. 竞态条件（Race Condition）

**问题**：
- `submitAnswer` 函数中，API 调用（异步）和 `setTimeout`（700ms）同时执行
- 如果 API 调用超过 700ms，`currentIndex` 会先更新，导致状态不一致

**修复**：
```typescript
// 修复前
const nextQuestion = await generateNextQuestion(...);
setQuestions([...prev, nextQuestion]);
setTimeout(() => setCurrentIndex(prev + 1), 700); // 可能先执行

// 修复后
const nextQuestion = await generateNextQuestion(...);
setQuestions([...prev, nextQuestion]);
// 等待 API 完成后再更新索引
setTimeout(() => setCurrentIndex(prev + 1), 300);
```

### 2. 错误处理不完善

**问题**：
- `generateNextQuestion` 没有检查 API 响应状态
- 没有处理 API 返回的错误信息

**修复**：
```typescript
if (!response.ok) {
  throw new Error(`API 返回错误: ${response.status}`);
}

if (result.error) {
  throw new Error(result.error);
}
```

### 3. 添加调试日志

添加了详细的 console.log，方便排查问题：
- 提交答案时的状态
- 生成下一题的参数
- API 调用结果
- 索引更新

## 如何调试

### 1. 打开浏览器控制台（F12）

查看 Console 标签页，应该看到类似的日志：

```
提交答案: {questionId: "q1", answer: ["选项A"], currentIndex: 0, totalQuestions: 1}
生成下一题，当前轮次: 1 历史答案: [{question: "...", answer: ["..."]}]
下一题生成成功: {id: "q2", mode: "single", title: "...", options: [...]}
更新索引到: 1
```

### 2. 检查 Network 标签页

查看 `/api/generate-question` 请求：
- **Status**: 应该是 200
- **Response**: 应该包含 `question` 对象
- **Time**: 应该在 3-5 秒内

### 3. 检查 API 服务器日志

```bash
# 查看最近的日志
tail -f C:\Users\HUAWEI\AppData\Local\Temp\claude\...\bcl5qu4hr.output
```

应该看到：
```
API Request: {
  apiUrl: 'https://api.deepseek.com/v1/chat/completions',
  model: 'deepseek-chat',
  messageCount: 2
}
```

## 常见问题

### 问题 1：卡在"AI 正在思考并生成下一题..."

**可能原因**：
1. API 调用超时
2. 网络连接问题
3. DeepSeek API 限流

**解决方案**：
1. 检查网络连接
2. 查看浏览器控制台的错误信息
3. 等待 30 秒，如果还卡住，刷新页面重试

### 问题 2：显示默认问题（"请选择第 X 个研究参数"）

**原因**：API 调用失败，使用了 fallback 问题

**解决方案**：
1. 检查 API key 是否有效
2. 检查 DeepSeek API 是否正常
3. 查看 API 服务器日志的错误信息

### 问题 3：问题生成速度很慢

**原因**：DeepSeek API 响应慢或网络延迟

**解决方案**：
1. 检查网络连接
2. 等待更长时间（最多 10 秒）
3. 如果持续慢，考虑切换 API provider

## 测试步骤

### 1. 测试 API 端点

```bash
curl -X POST http://localhost:3001/api/generate-question \
  -H "Content-Type: application/json" \
  -d '{
    "userInput": "比较 BMW iX 和 Audi e-tron",
    "classification": {"kind": "testing", "framework": "stp"},
    "previousAnswers": [
      {"question": "问题1", "answer": ["答案1"]},
      {"question": "问题2", "answer": ["答案2"]}
    ],
    "round": 3
  }'
```

预期响应：
```json
{
  "question": {
    "id": "q3",
    "mode": "single",
    "title": "...",
    "options": ["...", "...", "..."]
  }
}
```

### 2. 测试前端流程

1. 刷新页面
2. 输入："比较 BMW iX 和 Audi e-tron"
3. 点击"开始研究"
4. 等待分类完成（3-5 秒）
5. 回答第一个问题
6. 观察是否正常生成第二个问题
7. 回答第二个问题
8. 观察是否正常生成第三个问题

### 3. 检查日志

打开浏览器控制台，应该看到：
- 每次提交答案的日志
- 每次生成问题的日志
- 没有红色的错误信息

## 性能优化建议

1. **添加加载状态**：显示"正在生成第 X 题..."
2. **添加超时处理**：如果 10 秒还没响应，显示错误提示
3. **添加重试机制**：失败后自动重试 1-2 次
4. **缓存问题**：相同的输入不重复调用 API

## 联系支持

如果问题持续存在：
1. 导出浏览器控制台日志（右键 → Save as...）
2. 导出 API 服务器日志
3. 提供复现步骤
