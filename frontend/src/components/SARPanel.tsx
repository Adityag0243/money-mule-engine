import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Sparkles } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { ToastType } from './ui/Toast';

interface RingData {
  ring_id: string;
  total_value?: number;
}

interface SARReport {
  executive_summary: string;
  mule_herder: string | { account_id: string };
}

interface SARPanelProps {
  isOpen: boolean;
  onClose: () => void;
  ringData: RingData;
  showToast: (msg: string, type: ToastType) => void;
}

export function SARPanel({ isOpen, onClose, ringData, showToast }: SARPanelProps) {
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<SARReport | null>(null);
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
        .then((data: SARReport) => {
          setReport(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setError("AI Synthesis Failed. Check connection.");
          showToast("Failed to generate SAR report.", "error");
          setLoading(false);
        });
    }
  }, [isOpen, ringData, showToast]);

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

      if (res.ok) {
        showToast(`SAR for ${ringData.ring_id} submitted.`, "success");
        onClose();
      } else {
        throw new Error("Submission failed");
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to submit SAR.", "error");
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    showToast("Exporting Classified PDF...", "info");

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

              {/* Header */}
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

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
                {loading && (
                  <div className="text-purple-500 text-center pt-20 font-mono">
                    Synthesizing Intelligence...
                  </div>
                )}

                {!loading && report && (
                  <div className="space-y-6 text-slate-300 font-mono">
                    <h3 className="text-purple-400">Executive Summary</h3>
                    <p>{report.executive_summary}</p>

                    <div>
                      <strong>Mule Herder:</strong>{" "}
                      {typeof report.mule_herder === "object"
                        ? report.mule_herder.account_id
                        : report.mule_herder}
                    </div>
                  </div>
                )}

                {error && <div className="text-red-500">{error}</div>}
              </div>

              {/* Footer */}
              <div className="h-20 border-t border-white/10 flex items-center justify-end px-8 gap-4">
                <button onClick={handleExportPDF} disabled={loading}>
                  Export PDF
                </button>

                <button onClick={handleSubmit} disabled={loading}>
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
