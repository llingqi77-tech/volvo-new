/**
 * 分析引擎
 *
  * 基于选定的分析框架，调用 DeepSeek 官方 API 进行分析
 */

import { chatCompletion } from './openrouter-client';
import {
  jtbdPrompt,
  kanoPrompt,
  stpPrompt,
  journeyMapPrompt,
  type JTBDAnalysisResult,
  type KANOAnalysisResult,
  type STPAnalysisResult,
  type JourneyMapAnalysisResult
} from '@/prompts/frameworks';
import { analysisPrompt } from '@/prompts/research';
import type { AnalysisInput, AnalysisOutput, AnalysisError, FrameworkType } from './types/analysis';

export class AnalysisEngine {
  /**
   * 执行分析
   */
  async analyze(input: AnalysisInput): Promise<AnalysisOutput> {
    const { framework, transcript, researchGoal } = input;

    try {
      // 构建分析提示词
      const prompt = analysisPrompt.buildPrompt({
        framework,
        transcript,
        researchGoal
      });

      // 获取框架的 system role
      const systemRole = this.getFrameworkSystemRole(framework);

      // 调用 API
      const rawResponse = await chatCompletion([
        { role: 'system', content: systemRole },
        { role: 'user', content: prompt }
      ]);

      // 解析结果
      const result = this.parseAnalysisResult(framework, rawResponse);

      // 后处理（计算衍生字段）
      const processedResult = this.postProcess(framework, result);

      return {
        framework,
        result: processedResult,
        rawResponse,
        timestamp: Date.now()
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * 获取框架的 system role
   */
  private getFrameworkSystemRole(framework: FrameworkType): string {
    const roles = {
      jtbd: jtbdPrompt.systemRole,
      kano: kanoPrompt.systemRole,
      stp: stpPrompt.systemRole,
      'journey-map': journeyMapPrompt.systemRole
    };
    return roles[framework];
  }

  /**
   * 解析分析结果
   */
  private parseAnalysisResult(framework: FrameworkType, rawResponse: string): any {
    try {
      // 尝试提取 JSON（可能被包裹在 markdown 代码块中）
      const jsonMatch = rawResponse.match(/```json\s*([\s\S]*?)\s*```/) ||
                       rawResponse.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        throw new Error('无法从响应中提取 JSON');
      }

      const jsonStr = jsonMatch[1] || jsonMatch[0];
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error('JSON 解析失败:', error);
      console.error('原始响应:', rawResponse);

      // Fallback: 尝试正则提取关键信息
      return this.fallbackParse(framework, rawResponse);
    }
  }

  /**
   * Fallback 解析（当 JSON 解析失败时）
   */
  private fallbackParse(framework: FrameworkType, rawResponse: string): any {
    console.warn(`使用 fallback 解析 ${framework} 结果`);

    // 简单的 fallback：返回原始文本
    return {
      _fallback: true,
      rawText: rawResponse,
      error: 'JSON 解析失败，返回原始文本'
    };
  }

  /**
   * 后处理（计算衍生字段）
   */
  private postProcess(framework: FrameworkType, result: any): any {
    switch (framework) {
      case 'jtbd':
        return this.postProcessJTBD(result);
      case 'kano':
        return result; // KANO 不需要后处理
      case 'stp':
        return result; // STP 不需要后处理
      case 'journey-map':
        return result; // Journey Map 不需要后处理
      default:
        return result;
    }
  }

  /**
   * JTBD 后处理：计算机会分数和机会空间
   */
  private postProcessJTBD(result: JTBDAnalysisResult): JTBDAnalysisResult {
    // 计算机会分数
    const desiredOutcomes = result.desiredOutcomes.map(outcome => ({
      ...outcome,
      opportunityScore: outcome.importance + (outcome.importance - outcome.satisfaction)
    }));

    // 识别机会空间（opportunity score > 12）
    const opportunityGaps = desiredOutcomes
      .filter(o => o.opportunityScore > 12)
      .map(o => o.outcome);

    return {
      ...result,
      desiredOutcomes,
      opportunityGaps
    };
  }

  /**
   * 错误处理
   */
  private handleError(error: any): AnalysisError {
    if (error instanceof SyntaxError) {
      return {
        code: 'PARSE_ERROR',
        message: 'JSON 解析失败',
        details: error.message
      };
    }

    if (error.message?.includes('API')) {
      return {
        code: 'API_ERROR',
        message: 'API 调用失败',
        details: error.message
      };
    }

    return {
      code: 'VALIDATION_ERROR',
      message: '分析结果验证失败',
      details: error.message
    };
  }
}
