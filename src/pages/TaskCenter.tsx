import { Dispatch, SetStateAction, useMemo, useState } from 'react';
import type { ResearchTask } from '../App';

type TaskStatus = 'all' | 'reviewed' | 'archived';

export default function TaskCenter({
  tasks,
  setTasks,
  onArchiveToKnowledge,
}: {
  tasks: ResearchTask[];
  setTasks: Dispatch<SetStateAction<ResearchTask[]>>;
  onArchiveToKnowledge: (task: ResearchTask) => void;
}) {
  const [activeTab, setActiveTab] = useState<TaskStatus>('all');

  const tabLabel: Record<TaskStatus, string> = {
    all: '全部',
    reviewed: '已评审',
    archived: '已归档',
  };

  const visibleTasks = useMemo(
    () => tasks.filter((task) => task.status === activeTab),
    [tasks, activeTab],
  );

  const submitReview = (id: string) => {
    setTasks((prev) => prev.map((task) => (task.id === id ? { ...task, status: 'reviewed' } : task)));
    setActiveTab('reviewed');
  };

  const archiveTask = (id: string) => {
    let archivedTask: ResearchTask | null = null;
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id === id) {
          archivedTask = { ...task, status: 'archived' };
          return archivedTask;
        }
        return task;
      }),
    );
    if (archivedTask) onArchiveToKnowledge(archivedTask);
    setActiveTab('archived');
  };

  return (
    <div className="p-10 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold text-white mb-2">任务中心</h1>
        <p className="text-sm text-gray-400">查看个人研究任务并按流程提交评审、归档</p>
      </div>

      <div className="flex gap-2 bg-surface p-1 rounded-lg w-fit mb-6">
        {(['all', 'reviewed', 'archived'] as TaskStatus[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded text-sm font-bold transition-colors ${
              activeTab === tab ? 'bg-primary text-black' : 'text-gray-400 hover:text-white'
            }`}
          >
            {tabLabel[tab]}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {visibleTasks.length === 0 ? (
          <div className="bg-surface rounded-xl p-8 text-sm text-gray-500">当前分类暂无任务</div>
        ) : (
          visibleTasks.map((task) => (
            <div key={task.id} className="bg-surface rounded-xl p-6 border border-white/10">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">{task.title}</h3>
                  <p className="text-xs text-gray-500">最近更新：{task.updatedAt}</p>
                </div>
                <span className="text-xs px-2 py-1 rounded bg-surface-hover text-gray-300">{tabLabel[task.status]}</span>
              </div>

              {task.status === 'all' && (
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => submitReview(task.id)}
                    className="px-4 py-2 rounded text-sm font-bold bg-primary text-black hover:bg-primary/90"
                  >
                    提交评审
                  </button>
                  <button
                    onClick={() => window.alert('流程要求先提交评审，再执行归档。')}
                    className="px-4 py-2 rounded text-sm font-bold bg-surface-hover text-gray-400 hover:text-white"
                  >
                    归档
                  </button>
                </div>
              )}

              {task.status === 'reviewed' && (
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => archiveTask(task.id)}
                    className="px-4 py-2 rounded text-sm font-bold bg-primary text-black hover:bg-primary/90"
                  >
                    归档
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
