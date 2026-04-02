/**
 * JTBD (Jobs-to-be-Done) 框架提示词
 *
 * 用于识别用户在特定场景下的核心任务、期望结果和阻碍因素
 */

export interface JTBDAnalysisResult {
  coreJob: string;
  desiredOutcomes: Array<{
    outcome: string;
    importance: number; // 1-10
    satisfaction: number; // 1-10
    opportunityScore: number; // importance + (importance - satisfaction)
    evidence: string;
  }>;
  barriers: Array<{
    barrier: string;
    impact: 'high' | 'medium' | 'low';
    evidence: string;
  }>;
  opportunityGaps: string[];
}

export const jtbdPrompt = {
  systemRole: `你是一位精通 Jobs-to-be-Done 理论的产品研究专家。
你的任务是通过分析访谈记录，识别用户在特定场景下的：
1. 核心任务（Job）：用户试图完成什么
2. 期望结果（Outcome）：用户期望达到什么状态
3. 阻碍因素（Barrier）：什么阻止了用户达成目标
4. 机会空间（Opportunity）：重要性高但满意度低的领域

**分析原则**：
- 区分功能性任务（Functional Job）和情感性任务（Emotional Job）
- 每个洞察必须有访谈原文作为证据
- 机会分数 = importance + (importance - satisfaction)
- 机会空间 = 机会分数 > 12 的期望结果`,

  analysisTemplate: `
基于访谈内容，请按以下 JSON 格式输出 JTBD 分析：

\`\`\`json
{
  "coreJob": "用户试图完成的主要任务（一句话概括）",
  "desiredOutcomes": [
    {
      "outcome": "期望结果描述",
      "importance": 8,
      "satisfaction": 4,
      "evidence": "访谈原文引用（完整句子）"
    }
  ],
  "barriers": [
    {
      "barrier": "阻碍因素描述",
      "impact": "high",
      "evidence": "访谈原文引用（完整句子）"
    }
  ]
}
\`\`\`

**要求**：
1. 每个洞察必须有 evidence 字段，直接引用访谈原文
2. importance 和 satisfaction 必须基于访谈内容推断，不能凭空捏造
3. opportunityScore 和 opportunityGaps 将由系统自动计算
4. 输出必须是有效的 JSON 格式，不要包含注释
`,

  buildAnalysisPrompt: (transcript: string, researchGoal: string) => `
研究目标：${researchGoal}

访谈记录：
${transcript}

请基于上述访谈记录，进行 JTBD 分析。严格按照 JSON 格式输出，不要添加任何额外解释。
`,

  interviewQuestions: [
    {
      id: 'jtbd-1',
      question: '请描述您在 [场景] 中试图完成的核心任务是什么？',
      followUp: '这个任务对您来说有多重要？（1-10 分）',
      analysisHint: '识别功能性任务（Functional Job）和情感性任务（Emotional Job）'
    },
    {
      id: 'jtbd-2',
      question: '在完成这个任务时，您期望达到什么样的结果？',
      followUp: '如果用一个指标衡量成功，您会选择什么？',
      analysisHint: '提取可量化的期望结果（Desired Outcomes）'
    },
    {
      id: 'jtbd-3',
      question: '在完成这个任务的过程中，遇到了哪些困难或阻碍？',
      followUp: '这些阻碍对您的影响有多大？',
      analysisHint: '识别阻碍因素并评估影响程度'
    },
    {
      id: 'jtbd-4',
      question: '您目前是如何完成这个任务的？满意度如何？',
      followUp: '如果满分是 10 分，您会打几分？',
      analysisHint: '评估当前解决方案的满意度'
    }
  ],

  exampleAnalysis: {
    researchGoal: '了解年轻白领对共享办公空间的需求',
    transcript: `
访谈者：请描述您在选择办公空间时试图完成的核心任务是什么？
受访者：我主要是想找一个能让我专注工作的地方，同时又不会太孤独。在家工作效率低，咖啡馆太吵，所以需要一个介于两者之间的空间。

访谈者：这个任务对您来说有多重要？
受访者：非常重要，我给 9 分。因为工作效率直接影响我的收入和职业发展。

访谈者：您期望达到什么样的结果？
受访者：理想状态是每天能完成 8 小时高质量工作，同时还能认识一些同行，偶尔交流一下。但现在的共享空间太贵了，我只能打 5 分。
    `,
    expectedOutput: {
      coreJob: '找到一个能提升工作效率且不孤独的办公空间',
      desiredOutcomes: [
        {
          outcome: '每天完成 8 小时高质量工作',
          importance: 9,
          satisfaction: 5,
          evidence: '理想状态是每天能完成 8 小时高质量工作'
        },
        {
          outcome: '认识同行并偶尔交流',
          importance: 7,
          satisfaction: 6,
          evidence: '同时还能认识一些同行，偶尔交流一下'
        }
      ],
      barriers: [
        {
          barrier: '价格过高',
          impact: 'high' as const,
          evidence: '但现在的共享空间太贵了'
        },
        {
          barrier: '在家工作效率低',
          impact: 'high' as const,
          evidence: '在家工作效率低'
        }
      ]
    }
  }
};
