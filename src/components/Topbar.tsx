import { useState } from 'react';
import { User, FolderClock, LogOut, X } from 'lucide-react';

export default function Topbar({
  onOpenProfile,
  onOpenProject,
  onLogout,
}: {
  onOpenProfile: () => void;
  onOpenProject: () => void;
  onLogout: () => void;
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="h-16 border-b border-white/10 flex justify-end items-center px-8 bg-background/80 backdrop-blur-md sticky top-0 z-40">
      <div className="flex items-center gap-6 relative">
        <button
          onClick={() => setIsMenuOpen((prev) => !prev)}
          className="w-8 h-8 rounded-full bg-gray-700 overflow-hidden border border-white/20"
          title="个人主页"
        >
          <img src="https://i.pravatar.cc/150?img=11" alt="用户头像" className="w-full h-full object-cover" />
        </button>
        {isMenuOpen && (
          <>
            <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setIsMenuOpen(false)}></div>
            <div className="fixed inset-y-0 right-0 w-80 bg-[#f5f5f5] border-l border-[#d9d9d9] z-50 flex flex-col h-screen">
              <div className="px-5 pt-4 pb-3 border-b border-[#e1e1e1] bg-[#f5f5f5]">
                <div className="flex justify-end mb-3">
                  <button onClick={() => setIsMenuOpen(false)} className="text-gray-500 hover:text-black">
                    <X size={18} />
                  </button>
                </div>
                <div className="bg-[#ececec] rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-md bg-gray-700 overflow-hidden border border-white/20">
                      <img src="https://i.pravatar.cc/150?img=11" alt="用户头像" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-[#1f1f1f]">王安德</div>
                      <div className="text-xs text-[#666]">wangad@volvo.com</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-5 py-4 border-b border-[#e1e1e1] bg-[#f7f7f7] flex-1 overflow-y-auto">
                <div className="space-y-2">
                  <button onClick={() => { onOpenProfile(); setIsMenuOpen(false); }} className="w-full text-left px-3 py-2 rounded text-sm text-[#2f2f2f] hover:bg-[#ececec] flex items-center gap-2">
                    <User size={16} />
                    个人信息
                  </button>
                  <button onClick={() => { onOpenProject(); setIsMenuOpen(false); }} className="w-full text-left px-3 py-2 rounded text-sm text-[#2f2f2f] hover:bg-[#ececec] flex items-center gap-2">
                    <FolderClock size={16} />
                    我的项目
                  </button>
                </div>
              </div>

              <div className="px-5 py-4 bg-[#efefef] border-t border-[#e1e1e1]">
                <button onClick={() => { onLogout(); setIsMenuOpen(false); }} className="w-full text-left px-3 py-2 rounded text-sm text-[#2f2f2f] hover:bg-[#e5e5e5] flex items-center gap-2">
                  <LogOut size={16} />
                  退出登录
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
