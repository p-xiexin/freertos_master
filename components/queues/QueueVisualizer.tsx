
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDown, ArrowUp, CornerDownRight, CornerUpRight, Lock, Zap, Activity, Download } from 'lucide-react';
import { QUEUE_SIZE, QueueItem } from '../../data/queueData';

interface QueueVisualizerProps {
  queue: (QueueItem | null)[];
  writeIndex: number;
  readIndex: number; // u.pcReadFrom
  messagesWaiting: number;
  operationState: 'IDLE' | 'SEND_NORMAL' | 'SEND_URGENT' | 'RECEIVE';
  blockedSenders: string[];
  blockedReceivers: string[];
  onSendNormal: () => void;
  onSendUrgent: () => void;
  onReceive: () => void;
}

const QueueVisualizer: React.FC<QueueVisualizerProps> = ({
  queue,
  writeIndex,
  readIndex,
  messagesWaiting,
  operationState,
  blockedSenders,
  blockedReceivers,
  onSendNormal,
  onSendUrgent,
  onReceive
}) => {
  
  const isBlockedNormal = blockedSenders.includes("SensorTask");
  const isBlockedUrgent = blockedSenders.includes("ISR (Urgent)");
  const isBlockedConsumer = blockedReceivers.includes("ConsumerTask");

  const isSendingNormal = operationState === 'SEND_NORMAL';
  const isSendingUrgent = operationState === 'SEND_URGENT';
  const isReceiving = operationState === 'RECEIVE';
  const isIdle = operationState === 'IDLE';

  // Calculate positions for pointers
  // writeIndex points to slot
  // readIndex points to slot
  const slotSize = 64;
  const gap = 8;
  const startOffset = 32;
  const getSlotPos = (idx: number) => startOffset + idx * (slotSize + gap);

  return (
    <div className="flex-1 bg-slate-950 relative overflow-hidden flex flex-col font-sans">
      
      {/* Background Grid */}
      <div className="absolute inset-0 opacity-[0.03]" 
           style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '30px 30px' }}>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 z-10 gap-8 max-w-7xl mx-auto w-full">
        
        {/* === LEFT COLUMN: PRODUCERS === */}
        <div className="flex flex-col gap-12 items-end justify-center">
            
            {/* 1. Urgent Producer (ISR) */}
            <div className="flex items-center gap-4">
                 <div className="flex flex-col items-end">
                     {isSendingUrgent && (
                        <motion.div 
                            initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                            className="text-xs text-rose-400 font-bold mb-1"
                        >
                            SendToFront
                        </motion.div>
                     )}
                     <button 
                        onClick={onSendUrgent}
                        disabled={!isIdle || isBlockedUrgent}
                        className={`
                            px-4 py-2 rounded-lg flex items-center gap-2 text-xs font-bold transition shadow-lg
                            ${isBlockedUrgent ? 'bg-rose-900/20 text-rose-500 border border-rose-500/30 cursor-not-allowed' : 'bg-rose-600 hover:bg-rose-500 text-white'}
                            disabled:opacity-50 disabled:cursor-not-allowed
                        `}
                    >
                        <Zap size={14} fill="currentColor"/> ISR Send (Front)
                    </button>
                 </div>

                 <div className={`
                    w-32 h-20 rounded-xl border-2 flex flex-col items-center justify-center relative transition-all duration-300
                    ${isBlockedUrgent ? 'bg-rose-900/20 border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.2)]' : 'bg-slate-900 border-rose-500/50'}
                 `}>
                    <span className="text-[10px] font-bold text-slate-400 mb-1">INTERRUPT</span>
                    {isBlockedUrgent ? (
                        <div className="flex items-center gap-1 text-rose-400 font-bold animate-pulse text-xs"><Lock size={12}/> BLOCKED</div>
                    ) : (
                        <div className="text-rose-400 font-bold text-xs">ACTIVE</div>
                    )}
                 </div>
            </div>

            {/* 2. Normal Producer (Task) */}
            <div className="flex items-center gap-4">
                 <div className="flex flex-col items-end">
                     {isSendingNormal && (
                        <motion.div 
                            initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                            className="text-xs text-indigo-400 font-bold mb-1"
                        >
                            SendToBack
                        </motion.div>
                     )}
                     <button 
                        onClick={onSendNormal}
                        disabled={!isIdle || isBlockedNormal}
                        className={`
                            px-4 py-2 rounded-lg flex items-center gap-2 text-xs font-bold transition shadow-lg
                            ${isBlockedNormal ? 'bg-indigo-900/20 text-indigo-500 border border-indigo-500/30 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 text-white'}
                            disabled:opacity-50 disabled:cursor-not-allowed
                        `}
                    >
                        <Activity size={14}/> Task Send (Back)
                    </button>
                 </div>

                 <div className={`
                    w-32 h-20 rounded-xl border-2 flex flex-col items-center justify-center relative transition-all duration-300
                    ${isBlockedNormal ? 'bg-indigo-900/20 border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.2)]' : 'bg-slate-900 border-indigo-500/50'}
                 `}>
                    <span className="text-[10px] font-bold text-slate-400 mb-1">SENSOR TASK</span>
                    {isBlockedNormal ? (
                        <div className="flex items-center gap-1 text-indigo-400 font-bold animate-pulse text-xs"><Lock size={12}/> BLOCKED</div>
                    ) : (
                        <div className="text-indigo-400 font-bold text-xs">RUNNING</div>
                    )}
                 </div>
            </div>
        </div>

        {/* === CENTER: QUEUE MEMORY === */}
        <div className="flex flex-col items-center justify-center relative min-h-[300px]">
             
             {/* Pointers Label */}
             <div className="absolute -top-16 left-0 right-0 flex justify-between text-[10px] text-slate-500 font-mono opacity-50">
                <span>Low Address</span>
                <span>High Address</span>
             </div>

             {/* The Queue Array */}
             <div className="flex gap-2 p-3 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl relative">
                
                {/* pcWriteTo Pointer (Top) */}
                <motion.div 
                    className="absolute -top-10 w-8 flex flex-col items-center z-30"
                    animate={{ left: getSlotPos(writeIndex) - 16 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                >
                     <div className="text-[9px] font-bold text-indigo-400 bg-indigo-900/30 px-1.5 py-0.5 rounded mb-1 whitespace-nowrap shadow-sm border border-indigo-500/30">
                        pcWriteTo
                     </div>
                     <ArrowDown size={14} className="text-indigo-500 fill-indigo-500"/>
                </motion.div>

                {/* u.pcReadFrom Pointer (Bottom) */}
                <motion.div 
                    className="absolute -bottom-10 w-8 flex flex-col-reverse items-center z-30"
                    animate={{ left: getSlotPos(readIndex) - 16 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                >
                     <div className="text-[9px] font-bold text-emerald-400 bg-emerald-900/30 px-1.5 py-0.5 rounded mt-1 whitespace-nowrap shadow-sm border border-emerald-500/30">
                        u.pcReadFrom
                     </div>
                     <ArrowUp size={14} className="text-emerald-500 fill-emerald-500"/>
                </motion.div>

                {/* Slots */}
                {Array.from({ length: QUEUE_SIZE }).map((_, i) => (
                    <div key={i} className="w-16 h-16 bg-slate-950 border border-slate-800 rounded-lg relative flex items-center justify-center overflow-hidden">
                        <span className="absolute top-1 left-1 text-[9px] text-slate-700 font-mono">{i}</span>
                        <AnimatePresence mode='popLayout'>
                            {queue[i] !== null && (
                                <motion.div
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.5, opacity: 0 }}
                                    className={`
                                        w-12 h-12 rounded-md shadow-inner flex items-center justify-center text-white font-bold text-sm z-10 border border-white/10
                                        ${queue[i]?.type === 'URGENT' 
                                            ? 'bg-gradient-to-br from-rose-500 to-red-600 shadow-rose-500/20' 
                                            : 'bg-gradient-to-br from-indigo-500 to-blue-600 shadow-indigo-500/20'}
                                    `}
                                >
                                    {queue[i]?.value}
                                    {queue[i]?.type === 'URGENT' && <Zap size={10} className="absolute bottom-1 right-1 text-white/50"/>}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ))}
             </div>
             
             {/* Ring Buffer Indicator */}
             <div className="absolute -bottom-20 flex items-center gap-2 text-[10px] text-slate-600">
                <CornerDownRight size={14} />
                <span>Ring Buffer (Wraps Around)</span>
                <CornerUpRight size={14} />
             </div>

             {/* Logic Explanation Annotations (Conditional) */}
             <div className="absolute top-32 w-64 text-center">
                 <AnimatePresence mode='wait'>
                    {isSendingUrgent && (
                        <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0}} className="bg-rose-900/80 text-rose-200 text-[10px] px-2 py-1 rounded border border-rose-500/30 backdrop-blur">
                            <strong>SendToFront:</strong> Decrement <code>u.pcReadFrom</code> & Write
                        </motion.div>
                    )}
                    {isSendingNormal && (
                        <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0}} className="bg-indigo-900/80 text-indigo-200 text-[10px] px-2 py-1 rounded border border-indigo-500/30 backdrop-blur">
                            <strong>SendToBack:</strong> Write to <code>pcWriteTo</code> & Increment
                        </motion.div>
                    )}
                    {isReceiving && (
                        <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0}} className="bg-emerald-900/80 text-emerald-200 text-[10px] px-2 py-1 rounded border border-emerald-500/30 backdrop-blur">
                            <strong>Receive:</strong> Read from <code>u.pcReadFrom + 1</code>
                        </motion.div>
                    )}
                 </AnimatePresence>
             </div>
        </div>

        {/* === RIGHT COLUMN: CONSUMER === */}
        <div className="flex flex-col gap-12 items-start justify-center">
             <div className="flex items-center gap-4">
                 <div className={`
                    w-32 h-20 rounded-xl border-2 flex flex-col items-center justify-center relative transition-all duration-300
                    ${isBlockedConsumer ? 'bg-amber-900/20 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)]' : 'bg-slate-900 border-emerald-500/50'}
                 `}>
                    <span className="text-[10px] font-bold text-slate-400 mb-1">CONSUMER</span>
                    {isBlockedConsumer ? (
                        <div className="flex items-center gap-1 text-amber-400 font-bold animate-pulse text-xs"><Lock size={12}/> BLOCKED</div>
                    ) : (
                        <div className="text-emerald-400 font-bold text-xs">RUNNING</div>
                    )}
                 </div>

                 <div className="flex flex-col items-start">
                     {isReceiving && (
                        <motion.div 
                            initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                            className="text-xs text-emerald-400 font-bold mb-1"
                        >
                            Reading...
                        </motion.div>
                     )}
                     <button 
                        onClick={onReceive}
                        disabled={!isIdle || isBlockedConsumer}
                        className={`
                            px-4 py-2 rounded-lg flex items-center gap-2 text-xs font-bold transition shadow-lg
                            ${isBlockedConsumer ? 'bg-amber-900/20 text-amber-500 border border-amber-500/30 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}
                            disabled:opacity-50 disabled:cursor-not-allowed
                        `}
                    >
                        <Download size={14}/> xQueueReceive
                    </button>
                 </div>
             </div>
        </div>

      </div>
    </div>
  );
};

export default QueueVisualizer;
