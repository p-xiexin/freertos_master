
import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Cpu, 
  Clock, 
  Pause, 
  Play, 
  Zap, 
  RotateCw, 
  Activity,
  Power,
  List,
  ArrowRight
} from 'lucide-react';
import { TaskState } from '../../types';

interface TaskVisualizerProps {
  currentState: TaskState;
  isAnimating: boolean;
  onTransition: (targetState: TaskState, lineNum: number, log: string) => void;
}

const TaskVisualizer: React.FC<TaskVisualizerProps> = ({ currentState, isAnimating, onTransition }) => {
  
  // Define positions for the state nodes (percentages)
  const POSITIONS = {
    READY: { x: '20%', y: '50%' },
    RUNNING: { x: '50%', y: '50%' },
    BLOCKED: { x: '80%', y: '50%' },
    SUSPENDED: { x: '50%', y: '20%' }
  };

  const [tcbPos, setTcbPos] = useState(POSITIONS.READY);

  useEffect(() => {
    setTcbPos(POSITIONS[currentState]);
  }, [currentState]);

  const getTransitions = () => {
    switch(currentState) {
        case TaskState.READY:
            return [{ 
                label: "Schedule", 
                sub: "Scheduler Select",
                icon: Zap,
                color: "emerald",
                onClick: () => onTransition(TaskState.RUNNING, 6, "Scheduler picked highest priority task.") 
            }];
        case TaskState.RUNNING:
            return [
                { 
                    label: "Yield", 
                    sub: "taskYIELD()",
                    icon: RotateCw,
                    color: "sky",
                    onClick: () => onTransition(TaskState.READY, 9, "Task yielded voluntarily.") 
                },
                { 
                    label: "Delay", 
                    sub: "vTaskDelay()",
                    icon: Clock,
                    color: "amber",
                    onClick: () => onTransition(TaskState.BLOCKED, 12, "Task entered Blocked state.") 
                },
                { 
                    label: "Suspend", 
                    sub: "vTaskSuspend()",
                    icon: Pause,
                    color: "rose",
                    onClick: () => onTransition(TaskState.SUSPENDED, 15, "Task suspended explicitly.") 
                }
            ];
        case TaskState.BLOCKED:
            return [
                { 
                    label: "Wake Up", 
                    sub: "ISR / Timeout",
                    icon: Activity,
                    color: "emerald",
                    onClick: () => onTransition(TaskState.READY, 21, "Event received! Moved to Ready list.") 
                }
            ];
        case TaskState.SUSPENDED:
            return [
                { 
                    label: "Resume", 
                    sub: "vTaskResume()",
                    icon: Play,
                    color: "sky",
                    onClick: () => onTransition(TaskState.READY, 20, "Task Resumed by system.") 
                }
            ];
        default: return [];
    }
  };

  return (
    <div className="flex-1 bg-slate-950 relative overflow-hidden flex flex-col items-center justify-center select-none font-sans">
        
        {/* Background Grid */}
        <div className="absolute inset-0 opacity-[0.05]" 
                style={{ 
                    backgroundImage: 'linear-gradient(#64748b 1px, transparent 1px), linear-gradient(90deg, #64748b 1px, transparent 1px)', 
                    backgroundSize: '40px 40px' 
                }}>
        </div>

        {/* Dynamic Connections Layer */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-visible">
            <defs>
                <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto" fill="#475569">
                    <path d="M0,0 L6,3 L0,6 z" />
                </marker>
            </defs>

            {/* Ready <-> Running */}
            <path d="M 28% 50% L 42% 50%" stroke="#334155" strokeWidth="2" markerEnd="url(#arrow)" /> {/* Ready -> Running */}
            <path d="M 45% 58% Q 35% 65% 25% 58%" stroke="#334155" strokeWidth="2" strokeDasharray="4,4" fill="none" markerEnd="url(#arrow)" /> {/* Running -> Ready (Yield) */}

            {/* Running <-> Blocked */}
            <path d="M 58% 50% L 72% 50%" stroke="#334155" strokeWidth="2" markerEnd="url(#arrow)" /> {/* Running -> Blocked */}
            <path d="M 75% 58% Q 50% 80% 25% 58%" stroke="#334155" strokeWidth="2" strokeDasharray="4,4" fill="none" markerEnd="url(#arrow)" /> {/* Blocked -> Ready */}

            {/* Running <-> Suspended */}
            <path d="M 50% 42% L 50% 28%" stroke="#334155" strokeWidth="2" markerEnd="url(#arrow)" /> {/* Running -> Suspended */}
            <path d="M 45% 25% Q 30% 25% 25% 42%" stroke="#334155" strokeWidth="2" strokeDasharray="4,4" fill="none" markerEnd="url(#arrow)" /> {/* Suspended -> Ready */}
            
        </svg>

        {/* === STATE NODES === */}

        {/* 1. READY STATE (Left) */}
        <div className="absolute left-[20%] top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-4 z-10 group">
             <div className={`
                w-32 h-32 rounded-2xl border-2 flex flex-col items-center justify-center relative bg-slate-900 transition-all duration-300
                ${currentState === TaskState.READY ? 'border-sky-500 shadow-[0_0_30px_rgba(14,165,233,0.15)]' : 'border-slate-800 opacity-60'}
             `}>
                 <div className="absolute -top-3 px-2 py-0.5 bg-slate-950 border border-slate-700 rounded text-[10px] font-bold text-slate-400">
                     READY LIST
                 </div>
                 <List size={32} className={currentState === TaskState.READY ? 'text-sky-500' : 'text-slate-600'} />
                 <div className="mt-2 text-xs font-bold text-slate-300">Ready</div>
                 
                 {/* Queue Slots Visualization */}
                 <div className="flex gap-1 mt-2">
                     <div className="w-2 h-6 rounded-sm bg-sky-500/20 border border-sky-500/30"></div>
                     <div className="w-2 h-6 rounded-sm bg-slate-800 border border-slate-700"></div>
                     <div className="w-2 h-6 rounded-sm bg-slate-800 border border-slate-700"></div>
                 </div>
             </div>
        </div>

        {/* 2. CPU / RUNNING (Center) */}
        <div className="absolute left-[50%] top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-4 z-10">
             <div className={`
                w-40 h-40 rounded-3xl border-2 flex flex-col items-center justify-center relative bg-slate-900 transition-all duration-300 overflow-hidden
                ${currentState === TaskState.RUNNING ? 'border-emerald-500 shadow-[0_0_40px_rgba(16,185,129,0.2)]' : 'border-slate-800 opacity-60'}
             `}>
                 {/* Inner Detail */}
                 <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-700 via-slate-900 to-slate-900" />
                 
                 <div className="absolute top-3 flex items-center gap-1.5">
                     <div className={`w-1.5 h-1.5 rounded-full ${currentState === TaskState.RUNNING ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`} />
                     <span className="text-[10px] font-bold text-slate-500">CORTEX-M4</span>
                 </div>

                 <Cpu size={48} strokeWidth={1.5} className={`mb-2 transition-colors ${currentState === TaskState.RUNNING ? 'text-emerald-400' : 'text-slate-600'}`} />
                 <div className="text-sm font-bold text-slate-200">RUNNING</div>
                 
                 {currentState === TaskState.RUNNING && (
                     <div className="absolute inset-x-0 bottom-0 h-1 bg-emerald-500 animate-[pulse_2s_infinite]" />
                 )}
             </div>
        </div>

        {/* 3. BLOCKED (Right) */}
        <div className="absolute left-[80%] top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-4 z-10">
             <div className={`
                w-32 h-32 rounded-2xl border-2 flex flex-col items-center justify-center relative bg-slate-900 transition-all duration-300
                ${currentState === TaskState.BLOCKED ? 'border-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.15)]' : 'border-slate-800 opacity-60'}
             `}>
                 <div className="absolute -top-3 px-2 py-0.5 bg-slate-950 border border-slate-700 rounded text-[10px] font-bold text-slate-400">
                     DELAYED LIST
                 </div>
                 <Clock size={32} className={currentState === TaskState.BLOCKED ? 'text-amber-500' : 'text-slate-600'} />
                 <div className="mt-2 text-xs font-bold text-slate-300">Blocked</div>
                 
                 <div className="mt-2 px-2 py-1 bg-slate-950 rounded border border-slate-800 text-[9px] font-mono text-slate-500">
                     Wake: +100ms
                 </div>
             </div>
        </div>

        {/* 4. SUSPENDED (Top) */}
        <div className="absolute left-[50%] top-[20%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-4 z-10">
             <div className={`
                w-28 h-24 rounded-xl border-2 border-dashed flex flex-col items-center justify-center relative bg-slate-900/50 transition-all duration-300
                ${currentState === TaskState.SUSPENDED ? 'border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.15)]' : 'border-slate-800 opacity-40'}
             `}>
                 <Power size={24} className={currentState === TaskState.SUSPENDED ? 'text-rose-500' : 'text-slate-600'} />
                 <div className="mt-1 text-[10px] font-bold text-slate-300">SUSPENDED</div>
             </div>
        </div>

        {/* === MOVING TCB (The Task) === */}
        <motion.div
            className="absolute z-50 pointer-events-none"
            initial={POSITIONS.READY}
            animate={{
                left: POSITIONS[currentState].x,
                top: POSITIONS[currentState].y,
                x: '-50%',
                y: '-50%',
                scale: isAnimating ? 1.1 : 1,
            }}
            transition={{ type: "spring", stiffness: 120, damping: 15 }}
        >
            <div className={`
                w-24 h-16 bg-[#1e293b] rounded-lg border-l-4 shadow-2xl flex flex-col p-2 relative
                ${currentState === TaskState.RUNNING ? 'border-l-emerald-500 ring-2 ring-emerald-500/20' : 
                    currentState === TaskState.READY ? 'border-l-sky-500 ring-1 ring-sky-500/20' : 
                    currentState === TaskState.BLOCKED ? 'border-l-amber-500 ring-1 ring-amber-500/20' : 
                    'border-l-rose-500 ring-1 ring-rose-500/20'}
            `}>
                <div className="flex items-center justify-between mb-1">
                     <span className="text-[10px] font-bold text-white">MainTask</span>
                     <div className="flex gap-0.5">
                         <div className="w-1 h-1 rounded-full bg-slate-500"/>
                         <div className="w-1 h-1 rounded-full bg-slate-500"/>
                     </div>
                </div>
                <div className="h-[1px] bg-slate-700/50 w-full mb-1.5"/>
                <div className="flex flex-col gap-0.5">
                    <div className="flex justify-between text-[8px] text-slate-400">
                        <span>Prio:</span> <span className="text-slate-200">2</span>
                    </div>
                    <div className="flex justify-between text-[8px] text-slate-400">
                        <span>Stack:</span> <span className="text-slate-200">0x20..</span>
                    </div>
                </div>
                
                {/* State Badge */}
                <div className={`
                    absolute -bottom-2 -right-2 px-1.5 py-0.5 rounded text-[8px] font-bold border shadow-sm
                    ${currentState === TaskState.RUNNING ? 'bg-emerald-900 text-emerald-300 border-emerald-700' : 
                      currentState === TaskState.READY ? 'bg-sky-900 text-sky-300 border-sky-700' :
                      currentState === TaskState.BLOCKED ? 'bg-amber-900 text-amber-300 border-amber-700' :
                      'bg-rose-900 text-rose-300 border-rose-700'}
                `}>
                    TCB
                </div>
            </div>
        </motion.div>


        {/* === CONTROL BAR === */}
        <div className="absolute bottom-8 z-40 w-full flex justify-center px-4">
            <div className="bg-[#1e293b]/90 backdrop-blur-md border border-slate-700 p-2 rounded-2xl shadow-2xl flex items-center gap-3">
                
                {getTransitions().length > 0 ? (
                    getTransitions().map((t, idx) => (
                        <button
                            key={idx}
                            onClick={t.onClick}
                            disabled={isAnimating}
                            className={`
                                flex flex-col items-center justify-center min-w-[80px] h-16 rounded-xl border border-transparent transition-all duration-200 group relative overflow-hidden
                                ${isAnimating ? 'opacity-50 cursor-not-allowed' : `hover:bg-slate-800 hover:border-${t.color}-500/30 active:scale-95`}
                            `}
                        >
                            {/* Background Hover Effect */}
                            <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 bg-${t.color}-500 transition-opacity`}/>
                            
                            <div className={`p-2 rounded-full bg-slate-900 mb-1 group-hover:scale-110 transition-transform shadow-sm border border-slate-800`}>
                                <t.icon size={16} className={`text-${t.color}-500`} />
                            </div>
                            <span className="text-[10px] font-bold text-slate-300 group-hover:text-white">{t.label}</span>
                            <span className="text-[8px] text-slate-500 scale-0 group-hover:scale-100 transition-transform absolute -bottom-4">{t.sub}</span>
                        </button>
                    ))
                ) : (
                    <div className="flex items-center gap-3 px-4 py-2 text-slate-400">
                        <Activity className="animate-pulse text-slate-500" size={18}/>
                        <span className="text-xs font-mono">System State Stable</span>
                    </div>
                )}
            </div>
        </div>

    </div>
  );
};

export default TaskVisualizer;
