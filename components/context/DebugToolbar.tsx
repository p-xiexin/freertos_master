import React from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, ArrowLeft, ArrowRight, SkipForward, GripVertical, Play, Pause } from 'lucide-react';

interface DebugToolbarProps {
  step: number;
  totalSteps: number;
  onReset: () => void;
  onPrev: () => void;
  onNext: () => void;
  onFinish: () => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
}

const DebugToolbar: React.FC<DebugToolbarProps> = ({ 
  step, 
  totalSteps,
  onReset, 
  onPrev, 
  onNext, 
  onFinish,
  isPlaying,
  onTogglePlay
}) => {
  const isFirst = step === 0;
  const isLast = step === totalSteps - 1;

  return (
    <motion.div 
      drag
      dragMomentum={false}
      initial={{ x: "-50%", y: 0 }}
      // Positioned at top center initially
      style={{ left: "50%" }}
      className="absolute top-6 z-50 flex items-center bg-[#252526] p-1 rounded-md shadow-xl border border-[#1e1e1e] select-none"
    >
      {/* Drag Handle */}
      <div className="px-1.5 cursor-move flex items-center justify-center text-[#5c5c5c] hover:text-[#cccccc] transition-colors group">
        <GripVertical size={14} />
      </div>

      {/* Separator */}
      <div className="h-5 w-[1px] bg-[#454545] mx-1" />

      {/* Restart / Reset */}
      <button 
        onClick={onReset}
        className="p-1.5 mx-0.5 rounded hover:bg-[#3e3e42] text-[#89d185] transition-colors"
        title="Restart (Reset)"
      >
        <RotateCcw size={18} strokeWidth={2.5} />
      </button>

      {/* Step Back */}
      <button 
        onClick={onPrev}
        disabled={isFirst}
        className={`p-1.5 mx-0.5 rounded transition-colors ${isFirst ? 'opacity-30 cursor-not-allowed text-gray-500' : 'hover:bg-[#3e3e42] text-[#cccccc]'}`}
        title="Step Back"
      >
        <ArrowLeft size={18} strokeWidth={2.5} />
      </button>

      {/* Play / Pause */}
      <button 
        onClick={onTogglePlay}
        disabled={isLast}
        className={`p-1.5 mx-0.5 rounded transition-colors ${isLast ? 'opacity-30 cursor-not-allowed text-gray-500' : 'hover:bg-[#3e3e42] text-[#dcdcaa]'}`}
        title={isPlaying ? "Pause" : "Auto Step"}
      >
        {isPlaying ? <Pause size={18} strokeWidth={2.5} /> : <Play size={18} strokeWidth={2.5} />}
      </button>

      {/* Step Over / Next */}
      <button 
        onClick={onNext}
        disabled={isLast}
        className={`p-1.5 mx-0.5 rounded transition-colors ${isLast ? 'opacity-30 cursor-not-allowed text-gray-500' : 'hover:bg-[#3e3e42] text-[#569cd6]'}`}
        title="Step Over"
      >
        <ArrowRight size={18} strokeWidth={2.5} />
      </button>

      {/* Continue / Finish */}
      <button 
        onClick={onFinish}
        disabled={isLast}
        className={`p-1.5 mx-0.5 rounded transition-colors ${isLast ? 'opacity-30 cursor-not-allowed text-gray-500' : 'hover:bg-[#3e3e42] text-[#569cd6]'}`}
        title="Continue (Skip to End)"
      >
        <SkipForward size={18} strokeWidth={2.5} />
      </button>
    </motion.div>
  );
};

export default DebugToolbar;