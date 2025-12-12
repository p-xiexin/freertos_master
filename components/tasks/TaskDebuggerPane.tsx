
import React, { useState } from 'react';
import { Bug, List, Clock, Power, BookOpen, GripVertical, FileText } from 'lucide-react';
import { Reorder, useDragControls } from 'framer-motion';
import CollapsibleSection from '../CollapsibleSection';
import { TaskState } from '../../types';

interface TaskDebuggerPaneProps {
  currentState: TaskState;
  width: number;
}

const DebugRow = ({ label, value, color = "text-slate-400" }: { label: string, value: string, color?: string }) => (
    <div className="flex justify-between items-center text-xs py-1 border-b border-slate-800/50 last:border-0">
        <span className="text-slate-500 font-bold">{label}</span>
        <span className={`font-mono ${color}`}>{value}</span>
    </div>
);

// Wrapper to isolate drag controls for each item
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
                    item === 'tcb' ? "Task Control Block (TCB)" : 
                    item === 'lists' ? "Kernel Lists" : 
                    item === 'stats' ? "System Status" : 
                    "Task Management Anatomy"
                }
                prefix={<div onPointerDown={(e) => controls.start(e)}><GripVertical size={14} /></div>}
            >
                {children}
            </CollapsibleSection>
        </Reorder.Item>
    );
};

const TaskDebuggerPane: React.FC<TaskDebuggerPaneProps> = ({ currentState, width }) => {
  const [items, setItems] = useState(["anatomy", "tcb", "lists", "stats"]);
  
  // Derived state for display
  const isInReady = currentState === TaskState.READY || currentState === TaskState.RUNNING;
  
  return (
    <div 
      style={{ width }} 
      className="bg-slate-900 border-l border-slate-800 flex flex-col shrink-0 text-slate-300 h-full"
    >
      {/* Header */}
      <div className="h-8 bg-slate-900 px-4 flex items-center gap-2 text-xs font-bold text-slate-400 border-b border-slate-800 shadow-sm shrink-0">
         <Bug size={14} className="text-emerald-500"/> 
         <span>KERNEL INSPECTOR</span>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
         <Reorder.Group axis="y" values={items} onReorder={setItems} className="space-y-2">
            {items.map(item => {
                switch(item) {
                    case 'anatomy':
                        return (
                            <DraggableSection key={item} item={item}>
                                <div className="text-xs text-slate-400 leading-relaxed space-y-3">
                                    <div className="flex items-start gap-2">
                                        <FileText size={14} className="text-sky-500 mt-0.5 shrink-0"/>
                                        <div>
                                            <strong className="text-sky-400 block mb-1">1. TCB (Task Control Block)</strong>
                                            <p>任务的核心数据结构。保存了任务的栈顶指针 (pxTopOfStack)、优先级、状态列表项等关键信息。系统通过操作 TCB 来管理任务。</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <List size={14} className="text-emerald-500 mt-0.5 shrink-0"/>
                                        <div>
                                            <strong className="text-emerald-400 block mb-1">2. Kernel Lists (链表)</strong>
                                            <p>FreeRTOS 使用双向链表管理任务状态。Ready List 是一个数组 <code>pxReadyTasksLists[N]</code>，按优先级索引，确保调度器能在 O(1) 时间内找到最高优先级任务。</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <Clock size={14} className="text-amber-500 mt-0.5 shrink-0"/>
                                        <div>
                                            <strong className="text-amber-400 block mb-1">3. State Machine</strong>
                                            <p>任务在 Ready, Running, Blocked, Suspended 四种状态间迁移。<code>vTaskDelay</code> 会将任务移入 Delayed List，直到 Tick 计数达到唤醒时间。</p>
                                        </div>
                                    </div>
                                </div>
                            </DraggableSection>
                        );
                    case 'tcb':
                        return (
                            <DraggableSection key={item} item={item}>
                                <div className="px-1">
                                    <DebugRow label="Task Name" value="MainTask" color="text-sky-300" />
                                    <DebugRow label="Handle" value="0x20000840" />
                                    <DebugRow label="Priority" value="2 (Normal)" />
                                    <DebugRow 
                                        label="State" 
                                        value={currentState} 
                                        color={
                                            currentState === TaskState.RUNNING ? "text-emerald-400 font-bold" :
                                            currentState === TaskState.READY ? "text-sky-400" :
                                            currentState === TaskState.BLOCKED ? "text-amber-400" : "text-rose-400"
                                        }
                                    />
                                    <DebugRow label="Stack High Mark" value="124 words" />
                                    <DebugRow label="Stack Pointer" value={currentState === TaskState.RUNNING ? "0x20000810" : "0x20000800"} />
                                </div>
                            </DraggableSection>
                        );
                    case 'lists':
                        return (
                            <DraggableSection key={item} item={item}>
                                <div className="space-y-2 pt-1">
                                    {/* Ready List */}
                                    <div className={`p-2 rounded border transition-colors ${isInReady ? 'bg-sky-900/10 border-sky-500/30' : 'bg-slate-900 border-slate-800 opacity-50'}`}>
                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-1">
                                            <List size={12}/> pxReadyTasksLists[2]
                                        </div>
                                        <div className="font-mono text-[10px] text-slate-500 pl-4">
                                            {isInReady ? (
                                                <>
                                                    <div>➜ <span className="text-sky-300">MainTask</span> (TCB)</div>
                                                    <div>&nbsp;&nbsp;IdleTask (TCB)</div>
                                                </>
                                            ) : (
                                                <div>&nbsp;&nbsp;IdleTask (TCB)</div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Delayed List */}
                                    <div className={`p-2 rounded border transition-colors ${currentState === TaskState.BLOCKED ? 'bg-amber-900/10 border-amber-500/30' : 'bg-slate-900 border-slate-800 opacity-50'}`}>
                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-1">
                                            <Clock size={12}/> pxDelayedTaskList
                                        </div>
                                        <div className="font-mono text-[10px] text-slate-500 pl-4">
                                            {currentState === TaskState.BLOCKED ? (
                                                <div>➜ <span className="text-amber-300">MainTask</span> (Wake: +100)</div>
                                            ) : (
                                                <div className="italic opacity-50">Empty</div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Suspended List */}
                                    <div className={`p-2 rounded border transition-colors ${currentState === TaskState.SUSPENDED ? 'bg-rose-900/10 border-rose-500/30' : 'bg-slate-900 border-slate-800 opacity-50'}`}>
                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-1">
                                            <Power size={12}/> xSuspendedTaskList
                                        </div>
                                        <div className="font-mono text-[10px] text-slate-500 pl-4">
                                            {currentState === TaskState.SUSPENDED ? (
                                                <div>➜ <span className="text-rose-300">MainTask</span></div>
                                            ) : (
                                                <div className="italic opacity-50">Empty</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </DraggableSection>
                        );
                    case 'stats':
                        return (
                            <DraggableSection key={item} item={item}>
                                <div className="px-1">
                                    <DebugRow label="xTickCount" value="12,450" color="text-slate-300"/>
                                    <DebugRow label="xSchedulerRunning" value="pdTRUE" color="text-emerald-400"/>
                                    <DebugRow label="pxCurrentTCB" value={currentState === TaskState.RUNNING ? "MainTask" : "IdleTask"} color="text-yellow-200"/>
                                </div>
                            </DraggableSection>
                        );
                    default: return null;
                }
            })}
         </Reorder.Group>
      </div>
    </div>
  );
};

export default TaskDebuggerPane;
