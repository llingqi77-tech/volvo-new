import { useState } from 'react';
import { Database, Users, MessageSquare, User, PanelLeftClose, PanelLeftOpen, ChevronDown, LogOut } from 'lucide-react';

export default function Sidebar({
  activeModule,
  setActiveModule,
  isCollapsed,
  onToggleCollapse,
  onLogout,
}: {
  activeModule: string,
  setActiveModule: (m: string) => void,
  isCollapsed: boolean,
  onToggleCollapse: () => void,
  onLogout: () => void,
}) {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const navItems = [
    { id: 'knowledge', icon: Database, label: '知识库管理' },
    { id: 'persona', icon: Users, label: '人设库管理' },
    { id: 'insight-research', icon: MessageSquare, label: '洞察研究' },
  ];

  return (
    <aside className={`${isCollapsed ? 'w-20' : 'w-64'} bg-background border-r border-white/10 flex flex-col py-6 z-50 transition-all duration-200`}>
      <div className={`mb-12 flex items-center ${isCollapsed ? 'justify-center px-2' : 'justify-between px-6'}`}>
        <div className={`flex items-center gap-3 ${isCollapsed ? '' : 'px-2'}`}>
          <div className="w-8 h-8 bg-primary flex items-center justify-center rounded-sm">
            <span className="text-black font-bold">V</span>
          </div>
          {!isCollapsed && (
            <div>
              <h1 className="text-primary font-black text-lg tracking-tighter">Volvo Insight</h1>
            </div>
          )}
        </div>
        {!isCollapsed && (
          <button onClick={onToggleCollapse} className="text-gray-500 hover:text-text-main transition-colors" aria-label="折叠侧边栏">
            <PanelLeftClose size={18} />
          </button>
        )}
      </div>
      {isCollapsed && (
        <div className="flex justify-center mb-8">
          <button onClick={onToggleCollapse} className="text-gray-500 hover:text-text-main transition-colors" aria-label="展开侧边栏">
            <PanelLeftOpen size={18} />
          </button>
        </div>
      )}
      
      <nav className="flex-1 space-y-2 px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeModule === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveModule(item.id)}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-4'} px-4 py-3 rounded-lg transition-all ${
                isActive 
                  ? 'bg-surface text-primary border-l-4 border-primary' 
                  : 'text-gray-500 hover:bg-surface hover:text-text-main'
              }`}
              title={item.label}
            >
              <Icon size={20} />
              {!isCollapsed && <span className="text-sm font-semibold tracking-normal whitespace-nowrap">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <div className="px-4 pt-6 border-t border-white/10 space-y-2">
        {isCollapsed ? (
          <button
            onClick={() => setActiveModule('profile-info')}
            className="w-full flex justify-center px-4 py-3 transition-colors rounded-lg text-gray-500 hover:text-text-main hover:bg-surface"
            title="个人主页"
          >
            <User size={20} />
          </button>
        ) : (
          <div
            className="relative"
            onMouseEnter={() => setIsProfileMenuOpen(true)}
            onMouseLeave={() => setIsProfileMenuOpen(false)}
          >
            <button
              className="w-full flex items-center justify-between px-4 py-3 transition-colors rounded-lg text-gray-300 hover:text-text-main hover:bg-surface"
              title="个人主页"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-700 overflow-hidden border border-white/20">
                  <img src="https://i.pravatar.cc/150?img=11" alt="用户头像" className="w-full h-full object-cover" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold">王安德</div>
                  <div className="text-[10px] text-gray-500">wangad@volvo.com</div>
                </div>
              </div>
              <ChevronDown size={16} className={`transition-transform ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            {isProfileMenuOpen && (
              <div className="absolute bottom-full mb-2 left-0 right-0 bg-surface border border-white/10 rounded-lg p-2 space-y-1 shadow-xl z-50">
                <button
                  onClick={() => setActiveModule('profile-info')}
                  className={`w-full text-left px-3 py-2 text-sm rounded flex items-center gap-2 ${
                    activeModule === 'profile-info' ? 'bg-surface text-primary' : 'text-gray-400 hover:bg-surface hover:text-white'
                  }`}
                >
                  <User size={15} />
                  个人信息
                </button>
                <button
                  onClick={onLogout}
                  className="w-full text-left px-3 py-2 text-sm rounded text-gray-400 hover:bg-surface hover:text-white flex items-center gap-2"
                >
                  <LogOut size={15} />
                  退出登录
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
