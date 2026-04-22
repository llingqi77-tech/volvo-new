import type {
  InterviewOutlineQuestion,
  InterviewQuestionType,
  ResearchProject,
} from './researchProjectStore';

const DEFAULT_QUESTION_LINES = [
  '破冰：请受访者描述与当前研究主题相关的真实场景与近期经历',
  '触发点：是什么让受访者开始关注这类问题或机会',
  '决策标准：受访者最看重哪些信息、体验或结果',
  '阻碍因素：哪些顾虑、风险或替代方案让其犹豫',
  '人群差异：哪些细分人群会给出明显不同的反馈',
  '收尾：如果让受访者提出一条建议，最希望系统或品牌改进什么',
] as const;

function typeLabel(t: InterviewQuestionType): string {
  if (t === 'open') return '开放式';
  if (t === 'single') return '单选题';
  return '多选题';
}

/** 从 Markdown 大纲弱解析「三、访谈提纲」下的编号行 */
export function parseQuestionsFromLegacyOutline(outline: string, projectId: string): InterviewOutlineQuestion[] {
  const lines = outline.split('\n');
  const startIdx = lines.findIndex((l) => l.trim().startsWith('## 三、访谈提纲') || l.trim() === '## 三、访谈提纲');
  if (startIdx === -1) return [];
  const collected: string[] = [];
  for (let i = startIdx + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('## ')) break;
    const m = line.match(/^(\d+)\.\s*(.+)$/);
    if (m) collected.push(m[2].trim());
  }
  if (collected.length === 0) return [];
  return collected.map((content, idx) => ({
    id: `iq-mig-${projectId}-${idx}`,
    order: idx,
    content,
    type: 'open' as const,
    options: [],
  }));
}

export function buildDefaultOutlineQuestions(project: ResearchProject): InterviewOutlineQuestion[] {
  return DEFAULT_QUESTION_LINES.map((content, idx) => ({
    id: `iq-${project.id}-def-${idx}`,
    order: idx,
    content,
    type: 'open' as const,
    options: [],
  }));
}

function normalizeQuestionOrders(questions: InterviewOutlineQuestion[]): InterviewOutlineQuestion[] {
  return questions.map((q, idx) => ({ ...q, order: idx }));
}

export function withNormalizedOrders(questions: InterviewOutlineQuestion[]): InterviewOutlineQuestion[] {
  return normalizeQuestionOrders([...questions].sort((a, b) => a.order - b.order));
}

export function serializeInterviewOutline(project: ResearchProject, questions: InterviewOutlineQuestion[]): string {
  const ordered = withNormalizedOrders(questions);
  const topic = project.topicExplore.confirmedTopic || project.initialPrompt || project.title;
  const selectedPersonas = project.personaStage.personas.filter((persona) =>
    project.personaStage.selectedPersonaIds.includes(persona.id),
  );
  const samplePersonaNames = selectedPersonas.slice(0, 4).map((persona) => persona.cardTitle).join('、');
  const personaCount =
    selectedPersonas.length > 0 ? selectedPersonas.length : project.personaStage.personas.length;

  const section3 = ordered.map((q, idx) => {
    const n = idx + 1;
    const type = typeLabel(q.type);
    const opts =
      (q.type === 'single' || q.type === 'multi') && q.options && q.options.length > 0
        ? `\n   选项：${q.options.filter(Boolean).join('；')}`
        : '';
    const hint = q.aiHint?.trim() ? `\n   AI提示：${q.aiHint.trim()}` : '';
    const img = q.imageDataUrl ? '\n   （含配图）' : '';
    return `${n}. [${type}] ${q.content.trim()}${opts}${hint}${img}`;
  });

  return [
    `# ${topic} 访谈大纲`,
    '',
    '## 一、访谈目标',
    `- 围绕“${topic}”验证核心动机、阻碍因素与决策差异`,
    '- 对比不同人群在触发场景、评价标准和优先级上的差异',
    '- 输出可直接进入最终研究报告的关键结论与原始证据',
    '',
    '## 二、目标人设',
    `- 本轮访谈覆盖 ${personaCount} 个确认人设，重点包括：${samplePersonaNames || '待确认人设'}`,
    '',
    '## 三、访谈提纲',
    ...(section3.length > 0 ? section3 : ['（尚未添加访谈问题，请在问题列表中添加。）']),
    '',
    '## 四、记录要求',
    '- 保留原话证据',
    '- 标注情绪强度与场景上下文',
    '- 对出现分歧的观点单独建档',
  ].join('\n');
}

/** 归一化 store 中的 interviewOutlineStage（补全 questions、必要时从 outline 解析） */
export function normalizeInterviewOutlineStage(
  project: ResearchProject,
  stage: ResearchProject['interviewOutlineStage'] | undefined,
): ResearchProject['interviewOutlineStage'] {
  const outline = stage?.outline ?? '';
  const confirmed = stage?.confirmed ?? false;
  let questions = stage?.questions;
  if (!questions || !Array.isArray(questions)) {
    questions = outline.trim() ? parseQuestionsFromLegacyOutline(outline, project.id) : [];
  }
  questions = withNormalizedOrders(
    questions.map((q) => ({
      ...q,
      options: q.options ?? [],
      type: q.type ?? 'open',
    })),
  );
  const nextOutline =
    questions.length > 0 ? serializeInterviewOutline(project, questions) : outline;
  return {
    questions,
    outline: nextOutline,
    confirmed,
  };
}
