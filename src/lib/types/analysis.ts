/**
 * 分析相关类型定义
 */

import type {
  JTBDAnalysisResult,
  KANOAnalysisResult,
  STPAnalysisResult,
  JourneyMapAnalysisResult,
  FrameworkType
} from '@/prompts/frameworks';

export type { FrameworkType };

export type AnalysisResult =
  | JTBDAnalysisResult
  | KANOAnalysisResult
  | STPAnalysisResult
  | JourneyMapAnalysisResult;

export interface AnalysisInput {
  framework: FrameworkType;
  transcript: string;
  researchGoal: string;
}

export interface AnalysisOutput {
  framework: FrameworkType;
  result: AnalysisResult;
  rawResponse: string;
  timestamp: number;
}

export interface AnalysisError {
  code: 'PARSE_ERROR' | 'API_ERROR' | 'VALIDATION_ERROR';
  message: string;
  details?: any;
}
