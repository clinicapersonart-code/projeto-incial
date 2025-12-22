import React, { useCallback, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  Edge,
  Node,
  useNodesState,
  useEdgesState,
  Position,
  MarkerType,
  NodeProps,
  Handle,
} from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';
import {
  BrainCircuit,
  Heart,
  Activity,
  User,
  MapPin,
  Zap,
  Users,
  Eye,
  Dna,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';

interface PBTGraphProps {
  nodes: { id: string; label: string; type: string; change: string; category?: string; isTarget?: boolean }[];
  edges: { source: string; target: string; relation: string; weight: string }[];
}

// --- CONFIGURAÇÃO VISUAL ---

const CATEGORY_STYLES: Record<string, { color: string; icon: React.ElementType; label: string }> = {
  'Cognitiva': { color: '#3b82f6', icon: BrainCircuit, label: 'Cognitivo' }, // Blue
  'Afetiva': { color: '#ef4444', icon: Heart, label: 'Afetivo' }, // Red
  'Comportamento': { color: '#22c55e', icon: Activity, label: 'Comportamento' }, // Green
  'Self': { color: '#a855f7', icon: User, label: 'Self' }, // Purple
  'Contexto': { color: '#eab308', icon: MapPin, label: 'Contexto' }, // Yellow
  'Motivacional': { color: '#f97316', icon: Zap, label: 'Motivacional' }, // Orange
  'Sociocultural': { color: '#ec4899', icon: Users, label: 'Sociocultural' }, // Pink
  'Atencional': { color: '#06b6d4', icon: Eye, label: 'Atencional' }, // Cyan
  'Biofisiológica': { color: '#14b8a6', icon: Dna, label: 'Biofisiológico' }, // Teal
  'Intervenção': { color: '#f8fafc', icon: Zap, label: 'INTERVENÇÃO' }, // White/Slate
};

const DEFAULT_STYLE = { color: '#64748b', icon: BrainCircuit, label: 'Processo' };

const CHANGE_ICONS = {
  'aumentou': <ArrowUpRight className="w-3 h-3 text-red-400" />,
  'diminuiu': <ArrowDownRight className="w-3 h-3 text-emerald-400" />,
  'estavel': <Minus className="w-3 h-3 text-slate-400" />,
  'novo': <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
};

// --- CUSTOM NODE ---

const CustomPBTNode = ({ data }: NodeProps) => {
  const categoryStyle = CATEGORY_STYLES[data.category] || DEFAULT_STYLE;
  const StartIcon = categoryStyle.icon;
  const isTarget = data.isTarget;

  return (
    <div
      className="relative group min-w-[180px] max-w-[220px]"
      style={{
        filter: isTarget ? `drop-shadow(0 0 15px #facc15)` : `drop-shadow(0 0 10px ${categoryStyle.color}20)`
      }}
    >
      <Handle type="target" position={Position.Top} className="!bg-slate-500 !w-2 !h-2" />

      {/* Target Badge */}
      {isTarget && (
        <div className="absolute -top-3 -right-3 z-10 bg-yellow-500 text-slate-900 rounded-full p-1 shadow-lg shadow-yellow-500/20 border border-yellow-300 animate-pulse">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
          </svg>
        </div>
      )}

      {/* Header com Categoria */}
      <div
        className={`flex items-center gap-2 px-3 py-1.5 rounded-t-lg text-[10px] font-bold uppercase tracking-wider text-white border-b border-white/10 ${data.category === 'Intervenção' ? 'bg-slate-800' : ''}`}
        style={{ backgroundColor: data.category !== 'Intervenção' ? `${categoryStyle.color}80` : undefined }}
      >
        <StartIcon className="w-3 h-3" />
        {categoryStyle.label}
      </div>

      {/* Corpo do Nó */}
      <div className="bg-slate-900/90 backdrop-blur-md border border-t-0 border-white/10 rounded-b-lg p-3">
        <div className="text-xs font-semibold text-white leading-tight mb-2 shadow-black drop-shadow-md">
          {data.label}
        </div>

        {/* Footer com Status de Mudança */}
        <div className="flex items-center justify-between pt-2 border-t border-white/5">
          <span className="text-[9px] text-slate-400 font-mono">STATUS</span>
          <div className="flex items-center gap-1.5 bg-black/40 px-2 py-0.5 rounded-full border border-white/10">
            {CHANGE_ICONS[data.change as keyof typeof CHANGE_ICONS]}
            <span className="text-[9px] text-slate-300 uppercase tracking-wide">
              {data.change}
            </span>
          </div>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-slate-500 !w-2 !h-2" />
    </div>
  );
};

const nodeTypes = {
  pbtNode: CustomPBTNode,
};

// --- LAYOUT ENGINE (GRID SYSTEM) ---

const GRID_COLS = 3;
const GRID_ROWS = 3;
const CELL_WIDTH = 300;
const CELL_HEIGHT = 200;
const PADDING = 20;

const REGIONS: Record<string, { row: number; col: number }> = {
  // Row 1
  'Atencional': { row: 0, col: 0 },
  'Cognitiva': { row: 0, col: 1 },
  'Self': { row: 0, col: 2 },
  // Row 2
  'Afetiva': { row: 1, col: 0 },
  'Comportamento': { row: 1, col: 1 },
  'Motivacional': { row: 1, col: 2 },
  // Row 3
  'Biofisiológica': { row: 2, col: 0 },
  'Contexto': { row: 2, col: 1 },
  'Sociocultural': { row: 2, col: 2 },
  // Defaults
  'Intervenção': { row: 0, col: 0 } // Floating later or handled specifically
};

// Background Grid Component
const BackgroundMatrix = () => {
  return (
    <div className="absolute inset-0 pointer-events-none z-0 grid grid-cols-3 grid-rows-3 w-full h-full opacity-10">
      {/* Row 1 */}
      <div className="border border-slate-500 flex items-end justify-center pb-2 text-xl font-bold uppercase tracking-widest text-slate-300">Atenção</div>
      <div className="border border-slate-500 flex items-end justify-center pb-2 text-xl font-bold uppercase tracking-widest text-slate-300">Cognição</div>
      <div className="border border-slate-500 flex items-end justify-center pb-2 text-xl font-bold uppercase tracking-widest text-slate-300">Self</div>
      {/* Row 2 */}
      <div className="border border-slate-500 flex items-end justify-center pb-2 text-xl font-bold uppercase tracking-widest text-slate-300">Afeto</div>
      <div className="border border-slate-500 flex items-end justify-center pb-2 text-xl font-bold uppercase tracking-widest text-slate-300 bg-slate-500/10">Comportamento</div>
      <div className="border border-slate-500 flex items-end justify-center pb-2 text-xl font-bold uppercase tracking-widest text-slate-300">Motivação</div>
      {/* Row 3 */}
      <div className="border border-slate-500 flex items-end justify-center pb-2 text-xl font-bold uppercase tracking-widest text-slate-300">Biofisiológico</div>
      <div className="border border-slate-500 flex items-end justify-center pb-2 text-xl font-bold uppercase tracking-widest text-slate-300">Contexto</div>
      <div className="border border-slate-500 flex items-end justify-center pb-2 text-xl font-bold uppercase tracking-widest text-slate-300">Sociocultural</div>
    </div>
  );
};

const getGridLayoutedElements = (nodes: Node[], edges: Edge[]) => {
  // 1. Group nodes by category
  const nodesByCategory: Record<string, Node[]> = {};
  nodes.forEach(node => {
    const cat = node.data.category || 'Contexto';
    if (!nodesByCategory[cat]) nodesByCategory[cat] = [];
    nodesByCategory[cat].push(node);
  });

  // 2. Position nodes within their cells
  const layoutedNodes: Node[] = [];

  Object.entries(nodesByCategory).forEach(([category, categoryNodes]) => {
    let gridPos = REGIONS[category];
    if (!gridPos && category === 'Intervenção') {
      gridPos = REGIONS['Comportamento'];
    }
    if (!gridPos) gridPos = { row: 2, col: 1 };

    // Calculate base offset
    const baseX = gridPos.col * CELL_WIDTH + (CELL_WIDTH / 2);
    const baseY = gridPos.row * CELL_HEIGHT + (CELL_HEIGHT / 2);

    // Distribute multiple nodes
    categoryNodes.forEach((node, index) => {
      const offsetCount = categoryNodes.length;
      const angle = (index / offsetCount) * 2 * Math.PI;
      const radius = offsetCount > 1 ? 50 : 0;
      const offsetX = Math.cos(angle) * radius;
      const offsetY = Math.sin(angle) * radius;

      node.position = {
        x: baseX + offsetX - 100,
        y: baseY + offsetY - 50
      };
      layoutedNodes.push(node);
    });
  });

  return { nodes: layoutedNodes, edges };
};

export function PBTGraph({ nodes: initialDataNodes, edges: initialDataEdges }: PBTGraphProps) {

  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(() => {
    if (!initialDataNodes?.length) return { nodes: [], edges: [] };

    const flowNodes: Node[] = initialDataNodes.map((n) => ({
      id: n.id,
      data: { label: n.label, category: n.category, change: n.change, isTarget: (n as any).isTarget },
      position: { x: 0, y: 0 },
      type: 'pbtNode',
    }));

    const flowEdges: Edge[] = initialDataEdges.map((e, i) => {
      const isBidirectional = (e as any).bidirectional;
      const weight = (e.weight || 'moderado').toLowerCase();

      let arrowSize = 20;
      if (weight === 'fraco') arrowSize = 12;
      else if (weight === 'forte') arrowSize = 35;

      const markerConfig = {
        type: MarkerType.ArrowClosed,
        color: '#475569',
        width: arrowSize,
        height: arrowSize,
      };

      return {
        id: `e${i}`,
        source: e.source,
        target: e.target,
        label: e.relation,
        animated: true,
        style: { stroke: '#475569', strokeWidth: 1.5 },
        labelStyle: { fill: '#94a3b8', fontSize: 9, fontWeight: 500 },
        markerEnd: markerConfig,
        markerStart: isBidirectional ? markerConfig : undefined,
      };
    });

    return getGridLayoutedElements(flowNodes, flowEdges);
  }, [initialDataNodes, initialDataEdges]);

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);

  React.useEffect(() => {
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [layoutedNodes, layoutedEdges, setNodes, setEdges]);

  if (!nodes.length) {
    return (
      <div className="h-[750px] w-full flex items-center justify-center border border-white/10 rounded-xl bg-black/50 text-slate-500 font-mono text-sm">
        <p>&gt; AGUARDANDO DADOS DA REDE...</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '750px' }} className="border border-white/10 rounded-xl overflow-hidden bg-black relative group shadow-inner">
      {/* Background Matrix Grid */}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
        <div className="relative w-full h-full max-w-[1200px] max-h-[800px]">
          <BackgroundMatrix />
          <div className="absolute inset-0 z-10">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              fitView
              attributionPosition="bottom-right"
              minZoom={0.5}
              maxZoom={1.5}
              proOptions={{ hideAttribution: true }}
            >
              <Controls className="bg-slate-800 border b-slate-700 fill-slate-300" showInteractive={false} />
            </ReactFlow>
          </div>
        </div>
      </div>
    </div>
  );
}
