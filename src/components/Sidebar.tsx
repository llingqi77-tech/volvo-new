import { Database, Users, MessageSquare, LineChart, Settings, User } from 'lucide-react';

export default function Sidebar({ activeModule, setActiveModule }: { activeModule: string, setActiveModule: (m: string) => void }) {
  const navItems = [
    { id: 'knowledge', icon: Database, label: '知识库管理' },
    { id: 'persona', icon: Users, label: '人设库管理' },
    { id: 'chat', icon: MessageSquare, label: '聊天模式' },
    { id: 'research', icon: LineChart, label: '正式研究' },
  ];

  return (
    <aside className="w-64 bg-background border-r border-white/10 flex flex-col py-6 z-50">
      <div className="px-8 mb-12 flex items-center gap-3">
        <div className="w-8 h-8 bg-primary flex items-center justify-center rounded-sm">
          <span className="text-black font-bold">V</span>
        </div>
        <div>
          <h1 className="text-primary font-black text-lg tracking-tighter">Volvo Insight</h1>
        </div>
      </div>
      
      <nav className="flex-1 space-y-2 px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeModule === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveModule(item.id)}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-all ${
                isActive 
                  ? 'bg-surface text-primary border-l-4 border-primary' 
                  : 'text-gray-500 hover:bg-surface hover:text-white'
              }`}
            >
              <Icon size={20} />
              <span className="text-sm font-semibold tracking-widest">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="px-4 pt-6 border-t border-white/10 space-y-2">
        <button className="w-full flex items-center gap-4 px-4 py-3 text-gray-500 hover:text-white transition-colors rounded-lg hover:bg-surface">
          <Settings size={20} />
          <span className="text-sm font-semibold tracking-widest">系统设置</span>
        </button>
        <button className="w-full flex items-center gap-4 px-4 py-3 text-gray-500 hover:text-white transition-colors rounded-lg hover:bg-surface">
          <User size={20} />
          <span className="text-sm font-semibold tracking-widest">账户管理</span>
        </button>
      </div>
    </aside>
  );
}
