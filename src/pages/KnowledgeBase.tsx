import { Dispatch, SetStateAction, useRef, useState } from 'react';
import { Upload, Search, FileText, TrendingUp, FolderOpen, FileUp } from 'lucide-react';
import Modal from '../components/Modal';
import type { KnowledgeDoc } from '../App';

export default function KnowledgeBase({
  docs,
  setDocs,
}: {
  docs: KnowledgeDoc[];
  setDocs: Dispatch<SetStateAction<KnowledgeDoc[]>>;
}) {
  const [activeCategory, setActiveCategory] = useState('全库文档');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUploadFile, setSelectedUploadFile] = useState<File | null>(null);
  const [uploadCategory, setUploadCategory] = useState<'洞察报告库' | '整车知识库' | '行业知识库'>('洞察报告库');
  const uploadInputRef = useRef<HTMLInputElement>(null);

  const onPickFile = (file: File | null) => {
    if (!file) return;
    if (file.type !== 'application/pdf') {
      window.alert('当前仅支持上传 PDF 文件');
      return;
    }
    setSelectedUploadFile(file);
  };

  const categories = ['全库文档', '洞察报告库', '整车知识库', '行业知识库'];

  const filteredDocs = docs.filter(doc => {
    const matchesCategory = activeCategory === '全库文档' || doc.category === activeCategory;
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) || doc.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleDeleteDoc = (docId: string, title: string) => {
    const shouldDelete = window.confirm(`确认删除文档「${title}」吗？`);
    if (!shouldDelete) return;
    setDocs((prev) => prev.filter((doc) => doc.id !== docId));
  };

  const handleUpload = () => {
    if (!selectedUploadFile) return;
    const now = new Date().toISOString().slice(0, 10);
    const fileSizeMb = (selectedUploadFile.size / 1024 / 1024).toFixed(1);
    setDocs((prev) => [
      {
        id: `doc-${Date.now()}`,
        title: selectedUploadFile.name.replace(/\.pdf$/i, ''),
        type: `PDF • ${fileSizeMb} MB • ${now}`,
        tags: ['新上传'],
        uploader: '当前用户',
        color: 'text-primary',
        category: uploadCategory,
      },
      ...prev,
    ]);
    setSelectedUploadFile(null);
    setUploadCategory('洞察报告库');
    setIsUploadModalOpen(false);
  };

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
            <div key={doc.id} className="grid grid-cols-12 px-6 py-4 items-center hover:bg-white/5 transition-colors">
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
              <div className="col-span-1 flex items-center justify-end gap-2">
                <button
                  className="px-2 py-1 text-xs rounded bg-surface-hover text-gray-300 hover:text-white transition-colors"
                  title="查看详情"
                >
                  查看详情
                </button>
                <button
                  className="px-2 py-1 text-xs rounded bg-surface-hover text-gray-300 hover:text-red-400 transition-colors"
                  title="删除文档"
                  onClick={() => handleDeleteDoc(doc.id, doc.title)}
                >
                  删除
                </button>
              </div>
            </div>
          )) : (
            <div className="p-8 text-center text-gray-500 text-sm">暂无匹配的文档</div>
          )}
        </div>
      </div>

      <Modal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} title="上传新文档">
        <div className="space-y-4">
          <input
            ref={uploadInputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
          />
          <div
            onClick={() => uploadInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              onPickFile(e.dataTransfer.files?.[0] ?? null);
            }}
            className="border-2 border-dashed border-white/20 rounded-xl p-8 flex flex-col items-center justify-center hover:border-primary/50 transition-colors cursor-pointer"
          >
            <FileUp className="text-primary mb-3" size={32} />
            <p className="text-white font-bold mb-1">点击或拖拽 PDF 至此</p>
            <p className="text-gray-500 text-xs">仅支持 PDF (最大 50MB)</p>
            {selectedUploadFile && <p className="text-xs text-primary mt-2">已选择：{selectedUploadFile.name}</p>}
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-2">文档归属</label>
            <select
              value={uploadCategory}
              onChange={(e) => setUploadCategory(e.target.value as '洞察报告库' | '整车知识库' | '行业知识库')}
              className="w-full bg-surface-hover border border-white/10 rounded-lg p-3 text-sm text-white outline-none focus:border-primary"
            >
              <option value="洞察报告库">洞察报告</option>
              <option value="整车知识库">整车知识</option>
              <option value="行业知识库">行业报告</option>
            </select>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button onClick={() => setIsUploadModalOpen(false)} className="px-6 py-2 rounded-lg text-sm font-bold text-gray-400 hover:text-white transition-colors">取消</button>
            <button onClick={handleUpload} disabled={!selectedUploadFile} className="px-6 py-2 rounded-lg text-sm font-bold bg-primary text-black hover:bg-primary/90 transition-colors disabled:opacity-50">开始上传</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
