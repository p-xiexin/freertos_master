import React from 'react';
import { motion } from 'framer-motion';
import { Cpu, Layers, Zap, Code2, Microchip } from 'lucide-react';

const Intro: React.FC = () => {
  return (
    <div className="w-full flex flex-col px-6 lg:px-12 py-8 relative z-10">
      
      {/* Header Section */}
      <div className="flex-none flex flex-col items-center justify-center pt-8 pb-10 space-y-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/50 border border-slate-700 text-sky-400 text-xs font-medium tracking-wider uppercase mb-2"
        >
          <Microchip size={14} />
          <span>Embedded Systems</span>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-blue-400 to-indigo-400 tracking-tight text-center drop-shadow-sm"
        >
          FreeRTOS
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-slate-400 text-base md:text-lg max-w-2xl mx-auto text-center leading-relaxed font-light"
        >
          专为微控制器设计的实时内核。在 STM32 等嵌入式平台上，提供确定性的任务调度与资源管理。
        </motion.p>
      </div>

      {/* Main Content Grid */}
      <div className="flex-1 flex items-center justify-center pb-12">
        <div className="grid lg:grid-cols-[40%_60%] md:grid-cols-2 gap-8 md:gap-12 w-full max-w-7xl items-center">
            
            {/* Left: Key Features */}
            <div className="flex flex-col gap-5 justify-center">
              {[
                { 
                  icon: Zap, 
                  title: "实时性与抢占 (Preemption)", 
                  desc: "基于优先级的抢占式调度，确保高优先级任务（如传感器采集、电机控制）严格按时序执行。" 
                },
                { 
                  icon: Layers, 
                  title: "极简内核 (Microkernel)", 
                  desc: "核心代码不到 9000 行，RAM 占用极低。通过 FreeRTOSConfig.h 可高度裁剪，适配不同 STM32 型号。" 
                },
                { 
                  icon: Cpu, 
                  title: "丰富的组件 (Ecosystem)", 
                  desc: "提供信号量、互斥量、队列、事件组等原生组件，轻松处理复杂的中断同步与资源共享问题。" 
                },
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + idx * 0.1 }}
                  className="bg-slate-800/30 border border-slate-700/50 p-5 rounded-2xl hover:bg-slate-800/60 hover:border-slate-600 transition duration-300 flex items-start gap-5 group backdrop-blur-sm"
                >
                  <div className="p-3 bg-gradient-to-br from-sky-500/20 to-indigo-500/20 rounded-xl group-hover:scale-110 transition-transform duration-300 shadow-inner ring-1 ring-white/10">
                    <item.icon className="w-6 h-6 text-sky-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-100 mb-1.5">{item.title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Right: Code Example (STM32 Standard Library Style) */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="relative group w-full"
            >
              {/* Glow effect behind code block */}
              <div className="absolute -inset-1 bg-gradient-to-r from-sky-500 to-indigo-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
              
              <div className="relative bg-[#0d1117] rounded-xl border border-slate-700/80 shadow-2xl overflow-hidden flex flex-col">
                {/* Editor Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-[#161b22]">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                    <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                    <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-mono opacity-80">
                    <Code2 size={13}/> main.c
                  </div>
                </div>
                
                {/* Code Content - Fixed Layout & Size */}
                <div className="p-4 sm:p-5 overflow-x-auto custom-scrollbar bg-[#0d1117]">
                  <div className="font-mono text-xs sm:text-[13px] leading-6 text-[#c9d1d9] min-w-max">
                    {/* Line 1 */}
                    <div className="flex">
                       <span className="w-8 text-right text-slate-600 select-none mr-4 shrink-0">1</span>
                       <span className="text-[#8b949e] italic">/* STM32 Standard Peripheral Library */</span>
                    </div>
                    {/* Line 2 */}
                    <div className="flex">
                       <span className="w-8 text-right text-slate-600 select-none mr-4 shrink-0">2</span>
                       <span><span className="text-[#ff7b72]">#include</span> <span className="text-[#a5d6ff]">"stm32f10x.h"</span></span>
                    </div>
                    {/* Line 3 */}
                    <div className="flex">
                       <span className="w-8 text-right text-slate-600 select-none mr-4 shrink-0">3</span>
                       <span><span className="text-[#ff7b72]">#include</span> <span className="text-[#a5d6ff]">"FreeRTOS.h"</span></span>
                    </div>
                    {/* Line 4 */}
                    <div className="flex">
                       <span className="w-8 text-right text-slate-600 select-none mr-4 shrink-0">4</span>
                       <span><span className="text-[#ff7b72]">#include</span> <span className="text-[#a5d6ff]">"task.h"</span></span>
                    </div>
                    {/* Line 5 */}
                    <div className="flex">
                       <span className="w-8 text-right text-slate-600 select-none mr-4 shrink-0">5</span>
                       <span></span>
                    </div>
                    {/* Line 6 */}
                    <div className="flex">
                       <span className="w-8 text-right text-slate-600 select-none mr-4 shrink-0">6</span>
                       <span><span className="text-[#ff7b72]">int</span> <span className="text-[#d2a8ff]">main</span>( <span className="text-[#ff7b72]">void</span> )</span>
                    </div>
                    {/* Line 7 */}
                    <div className="flex">
                       <span className="w-8 text-right text-slate-600 select-none mr-4 shrink-0">7</span>
                       <span>{'{'}</span>
                    </div>
                    {/* Line 8 */}
                    <div className="flex">
                       <span className="w-8 text-right text-slate-600 select-none mr-4 shrink-0">8</span>
                       <span className="pl-4"><span className="text-[#8b949e] italic">// 1. 硬件层初始化 (BSP Init)</span></span>
                    </div>
                    {/* Line 9 */}
                    <div className="flex">
                       <span className="w-8 text-right text-slate-600 select-none mr-4 shrink-0">9</span>
                       <span className="pl-4"><span className="text-[#d2a8ff]">NVIC_PriorityGroupConfig</span>( NVIC_PriorityGroup_4 );</span>
                    </div>
                    {/* Line 10 */}
                    <div className="flex">
                       <span className="w-8 text-right text-slate-600 select-none mr-4 shrink-0">10</span>
                       <span className="pl-4"><span className="text-[#d2a8ff]">BSP_Init</span>(); </span>
                    </div>
                    {/* Line 11 */}
                    <div className="flex">
                       <span className="w-8 text-right text-slate-600 select-none mr-4 shrink-0">11</span>
                       <span></span>
                    </div>
                    {/* Line 12 */}
                    <div className="flex">
                       <span className="w-8 text-right text-slate-600 select-none mr-4 shrink-0">12</span>
                       <span className="pl-4"><span className="text-[#8b949e] italic">// 2. 创建用户任务</span></span>
                    </div>
                    {/* Line 13 */}
                    <div className="flex">
                       <span className="w-8 text-right text-slate-600 select-none mr-4 shrink-0">13</span>
                       <span className="pl-4"><span className="text-[#79c0ff]">xTaskCreate</span>( Task1_LED,   <span className="text-[#a5d6ff]">"LED"</span>,  <span className="text-[#79c0ff]">128</span>, NULL, <span className="text-[#79c0ff]">2</span>, NULL );</span>
                    </div>
                    {/* Line 14 */}
                    <div className="flex">
                       <span className="w-8 text-right text-slate-600 select-none mr-4 shrink-0">14</span>
                       <span className="pl-4"><span className="text-[#79c0ff]">xTaskCreate</span>( Task2_UART,  <span className="text-[#a5d6ff]">"Com"</span>,  <span className="text-[#79c0ff]">256</span>, NULL, <span className="text-[#79c0ff]">3</span>, NULL );</span>
                    </div>
                    {/* Line 15 */}
                    <div className="flex">
                       <span className="w-8 text-right text-slate-600 select-none mr-4 shrink-0">15</span>
                       <span></span>
                    </div>
                    {/* Line 16 */}
                    <div className="flex">
                       <span className="w-8 text-right text-slate-600 select-none mr-4 shrink-0">16</span>
                       <span className="pl-4"><span className="text-[#8b949e] italic">// 3. 启动 RTOS 调度器</span></span>
                    </div>
                    {/* Line 17 */}
                    <div className="flex">
                       <span className="w-8 text-right text-slate-600 select-none mr-4 shrink-0">17</span>
                       <span className="pl-4"><span className="text-[#d2a8ff]">vTaskStartScheduler</span>(); </span>
                    </div>
                    {/* Line 18 */}
                    <div className="flex">
                       <span className="w-8 text-right text-slate-600 select-none mr-4 shrink-0">18</span>
                       <span></span>
                    </div>
                    {/* Line 19 */}
                    <div className="flex">
                       <span className="w-8 text-right text-slate-600 select-none mr-4 shrink-0">19</span>
                       <span className="pl-4"><span className="text-[#ff7b72]">while</span>( <span className="text-[#79c0ff]">1</span> );</span>
                    </div>
                    {/* Line 20 */}
                    <div className="flex">
                       <span className="w-8 text-right text-slate-600 select-none mr-4 shrink-0">20</span>
                       <span>{'}'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
        </div>
      </div>
      
      {/* Footer Branding */}
      <div className="flex-none py-4 text-center">
         <p className="text-slate-600 text-xs font-mono">STM32F103 • ARM Cortex-M3 • FreeRTOS V10.x</p>
      </div>
    </div>
  );
};

export default Intro;