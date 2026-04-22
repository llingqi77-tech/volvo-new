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
  onGoLanding,
  theme,
  onThemeChange,
  onLogout,
}: {
  activeModule: AppModule;
  setActiveModule: (module: AppModule) => void;
  onGoLanding: () => void;
  theme: 'dark' | 'light';
  onThemeChange: (theme: 'dark' | 'light') => void;
  onLogout: () => void;
}) {
  const [isUserDrawerOpen, setIsUserDrawerOpen] = useState(false);
  const [isUserDrawerVisible, setIsUserDrawerVisible] = useState(false);

  const openUserDrawer = () => {
    setIsUserDrawerVisible(true);
    // Delay one frame so transition can run from initial transform state.
    requestAnimationFrame(() => setIsUserDrawerOpen(true));
  };

  const closeUserDrawer = () => {
    setIsUserDrawerOpen(false);
    window.setTimeout(() => setIsUserDrawerVisible(false), 100);
  };

  useEffect(() => {
    if (!isUserDrawerOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeUserDrawer();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isUserDrawerOpen]);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <button
            type="button"
            className="text-left"
            onClick={onGoLanding}
          >
            <span className="text-[19px] font-black tracking-tight text-text-main">
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
                  className={`text-[15px] font-semibold text-text-main transition-opacity ${
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
              className="rounded-full p-2 text-text-muted transition-colors hover:bg-surface-hover hover:text-text-main"
              aria-label="帮助中心"
            >
              <CircleHelp size={16} />
            </button>
            <button
              type="button"
              className="rounded-full p-2 text-text-muted transition-colors hover:bg-surface-hover hover:text-text-main"
              aria-label="打开用户菜单"
              onClick={openUserDrawer}
            >
              <Menu size={18} />
            </button>
          </div>
        </div>
      </header>

      {isUserDrawerVisible && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <button
            type="button"
            aria-label="关闭用户菜单"
            className={`flex-1 bg-black/45 transition-opacity duration-100 ${
              isUserDrawerOpen ? 'opacity-100' : 'opacity-0'
            }`}
            onClick={closeUserDrawer}
          />
          <aside
            className={`h-full w-[320px] border-l border-[var(--color-border)] bg-surface transition-transform duration-100 ease-out ${
              isUserDrawerOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 overflow-hidden rounded-full border border-white/15 bg-surface">
                  <img
                    src="https://i.pravatar.cc/80?img=11"
                    alt="用户头像"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-main">wangad@volvo.com</p>
                  <p className="text-xs text-gray-500">个人</p>
                </div>
              </div>
              <button
                type="button"
                className="rounded-full p-1.5 text-text-muted hover:bg-surface-hover hover:text-text-main"
                onClick={closeUserDrawer}
                aria-label="关闭"
              >
                <X size={16} />
              </button>
            </div>

            <div className="border-b border-[var(--color-border)] px-5 py-4">
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

            <div className="border-b border-[var(--color-border)] px-5 py-4">
              <p className="mb-3 text-xs text-gray-500">账户</p>
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-text-muted hover:bg-surface-hover hover:text-text-main"
              >
                <User size={15} />
                账户
              </button>
            </div>

            <div className="border-b border-[var(--color-border)] px-5 py-4">
              <p className="mb-3 text-xs text-gray-500">设置</p>
              <button type="button" className="mb-1 flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-text-muted hover:bg-surface-hover hover:text-text-main">
                <Globe size={15} />
                English
              </button>
              <button
                type="button"
                onClick={() => onThemeChange('light')}
                className={`mb-1 flex w-full items-center gap-2 rounded-md border px-2 py-2 text-sm transition-colors ${
                  theme === 'light'
                    ? 'border-primary/40 bg-primary/10 text-primary'
                    : 'border-transparent text-text-muted hover:bg-surface-hover hover:text-text-main'
                }`}
              >
                <Sun size={15} />
                浅色主题
              </button>
              <button
                type="button"
                onClick={() => onThemeChange('dark')}
                className={`flex w-full items-center gap-2 rounded-md border px-2 py-2 text-sm transition-colors ${
                  theme === 'dark'
                    ? 'border-primary/40 bg-primary/10 text-primary'
                    : 'border-transparent text-text-muted hover:bg-surface-hover hover:text-text-main'
                }`}
              >
                <Moon size={15} />
                深色主题
              </button>
            </div>

            <div className="px-5 py-4">
              <button
                type="button"
                onClick={() => {
                  closeUserDrawer();
                  onLogout();
                }}
                className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-text-muted hover:bg-surface-hover hover:text-text-main"
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
