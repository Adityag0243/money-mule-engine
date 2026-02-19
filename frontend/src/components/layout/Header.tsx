import { Shield, Activity, Database, Zap, Download } from 'lucide-react';

interface HeaderProps {
  stats: {
    totalTransactions: number;
    processingTime: number;
    fraudRings: number;
    illicitVolume: number; 
  };
  onExport: () => void;
}

export function Header({ stats, onExport }: HeaderProps) {
  // Mock sparkline data
  const sparklinePoints = "0,10 5,8 10,12 15,5 20,8 25,6 30,12 35,8 40,4";

  return (
    <header className="h-16 border-b border-white/5 bg-[#020205]/90 backdrop-blur-md flex items-center justify-between px-6 z-50 shrink-0">
      
      {/* Brand Identity */}
      <div className="flex items-center gap-4">
        <div className="relative group">
            <div className="absolute inset-0 bg-cyan-500/20 blur-lg rounded-full group-hover:bg-cyan-500/30 transition-all"></div>
            <div className="relative w-8 h-8 bg-cyan-950 border border-cyan-500/50 rounded flex items-center justify-center">
                <Shield className="w-5 h-5 text-cyan-400" />
            </div>
        </div>
        <div>
            <h1 className="text-lg font-bold text-white tracking-widest uppercase flex items-center gap-2">
                Mule<span className="text-cyan-400">Defense</span> <span className="text-[10px] bg-cyan-950/50 px-1.5 py-0.5 rounded border border-cyan-500/20 text-cyan-500">v2.0</span>
            </h1>
            <p className="text-[10px] text-slate-500 font-mono tracking-[0.2em] uppercase">Forensic Intelligence Engine</p>
        </div>
      </div>

      {/* Metrics Ribbon */}
      <div className="hidden lg:flex items-center gap-8">
          
          {/* Metric 1: Latency */}
          <div className="flex items-center gap-3 group">
              <div className="p-2 rounded bg-slate-900/50 border border-white/5 group-hover:border-cyan-500/20 transition-colors">
                  <Zap size={14} className="text-yellow-500" />
              </div>
              <div>
                  <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Sys. Latency</div>
                  <div className="flex items-center gap-2">
                      <span className="text-sm font-mono font-bold text-white">
                          {Math.round(stats.processingTime * 1000)}ms
                      </span>
                      {/* Micro Sparkline */}
                      <svg width="40" height="15" className="opacity-50">
                          <polyline points={sparklinePoints} fill="none" stroke="#eab308" strokeWidth="1.5" />
                      </svg>
                  </div>
              </div>
          </div>

          <div className="w-px h-8 bg-white/5"></div>

          {/* Metric 2: Throughput */}
          <div className="flex items-center gap-3 group">
              <div className="p-2 rounded bg-slate-900/50 border border-white/5 group-hover:border-cyan-500/20 transition-colors">
                  <Database size={14} className="text-blue-500" />
              </div>
              <div>
                  <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Nodes Analyzed</div>
                  <div className="flex items-center gap-2">
                      <span className="text-sm font-mono font-bold text-white">
                          {stats.totalTransactions.toLocaleString()}
                      </span>
                      {/* Micro Sparkline */}
                      <svg width="40" height="15" className="opacity-50">
                          <polyline points="0,8 10,8 20,4 30,8 40,2" fill="none" stroke="#3b82f6" strokeWidth="1.5" />
                      </svg>
                  </div>
              </div>
          </div>

          <div className="w-px h-8 bg-white/5"></div>

          {/* Metric 3: Threats */}
          <div className="flex items-center gap-3 group">
              <div className="p-2 rounded bg-slate-900/50 border border-white/5 group-hover:border-red-500/20 transition-colors">
                  <Activity size={14} className="text-red-500 animate-pulse" />
              </div>
              <div>
                  <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Active Rings</div>
                  <div className="text-sm font-mono font-bold text-red-500 text-glow-red">
                      {stats.fraudRings} DETECTED
                  </div>
              </div>
          </div>

      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <button 
            onClick={onExport}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded border border-white/10 hover:border-cyan-500/50 transition-all font-mono text-xs uppercase tracking-wider group"
        >
            <Download size={14} className="group-hover:text-cyan-400 transition-colors" />
            Export JSON
        </button>
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-600 border border-white/10 shadow-lg shadow-cyan-900/20"></div>
      </div>

    </header>
  );
}
