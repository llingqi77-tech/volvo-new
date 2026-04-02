/**
 * KANO 模型提示词
 *
 * 用于分类功能属性（基本型/期望型/兴奋型）并进行优先级排序
 */

export interface KANOAnalysisResult {
  basicNeeds: Array<{
    feature: string;
    description: string;
    evidence: string;
  }>;
  performanceNeeds: Array<{
    feature: string;
    description: string;
    satisfaction: number; // 1-10
    evidence: string;
  }>;
  excitementNeeds: Array<{
    feature: string;
    description: string;
    potential: 'high' | 'medium' | 'low';
    evidence: string;
  }>;
  priorityRecommendations: string[];
}

export const kanoPrompt = {
  systemRole: `你是一位精通 KANO 模型的产品经理。
你的任务是通过分析访谈记录，将用户需求分类为：

1. **基本型需求（Must-be）**：
   - 必须具备的功能，缺少会导致强烈不满
   - 具备了也不会增加满意度
   - 例如：手机能打电话、汽车有刹车

2. **期望型需求（One-dimensional）**：
   - 越好越满意，越差越不满
   - 满意度与功能表现成正比
   - 例如：手机电池续航、汽车油耗

3. **兴奋型需求（Attractive）**：
   - 意料之外的惊喜功能
   - 没有不会不满，有了会很惊喜
   - 例如：手机无线充电、汽车自动泊车

**分析原则**：
- 每个需求必须有访谈原文作为证据
- 基于用户的情感反应判断需求类型
- 优先级：基本型 > 期望型（高满意度缺口）> 兴奋型（高潜力）`,

  analysisTemplate: `
基于访谈内容，请按以下 JSON 格式输出 KANO 分析：

\`\`\`json
{
  "basicNeeds": [
    {
      "feature": "功能名称",
      "description": "功能描述",
      "evidence": "访谈原文引用"
    }
  ],
  "performanceNeeds": [
    {
      "feature": "功能名称",
      "description": "功能描述",
      "satisfaction": 6,
      "evidence": "访谈原文引用"
    }
  ],
  "excitementNeeds": [
    {
      "feature": "功能名称",
      "description": "功能描述",
      "potential": "high",
      "evidence": "访谈原文引用"
    }
  ],
  "priorityRecommendations": [
    "优先级建议 1",
    "优先级建议 2"
  ]
}
\`\`\`

**要求**：
1. 每个需求必须有 evidence 字段
2. satisfaction 基于访谈内容推断（1-10 分）
3. potential 评估兴奋型需求的市场潜力
4. priorityRecommendations 基于 KANO 分类给出优先级建议
`,

  buildAnalysisPrompt: (transcript: string, researchGoal: string) => `
研究目标：${researchGoal}

访谈记录：
${transcript}

请基于上述访谈记录，进行 KANO 模型分析。严格按照 JSON 格式输出。
`,

  interviewQuestions: [
    {
      id: 'kano-1',
      question: '如果产品具备 [功能]，您会有什么感受？',
      followUp: '如果产品不具备 [功能]，您会有什么感受？',
      analysisHint: '通过正反问题判断需求类型'
    },
    {
      id: 'kano-2',
      question: '在您看来，哪些功能是产品必须具备的？',
      followUp: '为什么这些功能是必须的？',
      analysisHint: '识别基本型需求'
    },
    {
      id: 'kano-3',
      question: '哪些功能的表现会直接影响您的满意度？',
      followUp: '目前这些功能的表现如何？',
      analysisHint: '识别期望型需求及满意度'
    },
    {
      id: 'kano-4',
      question: '有没有什么功能是您没想到但会让您惊喜的？',
      followUp: '如果有这个功能，您会愿意为此付费吗？',
      analysisHint: '识别兴奋型需求及市场潜力'
    }
  ]
};
