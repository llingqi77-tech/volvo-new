import { Coins, CircleHelp, Globe, LogOut, Menu, Moon, Sun, User, X } from 'lucide-react';
import { useEffect, useState } from 'react';

export type AppModule =
  | 'landing'
  | 'knowledge'
  | 'persona'
  | 'insight-research'
  | 'ai-panel'
  | 'ai-sage';

const navItems: Array<{ id: AppModule; label: string }> = [
  { id: 'knowledge', label: '知识库管理' },
  { id: 'persona', label: '人设库管理' },
  { id: 'insight-research', label: '洞察研究' },
  { id: 'ai-panel', label: 'AI Panel' },
  { id: 'ai-sage', label: 'AI Sage' },
];

export default function TopNavBar({
  activeModule,
  setActiveModule,
  onLogout,
}: {
  activeModule: AppModule;
  setActiveModule: (module: AppModule) => void;
  onLogout: () => void;
}) {
  const [isUserDrawerOpen, setIsUserDrawerOpen] = useState(false);

  useEffect(() => {
    if (!isUserDrawerOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsUserDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isUserDrawerOpen]);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/10 bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <button
            type="button"
            className="text-left"
            onClick={() => setActiveModule('landing')}
          >
            <span className="text-[19px] font-black tracking-tight text-white">
              Customer Insight Copilot
            </span>
          </button>

          <nav className="hidden -ml-[10px] items-center gap-7 md:flex">
            {navItems.map((item) => {
              const isActive = activeModule === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveModule(item.id)}
                  className={`text-[15px] font-semibold transition-opacity text-white ${
                    isActive ? 'opacity-100' : 'opacity-100 hover:opacity-85'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-1 text-sm font-semibold text-amber-300 sm:flex">
              <Coins size={14} />
              509k
            </div>
            <button
              type="button"
              className="rounded-full p-2 text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
              aria-label="帮助中心"
            >
              <CircleHelp size={16} />
            </button>
            <button
              type="button"
              className="rounded-full p-2 text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
              aria-label="打开用户菜单"
              onClick={() => setIsUserDrawerOpen(true)}
            >
              <Menu size={18} />
            </button>
          </div>
        </div>
      </header>

      {isUserDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <button
            type="button"
            aria-label="关闭用户菜单"
            className="flex-1 bg-black/45"
            onClick={() => setIsUserDrawerOpen(false)}
          />
          <aside className="h-full w-[320px] border-l border-white/10 bg-[#14161d]">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 overflow-hidden rounded-full border border-white/15 bg-surface">
                  <img
                    src="https://i.pravatar.cc/80?img=11"
                    alt="用户头像"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">wangad@volvo.com</p>
                  <p className="text-xs text-gray-500">个人</p>
                </div>
              </div>
              <button
                type="button"
                className="rounded-full p-1.5 text-gray-400 hover:bg-white/5 hover:text-white"
                onClick={() => setIsUserDrawerOpen(false)}
                aria-label="关闭"
              >
                <X size={16} />
              </button>
            </div>

            <div className="border-b border-white/10 px-5 py-4">
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-lg py-1 text-left text-sm"
              >
                <span className="flex items-center gap-2 text-amber-300">
                  <Coins size={14} />
                  509k
                </span>
                <span className="text-xs text-gray-500">购买Token</span>
              </button>
            </div>

            <div className="border-b border-white/10 px-5 py-4">
              <p className="mb-3 text-xs text-gray-500">账户</p>
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white"
              >
                <User size={15} />
                账户
              </button>
            </div>

            <div className="border-b border-white/10 px-5 py-4">
              <p className="mb-3 text-xs text-gray-500">设置</p>
              <button type="button" className="mb-1 flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white">
                <Globe size={15} />
                English
              </button>
              <button type="button" className="mb-1 flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white">
                <Sun size={15} />
                浅色主题
              </button>
              <button type="button" className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white">
                <Moon size={15} />
                深色主题
              </button>
            </div>

            <div className="px-5 py-4">
              <button
                type="button"
                onClick={() => {
                  setIsUserDrawerOpen(false);
                  onLogout();
                }}
                className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white"
              >
                <LogOut size={15} />
                退出登录
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
