
import React from 'react';
import { Bug, Database } from 'lucide-react';
import CollapsibleSection from '../CollapsibleSection';

interface QueueDebuggerPaneProps {
  queue: (number | null)[];
  writeIndex: number;
  readIndex: number;
  messagesWaiting: number;
  queueSize: number;
  width: number;
  blockedSendCount: number;
  blockedReceiveCount: number;
}

const DebugRow = ({ label, value, color = "text-slate-400" }: { label: string, value: string | number, color?: string }) => (
    <div className="flex justify-between items-center text-xs py-1 border-b border-slate-800/50 last:border-0">
        <span className="text-slate-500 font-bold">{label}</span>
        <span className={`font-mono ${color}`}>{value}</span>
    </div>
);

const QueueDebuggerPane: React.FC<QueueDebuggerPaneProps> = ({ 
    queue, writeIndex, readIndex, messagesWaiting, queueSize, width, blockedSendCount, blockedReceiveCount 
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
                        <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">xTasksWaitingToSend</div>
                        {blockedSendCount > 0 ? (
                            <div className="text-xs text-rose-400 bg-rose-900/20 border border-rose-500/30 p-1.5 rounded flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"/>
                                {blockedSendCount} Task(s) Blocked
                            </div>
                        ) : (
                            <div className="text-[10px] text-slate-600 italic pl-2">List Empty</div>
                        )}
                    </div>
                    <div>
                        <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">xTasksWaitingToReceive</div>
                        {blockedReceiveCount > 0 ? (
                            <div className="text-xs text-amber-400 bg-amber-900/20 border border-amber-500/30 p-1.5 rounded flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"/>
                                {blockedReceiveCount} Task(s) Blocked
                            </div>
                        ) : (
                            <div className="text-[10px] text-slate-600 italic pl-2">List Empty</div>
                        )}
                    </div>
                 </div>
             </CollapsibleSection>
         </div>

         {/* Memory View */}
         <div className="bg-slate-950/50 rounded-lg border border-slate-800/50 overflow-hidden">
            <CollapsibleSection title="Buffer Storage Area">
                <div className="grid grid-cols-5 gap-1 p-1">
                    {queue.map((val, i) => (
                        <div key={i} className={`
                            h-8 rounded flex items-center justify-center text-[10px] font-mono border
                            ${val !== null ? 'bg-sky-900/30 border-sky-500/50 text-sky-300' : 'bg-slate-900 border-slate-800 text-slate-600'}
                        `}>
                            {val !== null ? val : "0x00"}
                        </div>
                    ))}
                </div>
            </CollapsibleSection>
         </div>

      </div>
    </div>
  );
};

export default QueueDebuggerPane;
