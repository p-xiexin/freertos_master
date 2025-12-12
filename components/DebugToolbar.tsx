
import React from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, ArrowLeft, ArrowRight, SkipForward, GripVertical, Play, Pause } from 'lucide-react';

interface DebugToolbarProps {
  // Actions
  onReset: () => void;
  onPrev?: () => void;
  onNext: () => void;
  onFinish?: () => void;
  
  // Playback State
  isPlaying: boolean;
  onTogglePlay: () => void;

  // Capabilities (Disable buttons if not available)
  canPrev?: boolean;
  canNext?: boolean;
  canFinish?: boolean;
  
  // Optional content (e.g. for status text inside toolbar)
  children?: React.ReactNode;
}

const DebugToolbar: React.FC<DebugToolbarProps> = ({ 
  onReset, 
  onPrev, 
  onNext, 
  onFinish,
  isPlaying,
  onTogglePlay,
  canPrev = true,
  canNext = true,
  canFinish = true,
  children
}) => {
  return (
    <motion.div 
      drag
      dragMomentum={false}
      initial={{ x: "-50%", y: 0 }}
      style={{ left: "50%" }}
      className="absolute top-6 z-50 flex items-center bg-[#252526] p-1 rounded-md shadow-xl border border-[#1e1e1e] select-none backdrop-blur-md bg-opacity-90"
    >
      {/* Drag Handle */}
      <div className="px-1.5 cursor-move flex items-center justify-center text-[#5c5c5c] hover:text-[#cccccc] transition-colors group">
        <GripVertical size={14} />
      </div>

      {/* Separator */}
      <div className="h-5 w-[1px] bg-[#454545] mx-1" />

      {/* Reset */}
      <button 
        onClick={onReset}
        className="p-1.5 mx-0.5 rounded hover:bg-[#3e3e42] text-[#89d185] transition-colors"
        title="Reset Simulation"
      >
        <RotateCcw size={18} strokeWidth={2.5} />
      </button>

      {/* Prev */}
      {onPrev && (
          <button 
            onClick={onPrev}
            disabled={!canPrev}
            className={`p-1.5 mx-0.5 rounded transition-colors ${!canPrev ? 'opacity-30 cursor-not-allowed text-gray-500' : 'hover:bg-[#3e3e42] text-[#cccccc]'}`}
            title="Step Back"
          >
            <ArrowLeft size={18} strokeWidth={2.5} />
          </button>
      )}

      {/* Play / Pause */}
      <button 
        onClick={onTogglePlay}
        disabled={!canNext && !isPlaying} // Allow pausing even if canNext is false (e.g. end of anim)
        className={`p-1.5 mx-0.5 rounded transition-colors ${(!canNext && !isPlaying) ? 'opacity-30 cursor-not-allowed text-gray-500' : 'hover:bg-[#3e3e42] text-[#dcdcaa]'}`}
        title={isPlaying ? "Pause" : "Auto Run"}
      >
        {isPlaying ? <Pause size={18} strokeWidth={2.5} /> : <Play size={18} strokeWidth={2.5} />}
      </button>

      {/* Next */}
      <button 
        onClick={onNext}
        disabled={!canNext}
        className={`p-1.5 mx-0.5 rounded transition-colors ${!canNext ? 'opacity-30 cursor-not-allowed text-gray-500' : 'hover:bg-[#3e3e42] text-[#569cd6]'}`}
        title="Step Forward"
      >
        <ArrowRight size={18} strokeWidth={2.5} />
      </button>

      {/* Finish / Skip */}
      {onFinish && (
          <button 
            onClick={onFinish}
            disabled={!canFinish}
            className={`p-1.5 mx-0.5 rounded transition-colors ${!canFinish ? 'opacity-30 cursor-not-allowed text-gray-500' : 'hover:bg-[#3e3e42] text-[#569cd6]'}`}
            title="Skip to End"
          >
            <SkipForward size={18} strokeWidth={2.5} />
          </button>
      )}

      {children && (
          <>
            <div className="h-5 w-[1px] bg-[#454545] mx-1" />
            <div className="px-2">{children}</div>
          </>
      )}
    </motion.div>
  );
};

export default DebugToolbar;
