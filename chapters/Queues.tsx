
import React, { useState } from 'react';
import QueueVisualizer from '../components/queues/QueueVisualizer';
import QueueCodeView from '../components/queues/QueueCodeView';
import QueueDebuggerPane from '../components/queues/QueueDebuggerPane';
import DraggableHandle from '../components/DraggableHandle';
import { QUEUE_SIZE, QueueItem } from '../data/queueData';

const Queues: React.FC = () => {
  // Queue Internal State
  const [queueData, setQueueData] = useState<(QueueItem | null)[]>(Array(QUEUE_SIZE).fill(null));
  
  // FreeRTOS Pointer Logic:
  // pcWriteTo points to the next free slot for back-writing.
  // u.pcReadFrom points to the LAST read slot (so next read is pcReadFrom + 1).
  const [writeIndex, setWriteIndex] = useState(0); // pcWriteTo
  const [readIndex, setReadIndex] = useState(QUEUE_SIZE - 1); // u.pcReadFrom
  const [messagesWaiting, setMessagesWaiting] = useState(0);
  
  // Animation & Operation State
  const [operationState, setOperationState] = useState<'IDLE' | 'SEND_NORMAL' | 'SEND_URGENT' | 'RECEIVE'>('IDLE');
  const [activeLine, setActiveLine] = useState<number | null>(null);

  // Task Blocking Simulation
  // We simulate a list of tasks waiting.
  const [blockedSenders, setBlockedSenders] = useState<string[]>([]);
  const [blockedReceivers, setBlockedReceivers] = useState<string[]>([]);

  // Layout State
  const [sidebarWidth, setSidebarWidth] = useState(300);
  const [bottomHeight, setBottomHeight] = useState(250);

  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // --- Logic Helpers ---

  const handleSend = async (isUrgent: boolean) => {
    if (operationState !== 'IDLE') return;
    
    const taskName = isUrgent ? "ISR (Urgent)" : "SensorTask";
    
    // 1. Check if Full
    if (messagesWaiting >= QUEUE_SIZE) {
        // Block Logic
        setOperationState(isUrgent ? 'SEND_URGENT' : 'SEND_NORMAL');
        setActiveLine(6); 
        await wait(400);
        
        setActiveLine(19); // Place on Event List
        setBlockedSenders(prev => [...prev, taskName]);
        
        // Auto unblock simulation for demo
        setTimeout(() => {
             setBlockedSenders(prev => prev.filter(t => t !== taskName));
        }, 3000);
        
        setOperationState('IDLE');
        setActiveLine(null);
        return;
    }

    // Start Animation
    setOperationState(isUrgent ? 'SEND_URGENT' : 'SEND_NORMAL');
    setActiveLine(6); // Check count
    await wait(400);

    setActiveLine(9); // Copy Data
    await wait(500);

    setQueueData(prev => {
        const newQ = [...prev];
        const val = Math.floor(Math.random() * 99) + 1;
        
        if (isUrgent) {
             // xQueueSendToFront:
             // 1. Decrement u.pcReadFrom (wrap around)
             // 2. Write to u.pcReadFrom
             let newReadPtr = readIndex - 1;
             if (newReadPtr < 0) newReadPtr = QUEUE_SIZE - 1;
             
             // In FreeRTOS, SendToFront writes to the NEW read ptr location
             newQ[newReadPtr] = { value: val, type: 'URGENT' };
             return newQ;
        } else {
             // xQueueSendToBack:
             // 1. Write to pcWriteTo
             // 2. Increment pcWriteTo
             newQ[writeIndex] = { value: val, type: 'NORMAL' };
             return newQ;
        }
    });

    if (isUrgent) {
        setReadIndex(prev => {
            let next = prev - 1;
            return next < 0 ? QUEUE_SIZE - 1 : next;
        });
    } else {
        setWriteIndex(prev => (prev + 1) % QUEUE_SIZE);
    }
    
    await wait(200);
    setActiveLine(10); // Inc count
    setMessagesWaiting(prev => prev + 1);

    // Wake Readers
    if (blockedReceivers.length > 0) {
        setActiveLine(13); // Remove from event list
        setBlockedReceivers(prev => prev.slice(1)); // Pop one
        await wait(200);
    }

    setOperationState('IDLE');
    setActiveLine(null);
  };

  const handleReceive = async () => {
    if (operationState !== 'IDLE') return;

    // 1. Check Empty
    if (messagesWaiting === 0) {
        setOperationState('RECEIVE');
        setActiveLine(6);
        await wait(400);

        setActiveLine(20); // Place on blocked list
        setBlockedReceivers(prev => [...prev, "ConsumerTask"]);
        
        setTimeout(() => {
             setBlockedReceivers(prev => prev.filter(t => t !== "ConsumerTask"));
        }, 3000);
        
        setOperationState('IDLE');
        setActiveLine(null);
        return;
    }

    setOperationState('RECEIVE');
    setActiveLine(6); 
    await wait(400);
    
    setActiveLine(9); // Copy from Queue
    await wait(500);

    // xQueueReceive:
    // 1. Read from (u.pcReadFrom + 1)
    // 2. Increment u.pcReadFrom
    const targetIndex = (readIndex + 1) % QUEUE_SIZE;
    
    setQueueData(prev => {
        const newQ = [...prev];
        newQ[targetIndex] = null; // Visually consume
        return newQ;
    });
    
    setReadIndex(targetIndex);

    await wait(200);
    setActiveLine(11); // Dec count
    setMessagesWaiting(prev => prev - 1);

    // Wake Writers
    if (blockedSenders.length > 0) {
        setActiveLine(14); // Remove from event list
        setBlockedSenders(prev => prev.slice(1)); // Pop one
        await wait(200);
    }

    setOperationState('IDLE');
    setActiveLine(null);
  };

  return (
    <div className="h-full w-full bg-slate-950 flex flex-col md:flex-row overflow-hidden">
        
        {/* LEFT PANE */}
        <div className="flex-1 flex flex-col min-w-0" style={{ height: '100%' }}>
            <QueueVisualizer 
                queue={queueData}
                writeIndex={writeIndex}
                readIndex={readIndex}
                messagesWaiting={messagesWaiting}
                operationState={operationState}
                blockedSenders={blockedSenders}
                blockedReceivers={blockedReceivers}
                onSendNormal={() => handleSend(false)}
                onSendUrgent={() => handleSend(true)}
                onReceive={handleReceive}
            />

            <DraggableHandle 
                orientation="horizontal" 
                onDrag={(dy) => setBottomHeight(h => Math.min(Math.max(h - dy, 150), 600))} 
            />

            <QueueCodeView 
                activeLine={activeLine}
                height={bottomHeight}
                mode={operationState === 'SEND_URGENT' ? 'FRONT' : operationState === 'RECEIVE' ? 'RECEIVE' : 'SEND'}
            />
        </div>

        <DraggableHandle 
            orientation="vertical" 
            onDrag={(dx) => setSidebarWidth(w => Math.min(Math.max(w - dx, 220), 450))} 
        />

        {/* RIGHT PANE */}
        <QueueDebuggerPane 
            queue={queueData}
            writeIndex={writeIndex}
            readIndex={readIndex}
            messagesWaiting={messagesWaiting}
            queueSize={QUEUE_SIZE}
            width={sidebarWidth}
            blockedSenders={blockedSenders}
            blockedReceivers={blockedReceivers}
        />
        
    </div>
  );
};

export default Queues;
