/**
 * OpenRouter API Client for Step-3.5 Model
 *
 * This client provides streaming chat completion using OpenRouter's API.
 * Compatible with OpenAI SDK format.
 */

// 支持自定义 base URL
const getApiUrl = () => {
  const baseUrl = process.env.OPENROUTER_BASE_URL;
  if (baseUrl) {
    // 如果提供了自定义 base URL，确保它以 /v1/chat/completions 结尾
    return baseUrl.endsWith('/v1/chat/completions')
      ? baseUrl
      : `${baseUrl.replace(/\/$/, '')}/v1/chat/completions`;
  }
  return 'https://openrouter.ai/api/v1/chat/completions';
};

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface StreamOptions {
  onChunk: (text: string) => void;
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Stream chat completion from OpenRouter
 *
 * @param messages - Array of chat messages
 * @param options - Streaming callbacks
 */
export async function streamChatCompletion(
  messages: Message[],
  options: StreamOptions
): Promise<void> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || 'stepfun/step-3.5-flash:free';
  const apiUrl = getApiUrl();

  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not configured');
  }

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Volvo Research Workbench',
      },
      body: JSON.stringify({
        model,
        messages,
        stream: true,
        temperature: 0.7,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `OpenRouter API error: ${response.status} ${response.statusText}. ${JSON.stringify(errorData)}`
      );
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Response body is not readable');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        options.onComplete?.();
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === 'data: [DONE]') continue;

        if (trimmed.startsWith('data: ')) {
          try {
            const json = JSON.parse(trimmed.slice(6));
            const content = json.choices?.[0]?.delta?.content;

            if (content) {
              options.onChunk(content);
            }
          } catch (e) {
            console.warn('Failed to parse SSE chunk:', trimmed, e);
          }
        }
      }
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    options.onError?.(err);
    throw err;
  }
}

/**
 * Non-streaming chat completion (for simple use cases)
 *
 * @param messages - Array of chat messages
 * @param timeoutMs - OpenRouter 请求超时；长文案生成（如调研方案）需 120s+
 * @returns Complete response text
 */
export async function chatCompletion(messages: Message[], timeoutMs = 90000): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || 'stepfun/step-3.5-flash:free';
  const apiUrl = getApiUrl();

  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not configured');
  }

  console.log('API Request:', { apiUrl, model, messageCount: messages.length, timeoutMs });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
        'X-Title': 'Volvo Research Workbench',
      },
      body: JSON.stringify({
        model,
        messages,
        stream: false,
        temperature: 0.7,
        max_tokens: 4096,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `OpenRouter API error: ${response.status} ${response.statusText}. ${JSON.stringify(errorData)}`
      );
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  } finally {
    clearTimeout(timeoutId);
  }
}
