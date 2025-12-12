
import React, { useState } from 'react';
import { Bug, GripVertical, Activity, Layers, List, BookOpen, Clock, Zap, ShieldAlert } from 'lucide-react';
import { Reorder, useDragControls } from 'framer-motion';
import CollapsibleSection from '../CollapsibleSection';
import { SimTask } from '../../data/schedulerData';

interface SchedulerDebuggerPaneProps {
  tickCount: number;
  currentTaskId: number;
  tasks: SimTask[];
  width: number;
  // New props
  criticalNesting: number;
  pendingInterrupt: boolean;
  isExecutingISR: boolean;
}

const DebugRow = ({ label, value, color = "text-slate-400", animate = false }: { label: string, value: string | number, color?: string, animate?: boolean }) => (
    <div className="flex justify-between items-center text-xs py-1 border-b border-slate-800/50 last:border-0">
        <span className="text-slate-500 font-bold">{label}</span>
        <span className={`font-mono ${color} ${animate ? 'animate-pulse' : ''}`}>{value}</span>
    </div>
);

const DraggableSection = ({ item, children }: { item: string, children: React.ReactNode }) => {
    const controls = useDragControls();
    return (
        <Reorder.Item 
            value={item} 
            dragListener={false} 
            dragControls={controls}
            className="relative"
        >
            <CollapsibleSection 
                title={
                    item === 'stats' ? "System Status" : 
                    item === 'lists' ? "Ready Lists Inspection" : 
                    item === 'tcbs' ? "Task Control Blocks" :
                    "Scheduling Principles"
                }
                prefix={<div onPointerDown={(e) => controls.start(e)}><GripVertical size={14} /></div>}
            >
                {children}
            </CollapsibleSection>
        </Reorder.Item>
    );
};

const SchedulerDebuggerPane: React.FC<SchedulerDebuggerPaneProps> = ({ 
    tickCount, currentTaskId, tasks, width, criticalNesting, pendingInterrupt, isExecutingISR
}) => {
  const [items, setItems] = useState(["stats", "lists", "tcbs", "principles"]);
  
  const currentTaskName = isExecutingISR ? "ISR (Hardware)" : (tasks.find(t => t.id === currentTaskId)?.name || "Switching...");
  const readyCounts = [0, 1, 2].map(p => tasks.filter(t => t.priority === p && t.state === 'READY').length);
  const blockedCount = tasks.filter(t => t.state === 'BLOCKED').length;

  return (
    <div 
      style={{ width }} 
      className="bg-slate-900 border-l border-slate-800 flex flex-col shrink-0 text-slate-300 h-full"
    >
      <div className="h-8 bg-slate-900 px-4 flex items-center gap-2 text-xs font-bold text-slate-400 border-b border-slate-800 shadow-sm shrink-0">
         <Bug size={14} className="text-emerald-500"/> 
         <span>SCHEDULER INSPECTOR</span>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
         <Reorder.Group axis="y" values={items} onReorder={setItems} className="space-y-2">
             
             {items.map(item => {
                 if (item === 'stats') return (
                     <DraggableSection key={item} item={item}>
                        <div className="px-1">
                            <DebugRow label="xTickCount" value={tickCount} color="text-sky-300"/>
                            <DebugRow label="Current Execution" value={currentTaskName} color={isExecutingISR ? "text-red-400 font-bold" : "text-emerald-400 font-bold"}/>
                            <DebugRow label="uxCriticalNesting" value={criticalNesting} color={criticalNesting > 0 ? "text-yellow-400 font-bold" : "text-slate-400"}/>
                            <DebugRow label="Interrupt Status" value={pendingInterrupt ? "PENDING" : "ACTIVE"} color={pendingInterrupt ? "text-red-400" : "text-slate-500"} animate={pendingInterrupt}/>
                            <div className="mt-2 text-[10px] flex items-center gap-2 bg-slate-800 p-1.5 rounded">
                                <ShieldAlert size={12} className={criticalNesting > 0 ? "text-yellow-500" : "text-slate-600"}/>
                                <span className={criticalNesting > 0 ? "text-yellow-200" : "text-slate-500"}>
                                    {criticalNesting > 0 ? "INTERRUPTS DISABLED (PRIMASK=1)" : "Interrupts Enabled (PRIMASK=0)"}
                                </span>
                            </div>
                        </div>
                     </DraggableSection>
                 );
                 if (item === 'principles') return (
                    <DraggableSection key={item} item={item}>
                        <div className="text-xs text-slate-400 leading-relaxed space-y-3">
                            <div className="flex items-start gap-2">
                                <Zap size={14} className="text-red-500 mt-0.5 shrink-0"/>
                                <div>
                                    <strong className="text-red-400 block mb-1">Preemption (抢占)</strong>
                                    <p>硬件中断 (ISR) 拥有最高优先级。LED 任务可随时被打断，因为其操作（Toggle）通常是原子的或不敏感的。</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <ShieldAlert size={14} className="text-yellow-500 mt-0.5 shrink-0"/>
                                <div>
                                    <strong className="text-yellow-400 block mb-1">Reentrancy (重入性)</strong>
                                    <p>UART 任务使用 <code>printf</code>，这是不可重入函数。必须使用临界区保护，防止在打印过程中被中断打断并再次调用打印。</p>
                                </div>
                            </div>
                        </div>
                    </DraggableSection>
                 );
                 if (item === 'lists') return (
                    <DraggableSection key={item} item={item}>
                        {/* Simplified List View */}
                        <div className="space-y-1 pt-1">
                             <div className="text-[10px] uppercase font-bold text-slate-500">Ready Lists</div>
                             {readyCounts.map((c, i) => (
                                 <div key={i} className="flex justify-between text-[10px] pl-2 text-slate-400">
                                     <span>Priority {i}</span>
                                     <span className={c>0?"text-sky-400":"text-slate-600"}>{c}</span>
                                 </div>
                             ))}
                        </div>
                    </DraggableSection>
                 );
                 // ... keep other sections if needed, simplified for brevity here
                 return null;
             })}
         </Reorder.Group>
      </div>
    </div>
  );
};

export default SchedulerDebuggerPane;
