import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ArrowLeft, Bot, Check, ChevronDown, Plus, Send } from 'lucide-react';
import FormalResearch from './FormalResearch';

type ScopeType = 'fullTime' | 'fullDomain' | 'both';
type TrackType = 'fullTime' | 'fullDomain';
type RunStage = 'insightChat' | 'summaryConfirm' | 'formalStart' | 'verifyPlan' | 'persona' | 'report';
type ChatMessage = { id: string; role: 'user' | 'assistant'; text: string };
type FullTimeFilters = {
  knowledgeScopes: { insightReport: boolean; vehicleKnowledge: boolean; industryKnowledge: boolean };
  isOnlineSearch: boolean;
};
type FullDomainFilters = {
  source: 'all' | 'firstParty' | 'firstPlusThirdParty';
  timeRange: 'all' | 'week' | 'month' | 'quarter' | 'halfYear' | 'year';
};
type InsightTrack = {
  messages: ChatMessage[];
  report: string;
  reportUpdatedAt?: number;
};
type InsightTracks = { fullTime: InsightTrack; fullDomain: InsightTrack };
type ConversationRun = {
  id: string;
  title: string;
  updatedAt: number;
  scope: ScopeType;
  fullTimeEnabled?: boolean;
  fullDomainEnabled?: boolean;
  fullTimeFilters?: FullTimeFilters;
  fullDomainFilters?: FullDomainFilters;
  stage: RunStage;
  researchStep: number;
  insightTracks: InsightTracks;
  activeTrack?: TrackType;
  // legacy
  chatMessages?: ChatMessage[];
};

const RUNS_KEY = 'volvo.insight-research.runs';

function defaultTrack(): InsightTrack {
  return { messages: [], report: '' };
}

function normalizeRun(raw: Partial<ConversationRun>): ConversationRun {
  const legacyMessages = Array.isArray(raw.chatMessages) ? raw.chatMessages : [];
  const fullTimeTrack = raw.insightTracks?.fullTime ?? defaultTrack();
  const fullDomainTrack = raw.insightTracks?.fullDomain ?? defaultTrack();
  const migratedFullTime =
    fullTimeTrack.messages.length > 0 || legacyMessages.length === 0
      ? fullTimeTrack
      : { ...fullTimeTrack, messages: legacyMessages };

  return {
    id: raw.id ?? `run-${Date.now()}`,
    title: raw.title ?? '新建对话',
    updatedAt: raw.updatedAt ?? Date.now(),
    scope: raw.scope ?? 'both',
    fullTimeEnabled: raw.fullTimeEnabled ?? true,
    fullDomainEnabled: raw.fullDomainEnabled ?? true,
    fullTimeFilters:
      raw.fullTimeFilters ??
      ({
        knowledgeScopes: { insightReport: true, vehicleKnowledge: true, industryKnowledge: false },
        isOnlineSearch: true,
      } as FullTimeFilters),
    fullDomainFilters:
      raw.fullDomainFilters ??
      ({
        source: 'all',
        timeRange: 'all',
      } as FullDomainFilters),
    stage:
      raw.stage && ['insightChat', 'summaryConfirm', 'formalStart', 'verifyPlan', 'persona', 'report'].includes(raw.stage)
        ? raw.stage
        : 'insightChat',
    researchStep: raw.researchStep ?? 1,
    activeTrack: raw.activeTrack ?? 'fullTime',
    insightTracks: {
      fullTime: migratedFullTime,
      fullDomain: fullDomainTrack,
    },
    chatMessages: undefined,
  };
}

function readRuns(): ConversationRun[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(RUNS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Array<Partial<ConversationRun>>;
    if (!Array.isArray(parsed)) return [];
    return parsed.map((r) => normalizeRun(r));
  } catch {
    return [];
  }
}

function writeRuns(runs: ConversationRun[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(RUNS_KEY, JSON.stringify(runs));
}

function truncateTopic(text: string, max = 16) {
  const t = text.trim();
  if (!t) return '';
  return t.length > max ? `${t.slice(0, max)}...` : t;
}

function getRunScope(run: ConversationRun): ScopeType {
  if (run.fullTimeEnabled && run.fullDomainEnabled) return 'both';
  if (run.fullTimeEnabled) return 'fullTime';
  if (run.fullDomainEnabled) return 'fullDomain';
  return run.scope ?? 'both';
}

function stageLabel(stage: RunStage) {
  if (stage === 'insightChat') return '洞察对话中';
  if (stage === 'summaryConfirm') return '洞察摘要确认';
  if (stage === 'formalStart') return '正式研究主题输入';
  if (stage === 'verifyPlan') return '停留在生成调研方案/访谈大纲';
  if (stage === 'persona') return '停留在选择人设画像';
  return '停留在生成报告';
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function stepToStage(step: number): RunStage {
  if (step <= 1) return 'formalStart';
  if (step <= 2) return 'verifyPlan';
  if (step === 3) return 'persona';
  return 'report';
}

function stageToStep(stage: RunStage): number {
  if (stage === 'formalStart') return 1;
  if (stage === 'verifyPlan') return 2;
  if (stage === 'persona') return 3;
  if (stage === 'report') return 4;
  return 1;
}

function firstUserTopic(run: ConversationRun) {
  const all = [...run.insightTracks.fullTime.messages, ...run.insightTracks.fullDomain.messages];
  const firstUser = all.filter((m) => m.role === 'user').sort((a, b) => a.id.localeCompare(b.id))[0];
  return firstUser?.text ?? '';
}

function runDisplayTitle(run: ConversationRun): string {
  const topic = firstUserTopic(run).trim();
  if (topic) return truncateTopic(topic);
  if (run.title && run.title !== '新建对话') return run.title;
  return '未命名对话';
}

function defaultSuggestions(track: TrackType, q: string): string[] {
  if (track === 'fullTime') {
    return [`请继续深挖“${q}”的时间趋势变化`, `这条结论里哪些是短期波动，哪些是长期信号？`, `请给出后续验证该结论的数据口径`];
  }
  return [`请补充“${q}”在用户分群上的差异`, `哪些人群对这个问题反馈分歧最大？`, `请给出全域视角下的优先研究假设`];
}

function buildAssistantReply(track: TrackType, question: string): string {
  const trackLabel = track === 'fullTime' ? '全时视角' : '全域视角';
  return [
    `围绕“${question}”，从${trackLabel}初步判断，该问题同时存在可放大的机会点与需要规避的风险点，适合进入正式研究进行定量与定性联合核验。`,
    '',
    '洞察结论：当前可观察到用户决策驱动与阻碍因素并存，且不同来源信息在关键判断上具备一定一致性，但强度和优先级仍需进一步验证。',
    '',
    '证据线索：结合历史反馈命中、当前知识范围与跨来源信息对比，主要信号集中在动机差异、场景约束和信息可信度三个维度。',
    '',
    '风险与不确定：样本覆盖面、时间窗口与来源偏差可能导致结论偏移，若不补齐核验，后续方案可能出现执行落差。',
    '',
    '下一步建议：优先针对分歧点设计动态核验问题，先确认高影响假设，再形成可执行调研路径。',
  ].join('\n');
}

function getLatestUserTopic(messages: ChatMessage[]) {
  const latest = [...messages].reverse().find((m) => m.role === 'user')?.text?.trim() ?? '';
  return latest;
}

function toReportTitle(topic: string, mode: 'single' | 'integrated', track: TrackType) {
  const cleanTopic = topic.replace(/\s+/g, ' ').trim();
  if (cleanTopic) {
    const clipped = cleanTopic.length > 20 ? `${cleanTopic.slice(0, 20)}...` : cleanTopic;
    return `${clipped}调研洞察报告`;
  }
  if (mode === 'integrated') return '全时全域综合调研洞察报告';
  return track === 'fullTime' ? '全时调研洞察报告' : '全域调研洞察报告';
}

function buildReportByMode(
  mode: 'single' | 'integrated',
  track: TrackType,
  title: string,
  messages: ChatMessage[],
) {
  const userQs = messages.filter((m) => m.role === 'user').map((m) => m.text).slice(-4);
  const ass = messages.filter((m) => m.role === 'assistant').map((m) => m.text).slice(-4);
  const points = ass.map((a, i) => `关键发现 ${i + 1}：${(a.split('\n').find((x) => x.includes('洞察结论')) ?? a.slice(0, 90)).replace('洞察结论：', '')}`);
  const sourceLine = mode === 'integrated'
    ? '数据来源：全时洞察 + 全域洞察（综合）'
    : `数据来源：${track === 'fullTime' ? '全时洞察' : '全域洞察'}`;

  return [
    `报告名称：${title}`,
    `生成时间：${formatTime(Date.now())}`,
    sourceLine,
    '',
    '最近用户关注问题',
    ...(userQs.length > 0 ? userQs.map((q, i) => `${i + 1}. ${q}`) : ['暂无']),
    '',
    '结构化洞察摘要',
    ...(points.length > 0 ? points : ['暂无，可继续对话后重试']),
    '',
    '建议纳入正式研究的核验方向',
    '1. 明确关键假设的优先级与证据充分性',
    '2. 针对分歧人群补充追问并锁定变量',
    '3. 与另一轨洞察进行交叉验证，形成统一研究输入',
  ].join('\n');
}

function parseReportForPdfView(report: string) {
  const lines = report.split('\n');
  let title = '洞察报告';
  let generatedAt = '';
  const sections: Array<{ heading: string; items: string[] }> = [];
  let current: { heading: string; items: string[] } | null = null;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith('报告名称：')) {
      title = line.replace('报告名称：', '').trim() || title;
      continue;
    }
    if (line.startsWith('生成时间：')) {
      generatedAt = line.replace('生成时间：', '').trim();
      continue;
    }
    if (!line.includes('：') && !/^\d+\./.test(line) && !line.startsWith('关键发现')) {
      current = { heading: line, items: [] };
      sections.push(current);
      continue;
    }
    if (!current) {
      current = { heading: '摘要', items: [] };
      sections.push(current);
    }
    current.items.push(line);
  }

  return { title, generatedAt, sections };
}

function buildFormalContextPrefix(run: ConversationRun): string {
  return [
    '【前置洞察输入】',
    '',
    run.insightTracks.fullTime.report || '全时洞察报告（暂无）',
    '',
    run.insightTracks.fullDomain.report || '全域洞察报告（暂无）',
  ].join('\n');
}

function FeishuPopoverSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <>
      <div className="px-3 pb-1 pt-2">
        <p className="text-[11px] font-medium text-zinc-400">{title}</p>
      </div>
      <div className="px-1 pb-1">{children}</div>
    </>
  );
}

function FeishuSelectRow({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
        selected ? 'bg-blue-50 text-blue-600' : 'text-zinc-800 hover:bg-zinc-100/90'
      }`}
    >
      <span>{label}</span>
      {selected ? <Check className="h-4 w-4 shrink-0 text-blue-600" /> : <span className="h-4 w-4 shrink-0" aria-hidden />}
    </button>
  );
}

function FeishuToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-zinc-800 hover:bg-zinc-100/90"
    >
      <span>{label}</span>
      <span
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${checked ? 'bg-blue-500' : 'bg-zinc-200'}`}
        aria-hidden
      >
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${checked ? 'right-0.5' : 'left-0.5'}`} />
      </span>
    </button>
  );
}

export default function InsightResearch({ isSidebarCollapsed = false }: { isSidebarCollapsed?: boolean }) {
  const [runs, setRuns] = useState<ConversationRun[]>(() => readRuns());
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [openPopover, setOpenPopover] = useState<null | 'fullTime' | 'fullDomain'>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingTrack, setThinkingTrack] = useState<TrackType>('fullTime');
  const [thinkingSteps, setThinkingSteps] = useState<string[]>([]);
  const [selectedReportTrack, setSelectedReportTrack] = useState<TrackType | null>(null);
  const filterBarRef = useRef<HTMLDivElement>(null);

  const activeRun = useMemo(() => runs.find((r) => r.id === activeRunId) ?? null, [runs, activeRunId]);
  const activeTrack: TrackType = activeRun?.activeTrack ?? 'fullTime';
  const activeMessages = activeRun ? activeRun.insightTracks[activeTrack].messages : [];
  const latestAssistantId = useMemo(() => {
    const latest = [...activeMessages].reverse().find((m) => m.role === 'assistant');
    return latest?.id ?? null;
  }, [activeMessages]);
  const suggestions = useMemo(() => {
    const latestUser = [...activeMessages].reverse().find((m) => m.role === 'user')?.text ?? '';
    return latestUser ? defaultSuggestions(activeTrack, latestUser) : [];
  }, [activeMessages, activeTrack]);

  const fullTimeInsightOn = activeRun ? (activeRun.fullTimeEnabled ?? activeRun.scope !== 'fullDomain') : false;
  const fullDomainInsightOn = activeRun ? (activeRun.fullDomainEnabled ?? activeRun.scope !== 'fullTime') : false;
  const fullTimeReady = Boolean(activeRun?.insightTracks.fullTime.report.trim());
  const fullDomainReady = Boolean(activeRun?.insightTracks.fullDomain.report.trim());
  const canShowEnterFormal = fullTimeReady && fullDomainReady;
  const currentAgentName = fullTimeInsightOn && !fullDomainInsightOn ? '专家智能体' : !fullTimeInsightOn && fullDomainInsightOn ? '客户智能体' : '智能体';
  const selectedPdfReport = selectedReportTrack ? activeRun?.insightTracks[selectedReportTrack].report ?? '' : '';
  const pdfViewModel = useMemo(() => parseReportForPdfView(selectedPdfReport), [selectedPdfReport]);

  const insightFilterBtnActive =
    'inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-medium transition-colors border-blue-500/40 bg-white text-zinc-900 shadow-sm';
  const insightFilterBtnInactive =
    'inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-medium transition-colors border-white/15 bg-surface-hover text-gray-400 hover:border-white/25 hover:bg-white/10';

  useEffect(() => {
    if (!activeRun) return;
    if (!fullTimeInsightOn && fullDomainInsightOn && activeTrack !== 'fullDomain') {
      updateActiveRun({ activeTrack: 'fullDomain' });
      return;
    }
    if (!fullDomainInsightOn && fullTimeInsightOn && activeTrack !== 'fullTime') {
      updateActiveRun({ activeTrack: 'fullTime' });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRun?.id, fullTimeInsightOn, fullDomainInsightOn, activeTrack]);

  useEffect(() => {
    const onDown = (event: MouseEvent) => {
      if (!openPopover) return;
      if (filterBarRef.current?.contains(event.target as Node)) return;
      setOpenPopover(null);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [openPopover]);

  const upsertRun = (nextRun: ConversationRun) => {
    const next = [nextRun, ...runs.filter((r) => r.id !== nextRun.id)];
    setRuns(next);
    writeRuns(next);
  };

  const createRun = () => {
    const run = normalizeRun({
      id: `run-${Date.now()}`,
      title: '新建对话',
      stage: 'insightChat',
      researchStep: 1,
      scope: 'both',
      fullTimeEnabled: true,
      fullDomainEnabled: true,
    });
    upsertRun(run);
    setActiveRunId(run.id);
  };

  const updateActiveRun = (patch: Partial<ConversationRun>) => {
    if (!activeRun) return;
    upsertRun({
      ...activeRun,
      ...patch,
      updatedAt: Date.now(),
    });
  };

  const sendChat = (track: TrackType, preset?: string) => {
    if (!activeRun) return;
    const question = (preset ?? input).trim();
    if (!question) return;
    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: 'user', text: question };
    const prevTrack = activeRun.insightTracks[track];
    const nextTrack: InsightTrack = { ...prevTrack, messages: [...prevTrack.messages, userMsg] };
    const titleFromUser = truncateTopic(question);
    updateActiveRun({
      title: titleFromUser || activeRun.title,
      insightTracks: {
        ...activeRun.insightTracks,
        [track]: nextTrack,
      },
    });
    const steps = track === 'fullTime'
      ? ['正在检索全时知识范围...', '正在聚合时间序列证据...', '正在形成洞察结论...']
      : ['正在检索全域数据来源...', '正在比对人群与来源差异...', '正在形成洞察结论...'];
    setThinkingTrack(track);
    setThinkingSteps([]);
    setIsThinking(true);
    steps.forEach((s, idx) => {
      window.setTimeout(() => setThinkingSteps((prev) => [...prev, s]), idx * 550);
    });
    window.setTimeout(() => {
      const assistantMsg: ChatMessage = {
        id: `a-${Date.now() + 1}`,
        role: 'assistant',
        text: buildAssistantReply(track, question),
      };
      const latestRun = readRuns().find((r) => r.id === activeRun.id) ?? activeRun;
      const t = latestRun.insightTracks[track];
      upsertRun({
        ...latestRun,
        updatedAt: Date.now(),
        insightTracks: {
          ...latestRun.insightTracks,
          [track]: { ...t, messages: [...t.messages, assistantMsg] },
        },
      });
      setIsThinking(false);
      setThinkingSteps([]);
    }, steps.length * 550 + 450);
    if (!preset) setInput('');
  };

  const generateTrackReport = (track: TrackType) => {
    if (!activeRun) return;
    const t = activeRun.insightTracks[track];
    const trackHasAnswer = t.messages.filter((m) => m.role === 'assistant').length > 0;
    if (!trackHasAnswer) {
      window.alert('请先完成至少一轮洞察对话，再生成报告。');
      return;
    }
    const now = Date.now();
    const bothOn = fullTimeInsightOn && fullDomainInsightOn;
    if (bothOn) {
      const fullTimeMessages = activeRun.insightTracks.fullTime.messages;
      const fullDomainMessages = activeRun.insightTracks.fullDomain.messages;
      const mergedMessages = [...fullTimeMessages, ...fullDomainMessages];
      const mergedHasAnswer = mergedMessages.some((m) => m.role === 'assistant');
      if (!mergedHasAnswer) {
        window.alert('请先完成至少一轮洞察对话，再生成综合报告。');
        return;
      }
      const topic = getLatestUserTopic(mergedMessages);
      const reportTitle = toReportTitle(topic, 'integrated', track);
      const report = buildReportByMode('integrated', track, reportTitle, mergedMessages);
      updateActiveRun({
        insightTracks: {
          ...activeRun.insightTracks,
          fullTime: { ...activeRun.insightTracks.fullTime, report, reportUpdatedAt: now },
          fullDomain: { ...activeRun.insightTracks.fullDomain, report, reportUpdatedAt: now },
        },
      });
    } else {
      const topic = getLatestUserTopic(t.messages);
      const reportTitle = toReportTitle(topic, 'single', track);
      const report = buildReportByMode('single', track, reportTitle, t.messages);
      updateActiveRun({
        insightTracks: {
          ...activeRun.insightTracks,
          [track]: {
            ...t,
            report,
            reportUpdatedAt: now,
          },
        },
      });
    }
    setSelectedReportTrack(track);
  };

  if (!activeRun) {
    return (
      <div className="h-full overflow-y-auto p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-extrabold text-white mb-1">洞察研究</h2>
              <p className="text-sm text-gray-400">每次开启的新对话都会形成可继续推进的流程卡片</p>
            </div>
            <button onClick={createRun} className="bg-primary text-black px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-primary/90 flex items-center gap-2">
              <Plus size={16} /> 新建对话
            </button>
          </div>

          {runs.length === 0 ? (
            <div className="bg-surface rounded-xl border border-white/10 p-12 text-center text-gray-400">暂无对话，点击右上角“新建对话”开始。</div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {runs.map((run) => {
                const doneCount = Number(Boolean(run.insightTracks.fullTime.report)) + Number(Boolean(run.insightTracks.fullDomain.report));
                return (
                  <div key={run.id} className="bg-surface rounded-xl border border-white/10 p-5">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-bold text-white">{runDisplayTitle(run)}</h3>
                      <span className="text-xs text-primary">报告完成 {doneCount}/2</span>
                    </div>
                    <p className="text-xs text-gray-500 mb-2">更新时间：{formatTime(run.updatedAt)}</p>
                    <p className="text-sm text-gray-300 mb-4">{stageLabel(run.stage)}</p>
                    <div className="flex justify-end">
                      <button onClick={() => setActiveRunId(run.id)} className="bg-primary text-black px-4 py-2 rounded text-sm font-bold hover:bg-primary/90">
                        从当前步骤继续
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="px-8 py-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setActiveRunId(null)} className="w-8 h-8 rounded bg-surface-hover hover:bg-white/10 flex items-center justify-center" title="返回卡片列表">
            <ArrowLeft size={16} />
          </button>
          <div>
            <p className="text-sm font-bold text-white">{runDisplayTitle(activeRun)}</p>
            <p className="text-xs text-gray-500">{stageLabel(activeRun.stage)}</p>
          </div>
        </div>
      </div>

      {activeRun.stage === 'insightChat' && (
        <div className="flex-1 flex overflow-hidden p-8 gap-4">
          <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {activeMessages.length === 0 ? (
              <div className="h-full min-h-[280px] flex items-center justify-center text-gray-500">当前轨道暂无洞察对话，输入问题开始分析。</div>
            ) : (
              activeMessages.map((m) =>
                m.role === 'user' ? (
                  <div key={m.id} className="flex justify-end">
                    <div className="bg-primary text-black px-4 py-3 rounded-2xl max-w-3xl text-sm">{m.text}</div>
                  </div>
                ) : (
                  <div key={m.id} className="flex gap-3 items-start">
                    <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shrink-0">
                      <Bot size={18} className="text-black" />
                    </div>
                    <div className="max-w-3xl">
                      <div className="text-[11px] text-gray-400 mb-1">{currentAgentName}</div>
                      <div className="bg-surface rounded-2xl px-5 py-3 border border-white/10">
                        <pre className="text-sm text-gray-300 whitespace-pre-wrap font-sans">{m.text}</pre>
                      </div>
                      <div className="mt-2">
                        <button
                          type="button"
                          onClick={() => generateTrackReport(activeTrack)}
                          className="px-3 py-1.5 rounded-md border border-white/15 bg-white/5 text-xs font-bold text-gray-200 hover:bg-white/10"
                        >
                          生成报告
                        </button>
                      </div>
                      {latestAssistantId === m.id && suggestions.length > 0 && (
                        <div className="mt-2 space-y-2">
                          {suggestions.map((s) => (
                            <button key={s} type="button" onClick={() => sendChat(activeTrack, s)} className="block w-full text-left px-3 py-1.5 rounded-full bg-white/10 text-xs text-gray-200 hover:bg-white/15">
                              {s}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ),
              )
            )}
            {isThinking && thinkingTrack === activeTrack && (
              <div className="flex gap-3 items-start">
                <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shrink-0">
                  <Bot size={18} className="text-black" />
                </div>
                <div className="max-w-3xl">
                  <div className="text-[11px] text-gray-400 mb-1">{currentAgentName}</div>
                  <div className="bg-surface rounded-2xl px-5 py-3 border border-white/10">
                    <div className="flex items-center gap-2 text-sm text-gray-200 mb-2">
                      <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                      AI 正在思考中...
                    </div>
                    <div className="space-y-1">
                      {thinkingSteps.map((step, idx) => (
                        <div key={`${step}-${idx}`} className="text-xs text-gray-400">
                          {step}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => generateTrackReport('fullTime')}
              className={`min-w-[180px] rounded-md border px-3 py-2 text-left ${fullTimeReady ? 'border-primary bg-primary/10' : 'border-white/10 bg-surface-hover'}`}
            >
              <p className="text-xs font-bold">全时洞察报告</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{fullTimeReady ? '已生成' : '未生成'}</p>
            </button>
            <button
              type="button"
              onClick={() => generateTrackReport('fullDomain')}
              className={`min-w-[180px] rounded-md border px-3 py-2 text-left ${fullDomainReady ? 'border-primary bg-primary/10' : 'border-white/10 bg-surface-hover'}`}
            >
              <p className="text-xs font-bold">全域洞察报告</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{fullDomainReady ? '已生成' : '未生成'}</p>
            </button>
          </div>

          <div className="mt-4 text-xs text-gray-400 rounded-lg border border-white/10 bg-surface p-3">
            可单独进行全时或全域洞察；但进入正式研究前，必须完成全时与全域两份洞察报告。
          </div>

          <div className="mt-4 bg-surface-hover rounded-xl p-4 border-l-2 border-primary">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendChat(activeTrack);
                }
              }}
              className="w-full bg-transparent border-none outline-none resize-none h-20 text-sm"
              placeholder={
                fullTimeInsightOn && fullDomainInsightOn
                  ? '输入全时和全域洞察问题...'
                  : fullTimeInsightOn
                    ? '输入全时洞察问题...'
                    : fullDomainInsightOn
                      ? '输入全域洞察问题...'
                      : '请先启用全时洞察或全域洞察'
              }
            />
            <div className="mt-3 flex items-end justify-between gap-4">
              <div ref={filterBarRef} className="flex flex-wrap items-end gap-2">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      updateActiveRun({ activeTrack: 'fullTime' });
                      setOpenPopover((p) => (p === 'fullTime' ? null : 'fullTime'));
                    }}
                    className={openPopover === 'fullTime' || fullTimeInsightOn ? insightFilterBtnActive : insightFilterBtnInactive}
                  >
                    全时洞察
                    <ChevronDown className={`h-3.5 w-3.5 opacity-70 transition-transform ${openPopover === 'fullTime' ? 'rotate-180' : ''}`} />
                  </button>
                  {openPopover === 'fullTime' && (
                    <div className="absolute bottom-full left-0 z-30 mb-2 w-[min(100vw-2rem,280px)] overflow-hidden rounded-xl border border-black/5 bg-white py-2 text-zinc-900 shadow-2xl">
                      <FeishuToggleRow
                        label="启用全时洞察"
                        checked={activeRun.fullTimeEnabled ?? activeRun.scope !== 'fullDomain'}
                        onChange={(fullTimeEnabled) => {
                          const fullDomainEnabled = activeRun.fullDomainEnabled ?? activeRun.scope !== 'fullTime';
                          const nextScope: ScopeType = fullTimeEnabled && fullDomainEnabled ? 'both' : fullTimeEnabled ? 'fullTime' : 'fullDomain';
                          updateActiveRun({ fullTimeEnabled, scope: nextScope });
                        }}
                      />
                      <div className="mx-2 my-1 border-t border-zinc-100" />
                      <FeishuPopoverSection title="知识范围">
                        <FeishuSelectRow
                          label="洞察报告"
                          selected={activeRun.fullTimeFilters?.knowledgeScopes.insightReport ?? true}
                          onClick={() =>
                            updateActiveRun({
                              fullTimeFilters: {
                                knowledgeScopes: {
                                  insightReport: !(activeRun.fullTimeFilters?.knowledgeScopes.insightReport ?? true),
                                  vehicleKnowledge: activeRun.fullTimeFilters?.knowledgeScopes.vehicleKnowledge ?? true,
                                  industryKnowledge: activeRun.fullTimeFilters?.knowledgeScopes.industryKnowledge ?? false,
                                },
                                isOnlineSearch: activeRun.fullTimeFilters?.isOnlineSearch ?? true,
                              },
                            })
                          }
                        />
                        <FeishuSelectRow
                          label="整车知识"
                          selected={activeRun.fullTimeFilters?.knowledgeScopes.vehicleKnowledge ?? true}
                          onClick={() =>
                            updateActiveRun({
                              fullTimeFilters: {
                                knowledgeScopes: {
                                  insightReport: activeRun.fullTimeFilters?.knowledgeScopes.insightReport ?? true,
                                  vehicleKnowledge: !(activeRun.fullTimeFilters?.knowledgeScopes.vehicleKnowledge ?? true),
                                  industryKnowledge: activeRun.fullTimeFilters?.knowledgeScopes.industryKnowledge ?? false,
                                },
                                isOnlineSearch: activeRun.fullTimeFilters?.isOnlineSearch ?? true,
                              },
                            })
                          }
                        />
                        <FeishuSelectRow
                          label="行业知识"
                          selected={activeRun.fullTimeFilters?.knowledgeScopes.industryKnowledge ?? false}
                          onClick={() =>
                            updateActiveRun({
                              fullTimeFilters: {
                                knowledgeScopes: {
                                  insightReport: activeRun.fullTimeFilters?.knowledgeScopes.insightReport ?? true,
                                  vehicleKnowledge: activeRun.fullTimeFilters?.knowledgeScopes.vehicleKnowledge ?? true,
                                  industryKnowledge: !(activeRun.fullTimeFilters?.knowledgeScopes.industryKnowledge ?? false),
                                },
                                isOnlineSearch: activeRun.fullTimeFilters?.isOnlineSearch ?? true,
                              },
                            })
                          }
                        />
                      </FeishuPopoverSection>
                      <div className="mx-2 my-1 border-t border-zinc-100" />
                      <FeishuPopoverSection title="检索方式">
                        <FeishuToggleRow
                          label="联网搜索"
                          checked={activeRun.fullTimeFilters?.isOnlineSearch ?? true}
                          onChange={(isOnlineSearch) =>
                            updateActiveRun({
                              fullTimeFilters: {
                                knowledgeScopes: {
                                  insightReport: activeRun.fullTimeFilters?.knowledgeScopes.insightReport ?? true,
                                  vehicleKnowledge: activeRun.fullTimeFilters?.knowledgeScopes.vehicleKnowledge ?? true,
                                  industryKnowledge: activeRun.fullTimeFilters?.knowledgeScopes.industryKnowledge ?? false,
                                },
                                isOnlineSearch,
                              },
                            })
                          }
                        />
                      </FeishuPopoverSection>
                    </div>
                  )}
                </div>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      updateActiveRun({ activeTrack: 'fullDomain' });
                      setOpenPopover((p) => (p === 'fullDomain' ? null : 'fullDomain'));
                    }}
                    className={openPopover === 'fullDomain' || fullDomainInsightOn ? insightFilterBtnActive : insightFilterBtnInactive}
                  >
                    全域洞察
                    <ChevronDown className={`h-3.5 w-3.5 opacity-70 transition-transform ${openPopover === 'fullDomain' ? 'rotate-180' : ''}`} />
                  </button>
                  {openPopover === 'fullDomain' && (
                    <div className="absolute bottom-full left-0 z-30 mb-2 w-[min(100vw-2rem,280px)] overflow-hidden rounded-xl border border-black/5 bg-white py-2 text-zinc-900 shadow-2xl">
                      <FeishuToggleRow
                        label="启用全域洞察"
                        checked={activeRun.fullDomainEnabled ?? activeRun.scope !== 'fullTime'}
                        onChange={(fullDomainEnabled) => {
                          const fullTimeEnabled = activeRun.fullTimeEnabled ?? activeRun.scope !== 'fullDomain';
                          const nextScope: ScopeType = fullTimeEnabled && fullDomainEnabled ? 'both' : fullDomainEnabled ? 'fullDomain' : 'fullTime';
                          updateActiveRun({ fullDomainEnabled, scope: nextScope });
                        }}
                      />
                      <div className="mx-2 my-1 border-t border-zinc-100" />
                      <FeishuPopoverSection title="数据来源">
                        <FeishuSelectRow
                          label="全部来源"
                          selected={(activeRun.fullDomainFilters?.source ?? 'all') === 'all'}
                          onClick={() =>
                            updateActiveRun({
                              fullDomainFilters: {
                                source: 'all',
                                timeRange: activeRun.fullDomainFilters?.timeRange ?? 'all',
                              },
                            })
                          }
                        />
                        <FeishuSelectRow
                          label="一方"
                          selected={activeRun.fullDomainFilters?.source === 'firstParty'}
                          onClick={() =>
                            updateActiveRun({
                              fullDomainFilters: {
                                source: 'firstParty',
                                timeRange: activeRun.fullDomainFilters?.timeRange ?? 'all',
                              },
                            })
                          }
                        />
                        <FeishuSelectRow
                          label="一方+三方"
                          selected={activeRun.fullDomainFilters?.source === 'firstPlusThirdParty'}
                          onClick={() =>
                            updateActiveRun({
                              fullDomainFilters: {
                                source: 'firstPlusThirdParty',
                                timeRange: activeRun.fullDomainFilters?.timeRange ?? 'all',
                              },
                            })
                          }
                        />
                      </FeishuPopoverSection>
                      <div className="mx-2 my-1 border-t border-zinc-100" />
                      <FeishuPopoverSection title="时间范围">
                        {[
                          { key: 'all' as const, label: '全部时间' },
                          { key: 'week' as const, label: '近一周' },
                          { key: 'month' as const, label: '近一月' },
                          { key: 'quarter' as const, label: '近三月' },
                          { key: 'halfYear' as const, label: '近半年' },
                          { key: 'year' as const, label: '近一年' },
                        ].map((item) => (
                          <FeishuSelectRow
                            key={item.key}
                            label={item.label}
                            selected={(activeRun.fullDomainFilters?.timeRange ?? 'all') === item.key}
                            onClick={() =>
                              updateActiveRun({
                                fullDomainFilters: {
                                  source: activeRun.fullDomainFilters?.source ?? 'all',
                                  timeRange: item.key,
                                },
                              })
                            }
                          />
                        ))}
                      </FeishuPopoverSection>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {canShowEnterFormal && (
                  <button type="button" onClick={() => updateActiveRun({ stage: 'summaryConfirm' })} className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-black hover:bg-primary/90">
                    进入正式研究
                  </button>
                )}
                <button type="button" onClick={() => sendChat(activeTrack)} className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-black hover:bg-primary/90">
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>
          </div>
          {selectedReportTrack && activeRun.insightTracks[selectedReportTrack].report && (
            <div className="w-[44%] min-w-[420px] max-w-[620px] overflow-y-auto bg-white text-black rounded-xl border border-white/10">
              <div className="sticky top-0 z-10 bg-white border-b border-zinc-200 px-5 py-3 flex items-center justify-between">
                <div className="text-sm font-bold">
                  {pdfViewModel.title} · PDF 预览
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedReportTrack(null)}
                  className="text-xs text-zinc-500 hover:text-zinc-800"
                >
                  关闭
                </button>
              </div>
              <div className="p-6">
                <div className="mx-auto max-w-[760px] min-h-[70vh] bg-white border border-zinc-200 shadow-sm rounded-md p-8">
                  <div className="pb-6 border-b border-zinc-200">
                    <h1 className="text-2xl font-bold tracking-tight text-zinc-900">{pdfViewModel.title}</h1>
                    <p className="text-xs text-zinc-500 mt-2">生成时间：{pdfViewModel.generatedAt || formatTime(Date.now())}</p>
                  </div>
                  <div className="pt-6 space-y-6">
                    {pdfViewModel.sections.map((sec) => (
                      <section key={sec.heading}>
                        <h2 className="text-sm font-bold text-zinc-900 mb-2">{sec.heading}</h2>
                        <div className="space-y-2">
                          {sec.items.map((item) => (
                            <p key={`${sec.heading}-${item}`} className="text-[13px] leading-6 text-zinc-800">
                              {item}
                            </p>
                          ))}
                        </div>
                      </section>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeRun.stage === 'summaryConfirm' && (
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="bg-surface rounded-xl border border-white/10 p-6">
              <h3 className="text-xl font-bold">洞察摘要确认</h3>
              <p className="text-sm text-gray-400 mt-2">请先确认全时与全域洞察摘要。确认后将进入“开始新的研究”输入调研主题。</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface rounded-xl border border-white/10 p-5">
                <p className="text-sm font-bold mb-2">全时洞察摘要</p>
                <pre className="text-xs text-gray-300 whitespace-pre-wrap">{activeRun.insightTracks.fullTime.report || '暂无全时报告'}</pre>
              </div>
              <div className="bg-surface rounded-xl border border-white/10 p-5">
                <p className="text-sm font-bold mb-2">全域洞察摘要</p>
                <pre className="text-xs text-gray-300 whitespace-pre-wrap">{activeRun.insightTracks.fullDomain.report || '暂无全域报告'}</pre>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => updateActiveRun({ stage: 'insightChat' })} className="px-4 py-2 rounded-lg border border-white/15 text-sm text-gray-200 hover:bg-white/5">
                返回继续补充洞察
              </button>
              <button type="button" onClick={() => updateActiveRun({ stage: 'formalStart', researchStep: 1 })} className="px-4 py-2 rounded-lg bg-primary text-black text-sm font-bold hover:bg-primary/90">
                确认并进入调研主题输入
              </button>
            </div>
          </div>
        </div>
      )}

      {(activeRun.stage === 'formalStart' || activeRun.stage === 'verifyPlan' || activeRun.stage === 'persona' || activeRun.stage === 'report') && (
        <FormalResearch
          isSidebarCollapsed={isSidebarCollapsed}
          embedded
          initialStep={activeRun.researchStep || stageToStep(activeRun.stage)}
          initialInput=""
          contextPrefix={buildFormalContextPrefix(activeRun)}
          onStepChange={(step) => {
            updateActiveRun({
              researchStep: step,
              stage: stepToStage(step),
              scope: 'both',
            });
          }}
        />
      )}
    </div>
  );
}
