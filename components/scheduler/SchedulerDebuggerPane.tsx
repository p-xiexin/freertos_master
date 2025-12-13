
import React, { useState } from 'react';
import { Bug, GripVertical, Layers, Zap, ShieldAlert, Sliders, Gauge } from 'lucide-react';
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
  onPriorityChange: (id: number, priority: number) => void;
  timeSliceScale: number;
  onTimeSliceChange: (scale: number) => void;
  simulationSpeed?: number;
  onSpeedChange?: (speed: number) => void;
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
                    item === 'config' ? "Configuration" :
                    item === 'principles' ? "Scheduling Principles" :
                    "Ready Lists Inspection"
                }
                prefix={<div onPointerDown={(e) => controls.start(e)}><GripVertical size={14} /></div>}
            >
                {children}
            </CollapsibleSection>
        </Reorder.Item>
    );
};

const SchedulerDebuggerPane: React.FC<SchedulerDebuggerPaneProps> = ({ 
    tickCount, currentTaskId, tasks, width, criticalNesting, pendingInterrupt, isExecutingISR,
    onPriorityChange, timeSliceScale, onTimeSliceChange, simulationSpeed = 800, onSpeedChange
}) => {
  const [items, setItems] = useState(["config", "stats", "lists", "principles"]);
  
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
                 if (item === 'config') return (
                    <DraggableSection key={item} item={item}>
                        <div className="px-1 py-1 space-y-4">
                            {/* Priority Sliders */}
                            {tasks.filter(t => t.id !== 0).map(task => (
                                <div key={task.id} className="space-y-1">
                                    <div className="flex justify-between text-[10px] uppercase font-bold text-slate-500">
                                        <span>{task.name} Priority</span>
                                        <span className="text-sky-400">{task.priority}</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="0" max="4" 
                                        value={task.priority}
                                        onChange={(e) => onPriorityChange(task.id, parseInt(e.target.value))}
                                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500 hover:accent-sky-400"
                                    />
                                </div>
                            ))}
                            
                            <div className="border-t border-slate-800/50 my-2"></div>

                            {/* Simulation Speed Slider */}
                            {onSpeedChange && (
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] uppercase font-bold text-slate-500">
                                        <span className="flex items-center gap-1"><Gauge size={12}/> Animation Speed</span>
                                        <span className="text-emerald-400">{simulationSpeed}ms</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="50" max="2000" step="50"
                                        value={simulationSpeed}
                                        onChange={(e) => onSpeedChange(parseInt(e.target.value))}
                                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-400"
                                        style={{ direction: 'rtl' }} // Invert so left is fast, right is slow? No, usually right is fast? Actually "Delay" means right is slow. Let's keep normal: left=50ms (fast), right=2000ms (slow)
                                    />
                                    <p className="text-[9px] text-slate-600 italic">Adjust playback step delay.</p>
                                </div>
                            )}

                            {/* Time Slice Slider */}
                            <div className="space-y-1">
                                <div className="flex justify-between text-[10px] uppercase font-bold text-slate-500">
                                    <span className="flex items-center gap-1"><Layers size={12}/> Ticks per Slice</span>
                                    <span className="text-amber-400">{timeSliceScale}x</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="1" max="10" 
                                    value={timeSliceScale}
                                    onChange={(e) => onTimeSliceChange(parseInt(e.target.value))}
                                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500 hover:accent-amber-400"
                                />
                                <p className="text-[9px] text-slate-600 italic">Logical CPU cycles before SysTick.</p>
                            </div>
                        </div>
                    </DraggableSection>
                 );
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
                                    <strong className="text-sky-400 block mb-1">Time Slicing (Round Robin)</strong>
                                    <p>当多个同优先级任务处于 Ready 状态时，调度器会在 Tick 中断中轮流执行它们（队头移至队尾）。</p>
                                </div>
                            </div>
                        </div>
                    </DraggableSection>
                 );
                 if (item === 'lists') return (
                    <DraggableSection key={item} item={item}>
                        {/* Simplified List View */}
                        <div className="space-y-1 pt-1">
                             <div className="text-[10px] uppercase font-bold text-slate-500">Ready Lists Count</div>
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
