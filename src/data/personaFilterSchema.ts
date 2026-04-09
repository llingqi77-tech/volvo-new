export type PersonaTagField = { key: string; label: string; options: string[] };

export type PersonaFilterSchemaGroup = { category: string; fields: PersonaTagField[] };

/** 与人设库列表页一致的 7 类 CDP 标签维度（一级分类 + 字段选项池） */
export const filterSchema: PersonaFilterSchemaGroup[] = [
  {
    category: '身份信息',
    fields: [
      { key: 'gender', label: '性别', options: ['男', '女'] },
      { key: 'age', label: '年龄', options: ['18–25', '26–35', '36–45', '46–60'] },
      { key: 'maritalStatus', label: '婚姻状况', options: ['未婚', '已婚', '离异'] },
      { key: 'province', label: '省份', options: ['北京', '上海', '广东', '浙江', '四川'] },
      { key: 'familySize', label: '家庭人数', options: ['1', '2', '3', '4', '5+'] },
      { key: 'familyStructure', label: '家庭结构', options: ['未婚', '已婚无孩', '已婚1孩', '已婚多孩'] },
    ],
  },
  {
    category: '用户属性',
    fields: [
      { key: 'education', label: '学历', options: ['本科及以上', '本科以下'] },
      { key: 'industry', label: '行业', options: ['白领（互联网/金融）', '体制内', '自由职业', '制造业', '其他'] },
      { key: 'occupation', label: '职业', options: ['企业职员', '管理层', '自由职业', '公务员', '学生'] },
      { key: 'annualIncome', label: '年收入', options: ['10万以下', '10–30万', '30–50万', '50万以上'] },
      { key: 'familyMonthlyIncome', label: '家庭月收入', options: ['1万以下', '1–3万', '3–5万', '5–10万', '10万以上'] },
      { key: 'customerType', label: '客户类型', options: ['个人', '企业'] },
    ],
  },
  {
    category: '生命周期',
    fields: [
      { key: 'salesType', label: '售卖类型', options: ['新车', '二手车'] },
      { key: 'purchaseType', label: '购买类型', options: ['首购', '增购', '置换'] },
      { key: 'latestOrderStatus', label: '最近订单状态', options: ['未下单', '已下单', '已交车', '已取消'] },
    ],
  },
  {
    category: '车辆资产',
    fields: [
      { key: 'isVolvoOwner', label: '是否Volvo车主', options: ['是', '否'] },
      { key: 'model', label: '车型', options: ['XC40', 'XC60', 'XC90', 'S60', 'S90'] },
      { key: 'powerType', label: '动力类别', options: ['燃油', '混动', '纯电'] },
      { key: 'vehicleAge', label: '购车车龄', options: ['<3年', '3–5年', '5–8年', '8年以上'] },
      { key: 'salesMode', label: '销售模式', options: ['直售', '经销商'] },
    ],
  },
  {
    category: '行为标签',
    fields: [
      { key: 'multiStoreVisit', label: '是否多次到店', options: ['是', '否'] },
      { key: 'latestTestDriveModel', label: '最近试驾车型', options: ['XC40', 'XC60', 'XC90', 'S60', 'S90'] },
      { key: 'latestTestDriveTime', label: '最近试驾时间', options: ['最近7天', '最近30天', '30天以上'] },
      { key: 'modelInterest', label: '车型兴趣强度', options: ['高（多次浏览/试驾）', '中', '低'] },
      { key: 'latestInterestedModel', label: '最近感兴趣车型', options: ['XC40', 'XC60', 'XC90', 'S60', 'S90'] },
    ],
  },
  {
    category: '偏好标签',
    fields: [
      { key: 'lifestyleTag', label: '生活方式标签', options: ['运动', '旅行', '家庭导向', '科技爱好', '美食'] },
      { key: 'bodyTypePreference', label: '车型偏好', options: ['SUV', '轿车'] },
      { key: 'purchaseFocus', label: '购车关注点', options: ['外观', '空间', '安全', '智能化', '性价比', '品牌'] },
    ],
  },
  {
    category: '购车决策',
    fields: [
      { key: 'budget', label: '购车预算', options: ['20万以下', '20–30万', '30–40万', '40–50万', '50万以上'] },
      { key: 'priceSensitivity', label: '价格敏感度', options: ['高', '中', '低'] },
      { key: 'brandSensitivity', label: '品牌敏感度', options: ['高', '中', '低'] },
      { key: 'performanceFocus', label: '性能关注度', options: ['高', '中', '低'] },
      { key: 'purchaseUsage', label: '购车用途', options: ['通勤', '家庭', '商务', '长途'] },
      { key: 'actualDriver', label: '实际驾驶人', options: ['自己', '家庭成员', '公司'] },
      { key: 'competitorBrand', label: '竞争品牌', options: ['宝马', '奔驰', '奥迪', '新势力'] },
      { key: 'competitorModel', label: '竞品车型', options: ['宝马X3', '奔驰GLC', '奥迪Q5'] },
      { key: 'ownedBrand', label: '保有品牌', options: ['沃尔沃', '宝马', '奔驰', '奥迪', '无车'] },
    ],
  },
];
