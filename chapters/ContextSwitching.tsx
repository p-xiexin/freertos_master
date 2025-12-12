import React, { useState, useEffect } from 'react';
import Visualizer from '../components/context/Visualizer';
import CodeView from '../components/context/CodeView';
import DebuggerPane from '../components/context/DebuggerPane';
import DraggableHandle from '../components/DraggableHandle';
import { TOTAL_STEPS } from '../data/contextSwitchingData';

const ContextSwitching: React.FC = () => {
  const [step, setStep] = useState(0);
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [bottomHeight, setBottomHeight] = useState(300);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Layout constraints
  const minSidebarWidth = 250;
  const maxSidebarWidth = 500;
  const minBottomHeight = 150;
  const maxBottomHeight = 600;

  const nextStep = () => setStep(s => Math.min(s + 1, TOTAL_STEPS - 1));
  const prevStep = () => setStep(s => Math.max(s - 1, 0));
  const reset = () => {
    setStep(0);
    setIsPlaying(false);
  }
  const togglePlay = () => setIsPlaying(!isPlaying);

  useEffect(() => {
    let timer: any;
    if (isPlaying && step < TOTAL_STEPS - 1) {
      timer = setTimeout(() => {
        setStep(s => s + 1);
      }, 1200); // 1.2s per step for comfortable viewing
    } else if (step >= TOTAL_STEPS - 1) {
      setIsPlaying(false);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, step]);

  return (
    <div className="h-full w-full bg-slate-950 flex flex-col md:flex-row overflow-hidden">
      
      {/* LEFT PANE (Main Content) */}
      <div className="flex-1 flex flex-col min-w-0" style={{ height: '100%' }}>
        
        {/* TOP: Animation Canvas */}
        <Visualizer 
          step={step}
          setStep={setStep}
          nextStep={nextStep}
          prevStep={prevStep}
          reset={reset}
          isPlaying={isPlaying}
          togglePlay={togglePlay}
        />

        <DraggableHandle 
          orientation="horizontal" 
          onDrag={(dy) => setBottomHeight(h => Math.min(Math.max(h - dy, minBottomHeight), maxBottomHeight))} 
        />

        {/* BOTTOM: Code View */}
        <CodeView step={step} height={bottomHeight} />
      </div>

      <DraggableHandle 
        orientation="vertical" 
        onDrag={(dx) => setSidebarWidth(w => Math.min(Math.max(w - dx, minSidebarWidth), maxSidebarWidth))} 
      />

      {/* RIGHT PANE (Debugger Sidebar) */}
      <DebuggerPane step={step} width={sidebarWidth} />

    </div>
  );
};

export default ContextSwitching;