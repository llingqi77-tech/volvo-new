/**
 * 使用示例：如何在 React 组件中使用 DeepSeek 官方 API
 *
 * 这个文件展示了如何替换现有的模拟代码为真实的 AI 调用
 */

import { useState } from 'react';
import { streamChatCompletion, type Message } from './openrouter-client';

// ============================================
// 示例 1：聊天模式（ChatMode.tsx）
// ============================================

export function ExampleChatMode() {
  const [messages, setMessages] = useState<Array<{ id: string; role: string; text: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async (userQuestion: string) => {
    // 添加用户消息
    const userMsgId = `user-${Date.now()}`;
    setMessages((prev) => [...prev, { id: userMsgId, role: 'user', text: userQuestion }]);

    // 准备 AI 消息占位符
    const assistantMsgId = `assistant-${Date.now()}`;
    setMessages((prev) => [...prev, { id: assistantMsgId, role: 'assistant', text: '' }]);

    setIsLoading(true);

    try {
      // 构建消息历史
      const apiMessages: Message[] = [
        {
          role: 'system',
          content: '你是一位专业的汽车行业研究专家，擅长用户洞察和市场分析。',
        },
        ...messages.map((msg) => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.text,
        })),
        { role: 'user', content: userQuestion },
      ];

      // 流式调用 API
      await streamChatCompletion(apiMessages, {
        onChunk: (chunk) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId ? { ...msg, text: msg.text + chunk } : msg
            )
          );
        },
        onComplete: () => {
          setIsLoading(false);
        },
        onError: (error) => {
          console.error('AI 调用失败:', error);
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId
                ? { ...msg, text: `错误：${error.message}` }
                : msg
            )
          );
          setIsLoading(false);
        },
      });
    } catch (error) {
      console.error('发送消息失败:', error);
      setIsLoading(false);
    }
  };

  return (
    <div>
      {/* 消息列表 */}
      {messages.map((msg) => (
        <div key={msg.id} className={msg.role === 'user' ? 'user-message' : 'assistant-message'}>
          {msg.text}
        </div>
      ))}

      {/* 输入框 */}
      <input
        type="text"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !isLoading) {
            handleSendMessage(e.currentTarget.value);
            e.currentTarget.value = '';
          }
        }}
        disabled={isLoading}
      />
    </div>
  );
}

// ============================================
// 示例 2：正式研究 - 动态核验（FormalResearch.tsx）
// ============================================

export function ExampleDynamicVerification() {
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [userAnswer, setUserAnswer] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  const generateNextQuestion = async (previousAnswers: string[]) => {
    setIsThinking(true);

    try {
      const systemPrompt = `你是一位专业的研究规划师。根据用户之前的回答，生成下一个深入的研究问题。
要求：
1. 问题要具体、可操作
2. 避免重复之前的问题
3. 逐步深入核心研究目标`;

      const userPrompt = `用户之前的回答：
${previousAnswers.map((ans, i) => `${i + 1}. ${ans}`).join('\n')}

请生成下一个研究问题（只返回问题本身，不要额外解释）：`;

      let nextQuestion = '';

      await streamChatCompletion(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        {
          onChunk: (chunk) => {
            nextQuestion += chunk;
          },
          onComplete: () => {
            setCurrentQuestion(nextQuestion.trim());
            setIsThinking(false);
          },
          onError: (error) => {
            console.error('生成问题失败:', error);
            setCurrentQuestion('无法生成下一个问题，请重试。');
            setIsThinking(false);
          },
        }
      );
    } catch (error) {
      console.error('生成问题失败:', error);
      setIsThinking(false);
    }
  };

  return (
    <div>
      {isThinking ? (
        <div>AI 正在思考下一个问题...</div>
      ) : (
        <div>
          <p>{currentQuestion}</p>
          <input
            type="text"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            placeholder="请输入您的回答"
          />
          <button onClick={() => generateNextQuestion([userAnswer])}>提交</button>
        </div>
      )}
    </div>
  );
}

// ============================================
// 示例 3：三栏执行界面 - 分析生成（FormalResearch.tsx）
// ============================================

export function ExampleThreeColumnAnalysis() {
  const [leftContent, setLeftContent] = useState(''); // 访谈记录
  const [centerContent, setCenterContent] = useState(''); // AI 分析
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const runAnalysis = async () => {
    if (!leftContent.trim()) {
      alert('请先在左侧输入访谈记录');
      return;
    }

    setIsAnalyzing(true);
    setCenterContent(''); // 清空之前的分析

    try {
      const systemPrompt = `你是一位专业的用户研究分析师。请基于提供的访谈记录，进行深度分析。

分析框架：
1. 核心洞察：用户的真实需求和痛点
2. 行为模式：用户的决策逻辑和使用习惯
3. 机会点：可以改进或创新的方向
4. 建议：具体的产品或服务优化建议

要求：
- 每个洞察都要引用原文证据
- 分析要深入，避免表面化
- 建议要具体、可执行`;

      const userPrompt = `访谈记录：
${leftContent}

请按照上述框架进行分析：`;

      await streamChatCompletion(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        {
          onChunk: (chunk) => {
            setCenterContent((prev) => prev + chunk);
          },
          onComplete: () => {
            setIsAnalyzing(false);
          },
          onError: (error) => {
            console.error('分析失败:', error);
            setCenterContent(`分析失败：${error.message}`);
            setIsAnalyizing(false);
          },
        }
      );
    } catch (error) {
      console.error('分析失败:', error);
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="grid grid-cols-3 gap-4">
      {/* 左栏：访谈记录 */}
      <div>
        <h3>访谈记录</h3>
        <textarea
          value={leftContent}
          onChange={(e) => setLeftContent(e.target.value)}
          placeholder="粘贴或输入访谈记录..."
          rows={20}
        />
      </div>

      {/* 中栏：AI 分析 */}
      <div>
        <h3>AI 分析</h3>
        <button onClick={runAnalysis} disabled={isAnalyzing}>
          {isAnalyzing ? '分析中...' : '运行分析'}
        </button>
        <div className="analysis-result">{centerContent}</div>
      </div>

      {/* 右栏：洞察总结 */}
      <div>
        <h3>洞察总结</h3>
        <textarea placeholder="基于分析结果，总结关键洞察..." rows={20} />
      </div>
    </div>
  );
}

// ============================================
// 如何在现有组件中替换模拟代码
// ============================================

/*
在 ChatMode.tsx 中：

// 旧代码（模拟）：
setTimeout(() => {
  setCustomerMessages(prev => [...prev, {
    id: `c-a-${Date.now()}`,
    role: 'assistant',
    text: '这是模拟的 AI 回复...'
  }]);
}, 500);

// 新代码（真实 API）：
const assistantId = `c-a-${Date.now()}`;
setCustomerMessages(prev => [...prev, {
  id: assistantId,
  role: 'assistant',
  text: ''
}]);

await streamChatCompletion(
  [
    { role: 'system', content: '你是专业的研究助手' },
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
*/
