export type TagField = { key: string; label: string; options: string[] };

export type FilterGroup = { category: string; fields: TagField[] };

export const filterSchema: FilterGroup[] = [
  {
    category: '社会背景',
    fields: [
      { key: 'gender', label: '性别', options: ['男', '女'] },
      { key: 'ageBandOneId', label: '年龄段_OneId', options: ['18-24岁', '25-35岁', '36-45岁', '46岁以上'] },
      { key: 'education', label: '学历', options: ['高中及以下', '大专', '本科', '硕士及以上'] },
      { key: 'industry', label: '行业', options: ['互联网', '制造业', '金融', '教育', '医疗'] },
      { key: 'enterpriseType', label: '企业性质', options: ['国企', '外企', '民企', '事业单位'] },
      { key: 'province', label: '省份', options: ['北京', '上海', '广东', '浙江', '江苏'] },
      { key: 'occupation', label: '职业', options: ['工程师', '教师', '医生', '销售', '管理者'] },
    ],
  },
  {
    category: '家庭结构',
    fields: [
      { key: 'familyStructure', label: '家庭结构', options: ['核心家庭', '三代同堂', '单身独居'] },
      { key: 'familySize', label: '家庭人数', options: ['1人', '2人', '3人', '4人及以上'] },
      { key: 'maritalStatus', label: '婚姻状况', options: ['未婚', '已婚', '离异', '丧偶'] },
    ],
  },
  {
    category: '用车需求',
    fields: [
      { key: 'modelType', label: '车型', options: ['SUV', '轿车', 'MPV', '跑车'] },
      { key: 'purchaseUsage', label: '购车用途', options: ['通勤', '家庭出行', '商务接待', '长途自驾'] },
      { key: 'budget', label: '购车预算', options: ['10-20万', '20-30万', '30-50万', '50万以上'] },
      { key: 'purchaseType', label: '购买类型', options: ['首购', '增购', '置换'] },
    ],
  },
  {
    category: '决策心理',
    fields: [
      { key: 'hobbies', label: '兴趣爱好', options: ['户外运动', '科技数码', '汽车改装', '亲子活动'] },
      { key: 'concerns', label: '顾虑点', options: ['电池安全', '品牌可靠性', '价格', '续航焦虑'] },
    ],
  },
  {
    category: '行为动态',
    fields: [
      { key: 'competitorSeries', label: '竞品车系', options: ['理想L8', '问界M7', '特斯拉Model Y'] },
      { key: 'top2InterestedModels30d', label: '近30天感兴趣车型偏好Top2', options: ['车型A', '车型B'] },
      { key: 'latestTestDriveTime', label: '最近一次完成试驾时间', options: ['近7天', '近30天', '30天以上'] },
      { key: 'multiStoreVisit', label: '是否多次到店', options: ['是', '否'] },
    ],
  },
];
