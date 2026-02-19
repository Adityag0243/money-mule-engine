import { clsx } from 'clsx';
import { Network, Search, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface ThreatCardProps {
  ring: any;
  isSelected: boolean;
  onSelect: (ringId: string) => void;
}

export function ThreatCard({ ring, isSelected, onSelect }: ThreatCardProps) {
  // Determine severity color based on risk score (or type)
  const isCritical = ring.risk_score > 80;
  const isHigh = ring.risk_score > 50 && ring.risk_score <= 80;
  
  const borderColor = isCritical ? 'border-red-500/50' : isHigh ? 'border-orange-500/50' : 'border-slate-700';
  const glowColor = isCritical ? 'shadow-[0_0_15px_rgba(239,68,68,0.1)]' : isSelected ? 'shadow-[0_0_15px_rgba(6,182,212,0.1)]' : '';
  const bgColor = isSelected ? 'bg-white/5' : 'bg-[#050510] hover:bg-white/5';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => onSelect(ring.ring_id)}
      className={clsx(
        "cursor-pointer p-3 rounded-lg border transition-all duration-300 relative overflow-hidden group mb-2",
        borderColor,
        bgColor,
        glowColor,
        isSelected && "border-cyan-500/50"
      )}
    >
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
            {ring.pattern_type.split(' ')[0]} {/* Shorten name */}
         </div>
      </div>

      <div className="flex items-center justify-between pl-2">
         <div className="flex items-center gap-2 text-xs text-slate-400">
            <Network size={12} />
            <span>{ring.member_accounts.length} Nodes</span>
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
    </motion.div>
  );
}
