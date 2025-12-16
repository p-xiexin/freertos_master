
import React from 'react';
import { Bug, GripVertical, ShieldAlert } from 'lucide-react';
import { Reorder, useDragControls } from 'framer-motion';
import CollapsibleSection from '../CollapsibleSection';

interface InversionDebuggerPaneProps {
  tasks: { id: string, name: string, prio: number, state: string, basePrio: number }[];
  mutexOwner: string | null;
  width: number;
}

const DebugRow = ({ label, value, color = "text-slate-400", highlight=false }: { label: string, value: string | number, color?: string, highlight?: boolean }) => (
    <div className={`flex justify-between items-center text-xs py-1 border-b border-slate-800/50 last:border-0 ${highlight ? 'bg-sky-900/20' : ''}`}>
        <span className="text-slate-500 font-bold">{label}</span>
        <span className={`font-mono ${color}`}>{value}</span>
    </div>
);

const InversionDebuggerPane: React.FC<InversionDebuggerPaneProps> = ({ tasks, mutexOwner, width }) => {
  return (
    <div 
      style={{ width }} 
      className="bg-slate-900 border-l border-slate-800 flex flex-col shrink-0 text-slate-300 h-full"
    >
      <div className="h-8 bg-slate-900 px-4 flex items-center gap-2 text-xs font-bold text-slate-400 border-b border-slate-800 shadow-sm shrink-0">
         <Bug size={14} className="text-emerald-500"/> 
         <span>TCB INSPECTOR</span>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
         
         <CollapsibleSection title="Mutex Status">
             <div className="px-1">
                 <DebugRow label="pxMutexHolder" value={mutexOwner ? `${mutexOwner} (TCB)` : "NULL"} color={mutexOwner ? "text-rose-400 font-bold" : "text-slate-500"} />
                 <DebugRow label="uxQueueType" value="queueQUEUE_IS_MUTEX" />
             </div>
         </CollapsibleSection>

         {tasks.slice().reverse().map(task => {
             const isInherited = task.prio > task.basePrio;
             return (
                <div key={task.id} className="bg-slate-950/50 rounded-lg border border-slate-800/50 overflow-hidden">
                    <CollapsibleSection title={`${task.name} (TCB)`}>
                        <div className="px-1">
                            <DebugRow label="uxPriority" value={task.prio} color={isInherited ? "text-rose-400 font-bold animate-pulse" : "text-sky-300"} highlight={isInherited} />
                            <DebugRow label="uxBasePriority" value={task.basePrio} />
                            <DebugRow label="xStateListItem" value={task.state} />
                            {isInherited && (
                                <div className="mt-2 text-[10px] bg-rose-900/20 text-rose-300 p-1.5 rounded border border-rose-500/30 flex items-center gap-2">
                                    <ShieldAlert size={12} />
                                    <span>INHERITANCE ACTIVE</span>
                                </div>
                            )}
                        </div>
                    </CollapsibleSection>
                </div>
             );
         })}

      </div>
    </div>
  );
};

export default InversionDebuggerPane;
