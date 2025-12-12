
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, ArrowRight, ArrowLeft, Database } from 'lucide-react';
import { TOTAL_STEPS } from '../../data/contextSwitchingData';
import DebugToolbar from '../DebugToolbar';

interface VisualizerProps {
  step: number;
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  reset: () => void;
  isPlaying: boolean;
  togglePlay: () => void;
}

const Visualizer: React.FC<VisualizerProps> = ({ step, setStep, nextStep, prevStep, reset, isPlaying, togglePlay }) => {
  
  // Logic
  const isTaskA = step < 7;
  const isSaving = step >= 3 && step <= 4;
  const isRestoring = step >= 11 && step <= 13;
  const isKernelTime = step >= 5 && step <= 9;

  // Status Text
  const getStatus = () => {
    if (step === 0) return "Interrupt Entry (PendSV)";
    if (step < 3) return "Reading PSP (Task A)";
    if (step < 5) return "SAVING Context (R4-R11) -> Stack A";
    if (step < 7) return "Saving Stack Pointer -> TCB A";
    if (step === 7) return "KERNEL: Selecting Next Task";
    if (step < 10) return "Restoring Kernel Context";
    if (step < 11) return "Loading Stack Pointer <- TCB B";
    if (step < 13) return "RESTORING Context (R4-R11) <- Stack B";
    return "Exception Return (Hardware Restore)";
  };

  return (
    <div className="flex-1 bg-slate-950 relative overflow-hidden flex flex-col font-sans select-none">
      
      <DebugToolbar 
        onReset={reset}
        onNext={nextStep}
        isPlaying={isPlaying}
        onTogglePlay={togglePlay}
        canNext={step < TOTAL_STEPS - 1}
      />

      {/* Background Grid */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: 'linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
      </div>

      {/* Main Stage - Centered Grid */}
      <div className="flex-1 flex items-center justify-center p-8 relative z-10">
         <div className="grid grid-cols-[240px_1fr_240px] gap-12 items-start w-full max-w-6xl h-[500px]">
            
            {/* === LEFT: TASK A STACK === */}
            <StackColumn 
               taskName="Task A" 
               color="violet" 
               isActive={isTaskA && !isKernelTime} 
               hasHW={true}
               hasSW={step >= 3}
               showPSP={step < 7}
               // Base offset (header) + HW Frame (60) + SW Frame (60)
               // Grows DOWN
               pspOffset={step >= 3 ? 150 : 90} 
            />

            {/* === CENTER: CPU & BUS === */}
            <div className="flex flex-col items-center gap-8 relative h-full justify-center">
               
               {/* TCB Pointer Switcher */}
               <div className="relative bg-slate-900 border border-slate-700 rounded-full px-6 py-2 flex items-center gap-4 shadow-xl z-20">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">pxCurrentTCB</span>
                  <div className="flex items-center gap-2">
                     <span className={`text-sm font-mono font-bold transition-colors duration-300 ${isTaskA ? 'text-violet-400' : 'text-slate-600'}`}>Task A</span>
                     <div className="relative w-12 h-6 bg-slate-800 rounded-full p-1 border border-slate-700">
                        <motion.div 
                           className={`w-4 h-4 rounded-full shadow-sm ${isTaskA ? 'bg-violet-500' : 'bg-emerald-500'}`}
                           animate={{ x: isTaskA ? 0 : 24 }}
                        />
                     </div>
                     <span className={`text-sm font-mono font-bold transition-colors duration-300 ${!isTaskA ? 'text-emerald-400' : 'text-slate-600'}`}>Task B</span>
                  </div>
               </div>

               {/* Data Bus Lines (SVG Overlay) */}
               <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-visible">
                  {/* Bus to A (Left) */}
                  <motion.path 
                     d="M -20 280 L 150 280" // Relative to container center
                     stroke={isSaving || (step === 1) ? "#8b5cf6" : "#334155"} 
                     strokeWidth={isSaving ? 4 : 2}
                     strokeDasharray={isSaving ? "0" : "4,4"}
                     initial={{ pathLength: 0, opacity: 0 }}
                     animate={{ pathLength: 1, opacity: 1 }}
                  />
                   {/* Bus to B (Right) */}
                   <motion.path 
                     d="M 250 280 L 420 280" 
                     stroke={isRestoring || (step === 10) ? "#10b981" : "#334155"} 
                     strokeWidth={isRestoring ? 4 : 2}
                     strokeDasharray={isRestoring ? "0" : "4,4"}
                     initial={{ pathLength: 0, opacity: 0 }}
                     animate={{ pathLength: 1, opacity: 1 }}
                  />
                  {/* Moving Particles */}
                  {isSaving && (
                     <motion.circle r="4" fill="#8b5cf6">
                        <animateMotion path="M 150 280 L -20 280" dur="0.5s" repeatCount="indefinite" />
                     </motion.circle>
                  )}
                  {isRestoring && (
                     <motion.circle r="4" fill="#10b981">
                        <animateMotion path="M 420 280 L 250 280" dur="0.5s" repeatCount="indefinite" />
                     </motion.circle>
                  )}
               </svg>

               {/* CPU Core */}
               <div className="w-64 bg-slate-900 border-2 border-slate-700 rounded-2xl p-1 relative shadow-2xl z-10 group mt-4">
                  {/* Glow effect */}
                  <div className={`absolute -inset-[1px] rounded-2xl opacity-30 blur transition-colors duration-500 ${isTaskA ? 'bg-violet-500' : 'bg-emerald-500'}`} />
                  
                  <div className="bg-slate-900 rounded-xl p-4 relative overflow-hidden">
                     <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-2">
                        <span className="text-xs font-bold text-slate-400 flex items-center gap-1"><Cpu size={14}/> CORTEX-M4</span>
                        <span className={`text-[10px] px-1.5 rounded font-mono ${isTaskA ? 'bg-violet-900/30 text-violet-400' : 'bg-emerald-900/30 text-emerald-400'}`}>
                           {isTaskA ? 'CTX: A' : 'CTX: B'}
                        </span>
                     </div>

                     {/* Internal Registers */}
                     <div className="space-y-2">
                        {/* Caller Saved */}
                        <div className="flex items-center justify-between text-[10px] text-slate-500 bg-slate-950/50 p-2 rounded border border-slate-800">
                           <span>R0-R3, PC, LR</span>
                           <span className={step === 13 ? 'text-emerald-400 animate-pulse' : 'text-slate-600'}>
                              {step === 13 ? 'Hardware Restore' : '......'}
                           </span>
                        </div>
                        {/* Callee Saved */}
                        <div className={`flex items-center justify-between text-[10px] p-2 rounded border transition-colors duration-300 ${isSaving || isRestoring ? 'bg-sky-900/20 border-sky-500/50' : 'bg-slate-950/50 border-slate-800 text-slate-500'}`}>
                           <span className={isSaving || isRestoring ? 'text-sky-300 font-bold' : ''}>R4 - R11</span>
                           <span className="font-mono">
                              {isSaving ? <span className="text-violet-400">Saving...</span> : isRestoring ? <span className="text-emerald-400">Restoring...</span> : 'Held'}
                           </span>
                        </div>
                        {/* PSP */}
                        <div className="flex items-center justify-between text-[10px] text-amber-500 bg-amber-900/10 p-2 rounded border border-amber-900/30">
                           <span className="font-bold">PSP</span>
                           <span className="font-mono">
                              {isTaskA ? (step >= 3 ? '0x...F0' : '0x...08') : (step >= 12 ? '0x...08' : '0x...F0')}
                           </span>
                        </div>
                     </div>
                  </div>
               </div>

               {/* Status Text */}
               <motion.div 
                 key={getStatus()}
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="bg-slate-800/80 backdrop-blur px-4 py-2 rounded-lg border border-slate-700 text-center mt-8"
               >
                  <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-0.5">Current Operation</div>
                  <div className="text-sm font-bold text-sky-400 font-mono">{getStatus()}</div>
               </motion.div>

            </div>

            {/* === RIGHT: TASK B STACK === */}
            <StackColumn 
               taskName="Task B" 
               color="emerald" 
               isActive={!isTaskA && !isKernelTime} 
               hasHW={step < 13}
               hasSW={step < 11}
               showPSP={step >= 7}
               // Grows DOWN
               pspOffset={step < 11 ? 150 : step < 13 ? 90 : 30}
               isRight={true}
            />

         </div>
      </div>
    </div>
  );
};

// --- Subcomponents for Cleanliness ---

interface StackColumnProps {
   taskName: string;
   color: 'violet' | 'emerald';
   isActive: boolean;
   hasHW: boolean;
   hasSW: boolean;
   showPSP: boolean;
   pspOffset: number;
   isRight?: boolean;
}

const StackColumn: React.FC<StackColumnProps> = ({ taskName, color, isActive, hasHW, hasSW, showPSP, pspOffset, isRight }) => {
   const borderColor = color === 'violet' ? 'border-violet-500' : 'border-emerald-500';
   const textColor = color === 'violet' ? 'text-violet-400' : 'text-emerald-400';

   return (
      <div className={`flex flex-col ${isRight ? 'items-start' : 'items-end'} relative transition-opacity duration-500 ${isActive ? 'opacity-100' : 'opacity-40 grayscale-[0.5]'}`}>
         {/* Title */}
         <div className={`flex items-center gap-2 mb-2 font-bold ${textColor}`}>
            <Database size={16}/> {taskName} Stack
         </div>

         {/* Stack Container */}
         <div className="w-full bg-slate-900 border-x-2 border-b-2 border-slate-700 rounded-b-xl relative h-[400px] flex flex-col justify-start overflow-visible shadow-inner">
            
            {/* Memory Grid Pattern */}
            <div className="absolute inset-0 opacity-20 bg-[repeating-linear-gradient(0deg,#000,#000_20px,transparent_20px,transparent_40px)] pointer-events-none"/>

            {/* PSP Pointer */}
            <motion.div 
               className={`absolute ${isRight ? '-left-3' : '-right-3'} z-50 flex items-center gap-2 ${isRight ? 'flex-row-reverse' : 'flex-row'}`}
               animate={{ top: pspOffset }}
               transition={{ type: "spring", stiffness: 200, damping: 20 }}
            >
               <div className="bg-amber-500 text-slate-950 text-[10px] font-bold px-1.5 py-0.5 rounded shadow-lg whitespace-nowrap">PSP</div>
               {isRight ? <ArrowRight className="text-amber-500 fill-amber-500" size={16}/> : <ArrowLeft className="text-amber-500 fill-amber-500" size={16}/>}
            </motion.div>

            {/* High Address (Top) Marker */}
            <div className="h-8 w-full bg-slate-800/80 border-b border-slate-700 flex items-center justify-center text-[9px] text-slate-500 uppercase tracking-widest shrink-0">
               High Address
            </div>

            {/* Stack Base Data (Always Present) */}
            <div className="h-20 w-full bg-slate-800/30 flex items-center justify-center text-[10px] text-slate-600 tracking-widest border-b border-slate-700/50 shrink-0">
               TASK DATA
            </div>
            
            {/* Hardware Frame (Pushed First -> Highest Address among frames) */}
            <AnimatePresence>
               {hasHW && (
                  <motion.div 
                     initial={{ opacity: 0, height: 0 }}
                     animate={{ opacity: 1, height: 60 }}
                     exit={{ opacity: 0, height: 0 }}
                     className={`w-full border-b border-dashed border-slate-500 ${color === 'violet' ? 'bg-violet-900/30 text-violet-300' : 'bg-emerald-900/30 text-emerald-300'} flex flex-col items-center justify-center text-[10px] relative shrink-0 overflow-hidden`}
                  >
                     <span className="font-bold">HW Frame</span>
                     <span className="text-[9px] opacity-70">R0-R3, PC, xPSR</span>
                  </motion.div>
               )}
            </AnimatePresence>

            {/* Software Frame (Pushed Next -> Lower Address) */}
            <AnimatePresence>
               {hasSW && (
                  <motion.div 
                     initial={{ opacity: 0, height: 0 }}
                     animate={{ opacity: 1, height: 60 }}
                     exit={{ opacity: 0, height: 0 }}
                     className={`w-full border-b border-dashed border-slate-500 ${color === 'violet' ? 'bg-violet-800/40 text-violet-200' : 'bg-emerald-800/40 text-emerald-200'} flex flex-col items-center justify-center text-[10px] relative shrink-0 overflow-hidden`}
                  >
                     <span className="font-bold">SW Frame</span>
                     <span className="text-[9px] opacity-70">R4 - R11</span>
                  </motion.div>
               )}
            </AnimatePresence>
            
            {/* Free Space / Low Address */}
            <div className="flex-1 flex items-end justify-center pb-2">
                <div className="text-[9px] text-slate-700 uppercase tracking-widest">Low Address (Growth) ↓</div>
            </div>
         </div>
      </div>
   );
};

export default Visualizer;
