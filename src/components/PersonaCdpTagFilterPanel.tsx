import { useRef, useState } from 'react';
import { filterSchema } from '../data/personaFilterSchema';

type Props = {
  selectedTagValues: Record<string, string>;
  onChange: (next: Record<string, string>) => void;
  sectionTitle?: string;
};

export function PersonaCdpTagFilterPanel({
  selectedTagValues,
  onChange,
  sectionTitle = '标签筛选',
}: Props) {
  const [activeTagPoolCategory, setActiveTagPoolCategory] = useState<string | null>(null);
  const [tagPoolStyle, setTagPoolStyle] = useState<{ top: number; left: number; width: number }>({
    top: 0,
    left: 0,
    width: 560,
  });
  const tagPoolCloseTimerRef = useRef<number | null>(null);

  const scheduleCloseTagPool = () => {
    if (tagPoolCloseTimerRef.current) {
      window.clearTimeout(tagPoolCloseTimerRef.current);
    }
    tagPoolCloseTimerRef.current = window.setTimeout(() => {
      setActiveTagPoolCategory(null);
    }, 120);
  };

  const keepTagPoolOpen = (category: string, anchorEl?: HTMLElement | null) => {
    if (tagPoolCloseTimerRef.current) {
      window.clearTimeout(tagPoolCloseTimerRef.current);
      tagPoolCloseTimerRef.current = null;
    }
    setActiveTagPoolCategory(category);
    if (anchorEl) {
      const rect = anchorEl.getBoundingClientRect();
      const viewportPadding = 12;
      const preferredWidth = 560;
      const width = Math.min(preferredWidth, Math.max(320, window.innerWidth - viewportPadding * 2));
      const preferredLeft = rect.right + 8;
      const left = Math.max(
        viewportPadding,
        Math.min(preferredLeft, window.innerWidth - width - viewportPadding),
      );
      const top = Math.max(
        viewportPadding,
        Math.min(rect.top, window.innerHeight - 360 - viewportPadding),
      );
      setTagPoolStyle({ top, left, width });
    }
  };

  return (
    <>
      <p className="text-white text-base font-bold mb-3">{sectionTitle}</p>
      <div className="space-y-1.5 mb-3">
        {filterSchema.map((group) => {
          const isPoolOpen = activeTagPoolCategory === group.category;

          return (
            <div key={group.category} className="relative grid grid-cols-12 gap-2 items-center py-1">
              <div className="col-span-2">
                <p className="text-[12px] font-bold text-white leading-5">{group.category}</p>
              </div>

              <div
                className="col-span-10 flex items-center gap-[3px] text-[11px] text-gray-300 leading-5 truncate cursor-default"
                onMouseEnter={(e) => keepTagPoolOpen(group.category, e.currentTarget as HTMLElement)}
                onMouseLeave={scheduleCloseTagPool}
                title={group.fields.map((f) => f.label).join('/')}
              >
                {group.fields.map((f, idx) => (
                  <span key={f.key} className="inline-flex items-center shrink-0">
                    {f.label}
                    {idx < group.fields.length - 1 && <span className="mx-[3px] text-gray-500">/</span>}
                  </span>
                ))}
              </div>

              {isPoolOpen && (
                <div
                  className="fixed z-[60] bg-surface border border-white/10 rounded-lg p-3 shadow-2xl"
                  style={{ top: tagPoolStyle.top, left: tagPoolStyle.left, width: tagPoolStyle.width }}
                  onMouseEnter={() => keepTagPoolOpen(group.category)}
                  onMouseLeave={scheduleCloseTagPool}
                >
                  <p className="text-xs font-bold text-white mb-2">{group.category} 标签池</p>
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {group.fields.map((field) => {
                      const currentValue = selectedTagValues[field.key] ?? '全部';
                      return (
                        <div key={field.key} className="grid grid-cols-12 gap-2 items-start">
                          <div className="col-span-3 text-[11px] text-gray-400 pt-1">{field.label}</div>
                          <div className="col-span-9 flex flex-wrap gap-x-3 gap-y-1">
                            {['全部', ...field.options].map((opt) => {
                              const selected = currentValue === opt;
                              return (
                                <button
                                  key={`${field.key}-${opt}`}
                                  type="button"
                                  onClick={() => {
                                    if (opt === '全部') {
                                      const next = { ...selectedTagValues };
                                      delete next[field.key];
                                      onChange(next);
                                    } else {
                                      onChange({ ...selectedTagValues, [field.key]: opt });
                                    }
                                  }}
                                  className={`text-[11px] transition-colors ${
                                    selected ? 'text-primary' : 'text-gray-300 hover:text-white'
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
    </>
  );
}
