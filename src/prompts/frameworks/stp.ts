/**
 * STP 营销模型提示词
 *
 * 用于市场细分（Segmentation）、目标市场选择（Targeting）、产品定位（Positioning）
 */

export interface STPAnalysisResult {
  segmentation: Array<{
    segment: string;
    characteristics: string[];
    size: 'large' | 'medium' | 'small';
    evidence: string;
  }>;
  targeting: {
    primaryTarget: string;
    secondaryTargets: string[];
    rationale: string;
    evidence: string;
  };
  positioning: {
    valueProposition: string;
    differentiators: string[];
    competitiveAdvantage: string;
    evidence: string;
  };
}

export const stpPrompt = {
  systemRole: `你是一位精通 STP 营销模型的市场策略专家。
你的任务是通过分析访谈记录，完成：

1. **市场细分（Segmentation）**：
   - 识别不同的用户群体
   - 描述每个群体的特征
   - 评估群体规模

2. **目标市场选择（Targeting）**：
   - 确定主要目标市场
   - 识别次要目标市场
   - 解释选择理由

3. **产品定位（Positioning）**：
   - 提炼价值主张
   - 识别差异化要素
   - 明确竞争优势

**分析原则**：
- 细分标准：人口统计、行为特征、需求差异
- 目标选择：市场吸引力 × 企业能力
- 定位策略：基于用户认知和竞争格局`,

  analysisTemplate: `
基于访谈内容，请按以下 JSON 格式输出 STP 分析：

\`\`\`json
{
  "segmentation": [
    {
      "segment": "细分市场名称",
      "characteristics": ["特征1", "特征2"],
      "size": "large",
      "evidence": "访谈原文引用"
    }
  ],
  "targeting": {
    "primaryTarget": "主要目标市场",
    "secondaryTargets": ["次要目标市场1", "次要目标市场2"],
    "rationale": "选择理由",
    "evidence": "访谈原文引用"
  },
  "positioning": {
    "valueProposition": "核心价值主张（一句话）",
    "differentiators": ["差异化要素1", "差异化要素2"],
    "competitiveAdvantage": "竞争优势描述",
    "evidence": "访谈原文引用"
  }
}
\`\`\`

**要求**：
1. 细分市场至少 2-4 个
2. 每个部分必须有 evidence 字段
3. 价值主张要简洁有力（不超过 20 字）
4. 差异化要素要具体可验证
`,

  buildAnalysisPrompt: (transcript: string, researchGoal: string) => `
研究目标：${researchGoal}

访谈记录：
${transcript}

请基于上述访谈记录，进行 STP 营销模型分析。严格按照 JSON 格式输出。
`,

  interviewQuestions: [
    {
      id: 'stp-1',
      question: '您认为自己属于哪类用户？',
      followUp: '您和其他用户有什么不同？',
      analysisHint: '识别用户自我认知的细分维度'
    },
    {
      id: 'stp-2',
      question: '您选择这类产品/服务的主要原因是什么？',
      followUp: '什么因素会让您放弃选择？',
      analysisHint: '识别目标市场的核心需求'
    },
    {
      id: 'stp-3',
      question: '您觉得这个产品/服务最大的优势是什么？',
      followUp: '和竞品相比，有什么独特之处？',
      analysisHint: '识别差异化要素和竞争优势'
    },
    {
      id: 'stp-4',
      question: '如果用一句话向朋友推荐，您会怎么说？',
      followUp: '为什么这句话能打动人？',
      analysisHint: '提炼价值主张'
    }
  ]
};
