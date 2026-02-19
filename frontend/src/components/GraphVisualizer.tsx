import { useRef, useState, useEffect, useMemo, memo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { ZoomIn, ZoomOut, Maximize, DollarSign } from 'lucide-react';
import clsx from 'clsx';

interface GraphVisualizerProps {
  graphData: {
    nodes: any[];
    links: any[];
  };
  isolatedRingId: string | null;
  onNodeClick: (node: any) => void;
}

const GraphVisualizer = memo(({ graphData, isolatedRingId, onNodeClick }: GraphVisualizerProps) => {
  const fgRef = useRef<any>();
  const [dimensions, setDimensions] = useState({ w: 800, h: 600 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [showAmounts, setShowAmounts] = useState(false);

  // Filter Data based on Isolation - MEMOIZED to prevent expensive re-calculation
  const displayData = useMemo(() => {
      if (!isolatedRingId) return graphData;
      
      const relevantNodes = graphData.nodes.filter((n: any) => n.ring && n.ring.includes(isolatedRingId));
      const relevantNodeIds = new Set(relevantNodes.map((n: any) => n.id));
      
      // Also include neighbors? For now, strict isolation as requested
      const relevantLinks = graphData.links.filter((l: any) => 
          relevantNodeIds.has(typeof l.source === 'object' ? l.source.id : l.source) && 
          relevantNodeIds.has(typeof l.target === 'object' ? l.target.id : l.target)
      );

      return { nodes: relevantNodes, links: relevantLinks };
  }, [graphData, isolatedRingId]);

  useEffect(() => {
    const updateDims = () => {
      if (containerRef.current) {
        setDimensions({
          w: containerRef.current.clientWidth,
          h: containerRef.current.clientHeight
        });
      }
    };
    
    updateDims();
    window.addEventListener('resize', updateDims);
    return () => window.removeEventListener('resize', updateDims);
  }, []);

  // Auto zoom on data change
  useEffect(() => {
     if (isolatedRingId && fgRef.current) {
         setTimeout(() => {
             fgRef.current.zoomToFit(800, 50);
         }, 200);
     }
  }, [isolatedRingId]); // Removed displayData dependency to avoid loop if object ref changes


  const handleZoom = (k: number) => {
    fgRef.current?.zoom(fgRef.current.zoom() * k, 400);
  };

  const handleFit = () => {
    fgRef.current?.zoomToFit(400, 20);
  };

  return (
    <div className="relative h-full w-full flex flex-col group bg-[#020205] overflow-hidden">
      
      {/* Graph Toolbar (Top Left Overlay) */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <div className="glass p-1.5 rounded-lg flex flex-col gap-1 border border-white/10">
            <button onClick={() => handleZoom(1.2)} className="p-2 hover:bg-white/10 rounded text-cyan-400 transition-colors" title="Zoom In">
              <ZoomIn size={18} />
            </button>
            <button onClick={() => handleZoom(0.8)} className="p-2 hover:bg-white/10 rounded text-cyan-400 transition-colors" title="Zoom Out">
              <ZoomOut size={18} />
            </button>
            <button onClick={handleFit} className="p-2 hover:bg-white/10 rounded text-cyan-400 transition-colors" title="Reset View">
              <Maximize size={18} />
            </button>
            <div className="w-full h-px bg-white/10 my-1"></div>
            <button 
                onClick={() => setShowAmounts(prev => !prev)} 
                className={clsx(
                    "p-2 rounded transition-colors",
                    showAmounts ? "bg-green-500/20 text-green-400" : "hover:bg-white/10 text-slate-500"
                )}
                title="Toggle Edge Amounts"
            >
              <DollarSign size={18} />
            </button>
        </div>
      </div>

      {/* Main container */}
      <div ref={containerRef} className="flex-1 w-full h-full relative">
        {/* Grid Background Effect */}
        <div className="absolute inset-0 bg-grid opacity-[0.03] pointer-events-none"></div>

        {graphData.nodes.length > 0 ? (
          <ForceGraph2D
            ref={fgRef}
            width={dimensions.w}
            height={dimensions.h}
            graphData={displayData}
            nodeLabel={(node: any) => {
               if (node.suspicion_score > 0) {
                   return `${node.id} | Score: ${node.suspicion_score}`;
               }
               return node.id;
            }}
            nodeColor={(node: any) => node.color}
            nodeVal={(node: any) => node.val}
            linkColor={() => 'rgba(6, 182, 212, 0.2)'} // Cyan edges
            linkDirectionalArrowLength={3.5}
            linkDirectionalArrowRelPos={1}
            backgroundColor="transparent"
            onNodeClick={(node) => {
               onNodeClick(node);
               fgRef.current?.centerAt(node.x, node.y, 1000);
               fgRef.current?.zoom(4, 2000);
            }}
            // Custom drawing for edge labels if enabled
            linkCanvasObjectMode={() => showAmounts ? 'after' : undefined}
            linkCanvasObject={(link: any, ctx, globalScale) => {
                if (!showAmounts || !link.amount) return;
                
                const label = `$${link.amount}`;
                const fontSize = 10/globalScale; // Scale font based on zoom
                ctx.font = `${fontSize}px Sans-Serif`;
                const textWidth = ctx.measureText(label).width;
                const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2); // some padding

                // Calculate midpoint
                const x = link.source.x + (link.target.x - link.source.x) / 2;
                const y = link.source.y + (link.target.y - link.source.y) / 2;

                ctx.save();
                ctx.translate(x, y);
                // Rotate label to align with edge? No, keep it horizontal for readability
                
                ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                ctx.fillRect(-bckgDimensions[0] / 2, -bckgDimensions[1] / 2, ...bckgDimensions);

                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = '#4ade80'; // Green text
                ctx.fillText(label, 0, 0);
                ctx.restore();
            }}
            d3AlphaDecay={0.02}
            d3VelocityDecay={0.3}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-800 gap-4">
              <p className="text-sm font-mono tracking-widest uppercase opacity-50">No Graph Data</p>
          </div>
        )}
      </div>

      {/* Legend Overlay (Bottom Left) */}
      <div className="absolute bottom-6 left-6 p-4 glass rounded-xl border border-white/5 backdrop-blur-md shadow-2xl z-10">
        <h4 className="text-[10px] uppercase font-bold text-slate-500 mb-2 tracking-widest">Threat Levels</h4>
        <div className="space-y-2 text-xs font-mono">
            <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>
            <span className="text-red-200">Critical (&gt;90)</span>
            </div>
            <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]"></span>
            <span className="text-orange-200">High Risk (50-89)</span>
            </div>
            <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-slate-600"></span>
            <span className="text-slate-400">Neutral (&lt;50)</span>
            </div>
        </div>
      </div>

      {/* View Toggle Overlay (Top Right) */}
        {isolatedRingId && (
            <div className="absolute top-6 right-6 z-20">
                <div className="glass px-4 py-2 rounded-full border border-cyan-500/30 flex items-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                    <span className="text-xs font-bold text-cyan-100 uppercase tracking-wide">Isolated View: {isolatedRingId}</span>
                </div>
            </div>
        )}

    </div>
  );
});

export default GraphVisualizer;
