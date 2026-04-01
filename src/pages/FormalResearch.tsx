import { useState } from 'react';
import { Command, Paperclip, Mic, ArrowRight, CheckCircle2, Upload, FileText, Share2, Download, User } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

export default function FormalResearch() {
  const [step, setStep] = useState(1);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {step === 1 && <StepStart onNext={() => setStep(2)} />}
      {step === 2 && <StepVerify onNext={() => setStep(3)} />}
      {step === 3 && <StepThreeColumn onNext={() => setStep(4)} />}
      {step === 4 && <StepAudience onNext={() => setStep(5)} />}
      {step === 5 && <StepConfirm onNext={() => setStep(6)} />}
      {step === 6 && <StepReport />}
    </div>
  );
}

function StepStart({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
      <div className="w-full max-w-4xl relative z-10">
        <div className="flex items-center justify-center gap-4 mb-8">
          <Command size={40} className="text-white" />
          <h2 className="text-4xl font-extrabold text-white">开始您的研究</h2>
        </div>
        <div className="bg-surface rounded-xl border border-white/10 overflow-hidden shadow-2xl">
          <div className="flex justify-end p-4">
            <button className="text-primary text-xs font-bold flex items-center gap-1 hover:underline">
              ✨ 需要帮助澄清您的想法？
            </button>
          </div>
          <div className="px-8 pb-12">
            <textarea 
              className="w-full bg-transparent border-none focus:ring-0 text-xl text-white placeholder:text-gray-600 resize-none h-32 outline-none"
              placeholder="请提出任何关于人类行为和决策制定的商业问题。我们将对驱动真实选择的主观因素进行建模。"
            ></textarea>
          </div>
          <div className="bg-white/5 p-4 flex justify-between items-center">
            <button className="text-gray-400 hover:text-white p-2"><Paperclip size={20} /></button>
            <div className="flex items-center gap-4">
              <button className="text-gray-400 hover:text-white flex items-center gap-2 text-xs font-bold">
                <Mic size={16} /> 点击开始
              </button>
              <button onClick={onNext} className="bg-primary text-black px-8 py-3 rounded-lg font-bold flex items-center gap-2 hover:bg-primary/90">
                开始研究 <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepVerify({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex-1 overflow-y-auto p-12">
      <div className="max-w-4xl mx-auto space-y-12 pb-32">
        <h2 className="text-2xl font-bold text-white mb-8">正式研究 - 动态核验</h2>
        
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary/20 flex items-center justify-center rounded">
              <span className="text-primary text-sm font-bold">1</span>
            </div>
            <span className="text-xs font-bold text-primary">Volvo Insight AI</span>
          </div>
          <div className="bg-surface p-8 border-l-2 border-primary shadow-lg">
            <h3 className="text-xl font-bold mb-4">核心调研受众细分 (单选)</h3>
            <p className="text-gray-400 text-sm mb-6">您希望本次调研重点关注哪一类潜客群体？这将决定后续调研问卷的侧重逻辑。</p>
            <div className="grid grid-cols-2 gap-4">
              <button className="p-4 border border-white/10 text-left hover:bg-white/5 transition-colors">
                <div className="font-bold mb-1">豪华车主转换型</div>
                <div className="text-xs text-gray-500">目前驾驶 BBA，对纯电 SUV 有升级意愿</div>
              </button>
              <button className="p-4 border border-primary bg-primary/10 text-left">
                <div className="font-bold text-primary mb-1">科技先行者</div>
                <div className="text-xs text-primary/70">关注辅助驾驶与极简主义人机交互的极客</div>
              </button>
              <button className="p-4 border border-white/10 text-left hover:bg-white/5 transition-colors">
                <div className="font-bold mb-1">中产家庭增购</div>
                <div className="text-xs text-gray-500">注重空间安全与北欧生活方式的年轻家庭</div>
              </button>
              <button className="p-4 border border-white/10 text-left hover:bg-white/5 transition-colors">
                <div className="font-bold mb-1">环保/极简主义者</div>
                <div className="text-xs text-gray-500">对可持续材料有极致要求的环保倡导者</div>
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary/20 flex items-center justify-center rounded">
              <span className="text-primary text-sm font-bold">2</span>
            </div>
            <span className="text-xs font-bold text-primary">Volvo Insight AI</span>
          </div>
          <div className="bg-surface p-8 border-l-2 border-primary shadow-lg">
            <h3 className="text-xl font-bold mb-4">竞争基准对标车型 (多选)</h3>
            <div className="grid grid-cols-3 gap-4">
              <button className="p-4 border border-primary bg-primary/10 text-center font-bold text-primary">BMW iX / Audi e-tron</button>
              <button className="p-4 border border-primary bg-primary/10 text-center font-bold text-primary">Polestar 3 / 4</button>
              <button className="p-4 border border-white/10 text-center font-bold hover:bg-white/5">NIO ES7 / ES8</button>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 right-0 left-64 bg-background/90 backdrop-blur-md p-8 border-t border-white/10">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <div className="text-[10px] text-primary font-bold mb-2">核验进度</div>
            <div className="flex items-center gap-4">
              <div className="w-48 h-1 bg-white/10"><div className="w-3/4 h-full bg-primary"></div></div>
              <span className="text-xs font-bold">75% 完成度</span>
            </div>
          </div>
          <button onClick={onNext} className="bg-primary text-black px-8 py-3 font-bold flex items-center gap-2 hover:bg-primary/90">
            生成初步方案 <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

function StepThreeColumn({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex-1 flex flex-col p-8 overflow-hidden">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-extrabold text-white">三位一体调研计划</h2>
          <div className="flex items-center gap-2 mt-2">
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
            <span className="text-xs text-gray-400 font-bold">准备执行</span>
          </div>
        </div>
        <button onClick={onNext} className="bg-primary text-black px-8 py-3 font-bold flex items-center gap-2 hover:bg-primary/90">
          开始执行 <ArrowRight size={18} />
        </button>
      </div>

      <div className="flex-1 grid grid-cols-3 gap-6 overflow-hidden">
        {/* Col 1 */}
        <div className="bg-surface rounded-xl flex flex-col overflow-hidden">
          <div className="p-6 flex-1 overflow-y-auto">
            <div className="text-[10px] text-primary font-bold mb-6">第一阶段</div>
            <h3 className="text-2xl font-bold mb-6">调研方案</h3>
            <div className="space-y-4">
              <div className="p-4 bg-white/5 border-l-2 border-primary">
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
          <div className="p-4 border-t border-white/10">
            <div className="relative">
              <input type="text" placeholder="微调方案指令..." className="w-full bg-white/5 border-none rounded p-3 text-sm focus:ring-1 focus:ring-primary outline-none" />
              <Mic className="absolute right-3 top-1/2 -translate-y-1/2 text-primary" size={16} />
            </div>
          </div>
        </div>

        {/* Col 2 */}
        <div className="bg-surface rounded-xl flex flex-col overflow-hidden">
          <div className="p-6 flex-1 overflow-y-auto">
            <div className="text-[10px] text-primary font-bold mb-6">第二阶段</div>
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
          <div className="p-4 border-t border-white/10">
            <div className="relative">
              <input type="text" placeholder="微调大纲逻辑..." className="w-full bg-white/5 border-none rounded p-3 text-sm focus:ring-1 focus:ring-primary outline-none" />
              <Mic className="absolute right-3 top-1/2 -translate-y-1/2 text-primary" size={16} />
            </div>
          </div>
        </div>

        {/* Col 3 */}
        <div className="bg-surface rounded-xl flex flex-col overflow-hidden">
          <div className="p-6 flex-1 overflow-y-auto">
            <div className="text-[10px] text-primary font-bold mb-6">第三阶段</div>
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
          <div className="p-4 border-t border-white/10">
            <div className="relative">
              <input type="text" placeholder="修改人群权重..." className="w-full bg-white/5 border-none rounded p-3 text-sm focus:ring-1 focus:ring-primary outline-none" />
              <Mic className="absolute right-3 top-1/2 -translate-y-1/2 text-primary" size={16} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepAudience({ onNext }: { onNext: () => void }) {
  const radarData = [
    { subject: '人口与成长轨迹', A: 80, fullMark: 100 },
    { subject: '心理动因', A: 90, fullMark: 100 },
    { subject: '心理特征维度', A: 85, fullMark: 100 },
    { subject: '行为维度', A: 70, fullMark: 100 },
    { subject: '需求与痛点', A: 95, fullMark: 100 },
    { subject: '技术接受度', A: 100, fullMark: 100 },
    { subject: '社会关系', A: 60, fullMark: 100 },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-10">
      <div className="flex justify-between items-end mb-8">
        <div>
          <div className="text-primary text-xs font-bold mb-2">模块 04 / 细分市场分析</div>
          <h2 className="text-4xl font-extrabold text-white">人群画像调整</h2>
        </div>
        <div className="flex gap-4">
          <button className="bg-white/10 px-6 py-3 text-sm font-bold hover:bg-white/20 transition-colors flex items-center gap-2">
            <Download size={16} /> 导出分析报告
          </button>
          <button onClick={onNext} className="bg-primary text-black px-6 py-3 text-sm font-bold hover:bg-primary/90 transition-colors flex items-center gap-2">
            确认并继续 <ArrowRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-3 space-y-6">
          <div className="bg-surface p-6 border-l-2 border-primary">
            <h3 className="text-sm font-bold text-primary mb-4">CDP 标签过滤</h3>
            <div className="space-y-4">
              <div>
                <div className="text-xs text-gray-500 mb-2">基本属性</div>
                <label className="flex items-center gap-2 text-sm mb-2"><input type="checkbox" defaultChecked className="text-primary bg-white/10 border-none rounded-sm" /> 一线城市精英</label>
                <label className="flex items-center gap-2 text-sm mb-2"><input type="checkbox" defaultChecked className="text-primary bg-white/10 border-none rounded-sm" /> 家庭用户 (3-5口)</label>
                <label className="flex items-center gap-2 text-sm mb-2"><input type="checkbox" className="text-primary bg-white/10 border-none rounded-sm" /> 高净值资产持有</label>
              </div>
            </div>
            <button className="w-full bg-primary text-black py-3 text-xs font-bold mt-6">重新生成画像</button>
          </div>
          <div className="bg-surface p-6">
            <h3 className="text-sm font-bold mb-4">样本统计</h3>
            <div className="flex gap-4">
              <div className="bg-white/5 p-4 flex-1">
                <div className="text-2xl font-bold text-primary">128</div>
                <div className="text-[10px] text-gray-500">匹配用户</div>
              </div>
              <div className="bg-white/5 p-4 flex-1">
                <div className="text-2xl font-bold text-blue-400">542</div>
                <div className="text-[10px] text-gray-500">VOC 声音数</div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-9 space-y-6">
          <div className="bg-surface flex min-h-[400px]">
            <div className="w-2/5 relative">
              <img src="https://i.pravatar.cc/500?img=11" className="w-full h-full object-cover grayscale" />
              <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent"></div>
              <div className="absolute bottom-8 left-8">
                <h3 className="text-3xl font-bold text-white">理性先锋型</h3>
                <div className="text-primary text-xs mt-2">画像编号: PR-2024-X1</div>
              </div>
            </div>
            <div className="flex-1 p-8">
              <div className="text-xs text-gray-500 mb-2">关键特征</div>
              <p className="text-sm leading-relaxed mb-6">
                高度关注技术参数与实际效能的结合。在购车决策中，他们不仅看重品牌带来的社会认同，更看重车辆在智能驾驶、安全冗余等方面的硬核实力。对“伪需求”有极强的辨识能力。
              </p>
              
              <div className="h-64 w-full">
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
          </div>

          <div className="bg-surface p-6">
            <h3 className="text-sm font-bold mb-4">VOC 原始洞察</h3>
            <div className="space-y-4">
              <div className="p-4 bg-white/5 border-l-2 border-blue-400">
                <p className="text-sm text-gray-300 italic">"我不需要车里有那么多花哨的屏幕，我需要的是在高速上它能比我更早发现危险，并且接管得足够平顺。"</p>
                <div className="text-[10px] text-gray-500 mt-2">— 摘自 2023.11 用户深度访谈</div>
              </div>
              <div className="p-4 bg-white/5 border-l-2 border-primary">
                <p className="text-sm text-gray-300 italic">"环保不是一个口号，如果内饰材料真的做到了零甲醛且触感高级，我愿意为此支付溢价。"</p>
                <div className="text-[10px] text-gray-500 mt-2">— 摘自 社交媒体声量分析</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepConfirm({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-2xl bg-surface p-10 rounded-xl text-center shadow-2xl">
        <h2 className="text-3xl font-extrabold text-white mb-4">确认执行方案</h2>
        <p className="text-gray-400 text-sm mb-10">系统已准备好基于上述设定生成深度调研报告。您还可以选择上传真实的调研材料以增强报告的实证性。</p>
        
        <div className="border-2 border-dashed border-white/20 rounded-xl p-12 flex flex-col items-center justify-center hover:border-primary/50 transition-colors cursor-pointer mb-10">
          <Upload className="text-primary mb-4" size={40} />
          <p className="text-white font-bold mb-2">上传真人调研材料 (可选)</p>
          <p className="text-gray-500 text-xs">支持 PDF, DOCX, CSV 格式，最大 100MB</p>
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
  return (
    <div className="flex-1 overflow-y-auto p-10">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-end mb-8">
          <div>
            <div className="text-primary text-xs font-bold mb-2">最终交付物</div>
            <h2 className="text-4xl font-extrabold text-white">商业调研分析报告</h2>
          </div>
          <div className="flex gap-4">
            <button className="bg-white/10 px-6 py-3 text-sm font-bold hover:bg-white/20 transition-colors flex items-center gap-2">
              <Share2 size={16} /> 分享报告
            </button>
            <button className="bg-primary text-black px-6 py-3 text-sm font-bold hover:bg-primary/90 transition-colors flex items-center gap-2">
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
