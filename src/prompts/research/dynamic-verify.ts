/**
 * 动态核验提示词
 *
 * 用于根据用户回答生成下一个深入的核验问题
 */

export const dynamicVerifyPrompt = {
  systemRole: `你是一位专业的研究规划师。
你的任务是根据用户的研究目标、研究类型和之前的回答，生成下一个深入的核验问题。

**要求**：
1. 问题要具体、可操作，避免抽象和宽泛
2. 逐步深入核心研究目标，不要重复之前的问题
3. 问题应该帮助澄清：研究对象、场景、维度、方法
4. 返回 JSON 格式，包含问题 ID、模式（单选/多选）、标题和选项

**问题类型**：
- 对象澄清：目标用户是谁？年龄段？职业？
- 场景澄清：在什么情况下使用？决策时刻是什么？
- 维度澄清：关注哪些方面？（功能/价格/体验/品牌等）
- 方法澄清：需要什么类型的洞察？（对比/探索/验证等）

**问题质量标准**：
- 封闭式问题：提供选项，便于快速回答
- 开放式问题：需要深入思考，获取丰富信息
- 优先使用封闭式问题（提高效率）

**输出格式**：
\`\`\`json
{
  "id": "q1",
  "mode": "single",  // 单选题用 "single"，多选题用 "multi"
  "title": "问题标题",
  "options": ["选项1", "选项2", "选项3"]
}
\`\`\`

**重要**：mode 字段只能是 "single" 或 "multi"，不要使用其他值。`,

  buildPrompt: ({
    userInput,
    classification,
    previousAnswers,
    round
  }: {
    userInput: string;
    classification: { kind: string; framework: string; rationale: string };
    previousAnswers: Array<{ question: string; answer: string[] }>;
    round: number;
  }) => `
用户输入：${userInput}

研究类型：${classification.kind}
分析框架：${classification.framework}

已回答的问题（${previousAnswers.length} 个）：
${previousAnswers.length > 0 ? previousAnswers.map((qa, i) => `${i + 1}. ${qa.question}\n   回答：${qa.answer.join(', ')}`).join('\n') : '（无）'}

当前轮次：第 ${round} 轮（共 5 轮）

请根据以下策略生成第 ${round} 轮的核验问题：
- 第 1 轮：澄清研究对象（年龄/职业/特征）
- 第 2 轮：澄清使用场景（时间/地点/情境）
- 第 3 轮：澄清关注维度（功能/价格/体验等）
- 第 4 轮：澄清研究方法（对比/探索/验证）
- 第 5 轮：确认研究范围和边界

只返回 JSON 格式，不要额外解释。
`,

  examples: [
    {
      userInput: '了解年轻人对电动车的看法',
      classification: { kind: 'insights', framework: 'jtbd', rationale: '洞察型研究' },
      previousAnswers: [],
      round: 1,
      output: {
        id: 'q1',
        mode: 'single',
        title: '你提到的年轻人，大概是哪个年龄段？',
        options: ['18-22岁大学生', '23-28岁职场新人', '29-35岁成熟职场人', '都关注']
      }
    },
    {
      userInput: '比较 BMW iX 和 Audi e-tron 在豪华电动 SUV 市场的竞争力',
      classification: { kind: 'testing', framework: 'stp', rationale: '测试型研究' },
      previousAnswers: [],
      round: 1,
      output: {
        id: 'q1',
        mode: 'single',
        title: '核心调研受众细分',
        options: ['豪华车主转换型', '科技先行者', '中产家庭增购', '环保/极简主义者']
      }
    }
  ],

  // 问题生成策略
  questionStrategy: {
    round1: '澄清研究对象（年龄/职业/特征）',
    round2: '澄清使用场景（时间/地点/情境）',
    round3: '澄清关注维度（功能/价格/体验等）',
    round4: '澄清研究方法（对比/探索/验证）',
    round5: '确认研究范围和边界'
  }
};

