import { ShieldCheck, Activity, Database, Zap, Download } from 'lucide-react';

interface HeaderProps {
  stats: {
    totalTransactions: number;
    processingTime: number;
    fraudRings: number;
    illicitVolume: number; // Mocked for now or derived
  };
  onExport: () => void;
}

export function Header({ stats, onExport }: HeaderProps) {
  return (
    <header className="h-16 border-b border-white/10 bg-[#020205]/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-50">
      
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-cyan-500/10 rounded flex items-center justify-center border border-cyan-500/20 shadow-[0_0_10px_rgba(6,182,212,0.1)]">
          <ShieldCheck className="w-5 h-5 text-cyan-400" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight leading-none">
            Money Mule <span className="text-cyan-400">Defense</span>
          </h1>
          <div className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">
             Forensics Engine v1.0
          </div>
        </div>
      </div>

      {/* Global KPIs Ribbon */}
      <div className="hidden md:flex items-center gap-8">
         <div className="flex items-center gap-3">
            <div className="p-1.5 rounded bg-slate-800/50 text-slate-400"><Database size={14} /></div>
            <div>
               <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Transactions</div>
               <div className="text-sm font-mono text-white">{stats.totalTransactions.toLocaleString()}</div>
            </div>
         </div>
         <div className="w-px h-8 bg-white/5"></div>
         <div className="flex items-center gap-3">
            <div className="p-1.5 rounded bg-slate-800/50 text-slate-400"><Zap size={14} /></div>
            <div>
               <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Latency</div>
               <div className="text-sm font-mono text-cyan-400">{stats.processingTime}s</div>
            </div>
         </div>
         <div className="w-px h-8 bg-white/5"></div>
         <div className="flex items-center gap-3">
            <div className="p-1.5 rounded bg-slate-800/50 text-slate-400"><Activity size={14} /></div>
            <div>
               <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Fraud Rings</div>
               <div className="text-sm font-mono text-red-400">{stats.fraudRings}</div>
            </div>
         </div>
      </div>

      {/* Actions */}
      <button 
        onClick={onExport}
        className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold uppercase tracking-wider rounded border border-white/5 transition-colors"
      >
        <Download size={14} /> Export JSON
      </button>

    </header>
  );
}
