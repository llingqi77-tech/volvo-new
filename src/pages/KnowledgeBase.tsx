import { Dispatch, SetStateAction, useRef, useState } from 'react';
import { Upload, Search, FileText, TrendingUp, FolderOpen, FileUp, Folder, ArrowLeft, Download, Share2, Calendar, User as UserIcon } from 'lucide-react';
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
  const [selectedUploader, setSelectedUploader] = useState<string>('全部');
  const [selectedUploadFiles, setSelectedUploadFiles] = useState<File[]>([]);
  const [uploadCategory, setUploadCategory] = useState<'洞察报告库' | '整车知识库' | '行业知识库'>('洞察报告库');
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const selectedDoc = docs.find(d => d.id === selectedDocId);

  // 如果选中了文档，显示详情页
  if (selectedDoc) {
    return <DocumentDetail doc={selectedDoc} onBack={() => setSelectedDocId(null)} onDelete={(id) => {
      setDocs(prev => prev.filter(d => d.id !== id));
      setSelectedDocId(null);
    }} />;
  }

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

  const uploaderOptions = ['全部', ...Array.from(new Set(docs.map((d) => d.uploader))).sort()];

  const filteredDocs = docs.filter(doc => {
    const matchesCategory = activeCategory === '全库文档' || doc.category === activeCategory;
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) || doc.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesUploader = selectedUploader === '全部' || doc.uploader === selectedUploader;
    return matchesCategory && matchesSearch && matchesUploader;
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
          <h1 className="text-4xl font-extrabold text-white mb-2 tracking-normal whitespace-nowrap">知识库管理</h1>
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
        <div className="flex items-center gap-3">
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
          <div className="relative">
            <select
              value={selectedUploader}
              onChange={(e) => setSelectedUploader(e.target.value)}
              className="bg-surface border border-white/10 rounded-lg py-2 pl-3 pr-8 text-sm text-white outline-none focus:ring-1 focus:ring-primary"
              aria-label="按上传人筛选"
              title="按上传人筛选"
            >
              {uploaderOptions.map((u) => (
                <option key={u} value={u}>
                  {u === '全部' ? '上传人：全部' : u}
                </option>
              ))}
            </select>
          </div>
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
                  onClick={() => setSelectedDocId(doc.id)}
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

function DocumentDetail({ doc, onBack, onDelete }: { doc: KnowledgeDoc; onBack: () => void; onDelete: (id: string) => void }) {
  const handleDelete = () => {
    const shouldDelete = window.confirm(`确认删除文档「${doc.title}」吗？`);
    if (shouldDelete) {
      onDelete(doc.id);
    }
  };

  const handleDownload = () => {
    window.alert(`下载功能演示：${doc.title}`);
  };

  const handleShare = () => {
    window.alert(`分享功能演示：${doc.title}`);
  };

  return (
    <div className="p-10 max-w-7xl mx-auto">
      {/* 顶部操作栏 */}
      <div className="flex justify-between items-center mb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
          返回文档列表
        </button>
        <div className="flex gap-3">
          <button
            onClick={handleShare}
            className="px-4 py-2 bg-surface hover:bg-surface-hover rounded flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors"
          >
            <Share2 size={16} />
            分享
          </button>
          <button
            onClick={handleDownload}
            className="px-4 py-2 bg-surface hover:bg-surface-hover rounded flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors"
          >
            <Download size={16} />
            下载
          </button>
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-surface hover:bg-red-500/20 rounded flex items-center gap-2 text-sm text-gray-300 hover:text-red-400 transition-colors"
          >
            删除
          </button>
        </div>
      </div>

      {/* 文档摘要卡片 */}
      <div className="bg-surface rounded-xl p-8 mb-8 border border-white/10">
        <div className="flex items-start gap-6">
          <div className="w-16 h-20 bg-primary/20 rounded flex items-center justify-center shrink-0">
            <FileText className="text-primary" size={32} />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white mb-4">{doc.title}</h1>
            <div className="flex flex-wrap gap-4 mb-6 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <Calendar size={16} />
                <span>{doc.uploadDate || '未知日期'}</span>
              </div>
              <div className="flex items-center gap-2">
                <UserIcon size={16} />
                <span>{doc.uploader}</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText size={16} />
                <span>{doc.fileSize || '未知大小'}</span>
              </div>
              <div className="flex items-center gap-2">
                <FolderOpen size={16} />
                <span>{doc.category}</span>
              </div>
            </div>
            <div className="flex gap-2 mb-6">
              {doc.tags.map(tag => (
                <span key={tag} className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-full border border-primary/30">
                  {tag}
                </span>
              ))}
            </div>
            <div className="bg-surface-hover rounded-lg p-4 border-l-4 border-primary">
              <h3 className="text-sm font-bold text-white mb-2">文档摘要</h3>
              <p className="text-sm text-gray-300 leading-relaxed">
                {doc.summary || '暂无摘要信息'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 文档内容预览 */}
      <div className="bg-white text-black rounded-xl p-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">{doc.title}</h2>
            <div className="h-1 bg-black w-20 mb-6"></div>
          </div>

          <div className="space-y-6 text-base leading-relaxed">
            <section>
              <h3 className="text-xl font-bold mb-3">一、研究背景</h3>
              <p className="text-gray-800 leading-loose">
                {doc.summary || '本文档提供了详细的研究背景和分析内容。'}
              </p>
            </section>

            <section>
              <h3 className="text-xl font-bold mb-3">二、核心发现</h3>
              <ul className="list-disc ml-6 space-y-2 text-gray-800">
                <li>市场趋势分析显示，消费者对智能化和电动化的接受度持续提升</li>
                <li>用户体验和品牌价值观成为购买决策的关键影响因素</li>
                <li>充电基础设施和续航能力仍是用户关注的核心痛点</li>
                <li>年轻消费群体更倾向于通过社交媒体获取产品信息</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-bold mb-3">三、数据分析</h3>
              <p className="text-gray-800 leading-loose mb-4">
                基于大规模用户调研和市场数据分析，我们识别出以下关键趋势：
              </p>
              <div className="bg-gray-100 rounded-lg p-6 mb-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-3xl font-bold text-black mb-1">85%</div>
                    <div className="text-sm text-gray-600">用户满意度</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-black mb-1">72%</div>
                    <div className="text-sm text-gray-600">复购意愿</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-black mb-1">68%</div>
                    <div className="text-sm text-gray-600">推荐意愿</div>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-xl font-bold mb-3">四、策略建议</h3>
              <ol className="list-decimal ml-6 space-y-2 text-gray-800">
                <li>持续优化产品智能化体验，提升用户感知价值</li>
                <li>加强品牌价值观传播，建立情感连接</li>
                <li>完善充电网络布局，降低用户使用焦虑</li>
                <li>强化社交媒体营销，提升品牌影响力</li>
              </ol>
            </section>

            <section>
              <h3 className="text-xl font-bold mb-3">五、结论</h3>
              <p className="text-gray-800 leading-loose">
                综合研究结果表明，在新能源汽车市场快速发展的背景下，用户需求呈现多元化和个性化趋势。
                企业需要在产品力、品牌力和服务力三个维度持续发力，才能在激烈的市场竞争中保持优势地位。
              </p>
            </section>

            <div className="mt-12 pt-6 border-t border-gray-300">
              <p className="text-sm text-gray-500 text-center">
                本文档由 {doc.uploader} 于 {doc.uploadDate} 上传 | {doc.category}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
