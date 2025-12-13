
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Unlock, Crown, AlertTriangle, ArrowUp, Activity, Terminal } from 'lucide-react';

interface InversionVisualizerProps {
  tasks: { id: string, name: string, prio: number, state: string, basePrio: number }[];
  currentTask: string | null;
  mutexOwner: string | null;
  isInheritanceEnabled: boolean;
  stepDescription: string;
  stepType?: string;
}

const InversionVisualizer: React.FC<InversionVisualizerProps> = ({
  tasks, currentTask, mutexOwner, isInheritanceEnabled, stepDescription, stepType
}) => {
  
  // Sort by priority for display (Highest top)
  const sortedDisplay = [...tasks].sort((a,b) => b.prio - a.prio);
  
  // Tasks definitions for colors
  const getColor = (id: string) => {
      if (id === 'H') return 'bg-rose-500 border-rose-400';
      if (id === 'M') return 'bg-amber-500 border-amber-400';
      return 'bg-emerald-500 border-emerald-400';
  };

  const isInheritStep = stepType === 'inherit';
  const isTakeStep = stepType === 'take';

  return (
    <div className="flex-1 bg-slate-950 relative overflow-hidden flex flex-col items-center justify-center p-8 select-none font-sans">
       
       <div className="w-full max-w-4xl flex gap-12 items-end justify-center h-[400px]">
           
           {/* === PRIORITY LADDER === */}
           <div className="flex-1 h-full flex flex-col relative">
                {/* Y-Axis Label */}
                <div className="absolute -left-12 top-0 bottom-0 flex flex-col justify-between text-[10px] text-slate-500 font-bold uppercase py-4">
                    <span>High Priority</span>
                    <ArrowUp size={16} className="self-center"/>
                    <span>Low Priority</span>
                </div>

                {/* Priority Slots */}
                {[3, 2, 1].map(p => (
                    <div key={p} className="flex-1 border-b border-slate-800/50 relative flex items-center px-4">
                        <span className="text-[10px] text-slate-700 font-mono absolute right-2">PRI {p}</span>
                    </div>
                ))}
                
                {/* Floating Tasks */}
                <div className="absolute inset-0">
                    <AnimatePresence>
                        {tasks.map((task) => {
                            // Calculate Y position based on Current Priority (Dynamic Inheritance)
                            const yPos = (3 - task.prio) * 33.3 + 16.6; 
                            const isOwner = mutexOwner === task.id;
                            const isRunning = currentTask === task.id;
                            const isInherited = task.prio > task.basePrio;

                            return (
                                <motion.div
                                    key={task.id}
                                    layoutId={task.id}
                                    initial={false}
                                    animate={{ 
                                        top: `${yPos}%`, 
                                        scale: isRunning ? 1.1 : 1,
                                        opacity: task.state === 'BLOCKED' ? 0.6 : 1
                                    }}
                                    transition={{ type: "spring", stiffness: 120, damping: 15 }}
                                    className={`
                                        absolute left-10 w-32 h-16 rounded-xl border-2 flex items-center justify-between px-3 shadow-lg z-10
                                        ${getColor(task.id)}
                                        ${task.state === 'BLOCKED' ? 'grayscale-[0.5]' : ''}
                                    `}
                                >
                                    <div className="flex flex-col text-white">
                                        <span className="text-sm font-bold">{task.name}</span>
                                        <span className="text-[9px] opacity-80 font-mono">
                                            Pri: {task.basePrio} {isInherited && `-> ${task.prio}`}
                                        </span>
                                    </div>
                                    
                                    {/* Indicators */}
                                    <div className="flex flex-col gap-1">
                                        {isOwner && <Lock size={14} className="text-white fill-white/20"/>}
                                        {isRunning && <Activity size={14} className="text-white animate-pulse"/>}
                                    </div>

                                    {/* Inheritance Glow */}
                                    {isInherited && (
                                        <motion.div 
                                            className="absolute -inset-4 rounded-xl border-2 border-rose-500 bg-rose-500/10 z-[-1]"
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ repeat: Infinity, repeatType: "reverse", duration: 1 }}
                                        >
                                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-rose-500 text-white text-[8px] px-1.5 rounded font-bold whitespace-nowrap">
                                                INHERITED
                                            </div>
                                        </motion.div>
                                    )}

                                </motion.div>
                            )
                        })}
                    </AnimatePresence>
                </div>
           </div>

           {/* === MUTEX STATUS === */}
           <div className="w-48 flex flex-col items-center gap-4">
                <div className={`
                    w-32 h-32 rounded-full border-4 flex flex-col items-center justify-center transition-all duration-300 relative
                    ${mutexOwner ? 'border-rose-500 bg-rose-900/20 shadow-[0_0_30px_rgba(244,63,94,0.2)]' : 'border-emerald-500 bg-emerald-900/20'}
                `}>
                    {mutexOwner ? (
                        <>
                            <Lock size={40} className="text-rose-500 mb-2"/>
                            <span className="text-xs font-bold text-rose-400">LOCKED</span>
                            <span className="text-[10px] text-slate-400">Owner: {tasks.find(t=>t.id===mutexOwner)?.name}</span>
                        </>
                    ) : (
                        <>
                            <Unlock size={40} className="text-emerald-500 mb-2"/>
                            <span className="text-xs font-bold text-emerald-400">FREE</span>
                        </>
                    )}
                </div>
                
                {/* Legend */}
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-[10px] space-y-2 w-full">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-rose-500 rounded-full"/> High Priority (Critical)
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-amber-500 rounded-full"/> Medium Priority (Noise)
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full"/> Low Priority (Worker)
                    </div>
                </div>
           </div>

       </div>

       {/* Integrated Status Bar */}
       <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur-md border border-slate-700 px-6 py-2.5 rounded-full shadow-2xl z-50 flex items-center gap-3 w-max max-w-xl transition-all">
            <div className={`p-1.5 rounded-full transition-colors ${isInheritStep ? 'bg-rose-500/10' : 'bg-sky-500/10'}`}>
                <Terminal size={14} className={isInheritStep ? 'text-rose-400' : 'text-sky-400'}/>
            </div>
            <span className={`text-xs font-mono truncate min-w-[300px] text-center text-slate-200`}>
                {stepDescription}
            </span>
            <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-700 animate-[bounce_1s_infinite]"/>
                <div className="w-1.5 h-1.5 rounded-full bg-slate-700 animate-[bounce_1s_infinite_0.2s]"/>
                <div className="w-1.5 h-1.5 rounded-full bg-slate-700 animate-[bounce_1s_infinite_0.4s]"/>
            </div>
       </div>

    </div>
  );
};

export default InversionVisualizer;
