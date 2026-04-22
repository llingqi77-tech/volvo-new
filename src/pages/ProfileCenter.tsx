export default function ProfileCenter({ section = 'info' }: { section?: 'info' | 'research' }) {
  if (section === 'research') {
    return (
      <div className="p-10 max-w-6xl mx-auto">
        <div className="mb-10">
          <h1 className="text-4xl font-extrabold text-white mb-2">我的研究</h1>
          <p className="text-sm text-gray-400">查看你的研究任务与最近生成成果</p>
        </div>
        <div className="space-y-4">
          <div className="bg-surface rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-2">2024 纯电豪华 SUV 市场竞争力分析</h3>
            <p className="text-sm text-gray-400 mb-3">状态：已完成 · 更新时间：今天 10:24</p>
            <div className="text-xs text-gray-500">包含：人群画像调整、专家总结、PDF 报告导出</div>
          </div>
          <div className="bg-surface rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-2">北欧市场用户访谈洞察</h3>
            <p className="text-sm text-gray-400 mb-3">状态：进行中 · 更新时间：昨天 18:32</p>
            <div className="text-xs text-gray-500">包含：客户智能体访谈、VOC 分析、CDP 标签迭代</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-10 max-w-7xl mx-auto">
      <div className="mb-10">
        <h1 className="text-4xl font-extrabold text-white mb-2">个人中心</h1>
        <p className="text-sm text-gray-400">查看您的个人主页与核心数据概览</p>
      </div>

      <div className="grid grid-cols-12 gap-6 mb-8">
        <div className="col-span-4 bg-surface rounded-xl p-8">
          <div className="w-20 h-20 rounded-full bg-gray-700 overflow-hidden border border-white/20 mb-4">
            <img src="https://i.pravatar.cc/200?img=11" alt="用户头像" className="w-full h-full object-cover" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-1">王安德</h2>
          <p className="text-sm text-gray-400 mb-6">策略分析师 / Volvo Insight</p>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">邮箱</span>
              <span className="text-white">wangad@volvo.com</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">部门</span>
              <span className="text-white">市场洞察部</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">地区</span>
              <span className="text-white">上海</span>
            </div>
          </div>
        </div>

        <div className="col-span-8 grid grid-cols-3 gap-6">
          <div className="bg-surface rounded-xl p-6">
            <p className="text-xs text-gray-500 mb-2">累计上传文档</p>
            <p className="text-4xl font-extrabold text-white">36</p>
          </div>
          <div className="bg-surface rounded-xl p-6">
            <p className="text-xs text-gray-500 mb-2">创建人设</p>
            <p className="text-4xl font-extrabold text-white">12</p>
          </div>
          <div className="bg-surface rounded-xl p-6">
            <p className="text-xs text-gray-500 mb-2">本月会话数</p>
            <p className="text-4xl font-extrabold text-white">58</p>
          </div>
          <div className="col-span-3 bg-surface rounded-xl p-6">
            <p className="text-xs text-gray-500 mb-4">最近活跃</p>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">上传《2024年全球纯电SUV市场趋势深度调研》</span>
                <span className="text-gray-500">2小时前</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">创建人设「理性先锋型」</span>
                <span className="text-gray-500">昨天</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">生成正式研究报告</span>
                <span className="text-gray-500">3天前</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
