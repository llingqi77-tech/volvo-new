export type PersonaProvenance = 'first' | 'third' | 'deep_interview';

export type ProjectStage =
  | 'intentClarify'
  | 'fullTimeSourceSelect'
  | 'fullDomainSourceSelect'
  | 'topicExplore'
  | 'plan'
  | 'persona'
  | 'interviewOutline'
  | 'interviewExecution'
  | 'materialUpload'
  | 'report';

export type ChoiceQuestion = {
  id: string;
  title: string;
  description?: string;
  options: string[];
  allowMultiple?: boolean;
};

/** 扩展消息类型：旧数据无 variant 时按纯文本渲染 */
export type ChatMessageVariant =
  | 'text'
  | 'thinking'
  | 'intent_options'
  | 'cta_proceed_fulltime'
  | 'fulltime_form'
  | 'domain_form'
  | 'topic_suggestions'
  | 'topic_confirmed_plan_card'
  | 'interview_content_ready';

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  createdAt: number;
  variant?: ChatMessageVariant;
  /** variant === intent_options 时对应题目 id */
  intentQuestionId?: string;
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
  sourcePool: 'cdp' | 'cdp_voc' | 'voc';
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
  summary: string;
  archived: boolean;
  createdAt: number;
  updatedAt: number;
  stage: ProjectStage;
  initialPrompt: string;
  /** 人设前统一对话流（澄清、范围、主题、计划） */
  prePersonaMessages: ChatMessage[];
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
  /** 访谈执行：模拟生成的各人设访谈正文 */
  interviewExecutionStage: {
    transcripts: Record<string, string>;
    selectedPersonaId: string | null;
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
    case 'interviewExecution':
      return '访谈执行';
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

function initialIntentThinking(preview: string): string {
  const p = preview.trim() || '（未填写）';
  return [
    '正在理解你的研究背景…',
    `- 已读入问题：「${truncateProjectTitle(p, 40)}」`,
    '- 识别决策场景与关键歧义点',
    '- 映射澄清维度：目标、对象、产出预期',
    '- 准备第一轮单选题',
  ].join('\n');
}

function initialPrePersonaMessages(prompt: string, questions: ChoiceQuestion[]): ChatMessage[] {
  const now = Date.now();
  const first = questions[0];
  if (!first) {
    return [{ id: `ppm-user-${now}`, role: 'user', text: prompt.trim() || '（未填写）', createdAt: now }];
  }
  return [
    { id: `ppm-user-${now}`, role: 'user', text: prompt.trim() || '（未填写）', createdAt: now },
    {
      id: `ppm-think-${now + 1}`,
      role: 'assistant',
      variant: 'thinking',
      text: initialIntentThinking(prompt),
      createdAt: now + 1,
    },
    {
      id: `ppm-q0-${now + 2}`,
      role: 'assistant',
      variant: 'intent_options',
      intentQuestionId: first.id,
      text: first.title,
      createdAt: now + 2,
    },
  ];
}

export function createEmptyProject(initialPrompt = ''): ResearchProject {
  const now = Date.now();
  const prompt = initialPrompt.trim();
  const questions = defaultIntentQuestions(prompt);
  return {
    id: `project-${now}`,
    title: truncateProjectTitle(prompt || '未命名项目') || '未命名项目',
    summary: truncateProjectTitle(prompt || '待补充研究摘要', 80) || '待补充研究摘要',
    archived: false,
    createdAt: now,
    updatedAt: now,
    stage: 'intentClarify',
    initialPrompt: prompt,
    prePersonaMessages: initialPrePersonaMessages(prompt, questions),
    intentClarify: {
      questions,
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
    interviewExecutionStage: {
      transcripts: {},
      selectedPersonaId: null,
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

function migrateLegacyInsightRun(raw: LegacyInsightRun): ResearchProject {
  const p = createEmptyProject(raw.title ?? '');
  const id = raw.id ?? p.id;
  return {
    ...p,
    id,
    title: raw.title ?? p.title,
    summary: truncateProjectTitle(raw.title ?? p.title, 80) || '待补充研究摘要',
    archived: false,
    updatedAt: raw.updatedAt ?? p.updatedAt,
    stage: 'topicExplore',
    fullTimeSource: {
      mode: raw.fullTimeEnabled === false ? 'skip' : 'custom',
      knowledgeScopes: {
        insightReport: raw.fullTimeFilters?.knowledgeScopes?.insightReport ?? true,
        vehicleKnowledge: raw.fullTimeFilters?.knowledgeScopes?.vehicleKnowledge ?? true,
        industryKnowledge: raw.fullTimeFilters?.knowledgeScopes?.industryKnowledge ?? false,
      },
      onlineSearch: raw.fullTimeFilters?.isOnlineSearch ?? true,
      completed: true,
    },
    fullDomainSource: {
      mode: raw.fullDomainEnabled === false ? 'skip' : 'custom',
      source:
        raw.fullDomainFilters?.source === 'firstParty'
          ? 'firstParty'
          : raw.fullDomainFilters?.source === 'firstPlusThirdParty'
            ? 'firstPlusThirdParty'
            : 'firstPlusThirdParty',
      timeRange: raw.fullDomainFilters?.timeRange ?? 'quarter',
      completed: true,
    },
    intentClarify: { ...p.intentClarify, completed: true },
    topicExplore: {
      ...p.topicExplore,
      messages: (raw.chatMessages ?? [])
        .filter((m) => m.text)
        .map((m, i) => ({
          id: m.id ?? `m-${i}`,
          role: m.role ?? 'assistant',
          text: m.text ?? '',
          createdAt: p.createdAt + i,
        })),
    },
    prePersonaMessages:
      (raw.chatMessages?.length ?? 0) > 0
        ? (raw.chatMessages ?? [])
            .filter((m) => m.text)
            .map((m, i) => ({
              id: m.id ?? `m-${i}`,
              role: m.role ?? 'assistant',
              text: m.text ?? '',
              createdAt: p.createdAt + i,
            }))
        : p.prePersonaMessages,
  };
}

function migrateLegacyFormalProject(raw: LegacyFormalProject): ResearchProject {
  const p = createEmptyProject(typeof raw.synthesisReport === 'string' ? raw.synthesisReport : raw.name ?? '');
  return {
    ...p,
    id: raw.id ?? p.id,
    title: raw.name ?? p.title,
    summary: truncateProjectTitle(raw.name ?? p.title, 80) || '待补充研究摘要',
    archived: false,
    updatedAt: raw.updatedAt ?? p.updatedAt,
    stage: 'report',
    intentClarify: { ...p.intentClarify, completed: true },
    fullTimeSource: { ...p.fullTimeSource, completed: true },
    fullDomainSource: { ...p.fullDomainSource, completed: true },
    reportStage: {
      report: typeof raw.synthesisReport === 'string' ? raw.synthesisReport : JSON.stringify(raw.synthesisReport ?? {}),
      generatedAt: Date.now(),
    },
  };
}

function readLegacyProjects(): ResearchProject[] {
  const projects: ResearchProject[] = [];
  try {
    const insightRaw = localStorage.getItem(LEGACY_INSIGHT_RUNS_KEY);
    if (insightRaw) {
      const parsed = JSON.parse(insightRaw) as LegacyInsightRun[];
      if (Array.isArray(parsed)) {
        projects.push(...parsed.map(migrateLegacyInsightRun));
      }
    }
  } catch {
    /* ignore */
  }
  try {
    const formalRaw = localStorage.getItem(LEGACY_FORMAL_PROJECTS_KEY);
    if (formalRaw) {
      const parsed = JSON.parse(formalRaw) as LegacyFormalProject[];
      if (Array.isArray(parsed)) {
        projects.push(...parsed.map(migrateLegacyFormalProject));
      }
    }
  } catch {
    /* ignore */
  }
  return projects;
}

function ensurePrePersonaMessages(project: ResearchProject): ResearchProject {
  if (project.prePersonaMessages && project.prePersonaMessages.length > 0) {
    return project;
  }
  const questions = project.intentClarify.questions.length
    ? project.intentClarify.questions
    : defaultIntentQuestions(project.initialPrompt);
  const msgs: ChatMessage[] = [
    {
      id: `bf-user-${project.id}`,
      role: 'user',
      text: project.initialPrompt || project.title,
      createdAt: project.createdAt,
    },
  ];
  for (const q of questions) {
    const ans = project.intentClarify.answers[q.id];
    if (ans?.length) {
      msgs.push({
        id: `bf-q-${q.id}`,
        role: 'assistant',
        text: q.title,
        createdAt: project.createdAt + 1,
      });
      msgs.push({
        id: `bf-a-${q.id}`,
        role: 'user',
        text: ans.join('、'),
        createdAt: project.createdAt + 2,
      });
    }
  }
  if (msgs.length === 1) {
    return {
      ...project,
      prePersonaMessages: initialPrePersonaMessages(project.initialPrompt, questions),
    };
  }
  msgs.push({
    id: `bf-resume-${project.id}`,
    role: 'assistant',
    text: '已恢复你此前的选择，可在右侧查看摘要并继续当前环节。',
    createdAt: Date.now(),
  });
  return { ...project, prePersonaMessages: msgs };
}

export function readResearchProjects(): ResearchProject[] {
  // #region agent log
  fetch('http://127.0.0.1:7288/ingest/dbdc2c33-75d3-416a-ae77-97ee35b38cbf',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'b8ce08'},body:JSON.stringify({sessionId:'b8ce08',runId:'pre-fix',hypothesisId:'H3',location:'src/utils/researchProjectStore.ts:499',message:'readResearchProjects invoked',data:{key:RESEARCH_PROJECTS_KEY},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  try {
    const raw = localStorage.getItem(RESEARCH_PROJECTS_KEY);
    // #region agent log
    fetch('http://127.0.0.1:7288/ingest/dbdc2c33-75d3-416a-ae77-97ee35b38cbf',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'b8ce08'},body:JSON.stringify({sessionId:'b8ce08',runId:'pre-fix',hypothesisId:'H4',location:'src/utils/researchProjectStore.ts:503',message:'raw localStorage payload metadata',data:{hasRaw:Boolean(raw),rawLength:raw?.length ?? 0},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    if (!raw) {
      const migrated = readLegacyProjects();
      if (migrated.length > 0) {
        writeResearchProjects(migrated);
        localStorage.removeItem(LEGACY_INSIGHT_RUNS_KEY);
        localStorage.removeItem(LEGACY_FORMAL_PROJECTS_KEY);
      }
      return migrated;
    }
    const parsed = JSON.parse(raw) as ResearchProject[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map((p) => {
      const base = ensurePrePersonaMessages({
        ...p,
        summary: p.summary ?? (truncateProjectTitle(p.initialPrompt || p.title, 80) || '待补充研究摘要'),
        archived: p.archived ?? false,
        prePersonaMessages: p.prePersonaMessages ?? [],
      });
      return {
        ...base,
        interviewExecutionStage: base.interviewExecutionStage ?? {
          transcripts: {},
          selectedPersonaId: null,
        },
      };
    });
  } catch {
    return [];
  }
}

export function writeResearchProjects(projects: ResearchProject[]) {
  localStorage.setItem(RESEARCH_PROJECTS_KEY, JSON.stringify(projects));
}
