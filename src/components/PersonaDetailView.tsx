import { useMemo } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import {
  getPersonaCardTitle,
  getVocKeywords,
  provenanceBadgeClass,
  provenanceLabel,
  radarChartLabels,
  radarDimensionDetails,
  type PersonaDisplayModel,
} from '../utils/personaDisplay';

export type PersonaDetailViewModel = PersonaDisplayModel;

const tagPillClass = 'px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded';

type Props = {
  persona: PersonaDetailViewModel;
  showContinueChat?: boolean;
  onContinueChat?: () => void;
  headingClassName?: string;
};

export function PersonaDetailView({
  persona,
  showContinueChat = true,
  onContinueChat,
  headingClassName = 'text-2xl md:text-3xl font-extrabold text-white',
}: Props) {
  const vocKeywords = useMemo(() => getVocKeywords(persona.voc, 8), [persona.voc]);
  const radarData = useMemo(
    () => radarChartLabels.map((label, idx) => ({ subject: label, value: persona.radar[idx] ?? 0, fullMark: 100 })),
    [persona.radar],
  );

  return (
    <div className="bg-surface rounded-xl border border-white/10 p-6 md:p-8 space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-2">
          <h1 className={headingClassName}>{getPersonaCardTitle(persona)} - 人设详情</h1>
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-bold ${provenanceBadgeClass[persona.provenance]}`}
          >
            信源：{provenanceLabel[persona.provenance]}
          </span>
        </div>
        {showContinueChat && onContinueChat && (
          <button
            type="button"
            onClick={onContinueChat}
            className="px-3 py-2 rounded-lg text-xs font-bold bg-primary text-black hover:bg-primary/90 shrink-0"
          >
            完善人设
          </button>
        )}
      </div>

      <div className="border-t border-white/10 pt-8 space-y-8">
        <section>
          <h3 className="text-sm font-bold text-gray-400 mb-3">CDP 标签</h3>
          <div className="flex flex-wrap gap-2">
            {persona.cdpTags.map((tag) => (
              <span key={tag} className="px-3 py-1 bg-surface-hover rounded text-xs text-primary">
                {tag}
              </span>
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-sm font-bold text-gray-400 mb-3">VOC 原始文本</h3>
          <div className="p-4 bg-surface-hover/80 border-l-2 border-primary text-sm text-gray-300 leading-relaxed rounded-r-lg">
            &quot;{persona.voc}&quot;
          </div>
          <div className="mt-4">
            <h4 className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">VOC 精炼关键词</h4>
            {vocKeywords.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {vocKeywords.map((kw) => (
                  <span key={kw} className="px-3 py-1 bg-surface-hover rounded text-xs text-gray-200 border border-white/10">
                    {kw}
                  </span>
                ))}
              </div>
            ) : (
              <div className="text-xs text-gray-500">暂无可提取关键词</div>
            )}
          </div>
        </section>

        <section>
          <h3 className="text-sm font-bold text-gray-400 mb-3">人设标签</h3>
          <div className="flex flex-wrap gap-2">
            {persona.tags.map((tag) => (
              <span key={tag} className={tagPillClass}>
                {tag}
              </span>
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-sm font-bold text-gray-400 mb-3">七维人设说明</h3>
          <div className="space-y-3 text-sm text-gray-200 leading-relaxed">
            {radarDimensionDetails.map((d) => (
              <p key={d.title}>
                <span className="font-bold text-white">{d.title}：</span>
                {d.desc}
              </p>
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-sm font-bold text-gray-400 mb-3">人设关键信息</h3>
          <ul className="list-disc ml-5 space-y-1 text-sm text-gray-200">
            {persona.cdpTags.map((tag) => (
              <li key={tag}>{tag}</li>
            ))}
          </ul>
        </section>

        <section>
          <h3 className="text-sm font-bold text-gray-400 mb-4">七维评分雷达图</h3>
          <div className="h-[420px] min-h-[320px] min-w-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={320}>
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke="#3b3b3b" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="评分" dataKey="value" stroke="#63fe33" fill="#63fe33" fillOpacity={0.25} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </div>
  );
}
