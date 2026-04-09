export type PersonaProvenance = 'first' | 'third' | 'deep_interview';

/** 人设卡片标题：标签+昵称，展示用，建议 ≤7 个字符 */
export type PersonaDisplayModel = {
  id: string;
  name: string;
  /** 卡片主标题，如「宝妈婷婷」「职场小李」；缺省时由 getPersonaCardTitle 回退生成 */
  cardTitle?: string;
  tags: string[];
  cdpTags: string[];
  voc: string;
  radar: number[];
  provenance: PersonaProvenance;
};

const MAX_PERSONA_CARD_TITLE_LEN = 7;

/** 人设库/人群画像卡片用「标签+昵称」标题，字数不超过 7 */
export function getPersonaCardTitle(
  p: Pick<PersonaDisplayModel, 'tags' | 'name'> & { cardTitle?: string },
): string {
  if (p.cardTitle != null && String(p.cardTitle).trim()) {
    const chars = [...String(p.cardTitle).trim()];
    return chars.slice(0, MAX_PERSONA_CARD_TITLE_LEN).join('');
  }
  const tagRaw = (p.tags?.[0] ?? '用户').replace(/型$/g, '');
  const tag = [...tagRaw].slice(0, 4).join('');
  const name = p.name ?? '友';
  const nick = [...name].slice(-2).join('');
  let combined = `${tag}${nick}`;
  const out = [...combined].slice(0, MAX_PERSONA_CARD_TITLE_LEN).join('');
  return out || '典型用户';
}

export const provenanceLabel: Record<PersonaProvenance, string> = {
  first: '一方',
  third: '三方',
  deep_interview: '深度访谈',
};

export const provenanceBadgeClass: Record<PersonaProvenance, string> = {
  first: 'bg-primary/15 text-primary border-primary/30',
  third: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  deep_interview: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
};

export const radarDimensionDetails: Array<{ title: string; desc: string }> = [
  { title: '人口与成长轨迹', desc: '年龄/教育/城市与成长经历等背景要素如何塑造价值观与选择偏好。' },
  { title: '心理动因', desc: '购买/使用背后的核心动机与触发点（安全感、效率、身份表达、家庭责任等）。' },
  { title: '心理特征维度', desc: '风险偏好、控制感、理性/感性程度、对新事物的态度与决策风格。' },
  { title: '行为维度', desc: '信息搜集、比较决策、试驾/到店、分享/推荐等可观测行为模式。' },
  { title: '需求与痛点维度', desc: '明确诉求与真实痛点：空间/续航/充电/智能/舒适/成本等。' },
  { title: '技术接受度维度', desc: '对智能化、自动驾驶、互联服务的学习意愿、信任边界与付费意愿。' },
  { title: '社会关系维度', desc: '家庭/同伴/社群影响与口碑扩散路径，谁会影响其最终决定。' },
];

export const radarChartLabels = [
  '人口与成长轨迹',
  '心理动因',
  '心理特征维度',
  '行为维度',
  '需求与痛点维度',
  '技术接受度维度',
  '社会关系维度',
];

export function getVocKeywords(voc: string, limit = 6) {
  const text = (voc ?? '')
    .replace(/[""'']/g, '')
    .replace(/[。！？!?,，；;：:\(\)\[\]{}<>《》]/g, ' ')
    .trim();
  if (!text) return [] as string[];

  const candidates = text.match(/[\u4e00-\u9fa5A-Za-z0-9]{2,10}/g) ?? [];
  const stop = new Set([
    '用户', '车辆', '汽车', '希望', '需要', '一个', '不会', '就是', '觉得', '还是', '主要', '非常', '同时',
    '可以', '比较', '因为', '如果', '自己', '这辆', '这个', '那些', '什么', '以及', '而且', '但是',
  ]);
  const freq = new Map<string, number>();
  for (const w of candidates) {
    const word = w.trim();
    if (word.length < 2) continue;
    if (stop.has(word)) continue;
    freq.set(word, (freq.get(word) ?? 0) + 1);
  }
  return Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)
    .slice(0, limit)
    .map(([w]) => w);
}

export function getPersonaAlias(p: Pick<PersonaDisplayModel, 'tags' | 'cdpTags'>) {
  const normalize = (text: string) =>
    text
      .trim()
      .replace(/[^\u4e00-\u9fa5A-Za-z0-9]/g, '')
      .replace(/者$/g, '')
      .slice(0, 5);

  const tag1 = normalize(p.tags?.[0] || '');
  const tag2 = normalize(p.tags?.[1] || '');
  const cdp1 = normalize(p.cdpTags?.[0] || '');

  if (tag1) return tag1;
  if (tag2) return tag2;
  if (cdp1) return cdp1;
  return '典型画像';
}
