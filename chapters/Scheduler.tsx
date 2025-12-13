
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

type CodeTab = 'port' | 'kernel' | 'led' | 'uart' | 'isr';

// --- Micro-Instruction Definitions ---

type KernelStep = {
    tab: CodeTab;
    line: number;
    label: string;
    action?: 'INC_TICK' | 'CHECK_UNBLOCK' | 'CHECK_EMPTY' | 'UNBLOCK' | 'FLAG_SWITCH' | 'CHECK_SWITCH' | 'FLAG_PENDSV' | 'SWITCH_CONTEXT';
    jump?: string; // Unconditional Jump to sequence
    branch?: string; // Conditional logic handled in code
    return?: boolean; // Return from "function"
};

const KERNEL_SEQUENCES: Record<string, KernelStep[]> = {
    // 1. SysTick Handler Entry
    SYSTICK_ENTRY: [
        { tab: 'port', line: 2, label: "ISR Entry: SysTick_Handler" },
        { tab: 'port', line: 5, label: "Critical Section: Disable Interrupts" },
        { tab: 'port', line: 8, label: "Call Kernel: xTaskIncrementTick()", jump: 'INC_TICK_ENTRY' }
    ],

    // 2. Kernel: Increment Tick
    INC_TICK_ENTRY: [
        { tab: 'kernel', line: 3, label: "Kernel Entry: xTaskIncrementTick" },
        { tab: 'kernel', line: 6, label: "Prepare Tick Update" },
        { tab: 'kernel', line: 7, label: "Increment xTickCount", action: 'INC_TICK' },
        { tab: 'kernel', line: 10, label: "Check Delayed List (Next Unblock Time)", branch: 'CHECK_UNBLOCK' }
    ],
    // Branch: No tasks to wake
    INC_TICK_SKIP: [
         { tab: 'kernel', line: 20, label: "Return xSwitchRequired (False)", return: true }
    ],
    // Branch: Tasks might wake
    INC_TICK_LOOP_CHECK: [
        { tab: 'kernel', line: 13, label: "Check: Is Delayed List Empty?", branch: 'CHECK_EMPTY' }
    ],
    INC_TICK_UNBLOCK: [
        { tab: 'kernel', line: 15, label: "Remove Task from Blocked List", action: 'UNBLOCK' },
        { tab: 'kernel', line: 16, label: "Add Task to Ready List" },
        { tab: 'kernel', line: 17, label: "Flag Context Switch Required", action: 'FLAG_SWITCH' },
        { tab: 'kernel', line: 12, label: "Loop Back...", jump: 'INC_TICK_LOOP_CHECK' } // Jump back to loop check
    ],
    INC_TICK_RETURN: [
        { tab: 'kernel', line: 20, label: "Return xSwitchRequired", return: true }
    ],

    // 3. Back to SysTick
    SYSTICK_RESUME: [
        { tab: 'port', line: 8, label: "Check xTaskIncrementTick Result", branch: 'CHECK_SWITCH' }
    ],
    SYSTICK_SWITCH: [
        { tab: 'port', line: 11, label: "Trigger PendSV (Context Switch)", action: 'FLAG_PENDSV' },
        { tab: 'port', line: 12, label: "End If" }
    ],
    SYSTICK_EXIT: [
        { tab: 'port', line: 14, label: "Enable Interrupts" },
        { tab: 'port', line: 15, label: "ISR Exit (Exception Return)" }
    ],

    // 4. PendSV (Context Switch)
    PENDSV_ENTRY: [
        { tab: 'kernel', line: 23, label: "PendSV Handler: vTaskSwitchContext" },
        { tab: 'kernel', line: 25, label: "Check Scheduler State" },
        { tab: 'kernel', line: 31, label: "Clear Yield Pending" },
        { tab: 'kernel', line: 33, label: "Select Highest Priority Task", action: 'SWITCH_CONTEXT' },
        { tab: 'kernel', line: 35, label: "Exit Context Switch" }
    ]
};

// User-Space Code Maps
type UserStep = {
    tab: CodeTab;
    line: number;
    cycles: number;
    label: string | ((tick: number) => string);
    resetTo?: number;
};
const USER_PROGRAMS: Record<number, UserStep[]> = {
    1: [
        { tab: 'led', line: 6, cycles: 1, label: "LED: HAL_GPIO_TogglePin" },
        { tab: 'led', line: 9, cycles: 4, label: "LED: Workload..." },
        { tab: 'led', line: 12, cycles: 1, label: (tick) => `vTaskDelay(4) @ tick ${tick}`, resetTo: 0 },
    ],
    2: [
        { tab: 'uart', line: 6, cycles: 1, label: "taskENTER_CRITICAL()" },
        { tab: 'uart', line: 8, cycles: 2, label: (tick) => `printf("Tick: ${tick}")` },
        { tab: 'uart', line: 10, cycles: 1, label: "taskEXIT_CRITICAL()" },
        { tab: 'uart', line: 12, cycles: 1, label: (tick) => `vTaskDelay(2) @ tick ${tick}`, resetTo: 0 },
    ],
    0: [
        { tab: 'kernel', line: null, cycles: 1, label: "Idle Task Loop" }
    ]
};

const Scheduler: React.FC = () => {
  // --- State ---
  const [tickCount, setTickCount] = useState(0);
  const [tasks, setTasks] = useState<SimTask[]>(JSON.parse(JSON.stringify(INITIAL_TASKS)));
  const [currentTaskId, setCurrentTaskId] = useState(1);
  const [statusLog, setStatusLog] = useState("System Ready. Click Next or Play.");
  const [uartLog, setUartLog] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [isFastForwarding, setIsFastForwarding] = useState(false);
  
  // Internal OS State
  const [criticalNesting, setCriticalNesting] = useState(0);
  const [pendingInterrupt, setPendingInterrupt] = useState(false);
  const [isExecutingISR, setIsExecutingISR] = useState(false);
  
  // Execution Control
  const [mode, setMode] = useState<'USER' | 'KERNEL'>('USER');
  const [userPointers, setUserPointers] = useState<Record<number, number>>({ 0: 0, 1: 0, 2: 0 });
  
  // Kernel Execution State
  const [kernelSeqId, setKernelSeqId] = useState<string>('SYSTICK_ENTRY');
  const [kernelPc, setKernelPc] = useState(0);
  
  // Internal Flags (Refs for logic)
  const isSwitchRequiredRef = useRef(false);
  const isPendSvPendingRef = useRef(false);
  
  const [activeCode, setActiveCode] = useState<{ tab: CodeTab; line: number | null }>({ tab: 'led', line: 6 });

  // Layout
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [bottomHeight, setBottomHeight] = useState(300);

  // --- Refs ---
  const tickRef = useRef(tickCount);
  const tasksRef = useRef(tasks);
  const criticalRef = useRef(criticalNesting);
  const currentTaskRef = useRef(currentTaskId);

  // Sync Refs
  useEffect(() => { tickRef.current = tickCount; }, [tickCount]);
  useEffect(() => { tasksRef.current = tasks; }, [tasks]);
  useEffect(() => { criticalRef.current = criticalNesting; }, [criticalNesting]);
  useEffect(() => { currentTaskRef.current = currentTaskId; }, [currentTaskId]);

  const updateTasks = (newTasks: SimTask[]) => {
      setTasks(newTasks);
      tasksRef.current = newTasks;
  };

  const blockTask = (taskId: number, delay: number) => {
      const updated = tasksRef.current.map(t => {
          if (t.id === taskId) return { ...t, state: 'BLOCKED', wakeTick: tickRef.current + delay };
          if (t.id !== taskId && t.state === 'RUNNING') return { ...t, state: 'READY' }; 
          return t;
      }) as SimTask[];
      updateTasks(updated);
      isSwitchRequiredRef.current = true;
  };

  const selectHighestPriority = () => {
      const ready = tasksRef.current.filter(t => t.state === 'READY' || t.state === 'RUNNING');
      ready.sort((a, b) => b.priority - a.priority);
      const next = ready.length > 0 ? ready[0] : tasksRef.current.find(t => t.id === 0)!;
      
      if (next.id !== currentTaskRef.current) {
           const finalTasks = tasksRef.current.map(t => ({
               ...t,
               state: (t.id === next.id ? 'RUNNING' : (t.state === 'RUNNING' ? 'READY' : t.state))
           })) as SimTask[];
           updateTasks(finalTasks);
           setCurrentTaskId(next.id);
           setStatusLog(`Context Switch: ${next.name} is now RUNNING`);
      }
  };

  // --- Core Execution Logic ---

  const executeStep = useCallback((isManual = false) => {
      
      // 1. Handle External Interrupts (Async)
      if (pendingInterrupt && criticalRef.current === 0 && !isExecutingISR && mode === 'USER') {
          setIsExecutingISR(true);
          setPendingInterrupt(false);
          setActiveCode({ tab: 'isr', line: 1 });
          setStatusLog("Hardware Interrupt! Jumping to ISR...");
          return; 
      }
      
      // 2. Handle External ISR execution (Simplified)
      if (isExecutingISR) {
          setIsExecutingISR(false);
          setActiveCode({ tab: 'isr', line: 10 });
          setStatusLog("ISR: Clearing Flag & Yielding...");
          isSwitchRequiredRef.current = true;
          // Trigger PendSV logic if we were in kernel mode? No, simplified here.
          // If we want to simulate switch after EXTI, we should set PendSV pending.
          isPendSvPendingRef.current = true; 
          // Transition to Kernel to handle switch
          setMode('KERNEL');
          setKernelSeqId('PENDSV_ENTRY');
          setKernelPc(0);
          return;
      }

      // 3. User Code Execution
      if (mode === 'USER') {
          const taskId = currentTaskRef.current;
          const program = USER_PROGRAMS[taskId];
          const pc = userPointers[taskId] || 0;
          const userLine = program[pc];

          setActiveCode({ tab: userLine.tab, line: userLine.line });
          const logMsg = typeof userLine.label === 'function' ? userLine.label(tickRef.current) : userLine.label;
          setStatusLog(logMsg);

          // User Side Effects
          if (taskId === 2 && userLine.line === 6) setCriticalNesting(c => c + 1);
          if (taskId === 2 && userLine.line === 10) setCriticalNesting(c => Math.max(0, c - 1));
          if (taskId === 2 && userLine.line === 8) setUartLog(p => p + `Tick: ${tickRef.current}\n`);
          
          if (userLine.line === 12 && taskId !== 0) {
              const delay = taskId === 2 ? 2 : 4;
              blockTask(taskId, delay);
              // Yield immediately -> Switch to PendSV
              setMode('KERNEL');
              setKernelSeqId('PENDSV_ENTRY'); // Direct call to switch
              setKernelPc(0);
              // Reset PC for next time
              setUserPointers(prev => ({ ...prev, [taskId]: 0 })); 
              return;
          }

          // Advance User PC
          const nextPc = userLine.resetTo ?? ((pc + 1) % program.length);
          setUserPointers(prev => ({ ...prev, [taskId]: nextPc }));

          // Randomly trigger SysTick (Simulate Timer Interrupt)
          // Every few steps, we force a SysTick if interrupts enabled
          if (criticalRef.current === 0 && Math.random() > 0.6) {
              setMode('KERNEL');
              setKernelSeqId('SYSTICK_ENTRY');
              setKernelPc(0);
              setStatusLog("Interrupt: SysTick Fired!");
          }
          return;
      }

      // 4. Kernel/Port Execution (Instruction Stepping)
      if (mode === 'KERNEL') {
          const sequence = KERNEL_SEQUENCES[kernelSeqId];
          const step = sequence[kernelPc];
          
          if (!step) {
              // Safety fallback
              setMode('USER');
              return;
          }

          setActiveCode({ tab: step.tab, line: step.line });
          setStatusLog(step.label);

          // Handle Action
          if (step.action === 'INC_TICK') {
              setTickCount(t => t + 1);
          }
          else if (step.action === 'UNBLOCK') {
              // Find first blocked task that needs waking
              const taskToWake = tasksRef.current.find(t => t.state === 'BLOCKED' && t.wakeTick <= tickRef.current);
              if (taskToWake) {
                  const updated = tasksRef.current.map(t => 
                      t.id === taskToWake.id ? { ...t, state: 'READY', wakeTick: 0 } : t
                  ) as SimTask[];
                  updateTasks(updated);
                  setStatusLog(`Unblocking Task: ${taskToWake.name}`);
              }
          }
          else if (step.action === 'FLAG_SWITCH') {
              isSwitchRequiredRef.current = true;
          }
          else if (step.action === 'FLAG_PENDSV') {
              isPendSvPendingRef.current = true;
          }
          else if (step.action === 'SWITCH_CONTEXT') {
              selectHighestPriority();
              isSwitchRequiredRef.current = false;
              isPendSvPendingRef.current = false;
          }

          // Handle Flow Control (Branch/Jump/Return/Next)
          let nextSeq = kernelSeqId;
          let nextPc = kernelPc + 1;

          if (step.jump) {
              nextSeq = step.jump;
              nextPc = 0;
          } 
          else if (step.return) {
              // Return from "function calls"
              if (kernelSeqId.startsWith('INC_TICK')) {
                  nextSeq = 'SYSTICK_RESUME';
                  nextPc = 0;
              }
          }
          else if (step.branch === 'CHECK_UNBLOCK') {
              // Check if we need to look at list
              const hasBlocked = tasksRef.current.some(t => t.state === 'BLOCKED');
              const timeReached = tasksRef.current.some(t => t.state === 'BLOCKED' && t.wakeTick <= tickRef.current);
              if (hasBlocked && timeReached) {
                  nextSeq = 'INC_TICK_LOOP_CHECK';
                  nextPc = 0;
              } else {
                  nextSeq = 'INC_TICK_SKIP'; // Skip loop
                  nextPc = 0;
              }
          }
          else if (step.branch === 'CHECK_EMPTY') {
               const tasksToWake = tasksRef.current.filter(t => t.state === 'BLOCKED' && t.wakeTick <= tickRef.current);
               // Since we unblock one at a time in 'UNBLOCK' action, check if any left
               // Note: The previous step 'UNBLOCK' might have just cleared the last one.
               // We need to check 'state' in refs.
               // Actually, simpler: if we just unblocked one, we might loop again?
               // Let's rely on finding one.
               const stillHas = tasksRef.current.some(t => t.state === 'BLOCKED' && t.wakeTick <= tickRef.current);
               if (stillHas) {
                   nextSeq = 'INC_TICK_UNBLOCK';
                   nextPc = 0;
               } else {
                   nextSeq = 'INC_TICK_RETURN';
                   nextPc = 0;
               }
          }
          else if (step.branch === 'CHECK_SWITCH') {
              if (isSwitchRequiredRef.current) {
                  nextSeq = 'SYSTICK_SWITCH';
                  nextPc = 0;
              } else {
                  nextSeq = 'SYSTICK_EXIT';
                  nextPc = 0;
              }
          }

          // Check for sequence end without jump/return
          if (nextSeq === kernelSeqId && nextPc >= sequence.length) {
              // End of a linear sequence
              if (kernelSeqId === 'SYSTICK_EXIT') {
                  // Exit ISR
                  if (isPendSvPendingRef.current) {
                      nextSeq = 'PENDSV_ENTRY'; // Tail chain
                      nextPc = 0;
                  } else {
                      setMode('USER'); // Return to user
                      return;
                  }
              }
              else if (kernelSeqId === 'PENDSV_ENTRY') {
                  setMode('USER');
                  return;
              }
              else if (kernelSeqId === 'SYSTICK_SWITCH') {
                  nextSeq = 'SYSTICK_EXIT'; // Continue
                  nextPc = 0;
              }
          }

          setKernelSeqId(nextSeq);
          setKernelPc(nextPc);
      }

  }, [pendingInterrupt, isExecutingISR, mode, userPointers, kernelSeqId, kernelPc]);

  // --- Auto Run Loop ---
  useEffect(() => {
    let timer: any;
    if (isRunning) {
        timer = setTimeout(() => executeStep(false), isFastForwarding ? 100 : 800);
    }
    return () => clearTimeout(timer);
  }, [isRunning, executeStep, isFastForwarding]);

  const handleReset = () => {
      setIsRunning(false);
      setTickCount(0);
      setTasks(JSON.parse(JSON.stringify(INITIAL_TASKS)));
      setCurrentTaskId(1);
      
      setMode('USER');
      setUserPointers({ 0: 0, 1: 0, 2: 0 });
      setKernelSeqId('SYSTICK_ENTRY');
      setKernelPc(0);
      
      setCriticalNesting(0);
      setPendingInterrupt(false);
      setUartLog("");
      setStatusLog("System Reset.");
      setActiveCode({ tab: 'led', line: 6 });
      isSwitchRequiredRef.current = false;
      isPendSvPendingRef.current = false;
  };

  const triggerInterrupt = () => {
      setPendingInterrupt(true);
      setStatusLog("EXTI Line 0 Pending...");
  };

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
                onStepTick={() => executeStep(true)}
                onReset={handleReset}
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
                activeTabOverride={activeCode.tab}
                activeLine={activeCode.line}
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
