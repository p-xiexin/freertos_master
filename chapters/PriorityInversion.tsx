
import React, { useState } from 'react';
import { Terminal } from 'lucide-react';
import InversionVisualizer from '../components/mutex/InversionVisualizer';
import InversionCodeView from '../components/mutex/InversionCodeView';
import InversionDebuggerPane from '../components/mutex/InversionDebuggerPane';
import DraggableHandle from '../components/DraggableHandle';
import { SCENARIO_STEPS } from '../data/inversionData';
import DebugToolbar from '../components/DebugToolbar';

const PriorityInversion: React.FC = () => {
  const [step, setStep] = useState(0);
  const [isInheritance, setIsInheritance] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(300);
  const [bottomHeight, setBottomHeight] = useState(250);
  const [isPlaying, setIsPlaying] = useState(false);

  // Auto-play logic
  React.useEffect(() => {
    let timer: any;
    if (isPlaying && step < SCENARIO_STEPS.length - 1) {
      timer = setTimeout(() => {
        setStep(s => s + 1);
      }, 1500);
    } else if (step >= SCENARIO_STEPS.length - 1) {
      setIsPlaying(false);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, step]);

  // Derive State
  const getTasks = () => {
      let l = { id: 'L', name: 'Task L', prio: 1, basePrio: 1, state: 'READY' };
      let m = { id: 'M', name: 'Task M', prio: 2, basePrio: 2, state: 'READY' };
      let h = { id: 'H', name: 'Task H', prio: 3, basePrio: 3, state: 'READY' };
      
      let current = 'L';
      let owner = null;

      if (step >= 1) owner = 'L';
      
      if (step === 2) current = 'H';
      
      if (step >= 3) {
          h.state = 'BLOCKED';
          current = 'L';
          if (isInheritance && owner === 'L') l.prio = 3; 
      }
      
      if (step >= 4 && step <= 6) {
          if (isInheritance) {
              current = 'L';
              m.state = 'READY'; 
          } else {
              current = 'M';
              l.state = 'READY';
          }
      }

      if (step === 7) {
          owner = null;
          l.prio = 1;
          h.state = 'READY';
          current = 'H';
      }

      if (step === 8) {
          current = 'H';
          owner = 'H';
      }

      return { tasks: [l, m, h], current, owner };
  };

  const { tasks, current, owner } = getTasks();
  const currentStepData = SCENARIO_STEPS[step] || SCENARIO_STEPS[0];

  return (
    <div className="h-full w-full bg-slate-950 flex flex-col md:flex-row overflow-hidden relative">
        
        {/* LEFT PANE */}
        <div className="flex-1 flex flex-col min-w-0" style={{ height: '100%' }}>
            
            {/* Mode Switcher */}
            <div className="absolute top-6 left-6 z-40 bg-slate-900/90 backdrop-blur p-1 rounded-xl border border-slate-700 shadow-xl flex gap-1">
                 <button 
                    onClick={() => { setIsInheritance(false); setStep(0); setIsPlaying(false); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${!isInheritance ? 'bg-rose-500/20 text-rose-400' : 'text-slate-400 hover:text-white'}`}
                 >
                    Normal Mutex
                 </button>
                 <button 
                    onClick={() => { setIsInheritance(true); setStep(0); setIsPlaying(false); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${isInheritance ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-white'}`}
                 >
                    Priority Inheritance
                 </button>
            </div>

            <DebugToolbar 
                onReset={() => { setStep(0); setIsPlaying(false); }}
                onNext={() => setStep(s => Math.min(s + 1, SCENARIO_STEPS.length - 1))}
                // onPrev is removed as requested
                isPlaying={isPlaying}
                onTogglePlay={() => setIsPlaying(!isPlaying)}
                canNext={step < SCENARIO_STEPS.length - 1}
                canFinish={false}
            />

            {/* Visualizer with integrated Status Bar */}
            <InversionVisualizer 
                tasks={tasks}
                currentTask={current}
                mutexOwner={owner}
                isInheritanceEnabled={isInheritance}
                stepDescription={currentStepData.text}
                stepType={currentStepData.codeTab}
            />

            <DraggableHandle 
                orientation="horizontal" 
                onDrag={(dy) => setBottomHeight(h => Math.min(Math.max(h - dy, 150), 600))} 
            />

            <InversionCodeView 
                activeLine={currentStepData.codeLine}
                activeTab={currentStepData.codeTab as any}
                height={bottomHeight}
            />
        </div>

        <DraggableHandle 
            orientation="vertical" 
            onDrag={(dx) => setSidebarWidth(w => Math.min(Math.max(w - dx, 220), 450))} 
        />

        <InversionDebuggerPane 
            tasks={tasks}
            mutexOwner={owner}
            width={sidebarWidth}
        />
        
    </div>
  );
};

export default PriorityInversion;
