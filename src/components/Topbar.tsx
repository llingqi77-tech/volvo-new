import { Bell, HelpCircle, LogOut } from 'lucide-react';

export default function Topbar() {
  return (
    <header className="h-16 border-b border-white/10 flex justify-end items-center px-8 bg-background/80 backdrop-blur-md sticky top-0 z-40">
      <div className="flex items-center gap-6">
        <button className="text-gray-400 hover:text-white transition-colors">
          <Bell size={20} />
        </button>
        <button className="text-gray-400 hover:text-white transition-colors">
          <HelpCircle size={20} />
        </button>
        <button className="text-gray-400 hover:text-white transition-colors">
          <LogOut size={20} />
        </button>
        <div className="w-8 h-8 rounded-full bg-gray-700 overflow-hidden border border-white/20">
          <img src="https://i.pravatar.cc/150?img=11" alt="用户头像" className="w-full h-full object-cover" />
        </div>
      </div>
    </header>
  );
}
