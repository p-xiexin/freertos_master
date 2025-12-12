
import React, { useRef, useEffect, useState } from 'react';
import { Code2, FileCode, Layers, Zap, Terminal } from 'lucide-react';
import { TASKS_C_CODE, LED_TASK_CODE, UART_TASK_CODE, ISR_CODE } from '../../data/schedulerData';

interface SchedulerCodeViewProps {
  activeTabOverride?: string; 
  activeLine: number | null;
  height: number;
  uartLog?: string;
}

const SchedulerCodeView: React.FC<SchedulerCodeViewProps> = ({ activeTabOverride, activeLine, height, uartLog }) => {
  const [activeTab, setActiveTab] = useState<'kernel' | 'led' | 'uart' | 'isr' | 'log'>('kernel');
  const scrollRef = useRef<HTMLDivElement>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeTabOverride) {
        setActiveTab(activeTabOverride as any);
    }
  }, [activeTabOverride]);

  useEffect(() => {
    if (activeTab === 'log' && logEndRef.current) {
        logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [uartLog, activeTab]);

  useEffect(() => {
    if (activeLine !== null && scrollRef.current && activeTab !== 'log') {
        const lineEl = document.getElementById(`sch-line-${activeLine}`);
        if (lineEl) {
            lineEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
  }, [activeLine, activeTab]);

  const getCode = () => {
    switch(activeTab) {
        case 'kernel': return TASKS_C_CODE;
        case 'led': return LED_TASK_CODE;
        case 'uart': return UART_TASK_CODE;
        case 'isr': return ISR_CODE;
        default: return [];
    }
  };

  return (
    <div style={{ height }} className="flex flex-col bg-[#0f172a] font-mono text-sm relative border-t border-slate-800 z-10 transition-all">
       
       {/* Tabs Header */}
       <div className="h-9 bg-[#1e293b] flex items-center border-b border-slate-700/50 shrink-0 select-none overflow-x-auto custom-scrollbar">
          <button 
            onClick={() => setActiveTab('kernel')}
            className={`flex items-center gap-2 px-4 h-full border-r border-slate-700/50 transition-colors hover:bg-slate-800 ${activeTab === 'kernel' ? 'bg-slate-800 text-yellow-400' : 'text-slate-500'}`}
          >
            <Layers size={14} className={activeTab === 'kernel' ? 'text-yellow-500' : 'text-slate-500'}/> 
            <span className="font-bold text-xs whitespace-nowrap">tasks.c</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('led')}
            className={`flex items-center gap-2 px-4 h-full border-r border-slate-700/50 transition-colors hover:bg-slate-800 ${activeTab === 'led' ? 'bg-slate-800 text-rose-400' : 'text-slate-500'}`}
          >
            <FileCode size={14} className={activeTab === 'led' ? 'text-rose-500' : 'text-slate-500'}/> 
            <span className="font-bold text-xs whitespace-nowrap">led_task.c</span>
          </button>

          <button 
            onClick={() => setActiveTab('uart')}
            className={`flex items-center gap-2 px-4 h-full border-r border-slate-700/50 transition-colors hover:bg-slate-800 ${activeTab === 'uart' ? 'bg-slate-800 text-indigo-400' : 'text-slate-500'}`}
          >
            <Code2 size={14} className={activeTab === 'uart' ? 'text-indigo-500' : 'text-slate-500'}/> 
            <span className="font-bold text-xs whitespace-nowrap">uart_task.c</span>
          </button>

          <button 
            onClick={() => setActiveTab('isr')}
            className={`flex items-center gap-2 px-4 h-full border-r border-slate-700/50 transition-colors hover:bg-slate-800 ${activeTab === 'isr' ? 'bg-slate-800 text-red-400' : 'text-slate-500'}`}
          >
            <Zap size={14} className={activeTab === 'isr' ? 'text-red-500' : 'text-slate-500'}/> 
            <span className="font-bold text-xs whitespace-nowrap">stm32_it.c</span>
          </button>

          {/* UART Console Tab */}
          <button 
            onClick={() => setActiveTab('log')}
            className={`flex items-center gap-2 px-4 h-full border-l border-slate-700/50 ml-auto transition-colors hover:bg-slate-800 ${activeTab === 'log' ? 'bg-slate-800 text-emerald-400' : 'text-slate-500'}`}
          >
            <Terminal size={14} className={activeTab === 'log' ? 'text-emerald-500' : 'text-slate-500'}/> 
            <span className="font-bold text-xs whitespace-nowrap">UART Out</span>
            {uartLog && uartLog.length > 0 && activeTab !== 'log' && (
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse ml-1"/>
            )}
          </button>
       </div>

       {/* Code Area */}
       <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar p-0 relative">
            {activeTab === 'log' ? (
                <div className="p-3 font-mono text-xs text-slate-300 whitespace-pre-wrap bg-black/20 min-h-full">
                    {uartLog || <span className="text-slate-600 italic">// No output yet...</span>}
                    <div ref={logEndRef} />
                </div>
            ) : (
                <div className="p-2">
                    {getCode().map((line, idx) => {
                        const isActive = activeLine === line.line;
                        return (
                            <div key={idx} id={`sch-line-${line.line}`} className={`flex ${isActive ? 'bg-sky-900/20 -mx-2 px-2' : ''}`}>
                                <div className={`w-8 text-right pr-3 select-none shrink-0 text-[10px] ${isActive ? 'text-sky-500 font-bold' : 'text-slate-600'}`}>{line.line}</div>
                                <div className="flex-1 whitespace-pre truncate text-xs leading-5">
                                    {line.type === 'comment' ? <span className="text-emerald-600 italic">{line.text}</span> :
                                        line.type === 'keyword' ? <span className="text-purple-400">{line.text}</span> :
                                        line.type === 'func' ? <span className="text-yellow-200">{line.text}</span> :
                                        line.type === 'call' ? <span className="text-sky-300">{line.text}</span> :
                                        line.type === 'macro' ? <span className="text-amber-300">{line.text}</span> :
                                        line.type === 'code' ? <span className="text-slate-200 font-bold">{line.text}</span> :
                                        <span className="text-slate-300">{line.text}</span>}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
       </div>
    </div>
  );
};

export default SchedulerCodeView;
