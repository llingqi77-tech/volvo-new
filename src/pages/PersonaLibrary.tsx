import { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, ArrowLeft, FileUp, Bot, Send } from 'lucide-react';
import Modal from '../components/Modal';
import { PersonaRadarChart } from '../components/PersonaRadarChart';
import { PersonaTagCategoryRow } from '../components/PersonaTagCategoryRow';
import { filterSchema, type TagField } from '../data/personaFilterSchema';
import { RADAR_TIER_MAX, radarChartLabels, radarValuesToTiers, sumRadarTiers } from '../utils/personaDisplay';
import * as pdfjsLib from 'pdfjs-dist';

// 配置 PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

export default function PersonaLibrary({ onSubPageChange }: { onSubPageChange?: (isSubPage: boolean) => void }) {
  // 筛选状态
  const [selectedTagValues, setSelectedTagValues] = useState<Record<string, string[]>>({});
  const [selectedProvenance, setSelectedProvenance] = useState<Array<'first' | 'third' | 'deep_interview'>>([]);
  const [activeTagPoolCategory, setActiveTagPoolCategory] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(null);
  const [isPersonaChatOpen, setIsPersonaChatOpen] = useState(false);
  const [personaChatInput, setPersonaChatInput] = useState('');
  const [personaChatMessages, setPersonaChatMessages] = useState<Array<{ id: string; role: 'user' | 'assistant'; text: string }>>([]);
  const [selectedPdfFiles, setSelectedPdfFiles] = useState<File[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const PERSONA_LIST_PAGE_SIZE = 10;
  const [personaListPage, setPersonaListPage] = useState(1);
  const personaCardTagClass = 'px-2 py-1 bg-surface-hover text-gray-300 text-xs rounded';
  const uploadRef = useRef<HTMLInputElement>(null);
  const tagPoolCloseTimerRef = useRef<number | null>(null);

  type PersonaProvenance = 'first' | 'third' | 'deep_interview';
  type Persona = {
    id: string;
    name: string;
    tags: string[];
    score: number;
    conf: number;
    category: string;
    subCategory: string;
    cdpTags: string[];
    voc: string;
    radar: number[];
    provenance: PersonaProvenance;
  };

  const provenanceLabel: Record<PersonaProvenance, string> = {
    first: '一方',
    third: '三方',
    deep_interview: '深度访谈',
  };

  const provenanceBadgeClass: Record<PersonaProvenance, string> = {
    first: 'bg-primary/15 text-primary border-primary/30',
    third: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    deep_interview: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  };

  const getVocKeywords = (voc: string, limit = 6) => {
    const text = (voc ?? '')
      .replace(/[“”"']/g, '')
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
  };

  const getPersonaAlias = (p: Persona) => {
    const normalize = (text: string) =>
      text
        .trim()
        .replace(/[^\u4e00-\u9fa5A-Za-z0-9]/g, '')
        .replace(/者$/g, '')
        .slice(0, 5);

    const tag1 = normalize(p.tags?.[0] || '');
    const tag2 = normalize(p.tags?.[1] || '');
    const cdp1 = normalize(p.cdpTags?.[0] || '');

    // 无符号、最多5字：优先采用更有区分度的单一核心特征
    if (tag1) return tag1;
    if (tag2) return tag2;
    if (cdp1) return cdp1;
    return '典型画像';
  };

  const radarDimensionDetails: Array<{ title: string; desc: string }> = [
    { title: '人口与成长轨迹', desc: '年龄/教育/城市与成长经历等背景要素如何塑造价值观与选择偏好。' },
    { title: '心理动因', desc: '购买/使用背后的核心动机与触发点（安全感、效率、身份表达、家庭责任等）。' },
    { title: '心理特征维度', desc: '风险偏好、控制感、理性/感性程度、对新事物的态度与决策风格。' },
    { title: '行为维度', desc: '信息搜集、比较决策、试驾/到店、分享/推荐等可观测行为模式。' },
    { title: '需求与痛点维度', desc: '明确诉求与真实痛点：空间/续航/充电/智能/舒适/成本等。' },
    { title: '技术接受度维度', desc: '对智能化、自动驾驶、互联服务的学习意愿、信任边界与付费意愿。' },
    { title: '社会关系维度', desc: '家庭/同伴/社群影响与口碑扩散路径，谁会影响其最终决定。' },
  ];

  const [allPersonas, setAllPersonas] = useState<Persona[]>(() => ([
    // 身份与基础属性 (8个)
    { id: 'p-1', name: '陈思远', tags: ['科技极客', '高净值'], score: 8.5, conf: 92, category: '身份与基础属性', subCategory: '职业类型', cdpTags: ['一线城市精英', '智能驾驶偏好', '高净值资产持有'], voc: '我希望车辆能在复杂城市路况下主动避险，而不是只做被动提醒。', radar: [78, 90, 84, 72, 88, 95, 66] },
    { id: 'p-2', name: '王建国', tags: ['企业高管', '成熟稳重'], score: 9.1, conf: 95, category: '身份与基础属性', subCategory: '职业类型', cdpTags: ['企业决策者', '商务出行', '品牌忠诚'], voc: '车辆是我的移动办公室，需要兼顾商务形象和实用性。', radar: [85, 88, 82, 78, 90, 75, 88] },
    { id: 'p-3', name: '李雅婷', tags: ['自由职业', '创意工作者'], score: 8.3, conf: 89, category: '身份与基础属性', subCategory: '职业类型', cdpTags: ['设计师', '个性化需求', '审美敏感'], voc: '我需要一辆能体现我个性和审美的车，不想和别人一样。', radar: [72, 85, 90, 88, 75, 82, 78] },
    { id: 'p-4', name: '赵明轩', tags: ['年轻白领', '职场新人'], score: 7.8, conf: 85, category: '身份与基础属性', subCategory: '年龄段', cdpTags: ['25-30岁', '首次购车', '预算敏感'], voc: '这是我的第一辆车，希望性价比高，同时不失面子。', radar: [68, 75, 78, 82, 70, 88, 72] },
    { id: 'p-5', name: '周慧敏', tags: ['中年女性', '家庭主妇'], score: 8.6, conf: 91, category: '身份与基础属性', subCategory: '年龄段', cdpTags: ['35-45岁', '家庭用车', '安全第一'], voc: '接送孩子是日常，车辆安全性和空间是我最关心的。', radar: [90, 78, 75, 70, 95, 68, 85] },
    { id: 'p-6', name: '孙德华', tags: ['退休人员', '银发族'], score: 7.5, conf: 82, category: '身份与基础属性', subCategory: '年龄段', cdpTags: ['60岁以上', '休闲出行', '舒适优先'], voc: '退休后想开车到处走走，舒适性和易操作性很重要。', radar: [75, 70, 68, 65, 88, 60, 80] },
    { id: 'p-7', name: '吴俊杰', tags: ['高收入', '投资人'], score: 9.5, conf: 97, category: '身份与基础属性', subCategory: '收入水平', cdpTags: ['年收入100万+', '豪华车主', '品质追求'], voc: '我对车的要求很高，品牌、性能、服务都要顶级。', radar: [92, 95, 88, 85, 90, 82, 95] },
    { id: 'p-8', name: '郑小雨', tags: ['硕士学历', '研究员'], score: 8.4, conf: 90, category: '身份与基础属性', subCategory: '教育背景', cdpTags: ['高学历', '理性决策', '技术关注'], voc: '我会详细研究车辆的技术参数和测试数据再做决定。', radar: [80, 88, 85, 90, 82, 92, 75] },

    // 社会与人口统计 (7个)
    { id: 'p-9', name: '林沐然', tags: ['精致生活家', '社交型'], score: 9.4, conf: 96, category: '社会与人口统计', subCategory: '生活方式', cdpTags: ['家庭用户', '高频社交出行', '品质生活偏好'], voc: '内饰质感和静谧性对我很关键，车是我生活方式的一部分。', radar: [82, 86, 88, 75, 92, 80, 85] },
    { id: 'p-10', name: '马晓东', tags: ['一线城市', '北京居民'], score: 8.8, conf: 93, category: '社会与人口统计', subCategory: '城市等级', cdpTags: ['限号城市', '新能源优先', '充电便利'], voc: '在北京开车，新能源车不限号是刚需。', radar: [78, 82, 80, 88, 85, 90, 76] },
    { id: 'p-11', name: '陈佳怡', tags: ['新一线', '成都居民'], score: 8.2, conf: 88, category: '社会与人口统计', subCategory: '城市等级', cdpTags: ['休闲城市', '周末自驾', '生活节奏慢'], voc: '成都生活节奏慢，周末喜欢开车去周边玩。', radar: [75, 78, 85, 82, 80, 75, 88] },
    { id: 'p-12', name: '刘建平', tags: ['已婚有子', '三口之家'], score: 8.7, conf: 92, category: '社会与人口统计', subCategory: '家庭结构', cdpTags: ['核心家庭', '亲子出行', '空间需求'], voc: '有了孩子后，车内空间和安全配置成了首要考虑。', radar: [88, 80, 75, 72, 95, 70, 90] },
    { id: 'p-13', name: '张薇', tags: ['单身贵族', '独立女性'], score: 8.0, conf: 86, category: '社会与人口统计', subCategory: '婚姻状况', cdpTags: ['单身', '个人出行', '颜值控'], voc: '我一个人开，车要好看、好开、好停。', radar: [70, 85, 92, 85, 75, 80, 72] },
    { id: 'p-14', name: '黄志强', tags: ['二胎家庭', '五口之家'], score: 9.0, conf: 94, category: '社会与人口统计', subCategory: '子女情况', cdpTags: ['多子女', '大空间需求', '安全至上'], voc: '两个孩子加上老人，必须要7座或者超大空间。', radar: [92, 78, 70, 68, 98, 65, 95] },
    { id: 'p-15', name: '许文静', tags: ['运动爱好者', '健身达人'], score: 8.5, conf: 90, category: '社会与人口统计', subCategory: '生活方式', cdpTags: ['户外运动', '装备运输', '动力需求'], voc: '周末要带滑雪板、自行车等装备，需要大后备箱和动力。', radar: [80, 88, 82, 90, 85, 78, 82] },

    // 购车决策与潜客行为 (8个)
    { id: 'p-16', name: '张逸豪', tags: ['都市先锋', 'Z世代'], score: 9.8, conf: 98, category: '购车决策与潜客行为', subCategory: '信息渠道', cdpTags: ['数字原生', '内容平台高活跃', '尝鲜驱动'], voc: '我会先看真实测评和用户内容，品牌叙事如果不真实很难打动我。', radar: [74, 94, 86, 91, 84, 97, 78] },
    { id: 'p-17', name: '王思琪', tags: ['冲动型', '感性决策'], score: 7.6, conf: 83, category: '购车决策与潜客行为', subCategory: '购车动机', cdpTags: ['颜值驱动', '快速决策', '情感购买'], voc: '看到喜欢的车就想买，不会纠结太久。', radar: [68, 92, 88, 75, 70, 72, 85] },
    { id: 'p-18', name: '李国强', tags: ['理性型', '长周期'], score: 8.9, conf: 94, category: '购车决策与潜客行为', subCategory: '决策周期', cdpTags: ['深度研究', '多方对比', '谨慎决策'], voc: '我会花3-6个月时间研究各种车型，对比性能和价格。', radar: [85, 75, 78, 95, 88, 90, 80] },
    { id: 'p-19', name: '赵敏', tags: ['试驾控', '体验优先'], score: 8.4, conf: 89, category: '购车决策与潜客行为', subCategory: '试驾偏好', cdpTags: ['必须试驾', '实际体验', '感受驱动'], voc: '不试驾绝对不买，要亲自感受驾驶感和舒适度。', radar: [78, 82, 85, 88, 80, 75, 82] },
    { id: 'p-20', name: '孙浩然', tags: ['价格敏感', '预算有限'], score: 7.2, conf: 80, category: '购车决策与潜客行为', subCategory: '价格敏感度', cdpTags: ['性价比', '优惠关注', '预算控制'], voc: '预算有限，会等促销活动，能省一点是一点。', radar: [65, 70, 75, 78, 68, 82, 70] },
    { id: 'p-21', name: '周雨萱', tags: ['社交媒体', '小红书用户'], score: 8.6, conf: 91, category: '购车决策与潜客行为', subCategory: '信息渠道', cdpTags: ['社交平台', '用户口碑', 'KOL影响'], voc: '我会在小红书和抖音上看车主的真实分享。', radar: [72, 88, 90, 85, 78, 95, 80] },
    { id: 'p-22', name: '胡建华', tags: ['传统渠道', '4S店'], score: 7.8, conf: 85, category: '购车决策与潜客行为', subCategory: '信息渠道', cdpTags: ['线下看车', '销售咨询', '传统购买'], voc: '我还是习惯去4S店看实车，和销售面对面聊。', radar: [80, 72, 68, 75, 85, 65, 88] },
    { id: 'p-23', name: '邓丽君', tags: ['品牌驱动', '忠诚用户'], score: 9.2, conf: 96, category: '购车决策与潜客行为', subCategory: '购车动机', cdpTags: ['品牌信仰', '复购用户', '推荐意愿强'], voc: '我家三代人都开沃尔沃，信任这个品牌。', radar: [90, 85, 80, 75, 92, 78, 98] },

    // 车辆使用与售后服务 (7个)
    { id: 'p-24', name: '苏婉清', tags: ['户外探索者', '家庭型'], score: 8.9, conf: 94, category: '车辆使用与售后服务', subCategory: '用车场景', cdpTags: ['亲子家庭', '长途自驾偏好', '安全诉求强'], voc: '周末带孩子出行时，我更关心安全冗余和空间灵活性。', radar: [88, 82, 80, 76, 93, 74, 89] },
    { id: 'p-25', name: '陈浩', tags: ['通勤为主', '城市代步'], score: 7.9, conf: 87, category: '车辆使用与售后服务', subCategory: '用车场景', cdpTags: ['日常通勤', '短途出行', '经济性'], voc: '主要是上下班代步，偶尔周末出去玩。', radar: [75, 78, 80, 85, 82, 88, 75] },
    { id: 'p-26', name: '林峰', tags: ['高里程', '商务出行'], score: 8.7, conf: 92, category: '车辆使用与售后服务', subCategory: '里程需求', cdpTags: ['年行驶3万+', '长途频繁', '耐用性'], voc: '经常跑长途，一年要开3万多公里，车要耐用。', radar: [85, 80, 75, 78, 90, 82, 88] },
    { id: 'p-27', name: '吴梅', tags: ['低里程', '周末车主'], score: 7.4, conf: 82, category: '车辆使用与售后服务', subCategory: '里程需求', cdpTags: ['年行驶1万以内', '偶尔使用', '保值关注'], voc: '平时坐地铁，只有周末才开车，一年开不了多少。', radar: [70, 75, 82, 72, 78, 70, 75] },
    { id: 'p-28', name: '杨志伟', tags: ['保养达人', '细致维护'], score: 8.8, conf: 93, category: '车辆使用与售后服务', subCategory: '保养频率', cdpTags: ['定期保养', '原厂配件', '服务要求高'], voc: '我会严格按照保养手册来，只用原厂配件和服务。', radar: [88, 82, 78, 75, 90, 80, 92] },
    { id: 'p-29', name: '钱小芳', tags: ['服务敏感', '体验优先'], score: 8.5, conf: 90, category: '车辆使用与售后服务', subCategory: '服务期望', cdpTags: ['服务体验', '响应速度', '专业度'], voc: '售后服务的态度和效率对我很重要，出问题要快速解决。', radar: [80, 85, 88, 82, 88, 78, 90] },
    { id: 'p-30', name: '冯建国', tags: ['品牌忠诚', '复购客户'], score: 9.3, conf: 97, category: '车辆使用与售后服务', subCategory: '品牌忠诚度', cdpTags: ['多次购买', '品牌认同', '推荐他人'], voc: '这是我第三辆沃尔沃了，已经推荐给好几个朋友。', radar: [92, 88, 85, 80, 95, 82, 98] },

    // 数字触点与线上行为 (5个)
    { id: 'p-31', name: '谢晓彤', tags: ['抖音达人', '短视频'], score: 8.3, conf: 89, category: '数字触点与线上行为', subCategory: '社交平台', cdpTags: ['抖音重度用户', '视频内容', '互动活跃'], voc: '我每天刷抖音，看到有趣的汽车内容就会点赞评论。', radar: [70, 85, 88, 90, 75, 95, 78] },
    { id: 'p-32', name: '罗文斌', tags: ['微信生态', '私域用户'], score: 8.1, conf: 87, category: '数字触点与线上行为', subCategory: '社交平台', cdpTags: ['微信用户', '公众号关注', '社群活跃'], voc: '我主要通过微信公众号和车友群了解信息。', radar: [78, 80, 82, 85, 80, 88, 85] },
    { id: 'p-33', name: '蒋雨欣', tags: ['内容消费者', '深度阅读'], score: 8.6, conf: 91, category: '数字触点与线上行为', subCategory: '内容偏好', cdpTags: ['长文阅读', '专业测评', '数据分析'], voc: '我喜欢看专业的长篇测评文章，不喜欢碎片化信息。', radar: [82, 88, 85, 92, 80, 90, 78] },
    { id: 'p-34', name: '韩磊', tags: ['低频互动', '潜水用户'], score: 7.3, conf: 81, category: '数字触点与线上行为', subCategory: '互动频率', cdpTags: ['被动接收', '很少评论', '观望为主'], voc: '我一般只看不说，很少主动评论或互动。', radar: [68, 72, 78, 75, 70, 75, 72] },
    { id: 'p-35', name: '袁梦', tags: ['数字原住民', '全平台'], score: 9.0, conf: 95, category: '数字触点与线上行为', subCategory: '数字素养', cdpTags: ['多平台活跃', '技术敏感', '在线购物'], voc: '我在各个平台都很活跃，习惯在线上完成所有事情。', radar: [75, 90, 92, 95, 78, 98, 80] },

    // 品牌认知与情感连接 (5个)
    { id: 'p-36', name: '曾志伟', tags: ['品牌认知高', '安全信仰'], score: 9.4, conf: 97, category: '品牌认知与情感连接', subCategory: '品牌认知', cdpTags: ['安全标签', '北欧品质', '品牌认同'], voc: '提到沃尔沃就想到安全，这是我选择它的核心原因。', radar: [90, 88, 85, 80, 95, 82, 98] },
    { id: 'p-37', name: '梁静茹', tags: ['情感共鸣', '价值观匹配'], score: 8.8, conf: 93, category: '品牌认知与情感连接', subCategory: '情感倾向', cdpTags: ['环保理念', '可持续', '人文关怀'], voc: '沃尔沃的环保理念和我的价值观很契合。', radar: [85, 90, 88, 82, 88, 85, 95] },
    { id: 'p-38', name: '彭于晏', tags: ['价值观一致', '理念认同'], score: 9.1, conf: 96, category: '品牌认知与情感连接', subCategory: '价值观匹配', cdpTags: ['北欧文化', '简约设计', '品质生活'], voc: '喜欢北欧的简约和品质感，这和我的生活态度一致。', radar: [88, 92, 90, 85, 90, 88, 95] },
    { id: 'p-39', name: '舒淇', tags: ['推荐意愿强', 'KOC'], score: 9.2, conf: 96, category: '品牌认知与情感连接', subCategory: '推荐意愿', cdpTags: ['主动推荐', '口碑传播', '影响他人'], voc: '我会主动向朋友推荐沃尔沃，已经成功安利了3个人。', radar: [85, 88, 90, 88, 92, 90, 98] },
    { id: 'p-40', name: '古天乐', tags: ['社群活跃', '车友会'], score: 8.7, conf: 92, category: '品牌认知与情感连接', subCategory: '社群参与', cdpTags: ['车友会成员', '活动参与', '社群贡献'], voc: '我经常参加车友会活动，和其他车主交流用车心得。', radar: [82, 85, 88, 90, 85, 88, 95] },
  ] as Array<Omit<Persona, 'provenance'>>).map((p, idx) => ({
    ...p,
    provenance: idx % 2 === 0 ? 'first' : 'deep_interview',
  })));

  const allFields = filterSchema.flatMap((group) => group.fields);
  const allFieldMap = new Map(allFields.map((f) => [f.key, f]));
  const hashString = (s: string) => s.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const pickByHash = (options: string[], seed: string) => options[hashString(seed) % options.length];
  const deriveTagValue = (p: Persona, field: TagField) => pickByHash(field.options, `${p.id}-${p.name}-${field.key}`);
  const selectedTagCount =
    (Object.values(selectedTagValues) as string[][]).reduce((count, values) => count + values.length, 0) +
    selectedProvenance.length;
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

  const getPersonaDisplayTags = (p: Persona) => {
    const text = `${p.category} ${p.subCategory} ${p.tags.join(' ')} ${p.cdpTags.join(' ')} ${p.voc}`.toLowerCase();
    const richness = getRadarTotal(p.radar) / radarTotalMax;
    const targetCount = Math.max(3, Math.min(5, 3 + Math.round(richness * 2)));
    const scored = allFields.map((field) => {
      const keywords = personaTagKeywordMap[field.key] ?? [];
      const keywordHits = keywords.reduce((acc, kw) => acc + (text.includes(kw.toLowerCase()) ? 1 : 0), 0);
      const semanticHint =
        (text.includes(field.label.toLowerCase()) ? 1 : 0) +
        field.options.reduce((acc, opt) => acc + (text.includes(opt.toLowerCase()) ? 1 : 0), 0);
      const hashBoost = (hashString(`${p.id}-${field.key}`) % 17) / 100;
      return {
        field,
        value: deriveTagValue(p, field),
        score: keywordHits * 3 + semanticHint * 1.5 + hashBoost,
      };
    });
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, targetCount)
      .map((item) => `${item.field.label}：${item.value}`);
  };

  const filteredPersonas = useMemo(() => {
    let result = allPersonas;

    if (selectedProvenance.length > 0) {
      result = result.filter((p) => selectedProvenance.includes(p.provenance));
    }

    const selectedEntries = (Object.entries(selectedTagValues) as Array<[string, string[]]>)
      .filter(([, values]) => values.length > 0);
    if (selectedEntries.length > 0) {
      result = result.filter((p) =>
        selectedEntries.every(([key, values]) => {
          const field = allFieldMap.get(key);
          if (!field) return true;
          return values.includes(deriveTagValue(p, field));
        }),
      );
    }

    return result;
  }, [allPersonas, selectedProvenance, selectedTagValues]);

  const personaListTotalPages = Math.max(1, Math.ceil(filteredPersonas.length / PERSONA_LIST_PAGE_SIZE));
  const safePersonaListPage = Math.min(Math.max(1, personaListPage), personaListTotalPages);

  const pagedPersonas = useMemo(() => {
    const start = (safePersonaListPage - 1) * PERSONA_LIST_PAGE_SIZE;
    return filteredPersonas.slice(start, start + PERSONA_LIST_PAGE_SIZE);
  }, [filteredPersonas, safePersonaListPage]);

  useEffect(() => {
    setPersonaListPage(1);
  }, [selectedTagValues, selectedProvenance, allPersonas.length]);

  useEffect(() => {
    const c = Math.min(Math.max(1, personaListPage), personaListTotalPages);
    if (c !== personaListPage) setPersonaListPage(c);
  }, [personaListPage, personaListTotalPages]);

  const selectedPersona = useMemo(
    () => allPersonas.find((p) => p.id === selectedPersonaId) ?? null,
    [allPersonas, selectedPersonaId],
  );

  useEffect(() => {
    onSubPageChange?.(selectedPersonaId !== null);
  }, [onSubPageChange, selectedPersonaId]);

  const onPickPdfFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const maxSizeMB = 20;
    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    const valid: File[] = [];
    for (let i = 0; i < files.length; i += 1) {
      const file = files[i];
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      if (!isPdf) {
        window.alert('请上传 PDF 文件');
        continue;
      }
      if (file.size > maxSizeBytes) {
        window.alert(`文件大小超过 ${maxSizeMB} MB 限制：${file.name}`);
        continue;
      }
      valid.push(file);
    }

    if (valid.length === 0) return;
    setSelectedPdfFiles((prev) => [...prev, ...valid]);
  };

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

  const extractPdfText = async (file: File) => {
    const buffer = await file.arrayBuffer();
    const task = pdfjsLib.getDocument({ data: buffer });
    const pdf = await task.promise;
    const maxPages = Math.min(pdf.numPages, 3);
    const chunks: string[] = [];
    for (let pageNum = 1; pageNum <= maxPages; pageNum += 1) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();
      const text = content.items
        .map((item: any) => ('str' in item ? item.str : ''))
        .join(' ')
        .trim();
      if (text) chunks.push(text);
    }
    return chunks.join(' ').slice(0, 1200);
  };

  const handleCreatePersona = async () => {
    if (selectedPdfFiles.length === 0) {
      window.alert('请先上传 PDF 文件');
      return;
    }

    setIsParsing(true);
    try {
      const createdBatch = [];
      for (let idx = 0; idx < selectedPdfFiles.length; idx += 1) {
        const file = selectedPdfFiles[idx];
        const text = await extractPdfText(file);
        const snippet = text ? text.slice(0, 200) : '已解析文档基础信息';

        const created = {
          id: `p-${Date.now()}-${idx}`,
          name: file.name.replace(/\.pdf$/i, '').slice(0, 20) || '新建人设',
          tags: ['PDF解析', '新建'],
          score: 8.6,
          conf: 90,
          category: '数字触点与线上行为',
          subCategory: '内容偏好',
          cdpTags: ['PDF解析生成', '待补充画像', '自动识别'],
          voc: `基于上传文档自动生成的人设。文档摘要：${snippet}...`,
          radar: [75, 78, 72, 70, 80, 76, 73],
          provenance: 'first' as const,
        };

        createdBatch.push(created);
      }

      setAllPersonas((prev) => [...createdBatch, ...prev]);
      setIsCreateModalOpen(false);
      setSelectedPdfFiles([]);
      setIsParsing(false);
    } catch (error) {
      console.error('PDF 解析失败:', error);
      window.alert('PDF 解析失败，请重试');
      setIsParsing(false);
    }
  };

  if (selectedPersona) {
    const vocKeywords = getVocKeywords(selectedPersona.voc, 8);
    const personaDisplayTags = getPersonaDisplayTags(selectedPersona);

    if (isPersonaChatOpen) {
      const handleSendPersonaChat = () => {
        const q = personaChatInput.trim();
        if (!q) return;
        setPersonaChatMessages((prev) => [
          ...prev,
          { id: `u-${Date.now()}`, role: 'user', text: q },
          {
            id: `a-${Date.now() + 1}`,
            role: 'assistant',
            text: `基于「${getPersonaAlias(selectedPersona)}」的人设信息，我建议从这几个角度回答你的问题：\n1) 画像特征：${selectedPersona.tags.join('、')}\n2) 关键标签：${personaDisplayTags.slice(0, 3).join('、')}\n3) 典型声音：${selectedPersona.voc}\n\n如果你愿意，我可以继续把这个问题拆成可执行策略。`,
          },
        ]);
        setPersonaChatInput('');
      };

      return (
        <div className="p-10 max-w-7xl mx-auto min-h-screen">
          <button
            onClick={() => setIsPersonaChatOpen(false)}
            className="mb-6 px-4 py-2 bg-surface hover:bg-surface-hover rounded text-sm flex items-center gap-2 text-white"
          >
            <ArrowLeft size={16} />
            返回人设详情
          </button>
          <div className="bg-surface rounded-xl p-6 border border-white/10 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                <Bot className="text-black" size={18} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">与 {getPersonaAlias(selectedPersona)} 对话</h2>
                <p className="text-xs text-gray-400">一对一人设智能对话</p>
              </div>
            </div>
          </div>

          <div className="bg-surface rounded-xl border border-white/10 p-6 h-[68vh] flex flex-col">
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              {personaChatMessages.length === 0 && (
                <div className="text-sm text-gray-400 bg-surface-hover rounded-lg p-4">
                  你可以直接提问，例如：这个人设的购车决策风险点是什么？
                </div>
              )}
              {personaChatMessages.map((m) => (
                <div key={m.id} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                  <div
                    className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap ${
                      m.role === 'user'
                        ? 'bg-primary text-black'
                        : 'bg-surface-hover text-gray-200 border border-white/10'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <input
                value={personaChatInput}
                onChange={(e) => setPersonaChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendPersonaChat();
                }}
                className="flex-1 bg-surface-hover border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary"
                placeholder="继续提问..."
              />
              <button
                onClick={handleSendPersonaChat}
                className="px-4 py-2 bg-primary text-black rounded-lg font-bold text-sm hover:bg-primary/90 flex items-center gap-2"
              >
                <Send size={14} />
                发送
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="p-10 max-w-7xl mx-auto min-h-screen">
        <button
          onClick={() => {
            setSelectedPersonaId(null);
            setIsPersonaChatOpen(false);
            setPersonaChatMessages([]);
            setPersonaChatInput('');
          }}
          className="mb-6 px-4 py-2 bg-surface hover:bg-surface-hover rounded text-sm flex items-center gap-2 text-white"
        >
          <ArrowLeft size={16} />
          返回人设列表
        </button>
        <div className="bg-surface rounded-xl p-8 mb-6">
          <h1 className="text-3xl font-extrabold text-white mb-2">{getPersonaAlias(selectedPersona)} - 人设详情</h1>
          <div className="mt-2">
            <span
              className={`persona-source-pill inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-bold ${
                selectedPersona.provenance === 'first' ? 'persona-source-pill-first' : ''
              } ${provenanceBadgeClass[selectedPersona.provenance]}`}
            >
              信源：{provenanceLabel[selectedPersona.provenance]}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 bg-surface rounded-xl p-6 space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-bold text-white">人设标签：</p>
              <div className="flex flex-wrap gap-2">
                {personaDisplayTags.length > 0 ? (
                  personaDisplayTags.map((tag) => (
                    <span key={tag} className="persona-neutral-pill px-3 py-1 rounded border border-primary/40 bg-primary/15 text-xs text-primary">
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
                    <span key={kw} className="persona-neutral-pill px-2.5 py-1 rounded border border-primary/40 bg-primary/15 text-xs text-primary">
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
              <button
                onClick={() => setIsPersonaChatOpen(true)}
                className="rounded-lg bg-primary px-3 py-2 text-lg font-bold text-black hover:bg-primary/90 shrink-0"
              >
                完善人设
              </button>
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
              <PersonaRadarChart radar={selectedPersona.radar} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-10 max-w-7xl mx-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-4xl font-extrabold text-white mb-2">人设库管理</h1>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-primary text-black font-bold px-6 py-3 rounded flex items-center gap-2 hover:bg-primary/90 transition-colors"
        >
          <Plus size={20} />
          新增人设
        </button>
      </div>

      <div className="grid grid-cols-12 gap-6 mb-8">
        <div className="col-span-12 bg-surface p-4 rounded-xl overflow-visible">
          <div className="mb-3">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <div className="text-sm font-bold text-gray-100">
                当前命中人设：<span className="text-primary text-base font-extrabold tabular-nums">{filteredPersonas.length}</span>
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
                if (!field || values.length === 0) return [];
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
                        active
                          ? 'text-primary font-semibold'
                          : 'text-gray-300 hover:text-white'
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
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-6">
          {safePersonaListPage === 1 && (
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="flex h-[174px] w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/10 text-gray-500 transition-colors hover:border-white/30 hover:text-white"
            >
              <Plus size={32} className="mb-2" />
              <span className="text-sm font-bold">创建新的人设</span>
            </button>
          )}
          {pagedPersonas.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelectedPersonaId(p.id)}
              className="bg-surface p-6 rounded-xl relative group text-left hover:bg-surface-hover transition-colors h-[174px] flex flex-col"
            >
              <div className="absolute top-6 right-6">
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[11px] font-bold ${
                    p.provenance === 'first' ? 'persona-source-pill-first' : ''
                  } ${provenanceBadgeClass[p.provenance]}`}
                >
                  {provenanceLabel[p.provenance]}
                </span>
              </div>
              <h3 className="pr-16 text-2xl font-bold text-white mb-2">{getPersonaAlias(p)}</h3>
              <div className="mb-6 flex flex-wrap gap-2">
                {p.tags.slice(0, 2).map((tag, idx) => (
                  <span key={`${p.id}-tag-${idx}`} className={personaCardTagClass}>
                    {tag}
                  </span>
                ))}
              </div>

              <div className="mt-auto">
                <div className="mb-1 flex justify-between text-xs text-gray-400">
                  <span>七维合计</span>
                  <span className="text-lg font-bold text-white">
                    {getRadarTotal(p.radar)} <span className="text-xs font-normal text-gray-500">/ {radarTotalMax}</span>
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-surface-hover">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${(getRadarTotal(p.radar) / radarTotalMax) * 100}%` }}
                  ></div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {personaListTotalPages > 1 && (
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              disabled={safePersonaListPage <= 1}
              onClick={() => setPersonaListPage((prev) => Math.max(1, prev - 1))}
              className="rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold text-gray-200 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
            >
              上一页
            </button>
            <span className="min-w-[7.5rem] text-center text-sm tabular-nums text-gray-400">
              第 <span className="font-bold text-white">{safePersonaListPage}</span> / {personaListTotalPages} 页
            </span>
            <button
              type="button"
              disabled={safePersonaListPage >= personaListTotalPages}
              onClick={() => setPersonaListPage((prev) => Math.min(personaListTotalPages, prev + 1))}
              className="rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold text-gray-200 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
            >
              下一页
            </button>
          </div>
        )}
      </div>

      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="新增人设">
        <div className="space-y-4">
          <input
            ref={uploadRef}
            type="file"
            multiple
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={(e) => onPickPdfFiles(e.target.files)}
          />

          <div
            onClick={() => uploadRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              onPickPdfFiles(e.dataTransfer.files);
            }}
            className="border-2 border-dashed border-white/20 rounded-xl p-12 flex flex-col items-center justify-center hover:border-primary/50 transition-colors cursor-pointer"
          >
            <FileUp className="text-primary mb-4" size={40} />
            <p className="text-white font-bold mb-2">点击或拖拽 PDF 至此</p>
            <p className="text-gray-500 text-xs mb-1">系统将自动解析 PDF 内容生成人设</p>
              <p className="text-gray-500 text-xs">支持批量上传PDF，最大20MB/个</p>
            {selectedPdfFiles.length > 0 && (
              <div className="text-xs text-primary mt-3 w-full">
                <p>已选择：{selectedPdfFiles.length} 个 PDF</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedPdfFiles.slice(0, 3).map((f) => (
                    <span key={`${f.name}-${f.size}`} className="px-2 py-1 bg-surface-hover text-gray-300 rounded">
                      {f.name}
                    </span>
                  ))}
                  {selectedPdfFiles.length > 3 && (
                    <span className="px-2 py-1 bg-surface-hover text-gray-300 rounded">+{selectedPdfFiles.length - 3} 更多</span>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="bg-surface-hover rounded-lg p-4">
            <p className="text-xs text-gray-400 leading-relaxed">
              <span className="text-primary font-bold">提示：</span>
              上传的 PDF 可以是用户访谈记录、调研报告、客户画像文档等。系统会自动提取关键信息，生成结构化的人设模型。
            </p>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              onClick={() => {
                setIsCreateModalOpen(false);
                setSelectedPdfFiles([]);
              }}
              className="px-6 py-2 rounded-lg text-sm font-bold text-gray-400 hover:text-white transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleCreatePersona}
              disabled={selectedPdfFiles.length === 0 || isParsing}
              className="px-6 py-2 rounded-lg text-sm font-bold bg-primary text-black hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isParsing ? '解析中...' : '生成人设'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
