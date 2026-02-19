import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, FileText, Download, X, Send, ShieldAlert, Sparkles, AlertTriangle } from 'lucide-react';

interface SARPanelProps {
  isOpen: boolean;
  onClose: () => void;
  ringData: any;
}

export function SARPanel({ isOpen, onClose, ringData }: SARPanelProps) {
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && ringData) {
      setLoading(true);
      setError(null);
      setReport(null);

      // Call Backend API
      fetch('http://localhost:8000/generate-sar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(ringData)
      })
      .then(res => {
          if (!res.ok) throw new Error("Failed to generate report");
          return res.json();
      })
      .then(data => {
          setReport(data);
          setLoading(false);
      })
      .catch(err => {
          console.error(err);
          setError("AI Synthesis Failed. Please check backend connection and API keys.");
          setLoading(false);
      });
    }
  }, [isOpen, ringData]);

  if (!ringData) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          
          {/* Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 bottom-0 w-[600px] bg-[#020205] border-l border-white/10 shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-purple-900/20 to-transparent">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                     <Bot className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                     <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        AI-Synthesized SAR <Sparkles size={14} className="text-purple-400 animate-pulse" />
                     </h2>
                     <div className="text-xs font-mono text-purple-300/70 uppercase tracking-widest">
                        Case ID: {ringData.ring_id}
                     </div>
                  </div>
               </div>
               <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X size={20} className="text-slate-400" />
               </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 font-sans">
               {loading ? (
                  <div className="space-y-6 animate-pulse">
                     <div className="h-4 bg-slate-800 rounded w-3/4"></div>
                     <div className="h-4 bg-slate-800 rounded w-1/2"></div>
                     <div className="space-y-3 mt-8">
                        <div className="h-32 bg-slate-800/50 rounded-xl border border-white/5"></div>
                        <div className="h-32 bg-slate-800/50 rounded-xl border border-white/5"></div>
                     </div>
                     <div className="flex items-center justify-center pt-10 text-purple-400 font-mono text-xs tracking-widest uppercase animate-bounce">
                        Synthesizing network topography...
                     </div>
                  </div>
               ) : error ? (
                   <div className="p-4 bg-red-900/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400">
                       <AlertTriangle size={20} />
                       {error}
                   </div>
               ) : (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                     
                     {/* Executive Summary */}
                     <section>
                        <h3 className="text-sm font-bold text-purple-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                           <FileText size={16} /> Executive Summary
                        </h3>
                        <p className="text-slate-300 text-sm leading-relaxed border-l-2 border-purple-500 pl-4 py-1">
                           {report.executive_summary}
                        </p>
                     </section>

                     {/* The Mule Herder */}
                     <section className="bg-slate-900/30 p-4 rounded-xl border border-white/5">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Network Centrality Analysis</h3>
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/50">
                              <ShieldAlert className="text-red-500" />
                           </div>
                           <div>
                              <div className="text-xs text-slate-400 mb-1">Likely Mule Herder / Controller</div>
                              <div className="text-lg font-mono font-bold text-white">{report.mule_herder}</div>
                              <div className="text-[10px] text-red-400 uppercase tracking-wider font-bold">Highest Degree Centrality Detected</div>
                           </div>
                        </div>
                     </section>

                     {/* Financial Impact */}
                     <section className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-900/50 rounded-xl border border-white/5">
                           <div className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-1">Total Illicit Volume</div>
                           <div className="text-2xl font-mono font-bold text-green-400">
                              ${ringData.total_value?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}
                           </div>
                        </div>
                        <div className="p-4 bg-slate-900/50 rounded-xl border border-white/5">
                            <div className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-1">Risk Severity</div>
                            <div className="text-2xl font-mono font-bold text-orange-500">
                               {ringData.risk_score}/100
                            </div>
                        </div>
                     </section>

                  </div>
               )}
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-white/10 bg-[#050510] flex gap-3">
               <button 
                  disabled={loading || !!error}
                  className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold uppercase tracking-wider rounded transition-all shadow-lg shadow-purple-900/20 flex items-center justify-center gap-2"
               >
                  <Send size={16} /> Submit to FinCEN
               </button>
               <button 
                  disabled={loading || !!error}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-200 text-sm font-bold uppercase tracking-wider rounded transition-all border border-white/5 flex items-center justify-center gap-2"
               >
                  <Download size={16} /> PDF Export
               </button>
            </div>

          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
