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
  hasApiKey: !!process.env.OPENROUTER_API_KEY,
  model: process.env.OPENROUTER_MODEL
});

const app = express();
app.use(cors());
app.use(express.json());

// 研究分类 API
app.post('/api/classify-research', async (req, res) => {
  try {
    const { userInput } = req.body;

    if (!userInput) {
      return res.status(400).json({ error: '缺少 userInput 参数' });
    }

    // 调用 classifier
    const prompt = researchClassifierPrompt.buildPrompt(userInput);
    const response = await chatCompletion([
      { role: 'system', content: researchClassifierPrompt.systemRole },
      { role: 'user', content: prompt }
    ]);

    // 解析 JSON 响应
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('无法从响应中提取 JSON');
    }

    const jsonStr = jsonMatch[1] || jsonMatch[0];
    const classification = JSON.parse(jsonStr);

    res.json(classification);
  } catch (error) {
    console.error('分类失败:', error);
    res.status(500).json({ error: '分类失败', details: error instanceof Error ? error.message : String(error) });
  }
});

// 生成验证问题 API
app.post('/api/generate-question', async (req, res) => {
  try {
    const { userInput, classification, previousAnswers, round } = req.body;

    if (!userInput || !classification || !round) {
      return res.status(400).json({ error: '缺少必要参数' });
    }

    // 构建提示词
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

    // 解析 JSON 响应
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('无法从响应中提取 JSON');
    }

    const jsonStr = jsonMatch[1] || jsonMatch[0];
    const question = JSON.parse(jsonStr);

    res.json({ question });
  } catch (error) {
    console.error('生成问题失败:', error);
    res.status(500).json({ error: '生成问题失败', details: error instanceof Error ? error.message : String(error) });
  }
});

// 生成调研方案和访谈大纲 API
app.post('/api/generate-plan', async (req, res) => {
  try {
    const { userInput, verificationAnswers, classification } = req.body;

    if (!userInput || !verificationAnswers) {
      return res.status(400).json({ error: '缺少必要参数' });
    }

    // 构建研究上下文（从核验答案中提取）
    const researchContext = {
      targetAudience: verificationAnswers[0]?.answer?.join(', '),
      scenario: verificationAnswers[1]?.answer?.join(', '),
      dimensions: verificationAnswers[2]?.answer || [],
      method: verificationAnswers[3]?.answer?.join(', ')
    };

    // 构建提示词
    const prompt = planGeneratorPrompt.buildPrompt({
      userInput,
      verificationAnswers,
      researchContext
    });

    console.log('生成调研方案，输入:', { userInput, verificationAnswers: verificationAnswers.length });

    const response = await chatCompletion([
      { role: 'system', content: planGeneratorPrompt.systemRole },
      { role: 'user', content: prompt }
    ]);

    console.log('AI 响应长度:', response.length);
    console.log('AI 完整响应:', response);

    // 解析 Markdown 响应，提取调研方案和访谈大纲
    const parsePlan = (text: string) => {
      // 提取调研方案的各个部分
      const extractSection = (title: string) => {
        const regex = new RegExp(`###?\\s*${title}[\\s\\S]*?\\n([\\s\\S]*?)(?=\\n###|\\n##|\\n------|$)`, 'i');
        const match = text.match(regex);
        if (!match || !match[1]) {
          console.log(`未找到章节: ${title}`);
          return '';
        }
        return match[1].trim();
      };

      console.log('开始解析 AI 响应，长度:', text.length);
      console.log('响应前 500 字符:', text.substring(0, 500));

      const researchPlan = {
        background: extractSection('研究背景') || '待补充',
        theme: extractSection('研究主题') || '待补充',
        coreQuestion: extractSection('核心研究问题') || '待补充',
        methodology: extractSection('研究方法|方法论') || '待补充',
        targetAudience: extractSection('人群选择|目标人群|样本设计') || '待补充',
        executionPlan: extractSection('执行方案|执行计划') || '待补充',
        expectedOutput: extractSection('预期产出|预期输出') || '待补充'
      };

      console.log('解析的调研方案:', researchPlan);

      // 提取访谈大纲的问题
      const extractInterviewQuestions = () => {
        const sections: Array<{ title: string; questions: string[] }> = [];

        // 匹配 Part A, Part B, Part C 等章节
        const partRegex = /##\s*Part\s*[A-Z][:\s]*([^\n]+)\s*([\s\S]*?)(?=##\s*Part|##\s*附录|$)/gi;
        let match;

        while ((match = partRegex.exec(text)) !== null) {
          const sectionTitle = match[1].trim();
          const sectionContent = match[2];

          // 提取问题（匹配数字开头的行）
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

      return {
        researchPlan,
        interviewGuide,
        fullContent: text
      };
    };

    const parsedPlan = parsePlan(response);

    res.json({
      researchPlan: parsedPlan.researchPlan,
      interviewGuide: parsedPlan.interviewGuide,
      fullContent: parsedPlan.fullContent
    });
  } catch (error) {
    console.error('生成方案失败:', error);
    res.status(500).json({ error: '生成方案失败', details: error instanceof Error ? error.message : String(error) });
  }
});

const PORT = process.env.API_PORT || 3001;
app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
