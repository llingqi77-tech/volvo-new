import { useRef, useState, useEffect } from 'react';
import { Command, Paperclip, Mic, ArrowRight, Upload, FileText, Share2, Download, User } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

/** 与 API `classify-research` 失败时的 fallback 对齐，用于前端离线降级 */
const OFFLINE_RESEARCH_CLASSIFICATION = {
  kind: '探索型研究',
  framework: 'JTBD + 用户旅程地图',
  rationale: '无法连接研究分类服务时的默认框架。请确认本机已启动 API（`npm run dev` 会同时启动前端与 API）。',
  confidence: 'low',
};

const FULL_TIME_SESSIONS_KEY = 'volvo.chat.expert.sessions';
const FULL_DOMAIN_SESSIONS_KEY = 'volvo.chat.customer.sessions';
const RESEARCH_PROJECTS_KEY = 'volvo.research.projects';

type InsightMessage = { id: string; role: 'user' | 'assistant'; text: string };
type InsightSession = { id: string; title: string; updatedAt: number; messages: InsightMessage[] };
type SynthesisReportData = {
  generatedAt: number;
  fullTimeTopic: string;
  fullDomainTopic: string;
  fullTimeConclusion: string;
  fullDomainConclusion: string;
  integratedInsights: string[];
};
type ResearchProject = {
  id: string;
  name: string;
  fullTimeSessionId: string;
  fullDomainSessionId: string;
  synthesisReport: SynthesisReportData | string;
  updatedAt: number;
};

function readJsonArray<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function writeJsonArray<T>(key: string, value: T[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function buildSynthesisReport(fullTime: InsightSession, fullDomain: InsightSession): SynthesisReportData {
  const fullTimeConclusion = fullTime.messages.filter((m) => m.role === 'assistant').at(-1)?.text ?? '暂无全时洞察结论';
  const fullDomainConclusion = fullDomain.messages.filter((m) => m.role === 'assistant').at(-1)?.text ?? '暂无全域洞察结论';
  return {
    generatedAt: Date.now(),
    fullTimeTopic: fullTime.title,
    fullDomainTopic: fullDomain.title,
    fullTimeConclusion,
    fullDomainConclusion,
    integratedInsights: [
      '将专家判断与用户反馈交叉验证，形成后续研究的关键假设。',
      '优先进入分歧点和高影响变量的正式研究验证。',
    ],
  };
}

function normalizeSynthesisReport(report: SynthesisReportData | string): SynthesisReportData {
  if (typeof report !== 'string') return report;
  // 兼容旧数据：将 markdown/纯文本兜底到 PDF 结构中展示
  return {
    generatedAt: Date.now(),
    fullTimeTopic: '历史全时洞察',
    fullDomainTopic: '历史全域洞察',
    fullTimeConclusion: report,
    fullDomainConclusion: '历史项目未拆分全域结论，请按新版重新生成可获得结构化报告。',
    integratedInsights: ['该项目来自旧版数据，建议重新创建项目以生成标准化整合报告。'],
  };
}

function synthesisReportToPrompt(projectName: string, report: SynthesisReportData | string) {
  const normalized = normalizeSynthesisReport(report);
  return [
    `项目：${projectName}`,
    `全时主题：${normalized.fullTimeTopic}`,
    `全域主题：${normalized.fullDomainTopic}`,
    '',
    '全时洞察结论：',
    normalized.fullTimeConclusion,
    '',
    '全域洞察结论：',
    normalized.fullDomainConclusion,
    '',
    '综合判断：',
    ...normalized.integratedInsights.map((item, idx) => `${idx + 1}. ${item}`),
  ].join('\n');
}

function fallbackVerifyQuestion(round: number): {
  id: string;
  mode: 'single';
  title: string;
  options: string[];
} {
  const id = `fallback-q${round}-${Date.now()}`;
  switch (round) {
    case 1:
      return {
        id,
        mode: 'single',
        title: '您的研究主要面向哪些人群？',
        options: ['年轻用户（18-30岁）', '中青年用户（25-40岁）', '中年用户（35-50岁）', '全年龄段'],
      };
    case 2:
      return {
        id,
        mode: 'single',
        title: '研究主要发生在什么场景？',
        options: ['日常生活', '工作/商务', '购物决策', '线上线下结合'],
      };
    default:
      return {
        id,
        mode: 'single',
        title: `请确认第 ${round} 个研究维度（离线占位，可稍后重试）`,
        options: ['侧重用户体验', '侧重转化与增长', '侧重品牌认知', '其他'],
      };
  }
}

export default function FormalResearch({
  isSidebarCollapsed = false,
  embedded = false,
  initialStep = 2,
  initialInput = '',
  onStepChange,
}: {
  isSidebarCollapsed?: boolean;
  embedded?: boolean;
  initialStep?: number;
  initialInput?: string;
  onStepChange?: (step: number) => void;
}) {
  const [phase, setPhase] = useState<'gate' | 'flow'>(embedded ? 'flow' : 'gate');
  const [step, setStep] = useState(initialStep);
  const [userInput, setUserInput] = useState(initialInput);
  const [classification, setClassification] = useState<{
    kind: string;
    framework: string;
    rationale: string;
    confidence: string;
  } | null>(null);
  const [verificationAnswers, setVerificationAnswers] = useState<Array<{ question: string; answer: string[] }>>([]);
  const [selectedPlanVersion, setSelectedPlanVersion] = useState<any>(null);

  useEffect(() => {
    onStepChange?.(step);
  }, [step, onStepChange]);

  useEffect(() => {
    if (embedded) {
      setPhase('flow');
    }
  }, [embedded]);

  useEffect(() => {
    if (embedded) {
      setStep(initialStep);
    }
  }, [embedded, initialStep]);

  useEffect(() => {
    if (embedded) {
      setUserInput(initialInput);
    }
  }, [embedded, initialInput]);

  if (phase === 'gate') {
    return (
      <ProjectGate
        onEnterResearch={(project) => {
          setUserInput(synthesisReportToPrompt(project.name, project.synthesisReport));
          setStep(2);
          setPhase('flow');
        }}
      />
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {step === 1 && <StepStart onNext={(input: string) => { setUserInput(input); setStep(2); }} />}
      {step === 2 && <StepVerifyAndPlan userInput={userInput} onNext={(cls, answers, version) => { setClassification(cls); setVerificationAnswers(answers); setSelectedPlanVersion(version); setStep(3); }} />}
      {step === 3 && <StepAudience onNext={() => setStep(4)} />}
      {step === 4 && <StepConfirm onNext={() => setStep(5)} />}
      {step === 5 && <StepReport />}
    </div>
  );
}

function ProjectGate({ onEnterResearch }: { onEnterResearch: (project: ResearchProject) => void }) {
  const [projects, setProjects] = useState<ResearchProject[]>(() => readJsonArray<ResearchProject>(RESEARCH_PROJECTS_KEY));
  const [isCreating, setIsCreating] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [selectedFullTimeId, setSelectedFullTimeId] = useState('');
  const [selectedFullDomainId, setSelectedFullDomainId] = useState('');
  const [pendingProject, setPendingProject] = useState<ResearchProject | null>(null);

  const fullTimeSessions = readJsonArray<InsightSession>(FULL_TIME_SESSIONS_KEY).filter((s) =>
    s.messages.some((m) => m.role === 'assistant'),
  );
  const fullDomainSessions = readJsonArray<InsightSession>(FULL_DOMAIN_SESSIONS_KEY).filter((s) =>
    s.messages.some((m) => m.role === 'assistant'),
  );

  const persistProjects = (next: ResearchProject[]) => {
    setProjects(next);
    writeJsonArray(RESEARCH_PROJECTS_KEY, next);
  };

  const resetCreate = () => {
    setProjectName('');
    setSelectedFullTimeId('');
    setSelectedFullDomainId('');
    setPendingProject(null);
    setIsCreating(false);
  };

  const handleCreate = () => {
    if (!projectName.trim()) {
      window.alert('请填写项目名称');
      return;
    }
    if (!selectedFullTimeId || !selectedFullDomainId) {
      window.alert('必须关联一条全时和一条全域对话记录');
      return;
    }
    const fullTime = fullTimeSessions.find((s) => s.id === selectedFullTimeId);
    const fullDomain = fullDomainSessions.find((s) => s.id === selectedFullDomainId);
    if (!fullTime || !fullDomain) {
      window.alert('关联记录无效，请重新选择');
      return;
    }
    const project: ResearchProject = {
      id: `project-${Date.now()}`,
      name: projectName.trim(),
      fullTimeSessionId: fullTime.id,
      fullDomainSessionId: fullDomain.id,
      synthesisReport: buildSynthesisReport(fullTime, fullDomain),
      updatedAt: Date.now(),
    };
    setPendingProject(project);
  };

  const handleContinueLater = () => {
    if (!pendingProject) return;
    persistProjects([pendingProject, ...projects]);
    resetCreate();
  };

  const handleEnterNow = () => {
    if (!pendingProject) return;
    persistProjects([pendingProject, ...projects]);
    onEnterResearch(pendingProject);
    resetCreate();
  };

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-extrabold text-white mb-2">正式研究</h2>
            <p className="text-sm text-gray-400">仅包含已关联全时与全域洞察记录的项目可进入正式研究</p>
          </div>
          <button
            onClick={() => setIsCreating(true)}
            className="bg-primary text-black px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-primary/90"
          >
            新建项目
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="bg-surface rounded-xl border border-white/10 p-10 text-center text-gray-400">暂无可进入正式研究的项目，请先新建项目并关联洞察记录。</div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {projects.map((p) => (
              <div key={p.id} className="bg-surface rounded-xl border border-white/10 p-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold text-white">{p.name}</h3>
                  <span className="text-xs text-primary">可进入</span>
                </div>
                <p className="text-xs text-gray-500 mb-3">最近更新：{formatTime(p.updatedAt)}</p>
                <div className="bg-white text-black rounded border border-black/10 p-3 text-xs leading-5 line-clamp-4">
                  {normalizeSynthesisReport(p.synthesisReport).integratedInsights[0]}
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => onEnterResearch(p)}
                    className="bg-primary text-black px-4 py-2 rounded text-sm font-bold hover:bg-primary/90"
                  >
                    进入正式研究
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isCreating && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-6">
          <div className="w-full max-w-4xl bg-surface rounded-xl border border-white/10 p-6 max-h-[88vh] overflow-y-auto">
            {!pendingProject ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white">新建项目</h3>
                  <button onClick={resetCreate} className="text-gray-400 hover:text-white">✕</button>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-gray-400 mb-2">项目名称</p>
                    <input
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm outline-none"
                      placeholder="例如：2024 新能源用户决策研究"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-400 mb-2">关联全时洞察（必选）</p>
                      <select
                        value={selectedFullTimeId}
                        onChange={(e) => setSelectedFullTimeId(e.target.value)}
                        className="w-full bg-surface text-white border border-white/20 rounded px-3 py-2 text-sm outline-none"
                      >
                        <option value="" className="text-black bg-white">请选择全时洞察记录</option>
                        {fullTimeSessions.map((s) => (
                          <option key={s.id} value={s.id} className="text-black bg-white">{`${s.title}（${formatTime(s.updatedAt)}）`}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-2">关联全域洞察（必选）</p>
                      <select
                        value={selectedFullDomainId}
                        onChange={(e) => setSelectedFullDomainId(e.target.value)}
                        className="w-full bg-surface text-white border border-white/20 rounded px-3 py-2 text-sm outline-none"
                      >
                        <option value="" className="text-black bg-white">请选择全域洞察记录</option>
                        {fullDomainSessions.map((s) => (
                          <option key={s.id} value={s.id} className="text-black bg-white">{`${s.title}（${formatTime(s.updatedAt)}）`}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="text-xs text-amber-300 bg-amber-300/10 border border-amber-300/20 rounded px-3 py-2">
                    必须关联一条全时和一条全域对话记录。
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <button onClick={resetCreate} className="px-4 py-2 text-sm rounded bg-white/5 border border-white/10">取消</button>
                    <button onClick={handleCreate} className="px-4 py-2 text-sm rounded bg-primary text-black font-bold">生成洞察整合</button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white">洞察整合报告</h3>
                  <button onClick={resetCreate} className="text-gray-400 hover:text-white">✕</button>
                </div>
                <PdfStyledSynthesisReport report={pendingProject.synthesisReport} projectName={pendingProject.name} />
                <div className="mt-5 flex justify-end gap-3">
                  <button onClick={handleContinueLater} className="px-4 py-2 text-sm rounded bg-white/5 border border-white/10">稍后继续</button>
                  <button onClick={handleEnterNow} className="px-4 py-2 text-sm rounded bg-primary text-black font-bold">进入正式研究</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function PdfStyledSynthesisReport({ report, projectName }: { report: SynthesisReportData | string; projectName: string }) {
  const normalized = normalizeSynthesisReport(report);
  return (
    <div className="bg-white text-black rounded-lg border border-black/10 shadow-xl p-8">
      <div className="border-b border-black/20 pb-4 mb-5">
        <h4 className="text-2xl font-extrabold">洞察整合报告</h4>
        <p className="text-sm text-gray-700 mt-1">项目：{projectName}</p>
        <p className="text-xs text-gray-500 mt-1">生成时间：{formatTime(normalized.generatedAt)}</p>
      </div>

      <section className="mb-4">
        <p className="text-sm font-bold mb-1">一、关联洞察主题</p>
        <p className="text-sm leading-6">全时洞察：{normalized.fullTimeTopic}</p>
        <p className="text-sm leading-6">全域洞察：{normalized.fullDomainTopic}</p>
      </section>

      <section className="mb-4">
        <p className="text-sm font-bold mb-1">二、全时洞察结论</p>
        <p className="text-sm leading-6 whitespace-pre-wrap">{normalized.fullTimeConclusion}</p>
      </section>

      <section className="mb-4">
        <p className="text-sm font-bold mb-1">三、全域洞察结论</p>
        <p className="text-sm leading-6 whitespace-pre-wrap">{normalized.fullDomainConclusion}</p>
      </section>

      <section>
        <p className="text-sm font-bold mb-1">四、综合判断</p>
        <ol className="list-decimal pl-5 space-y-1 text-sm">
          {normalized.integratedInsights.map((item, idx) => (
            <li key={`${idx}-${item}`}>{item}</li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function StepStart({ onNext }: { onNext: (input: string) => void }) {
  const [text, setText] = useState('');
  const uploadRef = useRef<HTMLInputElement>(null);

  const handleVoiceInput = () => {
    const SpeechRecognitionCtor =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      window.alert('当前浏览器不支持语音输入');
      return;
    }
    const recognition = new SpeechRecognitionCtor();
    recognition.lang = 'zh-CN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript ?? '';
      if (transcript) {
        setText((prev) => `${prev}${prev ? '\n' : ''}${transcript}`);
      }
    };
    recognition.start();
  };

  const handleNext = () => {
    if (!text.trim()) {
      window.alert('请输入研究问题');
      return;
    }
    onNext(text);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
      <div className="w-full max-w-4xl relative z-10">
        <div className="flex items-center justify-center gap-4 mb-8">
          <Command size={40} className="text-white" />
          <h2 className="text-4xl font-extrabold text-white">开始您的研究</h2>
        </div>
        <div className="bg-surface rounded-xl border border-white/10 overflow-hidden shadow-2xl">
          <input
            ref={uploadRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              if (file.type !== 'application/pdf') {
                window.alert('请上传 PDF 文件');
                return;
              }
              const maxSizeMB = 20;
              const maxSizeBytes = maxSizeMB * 1024 * 1024;
              if (file.size > maxSizeBytes) {
                window.alert(`文件大小超过 ${maxSizeMB} MB 限制，请选择更小的文件`);
                return;
              }
              setText((prev) => `${prev}${prev ? '\n' : ''}[已上传PDF] ${file.name}`);
            }}
          />
          <div className="px-8 pt-10 pb-12">
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              className="w-full bg-transparent border-none focus:ring-0 text-xl text-white placeholder:text-gray-600 resize-none h-32 outline-none"
              placeholder="请提出任何关于人类行为和决策制定的商业问题。我们将对驱动真实选择的主观因素进行建模。"
            ></textarea>
          </div>
          <div className="bg-white/5 p-4 flex justify-end items-center">
            <div className="flex items-center gap-4">
              <button onClick={() => uploadRef.current?.click()} className="text-gray-400 hover:text-white p-2" title="上传PDF">
                <Paperclip size={20} />
              </button>
              <button onClick={handleVoiceInput} className="text-gray-400 hover:text-white p-2" title="语音输入">
                <Mic size={18} />
              </button>
              <button onClick={handleNext} className="bg-primary text-black px-8 py-3 rounded-lg font-bold flex items-center gap-2 hover:bg-primary/90">
                开始研究 <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepVerifyAndPlan({ userInput, onNext }: { userInput: string; onNext: (classification: any, answers: Array<{ question: string; answer: string[] }>, version: any) => void }) {
  type Question = { id: string; mode: 'single' | 'multi' | 'multiple'; title: string; options: string[] };
  type ArtifactVersion = { version: number; plan: any; interview: any[]; fullContent: string; createdAt: string };

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingSteps, setThinkingSteps] = useState<string[]>([]);
  const [classification, setClassification] = useState<any>(null);
  const [isClassifying, setIsClassifying] = useState(true);
  const [selectedArtifact, setSelectedArtifact] = useState<'plan' | 'interview' | null>(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [isPanelVisible, setIsPanelVisible] = useState(false);

  const [versions, setVersions] = useState<ArtifactVersion[]>([]);
  const [selectedVersionIndex, setSelectedVersionIndex] = useState(0);

  const [refineMode, setRefineMode] = useState<'idle' | 'questioning' | 'generating'>('idle');
  const [refineInput, setRefineInput] = useState('');
  const [refineQuestions, setRefineQuestions] = useState<Question[]>([]);
  const [refineAnswers, setRefineAnswers] = useState<Record<string, string[]>>({});
  const [refineCurrentIndex, setRefineCurrentIndex] = useState(0);

  const chatBottomRef = useRef<HTMLDivElement>(null);

  const fetchWithTimeout = async (url: string, options: Record<string, any> = {}, timeout = 60000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      if (!res.ok) throw new Error('请求失败: ' + res.status);
      return res;
    } finally {
      clearTimeout(id);
    }
  };

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentIndex, isThinking, thinkingSteps, refineMode, refineCurrentIndex]);

  const simulateThinkingProcess = (roundNumber: number) => {
    const thinkingProcesses = [
      ['分析用户输入的研究问题...','识别核心研究维度：目标人群、研究场景、关注点','基于研究类型，确定首要澄清的参数','生成第一个核验问题'],
      ['整合前一轮的回答...','评估已确认的研究参数完整性','识别尚未明确的关键维度','设计针对性的追问策略','生成下一个核验问题'],
      ['综合分析前两轮的回答...','构建初步的研究框架雏形','识别潜在的研究盲区','确定需要进一步细化的方向','生成第三个核验问题'],
      ['回顾已收集的所有参数...','评估研究方案的可行性','识别执行层面的关键细节','确定最后需要确认的要素','生成第四个核验问题'],
      ['整合所有核验结果...','验证研究参数的一致性和完整性','确认最后的关键假设','生成最终核验问题']
    ];
    const steps = thinkingProcesses[Math.min(roundNumber, 4)];
    setThinkingSteps([]);
    steps.forEach((step, idx) => setTimeout(() => setThinkingSteps(prev => [...prev, step]), idx * 600));
    return steps.length * 600;
  };

  const classifyResearch = async () => {
    try {
      const res = await fetchWithTimeout(
        '/api/classify-research',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userInput }),
        },
        90000,
      );
      const data = await res.json();
      setClassification(data);
      const firstQuestion = await generateNextQuestion(data, []);
      setQuestions([firstQuestion]);
    } catch (e) {
      console.error(e);
      setClassification({ ...OFFLINE_RESEARCH_CLASSIFICATION });
      const firstQuestion = await generateNextQuestion(OFFLINE_RESEARCH_CLASSIFICATION, []);
      setQuestions([firstQuestion]);
    } finally {
      setIsClassifying(false);
    }
  };

  const generateNextQuestion = async (cls: any, previousAnswers: Array<{ question: string; answer: string[] }>): Promise<Question> => {
    const round = previousAnswers.length + 1;
    try {
      const res = await fetchWithTimeout(
        '/api/generate-question',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userInput, classification: cls, previousAnswers, round }),
        },
        90000,
      );
      const data = await res.json();
      const q = data.question;
      return { id: q.id || 'q-' + Date.now(), mode: q.mode || 'single', title: q.title, options: q.options };
    } catch {
      const fb = fallbackVerifyQuestion(round);
      return { id: fb.id, mode: fb.mode, title: fb.title, options: fb.options };
    }
  };

  useEffect(() => { classifyResearch(); }, []);

  const submitAnswer = async (picked: string[]) => {
    if (!current) return;
    setAnswers((prev) => ({ ...prev, [current.id]: picked }));
    const previousAnswers = questions.slice(0, currentIndex + 1).map((q) => ({ question: q.title, answer: answers[q.id] || [] }));
    previousAnswers[previousAnswers.length - 1].answer = picked;
    const thinkingDuration = simulateThinkingProcess(currentIndex);
    setIsThinking(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      if (currentIndex < 4) {
        await new Promise(resolve => setTimeout(resolve, thinkingDuration + 500));
        const nextQuestion = await generateNextQuestion(classification, previousAnswers);
        setQuestions((prev) => [...prev, nextQuestion]);
      } else {
        await new Promise(resolve => setTimeout(resolve, thinkingDuration + 500));
      }
      setIsThinking(false);
      setThinkingSteps([]);
      setCurrentIndex((prev) => prev + 1);
    } catch (error) {
      console.error('生成下一题失败:', error);
      setIsThinking(false);
      setThinkingSteps([]);
      setTimeout(() => setCurrentIndex((prev) => prev + 1), 300);
    }
  };

  const toggleMulti = (option: string) => {
    if (!current) return;
    const set = new Set(currentPicked);
    if (set.has(option)) set.delete(option); else set.add(option);
    setAnswers((prev) => ({ ...prev, [current.id]: Array.from(set) }));
  };

  const callGeneratePlan = async () => {
    // 生成调研方案/访谈大纲：离线模拟（不请求 /api/generate-plan）
    const answersArray = questions.map((q) => ({ question: q.title, answer: answers[q.id] || [] }));
    const feedbackPieces = answersArray
      .map((a, idx) => {
        const joined = (a.answer || []).length ? (a.answer || []).join('、') : '未选择';
        return `核验${idx + 1}（${a.question}）：${joined}`;
      })
      .join('\n');

    const kind = classification?.kind ?? '探索型研究';
    const framework = classification?.framework ?? 'JTBD + 用户旅程地图';
    const userTopic = userInput.trim();

    const researchPlan = {
      background: `在${userTopic}相关的决策过程中，不同用户会基于“动机—信息—评估—行动”的路径形成差异化选择。本研究聚焦${kind}框架，并结合${framework}梳理关键驱动因素与决策阻碍。\n\n${feedbackPieces}`,
      theme: `${kind}视角下的${userTopic}用户洞察与验证框架`,
      coreQuestion: `围绕${userTopic}，用户的关键动机是什么？哪些信息来源与评估标准会促进或阻碍最终选择？`,
      methodology: `采用“定性理解 + 结构化核验”的混合方式：\n- 深度访谈/追问：围绕核验题目逐步澄清\n- 结构化归纳：将答案映射到动机维度与旅程节点\n- 产出验证：将发现组织成可执行的策略与交付物\n\n核验结果摘要：\n${feedbackPieces}`,
      targetAudience: `目标人群与场景由核验答案指向：\n- 人群：${answersArray[0]?.answer?.[0] ?? '（待补充）'}\n- 场景：${answersArray[1]?.answer?.[0] ?? '（待补充）'}\n- 研究范围：${answersArray[2]?.answer?.[0] ?? '（待补充）'}\n\n${kind}适配说明：以${framework}建立统一分析坐标系`,
      executionPlan: `执行步骤（离线模拟版，仅用于演示 UI）：
第1步：基于用户输入与核验回答，抽取核心维度
第2步：将关键驱动因素映射到“旅程节点”
第3步：形成可直接用于方案讨论的研究结构
第4步：整理交付物（研究背景/问题/方法/执行计划）`,
      expectedOutput: `预期产出（离线模拟版）：
1) 用户动机与决策路径总结
2) 关键影响因素清单（促进/阻碍）
3) 可落地的策略建议与执行要点
4) 用于后续对话的结构化框架`,
    };

    const interviewGuide = [
      {
        title: 'Part A: 破冰环节（5-10 分钟）',
        questions: [
          `当你面对与${userTopic}相关的决策时，你能先讲讲你的背景/角色吗？`,
          `你通常从哪些信息渠道了解并评估方案？（对照核验${1}的答案）`,
          `在你看来，什么会让你更愿意推进下一步？`,
        ],
      },
      {
        title: 'Part B: 核心探索（30-40 分钟）',
        questions: [
          `你在做选择时最看重的标准是什么？（对照核验${2}）`,
          `有没有让你犹豫或被“劝退”的关键因素？`,
          `如果要向别人推荐你的最佳选择，你会怎么说明？`,
        ],
      },
      {
        title: 'Part C: 深挖与收尾（10-15 分钟）',
        questions: [
          `关于${userTopic}，你希望研究进一步补充哪些细节？`,
          `如果让你用一句话概括理想体验，会是什么？`,
          `你认为本研究最需要验证的“关键假设”是什么？`,
        ],
      },
    ];

    const fullContent = `# 调研方案（离线模拟）
主题：${researchPlan.theme}

## 一、研究背景
${researchPlan.background}

## 二、研究主题
${researchPlan.theme}

## 三、核心研究问题
${researchPlan.coreQuestion}

## 四、研究方法
${researchPlan.methodology}

## 五、目标受众
${researchPlan.targetAudience}

## 六、执行方案
${researchPlan.executionPlan}

## 七、预期产出
${researchPlan.expectedOutput}

# 访谈大纲（离线模拟）
${interviewGuide.map((s) => `## ${s.title}\n- ${s.questions.join('\n- ')}`).join('\n\n')}
`;

    return { researchPlan, interviewGuide, fullContent };
  };

  const handleGenerateArtifact = async (type: 'plan' | 'interview') => {
    setSelectedArtifact(type);
    setIsPanelVisible(true);
    if (versions.length === 0) {
      setIsGeneratingPlan(true);
      try {
        const data = await callGeneratePlan();
        const v: ArtifactVersion = { version: 1, plan: data.researchPlan, interview: data.interviewGuide, fullContent: data.fullContent, createdAt: new Date().toLocaleString('zh-CN') };
        setVersions([v]);
        setSelectedVersionIndex(0);
      } catch (e) {
        console.error(e);
        const err = e instanceof Error ? e : null;
        const aborted =
          err?.name === 'AbortError' ||
          (e instanceof DOMException && e.name === 'AbortError') ||
          Boolean(err && /aborted|AbortError/i.test(err.message));
        alert(
          aborted
            ? '生成调研方案耗时较长，前端等待已超时。请稍后再次点击「调研方案」重试；若仍失败，请检查网络或调大模型超时。'
            : '生成方案失败，请重试',
        );
      } finally {
        setIsGeneratingPlan(false);
      }
    }
  };

  const handleRefineSubmit = async () => {
    if (!refineInput.trim()) return;
    setRefineMode('questioning');

    // 追问问题：离线模拟固定 3 题（不请求 /api/generate-refine-questions）
    const feedback = refineInput.trim();
    const lower = feedback.toLowerCase();

    const hasCompetitor = /竞品|竞争|对手|替代/.test(feedback) || lower.includes('competitor');
    const hasSample = /样本|样本量|扩大|范围|扩展/.test(feedback) || lower.includes('sample');
    const hasMethod = /问卷|焦点|桌面|定量|量化/.test(feedback) || lower.includes('survey');

    const q1 = {
      id: 'rq-0',
      mode: 'single' as const,
      title: hasCompetitor ? '是否加入竞品/替代方案分析？' : '是否调整研究重点/核心假设？',
      options: hasCompetitor
        ? ['加入竞品分析', '补充竞品对比维度（价格/体验/渠道）', '不需要竞品分析']
        : ['是，调整重点', '否，保持不变', '部分调整'],
    };

    const q2 = {
      id: 'rq-1',
      mode: 'single' as const,
      title: hasSample ? '是否扩大样本量或调整研究范围？' : '是否补充研究方法（如问卷/焦点小组/桌面研究）？',
      options: hasSample
        ? ['扩大/加深访谈与核验', '仅补充小范围访谈', '不调整']
        : hasMethod
          ? ['加入问卷验证', '加入焦点小组/群访', '保持访谈为主']
          : ['加入问卷验证', '加入桌面研究（竞品/行业资料）', '保持访谈为主'],
    };

    const q3 = {
      id: 'rq-2',
      mode: 'single' as const,
      title: '反馈将如何体现在交付物上？',
      options: ['强化洞察总结', '新增策略/建议', '加强执行计划'],
    };

    setRefineQuestions([q1, q2, q3]);
    setRefineAnswers({});
    setRefineCurrentIndex(0);
  };

  const submitRefineAnswer = (picked: string[]) => {
    if (!refineCurrent) return;
    setRefineAnswers((prev) => ({ ...prev, [refineCurrent.id]: picked }));
    if (refineCurrentIndex < refineQuestions.length - 1) {
      setRefineCurrentIndex((prev) => prev + 1);
    } else {
      doRefinePlan(picked);
    }
  };

  const toggleRefineMulti = (option: string) => {
    if (!refineCurrent) return;
    const set = new Set(refineCurrentPicked);
    if (set.has(option)) set.delete(option); else set.add(option);
    setRefineAnswers((prev) => ({ ...prev, [refineCurrent.id]: Array.from(set) }));
  };

  const doRefinePlan = async (lastPicked?: string[]) => {
    setRefineMode('generating');
    try {
      const currentVersion = versions[selectedVersionIndex];
      const feedback = refineInput.trim();
      const refineQa = refineQuestions.map((q) => {
        const override = q.id === refineCurrent?.id && lastPicked ? lastPicked : undefined;
        return { question: q.title, answer: override ?? (refineAnswers[q.id] || []) };
      });

      const answerLines = refineQa
        .map((qa) => `${qa.question}：${(qa.answer || []).length ? qa.answer.join('、') : '未选择'}`)
        .join('\n');

      const appendUpdate = (oldText: unknown) => {
        const base = typeof oldText === 'string' ? oldText : String(oldText ?? '');
        return `${base}\n\n已根据反馈补充：${feedback}\n追问答案摘要：\n${answerLines}`;
      };

      const prevPlan = currentVersion.plan ?? {};
      const researchPlan = {
        background: appendUpdate(prevPlan.background),
        theme: appendUpdate(prevPlan.theme),
        coreQuestion: appendUpdate(prevPlan.coreQuestion),
        methodology: appendUpdate(prevPlan.methodology),
        targetAudience: appendUpdate(prevPlan.targetAudience),
        executionPlan: appendUpdate(prevPlan.executionPlan),
        expectedOutput: appendUpdate(prevPlan.expectedOutput),
      };

      const prevInterview = currentVersion.interview;
      const interviewGuide = Array.isArray(prevInterview)
        ? prevInterview.map((section: any) => {
            const qs = Array.isArray(section?.questions) ? [...section.questions] : [];
            qs.push(`根据反馈补充：${feedback}（重点参考：${refineQa[0]?.answer?.[0] ?? '待定'}）`);
            return { ...section, questions: qs };
          })
        : [
            {
              title: 'Part A: 破冰环节（5-10 分钟）',
              questions: [`根据反馈补充：${feedback}`],
            },
          ];

      const fullContent = `# 调研方案（已根据反馈离线更新）
主题：${researchPlan.theme}

## 一、研究背景
${researchPlan.background}

## 七、预期产出
${researchPlan.expectedOutput}

# 访谈大纲
${interviewGuide.map((s: any) => `## ${s.title}\n- ${(s.questions || []).join('\n- ')}`).join('\n\n')}
`;

      const v: ArtifactVersion = {
        version: versions.length + 1,
        plan: researchPlan,
        interview: interviewGuide,
        fullContent,
        createdAt: new Date().toLocaleString('zh-CN'),
      };
      setVersions((prev) => [...prev, v]);
      setSelectedVersionIndex(versions.length);
      setRefineInput('');
      setRefineQuestions([]);
      setRefineAnswers({});
      setRefineCurrentIndex(0);
      setRefineMode('idle');
    } catch (e) {
      console.error(e);
      alert('修改方案失败，请重试');
      setRefineMode('idle');
    }
  };

  const current = questions[currentIndex];
  const currentPicked = current ? (answers[current.id] || []) : [];
  const isDone = currentIndex >= 5;

  const refineCurrent = refineQuestions[refineCurrentIndex];
  const refineCurrentPicked = refineCurrent ? (refineAnswers[refineCurrent.id] || []) : [];

  const activeVersion = versions[selectedVersionIndex];

  if (isClassifying) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="bg-surface p-8 rounded-xl border border-white/10 text-center max-w-md">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-lg font-bold text-white mb-2">AI 正在分析您的研究问题</div>
          <div className="text-sm text-gray-400 mb-4">正在识别研究类型和分析框架...</div>
          <div className="text-xs text-gray-500"><div className="mb-1">⏱️ 预计需要 3-5 秒</div><div>🚀 使用 DeepSeek 高速推理</div></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      <div className="flex-1 overflow-y-auto p-12 border-r border-white/10">
        <div className="max-w-3xl mx-auto space-y-6">
          {questions.slice(0, currentIndex).map((q, idx) => (
            <div key={q.id} className="space-y-3">
              <div className="text-xs text-primary font-bold">问题 {idx + 1}</div>
              <div className="bg-surface p-5 rounded-xl border border-white/10">
                <div className="text-sm font-bold mb-3">{q.title}</div>
                <div className="space-y-2">
                  {q.options.map((option) => {
                    const selected = (answers[q.id] ?? []).includes(option);
                    return (
                      <div key={option} className={`p-3 text-sm rounded border ${selected ? 'border-primary bg-primary/10 text-primary' : 'border-white/10 text-gray-300'}`}>{option}</div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}

          {!isDone && current && (
            <div className="space-y-3">
              <div className="text-xs text-primary font-bold">问题 {currentIndex + 1}</div>
              <div className="bg-surface p-6 rounded-xl border border-primary/40">
                <div className="text-sm font-bold mb-4">{current.title}</div>
                <div className="grid grid-cols-2 gap-3">
                  {current.options.map((option) => {
                    const selected = currentPicked.includes(option);
                    return (
                      <button key={option} onClick={() => (current.mode === 'single' ? submitAnswer([option]) : toggleMulti(option))} disabled={isThinking} className={`p-3 text-left rounded border transition-colors ${selected ? 'border-primary bg-primary/10 text-primary' : 'border-white/10 hover:bg-white/5'} ${isThinking ? 'opacity-50 cursor-not-allowed' : ''}`}>{option}</button>
                    );
                  })}
                </div>
                {current.mode !== 'single' && (
                  <button onClick={() => submitAnswer(currentPicked)} disabled={isThinking || currentPicked.length === 0} className="mt-4 w-full bg-primary text-black px-4 py-2 font-bold rounded disabled:opacity-50">确认选择</button>
                )}
              </div>
            </div>
          )}

          {isThinking && (
            <div className="bg-surface p-6 rounded-xl border border-white/10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm font-bold text-white">AI 正在思考...</span>
              </div>
              <div className="space-y-2">
                {thinkingSteps.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm text-gray-400 animate-fade-in"><span className="text-primary mt-0.5">▸</span><span>{step}</span></div>
                ))}
              </div>
            </div>
          )}

          {refineMode === 'generating' && (
            <div className="bg-surface p-6 rounded-xl border border-white/10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm font-bold text-white">AI 正在修改方案...</span>
              </div>
              <div className="text-sm text-gray-400">请稍候，正在根据您的反馈生成新版本</div>
            </div>
          )}

          <div ref={chatBottomRef}></div>

          {isDone && !isThinking && (
            <>
              <div className="bg-surface p-6 rounded-xl border border-white/10">
                <div className="text-sm font-bold mb-2">动态核验已完成</div>
                <div className="text-xs text-gray-400 mb-4">5/5 题已确认，系统已生成初步方案</div>
                <div className="text-xs text-gray-500 mb-4">点击下方卡片查看详细内容</div>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => handleGenerateArtifact('plan')} className={`p-4 rounded-lg border-2 transition-all text-left ${selectedArtifact === 'plan' ? 'border-primary bg-primary/10' : 'border-white/10 hover:border-white/20 bg-surface-hover'}`}>
                    <div className="flex items-center gap-2 mb-2"><FileText size={18} className="text-primary" /><span className="text-sm font-bold text-white">调研方案</span></div>
                    <p className="text-xs text-gray-400">研究背景、方法论、执行计划</p>
                  </button>
                  <button onClick={() => handleGenerateArtifact('interview')} className={`p-4 rounded-lg border-2 transition-all text-left ${selectedArtifact === 'interview' ? 'border-primary bg-primary/10' : 'border-white/10 hover:border-white/20 bg-surface-hover'}`}>
                    <div className="flex items-center gap-2 mb-2"><User size={18} className="text-primary" /><span className="text-sm font-bold text-white">访谈大纲</span></div>
                    <p className="text-xs text-gray-400">结构化访谈问题设计</p>
                  </button>
                </div>
              </div>

              {versions.length > 0 && refineMode !== 'questioning' && (
                <div className="bg-surface p-4 rounded-xl border border-white/10">
                  <div className="text-xs text-gray-400 mb-2">对方案不满意？输入修改需求继续对话</div>
                  <div className="flex gap-2">
                    <input value={refineInput} onChange={(e) => setRefineInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleRefineSubmit()} placeholder="例如：希望增加竞争对手分析、样本量扩大到50人..." className="flex-1 bg-black/30 border border-white/10 rounded px-3 py-2 text-sm text-white placeholder:text-gray-600 outline-none focus:border-primary" />
                    <button onClick={handleRefineSubmit} className="bg-primary text-black px-4 py-2 rounded font-bold text-sm hover:bg-primary/90">发送</button>
                  </div>
                </div>
              )}

              {refineMode === 'questioning' && (
                <div className="space-y-6">
                  <div className="text-sm text-gray-300">为了更好地理解您的需求，请回答以下问题：</div>
                  {refineQuestions.slice(0, refineCurrentIndex).map((q, idx) => (
                    <div key={q.id} className="space-y-3">
                      <div className="text-xs text-primary font-bold">追问 {idx + 1}</div>
                      <div className="bg-surface p-5 rounded-xl border border-white/10">
                        <div className="text-sm font-bold mb-3">{q.title}</div>
                        <div className="space-y-2">
                          {q.options.map((option) => {
                            const selected = (refineAnswers[q.id] ?? []).includes(option);
                            return (
                              <div key={option} className={`p-3 text-sm rounded border ${selected ? 'border-primary bg-primary/10 text-primary' : 'border-white/10 text-gray-300'}`}>{option}</div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                  {refineCurrent && (
                    <div className="space-y-3">
                      <div className="text-xs text-primary font-bold">追问 {refineCurrentIndex + 1}</div>
                      <div className="bg-surface p-6 rounded-xl border border-primary/40">
                        <div className="text-sm font-bold mb-4">{refineCurrent.title}</div>
                        <div className="grid grid-cols-2 gap-3">
                          {refineCurrent.options.map((option) => {
                            const selected = refineCurrentPicked.includes(option);
                            return (
                              <button key={option} onClick={() => (refineCurrent.mode === 'single' ? submitRefineAnswer([option]) : toggleRefineMulti(option))} className={`p-3 text-left rounded border transition-colors ${selected ? 'border-primary bg-primary/10 text-primary' : 'border-white/10 hover:bg-white/5'}`}>{option}</button>
                            );
                          })}
                        </div>
                        {refineCurrent.mode !== 'single' && (
                          <button onClick={() => submitRefineAnswer(refineCurrentPicked)} disabled={refineCurrentPicked.length === 0} className="mt-4 w-full bg-primary text-black px-4 py-2 font-bold rounded disabled:opacity-50">确认选择</button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <button onClick={() => { const answersArray = Object.entries(answers).map(([qId, ans]) => ({ question: questions.find(q => q.id === qId)?.title ?? '', answer: ans })); onNext(classification, answersArray, activeVersion); }} className="w-full bg-primary text-black px-8 py-3 font-bold flex items-center justify-center gap-2 hover:bg-primary/90 rounded-lg">
                确认方案，进入下一步 <ArrowRight size={18} />
              </button>
            </>
          )}
        </div>
      </div>

      {isDone && isPanelVisible && (
        <div className="w-1/2 overflow-y-auto bg-white text-black relative">
          <button onClick={() => setIsPanelVisible(false)} className="absolute top-4 right-4 z-10 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors" title="隐藏面板">✕</button>
          {isGeneratingPlan && (
            <div className="h-full flex items-center justify-center p-12">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-sm text-gray-600">正在生成{selectedArtifact === 'plan' ? '调研方案' : '访谈大纲'}...</p>
              </div>
            </div>
          )}
          {!isGeneratingPlan && versions.length > 0 && (
            <div className="p-16 max-w-4xl mx-auto">
              <div className="flex items-center gap-2 mb-8 border-b border-gray-200 pb-4">
                <span className="text-sm text-gray-600 font-bold">版本：</span>
                <div className="flex gap-2">
                  {versions.map((v, idx) => (
                    <button key={v.version} onClick={() => setSelectedVersionIndex(idx)} className={`px-3 py-1 rounded text-sm border transition-colors ${selectedVersionIndex === idx ? 'bg-black text-white border-black' : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'}`}>v{v.version}.0</button>
                  ))}
                </div>
                {activeVersion && <span className="ml-auto text-xs text-gray-400">生成时间：{activeVersion.createdAt}</span>}
              </div>

              {selectedArtifact === 'plan' && activeVersion?.plan && (
                <div className="space-y-10 text-base leading-relaxed">
                  <div className="mb-12"><h1 className="text-4xl font-bold mb-4">调研方案</h1><div className="text-sm text-gray-600 mb-2">生成时间：{activeVersion.createdAt}</div><div className="h-1 bg-black w-20"></div></div>
                  {activeVersion.plan.background && activeVersion.plan.background !== '待补充' && (
                    <section><h2 className="text-2xl font-bold mb-4">一、研究背景</h2><div className="text-gray-800 leading-loose whitespace-pre-wrap">{activeVersion.plan.background}</div></section>
                  )}
                  {activeVersion.plan.theme && activeVersion.plan.theme !== '待补充' && (
                    <section><h2 className="text-2xl font-bold mb-4">二、研究主题</h2><div className="text-gray-800 leading-loose">{activeVersion.plan.theme}</div></section>
                  )}
                  {activeVersion.plan.coreQuestion && activeVersion.plan.coreQuestion !== '待补充' && (
                    <section><h2 className="text-2xl font-bold mb-4">三、核心研究问题</h2><div className="text-gray-800 leading-loose">{activeVersion.plan.coreQuestion}</div></section>
                  )}
                  {activeVersion.plan.methodology && activeVersion.plan.methodology !== '待补充' && (
                    <section><h2 className="text-2xl font-bold mb-4">四、研究方法</h2><div className="text-gray-800 leading-loose whitespace-pre-wrap">{activeVersion.plan.methodology}</div></section>
                  )}
                  {activeVersion.plan.targetAudience && activeVersion.plan.targetAudience !== '待补充' && (
                    <section><h2 className="text-2xl font-bold mb-4">五、目标受众</h2><div className="text-gray-800 leading-loose whitespace-pre-wrap">{activeVersion.plan.targetAudience}</div></section>
                  )}
                  {activeVersion.plan.executionPlan && activeVersion.plan.executionPlan !== '待补充' && (
                    <section><h2 className="text-2xl font-bold mb-4">六、执行方案</h2><div className="text-gray-800 leading-loose whitespace-pre-wrap">{activeVersion.plan.executionPlan}</div></section>
                  )}
                  {activeVersion.plan.expectedOutput && activeVersion.plan.expectedOutput !== '待补充' && (
                    <section><h2 className="text-2xl font-bold mb-4">七、预期产出</h2><div className="text-gray-800 leading-loose whitespace-pre-wrap">{activeVersion.plan.expectedOutput}</div></section>
                  )}
                </div>
              )}

              {selectedArtifact === 'interview' && activeVersion?.interview && (
                <div className="space-y-10 text-base leading-relaxed">
                  <div className="mb-12"><h1 className="text-4xl font-bold mb-4">访谈大纲</h1><div className="text-sm text-gray-600 mb-2">生成时间：{activeVersion.createdAt}</div><div className="h-1 bg-black w-20"></div></div>
                  {activeVersion.interview.map((section: any, sidx: number) => (
                    <section key={sidx}>
                      <h2 className="text-2xl font-bold mb-4">{section.title}</h2>
                      <ol className="list-decimal ml-6 space-y-3 text-gray-800">
                        {section.questions.map((q: string, qidx: number) => (
                          <li key={qidx}>{q}</li>
                        ))}
                      </ol>
                    </section>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {isDone && !isPanelVisible && selectedArtifact && (
        <button onClick={() => setIsPanelVisible(true)} className="fixed right-4 top-1/2 -translate-y-1/2 bg-primary text-black px-4 py-3 rounded-l-lg font-bold shadow-lg hover:bg-primary/90 transition-all z-10">
          <span className="writing-mode-vertical">查看{selectedArtifact === 'plan' ? '调研方案' : '访谈大纲'}</span>
        </button>
      )}
    </div>
  );
}
function StepVerify({ userInput, onNext }: { userInput: string; onNext: (classification: any, answers: Array<{ question: string; answer: string[] }>) => void }) {
  type Question = { id: string; mode: 'single' | 'multi' | 'multiple'; title: string; options: string[] };
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [isThinking, setIsThinking] = useState(false);
  const [classification, setClassification] = useState<any>(null);
  const [isClassifying, setIsClassifying] = useState(true);

  const generateNextQuestion = async (cls: any, previousAnswers: Array<{ question: string; answer: string[] }>) => {
    try {
      const response = await fetch('/api/generate-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userInput,
          classification: cls,
          previousAnswers,
          round: previousAnswers.length + 1,
        }),
      });

      if (!response.ok) {
        throw new Error(`API 返回错误: ${response.status}`);
      }

      const result = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      return result.question;
    } catch (error) {
      console.error('生成问题失败:', error);
      // 返回一个默认问题，避免卡住
      return {
        id: `q${previousAnswers.length + 1}`,
        mode: 'single' as const,
        title: `请选择第 ${previousAnswers.length + 1} 个研究参数`,
        options: ['选项 A', '选项 B', '选项 C', '选项 D'],
      };
    }
  };

  // 初始化：调用 classifier 判断研究类型
  useEffect(() => {
    const classifyResearch = async () => {
      try {
        const response = await fetch('/api/classify-research', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userInput }),
        });
        if (!response.ok) {
          throw new Error(`classify-research HTTP ${response.status}`);
        }
        const result = await response.json();
        setClassification(result);
        const firstQuestion = await generateNextQuestion(result, []);
        setQuestions([firstQuestion]);
      } catch (error) {
        console.error('分类失败:', error);
        setClassification({ ...OFFLINE_RESEARCH_CLASSIFICATION });
        const firstQuestion = await generateNextQuestion(OFFLINE_RESEARCH_CLASSIFICATION, []);
        setQuestions([firstQuestion]);
      } finally {
        setIsClassifying(false);
      }
    };
    classifyResearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userInput]);

  const current = questions[currentIndex];
  const currentPicked = answers[current?.id] ?? [];
  const isDone = currentIndex >= 5; // 固定 5 轮验证

  const submitAnswer = async (picked: string[]) => {
    if (!current) return;

    console.log('提交答案:', {
      questionId: current.id,
      answer: picked,
      currentIndex,
      totalQuestions: questions.length
    });

    setAnswers((prev) => ({ ...prev, [current.id]: picked }));
    setIsThinking(true);

    try {
      // 如果还没到 5 轮，生成下一题
      if (currentIndex < 4) {
        const previousAnswers = Object.entries({ ...answers, [current.id]: picked }).map(([qId, ans]) => ({
          question: questions.find(q => q.id === qId)?.title ?? '',
          answer: ans,
        }));

        console.log('生成下一题，当前轮次:', currentIndex + 1, '历史答案:', previousAnswers);

        const nextQuestion = await generateNextQuestion(classification, previousAnswers);

        console.log('下一题生成成功:', nextQuestion);

        setQuestions((prev) => [...prev, nextQuestion]);
      }

      // 等待 API 调用完成后再更新索引
      setTimeout(() => {
        setIsThinking(false);
        setCurrentIndex((prev) => prev + 1);
        console.log('更新索引到:', currentIndex + 1);
      }, 300);
    } catch (error) {
      console.error('生成下一题失败:', error);
      setIsThinking(false);
      // 即使失败也继续，避免卡住
      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
      }, 300);
    }
  };

  const toggleMulti = (option: string) => {
    if (!current) return;
    const set = new Set(currentPicked);
    if (set.has(option)) set.delete(option);
    else set.add(option);
    setAnswers((prev) => ({ ...prev, [current.id]: Array.from(set) }));
  };

  if (isClassifying) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="bg-surface p-8 rounded-xl border border-white/10 text-center max-w-md">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-lg font-bold text-white mb-2">AI 正在分析您的研究问题</div>
          <div className="text-sm text-gray-400 mb-4">
            正在识别研究类型和分析框架...
          </div>
          <div className="text-xs text-gray-500">
            <div className="mb-1">⏱️ 预计需要 3-5 秒</div>
            <div>🚀 使用 DeepSeek 高速推理</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-12">
      <div className="max-w-4xl mx-auto space-y-6">
        {questions.slice(0, currentIndex).map((q, idx) => (
          <div key={q.id} className="space-y-3">
            <div className="text-xs text-primary font-bold">问题 {idx + 1}</div>
            <div className="bg-surface p-5 rounded-xl border border-white/10">
              <div className="text-sm font-bold mb-3">{q.title}</div>
              <div className="space-y-2">
                {q.options.map((option) => {
                  const selected = (answers[q.id] ?? []).includes(option);
                  return (
                    <div
                      key={option}
                      className={`p-3 text-sm rounded border ${
                        selected ? 'border-primary bg-primary/10 text-primary' : 'border-white/10 text-gray-300'
                      }`}
                    >
                      {option}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}

        {!isDone && current && (
          <div className="space-y-3">
            <div className="text-xs text-primary font-bold">问题 {currentIndex + 1}</div>
            <div className="bg-surface p-6 rounded-xl border border-primary/40">
              <div className="text-sm font-bold mb-4">{current.title}</div>
              <div className="grid grid-cols-2 gap-3">
                {current.options.map((option) => {
                  const selected = currentPicked.includes(option);
                  return (
                    <button
                      key={option}
                      onClick={() => (current.mode === 'single' ? submitAnswer([option]) : toggleMulti(option))}
                      disabled={isThinking}
                      className={`p-3 text-left rounded border transition-colors ${
                        selected ? 'border-primary bg-primary/10 text-primary' : 'border-white/10 hover:bg-white/5'
                      } ${isThinking ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
              {(current.mode === 'multi' || current.mode === 'multiple') && (
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => submitAnswer(currentPicked)}
                    disabled={currentPicked.length === 0}
                    className="bg-primary text-black px-5 py-2 rounded font-bold disabled:opacity-50"
                  >
                    确认本题
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {isThinking && (
          <div className="bg-surface p-4 rounded-xl border border-white/10 text-sm text-gray-300 flex items-center gap-3">
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
            AI 正在思考并生成下一题...
          </div>
        )}

        {isDone && !isThinking && (
          <div className="bg-surface p-6 rounded-xl border border-white/10 flex items-center justify-between">
            <div>
              <div className="text-sm font-bold">动态核验已完成</div>
              <div className="text-xs text-gray-400 mt-1">5/5 题已确认，系统将进入下一阶段。</div>
            </div>
            <button onClick={() => {
              const answersArray = Object.entries(answers).map(([qId, ans]) => ({
                question: questions.find(q => q.id === qId)?.title ?? '',
                answer: ans
              }));
              onNext(classification, answersArray);
            }} className="bg-primary text-black px-8 py-3 font-bold flex items-center gap-2 hover:bg-primary/90">
              生成初步方案 <ArrowRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function EditablePanel({
  placeholder,
  initialContent = '',
}: {
  placeholder: string;
  initialContent?: string;
}) {
  const [content, setContent] = useState(initialContent);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleVoiceInput = () => {
    const SpeechRecognitionCtor =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      window.alert('当前浏览器不支持语音输入');
      return;
    }
    const recognition = new SpeechRecognitionCtor();
    recognition.lang = 'zh-CN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript ?? '';
      if (transcript) setInput((prev) => `${prev}${prev ? ' ' : ''}${transcript}`);
    };
    recognition.start();
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text || isSending) return;
    setIsSending(true);
    setTimeout(() => {
      setContent(`${content}\n\n[AI 根据指令更新] ${text}`);
      setInput('');
      setIsSending(false);
    }, 450);
  };

  return (
    <div className="p-4 border-t border-white/10">
      {initialContent ? <div className="text-xs text-gray-400 mb-3 whitespace-pre-line">{content}</div> : null}
      <div className="bg-white/5 rounded p-2 flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder={placeholder}
          className="flex-1 bg-transparent border-none rounded p-2 text-sm focus:ring-1 focus:ring-primary outline-none"
        />
        <button onClick={handleVoiceInput} className="text-gray-400 hover:text-white p-2" title="语音输入">
          <Mic size={16} />
        </button>
        <button
          onClick={handleSend}
          disabled={isSending || !input.trim()}
          className="px-3 py-2 text-xs font-bold bg-primary text-black rounded disabled:opacity-50"
        >
          发送
        </button>
      </div>
    </div>
  );
}

function StepThreeColumn({
  userInput,
  classification,
  verificationAnswers,
  onNext
}: {
  userInput: string;
  classification: any;
  verificationAnswers: Array<{ question: string; answer: string[] }>;
  onNext: () => void;
}) {
  const [isGenerating, setIsGenerating] = useState(true);
  const [researchPlan, setResearchPlan] = useState({
    background: '',
    theme: '',
    coreQuestion: '',
    methodology: '',
    targetAudience: '',
    executionPlan: '',
    expectedOutput: ''
  });
  const [interviewGuide, setInterviewGuide] = useState<Array<{ title: string; questions: string[] }>>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const generatePlan = async () => {
      setIsGenerating(true);
      setError(null);

      try {
        console.log('模拟生成方案:', { userInput, verificationAnswers: verificationAnswers.length });

        // 模拟 API 延迟
        await new Promise(resolve => setTimeout(resolve, 2000));

        // 模拟数据
        setResearchPlan({
          background: `在当前新能源汽车市场快速发展的背景下，年轻消费群体（18-35岁）正成为新能源车的主要潜在购买者。这一群体成长于互联网时代，对科技产品接受度高，同时也更关注环保和可持续发展。

然而，尽管新能源车市场增长迅速，年轻人对新能源车的认知、态度和购买意愿仍存在较大差异。部分年轻人对续航里程、充电便利性、智能化体验等方面存在顾虑，这些因素直接影响其购买决策。

因此，深入了解年轻人对新能源车的真实看法、核心关注点和决策动机，对于产品优化、营销策略制定和用户体验提升具有重要意义。`,

          theme: '年轻人（18-35岁）对新能源汽车的认知、态度与购买决策研究',

          coreQuestion: '年轻人在考虑购买新能源车时，核心关注点是什么？哪些因素促进或阻碍了他们的购买决策？',

          methodology: `本研究采用定性研究为主、定量验证为辅的混合方法：

**定性研究**：
- 深度访谈（1对1）：15-20 人，每人 60 分钟
- 焦点小组讨论：2 组，每组 6-8 人，每组 90 分钟

**定量研究**：
- 在线问卷调查：200-300 份，用于验证定性研究中的关键发现

**分析方法**：
- 主题分析（Thematic Analysis）：识别核心主题和模式
- JTBD 框架分析：理解用户试图完成的任务和期望结果
- 用户旅程地图：绘制从认知到购买的完整决策路径`,

          targetAudience: `**目标人群定义**：
- 年龄：18-35 岁
- 职业：在校大学生、职场新人、成熟职场人
- 地域：一线及新一线城市（北上广深、杭州、成都等）
- 用车需求：有购车计划或正在考虑购车

**样本量**：
- 深度访谈：15-20 人
- 焦点小组：12-16 人（2 组）
- 在线问卷：200-300 份

**招募标准**：
- 必须条件：年龄符合、有购车需求或兴趣
- 优先条件：已试驾过新能源车、关注汽车资讯
- 排除条件：已购买新能源车超过 1 年（避免后验偏差）

**人群细分**：
1. 理性派（30%）：重视参数、性价比、实用性
2. 体验派（40%）：重视驾驶感受、智能化、设计美学
3. 环保派（30%）：重视可持续性、品牌价值观、社会责任`,

          executionPlan: `**时间规划**（共 6 周）：
- Week 1-2：招募筛选、预约安排
- Week 3-4：深度访谈执行（15-20 场）
- Week 5：焦点小组执行（2 场）+ 问卷发放
- Week 6：数据分析、报告撰写

**资源需求**：
- 研究团队：主研究员 1 人 + 助理研究员 1 人
- 招募渠道：社交媒体（小红书、微博）、汽车社群、高校合作
- 场地：访谈室（安静、私密）、焦点小组室（可容纳 8-10 人）
- 设备：录音设备、转录工具、在线问卷平台
- 激励：深度访谈 200-300 元/人，焦点小组 150-200 元/人

**关键里程碑**：
- M1（Week 2 结束）：完成 15-20 人招募和筛选
- M2（Week 4 结束）：完成所有深度访谈和初步分析
- M3（Week 5 结束）：完成焦点小组和问卷回收
- M4（Week 6 结束）：交付最终研究报告`,

          expectedOutput: `1. **用户画像报告**：3 类典型用户画像（理性派/体验派/环保派），包含人口特征、心理特征、行为模式、需求痛点

2. **核心洞察报告**：
   - 年轻人对新能源车的认知现状和误区
   - 购买决策的关键影响因素（Top 5）
   - 续航焦虑的真实程度和触发场景
   - 智能化功能的期望与实际使用差异

3. **决策路径图**：从认知到购买的完整旅程，标注关键触点、情感曲线、痛点和峰值时刻

4. **产品优化建议**：基于用户反馈的产品功能、体验、营销策略优化建议（Top 3-5 条，可执行）

5. **原始数据包**：访谈录音转录、焦点小组记录、问卷数据（匿名化处理）`
        });

        setInterviewGuide([
          {
            title: 'Part A: 破冰环节（5-10 分钟）',
            questions: [
              '能否简单介绍一下您的工作/学习情况和日常出行方式？',
              '您平时主要用什么交通工具？为什么选择这种方式？',
              '您对汽车的了解程度如何？（小白/爱好者/专家）',
              '最近有没有关注过新能源车相关的信息？在哪里看到的？',
              '您身边有朋友或家人开新能源车吗？他们的反馈如何？'
            ]
          },
          {
            title: 'Part B: 核心探索 - 主题 1：新能源车认知与态度（10 分钟）',
            questions: [
              '当我提到"新能源车"时，您脑海中第一个浮现的是什么？（品牌/产品/感受）',
              '您觉得新能源车和传统燃油车最大的区别是什么？',
              '如果让您用三个词形容新能源车，会是哪三个词？为什么？',
              '您对新能源车的整体印象是正面的还是负面的？能具体说说吗？'
            ]
          },
          {
            title: 'Part B: 核心探索 - 主题 2：续航与充电（10 分钟）',
            questions: [
              '您听说过"续航焦虑"吗？您自己会有这种担心吗？',
              '在什么情况下，您会特别担心续航问题？（日常通勤/长途旅行/极端天气）',
              '您对充电的便利性有什么期望？理想的充电体验是什么样的？',
              '如果续航能达到 600 公里，您会觉得够用吗？为什么？',
              '您更倾向于在家充电、公司充电，还是使用公共充电桩？'
            ]
          },
          {
            title: 'Part B: 核心探索 - 主题 3：智能化体验（10 分钟）',
            questions: [
              '您对"智能汽车"的理解是什么？哪些功能对您来说是必需的？',
              '您用过车载智能系统吗？（导航/语音助手/娱乐系统）体验如何？',
              '自动驾驶功能对您有吸引力吗？您会愿意为此支付额外费用吗？',
              '您更看重智能化的哪些方面？（语音交互/导航/娱乐/安全辅助）',
              '您担心智能系统的隐私和数据安全问题吗？'
            ]
          },
          {
            title: 'Part B: 核心探索 - 主题 4：购买决策（10 分钟）',
            questions: [
              '如果现在让您选择一辆车（不限新能源或燃油），您最看重的三个因素是什么？',
              '价格是您考虑新能源车的主要障碍吗？您的预算大概是多少？',
              '您会参考哪些信息来源做购买决策？（朋友推荐/网络评测/试驾体验）',
              '品牌对您的购买决策有多重要？您更倾向于传统车企还是新势力品牌？'
            ]
          },
          {
            title: 'Part C: 深挖与收尾（10-15 分钟）',
            questions: [
              '假设有两辆车，一辆续航 700 公里但智能化一般，一辆续航 500 公里但智能化很强，您会选哪个？为什么？',
              '如果让您给新能源车厂商提一个建议，您会说什么？',
              '您觉得什么情况下，您会真正考虑购买一辆新能源车？',
              '还有什么关于新能源车的想法或顾虑，是我们没有聊到的？',
              '非常感谢您的分享！您的意见对我们非常有价值。'
            ]
          }
        ]);

        setIsGenerating(false);
      } catch (error) {
        console.error('生成方案失败:', error);
        setError(error instanceof Error ? error.message : '生成失败');
        setIsGenerating(false);
      }
    };

    generatePlan();
  }, [userInput, verificationAnswers, classification]);

  if (isGenerating) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="bg-surface p-8 rounded-xl border border-white/10 text-center max-w-md">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-lg font-bold text-white mb-2">AI 正在生成调研方案</div>
          <div className="text-sm text-gray-400 mb-4">
            根据您的研究目标和核验结果，正在生成专业的调研方案和访谈大纲...
          </div>
          <div className="text-xs text-gray-500">
            <div className="mb-1">⏱️ 预计需要 10-20 秒</div>
            <div>🚀 使用商业分析师提示词框架</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-8 overflow-hidden">
      {error && (
        <div className="mb-4 bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-sm text-red-400">
          ⚠️ 生成失败：{error}。已使用默认内容，您可以手动编辑。
        </div>
      )}
      <div className="flex-1 grid grid-cols-2 gap-6 overflow-hidden">
        {/* Col 1: 调研方案 */}
        <div className="bg-surface rounded-xl flex flex-col overflow-hidden">
          <div className="p-6 flex-1 overflow-y-auto">
            <h3 className="text-2xl font-bold mb-6">调研方案</h3>
            <div className="space-y-6 text-sm text-gray-300 leading-relaxed">
              <div>
                <div className="text-xs text-primary font-bold mb-2">研究背景</div>
                <div className="whitespace-pre-wrap">{researchPlan.background}</div>
              </div>
              <div>
                <div className="text-xs text-primary font-bold mb-2">研究主题</div>
                <div className="whitespace-pre-wrap">{researchPlan.theme}</div>
              </div>
              <div>
                <div className="text-xs text-primary font-bold mb-2">核心研究问题</div>
                <div className="whitespace-pre-wrap">{researchPlan.coreQuestion}</div>
              </div>
              <div>
                <div className="text-xs text-primary font-bold mb-2">研究方法</div>
                <div className="whitespace-pre-wrap">{researchPlan.methodology}</div>
              </div>
              <div>
                <div className="text-xs text-primary font-bold mb-2">人群选择</div>
                <div className="whitespace-pre-wrap">{researchPlan.targetAudience}</div>
              </div>
              <div>
                <div className="text-xs text-primary font-bold mb-2">执行方案</div>
                <div className="whitespace-pre-wrap">{researchPlan.executionPlan}</div>
              </div>
              <div>
                <div className="text-xs text-primary font-bold mb-2">预期产出</div>
                <div className="whitespace-pre-wrap">{researchPlan.expectedOutput}</div>
              </div>
            </div>
          </div>
          <EditablePanel placeholder="微调方案指令..." />
        </div>

        {/* Col 2: 访谈大纲 */}
        <div className="bg-surface rounded-xl flex flex-col overflow-hidden">
          <div className="p-6 flex-1 overflow-y-auto">
            <h3 className="text-2xl font-bold mb-6">访谈大纲</h3>
            <div className="space-y-6">
              {interviewGuide.map((section, idx) => (
                <div key={idx} className="border-b border-white/10 pb-4 last:border-b-0">
                  <div className="text-xs text-primary mb-3 font-bold">{section.title}</div>
                  <div className="space-y-2">
                    {section.questions.map((question, qIdx) => (
                      <div key={qIdx} className="text-sm text-gray-300 flex gap-2">
                        <span className="text-primary shrink-0">{qIdx + 1}.</span>
                        <span>{question}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <EditablePanel placeholder="微调大纲逻辑..." />
        </div>
      </div>

      {/* 底部按钮 */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={onNext}
          className="bg-primary text-black px-8 py-3 rounded-lg font-bold hover:bg-primary/90 transition-colors flex items-center gap-2"
        >
          查看人设详情 <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}

function StepAudience({ onNext }: { onNext: () => void }) {
  const [profiles, setProfiles] = useState([
    { id: 'c1', name: '理性先锋型', tags: ['高净值', '智驾优先', '效率导向'], users: 128, voc: 542 },
    { id: 'c2', name: '家庭安全型', tags: ['家庭用户', '空间诉求', '安全敏感'], users: 106, voc: 497 },
    { id: 'c3', name: '环保极简型', tags: ['可持续偏好', '极简审美', '材质敏感'], users: 94, voc: 451 },
    { id: 'c4', name: '科技尝鲜型', tags: ['数字原生', '功能探索', '社媒活跃'], users: 113, voc: 533 },
    { id: 'c5', name: '品牌认同型', tags: ['品牌价值', '长期主义', '口碑驱动'], users: 102, voc: 468 },
  ]);
  const [selectedProfileId, setSelectedProfileId] = useState('c1');
  const [personas, setPersonas] = useState([
    { id: 'p1', profileId: 'c1', name: '陈思远', tags: ['科技极客', '高净值'], score: 8.8, conf: 93, cdpTags: ['智驾优先', '高净值', '效率导向'], voc: '我希望车辆主动发现风险并接管平顺。', radar: [82, 90, 84, 76, 92, 95, 70] },
    { id: 'p2', profileId: 'c1', name: '林沐然', tags: ['精致生活家', '安全控'], score: 9.1, conf: 95, cdpTags: ['家庭用户', '安全敏感', '材质关注'], voc: '环保材料不是口号，体验和质感必须同时在线。', radar: [80, 86, 88, 74, 94, 83, 79] },
    { id: 'p2-1', profileId: 'c2', name: '周祺', tags: ['家庭安全', '空间导向'], score: 8.7, conf: 92, cdpTags: ['家庭用户', '空间诉求', '安全敏感'], voc: '后排空间和主动安全是我购车决策第一优先级。', radar: [84, 81, 78, 73, 93, 79, 88] },
    { id: 'p3-1', profileId: 'c3', name: '许悠然', tags: ['环保主义', '极简'], score: 8.9, conf: 91, cdpTags: ['可持续偏好', '极简审美', '材质敏感'], voc: '我希望环保材料不仅环保，还要有高级触感和设计统一性。', radar: [79, 85, 90, 72, 89, 82, 76] },
    { id: 'p3', profileId: 'c4', name: '张逸豪', tags: ['都市先锋', 'Z世代'], score: 9.3, conf: 96, cdpTags: ['数字原生', '尝鲜驱动', '社媒活跃'], voc: '我会先看真实测评，再决定是否愿意信任品牌叙事。', radar: [76, 95, 87, 90, 82, 97, 74] },
    { id: 'p5-1', profileId: 'c5', name: '宋致远', tags: ['长期主义', '品牌认同'], score: 8.6, conf: 90, cdpTags: ['品牌价值', '长期主义', '口碑驱动'], voc: '我更看重品牌长期信誉和真实用户口碑，而非短期营销话术。', radar: [81, 83, 77, 75, 85, 78, 91] },
  ]);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<typeof profiles[0] | null>(null);
  const [selectedPrimaryTag, setSelectedPrimaryTag] = useState<string | null>(null);
  const [selectedSecondaryTags, setSelectedSecondaryTags] = useState<string[]>([]);

  // CDP标签库定义（参考人设库管理）
  const primaryTags = ['身份与基础属性', '社会与人口统计', '购车决策与潜客行为', '车辆使用与售后服务', '数字触点与线上行为', '品牌认知与情感连接'];

  const secondaryTags: Record<string, string[]> = {
    '身份与基础属性': ['年龄段', '职业类型', '收入水平', '教育背景', '家庭结构'],
    '社会与人口统计': ['城市等级', '居住区域', '婚姻状况', '子女情况', '生活方式'],
    '购车决策与潜客行为': ['购车动机', '决策周期', '信息渠道', '试驾偏好', '价格敏感度'],
    '车辆使用与售后服务': ['用车场景', '里程需求', '保养频率', '服务期望', '品牌忠诚度'],
    '数字触点与线上行为': ['社交平台', '内容偏好', '互动频率', '设备使用', '数字素养'],
    '品牌认知与情感连接': ['品牌认知', '情感倾向', '价值观匹配', '推荐意愿', '社群参与']
  };

  const selectedPersona = personas.find((p) => p.id === selectedPersonaId) ?? null;
  const filteredPersonas = personas.filter((p) => p.profileId === selectedProfileId || p.profileId === 'all');

  // 如果历史生成的人设 name 里包含“xxxx型”（如“理性先锋型A/B”），则按 profileId 映射回默认姓名，避免在卡片标题中展示“xxxx型”。
  const defaultPersonaNamesByProfileId: Record<string, string[]> = {
    c1: ['陈思远', '林沐然'],
    c2: ['周祺'],
    c3: ['许悠然'],
    c4: ['张逸豪'],
    c5: ['宋致远'],
  };

  const getPersonaDisplayName = (p: any) => {
    const rawName = p?.name ?? '';
    const profileId = p?.profileId;
    if (!rawName) return rawName;
    if (!rawName.includes('型')) return rawName;

    const letter = rawName.endsWith('A') ? 'A' : rawName.endsWith('B') ? 'B' : null;
    const candidates = defaultPersonaNamesByProfileId[profileId] ?? [];
    if (!candidates.length) return rawName;

    if (letter === 'A') return candidates[0] ?? rawName;
    if (letter === 'B') return candidates[1] ?? candidates[0] ?? rawName;
    return candidates[0] ?? rawName;
  };

  // 计算筛选后的users和voc数量
  const calculateFilteredCounts = () => {
    if (!selectedPrimaryTag && selectedSecondaryTags.length === 0) {
      return editingProfile ? { users: editingProfile.users, voc: editingProfile.voc } : { users: 0, voc: 0 };
    }

    // 模拟筛选逻辑：根据选择的标签减少数量
    const baseUsers = editingProfile?.users ?? 0;
    const baseVoc = editingProfile?.voc ?? 0;
    const reductionFactor = 0.7 + (selectedSecondaryTags.length * 0.05); // 每多选一个二级标签，减少5%

    return {
      users: Math.floor(baseUsers * reductionFactor),
      voc: Math.floor(baseVoc * reductionFactor)
    };
  };

  const filteredCounts = calculateFilteredCounts();

  const handleOpenEditModal = (profile: typeof profiles[0]) => {
    setEditingProfile(profile);
    setSelectedPrimaryTag(null);
    setSelectedSecondaryTags([]);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingProfile(null);
    setSelectedPrimaryTag(null);
    setSelectedSecondaryTags([]);
  };

  const handleToggleSecondaryTag = (tag: string) => {
    setSelectedSecondaryTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleApplyFilter = () => {
    if (editingProfile) {
      // 更新画像的users和voc数量
      setProfiles(prev => prev.map(p =>
        p.id === editingProfile.id
          ? { ...p, users: filteredCounts.users, voc: filteredCounts.voc }
          : p
      ));
    }
    handleCloseEditModal();
  };

  const radarData = selectedPersona
    ? [
        { subject: '人口与成长轨迹', A: selectedPersona.radar[0], fullMark: 100 },
        { subject: '心理动因', A: selectedPersona.radar[1], fullMark: 100 },
        { subject: '心理特征维度', A: selectedPersona.radar[2], fullMark: 100 },
        { subject: '行为维度', A: selectedPersona.radar[3], fullMark: 100 },
        { subject: '需求与痛点', A: selectedPersona.radar[4], fullMark: 100 },
        { subject: '技术接受度', A: selectedPersona.radar[5], fullMark: 100 },
        { subject: '社会关系', A: selectedPersona.radar[6], fullMark: 100 },
      ]
    : [];

  return (
    <div className="flex-1 overflow-y-auto p-10">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-4xl font-extrabold text-white">人群画像调整</h2>
        </div>
        <div className="flex gap-4">
          <button onClick={onNext} className="bg-primary text-black px-6 py-3 text-sm font-bold hover:bg-primary/90 transition-colors flex items-center gap-2">
            开始执行 <ArrowRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-5 space-y-6">
          <div className="bg-surface p-6 rounded-xl">
            <h3 className="text-sm font-bold text-primary mb-4">自动匹配的 CDP 画像</h3>
            <div className="space-y-3">
              {profiles.map((profile) => {
                const active = selectedProfileId === profile.id;
                return (
                  <div key={profile.id} className="relative">
                    <button
                      onClick={() => setSelectedProfileId(profile.id)}
                      className={`w-full text-left p-4 pb-10 rounded border transition-colors ${active ? 'border-primary bg-primary/10' : 'border-white/10 hover:bg-white/5'}`}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold">{profile.name}</span>
                        <span className="text-[10px] text-primary">{profile.users}+ users</span>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {profile.tags.map((tag) => (
                          <span key={tag} className="px-2 py-1 rounded bg-surface-hover text-xs text-gray-300">{tag}</span>
                        ))}
                      </div>
                      <div className="text-[11px] text-gray-500">{profile.voc}+ VOC</div>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEditModal(profile);
                      }}
                      className="absolute bottom-2 right-2 px-2 py-1 bg-primary/20 hover:bg-primary/30 text-primary text-xs rounded transition-colors"
                    >
                      调整
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="col-span-7 space-y-6">
          {selectedPersona ? (
            <div className="bg-surface p-6 rounded-xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">{getPersonaDisplayName(selectedPersona)} - 详情</h3>
                <button onClick={() => setSelectedPersonaId(null)} className="text-xs text-gray-400 hover:text-white">返回卡片列表</button>
              </div>
              <div className="mb-4">
                <div className="text-xs text-gray-500 mb-2">CDP 标签</div>
                <div className="flex flex-wrap gap-2">
                  {selectedPersona.cdpTags.map((tag) => (
                    <span key={tag} className="px-2 py-1 rounded bg-surface-hover text-xs text-primary">{tag}</span>
                  ))}
                </div>
              </div>
              <div className="mb-4">
                <div className="text-xs text-gray-500 mb-2">VOC 原始文本</div>
                <div className="p-3 bg-white/5 border-l-2 border-primary text-sm text-gray-300">{selectedPersona.voc}</div>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                    <PolarGrid stroke="#2d2935" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#8a8a8a', fontSize: 10 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar name="Persona" dataKey="A" stroke="#1bff1b" fill="#1bff1b" fillOpacity={0.3} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="bg-surface p-6 rounded-xl">
              <h3 className="text-sm font-bold mb-4">模拟生成的人设卡片（可点击查看详情）</h3>
              <div className="grid grid-cols-2 gap-4">
                {filteredPersonas.map((p) => (
                  <button key={p.id} onClick={() => setSelectedPersonaId(p.id)} className="bg-white/5 p-4 rounded text-left hover:bg-white/10 transition-colors">
                    <h4 className="text-lg font-bold mb-2">{getPersonaDisplayName(p)}</h4>
                    <div className="flex gap-2 mb-4">
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded">{p.tags[0]}</span>
                      <span className="px-2 py-1 bg-surface-hover text-gray-300 text-xs rounded">{p.tags[1]}</span>
                    </div>
                    <div className="text-xs text-gray-400 mb-1">五维评分：<span className="text-white font-bold">{p.score.toFixed(1)}</span></div>
                    <div className="text-xs text-gray-400">置信度：<span className="text-white font-bold">{p.conf}%</span></div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CDP标签筛选模态框 */}
      {isEditModalOpen && editingProfile && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-8">
          <div className="bg-surface rounded-xl border border-white/10 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-white/10 flex justify-between items-center sticky top-0 bg-surface z-10">
              <h3 className="text-xl font-bold">调整画像：{editingProfile.name}</h3>
              <button onClick={handleCloseEditModal} className="text-gray-400 hover:text-white text-2xl">✕</button>
            </div>

            <div className="p-6 space-y-6">
              {/* 当前匹配数量 */}
              <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm text-gray-400 mb-1">当前筛选结果</div>
                    <div className="flex gap-6">
                      <div>
                        <span className="text-2xl font-bold text-primary">{filteredCounts.users}</span>
                        <span className="text-sm text-gray-400 ml-2">users</span>
                      </div>
                      <div>
                        <span className="text-2xl font-bold text-primary">{filteredCounts.voc}</span>
                        <span className="text-sm text-gray-400 ml-2">VOC文本</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleApplyFilter}
                    className="bg-primary text-black px-6 py-2 rounded font-bold hover:bg-primary/90 transition-colors"
                  >
                    应用筛选
                  </button>
                </div>
              </div>

              {/* CDP标签库 */}
              <div>
                <h4 className="text-sm font-bold text-primary mb-3">CDP 标签库</h4>

                {/* 一级标签 */}
                <div className="mb-4">
                  <div className="text-xs text-gray-500 mb-2">一级分类</div>
                  <div className="flex flex-wrap gap-2">
                    {primaryTags.map((tag) => {
                      const isActive = selectedPrimaryTag === tag;
                      return (
                        <button
                          key={tag}
                          onClick={() => {
                            setSelectedPrimaryTag(isActive ? null : tag);
                            setSelectedSecondaryTags([]);
                          }}
                          className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                            isActive
                              ? 'bg-primary text-black'
                              : 'bg-surface-hover text-gray-300 hover:bg-white/10'
                          }`}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 二级标签 */}
                {selectedPrimaryTag && (
                  <div>
                    <div className="text-xs text-gray-500 mb-2">二级标签（可多选）</div>
                    <div className="flex flex-wrap gap-2">
                      {secondaryTags[selectedPrimaryTag]?.map((tag) => {
                        const isSelected = selectedSecondaryTags.includes(tag);
                        return (
                          <button
                            key={tag}
                            onClick={() => handleToggleSecondaryTag(tag)}
                            className={`px-3 py-2 rounded text-sm transition-colors ${
                              isSelected
                                ? 'bg-primary/20 text-primary border border-primary'
                                : 'bg-surface-hover text-gray-300 hover:bg-white/10 border border-white/10'
                            }`}
                          >
                            {tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* 已选标签摘要 */}
              {(selectedPrimaryTag || selectedSecondaryTags.length > 0) && (
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="text-xs text-gray-500 mb-2">已选标签</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedPrimaryTag && (
                      <span className="px-2 py-1 bg-primary/20 text-primary text-xs rounded border border-primary/30">
                        {selectedPrimaryTag}
                      </span>
                    )}
                    {selectedSecondaryTags.map((tag) => (
                      <span key={tag} className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StepConfirm({ onNext }: { onNext: () => void }) {
  const uploadRef = useRef<HTMLInputElement>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  const onPickPdf = (file: File | null) => {
    if (!file) return;
    if (file.type !== 'application/pdf') {
      window.alert('仅支持 PDF 文件');
      return;
    }
    const maxSizeMB = 20;
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      window.alert(`文件大小超过 ${maxSizeMB} MB 限制，请选择更小的文件`);
      return;
    }
    setPdfFile(file);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-2xl bg-surface p-10 rounded-xl text-center shadow-2xl">
        <h2 className="text-3xl font-extrabold text-white mb-4">确认执行方案</h2>
        <p className="text-gray-400 text-sm mb-10">系统已准备好基于上述设定生成深度调研报告。您还可以选择上传真实的调研材料以增强报告的实证性。</p>
        
        <input
          ref={uploadRef}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={(e) => onPickPdf(e.target.files?.[0] ?? null)}
        />
        <div
          className="border-2 border-dashed border-white/20 rounded-xl p-12 flex flex-col items-center justify-center hover:border-primary/50 transition-colors cursor-pointer mb-10"
          onClick={() => uploadRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            onPickPdf(e.dataTransfer.files?.[0] ?? null);
          }}
        >
          <Upload className="text-primary mb-4" size={40} />
          <p className="text-white font-bold mb-2">上传真人调研材料 (可选)</p>
          <p className="text-gray-500 text-xs">仅支持 PDF 格式，最大 20MB</p>
          {pdfFile && <p className="text-xs text-primary mt-2">已选择：{pdfFile.name}</p>}
        </div>

        <div className="flex gap-4 justify-center">
          <button onClick={onNext} className="bg-white/10 text-white px-8 py-3 font-bold hover:bg-white/20 transition-colors">
            跳过并直接生成
          </button>
          <button onClick={onNext} className="bg-primary text-black px-8 py-3 font-bold hover:bg-primary/90 transition-colors">
            确认并开始生成
          </button>
        </div>
      </div>
    </div>
  );
}

function StepReport() {
  const handleDownloadPdf = () => {
    const reportText = `2024 纯电豪华 SUV 潜客心智与决策动因研究

核心执行摘要
- 用户核心诉求从机械性能转向数字安全与情绪价值。
- 主动安全与隐私保护对购买意愿影响显著。

关键人群洞察：理性先锋型
- 决策前期高强度参数比对，后期由价值观认同决定最终选择。
`;
    const blob = new Blob([reportText], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'report-detail.pdf';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 overflow-y-auto p-10">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-end mb-8">
          <div>
            <div className="text-primary text-xs font-bold mb-2">报告详情</div>
            <h2 className="text-4xl font-extrabold text-white">商业调研分析报告</h2>
          </div>
          <div className="flex gap-4">
            <button className="bg-white/10 px-6 py-3 text-sm font-bold hover:bg-white/20 transition-colors flex items-center gap-2">
              <Share2 size={16} /> 分享报告
            </button>
            <button onClick={handleDownloadPdf} className="bg-primary text-black px-6 py-3 text-sm font-bold hover:bg-primary/90 transition-colors flex items-center gap-2">
              <Download size={16} /> 下载 PDF
            </button>
          </div>
        </div>

        <div className="bg-white text-black p-16 rounded-xl shadow-2xl min-h-[800px]">
          <div className="border-b-2 border-black pb-8 mb-8">
            <h1 className="text-4xl font-black mb-4">2024 纯电豪华 SUV 潜客心智与决策动因研究</h1>
            <div className="flex justify-between text-sm text-gray-600 font-bold">
              <span>Volvo Insight Intelligence</span>
              <span>2024年5月20日</span>
            </div>
          </div>

          <div className="space-y-12">
            <section>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <span className="w-4 h-4 bg-black"></span> 核心执行摘要
              </h2>
              <p className="text-gray-800 leading-relaxed mb-4">
                本次研究通过对450名高净值潜客的深度模拟访谈与数据分析，揭示了在纯电转型期，用户对豪华SUV的核心诉求已从“机械性能”转向“数字安全与情绪价值”。
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-800">
                <li><span className="font-bold">安全定义的泛化：</span> 超过78%的用户认为，主动安全和隐私保护比被动碰撞安全更具吸引力。</li>
                <li><span className="font-bold">极简主义的溢价：</span> 繁复的屏幕堆砌正在引起审美疲劳，用户愿意为“克制且精准”的交互体验支付15%以上的溢价。</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <span className="w-4 h-4 bg-black"></span> 关键人群洞察：理性先锋型
              </h2>
              <div className="bg-gray-100 p-6 rounded-lg">
                <h3 className="font-bold mb-2">决策路径分析</h3>
                <p className="text-gray-800 leading-relaxed text-sm">
                  该人群在购车初期会进行大量的横向数据比对（如能耗、算力），但在最终决策阶段，品牌所传递的价值观（如可持续发展、家庭责任感）起到了决定性作用。他们排斥“说教式”的营销，更倾向于通过真实的用户口碑和硬核的技术拆解来建立信任。
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
