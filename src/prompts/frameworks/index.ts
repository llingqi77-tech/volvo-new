/**
 * 分析框架提示词统一导出
 */

export { jtbdPrompt, type JTBDAnalysisResult } from './jtbd';
export { kanoPrompt, type KANOAnalysisResult } from './kano';
export { stpPrompt, type STPAnalysisResult } from './stp';
export { journeyMapPrompt, type JourneyMapAnalysisResult } from './journey-map';

export type FrameworkType = 'jtbd' | 'kano' | 'stp' | 'journey-map';

export const frameworkMetadata = {
  jtbd: {
    name: 'Jobs-to-be-Done',
    description: '识别用户核心任务与期望结果，发现创新机会空间',
    useCase: '适用于产品创新、功能优先级排序',
    icon: '🎯'
  },
  kano: {
    name: 'KANO 模型',
    description: '分类功能属性（基本型/期望型/兴奋型），优化用户满意度',
    useCase: '适用于功能取舍决策、体验优化',
    icon: '📊'
  },
  stp: {
    name: 'STP 营销模型',
    description: '市场细分、目标市场选择、产品定位',
    useCase: '适用于市场策略、品牌定位',
    icon: '🎪'
  },
  'journey-map': {
    name: '用户旅程地图',
    description: '可视化用户全流程体验，识别痛点与峰值时刻',
    useCase: '适用于服务设计、体验优化',
    icon: '🗺️'
  }
};
