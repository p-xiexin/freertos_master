
import React, { useRef, useLayoutEffect, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Zap, Timer, Shield, ShieldAlert, ArrowDown, Layers, Clock, Activity, Hash, Terminal, FastForward } from 'lucide-react';
import { SimTask } from '../../data/schedulerData';
import DebugToolbar from '../DebugToolbar';

interface SchedulerVisualizerProps {
  tickCount: number;
  tasks: SimTask[];
  currentTaskId: number;
  isRunning: boolean;
  onToggleRun: () => void;
  onStepTick: () => void;
  onReset: () => void;
  
  // New props
  statusLog: string;
  isCritical: boolean;
  pendingInterrupt: boolean;
  isExecutingISR: boolean;
  triggerInterrupt: () => void;
  isFastForwarding?: boolean;
}

const SchedulerVisualizer: React.FC<SchedulerVisualizerProps> = ({
  tickCount,
  tasks,
  currentTaskId,
  isRunning,
  onToggleRun,
  onStepTick,
  onReset,
  statusLog,
  isCritical,
  pendingInterrupt,
  isExecutingISR,
  triggerInterrupt,
  isFastForwarding = false
}) => {
  
  const priorities = [2, 1, 0];
  const getTaskInReady = (prio: number) => tasks.filter(t => t.priority === prio && t.state === 'READY');
  const runningTask = tasks.find(t => t.id === currentTaskId);
  const blockedTasks = tasks.filter(t => t.state === 'BLOCKED');
  
  // Refs for dynamic line drawing
  const containerRef = useRef<HTMLDivElement>(null);
  const btnWrapperRef = useRef<HTMLDivElement>(null);
  const cpuRef = useRef<HTMLDivElement>(null);
  const [interruptPath, setInterruptPath] = useState("");

  // Simulated High-Frequency CPU Cycle Counter
  const [cpuCycles, setCpuCycles] = useState(0);

  // Cycle Counter Effect (Visual Only - to show "us" level speed)
  useEffect(() => {
    let interval: number;
    if (isRunning || isFastForwarding) {
        // Increment cycles rapidly to simulate MHz clock speed visually
        interval = window.setInterval(() => {
            setCpuCycles(prev => prev + (isFastForwarding ? 200000 : 72000)); 
        }, 50);
    }
    return () => clearInterval(interval);
  }, [isRunning, isFastForwarding]);

  // Calculate the trace path dynamically based on component positions
  useLayoutEffect(() => {
    const updatePath = () => {
        if (containerRef.current && btnWrapperRef.current && cpuRef.current) {
            const cont = containerRef.current.getBoundingClientRect();
            const btn = btnWrapperRef.current.getBoundingClientRect();
            const cpu = cpuRef.current.getBoundingClientRect();

            // Button is 64px (w-16), so radius is 32px.
            // It is the first element in the wrapper.
            const btnRadius = 32;
            const btnCenterX = btn.left + btn.width / 2;
            const btnCenterY = btn.top + btnRadius;

            // Start from the RIGHT side of the button
            const startX = btnCenterX + btnRadius - cont.left;
            const startY = btnCenterY - cont.top;
            
            // Target the bottom-center of the CPU
            const endX = (cpu.left + cpu.width / 2) - cont.left; 
            const endY = cpu.bottom - cont.top; 

            // Create a path: Right -> Up
            const path = `M ${startX} ${startY} L ${endX} ${startY} L ${endX} ${endY}`;
            setInterruptPath(path);
        }
    };

    // Initial calculation
    updatePath();

    // Use ResizeObserver for robust layout tracking
    const observer = new ResizeObserver(updatePath);
    if (containerRef.current) observer.observe(containerRef.current);
    
    // Fallback window resize
    window.addEventListener('resize', updatePath);
    
    return () => {
        window.removeEventListener('resize', updatePath);
        observer.disconnect();
    };
  }, []);

  return (
    <div ref={containerRef} className="flex-1 bg-slate-950 relative overflow-hidden flex flex-col font-sans select-none">       
       {/* === PCB Layer === */}
       <div className="absolute inset-0 z-0 pointer-events-none">
            {/* Grid */}
            <div className="absolute inset-0 opacity-[0.05]" 
                style={{ 
                    backgroundImage: 'linear-gradient(#4f46e5 1px, transparent 1px), linear-gradient(90deg, #4f46e5 1px, transparent 1px)', 
                    backgroundSize: '40px 40px' 
                }}
            />
            
            <svg className="absolute inset-0 w-full h-full overflow-visible">
                <defs>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                        <feMerge>
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                    <marker id="arrow-head" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                        <path d="M0,0 L0,6 L9,3 z" fill="#ef4444" />
                    </marker>
                </defs>
                
                {/* DYNAMIC INTERRUPT LINE */}
                {interruptPath && (
                    <>
                        <path d={interruptPath} fill="none" stroke={pendingInterrupt || isExecutingISR ? "#ef4444" : "#334155"} strokeWidth="3" strokeDasharray={pendingInterrupt ? "8 4" : "0"} markerEnd="url(#arrow-head)"/>
                        {/* Interrupt Electron Animation */}
                        {pendingInterrupt && (
                            <motion.circle r="4" fill="#ef4444" filter="url(#glow)">
                                <animateMotion 
                                    dur="0.5s" 
                                    repeatCount="indefinite"
                                    path={interruptPath}
                                />
                            </motion.circle>
                        )}
                    </>
                )}
            </svg>
       </div>

       <DebugToolbar
         isPlaying={isRunning}
         onTogglePlay={onToggleRun}
         onNext={onStepTick}
         onReset={() => { onReset(); setCpuCycles(0); }}
         canPrev={false}
         canNext={true}
         canFinish={false}
       />

       {/* Floating Tick Counter (Top Right) */}
       <div className="absolute top-6 right-6 z-40 flex flex-col gap-2">
           
           {/* Primary: RTOS Tick */}
           <motion.div 
                key={tickCount} // Animate on change
                initial={{ scale: 1.1, borderColor: '#38bdf8' }}
                animate={{ scale: 1, borderColor: isFastForwarding ? '#fbbf24' : 'rgba(51, 65, 85, 0.5)' }}
                className={`bg-slate-900/90 backdrop-blur-md border border-slate-700/50 rounded-xl px-5 py-3 shadow-[0_0_30px_rgba(0,0,0,0.5)] flex items-center gap-4 group transition-colors ${isFastForwarding ? 'border-amber-500/50 shadow-amber-500/10' : 'hover:border-sky-500/30'}`}
           >
               <div className="relative">
                   <div className={`absolute inset-0 bg-sky-500 rounded-full blur-md opacity-20 group-hover:opacity-40 transition-opacity ${isRunning ? 'animate-pulse' : ''}`} />
                   <div className="bg-slate-800 p-2 rounded-lg border border-slate-700 relative text-sky-400">
                       <Timer size={20} className={isRunning ? "animate-[spin_3s_linear_infinite]" : ""} />
                   </div>
               </div>
               <div className="flex flex-col min-w-[140px]">
                   <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-0.5 flex items-center justify-between">
                      System Tick
                      {isFastForwarding && <span className="flex items-center gap-1 text-amber-500"><FastForward size={10} className="animate-pulse"/> x10</span>}
                      {isRunning && !isFastForwarding && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"/>}
                   </span>
                   <div className="flex items-baseline gap-2">
                       <span className={`font-mono font-bold text-2xl leading-none tracking-tight ${isFastForwarding ? 'text-amber-400' : 'text-white'}`}>{tickCount}</span>
                       <div className="flex flex-col items-start">
                         <span className="text-[9px] text-slate-600 font-mono">xTickCount</span>
                       </div>
                   </div>
                   
                   {/* Configuration Context */}
                   <div className="text-[9px] text-slate-500 font-mono mt-1 border-t border-slate-800 pt-1">
                      configTICK_RATE_HZ = 1000
                   </div>
               </div>
           </motion.div>

           {/* Secondary: CPU Cycles (Simulated High Res) */}
           <div className="bg-slate-950/80 backdrop-blur border border-slate-800 rounded-lg px-4 py-2 flex items-center gap-3 opacity-80 hover:opacity-100 transition-opacity">
                <div className="bg-slate-900 p-1.5 rounded border border-slate-800">
                    <Hash size={14} className="text-slate-500"/>
                </div>
                <div className="flex flex-col">
                    <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">CPU Cycles (72MHz)</span>
                    <span className="font-mono text-xs text-slate-400">
                        {cpuCycles.toLocaleString()}
                    </span>
                </div>
           </div>
       </div>

       {/* Status Log Bar (New) */}
       <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur-md border border-slate-700 px-6 py-2.5 rounded-full shadow-2xl z-50 flex items-center gap-3 w-max max-w-xl">
            <div className={`p-1.5 rounded-full transition-colors ${isFastForwarding ? 'bg-amber-500/10' : 'bg-sky-500/10'}`}>
                {isFastForwarding ? <FastForward size={14} className="text-amber-400"/> : <Terminal size={14} className="text-sky-400"/>}
            </div>
            <span className={`text-xs font-mono truncate min-w-[300px] text-center ${isFastForwarding ? 'text-amber-300 font-bold' : 'text-slate-200'}`}>
                {isFastForwarding ? "Skipping Idle Ticks (Low Power Mode)..." : statusLog}
            </span>
            <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-700 animate-[bounce_1s_infinite]"/>
                <div className="w-1.5 h-1.5 rounded-full bg-slate-700 animate-[bounce_1s_infinite_0.2s]"/>
                <div className="w-1.5 h-1.5 rounded-full bg-slate-700 animate-[bounce_1s_infinite_0.4s]"/>
            </div>
       </div>

       {/* TRIGGER BUTTON (Bottom Left) */}
       <div ref={btnWrapperRef} className="absolute bottom-12 left-12 z-40 flex flex-col items-center group">
            <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-slate-200 text-xs px-2 py-1 rounded mb-2 border border-slate-700 pointer-events-none whitespace-nowrap">
                Click to Trigger Hardware Interrupt
            </div>
            <button
                onClick={triggerInterrupt}
                disabled={isExecutingISR || pendingInterrupt}
                className={`
                    w-16 h-16 rounded-full border-4 shadow-[0_0_30px_rgba(239,68,68,0.3)]
                    flex items-center justify-center transition-all duration-100 active:scale-95
                    ${isExecutingISR || pendingInterrupt 
                        ? 'bg-red-900/50 border-red-900 text-red-700 cursor-not-allowed' 
                        : 'bg-red-600 hover:bg-red-500 border-red-800 text-white hover:scale-105 cursor-pointer'}
                `}
            >
                <Zap size={28} fill="currentColor" className={pendingInterrupt ? "animate-ping" : ""}/>
            </button>
            <div className="mt-2 text-center bg-slate-900/80 backdrop-blur px-3 py-1 rounded-full border border-slate-800">
                <div className="text-xs font-bold text-red-500">EXTI Line 0</div>
                <div className="text-[9px] text-slate-500 uppercase tracking-widest">Hardware IRQ</div>
            </div>
       </div>

       {/* Main Stage */}
       <div className="flex-1 flex items-center justify-center p-8 gap-20 relative z-10 w-full max-w-[1400px] mx-auto">
            
            {/* LEFT: Ready Lists */}
            <div className="flex flex-col gap-6 w-72">
                <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-indigo-500/10 rounded border border-indigo-500/20">
                        <Zap size={14} className="text-indigo-400"/>
                    </div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ready Queue</span>
                </div>
                
                {priorities.map(p => (
                    <div key={p} className="relative group">
                        <div className="absolute -left-3 top-1/2 -translate-y-1/2 -translate-x-full pr-3 flex items-center">
                            <span className="text-[10px] font-mono text-slate-600">PRI {p}</span>
                            <div className="w-2 h-[1px] bg-slate-700 ml-2"/>
                        </div>
                        <div className="bg-[#13141f] border border-slate-800 rounded-xl p-1.5 min-h-[64px] flex items-center relative shadow-inner overflow-hidden">
                            {getTaskInReady(p).length === 0 && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-full h-[1px] bg-slate-800/50 dashed-line"/>
                                </div>
                            )}
                            <AnimatePresence mode="popLayout">
                                {getTaskInReady(p).map(task => (
                                    <motion.div
                                        key={task.id}
                                        layoutId={`task-${task.id}`}
                                        initial={{ opacity: 0, scale: 0.8, x: -40 }}
                                        animate={{ opacity: 1, scale: 1, x: 0 }}
                                        exit={{ opacity: 0, scale: 0.8, x: 40 }}
                                        className={`relative flex-shrink-0 w-full h-12 rounded-lg ${task.color} flex items-center justify-between px-3 mr-2 z-10 border border-white/10`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-white"/>
                                            <span className="text-xs font-bold text-white">{task.name}</span>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>
                ))}
            </div>

            {/* CENTER: CPU Core */}
            <div className="flex flex-col items-center justify-center relative">
                 
                 {/* CRITICAL SECTION SHIELD */}
                 <AnimatePresence>
                     {isCritical && (
                         <motion.div 
                            initial={{ opacity: 0, scale: 1.1 }}
                            animate={{ opacity: 1, scale: 1.2 }}
                            exit={{ opacity: 0, scale: 1.1 }}
                            className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center"
                         >
                             <div className="w-72 h-72 rounded-full border-2 border-yellow-500/50 bg-yellow-500/5 shadow-[0_0_50px_rgba(234,179,8,0.2)] animate-pulse"/>
                             <div className="absolute -top-8 bg-yellow-900/80 text-yellow-400 px-3 py-1 rounded-full text-xs font-bold border border-yellow-500/50 flex items-center gap-2">
                                <ShieldAlert size={14}/> INTERRUPTS MASKED
                             </div>
                         </motion.div>
                     )}
                 </AnimatePresence>

                 {/* CPU Container */}
                 <div ref={cpuRef} className={`w-64 h-64 bg-slate-900 rounded-3xl border-2 transition-colors duration-300 relative shadow-2xl overflow-hidden flex flex-col z-20 ${isExecutingISR ? 'border-red-500 shadow-red-900/20' : isCritical ? 'border-yellow-600' : 'border-slate-700'}`}>
                      
                      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#64748b 1px, transparent 1px)', backgroundSize: '8px 8px' }}/>

                      {/* CPU Header */}
                      <div className={`h-10 border-b flex items-center justify-between px-4 z-10 ${isExecutingISR ? 'bg-red-900/20 border-red-900' : 'bg-slate-800 border-slate-700'}`}>
                          <div className="flex items-center gap-2">
                              <Cpu size={14} className="text-slate-400"/>
                              <span className="text-[10px] font-bold text-slate-300 tracking-widest">CORTEX-M3</span>
                          </div>
                          {isExecutingISR && <span className="text-[9px] font-bold text-red-500 animate-pulse">ISR ACTIVE</span>}
                      </div>

                      {/* Main Execution Unit */}
                      <div className="flex-1 p-4 relative flex flex-col items-center justify-center">
                          <div className={`absolute inset-0 transition-opacity duration-300 ${runningTask ? 'opacity-10' : 'opacity-0'} ${runningTask?.color.replace('bg-', 'bg-')}`}/>
                          
                          <div className="w-full h-full border border-dashed border-slate-700 rounded-xl flex items-center justify-center relative bg-black/20">
                                <AnimatePresence mode="wait">
                                    {isExecutingISR ? (
                                        <motion.div
                                            key="isr"
                                            initial={{ y: -50, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            exit={{ y: 50, opacity: 0 }}
                                            className="w-full h-full rounded-xl bg-red-600 flex flex-col items-center justify-center text-white border border-red-400 shadow-lg"
                                        >
                                            <Zap size={32} fill="white" className="mb-2"/>
                                            <span className="text-sm font-bold">EXTI0_IRQHandler</span>
                                            <span className="text-[9px] mt-1 bg-black/20 px-2 rounded">Hardware Context</span>
                                        </motion.div>
                                    ) : runningTask ? (
                                        <motion.div
                                            key={runningTask.id}
                                            layoutId={`task-${runningTask.id}`}
                                            className={`
                                                w-full h-full rounded-xl ${runningTask.color} 
                                                flex flex-col items-center justify-center text-white 
                                                shadow-[inset_0_0_20px_rgba(0,0,0,0.2)] border border-white/20
                                            `}
                                        >
                                            <span className="text-3xl mb-2"><Cpu size={32} strokeWidth={1.5}/></span>
                                            <span className="text-sm font-bold tracking-wider">{runningTask.name}</span>
                                            {isCritical && (
                                                <motion.div 
                                                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                                                    className="absolute top-2 right-2 bg-yellow-400 text-black p-1 rounded-full"
                                                >
                                                    <Shield size={12}/>
                                                </motion.div>
                                            )}
                                        </motion.div>
                                    ) : (
                                        <motion.div 
                                            key="idle" 
                                            initial={{ opacity: 0 }} 
                                            animate={{ opacity: 1 }}
                                            className="flex flex-col items-center text-slate-600"
                                        >
                                            <Layers size={24} className="mb-2 opacity-50"/>
                                            <span className="text-[10px] font-mono uppercase">Context Switch</span>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                          </div>
                      </div>

                      {/* Register Banks */}
                      <div className="h-8 bg-[#0a0a0a] border-t border-slate-800 flex items-center px-2 gap-1 overflow-hidden">
                          {Array.from({length: 8}).map((_, i) => (
                              <div key={i} className="flex-1 h-3 bg-slate-800 rounded-sm relative overflow-hidden">
                                  {(runningTask || isExecutingISR) && (
                                      <motion.div 
                                        className={`absolute inset-0 ${isExecutingISR ? 'bg-red-500/50' : 'bg-emerald-500/50'}`}
                                        animate={{ opacity: [0.2, 0.8, 0.2] }}
                                        transition={{ duration: 0.2, repeat: Infinity, delay: i * 0.05 }}
                                      />
                                  )}
                              </div>
                          ))}
                      </div>
                 </div>
                 
                 {/* Blocked Interrupt Indicator */}
                 <AnimatePresence>
                     {pendingInterrupt && isCritical && (
                        <motion.div 
                            initial={{ y: -20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute -top-16 bg-red-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-2"
                        >
                            <ArrowDown size={14}/> ISR PENDING (BLOCKED)
                        </motion.div>
                     )}
                 </AnimatePresence>
            </div>

            {/* RIGHT: Blocked List */}
            <div className="flex flex-col gap-4 w-72">
                 {/* Same Blocked list visualization as before */}
                <div className="flex items-center gap-2 mb-2 justify-end">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Blocked / Delayed</span>
                    <div className="p-1.5 bg-amber-500/10 rounded border border-amber-500/20">
                        <Clock size={14} className="text-amber-400"/>
                    </div>
                </div>

                <div className="bg-[#13141f] border border-slate-800 rounded-xl p-4 min-h-[300px] relative shadow-inner flex flex-col gap-3">
                     {blockedTasks.map((task, idx) => (
                         <motion.div 
                            key={task.id} 
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="relative h-12 rounded-lg bg-slate-800/80 border border-slate-700 flex items-center justify-between px-3 overflow-hidden"
                         >
                             {/* Progress bar background hint */}
                             <div className="absolute inset-0 bg-amber-500/5" style={{ width: '100%' }} /> 
                             
                             <div className="flex items-center gap-2 z-10">
                                 <Clock size={12} className="text-slate-500"/>
                                 <span className="text-xs text-slate-300 font-bold">{task.name}</span>
                             </div>
                             <div className="z-10 flex flex-col items-end">
                                 <span className="text-[9px] text-slate-500 uppercase">Wake @</span>
                                 <span className={`text-xs font-mono font-bold ${task.wakeTick <= tickCount ? 'text-emerald-400 animate-pulse' : 'text-amber-500'}`}>{task.wakeTick}</span>
                             </div>
                         </motion.div>
                     ))}
                     {blockedTasks.length === 0 && <div className="text-center text-xs text-slate-600 mt-10">No Blocked Tasks</div>}
                </div>
            </div>

       </div>
    </div>
  );
};

export default SchedulerVisualizer;
