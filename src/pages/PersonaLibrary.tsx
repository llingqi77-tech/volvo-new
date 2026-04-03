import { useMemo, useRef, useState } from 'react';
import { Plus, ArrowLeft, FileUp } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import Modal from '../components/Modal';
import * as pdfjsLib from 'pdfjs-dist';

// 配置 PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

export default function PersonaLibrary() {
  // 支持多选的状态管理
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSubTags, setSelectedSubTags] = useState<string[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(null);
  const [selectedPdfFile, setSelectedPdfFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const uploadRef = useRef<HTMLInputElement>(null);

  const tags = ['全部', '身份与基础属性', '社会与人口统计', '购车决策与潜客行为', '车辆使用与售后服务', '数字触点与线上行为', '品牌认知与情感连接'];

  // 二级标签定义
  const subTags: Record<string, string[]> = {
    '身份与基础属性': ['年龄段', '职业类型', '收入水平', '教育背景', '家庭结构'],
    '社会与人口统计': ['城市等级', '居住区域', '婚姻状况', '子女情况', '生活方式'],
    '购车决策与潜客行为': ['购车动机', '决策周期', '信息渠道', '试驾偏好', '价格敏感度'],
    '车辆使用与售后服务': ['用车场景', '里程需求', '保养频率', '服务期望', '品牌忠诚度'],
    '数字触点与线上行为': ['社交平台', '内容偏好', '互动频率', '设备使用', '数字素养'],
    '品牌认知与情感连接': ['品牌认知', '情感倾向', '价值观匹配', '推荐意愿', '社群参与']
  };

  const [allPersonas, setAllPersonas] = useState([
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
  ]);

  const filteredPersonas = useMemo(() => {
    let result = allPersonas;

    // 如果选择了一级分类，进行筛选
    if (selectedCategories.length > 0) {
      result = result.filter(p => selectedCategories.includes(p.category));
    }

    // 如果选择了二级标签，进行筛选
    if (selectedSubTags.length > 0) {
      result = result.filter(p => selectedSubTags.includes(p.subCategory));
    }

    return result;
  }, [allPersonas, selectedCategories, selectedSubTags]);

  const selectedPersona = useMemo(
    () => allPersonas.find((p) => p.id === selectedPersonaId) ?? null,
    [allPersonas, selectedPersonaId],
  );
  const radarLabels = ['人口与成长轨迹', '心理动因', '心理特征维度', '行为维度', '需求与痛点维度', '技术接受度维度', '社会关系维度'];
  const radarData = selectedPersona
    ? radarLabels.map((label, idx) => ({ subject: label, value: selectedPersona.radar[idx], fullMark: 100 }))
    : [];

  const selectedDimensions = useMemo(() => {
    return selectedCategories.length + selectedSubTags.length;
  }, [selectedCategories, selectedSubTags]);

  const dimensionDistribution = useMemo(() => {
    return tags.slice(1).map((category) => {
      const count = filteredPersonas.filter(p => p.category === category).length;
      const shortName = category.replace(/与/g, '').slice(0, 4);
      return {
        subject: shortName,
        count: count,
        fullName: category,
        fullMark: Math.max(...tags.slice(1).map(cat =>
          filteredPersonas.filter(p => p.category === cat).length
        ), 10)
      };
    });
  }, [filteredPersonas, tags]);

  const onPickPdf = (file: File | null) => {
    if (!file) return;
    if (file.type !== 'application/pdf') {
      window.alert('请上传 PDF 文件');
      return;
    }
    const maxSizeMB = 20;
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      window.alert(`文件大小超过 ${maxSizeMB} MB 限制，请选择更小的文件`);
      return;
    }
    setSelectedPdfFile(file);
  };

  // 处理一级分类点击
  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  // 处理二级标签点击
  const toggleSubTag = (category: string, subTag: string) => {
    // 确保对应的一级分类也被选中
    if (!selectedCategories.includes(category)) {
      setSelectedCategories(prev => [...prev, category]);
    }

    setSelectedSubTags(prev =>
      prev.includes(subTag)
        ? prev.filter(t => t !== subTag)
        : [...prev, subTag]
    );
  };

  // 重置所有筛选
  const resetFilters = () => {
    setSelectedCategories([]);
    setSelectedSubTags([]);
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
    if (!selectedPdfFile) {
      window.alert('请先上传 PDF 文件');
      return;
    }

    setIsParsing(true);
    try {
      // 解析 PDF
      const text = await extractPdfText(selectedPdfFile);
      const snippet = text ? text.slice(0, 200) : '已解析文档基础信息';

      // 生成人设
      const created = {
        id: `p-${Date.now()}`,
        name: selectedPdfFile.name.replace(/\.pdf$/i, '').slice(0, 20) || '新建人设',
        tags: ['PDF解析', '新建'],
        score: 8.6,
        conf: 90,
        category: '数字触点与线上行为',
        subCategory: '内容偏好',
        cdpTags: ['PDF解析生成', '待补充画像', '自动识别'],
        voc: `基于上传文档自动生成的人设。文档摘要：${snippet}...`,
        radar: [75, 78, 72, 70, 80, 76, 73],
      };

      setAllPersonas((prev) => [created, ...prev]);
      setIsCreateModalOpen(false);
      setSelectedPdfFile(null);
      setIsParsing(false);
    } catch (error) {
      console.error('PDF 解析失败:', error);
      window.alert('PDF 解析失败，请重试');
      setIsParsing(false);
    }
  };

  if (selectedPersona) {
    return (
      <div className="p-10 max-w-7xl mx-auto min-h-screen">
        <button
          onClick={() => setSelectedPersonaId(null)}
          className="mb-6 px-4 py-2 bg-surface hover:bg-surface-hover rounded text-sm flex items-center gap-2 text-white"
        >
          <ArrowLeft size={16} />
          返回人设列表
        </button>
        <div className="bg-surface rounded-xl p-8 mb-6">
          <h1 className="text-3xl font-extrabold text-white mb-2">{selectedPersona.name} - 人设详情</h1>
          <p className="text-sm text-gray-400">{selectedPersona.category}</p>
        </div>
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-4 bg-surface rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">CDP 标签</h3>
            <div className="flex flex-wrap gap-2">
              {selectedPersona.cdpTags.map((tag) => (
                <span key={tag} className="px-3 py-1 bg-surface-hover rounded text-xs text-primary">{tag}</span>
              ))}
            </div>
          </div>
          <div className="col-span-8 bg-surface rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">VOC 原始文本</h3>
            <div className="p-4 bg-surface-hover border-l-2 border-primary text-sm text-gray-300 leading-relaxed">
              "{selectedPersona.voc}"
            </div>
          </div>
          <div className="col-span-12 bg-surface rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">七维评分雷达图</h3>
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
          上传 PDF 生成人设
        </button>
      </div>

      {/* 左右布局：左侧筛选，右侧统计 */}
      <div className="grid grid-cols-12 gap-6 mb-8">
        {/* 左侧：标签筛选 */}
        <div className="col-span-5 bg-surface p-6 rounded-xl">
          <p className="text-white text-lg font-bold mb-6">标签筛选</p>

          {/* 身份与基础属性 */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-bold text-sm">身份与基础属性</h3>
              <span className="text-gray-500 text-xs">38</span>
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              {['年龄段', '职业类型', '收入水平', '教育背景', '家庭结构'].map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleSubTag('身份与基础属性', tag)}
                  className={`px-3 py-1.5 text-xs rounded transition-colors ${
                    selectedSubTags.includes(tag)
                      ? 'bg-primary text-black'
                      : 'bg-surface-hover text-gray-300 hover:bg-[#353534]'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* 社会与人口统计 */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-bold text-sm">社会与人口统计</h3>
              <span className="text-gray-500 text-xs">35</span>
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              {['城市等级', '居住区域', '婚姻状况', '子女情况', '生活方式'].map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleSubTag('社会与人口统计', tag)}
                  className={`px-3 py-1.5 text-xs rounded transition-colors ${
                    selectedSubTags.includes(tag)
                      ? 'bg-primary text-black'
                      : 'bg-surface-hover text-gray-300 hover:bg-[#353534]'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* 购车决策与潜客行为 */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-bold text-sm">购车决策与潜客行为</h3>
              <span className="text-gray-500 text-xs">30</span>
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              {['购车动机', '决策周期', '信息渠道', '试驾偏好', '价格敏感度'].map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleSubTag('购车决策与潜客行为', tag)}
                  className={`px-3 py-1.5 text-xs rounded transition-colors ${
                    selectedSubTags.includes(tag)
                      ? 'bg-primary text-black'
                      : 'bg-surface-hover text-gray-300 hover:bg-[#353534]'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* 车辆使用与售后服务 */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-bold text-sm">车辆使用与售后服务</h3>
              <span className="text-gray-500 text-xs">22</span>
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              {['用车场景', '里程需求', '保养频率', '服务期望', '品牌忠诚度'].map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleSubTag('车辆使用与售后服务', tag)}
                  className={`px-3 py-1.5 text-xs rounded transition-colors ${
                    selectedSubTags.includes(tag)
                      ? 'bg-primary text-black'
                      : 'bg-surface-hover text-gray-300 hover:bg-[#353534]'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* 数字触点与线上行为 */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-bold text-sm">数字触点与线上行为</h3>
              <span className="text-gray-500 text-xs">18</span>
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              {['社交平台', '内容偏好', '互动频率', '设备使用', '数字素养'].map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleSubTag('数字触点与线上行为', tag)}
                  className={`px-3 py-1.5 text-xs rounded transition-colors ${
                    selectedSubTags.includes(tag)
                      ? 'bg-primary text-black'
                      : 'bg-surface-hover text-gray-300 hover:bg-[#353534]'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* 品牌认知与情感连接 */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-bold text-sm">品牌认知与情感连接</h3>
              <span className="text-gray-500 text-xs">12</span>
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              {['品牌认知', '情感倾向', '价值观匹配', '推荐意愿', '社群参与'].map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleSubTag('品牌认知与情感连接', tag)}
                  className={`px-3 py-1.5 text-xs rounded transition-colors ${
                    selectedSubTags.includes(tag)
                      ? 'bg-primary text-black'
                      : 'bg-surface-hover text-gray-300 hover:bg-[#353534]'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* 全部按钮 */}
          <button
            onClick={resetFilters}
            className={`w-full px-4 py-2.5 text-sm font-bold rounded transition-colors ${
              selectedCategories.length === 0 && selectedSubTags.length === 0
                ? 'bg-primary text-black'
                : 'bg-surface-hover text-gray-300 hover:bg-[#353534]'
            }`}
          >
            全部
          </button>
        </div>

        {/* 右侧：统计信息 */}
        <div className="col-span-7 bg-surface rounded-xl p-6">
          {/* 顶部统计卡片 */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-gray-400 text-sm mb-2">人设总数</p>
              <div className="flex items-baseline gap-2">
                <h2 className="text-5xl font-extrabold text-white">{filteredPersonas.length}</h2>
                <span className="text-gray-500 text-sm">已筛选</span>
              </div>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-2">已选维度</p>
              <div className="flex items-baseline gap-2">
                <h2 className="text-5xl font-extrabold text-white">{selectedDimensions}</h2>
                <div className="text-gray-500 text-sm max-w-[200px] truncate">
                  {selectedCategories.length > 0 && selectedCategories.join(', ')}
                  {selectedSubTags.length > 0 && `, ${selectedSubTags.join(', ')}`}
                  {selectedDimensions === 0 && '未选择'}
                </div>
              </div>
            </div>
          </div>

          {/* 各维度人设分布雷达图 */}
          <div>
            <p className="text-gray-400 text-sm mb-4">各维度人设分布</p>
            <div className="h-[420px] min-h-[320px] min-w-0 relative">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={320}>
                <RadarChart data={dimensionDistribution}>
                  <PolarGrid stroke="#3b3b3b" />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                  />
                  <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                  <Radar
                    name="人设数量"
                    dataKey="count"
                    stroke="#63fe33"
                    fill="#63fe33"
                    fillOpacity={0.3}
                    label={({ cx, cy, x, y, value }) => {
                      // 在雷达图的每个顶点显示数量
                      const offsetX = x > cx ? 15 : -15;
                      const offsetY = y > cy ? 15 : -15;
                      return (
                        <text
                          x={x + offsetX}
                          y={y + offsetY}
                          fill="#63fe33"
                          fontSize={14}
                          fontWeight="bold"
                          textAnchor={x > cx ? 'start' : 'end'}
                        >
                          {value}
                        </text>
                      );
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {filteredPersonas.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelectedPersonaId(p.id)}
            className="bg-surface p-6 rounded-xl relative group text-left hover:bg-surface-hover transition-colors"
          >
            <h3 className="text-2xl font-bold text-white mb-3">{p.name}</h3>
            <div className="flex gap-2 mb-8">
              <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded">{p.tags[0]}</span>
              <span className="px-2 py-1 bg-surface-hover text-gray-300 text-xs rounded">{p.tags[1]}</span>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>综合评分</span>
                  <span className="text-white font-bold text-lg">{p.score} <span className="text-gray-500 text-xs font-normal">/ 10</span></span>
                </div>
                <div className="h-1.5 bg-surface-hover rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${p.score * 10}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>置信度</span>
                  <span className="text-white font-bold text-lg">{p.conf}%</span>
                </div>
                <div className="h-1.5 bg-surface-hover rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${p.conf}%` }}></div>
                </div>
              </div>
            </div>
          </button>
        ))}
        
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-transparent border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center text-gray-500 hover:text-white hover:border-white/30 transition-colors min-h-[280px]"
        >
          <Plus size={32} className="mb-2" />
          <span className="text-sm font-bold">创建新的人设</span>
        </button>
      </div>

      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="上传 PDF 生成人设">
        <div className="space-y-4">
          <input
            ref={uploadRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={(e) => onPickPdf(e.target.files?.[0] ?? null)}
          />

          <div
            onClick={() => uploadRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              onPickPdf(e.dataTransfer.files?.[0] ?? null);
            }}
            className="border-2 border-dashed border-white/20 rounded-xl p-12 flex flex-col items-center justify-center hover:border-primary/50 transition-colors cursor-pointer"
          >
            <FileUp className="text-primary mb-4" size={40} />
            <p className="text-white font-bold mb-2">点击或拖拽 PDF 至此</p>
            <p className="text-gray-500 text-xs mb-1">系统将自动解析 PDF 内容生成人设</p>
            <p className="text-gray-500 text-xs">支持 PDF 格式，最大 20MB</p>
            {selectedPdfFile && (
              <p className="text-xs text-primary mt-3">已选择：{selectedPdfFile.name}</p>
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
                setSelectedPdfFile(null);
              }}
              className="px-6 py-2 rounded-lg text-sm font-bold text-gray-400 hover:text-white transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleCreatePersona}
              disabled={!selectedPdfFile || isParsing}
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
