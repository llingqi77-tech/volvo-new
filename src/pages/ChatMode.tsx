import { useState } from 'react';
import { Upload, Bot, User, Send, Mic, FileText, CheckCircle2, Download, Share2, Paperclip, Image as ImageIcon } from 'lucide-react';

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
  return (
    <div className="flex-1 flex overflow-hidden p-8 gap-8">
      {/* Left: Upload & Persona */}
      <div className="w-1/3 flex flex-col gap-6">
        <div className="bg-surface p-8 rounded-xl">
          <h2 className="text-2xl font-bold text-white mb-2">建立客户智能体</h2>
          <p className="text-gray-400 text-sm mb-6">上传 PDF 调研报告或访谈记录，系统将精密提取关键人格特征，生成动态智能体。</p>
          
          <div className="border-2 border-dashed border-white/20 rounded-xl p-10 flex flex-col items-center justify-center text-center hover:border-primary/50 transition-colors cursor-pointer mb-6">
            <Upload className="text-primary mb-4" size={32} />
            <p className="text-white font-bold mb-1">点击或拖拽 PDF 文件至此</p>
            <p className="text-gray-500 text-xs">支持最大 50MB 的文档解析</p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-primary">正在深度解析语义层...</span>
              <span className="text-white">78%</span>
            </div>
            <div className="h-1 bg-surface-hover rounded-full overflow-hidden">
              <div className="h-full bg-primary w-[78%]"></div>
            </div>
            <div className="flex gap-2 mt-2">
              <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-[10px] rounded">NLP 分析</span>
              <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-[10px] rounded">情感建模</span>
              <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-[10px] rounded">逻辑聚类</span>
            </div>
          </div>
        </div>

        <div className="bg-surface p-6 rounded-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <User size={80} />
          </div>
          <h3 className="text-xl font-bold text-white mb-4">王静仪 (32岁, 策略总监)</h3>
          <div className="space-y-4 relative z-10">
            <div>
              <span className="text-[10px] text-gray-500">核心驱动力</span>
              <p className="text-sm mt-1">追求极致的效率与工作生活平衡，对智能驾驶系统的安全性有极高敏感度。</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface-hover p-3 rounded">
                <span className="text-[10px] text-gray-500 block mb-1">审美倾向</span>
                <span className="text-white text-xs font-bold">斯堪的纳维亚极简</span>
              </div>
              <div className="bg-surface-hover p-3 rounded">
                <span className="text-[10px] text-gray-500 block mb-1">价格敏感度</span>
                <span className="text-white text-xs font-bold">低 (价值导向)</span>
              </div>
            </div>
          </div>
          <button className="w-full mt-6 py-3 bg-surface-hover text-white text-sm font-bold rounded hover:bg-[#353534] transition-colors">
            编辑详细参数
          </button>
        </div>
      </div>

      {/* Right: Chat */}
      <div className="flex-1 bg-surface rounded-xl flex flex-col overflow-hidden">
        <div className="px-6 py-4 bg-surface-hover flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
            <div>
              <h4 className="text-sm font-bold text-white">与 "王静仪" 智能体深度对话</h4>
              <p className="text-[10px] text-gray-400">基于《2023都市女性高净值调研报告》生成</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="flex gap-4 max-w-[80%]">
            <div className="w-10 h-10 rounded bg-primary/20 flex items-center justify-center shrink-0">
              <Bot className="text-primary" size={20} />
            </div>
            <div>
              <div className="bg-surface-hover p-4 rounded-lg text-sm leading-relaxed">
                你好。我已经准备好基于你上传的调研数据进行模拟访谈。你可以询问我关于购车决策、品牌偏好或对沃尔沃未来智能交互系统的看法。我们从哪里开始？
              </div>
            </div>
          </div>
          
          <div className="flex gap-4 max-w-[80%] ml-auto flex-row-reverse">
            <div className="w-10 h-10 rounded bg-white/10 flex items-center justify-center shrink-0">
              <User className="text-white" size={20} />
            </div>
            <div>
              <div className="bg-primary text-black p-4 rounded-lg text-sm leading-relaxed">
                作为一名繁忙的策略总监，你在通勤路上最希望智能座舱能解决什么痛点？
              </div>
            </div>
          </div>

          <div className="flex gap-4 max-w-[80%]">
            <div className="w-10 h-10 rounded bg-primary/20 flex items-center justify-center shrink-0">
              <Bot className="text-primary" size={20} />
            </div>
            <div>
              <div className="bg-surface-hover p-4 rounded-lg text-sm leading-relaxed mb-2">
                对我来说，痛点在于“信息的有效性”而非“信息的丰富性”。在早晚高峰，我并不需要大屏幕上的视频或游戏，我更希望车辆能像私人助理一样，精准预判我的日程变化，并主动过滤掉不必要的通知。<br/><br/>
                理想的状态是：当我坐进车内，座舱环境能迅速从“战斗模式”切换为“静谧空间”，通过灯光和气味帮助我完成从高压工作到家庭角色的心理过渡。
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1 bg-surface-hover text-primary border border-primary/30 text-[10px] rounded">提取为洞察</button>
                <button className="px-3 py-1 bg-surface-hover text-gray-400 text-[10px] rounded">重新生成</button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-white/10">
          <div className="bg-surface-hover rounded-lg p-2 flex items-end gap-2 focus-within:ring-1 ring-primary/50">
            <textarea 
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm resize-none h-12 py-3 px-2 outline-none" 
              placeholder="输入访谈问题，深度挖掘客户真实心智..."
            ></textarea>
            <button className="p-3 text-gray-400 hover:text-white"><Mic size={20} /></button>
            <button className="p-3 bg-primary text-black rounded hover:bg-primary/90"><Send size={20} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExpertChat() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden p-8">
      <div className="flex-1 overflow-y-auto space-y-8 pr-4">
        <div className="flex justify-end ml-24">
          <div className="bg-surface-hover p-4 rounded-xl max-w-2xl text-sm leading-relaxed">
            请基于最新的洞察报告，分析沃尔沃在2024年纯电豪华SUV市场的竞争态势，并生成一份核心摘要报告。
          </div>
        </div>

        <div className="flex mr-24 gap-4">
          <div className="w-10 h-10 rounded bg-primary flex items-center justify-center shrink-0">
            <Bot className="text-black" size={20} />
          </div>
          <div className="space-y-4 flex-1">
            <div className="text-sm leading-relaxed">
              根据“2024全球豪华电动汽车洞察报告”及沃尔沃内部整车知识库，沃尔沃在纯电豪华SUV领域展现出极强的市场韧性。核心优势集中在安全系统的软件化定义（SDV）以及北欧极简美学驱动的数字化座舱体验。
            </div>
            
            <div className="bg-surface rounded-xl p-6 border border-white/5">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="text-primary" size={16} />
                <span className="text-[10px] font-bold text-primary">结构化分析报告</span>
              </div>
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
                <span className="text-[10px] text-gray-500">Generated by Volvo Insight Intelligence • 2024.05.20</span>
                <div className="flex gap-2">
                  <button className="px-3 py-1.5 bg-surface-hover hover:bg-[#353534] text-xs rounded flex items-center gap-2">
                    <Download size={14} /> 导出 PDF
                  </button>
                  <button className="px-3 py-1.5 bg-surface-hover hover:bg-[#353534] text-xs rounded flex items-center gap-2">
                    <Share2 size={14} /> 分享
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 max-w-4xl mx-auto w-full">
        <div className="bg-surface-hover rounded-xl p-4 border-l-2 border-primary shadow-lg">
          <textarea 
            className="w-full bg-transparent border-none focus:ring-0 text-sm resize-none h-20 mb-2 outline-none" 
            placeholder="向专家智能体提问，例如：分析下一季度整车供应链风险..."
          ></textarea>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="flex gap-2 text-gray-400">
                <button className="hover:text-white"><Paperclip size={18} /></button>
                <button className="hover:text-white"><ImageIcon size={18} /></button>
              </div>
              <div className="h-4 w-px bg-gray-600"></div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-surface rounded border border-white/10">
                  <span className="text-[10px] text-gray-400 font-bold">知识范围</span>
                  <label className="flex items-center gap-1 text-[10px] text-gray-300 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded bg-surface-hover border-none text-primary focus:ring-0 w-3 h-3" /> 洞察报告
                  </label>
                  <label className="flex items-center gap-1 text-[10px] text-gray-300 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded bg-surface-hover border-none text-primary focus:ring-0 w-3 h-3" /> 整车知识
                  </label>
                  <label className="flex items-center gap-1 text-[10px] text-gray-300 cursor-pointer">
                    <input type="checkbox" className="rounded bg-surface-hover border-none text-primary focus:ring-0 w-3 h-3" /> 行业知识
                  </label>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-surface rounded border border-white/10">
                  <span className="text-[10px] text-gray-400 font-bold">联网</span>
                  <div className="w-6 h-3.5 bg-primary rounded-full relative">
                    <div className="absolute right-0.5 top-0.5 w-2.5 h-2.5 bg-black rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
            <button className="w-10 h-10 bg-primary text-black rounded-full flex items-center justify-center hover:bg-primary/90">
              <Send size={18} className="ml-1" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
