
import React, { useState } from 'react';
import { Bug, GripVertical, Layers, Zap, ShieldAlert } from 'lucide-react';
import { Reorder, useDragControls } from 'framer-motion';
import CollapsibleSection from '../CollapsibleSection';
import { SimTask } from '../../data/schedulerData';

interface SchedulerDebuggerPaneProps {
  tickCount: number;
  currentTaskId: number;
  tasks: SimTask[];
  width: number;
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

const DraggableSection: React.FC<{ item: string; children: React.ReactNode }> = ({ item, children }) => {
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
  const [items, setItems] = useState(["stats", "lists", "principles"]);
  
  const currentTaskName = isExecutingISR ? "ISR (Hardware)" : (tasks.find(t => t.id === currentTaskId)?.name || "Switching...");
  const readyCounts = [0, 1, 2, 3, 4].map(p => tasks.filter(t => t.priority === p && t.state === 'READY').length);
  
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
                                <span className="text-yellow-200">
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
                                    <p>当高优先级任务变为 Ready 状态（例如延时结束），调度器会立即打断低优先级任务。</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <Layers size={14} className="text-sky-500 mt-0.5 shrink-0"/>
                                <div>
                                    <strong className="text-sky-400 block mb-1">Time Slicing</strong>
                                    <p>调度器以 Tick 为单位分配时间片。空闲任务或其他任务在 Tick 中断中被唤醒并重新评估优先级。</p>
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
                                 <div key={i} className={`flex justify-between text-[10px] pl-2 ${c>0 ? 'text-sky-300 font-bold' : 'text-slate-600'}`}>
                                     <span>Priority {i}</span>
                                     <span>{c}</span>
                                 </div>
                             ))}
                        </div>
                    </DraggableSection>
                 );
                 return null;
             })}
         </Reorder.Group>
      </div>
    </div>
  );
};

export default SchedulerDebuggerPane;
