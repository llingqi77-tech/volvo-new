# 模型性能对比

## 当前使用的模型

- **模型**：`stepfun/step-3.5-flash:free`
- **类型**：推理模型（Reasoning Model）
- **响应时间**：10-15 秒
- **特点**：
  - ✅ 免费
  - ✅ 推理能力强
  - ❌ 速度较慢（需要推理时间）

## 推荐的替代模型

### 1. Google Gemini 2.0 Flash（推荐）

```env
OPENROUTER_MODEL="google/gemini-2.0-flash-exp:free"
```

- **响应时间**：2-4 秒
- **特点**：
  - ✅ 免费
  - ✅ 速度快
  - ✅ 质量高
  - ✅ 支持中文

### 2. Meta Llama 3.1 8B

```env
OPENROUTER_MODEL="meta-llama/llama-3.1-8b-instruct:free"
```

- **响应时间**：1-3 秒
- **特点**：
  - ✅ 免费
  - ✅ 速度非常快
  - ⚠️ 中文支持一般

### 3. Qwen 2.5 7B（推荐中文）

```env
OPENROUTER_MODEL="qwen/qwen-2.5-7b-instruct:free"
```

- **响应时间**：2-3 秒
- **特点**：
  - ✅ 免费
  - ✅ 速度快
  - ✅ 中文支持优秀

## 如何切换模型

1. 编辑 `.env` 文件
2. 修改 `OPENROUTER_MODEL` 的值
3. 重启 API 服务器：
   ```bash
   # 杀掉旧进程
   taskkill /F /PID <PID>
   
   # 重新启动
   npm run api
   ```

## 性能测试

测试命令：
```bash
time curl -s http://localhost:3001/api/classify-research \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"userInput":"比较 BMW iX 和 Audi e-tron"}'
```

预期响应时间：
- Step-3.5 Flash: 10-15 秒
- Gemini 2.0 Flash: 2-4 秒
- Llama 3.1 8B: 1-3 秒
- Qwen 2.5 7B: 2-3 秒

## 注意事项

1. **免费模型限制**：
   - 可能有速率限制（每分钟请求数）
   - 可能有并发限制
   - 服务稳定性可能不如付费版本

2. **推理模型特性**：
   - Step-3.5 是推理模型，会返回 `reasoning` 字段
   - 其他模型返回 `content` 字段
   - 代码已兼容两种格式

3. **质量 vs 速度**：
   - Step-3.5：质量最高，速度最慢
   - Gemini 2.0 Flash：质量高，速度快（推荐）
   - Llama/Qwen：速度最快，质量中等
