import { useEffect, useMemo, useRef, useState } from 'react';
import { Bot, Send, CheckCircle2, Download, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
};

type ChatSession = {
  id: string;
  title: string;
  updatedAt: number;
  messages: ChatMessage[];
};

type InterviewStep = {
  id: string;
  question: string;
  options: string[];
  selected?: string;
};

const CUSTOMER_SESSIONS_KEY = 'volvo.chat.customer.sessions';
const EXPERT_SESSIONS_KEY = 'volvo.chat.expert.sessions';

function makeSessionTitle(messages: ChatMessage[]) {
  const firstUser = messages.find((m) => m.role === 'user');
  if (!firstUser) return '新建对话';
  return firstUser.text.length > 16 ? `${firstUser.text.slice(0, 16)}...` : firstUser.text;
}

function formatSessionTime(ts: number) {
  return new Date(ts).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function readSessions(key: string): ChatSession[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ChatSession[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeSessions(key: string, sessions: ChatSession[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(sessions));
}

function getSessionGroupLabel(ts: number) {
  const now = Date.now();
  const diffDays = (now - ts) / (1000 * 60 * 60 * 24);
  if (diffDays < 1) return '今天';
  if (diffDays <= 7) return '7 天内';
  if (diffDays <= 30) return '30 天内';
  return '更早';
}

function HistorySidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onHide,
  onNewSession,
}: {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (session: ChatSession) => void;
  onHide: () => void;
  onNewSession: () => void;
}) {
  const groupedSessions = sessions.reduce<Record<string, ChatSession[]>>((acc, session) => {
    const label = getSessionGroupLabel(session.updatedAt);
    if (!acc[label]) acc[label] = [];
    acc[label].push(session);
    return acc;
  }, {});
  const orderedGroups = ['今天', '7 天内', '30 天内', '更早'].filter((label) => groupedSessions[label]?.length);

  return (
    <div className="w-80 bg-surface border-r border-white/10 p-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-white font-bold">历史对话</p>
        <button
          type="button"
          onClick={onHide}
          className="w-7 h-7 rounded bg-surface-hover text-gray-400 hover:text-white flex items-center justify-center"
          title="隐藏历史对话"
        >
          <PanelLeftClose size={14} />
        </button>
      </div>
      <button
        type="button"
        onClick={onNewSession}
        className="w-full rounded-full bg-surface-hover border border-white/10 text-white text-sm py-3 mb-5 hover:bg-white/10 transition-colors"
      >
        + 开启新对话
      </button>
      {sessions.length === 0 ? (
        <div className="text-xs text-gray-500">暂无历史对话</div>
      ) : (
        <div className="space-y-5">
          {orderedGroups.map((groupLabel) => (
            <div key={groupLabel}>
              <p className="text-xs text-gray-500 mb-2">{groupLabel}</p>
              <div className="space-y-2">
                {groupedSessions[groupLabel].map((session) => (
                  <button
                    type="button"
                    key={session.id}
                    onClick={() => onSelectSession(session)}
                    className={`w-full text-left rounded-lg border px-3 py-2 transition-colors ${
                      activeSessionId === session.id
                        ? 'border-primary/60 bg-primary/10'
                        : 'border-white/10 bg-surface-hover hover:bg-white/10'
                    }`}
                  >
                    <p className="text-sm text-white truncate">{session.title}</p>
                    <p className="text-[11px] text-gray-500 mt-1">
                      {formatSessionTime(session.updatedAt)} · {session.messages.length} 条
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ChatMode() {
  const [chatType, setChatType] = useState<'expert' | 'customer'>('customer');

  return (
    <div className="flex flex-col h-full">
      <div className="px-8 py-4 border-b border-white/10 flex gap-4">
        <button
          onClick={() => setChatType('expert')}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${chatType === 'expert' ? 'bg-primary text-black' : 'text-gray-400 hover:bg-white/5'}`}
        >
          全时洞察
        </button>
        <button
          onClick={() => setChatType('customer')}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${chatType === 'customer' ? 'bg-primary text-black' : 'text-gray-400 hover:bg-white/5'}`}
        >
          全域洞察
        </button>
      </div>

      {chatType === 'customer' ? <CustomerChat /> : <ExpertChat />}
    </div>
  );
}

function CustomerChat() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const sessions = readSessions(CUSTOMER_SESSIONS_KEY);
    return sessions[0]?.messages ?? [];
  });
  const [sessions, setSessions] = useState<ChatSession[]>(() => readSessions(CUSTOMER_SESSIONS_KEY));
  const [activeSessionId, setActiveSessionId] = useState<string | null>(() => readSessions(CUSTOMER_SESSIONS_KEY)[0]?.id ?? null);
  const [hasStarted, setHasStarted] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isHistoryVisible, setIsHistoryVisible] = useState(true);
  const [openFilterMenu, setOpenFilterMenu] = useState<null | 'source' | 'time'>(null);
  const filterMenuRef = useRef<HTMLDivElement | null>(null);
  const activeSessionIdRef = useRef<string | null>(activeSessionId);
  const messagesRef = useRef<ChatMessage[]>(messages);
  const [selectedFilters, setSelectedFilters] = useState({
    source: null as null | 'firstParty' | 'firstPlusThirdParty',
    timeRange: 'all' as string
  });

  // 模拟VOC数据统计 - 按信源分布
  const vocDataBySource = {
    firstParty: 789,
    firstPlusThirdParty: 1247,
  };

  const BASE_TOTAL = 1247;
  const sentimentBase = {
    '正面': Math.round(BASE_TOTAL * 0.686),
    '中性': Math.round(BASE_TOTAL * 0.196),
    '负面': Math.round(BASE_TOTAL * 0.117)
  };

  // 计算筛选后的VOC统计数据（来源、时间联动）
  const vocStats = useMemo(() => {
    let sourceTotal = BASE_TOTAL;
    if (selectedFilters.source) {
      sourceTotal = vocDataBySource[selectedFilters.source];
    }
    const sourceRatio = sourceTotal / BASE_TOTAL;

    // 2. 按时间范围筛选
    const timeRatios: Record<string, number> = {
      'all': 1.0,
      'week': 0.15,
      'month': 0.35,
      'quarter': 0.65
    };
    const timeRatio = timeRatios[selectedFilters.timeRange] || 1.0;

    // 保留情感统计展示，但不提供情感筛选交互
    const positive = Math.round(sentimentBase['正面'] * sourceRatio * timeRatio);
    const neutral = Math.round(sentimentBase['中性'] * sourceRatio * timeRatio);
    const negative = Math.round(sentimentBase['负面'] * sourceRatio * timeRatio);
    const total = positive + neutral + negative;

    const categories = [
      { name: '智能驾驶', count: Math.round(BASE_TOTAL * 0.339 * sourceRatio * timeRatio) },
      { name: '内饰质感', count: Math.round(BASE_TOTAL * 0.250 * sourceRatio * timeRatio) },
      { name: '续航里程', count: Math.round(BASE_TOTAL * 0.232 * sourceRatio * timeRatio) },
      { name: '充电体验', count: Math.round(BASE_TOTAL * 0.125 * sourceRatio * timeRatio) },
      { name: '售后服务', count: Math.round(BASE_TOTAL * 0.054 * sourceRatio * timeRatio) }
    ];

    return {
      total,
      positive,
      neutral,
      negative,
      categories
    };
  }, [selectedFilters]);

  useEffect(() => {
    setHasStarted(messages.length > 0);
  }, [messages]);

  useEffect(() => {
    writeSessions(CUSTOMER_SESSIONS_KEY, sessions);
  }, [sessions]);

  useEffect(() => {
    activeSessionIdRef.current = activeSessionId;
  }, [activeSessionId]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    const onDocMouseDown = (event: MouseEvent) => {
      if (!filterMenuRef.current) return;
      if (!filterMenuRef.current.contains(event.target as Node)) {
        setOpenFilterMenu(null);
      }
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, []);

  const upsertSession = (nextMessages: ChatMessage[], fixedSessionId?: string) => {
    const sessionId = fixedSessionId ?? activeSessionIdRef.current ?? `customer-${Date.now()}`;
    const nextSession: ChatSession = {
      id: sessionId,
      title: makeSessionTitle(nextMessages),
      updatedAt: Date.now(),
      messages: nextMessages,
    };
    setSessions((prev) => [nextSession, ...prev.filter((s) => s.id !== sessionId)]);
    setActiveSessionId(sessionId);
    activeSessionIdRef.current = sessionId;
  };

  const createNewSession = () => {
    setActiveSessionId(null);
    activeSessionIdRef.current = null;
    setMessages([]);
    setHasStarted(false);
  };

  const handleSend = () => {
    const question = input.trim();
    if (!question) return;
    const sessionIdForTurn = activeSessionIdRef.current ?? `customer-${Date.now()}`;
    const userMessage: ChatMessage = { id: `voc-u-${Date.now()}`, role: 'user', text: question };
    const userNextMessages = [...messagesRef.current, userMessage];
    setMessages(userNextMessages);
    upsertSession(userNextMessages, sessionIdForTurn);
    setInput('');

    // 显示分析过程
    setIsAnalyzing(true);

    setTimeout(() => {
      setIsAnalyzing(false);

      const totalCount = vocStats.total;
      const posPct = totalCount > 0 ? ((vocStats.positive / totalCount) * 100).toFixed(1) : '0.0';
      const neuPct = totalCount > 0 ? ((vocStats.neutral / totalCount) * 100).toFixed(1) : '0.0';
      const negPct = totalCount > 0 ? ((vocStats.negative / totalCount) * 100).toFixed(1) : '0.0';

      const posLine = vocStats.positive > 0 ? `• 正面评价：${posPct}%（主要集中在安全配置和北欧设计）` : '';
      const neuLine = vocStats.neutral > 0 ? `• 中性描述：${neuPct}%（功能性描述为主）` : '';
      const negLine = vocStats.negative > 0 ? `• 负面反馈：${negPct}%（主要关于充电便利性和价格）` : '';

      const sentimentLines = [posLine, neuLine, negLine].filter(Boolean).join('\n');

      const response = `基于 ${vocStats.total} 条 VOC 数据的分析结果：

关于"${question}"的用户洞察：

高频关键词：
• 智能驾驶安全性（提及 ${Math.round(totalCount * 0.339)} 次）
• 内饰质感与静谧性（提及 ${Math.round(totalCount * 0.250)} 次）
• 续航里程焦虑（提及 ${Math.round(totalCount * 0.232)} 次）

情感分布：
${sentimentLines || '• 当前筛选条件下暂无情感分布数据'}

典型用户声音：
"沃尔沃的主动安全系统让我在复杂路况下更有信心，这是我选择它的核心原因。"
"内饰的环保材料和静音效果确实不错，但充电网络覆盖还需要加强。"
"续航表现符合预期，但冬季衰减比想象中明显。"

洞察建议：
1. 强化安全技术的传播，这是核心竞争力
2. 持续优化充电体验和网络布局
3. 针对续航焦虑提供更透明的数据和解决方案`;

      const assistantMessage: ChatMessage = {
        id: `voc-a-${Date.now()}`,
        role: 'assistant',
        text: response,
      };
      const nextMessages = [...messagesRef.current, assistantMessage];
      setMessages(nextMessages);
      upsertSession(nextMessages, sessionIdForTurn);
    }, 2500);
  };

  return (
    <div className="flex h-full relative">
      {isHistoryVisible ? (
        <HistorySidebar
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelectSession={(session) => {
            setActiveSessionId(session.id);
            setMessages(session.messages);
          }}
          onHide={() => setIsHistoryVisible(false)}
          onNewSession={createNewSession}
        />
      ) : (
        <button
          onClick={() => setIsHistoryVisible(true)}
          className="absolute left-0 top-1/2 -translate-y-1/2 bg-primary text-black px-2 py-5 rounded-r-lg font-bold shadow-lg hover:bg-primary/90 transition-all z-10"
          title="展开历史对话"
        >
          <PanelLeftOpen size={16} />
        </button>
      )}

      <div className="flex-1 flex flex-col overflow-hidden p-8">
        <div className="flex-1 overflow-y-auto space-y-6 pr-4">
          {!hasStarted && (
            <div className="h-full min-h-[360px] flex items-center justify-center">
              <div className="max-w-2xl text-center">
                <h2 className="text-3xl font-bold text-white mb-3">VOC 数据洞察</h2>
                <p className="text-sm text-gray-400 mb-6">
                  与 {vocStats.total} 条用户之声对话，挖掘深层洞察
                </p>
                <div className="grid grid-cols-2 gap-3 text-left">
                  <button
                    onClick={() => setInput('用户对智能驾驶的核心诉求是什么？')}
                    className="bg-surface-hover hover:bg-white/10 rounded-lg p-4 transition-colors"
                  >
                    <p className="text-sm text-white font-bold mb-1">智能驾驶诉求</p>
                    <p className="text-xs text-gray-500">分析用户对自动驾驶的期待</p>
                  </button>
                  <button
                    onClick={() => setInput('负面反馈主要集中在哪些方面？')}
                    className="bg-surface-hover hover:bg-white/10 rounded-lg p-4 transition-colors"
                  >
                    <p className="text-sm text-white font-bold mb-1">负面反馈分析</p>
                    <p className="text-xs text-gray-500">识别用户痛点和改进方向</p>
                  </button>
                  <button
                    onClick={() => setInput('不同年龄段用户的关注点有何差异？')}
                    className="bg-surface-hover hover:bg-white/10 rounded-lg p-4 transition-colors"
                  >
                    <p className="text-sm text-white font-bold mb-1">人群差异洞察</p>
                    <p className="text-xs text-gray-500">对比不同用户群体的需求</p>
                  </button>
                  <button
                    onClick={() => setInput('用户最满意的产品特性是什么？')}
                    className="bg-surface-hover hover:bg-white/10 rounded-lg p-4 transition-colors"
                  >
                    <p className="text-sm text-white font-bold mb-1">优势特性识别</p>
                    <p className="text-xs text-gray-500">发现产品核心竞争力</p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {hasStarted && (
            <>
              {messages.map((m) => (
                <div key={m.id} className="w-full">
                  {m.role === 'user' ? (
                    <div className="flex justify-end">
                      <div className="bg-primary text-black px-5 py-3 rounded-2xl max-w-2xl text-sm leading-relaxed">
                        {m.text}
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-4 items-start">
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0">
                        <Bot className="text-black" size={20} />
                      </div>
                      <div className="flex-1">
                        <div className="bg-surface rounded-2xl px-6 py-4 border border-white/5">
                          <pre className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap font-sans">
                            {m.text}
                          </pre>
                        </div>
                        <div className="mt-3 flex gap-2">
                          <button
                            onClick={() => {
                              const blob = new Blob([m.text], { type: 'text/plain' });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `voc-insight-${Date.now()}.txt`;
                              a.click();
                              URL.revokeObjectURL(url);
                            }}
                            className="px-4 py-2 bg-surface-hover hover:bg-[#353534] text-xs rounded-lg flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
                          >
                            <Download size={14} /> 导出洞察
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {isAnalyzing && (
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <Bot className="text-black" size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="bg-surface rounded-2xl px-6 py-4 border border-white/5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                        <span className="text-sm text-gray-400">正在分析 VOC 数据...</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <CheckCircle2 className="text-primary" size={14} />
                          检索相关用户反馈
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <CheckCircle2 className="text-primary" size={14} />
                          提取高频关键词
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <CheckCircle2 className="text-primary" size={14} />
                          生成洞察报告
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="mt-8 max-w-4xl mx-auto w-full">
          <div className="bg-surface-hover rounded-xl p-4 border-l-2 border-primary shadow-lg">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              className="w-full bg-transparent border-none focus:ring-0 text-sm resize-none h-20 mb-2 outline-none"
              placeholder="向 VOC 数据提问，例如：用户对续航的真实反馈是什么？"
            ></textarea>
            <div className="flex justify-between items-end" ref={filterMenuRef}>
              <div className="flex items-center gap-2 relative">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setOpenFilterMenu((prev) => (prev === 'source' ? null : 'source'))}
                    className="text-xs px-3 py-2 rounded bg-surface border border-white/10 text-gray-300 hover:text-white"
                  >
                    数据来源：{selectedFilters.source === 'firstParty' ? '一方' : selectedFilters.source === 'firstPlusThirdParty' ? '一方+三方' : '全部'}
                  </button>
                  {openFilterMenu === 'source' && (
                    <div className="absolute left-0 bottom-full mb-2 w-40 bg-surface border border-white/10 rounded-lg p-1 shadow-xl z-20">
                      {[
                        { key: null, label: '全部' },
                        { key: 'firstParty', label: '一方' },
                        { key: 'firstPlusThirdParty', label: '一方+三方' },
                      ].map((source) => (
                        <button
                          key={source.label}
                          type="button"
                          onClick={() => {
                            setSelectedFilters((prev) => ({
                              ...prev,
                              source: source.key as null | 'firstParty' | 'firstPlusThirdParty',
                            }));
                            setOpenFilterMenu(null);
                          }}
                          className={`w-full text-left text-xs px-2 py-2 rounded transition-colors ${
                            selectedFilters.source === source.key ? 'bg-primary/20 text-primary' : 'text-gray-300 hover:bg-white/10'
                          }`}
                        >
                          {source.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setOpenFilterMenu((prev) => (prev === 'time' ? null : 'time'))}
                    className="text-xs px-3 py-2 rounded bg-surface border border-white/10 text-gray-300 hover:text-white"
                  >
                    时间范围：{selectedFilters.timeRange === 'all' ? '全部时间' : selectedFilters.timeRange === 'week' ? '近一周' : selectedFilters.timeRange === 'month' ? '近一月' : '近三月'}
                  </button>
                  {openFilterMenu === 'time' && (
                    <div className="absolute left-0 bottom-full mb-2 w-36 bg-surface border border-white/10 rounded-lg p-1 shadow-xl z-20">
                      {[
                        { key: 'all', label: '全部时间' },
                        { key: 'week', label: '近一周' },
                        { key: 'month', label: '近一月' },
                        { key: 'quarter', label: '近三月' },
                      ].map((time) => (
                        <button
                          key={time.key}
                          type="button"
                          onClick={() => {
                            setSelectedFilters((prev) => ({ ...prev, timeRange: time.key }));
                            setOpenFilterMenu(null);
                          }}
                          className={`w-full text-left text-xs px-2 py-2 rounded transition-colors ${
                            selectedFilters.timeRange === time.key ? 'bg-primary/20 text-primary' : 'text-gray-300 hover:bg-white/10'
                          }`}
                        >
                          {time.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            <div className="flex justify-end">
              <button onClick={handleSend} className="w-10 h-10 bg-primary text-black rounded-full flex items-center justify-center hover:bg-primary/90">
                <Send size={18} className="ml-1" />
              </button>
            </div>
            </div>
          </div>
        </div>
      </div>

      
    </div>
  );
}

function ExpertChat() {
  const [input, setInput] = useState('');
  const [filters, setFilters] = useState({ f1: true, f2: true, f3: false });
  const [isOnline, setIsOnline] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const sessions = readSessions(EXPERT_SESSIONS_KEY);
    return sessions[0]?.messages ?? [];
  });
  const [sessions, setSessions] = useState<ChatSession[]>(() => readSessions(EXPERT_SESSIONS_KEY));
  const [activeSessionId, setActiveSessionId] = useState<string | null>(() => readSessions(EXPERT_SESSIONS_KEY)[0]?.id ?? null);
  const [hasStarted, setHasStarted] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingSteps, setThinkingSteps] = useState<string[]>([]);
  const [isHistoryVisible, setIsHistoryVisible] = useState(true);
  const activeSessionIdRef = useRef<string | null>(activeSessionId);
  const messagesRef = useRef<ChatMessage[]>(messages);

  useEffect(() => {
    setHasStarted(messages.length > 0);
  }, [messages]);

  useEffect(() => {
    writeSessions(EXPERT_SESSIONS_KEY, sessions);
  }, [sessions]);

  useEffect(() => {
    activeSessionIdRef.current = activeSessionId;
  }, [activeSessionId]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const upsertSession = (nextMessages: ChatMessage[], fixedSessionId?: string) => {
    const sessionId = fixedSessionId ?? activeSessionIdRef.current ?? `expert-${Date.now()}`;
    const nextSession: ChatSession = {
      id: sessionId,
      title: makeSessionTitle(nextMessages),
      updatedAt: Date.now(),
      messages: nextMessages,
    };
    setSessions((prev) => [nextSession, ...prev.filter((s) => s.id !== sessionId)]);
    setActiveSessionId(sessionId);
    activeSessionIdRef.current = sessionId;
  };

  const createNewSession = () => {
    setActiveSessionId(null);
    activeSessionIdRef.current = null;
    setMessages([]);
    setHasStarted(false);
  };

  const handleSend = () => {
    const question = input.trim();
    if (!question) return;
    const sessionIdForTurn = activeSessionIdRef.current ?? `expert-${Date.now()}`;
    const userMessage: ChatMessage = { id: `e-u-${Date.now()}`, role: 'user', text: question };
    const userNextMessages = [...messagesRef.current, userMessage];
    setMessages(userNextMessages);
    upsertSession(userNextMessages, sessionIdForTurn);
    setInput('');

    // 显示思考过程
    setIsThinking(true);
    setThinkingSteps([]);

    const scope = [
      filters.f1 ? '洞察报告' : null,
      filters.f2 ? '整车知识' : null,
      filters.f3 ? '行业知识' : null,
    ].filter(Boolean).join('、') || '默认知识库';

    // 模拟思考步骤
    const steps = [
      `正在检索${scope}...`,
      isOnline ? '正在联网搜索相关信息...' : '正在分析知识库内容...',
      '正在整合分析结果...',
      '正在生成专业报告...'
    ];

    steps.forEach((step, idx) => {
      setTimeout(() => {
        setThinkingSteps(prev => [...prev, step]);
      }, idx * 800);
    });

    // 生成回答
    setTimeout(() => {
      setIsThinking(false);
      setThinkingSteps([]);

      const response = `2024 纯电 SUV 市场竞争力分析

核心摘要

沃尔沃在2024年通过EX系列完成了从内燃机逻辑向原生纯电平台的平稳过渡。其安全资产已成功转化为"数字安全锚点"，在感知算法和主动干预领域保持行业领先地位。

核心功能点

• Lidar 全域感知增强：采用最新一代固态激光雷达，实现360度无死角环境感知
• 可持续材料座舱工艺：内饰采用可再生材料，符合北欧环保理念
• 双电机全时效能管理：前后双电机智能分配动力，提升续航效率

市场竞争力评估

基于${scope}${isOnline ? '并结合联网信息' : ''}的分析，沃尔沃EX系列在豪华纯电SUV细分市场具有以下优势：

1. 安全基因延续：传统安全优势成功转化为智能驾驶安全能力
2. 北欧设计美学：简约而不简单的设计语言，符合高端用户审美
3. 可持续发展理念：环保材料和生产工艺，契合目标用户价值观

风险与建议

潜在风险：
• 充电网络覆盖相对竞品仍有差距
• 品牌认知度在年轻消费群体中需要加强

执行建议：
• 加大充电基础设施投资
• 强化数字营销和社交媒体传播`;

      const assistantMessage: ChatMessage = {
        id: `e-a-${Date.now()}`,
        role: 'assistant',
        text: response,
      };
      const nextMessages = [...messagesRef.current, assistantMessage];
      setMessages(nextMessages);
      upsertSession(nextMessages, sessionIdForTurn);
    }, steps.length * 800 + 500);
  };

  const handleExportPdf = (messageText: string) => {
    const blob = new Blob([messageText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expert-report-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-full relative">
      {isHistoryVisible ? (
        <HistorySidebar
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelectSession={(session) => {
            setActiveSessionId(session.id);
            setMessages(session.messages);
          }}
          onHide={() => setIsHistoryVisible(false)}
          onNewSession={createNewSession}
        />
      ) : (
        <button
          onClick={() => setIsHistoryVisible(true)}
          className="absolute left-0 top-1/2 -translate-y-1/2 bg-primary text-black px-2 py-5 rounded-r-lg font-bold shadow-lg hover:bg-primary/90 transition-all z-10"
          title="展开历史对话"
        >
          <PanelLeftOpen size={16} />
        </button>
      )}

      <div className="flex-1 flex flex-col overflow-hidden p-8">
        <div className="flex-1 overflow-y-auto space-y-6 pr-4">
        {!hasStarted && (
          <div className="h-full min-h-[360px] flex items-center justify-center">
            <div className="max-w-2xl text-center">
              <h2 className="text-3xl font-bold text-white mb-3">询问你的专属专家</h2>
              <p className="text-sm text-gray-400">输入问题后，专家智能体会开始和你连续对话。</p>
            </div>
          </div>
        )}

        {hasStarted && (
          <>
            {messages.map((m) => (
              <div key={m.id} className="w-full">
                {m.role === 'user' ? (
                  // 用户消息：右对齐
                  <div className="flex justify-end">
                    <div className="bg-primary text-black px-5 py-3 rounded-2xl max-w-2xl text-sm leading-relaxed">
                      {m.text}
                    </div>
                  </div>
                ) : (
                  // 助手消息：左对齐，带头像，纯文本显示
                  <div className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0">
                      <Bot className="text-black" size={20} />
                    </div>
                    <div className="flex-1">
                      <div className="bg-surface rounded-2xl px-6 py-4 border border-white/5">
                        <pre className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap font-sans">
                          {m.text}
                        </pre>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => handleExportPdf(m.text)}
                          className="px-4 py-2 bg-surface-hover hover:bg-[#353534] text-xs rounded-lg flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
                        >
                          <Download size={14} /> 导出 PDF
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* 思考状态 */}
            {isThinking && (
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0">
                  <Bot className="text-black" size={20} />
                </div>
                <div className="flex-1">
                  <div className="bg-surface rounded-2xl px-6 py-4 border border-white/5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                      <span className="text-sm text-gray-400">正在思考...</span>
                    </div>
                    <div className="space-y-2">
                      {thinkingSteps.map((step, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-gray-500">
                          <CheckCircle2 className="text-primary" size={14} />
                          {step}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

        <div className="mt-8 max-w-4xl mx-auto w-full">
          <div className="bg-surface-hover rounded-xl p-4 border-l-2 border-primary shadow-lg">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              className="w-full bg-transparent border-none focus:ring-0 text-sm resize-none h-20 mb-2 outline-none"
              placeholder="向专家智能体提问，例如：分析下一季度整车供应链风险..."
            ></textarea>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-3 px-4 py-2 bg-surface rounded border border-white/10">
                    <span className="text-xs text-gray-300 font-bold">知识范围</span>
                    <label className="flex items-center gap-2 text-xs text-gray-200 cursor-pointer">
                      <input type="checkbox" checked={filters.f1} onChange={e => setFilters({...filters, f1: e.target.checked})} className="rounded bg-surface-hover border-none text-primary focus:ring-0 w-3.5 h-3.5" /> 洞察报告
                    </label>
                    <label className="flex items-center gap-2 text-xs text-gray-200 cursor-pointer">
                      <input type="checkbox" checked={filters.f2} onChange={e => setFilters({...filters, f2: e.target.checked})} className="rounded bg-surface-hover border-none text-primary focus:ring-0 w-3.5 h-3.5" /> 整车知识
                    </label>
                    <label className="flex items-center gap-2 text-xs text-gray-200 cursor-pointer">
                      <input type="checkbox" checked={filters.f3} onChange={e => setFilters({...filters, f3: e.target.checked})} className="rounded bg-surface-hover border-none text-primary focus:ring-0 w-3.5 h-3.5" /> 行业知识
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsOnline((prev) => !prev)}
                    className="flex items-center gap-3 px-4 py-2 bg-surface rounded border border-white/10"
                  >
                    <span className="text-xs text-gray-300 font-bold">联网</span>
                    <div className={`w-8 h-4 rounded-full relative transition-colors ${isOnline ? 'bg-primary' : 'bg-gray-600'}`}>
                      <div className={`absolute top-0.5 w-3 h-3 bg-black rounded-full transition-all ${isOnline ? 'right-0.5' : 'left-0.5'}`}></div>
                    </div>
                  </button>
                </div>
              </div>
              <button onClick={handleSend} className="w-10 h-10 bg-primary text-black rounded-full flex items-center justify-center hover:bg-primary/90">
                <Send size={18} className="ml-1" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
