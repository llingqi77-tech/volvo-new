/**
 * 报告生成提示词
 *
 * 用于生成结构化研究报告（Markdown 格式）
 */

import type { FrameworkType } from '../frameworks';

export const reportPrompt = {
  systemRole: `你是一位专业的商业研究报告撰写专家。
你的任务是基于分析结果，生成结构化的研究报告。

**报告原则**：
1. **结构清晰**：使用 Markdown 格式，层次分明
2. **证据支撑**：关键洞察要引用原文
3. **可视化建议**：提供图表建议（雷达图、旅程地图等）
4. **可执行建议**：提供具体的行动建议

**报告风格**：
- Executive（高层摘要）：简洁、重点突出、结论先行
- Detailed（详细版）：完整分析过程、证据链、深度洞察
- Data-driven（数据导向）：强调数据和图表、量化指标`,

  buildPrompt: ({
    framework,
    analysisResult,
    researchGoal,
    style
  }: {
    framework: FrameworkType;
    analysisResult: any;
    researchGoal: string;
    style: 'executive' | 'detailed' | 'data-driven';
  }) => {
    const styleInstructions = {
      executive: `
**高层摘要风格**：
- 开头：一段话总结核心发现（不超过 100 字）
- 结构：3-5 个关键洞察，每个洞察 1-2 句话
- 结尾：3 条可执行建议
- 长度：控制在 500 字以内`,

      detailed: `
**详细分析风格**：
- 开头：研究背景和目标
- 主体：完整的分析过程，包含证据引用
- 洞察：每个洞察都有"发现 → 证据 → 启示"的结构
- 结尾：详细的建议和实施路径
- 长度：1000-2000 字`,

      'data-driven': `
**数据导向风格**：
- 开头：关键数据指标总览
- 主体：用数据和图表说话
- 可视化：为每个部分提供图表建议
- 结尾：基于数据的量化建议
- 长度：800-1500 字`
    };

    return `
研究目标：${researchGoal}

分析框架：${framework.toUpperCase()}

分析结果：
\`\`\`json
${JSON.stringify(analysisResult, null, 2)}
\`\`\`

报告风格：${style}

${styleInstructions[style]}

请生成 Markdown 格式的研究报告。要求：
1. 使用标准 Markdown 语法
2. 关键洞察要引用分析结果中的 evidence 字段
3. 提供可视化建议（用 > 引用块标注）
4. 结尾提供 3-5 条可执行建议
`;
  },

  visualizationSuggestions: {
    jtbd: [
      '机会空间矩阵（importance vs satisfaction）',
      '期望结果优先级排序（横向条形图）',
      '阻碍因素影响力分析（饼图）'
    ],
    kano: [
      'KANO 分类矩阵（四象限图）',
      '功能优先级排序（横向条形图）',
      '满意度分布（雷达图）'
    ],
    stp: [
      '市场细分规模对比（饼图）',
      '目标市场吸引力矩阵（气泡图）',
      '竞争定位地图（二维散点图）'
    ],
    'journey-map': [
      '用户旅程情感曲线（折线图）',
      '触点体验热力图（热力图）',
      '痛点与峰值时刻标注（时间轴）'
    ]
  }
};
