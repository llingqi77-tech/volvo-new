import type { PersonaProvenance } from './personaDisplay';

export type ProjectStage =
  | 'intentClarify'
  | 'fullTimeSourceSelect'
  | 'fullDomainSourceSelect'
  | 'topicExplore'
  | 'plan'
  | 'persona'
  | 'interviewOutline'
  | 'materialUpload'
  | 'report';

export type ChoiceQuestion = {
  id: string;
  title: string;
  description?: string;
  options: string[];
  allowMultiple?: boolean;
};

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  createdAt: number;
};

export type ResearchPlan = {
  summary: string;
  objectives: string[];
  methods: string[];
  sampleRules: string[];
  outputs: string[];
};

export type InterviewPersona = {
  id: string;
  cardTitle: string;
  name: string;
  tags: string[];
  score: number;
  conf: number;
  category: string;
  subCategory: string;
  cdpTags: string[];
  voc: string;
  radar: number[];
  provenance: PersonaProvenance;
  sourcePool: 'cdp' | 'social';
};

export type UploadedMaterial = {
  id: string;
  name: string;
  sizeLabel: string;
  uploadedAt: number;
};

export type ResearchProject = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  stage: ProjectStage;
  initialPrompt: string;
  intentClarify: {
    questions: ChoiceQuestion[];
    answers: Record<string, string[]>;
    summary: string;
    completed: boolean;
  };
  fullTimeSource: {
    mode: 'custom' | 'skip';
    knowledgeScopes: {
      insightReport: boolean;
      vehicleKnowledge: boolean;
      industryKnowledge: boolean;
    };
    onlineSearch: boolean;
    completed: boolean;
  };
  fullDomainSource: {
    mode: 'custom' | 'skip';
    source: 'firstParty' | 'firstPlusThirdParty';
    timeRange: 'all' | 'week' | 'month' | 'quarter' | 'halfYear' | 'year';
    completed: boolean;
  };
  topicExplore: {
    summary: string;
    suggestions: string[];
    messages: ChatMessage[];
    confirmedTopic: string;
  };
  planStage: {
    plan: ResearchPlan | null;
    confirmed: boolean;
  };
  personaStage: {
    personas: InterviewPersona[];
    selectedPersonaIds: string[];
    detailPersonaId: string | null;
    matchedFromCdp: number;
    supplementedFromSocial: number;
    confirmed: boolean;
  };
  interviewOutlineStage: {
    outline: string;
    confirmed: boolean;
  };
  materialUploadStage: {
    files: UploadedMaterial[];
    skipped: boolean;
  };
  reportStage: {
    report: string;
    generatedAt?: number;
  };
};

type LegacyInsightRun = {
  id?: string;
  title?: string;
  updatedAt?: number;
  stage?: string;
  fullTimeEnabled?: boolean;
  fullDomainEnabled?: boolean;
  fullTimeFilters?: {
    knowledgeScopes?: {
      insightReport?: boolean;
      vehicleKnowledge?: boolean;
      industryKnowledge?: boolean;
    };
    isOnlineSearch?: boolean;
  };
  fullDomainFilters?: {
    source?: 'all' | 'firstParty' | 'firstPlusThirdParty';
    timeRange?: 'all' | 'week' | 'month' | 'quarter' | 'halfYear' | 'year';
  };
  insightTracks?: {
    fullTime?: { messages?: Array<{ id?: string; role?: 'user' | 'assistant'; text?: string }>; report?: string };
    fullDomain?: { messages?: Array<{ id?: string; role?: 'user' | 'assistant'; text?: string }>; report?: string };
  };
  chatMessages?: Array<{ id?: string; role?: 'user' | 'assistant'; text?: string }>;
};

type LegacyFormalProject = {
  id?: string;
  name?: string;
  updatedAt?: number;
  synthesisReport?: string | {
    generatedAt?: number;
    fullTimeTopic?: string;
    fullDomainTopic?: string;
    fullTimeConclusion?: string;
    fullDomainConclusion?: string;
    integratedInsights?: string[];
  };
};

export const RESEARCH_PROJECTS_KEY = 'volvo.research-projects';
const LEGACY_INSIGHT_RUNS_KEY = 'volvo.insight-research.runs';
const LEGACY_FORMAL_PROJECTS_KEY = 'volvo.research.projects';

export function projectStageLabel(stage: ProjectStage) {
  switch (stage) {
    case 'intentClarify':
      return '澄清研究意图';
    case 'fullTimeSourceSelect':
      return '选择全时洞察范围';
    case 'fullDomainSourceSelect':
      return '选择全域洞察范围';
    case 'topicExplore':
      return '确认正式研究主题';
    case 'plan':
      return '生成调研计划';
    case 'persona':
      return '筛选访谈人设';
    case 'interviewOutline':
      return '确认访谈大纲';
    case 'materialUpload':
      return '补充访谈资料';
    case 'report':
      return '生成研究报告';
  }
}

export function formatProjectTime(ts: number) {
  return new Date(ts).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function truncateProjectTitle(text: string, max = 24) {
  const clean = text.trim();
  if (!clean) return '';
  return clean.length > max ? `${clean.slice(0, max)}...` : clean;
}

export function defaultIntentQuestions(prompt: string): ChoiceQuestion[] {
  const clean = prompt.trim() || '当前业务问题';
  return [
    {
      id: 'intent-goal',
      title: `围绕“${truncateProjectTitle(clean, 18) || '当前业务问题'}”，本次研究更想回答哪类问题？`,
      options: ['识别用户需求与痛点', '验证某个产品/营销假设', '寻找新增机会点', '评估人群差异与优先级'],
    },
    {
      id: 'intent-audience',
      title: '本次研究主要面向哪类对象？',
      options: ['潜在购车用户', '已有车主', '重点细分人群', '内部业务团队/管理层'],
    },
    {
      id: 'intent-output',
      title: '你更需要哪类研究产出？',
      options: ['形成正式调研计划', '快速明确研究主题', '锁定访谈对象与筛选规则', '沉淀最终洞察与报告'],
    },
  ];
}

export function createEmptyProject(initialPrompt = ''): ResearchProject {
  const now = Date.now();
  const prompt = initialPrompt.trim();
  return {
    id: `project-${now}`,
    title: truncateProjectTitle(prompt || '未命名项目') || '未命名项目',
    createdAt: now,
    updatedAt: now,
    stage: 'intentClarify',
    initialPrompt: prompt,
    intentClarify: {
      questions: defaultIntentQuestions(prompt),
      answers: {},
      summary: '',
      completed: false,
    },
    fullTimeSource: {
      mode: 'custom',
      knowledgeScopes: {
        insightReport: true,
        vehicleKnowledge: true,
        industryKnowledge: false,
      },
      onlineSearch: true,
      completed: false,
    },
    fullDomainSource: {
      mode: 'custom',
      source: 'firstPlusThirdParty',
      timeRange: 'quarter',
      completed: false,
    },
    topicExplore: {
      summary: '',
      suggestions: [],
      messages: [],
      confirmedTopic: '',
    },
    planStage: {
      plan: null,
      confirmed: false,
    },
    personaStage: {
      personas: [],
      selectedPersonaIds: [],
      detailPersonaId: null,
      matchedFromCdp: 0,
      supplementedFromSocial: 0,
      confirmed: false,
    },
    interviewOutlineStage: {
      outline: '',
      confirmed: false,
    },
    materialUploadStage: {
      files: [],
      skipped: false,
    },
    reportStage: {
      report: '',
    },
  };
}

function normalizeChatMessages(messages?: Array<{ id?: string; role?: 'user' | 'assistant'; text?: string }>): ChatMessage[] {
  if (!Array.isArray(messages)) return [];
  return messages
    .filter((item) => item && typeof item.text === 'string' && (item.role === 'user' || item.role === 'assistant'))
    .map((item, idx) => ({
      id: item.id ?? `legacy-msg-${idx}`,
      role: item.role as 'user' | 'assistant',
      text: item.text ?? '',
      createdAt: Date.now() + idx,
    }));
}

function reportTextFromLegacy(project: LegacyFormalProject['synthesisReport']) {
  if (!project) return '';
  if (typeof project === 'string') return project;
  return [
    '洞察整合摘要',
    '',
    `全时主题：${project.fullTimeTopic ?? '未记录'}`,
    `全域主题：${project.fullDomainTopic ?? '未记录'}`,
    '',
    '全时结论：',
    project.fullTimeConclusion ?? '暂无',
    '',
    '全域结论：',
    project.fullDomainConclusion ?? '暂无',
    '',
    '综合判断：',
    ...(project.integratedInsights?.map((item, idx) => `${idx + 1}. ${item}`) ?? ['暂无']),
  ].join('\n');
}

function stageFromLegacy(stage?: string): ProjectStage {
  switch (stage) {
    case 'persona':
      return 'persona';
    case 'report':
      return 'report';
    case 'verifyPlan':
      return 'plan';
    case 'formalStart':
    case 'summaryConfirm':
    case 'insightChat':
    default:
      return 'topicExplore';
  }
}

function migrateLegacyInsightRun(raw: LegacyInsightRun): ResearchProject {
  const legacyFullTimeMessages = normalizeChatMessages(raw.insightTracks?.fullTime?.messages);
  const legacyFullDomainMessages = normalizeChatMessages(raw.insightTracks?.fullDomain?.messages);
  const legacyMessages = legacyFullTimeMessages.length + legacyFullDomainMessages.length > 0
    ? [...legacyFullTimeMessages, ...legacyFullDomainMessages]
    : normalizeChatMessages(raw.chatMessages);
  const firstPrompt = legacyMessages.find((item) => item.role === 'user')?.text ?? raw.title ?? '';
  const project = createEmptyProject(firstPrompt);
  const fullTimeEnabled = raw.fullTimeEnabled ?? true;
  const fullDomainEnabled = raw.fullDomainEnabled ?? true;
  const migratedStage = stageFromLegacy(raw.stage);
  const summaryBlocks = [
    raw.insightTracks?.fullTime?.report ? `全时洞察摘要：\n${raw.insightTracks.fullTime.report}` : '',
    raw.insightTracks?.fullDomain?.report ? `全域洞察摘要：\n${raw.insightTracks.fullDomain.report}` : '',
  ].filter(Boolean);
  return {
    ...project,
    id: raw.id ?? project.id,
    title: truncateProjectTitle(raw.title ?? firstPrompt ?? '历史洞察项目') || '历史洞察项目',
    createdAt: raw.updatedAt ?? project.createdAt,
    updatedAt: raw.updatedAt ?? project.updatedAt,
    stage: migratedStage,
    intentClarify: {
      ...project.intentClarify,
      summary: '该项目由旧版洞察流程迁移而来，建议检查研究意图与筛选条件后继续。',
      completed: true,
    },
    fullTimeSource: {
      mode: fullTimeEnabled ? 'custom' : 'skip',
      knowledgeScopes: {
        insightReport: raw.fullTimeFilters?.knowledgeScopes?.insightReport ?? true,
        vehicleKnowledge: raw.fullTimeFilters?.knowledgeScopes?.vehicleKnowledge ?? true,
        industryKnowledge: raw.fullTimeFilters?.knowledgeScopes?.industryKnowledge ?? false,
      },
      onlineSearch: raw.fullTimeFilters?.isOnlineSearch ?? true,
      completed: true,
    },
    fullDomainSource: {
      mode: fullDomainEnabled ? 'custom' : 'skip',
      source: raw.fullDomainFilters?.source === 'firstParty' ? 'firstParty' : 'firstPlusThirdParty',
      timeRange: raw.fullDomainFilters?.timeRange ?? 'quarter',
      completed: true,
    },
    topicExplore: {
      summary: summaryBlocks.join('\n\n') || '已迁移历史洞察记录，可在此继续确认正式研究主题。',
      suggestions: [
        '确认本次最值得深入的研究主题',
        '把历史洞察整理成正式研究假设',
        '基于现有洞察锁定访谈优先人群',
      ],
      messages: legacyMessages,
      confirmedTopic: '',
    },
  };
}

function migrateLegacyFormalProject(raw: LegacyFormalProject): ResearchProject {
  const report = reportTextFromLegacy(raw.synthesisReport);
  const project = createEmptyProject(raw.name ?? '历史正式研究项目');
  return {
    ...project,
    id: raw.id ?? project.id,
    title: truncateProjectTitle(raw.name ?? '历史正式研究项目') || '历史正式研究项目',
    createdAt: raw.updatedAt ?? project.createdAt,
    updatedAt: raw.updatedAt ?? project.updatedAt,
    stage: 'report',
    intentClarify: {
      ...project.intentClarify,
      summary: '该项目由旧版正式研究记录迁移而来。',
      completed: true,
    },
    fullTimeSource: { ...project.fullTimeSource, completed: true },
    fullDomainSource: { ...project.fullDomainSource, completed: true },
    topicExplore: {
      summary: report,
      suggestions: [],
      messages: [],
      confirmedTopic: raw.name ?? '',
    },
    reportStage: {
      report,
      generatedAt: raw.updatedAt ?? Date.now(),
    },
  };
}

function readLegacyProjects(): ResearchProject[] {
  if (typeof window === 'undefined') return [];
  const projects: ResearchProject[] = [];
  try {
    const insightRaw = window.localStorage.getItem(LEGACY_INSIGHT_RUNS_KEY);
    if (insightRaw) {
      const parsed = JSON.parse(insightRaw) as LegacyInsightRun[];
      if (Array.isArray(parsed)) {
        projects.push(...parsed.map((item) => migrateLegacyInsightRun(item)));
      }
    }
  } catch {
    // ignore malformed legacy insight data
  }
  try {
    const formalRaw = window.localStorage.getItem(LEGACY_FORMAL_PROJECTS_KEY);
    if (formalRaw) {
      const parsed = JSON.parse(formalRaw) as LegacyFormalProject[];
      if (Array.isArray(parsed)) {
        projects.push(...parsed.map((item) => migrateLegacyFormalProject(item)));
      }
    }
  } catch {
    // ignore malformed legacy formal data
  }
  return projects;
}

export function readResearchProjects(): ResearchProject[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(RESEARCH_PROJECTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ResearchProject[];
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore malformed current data
  }
  const migrated = readLegacyProjects();
  if (migrated.length > 0) {
    writeResearchProjects(migrated);
  }
  return migrated;
}

export function writeResearchProjects(projects: ResearchProject[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(RESEARCH_PROJECTS_KEY, JSON.stringify(projects));
}
