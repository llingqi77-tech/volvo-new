import { Dispatch, SetStateAction, useRef, useState } from 'react';
import { Upload, Search, FileText, TrendingUp, FolderOpen, FileUp, Folder } from 'lucide-react';
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
  const [selectedUploadFiles, setSelectedUploadFiles] = useState<File[]>([]);
  const [uploadCategory, setUploadCategory] = useState<'洞察报告库' | '整车知识库' | '行业知识库'>('洞察报告库');
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const onPickFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const pdfFiles: File[] = [];
    const invalidFiles: string[] = [];
    const oversizedFiles: string[] = [];
    const maxSizeMB = 20;
    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (file.type !== 'application/pdf') {
        invalidFiles.push(file.name);
        continue;
      }

      if (file.size > maxSizeBytes) {
        oversizedFiles.push(`${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)`);
        continue;
      }

      pdfFiles.push(file);
    }

    let alertMessage = '';
    if (invalidFiles.length > 0) {
      alertMessage += `以下文件不是 PDF 格式，已跳过：\n${invalidFiles.join('\n')}\n\n`;
    }
    if (oversizedFiles.length > 0) {
      alertMessage += `以下文件超过 ${maxSizeMB} MB 限制，已跳过：\n${oversizedFiles.join('\n')}`;
    }

    if (alertMessage) {
      window.alert(alertMessage.trim());
    }

    if (pdfFiles.length > 0) {
      setSelectedUploadFiles(prev => [...prev, ...pdfFiles]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedUploadFiles(prev => prev.filter((_, i) => i !== index));
  };

  const categories = ['全库文档', '洞察报告库', '整车知识库', '行业知识库'];

  // 计算各类别的文档数量
  const categoryStats = {
    '洞察报告库': docs.filter(d => d.category === '洞察报告库').length,
    '整车知识库': docs.filter(d => d.category === '整车知识库').length,
    '行业知识库': docs.filter(d => d.category === '行业知识库').length,
  };

  const totalDocs = docs.length;

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
    if (selectedUploadFiles.length === 0) return;

    const now = new Date().toISOString().slice(0, 10);
    const newDocs = selectedUploadFiles.map((file, index) => {
      const fileSizeMb = (file.size / 1024 / 1024).toFixed(1);
      return {
        id: `doc-${Date.now()}-${index}`,
        title: file.name.replace(/\.pdf$/i, ''),
        type: `PDF • ${fileSizeMb} MB • ${now}`,
        tags: ['新上传'],
        uploader: '当前用户',
        color: 'text-primary',
        category: uploadCategory,
      };
    });

    setDocs((prev) => [...newDocs, ...prev]);
    setSelectedUploadFiles([]);
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
          <h2 className="text-5xl font-extrabold text-white mb-2">{totalDocs}</h2>
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
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-primary rounded-full"></span>
                <span className="text-xs text-gray-400">洞察报告</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                <span className="text-xs text-gray-400">整车知识</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-gray-600 rounded-full"></span>
                <span className="text-xs text-gray-400">行业报告</span>
              </div>
            </div>
          </div>
          <div className="relative h-24">
            <div className="flex items-end gap-2 h-full">
              {/* 洞察报告 */}
              <div className="w-full flex flex-col items-center justify-end h-full">
                <span className="text-xs font-bold text-primary mb-1">{categoryStats['洞察报告库']}</span>
                <div
                  className="w-full bg-primary rounded-t-sm transition-all"
                  style={{ height: totalDocs > 0 ? `${Math.max((categoryStats['洞察报告库'] / totalDocs) * 100, 10)}%` : '10%' }}
                  title={`洞察报告：${categoryStats['洞察报告库']} 个文档`}
                ></div>
              </div>
              {/* 整车知识 */}
              <div className="w-full flex flex-col items-center justify-end h-full">
                <span className="text-xs font-bold text-blue-400 mb-1">{categoryStats['整车知识库']}</span>
                <div
                  className="w-full bg-blue-400 rounded-t-sm transition-all"
                  style={{ height: totalDocs > 0 ? `${Math.max((categoryStats['整车知识库'] / totalDocs) * 100, 10)}%` : '10%' }}
                  title={`整车知识：${categoryStats['整车知识库']} 个文档`}
                ></div>
              </div>
              {/* 行业知识 */}
              <div className="w-full flex flex-col items-center justify-end h-full">
                <span className="text-xs font-bold text-gray-400 mb-1">{categoryStats['行业知识库']}</span>
                <div
                  className="w-full bg-gray-600 rounded-t-sm transition-all"
                  style={{ height: totalDocs > 0 ? `${Math.max((categoryStats['行业知识库'] / totalDocs) * 100, 10)}%` : '10%' }}
                  title={`行业报告：${categoryStats['行业知识库']} 个文档`}
                ></div>
              </div>
            </div>
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
            multiple
            className="hidden"
            onChange={(e) => onPickFiles(e.target.files)}
          />
          <input
            ref={folderInputRef}
            type="file"
            accept=".pdf,application/pdf"
            // @ts-ignore - webkitdirectory is not in TypeScript types
            webkitdirectory="true"
            directory="true"
            className="hidden"
            onChange={(e) => onPickFiles(e.target.files)}
          />
          <div
            onClick={() => uploadInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              onPickFiles(e.dataTransfer.files);
            }}
            className="border-2 border-dashed border-white/20 rounded-xl p-8 flex flex-col items-center justify-center hover:border-primary/50 transition-colors cursor-pointer"
          >
            <FileUp className="text-primary mb-3" size={32} />
            <p className="text-white font-bold mb-1">点击或拖拽 PDF 至此</p>
            <p className="text-gray-500 text-xs mb-3">支持多个文件同时上传（最大 20MB/个）</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  uploadInputRef.current?.click();
                }}
                className="px-4 py-2 bg-surface-hover text-white text-xs rounded-lg hover:bg-white/10 transition-colors"
              >
                选择文件
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  folderInputRef.current?.click();
                }}
                className="px-4 py-2 bg-surface-hover text-white text-xs rounded-lg hover:bg-white/10 transition-colors flex items-center gap-2"
              >
                <Folder size={14} />
                选择文件夹
              </button>
            </div>
          </div>

          {selectedUploadFiles.length > 0 && (
            <div className="bg-surface-hover rounded-lg p-4 max-h-48 overflow-y-auto">
              <div className="flex justify-between items-center mb-3">
                <p className="text-xs font-bold text-gray-400">已选择 {selectedUploadFiles.length} 个文件</p>
                <button
                  onClick={() => setSelectedUploadFiles([])}
                  className="text-xs text-gray-400 hover:text-white transition-colors"
                >
                  清空
                </button>
              </div>
              <div className="space-y-2">
                {selectedUploadFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-surface p-2 rounded">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <FileText size={16} className="text-primary shrink-0" />
                      <span className="text-xs text-white truncate">{file.name}</span>
                      <span className="text-xs text-gray-500 shrink-0">
                        {(file.size / 1024 / 1024).toFixed(1)} MB
                      </span>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="text-xs text-gray-400 hover:text-red-400 transition-colors ml-2"
                    >
                      移除
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

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
            <button
              onClick={handleUpload}
              disabled={selectedUploadFiles.length === 0}
              className="px-6 py-2 rounded-lg text-sm font-bold bg-primary text-black hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              上传 {selectedUploadFiles.length > 0 ? `(${selectedUploadFiles.length})` : ''}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
