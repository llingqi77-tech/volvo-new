/**
 * 报告相关类型定义
 */

import type { FrameworkType, AnalysisResult } from './analysis';

export interface ReportConfig {
  title: string;
  framework: FrameworkType;
  analysis: AnalysisResult;
  researchGoal: string;
  style: 'executive' | 'detailed' | 'data-driven';
}

export interface ReportOutput {
  markdown: string;
  metadata: {
    framework: FrameworkType;
    style: string;
    generatedAt: number;
    wordCount: number;
  };
  visualizations: VisualizationSuggestion[];
}

export interface VisualizationSuggestion {
  type: 'chart' | 'diagram' | 'map';
  title: string;
  description: string;
  chartType?: 'bar' | 'line' | 'pie' | 'radar' | 'scatter' | 'heatmap';
  data?: any;
}
