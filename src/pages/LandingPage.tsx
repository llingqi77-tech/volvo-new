type LandingPageProps = {
  onStartResearch: () => void;
};

const dots = [
  { top: '18%', left: '10%' },
  { top: '30%', left: '74%' },
  { top: '62%', left: '18%' },
  { top: '76%', left: '66%' },
];

export default function LandingPage({ onStartResearch }: LandingPageProps) {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-background">
      {dots.map((dot) => (
        <span
          key={`${dot.top}-${dot.left}`}
          className="absolute h-1.5 w-1.5 rounded-sm bg-primary/80"
          style={{ top: dot.top, left: dot.left }}
        />
      ))}

      <div className="mx-auto flex max-w-7xl flex-col items-center px-6 pb-16 pt-24 text-center">
        <h1 className="mb-4 text-6xl font-black tracking-tight text-white">
          商业研究多智能体
        </h1>
        <p className="mb-10 text-2xl text-gray-400">
          Customer Insight Copilot 模拟消费者决策，全自动访谈和分析并产出报告。
        </p>

        <div className="mb-24 flex items-center gap-5">
          <button
            type="button"
            onClick={onStartResearch}
            className="rounded-full bg-primary px-10 py-3 text-base font-bold text-black transition-colors hover:bg-primary/90"
          >
            开始您的研究
          </button>
          <div className="hidden items-center gap-3 text-sm text-gray-300 md:flex">
            <div className="flex -space-x-2">
              {[9, 12, 18, 22, 27].map((id) => (
                <img
                  key={id}
                  src={`https://i.pravatar.cc/44?img=${id}`}
                  alt="avatar"
                  className="h-8 w-8 rounded-full border border-background"
                />
              ))}
            </div>
            <span className="text-yellow-400">★★★★★</span>
            <span>累计数千次调研</span>
          </div>
        </div>

        <div className="h-[420px] w-full rounded-3xl border border-white/10 bg-black/65" />
      </div>
    </div>
  );
}
