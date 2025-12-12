import React, { useRef, useEffect } from 'react';
import { Code2, FileJson, ChevronRight } from 'lucide-react';
import { ASM_CODE, STEP_TO_LINE } from '../../data/contextSwitchingData';

interface CodeViewProps {
  step: number;
  height: number;
}

const C_CODE_LINES = [
  { line: 1, text: "// tasks.c: FreeRTOS Kernel (Simplified)", indent: 0, type: 'comment' },
  { line: 2, text: "void vTaskSwitchContext( void )", indent: 0, type: 'func' },
  { line: 3, text: "{", indent: 0, type: 'plain' },
  { line: 4, text: "if( uxSchedulerSuspended != pdFALSE )", indent: 1, type: 'keyword' },
  { line: 5, text: "{", indent: 1, type: 'plain' },
  { line: 6, text: "xYieldPending = pdTRUE;", indent: 2, type: 'code' },
  { line: 7, text: "}", indent: 1, type: 'plain' },
  { line: 8, text: "else", indent: 1, type: 'keyword' },
  { line: 9, text: "{", indent: 1, type: 'plain' },
  { line: 10, text: "xYieldPending = pdFALSE;", indent: 2, type: 'code' },
  { line: 11, text: "// 选择最高优先级任务", indent: 2, type: 'comment' },
  { line: 12, text: "taskSELECT_HIGHEST_PRIORITY_TASK();", indent: 2, type: 'macro' },
  { line: 13, text: "}", indent: 1, type: 'plain' },
  { line: 14, text: "}", indent: 0, type: 'plain' }
];

const CodeView: React.FC<CodeViewProps> = ({ step, height }) => {
  const cCodeRef = useRef<HTMLDivElement>(null);
  const asmCodeRef = useRef<HTMLDivElement>(null);

  const activeAsmLine = STEP_TO_LINE[step] || 0;
  // Step 7 (Call C Function: bl vTaskSwitchContext) maps to the C code block
  const isCActive = step === 7;

  useEffect(() => {
    // Sync Scroll ASM
    if (activeAsmLine && asmCodeRef.current) {
      const lineEl = document.getElementById(`asm-line-${activeAsmLine}`);
      if (lineEl) {
        // Calculate offset to center the line
        const container = asmCodeRef.current;
        const scrollTarget = lineEl.offsetTop - container.clientHeight / 2 + lineEl.clientHeight / 2;
        container.scrollTo({ top: scrollTarget, behavior: 'smooth' });
      }
    }
    
    // Sync Scroll C (Focus when active)
    if (isCActive && cCodeRef.current) {
       // Scroll to the interesting part (around line 12)
       const container = cCodeRef.current;
       container.scrollTo({ top: 100, behavior: 'smooth' });
    }
  }, [step, activeAsmLine, isCActive]);

  return (
    <div style={{ height }} className="flex bg-[#0f172a] font-mono text-sm relative border-t border-slate-800 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.3)] z-10">
       
       {/* Code View Header */}
       <div className="absolute top-0 left-0 right-0 h-9 bg-[#1e293b] flex items-center px-4 text-[11px] text-slate-400 border-b border-slate-700/50 z-20 select-none">
          <div className={`flex items-center gap-2 w-1/2 border-r border-slate-700/50 h-full transition-colors ${isCActive ? 'text-sky-400 bg-slate-800' : ''}`}>
            <span className="w-1.5 h-full bg-yellow-500/50 mr-2 opacity-0 data-[active=true]:opacity-100" data-active={isCActive}/>
            <FileJson size={14} className="text-yellow-500"/> 
            <span className="font-bold">tasks.c</span>
            <span className="ml-auto mr-4 text-[10px] opacity-60">Kernel Logic</span>
          </div>
          <div className={`flex items-center gap-2 w-1/2 h-full pl-0 transition-colors ${!isCActive ? 'text-sky-400 bg-slate-800' : ''}`}>
            <span className="w-1.5 h-full bg-sky-500/50 mr-2 opacity-0 data-[active=true]:opacity-100" data-active={!isCActive}/>
            <Code2 size={14} className="text-sky-500"/> 
            <span className="font-bold">portasm.s</span>
            <span className="ml-auto mr-4 text-[10px] opacity-60">Context Switching (ISR)</span>
          </div>
       </div>

       {/* C Code (Left) */}
       <div 
         ref={cCodeRef} 
         className={`w-1/2 border-r border-slate-800 overflow-y-auto pt-12 pb-4 text-slate-400 custom-scrollbar transition-colors duration-500 ${isCActive ? 'bg-slate-900/30' : 'bg-[#0f172a] opacity-60 grayscale'}`}
       >
          {C_CODE_LINES.map((line, idx) => {
             // Highlight main logic in C when active
             const isLineActive = isCActive && (line.line === 12 || line.line === 2);
             
             return (
              <div 
                key={idx} 
                className={`flex px-0 py-[2px] transition-all duration-300 ${isLineActive ? 'bg-yellow-500/10 border-l-2 border-yellow-500' : 'border-l-2 border-transparent'}`}
              >
                 <span className={`w-10 text-[10px] leading-6 text-right pr-3 select-none ${isLineActive ? 'text-yellow-500 font-bold' : 'text-slate-700'}`}>
                   {line.line}
                 </span>
                 <pre 
                   className="flex-1 text-[13px] leading-6 font-medium"
                   style={{ paddingLeft: `${line.indent * 1.5}rem` }}
                 >
                   {renderCToken(line)}
                 </pre>
              </div>
             );
          })}
       </div>

       {/* Assembly Code (Right) */}
       <div 
         ref={asmCodeRef} 
         className={`w-1/2 overflow-y-auto pt-12 pb-4 custom-scrollbar transition-colors duration-500 ${!isCActive ? 'bg-slate-900/30' : 'bg-[#0f172a] opacity-60'}`}
       >
          {ASM_CODE.map((line, idx) => {
            const isActive = idx + 1 === activeAsmLine;
            const isCommentLine = line.text.trim().startsWith(';');
            
            return (
              <div 
                id={`asm-line-${line.line}`}
                key={idx} 
                className={`flex px-0 py-[2px] transition-all duration-200 group relative ${isActive ? 'bg-sky-500/10' : 'hover:bg-slate-800/30'}`}
              >
                {/* Active Indicator Line */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 transition-colors ${isActive ? 'bg-sky-500' : 'bg-transparent'}`} />

                {/* Line Number */}
                <span className={`w-10 text-[10px] leading-6 text-right pr-3 select-none transition-colors ${isActive ? 'text-sky-400 font-bold' : 'text-slate-700 group-hover:text-slate-500'}`}>
                  {line.line}
                </span>

                {/* Active Chevron */}
                {isActive && (
                    <div className="absolute left-8 top-1.5 text-sky-500 animate-pulse">
                        <ChevronRight size={14} strokeWidth={3} />
                    </div>
                )}

                {/* Code Content */}
                <span className="flex-1 text-[13px] leading-6 font-medium whitespace-pre pl-2">
                   {isCommentLine ? (
                     <span className="text-slate-500 italic">{line.text}</span>
                   ) : line.text.includes(':') ? (
                     <span className="text-amber-200 font-bold">{line.text}</span>
                   ) : (
                     <span className="text-slate-300">
                        {renderAsmToken(line.text)}
                     </span>
                   )}
                   {line.comment && <span className="text-slate-500/70 italic font-normal text-xs ml-6 select-none border-l border-slate-800 pl-2">; {line.comment}</span>}
                </span>
              </div>
            )
          })}
       </div>
    </div>
  );
};

// --- Helpers for Syntax Highlighting ---

const renderCToken = (line: { text: string, type: string }) => {
  if (line.type === 'comment') return <span className="text-slate-500 italic">{line.text}</span>;
  
  const words = line.text.split(/(\s+|[();])/);
  return (
    <span>
       {words.map((w, i) => {
         if(!w) return null;
         if(['void', 'if', 'else'].includes(w)) return <span key={i} className="text-violet-400">{w}</span>;
         if(['vTaskSwitchContext', 'taskSELECT_HIGHEST_PRIORITY_TASK'].includes(w)) return <span key={i} className="text-yellow-200">{w}</span>;
         if(['pdFALSE', 'pdTRUE', 'uxSchedulerSuspended', 'xYieldPending'].includes(w)) return <span key={i} className="text-sky-300">{w}</span>;
         return <span key={i} className="text-slate-300">{w}</span>;
       })}
    </span>
  );
};

const renderAsmToken = (text: string) => {
  return text.split(/(\s+|,)/).map((word, i) => {
    if (word.match(/^\s+$/)) return <span key={i}>{word}</span>;
    if (word.match(/^(mrs|isb|ldr|stmdb|str|mov|msr|dsb|bl|ldmia|bx)$/i)) return <span key={i} className="text-sky-400 font-bold">{word}</span>;
    if (word.match(/^(r\d+|sp|psp|pc|lr|basepri|configMAX_SYSCALL_INTERRUPT_PRIORITY)$/i)) return <span key={i} className="text-orange-300">{word}</span>; 
    if (word.startsWith('#') || word.startsWith('=')) return <span key={i} className="text-emerald-300">{word}</span>;
    if (word === '.global') return <span key={i} className="text-pink-400">{word}</span>;
    return <span key={i} className="text-slate-200">{word}</span>;
  });
};

export default CodeView;