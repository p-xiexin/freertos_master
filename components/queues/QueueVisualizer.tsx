
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDown, ArrowUp, Database, CornerDownRight, CornerUpRight, Lock, Upload, Download } from 'lucide-react';
import { QUEUE_SIZE } from '../../data/queueData';

interface QueueVisualizerProps {
  queue: (number | null)[];
  writeIndex: number;
  readIndex: number;
  messagesWaiting: number;
  isSending: boolean;
  isReceiving: boolean;
  isBlockedSend: boolean;
  isBlockedReceive: boolean;
  onSend: () => void;
  onReceive: () => void;
}

const QueueVisualizer: React.FC<QueueVisualizerProps> = ({
  queue,
  writeIndex,
  readIndex,
  messagesWaiting,
  isSending,
  isReceiving,
  isBlockedSend,
  isBlockedReceive,
  onSend,
  onReceive
}) => {
  return (
    <div className="flex-1 bg-slate-950 relative overflow-hidden flex flex-col font-sans">
      
      {/* Background Grid */}
      <div className="absolute inset-0 opacity-[0.03]" 
           style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '30px 30px' }}>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 z-10 gap-16">
        
        {/* TOP: Producer Task */}
        <div className="flex flex-col items-center gap-4">
             <div className={`
                w-32 h-20 rounded-xl border-2 flex flex-col items-center justify-center relative transition-all duration-300
                ${isBlockedSend ? 'bg-rose-900/20 border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.2)]' : 'bg-slate-900 border-indigo-500/50'}
             `}>
                <span className="text-xs font-bold text-slate-400 mb-1">PRODUCER</span>
                {isBlockedSend ? (
                    <div className="flex items-center gap-1 text-rose-400 font-bold animate-pulse">
                        <Lock size={14}/> BLOCKED
                    </div>
                ) : (
                    <div className="text-indigo-400 font-bold">RUNNING</div>
                )}
                
                {/* Send Button */}
                <button 
                    onClick={onSend}
                    disabled={isSending || isReceiving || isBlockedSend}
                    className="absolute -right-32 top-1/2 -translate-y-1/2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-xs font-bold transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                    <Upload size={14}/> xQueueSend
                </button>
             </div>
             
             {/* Data Packet being sent */}
             <div className="h-12 w-1 relative">
                {isSending && (
                    <motion.div 
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 40, opacity: 1 }}
                        className="absolute left-1/2 -translate-x-1/2 w-8 h-8 bg-indigo-500 rounded flex items-center justify-center text-xs font-bold text-white shadow-lg z-20"
                    >
                        Data
                    </motion.div>
                )}
                <div className="absolute inset-y-0 left-1/2 w-[2px] bg-slate-800 -translate-x-1/2"/>
                <ArrowDown className="absolute bottom-0 left-1/2 -translate-x-1/2 text-slate-600" size={16}/>
             </div>
        </div>


        {/* MIDDLE: Queue Memory Layout (Ring Buffer) */}
        <div className="relative">
            {/* Labels */}
            <div className="absolute -top-12 left-0 right-0 flex justify-between text-[10px] text-slate-500 font-mono">
                <span>pcHead (Start)</span>
                <span>pcTail (End)</span>
            </div>
            
            {/* The Buffer Container */}
            <div className="flex gap-2 p-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl relative">
                
                {/* Pointer: pcWriteTo */}
                <motion.div 
                    className="absolute -top-3 w-8 flex flex-col items-center z-30 pointer-events-none"
                    animate={{ left: `calc(8px + ${writeIndex * (64 + 8)}px + 32px - 16px)` }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                >
                     <div className="text-[9px] font-bold text-indigo-400 bg-indigo-900/30 px-1 rounded mb-0.5 whitespace-nowrap">Write</div>
                     <ArrowDown size={14} className="text-indigo-500 fill-indigo-500"/>
                </motion.div>

                {/* Pointer: pcReadFrom */}
                <motion.div 
                    className="absolute -bottom-3 w-8 flex flex-col-reverse items-center z-30 pointer-events-none"
                    // readIndex points to the LAST read item, so the NEXT read is readIndex + 1
                    // In visualizer, we usually point to where we are going to read from, so let's adjust logic in parent or here.
                    // Let's assume readIndex tracks the *next* item to read for visualization simplicity, 
                    // or aligns with FreeRTOS u.pcReadFrom which points to the *last returned* item.
                    // For clarity: Let's point to the *slot* corresponding to index.
                    animate={{ left: `calc(8px + ${readIndex * (64 + 8)}px + 32px - 16px)` }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                >
                     <div className="text-[9px] font-bold text-emerald-400 bg-emerald-900/30 px-1 rounded mt-0.5 whitespace-nowrap">Read</div>
                     <ArrowUp size={14} className="text-emerald-500 fill-emerald-500"/>
                </motion.div>

                {/* Slots */}
                {Array.from({ length: QUEUE_SIZE }).map((_, i) => (
                    <div key={i} className="w-16 h-16 bg-slate-950 border border-slate-800 rounded-lg relative flex items-center justify-center overflow-hidden">
                        <span className="absolute top-1 left-1 text-[9px] text-slate-700 font-mono">{i}</span>
                        <AnimatePresence>
                            {queue[i] !== null && (
                                <motion.div
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.5, opacity: 0 }}
                                    className="w-10 h-10 bg-gradient-to-br from-sky-500 to-blue-600 rounded shadow-inner flex items-center justify-center text-white font-bold text-xs z-10"
                                >
                                    {queue[i]}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ))}
            </div>

            {/* Loopback Arrow (Visualizing Ring) */}
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 text-[10px] text-slate-600">
                <CornerDownRight size={12} />
                <span>Ring Buffer Mode</span>
                <CornerUpRight size={12} />
            </div>
        </div>

        {/* BOTTOM: Consumer Task */}
        <div className="flex flex-col items-center gap-4">
             {/* Data Packet being received */}
             <div className="h-12 w-1 relative">
                <div className="absolute inset-y-0 left-1/2 w-[2px] bg-slate-800 -translate-x-1/2"/>
                <ArrowDown className="absolute bottom-0 left-1/2 -translate-x-1/2 text-slate-600" size={16}/>
                {isReceiving && (
                    <motion.div 
                        initial={{ y: -40, opacity: 0 }}
                        animate={{ y: 20, opacity: 1 }}
                        className="absolute left-1/2 -translate-x-1/2 w-8 h-8 bg-emerald-500 rounded flex items-center justify-center text-xs font-bold text-white shadow-lg z-20"
                    >
                        Data
                    </motion.div>
                )}
             </div>

             <div className={`
                w-32 h-20 rounded-xl border-2 flex flex-col items-center justify-center relative transition-all duration-300
                ${isBlockedReceive ? 'bg-amber-900/20 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)]' : 'bg-slate-900 border-emerald-500/50'}
             `}>
                <span className="text-xs font-bold text-slate-400 mb-1">CONSUMER</span>
                {isBlockedReceive ? (
                    <div className="flex items-center gap-1 text-amber-400 font-bold animate-pulse">
                        <Lock size={14}/> BLOCKED
                    </div>
                ) : (
                    <div className="text-emerald-400 font-bold">RUNNING</div>
                )}

                {/* Receive Button */}
                <button 
                    onClick={onReceive}
                    disabled={isSending || isReceiving || isBlockedReceive}
                    className="absolute -right-32 top-1/2 -translate-y-1/2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-xs font-bold transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                    <Download size={14}/> xQueueReceive
                </button>
             </div>
        </div>

      </div>
    </div>
  );
};

export default QueueVisualizer;
