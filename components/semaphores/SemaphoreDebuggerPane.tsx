
import React from 'react';
import { Bug, Box, GripVertical, Lock } from 'lucide-react';
import { Reorder, useDragControls } from 'framer-motion';
import CollapsibleSection from '../CollapsibleSection';

interface SemaphoreDebuggerPaneProps {
  type: 'BINARY' | 'COUNTING';
  tokens: number;
  maxTokens: number;
  blockedTasks: string[];
  owner: string | null;
  width: number;
}

const DebugRow = ({ label, value, color = "text-slate-400" }: { label: string, value: string | number, color?: string }) => (
    <div className="flex justify-between items-center text-xs py-1 border-b border-slate-800/50 last:border-0">
        <span className="text-slate-500 font-bold">{label}</span>
        <span className={`font-mono ${color}`}>{value}</span>
    </div>
);

const SemaphoreDebuggerPane: React.FC<SemaphoreDebuggerPaneProps> = ({ 
    type, tokens, maxTokens, blockedTasks, owner, width 
}) => {
  return (
    <div 
      style={{ width }} 
      className="bg-slate-900 border-l border-slate-800 flex flex-col shrink-0 text-slate-300 h-full"
    >
      <div className="h-8 bg-slate-900 px-4 flex items-center gap-2 text-xs font-bold text-slate-400 border-b border-slate-800 shadow-sm shrink-0">
         <Bug size={14} className="text-emerald-500"/> 
         <span>SEMAPHORE INSPECTOR</span>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
         
         <CollapsibleSection title="Queue Definition (Semaphore)">
            <div className="px-1">
                <DebugRow label="uxMessagesWaiting" value={tokens} color={tokens > 0 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"} />
                <DebugRow label="uxLength" value={maxTokens} />
                <DebugRow label="uxQueueType" value={type === 'BINARY' ? "queueQUEUE_IS_BINARY" : "queueQUEUE_IS_COUNTING"} />
                {type === 'BINARY' && (
                     <DebugRow label="pxMutexHolder" value={owner || "NULL"} color={owner ? "text-sky-300" : "text-slate-500"} />
                )}
            </div>
         </CollapsibleSection>

         <CollapsibleSection title="Event Lists">
             <div className="px-1">
                <div className="text-[10px] text-slate-500 uppercase font-bold mb-1 flex justify-between">
                    <span>xTasksWaitingToReceive</span>
                    <span className="text-slate-600">{blockedTasks.length}</span>
                </div>
                {blockedTasks.length > 0 ? (
                    <div className="flex flex-col gap-1">
                        {blockedTasks.map((task, i) => (
                            <div key={i} className="text-xs text-amber-300 bg-amber-900/10 border border-amber-500/20 p-1 rounded flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"/> {task}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-[10px] text-slate-600 italic pl-2">List Empty</div>
                )}
             </div>
         </CollapsibleSection>

         <CollapsibleSection title="Implementation Notes">
             <div className="p-2 space-y-3 text-xs text-slate-400 leading-relaxed">
                 <div className="flex gap-2 items-start">
                     <Box size={14} className="text-sky-500 shrink-0 mt-0.5"/>
                     <div>
                         <strong className="text-sky-400 block mb-0.5">Semaphores are Queues</strong>
                         <p>在 FreeRTOS 中，信号量本质上是一个特殊的队列。它不存储实际数据，只关心 <code>uxMessagesWaiting</code> 的计数。</p>
                     </div>
                 </div>
                 {type === 'BINARY' && (
                     <div className="flex gap-2 items-start">
                        <Lock size={14} className="text-rose-500 shrink-0 mt-0.5"/>
                        <div>
                            <strong className="text-rose-400 block mb-0.5">Binary vs Mutex</strong>
                            <p>二值信号量用于同步，不具备优先级继承机制。Mutex 是一种特殊的二值信号量，包含所有权概念和优先级继承。</p>
                        </div>
                     </div>
                 )}
             </div>
         </CollapsibleSection>

      </div>
    </div>
  );
};

export default SemaphoreDebuggerPane;
