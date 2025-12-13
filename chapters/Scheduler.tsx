
import React, { useState, useEffect, useCallback, useRef } from 'react';
import SchedulerVisualizer from '../components/scheduler/SchedulerVisualizer';
import SchedulerCodeView from '../components/scheduler/SchedulerCodeView';
import SchedulerDebuggerPane from '../components/scheduler/SchedulerDebuggerPane';
import DraggableHandle from '../components/DraggableHandle';
import { SimTask } from '../data/schedulerData';

const INITIAL_TASKS: SimTask[] = [
    { id: 1, name: "LED Task", priority: 2, state: 'READY', color: 'bg-rose-500', wakeTick: 0, insertOrder: 0 },
    { id: 2, name: "UART Task", priority: 1, state: 'READY', color: 'bg-indigo-500', wakeTick: 0, insertOrder: 1 },
    { id: 0, name: "Idle Task", priority: 0, state: 'READY', color: 'bg-slate-500', wakeTick: 0, insertOrder: 2 },
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
    // 0. Boot Sequence (vTaskStartScheduler)
    BOOT_SEQ: [
        { tab: 'kernel', line: 33, label: "Boot: Selecting Highest Priority Task...", action: 'SWITCH_CONTEXT' },
        { tab: 'kernel', line: 35, label: "Boot: Restoring Context & Starting..." }
    ],

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
        // Point to the dummy Idle task code in tasks.c
        { tab: 'kernel', line: 42, cycles: 1, label: "Idle: Waiting for Interrupt (WFI)..." }
    ]
};

const Scheduler: React.FC = () => {
  // --- State ---
  const [tickCount, setTickCount] = useState(0);
  const [tasks, setTasks] = useState<SimTask[]>(JSON.parse(JSON.stringify(INITIAL_TASKS)));
  const [currentTaskId, setCurrentTaskId] = useState<number | null>(null);
  const [statusLog, setStatusLog] = useState("System Ready. Click Next or Play.");
  const [uartLog, setUartLog] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [isFastForwarding, setIsFastForwarding] = useState(false);
  
  // Configuration State
  const [timeSliceScale, setTimeSliceScale] = useState(1); // Visual multiplier for time slice length
  const [simulationSpeed, setSimulationSpeed] = useState(800); // ms per step
  
  // Internal OS State
  const [criticalNesting, setCriticalNesting] = useState(0);
  const [pendingInterrupt, setPendingInterrupt] = useState(false);
  const [isExecutingISR, setIsExecutingISR] = useState(false);
  
  // Execution Control
  const [mode, setMode] = useState<'USER' | 'KERNEL'>('KERNEL');
  const [userPointers, setUserPointers] = useState<Record<number, number>>({ 0: 0, 1: 0, 2: 0 });
  
  // Kernel Execution State
  const [kernelSeqId, setKernelSeqId] = useState<string>('BOOT_SEQ');
  const [kernelPc, setKernelPc] = useState(0);
  
  // Internal Flags (Refs for logic)
  const isSwitchRequiredRef = useRef(false);
  const isPendSvPendingRef = useRef(false);
  
  const [activeCode, setActiveCode] = useState<{ tab: CodeTab; line: number | null }>({ tab: 'kernel', line: 33 });

  // Layout
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [bottomHeight, setBottomHeight] = useState(300);

  // --- Refs ---
  const tickRef = useRef(tickCount);
  const tasksRef = useRef(tasks);
  const criticalRef = useRef(criticalNesting);
  const currentTaskRef = useRef(currentTaskId);
  const userStepCountRef = useRef(0);
  const globalOrderRef = useRef(3); // Monotonic counter for insertOrder

  // Sync Refs
  useEffect(() => { tickRef.current = tickCount; }, [tickCount]);
  useEffect(() => { tasksRef.current = tasks; }, [tasks]);
  useEffect(() => { criticalRef.current = criticalNesting; }, [criticalNesting]);
  useEffect(() => { currentTaskRef.current = currentTaskId; }, [currentTaskId]);

  const updateTasks = (newTasks: SimTask[]) => {
      setTasks(newTasks);
      tasksRef.current = newTasks;
  };

  const getNextOrder = () => {
      globalOrderRef.current += 1;
      return globalOrderRef.current;
  };

  const setTaskPriority = (id: number, priority: number) => {
      const updated = tasksRef.current.map(t => {
          if (t.id === id) return { ...t, priority };
          return t;
      });
      updateTasks(updated);
      setStatusLog(`Config: Task ${id} Priority set to ${priority}`);
      
      const currentTask = tasksRef.current.find(t => t.id === currentTaskRef.current);
      if (currentTask) {
          const maxReadyPriority = Math.max(...updated.filter(t => t.state === 'READY').map(t => t.priority), -1);
          if (maxReadyPriority > currentTask.priority) {
              isSwitchRequiredRef.current = true;
              isPendSvPendingRef.current = true; // Trigger PendSV immediately
              setStatusLog(`Preemption: Higher Priority Task Detected!`);
          }
      }
  };

  const blockTask = (taskId: number, delay: number) => {
      const updated = tasksRef.current.map(t => {
          if (t.id === taskId) {
              // Blocking: Update state and wakeTick
              return { ...t, state: 'BLOCKED', wakeTick: tickRef.current + delay };
          }
          if (t.id !== taskId && t.state === 'RUNNING') {
              // Current running task (if we called block on self) yields.
              // Move to READY is handled by selectHighestPriority's transition
              // But here we explicitly mark it.
              return { ...t, state: 'READY', insertOrder: getNextOrder() }; 
          }
          return t;
      }) as SimTask[];
      updateTasks(updated);
      isSwitchRequiredRef.current = true;
  };

  const selectHighestPriority = () => {
      const ready = tasksRef.current.filter(t => t.state === 'READY' || t.state === 'RUNNING');
      
      const highestPrio = Math.max(...ready.map(t => t.priority));
      const candidates = ready.filter(t => t.priority === highestPrio);

      candidates.sort((a, b) => a.insertOrder - b.insertOrder);

      const next = candidates.length > 0 ? candidates[0] : tasksRef.current.find(t => t.id === 0) || candidates[0];
      
      if (!next) return; 

      const current = tasksRef.current.find(t => t.id === currentTaskRef.current);

      if (next.id !== currentTaskRef.current) {
           const updatedTasks = tasksRef.current.map(t => {
               if (t.id === currentTaskRef.current) {
                   if (t.state === 'RUNNING') {
                       return { ...t, state: 'READY', insertOrder: getNextOrder() };
                   }
                   return t; 
               }
               if (t.id === next.id) {
                   return { ...t, state: 'RUNNING' };
               }
               return t;
           }) as SimTask[];

           updateTasks(updatedTasks);
           setCurrentTaskId(next.id);
           setStatusLog(`Context Switch: ${next.name} is now RUNNING`);
      } else {
           if (candidates.length > 1 && isSwitchRequiredRef.current) {
                const newOrder = getNextOrder();
                const rotatedTasks = tasksRef.current.map(t => {
                    if (t.id === currentTaskRef.current) return { ...t, state: 'READY', insertOrder: newOrder }; // Temporarily READY to sort
                    return t;
                }) as SimTask[];
                
                const readyRotated = rotatedTasks.filter(t => t.state === 'READY' || t.state === 'RUNNING');
                const cRotated = readyRotated.filter(t => t.priority === highestPrio);
                cRotated.sort((a, b) => a.insertOrder - b.insertOrder);
                const actualNext = cRotated[0];

                const finalTasks = rotatedTasks.map(t => {
                    if (t.id === actualNext.id) return { ...t, state: 'RUNNING' };
                    return t;
                }) as SimTask[];
                
                updateTasks(finalTasks);
                setCurrentTaskId(actualNext.id);
                setStatusLog(`Round Robin: Switched to ${actualNext.name}`);
           }
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
      
      // 2. Handle External ISR execution
      if (isExecutingISR) {
          setIsExecutingISR(false);
          setActiveCode({ tab: 'isr', line: 10 });
          setStatusLog("ISR: Clearing Flag & Yielding...");
          isSwitchRequiredRef.current = true;
          isPendSvPendingRef.current = true; 
          setMode('KERNEL');
          setKernelSeqId('PENDSV_ENTRY');
          setKernelPc(0);
          return;
      }

      // 3. User Code Execution
      if (mode === 'USER') {
          const taskId = currentTaskRef.current;
          
          if (taskId === null) {
              setMode('KERNEL');
              setKernelSeqId('BOOT_SEQ');
              setKernelPc(0);
              return;
          }

          if (isPendSvPendingRef.current && criticalRef.current === 0) {
              setMode('KERNEL');
              setKernelSeqId('PENDSV_ENTRY');
              setKernelPc(0);
              return;
          }

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
              setMode('KERNEL');
              setKernelSeqId('PENDSV_ENTRY'); 
              setKernelPc(0);
              setUserPointers(prev => ({ ...prev, [taskId]: 0 })); 
              return;
          }

          const nextPc = userLine.resetTo ?? ((pc + 1) % program.length);
          setUserPointers(prev => ({ ...prev, [taskId]: nextPc }));

          // Deterministic SysTick
          userStepCountRef.current += 1;
          
          // KEY FIX: If Idle Task (0) is running, force Tick immediately (threshold = 1).
          // Otherwise use user configured timeSliceScale.
          const effectiveThreshold = (taskId === 0) ? 1 : (4 * timeSliceScale);
          
          if (criticalRef.current === 0 && userStepCountRef.current >= effectiveThreshold) {
              userStepCountRef.current = 0;
              setMode('KERNEL');
              setKernelSeqId('SYSTICK_ENTRY');
              setKernelPc(0);
              setStatusLog("Interrupt: SysTick Fired! (Time Slice)");
          }
          return;
      }

      // 4. Kernel/Port Execution
      if (mode === 'KERNEL') {
          const sequence = KERNEL_SEQUENCES[kernelSeqId];
          const step = sequence[kernelPc];
          
          if (!step) {
              setMode('USER');
              return;
          }

          setActiveCode({ tab: step.tab, line: step.line });
          setStatusLog(step.label);

          if (step.action === 'INC_TICK') {
              setTickCount(t => t + 1);
          }
          else if (step.action === 'UNBLOCK') {
              const taskToWake = tasksRef.current.find(t => t.state === 'BLOCKED' && t.wakeTick <= tickRef.current);
              if (taskToWake) {
                  const updated = tasksRef.current.map(t => 
                      t.id === taskToWake.id ? { ...t, state: 'READY', wakeTick: 0, insertOrder: getNextOrder() } : t
                  ) as SimTask[];
                  updateTasks(updated);
                  setStatusLog(`Unblocking Task: ${taskToWake.name}`);
                  
                  if (taskToWake.priority > (tasksRef.current.find(t => t.id === currentTaskRef.current)?.priority || -1)) {
                      isSwitchRequiredRef.current = true;
                  }
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

          let nextSeq = kernelSeqId;
          let nextPc = kernelPc + 1;

          if (step.jump) {
              nextSeq = step.jump;
              nextPc = 0;
          } 
          else if (step.return) {
              if (kernelSeqId.startsWith('INC_TICK')) {
                  nextSeq = 'SYSTICK_RESUME';
                  nextPc = 0;
              }
          }
          else if (step.branch === 'CHECK_UNBLOCK') {
              const hasBlocked = tasksRef.current.some(t => t.state === 'BLOCKED');
              const timeReached = tasksRef.current.some(t => t.state === 'BLOCKED' && t.wakeTick <= tickRef.current);
              if (hasBlocked && timeReached) {
                  nextSeq = 'INC_TICK_LOOP_CHECK';
                  nextPc = 0;
              } else {
                  nextSeq = 'INC_TICK_SKIP';
                  nextPc = 0;
              }
          }
          else if (step.branch === 'CHECK_EMPTY') {
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

          if (nextSeq === kernelSeqId && nextPc >= sequence.length) {
              if (kernelSeqId === 'BOOT_SEQ') {
                  setMode('USER');
                  return;
              }
              else if (kernelSeqId === 'SYSTICK_EXIT') {
                  if (isPendSvPendingRef.current) {
                      nextSeq = 'PENDSV_ENTRY'; 
                      nextPc = 0;
                  } else {
                      setMode('USER');
                      return;
                  }
              }
              else if (kernelSeqId === 'PENDSV_ENTRY') {
                  setMode('USER');
                  return;
              }
              else if (kernelSeqId === 'SYSTICK_SWITCH') {
                  nextSeq = 'SYSTICK_EXIT'; 
                  nextPc = 0;
              }
          }

          setKernelSeqId(nextSeq);
          setKernelPc(nextPc);
      }

  }, [pendingInterrupt, isExecutingISR, mode, userPointers, kernelSeqId, kernelPc, timeSliceScale]);

  // --- Auto Run Loop ---
  useEffect(() => {
    let timer: any;
    if (isRunning) {
        // Use user-configured simulation speed, or very fast if "Fast Forwarding" (optional feature)
        const speed = isFastForwarding ? 100 : simulationSpeed;
        timer = setTimeout(() => executeStep(false), speed);
    }
    return () => clearTimeout(timer);
  }, [isRunning, executeStep, isFastForwarding, simulationSpeed]);

  const handleReset = () => {
      setIsRunning(false);
      setTickCount(0);
      setTasks(JSON.parse(JSON.stringify(INITIAL_TASKS)));
      setCurrentTaskId(null); 
      
      setMode('KERNEL');
      setKernelSeqId('BOOT_SEQ');
      setKernelPc(0);

      setUserPointers({ 0: 0, 1: 0, 2: 0 });
      userStepCountRef.current = 0;
      globalOrderRef.current = 3;
      
      setCriticalNesting(0);
      setPendingInterrupt(false);
      setUartLog("");
      setStatusLog("System Reset.");
      setActiveCode({ tab: 'kernel', line: 33 });
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
            currentTaskId={currentTaskId ?? -1} 
            tasks={tasks}
            width={sidebarWidth}
            criticalNesting={criticalNesting}
            pendingInterrupt={pendingInterrupt}
            isExecutingISR={isExecutingISR}
            onPriorityChange={setTaskPriority}
            timeSliceScale={timeSliceScale}
            onTimeSliceChange={setTimeSliceScale}
            simulationSpeed={simulationSpeed}
            onSpeedChange={setSimulationSpeed}
        />
        
    </div>
  );
};

export default Scheduler;
