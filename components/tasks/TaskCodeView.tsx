
import React, { useRef, useEffect, useState } from 'react';
import { Code2, Terminal } from 'lucide-react';
import { CODE_LINES } from '../../data/taskLifecycleData';

interface TaskCodeViewProps {
  activeLine: number | null;
  height: number;
  systemLog: string;
}

const TaskCodeView: React.FC<TaskCodeViewProps> = ({ activeLine, height, systemLog }) => {
  const [activeTab, setActiveTab] = useState<'source' | 'log'>('source');
  const scrollRef = useRef<HTMLDivElement>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logic
  useEffect(() => {
    if (activeTab === 'source' && activeLine !== null && scrollRef.current) {
        const lineEl = document.getElementById(`task-line-${activeLine}`);
        if (lineEl) {
            lineEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
  }, [activeLine, activeTab]);

  useEffect(() => {
    if (activeTab === 'log' && logEndRef.current) {
        logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [systemLog, activeTab]);

  return (
    <div style={{ height }} className="flex flex-col bg-[#0f172a] font-mono text-sm relative border-t border-slate-800 z-10">
       
       {/* Header / Tabs */}
       <div className="h-9 bg-[#1e293b] flex items-center border-b border-slate-700/50 shrink-0 select-none">
          <button 
            onClick={() => setActiveTab('source')}
            className={`flex items-center gap-2 px-4 h-full border-r border-slate-700/50 transition-colors hover:bg-slate-800 ${activeTab === 'source' ? 'bg-slate-800 text-sky-400' : 'text-slate-500'}`}
          >
            <Code2 size={14} className={activeTab === 'source' ? 'text-sky-500' : 'text-slate-500'}/> 
            <span className="font-bold text-xs">main.c</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('log')}
            className={`flex items-center gap-2 px-4 h-full border-r border-slate-700/50 transition-colors hover:bg-slate-800 ${activeTab === 'log' ? 'bg-slate-800 text-emerald-400' : 'text-slate-500'}`}
          >
            <Terminal size={14} className={activeTab === 'log' ? 'text-emerald-500' : 'text-slate-500'}/> 
            <span className="font-bold text-xs">UART Output</span>
            {systemLog.length > 50 && activeTab !== 'log' && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-1"/>
            )}
          </button>
       </div>

       {/* Tab Content */}
       <div className="flex-1 overflow-hidden relative">
          
          {/* SOURCE TAB */}
          {activeTab === 'source' && (
            <div ref={scrollRef} className="absolute inset-0 overflow-y-auto custom-scrollbar p-2">
                {CODE_LINES.map((line, idx) => {
                    const isActive = activeLine === line.line;
                    return (
                        <div key={idx} id={`task-line-${line.line}`} className={`flex ${isActive ? 'bg-sky-900/20 -mx-2 px-2' : ''}`}>
                            <div className={`w-6 text-right pr-2 select-none shrink-0 text-[10px] ${isActive ? 'text-sky-500 font-bold' : 'text-slate-600'}`}>{line.line}</div>
                            <div className="flex-1 whitespace-pre truncate text-xs leading-5">
                                {line.type === 'comment' ? <span className="text-emerald-600 italic">{line.text}</span> :
                                    line.type === 'keyword' ? <span className="text-purple-400">{line.text}</span> :
                                    line.type === 'func' ? <span className="text-yellow-200">{line.text}</span> :
                                    line.type === 'call' ? <span className="text-sky-300">{line.text}</span> :
                                    line.type === 'macro' ? <span className="text-amber-300">{line.text}</span> :
                                    <span className="text-slate-300">{line.text}</span>}
                            </div>
                        </div>
                    )
                })}
            </div>
          )}

          {/* LOG TAB */}
          {activeTab === 'log' && (
             <div className="absolute inset-0 overflow-y-auto custom-scrollbar p-3 bg-black/20">
                 <div className="font-mono text-[11px] text-slate-300 whitespace-pre-wrap leading-relaxed">
                     {systemLog}
                 </div>
                 <div ref={logEndRef} />
             </div>
          )}
       </div>
    </div>
  );
};

export default TaskCodeView;
