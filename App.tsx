
import React, { useState } from 'react';
import { BookOpen, Cpu, Layers, GitMerge, Menu, ArrowRightLeft } from 'lucide-react';
import Intro from './chapters/Intro';
import TaskLifecycle from './chapters/TaskLifecycle';
import Queues from './chapters/Queues';
import Scheduler from './chapters/Scheduler';
import ContextSwitching from './chapters/ContextSwitching';
import AIChat from './components/AIChat';
import { ChapterId } from './types';

function App() {
  const [activeChapter, setActiveChapter] = useState<ChapterId>(ChapterId.INTRO);
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const chapters = [
    { id: ChapterId.INTRO, title: '课程简介', icon: BookOpen, component: Intro },
    { id: ChapterId.TASKS, title: '任务管理', icon: Cpu, component: TaskLifecycle },
    { id: ChapterId.CONTEXT, title: '上下文切换 (PendSV)', icon: ArrowRightLeft, component: ContextSwitching },
    { id: ChapterId.SCHEDULER, title: '任务调度器', icon: Layers, component: Scheduler },
    { id: ChapterId.QUEUES, title: '队列与通信', icon: GitMerge, component: Queues },
  ];

  const ActiveComponent = chapters.find(c => c.id === activeChapter)?.component || Intro;
  const activeTitle = chapters.find(c => c.id === activeChapter)?.title || 'Introduction';

  // These chapters use the new 3-pane dashboard layout and need full screen space
  const isFullPage = [
    ChapterId.TASKS, 
    ChapterId.CONTEXT, 
    ChapterId.QUEUES, 
    ChapterId.SCHEDULER
  ].includes(activeChapter);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col md:flex-row overflow-hidden">
      
      {/* Mobile Header */}
      <div className="md:hidden p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/80 backdrop-blur z-50 sticky top-0">
        <span className="font-bold text-sky-400 flex items-center gap-2">
          <Cpu size={20} /> FreeRTOS.master
        </span>
        <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="text-white">
          <Menu />
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed md:relative inset-y-0 left-0 w-72 bg-slate-900 border-r border-slate-800 transform transition-transform duration-300 z-40
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-6 border-b border-slate-800 hidden md:block">
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-indigo-500">
            FreeRTOS.master
          </h1>
          <p className="text-xs text-slate-500 mt-1">交互式学习平台</p>
        </div>
        
        <nav className="p-4 space-y-2">
          {chapters.map((chapter) => (
            <button
              key={chapter.id}
              onClick={() => {
                setActiveChapter(chapter.id);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200
                ${activeChapter === chapter.id 
                  ? 'bg-sky-600/10 text-sky-400 border border-sky-600/20 shadow-[0_0_15px_rgba(56,189,248,0.1)]' 
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                }`}
            >
              <chapter.icon size={18} />
              {chapter.title}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800 bg-slate-900">
           <div className="text-xs text-slate-500 text-center">
             基于 v10.5.1 版本
           </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={`flex-1 ${isFullPage ? 'overflow-hidden' : 'overflow-y-auto'} h-[calc(100vh-65px)] md:h-screen bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950`}>
        <div className={isFullPage ? "w-full h-full" : "max-w-6xl mx-auto p-6 md:p-12 pb-32"}>
          <ActiveComponent />
        </div>
      </main>

      {/* AI Tutor Integration */}
      <AIChat currentChapterTitle={activeTitle} />
      
    </div>
  );
}

export default App;
