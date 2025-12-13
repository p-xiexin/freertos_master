
import React, { useRef, useEffect, useState } from 'react';
import { Code2 } from 'lucide-react';
import { MUTEX_TAKE_CODE, INHERIT_LOGIC_CODE, DISINHERIT_LOGIC_CODE } from '../../data/inversionData';

interface InversionCodeViewProps {
  activeLine: number | null;
  height: number;
  activeTab: 'take' | 'inherit' | 'disinherit';
}

const InversionCodeView: React.FC<InversionCodeViewProps> = ({ activeLine, height, activeTab }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const codeData = activeTab === 'take' ? MUTEX_TAKE_CODE : 
                   activeTab === 'inherit' ? INHERIT_LOGIC_CODE : 
                   DISINHERIT_LOGIC_CODE;

  useEffect(() => {
    if (activeLine !== null && scrollRef.current) {
        const lineEl = document.getElementById(`inv-line-${activeLine}`);
        if (lineEl) {
            lineEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
  }, [activeLine, activeTab]);

  return (
    <div style={{ height }} className="flex flex-col bg-[#0f172a] font-mono text-sm relative border-t border-slate-800 z-10">
       <div className="h-9 bg-[#1e293b] flex items-center border-b border-slate-700/50 shrink-0 select-none px-4 gap-2">
            <Code2 size={14} className="text-sky-500"/> 
            <span className="font-bold text-xs text-sky-400">tasks.c / queue.c</span>
            <span className="text-[10px] text-slate-500 mx-2">|</span>
            <span className={`text-[10px] font-bold ${activeTab === 'inherit' ? 'text-rose-400' : 'text-slate-300'}`}>
                {activeTab === 'take' ? 'pvTaskIncrementMutexHeldCount' : activeTab === 'inherit' ? 'xTaskPriorityInherit' : 'xTaskPriorityDisinherit'}
            </span>
       </div>

       <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar p-2">
            {codeData.map((line, idx) => {
                const isActive = activeLine === line.line;
                return (
                    <div key={idx} id={`inv-line-${line.line}`} className={`flex ${isActive ? 'bg-sky-900/20 -mx-2 px-2' : ''}`}>
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
    </div>
  );
};

export default InversionCodeView;
