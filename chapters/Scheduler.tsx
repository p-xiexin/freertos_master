
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

type CodeTab = 'kernel' | 'led' | 'uart' | 'isr';

type ProgramLine = {
    tab: CodeTab;
    line: number | null;
    cycles: number; // CPU cycles to finish this line (does NOT advance tick)
    label: string | ((tick: number) => string);
    resetTo?: number;
};

type PointerState = Record<number, { pc: number; remainingCycles: number }>;

const TASK_PROGRAMS: Record<number, ProgramLine[]> = {
    1: [
        { tab: 'led', line: 6, cycles: 1, label: "LED: HAL_GPIO_TogglePin" },
        { tab: 'led', line: 9, cycles: 3, label: "LED: Busy loop (preemptible)" },
        { tab: 'led', line: 12, cycles: 1, label: (tick) => `vTaskDelay(4) @ tick ${tick}`, resetTo: 0 },
    ],
    2: [
        { tab: 'uart', line: 6, cycles: 1, label: "taskENTER_CRITICAL()" },
        { tab: 'uart', line: 8, cycles: 2, label: (tick) => `printf("Tick: ${tick}")` },
        { tab: 'uart', line: 10, cycles: 1, label: "taskEXIT_CRITICAL()" },
        { tab: 'uart', line: 12, cycles: 1, label: (tick) => `vTaskDelay(2) @ tick ${tick}`, resetTo: 0 },
    ],
    0: [
        { tab: 'kernel', line: null, cycles: 1, label: "Idle: wait for next tick" }
    ]
};

const buildInitialPointers = (): PointerState => ({
    0: { pc: 0, remainingCycles: TASK_PROGRAMS[0][0].cycles },
    1: { pc: 0, remainingCycles: TASK_PROGRAMS[1][0].cycles },
    2: { pc: 0, remainingCycles: TASK_PROGRAMS[2][0].cycles },
});

const Scheduler: React.FC = () => {
  const [tickCount, setTickCount] = useState(0);
  const [tasks, setTasks] = useState<SimTask[]>(JSON.parse(JSON.stringify(INITIAL_TASKS)));
  const [currentTaskId, setCurrentTaskId] = useState(0);
  const [statusLog, setStatusLog] = useState("System Reset. Scheduler Ready.");
  const [uartLog, setUartLog] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [isFastForwarding, setIsFastForwarding] = useState(false);
  const [criticalNesting, setCriticalNesting] = useState(0);
  const [pendingInterrupt, setPendingInterrupt] = useState(false);
  const [isExecutingISR, setIsExecutingISR] = useState(false);
  const [taskPointers, setTaskPointers] = useState<PointerState>(buildInitialPointers);
  const [activeCode, setActiveCode] = useState<{ tab: CodeTab; line: number | null }>({ tab: 'kernel', line: 5 });

  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [bottomHeight, setBottomHeight] = useState(300);

  // --- Refs for up-to-date values (avoid stale closures) ---
  const tickRef = useRef(tickCount);
  const tasksRef = useRef(tasks);
  const criticalRef = useRef(criticalNesting);
  const pendingRef = useRef(pendingInterrupt);
  const isrRef = useRef(isExecutingISR);
  const taskPointersRef = useRef(taskPointers);
  const fastRef = useRef(isFastForwarding);
  const currentTaskRef = useRef(currentTaskId);

  useEffect(() => { tickRef.current = tickCount; }, [tickCount]);
  useEffect(() => { tasksRef.current = tasks; }, [tasks]);
  useEffect(() => { criticalRef.current = criticalNesting; }, [criticalNesting]);
  useEffect(() => { pendingRef.current = pendingInterrupt; }, [pendingInterrupt]);
  useEffect(() => { isrRef.current = isExecutingISR; }, [isExecutingISR]);
  useEffect(() => { taskPointersRef.current = taskPointers; }, [taskPointers]);
  useEffect(() => { fastRef.current = isFastForwarding; }, [isFastForwarding]);
  useEffect(() => { currentTaskRef.current = currentTaskId; }, [currentTaskId]);

  const applyTaskState = useCallback((nextTasks: SimTask[]) => {
      setTasks(nextTasks);
      tasksRef.current = nextTasks;
  }, []);

  const blockTask = useCallback((taskId: number, delay: number, tickNow: number) => {
      const updated = tasksRef.current.map(t => {
          if (t.id === taskId) return { ...t, state: 'BLOCKED', wakeTick: tickNow + delay };
          if (t.state === 'RUNNING') return { ...t, state: 'READY' };
          return t;
      }) as SimTask[];

      applyTaskState(updated);
      setCurrentTaskId(0);
      setStatusLog(`Task ${tasksRef.current.find(t => t.id === taskId)?.name || taskId} sleeping ${delay} ticks (wake @ ${tickNow + delay})`);
  }, [applyTaskState]);

  const wakeBlockedTasks = useCallback((tickNow: number) => {
      const woke: string[] = [];
      const updated = tasksRef.current.map(t => {
          if (t.state === 'BLOCKED' && t.wakeTick <= tickNow) {
              woke.push(t.name);
              return { ...t, state: 'READY', wakeTick: 0 };
          }
          return t;
      }) as SimTask[];

      if (woke.length > 0) {
          setStatusLog(`Unblocking: ${woke.join(', ')}`);
          setIsFastForwarding(false);
      }
      applyTaskState(updated);
      return updated;
  }, [applyTaskState]);

  const markRunning = useCallback((list: SimTask[], nextId: number) => {
      const updated = list.map(t => {
          if (t.id === nextId) return { ...t, state: 'RUNNING' };
          if (t.state === 'RUNNING' && t.id !== nextId) return { ...t, state: 'READY' };
          return t;
      }) as SimTask[];
      applyTaskState(updated);
      return updated;
  }, [applyTaskState]);

  const runTaskCycle = useCallback((taskId: number, tickNow: number) => {
      const program = TASK_PROGRAMS[taskId];
      if (!program) return;

      const pointer = taskPointersRef.current[taskId] ?? { pc: 0, remainingCycles: program[0].cycles };
      const step = program[pointer.pc];

      setActiveCode({ tab: step.tab, line: step.line });
      const logText = typeof step.label === 'function' ? step.label(tickNow) : step.label;
      setStatusLog(logText);

      const onLineEnd = () => {
          if (taskId === 2 && step.line === 6) setCriticalNesting(c => c + 1);
          if (taskId === 2 && step.line === 10) setCriticalNesting(c => Math.max(0, c - 1));
          if (taskId === 2 && step.line === 8) setUartLog(prev => prev + `Tick: ${tickNow}\n`);
          if (taskId !== 0 && step.line === 12) {
              const delay = taskId === 2 ? 2 : 4;
              blockTask(taskId, delay, tickNow);
          }
      };

      if (pointer.remainingCycles <= 1) {
          onLineEnd();
          const nextPc = step.resetTo ?? ((pointer.pc + 1) % program.length);
          const nextPtr = { pc: nextPc, remainingCycles: program[nextPc].cycles };
          setTaskPointers(prev => ({ ...prev, [taskId]: nextPtr }));
          taskPointersRef.current = { ...taskPointersRef.current, [taskId]: nextPtr };
      } else {
          const nextPtr = { ...pointer, remainingCycles: pointer.remainingCycles - 1 };
          setTaskPointers(prev => ({ ...prev, [taskId]: nextPtr }));
          taskPointersRef.current = { ...taskPointersRef.current, [taskId]: nextPtr };
      }
  }, [blockTask]);

  const handleImmediateISR = useCallback((tickNow: number) => {
      // One-shot ISR: does not consume tick time, just requests a reschedule
      setIsExecutingISR(true);
      isrRef.current = true;
      setActiveCode({ tab: 'isr', line: 1 });
      setStatusLog(`ISR: EXTI0_IRQHandler (instant) @ tick ${tickNow}`);
      setTimeout(() => {
          setIsExecutingISR(false);
          isrRef.current = false;
          setStatusLog("ISR complete -> request context switch");
      }, 0);
  }, []);

  const handleReset = useCallback(() => {
      setIsRunning(false);
      setTickCount(0);
      tickRef.current = 0;
      const resetTasks = JSON.parse(JSON.stringify(INITIAL_TASKS));
      applyTaskState(resetTasks);
      setCurrentTaskId(0);
      currentTaskRef.current = 0;
      setCriticalNesting(0);
      criticalRef.current = 0;
      setPendingInterrupt(false);
      pendingRef.current = false;
      setIsExecutingISR(false);
      isrRef.current = false;
      const basePointers = buildInitialPointers();
      setTaskPointers(basePointers);
      taskPointersRef.current = basePointers;
      setStatusLog("System Reset. Scheduler Ready.");
      setUartLog("");
      setActiveCode({ tab: 'kernel', line: 5 });
      setIsFastForwarding(false);
      fastRef.current = false;
  }, [applyTaskState]);

  const triggerInterrupt = useCallback(() => {
      setPendingInterrupt(true);
      pendingRef.current = true;
      setStatusLog("Hardware Interrupt (EXTI) Triggered! Pending...");
      setIsRunning(true);
  }, []);

  const scheduleNext = useCallback((list: SimTask[]) => {
      if (criticalRef.current > 0 && currentTaskRef.current !== 0) {
          return currentTaskRef.current;
      }
      const ready = list.filter(t => t.state === 'READY' || t.state === 'RUNNING');
      ready.sort((a, b) => b.priority - a.priority);
      return ready[0]?.id ?? 0;
  }, []);

  const runCpuSlice = useCallback((tickNow: number, cycles: number) => {
      const runningTask = tasksRef.current.find(t => t.id === currentTaskRef.current);
      if (!runningTask || runningTask.state !== 'RUNNING') {
          setActiveCode({ tab: 'kernel', line: null });
          setStatusLog("Idle: no READY tasks");
          return;
      }
      if (runningTask.id === 0) {
          setActiveCode({ tab: 'kernel', line: null });
          setStatusLog("Idle Task (low-power wait)");
          return;
      }
      for (let i = 0; i < cycles; i += 1) {
          runTaskCycle(runningTask.id, tickNow);
          const taskNow = tasksRef.current.find(t => t.id === runningTask.id);
          if (!taskNow || taskNow.state !== 'RUNNING') break; // blocked/yielded
      }
  }, [runTaskCycle]);

  const executeStep = useCallback((isManualStep: boolean = false) => {
      const tickNow = tickRef.current + 1;
      setTickCount(tickNow);
      tickRef.current = tickNow;
      setActiveCode({ tab: 'kernel', line: 5 });
      setStatusLog(`SysTick: xTickCount=${tickNow}`);

      // Wake tasks in tick ISR
      const afterWake = wakeBlockedTasks(tickNow);

      // Handle pending interrupt if not masked
      if (pendingRef.current && criticalRef.current === 0 && !isrRef.current) {
          handleImmediateISR(tickNow);
          setPendingInterrupt(false);
          pendingRef.current = false;
      }

      // Decide next task (post-tick scheduling point)
      const nextId = scheduleNext(afterWake);
      if (nextId !== currentTaskRef.current) {
          markRunning(afterWake, nextId);
          setCurrentTaskId(nextId);
          currentTaskRef.current = nextId;
          setStatusLog(prev => `${prev} | Switch to ${tasksRef.current.find(t => t.id === nextId)?.name ?? 'Idle'}`);
      }

      // CPU runs between ticks for a small slice; does not move xTickCount
      const CYCLES_PER_TICK = isManualStep ? 1 : 3;
      runCpuSlice(tickNow, CYCLES_PER_TICK);

      if (currentTaskRef.current === 0) {
          const readyNow = tasksRef.current.filter(t => t.state === 'READY');
          if (readyNow.length > 0 && criticalRef.current === 0) {
              const nextAfterIdle = scheduleNext(tasksRef.current);
              if (nextAfterIdle !== currentTaskRef.current) {
                  markRunning(tasksRef.current, nextAfterIdle);
                  setCurrentTaskId(nextAfterIdle);
                  currentTaskRef.current = nextAfterIdle;
                  setStatusLog(prev => `${prev} | Wake switch -> ${tasksRef.current.find(t => t.id === nextAfterIdle)?.name}`);
              }
          }
      }

      const hasBlocked = tasksRef.current.some(t => t.state === 'BLOCKED');
      const shouldFast = currentTaskRef.current === 0 && hasBlocked && !pendingRef.current && criticalRef.current === 0;
      if (shouldFast !== fastRef.current) setIsFastForwarding(shouldFast);
  }, [handleImmediateISR, markRunning, runCpuSlice, scheduleNext, wakeBlockedTasks]);

  useEffect(() => {
      let timeout: any;
      const shouldRun = isRunning || (isFastForwarding && tasks.some(t => t.state === 'BLOCKED'));
      if (shouldRun) {
          const base = isExecutingISR ? 500 : 900;
          const delay = isFastForwarding ? 60 : base;
          timeout = setTimeout(() => executeStep(false), delay);
      }
      return () => clearTimeout(timeout);
  }, [executeStep, isFastForwarding, isExecutingISR, isRunning, tasks]);

  useEffect(() => {
      const hasBlocked = tasks.some(t => t.state === 'BLOCKED');
      const shouldFast = currentTaskId === 0 && hasBlocked && !isExecutingISR && !pendingInterrupt;
      if (shouldFast !== isFastForwarding) setIsFastForwarding(shouldFast);
  }, [currentTaskId, isExecutingISR, isFastForwarding, pendingInterrupt, tasks]);

  const codeState = activeCode;

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
