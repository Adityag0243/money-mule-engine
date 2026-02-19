import { X, ExternalLink, Flag, CheckCircle, Wallet, ArrowRight, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ToastType } from '../ui/Toast';

interface SidebarRightProps {
  node: any | null;
  onClose: () => void;
  showToast: (msg: string, type: ToastType) => void;
}

export function SidebarRight({ node, onClose, showToast }: SidebarRightProps) {
  
  const handleAction = async (action: 'false_positive' | 'escalated') => {
      if(!node) return;
      try {
          // Optimistic UI could be here
          const res = await fetch('http://localhost:8000/flag-account', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  account_id: node.id,
                  status: action,
                  notes: action === 'false_positive' ? 'User marked as false positive' : 'User escalated to Tier 2'
              })
          });
          if(res.ok) {
              showToast(
                  action === 'false_positive' ? `Account ${node.id} marked Safe.` : `Account ${node.id} Escalated to INTEL.`, 
                  'success'
              );
              onClose();
          } else {
              throw new Error("Failed to update status");
          }
      } catch (err) {
          showToast("Network Error: Could not update status.", 'error');
      }
  };

  // Calculate bars
  const totalFlow = (node?.inflow || 0) + (node?.outflow || 0);
  const inPct = totalFlow > 0 ? ((node?.inflow || 0) / totalFlow) * 100 : 0;
  const outPct = totalFlow > 0 ? ((node?.outflow || 0) / totalFlow) * 100 : 0;

  return (
    <AnimatePresence>
      {node && (
        <motion.div
          initial={{ x: 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 400, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="absolute right-0 top-[64px] bottom-0 w-[400px] glass-panel z-30 flex flex-col border-l border-white/10"
        >
          {/* Header */}
          <div className="p-5 border-b border-white/5 bg-[#050510] flex items-center justify-between">
            <div>
                 <div className="text-[10px] text-slate-500 font-mono tracking-widest uppercase mb-1">Target Entity</div>
                 <h2 className="text-xl font-bold text-white font-mono tracking-wide flex items-center gap-2">
                    <Shield size={18} className={node.suspicion_score > 80 ? "text-red-500" : "text-cyan-500"} />
                    {node.id}
                 </h2>
            </div>
            <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full">
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-8 overflow-y-auto flex-1 custom-scrollbar">
             
             {/* Suspicion Score Gauge */}
             <div className="bg-slate-900/50 p-4 rounded border border-white/5">
                <div className="flex justify-between items-end mb-2">
                    <div className="text-xs text-slate-400 uppercase font-bold tracking-widest">Risk Analysis</div>
                    <div className={node.suspicion_score > 80 ? "text-red-500 text-glow-red" : "text-orange-500"}>
                        <span className="text-3xl font-mono font-bold">{node.suspicion_score}</span>
                        <span className="text-sm font-mono opacity-50">/100</span>
                    </div>
                </div>
                {/* Progress Bar */}
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden relative">
                   <div 
                     className={`h-full ${node.suspicion_score > 80 ? 'bg-gradient-to-r from-red-600 to-red-400' : 'bg-gradient-to-r from-orange-600 to-orange-400'}`} 
                     style={{ width: `${node.suspicion_score}%` }}
                   ></div>
                </div>
             </div>

             {/* Financial Flow Analysis */}
             <div className="space-y-4">
                <h3 className="text-xs text-slate-500 uppercase font-bold tracking-widest flex items-center gap-2 pb-2 border-b border-white/5">
                   <Wallet size={12} /> Flow Visualization
                </h3>
                
                {/* Visual Flow Bars */}
                <div className="flex items-center gap-1 h-8 w-full mt-2">
                     {/* Inflow Bar */}
                     <div 
                        style={{ width: `${inPct}%` }} 
                        className="h-full bg-emerald-500/20 border-r-2 border-emerald-500 flex items-center justify-start px-2 relative group"
                     >
                         {inPct > 15 && <span className="text-[10px] font-mono text-emerald-400 font-bold">IN</span>}
                     </div>
                     {/* Outflow Bar */}
                     <div 
                        style={{ width: `${outPct}%` }} 
                        className="h-full bg-red-500/20 border-l-2 border-red-500 flex items-center justify-end px-2 relative group"
                     >
                         {outPct > 15 && <span className="text-[10px] font-mono text-red-400 font-bold">OUT</span>}
                     </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-2">
                    <div className="p-3 bg-slate-900/30 border-l-2 border-emerald-500">
                        <div className="text-[10px] text-slate-500 uppercase mb-1">Total Inflow</div>
                        <div className="text-sm font-mono text-emerald-400 font-bold">
                            ${node.inflow?.toLocaleString() || '0'}
                        </div>
                    </div>
                    <div className="p-3 bg-slate-900/30 border-l-2 border-red-500">
                        <div className="text-[10px] text-slate-500 uppercase mb-1">Total Outflow</div>
                        <div className="text-sm font-mono text-red-500 font-bold">
                            ${node.outflow?.toLocaleString() || '0'}
                        </div>
                    </div>
                </div>
                
                <div className="p-3 bg-slate-900/50 border border-white/5 rounded flex justify-between items-center">
                    <div className="text-[10px] text-slate-400 uppercase">Net Position</div>
                    <div className={`text-sm font-mono font-bold ${node.inflow - node.outflow >= 0 ? 'text-white' : 'text-red-400'}`}>
                         $ {(node.inflow - node.outflow)?.toLocaleString() || '0'}
                    </div>
                </div>
             </div>

             {/* Detected Patterns */}
             <div className="space-y-3">
                <div className="text-xs text-slate-500 uppercase font-bold tracking-widest flex items-center gap-2">
                   <Flag size={12} /> Behavioral Flags
                </div>
                <div className="flex flex-wrap gap-2">
                   {node.patterns && node.patterns.length > 0 ? (
                      node.patterns.map((p: string) => (
                         <span key={p} className="px-3 py-1 bg-red-900/20 text-red-400 border border-red-500/30 rounded-sm text-[10px] font-bold font-mono uppercase tracking-wider">
                            {p.replace(/_/g, " ")}
                         </span>
                      ))
                   ) : (
                      <span className="text-slate-600 text-xs font-mono">No specific heuristics triggered.</span>
                   )}
                </div>
             </div>

             {/* Actions */}
             <div className="pt-6 mt-auto border-t border-white/5 space-y-3">
                <button 
                    onClick={() => handleAction('false_positive')}
                    className="w-full py-3 bg-emerald-900/20 hover:bg-emerald-900/30 text-emerald-400 border border-emerald-500/30 hover:border-emerald-500/50 text-xs font-bold font-mono uppercase tracking-widest rounded-sm transition-all flex items-center justify-center gap-2"
                >
                   <CheckCircle size={14} /> Verify as Safe
                </button>
                <button 
                    onClick={() => handleAction('escalated')}
                    className="w-full py-3 bg-red-600 hover:bg-red-500 text-white border border-red-500 shadow-lg shadow-red-900/50 text-xs font-bold font-mono uppercase tracking-widest rounded-sm transition-all flex items-center justify-center gap-2"
                >
                   <ExternalLink size={14} /> Escalate Account
                </button>
             </div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
