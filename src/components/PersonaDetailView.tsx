import { filterSchema, type TagField } from '../data/personaFilterSchema';
import type { InterviewPersona } from '../utils/researchProjectStore';
import {
  RADAR_TIER_MAX,
  getPersonaAlias,
  getVocKeywords,
  provenanceBadgeClass,
  provenanceLabel,
  radarChartLabels,
  radarDimensionDetails,
  radarValuesToTiers,
  sumRadarTiers,
} from '../utils/personaDisplay';
import { PersonaRadarChart } from './PersonaRadarChart';

export function PersonaDetailView({
  persona,
  showContinueChat = false,
}: {
  persona: InterviewPersona;
  showContinueChat?: boolean;
}) {
  const vocKeywords = getVocKeywords(persona.voc, 8);
  const allFields = filterSchema.flatMap((group) => group.fields);
  const hashString = (s: string) => s.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const pickByHash = (options: string[], seed: string) => options[hashString(seed) % options.length];
  const deriveTagValue = (field: TagField) => pickByHash(field.options, `${persona.id}-${persona.name}-${field.key}`);
  const getRadarTotal = (radar: number[]) => sumRadarTiers(radarValuesToTiers(radar));
  const radarTotalMax = radarChartLabels.length * RADAR_TIER_MAX;
  const personaTagKeywordMap: Partial<Record<string, string[]>> = {
    purchaseFocus: ['安全', '空间', '智能', '外观', '性价比', '品牌', '舒适', '品质'],
    purchaseUsage: ['通勤', '家庭', '商务', '长途', '周末', '亲子'],
    priceSensitivity: ['预算', '价格', '优惠', '促销', '省'],
    brandSensitivity: ['品牌', '忠诚', '信任', '沃尔沃'],
    modelInterest: ['试驾', '浏览', '兴趣'],
    latestTestDriveTime: ['试驾', '最近'],
    bodyTypePreference: ['SUV', '轿车', '空间'],
    lifestyleTag: ['运动', '旅行', '家庭', '科技', '美食', '户外'],
    industry: ['互联网', '金融', '自由职业', '制造业', '体制内'],
    annualIncome: ['高净值', '收入', '预算'],
    age: ['年轻', '中年', '退休', '银发', 'Z世代'],
    familyStructure: ['家庭', '孩子', '二胎', '三口', '五口'],
    powerType: ['燃油', '混动', '纯电', '新能源'],
  };

  const displayTags = (() => {
    const text = `${persona.category} ${persona.subCategory} ${persona.tags.join(' ')} ${persona.cdpTags.join(' ')} ${persona.voc}`.toLowerCase();
    const richness = getRadarTotal(persona.radar) / radarTotalMax;
    const targetCount = Math.max(3, Math.min(5, 3 + Math.round(richness * 2)));
    const scored = allFields.map((field) => {
      const keywords = personaTagKeywordMap[field.key] ?? [];
      const keywordHits = keywords.reduce((acc, kw) => acc + (text.includes(kw.toLowerCase()) ? 1 : 0), 0);
      const semanticHint =
        (text.includes(field.label.toLowerCase()) ? 1 : 0) +
        field.options.reduce((acc, opt) => acc + (text.includes(opt.toLowerCase()) ? 1 : 0), 0);
      const hashBoost = (hashString(`${persona.id}-${field.key}`) % 17) / 100;
      return { field, value: deriveTagValue(field), score: keywordHits * 3 + semanticHint * 1.5 + hashBoost };
    });
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, targetCount)
      .map((item) => `${item.field.label}：${item.value}`);
  })();

  return (
    <div>
      <div className="bg-surface rounded-xl p-8 mb-6">
        <h1 className="text-3xl font-extrabold text-white mb-2">{getPersonaAlias(persona)} - 人设详情</h1>
        <div className="mt-2">
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-bold ${provenanceBadgeClass[persona.provenance]}`}
          >
            信源：{provenanceLabel[persona.provenance]}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 bg-surface rounded-xl p-6 space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-bold text-white">人设标签：</p>
            <div className="flex flex-wrap gap-2">
              {displayTags.length > 0 ? (
                displayTags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 rounded border border-primary/40 bg-primary/15 text-xs text-primary"
                  >
                    {tag}
                  </span>
                ))
              ) : (
                <p className="text-sm text-gray-400">暂无</p>
              )}
            </div>
          </div>

          <div className="space-y-3 text-sm text-gray-200 leading-relaxed">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold text-white">人设关键词：</span>
              {vocKeywords.length > 0 ? (
                vocKeywords.map((kw) => (
                  <span
                    key={kw}
                    className="px-2.5 py-1 rounded border border-primary/40 bg-primary/15 text-xs text-primary"
                  >
                    {kw}
                  </span>
                ))
              ) : (
                <span className="text-sm text-gray-400">暂无可提取关键词</span>
              )}
            </div>
          </div>

          <div className="border-t border-white/10 pt-4 flex items-center justify-between gap-4">
            <h3 className="text-lg font-bold text-white">人设信息</h3>
            {showContinueChat ? (
              <button
                type="button"
                className="rounded-lg bg-primary px-3 py-2 text-lg font-bold text-black hover:bg-primary/90 shrink-0"
              >
                完善人设
              </button>
            ) : null}
          </div>

          <div className="space-y-3 text-sm text-gray-200 leading-relaxed">
            {radarDimensionDetails.map((d) => (
              <p key={d.title}>
                <span className="font-bold text-white">{d.title}：</span>
                {d.desc}
              </p>
            ))}
          </div>

          <div>
            <h4 className="text-lg font-bold text-white mb-3">七维评分雷达图</h4>
            <PersonaRadarChart radar={persona.radar} />
          </div>
        </div>
      </div>
    </div>
  );
}
