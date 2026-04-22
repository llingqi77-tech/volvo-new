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
    education: ['学历', '本科', '硕士'],
    industry: ['互联网', '制造业', '金融', '教育', '医疗'],
    enterpriseType: ['国企', '外企', '民企', '事业单位'],
    province: ['北京', '上海', '广东', '浙江', '江苏'],
    occupation: ['工程师', '教师', '医生', '销售', '管理'],
    gender: ['男', '女'],
    ageBandOneId: ['18-24', '25-35', '36-45', '46', '年轻', '中年'],
    familyStructure: ['核心家庭', '三代同堂', '单身', '家庭', '亲子'],
    familySize: ['1人', '2人', '3人', '4人'],
    maritalStatus: ['未婚', '已婚', '离异', '丧偶'],
    modelType: ['SUV', '轿车', 'MPV', '跑车'],
    purchaseUsage: ['通勤', '家庭', '商务', '长途', '自驾'],
    budget: ['10-20万', '20-30万', '30-50万', '50万以上', '预算', '价格'],
    purchaseType: ['首购', '置换', '增购'],
    hobbies: ['户外', '科技', '改装', '亲子'],
    concerns: ['电池安全', '品牌可靠性', '价格', '续航焦虑'],
    competitorSeries: ['理想L8', '问界M7', '特斯拉Model Y', '竞品'],
    top2InterestedModels30d: ['近30天', '兴趣', '车型偏好'],
    latestTestDriveTime: ['试驾', '近7天', '近30天'],
    multiStoreVisit: ['到店', '多次'],
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
            className={`persona-source-pill inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-bold ${
              persona.provenance === 'first' ? 'persona-source-pill-first' : ''
            } ${provenanceBadgeClass[persona.provenance]}`}
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
                    className="persona-neutral-pill px-3 py-1 rounded border border-primary/40 bg-primary/15 text-xs text-primary"
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
                    className="persona-neutral-pill px-2.5 py-1 rounded border border-primary/40 bg-primary/15 text-xs text-primary"
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
