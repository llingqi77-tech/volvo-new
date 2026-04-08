import { useMemo, useState } from 'react';
import { ArrowLeft, Bot, Plus, Send } from 'lucide-react';
import FormalResearch from './FormalResearch';

type ScopeType = 'fullTime' | 'fullDomain' | 'both';
type RunStage = 'insightChat' | 'verifyPlan' | 'persona' | 'report';
type ChatMessage = { id: string; role: 'user' | 'assistant'; text: string };
type FullTimeFilters = {
  knowledgeScopes: { insightReport: boolean; vehicleKnowledge: boolean; industryKnowledge: boolean };
  isOnlineSearch: boolean;
};
type FullDomainFilters = {
  source: 'all' | 'firstParty' | 'firstPlusThirdParty';
  timeRange: 'all' | 'week' | 'month' | 'quarter';
};

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
  chatMessages: ChatMessage[];
  researchStep: number;
};

const RUNS_KEY = 'volvo.insight-research.runs';

function readRuns(): ConversationRun[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(RUNS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ConversationRun[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeRuns(runs: ConversationRun[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(RUNS_KEY, JSON.stringify(runs));
}

function stageLabel(stage: RunStage) {
  if (stage === 'insightChat') return '停留在洞察搜索';
  if (stage === 'verifyPlan') return '停留在生成调研方案/访谈大纲';
  if (stage === 'persona') return '停留在选择人设画像';
  return '停留在生成报告';
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function stepToStage(step: number): RunStage {
  if (step <= 2) return 'verifyPlan';
  if (step === 3) return 'persona';
  return 'report';
}

function stageToStep(stage: RunStage): number {
  if (stage === 'verifyPlan') return 2;
  if (stage === 'persona') return 3;
  if (stage === 'report') return 4;
  return 2;
}

function getRunScope(run: ConversationRun): ScopeType {
  if (run.fullTimeEnabled && run.fullDomainEnabled) return 'both';
  if (run.fullTimeEnabled) return 'fullTime';
  if (run.fullDomainEnabled) return 'fullDomain';
  return run.scope ?? 'both';
}

export default function InsightResearch({ isSidebarCollapsed = false }: { isSidebarCollapsed?: boolean }) {
  const [runs, setRuns] = useState<ConversationRun[]>(() => readRuns());
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [input, setInput] = useState('');

  const activeRun = useMemo(() => runs.find((r) => r.id === activeRunId) ?? null, [runs, activeRunId]);

  const upsertRun = (nextRun: ConversationRun) => {
    const next = [nextRun, ...runs.filter((r) => r.id !== nextRun.id)];
    setRuns(next);
    writeRuns(next);
  };

  const createRun = () => {
    const run: ConversationRun = {
      id: `run-${Date.now()}`,
      title: '新建对话',
      updatedAt: Date.now(),
      scope: 'both',
      fullTimeEnabled: true,
      fullDomainEnabled: true,
      fullTimeFilters: {
        knowledgeScopes: { insightReport: true, vehicleKnowledge: true, industryKnowledge: false },
        isOnlineSearch: true,
      },
      fullDomainFilters: {
        source: 'all',
        timeRange: 'all',
      },
      stage: 'insightChat',
      chatMessages: [],
      researchStep: 2,
    };
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

  const sendChat = () => {
    if (!activeRun) return;
    const question = input.trim();
    if (!question) return;
    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: 'user', text: question };
    const currentScope = getRunScope(activeRun);
    const scopeText = currentScope === 'fullTime' ? '全时洞察数据' : currentScope === 'fullDomain' ? '全域洞察数据' : '全时+全域数据';
    const assistantMsg: ChatMessage = {
      id: `a-${Date.now()}`,
      role: 'assistant',
      text: `已基于${scopeText}分析：\n\n关于“${question}”，建议优先关注关键驱动因素、用户反馈分歧点和可验证假设，并整理为后续正式研究输入。`,
    };
    const nextMessages = [...activeRun.chatMessages, userMsg, assistantMsg];
    updateActiveRun({
      chatMessages: nextMessages,
      title: question.length > 16 ? `${question.slice(0, 16)}...` : question,
    });
    setInput('');
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
            <button
              onClick={createRun}
              className="bg-primary text-black px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-primary/90 flex items-center gap-2"
            >
              <Plus size={16} /> 新建对话
            </button>
          </div>

          {runs.length === 0 ? (
            <div className="bg-surface rounded-xl border border-white/10 p-12 text-center text-gray-400">暂无对话，点击右上角“新建对话”开始。</div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {runs.map((run) => (
                <div key={run.id} className="bg-surface rounded-xl border border-white/10 p-5">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold text-white">{run.title}</h3>
                    <span className="text-xs text-primary">{getRunScope(run) === 'fullTime' ? '全时' : getRunScope(run) === 'fullDomain' ? '全域' : '全时+全域'}</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">更新时间：{formatTime(run.updatedAt)}</p>
                  <p className="text-sm text-gray-300 mb-4">{stageLabel(run.stage)}</p>
                  <div className="flex justify-end">
                    <button onClick={() => setActiveRunId(run.id)} className="bg-primary text-black px-4 py-2 rounded text-sm font-bold hover:bg-primary/90">
                      从当前步骤继续
                    </button>
                  </div>
                </div>
              ))}
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
          <button
            onClick={() => setActiveRunId(null)}
            className="w-8 h-8 rounded bg-surface-hover hover:bg-white/10 flex items-center justify-center"
            title="返回卡片列表"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <p className="text-sm font-bold text-white">{activeRun.title}</p>
            <p className="text-xs text-gray-500">{stageLabel(activeRun.stage)}</p>
          </div>
        </div>
      </div>

      {activeRun.stage === 'insightChat' ? (
        <div className="flex-1 flex flex-col overflow-hidden p-8">
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {activeRun.chatMessages.length === 0 ? (
              <div className="h-full min-h-[320px] flex items-center justify-center text-gray-500">开始提问后将生成洞察对话记录。</div>
            ) : (
              activeRun.chatMessages.map((m) =>
                m.role === 'user' ? (
                  <div key={m.id} className="flex justify-end">
                    <div className="bg-primary text-black px-4 py-3 rounded-2xl max-w-3xl text-sm">{m.text}</div>
                  </div>
                ) : (
                  <div key={m.id} className="flex gap-3 items-start">
                    <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shrink-0">
                      <Bot size={18} className="text-black" />
                    </div>
                    <div className="bg-surface rounded-2xl px-5 py-3 border border-white/10 max-w-3xl">
                      <pre className="text-sm text-gray-300 whitespace-pre-wrap font-sans">{m.text}</pre>
                    </div>
                  </div>
                ),
              )
            )}
          </div>

          <div className="mt-6 bg-surface-hover rounded-xl p-4 border-l-2 border-primary">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendChat();
                }
              }}
              className="w-full bg-transparent border-none outline-none resize-none h-20 text-sm"
              placeholder="输入你的问题，开始洞察对话..."
            />
            <div className="mt-3 flex items-end justify-between gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="min-w-[250px] bg-surface rounded-lg border border-white/10 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-white">全时筛选</span>
                    <label className="flex items-center gap-2 text-xs text-gray-300">
                      <input
                        type="checkbox"
                        checked={activeRun.fullTimeEnabled ?? (activeRun.scope !== 'fullDomain')}
                        onChange={(e) => {
                          const fullDomainEnabled = activeRun.fullDomainEnabled ?? (activeRun.scope !== 'fullTime');
                          const fullTimeEnabled = e.target.checked;
                          const nextScope: ScopeType = fullTimeEnabled && fullDomainEnabled ? 'both' : fullTimeEnabled ? 'fullTime' : 'fullDomain';
                          updateActiveRun({ fullTimeEnabled, scope: nextScope });
                        }}
                        className="w-3.5 h-3.5 rounded bg-surface-hover border-none text-primary"
                      />
                      启用
                    </label>
                  </div>
                  <div className="text-[11px] text-gray-400 mb-1">知识范围</div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    <label className="flex items-center gap-1.5 text-xs text-gray-300">
                      <input
                        type="checkbox"
                        checked={activeRun.fullTimeFilters?.knowledgeScopes.insightReport ?? true}
                        onChange={(e) =>
                          updateActiveRun({
                            fullTimeFilters: {
                              knowledgeScopes: {
                                insightReport: e.target.checked,
                                vehicleKnowledge: activeRun.fullTimeFilters?.knowledgeScopes.vehicleKnowledge ?? true,
                                industryKnowledge: activeRun.fullTimeFilters?.knowledgeScopes.industryKnowledge ?? false,
                              },
                              isOnlineSearch: activeRun.fullTimeFilters?.isOnlineSearch ?? true,
                            },
                          })
                        }
                        className="w-3.5 h-3.5 rounded bg-surface-hover border-none text-primary"
                      />
                      洞察报告
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-gray-300">
                      <input
                        type="checkbox"
                        checked={activeRun.fullTimeFilters?.knowledgeScopes.vehicleKnowledge ?? true}
                        onChange={(e) =>
                          updateActiveRun({
                            fullTimeFilters: {
                              knowledgeScopes: {
                                insightReport: activeRun.fullTimeFilters?.knowledgeScopes.insightReport ?? true,
                                vehicleKnowledge: e.target.checked,
                                industryKnowledge: activeRun.fullTimeFilters?.knowledgeScopes.industryKnowledge ?? false,
                              },
                              isOnlineSearch: activeRun.fullTimeFilters?.isOnlineSearch ?? true,
                            },
                          })
                        }
                        className="w-3.5 h-3.5 rounded bg-surface-hover border-none text-primary"
                      />
                      整车知识
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-gray-300">
                      <input
                        type="checkbox"
                        checked={activeRun.fullTimeFilters?.knowledgeScopes.industryKnowledge ?? false}
                        onChange={(e) =>
                          updateActiveRun({
                            fullTimeFilters: {
                              knowledgeScopes: {
                                insightReport: activeRun.fullTimeFilters?.knowledgeScopes.insightReport ?? true,
                                vehicleKnowledge: activeRun.fullTimeFilters?.knowledgeScopes.vehicleKnowledge ?? true,
                                industryKnowledge: e.target.checked,
                              },
                              isOnlineSearch: activeRun.fullTimeFilters?.isOnlineSearch ?? true,
                            },
                          })
                        }
                        className="w-3.5 h-3.5 rounded bg-surface-hover border-none text-primary"
                      />
                      行业知识
                    </label>
                  </div>
                  <label className="flex items-center justify-between text-xs text-gray-300">
                    <span>开启联网搜索</span>
                    <input
                      type="checkbox"
                      checked={activeRun.fullTimeFilters?.isOnlineSearch ?? true}
                      onChange={(e) =>
                        updateActiveRun({
                          fullTimeFilters: {
                            knowledgeScopes: {
                              insightReport: activeRun.fullTimeFilters?.knowledgeScopes.insightReport ?? true,
                              vehicleKnowledge: activeRun.fullTimeFilters?.knowledgeScopes.vehicleKnowledge ?? true,
                              industryKnowledge: activeRun.fullTimeFilters?.knowledgeScopes.industryKnowledge ?? false,
                            },
                            isOnlineSearch: e.target.checked,
                          },
                        })
                      }
                      className="w-3.5 h-3.5 rounded bg-surface-hover border-none text-primary"
                    />
                  </label>
                </div>

                <div className="min-w-[250px] bg-surface rounded-lg border border-white/10 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-white">全域洞察筛选</span>
                    <label className="flex items-center gap-2 text-xs text-gray-300">
                      <input
                        type="checkbox"
                        checked={activeRun.fullDomainEnabled ?? (activeRun.scope !== 'fullTime')}
                        onChange={(e) => {
                          const fullTimeEnabled = activeRun.fullTimeEnabled ?? (activeRun.scope !== 'fullDomain');
                          const fullDomainEnabled = e.target.checked;
                          const nextScope: ScopeType = fullTimeEnabled && fullDomainEnabled ? 'both' : fullDomainEnabled ? 'fullDomain' : 'fullTime';
                          updateActiveRun({ fullDomainEnabled, scope: nextScope });
                        }}
                        className="w-3.5 h-3.5 rounded bg-surface-hover border-none text-primary"
                      />
                      启用
                    </label>
                  </div>
                  <div className="text-[11px] text-gray-400 mb-1">数据来源</div>
                  <div className="flex gap-2 mb-2">
                    {[
                      { key: 'firstParty', label: '一方' },
                      { key: 'firstPlusThirdParty', label: '一方+三方' },
                    ].map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() =>
                          updateActiveRun({
                            fullDomainFilters: {
                              source: item.key as FullDomainFilters['source'],
                              timeRange: activeRun.fullDomainFilters?.timeRange ?? 'all',
                            },
                          })
                        }
                        className={`px-2 py-1 rounded text-xs border ${
                          (activeRun.fullDomainFilters?.source ?? 'firstParty') === item.key
                            ? 'bg-primary text-black border-primary'
                            : 'bg-surface-hover border-white/10 text-gray-300'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                  <div className="text-[11px] text-gray-400 mb-1">时间范围</div>
                  <div className="flex gap-2 flex-wrap">
                    {[
                      { key: 'all', label: '全部时间' },
                      { key: 'week', label: '近一周' },
                      { key: 'month', label: '近一月' },
                      { key: 'quarter', label: '近三月' },
                    ].map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() =>
                          updateActiveRun({
                            fullDomainFilters: {
                              source: activeRun.fullDomainFilters?.source ?? 'firstParty',
                              timeRange: item.key as FullDomainFilters['timeRange'],
                            },
                          })
                        }
                        className={`px-2 py-1 rounded text-xs border ${
                          (activeRun.fullDomainFilters?.timeRange ?? 'all') === item.key
                            ? 'bg-primary text-black border-primary'
                            : 'bg-surface-hover border-white/10 text-gray-300'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const canEnter = (activeRun.fullTimeEnabled ?? (activeRun.scope !== 'fullDomain')) && (activeRun.fullDomainEnabled ?? (activeRun.scope !== 'fullTime'));
                    if (!canEnter) {
                      window.alert('进入正式研究前，必须同时启用全时筛选和全域筛选。');
                      return;
                    }
                    updateActiveRun({ stage: 'verifyPlan', researchStep: 2, scope: 'both' });
                  }}
                  className="bg-primary text-black px-4 py-2 rounded text-sm font-bold hover:bg-primary/90"
                >
                  进入正式研究
                </button>
                <button onClick={sendChat} className="w-10 h-10 rounded-full bg-primary text-black flex items-center justify-center">
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <FormalResearch
          isSidebarCollapsed={isSidebarCollapsed}
          embedded
          initialStep={activeRun.researchStep || stageToStep(activeRun.stage)}
          initialInput={activeRun.chatMessages.find((m) => m.role === 'user')?.text ?? '基于已完成的洞察对话继续正式研究'}
          onStepChange={(step) => {
            updateActiveRun({
              researchStep: step,
              stage: stepToStage(step),
            });
          }}
        />
      )}
    </div>
  );
}
