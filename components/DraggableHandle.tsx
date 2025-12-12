import React, { useState, useEffect } from 'react';
import { GripVertical, GripHorizontal } from 'lucide-react';

interface DraggableHandleProps {
  orientation: 'horizontal' | 'vertical';
  onDrag: (delta: number) => void;
}

const DraggableHandle: React.FC<DraggableHandleProps> = ({ orientation, onDrag }) => {
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!isDragging) return;
    const handleMouseMove = (e: MouseEvent) => {
      onDrag(orientation === 'horizontal' ? e.movementY : e.movementX);
    };
    const handleMouseUp = () => setIsDragging(false);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, onDrag, orientation]);

  return (
    <div
      onMouseDown={() => setIsDragging(true)}
      className={`
        ${orientation === 'horizontal' ? 'h-2 cursor-row-resize w-full' : 'w-2 cursor-col-resize h-full'}
        bg-slate-900 hover:bg-sky-600 transition-colors flex items-center justify-center z-50 shrink-0 border-slate-800
        ${orientation === 'horizontal' ? 'border-y' : 'border-x'}
      `}
    >
      {orientation === 'horizontal' ? <GripHorizontal size={12} className="text-slate-600" /> : <GripVertical size={12} className="text-slate-600" />}
    </div>
  );
};

export default DraggableHandle;