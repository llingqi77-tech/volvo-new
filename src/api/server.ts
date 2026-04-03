import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import { chatCompletion } from '../lib/openrouter-client';
import { researchClassifierPrompt } from '../prompts/research/classifier';
import { dynamicVerifyPrompt } from '../prompts/research/dynamic-verify';
import { planGeneratorPrompt } from '../prompts/research/plan-generator';

// 加载环境变量
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

console.log('Environment loaded:', {
  hasApiKey: !!(process.env.DEEPSEEK_API_KEY ?? process.env.OPENROUTER_API_KEY),
  model: process.env.DEEPSEEK_MODEL ?? process.env.OPENROUTER_MODEL
});

const app = express();
app.use(cors());
app.use(express.json());

// 通用解析 Markdown 响应，提取调研方案和访谈大纲
const parsePlan = (text: string) => {
  const extractSection = (title: string) => {
    const regex = new RegExp(`###?\\s*${title}[\\s\\S]*?\\n([\\s\\S]*?)(?=\\n###|\\n##|\\n------|$)`, 'i');
    const match = text.match(regex);
    if (!match || !match[1]) {
      console.log(`未找到章节: ${title}`);
      return '';
    }
    return match[1].trim();
  };

  const researchPlan = {
    background: extractSection('研究背景') || '待补充',
    theme: extractSection('研究主题') || '待补充',
    coreQuestion: extractSection('核心研究问题') || '待补充',
    methodology: extractSection('研究方法|方法论') || '待补充',
    targetAudience: extractSection('人群选择|目标人群|样本设计') || '待补充',
    executionPlan: extractSection('执行方案|执行计划') || '待补充',
    expectedOutput: extractSection('预期产出|预期输出') || '待补充'
  };

  const extractInterviewQuestions = () => {
    const sections: Array<{ title: string; questions: string[] }> = [];
    const partRegex = /##\s*Part\s*[A-Z][:\s]*([^\n]+)\s*([\s\S]*?)(?=##\s*Part|##\s*附录|$)/gi;
    let match;
    while ((match = partRegex.exec(text)) !== null) {
      const sectionTitle = match[1].trim();
      const sectionContent = match[2];
      const questions: string[] = [];
      const questionRegex = /^\d+\.\s*(.+?)(?=\n\d+\.|\n-|\n\*\*|$)/gm;
      let qMatch;
      while ((qMatch = questionRegex.exec(sectionContent)) !== null) {
        const question = qMatch[1].trim();
        if (question && question.length > 5) {
          questions.push(question);
        }
      }
      if (questions.length > 0) {
        sections.push({ title: sectionTitle, questions });
      }
    }
    return sections;
  };

  const interviewGuide = extractInterviewQuestions();
  return { researchPlan, interviewGuide, fullContent: text };
};

// 研究分类 API
app.post('/api/classify-research', async (req, res) => {
  try {
    const { userInput } = req.body;
    if (!userInput) {
      return res.status(400).json({ error: '缺少 userInput 参数' });
    }
    const prompt = researchClassifierPrompt.buildPrompt(userInput);
    const response = await chatCompletion([
      { role: 'system', content: researchClassifierPrompt.systemRole },
      { role: 'user', content: prompt }
    ]);
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('无法从响应中提取 JSON');
    }
    const jsonStr = jsonMatch[1] || jsonMatch[0];
    const classification = JSON.parse(jsonStr);
    res.json(classification);
  } catch (error) {
    console.error('分类失败，返回 fallback:', error);
    res.json({
      kind: '探索型研究',
      framework: 'JTBD + 用户旅程地图',
      rationale: '由于网络超时或服务不可用，已为您提供一个通用探索型研究框架。',
      confidence: 'low'
    });
  }
});

// 生成验证问题 API
app.post('/api/generate-question', async (req, res) => {
  try {
    const { userInput, classification, previousAnswers, round } = req.body;
    if (!userInput || !classification || !round) {
      return res.status(400).json({ error: '缺少必要参数' });
    }
    const prompt = dynamicVerifyPrompt.buildPrompt({
      userInput,
      classification,
      previousAnswers: previousAnswers || [],
      round
    });
    const response = await chatCompletion([
      { role: 'system', content: dynamicVerifyPrompt.systemRole },
      { role: 'user', content: prompt }
    ]);
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('无法从响应中提取 JSON');
    }
    const jsonStr = jsonMatch[1] || jsonMatch[0];
    const question = JSON.parse(jsonStr);
    res.json({ question });
  } catch (error) {
    console.error('生成问题失败，返回 fallback:', error);
    res.json({
      question: {
        id: 'fallback-' + Date.now(),
        mode: 'single',
        title: '您的研究主要面向哪些人群？',
        options: ['年轻用户（18-30岁）', '中青年用户（25-40岁）', '中年用户（35-50岁）', '全年龄段']
      }
    });
  }
});

// 生成调研方案和访谈大纲 API
app.post('/api/generate-plan', async (req, res) => {
  try {
    const { userInput, verificationAnswers, classification } = req.body;
    if (!userInput || !verificationAnswers) {
      return res.status(400).json({ error: '缺少必要参数' });
    }
    const researchContext = {
      targetAudience: verificationAnswers[0]?.answer?.join(', '),
      scenario: verificationAnswers[1]?.answer?.join(', '),
      dimensions: verificationAnswers[2]?.answer || [],
      method: verificationAnswers[3]?.answer?.join(', ')
    };
    const prompt = planGeneratorPrompt.buildPrompt({ userInput, verificationAnswers, researchContext });
    console.log('生成调研方案，输入:', { userInput, verificationAnswers: verificationAnswers.length });
    const response = await chatCompletion(
      [
        { role: 'system', content: planGeneratorPrompt.systemRole },
        { role: 'user', content: prompt },
      ],
      240000,
    );
    console.log('AI 响应长度:', response.length);
    const parsedPlan = parsePlan(response);
    res.json({
      researchPlan: parsedPlan.researchPlan,
      interviewGuide: parsedPlan.interviewGuide,
      fullContent: parsedPlan.fullContent
    });
  } catch (error) {
    console.error('生成方案失败，返回 fallback:', error);
    res.json({
      researchPlan: {
        background: '由于网络超时或服务不可用，当前展示的是一份默认调研方案，请稍后重试真实生成。',
        theme: '通用用户研究',
        coreQuestion: '用户对目标产品/服务的态度和行为动机是什么？',
        methodology: '定性研究为主：深度访谈 + 焦点小组',
        targetAudience: '18-40岁目标用户，样本量15-30人',
        executionPlan: '第1-2周：招募与筛选；第3-4周：访谈执行；第5周：数据分析与报告输出。',
        expectedOutput: '用户画像、核心洞察、策略建议'
      },
      interviewGuide: [
        { title: 'Part A: 破冰环节（5-10 分钟）', questions: ['能否简单介绍一下您自己？', '您平时如何了解我们的产品/服务？'] },
        { title: 'Part B: 核心探索（30-40 分钟）', questions: ['您选择这类产品时最看重什么？', '有没有让您不满意的地方？', '理想中的体验是什么样的？'] },
        { title: 'Part C: 深挖与收尾（10-15 分钟）', questions: ['如果向朋友推荐，您会怎么说？', '还有什么想补充的吗？'] }
      ],
      fullContent: 'fallback'
    });
  }
});

// 生成反问问题 API
app.post('/api/generate-refine-questions', async (req, res) => {
  try {
    const { userInput, currentPlan, currentInterview, userFeedback } = req.body;
    if (!userFeedback) {
      return res.status(400).json({ error: '缺少 userFeedback 参数' });
    }
    const systemRole = `你是一位资深的商业研究分析师。用户的任务是修改已有的调研方案和访谈大纲。
请根据用户的修改需求，生成 3-5 个追问问题，用于澄清修改意图。问题可以是单选或多选。
输出必须严格为 JSON 格式，结构如下：
{
  "questions": [
    { "title": "问题描述", "mode": "single|multiple", "options": ["选项1", "选项2", ...] }
  ]
}`;
    const prompt = `
用户研究目标：${userInput}

当前调研方案：
${JSON.stringify(currentPlan || {}, null, 2)}

当前访谈大纲：
${JSON.stringify(currentInterview || [], null, 2)}

用户修改需求：${userFeedback}

请生成 3-5 个追问问题，帮助进一步澄清用户的修改意图。只输出 JSON，不要解释。
`;
    const response = await chatCompletion(
      [{ role: 'system', content: systemRole }, { role: 'user', content: prompt }],
      120000,
    );
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('无法从响应中提取 JSON');
    }
    const jsonStr = jsonMatch[1] || jsonMatch[0];
    const data = JSON.parse(jsonStr);
    res.json({ questions: data.questions || [] });
  } catch (error) {
    console.error('生成反问问题失败，返回 fallback:', error);
    res.json({
      questions: [
        { title: '您希望主要调整调研方案还是访谈大纲？', mode: 'single', options: ['调研方案', '访谈大纲', '两者都要'] },
        { title: '您认为当前内容最缺少什么？', mode: 'multiple', options: ['数据支撑', '竞品对比', '用户分层', '执行细节', '问题深度'] }
      ]
    });
  }
});

// 修改调研方案和访谈大纲 API
app.post('/api/refine-plan', async (req, res) => {
  try {
    const { userInput, currentPlan, currentInterview, userFeedback, refineAnswers } = req.body;
    if (!userFeedback) {
      return res.status(400).json({ error: '缺少 userFeedback 参数' });
    }
    const systemRole = `你是一位资深的商业研究分析师。请根据用户的修改需求及追问答案，对现有的调研方案和访谈大纲进行精准修改。
输出格式必须与原始调研方案一致，包含完整的 Markdown 结构：
# 调研方案
...各章节...
---
# 访谈大纲
## Part A: 破冰环节（5-10 分钟）
...
## Part B: 核心探索（30-40 分钟）
...
## Part C: 深挖与收尾（10-15 分钟）
...
请确保修改后的内容比原版本更符合用户的明确意图，同时保持专业性和可执行性。`;
    const prompt = `
用户研究目标：${userInput}

当前调研方案：
${JSON.stringify(currentPlan || {}, null, 2)}

当前访谈大纲：
${JSON.stringify(currentInterview || [], null, 2)}

用户修改需求：${userFeedback}

追问及答案：
${(refineAnswers || []).map((qa: any, i: number) => `${i + 1}. ${qa.question}\n   → ${(qa.answer || []).join(', ')}`).join('\n\n')}

请基于以上信息，输出修改后的完整调研方案和访谈大纲（Markdown 格式）。`;
    const response = await chatCompletion(
      [{ role: 'system', content: systemRole }, { role: 'user', content: prompt }],
      240000,
    );
    const parsedPlan = parsePlan(response);
    res.json({
      researchPlan: parsedPlan.researchPlan,
      interviewGuide: parsedPlan.interviewGuide,
      fullContent: parsedPlan.fullContent
    });
  } catch (error) {
    console.error('修改方案失败，返回 fallback:', error);
    res.json({
      researchPlan: {
        background: '基于您的反馈进行了微调（当前为离线默认版本）。',
        theme: '通用用户研究（已调整）',
        coreQuestion: '用户对目标产品/服务的态度和行为动机是什么？',
        methodology: '定性研究为主：深度访谈 + 焦点小组',
        targetAudience: '18-40岁目标用户，样本量15-30人',
        executionPlan: '第1-2周：招募与筛选；第3-4周：访谈执行；第5周：数据分析与报告输出。',
        expectedOutput: '用户画像、核心洞察、策略建议'
      },
      interviewGuide: [
        { title: 'Part A: 破冰环节（5-10 分钟）', questions: ['能否简单介绍一下您自己？', '您平时如何了解我们的产品/服务？'] },
        { title: 'Part B: 核心探索（30-40 分钟）', questions: ['您选择这类产品时最看重什么？', '有没有让您不满意的地方？', '理想中的体验是什么样的？'] },
        { title: 'Part C: 深挖与收尾（10-15 分钟）', questions: ['如果向朋友推荐，您会怎么说？', '还有什么想补充的吗？'] }
      ],
      fullContent: 'fallback'
    });
  }
});

const PORT = process.env.API_PORT || 3001;
app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
