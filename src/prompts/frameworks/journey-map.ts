/**
 * 用户旅程地图提示词
 *
 * 用于可视化用户全流程体验，识别触点、情感曲线、痛点与峰值时刻
 */

export interface JourneyMapAnalysisResult {
  stages: Array<{
    stage: string;
    description: string;
    touchpoints: string[];
    actions: string[];
    emotions: {
      level: number; // -5 到 +5
      description: string;
    };
    painPoints: string[];
    peakMoments: string[];
    evidence: string;
  }>;
  overallInsights: {
    criticalPainPoints: string[];
    keyOpportunities: string[];
    emotionalHighlights: string[];
  };
}

export const journeyMapPrompt = {
  systemRole: `你是一位精通用户体验设计的研究专家。
你的任务是通过分析访谈记录，绘制用户旅程地图：

1. **阶段划分（Stages）**：
   - 将用户体验分解为关键阶段
   - 每个阶段有明确的起止点

2. **触点识别（Touchpoints）**：
   - 用户与产品/服务的接触点
   - 包括线上和线下触点

3. **情感曲线（Emotions）**：
   - 每个阶段的情感状态（-5 到 +5）
   - 负数表示负面情绪，正数表示正面情绪

4. **痛点与峰值（Pain Points & Peak Moments）**：
   - 痛点：用户感到挫折的时刻
   - 峰值：用户感到惊喜的时刻

**分析原则**：
- 基于用户真实经历，不要臆测
- 情感评分要有访谈证据支撑
- 识别关键时刻（MOT - Moment of Truth）`,

  analysisTemplate: `
基于访谈内容，请按以下 JSON 格式输出用户旅程地图分析：

\`\`\`json
{
  "stages": [
    {
      "stage": "阶段名称",
      "description": "阶段描述",
      "touchpoints": ["触点1", "触点2"],
      "actions": ["用户行为1", "用户行为2"],
      "emotions": {
        "level": 3,
        "description": "情感描述"
      },
      "painPoints": ["痛点1"],
      "peakMoments": ["峰值时刻1"],
      "evidence": "访谈原文引用"
    }
  ],
  "overallInsights": {
    "criticalPainPoints": ["最关键的痛点1", "最关键的痛点2"],
    "keyOpportunities": ["改进机会1", "改进机会2"],
    "emotionalHighlights": ["情感亮点1", "情感亮点2"]
  }
}
\`\`\`

**要求**：
1. 阶段数量：3-7 个（根据实际情况）
2. 情感 level：-5（极度负面）到 +5（极度正面）
3. 每个阶段必须有 evidence 字段
4. overallInsights 总结全局洞察
`,

  buildAnalysisPrompt: (transcript: string, researchGoal: string) => `
研究目标：${researchGoal}

访谈记录：
${transcript}

请基于上述访谈记录，绘制用户旅程地图。严格按照 JSON 格式输出。
`,

  interviewQuestions: [
    {
      id: 'journey-1',
      question: '请从头到尾描述您使用 [产品/服务] 的完整过程',
      followUp: '每个步骤大概花了多长时间？',
      analysisHint: '识别旅程阶段和时间分布'
    },
    {
      id: 'journey-2',
      question: '在整个过程中，您在哪些地方与产品/服务有接触？',
      followUp: '这些接触点的体验如何？',
      analysisHint: '识别触点和体验质量'
    },
    {
      id: 'journey-3',
      question: '哪个环节让您感到最挫折？',
      followUp: '当时的感受是什么？',
      analysisHint: '识别痛点和负面情绪'
    },
    {
      id: 'journey-4',
      question: '哪个环节让您感到最惊喜？',
      followUp: '为什么会有这种感受？',
      analysisHint: '识别峰值时刻和正面情绪'
    },
    {
      id: 'journey-5',
      question: '如果可以改变一个环节，您会选择哪个？',
      followUp: '您希望它变成什么样？',
      analysisHint: '识别改进机会'
    }
  ]
};
