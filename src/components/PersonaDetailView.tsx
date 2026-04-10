import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import type { InterviewPersona } from '../utils/researchProjectStore';

const RADAR_LABELS = [
  '人口与成长',
  '心理动因',
  '心理特征',
  '行为维度',
  '需求痛点',
  '技术接受',
  '社会关系',
];

const RADAR_DETAILS = [
  '人口与成长轨迹：年龄/教育/城市与成长经历等背景要素如何塑造价值观与选择偏好。',
  '心理动因：购买/使用背后的核心动机与触发点（安全感、效率、身份表达、家庭责任等）。',
  '心理特征维度：风险偏好、控制感、理性/感性程度、对新事物的态度与决策风格。',
  '行为维度：信息搜集、比较决策、试驾/到店、分享/推荐等可观测行为模式。',
  '需求与痛点维度：明确诉求与真实痛点（空间/智能/成本/服务/信任）。',
  '技术接受维度：对智能座舱、辅助驾驶、APP 服务等技术的认知与采用倾向。',
  '社会关系维度：家庭、同伴、KOL/社媒舆情对其决策影响路径与强度。',
];

export function PersonaDetailView({
  persona,
  showContinueChat = false,
}: {
  persona: InterviewPersona;
  showContinueChat?: boolean;
}) {
  const radarData = RADAR_LABELS.map((subject, i) => ({
    subject,
    A: persona.radar[i] ?? 0,
    fullMark: 100,
  }));
  const sourceLabel = persona.sourcePool === 'cdp' ? 'CDP' : persona.sourcePool === 'cdp_voc' ? 'CDP+VOC' : 'VOC';
  const sourceClass =
    persona.sourcePool === 'cdp'
      ? 'bg-primary/15 text-primary'
      : persona.sourcePool === 'cdp_voc'
        ? 'bg-indigo-500/20 text-indigo-300'
        : 'bg-blue-500/15 text-blue-300';
  const vocKeywords = Array.from(
    new Set(
      persona.voc
        .replace(/[""]/g, '')
        .split(/[，。！？；、,\s]+/)
        .map((x) => x.trim())
        .filter((x) => x.length >= 2),
    ),
  ).slice(0, 6);

  return (
    <div className="rounded-2xl border border-white/10 bg-surface p-6 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-3xl font-black text-white">{persona.cardTitle} - 人设详情</h3>
          <p className="mt-2 text-sm text-gray-400">{persona.name}</p>
        </div>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] ${sourceClass}`}
        >
          信源：{sourceLabel}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-bold text-white">CDP标签：</p>
        {persona.cdpTags.length > 0 ? (
          persona.cdpTags.map((tag) => (
            <span key={tag} className="px-3 py-1 rounded border border-primary/40 bg-primary/15 text-xs text-primary">
              {tag}
            </span>
          ))
        ) : (
          <span className="text-sm text-gray-400">暂无</span>
        )}
      </div>
      <div className="space-y-3 text-sm text-gray-200 leading-relaxed">
        <p>
          <span className="font-bold text-white">VOC 原始文本：</span>"{persona.voc}"
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-bold text-white">VOC 关键词：</span>
          {vocKeywords.length > 0 ? (
            vocKeywords.map((kw) => (
              <span key={kw} className="px-2.5 py-1 rounded border border-primary/40 bg-primary/15 text-xs text-primary">
                {kw}
              </span>
            ))
          ) : (
            <span className="text-sm text-gray-400">暂无可提取关键词</span>
          )}
        </div>
      </div>
      <div className="border-t border-white/10 pt-4 flex items-center justify-between gap-4">
        <h4 className="text-lg font-bold text-white">人设信息</h4>
        {showContinueChat ? (
          <button type="button" className="rounded-lg bg-primary px-3 py-2 text-lg font-bold text-black hover:bg-primary/90">
            完善人设
          </button>
        ) : null}
      </div>
      <div className="space-y-3 text-sm text-gray-200 leading-relaxed">
        {RADAR_DETAILS.map((detail) => (
          <p key={detail}>{detail}</p>
        ))}
      </div>
      <div className="h-[420px] w-full min-h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
            <PolarGrid stroke="#2d2935" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: '#8a8a8a', fontSize: 12 }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
            <Radar name="Persona" dataKey="A" stroke="#1bff1b" fill="#1bff1b" fillOpacity={0.3} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
