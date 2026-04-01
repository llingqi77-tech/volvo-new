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
          专家智能体
        </button>
        <button 
          onClick={() => setChatType('customer')}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${chatType === 'customer' ? 'bg-primary text-black' : 'text-gray-400 hover:bg-white/5'}`}
        >
          客户智能体
        </button>
      </div>

      {chatType === 'customer' ? <CustomerChat /> : <ExpertChat />}
    </div>
  );
}

function CustomerChat() {
  const [input, setInput] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isPresetPreview] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [personaIntro, setPersonaIntro] = useState(
    '你好，我是王静仪，32岁，策略总监。我的决策逻辑非常明确：优先考虑安全冗余和信息效率，而不是功能堆砌。每天通勤时间长、决策压力大，所以我希望车机系统能够主动过滤噪声信息、提供低打扰但高确定性的辅助体验。如果一辆车能在“安全感、静谧感、信任感”三点上持续稳定，我会愿意长期使用并向同事推荐。',
  );
  const [personaName, setPersonaName] = useState('王静仪');
  const [personaRole, setPersonaRole] = useState('32岁，策略总监');
  const [personaCoreDrive, setPersonaCoreDrive] = useState('追求高效决策与工作生活平衡，对智能驾驶安全性高度敏感。');
  const [personaAesthetic, setPersonaAesthetic] = useState('北欧极简');
  const [personaPriceSensitivity, setPersonaPriceSensitivity] = useState('低（价值导向）');
  const [customerMessages, setCustomerMessages] = useState<ChatMessage[]>([
    { id: 'c-a-1', role: 'assistant', text: '你好，我已准备好开始访谈。你可以先上传 PDF，或先提问。' },
  ]);
  const [interviewSteps, setInterviewSteps] = useState<InterviewStep[]>([
    {
      id: 's1',
      question: '你希望本次访谈优先聚焦哪类场景？',
      options: ['通勤出行体验', '家庭周末出行', '长途高速驾驶'],
    },
    {
      id: 's2',
      question: '你最关注智能座舱哪部分价值？',
      options: ['信息效率', '安全辅助', '情绪舒缓'],
    },
    {
      id: 's3',
      question: '你对品牌沟通方式更认可哪种？',
      options: ['技术参数证明', '真实用户故事', '第三方评测背书'],
    },
  ]);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const uploadRef = useRef<HTMLInputElement>(null);
  const customerBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    customerBottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [customerMessages]);
 
  const handleSend = () => {
    const question = input.trim();
    if (!question) return;
    setCustomerMessages((prev) => [...prev, { id: `c-u-${Date.now()}`, role: 'user', text: question }]);
    setInput('');
    setTimeout(() => {
      const analysis = pdfFile
        ? `分析中：我先从上传文档中定位与你问题“${question}”相关的行为动因与高频VOC片段。`
        : `分析中：当前未上传PDF，我将先基于通用访谈方法对“${question}”做初步拆解。`;
      setCustomerMessages((prev) => [...prev, { id: `c-a-analysis-${Date.now()}`, role: 'assistant', text: analysis }]);
    }, 250);
    setTimeout(() => {
      const reply = pdfFile
        ? `已结合「${pdfFile.name}」的解析内容。关于“${question}”，我认为关键点是先确认用户决策动因，再拆解场景中的核心痛点。`
        : `收到。建议先上传 PDF 以获得更准确的人设访谈结果。针对“${question}”，我可以先给你通用访谈提纲。`;
      setCustomerMessages((prev) => [...prev, { id: `c-a-${Date.now()}`, role: 'assistant', text: reply }]);
    }, 650);
  };

  const handlePickOption = (stepIndex: number, option: string) => {
    setInterviewSteps((prev) =>
      prev.map((step, idx) => (idx === stepIndex ? { ...step, selected: option } : step)),
    );
    setCustomerMessages((prev) => [
      ...prev,
      { id: `c-u-opt-${Date.now()}`, role: 'user', text: `我选择：${option}` },
      { id: `c-a-opt-analysis-${Date.now()}`, role: 'assistant', text: `分析中：已记录你对该题的选择“${option}”，正在结合上下文生成下一步问题。` },
    ]);
    setTimeout(() => {
      setActiveStepIndex((prev) => Math.min(prev + 1, interviewSteps.length));
      setCustomerMessages((prev) => [
        ...prev,
        { id: `c-a-opt-next-${Date.now()}`, role: 'assistant', text: '好的，继续下一题。' },
      ]);
    }, 450);
  };

  const extractPdfText = async (file: File) => {
    const buffer = await file.arrayBuffer();
    const task = pdfjsLib.getDocument({ data: buffer });
    const pdf = await task.promise;
    const maxPages = Math.min(pdf.numPages, 3);
    const chunks: string[] = [];
    for (let pageNum = 1; pageNum <= maxPages; pageNum += 1) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();
      const text = content.items
        .map((item: any) => ('str' in item ? item.str : ''))
        .join(' ')
        .trim();
      if (text) chunks.push(text);
    }
    return chunks.join(' ').slice(0, 1200);
  };

  const onPickPdf = async (file: File | null) => {
    if (!file) return;
    if (file.type !== 'application/pdf') {
      window.alert('请上传 PDF 文件');
      return;
    }
    setIsParsing(true);
    try {
      const text = await extractPdfText(file);
      const snippet = text || '未提取到足够文本，已根据文档元信息完成基础画像。';
      setPdfFile(file);
      setPersonaName(file.name.replace(/\.pdf$/i, '').slice(0, 18) || '你的客户画像');
      setPersonaRole('文档解析生成画像');
      setPersonaCoreDrive('基于上传文档自动识别的核心动因，偏好高确定性的产品体验。');
      setPersonaAesthetic('简约务实');
      setPersonaPriceSensitivity('中低');
      setPersonaIntro(`你好，我是基于你上传文档生成的人设智能体。我的特征摘要：${snippet.slice(0, 120)}...`);
      setCustomerMessages((prev) => [
        ...prev,
        { id: `c-a-pdf-analysis-${Date.now()}`, role: 'assistant', text: `分析中：正在抽取「${file.name}」中的人物画像线索与VOC证据...` },
        { id: `c-a-pdf-${Date.now()}`, role: 'assistant', text: `PDF 解析完成：${file.name}。你现在可以开始深度访谈。` },
      ]);
    } catch {
      window.alert('PDF 解析失败，请更换文档重试');
    } finally {
      setIsParsing(false);
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden p-8 gap-8">
      <input
        ref={uploadRef}
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={(e) => onPickPdf(e.target.files?.[0] ?? null)}
      />

      {!pdfFile && !isPresetPreview ? (
        <div className="w-full flex flex-col">
          <div className="flex-1 flex items-center justify-center">
            <div className="w-full max-w-3xl p-10 text-center">
              <p className="text-3xl font-bold text-white">访谈你的客户</p>
              <p className="text-sm text-gray-400 mt-3">访谈你的客户，深度了解客户痛点</p>
            </div>
          </div>
          <div className="mt-6 max-w-4xl mx-auto w-full">
            <div className="bg-surface-hover rounded-xl p-4 border-l-2 border-primary shadow-lg">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                className="w-full bg-transparent border-none focus:ring-0 text-sm resize-none h-20 mb-2 outline-none"
                placeholder="上传PDF，解析客户信息，和你的客户一对一访谈..."
              />
              <div className="flex justify-end items-center">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => uploadRef.current?.click()}
                    className="w-10 h-10 bg-surface border border-white/10 text-gray-300 rounded-full flex items-center justify-center hover:text-white"
                    title="上传 PDF"
                  >
                    <Upload size={16} />
                  </button>
                  <button onClick={handleSend} className="w-10 h-10 bg-primary text-black rounded-full flex items-center justify-center hover:bg-primary/90">
                    <Send size={18} className="ml-1" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="w-1/3 bg-surface p-6 rounded-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <User size={80} />
            </div>
            <div className="relative z-10">
              <p className="text-xs text-primary font-bold mb-3">{isParsing ? '正在解析...' : '已完成解析'}</p>
              <h3 className="text-xl font-bold text-white mb-1">{personaName}</h3>
              <p className="text-xs text-gray-400 mb-1">{personaRole}</p>
              <p className="text-xs text-gray-500 mb-4">来源文件：{pdfFile?.name ?? '预设示例画像.pdf'}</p>
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] text-gray-500">开场白</span>
                  <p className="text-sm mt-1">{personaIntro}</p>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500">核心驱动力</span>
                  <p className="text-sm mt-1">{personaCoreDrive}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-surface-hover p-3 rounded">
                    <span className="text-[10px] text-gray-500 block mb-1">审美倾向</span>
                    <span className="text-white text-xs font-bold">{personaAesthetic}</span>
                  </div>
                  <div className="bg-surface-hover p-3 rounded">
                    <span className="text-[10px] text-gray-500 block mb-1">价格敏感度</span>
                    <span className="text-white text-xs font-bold">{personaPriceSensitivity}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 bg-surface rounded-xl flex flex-col overflow-hidden">
            <div className="px-6 py-4 bg-surface-hover flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                <div>
                  <h4 className="text-sm font-bold text-white">与 "{personaName}" 深度对话</h4>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {interviewSteps.map((step, idx) => {
                const show = idx <= activeStepIndex;
                if (!show) return null;
                const locked = !!step.selected || idx < activeStepIndex;
                return (
                  <div key={step.id} className="bg-surface-hover rounded-xl p-4 border border-white/10">
                    <div className="text-sm font-bold mb-3">{step.question}</div>
                    <div className="space-y-2">
                      {step.options.map((option) => {
                        const isSelected = step.selected === option;
                        return (
                          <button
                            key={option}
                            onClick={() => !locked && handlePickOption(idx, option)}
                            disabled={locked}
                            className={`w-full text-left px-3 py-2 rounded border text-sm transition-colors ${
                              isSelected
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-white/10 hover:bg-white/5 text-gray-200'
                            } ${locked ? 'cursor-default' : ''}`}
                          >
                            {option}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {customerMessages.map((m) => (
                <div key={m.id} className={`flex gap-4 w-full ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-10 h-10 rounded flex items-center justify-center shrink-0 ${m.role === 'user' ? 'bg-white/10' : 'bg-primary/20'}`}>
                    {m.role === 'user' ? <User className="text-white" size={20} /> : <Bot className="text-primary" size={20} />}
                  </div>
                  <div className={`${m.role === 'user' ? 'bg-primary text-black' : 'bg-surface-hover'} p-4 rounded-lg text-sm leading-relaxed w-full`}>
                    {m.text}
                  </div>
                </div>
              ))}
              <div ref={customerBottomRef}></div>
            </div>

            <div className="p-6 border-t border-white/10">
              <div className="bg-surface-hover rounded-lg p-2 flex items-end gap-2 focus-within:ring-1 ring-primary/50">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  className="flex-1 bg-transparent border-none focus:ring-0 text-sm resize-y min-h-24 py-3 px-2 outline-none"
                  placeholder="输入访谈问题，深度挖掘客户真实心智..."
                ></textarea>
                <button className="p-3 text-gray-400 hover:text-white"><Mic size={20} /></button>
                <button onClick={handleSend} className="p-3 bg-primary text-black rounded hover:bg-primary/90"><Send size={20} /></button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ExpertChat() {
  const [input, setInput] = useState('');
  const [filters, setFilters] = useState({ f1: true, f2: true, f3: false });
  const [isOnline, setIsOnline] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [hasStarted, setHasStarted] = useState(false);

  const handleSend = () => {
    const question = input.trim();
    if (!question) return;
    setHasStarted(true);
    setMessages((prev) => [...prev, { id: `e-u-${Date.now()}`, role: 'user', text: question }]);
    setInput('');
    setTimeout(() => {
      const scope = [
        filters.f1 ? '洞察报告' : null,
        filters.f2 ? '整车知识' : null,
        filters.f3 ? '行业知识' : null,
      ].filter(Boolean).join('、') || '默认知识库';
      setMessages((prev) => [
        ...prev,
        {
          id: `e-a-${Date.now()}`,
          role: 'assistant',
          text: `收到。已基于${scope}${isOnline ? '并结合联网信息' : ''}分析“${question}”。建议先给出3个关键结论，再补充风险和执行建议。`,
        },
      ]);
    }, 450);
  };

  const reportText = useMemo(
    () =>
      `2024 纯电 SUV 市场竞争力分析\n\n核心摘要：\n沃尔沃在2024年通过EX系列完成纯电平台升级，安全资产向数字安全能力迁移。\n\n核心功能点：\n- Lidar 全域感知增强\n- 可持续材料座舱工艺\n- 双电机全时效能管理\n`,
    [],
  );

  const handleExportPdf = () => {
    const blob = new Blob([reportText], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'expert-report.pdf';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden p-8">
      <div className="flex-1 overflow-y-auto space-y-8 pr-4">
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
              <div key={m.id} className={`flex gap-4 ${m.role === 'user' ? 'justify-end ml-24' : 'mr-24'}`}>
                {m.role === 'assistant' && (
                  <div className="w-10 h-10 rounded bg-primary flex items-center justify-center shrink-0">
                    <Bot className="text-black" size={20} />
                  </div>
                )}
                <div className={`${m.role === 'user' ? 'bg-surface-hover max-w-2xl' : 'flex-1'} p-4 rounded-xl text-sm leading-relaxed`}>
                  {m.text}
                </div>
              </div>
            ))}

            <div className="bg-surface rounded-xl p-6 border border-white/5">
              <h2 className="text-xl font-bold mb-6">2024 纯电 SUV 市场竞争力分析</h2>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-surface-hover p-5 rounded-lg">
                  <div className="text-xs text-gray-500 mb-2">核心摘要</div>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    沃尔沃在2024年通过EX系列完成了从内燃机逻辑向原生纯电平台的平稳过渡。其安全资产已成功转化为“数字安全锚点”，在感知算法和主动干预领域保持行业领先地位。
                  </p>
                </div>
                <div className="bg-surface-hover p-5 rounded-lg">
                  <div className="text-xs text-gray-500 mb-3">核心功能点</div>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2 text-sm text-gray-300">
                      <CheckCircle2 className="text-primary shrink-0 mt-0.5" size={16} />
                      Lidar 全域感知增强
                    </li>
                    <li className="flex items-start gap-2 text-sm text-gray-300">
                      <CheckCircle2 className="text-primary shrink-0 mt-0.5" size={16} />
                      可持续材料座舱工艺
                    </li>
                    <li className="flex items-start gap-2 text-sm text-gray-300">
                      <CheckCircle2 className="text-primary shrink-0 mt-0.5" size={16} />
                      双电机全时效能管理
                    </li>
                  </ul>
                </div>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-white/10">
                <div className="flex gap-2">
                  <button onClick={handleExportPdf} className="px-3 py-1.5 bg-surface-hover hover:bg-[#353534] text-xs rounded flex items-center gap-2">
                    <Download size={14} /> 导出 PDF
                  </button>
                </div>
              </div>
            </div>
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
