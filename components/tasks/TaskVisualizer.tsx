
import React from 'react';
import { motion } from 'framer-motion';
import { 
  Cpu, 
  Clock, 
  Pause, 
  Play, 
  Zap, 
  RotateCw, 
  Activity,
  Power,
  Layers
} from 'lucide-react';
import { TaskState } from '../../types';

interface TaskVisualizerProps {
  currentState: TaskState;
  isAnimating: boolean;
  onTransition: (targetState: TaskState, lineNum: number, log: string) => void;
}

const TaskVisualizer: React.FC<TaskVisualizerProps> = ({ currentState, isAnimating, onTransition }) => {
  
  const getTransitions = () => {
    switch(currentState) {
        case TaskState.READY:
            return [{ 
                label: "调度执行", 
                sub: "Scheduler Select",
                icon: Zap,
                color: "emerald",
                onClick: () => onTransition(TaskState.RUNNING, 6, "Scheduler picked highest priority task.") 
            }];
        case TaskState.RUNNING:
            return [
                { 
                    label: "主动让出", 
                    sub: "taskYIELD()",
                    icon: RotateCw,
                    color: "sky",
                    onClick: () => onTransition(TaskState.READY, 9, "Task yielded voluntarily.") 
                },
                { 
                    label: "延时/阻塞", 
                    sub: "vTaskDelay()",
                    icon: Clock,
                    color: "amber",
                    onClick: () => onTransition(TaskState.BLOCKED, 12, "Task entered Blocked state.") 
                },
                { 
                    label: "挂起任务", 
                    sub: "vTaskSuspend()",
                    icon: Pause,
                    color: "rose",
                    onClick: () => onTransition(TaskState.SUSPENDED, 15, "Task suspended explicitly.") 
                }
            ];
        case TaskState.BLOCKED:
            return [
                { 
                    label: "事件触发", 
                    sub: "ISR / Timeout",
                    icon: Activity,
                    color: "emerald",
                    onClick: () => onTransition(TaskState.READY, 21, "Event received! Moved to Ready list.") 
                }
            ];
        case TaskState.SUSPENDED:
            return [
                { 
                    label: "恢复任务", 
                    sub: "vTaskResume()",
                    icon: Play,
                    color: "sky",
                    onClick: () => onTransition(TaskState.READY, 20, "Task Resumed by system.") 
                }
            ];
        default: return [];
    }
  };

  const getTCBPosition = () => {
      switch(currentState) {
          case TaskState.READY: return { top: '50%', left: '20%' }; 
          case TaskState.RUNNING: return { top: '50%', left: '50%' }; 
          case TaskState.BLOCKED: return { top: '50%', left: '80%' }; 
          case TaskState.SUSPENDED: return { top: '16%', left: '80%' };
      }
  };

  return (
    <div className="flex-1 bg-slate-950 relative overflow-hidden flex flex-col items-center justify-center">
        
        {/* Background Grid */}
        <div className="absolute inset-0 opacity-[0.03]" 
                style={{ 
                    backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', 
                    backgroundSize: '24px 24px' 
                }}>
        </div>

        {/* Connection Lines (SVG) */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
            <defs>
                <marker id="arrow-sm" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                    <path d="M0,0 L6,3 L0,6 L0,0" fill="#475569" />
                </marker>
            </defs>
            <path d="M 32% 50% L 38% 50%" stroke="#334155" strokeWidth="2" markerEnd="url(#arrow-sm)" />
            <path d="M 40% 60% L 40% 70% L 20% 70% L 20% 62%" stroke="#334155" strokeWidth="2" strokeDasharray="4,4" fill="none" opacity="0.5"/>
            <path d="M 62% 50% L 68% 50%" stroke="#334155" strokeWidth="2" markerEnd="url(#arrow-sm)" />
            <path d="M 80% 62% L 80% 70% L 60% 70% L 60% 60%" stroke="#334155" strokeWidth="2" strokeDasharray="4,4" fill="none" opacity="0.5"/>
            <path d="M 50% 38% L 50% 16% L 70% 16%" stroke="#334155" strokeWidth="2" strokeDasharray="4,4" fill="none" opacity="0.5"/>
        </svg>

        {/* 1. READY STATE (Left) */}
        <div className="absolute left-[8%] top-1/2 -translate-y-1/2 w-[24%] h-[40%] bg-slate-900 border border-slate-700 rounded-xl flex flex-col shadow-lg z-10 group">
            <div className="h-8 bg-slate-800/50 border-b border-slate-700 flex items-center justify-center">
                <span className={`text-xs font-bold transition-colors ${currentState === TaskState.READY ? 'text-sky-400' : 'text-slate-500'}`}>READY</span>
            </div>
            <div className="flex-1 p-2 flex flex-col gap-2 justify-center bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
                    <div className="border border-dashed border-slate-700 rounded h-10 flex items-center justify-center opacity-30">
                        <span className="text-[9px]">IdleTask</span>
                    </div>
            </div>
            {currentState === TaskState.READY && <div className="absolute inset-0 rounded-xl ring-2 ring-sky-500/50 animate-pulse pointer-events-none"/>}
        </div>

        {/* 2. CPU (Center) */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[24%] aspect-square bg-slate-900 border border-slate-700 rounded-2xl flex flex-col items-center justify-center shadow-xl z-20 overflow-hidden">
            <div className="absolute inset-0 bg-slate-800/30 m-3 rounded-xl border border-slate-700/50"/>
            <div className="relative z-10 flex flex-col items-center gap-2">
                    <Cpu 
                    size={40} 
                    className={`transition-all duration-300 ${currentState === TaskState.RUNNING ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'text-slate-600'}`} 
                    />
                    <div className="text-[10px] font-bold text-slate-400 tracking-wider">CORTEX-M4</div>
            </div>
            {currentState === TaskState.RUNNING && (
                <>
                    <div className="absolute inset-0 bg-emerald-500/5 mix-blend-overlay animate-pulse"/>
                    <div className="absolute inset-0 border-2 border-emerald-500/50 rounded-2xl"/>
                </>
            )}
        </div>

        {/* 3. BLOCKED (Right) */}
        <div className="absolute right-[8%] top-1/2 -translate-y-1/2 w-[24%] h-[40%] bg-slate-900 border border-slate-700 rounded-xl flex flex-col shadow-lg z-10">
            <div className="h-8 bg-slate-800/50 border-b border-slate-700 flex items-center justify-center">
                <span className={`text-xs font-bold transition-colors ${currentState === TaskState.BLOCKED ? 'text-amber-400' : 'text-slate-500'}`}>BLOCKED</span>
            </div>
            <div className="flex-1 p-2 flex items-center justify-center">
                    <Clock size={32} className={`${currentState === TaskState.BLOCKED ? 'text-amber-500/80' : 'text-slate-700'}`}/>
            </div>
            {currentState === TaskState.BLOCKED && <div className="absolute inset-0 rounded-xl ring-2 ring-amber-500/50 animate-pulse pointer-events-none"/>}
        </div>

        {/* 4. SUSPENDED (Top Right) */}
        <div className="absolute right-[8%] top-[8%] w-[24%] h-[16%] bg-slate-900/50 border border-slate-800 rounded-lg flex items-center justify-center gap-2 z-10">
            <Power size={14} className={`${currentState === TaskState.SUSPENDED ? 'text-rose-500' : 'text-slate-600'}`}/>
            <span className={`text-[10px] font-bold ${currentState === TaskState.SUSPENDED ? 'text-rose-400' : 'text-slate-600'}`}>SUSPENDED</span>
            {currentState === TaskState.SUSPENDED && <div className="absolute inset-0 rounded-lg ring-1 ring-rose-500/50 pointer-events-none"/>}
        </div>

        {/* TCB Card (Moving) */}
        <motion.div
            className="absolute z-50 pointer-events-none"
            initial={false}
            animate={{
                top: getTCBPosition().top,
                left: getTCBPosition().left,
                x: '-50%',
                y: '-50%',
                scale: isAnimating ? 1.1 : 1
            }}
            transition={{ type: "spring", stiffness: 150, damping: 20 }}
        >
            <div className={`
                w-20 h-14 bg-slate-800 rounded-lg border flex flex-col items-center justify-center shadow-2xl relative
                ${currentState === TaskState.RUNNING ? 'border-emerald-500 shadow-emerald-500/20' : 
                    currentState === TaskState.READY ? 'border-sky-500 shadow-sky-500/20' : 
                    currentState === TaskState.BLOCKED ? 'border-amber-500 shadow-amber-500/20' : 
                    'border-rose-500'}
            `}>
                <div className="absolute bottom-full mb-[1px] flex gap-1">
                    <div className="w-1 h-1.5 bg-slate-500 rounded-sm"/>
                    <div className="w-1 h-1.5 bg-slate-500 rounded-sm"/>
                    <div className="w-1 h-1.5 bg-slate-500 rounded-sm"/>
                </div>
                <div className="text-[9px] font-mono text-slate-400">TCB:0x20..</div>
                <div className="text-[10px] font-bold text-white">MainTask</div>
            </div>
        </motion.div>

        {/* Control Bar */}
        <div className="absolute bottom-6 z-40 w-full max-w-md px-4">
            <div className="bg-slate-900/90 backdrop-blur border border-slate-700 p-2 rounded-2xl shadow-xl flex items-center justify-center gap-3">
            {getTransitions().map((t, idx) => (
                <button
                    key={idx}
                    onClick={t.onClick}
                    disabled={isAnimating}
                    className={`
                        flex flex-col items-center justify-center w-16 h-14 rounded-xl border border-transparent transition-all duration-200 group
                        ${isAnimating ? 'opacity-50 cursor-not-allowed' : `hover:bg-slate-800 hover:border-${t.color}-500/30`}
                    `}
                >
                    <t.icon size={18} className={`mb-1 text-${t.color}-500 group-hover:scale-110 transition-transform`} />
                    <span className="text-[10px] font-bold text-slate-300 group-hover:text-white whitespace-nowrap">{t.label}</span>
                </button>
            ))}
            {getTransitions().length === 0 && (
                <div className="flex items-center gap-2 text-slate-500 py-2">
                    <span className="w-2 h-2 bg-slate-600 rounded-full animate-pulse"/>
                    <span className="text-xs">Processing...</span>
                </div>
            )}
            </div>
        </div>
    </div>
  );
};

export default TaskVisualizer;
