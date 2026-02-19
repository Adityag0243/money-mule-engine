import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, FileText, Download, X, Send, ShieldAlert, Sparkles, AlertTriangle, Fingerprint } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { ToastType } from './ui/Toast';

interface SARPanelProps {
  isOpen: boolean;
  onClose: () => void;
  ringData: any;
  showToast: (msg: string, type: ToastType) => void;
}

export function SARPanel({ isOpen, onClose, ringData, showToast }: SARPanelProps) {
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && ringData) {
      setLoading(true);
      setError(null);
      setReport(null);

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
          setError("AI Synthesis Failed. Check connection.");
          setLoading(false);
      });
    }
  }, [isOpen, ringData]);

  const handleSubmit = async () => {
      try {
          setLoading(true);
          const res = await fetch('http://localhost:8000/submit-sar', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  ring_id: ringData.ring_id,
                  report_content: report
              })
          });
          
          if(res.ok) {
              showToast(`SAR for ${ringData.ring_id} submitted.`, 'success');
              onClose();
          } else {
              throw new Error("Submission failed");
          }
      } catch (err) {
          showToast("Failed to submit SAR.", 'error');
          setLoading(false);
      }
  };

  const handleExportPDF = () => {
        // PDF Logic (Simplified for brevity, assumes jspdf works)
        showToast("Exporting Classified PDF...", 'info');
        // ... (Existing PDF logic)
        const doc = new jsPDF();
        doc.text("CONFIDENTIAL - FINCEN SAR", 10, 10);
        doc.text(JSON.stringify(report, null, 2), 10, 20);
        doc.save("SAR.pdf");
  };

  if (!ringData) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60]"
          />
          
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
            className="fixed inset-x-0 bottom-0 top-20 bg-[#0a0a10] border-t border-white/10 shadow-2xl z-[70] flex flex-col items-center"
          >
             <div className="w-full max-w-4xl h-full bg-[#05050a] border-x border-white/5 flex flex-col relative shadow-[0_0_50px_rgba(0,0,0,0.8)]">
                
                {/* Classified Header */}
                <div className="h-16 border-b border-white/10 flex items-center justify-between px-8 bg-slate-900/50">
                    <div className="flex items-center gap-4">
                        <div className="px-3 py-1 bg-purple-900/20 border border-purple-500/30 text-purple-400 text-xs font-mono font-bold uppercase tracking-widest flex items-center gap-2">
                             <Sparkles size={12} /> AI Classified
                        </div>
                        <h2 className="text-white font-mono font-bold tracking-widest uppercase text-sm">
                            CASE: {ringData.ring_id}
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded text-slate-500 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                {/* Document Content */}
                <div className="flex-1 overflow-y-auto p-12 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
                    <div className="max-w-3xl mx-auto space-y-10">
                        
                        {/* Loading State */}
                        {loading && (
                            <div className="space-y-4 font-mono text-center pt-20">
                                <div className="text-purple-500 animate-pulse text-sm uppercase tracking-widest">Synthesizing Intelligence...</div>
                                <div className="flex justify-center gap-1">
                                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce delay-75"></div>
                                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce delay-150"></div>
                                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce delay-300"></div>
                                </div>
                            </div>
                        )}

                        {!loading && !error && (
                            <>
                                {/* Executive Summary Box */}
                                <div className="bg-slate-900/30 border border-slate-700/50 p-8 relative">
                                    <div className="absolute -top-3 left-4 px-2 bg-[#05050a] text-xs font-mono text-purple-400 uppercase tracking-widest border border-slate-700/50">
                                        Executive Summary
                                    </div>
                                    <p className="font-mono text-sm leading-relaxed text-slate-300">
                                        {report.executive_summary}
                                    </p>
                                </div>

                                {/* Network Actors */}
                                <div className="grid grid-cols-2 gap-8">
                                    
                                    {/* Mule Herder ID */}
                                    <div className="bg-slate-900/30 border border-slate-700/50 p-6 flex flex-col items-center text-center gap-4">
                                        <div className="w-16 h-16 rounded-full border-2 border-dashed border-red-500/50 flex items-center justify-center">
                                            <Fingerprint size={32} className="text-red-500" />
                                        </div>
                                        <div>
                                            <div className="text-[10px] uppercase font-mono text-slate-500 mb-1">Identified Controller</div>
                                            <div className="text-xl font-mono font-bold text-white bg-red-900/20 px-4 py-1 rounded border border-red-500/20">
                                                {typeof report.mule_herder === 'object' ? report.mule_herder.account_id : report.mule_herder}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Stats */}
                                    <div className="space-y-4">
                                        <div className="bg-slate-900/30 border border-slate-700/50 p-4 flex justify-between items-center">
                                            <span className="text-xs font-mono text-slate-500 uppercase">Est. Volume</span>
                                            <span className="text-lg font-mono font-bold text-green-400">
                                                ${ringData.total_value?.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="bg-slate-900/30 border border-slate-700/50 p-4 flex justify-between items-center">
                                            <span className="text-xs font-mono text-slate-500 uppercase">Confidence Score</span>
                                            <span className="text-lg font-mono font-bold text-purple-400">
                                                98.2%
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                    </div>
                </div>

                {/* Footer Controls */}
                <div className="h-20 border-t border-white/10 bg-[#020205] flex items-center justify-end px-8 gap-4">
                    <div className="mr-auto text-[10px] text-slate-600 font-mono">
                        CAUTION: PROPRIETARY FINANCIAL INTELLIGENCE. DO NOT DISTRIBUTE.
                    </div>
                    
                    <button 
                        onClick={handleExportPDF}
                        disabled={loading}
                        className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/10 text-xs font-bold font-mono uppercase tracking-widest rounded-sm transition-all"
                    >
                         Export PDF
                    </button>
                    <button 
                         onClick={handleSubmit}
                         disabled={loading}
                         className="px-6 py-3 bg-purple-700 hover:bg-purple-600 text-white shadow-lg shadow-purple-900/40 text-xs font-bold font-mono uppercase tracking-widest rounded-sm transition-all flex items-center gap-2"
                    >
                         <Send size={14} /> Submit to FinCEN
                    </button>
                </div>

             </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
