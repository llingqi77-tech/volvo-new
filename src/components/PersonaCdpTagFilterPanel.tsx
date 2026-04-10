import { useCallback, useRef, useState } from 'react';
import { filterSchema } from '../data/personaFilterSchema';

export function PersonaCdpTagFilterPanel({
  selectedTagValues,
  onChange,
}: {
  selectedTagValues: Record<string, string>;
  onChange: (next: Record<string, string>) => void;
}) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const closeTimerRef = useRef<number | null>(null);

  const scheduleClose = useCallback(() => {
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = window.setTimeout(() => setActiveCategory(null), 160);
  }, []);

  const keepOpen = useCallback((category: string) => {
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    setActiveCategory(category);
  }, []);

  return (
    <div className="space-y-1.5">
      <p className="text-sm font-bold text-white">CDP 标签筛选</p>
      <p className="text-xs text-gray-500 mb-2">悬停分类展开标签池，选择后用于重新匹配人设。</p>
      {filterSchema.map((group) => {
        const isOpen = activeCategory === group.category;
        return (
          <div key={group.category} className="relative grid grid-cols-12 gap-2 items-center py-1">
            <div className="col-span-3">
              <p className="text-[11px] font-bold text-white leading-5">{group.category}</p>
            </div>
            <div
              className="col-span-9 flex flex-wrap gap-x-2 text-[11px] text-gray-400 cursor-default"
              onMouseEnter={() => keepOpen(group.category)}
              onMouseLeave={scheduleClose}
            >
              {group.fields.map((f) => f.label).join(' · ')}
            </div>
            {isOpen && (
              <div
                className="absolute left-[26%] right-0 top-[calc(100%+2px)] z-30 rounded-lg border border-white/10 bg-surface p-3 shadow-2xl"
                onMouseEnter={() => keepOpen(group.category)}
                onMouseLeave={scheduleClose}
              >
                <div className="chat-scroll-area space-y-2 max-h-56 overflow-y-auto pr-1">
                  {group.fields.map((field) => {
                    const currentValue = selectedTagValues[field.key] ?? '全部';
                    return (
                      <div key={field.key} className="grid grid-cols-12 gap-2 items-start">
                        <div className="col-span-3 text-[11px] text-gray-400 pt-1">{field.label}</div>
                        <div className="col-span-9 flex flex-wrap gap-x-2 gap-y-1">
                          {['全部', ...field.options].map((opt) => {
                            const selected = currentValue === opt;
                            return (
                              <button
                                key={`${field.key}-${opt}`}
                                type="button"
                                onClick={() => {
                                  if (opt === '全部') {
                                    onChange(
                                      Object.fromEntries(
                                        Object.entries(selectedTagValues).filter(([k]) => k !== field.key),
                                      ),
                                    );
                                  } else {
                                    onChange({ ...selectedTagValues, [field.key]: opt });
                                  }
                                }}
                                className={`text-[11px] transition-colors ${
                                  selected ? 'text-primary font-semibold' : 'text-gray-300 hover:text-white'
                                }`}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
