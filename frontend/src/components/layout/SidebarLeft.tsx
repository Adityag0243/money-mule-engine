import { Search, Filter, List } from 'lucide-react';
import { ThreatCard } from './ThreatCard';
import { useMemo } from 'react';

interface SidebarLeftProps {
  rings: any[];
  selectedRingId: string | null;
  onSelectRing: (id: string | null) => void;
  onGenerateSAR: (ring: any) => void;
}

export function SidebarLeft({ rings, selectedRingId, onSelectRing, onGenerateSAR }: SidebarLeftProps) {
  
  const ringList = useMemo(() => {
      if (rings.length === 0) {
         return <div className="text-center text-slate-600 font-mono text-xs py-20 tracking-widest uppercase">No Active Threats Scan Complete</div>;
      }
      return rings.map((ring) => (
        <ThreatCard 
           key={ring.ring_id} 
           ring={ring} 
           isSelected={selectedRingId === ring.ring_id} 
           onSelect={onSelectRing}
           onGenerateSAR={onGenerateSAR}
        />
     ));
  }, [rings, selectedRingId, onSelectRing, onGenerateSAR]);

  return (
    <aside className="w-[380px] flex flex-col h-[calc(100vh-64px)] glass-panel z-40">
      
      {/* Triage Header */}
      <div className="p-5 border-b border-white/5 bg-[#050510]">
        <div className="flex items-center justify-between mb-4">
             <h2 className="text-xs font-bold text-slate-300 uppercase tracking-[0.2em] flex items-center gap-2">
                <List size={14} className="text-cyan-500" /> Triage Console
            </h2>
            <div className="px-2 py-0.5 bg-red-900/20 border border-red-500/20 rounded text-[10px] text-red-500 font-mono">
                {rings.length} ALERTS
            </div>
        </div>
        
        {/* Search Bar */}
        <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-cyan-500 transition-colors w-4 h-4" />
            <input 
              type="text" 
              placeholder="SEARCH INTELLIGENCE..." 
              className="w-full bg-slate-900/50 border border-white/10 rounded px-10 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-cyan-500/50 focus:bg-slate-900 transition-all placeholder:text-slate-700"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-700 font-mono border border-white/5 px-1 rounded">
                CTRL+K
            </div>
        </div>
      </div>

      {/* Ticket List */}
      <div className="flex-1 overflow-y-auto p-3 custom-scrollbar bg-gradient-to-b from-[#050510] to-[#020205]">
         {ringList}
      </div>

      {/* Status Footer */}
      <div className="p-2 border-t border-white/5 bg-[#020205] text-[10px] text-slate-600 font-mono text-center tracking-wider">
          SYSTEM STATUS: ONLINE
      </div>

    </aside>
  );
}
