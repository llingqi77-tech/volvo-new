import {
  Fragment,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';
import type { FilterGroup } from '../data/personaFilterSchema';

export function PersonaTagCategoryRow({
  group,
  isPoolOpen,
  selectedTagValues,
  setSelectedTagValues,
  onPoolEnter,
  onPoolLeave,
}: {
  group: FilterGroup;
  isPoolOpen: boolean;
  selectedTagValues: Record<string, string[]>;
  setSelectedTagValues: Dispatch<SetStateAction<Record<string, string[]>>>;
  onPoolEnter: (category: string) => void;
  onPoolLeave: () => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [openUp, setOpenUp] = useState(false);

  const measurePanelLayout = useCallback(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const wrapRect = wrap.getBoundingClientRect();

    if (!isPoolOpen || !panelRef.current) return;
    const ph = panelRef.current.getBoundingClientRect().height;
    const margin = 8;
    const spaceBelow = window.innerHeight - wrapRect.bottom - margin;
    const spaceAbove = wrapRect.top - margin;
    const fitsBelow = spaceBelow >= Math.min(ph, 320);
    setOpenUp(!fitsBelow && spaceAbove > spaceBelow);
  }, [isPoolOpen]);

  useLayoutEffect(() => {
    measurePanelLayout();
  }, [measurePanelLayout, isPoolOpen, group.category, selectedTagValues]);

  useLayoutEffect(() => {
    if (!isPoolOpen) return;
    const onScrollOrResize = () => measurePanelLayout();
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [isPoolOpen, measurePanelLayout]);

  const isFieldFiltered = (fieldKey: string) => {
    const values = selectedTagValues[fieldKey];
    return Array.isArray(values) && values.length > 0;
  };

  return (
    <div ref={wrapRef} className="relative">
      <div className="grid grid-cols-12 gap-2 items-center py-1">
        <div className="col-span-2">
          <p className="text-[12px] font-bold text-white leading-5">{group.category}</p>
        </div>

        <div
          className="col-span-10 flex items-center gap-[3px] text-[11px] text-gray-300 leading-5 truncate cursor-default"
          onMouseEnter={() => onPoolEnter(group.category)}
          onMouseLeave={onPoolLeave}
          title={group.fields.map((f) => f.label).join('/')}
        >
          {group.fields.map((f, idx) => {
            const filtered = isFieldFiltered(f.key);
            return (
              <span key={f.key} className="inline-flex items-center shrink-0">
                <span className={filtered ? 'font-semibold text-primary' : undefined}>{f.label}</span>
                {idx < group.fields.length - 1 && <span className="mx-[3px] shrink-0 text-gray-500">/</span>}
              </span>
            );
          })}
        </div>
      </div>

      {isPoolOpen && (
        <div
          ref={panelRef}
          className={`absolute left-1/2 z-30 w-max min-w-0 max-w-full -translate-x-1/2 bg-surface border border-white/10 rounded-lg py-3 px-[calc(0.75rem+1ch)] shadow-2xl max-h-[min(18rem,55vh)] overflow-y-auto ${
            openUp ? 'bottom-full mb-1' : 'top-full mt-1'
          }`}
          onMouseEnter={() => onPoolEnter(group.category)}
          onMouseLeave={onPoolLeave}
        >
          <p className="text-xs font-bold text-white mb-2 whitespace-nowrap">{group.category} 标签池</p>
          <div className="grid w-full min-w-0 grid-cols-[auto_1fr] gap-x-[3ch] gap-y-2 items-start">
            {group.fields.map((field) => {
              const currentValues = selectedTagValues[field.key] ?? [];
              const filtered = isFieldFiltered(field.key);
              return (
                <Fragment key={field.key}>
                  <div
                    className={`self-start pt-0.5 text-[11px] ${filtered ? 'font-semibold text-primary' : 'text-gray-400'}`}
                  >
                    {field.label}
                  </div>
                  <div className="flex min-w-0 flex-wrap gap-x-2 gap-y-1">
                    {['全部', ...field.options].map((opt) => {
                      const selected = opt === '全部' ? currentValues.length === 0 : currentValues.includes(opt);
                      return (
                        <button
                          key={`${field.key}-${opt}`}
                          type="button"
                          onClick={() => {
                            setSelectedTagValues((prev) => {
                              if (opt === '全部') {
                                const next = { ...prev };
                                delete next[field.key];
                                return next;
                              }
                              const prevValues = prev[field.key] ?? [];
                              const nextValues = prevValues.includes(opt)
                                ? prevValues.filter((value) => value !== opt)
                                : [...prevValues, opt];
                              if (nextValues.length === 0) {
                                const next = { ...prev };
                                delete next[field.key];
                                return next;
                              }
                              return { ...prev, [field.key]: nextValues };
                            });
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
                </Fragment>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
