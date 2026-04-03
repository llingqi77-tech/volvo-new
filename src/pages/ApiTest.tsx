/**
 * API 测试页面
 *
 * 访问路径：http://localhost:3000/api-test
 * 用于验证 DeepSeek 官方 API 配置是否正确
 */

import { useState } from 'react';
import { streamChatCompletion } from '../lib/openrouter-client';

export default function ApiTestPage() {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const testApi = async () => {
    if (!input.trim()) {
      setError('请输入测试消息');
      return;
    }

    setIsLoading(true);
    setResponse('');
    setError('');

    try {
      await streamChatCompletion(
        [
          { role: 'system', content: '你是一个友好的 AI 助手。' },
          { role: 'user', content: input },
        ],
        {
          onChunk: (chunk) => {
            setResponse((prev) => prev + chunk);
          },
          onComplete: () => {
            setIsLoading(false);
          },
          onError: (err) => {
            setError(err.message);
            setIsLoading(false);
          },
        }
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">DeepSeek API 测试</h1>

        {/* API 配置信息 */}
        <div className="bg-surface rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">当前配置</h2>
          <div className="space-y-2 text-sm">
            <div className="flex">
              <span className="text-gray-400 w-32">API Key:</span>
              <span className="text-white font-mono">
                {process.env.DEEPSEEK_API_KEY
                  ? `${process.env.DEEPSEEK_API_KEY.slice(0, 20)}...`
                  : '未配置'}
              </span>
            </div>
            <div className="flex">
              <span className="text-gray-400 w-32">模型:</span>
              <span className="text-white font-mono">
                {process.env.DEEPSEEK_MODEL || 'deepseek-chat'}
              </span>
            </div>
            <div className="flex">
              <span className="text-gray-400 w-32">状态:</span>
              <span
                className={`font-semibold ${process.env.DEEPSEEK_API_KEY ? 'text-green-400' : 'text-red-400'}`}
              >
                {process.env.DEEPSEEK_API_KEY ? '✓ 已配置' : '✗ 未配置'}
              </span>
            </div>
          </div>
        </div>

        {/* 测试输入 */}
        <div className="bg-surface rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">发送测试消息</h2>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入测试消息，例如：你好，请介绍一下自己"
            className="w-full h-32 bg-background text-white rounded-lg p-4 border border-gray-700 focus:border-primary focus:outline-none"
          />
          <button
            onClick={testApi}
            disabled={isLoading || !process.env.DEEPSEEK_API_KEY}
            className="mt-4 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? '请求中...' : '发送测试'}
          </button>
        </div>

        {/* 响应结果 */}
        {(response || error) && (
          <div className="bg-surface rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              {error ? '错误信息' : 'AI 响应'}
            </h2>
            <div
              className={`p-4 rounded-lg ${error ? 'bg-red-900/20 text-red-400' : 'bg-background text-white'}`}
            >
              {error || response}
            </div>
          </div>
        )}

        {/* 使用说明 */}
        <div className="mt-8 bg-surface rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">使用说明</h2>
          <div className="text-sm text-gray-400 space-y-2">
            <p>1. 确保 .env 文件中配置了 DEEPSEEK_API_KEY 和 DEEPSEEK_MODEL</p>
            <p>2. 重启开发服务器（npm run dev）使环境变量生效</p>
            <p>3. 在上方输入框输入测试消息，点击"发送测试"</p>
            <p>4. 如果配置正确，将看到 AI 的流式响应</p>
            <p className="mt-4 text-yellow-400">
              ⚠️ 注意：DeepSeek 的免费模型可能有速率限制
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
