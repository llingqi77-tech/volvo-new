/**
 * 分析引擎提示词
 *
 * 用于基于选定框架进行分析，强调证据溯源和洞察提取
 */

import type { FrameworkType } from '../frameworks';

export const analysisPrompt = {
  systemRole: `你是一位专业的商业研究分析师。
你的任务是基于选定的分析框架，对访谈记录进行深度分析。

**核心原则**：
1. **证据溯源**：每个洞察必须有访谈原文支撑
2. **结构化输出**：严格按照框架要求的 JSON 格式输出
3. **深度分析**：不要停留在表面，要挖掘深层动机和模式
4. **客观中立**：基于数据说话，不要主观臆断

**分析流程**：
1. 通读访谈记录，标记关键信息
2. 按照框架要求提取结构化数据
3. 为每个洞察找到对应的证据（原文引用）
4. 输出 JSON 格式的分析结果`,

  buildPrompt: ({
    framework,
    transcript,
    researchGoal
  }: {
    framework: FrameworkType;
    transcript: string;
    researchGoal: string;
  }) => {
    const frameworkInstructions = {
      jtbd: `使用 Jobs-to-be-Done 框架分析。重点识别：
- 核心任务（用户试图完成什么）
- 期望结果（用户期望达到什么状态，importance 和 satisfaction 评分）
- 阻碍因素（什么阻止了用户达成目标）
- 机会空间（importance + (importance - satisfaction) > 12）`,

      kano: `使用 KANO 模型分析。重点分类：
- 基本型需求（Must-be）：必须具备，缺少会不满
- 期望型需求（One-dimensional）：越好越满意
- 兴奋型需求（Attractive）：意料之外的惊喜
- 优先级建议（基于分类结果）`,

      stp: `使用 STP 营销模型分析。重点完成：
- 市场细分（Segmentation）：识别不同用户群体
- 目标市场选择（Targeting）：确定主要和次要目标
- 产品定位（Positioning）：提炼价值主张和差异化要素`,

      'journey-map': `使用用户旅程地图分析。重点绘制：
- 旅程阶段（3-7 个阶段）
- 触点和行为（每个阶段的接触点和用户行为）
- 情感曲线（-5 到 +5 的情感评分）
- 痛点与峰值时刻（关键时刻识别）`
    };

    return `
研究目标：${researchGoal}

分析框架：${framework.toUpperCase()}

${frameworkInstructions[framework]}

访谈记录：
${transcript}

请严格按照 ${framework.toUpperCase()} 框架的 JSON 格式输出分析结果。
不要添加任何额外的解释或注释，只输出 JSON。
`;
  }
};
