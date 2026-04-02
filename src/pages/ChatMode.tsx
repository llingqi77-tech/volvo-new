import { useEffect, useMemo, useRef, useState } from 'react';
import { Upload, Bot, User, Send, Mic, CheckCircle2, Download } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
};

type InterviewStep = {
  id: string;
  question: string;
  options: string[];
  selected?: string;
};

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
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [hasStarted, setHasStarted] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isPanelVisible, setIsPanelVisible] = useState(true);
  const [selectedFilters, setSelectedFilters] = useState({
    sentiment: [] as string[],
    category: [] as string[],
    timeRange: 'all' as string
  });

  // 模拟VOC数据统计
  const vocStats = {
    total: 1247,
    positive: 856,
    neutral: 245,
    negative: 146,
    categories: [
      { name: '智能驾驶', count: 423 },
      { name: '内饰质感', count: 312 },
      { name: '续航里程', count: 289 },
      { name: '充电体验', count: 156 },
      { name: '售后服务', count: 67 }
    ]
  };

  const handleSend = () => {
    const question = input.trim();
    if (!question) return;
    setHasStarted(true);
    setMessages((prev) => [...prev, { id: `voc-u-${Date.now()}`, role: 'user', text: question }]);
    setInput('');

    // 显示分析过程
    setIsAnalyzing(true);

    setTimeout(() => {
      setIsAnalyzing(false);

      const response = `基于 ${vocStats.total} 条 VOC 数据的分析结果：

关于"${question}"的用户洞察：

高频关键词：
• 智能驾驶安全性（提及 423 次）
• 内饰质感与静谧性（提及 312 次）
• 续航里程焦虑（提及 289 次）

情感分布：
• 正面评价：68.6%（主要集中在安全配置和北欧设计）
• 中性描述：19.6%（功能性描述为主）
• 负面反馈：11.7%（主要关于充电便利性和价格）

典型用户声音：
"沃尔沃的主动安全系统让我在复杂路况下更有信心，这是我选择它的核心原因。"
"内饰的环保材料和静音效果确实不错，但充电网络覆盖还需要加强。"
"续航表现符合预期，但冬季衰减比想象中明显。"

洞察建议：
1. 强化安全技术的传播，这是核心竞争力
2. 持续优化充电体验和网络布局
3. 针对续航焦虑提供更透明的数据和解决方案`;

      setMessages((prev) => [
        ...prev,
        {
          id: `voc-a-${Date.now()}`,
          role: 'assistant',
          text: response,
        },
      ]);
    }, 2500);
  };

  return (
    <div className="flex h-full relative">
      {/* 左侧：VOC数据面板 - 可隐藏 */}
      {isPanelVisible && (
        <div className="w-80 bg-surface border-r border-white/10 flex flex-col">
          <div className="p-6 border-b border-white/10 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-white mb-2">VOC 数据库</h3>
              <p className="text-xs text-gray-500">用户之声数据洞察</p>
            </div>
            <button
              onClick={() => setIsPanelVisible(false)}
              className="w-8 h-8 bg-surface-hover hover:bg-white/10 rounded flex items-center justify-center text-gray-400 hover:text-white transition-colors"
              title="隐藏面板"
            >
              ✕
            </button>
          </div>

        {/* 数据统计 */}
        <div className="p-6 border-b border-white/10">
          <div className="space-y-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">总数据量</p>
              <p className="text-3xl font-bold text-white">{vocStats.total}</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-surface-hover rounded p-2">
                <p className="text-xs text-gray-500">正面</p>
                <p className="text-lg font-bold text-primary">{vocStats.positive}</p>
              </div>
              <div className="bg-surface-hover rounded p-2">
                <p className="text-xs text-gray-500">中性</p>
                <p className="text-lg font-bold text-gray-400">{vocStats.neutral}</p>
              </div>
              <div className="bg-surface-hover rounded p-2">
                <p className="text-xs text-gray-500">负面</p>
                <p className="text-lg font-bold text-red-400">{vocStats.negative}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 分类统计 */}
        <div className="p-6 border-b border-white/10">
          <p className="text-xs text-gray-500 font-bold mb-3">话题分布</p>
          <div className="space-y-2">
            {vocStats.categories.map((cat) => (
              <div key={cat.name} className="flex justify-between items-center">
                <span className="text-sm text-gray-300">{cat.name}</span>
                <span className="text-sm font-bold text-white">{cat.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 筛选器 */}
        <div className="p-6 flex-1 overflow-y-auto">
          <p className="text-xs text-gray-500 font-bold mb-3">数据筛选</p>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-gray-400 mb-2">情感倾向</p>
              <div className="space-y-1">
                {['正面', '中性', '负面'].map((sentiment) => (
                  <label key={sentiment} className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded bg-surface-hover border-none text-primary focus:ring-0 w-3.5 h-3.5"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedFilters(prev => ({ ...prev, sentiment: [...prev.sentiment, sentiment] }));
                        } else {
                          setSelectedFilters(prev => ({ ...prev, sentiment: prev.sentiment.filter(s => s !== sentiment) }));
                        }
                      }}
                    />
                    {sentiment}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-400 mb-2">时间范围</p>
              <select
                className="w-full bg-surface-hover border border-white/10 rounded p-2 text-xs text-white outline-none"
                value={selectedFilters.timeRange}
                onChange={(e) => setSelectedFilters(prev => ({ ...prev, timeRange: e.target.value }))}
              >
                <option value="all">全部时间</option>
                <option value="week">近一周</option>
                <option value="month">近一月</option>
                <option value="quarter">近三月</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* 展开按钮 - 仅在面板隐藏时显示 */}
      {!isPanelVisible && (
        <button
          onClick={() => setIsPanelVisible(true)}
          className="absolute left-0 top-1/2 -translate-y-1/2 bg-primary text-black px-3 py-6 rounded-r-lg font-bold shadow-lg hover:bg-primary/90 transition-all z-10"
        >
          <span className="writing-mode-vertical text-sm">VOC数据库</span>
        </button>
      )}

      {/* 右侧：对话区域 */}
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

              {/* 分析状态 */}
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
            <div className="flex justify-end">
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

function ExpertChat() {
  const [input, setInput] = useState('');
  const [filters, setFilters] = useState({ f1: true, f2: true, f3: false });
  const [isOnline, setIsOnline] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [hasStarted, setHasStarted] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingSteps, setThinkingSteps] = useState<string[]>([]);

  const handleSend = () => {
    const question = input.trim();
    if (!question) return;
    setHasStarted(true);
    setMessages((prev) => [...prev, { id: `e-u-${Date.now()}`, role: 'user', text: question }]);
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

      setMessages((prev) => [
        ...prev,
        {
          id: `e-a-${Date.now()}`,
          role: 'assistant',
          text: response,
        },
      ]);
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

  // 清理Markdown格式，转换为纯文本
  const cleanMarkdown = (text: string) => {
    return text
      .replace(/^#{1,6}\s+/gm, '') // 移除标题符号
      .replace(/\*\*(.*?)\*\*/g, '$1') // 移除加粗
      .replace(/\*(.*?)\*/g, '$1') // 移除斜体
      .replace(/^[-*]\s+/gm, '• ') // 将列表符号统一为圆点
      .replace(/`(.*?)`/g, '$1') // 移除代码标记
      .trim();
  };

  return (
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
  );
}
