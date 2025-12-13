
import React, { useState } from 'react';
import { BookOpen, Cpu, Layers, GitMerge, Menu, ArrowRightLeft, ExternalLink } from 'lucide-react';
import Intro from './chapters/Intro';
import TaskLifecycle from './chapters/TaskLifecycle';
import Queues from './chapters/Queues';
import Scheduler from './chapters/Scheduler';
import ContextSwitching from './chapters/ContextSwitching';
import AIChat from './components/AIChat';
import { ChapterId } from './types';

function App() {
  const [activeChapter, setActiveChapter] = useState<ChapterId>(ChapterId.INTRO);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDesktopCollapsed, setDesktopCollapsed] = useState(false);

  const chapters = [
    { id: ChapterId.INTRO, title: '课程简介', icon: BookOpen, component: Intro },
    { id: ChapterId.TASKS, title: '任务管理', icon: Cpu, component: TaskLifecycle },
    { id: ChapterId.CONTEXT, title: '上下文切换', icon: ArrowRightLeft, component: ContextSwitching },
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
        <button onClick={() => setMobileMenuOpen(!isMobileMenuOpen)} className="text-white">
          <Menu />
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed md:relative inset-y-0 left-0 bg-slate-900 border-r border-slate-800 transform transition-all duration-300 z-40 flex flex-col
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        ${isDesktopCollapsed ? 'md:w-20' : 'md:w-72'}
        w-72
      `}>
        {/* Sidebar Header */}
        <div 
          onClick={() => setDesktopCollapsed(!isDesktopCollapsed)}
          className={`h-16 flex items-center border-b border-slate-800 shrink-0 cursor-pointer hover:bg-slate-800/50 transition-colors ${isDesktopCollapsed ? 'justify-center' : 'px-6'}`}
          title={isDesktopCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {!isDesktopCollapsed ? (
            <div className="overflow-hidden">
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-indigo-500 whitespace-nowrap">
                FreeRTOS
              </h1>
              <p className="text-[10px] text-slate-500 truncate">Interactive Masterclass</p>
            </div>
          ) : (
             <span className="font-bold text-sky-400 text-xl">OS</span>
          )}
        </div>
        
        {/* Navigation Items */}
        <nav className="p-3 space-y-2 mt-2 flex-1 overflow-y-auto custom-scrollbar">
          {chapters.map((chapter) => (
            <button
              key={chapter.id}
              onClick={() => {
                setActiveChapter(chapter.id);
                setMobileMenuOpen(false);
              }}
              title={isDesktopCollapsed ? chapter.title : ''}
              className={`w-full flex items-center ${isDesktopCollapsed ? 'justify-center px-0' : 'px-4'} py-3 rounded-lg text-sm font-medium transition-all duration-200 group
                ${activeChapter === chapter.id 
                  ? 'bg-sky-600/10 text-sky-400 border border-sky-600/20 shadow-[0_0_15px_rgba(56,189,248,0.1)]' 
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                }`}
            >
              <chapter.icon size={20} className="shrink-0" />
              {!isDesktopCollapsed && <span className="ml-3 truncate">{chapter.title}</span>}
              
              {/* Tooltip for collapsed mode */}
              {isDesktopCollapsed && (
                <div className="absolute left-16 bg-slate-800 text-slate-200 text-xs px-2 py-1 rounded border border-slate-700 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap">
                  {chapter.title}
                </div>
              )}
            </button>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="shrink-0 p-4 border-t border-slate-800 bg-slate-900">
           <a 
             href="https://www.freertos.org/" 
             target="_blank" 
             rel="noopener noreferrer"
             className={`flex items-center ${isDesktopCollapsed ? 'justify-center' : 'justify-center gap-2'} text-xs text-slate-500 hover:text-sky-400 transition-colors group`}
             title="Visit FreeRTOS.org"
           >
             {!isDesktopCollapsed && <span>基于 v10.5.1 版本</span>}
             <ExternalLink size={12} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
           </a>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={`flex-1 ${isFullPage ? 'overflow-hidden' : 'overflow-y-auto'} h-[calc(100vh-65px)] md:h-screen bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950 relative`}>
        
        {/* Overlay for mobile when menu is open */}
        {isMobileMenuOpen && (
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm z-30 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

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
