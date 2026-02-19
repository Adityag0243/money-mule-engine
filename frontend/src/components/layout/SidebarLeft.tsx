import { Search, Filter } from 'lucide-react';
import { ThreatCard } from './ThreatCard';

interface SidebarLeftProps {
  rings: any[];
  selectedRingId: string | null;
  onSelectRing: (id: string | null) => void;
  onGenerateSAR: (ring: any) => void;
}

export function SidebarLeft({ rings, selectedRingId, onSelectRing, onGenerateSAR }: SidebarLeftProps) {
  return (
    <aside className="w-[350px] border-r border-white/10 bg-[#020205]/50 flex flex-col h-[calc(100vh-64px)]">
      
      {/* Search / Filter Header */}
      <div className="p-4 border-b border-white/5 space-y-4">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Filter size={12} /> Triage Console
        </h2>
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Filter by Ring ID..." 
              className="w-full bg-[#0A0A15] border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-colors"
            />
        </div>
      </div>

      {/* Ring List */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
         {rings.length === 0 ? (
            <div className="text-center text-slate-500 text-xs py-10">No threats detected.</div>
         ) : (
             rings.map((ring) => (
                <ThreatCard 
                   key={ring.ring_id} 
                   ring={ring} 
                   isSelected={selectedRingId === ring.ring_id} 
                   onSelect={onSelectRing}
                   onGenerateSAR={onGenerateSAR}
                />
             ))
         )}
      </div>

    </aside>
  );
}
