import { useState } from 'react';
import { Upload, FileText, Search, Activity, AlertTriangle } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { Header } from './components/layout/Header';
import { SidebarLeft } from './components/layout/SidebarLeft';
import { SidebarRight } from './components/layout/SidebarRight';
import { SARPanel } from './components/SARPanel';
import GraphVisualizer from './components/GraphVisualizer';
import { Toast, useToast } from './components/ui/Toast';

// Types (Keep existing)
interface SuspiciousAccount {
  account_id: string;
  suspicion_score: number;
  detected_patterns: string[];
  ring_id: string;
}

interface FraudRing {
  ring_id: string;
  member_accounts: string[];
  pattern_type: string;
  risk_score: number;
}

interface AnalysisSummary {
  total_accounts_analyzed: number;
  suspicious_accounts_flagged: number;
  fraud_rings_detected: number;
  processing_time_seconds: number;
}

interface AnalysisResponse {
  suspicious_accounts: SuspiciousAccount[];
  fraud_rings: FraudRing[];
  summary: AnalysisSummary;
  graph_data: {
    nodes: any[];
    links: any[];
  };
}

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast, showToast, hideToast } = useToast();
  
  // View State
  const [selectedRingId, setSelectedRingId] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  const [sarRing, setSarRing] = useState<any | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('http://localhost:8000/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || `Analysis failed: ${res.statusText}`);
      }

      const result = await res.json();
      setData(result);
    } catch (err: any) {
        console.error(err);
        setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const downloadJson = () => {
    if (!data) return;
    const { graph_data, ...reportData } = data; 
    const jsonString = `data:text/json;chatset=utf-8,${encodeURIComponent(JSON.stringify(reportData, null, 2))}`;
    const link = document.createElement("a");
    link.href = jsonString;
    link.download = `fraud_report_${Date.now()}.json`;
    link.click();
  };

  const handleRingSelect = (id: string | null) => {
    if (selectedRingId === id) {
        setSelectedRingId(null);
    } else {
        setSelectedRingId(id);
    }
    setSelectedNode(null);
  };

  const handleGenerateSAR = (ring: any) => {
      setSarRing(ring);
  };

  // ----- MAIN RENDER -----

  if (!data) {
    // Clean Upload State
    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#020205] text-[#e0e7ff] relative overflow-hidden">
           <div className="absolute inset-0 bg-grid opacity-10 pointer-events-none"></div>
           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50"></div>
           
           <div className="w-full max-w-xl glass-card p-12 rounded-3xl border border-white/5 text-center relative z-10 backdrop-blur-sm">
                <div className="mb-8">
                <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/5 group-hover:border-cyan-500/30 transition-colors shadow-2xl shadow-cyan-900/20">
                    <Upload className="w-8 h-8 text-cyan-400" />
                </div>
                <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Money Mule <span className="text-cyan-400">Defense</span></h1>
                <p className="text-slate-400 max-w-md mx-auto text-sm">
                    Upload your transaction log (CSV) to initiate the forensic graph analysis engine.
                </p>
                </div>

                <div className="flex flex-col items-center gap-6 w-full">
                <label className="relative group cursor-pointer w-full max-w-md">
                    <input type="file" className="hidden" accept=".csv" onChange={handleFileChange} />
                    <div className={clsx(
                    "px-8 py-5 rounded-xl border-2 border-dashed transition-all duration-300 flex items-center justify-center gap-3 font-medium w-full text-sm",
                    file ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-300' : 'border-slate-700 hover:border-slate-500 hover:bg-slate-800/50 text-slate-300'
                    )}>
                    {file ? <FileText className="w-5 h-5" /> : <Search className="w-5 h-5" />}
                    {file ? file.name : "Select Dataset"}
                    </div>
                </label>

                <button 
                    onClick={handleAnalyze}
                    disabled={!file || loading}
                    className={clsx(
                    "w-full max-w-md py-4 rounded-xl font-bold text-sm uppercase tracking-widest shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98]",
                    (!file || loading) 
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-cyan-500/25'
                    )}
                >
                    {loading ? (
                    <div className="flex items-center justify-center gap-2">
                        <Activity className="animate-spin" /> Processing Chain...
                    </div>
                    ) : "Initiate Scan"}
                </button>
                
                {error && (
                    <div className="text-red-400 text-xs bg-red-900/10 px-4 py-3 rounded-lg border border-red-900/30 flex items-center gap-2 w-full max-w-md text-left">
                    <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
                    </div>
                )}
                </div>
           </div>
        </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-full bg-[#020205] text-[#e0e7ff] overflow-hidden font-sans">
      
      {/* 1. Header (Global KPIs) */}
      <Header 
         stats={{
             totalTransactions: data.summary.total_accounts_analyzed,
             processingTime: data.summary.processing_time_seconds,
             fraudRings: data.summary.fraud_rings_detected,
             illicitVolume: 0 
         }}
         onExport={downloadJson}
      />

      <div className="flex flex-1 overflow-hidden relative">
          
          {/* 2. Left Sidebar (Triage) */}
          <SidebarLeft 
             rings={data.fraud_rings} 
             selectedRingId={selectedRingId}
             onSelectRing={handleRingSelect}
             onGenerateSAR={handleGenerateSAR}
          />

          {/* 3. Center Canvas (Graph) */}
          <main className="flex-1 relative bg-black">
              <GraphVisualizer 
                 graphData={data.graph_data} 
                 isolatedRingId={selectedRingId}
                 onNodeClick={setSelectedNode}
              />
          </main>

          {/* 4. Right Sidebar (Context - Overlay) */}
          <SidebarRight 
              node={selectedNode} 
              onClose={() => setSelectedNode(null)} 
              showToast={showToast}
          />

          {/* 5. SAR Panel (Overlay) */}
          <SARPanel 
             isOpen={!!sarRing}
             onClose={() => setSarRing(null)}
             ringData={sarRing}
             showToast={showToast}
          />

          {/* Toast Notification Layer */}
          <AnimatePresence>
            {toast && (
                <Toast 
                    message={toast.message} 
                    type={toast.type} 
                    onClose={hideToast} 
                />
            )}
          </AnimatePresence>
          
      </div>
    </div>
  );
}

export default App;
