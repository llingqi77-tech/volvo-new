/**
 * 测试 API 集成
 */

import 'dotenv/config';
import { chatCompletion } from './lib/openrouter-client';
import { researchClassifierPrompt } from './prompts/research/classifier';
import { dynamicVerifyPrompt } from './prompts/research/dynamic-verify';

async function testClassifier() {
  console.log('=== 测试研究分类 ===\n');

  const userInput = '比较 BMW iX 和 Audi e-tron 在豪华电动 SUV 市场的竞争力';

  try {
    const prompt = researchClassifierPrompt.buildPrompt(userInput);
    const response = await chatCompletion([
      { role: 'system', content: researchClassifierPrompt.systemRole },
      { role: 'user', content: prompt }
    ]);

    console.log('原始响应:', response);

    // 解析 JSON
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('无法从响应中提取 JSON');
    }

    const jsonStr = jsonMatch[1] || jsonMatch[0];
    const classification = JSON.parse(jsonStr);

    console.log('\n分类结果:');
    console.log('- 研究类型:', classification.kind);
    console.log('- 分析框架:', classification.framework);
    console.log('- 判断理由:', classification.rationale);
    console.log('- 置信度:', classification.confidence);

    return classification;
  } catch (error) {
    console.error('分类失败:', error);
    throw error;
  }
}

async function testDynamicVerify(classification: any) {
  console.log('\n=== 测试动态验证问题生成 ===\n');

  const userInput = '比较 BMW iX 和 Audi e-tron 在豪华电动 SUV 市场的竞争力';

  try {
    const prompt = dynamicVerifyPrompt.buildPrompt({
      userInput,
      classification,
      previousAnswers: [],
      round: 1
    });

    const response = await chatCompletion([
      { role: 'system', content: dynamicVerifyPrompt.systemRole },
      { role: 'user', content: prompt }
    ]);

    console.log('原始响应:', response);

    // 解析 JSON
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('无法从响应中提取 JSON');
    }

    const jsonStr = jsonMatch[1] || jsonMatch[0];
    const question = JSON.parse(jsonStr);

    console.log('\n生成的问题:');
    console.log('- ID:', question.id);
    console.log('- 模式:', question.mode);
    console.log('- 标题:', question.title);
    console.log('- 选项:', question.options);

    return question;
  } catch (error) {
    console.error('生成问题失败:', error);
    throw error;
  }
}

async function main() {
  try {
    const classification = await testClassifier();
    await testDynamicVerify(classification);

    console.log('\n✅ 所有测试通过！');
  } catch (error) {
    console.error('\n❌ 测试失败:', error);
    process.exit(1);
  }
}

main();
