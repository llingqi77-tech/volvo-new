import { useRef, useState, useEffect } from 'react';
import { Command, Paperclip, Mic, ArrowRight, Upload, FileText, Share2, Download, User } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

export default function FormalResearch({ isSidebarCollapsed = false }: { isSidebarCollapsed?: boolean }) {
  const [step, setStep] = useState(1);
  const [userInput, setUserInput] = useState('');
  const [classification, setClassification] = useState<{
    kind: string;
    framework: string;
    rationale: string;
    confidence: string;
  } | null>(null);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {step === 1 && <StepStart onNext={(input: string) => { setUserInput(input); setStep(2); }} />}
      {step === 2 && <StepVerify userInput={userInput} onNext={(cls) => { setClassification(cls); setStep(3); }} />}
      {step === 3 && <StepThreeColumn classification={classification} onNext={() => setStep(4)} />}
      {step === 4 && <StepAudience onNext={() => setStep(5)} />}
      {step === 5 && <StepConfirm onNext={() => setStep(6)} />}
      {step === 6 && <StepReport />}
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

function StepVerify({ userInput, onNext }: { userInput: string; onNext: (classification: any) => void }) {
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
        const result = await response.json();
        setClassification(result);

        // 根据分类结果生成第一个问题
        const firstQuestion = await generateNextQuestion(result, []);
        setQuestions([firstQuestion]);
        setIsClassifying(false);
      } catch (error) {
        console.error('分类失败:', error);
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
                      className={`p-3 text-left rounded border transition-colors ${selected ? 'border-primary bg-primary/10 text-primary' : 'border-white/10 hover:bg-white/5'}`}
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
            <button onClick={() => onNext(classification)} className="bg-primary text-black px-8 py-3 font-bold flex items-center gap-2 hover:bg-primary/90">
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

function StepThreeColumn({ classification, onNext }: { classification: any; onNext: () => void }) {
  return (
    <div className="flex-1 flex flex-col p-8 overflow-hidden">
      <div className="flex-1 grid grid-cols-3 gap-6 overflow-hidden">
        {/* Col 1 */}
        <div className="bg-surface rounded-xl flex flex-col overflow-hidden">
          <div className="p-6 flex-1 overflow-y-auto">
            <h3 className="text-2xl font-bold mb-6">调研方案</h3>
            <div className="space-y-4">
              <div className="p-4 bg-white/5 border-l-2 border-primary">
                <div className="text-xs text-gray-500 mb-1">研究类型</div>
                <div className="text-sm font-bold">{classification?.kind ?? '未知'}</div>
              </div>
              <div className="p-4 bg-white/5 border-l-2 border-primary">
                <div className="text-xs text-gray-500 mb-1">分析框架</div>
                <div className="text-sm font-bold">{classification?.framework?.toUpperCase() ?? '未知'}</div>
              </div>
              <div className="p-4 bg-white/5">
                <div className="text-xs text-gray-500 mb-1">方法论</div>
                <div className="text-sm font-bold">双盲对比研究与沉浸式人机交互测试</div>
              </div>
              <div className="p-4 bg-white/5">
                <div className="text-xs text-gray-500 mb-1">日程安排</div>
                <div className="text-sm font-bold">周期：14个工作日 | 包含3场焦点小组</div>
              </div>
              <div className="p-4 bg-white/5">
                <div className="text-xs text-gray-500 mb-1">研究目标</div>
                <div className="text-sm font-bold">评估新一代智能驾驶系统的心理阈值与信任建立过程</div>
              </div>
            </div>
          </div>
          <EditablePanel
            placeholder="微调方案指令..."
          />
        </div>

        {/* Col 2 */}
        <div className="bg-surface rounded-xl flex flex-col overflow-hidden">
          <div className="p-6 flex-1 overflow-y-auto">
            <h3 className="text-2xl font-bold mb-6">访谈大纲</h3>
            <div className="space-y-6">
              <div className="border-b border-white/10 pb-4">
                <div className="text-xs text-primary mb-2">A 部分 / 破冰环节</div>
                <div className="text-sm text-gray-300">探讨用户日常出行痛点及对品牌的第一印象。</div>
              </div>
              <div className="border-b border-white/10 pb-4">
                <div className="text-xs text-primary mb-2">B 部分 / 核心体验</div>
                <div className="text-sm text-gray-300">针对 HMI 界面的操作逻辑进行深挖，重点关注非语言反馈。</div>
              </div>
            </div>
          </div>
          <EditablePanel
            placeholder="微调大纲逻辑..."
          />
        </div>

        {/* Col 3 */}
        <div className="bg-surface rounded-xl flex flex-col overflow-hidden">
          <div className="p-6 flex-1 overflow-y-auto relative">
            <button
              onClick={onNext}
              className="absolute top-0 right-0 mt-2 mr-2 px-3 py-1 text-xs bg-primary text-black hover:bg-primary/90 rounded font-bold"
            >
              查看人设详情
            </button>
            <h3 className="text-2xl font-bold mb-6">人群选择</h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white/5 p-4 aspect-square flex flex-col justify-end relative overflow-hidden">
                <div className="absolute inset-0 opacity-40 bg-gradient-to-t from-black to-transparent z-10"></div>
                <img src="https://i.pravatar.cc/300?img=11" className="absolute inset-0 w-full h-full object-cover grayscale" />
                <div className="relative z-20">
                  <div className="text-[10px] font-bold">细分人群 A</div>
                  <div className="text-xs">先锋科技族群</div>
                </div>
              </div>
              <div className="bg-white/5 p-4 aspect-square flex flex-col justify-end relative overflow-hidden">
                <div className="absolute inset-0 opacity-40 bg-gradient-to-t from-black to-transparent z-10"></div>
                <img src="https://i.pravatar.cc/300?img=5" className="absolute inset-0 w-full h-full object-cover grayscale" />
                <div className="relative z-20">
                  <div className="text-[10px] font-bold">细分人群 B</div>
                  <div className="text-xs">北欧简约主义者</div>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs"><span className="text-gray-500">样本量</span><span className="font-bold">N=450</span></div>
              <div className="flex justify-between text-xs"><span className="text-gray-500">地区分布</span><span className="font-bold">北欧 / 亚太 / 北美</span></div>
              <div className="flex justify-between text-xs"><span className="text-gray-500">置信度</span><span className="font-bold text-primary">98.4%</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepAudience({ onNext }: { onNext: () => void }) {
  const [profiles, setProfiles] = useState([
    { id: 'c1', name: '理性先锋型', tags: ['高净值', '智驾优先', '效率导向'], users: '128+ users', voc: '542+ VOC' },
    { id: 'c2', name: '家庭安全型', tags: ['家庭用户', '空间诉求', '安全敏感'], users: '106+ users', voc: '497+ VOC' },
    { id: 'c3', name: '环保极简型', tags: ['可持续偏好', '极简审美', '材质敏感'], users: '94+ users', voc: '451+ VOC' },
    { id: 'c4', name: '科技尝鲜型', tags: ['数字原生', '功能探索', '社媒活跃'], users: '113+ users', voc: '533+ VOC' },
    { id: 'c5', name: '品牌认同型', tags: ['品牌价值', '长期主义', '口碑驱动'], users: '102+ users', voc: '468+ VOC' },
  ]);
  const [selectedProfileId, setSelectedProfileId] = useState('c1');
  const [tagInput, setTagInput] = useState('');
  const [personas, setPersonas] = useState([
    { id: 'p1', profileId: 'c1', name: '陈思远', tags: ['科技极客', '高净值'], score: 8.8, conf: 93, cdpTags: ['智驾优先', '高净值', '效率导向'], voc: '我希望车辆主动发现风险并接管平顺。', radar: [82, 90, 84, 76, 92, 95, 70] },
    { id: 'p2', profileId: 'c1', name: '林沐然', tags: ['精致生活家', '安全控'], score: 9.1, conf: 95, cdpTags: ['家庭用户', '安全敏感', '材质关注'], voc: '环保材料不是口号，体验和质感必须同时在线。', radar: [80, 86, 88, 74, 94, 83, 79] },
    { id: 'p2-1', profileId: 'c2', name: '周祺', tags: ['家庭安全', '空间导向'], score: 8.7, conf: 92, cdpTags: ['家庭用户', '空间诉求', '安全敏感'], voc: '后排空间和主动安全是我购车决策第一优先级。', radar: [84, 81, 78, 73, 93, 79, 88] },
    { id: 'p3-1', profileId: 'c3', name: '许悠然', tags: ['环保主义', '极简'], score: 8.9, conf: 91, cdpTags: ['可持续偏好', '极简审美', '材质敏感'], voc: '我希望环保材料不仅环保，还要有高级触感和设计统一性。', radar: [79, 85, 90, 72, 89, 82, 76] },
    { id: 'p3', profileId: 'c4', name: '张逸豪', tags: ['都市先锋', 'Z世代'], score: 9.3, conf: 96, cdpTags: ['数字原生', '尝鲜驱动', '社媒活跃'], voc: '我会先看真实测评，再决定是否愿意信任品牌叙事。', radar: [76, 95, 87, 90, 82, 97, 74] },
    { id: 'p5-1', profileId: 'c5', name: '宋致远', tags: ['长期主义', '品牌认同'], score: 8.6, conf: 90, cdpTags: ['品牌价值', '长期主义', '口碑驱动'], voc: '我更看重品牌长期信誉和真实用户口碑，而非短期营销话术。', radar: [81, 83, 77, 75, 85, 78, 91] },
  ]);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(null);

  const selectedProfile = profiles.find((p) => p.id === selectedProfileId) ?? profiles[0];
  const selectedPersona = personas.find((p) => p.id === selectedPersonaId) ?? null;
  const filteredPersonas = personas.filter((p) => p.profileId === selectedProfileId || p.profileId === 'all');

  const addTagToAllProfiles = () => {
    const tag = tagInput.trim();
    if (!tag) return;
    setProfiles((prev) => prev.map((p) => (!p.tags.includes(tag) ? { ...p, tags: [...p.tags, tag] } : p)));
    setTagInput('');
  };

  const generateNewProfiles = () => {
    const suffix = `${profiles.length + 1}`;
    setProfiles((prev) => [
      ...prev,
      {
        id: `c-new-${Date.now()}`,
        name: `新增画像${suffix}`,
        tags: ['新增标签', '趋势洞察', '待验证'],
        users: `${90 + prev.length * 3}+ users`,
        voc: `${430 + prev.length * 12}+ VOC`,
      },
    ]);
  };

  const generatePersonas = () => {
    const created = profiles.slice(0, 5).flatMap((profile, idx) => [
      {
        id: `gen-${profile.id}-a`,
        profileId: profile.id,
        name: `${profile.name}A`,
        tags: [profile.tags[0] ?? '标签1', profile.tags[1] ?? '标签2'],
        score: 8.4 + (idx % 3) * 0.4,
        conf: 90 + (idx % 5),
        cdpTags: profile.tags,
        voc: `来自${profile.name}的代表性VOC：用户在决策中持续强调安全与体验平衡。`,
        radar: [78 + idx, 84 + idx, 80 + idx, 74 + idx, 88 + idx, 90 + idx, 72 + idx],
      },
      {
        id: `gen-${profile.id}-b`,
        profileId: profile.id,
        name: `${profile.name}B`,
        tags: [profile.tags[1] ?? '标签1', '潜客行为'],
        score: 8.2 + (idx % 4) * 0.3,
        conf: 89 + (idx % 6),
        cdpTags: profile.tags,
        voc: `来自${profile.name}的代表性VOC：希望系统在复杂场景里提供低打扰高确定性反馈。`,
        radar: [76 + idx, 82 + idx, 79 + idx, 77 + idx, 86 + idx, 91 + idx, 75 + idx],
      },
    ]);
    setPersonas(created);
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
                  <button
                    key={profile.id}
                    onClick={() => setSelectedProfileId(profile.id)}
                    className={`w-full text-left p-4 rounded border transition-colors ${active ? 'border-primary bg-primary/10' : 'border-white/10 hover:bg-white/5'}`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold">{profile.name}</span>
                      <span className="text-[10px] text-primary">{profile.users}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {profile.tags.map((tag) => (
                        <span key={tag} className="px-2 py-1 rounded bg-surface-hover text-xs text-gray-300">{tag}</span>
                      ))}
                    </div>
                    <div className="text-[11px] text-gray-500">{profile.voc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-surface p-6 rounded-xl">
            <h3 className="text-sm font-bold mb-4">新增画像</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedProfile.tags.map((tag) => (
                <span key={tag} className="px-2 py-1 rounded bg-surface-hover text-xs text-primary">{tag}</span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTagToAllProfiles()}
                placeholder="新增 CDP 标签（将应用到所有画像）..."
                className="flex-1 bg-surface-hover border border-white/10 rounded p-2 text-sm outline-none"
              />
              <button onClick={addTagToAllProfiles} className="px-4 py-2 bg-primary text-black rounded text-sm font-bold">添加</button>
            </div>
            <button onClick={generateNewProfiles} className="w-full mt-4 bg-primary text-black py-2 rounded text-sm font-bold">
              生成新画像
            </button>
            <button onClick={generatePersonas} className="w-full mt-3 bg-surface-hover text-white py-2 rounded text-sm font-bold hover:bg-white/10">
              根据当前画像生成模拟人设
            </button>
          </div>
        </div>

        <div className="col-span-7 space-y-6">
          {selectedPersona ? (
            <div className="bg-surface p-6 rounded-xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">{selectedPersona.name} - 详情</h3>
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
                    <PolarGrid stroke="#333" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#888', fontSize: 10 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar name="Persona" dataKey="A" stroke="#63fe33" fill="#63fe33" fillOpacity={0.3} />
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
                    <h4 className="text-lg font-bold mb-2">{p.name}</h4>
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
          <p className="text-gray-500 text-xs">仅支持 PDF 格式，最大 100MB</p>
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
