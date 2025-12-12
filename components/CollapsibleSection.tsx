
import React, { useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  prefix?: React.ReactNode;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ title, children, defaultOpen = true, prefix }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="bg-slate-950/50 rounded-lg border border-slate-800/50 overflow-hidden mb-2 shadow-sm">
      <div className="flex items-center w-full bg-slate-900 border-b border-slate-800/50 hover:bg-slate-800/80 transition-colors">
        {prefix && (
           <div className="pl-2 pr-1 text-slate-600 cursor-grab active:cursor-grabbing hover:text-slate-400 flex items-center justify-center">
             {prefix}
           </div>
        )}
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="flex-1 flex items-center gap-2 p-2 text-xs font-bold text-slate-300 uppercase tracking-wider text-left outline-none"
        >
          {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          {title}
        </button>
      </div>
      {isOpen && <div className="p-2">{children}</div>}
    </div>
  );
};

export default CollapsibleSection;
