import { useState } from 'react';
import { Plus, ExternalLink, UserPlus } from 'lucide-react';
import Modal from '../components/Modal';

export default function PersonaLibrary() {
  const [activeTag, setActiveTag] = useState('全部');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const tags = ['全部', '身份与基础属性', '社会与人口统计', '购车决策与潜客行为', '车辆使用与售后服务', '数字触点与线上行为'];
  
  const allPersonas = [
    { name: '陈思远', tags: ['科技极客', '高净值'], score: 8.5, conf: 92, category: '身份与基础属性' },
    { name: '林沐然', tags: ['精致生活家', '社交型'], score: 9.4, conf: 96, category: '社会与人口统计' },
    { name: '张逸豪', tags: ['都市先锋', 'Z世代'], score: 9.8, conf: 98, category: '购车决策与潜客行为' },
    { name: '苏婉清', tags: ['户外探索者', '家庭型'], score: 8.9, conf: 94, category: '车辆使用与售后服务' },
  ];

  const filteredPersonas = activeTag === '全部' ? allPersonas : allPersonas.filter(p => p.category === activeTag);

  return (
    <div className="p-10 max-w-7xl mx-auto">
      <div className="flex justify-between items-end mb-12">
        <div>
          <h1 className="text-4xl font-extrabold text-white mb-2">人设库管理</h1>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-primary text-black font-bold px-6 py-3 rounded flex items-center gap-2 hover:bg-primary/90 transition-colors"
        >
          <Plus size={20} />
          新建自定义人设
        </button>
      </div>

      <div className="grid grid-cols-12 gap-6 mb-8">
        <div className="col-span-8 bg-surface p-6 rounded-xl">
          <p className="text-gray-500 text-xs font-bold mb-4">标签筛选</p>
          <div className="flex flex-wrap gap-2">
            {tags.map(tag => (
              <button 
                key={tag}
                onClick={() => setActiveTag(tag)}
                className={`px-4 py-2 text-xs font-bold rounded transition-colors ${activeTag === tag ? 'bg-primary text-black' : 'bg-surface-hover text-gray-300 hover:bg-[#353534]'}`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
        <div className="col-span-4 bg-surface p-6 rounded-xl flex flex-col justify-center">
          <p className="text-gray-500 text-xs font-bold mb-2">人设总资产</p>
          <div className="flex items-end gap-4">
            <h2 className="text-5xl font-extrabold text-white">128</h2>
            <div className="flex-1 h-2 bg-surface-hover rounded-full mb-2 overflow-hidden">
              <div className="w-3/4 h-full bg-primary"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {filteredPersonas.map((p, i) => (
          <div key={i} className="bg-surface p-6 rounded-xl relative group">
            <button className="absolute top-6 right-6 p-2 bg-surface-hover rounded text-gray-400 hover:text-white">
              <ExternalLink size={16} />
            </button>
            <h3 className="text-2xl font-bold text-white mb-3">{p.name}</h3>
            <div className="flex gap-2 mb-8">
              <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded">{p.tags[0]}</span>
              <span className="px-2 py-1 bg-surface-hover text-gray-300 text-xs rounded">{p.tags[1]}</span>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>五维评分</span>
                  <span className="text-white font-bold text-lg">{p.score} <span className="text-gray-500 text-xs font-normal">/ 10</span></span>
                </div>
                <div className="h-1.5 bg-surface-hover rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${p.score * 10}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>置信度</span>
                  <span className="text-white font-bold text-lg">{p.conf}%</span>
                </div>
                <div className="h-1.5 bg-surface-hover rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${p.conf}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-transparent border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center text-gray-500 hover:text-white hover:border-white/30 transition-colors min-h-[280px]"
        >
          <Plus size={32} className="mb-2" />
          <span className="text-sm font-bold">创建新的人设</span>
        </button>
      </div>

      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="新建自定义人设">
        <div className="space-y-4">
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 bg-surface-hover rounded-full flex items-center justify-center border border-white/10 cursor-pointer hover:border-primary/50 transition-colors">
              <UserPlus className="text-gray-400" size={32} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-2">人设名称</label>
            <input type="text" placeholder="例如：都市先锋型" className="w-full bg-surface-hover border border-white/10 rounded-lg p-3 text-sm text-white outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-2">核心特征标签 (最多3个)</label>
            <input type="text" placeholder="输入标签并回车..." className="w-full bg-surface-hover border border-white/10 rounded-lg p-3 text-sm text-white outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-2">关联基础数据源</label>
            <select className="w-full bg-surface-hover border border-white/10 rounded-lg p-3 text-sm text-white outline-none focus:border-primary">
              <option>2023 纯电车主调研数据</option>
              <option>高净值人群消费报告</option>
              <option>Z世代购车偏好分析</option>
            </select>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button onClick={() => setIsCreateModalOpen(false)} className="px-6 py-2 rounded-lg text-sm font-bold text-gray-400 hover:text-white transition-colors">取消</button>
            <button onClick={() => setIsCreateModalOpen(false)} className="px-6 py-2 rounded-lg text-sm font-bold bg-primary text-black hover:bg-primary/90 transition-colors">生成人设模型</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
