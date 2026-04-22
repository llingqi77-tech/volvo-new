import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Archive, ArchiveRestore, ArrowLeft, Bot, BookmarkPlus, Check, Download, Eye, FileText, History, Plus, Search, Send, Share2 } from 'lucide-react';
import { PersonaCdpTagFilterPanel } from '../components/PersonaCdpTagFilterPanel';
import { PersonaDetailView } from '../components/PersonaDetailView';
import { filterSchema, type TagField } from '../data/personaFilterSchema';
import {
  RADAR_TIER_MAX,
  getPersonaAlias,
  provenanceBadgeClass,
  provenanceLabel,
  radarChartLabels,
  radarValuesToTiers,
  sumRadarTiers,
} from '../utils/personaDisplay';
import CreateInterviewQuestionModal from '../components/interview/CreateInterviewQuestionModal';
import InterviewOutlineQuestionList from '../components/interview/InterviewOutlineQuestionList';
import {
  buildDefaultOutlineQuestions,
  serializeInterviewOutline,
  withNormalizedOrders,
} from '../utils/interviewOutlineSerialize';
import {
  createEmptyProject,
  defaultIntentQuestions,
  formatProjectTime,
  projectStageLabel,
  readResearchProjects,
  type ChatMessage,
  type ChatMessageVariant,
  type ChoiceQuestion,
  type InterviewOutlineQuestion,
  type InterviewPersona,
  type PersonaProvenance,
  type ResearchPlan,
  type ResearchProject,
  type UploadedMaterial,
  type ProjectStage,
  writeResearchProjects,
} from '../utils/researchProjectStore';

const PERSONA_CARD_TAG_CLASS = 'px-2 py-1 bg-surface-hover text-gray-300 text-xs rounded';

type EntryMode = 'insight' | 'projects';
type RightPanelSection = 'insightSearchReport' | 'plan' | 'persona' | 'outline' | 'interview' | 'report';
type VolvoPresetDimension = '产品创新' | '新品测试' | '竞品分析' | '用户旅程研究';
type VolvoPresetCase = {
  id: string;
  title: string;
  dimension: VolvoPresetDimension;
  audience: string;
  objective: string;
  scenario: string;
  deliverables: string[];
};

/** 仅左侧全宽对话流、无右栏 */
const FULL_WIDTH_CHAT_STAGES: ResearchProject['stage'][] = [
  'intentClarify',
  'fullTimeSourceSelect',
  'fullDomainSourceSelect',
  'insightSearchReport',
  'topicExplore',
];

const TIMELINE_STAGES = ['洞察搜索', '方案设计', '人群筛选', '大纲设计', '访谈执行', '报告生成'] as const;
type TimelineStageLabel = typeof TIMELINE_STAGES[number];
type HistoryStatusFilter = 'all' | 'unpublished' | 'published' | TimelineStageLabel;

const STAGE_BADGE_LABELS: Record<ProjectStage, string> = {
  intentClarify: '洞察搜索',
  fullTimeSourceSelect: '洞察搜索',
  fullDomainSourceSelect: '洞察搜索',
  insightSearchReport: '洞察搜索',
  topicExplore: '洞察搜索',
  plan: '方案设计',
  persona: '人群筛选',
  interviewOutline: '大纲设计',
  interviewExecution: '访谈执行',
  materialUpload: '报告生成',
  report: '未发布',
};

function getHistoryStatusLabel(project: ResearchProject) {
  if (project.archived) return '已发布';
  return STAGE_BADGE_LABELS[project.stage];
}

function getHistoryStatusClass(label: string) {
  if (label === '已发布') return 'border border-[var(--status-done-border)] bg-[var(--status-done-bg)] text-[var(--status-done-text)]';
  if (label === '未发布') return 'border border-amber-500/30 bg-amber-500/10 text-amber-300';
  if (TIMELINE_STAGES.includes(label as TimelineStageLabel)) {
    return 'border border-[var(--status-active-border)] bg-[var(--status-active-bg)] text-[var(--status-active-text)]';
  }
  return 'border border-[var(--status-idle-border)] bg-[var(--status-idle-bg)] text-[var(--status-idle-text)]';
}

function stageToTimelineIndex(stage: ProjectStage) {
  if (stage === 'insightSearchReport') return 0;
  if (stage === 'plan') return 1;
  if (stage === 'persona') return 2;
  if (stage === 'interviewOutline') return 3;
  if (stage === 'interviewExecution') return 4;
  if (stage === 'materialUpload' || stage === 'report') return 5;
  return 0;
}

function formatHistoryTimestamp(ts: number) {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}年${pad(d.getMonth() + 1)}月${pad(d.getDate())}日 ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function lastVariantId(messages: ChatMessage[], variant: ChatMessageVariant): string | undefined {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].variant === variant) return messages[i].id;
  }
  return undefined;
}

function intentFollowupThinking(option: string): string {
  return [
    '已记录你的选择。',
    `- 选项：${option}`,
    '- 整合进研究意图画像',
    '- 推导下一澄清维度',
  ].join('\n');
}

function transitionThinking(title: string): string {
  return ['正在切换环节…', `- ${title}`, '- 更新上下文与可选参数'].join('\n');
}

const optionBaseClass = 'rounded-xl border px-4 py-3 text-left text-sm transition-colors';

function questionAnswer(question: ChoiceQuestion, answers: Record<string, string[]>) {
  return answers[question.id] ?? [];
}

function buildIntentSummary(project: ResearchProject) {
  const lines = project.intentClarify.questions.map((question) => {
    const answer = questionAnswer(question, project.intentClarify.answers);
    return answer.length > 0 ? `${question.title}：${answer.join('、')}` : '';
  }).filter(Boolean);
  if (lines.length === 0) return '尚未完成研究意图澄清。';
  return [
    `围绕“${project.initialPrompt || project.title}”，当前已初步明确研究目标、对象与交付期待。`,
    ...lines,
    '建议基于以上结果选择合适的全时/全域洞察范围，再进入正式研究主题确认。',
  ].join('\n');
}

function buildSourceSummary(project: ResearchProject) {
  const fullTime =
    project.fullTimeSource.mode === 'skip'
      ? '全时洞察：完全不选'
      : `全时洞察：${[
          project.fullTimeSource.knowledgeScopes.insightReport ? '洞察报告库' : '',
          project.fullTimeSource.knowledgeScopes.industryKnowledge ? '行业知识库' : '',
        ]
          .filter(Boolean)
          .join(' / ') || '未选知识库'}，垂媒检索${project.fullTimeSource.onlineSearch ? '开启' : '关闭'}`;
  const fullDomain =
    project.fullDomainSource.mode === 'skip'
      ? '全域洞察：完全不选'
      : `全域洞察：${
          project.fullDomainSource.source === 'firstParty' ? '一方' : '一方+三方'
        }，时间范围${timeRangeLabel(project.fullDomainSource.timeRange)}`;
  return `${fullTime}\n${fullDomain}`;
}

function buildInsightSearchReport(project: ResearchProject) {
  const fullTimeSkip = project.fullTimeSource.mode === 'skip';
  const fullDomainSkip = project.fullDomainSource.mode === 'skip';
  const sourceSummary = buildSourceSummary(project);
  const intentSummary = buildIntentSummary(project).split('\n').slice(0, 3).join('；');
  const confidenceBase = fullTimeSkip || fullDomainSkip ? '中' : '中高';
  const suggestions = [
    '围绕冲突信号补充一轮定向追问，优先验证最影响业务决策的假设',
    '将已选数据来源与后续访谈样本规则绑定，减少样本偏差造成的结论漂移',
    '进入正式研究主题后，先锁定 1-2 个高优先级问题再扩展覆盖范围',
  ];

  return [
    '洞察搜索报告',
    `生成时间：${formatProjectTime(Date.now())}`,
    '',
    '一、研究意图摘要',
    intentSummary,
    '',
    '二、已选洞察范围',
    sourceSummary,
    '',
    '三、洞察搜索结论',
    `1) 来源覆盖判断：${fullTimeSkip && fullDomainSkip ? '覆盖不足（双跳过）' : fullTimeSkip || fullDomainSkip ? '覆盖部分缺失' : '覆盖较完整'}`,
    `2) 当前证据强度：${confidenceBase}置信度，适合进入正式研究主题继续收敛`,
    `3) 风险提示：${fullTimeSkip && fullDomainSkip ? '双跳过会显著降低主题收敛效率与后续方案可信度' : '需关注来源偏差与时间窗口带来的判断偏移'}`,
    '',
    '四、进入主题建议',
    ...suggestions.map((item, idx) => `${idx + 1}. ${item}`),
  ].join('\n');
}

function buildTopicSuggestions(project: ResearchProject) {
  const base = project.initialPrompt || project.title;
  const goal =
    questionAnswer(project.intentClarify.questions[0], project.intentClarify.answers)[0] ?? '识别用户需求与痛点';
  return [
    `${base}相关用户的核心决策驱动与阻碍`,
    `${base}在不同细分人群中的优先研究议题`,
    `${goal}视角下的关键假设与验证路径`,
    `${base}可优先展开的访谈主题`,
  ];
}

function topicKickoffMessage(project: ResearchProject) {
  return [
    '我已基于前序研究意图澄清与全时/全域洞察筛选，先完成阶段总结，并给出下一步可选主题。',
    '',
    buildIntentSummary(project),
    '',
    buildSourceSummary(project),
    '',
    '接下来我会在下方给出候选主题选项；如果都不符合，你可以继续在输入框里和我对话，我会进一步提炼研究主题。',
  ].join('\n');
}

function buildTopicReply(project: ResearchProject, userInput: string) {
  const refinedTopic = buildRefinedTopic(project, userInput);
  return [
    `结合你刚才补充的“${userInput}”，我会优先把正式研究主题收敛到与业务决策更相关、可直接转成访谈与计划的方向。`,
    '',
    `当前建议主题：${refinedTopic}`,
    '',
    '如果你认同，可以直接确认该主题；如果你觉得还需要更聚焦，我可以继续把主题缩小到具体人群、场景或假设层面。',
  ].join('\n');
}

function buildRefinedTopic(project: ResearchProject, userInput: string) {
  const base = (project.initialPrompt || project.title || '').trim();
  const input = userInput.trim();
  const core = input.length > 0 ? input : base;
  return `${core}的用户动机、人群差异与验证路径研究`;
}

function buildResearchPlan(project: ResearchProject): ResearchPlan {
  const topic = project.topicExplore.confirmedTopic || project.initialPrompt || project.title;
  const intent = buildIntentSummary(project).split('\n').slice(0, 2).join('；');
  const sourceSummary = buildSourceSummary(project).replace(/\n/g, '；');
  return {
    summary: `本次研究围绕“${topic}”展开。系统将结合前序意图澄清与洞察范围选择，优先回答最影响业务判断的人群需求、关键分歧与验证路径。${intent}`,
    objectives: [
      `澄清“${topic}”对应的核心研究问题与业务决策边界`,
      '识别不同细分人群在认知、动机与阻碍上的差异',
      '形成后续访谈执行与结论沉淀所需的关键假设',
    ],
    methods: [
      `洞察输入：${sourceSummary}`,
      '访谈执行：围绕 20 个目标人设展开结构化深访',
      '结果综合：整合线上洞察、访谈反馈与补充材料输出最终研究报告',
    ],
    sampleRules: [
      '优先匹配 CDP 标签对应的人设库',
      '若不足 20 个，则从社交媒体预存人设库拟合补足至 20 个',
      '最终访谈人设总数固定控制在 20 个以内',
    ],
    outputs: ['正式调研计划', '20 个访谈人设清单', '可修订的访谈大纲', '最终研究报告'],
  };
}

function pickRadar(seed: number) {
  return [78, 82, 76, 80, 84, 79, 81].map((base, idx) => Math.min(96, base + ((seed + idx * 7) % 13)));
}

function hashStringToInt(s: string) {
  return s.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
}

const allTagFields = filterSchema.flatMap((group) => group.fields);
const allTagFieldMap = new Map(allTagFields.map((field) => [field.key, field]));
const pickByHash = (options: string[], seed: string) => options[hashStringToInt(seed) % options.length];
const deriveTagValue = (persona: InterviewPersona, field: TagField) =>
  pickByHash(field.options, `${persona.id}-${persona.name}-${field.key}`);

function buildPersonaCandidates(
  project: ResearchProject,
  tagOverrides: Record<string, string[]>,
  provenanceFilter: PersonaProvenance[] = [],
) {
  const topic = project.topicExplore.confirmedTopic || project.initialPrompt || project.title;
  const total = 10 + (hashStringToInt(project.id) % 11);
  const cdpBase = project.fullTimeSource.mode === 'skip' && project.fullDomainSource.mode === 'skip' ? 8 : 12;
  const cdpCount = Math.min(cdpBase, total);
  const supplementCount = total - cdpCount;
  const hintTags = Object.values(tagOverrides).flat();
  let personas: InterviewPersona[] = Array.from({ length: total }, (_, idx) => {
    const social = idx >= cdpCount;
    const names = ['陈思远', '林沐然', '周祺', '许悠然', '张逸豪', '宋致远', '李嘉禾', '赵以宁', '王若晨', '郑知夏'];
    const titles = ['极客小远', '精致小林', '奶爸小周', '极简悠然', 'Z代小张', '口碑小宋', '白领嘉禾', '新锐以宁', '务实若晨', '理性知夏'];
    const tagA = ['科技极客', '精致生活', '家庭安全', '环保主义', '都市先锋', '品牌认同', '效率导向', '审美敏感', '务实决策', '社媒活跃'];
    const tagB = ['高净值', '安全控', '空间导向', '极简派', 'Z世代', '长期主义', '品质感', '材料敏感', '性价比', '新鲜感'];
    const baseTagSet = [tagA[idx % tagA.length], tagB[idx % tagB.length]];
    const cdpTags = [
      social ? '社交媒体拟合' : 'CDP匹配',
      topic.slice(0, 8) || '研究主题',
      ...(hintTags.length > 0 ? hintTags.slice(0, 2) : social ? ['兴趣圈层', '内容互动'] : ['购车关注点', '生活方式']),
    ];
    const sourcePool: InterviewPersona['sourcePool'] = social ? (idx % 2 === 0 ? 'cdp_voc' : 'voc') : 'cdp';
    return {
      id: `persona-${idx + 1}`,
      cardTitle: titles[idx % titles.length],
      name: names[idx % names.length],
      tags: baseTagSet,
      score: Number((8.2 + ((idx % 7) * 0.18)).toFixed(1)),
      conf: 88 + (idx % 9),
      category: social ? '社交媒体补充拟合' : 'CDP 命中人设',
      subCategory: social ? '社交画像拟合' : '标签命中',
      cdpTags,
      voc: social
        ? `我在讨论“${topic.slice(0, 14) || '当前主题'}”时，更在意真实体验、情绪共鸣与可被验证的细节。`
        : `围绕“${topic.slice(0, 14) || '当前主题'}”，我会同时考虑功能价值、使用场景与品牌可信度。`,
      radar: pickRadar(idx + 3),
      provenance: social ? 'deep_interview' : 'first',
      sourcePool,
    };
  });
  if (provenanceFilter.length > 0) {
    personas = personas.filter((persona) => provenanceFilter.includes(persona.provenance));
  }
  const selectedEntries = Object.entries(tagOverrides).filter(([, values]) => values.length > 0);
  if (selectedEntries.length > 0) {
    personas = personas.filter((persona) =>
      selectedEntries.every(([key, values]) => {
        const field = allTagFieldMap.get(key);
        if (!field) return true;
        return values.includes(deriveTagValue(persona, field));
      }),
    );
  }
  const matchedFromCdp = personas.filter((persona) => persona.sourcePool === 'cdp').length;
  const supplementedFromSocial = personas.length - matchedFromCdp;
  return { personas, matchedFromCdp, supplementedFromSocial };
}

function getRadarTotal(radar: number[]) {
  return sumRadarTiers(radarValuesToTiers(radar));
}

/** 将默认问题序列化为完整大纲 Markdown（兼容下载、访谈正文引用） */
function buildInterviewOutline(project: ResearchProject) {
  const qs = buildDefaultOutlineQuestions(project);
  return serializeInterviewOutline(project, qs);
}

function outlineStageFromQuestions(
  project: ResearchProject,
  questions: InterviewOutlineQuestion[],
  patch?: Partial<ResearchProject['interviewOutlineStage']>,
): ResearchProject['interviewOutlineStage'] {
  const normalized = withNormalizedOrders(questions);
  return {
    questions: normalized,
    outline: serializeInterviewOutline(project, normalized),
    confirmed: patch?.confirmed ?? project.interviewOutlineStage.confirmed,
  };
}

function buildInterviewTranscript(persona: InterviewPersona, topic: string, outline: string) {
  const outlinePreview = outline.split('\n').slice(0, 12).join('\n');
  return [
    `## ${persona.name}（${persona.cardTitle}）`,
    '',
    '### 访谈背景',
    `围绕「${topic}」开展的结构化深访。人设标签：${persona.tags.join('、')}。`,
    '',
    '### 关键摘录（模拟生成）',
    `- 受访者：我认为「${topic.slice(0, 24) || '这个主题'}」真正影响决策的是信息是否可验证，而不是宣传话术。`,
    `- 受访者：${persona.voc}`,
    `- 受访者：如果只能改一件事，我希望把复杂流程变简单，并明确告诉我风险在哪里。`,
    '',
    '### 大纲对照摘要',
    '以下节选自当前确认的访谈大纲，用于对齐本次对话结构：',
    outlinePreview,
    '',
    '（以上为演示用模拟访谈正文，便于验收「按人设切换查看」的交互。）',
  ].join('\n');
}

function buildFinalReport(project: ResearchProject) {
  const topic = project.topicExplore.confirmedTopic || project.initialPrompt || project.title;
  const plan = project.planStage.plan;
  const selectedPersonas = project.personaStage.personas.filter((persona) =>
    project.personaStage.selectedPersonaIds.includes(persona.id),
  );
  const uploadSummary =
    project.materialUploadStage.files.length > 0
      ? `已补充 ${project.materialUploadStage.files.length} 份线下访谈资料。`
      : '未上传线下访谈资料，报告基于前序洞察、计划与人设结果综合生成。';
  return [
    `报告名称：${topic} 研究报告`,
    `生成时间：${formatProjectTime(Date.now())}`,
    '',
    '一、研究背景',
    `${buildIntentSummary(project).replace(/\n/g, ' ')}`,
    '',
    '二、洞察范围与正式研究主题',
    buildSourceSummary(project),
    '',
    '三、正式研究主题',
    topic,
    '',
    '四、调研计划摘要',
    ...(plan ? [plan.summary, ...plan.objectives.map((item, idx) => `${idx + 1}. ${item}`)] : ['暂无计划摘要']),
    '',
    '五、访谈人设结构',
    `共确认 ${selectedPersonas.length} 个访谈人设，其中 CDP 命中 ${project.personaStage.matchedFromCdp} 个，VOC 相关补足 ${project.personaStage.supplementedFromSocial} 个。`,
    ...selectedPersonas.slice(0, 6).map((persona, idx) => `${idx + 1}. ${persona.cardTitle}：${persona.tags.join(' / ')}`),
    '',
    '六、访谈执行说明',
    project.interviewOutlineStage.outline || '暂无访谈大纲',
    '',
    '七、各人设访谈摘录',
    ...Object.entries(project.interviewExecutionStage?.transcripts ?? {})
      .slice(0, 4)
      .map(([id, text], idx) => {
        const persona = project.personaStage.personas.find((p) => p.id === id);
        const label = persona ? `${persona.name}（${persona.cardTitle}）` : id;
        return `${idx + 1}. ${label}\n${text.split('\n').slice(0, 6).join('\n')}`;
      }),
    ...(Object.keys(project.interviewExecutionStage?.transcripts ?? {}).length === 0 ? ['暂无模拟访谈记录。'] : []),
    '',
    '八、补充资料情况',
    uploadSummary,
    '',
    '九、结论建议',
    '1. 先围绕高优先级人群与场景完成深访验证，再补充存在分歧的边缘假设。',
    '2. 把洞察筛选与访谈原话结合，用于形成最终的业务建议与优先级排序。',
    '3. 对未覆盖的资料来源保持追踪，后续可继续回到项目中追加材料与再生成报告。',
  ].join('\n');
}

function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function timeRangeLabel(value: ResearchProject['fullDomainSource']['timeRange']) {
  switch (value) {
    case 'all':
      return '全部时间';
    case 'week':
      return '近一周';
    case 'month':
      return '近一月';
    case 'quarter':
      return '近三月';
    case 'halfYear':
      return '近半年';
    case 'year':
      return '近一年';
  }
}

const VOLVO_PRESET_CASES: VolvoPresetCase[] = [
  {
    id: 'volvo-innovation-family-suv',
    title: 'EX90 家庭安全体验升级创新',
    dimension: '产品创新',
    audience: '一线/新一线中高净值家庭用户',
    objective: '挖掘安全、智能座舱与亲子场景的创新机会，沉淀下一代功能路线图',
    scenario: '围绕「家庭出行 + 周末长途 + 城市通勤」三类高频场景定义创新优先级',
    deliverables: ['机会地图', '创新功能优先级', '分人群价值主张', '迭代建议清单'],
  },
  {
    id: 'volvo-newtest-ev-sedan',
    title: '新款纯电轿车概念内测验证',
    dimension: '新品测试',
    audience: '25-40 岁城市科技/品质取向购车人群',
    objective: '验证新车型在设计、续航、智能化与价格锚点上的接受度',
    scenario: '通过概念图与功能脚本测试潜在用户的首购/换购意愿和阻碍因素',
    deliverables: ['接受度评分', '关键阻碍清单', '价格带建议', '上市前优化方向'],
  },
  {
    id: 'volvo-competitor-bba-nev',
    title: '沃尔沃 vs BBA 新能源竞品对比',
    dimension: '竞品分析',
    audience: '豪华新能源关注人群与已购豪华品牌车主',
    objective: '比较品牌认知、购买决策驱动与转化阻力，识别可突破的竞争位势',
    scenario: '对比沃尔沃与 BBA 新能源车型在安全、智能、豪华体验上的感知差异',
    deliverables: ['竞品对比矩阵', '差异化主张', '转化障碍路径', '传播策略建议'],
  },
  {
    id: 'volvo-journey-omni-touchpoint',
    title: '沃尔沃全链路用户旅程研究',
    dimension: '用户旅程研究',
    audience: '从初次关注到购后复购/推荐的完整用户链路',
    objective: '诊断线上线下触点断点，优化从认知到成交再到售后的体验闭环',
    scenario: '覆盖「内容触达-试驾-成交-交付-售后-车主社群」六阶段体验与情绪变化',
    deliverables: ['旅程地图', '痛点优先级', '触点改进方案', '跨部门协同建议'],
  },
];

function SelectionQuestion({
  title,
  description,
  options,
  selected,
  allowMultiple = false,
  hideTitle = false,
  readOnly = false,
  onChange,
}: {
  title: string;
  description?: string;
  options: string[];
  selected: string[];
  allowMultiple?: boolean;
  hideTitle?: boolean;
  readOnly?: boolean;
  onChange: (next: string[]) => void;
}) {
  return (
    <div className="space-y-3">
      {!hideTitle && (
        <div className="mb-3">
          <h3 className="text-sm font-bold text-white">{title}</h3>
          {description ? <p className="mt-1 text-xs text-gray-400">{description}</p> : null}
        </div>
      )}
      {hideTitle && description ? <p className="mb-3 text-xs text-gray-400">{description}</p> : null}
      <div className="grid w-full grid-cols-1 gap-2">
        {options.map((option) => {
          const isSelected = selected.includes(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => {
                if (readOnly) return;
                if (!allowMultiple) {
                  onChange([option]);
                  return;
                }
                if (option === '完全不选') {
                  onChange(['完全不选']);
                  return;
                }
                const set = new Set(selected);
                if (set.has('完全不选')) set.delete('完全不选');
                if (set.has(option)) set.delete(option);
                else set.add(option);
                onChange(Array.from(set));
              }}
              className={`w-full ${optionBaseClass} ${
                isSelected
                  ? 'selection-active-option border-primary bg-primary/10 text-primary'
                  : 'border-white/10 bg-white/5 text-gray-200 hover:bg-white/10'
              } ${readOnly ? 'cursor-default' : ''}`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function formatBytes(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${bytes} B`;
}

function StreamText({
  text,
  className,
  pre = false,
  onComplete,
  cadenceMs = 16,
  chunkDivisor = 80,
}: {
  text: string;
  className: string;
  pre?: boolean;
  onComplete?: () => void;
  cadenceMs?: number;
  chunkDivisor?: number;
}) {
  const [displayed, setDisplayed] = useState('');
  const completedRef = useRef(false);
  const onCompleteRef = useRef<(() => void) | undefined>(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    let index = 0;
    setDisplayed('');
    completedRef.current = false;
    const chunk = Math.max(1, Math.ceil(text.length / Math.max(1, chunkDivisor)));
    const timer = window.setInterval(() => {
      index += chunk;
      if (index >= text.length) {
        setDisplayed(text);
        window.clearInterval(timer);
        if (!completedRef.current) {
          completedRef.current = true;
          onCompleteRef.current?.();
        }
        return;
      }
      setDisplayed(text.slice(0, index));
    }, cadenceMs);
    return () => window.clearInterval(timer);
  }, [text, cadenceMs, chunkDivisor]);

  if (pre) {
    return <pre className={className}>{displayed}</pre>;
  }
  return <span className={className}>{displayed}</span>;
}

function AssistantAvatarRow({ children, showIdentity = false }: { children: ReactNode; showIdentity?: boolean }) {
  return (
    <div className="flex gap-3">
      {showIdentity ? (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary">
          <Bot size={18} className="text-black" />
        </div>
      ) : (
        <div className="w-9 shrink-0" />
      )}
      <div className="min-w-0 flex-1 space-y-1">
        {showIdentity ? <p className="mb-1 text-[11px] text-gray-400">Volvo</p> : null}
        {children}
      </div>
    </div>
  );
}

function AssistantTextCard({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-surface-hover px-4 py-3">
      <StreamText text={text} pre className="whitespace-pre-wrap font-sans text-sm text-gray-200" />
    </div>
  );
}

function ThinkingCard({ text, onComplete }: { text: string; onComplete?: () => void }) {
  return (
    <div className="px-1 py-1">
      <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-gray-500">思考</p>
      <StreamText
        text={text}
        pre
        onComplete={onComplete}
        cadenceMs={16}
        chunkDivisor={80}
        className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-gray-400"
      />
    </div>
  );
}

export default function ResearchProjects({
  entryMode = 'insight',
  onSubPageChange,
}: {
  entryMode?: EntryMode;
  onSubPageChange?: (isSubPage: boolean) => void;
}) {
  const [projects, setProjects] = useState<ResearchProject[]>(() => readResearchProjects());
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [homeView, setHomeView] = useState<'insight' | 'history'>(entryMode === 'projects' ? 'history' : 'insight');
  const [newPrompt, setNewPrompt] = useState('');
  const [historyKeyword, setHistoryKeyword] = useState('');
  const [historySortOrder, setHistorySortOrder] = useState<'desc' | 'asc'>('desc');
  const [historyArchiveFilter, setHistoryArchiveFilter] = useState<HistoryStatusFilter>('all');
  const [historyPage, setHistoryPage] = useState(1);
  const [topicChatInput, setTopicChatInput] = useState('');
  const [outlineQuestionModalOpen, setOutlineQuestionModalOpen] = useState(false);
  const [outlineQuestionEditing, setOutlineQuestionEditing] = useState<InterviewOutlineQuestion | null>(null);
  const [personaFilterValues, setPersonaFilterValues] = useState<Record<string, string[]>>({});
  const [selectedPersonaProvenance, setSelectedPersonaProvenance] = useState<PersonaProvenance[]>([]);
  const [rightPanelSection, setRightPanelSection] = useState<RightPanelSection>('report');
  const [savedPersonaIds, setSavedPersonaIds] = useState<Set<string>>(new Set());
  const [reviewTimelineIdx, setReviewTimelineIdx] = useState<number | null>(null);
  const [completedThinkingIds, setCompletedThinkingIds] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const interviewContentPanelRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const lastAutoScrollProjectIdRef = useRef<string | null>(null);
  const lastAutoScrollMessageCountRef = useRef(0);
  const lastStageProjectIdRef = useRef<string | null>(null);
  const lastStageRef = useRef<ProjectStage | null>(null);
  const STAGE_FLOW_ORDER: ProjectStage[] = ['intentClarify', 'fullTimeSourceSelect', 'fullDomainSourceSelect', 'insightSearchReport', 'topicExplore', 'plan', 'persona', 'interviewOutline', 'interviewExecution', 'materialUpload', 'report'];

  const isNearChatBottom = (el: HTMLDivElement, threshold = 120) =>
    el.scrollHeight - el.scrollTop - el.clientHeight <= threshold;

  const scrollChatToBottom = (behavior: ScrollBehavior = 'smooth') => {
    const el = chatScrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
  };

  const activeProject = useMemo(
    () => projects.find((project) => project.id === activeProjectId) ?? null,
    [projects, activeProjectId],
  );

  useEffect(() => {
    onSubPageChange?.(activeProjectId !== null);
  }, [activeProjectId, onSubPageChange]);

  const filteredHistoryProjects = useMemo(() => {
    const keyword = historyKeyword.trim().toLowerCase();
    return projects
      .filter((project) => {
        const matchKeyword =
          keyword.length === 0 ||
          project.title.toLowerCase().includes(keyword) ||
          project.summary.toLowerCase().includes(keyword);
        const statusLabel = getHistoryStatusLabel(project);
        const matchArchive =
          historyArchiveFilter === 'all' ||
          (historyArchiveFilter === 'published'
            ? project.archived
            : historyArchiveFilter === 'unpublished'
              ? !project.archived
              : statusLabel === historyArchiveFilter);
        return matchKeyword && matchArchive;
      })
      .sort((a, b) => (historySortOrder === 'desc' ? b.updatedAt - a.updatedAt : a.updatedAt - b.updatedAt));
  }, [projects, historyKeyword, historySortOrder, historyArchiveFilter]);
  const HISTORY_PAGE_SIZE = 30;
  const totalHistoryPages = Math.max(1, Math.ceil(filteredHistoryProjects.length / HISTORY_PAGE_SIZE));
  const pagedHistoryProjects = filteredHistoryProjects.slice(
    (historyPage - 1) * HISTORY_PAGE_SIZE,
    historyPage * HISTORY_PAGE_SIZE,
  );

  useEffect(() => {
    setHistoryPage(1);
  }, [historyKeyword, historySortOrder, historyArchiveFilter]);

  useEffect(() => {
    if (historyPage > totalHistoryPages) setHistoryPage(totalHistoryPages);
  }, [historyPage, totalHistoryPages]);

  const persistProjects = (updater: ResearchProject[] | ((current: ResearchProject[]) => ResearchProject[])) => {
    setProjects((current) => {
      const nextProjects = typeof updater === 'function' ? updater(current) : updater;
      writeResearchProjects(nextProjects);
      return nextProjects;
    });
  };

  const updateProject = (projectId: string, updater: (current: ResearchProject) => ResearchProject) => {
    persistProjects((currentProjects) =>
      currentProjects.map((project) =>
        project.id === projectId ? { ...updater(project), updatedAt: Date.now() } : project,
      ),
    );
  };

  const persistOutlineQuestions = (projectId: string, questions: InterviewOutlineQuestion[]) => {
    updateProject(projectId, (p) => ({
      ...p,
      interviewOutlineStage: outlineStageFromQuestions(p, questions),
    }));
  };

  const handleSaveOutlineQuestion = (saved: InterviewOutlineQuestion) => {
    if (!activeProject) return;
    const current = activeProject.interviewOutlineStage.questions;
    const existingIdx = current.findIndex((q) => q.id === saved.id);
    let next: InterviewOutlineQuestion[];
    if (existingIdx >= 0) {
      next = current.map((q, i) => (i === existingIdx ? { ...saved, order: q.order } : q));
    } else {
      next = [...current, { ...saved, order: current.length }];
    }
    persistOutlineQuestions(activeProject.id, next);
    setOutlineQuestionModalOpen(false);
    setOutlineQuestionEditing(null);
  };

  const goToPlanFromTopic = (projectId: string, confirmedTopicText: string) => {
    updateProject(projectId, (project) => ({
      ...project,
      stage: 'plan',
      topicExplore: { ...project.topicExplore, confirmedTopic: confirmedTopicText },
      planStage: {
        plan: buildResearchPlan({
          ...project,
          topicExplore: { ...project.topicExplore, confirmedTopic: confirmedTopicText },
        }),
        confirmed: false,
      },
    }));
  };

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    if (projects.length >= 35) return;
    const needed = 35 - projects.length;
    const now = Date.now();
    const stageCycle: ProjectStage[] = [
      'fullTimeSourceSelect',
      'fullDomainSourceSelect',
      'insightSearchReport',
      'topicExplore',
      'plan',
      'persona',
      'interviewOutline',
      'interviewExecution',
      'materialUpload',
      'report',
    ];
    const seeded = Array.from({ length: needed }, (_, idx) => {
      const base = createEmptyProject(`历史模拟项目 ${idx + 1}`);
      const t = now - (idx + 1) * 1000 * 60 * 47;
      const stage = stageCycle[idx % stageCycle.length];
      const isPublished = stage === 'report' || idx % 3 === 0;
      const normalizedStage: ProjectStage = isPublished ? 'report' : stage;
      const topic = `历史模拟项目 ${idx + 1}：主题验证`;
      const topicProject: ResearchProject = {
        ...base,
        topicExplore: { ...base.topicExplore, confirmedTopic: topic },
      };
      const plan = buildResearchPlan(topicProject);
      const personasBuilt = buildPersonaCandidates(topicProject, {});
      const selectedPersonaIds = personasBuilt.personas.slice(0, 5).map((persona) => persona.id);
      const withPersonaProject: ResearchProject = {
        ...topicProject,
        planStage: { plan, confirmed: true },
        personaStage: {
          ...topicProject.personaStage,
          personas: personasBuilt.personas,
          selectedPersonaIds,
          matchedFromCdp: personasBuilt.matchedFromCdp,
          supplementedFromSocial: personasBuilt.supplementedFromSocial,
          confirmed: true,
        },
      };
      const outlineQuestions = buildDefaultOutlineQuestions(withPersonaProject);
      const outline = serializeInterviewOutline(withPersonaProject, outlineQuestions);
      const transcripts = Object.fromEntries(
        personasBuilt.personas
          .slice(0, 5)
          .map((persona) => [persona.id, buildInterviewTranscript(persona, topic, outline)] as const),
      );
      const seededProject: ResearchProject = {
        ...base,
        stage: normalizedStage,
        topicExplore: {
          ...base.topicExplore,
          confirmedTopic: ['fullTimeSourceSelect', 'fullDomainSourceSelect', 'insightSearchReport'].includes(stage) ? '' : topic,
          suggestions: stage === 'topicExplore' ? buildTopicSuggestions(topicProject) : base.topicExplore.suggestions,
        },
        insightSearchReportStage: {
          report: ['topicExplore', 'plan', 'persona', 'interviewOutline', 'interviewExecution', 'materialUpload', 'report'].includes(stage)
            ? buildInsightSearchReport(topicProject)
            : '',
          autoGenerated: ['topicExplore', 'plan', 'persona', 'interviewOutline', 'interviewExecution', 'materialUpload', 'report'].includes(stage),
          generatedAt: ['topicExplore', 'plan', 'persona', 'interviewOutline', 'interviewExecution', 'materialUpload', 'report'].includes(stage)
            ? t
            : undefined,
        },
        planStage: {
          plan: ['fullTimeSourceSelect', 'fullDomainSourceSelect', 'insightSearchReport', 'topicExplore'].includes(stage) ? null : plan,
          confirmed: ['persona', 'interviewOutline', 'interviewExecution', 'materialUpload', 'report'].includes(stage),
        },
        personaStage: {
          ...base.personaStage,
          personas: ['interviewOutline', 'interviewExecution', 'materialUpload', 'report'].includes(stage)
            ? personasBuilt.personas
            : [],
          selectedPersonaIds: ['interviewOutline', 'interviewExecution', 'materialUpload', 'report'].includes(stage)
            ? selectedPersonaIds
            : [],
          matchedFromCdp: ['interviewOutline', 'interviewExecution', 'materialUpload', 'report'].includes(stage)
            ? personasBuilt.matchedFromCdp
            : 0,
          supplementedFromSocial: ['interviewOutline', 'interviewExecution', 'materialUpload', 'report'].includes(stage)
            ? personasBuilt.supplementedFromSocial
            : 0,
          confirmed: ['interviewOutline', 'interviewExecution', 'materialUpload', 'report'].includes(stage),
        },
        interviewOutlineStage: {
          questions: ['interviewExecution', 'materialUpload', 'report'].includes(stage) ? outlineQuestions : [],
          outline: ['interviewExecution', 'materialUpload', 'report'].includes(stage) ? outline : '',
          confirmed: ['interviewExecution', 'materialUpload', 'report'].includes(stage),
        },
        interviewExecutionStage: {
          transcripts: ['materialUpload', 'report'].includes(stage) ? transcripts : {},
          selectedPersonaId: ['materialUpload', 'report'].includes(stage) ? selectedPersonaIds[0] ?? null : null,
        },
        reportStage: {
          report: '',
          generatedAt: undefined,
        },
      };
      if (normalizedStage === 'report') {
        seededProject.reportStage = {
          report: buildFinalReport(seededProject),
          generatedAt: t,
        };
      }
      return {
        ...seededProject,
        id: `mock-history-${t}-${idx}`,
        title: `历史模拟项目 ${idx + 1}`,
        summary: `这是用于分页与阶段回溯验证的模拟项目（第 ${idx + 1} 条），当前停留在「${projectStageLabel(normalizedStage)}」。`,
        archived: isPublished,
        createdAt: t - 1000 * 60 * 25,
        updatedAt: t,
      };
    });
    persistProjects((current) => [...current, ...seeded]);
  }, [projects.length]);

  useEffect(() => {
    const projectId = activeProject?.id ?? null;
    const messageCount = activeProject?.prePersonaMessages.length ?? 0;
    const shouldAutoScroll =
      projectId !== lastAutoScrollProjectIdRef.current ||
      messageCount > lastAutoScrollMessageCountRef.current;

    if (shouldAutoScroll) {
      const el = chatScrollRef.current;
      const isProjectSwitched = projectId !== lastAutoScrollProjectIdRef.current;
      if (!el || isProjectSwitched || isNearChatBottom(el)) {
        scrollChatToBottom('smooth');
      }
    }

    lastAutoScrollProjectIdRef.current = projectId;
    lastAutoScrollMessageCountRef.current = messageCount;
  }, [activeProject?.id, activeProject?.prePersonaMessages.length]);

  useLayoutEffect(() => {
    if (!activeProject) return;
    const sameProject = lastStageProjectIdRef.current === activeProject.id;
    const prevStage = lastStageRef.current;
    const stageChanged = sameProject && prevStage !== activeProject.stage;
    const prevStageIdx = prevStage ? STAGE_FLOW_ORDER.indexOf(prevStage) : -1;
    const currentStageIdx = STAGE_FLOW_ORDER.indexOf(activeProject.stage);
    const shouldStickToBottomOnForwardStage =
      stageChanged &&
      prevStageIdx >= 0 &&
      currentStageIdx > prevStageIdx;

    if (shouldStickToBottomOnForwardStage) {
      scrollChatToBottom('auto');
    }

    lastStageProjectIdRef.current = activeProject.id;
    lastStageRef.current = activeProject.stage;
  }, [activeProject?.id, activeProject?.stage]);

  useEffect(() => {
    if (!activeProject) return;
    if (activeProject.stage === 'topicExplore' && activeProject.topicExplore.suggestions.length === 0) {
      const t0 = Date.now();
      const kick = topicKickoffMessage(activeProject);
      const kickMsg: ChatMessage = { id: `topic-kickoff-${t0}`, role: 'assistant', text: kick, createdAt: t0 };
      const suggMsg: ChatMessage = {
        id: `topic-sugg-${t0}`,
        role: 'assistant',
        variant: 'topic_suggestions',
        text: '以下候选可与底部输入配合使用：点选后将确认主题，并在对话流中展示下一步卡片，可在卡片中生成调研计划。',
        createdAt: t0 + 1,
      };
      updateProject(activeProject.id, (project) => ({
        ...project,
        topicExplore: {
          ...project.topicExplore,
          summary: `${buildIntentSummary(project)}\n\n${buildSourceSummary(project)}`,
          suggestions: buildTopicSuggestions(project),
          messages: [kickMsg],
        },
        prePersonaMessages: [...project.prePersonaMessages, kickMsg, suggMsg],
      }));
    }
    if (
      activeProject.stage === 'topicExplore' &&
      activeProject.topicExplore.suggestions.length > 0 &&
      !activeProject.prePersonaMessages.some((m) => m.variant === 'topic_suggestions')
    ) {
      const t = Date.now();
      updateProject(activeProject.id, (project) => ({
        ...project,
        prePersonaMessages: [
          ...project.prePersonaMessages,
          {
            id: `topic-sugg-mig-${t}`,
            role: 'assistant',
            variant: 'topic_suggestions',
            text: '以下候选可与底部输入配合使用：点选后将确认主题，并在对话流中展示下一步卡片，可在卡片中生成调研计划。',
            createdAt: t,
          },
        ],
      }));
    }
    if (activeProject.stage === 'fullTimeSourceSelect') {
      const hasForm = activeProject.prePersonaMessages.some((m) => m.variant === 'fulltime_form');
      if (!hasForm) {
        const t = Date.now();
        updateProject(activeProject.id, (project) => ({
          ...project,
          prePersonaMessages: [
            ...project.prePersonaMessages,
            {
              id: `ft-form-mig-${t}`,
              role: 'assistant',
              variant: 'fulltime_form',
              text: '请选择全时洞察信息范围（可多选知识库），并设置是否开启垂媒检索。',
              createdAt: t,
            },
          ],
        }));
      }
    }
    if (activeProject.stage === 'fullDomainSourceSelect') {
      const hasForm = activeProject.prePersonaMessages.some((m) => m.variant === 'domain_form');
      if (!hasForm) {
        const t = Date.now();
        updateProject(activeProject.id, (project) => ({
          ...project,
          prePersonaMessages: [
            ...project.prePersonaMessages,
            {
              id: `fd-form-mig-${t}`,
              role: 'assistant',
              variant: 'domain_form',
              text: '请选择全域洞察来源与时间范围。',
              createdAt: t,
            },
          ],
        }));
      }
    }
    if (activeProject.stage === 'insightSearchReport' && !activeProject.insightSearchReportStage.report.trim()) {
      const t = Date.now();
      updateProject(activeProject.id, (project) => ({
        ...project,
        insightSearchReportStage: {
          report: buildInsightSearchReport(project),
          autoGenerated: true,
          generatedAt: t,
        },
        prePersonaMessages: [
          ...project.prePersonaMessages,
          {
            id: `insight-report-auto-${t}`,
            role: 'assistant',
            variant: 'insight_search_report_card',
            text: '洞察范围已确认，已自动生成洞察搜索报告。请先确认报告，再进入正式研究主题。',
            createdAt: t,
          },
        ],
      }));
    }
    if (activeProject.stage === 'plan' && !activeProject.planStage.plan) {
      updateProject(activeProject.id, (project) => ({
        ...project,
        planStage: { plan: buildResearchPlan(project), confirmed: false },
        prePersonaMessages: [
          ...project.prePersonaMessages,
          {
            id: `plan-ready-${Date.now()}`,
            role: 'assistant',
            text: '已根据当前主题与洞察范围生成调研计划草案，请在右侧查看。可点击「重新生成」或确认后进入人群筛选。',
            createdAt: Date.now(),
          },
        ],
      }));
    }
    if (activeProject.stage === 'persona' && activeProject.personaStage.personas.length === 0) {
      const built = buildPersonaCandidates(activeProject, {});
      updateProject(activeProject.id, (project) => ({
        ...project,
        personaStage: {
          ...project.personaStage,
          personas: built.personas,
          matchedFromCdp: built.matchedFromCdp,
          supplementedFromSocial: built.supplementedFromSocial,
          selectedPersonaIds: built.personas.map((persona) => persona.id),
          detailPersonaId: null,
          confirmed: false,
        },
        prePersonaMessages: [
          ...project.prePersonaMessages,
          {
            id: `persona-enter-${Date.now()}`,
            role: 'assistant',
            text: `进入人群筛选。已根据研究主题匹配到${built.personas.length}位人设。下方可调整 CDP 标签并重新生成候选人设。`,
            createdAt: Date.now(),
          },
        ],
      }));
    }
    if (
      activeProject.stage === 'interviewOutline' &&
      activeProject.interviewOutlineStage.questions.length === 0 &&
      !activeProject.interviewOutlineStage.outline.trim()
    ) {
      const qs = buildDefaultOutlineQuestions(activeProject);
      const t = Date.now();
      updateProject(activeProject.id, (project) => ({
        ...project,
        interviewOutlineStage: outlineStageFromQuestions(project, qs, { confirmed: false }),
        prePersonaMessages: [
          ...project.prePersonaMessages,
          {
            id: `outline-enter-${t}`,
            role: 'assistant',
            text: '已进入访谈设计。右侧为访谈问题列表，可通过「添加问题」维护大纲；支持拖拽排序、编辑与删除。',
            createdAt: t,
          },
          {
            id: `outline-guide-${t + 1}`,
            role: 'assistant',
            text: '问题列表与左侧前序摘要相互独立；确认列表无误后，点击下方按钮进入访谈执行。',
            createdAt: t + 1,
          },
        ],
      }));
    }
    if (
      activeProject.stage === 'interviewExecution' &&
      !activeProject.prePersonaMessages.some((m) => m.variant === 'interview_content_ready')
    ) {
      updateProject(activeProject.id, (project) => {
        const topic = project.topicExplore.confirmedTopic || project.initialPrompt || project.title;
        const outline = project.interviewOutlineStage.outline;
        const selected = project.personaStage.personas.filter((persona) =>
          project.personaStage.selectedPersonaIds.includes(persona.id),
        );
        const personasForTranscripts = selected.length > 0 ? selected : project.personaStage.personas;
        const transcripts: Record<string, string> = {};
        for (const persona of personasForTranscripts) {
          transcripts[persona.id] = buildInterviewTranscript(persona, topic, outline);
        }
        const t = Date.now();
        const firstId = personasForTranscripts[0]?.id ?? null;
        return {
          ...project,
          interviewExecutionStage: {
            transcripts,
            selectedPersonaId: project.interviewExecutionStage.selectedPersonaId ?? firstId,
          },
          prePersonaMessages: [
            ...project.prePersonaMessages,
            {
              id: `interview-exec-enter-${t}`,
              role: 'assistant',
              text: '已进入访谈执行。系统已基于确认的访谈大纲与入选人设生成各人设的模拟访谈正文；点击下方状态卡片可在右侧查看与切换。',
              createdAt: t,
            },
            {
              id: `interview-content-ready-${t}`,
              role: 'assistant',
              variant: 'interview_content_ready',
              text: '访谈内容已生成',
              createdAt: t + 1,
            },
          ],
        };
      });
    }
    if (activeProject.stage === 'report' && !activeProject.reportStage.report) {
      updateProject(activeProject.id, (project) => ({
        ...project,
        reportStage: { report: buildFinalReport(project), generatedAt: Date.now() },
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProject?.id, activeProject?.stage]);

  useEffect(() => {
    setCompletedThinkingIds(new Set());
    setReviewTimelineIdx(null);
  }, [activeProjectId]);

  useEffect(() => {
    if (!activeProject) return;
    if (activeProject.stage === 'insightSearchReport') setRightPanelSection('insightSearchReport');
    else if (activeProject.stage === 'plan') setRightPanelSection('plan');
    else if (activeProject.stage === 'persona') setRightPanelSection('persona');
    else if (activeProject.stage === 'interviewOutline') setRightPanelSection('outline');
    else if (activeProject.stage === 'interviewExecution') setRightPanelSection('interview');
    else if (activeProject.stage === 'report') setRightPanelSection('report');
  }, [activeProject?.id, activeProject?.stage]);

  const createProject = () => {
    const prompt = newPrompt.trim();
    if (!prompt) {
      window.alert('请先输入你希望系统帮助研究的问题或背景。');
      return;
    }
    const nextProject = createEmptyProject(prompt);
    nextProject.summary = prompt.length > 80 ? `${prompt.slice(0, 80)}...` : prompt;
    persistProjects((currentProjects) => [nextProject, ...currentProjects]);
    setActiveProjectId(nextProject.id);
    setHomeView('insight');
    setNewPrompt('');
  };

  const createPresetProject = (preset: VolvoPresetCase) => {
    const seedPrompt = `${preset.title}｜${preset.objective}｜目标客户：${preset.audience}`;
    const base = createEmptyProject(seedPrompt);
    const now = Date.now();
    const questions = defaultIntentQuestions(seedPrompt);
    const answers: Record<string, string[]> = {
      [questions[0]?.id ?? 'intent-goal']: [preset.dimension === '新品测试' ? '验证某个产品/营销假设' : preset.dimension === '竞品分析' ? '评估人群差异与优先级' : '寻找新增机会点'],
      [questions[1]?.id ?? 'intent-audience']: ['潜在购车用户'],
      [questions[2]?.id ?? 'intent-output']: ['沉淀最终洞察与报告'],
    };

    const topicProject: ResearchProject = {
      ...base,
      id: `${base.id}-${preset.id}`,
      title: preset.title,
      summary: `${preset.dimension}｜${preset.objective}`,
      stage: 'report',
      initialPrompt: seedPrompt,
      intentClarify: {
        ...base.intentClarify,
        questions,
        answers,
        summary: `${preset.dimension}方向：${preset.objective}`,
        completed: true,
      },
      fullTimeSource: {
        mode: 'custom',
        knowledgeScopes: {
          insightReport: true,
          vehicleKnowledge: true,
          industryKnowledge: true,
        },
        onlineSearch: true,
        completed: true,
      },
      fullDomainSource: {
        mode: 'custom',
        source: 'firstPlusThirdParty',
        timeRange: 'year',
        completed: true,
      },
      topicExplore: {
        summary: `${preset.scenario}\n目标客户：${preset.audience}`,
        suggestions: buildTopicSuggestions(base),
        messages: [],
        confirmedTopic: preset.title,
      },
      materialUploadStage: {
        files: [],
        skipped: true,
      },
      archived: false,
      createdAt: now,
      updatedAt: now,
    };

    const plan = buildResearchPlan(topicProject);
    const personaBuilt = buildPersonaCandidates(topicProject, { '研究维度': [preset.dimension] }, ['first', 'deep_interview']);
    const selectedPersonaIds = personaBuilt.personas.slice(0, 8).map((persona) => persona.id);
    const withPersona: ResearchProject = {
      ...topicProject,
      planStage: { plan, confirmed: true },
      personaStage: {
        ...topicProject.personaStage,
        personas: personaBuilt.personas,
        selectedPersonaIds,
        matchedFromCdp: personaBuilt.matchedFromCdp,
        supplementedFromSocial: personaBuilt.supplementedFromSocial,
        confirmed: true,
      },
    };
    const outlineQs = buildDefaultOutlineQuestions(withPersona);
    const outline = serializeInterviewOutline(withPersona, outlineQs);
    const transcripts = Object.fromEntries(
      withPersona.personaStage.personas
        .slice(0, 6)
        .map((persona) => [persona.id, buildInterviewTranscript(persona, preset.title, outline)] as const),
    );
    const completedProject: ResearchProject = {
      ...withPersona,
      interviewOutlineStage: { questions: outlineQs, outline, confirmed: true },
      interviewExecutionStage: {
        transcripts,
        selectedPersonaId: selectedPersonaIds[0] ?? null,
      },
      prePersonaMessages: [
        { id: `preset-u-${now}`, role: 'user', text: seedPrompt, createdAt: now },
        {
          id: `preset-a-${now + 1}`,
          role: 'assistant',
          variant: 'thinking',
          text: `已加载沃尔沃${preset.dimension}完整案例。\n- 场景：${preset.scenario}\n- 目标客户：${preset.audience}\n- 已自动构建：调研计划、人设筛选、访谈大纲、访谈执行与研究报告`,
          createdAt: now + 1,
        },
      ],
    };
    completedProject.reportStage = {
      report: buildFinalReport(completedProject),
      generatedAt: now + 2,
    };

    persistProjects((currentProjects) => [completedProject, ...currentProjects]);
    setActiveProjectId(completedProject.id);
    setHomeView('insight');
    setNewPrompt('');
  };

  const exitProject = () => {
    setActiveProjectId(null);
    setTopicChatInput('');
    setOutlineQuestionModalOpen(false);
    setOutlineQuestionEditing(null);
  };

  const openHistoryProject = (projectId: string) => {
    const targetProject = projects.find((project) => project.id === projectId);
    if (!targetProject) return;
    if (targetProject.archived) {
      updateProject(projectId, (project) => {
        const nextProject = project.stage === 'report' ? project : { ...project, stage: 'report' };
        if (nextProject.reportStage.report) return nextProject;
        return {
          ...nextProject,
          reportStage: {
            report: buildFinalReport(nextProject),
            generatedAt: Date.now(),
          },
        };
      });
    }
    setActiveProjectId(projectId);
    setTopicChatInput('');
    setOutlineQuestionModalOpen(false);
    setOutlineQuestionEditing(null);
  };

  const toggleArchiveProject = (projectId: string) => {
    updateProject(projectId, (project) => ({ ...project, archived: !project.archived }));
  };

  const shareProject = (project: ResearchProject) => {
    const payload = `${project.title}\n${project.summary}\n${formatProjectTime(project.updatedAt)}`;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard
        .writeText(payload)
        .then(() => window.alert('项目摘要已复制，可直接分享。'))
        .catch(() => window.alert('复制失败，请手动分享。'));
      return;
    }
    window.alert(`请手动分享以下内容：\n${payload}`);
  };

  const currentIntentQuestion = activeProject
    ? activeProject.intentClarify.questions.find(
        (question) => questionAnswer(question, activeProject.intentClarify.answers).length === 0,
      )
    : undefined;

  const selectedPersona = activeProject
    ? activeProject.personaStage.personas.find((persona) => persona.id === activeProject.personaStage.detailPersonaId)
    : undefined;

  const lastFulltimeFormMsgId = useMemo(
    () => (activeProject ? lastVariantId(activeProject.prePersonaMessages, 'fulltime_form') : undefined),
    [activeProject?.prePersonaMessages],
  );
  const lastDomainFormMsgId = useMemo(
    () => (activeProject ? lastVariantId(activeProject.prePersonaMessages, 'domain_form') : undefined),
    [activeProject?.prePersonaMessages],
  );
  const lastTopicSuggestionsMsgId = useMemo(
    () => (activeProject ? lastVariantId(activeProject.prePersonaMessages, 'topic_suggestions') : undefined),
    [activeProject?.prePersonaMessages],
  );
  const lastCtaProceedId = useMemo(
    () => (activeProject ? lastVariantId(activeProject.prePersonaMessages, 'cta_proceed_fulltime') : undefined),
    [activeProject?.prePersonaMessages],
  );
  const firstAssistantMessageId = useMemo(
    () => activeProject?.prePersonaMessages.find((message) => message.role === 'assistant')?.id,
    [activeProject?.prePersonaMessages],
  );
  const isReviewMode = reviewTimelineIdx !== null;

  const timelineAnchors = useMemo(() => {
    if (!activeProject) return [] as Array<string | null>;
    const messages = activeProject.prePersonaMessages;
    const findByText = (prefix: string) => messages.find((message) => message.text.startsWith(prefix))?.id ?? null;
    const planAnchor =
      messages.find((message) => message.variant === 'topic_confirmed_plan_card')?.id ??
      messages.find((message) => message.text.includes('调研计划草案'))?.id ??
      null;
    const reportAnchor = messages[messages.length - 1]?.id ?? null;
    return [
      messages.find((message) => message.role === 'assistant')?.id ?? null,
      planAnchor,
      findByText('进入人群筛选') ?? findByText('已进入人群筛选'),
      findByText('已进入访谈设计'),
      findByText('已进入访谈执行'),
      reportAnchor,
    ];
  }, [activeProject]);

  const sendTopicMessage = () => {
    if (!activeProject) return;
    const userText = topicChatInput.trim();
    if (!userText) return;
    const t = Date.now();
    const userMsg: ChatMessage = { id: `user-${t}`, role: 'user', text: userText, createdAt: t };

    if (activeProject.stage === 'interviewExecution') {
      const asstMsg: ChatMessage = {
        id: `assistant-${t + 1}`,
        role: 'assistant',
        text: `已记录你的补充：「${userText}」。当前各人设访谈内容为执行阶段快照；如需结构性调整，请返回「访谈设计」修订大纲后再次进入访谈执行。`,
        createdAt: t + 1,
      };
      updateProject(activeProject.id, (project) => ({
        ...project,
        prePersonaMessages: [...project.prePersonaMessages, userMsg, asstMsg],
      }));
      setTopicChatInput('');
      return;
    }

    const asstMsg: ChatMessage = {
      id: `assistant-${t + 1}`,
      role: 'assistant',
      text: buildTopicReply(activeProject, userText),
      createdAt: t + 1,
    };
    updateProject(activeProject.id, (project) => ({
      ...(() => {
        const refinedTopic = buildRefinedTopic(project, userText);
        const planCardMsg: ChatMessage | null =
          project.stage === 'topicExplore'
            ? {
                id: `topic-plan-card-${t + 2}`,
                role: 'assistant',
                variant: 'topic_confirmed_plan_card',
                text: refinedTopic,
                createdAt: t + 2,
              }
            : null;
        const nextProject = {
          ...project,
          topicExplore: {
            ...project.topicExplore,
            confirmedTopic: refinedTopic,
            suggestions: [`${userText} 的决策动因与阻碍`, `${userText} 在关键人群中的差异`, `${userText} 的优先验证路径`],
            messages: [...project.topicExplore.messages, userMsg, asstMsg],
          },
          prePersonaMessages: [...project.prePersonaMessages, userMsg, asstMsg, ...(planCardMsg ? [planCardMsg] : [])],
        };
        if (project.stage === 'plan') {
          return {
            ...nextProject,
            planStage: {
              plan: buildResearchPlan({ ...nextProject, topicExplore: { ...nextProject.topicExplore, confirmedTopic: refinedTopic } }),
              confirmed: false,
            },
          };
        }
        if (project.stage === 'interviewOutline') {
          const outlineProject = { ...nextProject, topicExplore: { ...nextProject.topicExplore, confirmedTopic: refinedTopic } };
          const qs = buildDefaultOutlineQuestions(outlineProject);
          return {
            ...outlineProject,
            interviewOutlineStage: outlineStageFromQuestions(outlineProject, qs, { confirmed: false }),
          };
        }
        return nextProject;
      })(),
    }));
    setTopicChatInput('');
  };

  const onUploadMaterials = (files: File[]) => {
    if (!activeProject) return;
    if (files.length === 0) return;
    const maxBytes = 3 * 1024 * 1024;
    const validExt = ['.pdf', '.doc', '.docx'];
    const validFiles = files.filter((file) => {
      const lower = file.name.toLowerCase();
      const hasValidExt = validExt.some((ext) => lower.endsWith(ext));
      return file.size <= maxBytes && hasValidExt;
    });
    if (validFiles.length === 0) return;
    const uploaded: UploadedMaterial[] = validFiles.map((file) => ({
      id: `file-${Date.now()}-${file.name}`,
      name: file.name,
      sizeLabel: formatBytes(file.size),
      uploadedAt: Date.now(),
    }));
    updateProject(activeProject.id, (project) => ({
      ...project,
      materialUploadStage: {
        ...project.materialUploadStage,
        files: [...project.materialUploadStage.files, ...uploaded],
        skipped: false,
      },
      prePersonaMessages: [
        ...project.prePersonaMessages,
        {
          id: `upload-note-${Date.now()}`,
          role: 'assistant',
          text: `已上传 ${uploaded.length} 份线下资料，可继续补充或直接生成报告。`,
          createdAt: Date.now(),
        },
      ],
    }));
    window.requestAnimationFrame(() => {
      scrollChatToBottom('smooth');
    });
  };

  const onTimelineDotClick = (idx: number) => {
    if (!activeProject) return;
    const currentTimelineIdx = stageToTimelineIndex(activeProject.stage);
    if (idx >= currentTimelineIdx) return;
    const anchorId = timelineAnchors[idx];
    if (!anchorId) return;
    window.setTimeout(() => {
      messageRefs.current[anchorId]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 30);
  };

  const onIntentOptionSelect = (question: ChoiceQuestion, option: string) => {
    if (!activeProject) return;
    const projectId = activeProject.id;
    const now = Date.now();
    const userMsg: ChatMessage = { id: `ans-${question.id}-${now}`, role: 'user', text: option, createdAt: now };

    updateProject(projectId, (project) => ({
      ...project,
      intentClarify: {
        ...project.intentClarify,
        answers: { ...project.intentClarify.answers, [question.id]: [option] },
      },
      prePersonaMessages: [...project.prePersonaMessages, userMsg],
    }));

    window.setTimeout(() => {
      updateProject(projectId, (project) => {
        const qs = project.intentClarify.questions;
        const qIdx = qs.findIndex((q) => q.id === question.id);
        const nextQ = qs[qIdx + 1];
        const t = Date.now();
        const thinkingMsg: ChatMessage = {
          id: `think-${t}`,
          role: 'assistant',
          variant: 'thinking',
          text: intentFollowupThinking(option),
          createdAt: t,
        };
        const followUp: ChatMessage[] = nextQ
          ? [
              {
                id: `ask-${nextQ.id}-${t + 1}`,
                role: 'assistant',
                variant: 'intent_options',
                intentQuestionId: nextQ.id,
                text: nextQ.title,
                createdAt: t + 1,
              },
            ]
          : [
              {
                id: `cta-${t + 1}`,
                role: 'assistant',
                variant: 'cta_proceed_fulltime',
                text: `${buildIntentSummary(project)}`,
                createdAt: t + 1,
              },
            ];
        return {
          ...project,
          prePersonaMessages: [...project.prePersonaMessages, thinkingMsg, ...followUp],
        };
      });
    }, 450);
  };

  if (!activeProject) {
    return (
      <div className="h-full overflow-y-auto p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          {homeView === 'insight' ? (
            <>
              <div className="flex items-start justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setHomeView('history')}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-black hover:bg-primary/90"
                >
                  <History size={16} />
                  历史项目
                </button>
              </div>
              <div className="mx-auto mt-[50px] flex w-full max-w-3xl flex-col items-center space-y-8">
                <h1 className="text-center text-5xl font-extrabold text-white">开始您的研究</h1>
                <div className="mt-5 w-full rounded-2xl border border-white/10 bg-surface/70 p-6">
                  <textarea
                    value={newPrompt}
                    onChange={(event) => setNewPrompt(event.target.value)}
                    rows={6}
                    className="w-full resize-none rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-primary"
                    placeholder="输入你想研究的主题，我们会帮你澄清意图并进行方案设计..."
                  />
                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={createProject}
                      className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-black hover:bg-primary/90"
                    >
                      <Plus size={16} />
                      新建研究
                    </button>
                  </div>
                </div>
                <div className="w-full space-y-3">
                  <div>
                    <h2 className="text-base font-bold text-white">从这些场景快速开始</h2>
                  </div>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {VOLVO_PRESET_CASES.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => createPresetProject(preset)}
                        className="rounded-2xl border border-white/10 bg-surface p-5 text-left transition-colors hover:bg-surface-hover"
                      >
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold text-primary">{preset.dimension}</p>
                          <h3 className="mt-1 line-clamp-2 text-base font-bold text-white">{preset.title}</h3>
                        </div>
                        <p className="mt-2 line-clamp-2 text-xs text-gray-400">{preset.objective}</p>
                        <p className="mt-1 line-clamp-1 text-[11px] text-gray-500">目标客户：{preset.audience}</p>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {preset.deliverables.slice(0, 3).map((item) => (
                            <span key={`${preset.id}-${item}`} className="rounded-full bg-white/5 px-2 py-1 text-[10px] text-gray-300">
                              {item}
                            </span>
                          ))}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-extrabold text-white">项目记录</h1>
                </div>
                <button
                  type="button"
                  onClick={() => setHomeView('insight')}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-black hover:bg-primary/90"
                >
                  新建研究
                </button>
              </div>
              <div className="mx-auto flex w-full max-w-4xl items-center gap-3">
                <div className="relative flex-1">
                  <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={historyKeyword}
                    onChange={(event) => setHistoryKeyword(event.target.value)}
                    placeholder="搜索研究主题"
                    className="w-full rounded-lg border border-white/20 bg-black/15 py-2.5 pl-11 pr-4 text-sm text-white outline-none focus:border-primary"
                  />
                </div>
                <button
                  type="button"
                  className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-black hover:bg-white/90"
                >
                  搜索
                </button>
                <select
                  value={historyArchiveFilter}
                  onChange={(event) => setHistoryArchiveFilter(event.target.value as HistoryStatusFilter)}
                  className="rounded-lg border border-white/40 bg-surface px-3 py-2.5 text-sm font-semibold text-white outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
                >
                  <option value="all" className="bg-surface text-white">全部状态</option>
                  <option value="unpublished" className="bg-surface text-white">未发布</option>
                  <option value="published" className="bg-surface text-white">已发布</option>
                  {TIMELINE_STAGES.map((stage) => (
                    <option key={stage} value={stage} className="bg-surface text-white">
                      {stage}
                    </option>
                  ))}
                </select>
                <select
                  value={historySortOrder}
                  onChange={(event) => setHistorySortOrder(event.target.value as 'desc' | 'asc')}
                  className="rounded-lg border border-white/40 bg-surface px-3 py-2.5 text-sm font-semibold text-white outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
                >
                  <option value="desc" className="bg-surface text-white">按时间排序：最新优先</option>
                  <option value="asc" className="bg-surface text-white">按时间排序：最早优先</option>
                </select>
              </div>
              {filteredHistoryProjects.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-surface p-10 text-center text-sm text-gray-500">
                  未匹配到项目，请调整关键词或时间范围。
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {pagedHistoryProjects.map((project) => (
                    <button
                      key={project.id}
                      type="button"
                      onClick={() => openHistoryProject(project.id)}
                      className="rounded-2xl border border-white/10 bg-surface p-5 text-left transition-colors hover:bg-surface-hover"
                    >
                      {(() => {
                        const statusLabel = getHistoryStatusLabel(project);
                        return (
                          <>
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <h3 className="truncate text-lg font-bold text-white">{project.title}</h3>
                          <p className="mt-1 text-xs text-gray-500">{formatHistoryTimestamp(project.updatedAt)}</p>
                          <p className="mt-2 line-clamp-3 text-sm text-gray-300">
                            {project.intentClarify.summary || project.planStage.plan?.summary || project.summary}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              toggleArchiveProject(project.id);
                            }}
                            className="rounded-md border border-white/15 p-1.5 text-gray-300 hover:bg-white/10"
                            title={project.archived ? '取消发布' : '发布'}
                          >
                            {project.archived ? <ArchiveRestore size={14} /> : <Archive size={14} />}
                          </button>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              shareProject(project);
                            }}
                            className="rounded-md border border-white/15 p-1.5 text-gray-300 hover:bg-white/10"
                            title="分享"
                          >
                            <Share2 size={14} />
                          </button>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center justify-end">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] ${getHistoryStatusClass(statusLabel)}`}
                        >
                          {statusLabel}
                        </span>
                      </div>
                          </>
                        );
                      })()}
                    </button>
                  ))}
                </div>
              )}
              {filteredHistoryProjects.length > HISTORY_PAGE_SIZE && (
                <div className="flex items-center justify-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setHistoryPage((prev) => Math.max(1, prev - 1))}
                    disabled={historyPage === 1}
                    className="rounded-lg border border-white/15 px-3 py-1.5 text-sm text-gray-200 enabled:hover:bg-white/5 disabled:opacity-40"
                  >
                    上一页
                  </button>
                  <span className="text-sm text-gray-300">
                    第 {historyPage} / {totalHistoryPages} 页
                  </span>
                  <button
                    type="button"
                    onClick={() => setHistoryPage((prev) => Math.min(totalHistoryPages, prev + 1))}
                    disabled={historyPage === totalHistoryPages}
                    className="rounded-lg border border-white/15 px-3 py-1.5 text-sm text-gray-200 enabled:hover:bg-white/5 disabled:opacity-40"
                  >
                    下一页
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  function fullTimeLabelsFrom(project: ResearchProject) {
    return project.fullTimeSource.mode === 'skip'
      ? ['完全不选']
      : [
          project.fullTimeSource.knowledgeScopes.insightReport ? '洞察报告库' : '',
          project.fullTimeSource.knowledgeScopes.industryKnowledge ? '行业知识库' : '',
        ].filter(Boolean);
  }

  const fullTimeSelected = fullTimeLabelsFrom(activeProject);

  const domainSourceLabel =
    activeProject.fullDomainSource.mode === 'skip'
      ? '完全不选'
      : activeProject.fullDomainSource.source === 'firstParty'
        ? '一方'
        : '一方+三方';

  function renderPlanRightColumn(p: ResearchProject) {
    if (!p.planStage.plan) return null;
    const planText = [
      `${p.topicExplore.confirmedTopic || p.title} 调研计划`,
      '',
      p.planStage.plan.summary,
      '',
      '研究目标',
      ...p.planStage.plan.objectives.map((x) => `- ${x}`),
      '',
      '研究方法',
      ...p.planStage.plan.methods.map((x) => `- ${x}`),
      '',
      '样本规则',
      ...p.planStage.plan.sampleRules.map((x) => `- ${x}`),
      '',
      '预期产出',
      ...p.planStage.plan.outputs.map((x) => `- ${x}`),
    ].join('\n');
    return (
      <div className="chat-scroll-area h-full overflow-y-auto rounded-xl border border-white/10 bg-white p-5 text-black shadow-lg">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h4 className="text-lg font-extrabold">{p.topicExplore.confirmedTopic || p.title} 调研计划</h4>
          <span className="inline-flex h-[37px] w-[37px]" />
        </div>
        <p className="mt-2 text-xs text-zinc-600">{p.planStage.plan.summary}</p>
        <div className="mt-4 grid gap-4 text-xs">
          <section>
            <p className="mb-1 font-bold">研究目标</p>
            <ul className="space-y-1 text-zinc-700">
              {p.planStage.plan.objectives.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
          <section>
            <p className="mb-1 font-bold">研究方法</p>
            <ul className="space-y-1 text-zinc-700">
              {p.planStage.plan.methods.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
          <section>
            <p className="mb-1 font-bold">样本规则</p>
            <ul className="space-y-1 text-zinc-700">
              {p.planStage.plan.sampleRules.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
          <section>
            <p className="mb-1 font-bold">预期产出</p>
            <ul className="space-y-1 text-zinc-700">
              {p.planStage.plan.outputs.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    );
  }

  function renderInsightSearchReportRightColumn(p: ResearchProject) {
    if (!p.insightSearchReportStage.report.trim()) return null;
    const reportText = p.insightSearchReportStage.report;
    return (
      <div className="chat-scroll-area h-full overflow-y-auto rounded-xl border border-white/10 bg-white p-5 text-black shadow-lg">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h4 className="text-lg font-extrabold">洞察搜索报告</h4>
          <span className="inline-flex h-[37px] w-[37px]" />
        </div>
        <p className="text-xs text-zinc-500">生成时间：{formatProjectTime(p.insightSearchReportStage.generatedAt ?? Date.now())}</p>
        <div className="mt-5 whitespace-pre-wrap text-sm leading-7 text-zinc-800">{reportText}</div>
      </div>
    );
  }

  function renderRightFilterBar() {
    const hasInsightSearchReport = Boolean(activeProject?.insightSearchReportStage.report.trim());
    const hasPlan = Boolean(activeProject?.planStage.plan);
    if (!hasInsightSearchReport && !hasPlan) return null;
    const canOpenReport = activeProject.stage === 'report' && rightPanelSection === 'report' && activeProject.reportStage.report.trim();
    const canDownloadInsightSearchReport =
      rightPanelSection === 'insightSearchReport' && Boolean(activeProject?.insightSearchReportStage.report.trim());
    const canDownloadPlan = rightPanelSection === 'plan' && Boolean(activeProject?.planStage.plan);
    const canDownloadOutline = rightPanelSection === 'outline' && Boolean(activeProject?.interviewOutlineStage.outline.trim());
    return (
      <div className="mb-3 flex items-center justify-between gap-3">
        <select
          value={rightPanelSection}
          onChange={(event) => setRightPanelSection(event.target.value as RightPanelSection)}
          disabled={isReviewMode}
          className="rounded-lg border border-white/20 bg-surface px-3 py-2 text-sm text-white outline-none focus:border-primary disabled:opacity-50"
        >
          {hasInsightSearchReport ? (
            <option value="insightSearchReport" className="bg-surface text-white">洞察搜索报告</option>
          ) : null}
          <option value="plan" className="bg-surface text-white">调研方案</option>
          <option value="persona" className="bg-surface text-white">人设信息</option>
          <option value="outline" className="bg-surface text-white">访谈大纲</option>
          <option value="interview" className="bg-surface text-white">访谈内容</option>
          <option value="report" className="bg-surface text-white">报告</option>
        </select>
        {(canDownloadInsightSearchReport || canDownloadPlan || canDownloadOutline || canOpenReport) ? (
          <div className="flex items-center gap-2">
            {canDownloadInsightSearchReport ? (
              <button
                type="button"
                onClick={() =>
                  downloadTextFile(
                    `${activeProject.title}-洞察搜索报告.txt`,
                    activeProject.insightSearchReportStage.report,
                  )
                }
                className="inline-flex h-[37px] w-[37px] items-center justify-center rounded-lg border border-white/20 bg-surface text-white hover:bg-white/10"
                title="下载洞察搜索报告"
                aria-label="下载洞察搜索报告"
              >
                <Download size={14} />
              </button>
            ) : null}
            {canDownloadPlan ? (
              <button
                type="button"
                onClick={() => {
                  const p = activeProject.planStage.plan;
                  if (!p) return;
                  const planText = [
                    `${activeProject.topicExplore.confirmedTopic || activeProject.title} 调研计划`,
                    '',
                    p.summary,
                    '',
                    '研究目标',
                    ...p.objectives.map((x) => `- ${x}`),
                    '',
                    '研究方法',
                    ...p.methods.map((x) => `- ${x}`),
                    '',
                    '样本规则',
                    ...p.sampleRules.map((x) => `- ${x}`),
                    '',
                    '预期产出',
                    ...p.outputs.map((x) => `- ${x}`),
                  ].join('\n');
                  downloadTextFile(`${activeProject.topicExplore.confirmedTopic || activeProject.title}-调研计划.txt`, planText);
                }}
                className="inline-flex h-[37px] w-[37px] items-center justify-center rounded-lg border border-white/20 bg-surface text-white hover:bg-white/10"
                title="下载调研方案"
                aria-label="下载调研方案"
              >
                <Download size={14} />
              </button>
            ) : null}
            {canDownloadOutline ? (
              <button
                type="button"
                onClick={() =>
                  downloadTextFile(
                    `${activeProject.topicExplore.confirmedTopic || activeProject.title}-访谈大纲.txt`,
                    activeProject.interviewOutlineStage.outline,
                  )
                }
                className="inline-flex h-[37px] w-[37px] items-center justify-center rounded-lg border border-white/20 bg-surface text-white hover:bg-white/10"
                title="下载大纲文本"
                aria-label="下载大纲文本"
              >
                <Download size={14} />
              </button>
            ) : null}
            {canOpenReport ? (
              <>
                <button
                  type="button"
                  onClick={() => openReportPreview(activeProject)}
                  className="inline-flex h-[37px] w-[37px] items-center justify-center rounded-lg border border-white/20 bg-surface text-white hover:bg-white/10"
                  title="查看报告"
                  aria-label="查看报告"
                >
                  <Eye size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => shareProject(activeProject)}
                  className="inline-flex h-[37px] w-[37px] items-center justify-center rounded-lg border border-white/20 bg-surface text-white hover:bg-white/10"
                  title="分享"
                  aria-label="分享"
                >
                  <Share2 size={14} />
                </button>
              </>
            ) : null}
          </div>
        ) : null}
      </div>
    );
  }

  function renderRightPanelEmpty(text: string) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center rounded-xl border border-white/10 bg-surface/40 p-6 text-center text-sm text-gray-400">
        {text}
      </div>
    );
  }

  function openReportPreview(project: ResearchProject) {
    const report = project.reportStage.report;
    if (!report.trim()) return;
    const safeTitle = `${project.topicExplore.confirmedTopic || project.title} 研究报告`;
    const reportHtml = report
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br/>');
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!doctype html><html><head><meta charset="utf-8"/><title>${safeTitle}</title><style>body{margin:0;background:#f5f5f5;font-family:Arial,sans-serif;} .page{max-width:960px;margin:24px auto;background:#fff;padding:36px 42px;line-height:1.75;color:#18181b;box-shadow:0 8px 40px rgba(0,0,0,.08);} h1{margin:0 0 16px;font-size:28px;}</style></head><body><div class="page"><h1>${safeTitle}</h1><div>${reportHtml}</div></div></body></html>`);
    win.document.close();
    win.focus();
  }

  function renderCrossStagePanel() {
    if (!activeProject) return null;
    const hasAnyOutput =
      Boolean(activeProject.insightSearchReportStage.report.trim()) ||
      Boolean(activeProject.planStage.plan) ||
      activeProject.personaStage.personas.length > 0 ||
      activeProject.interviewOutlineStage.questions.length > 0 ||
      Boolean(activeProject.interviewOutlineStage.outline.trim()) ||
      Object.keys(activeProject.interviewExecutionStage.transcripts).length > 0 ||
      Boolean(activeProject.reportStage.report.trim());
    if (!hasAnyOutput) {
      return renderRightPanelEmpty('研究产出将在此展示');
    }
    if (rightPanelSection === 'insightSearchReport') {
      return activeProject.insightSearchReportStage.report.trim()
        ? renderInsightSearchReportRightColumn(activeProject)
        : renderRightPanelEmpty('洞察搜索报告尚未生成。');
    }
    if (rightPanelSection === 'plan') {
      return activeProject.planStage.plan ? renderPlanRightColumn(activeProject) : renderRightPanelEmpty('调研方案尚未生成。');
    }
    if (rightPanelSection === 'persona') {
      const list = activeProject.personaStage.personas;
      if (list.length === 0) return renderRightPanelEmpty('人设信息尚未生成。');
      return (
        <div className="chat-scroll-area min-h-0 flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            {list.map((persona) => (
              <button
                key={persona.id}
                type="button"
                onClick={() =>
                  updateProject(activeProject.id, (project) => ({
                    ...project,
                    personaStage: { ...project.personaStage, detailPersonaId: persona.id },
                  }))
                }
                className="rounded-xl border border-white/10 bg-surface p-3 text-left hover:bg-white/5"
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-bold text-white">{persona.cardTitle}</h4>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-bold ${provenanceBadgeClass[persona.provenance]}`}>
                    {provenanceLabel[persona.provenance]}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {persona.tags.slice(0, 2).map((tag, tagIdx) => (
                    <span key={`${persona.id}-${tag}-${tagIdx}`} className="rounded px-2 py-1 bg-surface-hover text-xs text-gray-300">
                      {tag}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>
      );
    }
    if (rightPanelSection === 'outline') {
      const qs = activeProject.interviewOutlineStage.questions;
      const outlineText = activeProject.interviewOutlineStage.outline;
      if (qs.length === 0 && !outlineText.trim()) return renderRightPanelEmpty('访谈大纲尚未生成。');
      return (
        <div className="chat-scroll-area flex min-h-0 min-w-0 flex-1 flex-col gap-3 overflow-hidden">
          <InterviewOutlineQuestionList
            questions={qs.length > 0 ? qs : []}
            onReorder={(next) => persistOutlineQuestions(activeProject.id, next)}
            onEdit={(id) => {
              const q = qs.find((x) => x.id === id);
              if (q) {
                setOutlineQuestionEditing(q);
                setOutlineQuestionModalOpen(true);
              }
            }}
            onDelete={(id) => persistOutlineQuestions(activeProject.id, qs.filter((q) => q.id !== id))}
            onAdd={() => {
              setOutlineQuestionEditing(null);
              setOutlineQuestionModalOpen(true);
            }}
          />
        </div>
      );
    }
    if (rightPanelSection === 'interview') {
      const transcripts = activeProject.interviewExecutionStage.transcripts;
      const ids = Object.keys(transcripts);
      if (ids.length === 0) return renderRightPanelEmpty('访谈内容尚未生成。');
      const selectedByPersona = activeProject.personaStage.selectedPersonaIds.filter((id) => ids.includes(id));
      const orderedIds = selectedByPersona.length > 0 ? selectedByPersona : ids;
      const currentId = activeProject.interviewExecutionStage.selectedPersonaId ?? orderedIds[0];
      const body = transcripts[currentId] ?? transcripts[orderedIds[0]] ?? '';
      return (
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
          <div className="chat-scroll-area min-h-0 flex-1 overflow-y-auto rounded-2xl border border-white/10 bg-white p-6 text-black shadow-2xl">
            <div className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-800">{body}</div>
          </div>
          <div className="shrink-0 rounded-xl border border-white/10 bg-surface/60 p-3">
            <div className="mb-2 text-xs font-semibold text-gray-300">人设切换</div>
            <div className="flex max-h-[120px] flex-wrap gap-2 overflow-y-auto">
              {orderedIds.map((personaId) => {
                const persona = activeProject.personaStage.personas.find((p) => p.id === personaId);
                const label = persona ? persona.cardTitle : personaId;
                const isActive = currentId === personaId;
                return (
                  <button
                    key={personaId}
                    type="button"
                    onClick={() =>
                      updateProject(activeProject.id, (project) => ({
                        ...project,
                        interviewExecutionStage: {
                          ...project.interviewExecutionStage,
                          selectedPersonaId: personaId,
                        },
                      }))
                    }
                    className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                      isActive
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-white/20 bg-surface text-gray-200 hover:bg-white/10'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      );
    }
    if (!activeProject.reportStage.report.trim()) return renderRightPanelEmpty('报告尚未生成。');
    return (
      <div className="chat-scroll-area min-h-0 flex-1 overflow-y-auto rounded-2xl border border-white/10 bg-white p-8 text-black shadow-2xl">
        <h4 className="text-3xl font-black">{activeProject.topicExplore.confirmedTopic || activeProject.title} 研究报告</h4>
        <p className="mt-2 text-sm text-zinc-500">生成时间：{formatProjectTime(activeProject.reportStage.generatedAt ?? Date.now())}</p>
        <div className="mt-6 whitespace-pre-wrap text-sm leading-7 text-zinc-800">{activeProject.reportStage.report}</div>
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={() => openReportPreview(activeProject)}
            className="rounded-lg border border-primary/40 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10"
          >
            查看报告
          </button>
        </div>
      </div>
    );
  }

  function renderMaterialComposerBar() {
    if (!activeProject) return null;
    const hasUploadedFiles = activeProject.materialUploadStage.files.length > 0;
    return (
      <div className="rounded-xl border border-primary/30 bg-surface/90 p-3">
        <p className="text-sm font-semibold text-white">上传线下访谈资料（PDF / Word）</p>
        <p className="mt-1 text-xs text-gray-400">支持多文件，单个不超过 3MB；也可直接跳过并生成报告。</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-black hover:bg-primary/90"
          >
            选择文件
          </button>
          <button
            type="button"
            onClick={() =>
              updateProject(activeProject.id, (project) => ({
                ...project,
                stage: 'report',
                materialUploadStage: { ...project.materialUploadStage, skipped: true },
              }))
            }
            className="rounded-lg border border-white/20 px-3 py-1.5 text-xs text-gray-200 hover:bg-white/5"
          >
            {hasUploadedFiles ? '生成最终报告' : '跳过并生成报告'}
          </button>
        </div>
      </div>
    );
  }

  function renderInStreamStageCta() {
    if (!activeProject || isReviewMode) return null;
    const cardClass = 'w-full max-w-lg rounded-2xl border border-primary/45 bg-primary/10 px-4 py-3 shadow-[0_0_0_1px_rgba(27,255,27,0.12)]';
    const buttonClass = 'w-full rounded-lg bg-primary py-2.5 text-sm font-bold text-black hover:bg-primary/90';

    if (activeProject.stage === 'plan') {
      return (
        <AssistantAvatarRow>
          <div className={cardClass}>
            <button
              type="button"
              onClick={() =>
                updateProject(activeProject.id, (project) => ({
                  ...project,
                  stage: 'persona',
                  planStage: { ...project.planStage, confirmed: true },
                }))
              }
              className={buttonClass}
            >
              确认研究计划并进入人群筛选
            </button>
          </div>
        </AssistantAvatarRow>
      );
    }

    if (activeProject.stage === 'insightSearchReport') {
      return (
        <AssistantAvatarRow>
          <div className={cardClass}>
            <button
              type="button"
              onClick={continueToTopicAfterInsightReport}
              className={buttonClass}
            >
              确认洞察搜索报告并进入正式研究主题
            </button>
          </div>
        </AssistantAvatarRow>
      );
    }

    if (activeProject.stage === 'persona') {
      return (
        <AssistantAvatarRow>
          <div className={cardClass}>
            <button
              type="button"
              onClick={() =>
                updateProject(activeProject.id, (project) => ({
                  ...project,
                  stage: 'interviewOutline',
                  personaStage: { ...project.personaStage, confirmed: true },
                }))
              }
              className={buttonClass}
            >
              确认这 {activeProject.personaStage.personas.length} 个人设并生成访谈大纲
            </button>
          </div>
        </AssistantAvatarRow>
      );
    }

    if (activeProject.stage === 'interviewOutline') {
      return (
        <AssistantAvatarRow>
          <div className={cardClass}>
            <button
              type="button"
              onClick={() => {
                if (activeProject.interviewOutlineStage.questions.length === 0) {
                  window.alert('请至少添加一个访谈问题后再进入访谈执行。');
                  return;
                }
                updateProject(activeProject.id, (project) => ({
                  ...project,
                  stage: 'interviewExecution',
                  interviewOutlineStage: {
                    ...project.interviewOutlineStage,
                    confirmed: true,
                  },
                }));
              }}
              className={buttonClass}
            >
              确认访谈大纲并进入访谈执行
            </button>
          </div>
        </AssistantAvatarRow>
      );
    }

    if (activeProject.stage === 'interviewExecution') {
      return (
        <AssistantAvatarRow>
          <div className={cardClass}>
            <button
              type="button"
              onClick={() =>
                updateProject(activeProject.id, (project) => ({
                  ...project,
                  stage: 'materialUpload',
                }))
              }
              className={buttonClass}
            >
              继续补充资料并生成报告
            </button>
          </div>
        </AssistantAvatarRow>
      );
    }

    return null;
  }

  function renderTopicComposerBar() {
    if (isReviewMode) return null;
    if (!activeProject) return null;
    if (activeProject.stage === 'interviewOutline') {
      return (
        <div className="rounded-xl border border-primary/40 bg-surface/90 p-4 text-sm leading-relaxed text-gray-400 shadow-[0_0_0_1px_rgba(27,255,27,0.12)]">
          访谈大纲请在右侧面板通过「问题列表」编辑：使用「添加问题」、拖拽排序、编辑与删除。确认无误后点击对话区上方按钮进入访谈执行。
        </div>
      );
    }
    return (
      <div className="rounded-xl border border-primary/40 bg-surface/90 p-3 shadow-[0_0_0_1px_rgba(27,255,27,0.12)]">
        <textarea
          value={topicChatInput}
          onChange={(event) => setTopicChatInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              sendTopicMessage();
            }
          }}
          rows={3}
          className="w-full resize-none bg-transparent text-sm text-white outline-none"
          placeholder={
            activeProject.stage === 'report'
              ? '继续输入你的需求...'
              : activeProject.stage === 'interviewExecution'
                ? '记录执行备注或现场补充（不自动改写已生成的访谈正文）…'
                : '继续输入你的想法（如目标人群、关键场景、待验证假设），我会据此收敛正式研究主题…'
          }
        />
        <div className="flex justify-end">
          <button
            type="button"
            onClick={sendTopicMessage}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-black hover:bg-primary/90"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    );
  }

  function proceedToFullTime() {
    const t = Date.now();
    updateProject(activeProject.id, (project) => ({
      ...project,
      stage: 'fullTimeSourceSelect',
      intentClarify: {
        ...project.intentClarify,
        summary: buildIntentSummary(project),
        completed: true,
      },
      prePersonaMessages: [
        ...project.prePersonaMessages,
        {
          id: `trans-ft-${t}`,
          role: 'assistant',
          variant: 'thinking',
          text: transitionThinking('全时洞察范围'),
          createdAt: t,
        },
        {
          id: `ft-form-${t + 1}`,
          role: 'assistant',
          variant: 'fulltime_form',
          text: '请选择全时洞察信息范围（可多选知识库），并设置是否开启垂媒检索。',
          createdAt: t + 1,
        },
      ],
    }));
  }

  function continueToDomainFromFullTime() {
    const t = Date.now();
    const labels = fullTimeLabelsFrom(activeProject);
    const summaryUser = `全时洞察：${labels.join('、') || '未选'}；垂媒检索：${
      activeProject.fullTimeSource.onlineSearch ? '开启' : '关闭'
    }`;
    updateProject(activeProject.id, (project) => ({
      ...project,
      stage: 'fullDomainSourceSelect',
      fullTimeSource: { ...project.fullTimeSource, completed: true },
      prePersonaMessages: [
        ...project.prePersonaMessages,
        { id: `ft-u-${t}`, role: 'user', text: summaryUser, createdAt: t },
        {
          id: `trans-fd-${t + 1}`,
          role: 'assistant',
          variant: 'thinking',
          text: transitionThinking('全域洞察范围'),
          createdAt: t + 1,
        },
        {
          id: `fd-form-${t + 2}`,
          role: 'assistant',
          variant: 'domain_form',
          text: '请选择全域洞察来源与时间范围。',
          createdAt: t + 2,
        },
      ],
    }));
  }

  function continueToTopicFromDomain() {
    const t = Date.now();
    const u = `全域：${domainSourceLabel}；时间：${timeRangeLabel(activeProject.fullDomainSource.timeRange)}`;
    const shouldSkipInsightSearchReport =
      activeProject.fullTimeSource.mode === 'skip' && activeProject.fullDomainSource.mode === 'skip';
    const insightSearchReport = buildInsightSearchReport(activeProject);
    updateProject(activeProject.id, (project) => ({
      ...project,
      stage: shouldSkipInsightSearchReport ? 'topicExplore' : 'insightSearchReport',
      fullDomainSource: { ...project.fullDomainSource, completed: true },
      insightSearchReportStage: shouldSkipInsightSearchReport
        ? project.insightSearchReportStage
        : {
            report: insightSearchReport,
            autoGenerated: true,
            generatedAt: t + 1,
          },
      prePersonaMessages: [
        ...project.prePersonaMessages,
        { id: `fd-u-${t}`, role: 'user', text: u, createdAt: t },
        {
          id: `fd-a-${t + 1}`,
          role: 'assistant',
          variant: shouldSkipInsightSearchReport ? undefined : 'insight_search_report_card',
          text: shouldSkipInsightSearchReport
            ? '洞察范围已确认（全时与全域均完全不选），已跳过洞察搜索报告。接下来在下方输入框与我对话，并在对话流中选择或收敛正式研究主题。'
            : '洞察范围已确认，已自动生成洞察搜索报告。请先确认报告，再进入正式研究主题。',
          createdAt: t + 1,
        },
      ],
    }));
  }

  function continueToTopicAfterInsightReport() {
    const t = Date.now();
    updateProject(activeProject.id, (project) => ({
      ...project,
      stage: 'topicExplore',
      prePersonaMessages: [
        ...project.prePersonaMessages,
        {
          id: `insight-report-next-${t}`,
          role: 'assistant',
          text: '洞察搜索报告已确认。接下来在下方输入框与我对话，并在对话流中选择或收敛正式研究主题。',
          createdAt: t,
        },
      ],
    }));
  }

  function renderPrePersonaStreamMessage(message: ChatMessage, index: number) {
    const p = activeProject;
    const showIdentity = message.role === 'assistant' && message.id === firstAssistantMessageId;
    const prevMessage = index > 0 ? p.prePersonaMessages[index - 1] : undefined;
    const shouldWaitForPrevThinking =
      prevMessage?.variant === 'thinking' && !completedThinkingIds.has(prevMessage.id);
    const renderIntentQuestionContent = (q: ChoiceQuestion, questionText: string) => {
      const answered = questionAnswer(q, p.intentClarify.answers);
      const isActive = p.stage === 'intentClarify' && answered.length === 0 && currentIntentQuestion?.id === q.id;
      return (
        <div className="mt-3 space-y-3 animate-fade-in">
          <StreamText
            text={questionText || q.title}
            className="text-sm text-gray-200"
            cadenceMs={12}
            chunkDivisor={16}
          />
          <SelectionQuestion
            title=""
            hideTitle
            description=""
            options={q.options}
            selected={answered}
            readOnly={!isActive}
            onChange={(next) => {
              if (next[0]) onIntentOptionSelect(q, next[0]);
            }}
          />
        </div>
      );
    };

    if (message.role === 'user') {
      return null;
    }

    if (isReviewMode && message.variant && message.variant !== 'thinking') {
      return (
        <AssistantAvatarRow showIdentity={showIdentity}>
          <StreamText text={message.text} pre className="whitespace-pre-wrap font-sans text-[12.5px] leading-[1.55] text-gray-300" />
        </AssistantAvatarRow>
      );
    }

    if (message.variant === 'thinking') {
      const nextMessage = p.prePersonaMessages[index + 1];
      const nextQuestion =
        nextMessage?.variant === 'intent_options' && nextMessage.intentQuestionId
          ? p.intentClarify.questions.find((x) => x.id === nextMessage.intentQuestionId)
          : undefined;
      const showNextQuestion = Boolean(nextQuestion) && completedThinkingIds.has(message.id);
      return (
        <AssistantAvatarRow showIdentity={showIdentity}>
          <div>
            <ThinkingCard
              text={message.text}
              onComplete={() =>
                setCompletedThinkingIds((prev) => {
                  if (prev.has(message.id)) return prev;
                  const next = new Set(prev);
                  next.add(message.id);
                  return next;
                })
              }
            />
            {showNextQuestion && nextQuestion
              ? renderIntentQuestionContent(nextQuestion, nextMessage?.text ?? nextQuestion.title)
              : null}
          </div>
        </AssistantAvatarRow>
      );
    }

    if (message.variant === 'intent_options' && message.intentQuestionId) {
      // 如果前一条是思考，这个问题会在思考块内平滑显现，避免跳脱感
      if (prevMessage?.variant === 'thinking') return null;
      const q = p.intentClarify.questions.find((x) => x.id === message.intentQuestionId);
      if (!q) {
        return (
          <AssistantAvatarRow showIdentity={showIdentity}>
            <AssistantTextCard text={message.text} />
          </AssistantAvatarRow>
        );
      }
      return (
        <AssistantAvatarRow showIdentity={showIdentity}>
          <div className="space-y-3">{renderIntentQuestionContent(q, message.text || q.title)}</div>
        </AssistantAvatarRow>
      );
    }

    if (message.variant === 'cta_proceed_fulltime') {
      if (shouldWaitForPrevThinking) return null;
      const isActive = p.stage === 'intentClarify' && message.id === lastCtaProceedId;
      return (
        <AssistantAvatarRow showIdentity={showIdentity}>
          <div className="space-y-3">
            {isActive && (
              <button
                type="button"
                onClick={proceedToFullTime}
                className="inline-flex min-w-[220px] justify-center rounded-lg bg-primary px-4 py-3 text-sm font-bold text-black hover:bg-primary/90"
              >
                进入全时洞察范围选择
              </button>
            )}
          </div>
        </AssistantAvatarRow>
      );
    }

    if (message.variant === 'fulltime_form') {
      if (shouldWaitForPrevThinking) return null;
      const isActive = p.stage === 'fullTimeSourceSelect' && message.id === lastFulltimeFormMsgId;
      const sel = fullTimeSelected;
      return (
        <AssistantAvatarRow showIdentity={showIdentity}>
          <div
            className={`rounded-2xl border border-white/10 bg-surface-hover px-4 py-3 space-y-4 ${
              isActive ? '' : 'pointer-events-none opacity-70'
            }`}
          >
            <StreamText text={message.text} className="text-sm text-gray-200" />
            <>
                <div className="space-y-2">
                  <p className="text-xs text-gray-400">知识库范围（可多选；选「完全不选」则跳过）</p>
                  <div className="grid grid-cols-2 gap-2">
                    {['洞察报告库', '行业知识库', '完全不选'].map((option) => {
                      const isSelected = sel.includes(option);
                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => {
                            if (!isActive) return;
                            updateProject(p.id, (project) => {
                              const cur = fullTimeLabelsFrom(project);
                              let next: string[];
                              if (option === '完全不选') {
                                next = ['完全不选'];
                              } else {
                                const set = new Set(cur.filter((x) => x !== '完全不选'));
                                if (set.has(option)) set.delete(option);
                                else set.add(option);
                                next = Array.from(set);
                              }
                              const skip = next.includes('完全不选');
                              return {
                                ...project,
                                fullTimeSource: skip
                                  ? {
                                      ...project.fullTimeSource,
                                      mode: 'skip',
                                      knowledgeScopes: {
                                        insightReport: false,
                                        vehicleKnowledge: false,
                                        industryKnowledge: false,
                                      },
                                    }
                                  : {
                                      ...project.fullTimeSource,
                                      mode: 'custom',
                                      knowledgeScopes: {
                                        insightReport: next.includes('洞察报告库'),
                                        vehicleKnowledge: false,
                                        industryKnowledge: next.includes('行业知识库'),
                                      },
                                    },
                              };
                            });
                          }}
                          className={`${optionBaseClass} ${
                            isSelected
                              ? 'selection-active-option border-primary bg-primary/10 text-primary'
                              : 'border-white/10 bg-white/5 text-gray-200'
                          } ${!isActive ? 'cursor-default' : ''}`}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-gray-400">
                    垂媒检索{p.fullTimeSource.mode === 'skip' ? '（跳过全时时可不选）' : ''}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {['开启垂媒检索', '关闭垂媒检索'].map((option) => {
                      const on = p.fullTimeSource.onlineSearch;
                      const isSelected = option === '开启垂媒检索' ? on : !on;
                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() =>
                            isActive &&
                            updateProject(p.id, (project) => ({
                              ...project,
                              fullTimeSource: {
                                ...project.fullTimeSource,
                                onlineSearch: option === '开启垂媒检索',
                              },
                            }))
                          }
                          className={`${optionBaseClass} ${
                            isSelected
                              ? 'selection-active-option border-primary bg-primary/10 text-primary'
                              : 'border-white/10 bg-white/5 text-gray-200'
                          } ${!isActive ? 'cursor-default' : ''}`}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={continueToDomainFromFullTime}
                  disabled={!isActive}
                  className="inline-flex min-w-[240px] justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-black hover:bg-primary/90"
                >
                  进入全域洞察范围选择
                </button>
            </>
          </div>
        </AssistantAvatarRow>
      );
    }

    if (message.variant === 'domain_form') {
      if (shouldWaitForPrevThinking) return null;
      const isActive = p.stage === 'fullDomainSourceSelect' && message.id === lastDomainFormMsgId;
      const curDomain = domainSourceLabel;
      return (
        <AssistantAvatarRow showIdentity={showIdentity}>
          <div
            className={`rounded-2xl border border-white/10 bg-surface-hover px-4 py-3 space-y-4 ${
              isActive ? '' : 'pointer-events-none opacity-70'
            }`}
          >
            <StreamText text={message.text} className="text-sm text-gray-200" />
            <>
                <div className="space-y-2">
                  <p className="text-xs text-gray-400">洞察来源</p>
                  <div className="grid grid-cols-3 gap-2">
                    {(['一方', '一方+三方', '完全不选'] as const).map((option) => {
                      const isSelected = curDomain === option;
                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() =>
                            isActive &&
                            updateProject(p.id, (project) => ({
                              ...project,
                              fullDomainSource:
                                option === '完全不选'
                                  ? { ...project.fullDomainSource, mode: 'skip' }
                                  : {
                                      ...project.fullDomainSource,
                                      mode: 'custom',
                                      source: option === '一方' ? 'firstParty' : 'firstPlusThirdParty',
                                    },
                            }))
                          }
                          className={`${optionBaseClass} text-center ${
                            isSelected
                              ? 'selection-active-option border-primary bg-primary/10 text-primary'
                              : 'border-white/10 bg-white/5 text-gray-200'
                          } ${!isActive ? 'cursor-default' : ''}`}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-gray-400">时间范围</p>
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        ['全部时间', 'all'],
                        ['近一周', 'week'],
                        ['近一月', 'month'],
                        ['近三月', 'quarter'],
                        ['近半年', 'halfYear'],
                        ['近一年', 'year'],
                      ] as const
                    ).map(([label, key]) => {
                      const isSelected = p.fullDomainSource.timeRange === key;
                      return (
                        <button
                          key={label}
                          type="button"
                          onClick={() =>
                            isActive &&
                            updateProject(p.id, (project) => ({
                              ...project,
                              fullDomainSource: { ...project.fullDomainSource, timeRange: key },
                            }))
                          }
                          className={`${optionBaseClass} ${
                            isSelected
                              ? 'selection-active-option border-primary bg-primary/10 text-primary'
                              : 'border-white/10 bg-white/5 text-gray-200'
                          } ${!isActive ? 'cursor-default' : ''}`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="rounded-lg border border-white/10 bg-black/20 p-3 text-xs text-gray-300">
                  <pre className="whitespace-pre-wrap font-sans">{buildSourceSummary(p)}</pre>
                </div>
                <button
                  type="button"
                  onClick={continueToTopicFromDomain}
                  disabled={!isActive}
                  className="inline-flex min-w-[240px] justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-black hover:bg-primary/90"
                >
                  进入正式研究主题
                </button>
            </>
          </div>
        </AssistantAvatarRow>
      );
    }

    if (message.variant === 'interview_content_ready') {
      if (shouldWaitForPrevThinking) return null;
      return (
        <AssistantAvatarRow showIdentity={showIdentity}>
          <button
            type="button"
            onClick={() => interviewContentPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
            className="w-full max-w-md rounded-2xl border border-primary/50 bg-primary/15 px-4 py-3 text-left shadow-[0_0_0_1px_rgba(27,255,27,0.12)] transition-colors hover:bg-primary/25"
          >
            <p className="text-[10px] font-bold uppercase tracking-wide text-primary">研究状态</p>
            <p className="mt-1 text-sm font-bold text-primary">{message.text}</p>
            <p className="mt-1 text-xs text-gray-400">点击查看右侧各人设的具体访谈内容</p>
          </button>
        </AssistantAvatarRow>
      );
    }

    if (message.variant === 'insight_search_report_card') {
      if (shouldWaitForPrevThinking) return null;
      const isActive = p.stage === 'insightSearchReport';
      return (
        <AssistantAvatarRow showIdentity={showIdentity}>
          <div className="w-full max-w-lg rounded-2xl border border-primary/45 bg-primary/10 px-4 py-3 shadow-[0_0_0_1px_rgba(27,255,27,0.12)]">
            <p className="text-sm text-gray-100">{message.text}</p>
            <div className="mt-3 rounded-lg border border-white/10 bg-black/20 p-3 text-xs text-gray-200">
              <pre className="whitespace-pre-wrap font-sans">{p.insightSearchReportStage.report || '报告生成中...'}</pre>
            </div>
            {isActive && (
              <button
                type="button"
                onClick={continueToTopicAfterInsightReport}
                className="mt-3 w-full rounded-lg bg-primary py-2.5 text-sm font-bold text-black hover:bg-primary/90"
              >
                进入正式研究主题
              </button>
            )}
          </div>
        </AssistantAvatarRow>
      );
    }

    if (message.variant === 'topic_confirmed_plan_card') {
      if (shouldWaitForPrevThinking) return null;
      const topicLine = message.text.trim();
      if (!topicLine) return null;
      return (
        <AssistantAvatarRow showIdentity={showIdentity}>
          <div className="w-full max-w-lg rounded-2xl border border-primary/45 bg-primary/10 px-4 py-3 shadow-[0_0_0_1px_rgba(27,255,27,0.12)]">
            <p className="text-sm leading-relaxed text-gray-100">
              当前研究主题已确定为：<span className="font-bold text-primary">{topicLine}</span>
              。接下来可以生成调研计划，或继续在下方说明里微调主题。
            </p>
            <div className="mt-3">
              <button
                type="button"
                onClick={() => goToPlanFromTopic(p.id, topicLine)}
                className="w-full rounded-lg bg-primary py-2.5 text-sm font-bold text-black hover:bg-primary/90"
              >
                生成调研方案
              </button>
            </div>
          </div>
        </AssistantAvatarRow>
      );
    }

    if (message.variant === 'outline_regenerate_card') {
      if (shouldWaitForPrevThinking) return null;
      return (
        <AssistantAvatarRow showIdentity={showIdentity}>
          <AssistantTextCard text={`已记录本轮大纲调整要点：${message.text}。你可以继续补充，我会在右侧同步更新访谈大纲。`} />
        </AssistantAvatarRow>
      );
    }

    if (message.variant === 'topic_suggestions') {
      if (shouldWaitForPrevThinking) return null;
      const isActive = p.stage === 'topicExplore' && message.id === lastTopicSuggestionsMsgId;
      return (
        <AssistantAvatarRow showIdentity={showIdentity}>
          <div className="space-y-3 px-1 py-1">
            <StreamText text={message.text} className="text-sm text-gray-200" />
            {isActive && (
              <>
                <div className="space-y-2">
                  {[
                    '竞品分析',
                    '新品用户调研',
                    ...p.topicExplore.suggestions.slice(0, 2),
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => {
                        const now = Date.now();
                        updateProject(p.id, (project) => ({
                          ...project,
                          topicExplore: { ...project.topicExplore, confirmedTopic: suggestion },
                          planStage:
                            project.stage === 'plan'
                              ? {
                                  plan: buildResearchPlan({
                                    ...project,
                                    topicExplore: { ...project.topicExplore, confirmedTopic: suggestion },
                                  }),
                                  confirmed: false,
                                }
                              : project.planStage,
                          prePersonaMessages: [
                            ...project.prePersonaMessages,
                            {
                              id: `topic-plan-card-${now}`,
                              role: 'assistant',
                              variant: 'topic_confirmed_plan_card',
                              text: suggestion,
                              createdAt: now,
                            },
                          ],
                        }));
                      }}
                      className={`block w-full rounded-lg border px-3 py-2 text-left text-xs transition-colors ${
                        p.topicExplore.confirmedTopic === suggestion
                          ? 'selection-active-option border-primary bg-primary/10 text-primary'
                          : 'border-white/10 bg-white/5 text-gray-200 hover:bg-white/10'
                      }`}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </AssistantAvatarRow>
      );
    }

    const isMilestoneMessage =
      message.text.startsWith('已进入访谈人设筛选') ||
      message.text.startsWith('进入人群筛选') ||
      message.text.startsWith('已进入人群筛选') ||
      message.text.startsWith('已进入访谈设计') ||
      message.text.startsWith('已进入访谈执行');
    return (
      <AssistantAvatarRow showIdentity={showIdentity}>
        {isMilestoneMessage ? (
          <AssistantTextCard text={message.text} />
        ) : (
          <StreamText
            text={message.text}
            pre
            className="whitespace-pre-wrap font-sans text-[12.5px] leading-[1.55] text-gray-300 tracking-[0.01em]"
          />
        )}
      </AssistantAvatarRow>
    );
  }

  return (
    <>
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="border-b border-white/10 px-8 py-4 shrink-0">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={exitProject}
              className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded bg-surface-hover hover:bg-white/10"
            >
              <ArrowLeft size={16} />
            </button>
            <div className="min-w-0">
              <h2 className="text-xl font-extrabold text-white truncate">{activeProject.title}</h2>
            </div>
          </div>
          {(() => {
            const currentTimelineIdx = stageToTimelineIndex(activeProject.stage);
            return (
              <div className="mx-2 flex min-w-0 flex-1 items-center px-1">
                {TIMELINE_STAGES.map((label, idx) => {
                  const isCurrent = idx === currentTimelineIdx;
                  const isDone = idx < currentTimelineIdx;
                  const isFuture = idx > currentTimelineIdx;
                  return (
                    <div key={label} className="flex flex-1 items-center">
                      <button
                        type="button"
                        onClick={() => onTimelineDotClick(idx)}
                        disabled={idx >= currentTimelineIdx}
                        className="flex min-w-[80px] flex-col items-center disabled:cursor-default"
                      >
                        <span
                          className={`mb-1 whitespace-nowrap text-[11px] font-semibold ${
                            isCurrent ? 'text-[var(--status-active-text)]' : isDone ? 'text-gray-200' : 'text-gray-500'
                          }`}
                        >
                          {label}
                        </span>
                        {isDone ? (
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-black shadow-[0_0_0_2px_rgba(27,255,27,0.15)]">
                            <Check size={16} strokeWidth={3} />
                          </div>
                        ) : isCurrent ? (
                          <div className="relative flex h-9 w-9 items-center justify-center rounded-full border border-[var(--status-active-border)] bg-[var(--status-active-bg)] p-[3px]">
                            <span
                              aria-hidden="true"
                              className="timeline-current-ring pointer-events-none absolute -inset-[3px] rounded-full"
                            />
                            <div className="relative flex h-full w-full items-center justify-center rounded-full border border-[var(--status-active-border)] bg-[var(--status-active-bg)] text-sm font-bold text-[var(--status-active-text)]">
                              {idx + 1}
                            </div>
                          </div>
                        ) : (
                          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/5 text-sm font-semibold text-gray-500">
                            {idx + 1}
                          </div>
                        )}
                      </button>
                      {idx < TIMELINE_STAGES.length - 1 && (
                        <div
                          className={`flex-1 ${
                            isDone ? 'h-[2px] bg-primary/80' : 'h-0 border-t border-dashed border-white/20'
                          }`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()}
          <div className="flex shrink-0 items-center gap-2">
            {isReviewMode && (
              <button
                type="button"
                onClick={() => setReviewTimelineIdx(null)}
                className="rounded-lg border border-primary/40 px-3 py-2 text-xs text-primary hover:bg-primary/10"
              >
                返回当前阶段
              </button>
            )}
            <button
              type="button"
              onClick={exitProject}
              className="rounded-lg border border-white/15 px-4 py-2 text-sm text-gray-200 hover:bg-white/5"
            >
              退出并稍后继续
            </button>
          </div>
        </div>
      </div>

      {FULL_WIDTH_CHAT_STAGES.includes(activeProject.stage) ? (
        <div className="flex flex-1 min-h-0">
          <div className="flex min-w-0 basis-1/2 flex-col border-r border-white/10">
            <div
              ref={chatScrollRef}
              className="chat-scroll-area min-h-0 flex-1 overflow-y-auto px-4 py-4 space-y-4"
            >
              {activeProject.prePersonaMessages.map((message, idx) => (
                <div key={message.id} ref={(node) => (messageRefs.current[message.id] = node)}>
                  {renderPrePersonaStreamMessage(message, idx)}
                </div>
              ))}
            </div>
            {activeProject.stage === 'topicExplore' && (
              <div className="shrink-0 border-t border-white/10 p-4">{renderTopicComposerBar()}</div>
            )}
          </div>
          <div className="chat-scroll-area relative min-w-0 basis-1/2 overflow-y-auto rounded-2xl border border-primary p-4 shadow-[0_0_0_1px_rgba(27,255,27,0.4),0_0_24px_rgba(27,255,27,0.15)]">
            {renderRightFilterBar()}
            {renderCrossStagePanel()}
          </div>
        </div>
      ) : activeProject.stage === 'plan' ? (
        <div className="flex flex-1 min-h-0">
          <div className="flex min-w-0 basis-1/2 flex-col border-r border-white/10">
            <div ref={chatScrollRef} className="chat-scroll-area min-h-0 flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {activeProject.prePersonaMessages.map((message, idx) => (
                <div key={message.id} ref={(node) => (messageRefs.current[message.id] = node)}>
                  {renderPrePersonaStreamMessage(message, idx)}
                </div>
              ))}
              {renderInStreamStageCta()}
            </div>
            <div className="shrink-0 border-t border-white/10 p-4">{renderTopicComposerBar()}</div>
          </div>
          <div className="chat-scroll-area min-w-0 basis-1/2 overflow-y-auto rounded-2xl border border-primary p-4 shadow-[0_0_0_1px_rgba(27,255,27,0.4),0_0_24px_rgba(27,255,27,0.15)]">
            {renderRightFilterBar()}
            {rightPanelSection === 'plan' ? (
              <div className="flex h-full min-h-0 flex-col">
              <div className="chat-scroll-area min-h-0 flex-1 overflow-y-auto">{renderPlanRightColumn(activeProject)}</div>
              </div>
            ) : (
              renderCrossStagePanel()
            )}
          </div>
        </div>
      ) : activeProject.stage === 'persona' ? (
        <div className="flex min-h-0 flex-1">
          <div className="flex min-h-0 min-w-0 flex-1 basis-1/2 flex-col border-r border-white/10">
            <div ref={chatScrollRef} className="chat-scroll-area min-h-0 flex-1 overflow-y-auto px-3 py-4 space-y-3">
              {(() => {
                const recentMessages = activeProject.prePersonaMessages.slice(-12);
                const offset = activeProject.prePersonaMessages.length - recentMessages.length;
                return (
                  <>
                    {recentMessages.map((message, idx) => (
                      <div key={message.id} ref={(node) => (messageRefs.current[message.id] = node)}>
                        {renderPrePersonaStreamMessage(message, offset + idx)}
                      </div>
                    ))}
                    <div className={`rounded-2xl border border-white/10 bg-surface/40 p-3 ${isReviewMode ? 'pointer-events-none opacity-60' : ''}`}>
                      <PersonaCdpTagFilterPanel
                        selectedTagValues={personaFilterValues}
                        setSelectedTagValues={setPersonaFilterValues}
                        selectedProvenance={selectedPersonaProvenance}
                        setSelectedProvenance={setSelectedPersonaProvenance}
                        hitCount={activeProject.personaStage.personas.length}
                      />
                      <button
                        type="button"
                        disabled={isReviewMode}
                        onClick={() => {
                          const built = buildPersonaCandidates(activeProject, personaFilterValues, selectedPersonaProvenance);
                          updateProject(activeProject.id, (project) => ({
                            ...project,
                            personaStage: {
                              ...project.personaStage,
                              personas: built.personas,
                              matchedFromCdp: built.matchedFromCdp,
                              supplementedFromSocial: built.supplementedFromSocial,
                              selectedPersonaIds: built.personas.map((persona) => persona.id),
                              detailPersonaId: null,
                              confirmed: false,
                            },
                          }));
                        }}
                        className="mt-3 w-full rounded-lg bg-primary py-2 text-sm font-bold text-black hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        应用并生成新人设
                      </button>
                    </div>
                    {renderInStreamStageCta()}
                  </>
                );
              })()}
            </div>
          </div>
          <div className="flex min-h-0 min-w-0 flex-1 basis-1/2 flex-col overflow-hidden rounded-2xl border border-primary p-4 shadow-[0_0_0_1px_rgba(27,255,27,0.4),0_0_24px_rgba(27,255,27,0.15)]">
            {renderRightFilterBar()}
            {rightPanelSection === 'persona' ? (
            <div className="chat-scroll-area min-h-0 flex-1 overflow-y-auto">
              <p className="mb-3 text-sm text-gray-400">
                {(() => {
                  const list = activeProject.personaStage.personas;
                  const firstN = list.filter((x) => x.provenance === 'first').length;
                  const deepInterviewN = list.filter((x) => x.provenance === 'deep_interview').length;
                  return `共 ${list.length} 个候选人设 · 一方 ${firstN} 位 · 深度访谈 ${deepInterviewN} 位`;
                })()}
              </p>
              {selectedPersona ? (
                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={() =>
                      updateProject(activeProject.id, (project) => ({
                        ...project,
                        personaStage: { ...project.personaStage, detailPersonaId: null },
                      }))
                    }
                    className="text-sm text-gray-400 hover:text-white"
                  >
                    返回人设列表
                  </button>
                  <PersonaDetailView persona={selectedPersona} showContinueChat={false} />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                  {activeProject.personaStage.personas.map((persona) => (
                    <button
                      key={persona.id}
                      type="button"
                      onClick={() =>
                        updateProject(activeProject.id, (project) => ({
                          ...project,
                          personaStage: { ...project.personaStage, detailPersonaId: persona.id },
                        }))
                      }
                      className="bg-surface p-6 rounded-xl group text-left hover:bg-surface-hover transition-colors"
                    >
                      <div className="mb-3 flex items-start justify-between gap-2">
                        <h3 className="min-w-0 flex-1 text-2xl font-bold leading-tight text-white break-words">
                          {getPersonaAlias(persona)}
                        </h3>
                        <div className="flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          disabled={isReviewMode}
                          onClick={(event) => {
                            event.stopPropagation();
                            setSavedPersonaIds((prev) => {
                              const next = new Set(prev);
                              if (next.has(persona.id)) next.delete(persona.id);
                              else next.add(persona.id);
                              return next;
                            });
                          }}
                          className="rounded border border-white/20 p-1 text-gray-300 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                          title={savedPersonaIds.has(persona.id) ? '已加入人设库' : '加入人设库'}
                        >
                          <BookmarkPlus size={12} className={savedPersonaIds.has(persona.id) ? 'text-primary' : ''} />
                        </button>
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[11px] font-bold ${provenanceBadgeClass[persona.provenance]}`}>
                          {provenanceLabel[persona.provenance]}
                        </span>
                        </div>
                      </div>
                      <div className="mb-8 flex flex-wrap gap-2">
                        {persona.tags.slice(0, 2).map((tag, tagIdx) => (
                          <span key={`${persona.id}-${tag}-${tagIdx}`} className={PERSONA_CARD_TAG_CLASS}>
                            {tag}
                          </span>
                        ))}
                      </div>
                      <div>
                        <div className="mb-1 flex justify-between text-xs text-gray-400">
                          <span>七维合计</span>
                          <span className="text-lg font-bold text-white">
                            {getRadarTotal(persona.radar)} <span className="text-xs font-normal text-gray-500">/ {radarChartLabels.length * RADAR_TIER_MAX}</span>
                          </span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-surface-hover">
                          <div
                            className="h-full bg-primary"
                            style={{ width: `${(getRadarTotal(persona.radar) / (radarChartLabels.length * RADAR_TIER_MAX)) * 100}%` }}
                          />
                        </div>
                      </div>
                      <div className="mt-3 min-h-[16px]">
                        {savedPersonaIds.has(persona.id) && <p className="text-[11px] text-primary">已加入人设库</p>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            ) : (
              renderCrossStagePanel()
            )}
          </div>
        </div>
      ) : activeProject.stage === 'interviewOutline' ? (
        <div className="flex min-h-0 flex-1">
          <div className="flex min-h-0 min-w-0 flex-1 basis-1/2 flex-col border-r border-white/10">
            <div ref={chatScrollRef} className="chat-scroll-area min-h-0 flex-1 overflow-y-auto px-3 py-4 space-y-3">
              {activeProject.prePersonaMessages.map((message, idx) => (
                <div key={message.id} ref={(node) => (messageRefs.current[message.id] = node)}>
                  {renderPrePersonaStreamMessage(message, idx)}
                </div>
              ))}
              {renderInStreamStageCta()}
            </div>
            <div className="shrink-0 border-t border-white/10 p-4">{renderTopicComposerBar()}</div>
          </div>
          <div className="flex min-h-0 min-w-0 flex-1 basis-1/2 flex-col overflow-hidden rounded-2xl border border-primary p-4 shadow-[0_0_0_1px_rgba(27,255,27,0.4),0_0_24px_rgba(27,255,27,0.15)]">
            {renderRightFilterBar()}
            {rightPanelSection !== 'outline' ? (
              renderCrossStagePanel()
            ) : (
              <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
                <InterviewOutlineQuestionList
                  questions={activeProject.interviewOutlineStage.questions}
                  onReorder={(next) => persistOutlineQuestions(activeProject.id, next)}
                  onEdit={(id) => {
                    const q = activeProject.interviewOutlineStage.questions.find((x) => x.id === id);
                    if (q) {
                      setOutlineQuestionEditing(q);
                      setOutlineQuestionModalOpen(true);
                    }
                  }}
                  onDelete={(id) =>
                    persistOutlineQuestions(
                      activeProject.id,
                      activeProject.interviewOutlineStage.questions.filter((q) => q.id !== id),
                    )
                  }
                  onAdd={() => {
                    setOutlineQuestionEditing(null);
                    setOutlineQuestionModalOpen(true);
                  }}
                />
              </div>
            )}
          </div>
        </div>
      ) : activeProject.stage === 'interviewExecution' ? (
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <div className="flex min-h-0 min-w-0 flex-1 basis-1/2 flex-col overflow-hidden border-r border-white/10">
            <div ref={chatScrollRef} className="chat-scroll-area min-h-0 flex-1 overflow-y-auto px-3 py-4 space-y-3">
              {activeProject.prePersonaMessages.map((message, idx) => (
                <div key={message.id} ref={(node) => (messageRefs.current[message.id] = node)}>
                  {renderPrePersonaStreamMessage(message, idx)}
                </div>
              ))}
              {renderInStreamStageCta()}
            </div>
            <div className="shrink-0 border-t border-white/10 bg-background p-4">
              {renderTopicComposerBar()}
            </div>
          </div>
          <div
            ref={interviewContentPanelRef}
            className="flex min-h-0 min-w-0 flex-1 basis-1/2 flex-col overflow-hidden rounded-2xl border border-primary p-4 shadow-[0_0_0_1px_rgba(27,255,27,0.4),0_0_24px_rgba(27,255,27,0.15)]"
          >
            {renderRightFilterBar()}
            {rightPanelSection !== 'interview' ? (
              renderCrossStagePanel()
            ) : (
            (() => {
              const tabPersonas = activeProject.personaStage.personas.filter((persona) =>
                activeProject.personaStage.selectedPersonaIds.includes(persona.id),
              );
              const personasForTabs =
                tabPersonas.length > 0 ? tabPersonas : activeProject.personaStage.personas;
              const currentId =
                activeProject.interviewExecutionStage.selectedPersonaId ?? personasForTabs[0]?.id ?? null;
              const body =
                currentId && activeProject.interviewExecutionStage.transcripts[currentId]
                  ? activeProject.interviewExecutionStage.transcripts[currentId]
                  : '访谈内容生成中，请稍候…';
              const currentPersona = currentId ? personasForTabs.find((p) => p.id === currentId) : undefined;
              const previewKey = currentId ?? 'none';
              return (
                <>
                  <div className="chat-scroll-area flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-white/10 bg-white text-black shadow-2xl">
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.div
                        key={previewKey}
                        role="document"
                        aria-label={currentPersona ? `${currentPersona.cardTitle} 访谈记录` : '访谈记录'}
                        initial={{ opacity: 0, x: 28 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -22 }}
                        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                        className="chat-scroll-area min-h-0 flex-1 overflow-y-auto p-6"
                      >
                        <div className="border-b border-zinc-200 pb-3">
                          <div className="flex items-baseline justify-between gap-3">
                            <h4 className="text-xl font-black">访谈</h4>
                            <span className="shrink-0 rounded-md border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-zinc-500">
                              PDF 预览
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-zinc-500">
                            {activeProject.topicExplore.confirmedTopic || activeProject.title}
                          </p>
                          {currentPersona && (
                            <p className="mt-2 text-sm font-semibold text-zinc-800">当前人设 · {currentPersona.cardTitle}</p>
                          )}
                        </div>
                        <div className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-zinc-800">{body}</div>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                  <div className="mt-3 shrink-0 border-t border-white/10 pt-3">
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-gray-500">人设</p>
                    <div className="grid grid-cols-5 gap-2">
                      {personasForTabs.map((persona) => {
                        const isOn = persona.id === currentId;
                        return (
                          <button
                            key={persona.id}
                            type="button"
                            disabled={isReviewMode}
                            onClick={() =>
                              updateProject(activeProject.id, (project) => ({
                                ...project,
                                interviewExecutionStage: {
                                  ...project.interviewExecutionStage,
                                  selectedPersonaId: persona.id,
                                },
                              }))
                            }
                            className={`min-w-0 truncate rounded-lg border px-2 py-1.5 text-center text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                              isOn
                                ? 'border-primary bg-primary/20 text-primary'
                                : 'border-white/15 bg-white/5 text-gray-300 hover:bg-white/10'
                            }`}
                            title={persona.cardTitle}
                          >
                            {persona.cardTitle}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              );
            })()
            )}
          </div>
        </div>
      ) : activeProject.stage === 'materialUpload' || activeProject.stage === 'report' ? (
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            multiple
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={(event) => {
              const files = Array.from(event.target.files ?? []);
              onUploadMaterials(files);
              event.target.value = '';
            }}
          />
          <div className="flex min-h-0 min-w-0 flex-1 basis-1/2 flex-col overflow-hidden border-r border-white/10">
            <div ref={chatScrollRef} className="chat-scroll-area min-h-0 flex-1 overflow-y-auto px-3 py-4 space-y-3">
              {activeProject.prePersonaMessages.map((message, idx) => (
                <div key={message.id} ref={(node) => (messageRefs.current[message.id] = node)}>
                  {renderPrePersonaStreamMessage(message, idx)}
                </div>
              ))}
            </div>
            <div className="shrink-0 border-t border-white/10 bg-background p-4">
              {activeProject.stage === 'materialUpload' ? renderMaterialComposerBar() : renderTopicComposerBar()}
            </div>
          </div>
          <div className="flex min-h-0 min-w-0 flex-1 basis-1/2 flex-col overflow-hidden rounded-2xl border border-primary p-4 shadow-[0_0_0_1px_rgba(27,255,27,0.4),0_0_24px_rgba(27,255,27,0.15)]">
            {renderRightFilterBar()}
            {rightPanelSection !== 'report' ? (
              renderCrossStagePanel()
            ) : (
              <>
                <div className="chat-scroll-area min-h-0 flex-1 overflow-y-auto rounded-2xl border border-white/10 bg-white p-8 text-black shadow-2xl">
                  <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
                    <div className="flex items-center gap-2 text-sm text-zinc-600">
                      <FileText className="h-4 w-4" />
                      PDF 风格预览
                    </div>
                    <span className="inline-flex h-8 w-8" />
                  </div>
                  {activeProject.stage === 'materialUpload' ? (
                    <div className="mt-5 space-y-3">
                      {activeProject.materialUploadStage.files.length === 0 ? (
                        <p className="text-sm text-zinc-500">尚未上传资料。请在左侧上传 PDF/Word 文件，或跳过后直接生成报告。</p>
                      ) : (
                        activeProject.materialUploadStage.files.map((file) => (
                          <div key={file.id} className="rounded-lg border border-zinc-200 p-3">
                            <p className="text-sm font-semibold text-zinc-900">{file.name}</p>
                            <p className="mt-1 text-xs text-zinc-500">{file.sizeLabel} · {formatProjectTime(file.uploadedAt)}</p>
                          </div>
                        ))
                      )}
                    </div>
                  ) : (
                    <>
                      <h4 className="mt-4 text-3xl font-black">{activeProject.topicExplore.confirmedTopic || activeProject.title} 研究报告</h4>
                      <p className="mt-2 text-sm text-zinc-500">生成时间：{formatProjectTime(activeProject.reportStage.generatedAt ?? Date.now())}</p>
                      <div className="mt-6 whitespace-pre-wrap text-sm leading-7 text-zinc-800">{activeProject.reportStage.report}</div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
    <CreateInterviewQuestionModal
      isOpen={outlineQuestionModalOpen}
      onClose={() => {
        setOutlineQuestionModalOpen(false);
        setOutlineQuestionEditing(null);
      }}
      editing={outlineQuestionEditing}
      onSave={handleSaveOutlineQuestion}
    />
    </>
  );
}
