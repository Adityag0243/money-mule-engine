import { X, ExternalLink, Flag, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SidebarRightProps {
  node: any | null;
  onClose: () => void;
}

export function SidebarRight({ node, onClose }: SidebarRightProps) {
  return (
    <AnimatePresence>
      {node && (
        <motion.div
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 300, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="absolute right-0 top-16 bottom-0 w-[350px] bg-[#020205]/95 backdrop-blur-xl border-l border-white/10 z-40 flex flex-col shadow-2xl"
        >
          {/* Header */}
          <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
            <div className="flex items-center gap-2">
               <div className={`w-3 h-3 rounded-full ${node.suspicion_score > 50 ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-slate-500'}`}></div>
               <h2 className="font-bold text-white font-mono tracking-wide">{node.id}</h2>
            </div>
            <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-8 overflow-y-auto flex-1">
             
             {/* Suspicion Score */}
             <div className="space-y-2">
                <div className="text-xs text-slate-500 uppercase font-bold tracking-widest">Suspicion Score</div>
                <div className="text-4xl font-mono font-bold text-white flex items-end gap-2">
                   {node.suspicion_score}
                   <span className="text-sm text-slate-500 font-sans mb-1">/ 100</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                   <div 
                     className={`h-full rounded-full ${node.suspicion_score > 80 ? 'bg-red-500' : 'bg-orange-500'}`} 
                     style={{ width: `${node.suspicion_score}%` }}
                   ></div>
                </div>
             </div>

             {/* Detected Patterns */}
             <div className="space-y-3">
                <div className="text-xs text-slate-500 uppercase font-bold tracking-widest flex items-center gap-2">
                   <Flag size={12} /> Detected Patterns
                </div>
                <div className="flex flex-wrap gap-2">
                   {node.patterns && node.patterns.length > 0 ? (
                      node.patterns.map((p: string) => (
                         <span key={p} className="px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded text-xs font-bold uppercase tracking-wider">
                            {p}
                         </span>
                      ))
                   ) : (
                      <span className="text-slate-500 text-sm italic">No specific patterns flagged directly.</span>
                   )}
                </div>
             </div>

             {/* Ring membership */}
             {node.ring && (
                 <div className="space-y-2">
                    <div className="text-xs text-slate-500 uppercase font-bold tracking-widest">Ring Membership</div>
                    <div className="bg-slate-800/30 p-3 rounded border border-white/5 font-mono text-xs text-cyan-400">
                       {node.ring}
                    </div>
                 </div>
             )}

             {/* Actions */}
             <div className="pt-6 border-t border-white/5 space-y-3">
                <button className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-bold uppercase tracking-wider rounded transition-all border border-white/5 flex items-center justify-center gap-2">
                   <CheckCircle size={14} /> Mark False Positive
                </button>
                <button className="w-full py-3 bg-red-600 hover:bg-red-500 text-white text-sm font-bold uppercase tracking-wider rounded transition-all shadow-[0_0_15px_rgba(220,38,38,0.4)] flex items-center justify-center gap-2">
                   <ExternalLink size={14} /> Escalate to Tier 2
                </button>
             </div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
