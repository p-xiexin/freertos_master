
import React, { useState } from 'react';
import { Bug, Archive, Activity, GripVertical, FileText } from 'lucide-react';
import { Reorder, useDragControls } from 'framer-motion';
import CollapsibleSection from '../CollapsibleSection';
import { MOCK_REGS_A, MOCK_REGS_B, STEP_TO_LINE } from '../../data/contextSwitchingData';

interface DebuggerPaneProps {
  step: number;
  width: number;
}

const RegisterRow = ({ name, value, highlight, changed, desc }: { name: string, value: string, highlight?: boolean, changed?: boolean, desc?: string }) => (
  <div className={`flex justify-between items-center font-mono text-xs py-1.5 px-2 rounded-md transition-colors ${highlight ? 'bg-sky-900/20 border border-sky-500/30' : 'hover:bg-slate-800/50 border border-transparent'}`}>
    <div className="flex items-center gap-2">
      <span className={`font-bold w-8 ${highlight ? 'text-sky-400' : 'text-slate-500'}`}>{name}</span>
      {desc && <span className="text-[9px] text-slate-600 hidden xl:inline-block">{desc}</span>}
    </div>
    <span className={`${highlight ? 'text-sky-200 font-bold' : changed ? 'text-amber-200' : 'text-slate-400'}`}>{value}</span>
  </div>
);

const VariableRow = ({ name, value, type, changed }: { name: string, value: React.ReactNode, type: string, changed?: boolean }) => (
    <div className={`flex flex-col font-mono text-xs py-2 px-2 rounded-md transition-colors border-b border-slate-800/50 ${changed ? 'bg-emerald-900/10' : ''}`}>
      <div className="flex justify-between items-center mb-1">
        <span className="font-bold text-sky-500">{name}</span>
        <span className="text-[9px] text-slate-500">{type}</span>
      </div>
      <div className={`${changed ? 'text-emerald-300 font-bold' : 'text-slate-300'} break-all`}>
          {value}
      </div>
    </div>
);

// Wrapper for reordering
const DraggableSection = ({ item, children }: { item: string, children: React.ReactNode }) => {
    const controls = useDragControls();
    return (
        <Reorder.Item 
            value={item} 
            dragListener={false} 
            dragControls={controls}
            className="relative"
        >
            <CollapsibleSection 
                title={
                    item === 'registers' ? "Core Registers" : 
                    item === 'variables' ? "Global Variables" : 
                    "Context Switching Anatomy"
                }
                prefix={<div onPointerDown={(e) => controls.start(e)}><GripVertical size={14} /></div>}
            >
                {children}
            </CollapsibleSection>
        </Reorder.Item>
    );
};

const DebuggerPane: React.FC<DebuggerPaneProps> = ({ step, width }) => {
  const [items, setItems] = useState(["registers", "variables", "anatomy"]);
  const currentRegs = step < 7 ? MOCK_REGS_A : MOCK_REGS_B;
  const activeLine = STEP_TO_LINE[step] || 0;
  
  // Identify if we are looking at Task A (Violet) or Task B (Emerald) Context
  const isTaskB = step >= 7; 
  const isKernelContext = step >= 7 && step <= 9;

  return (
    <div 
      style={{ width }} 
      className="bg-slate-900 border-l border-slate-800 flex flex-col shrink-0 text-slate-300"
    >
      <div className="h-8 bg-slate-900 px-4 flex items-center justify-between text-xs font-bold text-slate-400 border-b border-slate-800 shadow-sm shrink-0">
         <span className="flex items-center gap-2"><Bug size={14} className="text-sky-500"/> CORE INSPECTOR</span>
         <div className="flex gap-2">
            <span className="text-[10px] bg-sky-900/50 text-sky-400 px-1.5 py-0.5 rounded border border-sky-800">Cortex-M4F</span>
         </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
         <Reorder.Group axis="y" values={items} onReorder={setItems} className="space-y-2">
            {items.map(item => {
                switch(item) {
                    case 'registers':
                        return (
                            <DraggableSection key={item} item={item}>
                                <div className="space-y-[1px]">
                                    <div className="px-2 py-1 text-[10px] text-slate-500 font-bold bg-slate-900/80">Caller Saved (Auto)</div>
                                    <RegisterRow name="R0" value={currentRegs.r0} highlight={activeLine >= 2 && activeLine <= 6} desc="Arg 1"/>
                                    <RegisterRow name="R1" value={currentRegs.r1} highlight={activeLine >= 11} desc="Arg 2"/>
                                    <RegisterRow name="R2" value={currentRegs.r2} highlight={activeLine >= 5 && activeLine <= 7} desc="Arg 3"/>
                                    <RegisterRow name="R3" value={currentRegs.r3} highlight={activeLine >= 4} desc="Arg 4"/>
                                    <RegisterRow name="R12" value={currentRegs.r12} desc="IP"/>
                                    <RegisterRow name="LR" value={currentRegs.lr} highlight={step === 13} desc="Link Reg"/>
                                    <RegisterRow name="PC" value={currentRegs.pc} highlight={true} desc="Program Cnt"/>
                                    <RegisterRow name="xPSR" value={currentRegs.xpsr} desc="Status"/>
                                    
                                    <div className="px-2 py-1 text-[10px] text-slate-500 font-bold bg-slate-900/80 mt-2">Callee Saved (Manual)</div>
                                    <RegisterRow name="R4-R11" value={isKernelContext ? "........" : "CTX DATA"} highlight={step === 3 || step === 11} desc="Var Regs"/>
                                    
                                    <div className="px-2 py-1 text-[10px] text-slate-500 font-bold bg-slate-900/80 mt-2">Pointers</div>
                                    <RegisterRow name="PSP" value={currentRegs.psp} highlight={step === 1 || step === 12} changed={step === 1 || step === 12} desc="Process SP"/>
                                </div>
                            </DraggableSection>
                        );
                    case 'variables':
                        return (
                            <DraggableSection key={item} item={item}>
                                <div>
                                    <VariableRow 
                                            name="pxCurrentTCB" 
                                            type="TaskHandle_t" 
                                            value={
                                                <span className={isTaskB ? "text-emerald-400" : "text-violet-400"}>
                                                    {isTaskB ? "0x20001800 (Task B)" : "0x20000800 (Task A)"}
                                                </span>
                                            }
                                            changed={step === 7} 
                                    />
                                    <VariableRow 
                                            name="xYieldPending" 
                                            type="BaseType_t"
                                            value={step >= 7 ? "pdTRUE" : "pdFALSE"}
                                    />
                                    <VariableRow 
                                            name="uxSchedulerSuspended" 
                                            type="UBaseType_t"
                                            value="pdFALSE (0)"
                                    />
                                </div>
                            </DraggableSection>
                        );
                    case 'anatomy':
                        return (
                            <DraggableSection key={item} item={item}>
                                <div className="text-xs text-slate-400 leading-relaxed space-y-3">
                                    <div className="flex items-start gap-2">
                                        <Activity size={14} className="text-violet-500 mt-0.5 shrink-0"/>
                                        <div className="border-l-2 border-violet-500/50 pl-2">
                                            <strong className="text-violet-400 block mb-1">1. Exception Entry (Auto)</strong>
                                            <p>PendSV 触发时，硬件<b>自动压栈</b> R0-R3, R12, LR, PC, xPSR。这遵循 ARM AAPCS 标准，使 ISR 能执行 C 代码。</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-start gap-2">
                                        <Archive size={14} className="text-amber-500 mt-0.5 shrink-0"/>
                                        <div className="border-l-2 border-amber-500/50 pl-2">
                                            <strong className="text-amber-400 block mb-1">2. Context Save (Manual)</strong>
                                            <p>硬件不保存 R4-R11（Callee Saved 寄存器）。FreeRTOS 必须执行 <code>stmdb</code> 手动将它们保存到当前任务栈中。</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-2">
                                        <FileText size={14} className="text-emerald-500 mt-0.5 shrink-0"/>
                                        <div className="border-l-2 border-emerald-500/50 pl-2">
                                            <strong className="text-emerald-400 block mb-1">3. Stack Swapping</strong>
                                            <p>核心操作：更新 <code>pxCurrentTCB</code> 指针。下次恢复上下文时，将从新任务的 TCB 中读取栈顶指针 (Top of Stack)。</p>
                                        </div>
                                    </div>
                                </div>
                            </DraggableSection>
                        );
                    default: return null;
                }
            })}
         </Reorder.Group>
      </div>
    </div>
  );
};

export default DebuggerPane;
