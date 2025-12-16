
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Unlock, Key, Layers, ArrowDown, ArrowUp, Ticket, Terminal } from 'lucide-react';

interface SemaphoreVisualizerProps {
  type: 'BINARY' | 'COUNTING' | 'MUTEX';
  tokens: number;
  maxTokens: number;
  blockedTasks: string[];
  owner: string | null;
  tasks: { id: string, name: string, status: string }[];
  activeTask: string | null;
  stepDescription: string;
  stepMode: string;
}

const SemaphoreVisualizer: React.FC<SemaphoreVisualizerProps> = ({
  type, tokens, maxTokens, blockedTasks, owner, tasks, activeTask, stepDescription, stepMode
}) => {

  const isCounting = type === 'COUNTING';
  
  return (
    <div className="flex-1 bg-slate-950 relative overflow-hidden flex flex-col items-center justify-center p-8 select-none">
      
      {/* Background Grid */}
      <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(#6366f1 1px, transparent 1px)', backgroundSize: '30px 30px' }}/>

      {/* Connection Lines (Static SVG) */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
          <line x1="50%" y1="20%" x2="50%" y2="80%" stroke="#334155" strokeWidth="2" strokeDasharray="5,5" />
      </svg>

      <div className="w-full max-w-5xl grid grid-cols-3 gap-8 z-10 h-full items-center">
         
         {/* === LEFT: Tasks (Consumers/Takers) === */}
         <div className="flex flex-col gap-6 items-end">
            {tasks.filter(t => t.id.includes('Take')).map(task => {
                const isBlocked = blockedTasks.includes(task.id);
                const isActive = activeTask === task.id;
                
                return (
                    <div key={task.id} className="relative group">
                        <div 
                            className={`
                                relative w-48 p-3 rounded-xl border-2 transition-all flex items-center justify-between
                                ${isActive ? 'bg-sky-900/30 border-sky-500 shadow-[0_0_15px_rgba(14,165,233,0.3)] scale-105' : 
                                  isBlocked ? 'bg-amber-900/10 border-amber-500/50 opacity-80' : 
                                  'bg-slate-900 border-slate-700 opacity-60'}
                            `}
                        >
                            <div className="flex flex-col items-start">
                                <span className={`text-xs font-bold ${isBlocked ? 'text-amber-500' : isActive ? 'text-sky-400' : 'text-slate-500'}`}>
                                    {task.name}
                                </span>
                                <span className="text-[10px] text-slate-500 font-mono">
                                    {isBlocked ? 'Blocked' : isActive ? 'Executing...' : 'Idle'}
                                </span>
                            </div>
                            
                            {isBlocked ? (
                                <Lock size={16} className="text-amber-500 animate-pulse"/>
                            ) : (
                                <ArrowRightIcon className={`transition-transform ${isActive ? 'text-sky-500 translate-x-1' : 'text-slate-600'}`}/>
                            )}

                            {/* Active Indicator */}
                            {isActive && (
                                <motion.div layoutId="active-indicator" className="absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-8 bg-sky-500 rounded-full shadow-lg"/>
                            )}
                        </div>
                    </div>
                )
            })}
         </div>

         {/* === CENTER: Semaphore Object === */}
         <div className="flex flex-col items-center justify-center">
            <div className={`
                w-64 h-64 rounded-3xl border-4 flex flex-col items-center justify-center relative shadow-2xl backdrop-blur-sm transition-colors duration-500
                ${tokens > 0 
                    ? 'bg-slate-900/80 border-sky-500 shadow-sky-500/20' 
                    : 'bg-slate-900/90 border-slate-700 shadow-none'}
            `}>
                <div className="absolute -top-10 text-center">
                    <span className="text-sm font-bold text-slate-400 tracking-widest uppercase block mb-1">
                        {isCounting ? 'Counting Sem' : type === 'MUTEX' ? 'Mutex' : 'Binary Sem'}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${tokens > 0 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border-rose-500/30'}`}>
                        xSemaphoreHandle
                    </span>
                </div>

                {isCounting ? (
                    // Counting Visualization (Parking Lot / Tickets)
                    <div className="grid grid-cols-3 gap-2 p-4">
                        {Array.from({ length: maxTokens }).map((_, i) => (
                            <div key={i} className={`
                                w-10 h-10 rounded border flex items-center justify-center transition-all duration-300
                                ${i < tokens 
                                    ? 'bg-sky-500 text-slate-900 border-sky-400 shadow-[0_0_10px_rgba(14,165,233,0.5)] scale-100' 
                                    : 'bg-slate-800 border-slate-700 opacity-30 scale-90'}
                            `}>
                                <Ticket size={18} fill={i < tokens ? "currentColor" : "none"} />
                            </div>
                        ))}
                    </div>
                ) : (
                    // Binary/Mutex Visualization (Big Lock)
                    <div className="relative">
                         {tokens > 0 ? (
                             <motion.div 
                                initial={{ scale: 0 }} animate={{ scale: 1 }}
                                className="text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.6)]"
                             >
                                 <Unlock size={80} strokeWidth={1.5} />
                             </motion.div>
                         ) : (
                             <motion.div 
                                initial={{ scale: 0 }} animate={{ scale: 1 }}
                                className="text-rose-500 drop-shadow-[0_0_15px_rgba(244,63,94,0.4)]"
                             >
                                 <Lock size={80} strokeWidth={1.5} />
                             </motion.div>
                         )}
                    </div>
                )}

                <div className="absolute -bottom-4 bg-slate-800 text-slate-300 px-3 py-1 rounded-full border border-slate-700 text-xs font-mono shadow-lg">
                    uxMessagesWaiting: <span className="text-white font-bold">{tokens}</span>
                </div>
            </div>

            {/* Blocked Queue Indicator */}
            {blockedTasks.length > 0 && (
                <motion.div 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="mt-8 bg-amber-900/20 border border-amber-500/30 rounded-xl p-3 w-64"
                >
                    <div className="text-[10px] text-amber-500 font-bold uppercase mb-2 flex items-center gap-2">
                        <Layers size={12}/> Blocked List (xTasksWaiting...)
                    </div>
                    <div className="space-y-1">
                        {blockedTasks.map(tid => (
                            <div key={tid} className="bg-amber-500/10 text-amber-200 text-xs px-2 py-1.5 rounded flex items-center justify-between">
                                <span>{tasks.find(t=>t.id===tid)?.name}</span>
                                <Lock size={10} />
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}
         </div>

         {/* === RIGHT: Givers (Producers/Releasers) === */}
         <div className="flex flex-col gap-6 items-start">
            {tasks.filter(t => t.id.includes('Give')).map(task => {
                 const isActive = activeTask === task.id;

                 return (
                    <div key={task.id}>
                        <div 
                            className={`
                                relative w-48 p-3 rounded-xl border-2 transition-all flex items-center justify-between flex-row-reverse
                                ${isActive ? 'bg-emerald-900/30 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)] scale-105' : 'bg-slate-900 border-slate-700 opacity-60'}
                            `}
                        >
                            <div className="flex flex-col items-end">
                                <span className={`text-xs font-bold ${isActive ? 'text-emerald-400' : 'text-slate-500'}`}>{task.name}</span>
                                <span className="text-[10px] text-slate-500 font-mono">Producer</span>
                            </div>
                            <ArrowLeftIcon className={`transition-transform ${isActive ? 'text-emerald-500 -translate-x-1' : 'text-slate-600'}`} />
                            
                             {/* Active Indicator */}
                             {isActive && (
                                <motion.div layoutId="active-indicator" className="absolute -right-2 top-1/2 -translate-y-1/2 w-1 h-8 bg-emerald-500 rounded-full shadow-lg"/>
                            )}
                        </div>
                    </div>
                 )
            })}
         </div>

      </div>

      {/* Integrated Status Bar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur-md border border-slate-700 px-6 py-2.5 rounded-full shadow-2xl z-50 flex items-center gap-3 w-max max-w-xl transition-all">
            <div className={`p-1.5 rounded-full transition-colors ${stepMode === 'TAKE' ? 'bg-rose-500/10' : 'bg-emerald-500/10'}`}>
                <Terminal size={14} className={stepMode === 'TAKE' ? 'text-rose-400' : 'text-emerald-400'}/>
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

const ArrowRightIcon = ({ className }: { className?: string }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
);

const ArrowLeftIcon = ({ className }: { className?: string }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
);

export default SemaphoreVisualizer;
