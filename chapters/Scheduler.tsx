
import React, { useState, useEffect, useCallback, useRef } from 'react';
import SchedulerVisualizer from '../components/scheduler/SchedulerVisualizer';
import SchedulerCodeView from '../components/scheduler/SchedulerCodeView';
import SchedulerDebuggerPane from '../components/scheduler/SchedulerDebuggerPane';
import DraggableHandle from '../components/DraggableHandle';
import { SimTask } from '../data/schedulerData';

const INITIAL_TASKS: SimTask[] = [
    { id: 1, name: "LED Task", priority: 2, state: 'READY', color: 'bg-rose-500', wakeTick: 0 },
    { id: 2, name: "UART Task", priority: 1, state: 'READY', color: 'bg-indigo-500', wakeTick: 0 },
    { id: 0, name: "Idle Task", priority: 0, state: 'READY', color: 'bg-slate-500', wakeTick: 0 },
];

// Expanded State Machine Phases
type SchedulerPhase = 
    | 'TICK_INC' 
    | 'CHECK_BLOCKED' 
    | 'CHECK_SWITCH' 
    | 'SWITCH_CONTEXT' 
    // Task Execution
    | 'TASK_EXEC_1' 
    | 'TASK_EXEC_2' 
    | 'TASK_BLOCK' 
    | 'TASK_YIELD'
    // Critical Section
    | 'CRITICAL_ENTER'
    | 'CRITICAL_BODY'
    | 'CRITICAL_EXIT'
    // Interrupt
    | 'ISR_ENTRY'
    | 'ISR_EXEC'
    | 'ISR_EXIT';

const Scheduler: React.FC = () => {
  // --- State ---
  const [tickCount, setTickCount] = useState(0);
  const [tasks, setTasks] = useState<SimTask[]>(JSON.parse(JSON.stringify(INITIAL_TASKS)));
  const [currentTaskId, setCurrentTaskId] = useState(0); 
  const [phase, setPhase] = useState<SchedulerPhase>('TICK_INC');
  const [isRunning, setIsRunning] = useState(false);
  const [statusLog, setStatusLog] = useState("System Reset. Scheduler Ready.");
  const [uartLog, setUartLog] = useState("");
  const [isFastForwarding, setIsFastForwarding] = useState(false); // Visual state for fast forward
  
  // New States for Critical Section & ISR
  const [criticalNesting, setCriticalNesting] = useState(0);
  const [pendingInterrupt, setPendingInterrupt] = useState(false);
  const [isExecutingISR, setIsExecutingISR] = useState(false);

  // Layout State
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [bottomHeight, setBottomHeight] = useState(300);

  const handleReset = () => {
      setIsRunning(false);
      setTickCount(0);
      setTasks(JSON.parse(JSON.stringify(INITIAL_TASKS)));
      setCurrentTaskId(0);
      setPhase('TICK_INC');
      setCriticalNesting(0);
      setPendingInterrupt(false);
      setIsExecutingISR(false);
      setStatusLog("System Reset. Scheduler Ready.");
      setUartLog("");
      setIsFastForwarding(false);
  };

  const triggerInterrupt = () => {
      setPendingInterrupt(true);
      setStatusLog("Hardware Interrupt (EXTI) Triggered! Pending...");
      // Interrupt wakes up auto-run if stopped, but we handle that in useEffect
  };

  const executeStep = useCallback(() => {
    
    // --- Global Interrupt Check (Highest Priority Logic) ---
    if (pendingInterrupt && criticalNesting === 0 && !isExecutingISR) {
        setIsExecutingISR(true);
        setPendingInterrupt(false); 
        setPhase('ISR_ENTRY');
        setStatusLog(" NVIC: Entering ISR (Preempting Task)");
        setIsFastForwarding(false); // Stop fast forward on interrupt
        return; 
    }

    switch (phase) {
        // --- ISR FLOW ---
        case 'ISR_ENTRY':
            setPhase('ISR_EXEC');
            setStatusLog("ISR: Executing Handler Code");
            break;
        case 'ISR_EXEC':
            setPhase('ISR_EXIT');
            setStatusLog("ISR: Clearing Flags & Requesting Yield");
            break;
        case 'ISR_EXIT':
            setIsExecutingISR(false);
            setPhase('CHECK_SWITCH'); 
            setStatusLog("ISR Exit: Checking for higher priority tasks...");
            break;

        // --- NORMAL SCHEDULER FLOW ---
        case 'TICK_INC': {
            const newTick = tickCount + 1;
            setTickCount(newTick);
            setPhase('CHECK_BLOCKED');
            // If we are in fast forward mode, log less frequently or differently
            if (!isFastForwarding) {
                setStatusLog(`SysTick ISR: xTickCount incremented to ${newTick}`);
            }
            break;
        }
        case 'CHECK_BLOCKED': {
            const nextTick = tickCount; 
            const wokeTasks = tasks.filter(t => t.state === 'BLOCKED' && t.wakeTick <= nextTick);
            
            if (wokeTasks.length > 0) {
                setTasks(prev => prev.map(t => {
                    if (t.state === 'BLOCKED' && t.wakeTick <= tickCount) {
                        return { ...t, state: 'READY', wakeTick: 0 };
                    }
                    return t;
                }) as SimTask[]);
                setStatusLog(`Scheduler: Waking up ${wokeTasks.map(t=>t.name).join(', ')}...`);
                setIsFastForwarding(false); // Stop fast forward when someone wakes up
            } else {
                 if (!isFastForwarding && currentTaskId === 0) {
                    setStatusLog("Scheduler: No tasks to wake yet.");
                 }
            }
            setPhase('CHECK_SWITCH');
            break;
        }
        case 'CHECK_SWITCH': {
            const readyTasks = tasks.filter(t => t.state === 'READY' || t.state === 'RUNNING');
            readyTasks.sort((a, b) => b.priority - a.priority);
            const nextTask = readyTasks[0];
            
            if (nextTask && nextTask.id !== currentTaskId) {
                setPhase('SWITCH_CONTEXT');
                setStatusLog(`Scheduler: Switching to Priority ${nextTask.priority} Task...`);
                setIsFastForwarding(false); 
            } else {
                if (tasks.find(t => t.id === currentTaskId)?.state !== 'RUNNING') {
                     setTasks(prev => prev.map(t => t.id === currentTaskId ? { ...t, state: 'RUNNING' } : t) as SimTask[]);
                }
                setPhase('TASK_EXEC_1');
                if (!isFastForwarding) setStatusLog(`Scheduler: Staying in current task.`);
            }
            break;
        }
        case 'SWITCH_CONTEXT': {
            const readyTasks = tasks.filter(t => t.state === 'READY' || t.state === 'RUNNING');
            readyTasks.sort((a, b) => b.priority - a.priority);
            const nextTask = readyTasks[0];

            if (nextTask) {
                setTasks(prev => prev.map(t => {
                    if (t.id === currentTaskId) return { ...t, state: 'READY' };
                    if (t.id === nextTask.id) return { ...t, state: 'RUNNING' };
                    return t;
                }) as SimTask[]);
                setCurrentTaskId(nextTask.id);
                setStatusLog(`Context Switch Complete: Now running ${nextTask.name}`);
            }
            setPhase('TASK_EXEC_1');
            break;
        }
        
        // --- TASK EXECUTION ---
        case 'TASK_EXEC_1': {
            const tName = tasks.find(t => t.id === currentTaskId)?.name;
            if (currentTaskId === 2) {
                setPhase('CRITICAL_ENTER');
                setStatusLog(`${tName}: Entering Critical Section...`);
            } else {
                setPhase('TASK_EXEC_2');
                if (!isFastForwarding) setStatusLog(`${tName}: Executing Application Code...`);
            }
            break;
        }

        // Critical Section Flow
        case 'CRITICAL_ENTER':
            setCriticalNesting(c => c + 1);
            setPhase('CRITICAL_BODY');
            setStatusLog("Task: Interrupts Disabled (taskENTER_CRITICAL)");
            break;
        case 'CRITICAL_BODY':
            // Simulate printf logic for UART Task
            if (currentTaskId === 2) {
                const logMsg = `Tick: ${tickCount}\n`;
                setUartLog(prev => prev + logMsg);
                setStatusLog(`UART Output: "Tick: ${tickCount}"`);
            } else {
                setStatusLog("Task: Performing Safe Operations...");
            }
            setPhase('CRITICAL_EXIT');
            break;
        case 'CRITICAL_EXIT':
            setCriticalNesting(c => Math.max(0, c - 1));
            setPhase('TASK_EXEC_2'); 
            setStatusLog("Task: Interrupts Enabled (taskEXIT_CRITICAL)");
            break;

        // Normal Flow
        case 'TASK_EXEC_2': {
            if (currentTaskId === 0) { 
                // Idle Task
                setPhase('TICK_INC'); 
                if (!isFastForwarding) setStatusLog("Idle Task: Waiting for next SysTick...");
            } else { 
                // User Tasks
                setPhase('TASK_BLOCK'); 
                setStatusLog(`Task: Calling vTaskDelay(). Yielding to Scheduler...`);
            }
            break;
        }
        case 'TASK_BLOCK': {
            setTasks(prev => prev.map(t => {
                const delay = t.id === 2 ? 2 : 4; 
                // Wake time is Current Tick + Delay
                if (t.id === currentTaskId) return { ...t, state: 'BLOCKED', wakeTick: tickCount + delay };
                return t;
            }) as SimTask[]);
            
            const delay = currentTaskId === 2 ? 2 : 4;
            setStatusLog(`Task Blocked! Sleeping for ${delay} ticks (Wake @ ${tickCount + delay})`);
            setPhase('CHECK_SWITCH');
            break;
        }
        case 'TASK_YIELD': {
            setPhase('TICK_INC');
            break;
        }
    }
  }, [phase, tasks, tickCount, currentTaskId, pendingInterrupt, criticalNesting, isExecutingISR, isFastForwarding]);

  // --- Auto Run Timing & Smart Fast Forward ---
  useEffect(() => {
      let timeout: any;
      
      // Determine if we should be auto-running (either Play button is On, OR we are in Idle Fast Forward mode)
      const shouldRun = isRunning || (currentTaskId === 0 && tasks.some(t => t.state === 'BLOCKED'));

      if (shouldRun) {
          let stepDelay = 800; // Default slow speed for readability

          // === SMART SPEED LOGIC ===
          
          // 1. If in Idle Task and there are blocked tasks waiting, FAST FORWARD
          if (currentTaskId === 0 && tasks.some(t => t.state === 'BLOCKED')) {
             if (!isFastForwarding) setIsFastForwarding(true);
             stepDelay = 50; // Super fast! 50ms per tick
             if (phase === 'CHECK_BLOCKED' && tasks.some(t => t.state === 'BLOCKED' && t.wakeTick <= tickCount)) {
                 // A task is about to wake up! SLOW DOWN NOW.
                 stepDelay = 1500; 
             }
          } else {
             if (isFastForwarding) setIsFastForwarding(false);

             // Normal variable speeds for readability
             if (phase === 'SWITCH_CONTEXT') stepDelay = 1200; // Pause on context switch
             if (phase === 'TASK_BLOCK') stepDelay = 1500; // Pause on Block call so user sees it
             if (phase.startsWith('ISR')) stepDelay = 800; // Show interrupts clearly
             if (currentTaskId !== 0 && (phase === 'CHECK_BLOCKED' || phase === 'CHECK_SWITCH')) stepDelay = 100; // Internal scheduler logic is fast
          }

          // If user manually paused, but we are fast forwarding, we keep going until wake
          // UNLESS we just woke someone up, then we respect the pause.
          const effectivelyRunning = isRunning || isFastForwarding;
          
          if (effectivelyRunning) {
            timeout = setTimeout(executeStep, stepDelay);
          }
      }
      return () => clearTimeout(timeout);
  }, [isRunning, executeStep, pendingInterrupt, criticalNesting, currentTaskId, phase, isExecutingISR, tasks, tickCount, isFastForwarding]);

  // --- Code Highlight Logic ---
  const getCodeState = () => {
      let tab: 'kernel' | 'led' | 'uart' | 'isr' = 'kernel';
      let line: number | null = null;

      if (isExecutingISR || phase.startsWith('ISR')) {
          tab = 'isr';
          switch (phase) {
              case 'ISR_ENTRY': line = 1; break;
              case 'ISR_EXEC': line = 7; break; 
              case 'ISR_EXIT': line = 10; break; 
          }
      } else {
          switch (phase) {
              case 'TICK_INC': tab = 'kernel'; line = 5; break;
              case 'CHECK_BLOCKED': tab = 'kernel'; line = 8; break;
              case 'CHECK_SWITCH': tab = 'kernel'; line = 18; break; 
              case 'SWITCH_CONTEXT': tab = 'kernel'; line = 23; break;
              
              case 'TASK_EXEC_1': 
                if (currentTaskId === 1) { tab = 'led'; line = 6; } 
                else if (currentTaskId === 2) { tab = 'uart'; line = 6; } 
                break;

              case 'CRITICAL_ENTER': tab = 'uart'; line = 6; break;
              case 'CRITICAL_BODY': tab = 'uart'; line = 8; break; // printf line
              case 'CRITICAL_EXIT': tab = 'uart'; line = 10; break;

              case 'TASK_EXEC_2':
                  if (currentTaskId === 1) { tab = 'led'; line = 9; } 
                  else if (currentTaskId === 2) { tab = 'uart'; line = 12; } // vTaskDelay
                  break;
                  
              case 'TASK_BLOCK': 
                  if (currentTaskId === 1) { tab = 'led'; line = 12; }
                  else if (currentTaskId === 2) { tab = 'uart'; line = 12; }
                  break;
          }
      }
      return { tab, line };
  };

  const codeState = getCodeState();

  return (
    <div className="h-full w-full bg-slate-950 flex flex-col md:flex-row overflow-hidden">
        
        {/* LEFT PANE */}
        <div className="flex-1 flex flex-col min-w-0" style={{ height: '100%' }}>
            
            <SchedulerVisualizer 
                tickCount={tickCount}
                tasks={tasks}
                currentTaskId={currentTaskId}
                isRunning={isRunning}
                onToggleRun={() => setIsRunning(!isRunning)}
                onStepTick={executeStep}
                onReset={handleReset}
                
                // New Props
                statusLog={statusLog}
                isCritical={criticalNesting > 0}
                pendingInterrupt={pendingInterrupt}
                isExecutingISR={isExecutingISR}
                triggerInterrupt={triggerInterrupt}
                isFastForwarding={isFastForwarding}
            />

            <DraggableHandle 
                orientation="horizontal" 
                onDrag={(dy) => setBottomHeight(h => Math.min(Math.max(h - dy, 150), 600))} 
            />

            <SchedulerCodeView 
                activeTabOverride={codeState.tab}
                activeLine={codeState.line}
                height={bottomHeight}
                uartLog={uartLog}
            />
        </div>

        <DraggableHandle 
            orientation="vertical" 
            onDrag={(dx) => setSidebarWidth(w => Math.min(Math.max(w - dx, 220), 450))} 
        />

        {/* RIGHT PANE */}
        <SchedulerDebuggerPane 
            tickCount={tickCount}
            currentTaskId={currentTaskId}
            tasks={tasks}
            width={sidebarWidth}
            criticalNesting={criticalNesting}
            pendingInterrupt={pendingInterrupt}
            isExecutingISR={isExecutingISR}
        />
        
    </div>
  );
};

export default Scheduler;
