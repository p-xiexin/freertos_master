
import React from 'react';
import { Bug, RotateCw, Copy, Lock, Zap } from 'lucide-react';
import CollapsibleSection from '../CollapsibleSection';
import { QueueItem } from '../../data/queueData';

interface QueueDebuggerPaneProps {
  queue: (QueueItem | null)[];
  writeIndex: number;
  readIndex: number;
  messagesWaiting: number;
  queueSize: number;
  width: number;
  blockedSenders: string[];
  blockedReceivers: string[];
}

const DebugRow = ({ label, value, color = "text-slate-400" }: { label: string, value: string | number, color?: string }) => (
    <div className="flex justify-between items-center text-xs py-1 border-b border-slate-800/50 last:border-0">
        <span className="text-slate-500 font-bold">{label}</span>
        <span className={`font-mono ${color}`}>{value}</span>
    </div>
);

const QueueDebuggerPane: React.FC<QueueDebuggerPaneProps> = ({ 
    queue, writeIndex, readIndex, messagesWaiting, queueSize, width, blockedSenders, blockedReceivers 
}) => {
  
  return (
    <div 
      style={{ width }} 
      className="bg-slate-900 border-l border-slate-800 flex flex-col shrink-0 text-slate-300 h-full"
    >
      <div className="h-8 bg-slate-900 px-4 flex items-center gap-2 text-xs font-bold text-slate-400 border-b border-slate-800 shadow-sm shrink-0">
         <Bug size={14} className="text-emerald-500"/> 
         <span>QUEUE INSPECTOR</span>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
         
         {/* Queue_t Struct */}
         <div className="bg-slate-950/50 rounded-lg border border-slate-800/50 overflow-hidden">
            <CollapsibleSection title="Queue Definition (Queue_t)">
                <div className="px-1">
                    <DebugRow label="uxMessagesWaiting" value={messagesWaiting} color={messagesWaiting > 0 ? "text-emerald-400" : "text-slate-500"} />
                    <DebugRow label="uxLength" value={queueSize} />
                    <DebugRow label="pcWriteTo" value={`Buffer[${writeIndex}]`} color="text-indigo-300"/>
                    <DebugRow label="u.pcReadFrom" value={`Buffer[${readIndex}]`} color="text-emerald-300"/>
                    <DebugRow label="xRxLock" value="queueUNLOCKED" />
                    <DebugRow label="xTxLock" value="queueUNLOCKED" />
                </div>
            </CollapsibleSection>
         </div>

         {/* Event Lists */}
         <div className="bg-slate-950/50 rounded-lg border border-slate-800/50 overflow-hidden">
             <CollapsibleSection title="Event Lists (Blocking)">
                 <div className="px-1">
                    <div className="mb-2">
                        <div className="text-[10px] text-slate-500 uppercase font-bold mb-1 flex justify-between">
                            <span>xTasksWaitingToSend</span>
                            <span className="text-slate-600">{blockedSenders.length}</span>
                        </div>
                        {blockedSenders.length > 0 ? (
                            <div className="flex flex-col gap-1">
                                {blockedSenders.map((task, i) => (
                                    <div key={i} className="text-xs text-rose-300 bg-rose-900/10 border border-rose-500/20 p-1 rounded flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500"/> {task}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-[10px] text-slate-600 italic pl-2">List Empty</div>
                        )}
                    </div>
                    
                    <div className="border-t border-slate-800/50 my-2"></div>

                    <div>
                        <div className="text-[10px] text-slate-500 uppercase font-bold mb-1 flex justify-between">
                            <span>xTasksWaitingToReceive</span>
                            <span className="text-slate-600">{blockedReceivers.length}</span>
                        </div>
                        {blockedReceivers.length > 0 ? (
                            <div className="flex flex-col gap-1">
                                {blockedReceivers.map((task, i) => (
                                    <div key={i} className="text-xs text-amber-300 bg-amber-900/10 border border-amber-500/20 p-1 rounded flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"/> {task}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-[10px] text-slate-600 italic pl-2">List Empty</div>
                        )}
                    </div>
                 </div>
             </CollapsibleSection>
         </div>

         {/* Memory View */}
         <div className="bg-slate-900/50 rounded-lg border border-slate-800/50 overflow-hidden">
            <CollapsibleSection title="Buffer Storage Area">
                <div className="grid grid-cols-5 gap-1 p-1">
                    {queue.map((item, i) => (
                        <div key={i} className={`
                            h-8 rounded flex items-center justify-center text-[10px] font-mono border
                            ${item !== null 
                                ? (item.type === 'URGENT' ? 'bg-rose-900/30 border-rose-500/50 text-rose-300' : 'bg-indigo-900/30 border-indigo-500/50 text-indigo-300')
                                : 'bg-slate-900 border-slate-800 text-slate-600'}
                        `}>
                            {item !== null ? item.value : "00"}
                        </div>
                    ))}
                </div>
            </CollapsibleSection>
         </div>

         {/* Core Principles */}
         <div className="bg-slate-900/50 rounded-lg border border-slate-800/50 overflow-hidden mt-2">
            <CollapsibleSection title="Core Principles (核心原理)">
               <div className="p-2 space-y-3 text-xs text-slate-400 leading-relaxed">
                   {/* 1. Ring Buffer */}
                   <div className="flex gap-2 items-start">
                       <RotateCw size={14} className="text-sky-500 shrink-0 mt-0.5"/>
                       <div>
                           <strong className="text-sky-400 block mb-0.5">Ring Buffer (环形缓冲)</strong>
                           <p>使用固定内存空间。指针移动到末尾后会自动回绕到 0。这避免了数据移动（memmove）的开销，保证了 O(1) 的存取效率。</p>
                       </div>
                   </div>

                   {/* 2. Copy by Value */}
                   <div className="flex gap-2 items-start">
                       <Copy size={14} className="text-indigo-500 shrink-0 mt-0.5"/>
                       <div>
                           <strong className="text-indigo-400 block mb-0.5">Copy by Value (值拷贝)</strong>
                           <p>FreeRTOS 将数据<b>完整复制</b>到队列中，而不是存储引用。这确保了即便发送源变量销毁，接收方仍能收到正确数据。</p>
                       </div>
                   </div>

                   {/* 3. Blocking */}
                   <div className="flex gap-2 items-start">
                       <Lock size={14} className="text-amber-500 shrink-0 mt-0.5"/>
                       <div>
                           <strong className="text-amber-400 block mb-0.5">Blocking (阻塞机制)</strong>
                           <p>当队列满（发送）或空（接收）时，任务会被放入 <code>xTasksWaiting...</code> 链表并挂起，不消耗 CPU 资源，直到超时或条件满足。</p>
                       </div>
                   </div>

                   {/* 4. SendToFront */}
                   <div className="flex gap-2 items-start">
                       <Zap size={14} className="text-rose-500 shrink-0 mt-0.5"/>
                       <div>
                           <strong className="text-rose-400 block mb-0.5">Urgent Data (紧急插队)</strong>
                           <p><code>SendToFront</code> 是 LIFO（后进先出）操作。它将数据写入 <code>pcReadFrom</code> 当前指向的位置，确保下次 <code>Receive</code> 立即读到它。</p>
                       </div>
                   </div>
               </div>
            </CollapsibleSection>
         </div>

      </div>
    </div>
  );
};

export default QueueDebuggerPane;
