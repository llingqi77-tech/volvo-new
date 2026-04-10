/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import KnowledgeBase from './pages/KnowledgeBase';
import PersonaLibrary from './pages/PersonaLibrary';
import ProfileCenter from './pages/ProfileCenter';
import ResearchProjects from './pages/ResearchProjects';

export type KnowledgeDoc = {
  id: string;
  title: string;
  type: string;
  tags: string[];
  uploader: string;
  color: string;
  category: '洞察报告库' | '整车知识库' | '行业知识库';
  summary?: string;
  uploadDate?: string;
  fileSize?: string;
};

export type TaskStatus = 'all' | 'reviewed' | 'archived';
export type ResearchTask = {
  id: string;
  title: string;
  updatedAt: string;
  status: TaskStatus;
};

export default function App() {
  const [activeModule, setActiveModule] = useState('knowledge');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [docs, setDocs] = useState<KnowledgeDoc[]>([
    // 洞察报告库 (14个)
    { id: 'doc-1', title: '2024年全球纯电SUV市场趋势深度调研', type: 'PDF • 14.2 MB • 2024-11-24', tags: ['电动化', 'SUV'], uploader: '王安德', color: 'text-primary', category: '洞察报告库', summary: '本报告深入分析了2024年全球纯电SUV市场的发展趋势，涵盖市场规模、消费者偏好、技术创新和竞争格局。研究发现，中国和欧洲市场增长最快，智能化和续航能力成为核心竞争力。', uploadDate: '2024-11-24', fileSize: '14.2 MB' },
    { id: 'doc-2', title: '年轻消费者新能源车购买决策研究', type: 'PDF • 8.5 MB • 2024-11-20', tags: ['消费者洞察', '年轻人'], uploader: '李雅婷', color: 'text-primary', category: '洞察报告库', summary: '针对18-35岁年轻消费群体的深度访谈研究，揭示了年轻人在购买新能源车时的核心关注点、决策路径和痛点。智能化体验、品牌价值观和社交属性是关键影响因素。', uploadDate: '2024-11-20', fileSize: '8.5 MB' },
    { id: 'doc-4', title: '北欧市场电动车消费趋势报告', type: 'PDF • 9.7 MB • 2024-11-15', tags: ['北欧市场', '趋势'], uploader: '林索菲', color: 'text-primary', category: '洞察报告库', summary: '北欧作为电动车渗透率最高的地区，消费者对可持续性、环保材料和能源效率有极高要求。报告分析了瑞典、挪威、丹麦三国的市场特点和消费偏好。', uploadDate: '2024-11-15', fileSize: '9.7 MB' },
    { id: 'doc-5', title: '智能座舱用户体验评测报告', type: 'PDF • 15.8 MB • 2024-11-12', tags: ['智能座舱', 'UX'], uploader: '张逸豪', color: 'text-primary', category: '洞察报告库', summary: '对市场主流智能座舱系统进行了全面评测，从交互设计、语音助手、车机性能、生态整合四个维度进行对比分析。用户最看重的是响应速度和操作逻辑的简洁性。', uploadDate: '2024-11-12', fileSize: '15.8 MB' },
    { id: 'doc-6', title: '女性用户购车决策影响因素研究', type: 'PDF • 7.2 MB • 2024-11-10', tags: ['女性用户', '决策'], uploader: '周慧敏', color: 'text-primary', category: '洞察报告库', summary: '女性消费者在购车决策中展现出独特的关注点：安全性、颜值设计、易用性和售后服务质量。研究发现女性更倾向于口碑推荐和真实用户评价。', uploadDate: '2024-11-10', fileSize: '7.2 MB' },
    { id: 'doc-7', title: '一线城市充电焦虑调研报告', type: 'PDF • 10.4 MB • 2024-11-08', tags: ['充电', '焦虑'], uploader: '马晓东', color: 'text-primary', category: '洞察报告库', summary: '通过对北上广深1000+电动车主的调研，发现充电焦虑主要来自充电桩分布不均、充电时间过长和冬季续航衰减。快充网络和家充桩是缓解焦虑的关键。', uploadDate: '2024-11-08', fileSize: '10.4 MB' },
    { id: 'doc-8', title: '家庭用户多场景用车需求分析', type: 'PDF • 11.6 MB • 2024-11-05', tags: ['家庭用户', '场景'], uploader: '刘建平', color: 'text-primary', category: '洞察报告库', summary: '家庭用户的用车场景多样化：通勤、接送孩子、周末出游、长途自驾。空间灵活性、安全配置和舒适性是核心需求，第三排座椅和大后备箱是加分项。', uploadDate: '2024-11-05', fileSize: '11.6 MB' },
    { id: 'doc-9', title: '新能源车品牌认知度调研', type: 'PDF • 6.8 MB • 2024-11-02', tags: ['品牌', '认知度'], uploader: '赵敏', color: 'text-primary', category: '洞察报告库', summary: '对比了10个主流新能源车品牌的认知度和品牌形象。特斯拉、比亚迪、蔚来位列前三，沃尔沃在安全性和品质感方面具有独特优势。', uploadDate: '2024-11-02', fileSize: '6.8 MB' },
    { id: 'doc-10', title: '二手电动车市场洞察报告', type: 'PDF • 9.1 MB • 2024-10-30', tags: ['二手车', '市场'], uploader: '孙浩然', color: 'text-primary', category: '洞察报告库', summary: '二手电动车市场正在快速发展，但保值率和电池健康度是消费者最大顾虑。品牌认证二手车和电池质保政策能有效提升消费者信心。', uploadDate: '2024-10-30', fileSize: '9.1 MB' },
    { id: 'doc-11', title: '智能驾驶接受度与信任度研究', type: 'PDF • 13.2 MB • 2024-10-28', tags: ['智能驾驶', '信任'], uploader: '胡建华', color: 'text-primary', category: '洞察报告库', summary: '消费者对智能驾驶的接受度逐年提升，但完全自动驾驶的信任度仍需建立。用户更倾向于辅助驾驶功能，安全性和可靠性是信任的基础。', uploadDate: '2024-10-28', fileSize: '13.2 MB' },
    { id: 'doc-12', title: '环保意识对购车决策的影响', type: 'PDF • 7.9 MB • 2024-10-25', tags: ['环保', 'ESG'], uploader: '许文静', color: 'text-primary', category: '洞察报告库', summary: '环保意识正在成为购车决策的重要因素，尤其在高学历和高收入群体中。可持续材料、碳中和生产和品牌ESG表现越来越受关注。', uploadDate: '2024-10-25', fileSize: '7.9 MB' },
    { id: 'doc-13', title: '社交媒体对购车决策的影响力分析', type: 'PDF • 8.6 MB • 2024-10-22', tags: ['社交媒体', 'KOL'], uploader: '周雨萱', color: 'text-primary', category: '洞察报告库', summary: '小红书、抖音等社交平台成为年轻人获取购车信息的主要渠道。真实车主分享和KOL测评的影响力超过传统广告，UGC内容更具说服力。', uploadDate: '2024-10-22', fileSize: '8.6 MB' },
    { id: 'doc-14', title: '长途出行场景用户痛点研究', type: 'PDF • 10.8 MB • 2024-10-20', tags: ['长途', '痛点'], uploader: '苏婉清', color: 'text-primary', category: '洞察报告库', summary: '长途出行是电动车用户的核心痛点场景。充电站分布、充电时间、续航焦虑和高速服务区体验是主要问题。快充网络和路线规划功能至关重要。', uploadDate: '2024-10-20', fileSize: '10.8 MB' },
    { id: 'doc-15', title: '售后服务满意度调研报告', type: 'PDF • 9.3 MB • 2024-10-18', tags: ['售后', '满意度'], uploader: '杨志伟', color: 'text-primary', category: '洞察报告库', summary: '售后服务质量直接影响品牌忠诚度和复购意愿。响应速度、服务态度、维修质量和透明定价是用户最关心的四个方面。', uploadDate: '2024-10-18', fileSize: '9.3 MB' },

    // 整车知识库 (15个)
    { id: 'doc-16', title: 'Volvo EX90 智驾系统硬件拆解报告', type: 'PDF • 45.8 MB • 2024-11-20', tags: ['EX90', '智驾硬件'], uploader: '林索菲', color: 'text-blue-400', category: '整车知识库', summary: 'EX90搭载了Luminar激光雷达、8个摄像头、5个毫米波雷达和16个超声波雷达，构成了360度全方位感知系统。算力平台采用NVIDIA Orin芯片，算力达254 TOPS。', uploadDate: '2024-11-20', fileSize: '45.8 MB' },
    { id: 'doc-17', title: 'EX30 电池系统技术解析', type: 'PDF • 28.4 MB • 2024-11-18', tags: ['EX30', '电池'], uploader: '陈浩', color: 'text-blue-400', category: '整车知识库', summary: 'EX30采用宁德时代磷酸铁锂电池，容量69kWh，CLTC续航530km。电池包采用CTP技术，体积利用率提升15%，支持150kW快充，30%-80%充电时间26分钟。', uploadDate: '2024-11-18', fileSize: '28.4 MB' },
    { id: 'doc-18', title: 'XC90 Recharge 混动系统详解', type: 'PDF • 32.6 MB • 2024-11-15', tags: ['XC90', '混动'], uploader: '王建国', color: 'text-blue-400', category: '整车知识库', summary: 'XC90 Recharge采用2.0T发动机+电机的插电混动系统，综合功率455马力，纯电续航71km。能量回收系统和智能能量管理策略优化了燃油经济性。', uploadDate: '2024-11-15', fileSize: '32.6 MB' },
    { id: 'doc-19', title: 'SPA2平台架构技术白皮书', type: 'PDF • 52.3 MB • 2024-11-12', tags: ['SPA2', '平台'], uploader: '徐莱纳斯', color: 'text-blue-400', category: '整车知识库', summary: 'SPA2是沃尔沃第二代可扩展平台架构，专为纯电和混动车型设计。采用模块化设计，支持多种轴距和车身形式，集成度更高，重量更轻。', uploadDate: '2024-11-12', fileSize: '52.3 MB' },
    { id: 'doc-20', title: '主动安全系统City Safety技术解析', type: 'PDF • 38.7 MB • 2024-11-10', tags: ['安全', 'City Safety'], uploader: '吴梅', color: 'text-blue-400', category: '整车知识库', summary: 'City Safety是沃尔沃的主动安全系统，能识别车辆、行人、自行车和大型动物。通过摄像头和雷达融合，实现自动紧急制动，有效降低碰撞风险。', uploadDate: '2024-11-10', fileSize: '38.7 MB' },
    { id: 'doc-21', title: '空气悬架系统工作原理', type: 'PDF • 24.5 MB • 2024-11-08', tags: ['悬架', '舒适性'], uploader: '林峰', color: 'text-blue-400', category: '整车知识库', summary: '空气悬架系统通过调节空气弹簧的气压，实现车身高度和悬架硬度的动态调节。提供舒适、运动、越野等多种模式，适应不同路况和驾驶需求。', uploadDate: '2024-11-08', fileSize: '24.5 MB' },
    { id: 'doc-22', title: '车载信息娱乐系统架构设计', type: 'PDF • 41.2 MB • 2024-11-05', tags: ['车机', '娱乐'], uploader: '谢晓彤', color: 'text-blue-400', category: '整车知识库', summary: '基于Android Automotive OS的车载系统，采用高通骁龙8155芯片。支持5G连接、OTA升级、语音助手和丰富的第三方应用生态。', uploadDate: '2024-11-05', fileSize: '41.2 MB' },
    { id: 'doc-23', title: '热管理系统优化方案', type: 'PDF • 29.8 MB • 2024-11-02', tags: ['热管理', '续航'], uploader: '钱小芳', color: 'text-blue-400', category: '整车知识库', summary: '电动车热管理系统对续航和电池寿命至关重要。采用热泵空调、电池预加热和智能温控策略，冬季续航损失降低20%。', uploadDate: '2024-11-02', fileSize: '29.8 MB' },
    { id: 'doc-24', title: '车身轻量化技术应用', type: 'PDF • 35.4 MB • 2024-10-30', tags: ['轻量化', '材料'], uploader: '冯建国', color: 'text-blue-400', category: '整车知识库', summary: '通过铝合金车身、高强度钢和复合材料的应用，车身重量降低15%。轻量化设计在保证安全性的同时，提升了续航和操控性能。', uploadDate: '2024-10-30', fileSize: '35.4 MB' },
    { id: 'doc-25', title: '智能泊车系统技术方案', type: 'PDF • 26.9 MB • 2024-10-28', tags: ['泊车', '智能'], uploader: '袁梦', color: 'text-blue-400', category: '整车知识库', summary: '智能泊车系统支持平行、垂直和斜向泊车，以及记忆泊车功能。通过超声波雷达和环视摄像头，实现厘米级精准控制。', uploadDate: '2024-10-28', fileSize: '26.9 MB' },
    { id: 'doc-26', title: '电机与电控系统技术详解', type: 'PDF • 42.1 MB • 2024-10-25', tags: ['电机', '电控'], uploader: '韩磊', color: 'text-blue-400', category: '整车知识库', summary: '永磁同步电机配合SiC功率模块，效率达到96%。电控系统实现精准的扭矩控制和能量回收，提升了动力性能和续航表现。', uploadDate: '2024-10-25', fileSize: '42.1 MB' },
    { id: 'doc-27', title: '车联网V2X通信技术', type: 'PDF • 31.7 MB • 2024-10-22', tags: ['V2X', '车联网'], uploader: '蒋雨欣', color: 'text-blue-400', category: '整车知识库', summary: 'V2X技术实现车与车、车与基础设施的通信。支持红绿灯信息、前方事故预警和协同式自适应巡航，提升行车安全和效率。', uploadDate: '2024-10-22', fileSize: '31.7 MB' },
    { id: 'doc-28', title: '座舱声学设计与NVH优化', type: 'PDF • 27.3 MB • 2024-10-20', tags: ['NVH', '声学'], uploader: '罗文斌', color: 'text-blue-400', category: '整车知识库', summary: '通过主动降噪、声学玻璃和密封优化，座舱静谧性达到豪华车水准。电动车特有的低频噪音通过主动声浪补偿技术得到有效控制。', uploadDate: '2024-10-20', fileSize: '27.3 MB' },
    { id: 'doc-29', title: '可持续材料应用报告', type: 'PDF • 19.6 MB • 2024-10-18', tags: ['可持续', '材料'], uploader: '梁静茹', color: 'text-blue-400', category: '整车知识库', summary: '内饰采用再生塑料、天然纤维和环保皮革等可持续材料。25%的塑料来自回收材料，地毯使用100%再生PET纤维，符合北欧环保理念。', uploadDate: '2024-10-18', fileSize: '19.6 MB' },
    { id: 'doc-30', title: '充电系统兼容性测试报告', type: 'PDF • 22.8 MB • 2024-10-15', tags: ['充电', '兼容性'], uploader: '曾志伟', color: 'text-blue-400', category: '整车知识库', summary: '对国内主流充电桩品牌进行兼容性测试，支持国标GB/T和欧标CCS充电协议。充电握手成功率99.5%，兼容性表现优秀。', uploadDate: '2024-10-15', fileSize: '22.8 MB' },

    // 行业知识库 (10个)
    { id: 'doc-31', title: '欧洲固态电池产业链投资机遇分析', type: 'PDF • 8.1 MB • 2024-11-15', tags: ['固态电池', '欧洲市场'], uploader: '徐莱纳斯', color: 'text-gray-400', category: '行业知识库', summary: '固态电池被视为下一代动力电池技术。欧洲在固态电池研发和产业化方面投入巨大，预计2028年实现量产。能量密度提升50%，安全性显著改善。', uploadDate: '2024-11-15', fileSize: '8.1 MB' },
    { id: 'doc-32', title: '全球新能源汽车政策对比研究', type: 'PDF • 12.4 MB • 2024-11-12', tags: ['政策', '全球'], uploader: '邓丽君', color: 'text-gray-400', category: '行业知识库', summary: '对比了中国、欧盟、美国、日本的新能源汽车政策。补贴退坡、碳排放法规和禁售燃油车时间表是各国政策的核心。欧盟2035年禁售燃油车政策最为激进。', uploadDate: '2024-11-12', fileSize: '12.4 MB' },
    { id: 'doc-33', title: '动力电池回收产业链分析', type: 'PDF • 9.7 MB • 2024-11-10', tags: ['电池回收', '循环经济'], uploader: '彭于晏', color: 'text-gray-400', category: '行业知识库', summary: '随着第一批电动车进入报废期，电池回收产业快速发展。梯次利用和材料回收是两大方向，锂、钴、镍等金属回收率达95%以上。', uploadDate: '2024-11-10', fileSize: '9.7 MB' },
    { id: 'doc-34', title: '自动驾驶法规与伦理问题研究', type: 'PDF • 11.2 MB • 2024-11-08', tags: ['自动驾驶', '法规'], uploader: '舒淇', color: 'text-gray-400', category: '行业知识库', summary: '自动驾驶的法律责任认定、数据隐私保护和伦理决策是行业面临的核心问题。各国正在制定相关法规，但标准尚未统一。', uploadDate: '2024-11-08', fileSize: '11.2 MB' },
    { id: 'doc-35', title: '充电基础设施建设现状与规划', type: 'PDF • 14.6 MB • 2024-11-05', tags: ['充电桩', '基建'], uploader: '古天乐', color: 'text-gray-400', category: '行业知识库', summary: '中国充电桩保有量超过500万个，但车桩比仍不均衡。超充网络和换电站是未来发展方向，高速公路充电网络是建设重点。', uploadDate: '2024-11-05', fileSize: '14.6 MB' },
    { id: 'doc-36', title: '新能源汽车供应链风险评估', type: 'PDF • 10.3 MB • 2024-11-02', tags: ['供应链', '风险'], uploader: '吴俊杰', color: 'text-gray-400', category: '行业知识库', summary: '芯片短缺、原材料价格波动和地缘政治是供应链的主要风险。企业通过多元化供应商、战略库存和垂直整合来降低风险。', uploadDate: '2024-11-02', fileSize: '10.3 MB' },
    { id: 'doc-37', title: '氢能源汽车技术路线分析', type: 'PDF • 13.8 MB • 2024-10-30', tags: ['氢能源', '技术'], uploader: '郑小雨', color: 'text-gray-400', category: '行业知识库', summary: '氢燃料电池汽车在商用车领域具有优势，但加氢站建设成本高、氢气制储运技术仍需突破。日本和韩国在氢能源汽车领域投入较大。', uploadDate: '2024-10-30', fileSize: '13.8 MB' },
    { id: 'doc-38', title: '智能网联汽车数据安全白皮书', type: 'PDF • 15.2 MB • 2024-10-28', tags: ['数据安全', '网联'], uploader: '黄志强', color: 'text-gray-400', category: '行业知识库', summary: '智能网联汽车产生大量敏感数据，包括位置信息、驾驶行为和车内音视频。数据分类分级、加密传输和本地化存储是安全防护的关键。', uploadDate: '2024-10-28', fileSize: '15.2 MB' },
    { id: 'doc-39', title: '新能源汽车保险定价模型研究', type: 'PDF • 8.9 MB • 2024-10-25', tags: ['保险', '定价'], uploader: '张薇', color: 'text-gray-400', category: '行业知识库', summary: '电动车维修成本高、零部件价格贵导致保险费率偏高。基于驾驶行为的UBI保险和针对电池的专项保险是创新方向。', uploadDate: '2024-10-25', fileSize: '8.9 MB' },
    { id: 'doc-40', title: '碳交易市场对汽车行业的影响', type: 'PDF • 11.5 MB • 2024-10-22', tags: ['碳交易', 'ESG'], uploader: '刘建平', color: 'text-gray-400', category: '行业知识库', summary: '碳交易市场将碳排放转化为经济成本，推动车企加速电动化转型。新能源汽车积分可交易，成为车企重要收入来源。', uploadDate: '2024-10-22', fileSize: '11.5 MB' },
  ]);
  const [tasks, setTasks] = useState<ResearchTask[]>([
    { id: 't1', title: '2024 纯电豪华 SUV 市场竞争力分析', updatedAt: '今天 10:24', status: 'all' },
    { id: 't2', title: '北欧用户智能座舱偏好研究', updatedAt: '昨天 18:32', status: 'all' },
    { id: 't3', title: '高净值人群购车决策路径洞察', updatedAt: '2天前 14:03', status: 'reviewed' },
    { id: 't4', title: '亚太市场 VOC 聚类分析', updatedAt: '5天前 09:21', status: 'archived' },
  ]);
  const handleLogout = () => {
    window.alert('已退出登录（演示）');
  };

  return (
    <div className="flex h-screen bg-background text-text-main font-sans overflow-hidden">
      <Sidebar
        activeModule={activeModule}
        setActiveModule={setActiveModule}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        onLogout={handleLogout}
      />
      <div className="flex-1 flex flex-col relative">
        <main className="flex-1 overflow-y-auto">
          {activeModule === 'knowledge' && <KnowledgeBase docs={docs} setDocs={setDocs} />}
          {activeModule === 'persona' && <PersonaLibrary />}
          {activeModule === 'insight-research' && <ResearchProjects entryMode="insight" />}
          {activeModule === 'profile-info' && <ProfileCenter section="info" />}
          {activeModule === 'profile-research' && <ResearchProjects entryMode="insight" />}
        </main>
      </div>
    </div>
  );
}
