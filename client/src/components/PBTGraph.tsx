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
  nodes: { id: string; label: string; type: string; change: string; category?: string }[];
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

  return (
    <div
      className="relative group min-w-[180px] max-w-[220px]"
      style={{
        filter: `drop-shadow(0 0 10px ${categoryStyle.color}20)`
      }}
    >
      <Handle type="target" position={Position.Top} className="!bg-slate-500 !w-2 !h-2" />

      {/* Header com Categoria */}
      <div
        className="flex items-center gap-2 px-3 py-1.5 rounded-t-lg text-[10px] font-bold uppercase tracking-wider text-white border-b border-white/10"
        style={{ backgroundColor: `${categoryStyle.color}80` }}
      >
        <StartIcon className="w-3 h-3" />
        {categoryStyle.label}
      </div>

      {/* Corpo do Nó */}
      <div className="bg-slate-900/90 backdrop-blur-md border border-t-0 border-white/10 rounded-b-lg p-3">
        <div className="text-xs font-medium text-slate-200 leading-tight mb-2">
          {data.label}
        </div>

        {/* Footer com Status de Mudança */}
        <div className="flex items-center justify-between pt-2 border-t border-white/5">
          <span className="text-[9px] text-slate-500 font-mono">STATUS</span>
          <div className="flex items-center gap-1.5 bg-slate-950/50 px-2 py-0.5 rounded-full border border-white/5">
            {CHANGE_ICONS[data.change as keyof typeof CHANGE_ICONS]}
            <span className="text-[9px] text-slate-400 uppercase tracking-wide">
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

// --- LAYOUT ENGINE ---

const nodeWidth = 200;
const nodeHeight = 100;

const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  dagreGraph.setGraph({ rankdir: 'TB', ranksep: 80, nodesep: 50 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);

    // Fallback seguro em caso de erro no dagre
    const x = nodeWithPosition ? nodeWithPosition.x : 0;
    const y = nodeWithPosition ? nodeWithPosition.y : 0;

    node.targetPosition = Position.Top;
    node.sourcePosition = Position.Bottom;
    node.position = {
      x: x - nodeWidth / 2,
      y: y - nodeHeight / 2,
    };

    return node;
  });

  return { nodes: layoutedNodes, edges };
};

// --- COMPONENTE PRINCIPAL ---

export function PBTGraph({ nodes: initialDataNodes, edges: initialDataEdges }: PBTGraphProps) {

  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(() => {
    if (!initialDataNodes?.length) return { nodes: [], edges: [] };

    const flowNodes: Node[] = initialDataNodes.map((n) => ({
      id: n.id,
      data: { label: n.label, category: n.category, change: n.change },
      position: { x: 0, y: 0 },
      type: 'pbtNode',
    }));

    const flowEdges: Edge[] = initialDataEdges.map((e, i) => ({
      id: `e${i}`,
      source: e.source,
      target: e.target,
      label: e.relation,
      animated: true,
      style: { stroke: '#475569', strokeWidth: 1.5 },
      labelStyle: { fill: '#94a3b8', fontSize: 9, fontWeight: 500 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#475569',
        width: 20,
        height: 20,
      },
    }));

    return getLayoutedElements(flowNodes, flowEdges);
  }, [initialDataNodes, initialDataEdges]);

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);

  // Update effect when data changes
  React.useEffect(() => {
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [layoutedNodes, layoutedEdges, setNodes, setEdges]);

  if (!nodes.length) {
    return (
      <div className="h-[500px] w-full flex items-center justify-center border border-white/10 rounded-xl bg-slate-900/50 text-slate-500 font-mono text-sm">
        <p>&gt; AGUARDANDO DADOS DA REDE...</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '600px' }} className="border border-white/10 rounded-xl overflow-hidden bg-slate-950 relative group">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(51,65,85,0.1)_1px,transparent_1px)] bg-[size:20px_20px] opacity-20"></div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        attributionPosition="bottom-right"
      >
        <Background color="#1e293b" gap={24} size={1} className="opacity-0" />
        <Controls className="bg-slate-800 border b-slate-700 fill-slate-300" showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
