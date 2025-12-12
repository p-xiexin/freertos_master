
import React, { useState } from 'react';
import QueueVisualizer from '../components/queues/QueueVisualizer';
import QueueCodeView from '../components/queues/QueueCodeView';
import QueueDebuggerPane from '../components/queues/QueueDebuggerPane';
import DraggableHandle from '../components/DraggableHandle';
import { QUEUE_SIZE } from '../data/queueData';

const Queues: React.FC = () => {
  // Queue State
  const [queue, setQueue] = useState<(number | null)[]>(Array(QUEUE_SIZE).fill(null));
  const [writeIndex, setWriteIndex] = useState(0); // pcWriteTo
  const [readIndex, setReadIndex] = useState(QUEUE_SIZE - 1); // u.pcReadFrom (starts at end in FreeRTOS init)
  const [messagesWaiting, setMessagesWaiting] = useState(0);
  
  // Animation State
  const [isSending, setIsSending] = useState(false);
  const [isReceiving, setIsReceiving] = useState(false);
  const [activeLine, setActiveLine] = useState<number | null>(null);

  // Task State simulation
  const [blockedSendCount, setBlockedSendCount] = useState(0);
  const [blockedReceiveCount, setBlockedReceiveCount] = useState(0);

  // Layout State
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [bottomHeight, setBottomHeight] = useState(250);

  const handleSend = async () => {
    if (isSending || isReceiving) return;
    
    // Check Full
    setActiveLine(7); // Check Count
    await wait(400);

    if (messagesWaiting >= QUEUE_SIZE) {
        setActiveLine(25); // Block Task
        setBlockedSendCount(c => c + 1);
        setTimeout(() => setBlockedSendCount(c => Math.max(0, c - 1)), 2000); // Simulate unblock timeout
        return;
    }

    setIsSending(true);
    setActiveLine(10); // Copy Data
    await wait(600);
    
    // Update Queue State
    setQueue(prev => {
        const newQ = [...prev];
        newQ[writeIndex] = Math.floor(Math.random() * 99) + 1;
        return newQ;
    });
    
    // Increment Write Index (Ring Buffer Logic)
    setWriteIndex(prev => (prev + 1) % QUEUE_SIZE);
    
    await wait(300);
    setActiveLine(13); // Increment Count
    setMessagesWaiting(prev => prev + 1);

    // Wake blocked readers if any
    if (blockedReceiveCount > 0) {
        setActiveLine(16); // Remove from event list
        setBlockedReceiveCount(c => Math.max(0, c - 1));
        await wait(300);
        setActiveLine(18); // Yield
    }

    setIsSending(false);
    setActiveLine(null);
  };

  const handleReceive = async () => {
    if (isSending || isReceiving) return;
    
    // Check Empty (Not explicitly in the simplified send code, but symmetrical logic)
    // Assume receive code logic for visualization
    if (messagesWaiting === 0) {
        setBlockedReceiveCount(c => c + 1);
        setTimeout(() => setBlockedReceiveCount(c => Math.max(0, c - 1)), 2000);
        return;
    }

    setIsReceiving(true);
    await wait(600);

    // Update Read Index first (FreeRTOS increments read pointer then reads)
    const nextReadIndex = (readIndex + 1) % QUEUE_SIZE;
    setReadIndex(nextReadIndex);
    
    // "Read" data (Visual only, we don't actually remove for demo unless we want to show empty)
    // In FreeRTOS, data stays until overwritten, but count decreases. 
    // For visual clarity, let's nullify it to show "consumed"
    setQueue(prev => {
        const newQ = [...prev];
        newQ[nextReadIndex] = null; 
        return newQ;
    });

    setMessagesWaiting(prev => prev - 1);
    
    // Wake blocked senders
    if (blockedSendCount > 0) {
        setBlockedSendCount(c => Math.max(0, c - 1));
    }

    setIsReceiving(false);
  };

  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  return (
    <div className="h-full w-full bg-slate-950 flex flex-col md:flex-row overflow-hidden">
        
        {/* LEFT PANE */}
        <div className="flex-1 flex flex-col min-w-0" style={{ height: '100%' }}>
            <QueueVisualizer 
                queue={queue}
                writeIndex={writeIndex}
                readIndex={readIndex}
                messagesWaiting={messagesWaiting}
                isSending={isSending}
                isReceiving={isReceiving}
                isBlockedSend={blockedSendCount > 0}
                isBlockedReceive={blockedReceiveCount > 0}
                onSend={handleSend}
                onReceive={handleReceive}
            />

            <DraggableHandle 
                orientation="horizontal" 
                onDrag={(dy) => setBottomHeight(h => Math.min(Math.max(h - dy, 150), 600))} 
            />

            <QueueCodeView 
                activeLine={activeLine}
                height={bottomHeight}
            />
        </div>

        <DraggableHandle 
            orientation="vertical" 
            onDrag={(dx) => setSidebarWidth(w => Math.min(Math.max(w - dx, 220), 450))} 
        />

        {/* RIGHT PANE */}
        <QueueDebuggerPane 
            queue={queue}
            writeIndex={writeIndex}
            readIndex={readIndex}
            messagesWaiting={messagesWaiting}
            queueSize={QUEUE_SIZE}
            width={sidebarWidth}
            blockedSendCount={blockedSendCount}
            blockedReceiveCount={blockedReceiveCount}
        />
        
    </div>
  );
};

export default Queues;
