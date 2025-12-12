
import React, { useState } from 'react';
import TaskVisualizer from '../components/tasks/TaskVisualizer';
import TaskCodeView from '../components/tasks/TaskCodeView';
import TaskDebuggerPane from '../components/tasks/TaskDebuggerPane';
import DraggableHandle from '../components/DraggableHandle';
import { TaskState } from '../types';

const TaskLifecycle: React.FC = () => {
  const [currentState, setCurrentState] = useState<TaskState>(TaskState.READY);
  const [activeLine, setActiveLine] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [systemLog, setSystemLog] = useState<string>("System Boot: Task 'MainTask' created in READY list.");
  
  // Layout State
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [bottomHeight, setBottomHeight] = useState(250);

  // Layout constraints
  const minSidebarWidth = 220;
  const maxSidebarWidth = 450;
  const minBottomHeight = 150;
  const maxBottomHeight = 600;

  const handleTransition = async (targetState: TaskState, lineNum: number, log: string) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setActiveLine(lineNum);
    
    // Add timestamped log
    const timestamp = new Date().toISOString().split('T')[1].slice(0,12);
    setSystemLog(prev => `${prev}\n[${timestamp}] ${log}`);

    // Wait for animation simulation
    await new Promise(r => setTimeout(r, 600));

    setCurrentState(targetState);
    
    // If entered running, simulate execution after a brief delay
    if (targetState === TaskState.RUNNING) {
      setTimeout(() => {
          setActiveLine(6); // Move to "PerformApplicationTask"
          setSystemLog(prev => `${prev}\n... CPU executing application code ...`);
      }, 500);
    }
    
    setTimeout(() => setIsAnimating(false), 600);
  };

  return (
    <div className="h-full w-full bg-slate-950 flex flex-col md:flex-row overflow-hidden">
        
        {/* LEFT PANE (Main Content) */}
        <div className="flex-1 flex flex-col min-w-0" style={{ height: '100%' }}>
            
            {/* TOP: Visualizer */}
            <TaskVisualizer 
                currentState={currentState}
                isAnimating={isAnimating}
                onTransition={handleTransition}
            />

            <DraggableHandle 
                orientation="horizontal" 
                onDrag={(dy) => setBottomHeight(h => Math.min(Math.max(h - dy, minBottomHeight), maxBottomHeight))} 
            />

            {/* BOTTOM: Code & Log */}
            <TaskCodeView 
                activeLine={activeLine}
                height={bottomHeight}
                systemLog={systemLog}
            />
        </div>

        <DraggableHandle 
            orientation="vertical" 
            onDrag={(dx) => setSidebarWidth(w => Math.min(Math.max(w - dx, minSidebarWidth), maxSidebarWidth))} 
        />

        {/* RIGHT PANE (Debugger Sidebar) */}
        <TaskDebuggerPane 
            currentState={currentState}
            width={sidebarWidth}
        />
        
    </div>
  );
};

export default TaskLifecycle;
