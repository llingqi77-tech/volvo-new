/**
 * 报告生成器
 *
 * 基于分析结果生成结构化的 Markdown 报告
 */

import { chatCompletion } from './openrouter-client';
import { reportPrompt } from '@/prompts/research';
import type { ReportConfig, ReportOutput, VisualizationSuggestion } from './types/report';

export class ReportGenerator {
  /**
   * 生成报告
   */
  async generate(config: ReportConfig): Promise<ReportOutput> {
    const { title, framework, analysis, researchGoal, style } = config;

    try {
      // 构建报告生成提示词
      const prompt = reportPrompt.buildPrompt({
        framework,
        analysisResult: analysis,
        researchGoal,
        style
      });

      // 调用 API 生成报告
      const markdown = await chatCompletion([
        { role: 'system', content: reportPrompt.systemRole },
        { role: 'user', content: prompt }
      ]);

      // 提取可视化建议
      const visualizations = this.extractVisualizations(framework, markdown);

      // 计算元数据
      const metadata = {
        framework,
        style,
        generatedAt: Date.now(),
        wordCount: markdown.length
      };

      return {
        markdown: this.formatMarkdown(title, markdown),
        metadata,
        visualizations
      };
    } catch (error) {
      console.error('报告生成失败:', error);
      throw error;
    }
  }

  /**
   * 格式化 Markdown（添加标题和元数据）
   */
  private formatMarkdown(title: string, content: string): string {
    const header = `# ${title}\n\n`;
    const footer = `\n\n---\n\n*报告生成时间：${new Date().toLocaleString('zh-CN')}*\n`;

    return header + content + footer;
  }

  /**
   * 提取可视化建议
   */
  private extractVisualizations(
    framework: string,
    markdown: string
  ): VisualizationSuggestion[] {
    const suggestions = reportPrompt.visualizationSuggestions[framework as keyof typeof reportPrompt.visualizationSuggestions] || [];

    return suggestions.map((title, index) => ({
      type: 'chart' as const,
      title,
      description: `基于 ${framework.toUpperCase()} 分析结果的可视化建议`,
      chartType: this.inferChartType(title)
    }));
  }

  /**
   * 推断图表类型
   */
  private inferChartType(title: string): VisualizationSuggestion['chartType'] {
    if (title.includes('矩阵') || title.includes('象限')) return 'scatter';
    if (title.includes('雷达')) return 'radar';
    if (title.includes('饼图')) return 'pie';
    if (title.includes('条形图') || title.includes('排序')) return 'bar';
    if (title.includes('曲线') || title.includes('折线')) return 'line';
    if (title.includes('热力')) return 'heatmap';
    return 'bar'; // 默认
  }
}
