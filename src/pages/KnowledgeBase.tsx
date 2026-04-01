import { useState } from 'react';
import { Upload, Search, FileText, MoreVertical, TrendingUp, FolderOpen, FileUp } from 'lucide-react';
import Modal from '../components/Modal';

export default function KnowledgeBase() {
  const [activeCategory, setActiveCategory] = useState('全库文档');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const categories = ['全库文档', '洞察报告库', '整车知识库', '行业知识库'];

  const allDocs = [
    { title: '2024年全球纯电SUV市场趋势深度调研', type: 'PDF • 14.2 MB • 2023-11-24', tags: ['电动化', 'SUV'], uploader: '王安德', color: 'text-primary', category: '洞察报告库' },
    { title: 'Volvo EX90 智驾系统硬件拆解报告', type: 'PDF • 45.8 MB • 2023-11-20', tags: ['EX90', '智驾硬件'], uploader: '林索菲', color: 'text-blue-400', category: '整车知识库' },
    { title: '欧洲固态电池产业链投资机遇分析', type: 'PDF • 8.1 MB • 2023-11-15', tags: ['固态电池', '欧洲市场'], uploader: '徐莱纳斯', color: 'text-gray-400', category: '行业知识库' },
  ];

  const filteredDocs = allDocs.filter(doc => {
    const matchesCategory = activeCategory === '全库文档' || doc.category === activeCategory;
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) || doc.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="p-10 max-w-7xl mx-auto">
      <div className="flex justify-between items-end mb-12">
        <div>
          <h1 className="text-4xl font-extrabold text-white mb-2">知识库管理</h1>
        </div>
        <button 
          onClick={() => setIsUploadModalOpen(true)}
          className="bg-primary text-black font-bold px-6 py-3 rounded flex items-center gap-2 hover:bg-primary/90 transition-colors"
        >
          <Upload size={20} />
          上传文档
        </button>
      </div>

      <div className="grid grid-cols-12 gap-6 mb-12">
        <div className="col-span-4 bg-surface p-8 rounded-xl relative overflow-hidden">
          <p className="text-gray-500 text-xs font-bold mb-2">总资产</p>
          <h2 className="text-5xl font-extrabold text-white mb-2">1,284</h2>
          <p className="text-primary text-xs flex items-center gap-1">
            <TrendingUp size={14} />
            +12% 本月新增
          </p>
          <FolderOpen className="absolute -right-4 -bottom-4 text-white/5" size={120} />
        </div>
        <div className="col-span-8 bg-surface p-8 rounded-xl flex flex-col justify-between">
          <div className="flex justify-between items-start mb-6">
            <p className="text-gray-500 text-xs font-bold">分布统计</p>
            <div className="flex gap-4">
              <div className="flex items-center gap-2"><span className="w-2 h-2 bg-primary rounded-full"></span><span className="text-xs text-gray-400">洞察报告</span></div>
              <div className="flex items-center gap-2"><span className="w-2 h-2 bg-blue-400 rounded-full"></span><span className="text-xs text-gray-400">整车知识</span></div>
              <div className="flex items-center gap-2"><span className="w-2 h-2 bg-gray-600 rounded-full"></span><span className="text-xs text-gray-400">行业报告</span></div>
            </div>
          </div>
          <div className="flex items-end gap-2 h-16">
            <div className="w-full bg-primary h-[85%] rounded-t-sm"></div>
            <div className="w-full bg-blue-400 h-[10%] rounded-t-sm"></div>
            <div className="w-full bg-gray-600 h-[5%] rounded-t-sm"></div>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div className="flex bg-surface p-1 rounded-lg gap-1">
          {categories.map(cat => (
            <button 
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-6 py-2 text-sm font-bold rounded-md transition-colors ${activeCategory === cat ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索文档标题、关键词..." 
            className="w-full bg-surface border-none rounded-lg py-2 pl-10 pr-4 text-sm text-white focus:ring-1 focus:ring-primary outline-none" 
          />
        </div>
      </div>

      <div className="bg-surface rounded-xl overflow-hidden">
        <div className="grid grid-cols-12 px-6 py-4 border-b border-white/5 text-xs font-bold text-gray-500">
          <div className="col-span-5">文档标题</div>
          <div className="col-span-3">关键词</div>
          <div className="col-span-3">上传人</div>
          <div className="col-span-1 text-right">操作</div>
        </div>
        <div className="divide-y divide-white/5">
          {filteredDocs.length > 0 ? filteredDocs.map((doc, i) => (
            <div key={i} className="grid grid-cols-12 px-6 py-4 items-center hover:bg-white/5 transition-colors">
              <div className="col-span-5 flex items-center gap-4">
                <FileText className={doc.color} size={24} />
                <div>
                  <h3 className="text-white text-sm font-semibold">{doc.title}</h3>
                  <p className="text-xs text-gray-500 mt-1">{doc.type}</p>
                </div>
              </div>
              <div className="col-span-3 flex gap-2">
                {doc.tags.map(tag => (
                  <span key={tag} className="px-2 py-1 bg-surface-hover text-xs text-gray-300 rounded">{tag}</span>
                ))}
              </div>
              <div className="col-span-3 flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-gray-700 overflow-hidden">
                  <img src={`https://i.pravatar.cc/150?img=${i+10}`} alt="avatar" />
                </div>
                <span className="text-sm text-gray-300">{doc.uploader}</span>
              </div>
              <div className="col-span-1 text-right">
                <button className="text-gray-500 hover:text-white"><MoreVertical size={18} /></button>
              </div>
            </div>
          )) : (
            <div className="p-8 text-center text-gray-500 text-sm">暂无匹配的文档</div>
          )}
        </div>
      </div>

      <Modal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} title="上传新文档">
        <div className="space-y-4">
          <div className="border-2 border-dashed border-white/20 rounded-xl p-8 flex flex-col items-center justify-center hover:border-primary/50 transition-colors cursor-pointer">
            <FileUp className="text-primary mb-3" size={32} />
            <p className="text-white font-bold mb-1">点击或拖拽文件至此</p>
            <p className="text-gray-500 text-xs">支持 PDF, DOCX, PPTX (最大 50MB)</p>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-2">文档分类</label>
            <select className="w-full bg-surface-hover border border-white/10 rounded-lg p-3 text-sm text-white outline-none focus:border-primary">
              <option>洞察报告库</option>
              <option>整车知识库</option>
              <option>行业知识库</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-2">添加标签 (回车确认)</label>
            <input type="text" placeholder="输入标签..." className="w-full bg-surface-hover border border-white/10 rounded-lg p-3 text-sm text-white outline-none focus:border-primary" />
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button onClick={() => setIsUploadModalOpen(false)} className="px-6 py-2 rounded-lg text-sm font-bold text-gray-400 hover:text-white transition-colors">取消</button>
            <button onClick={() => setIsUploadModalOpen(false)} className="px-6 py-2 rounded-lg text-sm font-bold bg-primary text-black hover:bg-primary/90 transition-colors">开始上传</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
