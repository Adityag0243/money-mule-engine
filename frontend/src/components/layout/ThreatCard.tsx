import { clsx } from 'clsx';
import { Network, Bot, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';

interface ThreatCardProps {
  ring: any;
  isSelected: boolean;
  onSelect: (ringId: string) => void;
  onGenerateSAR: (ring: any) => void;
}

export function ThreatCard({ ring, isSelected, onSelect, onGenerateSAR }: ThreatCardProps) {
  const isCritical = ring.risk_score > 80;
  const isHigh = ring.risk_score > 50 && ring.risk_score <= 80;
  
  const borderColor = isCritical ? 'border-red-500/50' : isHigh ? 'border-orange-500/50' : 'border-slate-700';
  const glowColor = isCritical ? 'shadow-[0_0_15px_rgba(239,68,68,0.1)]' : isSelected ? 'shadow-[0_0_15px_rgba(6,182,212,0.1)]' : '';
  const bgColor = isSelected ? 'bg-white/5' : 'bg-[#050510] hover:bg-white/5';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      layout
      className={clsx(
        "p-3 rounded-lg border transition-all duration-300 relative overflow-hidden group mb-2 flex flex-col gap-3",
        borderColor,
        bgColor,
        glowColor,
        isSelected && "border-cyan-500/50"
      )}
    >
      {/* Click area for selection */}
      <div className="cursor-pointer" onClick={() => onSelect(ring.ring_id)}>
          {/* Selection Indicator */}
          {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-500"></div>}

          <div className="flex justify-between items-start mb-2 pl-2">
            <div>
                <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mb-0.5">Ring ID</div>
                <div className="text-xs font-bold text-white font-mono">{ring.ring_id}</div>
            </div>
            <div className={clsx(
                "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                isCritical ? "bg-red-500/10 text-red-400" : "bg-orange-500/10 text-orange-400"
            )}>
                {ring.pattern_type.split(' ')[0]}
            </div>
          </div>

          <div className="flex items-center justify-between pl-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                <DollarSign size={12} className="text-green-500" />
                <span className="text-white font-bold">
                    ${ring.total_value?.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) || '0'}
                </span>
            </div>
            <div className="flex items-center gap-1">
                <div className="text-[10px] text-slate-500 font-bold uppercase">Risk</div>
                <div className={clsx(
                    "text-sm font-mono font-bold",
                    isCritical ? "text-red-500" : "text-orange-400"
                )}>
                    {ring.risk_score}
                </div>
            </div>
          </div>
      </div>

      {/* Action Buttons (Only visible contextually or always?) - Always for easy access */}
      <button 
         onClick={(e) => {
             e.stopPropagation();
             onGenerateSAR(ring);
         }}
         className="mx-2 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 text-[10px] font-bold uppercase tracking-wider rounded flex items-center justify-center gap-2 transition-colors"
      >
         <Bot size={12} /> Generate AI Report
      </button>

    </motion.div>
  );
}
