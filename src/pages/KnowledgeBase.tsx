import { Upload, Search, FileText, MoreVertical, TrendingUp, FolderOpen } from 'lucide-react';

export default function KnowledgeBase() {
  return (
    <div className="p-10 max-w-7xl mx-auto">
      <div className="flex justify-between items-end mb-12">
        <div>
          <h1 className="text-4xl font-extrabold text-white mb-2">知识库管理</h1>
        </div>
        <button className="bg-primary text-black font-bold px-6 py-3 rounded flex items-center gap-2 hover:bg-primary/90 transition-colors">
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
          <button className="px-6 py-2 text-sm font-bold bg-white text-black rounded-md">全库文档</button>
          <button className="px-6 py-2 text-sm font-bold text-gray-400 hover:text-white">洞察报告库</button>
          <button className="px-6 py-2 text-sm font-bold text-gray-400 hover:text-white">整车知识库</button>
          <button className="px-6 py-2 text-sm font-bold text-gray-400 hover:text-white">行业知识库</button>
        </div>
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input type="text" placeholder="搜索文档标题、关键词..." className="w-full bg-surface border-none rounded-lg py-2 pl-10 pr-4 text-sm text-white focus:ring-1 focus:ring-primary outline-none" />
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
          {[
            { title: '2024年全球纯电SUV市场趋势深度调研', type: 'PDF • 14.2 MB • 2023-11-24', tags: ['电动化', 'SUV'], uploader: '王安德', color: 'text-primary' },
            { title: 'Volvo EX90 智驾系统硬件拆解报告', type: 'PDF • 45.8 MB • 2023-11-20', tags: ['EX90', '智驾硬件'], uploader: '林索菲', color: 'text-blue-400' },
            { title: '欧洲固态电池产业链投资机遇分析', type: 'PDF • 8.1 MB • 2023-11-15', tags: ['固态电池', '欧洲市场'], uploader: '徐莱纳斯', color: 'text-gray-400' },
          ].map((doc, i) => (
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
          ))}
        </div>
      </div>
    </div>
  );
}
