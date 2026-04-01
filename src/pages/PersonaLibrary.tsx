import { useMemo, useState } from 'react';
import { Plus, UserPlus, ArrowLeft } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import Modal from '../components/Modal';

export default function PersonaLibrary() {
  const [activeTag, setActiveTag] = useState('全部');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newTags, setNewTags] = useState('');

  const tags = ['全部', '身份与基础属性', '社会与人口统计', '购车决策与潜客行为', '车辆使用与售后服务', '数字触点与线上行为'];
  
  const [allPersonas, setAllPersonas] = useState([
    {
      id: 'p-1',
      name: '陈思远',
      tags: ['科技极客', '高净值'],
      score: 8.5,
      conf: 92,
      category: '身份与基础属性',
      cdpTags: ['一线城市精英', '智能驾驶偏好', '高净值资产持有'],
      voc: '我希望车辆能在复杂城市路况下主动避险，而不是只做被动提醒。',
      radar: [78, 90, 84, 72, 88, 95, 66],
    },
    {
      id: 'p-2',
      name: '林沐然',
      tags: ['精致生活家', '社交型'],
      score: 9.4,
      conf: 96,
      category: '社会与人口统计',
      cdpTags: ['家庭用户', '高频社交出行', '品质生活偏好'],
      voc: '内饰质感和静谧性对我很关键，车是我生活方式的一部分。',
      radar: [82, 86, 88, 75, 92, 80, 85],
    },
    {
      id: 'p-3',
      name: '张逸豪',
      tags: ['都市先锋', 'Z世代'],
      score: 9.8,
      conf: 98,
      category: '购车决策与潜客行为',
      cdpTags: ['数字原生', '内容平台高活跃', '尝鲜驱动'],
      voc: '我会先看真实测评和用户内容，品牌叙事如果不真实很难打动我。',
      radar: [74, 94, 86, 91, 84, 97, 78],
    },
    {
      id: 'p-4',
      name: '苏婉清',
      tags: ['户外探索者', '家庭型'],
      score: 8.9,
      conf: 94,
      category: '车辆使用与售后服务',
      cdpTags: ['亲子家庭', '长途自驾偏好', '安全诉求强'],
      voc: '周末带孩子出行时，我更关心安全冗余和空间灵活性。',
      radar: [88, 82, 80, 76, 93, 74, 89],
    },
  ]);

  const filteredPersonas = activeTag === '全部' ? allPersonas : allPersonas.filter(p => p.category === activeTag);
  const selectedPersona = useMemo(
    () => allPersonas.find((p) => p.id === selectedPersonaId) ?? null,
    [allPersonas, selectedPersonaId],
  );
  const radarLabels = ['人口与成长轨迹', '心理动因', '心理特征维度', '行为维度', '需求与痛点维度', '技术接受度维度', '社会关系维度'];
  const radarData = selectedPersona
    ? radarLabels.map((label, idx) => ({ subject: label, value: selectedPersona.radar[idx], fullMark: 100 }))
    : [];

  const handleCreatePersona = () => {
    const name = newName.trim();
    if (!name) {
      window.alert('请填写人设名称');
      return;
    }
    const parsedTags = newTags
      .split(/[,\s，]+/)
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 3);
    const finalTags = parsedTags.length > 0 ? parsedTags : ['自定义人设'];
    const created = {
      id: `p-${Date.now()}`,
      name,
      tags: [finalTags[0], finalTags[1] ?? '新建'],
      score: 8.6,
      conf: 90,
      category: '数字触点与线上行为',
      cdpTags: ['新建标签', '待补充画像', '用户自定义'],
      voc: '该人设由用户新建，可在后续调研中持续补充真实 VOC 文本。',
      radar: [75, 78, 72, 70, 80, 76, 73],
    };
    setAllPersonas((prev) => [created, ...prev]);
    setIsCreateModalOpen(false);
    setNewName('');
    setNewTags('');
  };

  if (selectedPersona) {
    return (
      <div className="p-10 max-w-7xl mx-auto">
        <button onClick={() => setSelectedPersonaId(null)} className="mb-6 px-4 py-2 bg-surface hover:bg-surface-hover rounded text-sm flex items-center gap-2">
          <ArrowLeft size={16} />
          返回人设列表
        </button>
        <div className="bg-surface rounded-xl p-8 mb-6">
          <h1 className="text-3xl font-extrabold text-white mb-2">{selectedPersona.name} - 人设详情</h1>
          <p className="text-sm text-gray-400">{selectedPersona.category}</p>
        </div>
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-4 bg-surface rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">CDP 标签</h3>
            <div className="flex flex-wrap gap-2">
              {selectedPersona.cdpTags.map((tag) => (
                <span key={tag} className="px-3 py-1 bg-surface-hover rounded text-xs text-primary">{tag}</span>
              ))}
            </div>
          </div>
          <div className="col-span-8 bg-surface rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">VOC 原始文本</h3>
            <div className="p-4 bg-surface-hover border-l-2 border-primary text-sm text-gray-300 leading-relaxed">
              "{selectedPersona.voc}"
            </div>
          </div>
          <div className="col-span-12 bg-surface rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">七维评分雷达图</h3>
            <div className="h-[420px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="#3b3b3b" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="评分" dataKey="value" stroke="#63fe33" fill="#63fe33" fillOpacity={0.25} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
            <h2 className="text-5xl font-extrabold text-white">{allPersonas.length}</h2>
            <div className="flex-1 h-2 bg-surface-hover rounded-full mb-2 overflow-hidden">
              <div className="w-3/4 h-full bg-primary"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {filteredPersonas.map((p) => (
          <button key={p.id} onClick={() => setSelectedPersonaId(p.id)} className="bg-surface p-6 rounded-xl relative group text-left hover:bg-surface-hover transition-colors">
            <h3 className="text-2xl font-bold text-white mb-3">{p.name}</h3>
            <div className="flex gap-2 mb-8">
              <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded">{p.tags[0]}</span>
              <span className="px-2 py-1 bg-surface-hover text-gray-300 text-xs rounded">{p.tags[1]}</span>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>综合评分</span>
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
          </button>
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
            <input value={newName} onChange={(e) => setNewName(e.target.value)} type="text" placeholder="例如：都市先锋型" className="w-full bg-surface-hover border border-white/10 rounded-lg p-3 text-sm text-white outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-2">核心特征标签 (最多3个)</label>
            <input value={newTags} onChange={(e) => setNewTags(e.target.value)} type="text" placeholder="例如：理性、高净值、家庭导向" className="w-full bg-surface-hover border border-white/10 rounded-lg p-3 text-sm text-white outline-none focus:border-primary" />
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button onClick={() => setIsCreateModalOpen(false)} className="px-6 py-2 rounded-lg text-sm font-bold text-gray-400 hover:text-white transition-colors">取消</button>
            <button onClick={handleCreatePersona} className="px-6 py-2 rounded-lg text-sm font-bold bg-primary text-black hover:bg-primary/90 transition-colors">生成人设模型</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
