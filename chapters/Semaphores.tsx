
import React, { useState, useEffect } from 'react';
import { ToggleLeft, ToggleRight, RefreshCw, Terminal } from 'lucide-react';
import SemaphoreVisualizer from '../components/semaphores/SemaphoreVisualizer';
import SemaphoreCodeView from '../components/semaphores/SemaphoreCodeView';
import SemaphoreDebuggerPane from '../components/semaphores/SemaphoreDebuggerPane';
import DraggableHandle from '../components/DraggableHandle';
import DebugToolbar from '../components/DebugToolbar';
import { SEMAPHORE_SCENARIO } from '../data/semaphoreData';

const Semaphores: React.FC = () => {
  const [mode, setMode] = useState<'BINARY' | 'COUNTING'>('COUNTING');
  const [step, setStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Layout State
  const [sidebarWidth, setSidebarWidth] = useState(300);
  const [bottomHeight, setBottomHeight] = useState(250);

  const maxTokens = mode === 'COUNTING' ? 3 : 1;
  const tasks = [
    { id: 'Take1', name: 'Task A', status: 'Running' },
    { id: 'Take2', name: 'Task B', status: 'Running' },
    { id: 'Take3', name: 'Task C', status: 'Running' },
    { id: 'Give1', name: 'ISR / Task', status: 'Running' },
  ];

  // Auto-play logic
  useEffect(() => {
    let timer: any;
    if (isPlaying && step < SEMAPHORE_SCENARIO.length - 1) {
      timer = setTimeout(() => {
        setStep(s => s + 1);
      }, 1500);
    } else if (step >= SEMAPHORE_SCENARIO.length - 1) {
      setIsPlaying(false);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, step]);

  // State Calculator based on Step
  const getSystemState = () => {
      let currentTokens = 3;
      let blocked: string[] = [];
      let activeTask: string | null = null;
      let owner: string | null = null;

      // Replay steps to calculate state
      // Note: This is a simple replay for visualization. In a real app, you might use a reducer.
      // Logic mirrors SEMAPHORE_SCENARIO in data/semaphoreData.ts
      
      if (step >= 3) currentTokens = 2; // A takes
      if (step >= 6) currentTokens = 1; // B takes
      if (step >= 9) currentTokens = 0; // C takes
      
      if (step >= 14 && step < 19) blocked.push('Take1'); // A tries again and blocks
      
      if (step >= 17) currentTokens = 1; // Give increments
      if (step >= 20) currentTokens = 0; // A wakes and takes
      
      const currentStepData = SEMAPHORE_SCENARIO[step];
      activeTask = currentStepData.activeTask || null;

      return { tokens: currentTokens, blocked, activeTask, owner };
  };

  const { tokens, blocked, activeTask, owner } = getSystemState();
  const currentStepData = SEMAPHORE_SCENARIO[step];

  const handleReset = () => {
      setStep(0);
      setIsPlaying(false);
      setMode('COUNTING');
  };

  return (
    <div className="h-full w-full bg-slate-950 flex flex-col md:flex-row overflow-hidden relative">
        
        {/* LEFT PANE */}
        <div className="flex-1 flex flex-col min-w-0" style={{ height: '100%' }}>
            
            {/* Toolbar */}
            <div className="absolute top-6 left-6 z-40 flex gap-2">
                 <div className="bg-slate-900/90 backdrop-blur p-1.5 rounded-xl border border-slate-700 shadow-xl flex gap-2">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-lg text-xs font-bold border border-slate-700">
                        {mode === 'BINARY' ? <ToggleLeft className="text-rose-400"/> : <ToggleRight className="text-emerald-400"/>}
                        <span className="text-slate-300">{mode} MODE</span>
                    </div>
                 </div>
            </div>

            <DebugToolbar 
                onReset={handleReset}
                onNext={() => setStep(s => Math.min(s + 1, SEMAPHORE_SCENARIO.length - 1))}
                canPrev={false}
                isPlaying={isPlaying}
                onTogglePlay={() => setIsPlaying(!isPlaying)}
                canNext={step < SEMAPHORE_SCENARIO.length - 1}
                canFinish={false}
            />

            {/* Visualizer with integrated Status Bar */}
            <SemaphoreVisualizer 
                type={mode}
                tokens={tokens}
                maxTokens={maxTokens}
                blockedTasks={blocked}
                owner={owner}
                tasks={tasks}
                activeTask={activeTask}
                stepDescription={currentStepData.text}
                stepMode={currentStepData.mode}
            />

            <DraggableHandle 
                orientation="horizontal" 
                onDrag={(dy) => setBottomHeight(h => Math.min(Math.max(h - dy, 150), 600))} 
            />

            <SemaphoreCodeView 
                activeLine={currentStepData.codeLine}
                height={bottomHeight}
                mode={currentStepData.mode as any}
            />
        </div>

        <DraggableHandle 
            orientation="vertical" 
            onDrag={(dx) => setSidebarWidth(w => Math.min(Math.max(w - dx, 220), 450))} 
        />

        {/* RIGHT PANE */}
        <SemaphoreDebuggerPane 
            type={mode}
            tokens={tokens}
            maxTokens={maxTokens}
            blockedTasks={blocked}
            owner={owner}
            width={sidebarWidth}
        />
        
    </div>
  );
};

export default Semaphores;
