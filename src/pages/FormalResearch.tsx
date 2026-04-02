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
  const [verificationAnswers, setVerificationAnswers] = useState<Array<{ question: string; answer: string[] }>>([]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {step === 1 && <StepStart onNext={(input: string) => { setUserInput(input); setStep(2); }} />}
      {step === 2 && <StepVerifyAndPlan userInput={userInput} onNext={(cls, answers) => { setClassification(cls); setVerificationAnswers(answers); setStep(3); }} />}
      {step === 3 && <StepAudience onNext={() => setStep(4)} />}
      {step === 4 && <StepConfirm onNext={() => setStep(5)} />}
      {step === 5 && <StepReport />}
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

function StepVerifyAndPlan({ userInput, onNext }: { userInput: string; onNext: (classification: any, answers: Array<{ question: string; answer: string[] }>) => void }) {
  type Question = { id: string; mode: 'single' | 'multi' | 'multiple'; title: string; options: string[] };
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
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentIndex, isThinking, thinkingSteps]);

  const simulateThinkingProcess = (roundNumber: number) => {
    const thinkingProcesses = [
      [
        '分析用户输入的研究问题...',
        '识别核心研究维度：目标人群、研究场景、关注点',
        '基于研究类型，确定首要澄清的参数',
        '生成第一个核验问题'
      ],
      [
        '整合前一轮的回答...',
        '评估已确认的研究参数完整性',
        '识别尚未明确的关键维度',
        '设计针对性的追问策略',
        '生成下一个核验问题'
      ],
      [
        '综合分析前两轮的回答...',
        '构建初步的研究框架雏形',
        '识别潜在的研究盲区',
        '确定需要进一步细化的方向',
        '生成第三个核验问题'
      ],
      [
        '回顾已收集的所有参数...',
        '评估研究方案的可行性',
        '识别执行层面的关键细节',
        '确定最后需要确认的要素',
        '生成第四个核验问题'
      ],
      [
        '整合所有核验结果...',
        '验证研究参数的一致性和完整性',
        '确认最后的关键假设',
        '生成最终核验问题'
      ]
    ];

    const steps = thinkingProcesses[Math.min(roundNumber, 4)];
    setThinkingSteps([]);

    steps.forEach((step, idx) => {
      setTimeout(() => {
        setThinkingSteps(prev => [...prev, step]);
      }, idx * 600);
    });

    return steps.length * 600;
  };

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
      return {
        id: `q${previousAnswers.length + 1}`,
        mode: 'single' as const,
        title: `请选择第 ${previousAnswers.length + 1} 个研究参数`,
        options: ['选项 A', '选项 B', '选项 C', '选项 D'],
      };
    }
  };

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
  const isDone = currentIndex >= 5;

  const submitAnswer = async (picked: string[]) => {
    if (!current) return;

    setAnswers((prev) => ({ ...prev, [current.id]: picked }));
    setIsThinking(true);

    // 模拟思考过程
    const thinkingDuration = simulateThinkingProcess(currentIndex);

    try {
      if (currentIndex < 4) {
        const previousAnswers = Object.entries({ ...answers, [current.id]: picked }).map(([qId, ans]) => ({
          question: questions.find(q => q.id === qId)?.title ?? '',
          answer: ans,
        }));

        // 等待思考过程完成
        await new Promise(resolve => setTimeout(resolve, thinkingDuration + 500));

        const nextQuestion = await generateNextQuestion(classification, previousAnswers);
        setQuestions((prev) => [...prev, nextQuestion]);
      } else {
        // 最后一题，等待思考完成
        await new Promise(resolve => setTimeout(resolve, thinkingDuration + 500));
      }

      setIsThinking(false);
      setThinkingSteps([]);
      setCurrentIndex((prev) => prev + 1);
    } catch (error) {
      console.error('生成下一题失败:', error);
      setIsThinking(false);
      setThinkingSteps([]);
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

  const handleGenerateArtifact = (type: 'plan' | 'interview') => {
    setSelectedArtifact(type);
    setIsPanelVisible(true);
    setIsGeneratingPlan(true);
    setTimeout(() => {
      setIsGeneratingPlan(false);
    }, 2000);
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
    <div className="flex-1 flex overflow-hidden">
      {/* 左侧：对话流 */}
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
                {current.mode !== 'single' && (
                  <button
                    onClick={() => submitAnswer(currentPicked)}
                    disabled={isThinking || currentPicked.length === 0}
                    className="mt-4 w-full bg-primary text-black px-4 py-2 font-bold rounded disabled:opacity-50"
                  >
                    确认选择
                  </button>
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
                  <div key={idx} className="flex items-start gap-2 text-sm text-gray-400 animate-fade-in">
                    <span className="text-primary mt-0.5">▸</span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div ref={chatBottomRef}></div>

          {isDone && !isThinking && (
            <>
              <div className="bg-surface p-6 rounded-xl border border-white/10">
                <div className="text-sm font-bold mb-2">动态核验已完成</div>
                <div className="text-xs text-gray-400 mb-4">5/5 题已确认，系统已生成初步方案</div>
                <div className="text-xs text-gray-500 mb-4">点击下方卡片查看详细内容</div>

                {/* Artifact 卡片 */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleGenerateArtifact('plan')}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      selectedArtifact === 'plan'
                        ? 'border-primary bg-primary/10'
                        : 'border-white/10 hover:border-white/20 bg-surface-hover'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <FileText size={18} className="text-primary" />
                      <span className="text-sm font-bold text-white">调研方案</span>
                    </div>
                    <p className="text-xs text-gray-400">研究背景、方法论、执行计划</p>
                  </button>

                  <button
                    onClick={() => handleGenerateArtifact('interview')}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      selectedArtifact === 'interview'
                        ? 'border-primary bg-primary/10'
                        : 'border-white/10 hover:border-white/20 bg-surface-hover'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <User size={18} className="text-primary" />
                      <span className="text-sm font-bold text-white">访谈大纲</span>
                    </div>
                    <p className="text-xs text-gray-400">结构化访谈问题设计</p>
                  </button>
                </div>
              </div>

              <button
                onClick={() => {
                  const answersArray = Object.entries(answers).map(([qId, ans]) => ({
                    question: questions.find(q => q.id === qId)?.title ?? '',
                    answer: ans
                  }));
                  onNext(classification, answersArray);
                }}
                className="w-full bg-primary text-black px-8 py-3 font-bold flex items-center justify-center gap-2 hover:bg-primary/90 rounded-lg"
              >
                确认方案，进入下一步 <ArrowRight size={18} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* 右侧：方案展示 - 仅在完成后显示 */}
      {isDone && isPanelVisible && (
        <div className="w-1/2 overflow-y-auto bg-white text-black relative">
          {/* 隐藏按钮 */}
          <button
            onClick={() => setIsPanelVisible(false)}
            className="absolute top-4 right-4 z-10 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors"
            title="隐藏面板"
          >
            ✕
          </button>

          {isGeneratingPlan && (
            <div className="h-full flex items-center justify-center p-12">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-sm text-gray-600">正在生成{selectedArtifact === 'plan' ? '调研方案' : '访谈大纲'}...</p>
              </div>
            </div>
          )}

          {!isGeneratingPlan && selectedArtifact === 'plan' && (
            <div className="p-16 max-w-4xl mx-auto">
              {/* PDF 样式的文档 */}
              <div className="mb-12">
                <h1 className="text-4xl font-bold mb-4">调研方案</h1>
                <div className="text-sm text-gray-600 mb-2">生成时间：{new Date().toLocaleDateString('zh-CN')}</div>
                <div className="h-1 bg-black w-20"></div>
              </div>

              <div className="space-y-10 text-base leading-relaxed">
                <section>
                  <h2 className="text-2xl font-bold mb-4">一、研究背景</h2>
                  <p className="text-gray-800 leading-loose">
                    在当前新能源汽车市场快速发展的背景下，年轻消费群体（18-35岁）正成为新能源车的主要潜在购买者。这一群体成长于互联网时代，对科技产品接受度高，同时也更关注环保和可持续发展。
                  </p>
                  <p className="text-gray-800 leading-loose mt-4">
                    然而，尽管新能源车市场增长迅速，年轻人对新能源车的认知、态度和购买意愿仍存在较大差异。部分年轻人对续航里程、充电便利性、智能化体验等方面存在顾虑，这些因素直接影响其购买决策。
                  </p>
                  <p className="text-gray-800 leading-loose mt-4">
                    因此，深入了解年轻人对新能源车的真实看法、核心关注点和决策动机，对于产品优化、营销策略制定和用户体验提升具有重要意义。
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4">二、研究主题</h2>
                  <p className="text-gray-800 leading-loose">
                    年轻人（18-35岁）对新能源汽车的认知、态度与购买决策研究
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4">三、核心研究问题</h2>
                  <p className="text-gray-800 leading-loose">
                    年轻人在考虑购买新能源车时，核心关注点是什么？哪些因素促进或阻碍了他们的购买决策？
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4">四、研究方法</h2>
                  <p className="text-gray-800 leading-loose mb-4">
                    本研究采用定性研究为主、定量验证为辅的混合方法：
                  </p>
                  <div className="ml-6 space-y-4">
                    <div>
                      <h3 className="font-bold mb-2">4.1 定性研究</h3>
                      <ul className="list-disc ml-6 space-y-1 text-gray-800">
                        <li>深度访谈（1对1）：15-20 人，每人 60 分钟</li>
                        <li>焦点小组讨论：2 组，每组 6-8 人，每组 90 分钟</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-bold mb-2">4.2 定量研究</h3>
                      <ul className="list-disc ml-6 space-y-1 text-gray-800">
                        <li>在线问卷调查：200-300 份，用于验证定性研究中的关键发现</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-bold mb-2">4.3 分析方法</h3>
                      <ul className="list-disc ml-6 space-y-1 text-gray-800">
                        <li>主题分析（Thematic Analysis）：识别核心主题和模式</li>
                        <li>JTBD 框架分析：理解用户试图完成的任务和期望结果</li>
                        <li>用户旅程地图：绘制从认知到购买的完整决策路径</li>
                      </ul>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4">五、目标受众</h2>
                  <div className="ml-6 space-y-4">
                    <div>
                      <h3 className="font-bold mb-2">5.1 目标人群定义</h3>
                      <ul className="list-disc ml-6 space-y-1 text-gray-800">
                        <li>年龄：18-35 岁</li>
                        <li>职业：在校大学生、职场新人、成熟职场人</li>
                        <li>地域：一线及新一线城市（北上广深、杭州、成都等）</li>
                        <li>用车需求：有购车计划或正在考虑购车</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-bold mb-2">5.2 样本量</h3>
                      <ul className="list-disc ml-6 space-y-1 text-gray-800">
                        <li>深度访谈：15-20 人</li>
                        <li>焦点小组：12-16 人（2 组）</li>
                        <li>在线问卷：200-300 份</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-bold mb-2">5.3 人群细分</h3>
                      <ul className="list-disc ml-6 space-y-1 text-gray-800">
                        <li>理性派（30%）：重视参数、性价比、实用性</li>
                        <li>体验派（40%）：重视驾驶感受、智能化、设计美学</li>
                        <li>环保派（30%）：重视可持续性、品牌价值观、社会责任</li>
                      </ul>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4">六、执行计划</h2>
                  <div className="ml-6 space-y-4">
                    <div>
                      <h3 className="font-bold mb-2">6.1 时间规划（共 6 周）</h3>
                      <ul className="list-disc ml-6 space-y-1 text-gray-800">
                        <li>Week 1-2：招募筛选、预约安排</li>
                        <li>Week 3-4：深度访谈执行（15-20 场）</li>
                        <li>Week 5：焦点小组执行（2 场）+ 问卷发放</li>
                        <li>Week 6：数据分析、报告撰写</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-bold mb-2">6.2 资源需求</h3>
                      <ul className="list-disc ml-6 space-y-1 text-gray-800">
                        <li>研究团队：主研究员 1 人 + 助理研究员 1 人</li>
                        <li>招募渠道：社交媒体（小红书、微博）、汽车社群、高校合作</li>
                        <li>场地：访谈室（安静、私密）、焦点小组室（可容纳 8-10 人）</li>
                        <li>设备：录音设备、转录工具、在线问卷平台</li>
                        <li>激励：深度访谈 200-300 元/人，焦点小组 150-200 元/人</li>
                      </ul>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4">七、预期输出</h2>
                  <ul className="list-decimal ml-6 space-y-2 text-gray-800">
                    <li>用户画像报告：3 类典型用户画像，包含人口特征、心理特征、行为模式、需求痛点</li>
                    <li>核心洞察报告：年轻人对新能源车的认知现状、购买决策关键因素、续航焦虑分析</li>
                    <li>用户旅程地图：从认知到购买的完整决策路径可视化</li>
                    <li>策略建议报告：产品优化建议、营销策略建议、用户体验提升方向</li>
                  </ul>
                </section>
              </div>
            </div>
          )}

          {!isGeneratingPlan && selectedArtifact === 'interview' && (
            <div className="p-16 max-w-4xl mx-auto">
              {/* PDF 样式的文档 */}
              <div className="mb-12">
                <h1 className="text-4xl font-bold mb-4">访谈大纲</h1>
                <div className="text-sm text-gray-600 mb-2">生成时间：{new Date().toLocaleDateString('zh-CN')}</div>
                <div className="h-1 bg-black w-20"></div>
              </div>

              <div className="space-y-10 text-base leading-relaxed">
                <section>
                  <h2 className="text-2xl font-bold mb-4">Part A: 破冰环节（5-10 分钟）</h2>
                  <p className="text-gray-600 mb-4 italic">目标：建立信任，了解背景</p>
                  <ol className="list-decimal ml-6 space-y-3 text-gray-800">
                    <li>能否简单介绍一下您的日常出行方式？</li>
                    <li>您平时关注汽车相关的信息吗？通过什么渠道？</li>
                    <li>您对新能源车有什么第一印象？</li>
                  </ol>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4">Part B: 核心探索（30-40 分钟）</h2>
                  <p className="text-gray-600 mb-4 italic">目标：深入了解核心研究问题</p>

                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-bold mb-3">主题 1：认知与态度</h3>
                      <ol className="list-decimal ml-6 space-y-3 text-gray-800">
                        <li>您觉得新能源车和传统燃油车最大的区别是什么？
                          <div className="text-sm text-gray-600 mt-1 ml-4">追问：这些区别对您来说意味着什么？</div>
                        </li>
                        <li>如果考虑购买新能源车，您最关心哪些方面？
                          <div className="text-sm text-gray-600 mt-1 ml-4">追问：为什么这些方面对您很重要？</div>
                        </li>
                        <li>您身边有朋友或家人使用新能源车吗？他们的反馈如何？</li>
                      </ol>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold mb-3">主题 2：决策因素</h3>
                      <ol className="list-decimal ml-6 space-y-3 text-gray-800" start={4}>
                        <li>有哪些因素会促使您选择新能源车？
                          <div className="text-sm text-gray-600 mt-1 ml-4">追问：能否按重要性排序？</div>
                        </li>
                        <li>有哪些顾虑或担心会阻止您购买？
                          <div className="text-sm text-gray-600 mt-1 ml-4">追问：这些顾虑有多严重？</div>
                        </li>
                        <li>您会如何评估一辆新能源车是否值得购买？</li>
                      </ol>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold mb-3">主题 3：使用场景</h3>
                      <ol className="list-decimal ml-6 space-y-3 text-gray-800" start={7}>
                        <li>您主要的用车场景是什么？（通勤/出游/商务）
                          <div className="text-sm text-gray-600 mt-1 ml-4">追问：能否描述一个典型的用车日？</div>
                        </li>
                        <li>在这些场景下，您对车辆有什么特殊要求？</li>
                        <li>您对充电的便利性有什么期待？</li>
                      </ol>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4">Part C: 深挖与收尾（10-15 分钟）</h2>
                  <p className="text-gray-600 mb-4 italic">目标：挖掘深层动机，补充遗漏信息</p>
                  <ol className="list-decimal ml-6 space-y-3 text-gray-800">
                    <li>如果让您向朋友推荐新能源车，您会怎么说？
                      <div className="text-sm text-gray-600 mt-1 ml-4">追问：您会强调哪些优点？提醒哪些注意事项？</div>
                    </li>
                    <li>您觉得什么样的新能源车最符合您的需求？
                      <div className="text-sm text-gray-600 mt-1 ml-4">追问：能否描述您理想中的新能源车？</div>
                    </li>
                    <li>关于新能源车，还有什么我们没有聊到但您觉得重要的吗？</li>
                  </ol>
                </section>

                <section className="border-t pt-6 mt-8">
                  <h3 className="text-lg font-bold mb-3">访谈注意事项</h3>
                  <ul className="list-disc ml-6 space-y-2 text-gray-700 text-sm">
                    <li>保持开放式提问，避免引导性问题</li>
                    <li>鼓励受访者分享具体案例和故事</li>
                    <li>适时使用追问技巧："能否举个例子？"、"为什么这么说？"</li>
                    <li>注意观察非语言信号（犹豫、兴奋、困惑等）</li>
                    <li>灵活调整问题顺序，跟随受访者的思路</li>
                  </ul>
                </section>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 展开按钮 - 仅在完成且面板隐藏时显示 */}
      {isDone && !isPanelVisible && selectedArtifact && (
        <button
          onClick={() => setIsPanelVisible(true)}
          className="fixed right-4 top-1/2 -translate-y-1/2 bg-primary text-black px-4 py-3 rounded-l-lg font-bold shadow-lg hover:bg-primary/90 transition-all z-10"
        >
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
