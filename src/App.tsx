/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import KnowledgeBase from './pages/KnowledgeBase';
import PersonaLibrary from './pages/PersonaLibrary';
import ChatMode from './pages/ChatMode';
import FormalResearch from './pages/FormalResearch';
import ProfileCenter from './pages/ProfileCenter';
import TaskCenter from './pages/TaskCenter';

export type KnowledgeDoc = {
  id: string;
  title: string;
  type: string;
  tags: string[];
  uploader: string;
  color: string;
  category: '洞察报告库' | '整车知识库' | '行业知识库';
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
    { id: 'doc-1', title: '2024年全球纯电SUV市场趋势深度调研', type: 'PDF • 14.2 MB • 2023-11-24', tags: ['电动化', 'SUV'], uploader: '王安德', color: 'text-primary', category: '洞察报告库' },
    { id: 'doc-2', title: 'Volvo EX90 智驾系统硬件拆解报告', type: 'PDF • 45.8 MB • 2023-11-20', tags: ['EX90', '智驾硬件'], uploader: '林索菲', color: 'text-blue-400', category: '整车知识库' },
    { id: 'doc-3', title: '欧洲固态电池产业链投资机遇分析', type: 'PDF • 8.1 MB • 2023-11-15', tags: ['固态电池', '欧洲市场'], uploader: '徐莱纳斯', color: 'text-gray-400', category: '行业知识库' },
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
  const handleArchiveToKnowledge = (task: ResearchTask) => {
    const existing = docs.some((doc) => doc.title === task.title);
    if (existing) return;
    const now = new Date().toISOString().slice(0, 10);
    setDocs((prev) => [
      {
        id: `doc-archive-${Date.now()}`,
        title: task.title,
        type: `PDF • 归档报告 • ${now}`,
        tags: ['已归档', '研究报告'],
        uploader: '当前用户',
        color: 'text-primary',
        category: '洞察报告库',
      },
      ...prev,
    ]);
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
        <Topbar
          onOpenProfile={() => setActiveModule('profile-info')}
          onOpenProject={() => setActiveModule('profile-research')}
          onLogout={handleLogout}
        />
        <main className="flex-1 overflow-y-auto">
          {activeModule === 'knowledge' && <KnowledgeBase docs={docs} setDocs={setDocs} />}
          {activeModule === 'persona' && <PersonaLibrary />}
          {activeModule === 'chat' && <ChatMode />}
          {activeModule === 'research' && <FormalResearch isSidebarCollapsed={isSidebarCollapsed} />}
          {activeModule === 'tasks' && <TaskCenter tasks={tasks} setTasks={setTasks} onArchiveToKnowledge={handleArchiveToKnowledge} />}
          {(activeModule === 'profile-info' || activeModule === 'profile-research') && (
            <ProfileCenter section={activeModule === 'profile-research' ? 'research' : 'info'} />
          )}
        </main>
      </div>
    </div>
  );
}
