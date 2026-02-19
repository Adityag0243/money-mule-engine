import { clsx } from 'clsx';
import { Bot, DollarSign, Activity } from 'lucide-react';
import { memo } from 'react';

interface ThreatCardProps {
  ring: any;
  isSelected: boolean;
  onSelect: (ringId: string) => void;
  onGenerateSAR: (ring: any) => void;
}

export const ThreatCard = memo(({ ring, isSelected, onSelect, onGenerateSAR }: ThreatCardProps) => {
  const isCritical = ring.risk_score > 80;
  const isHigh = ring.risk_score > 50 && ring.risk_score <= 80;
  
  // Cyber Aesthetics
  const borderColor = isCritical 
    ? isSelected ? 'border-red-500' : 'border-red-500/30' 
    : isSelected ? 'border-cyan-500' : 'border-white/10';
    
  const bgStyle = isSelected 
    ? 'bg-white/5 backdrop-blur-sm' 
    : 'bg-[#050510]/50 hover:bg-white/5';

  const riskColor = isCritical ? 'text-red-500' : 'text-orange-500';
  const riskLabel = isCritical ? 'CRITICAL' : isHigh ? 'HIGH' : 'MEDIUM';

  return (
    <div 
      className={clsx(
        "group relative p-0 overflow-hidden mb-3 transition-all duration-200 border-l-2",
        borderColor, 
        // We use a pseudo-element logic for general border via container or simpler: just left border indicator
        isSelected ? "border-l-4" : "border-l-2"
      )}
    >
      {/* Background Container */}
      <div className={clsx("p-4 border-y border-r border-white/5 w-full relative", bgStyle)}>
          
          {/* Scanline Effect (Hover) */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent translate-y-[-100%] group-hover:translate-y-[100%] transition-transform duration-1000 pointer-events-none"></div>

          {/* Click Area */}
          <div className="cursor-pointer space-y-3" onClick={() => onSelect(ring.ring_id)}>
            
            {/* Header: ID + Badge */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Activity size={12} className={riskColor} />
                    <span className="font-mono text-xs font-bold text-slate-300 tracking-wider">
                        {ring.ring_id}
                    </span>
                </div>
                <div className={clsx(
                    "text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-widest",
                    isCritical 
                        ? "bg-red-500/10 border-red-500/50 text-red-500"
                        : "bg-orange-500/10 border-orange-500/50 text-orange-500"
                )}>
                    {riskLabel}
                </div>
            </div>

            {/* Pattern Type */}
            <div className="text-[10px] text-slate-500 uppercase font-mono tracking-widest">
                Pattern: <span className="text-slate-300">{ring.pattern_type}</span>
            </div>

            {/* Metrics Layout */}
            <div className="flex items-end justify-between mt-2">
                
                {/* Financials */}
                <div className="flex flex-col">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Volume</span>
                    <div className="flex items-center gap-1 font-mono text-sm font-bold text-emerald-400">
                        <DollarSign size={12} />
                        {ring.total_value?.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) || '0'}
                    </div>
                </div>

                {/* Risk Score Radial Mockup */}
                <div className="flex flex-col items-end">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Risk Score</span>
                    <div className="flex items-center gap-2">
                         <div className={clsx("text-xl font-mono font-bold", riskColor, isCritical && "text-glow-red")}>
                             {ring.risk_score}
                         </div>
                         {/* Circle Indicator */}
                         <div className="w-5 h-5 rounded-full border-2 border-white/10 flex items-center justify-center relative">
                             <div 
                                className={clsx("absolute inset-0 rounded-full opacity-50", isCritical ? "bg-red-500" : "bg-orange-500")}
                                style={{ clipPath: `inset(${100 - ring.risk_score}% 0 0 0)` }} // Simple heuristic fill
                             ></div>
                         </div>
                    </div>
                </div>

            </div>
          </div>

          {/* Action Footer */}
          <div className="mt-3 pt-3 border-t border-white/5 flex justify-end">
              <button 
                 onClick={(e) => {
                     e.stopPropagation();
                     onGenerateSAR(ring);
                 }}
                 className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-[10px] font-bold uppercase tracking-widest border border-purple-500/20 hover:border-purple-500/50 transition-all rounded-sm"
              >
                  <Bot size={12} /> AI Analysis
              </button>
          </div>

      </div>
    </div>
  );
}, (prev, next) => {
    return (
        prev.isSelected === next.isSelected && 
        prev.ring.ring_id === next.ring.ring_id &&
        prev.ring.risk_score === next.ring.risk_score
    );
});
