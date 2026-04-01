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

export default function App() {
  const [activeModule, setActiveModule] = useState('knowledge');

  return (
    <div className="flex h-screen bg-background text-text-main font-sans overflow-hidden">
      <Sidebar activeModule={activeModule} setActiveModule={setActiveModule} />
      <div className="flex-1 flex flex-col relative">
        <Topbar />
        <main className="flex-1 overflow-y-auto">
          {activeModule === 'knowledge' && <KnowledgeBase />}
          {activeModule === 'persona' && <PersonaLibrary />}
          {activeModule === 'chat' && <ChatMode />}
          {activeModule === 'research' && <FormalResearch />}
        </main>
      </div>
    </div>
  );
}
