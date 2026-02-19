import { X, Clock, ArrowRight, DollarSign, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMemo } from 'react';

interface RingDetailsProps {
  ring: any | null;
  graphData: { nodes: any[], links: any[] };
  onClose: () => void;
}

export function RingDetails({ ring, graphData, onClose }: RingDetailsProps) {
  
  // Extract transactions relevant to this ring
  const ringTransactions = useMemo(() => {
    if (!ring || !graphData.links) return [];
    
    // Get all member IDs
    const members = new Set(ring.member_accounts);
    
    // Filter links where BOTH source and target are in the ring
    const relevantLinks = graphData.links.filter((link: any) => {
        const src = typeof link.source === 'object' ? link.source.id : link.source;
        const tgt = typeof link.target === 'object' ? link.target.id : link.target;
        return members.has(src) && members.has(tgt);
    });

    // Sort by Date
    return relevantLinks.map((link: any) => ({
        ...link,
        sourceId: typeof link.source === 'object' ? link.source.id : link.source,
        targetId: typeof link.target === 'object' ? link.target.id : link.target,
        parsedDate: new Date(link.timestamp)
    })).sort((a: any, b: any) => a.parsedDate.getTime() - b.parsedDate.getTime());
  }, [ring, graphData]);

  // Group by date (optional simple grouping logic)
  // For now, flat list

  return (
    <AnimatePresence>
      {ring && (
        <motion.div
          initial={{ x: 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 400, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="flex flex-col h-full w-full bg-[#020205] border-l border-white/10"
        >
          {/* Header */}
          <div className="p-5 border-b border-white/5 bg-[#050510]">
             <div className="flex justify-between items-start mb-2">
                 <div>
                    <h2 className="text-xl font-bold text-white font-mono tracking-wide flex items-center gap-2">
                        {ring.ring_id}
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[10px] font-mono uppercase rounded">
                            {ring.pattern_type}
                        </span>
                        <span className={`px-2 py-0.5 text-[10px] font-mono uppercase rounded font-bold ${ring.risk_score > 80 ? 'bg-red-900/40 text-red-500' : 'bg-orange-900/40 text-orange-500'}`}>
                            Risk {ring.risk_score}
                        </span>
                    </div>
                 </div>
                 <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full">
                   <X size={20} />
                 </button>
             </div>
             
             <div className="mt-4 p-3 bg-slate-900/50 border border-white/5 rounded flex justify-between items-center">
                 <div className="text-[10px] uppercase text-slate-500 font-mono tracking-wider">Total Illicit Volume</div>
                 <div className="text-lg font-mono font-bold text-emerald-400 text-glow-cyan">
                     ${ring.total_value?.toLocaleString()}
                 </div>
             </div>
          </div>

          {/* Chronological Ledger */}
          <div className="flex-1 overflow-y-auto p-0 relative custom-scrollbar bg-[#020205]">
             
             {/* Timeline Line */}
             <div className="absolute left-6 top-4 bottom-4 w-px bg-slate-800/50"></div>

             <div className="p-4 space-y-6">
                 {ringTransactions.length === 0 ? (
                    <div className="text-center text-slate-600 font-mono text-xs py-10">No internal transactions found within ring subset.</div>
                 ) : (
                    ringTransactions.map((tx: any, idx: number) => (
                        <div key={idx} className="relative pl-8 group">
                            
                            {/* Dot */}
                            <div className="absolute left-[5px] top-1.5 w-3 h-3 bg-[#020205] border-2 border-slate-700 rounded-full group-hover:border-cyan-500 group-hover:scale-110 transition-all z-10"></div>
                            
                            {/* Content Card */}
                            <div className="p-3 bg-slate-900/30 border border-white/5 rounded hover:bg-slate-900/60 transition-colors">
                                {/* Time */}
                                <div className="flex items-center gap-2 mb-2">
                                    <Clock size={10} className="text-slate-500" />
                                    <span className="text-[10px] font-mono text-slate-500">
                                        {tx.timestamp}
                                    </span>
                                </div>
                                
                                {/* Flow */}
                                <div className="flex items-center justify-between gap-2 mb-2">
                                    <div className="font-mono text-xs text-slate-400 truncate max-w-[80px]" title={tx.sourceId}>
                                        {tx.sourceId}
                                    </div>
                                    <div className="flex-1 border-b border-dashed border-slate-700 relative h-1">
                                        <ArrowRight size={10} className="absolute right-0 -top-2 text-slate-600" />
                                    </div>
                                    <div className="font-mono text-xs text-white truncate max-w-[80px]" title={tx.targetId}>
                                        {tx.targetId}
                                    </div>
                                </div>
                                
                                {/* Amount */}
                                <div className="flex justify-end">
                                    <div className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1">
                                        <DollarSign size={10} />
                                        {tx.amount.toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                 )}
             </div>
          </div>

        </motion.div>
      )}
    </AnimatePresence>
  );
}
