import { useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { filterSchema } from '../data/personaFilterSchema';
import type { PersonaProvenance } from '../utils/researchProjectStore';
import { provenanceLabel } from '../utils/personaDisplay';
import { PersonaTagCategoryRow } from './PersonaTagCategoryRow';

export function PersonaCdpTagFilterPanel({
  selectedTagValues,
  setSelectedTagValues,
  selectedProvenance,
  setSelectedProvenance,
  hitCount,
}: {
  selectedTagValues: Record<string, string[]>;
  setSelectedTagValues: Dispatch<SetStateAction<Record<string, string[]>>>;
  selectedProvenance: PersonaProvenance[];
  setSelectedProvenance: Dispatch<SetStateAction<PersonaProvenance[]>>;
  hitCount: number;
}) {
  const [activeTagPoolCategory, setActiveTagPoolCategory] = useState<string | null>(null);
  const tagPoolCloseTimerRef = useRef<number | null>(null);

  const allFields = filterSchema.flatMap((group) => group.fields);
  const allFieldMap = useMemo(() => new Map(allFields.map((f) => [f.key, f])), [allFields]);
  const selectedTagCount =
    Object.values(selectedTagValues).reduce((count, values) => count + values.length, 0) +
    selectedProvenance.length;

  const scheduleCloseTagPool = () => {
    if (tagPoolCloseTimerRef.current) {
      window.clearTimeout(tagPoolCloseTimerRef.current);
    }
    tagPoolCloseTimerRef.current = window.setTimeout(() => {
      setActiveTagPoolCategory(null);
    }, 120);
  };

  const clearAllFilters = () => {
    setSelectedProvenance([]);
    setSelectedTagValues({});
    setActiveTagPoolCategory(null);
  };

  const keepTagPoolOpen = (category: string) => {
    if (tagPoolCloseTimerRef.current) {
      window.clearTimeout(tagPoolCloseTimerRef.current);
      tagPoolCloseTimerRef.current = null;
    }
    setActiveTagPoolCategory(category);
  };

  return (
    <div className="col-span-12 bg-surface p-4 rounded-xl overflow-visible">
      <div className="mb-3">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <div className="text-sm font-bold text-gray-100">
            当前命中人设：<span className="text-primary text-base font-extrabold tabular-nums">{hitCount}</span>
          </div>
          <button
            type="button"
            onClick={clearAllFilters}
            className="shrink-0 rounded bg-primary px-3 py-1 text-sm font-bold text-black hover:bg-primary/90 transition-colors"
          >
            取消筛选
          </button>
        </div>
        <div className="mb-2 text-sm font-bold text-gray-100">
          当前已选标签：<span className="text-primary text-base font-extrabold tabular-nums">{selectedTagCount}</span>
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {selectedProvenance.map((p) => (
            <span key={p} className="text-[12px] font-semibold text-lime-300">
              信源：{provenanceLabel[p]}
            </span>
          ))}
          {(Object.entries(selectedTagValues) as Array<[string, string[]]>).flatMap(([key, values]) => {
            const field = allFieldMap.get(key);
            if (!field || !Array.isArray(values) || values.length === 0) return [];
            return values.map((value) => (
              <span key={`${key}-${value}`} className="text-[12px] font-semibold text-primary">
                {field.label}：{value}
              </span>
            ));
          })}
          {selectedProvenance.length === 0 && Object.keys(selectedTagValues).length === 0 && (
            <span className="text-[11px] text-gray-500">暂无筛选条件</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-2 items-center pb-3 mb-3 border-b border-white/10">
        <div className="col-span-2">
          <p className="text-[12px] font-bold text-white leading-5">信源筛选</p>
        </div>
        <div className="col-span-10 flex flex-wrap items-center gap-[3px] gap-y-1 text-[11px] text-gray-300 leading-5">
          {([
            { id: 'first' as const, label: '一方' },
            { id: 'deep_interview' as const, label: '深度访谈' },
          ]).map((opt, idx, arr) => {
            const active = selectedProvenance.includes(opt.id);
            return (
              <span key={opt.id} className="inline-flex items-center shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedProvenance((prev) =>
                      prev.includes(opt.id) ? prev.filter((x) => x !== opt.id) : [...prev, opt.id],
                    );
                  }}
                  className={`text-[11px] leading-5 transition-colors ${
                    active ? 'text-primary font-semibold' : 'text-gray-300 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
                {idx < arr.length - 1 && <span className="mx-[3px] text-gray-500">/</span>}
              </span>
            );
          })}
        </div>
      </div>

      <div className="space-y-1.5">
        {filterSchema.map((group) => (
          <PersonaTagCategoryRow
            key={group.category}
            group={group}
            isPoolOpen={activeTagPoolCategory === group.category}
            selectedTagValues={selectedTagValues}
            setSelectedTagValues={setSelectedTagValues}
            onPoolEnter={keepTagPoolOpen}
            onPoolLeave={scheduleCloseTagPool}
          />
        ))}
      </div>
    </div>
  );
}
