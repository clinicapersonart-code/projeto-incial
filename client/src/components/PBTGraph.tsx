import React, { useCallback, useMemo, useEffect, useState } from 'react';
import { useGraphHistory } from '../hooks/useGraphHistory';
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
  Minus,
  ArrowRight,
  ArrowLeft,
  Plus,
  X,
  Save,
  Trash2,
  Edit3,
  LayoutGrid,
  EyeOff,
  Map,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Sun,
  Moon,
  Monitor,
  Wrench
} from 'lucide-react';
import { Connection, addEdge, useReactFlow } from 'reactflow';

interface PBTGraphProps {
  nodes: { id: string; label: string; type: string; change: string; category?: string; isTarget?: boolean }[];
  edges: { source: string; target: string; relation: string; weight: string }[];
  onGraphUpdate?: (nodes: any[], edges: any[]) => void;
}

// --- CONFIGURAÇÃO VISUAL & TEMAS ---

const THEME_CONFIG = {
  dark: {
    background: '#0f172a', // Slate 900 (Graphite)
    nodeBg: 'rgba(15, 23, 42, 0.6)',
    nodeBorder: 'rgba(255, 255, 255, 0.1)',
    textPrimary: '#f8fafc',
    textSecondary: '#94a3b8',
    edge: '#475569',
    edgeLabelBg: '#1e293b',
    edgeLabelText: '#94a3b8',
    categories: {
      'Cognitiva': '#3b82f6', // Blue
      'Afetiva': '#ef4444', // Red
      'Comportamento': '#22c55e', // Green
      'Self': '#a855f7', // Purple
      'Contexto': '#eab308', // Yellow
      'Motivacional': '#f97316', // Orange
      'Sociocultural': '#ec4899', // Pink
      'Atencional': '#06b6d4', // Cyan
      'Biofisiológica': '#14b8a6', // Teal
      'Intervenção': '#f8fafc', // White/Slate
    }
  },
  light: {
    background: '#f8fafc', // Slate 50
    nodeBg: 'rgba(255, 255, 255, 0.8)',
    nodeBorder: 'rgba(0, 0, 0, 0.1)',
    textPrimary: '#1e293b',
    textSecondary: '#64748b',
    edge: '#94a3b8',
    edgeLabelBg: '#ffffff',
    edgeLabelText: '#475569',
    categories: {
      'Cognitiva': '#2563eb', // Darker Blue
      'Afetiva': '#dc2626', // Darker Red
      'Comportamento': '#16a34a', // Darker Green
      'Self': '#9333ea', // Darker Purple
      'Contexto': '#ca8a04', // Darker Yellow
      'Motivacional': '#ea580c', // Darker Orange
      'Sociocultural': '#db2777', // Darker Pink
      'Atencional': '#0891b2', // Darker Cyan
      'Biofisiológica': '#0d9488', // Darker Teal
      'Intervenção': '#475569', // Slate 600
    }
  }
};

const CATEGORY_STYLES_BASE: Record<string, { icon: React.ElementType; label: string }> = {
  'Cognitiva': { icon: BrainCircuit, label: 'Cognitivo' },
  'Afetiva': { icon: Heart, label: 'Afetivo' },
  'Comportamento': { icon: Activity, label: 'Comportamento' },
  'Self': { icon: User, label: 'Self' },
  'Contexto': { icon: MapPin, label: 'Contexto' },
  'Motivacional': { icon: Zap, label: 'Motivacional' },
  'Sociocultural': { icon: Users, label: 'Sociocultural' },
  'Atencional': { icon: Eye, label: 'Atencional' },
  'Biofisiológica': { icon: Dna, label: 'Biofisiológico' },
  'Intervenção': { icon: Zap, label: 'INTERVENÇÃO' },
};

const DEFAULT_STYLE = { color: '#64748b', icon: BrainCircuit, label: 'Processo' };

// Categories that defaults to Moderators (Rounded)
const DEFAULT_MODERATOR_CATEGORIES = ['Contexto', 'Sociocultural', 'Biofisiológica', 'Intervenção'];
const isModeratorCategory = (cat?: string) => DEFAULT_MODERATOR_CATEGORIES.includes(cat || '');

const CHANGE_ICONS = {
  'aumentou': <ArrowUpRight className="w-3 h-3 text-red-400" />,
  'diminuiu': <ArrowDownRight className="w-3 h-3 text-emerald-400" />,
  'estavel': <Minus className="w-3 h-3 text-slate-400" />,
  'novo': <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
};

// --- CUSTOM NODE ---



const CustomPBTNode = ({ data, id, selected }: NodeProps) => {
  const theme = data.theme || 'dark';
  const mode = data.mode || 'build'; // 'build' | 'session'
  const isHovered = data.isHovered;
  const isRelated = data.isRelated;
  const isContextMode = data.isContextMode; // True if ANY node is hovered/selected

  const colors = THEME_CONFIG[theme as keyof typeof THEME_CONFIG];
  const categoryBase = CATEGORY_STYLES_BASE[data.category] || { icon: BrainCircuit, label: 'Processo' };
  const categoryColor = colors.categories[data.category as keyof typeof colors.categories] || colors.categories['Contexto'];

  const StartIcon = categoryBase.icon;
  const isTarget = data.isTarget;
  const isRounded = data.isModerator || isModeratorCategory(data.category);
  const roundedClass = isRounded ? 'rounded-2xl' : 'rounded-none';

  // --- OPACITY & FOCUS LOGIC ---
  // Default: 1.0
  // Context Mode (Someone else hovered): 0.4 (40%) default
  // Related: 1.0 (Full visibility)
  // Hovered/Selected: 1.0 (Full visibility)

  let opacity = 1;
  let scale = 1;
  let zIndex = 0;
  let boxShadow = 'none';
  let borderStyle = '1px solid';

  if (isContextMode) {
    if (isHovered || selected) {
      opacity = 1;
      zIndex = 50;
      // Halo Effect - Visual Anchor
      boxShadow = `0 0 0 2px ${theme === 'dark' ? '#000' : '#fff'}, 0 0 20px 2px ${categoryColor}60`;
    } else if (isRelated) {
      opacity = 0.9;
      zIndex = 10;
      boxShadow = `0 0 10px ${categoryColor}20`;
    } else {
      opacity = 0.3; // Faded background
      zIndex = 0;
    }
  } else {
    // Default 'Resting' State
    if (isTarget) {
      boxShadow = `0 0 15px ${categoryColor}40`;
    }
  }

  // --- TEMPORAL ANCHORING (BORDERS) ---
  const changeType = data.change || 'estavel';
  let borderColor = `${categoryColor}40`;
  let borderWidth = '1px';
  let borderType = 'solid';

  if (changeType === 'aumentou') {
    borderWidth = '3px';
    borderColor = categoryColor; // Strong
  } else if (changeType === 'diminuiu') {
    borderWidth = '1px';
    borderType = 'dashed';
    borderColor = `${categoryColor}60`;
  } else if (changeType === 'novo') {
    borderWidth = '2px';
    borderColor = '#60a5fa'; // Blue
  }


  // Mode Adjustments
  const showBadges = mode === 'build'; // Hide extra badges in session mode
  const fontSize = mode === 'session' ? 'text-sm' : 'text-xs';
  const padding = mode === 'session' ? 'p-4' : 'p-3';

  // AUTO-FIT
  const labelLength = (data.label || '').length;
  const calculatedWidth = Math.min(240, Math.max(120, labelLength * 9 + (mode === 'session' ? 60 : 40)));

  return (
    <div
      className="relative group transition-all duration-300 ease-out"
      style={{
        width: calculatedWidth,
        opacity,
        transform: `scale(${scale})`,
        zIndex
      }}
    >
      {/* Handles - Always present but transparent */}
      <Handle type="source" position={Position.Top} id="top" className="opacity-0" />
      <Handle type="target" position={Position.Top} id="top-target" className="opacity-0" style={{ left: '10%' }} />
      <Handle type="source" position={Position.Right} id="right" className="opacity-0" />
      <Handle type="target" position={Position.Right} id="right-target" className="opacity-0" style={{ top: '10%' }} />
      <Handle type="source" position={Position.Bottom} id="bottom" className="opacity-0" />
      <Handle type="target" position={Position.Bottom} id="bottom-target" className="opacity-0" style={{ left: '10%' }} />
      <Handle type="source" position={Position.Left} id="left" className="opacity-0" />
      <Handle type="target" position={Position.Left} id="left-target" className="opacity-0" style={{ top: '10%' }} />

      {/* Category Badge - Moved outside, removed */}

      {/* Target Star */}
      {isTarget && (
        <div className="absolute -top-3 -right-3 z-20 bg-yellow-500 text-slate-900 rounded-full p-1 shadow-lg shadow-yellow-500/20 border border-yellow-300 animate-pulse">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
          </svg>
        </div>
      )}

      {/* Node Body */}
      <div
        className={`backdrop-blur-md ${roundedClass} ${padding} transition-all duration-200`}
        style={{
          backgroundColor: `${categoryColor}15`, // Very subtle tint
          borderWidth: borderWidth,
          borderStyle: borderType,
          borderColor: borderColor,
          boxShadow: boxShadow
        }}
        onMouseEnter={data.onNodeHover}
        onMouseLeave={data.onNodeLeave}
      >
        {/* Category Badge - INSIDE the node */}
        {showBadges && !data.hideLabels && (
          <div
            className="mb-2 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider w-fit border"
            style={{
              backgroundColor: `${categoryColor}20`,
              borderColor: `${categoryColor}60`,
              color: categoryColor
            }}
          >
            {categoryBase.label}
          </div>
        )}

        <div className={`${fontSize} font-bold leading-tight mb-2 drop-shadow-sm transition-colors duration-200`} style={{ color: colors.textPrimary }}>
          {data.label}
        </div>

        {/* Footer (Status) - Visible only in Build Mode or if change is significant */}
        {(mode === 'build' || changeType !== 'estavel') && (
          <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: `${categoryColor}20` }}>
            {mode === 'build' && <span className="text-[9px] font-mono tracking-wider" style={{ color: colors.textSecondary }}>STATUS</span>}
            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full ${changeType === 'aumentou' ? 'bg-black/20' : ''}`}>
              {CHANGE_ICONS[changeType as keyof typeof CHANGE_ICONS]}
              {(mode === 'build' || changeType !== 'estavel') && (
                <span className="text-[9px] uppercase tracking-wide font-medium" style={{ color: colors.textSecondary }}>
                  {changeType}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div >
  );
};

// Region Node Component moved up to fix hoisting
const RegionNode = ({ data }: NodeProps) => {
  // When hideLabels is true, show only a minimal transparent container
  if (data.hideLabels) {
    return (
      <div className="w-full h-full bg-transparent rounded-xl">
        {/* Empty container - just maintains spacing for child nodes */}
      </div>
    );
  }

  return (
    <div className={`w-full h-full border-2 border-dashed ${data.isAlternate ? 'border-slate-600 bg-slate-800/30' : 'border-slate-700/50 bg-slate-900/20'} rounded-xl flex items-end justify-center pb-4 transition-colors`}>
      <div className="text-xl font-bold uppercase tracking-[0.2em] text-slate-600 select-none pointer-events-none">
        {data.label}
      </div>
    </div>
  );
};

const nodeTypes = {
  pbtNode: CustomPBTNode,
  regionNode: RegionNode,
};

// --- LAYOUT ENGINE (GRID SYSTEM) ---

const GRID_COLS = 3;
const GRID_ROWS = 3;
const CELL_WIDTH = 320; // Increased slightly for breathing room
const CELL_HEIGHT = 240;
const PADDING = 20;

const REGIONS: Record<string, { row: number; col: number; label: string }> = {
  // Row 1
  'Atencional': { row: 0, col: 0, label: 'Atenção' },
  'Cognitiva': { row: 0, col: 1, label: 'Cognição' },
  'Self': { row: 0, col: 2, label: 'Self' },
  // Row 2
  'Afetiva': { row: 1, col: 0, label: 'Afeto' },
  'Comportamento': { row: 1, col: 1, label: 'Comportamento' },
  'Motivacional': { row: 1, col: 2, label: 'Motivação' },
  // Row 3
  'Biofisiológica': { row: 2, col: 0, label: 'Biofisiológico' },
  'Contexto': { row: 2, col: 1, label: 'Contexto' },
  'Sociocultural': { row: 2, col: 2, label: 'Sociocultural' },
  // Defaults
  'Intervenção': { row: 1, col: 1, label: 'Comportamento' }
};



const getGridLayoutedElements = (nodes: Node[], edges: Edge[]) => {
  const layoutedNodes: Node[] = [];

  // 0. First, count nodes per category to determine region sizes
  const nodeCountByCategory: Record<string, number> = {};
  nodes.forEach(node => {
    let category = node.data.category || 'Contexto';
    if (category === 'Intervenção') category = 'Comportamento';
    if (!REGIONS[category]) category = 'Contexto';
    nodeCountByCategory[category] = (nodeCountByCategory[category] || 0) + 1;
  });

  // Calculate dynamic cell sizes based on node count
  const getExpandedSize = (count: number): { width: number; height: number } => {
    const nodeWidth = 160;
    const nodeHeight = 90;
    const padding = 30;

    if (count <= 1) return { width: CELL_WIDTH, height: CELL_HEIGHT };
    if (count <= 2) return { width: CELL_WIDTH, height: CELL_HEIGHT };
    if (count <= 4) return { width: CELL_WIDTH + 80, height: CELL_HEIGHT + 60 };
    if (count <= 6) return { width: CELL_WIDTH + 150, height: CELL_HEIGHT + 100 };
    // Many nodes: expand more
    const cols = Math.ceil(Math.sqrt(count));
    const rows = Math.ceil(count / cols);
    return {
      width: Math.max(CELL_WIDTH, cols * nodeWidth + padding * 2),
      height: Math.max(CELL_HEIGHT, rows * nodeHeight + padding * 2)
    };
  };

  // Store calculated sizes for later
  const regionSizes: Record<string, { width: number; height: number }> = {};
  Object.keys(REGIONS).forEach(key => {
    if (key === 'Intervenção') return;
    regionSizes[key] = getExpandedSize(nodeCountByCategory[key] || 0);
  });

  // Calculate cumulative offsets for each row/column (for non-uniform grid)
  const rowHeights: Record<number, number> = { 0: 0, 1: 0, 2: 0 };
  const colWidths: Record<number, number> = { 0: 0, 1: 0, 2: 0 };

  Object.entries(REGIONS).forEach(([key, config]) => {
    if (key === 'Intervenção') return;
    const size = regionSizes[key];
    rowHeights[config.row] = Math.max(rowHeights[config.row], size.height);
    colWidths[config.col] = Math.max(colWidths[config.col], size.width);
  });

  // Calculate cumulative positions
  const rowY: Record<number, number> = { 0: 0, 1: rowHeights[0] + PADDING, 2: rowHeights[0] + rowHeights[1] + PADDING * 2 };
  const colX: Record<number, number> = { 0: 0, 1: colWidths[0] + PADDING, 2: colWidths[0] + colWidths[1] + PADDING * 2 };

  // 1. Create Region Nodes (The "Squares") with dynamic sizes
  Object.entries(REGIONS).forEach(([key, config]) => {
    if (key === 'Intervenção') return;

    const size = regionSizes[key];
    layoutedNodes.push({
      id: `region-${key}`,
      type: 'regionNode',
      position: {
        x: colX[config.col],
        y: rowY[config.row]
      },
      data: {
        label: config.label,
        isAlternate: key === 'Comportamento'
      },
      style: { width: size.width, height: size.height, zIndex: -10 },
      selectable: false,
      draggable: false,
    });
  });

  // 2. Process Logic Nodes
  nodes.forEach(node => {
    let category = node.data.category || 'Contexto';
    let parentKey = category;

    if (!REGIONS[category]) {
      if (category === 'Intervenção') {
        parentKey = 'Comportamento';
      } else {
        parentKey = 'Contexto';
      }
    } else if (category === 'Intervenção') {
      parentKey = 'Comportamento';
    }

    const regionId = `region-${parentKey}`;
  });

  // Re-loop to distribute nodes by category
  const nodesByCategory: Record<string, Node[]> = {};
  nodes.forEach(node => {
    let category = node.data.category || 'Contexto';
    if (category === 'Intervenção') category = 'Comportamento';
    if (!REGIONS[category]) category = 'Contexto';

    if (!nodesByCategory[category]) nodesByCategory[category] = [];
    nodesByCategory[category].push(node);
  });

  Object.entries(nodesByCategory).forEach(([category, categoryNodes]) => {
    const regionSize = regionSizes[category] || { width: CELL_WIDTH, height: CELL_HEIGHT };
    const nodeWidth = 140;
    const nodeHeight = 80;
    const padding = 20;

    // Grid-based distribution for many nodes
    const count = categoryNodes.length;
    const cols = Math.ceil(Math.sqrt(count));
    const availableWidth = regionSize.width - padding * 2 - nodeWidth;
    const availableHeight = regionSize.height - padding * 2 - nodeHeight;

    categoryNodes.forEach((node, index) => {
      let x, y;

      if (count === 1) {
        // Single node: center
        x = (regionSize.width - nodeWidth) / 2;
        y = (regionSize.height - nodeHeight) / 2;
      } else if (count <= 4) {
        // Circle distribution for small counts
        const angle = (index / count) * 2 * Math.PI - Math.PI / 2;
        const radius = Math.min(availableWidth, availableHeight) / 3;
        x = (regionSize.width / 2) - (nodeWidth / 2) + Math.cos(angle) * radius;
        y = (regionSize.height / 2) - (nodeHeight / 2) + Math.sin(angle) * radius;
      } else {
        // Grid distribution for many nodes
        const col = index % cols;
        const row = Math.floor(index / cols);
        const cellWidth = availableWidth / cols;
        const cellHeight = availableHeight / Math.ceil(count / cols);
        x = padding + col * cellWidth + (cellWidth - nodeWidth) / 2;
        y = padding + row * cellHeight + (cellHeight - nodeHeight) / 2;
      }

      node.parentId = `region-${category}`;
      node.extent = 'parent';
      node.position = { x, y };
      layoutedNodes.push(node);
    });
  });

  return { nodes: layoutedNodes, edges };
};

// Helper to calculate node position when changing category
const getRelativePosition = (category: string) => {
  // Center by default
  const nodeWidth = 140;
  const nodeHeight = 80;
  const centerX = (CELL_WIDTH / 2) - (nodeWidth / 2);
  const centerY = (CELL_HEIGHT / 2) - (nodeHeight / 2);

  // Add slight random offset to prevent exact stacking
  const jitter = () => (Math.random() - 0.5) * 40;

  return { x: centerX + jitter(), y: centerY + jitter() };
};

export function PBTGraph({ nodes: initialDataNodes, edges: initialDataEdges, onGraphUpdate }: PBTGraphProps) {
  // --- STATES ---
  const [isEditing, setIsEditing] = React.useState(false);
  const [selectedItem, setSelectedItem] = React.useState<{ type: 'node' | 'edge', data: any } | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editForm, setEditForm] = React.useState<any>(null);
  const [showRegionLabels, setShowRegionLabels] = React.useState(true);
  const [showLegend, setShowLegend] = React.useState(false);

  // New States for Visual Overhaul
  const [theme, setTheme] = React.useState<'dark' | 'light'>('dark');
  const [mode, setMode] = React.useState<'build' | 'session'>('build');
  const [hoveredNodeId, setHoveredNodeId] = React.useState<string | null>(null);

  // Theme Helpers
  const currentTheme = THEME_CONFIG[theme];

  // Focus Logic
  const isContextMode = !!hoveredNodeId || !!(selectedItem?.type === 'node');
  const focusNodeId = hoveredNodeId || (selectedItem?.type === 'node' ? selectedItem.data.id : null);

  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(() => {
    // ... existing memo logic ...
    if (!initialDataNodes?.length) return { nodes: [], edges: [] };

    const flowNodes: Node[] = initialDataNodes.map((n) => ({
      id: n.id,
      data: {
        label: n.label,
        category: n.category,
        change: n.change,
        isTarget: (n as any).isTarget,
        isModerator: (n as any).isModerator,
        // Helper callbacks
        onNodeHover: () => setHoveredNodeId(n.id),
        onNodeLeave: () => setHoveredNodeId(null)
      },
      position: { x: 0, y: 0 },
      type: 'pbtNode',
    }));

    const flowEdges: Edge[] = initialDataEdges.map((e, i) => {
      const isBidirectional = (e as any).bidirectional;
      const weight = (e.weight || 'moderado').toLowerCase();
      // ... same edge logic ...
      const reverseWeight = ((e as any).reverseWeight || weight).toLowerCase();
      const polarity = (e as any).polarity || 'positive';
      const reversePolarity = (e as any).reversePolarity || polarity;

      const strokeWidth = 2; // Fixed base width for style

      // Dynamic Edge Styles based on Focus
      const isSourceFocused = focusNodeId && e.source === focusNodeId;
      const isTargetFocused = focusNodeId && e.target === focusNodeId;
      const isRelated = isSourceFocused || isTargetFocused;
      const isHovered = false; // Edge hover handled by ReactFlow props usually

      // Visibility Layer Logic
      // Default (No Focus): Very faint (Ghost) unless weight is 'forte' (Critical)
      // Focus: 100% opacity if related
      // Background: 10% opacity

      let opacity = 0.3; // Default 'clean' mode - faint
      let zIndex = 0;
      let strokeColor = currentTheme.edge;

      if (isContextMode) {
        if (isRelated) {
          opacity = 1;
          zIndex = 20;
          strokeColor = isSourceFocused ? currentTheme.textPrimary : currentTheme.textSecondary; // Highlight outgoing stronger
        } else {
          opacity = 0.05; // Almost invisible
        }
      } else {
        // Standard View
        if (weight === 'forte' || (e as any).bidirectional) {
          opacity = 0.8; // Critical paths visible
        }
      }

      const getMarkerConfig = (pol: string, w: string) => {
        // ... same marker logic ...
        let size = 15; // Moderate
        if (w === 'fraco') size = 11;
        if (w === 'forte') size = 18;

        if (pol === 'negative') {
          const sizeMap: Record<string, string> = {
            'fraco': 'arrow-hollow-fraco',
            'moderado': 'arrow-hollow-moderado',
            'forte': 'arrow-hollow-forte'
          };
          return sizeMap[w] || 'arrow-hollow-moderado';
        }
        return {
          type: MarkerType.ArrowClosed,
          color: strokeColor, // Dynamic color
          width: size,
          height: size,
        };
      };

      const markerEnd = getMarkerConfig(polarity, weight);
      const markerStart = isBidirectional ? getMarkerConfig(reversePolarity, reverseWeight) : undefined;

      // Label Logic: Show if focused or specific hover (handled by CSS trigger or state)
      const showLabel = isRelated;

      return {
        id: `e${i}`,
        source: e.source,
        target: e.target,
        label: showLabel ? e.relation : '', // Conditional Label
        style: {
          stroke: strokeColor,
          strokeWidth: strokeWidth,
          strokeDasharray: isBidirectional ? '8, 4' : undefined,
          opacity: opacity,
          transition: 'all 0.3s ease'
        },
        animated: false, // Cleaner look
        zIndex: zIndex,
        className: isBidirectional ? 'react-flow__edge-bidirectional' : '',
        labelStyle: { fill: currentTheme.edgeLabelText, fontSize: 11, fontWeight: 700 }, // Slightly bigger
        labelBgStyle: { fill: currentTheme.edgeLabelBg, fillOpacity: 0.9, rx: 4, ry: 4 },
        labelBgPadding: [6, 4] as [number, number],
        markerEnd: markerEnd,
        markerStart: markerStart,

        data: {
          weight: weight,
          reverseWeight: reverseWeight,
          relation: e.relation,
          bidirectional: isBidirectional,
          polarity: polarity,
          reversePolarity: reversePolarity
        }
      };
    });

    return getGridLayoutedElements(flowNodes, flowEdges);
  }, [initialDataNodes, initialDataEdges, currentTheme, focusNodeId, isContextMode]);

  // HISTORY
  const { state, undo, redo, takeSnapshot, canUndo, canRedo, setInitialState } = useGraphHistory({
    nodes: layoutedNodes,
    edges: layoutedEdges
  });

  const [nodes, setNodes, onNodesChange] = useNodesState(state.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(state.edges);

  // Sync internal state with History state (Time Travel)
  useEffect(() => {
    setNodes(state.nodes);
    setEdges(state.edges);
  }, [state, setNodes, setEdges]);

  // Initial Load ONLY
  React.useEffect(() => {
    if (layoutedNodes.length > 0 && nodes.length === 0) {
      setInitialState({ nodes: layoutedNodes, edges: layoutedEdges });
    }
  }, [layoutedNodes, layoutedEdges, setInitialState]);

  // Keyboard Shortcuts (Ctrl+Z)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
        // Notify parent of undo
        // We need to wait for state update to emit, but we can emit current state after undo in next render?
        // Actually, emitUpdate is called on changes. If we undo, state changes, we might need to emit.
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  // Helper to emit updates
  const emitUpdate = useCallback((newNodes: Node[], newEdges: Edge[]) => {
    if (!onGraphUpdate) return;

    const logicNodes = newNodes.filter(n => n.type === 'pbtNode').map(n => ({
      id: n.id,
      label: n.data.label,
      category: n.data.category,
      change: n.data.change,
      isTarget: n.data.isTarget,
      isModerator: n.data.isModerator
    }));

    const logicEdges = newEdges.map(e => ({
      source: e.source,
      target: e.target,
      relation: e.data?.relation || e.label || 'Influência',
      weight: e.data?.weight || 'moderado',
      reverseWeight: e.data?.reverseWeight || e.data?.weight || 'moderado',
      bidirectional: e.data?.bidirectional || false,
      polarity: e.data?.polarity || 'positive',
      reversePolarity: e.data?.reversePolarity || 'positive'
    }));

    onGraphUpdate(logicNodes, logicEdges);
  }, [onGraphUpdate]);

  // Wrap onNodesChange to detect drags and resolve collisions
  const onNodesChangeWrapper = useCallback((changes: any) => {
    onNodesChange(changes);

    // Detect end of drag
    const dragEndChange = changes.find((c: any) => c.type === 'position' && c.dragging === false);

    if (dragEndChange && dragEndChange.id) {
      const NODE_WIDTH = 140;
      const NODE_HEIGHT = 80;
      const BUFFER = 10;

      // Apply collision detection after a short delay to let state update
      setTimeout(() => {
        setNodes(currentNodes => {
          const draggedNode = currentNodes.find(n => n.id === dragEndChange.id);
          if (!draggedNode || draggedNode.type !== 'pbtNode') return currentNodes;

          // Find sibling nodes in same region
          const siblings = currentNodes.filter(n =>
            n.id !== dragEndChange.id &&
            n.type === 'pbtNode' &&
            n.parentId === draggedNode.parentId
          );

          let needsUpdate = false;
          let updatedNodes = [...currentNodes];

          for (const sibling of siblings) {
            // Collision logic would go here
          }
          return updatedNodes;
        });
      }, 0);

      // Snapshot for history after drag
      setTimeout(() => takeSnapshot({ nodes, edges }), 100);
    }
  }, [onNodesChange, setNodes, nodes, edges, takeSnapshot]);


  // --- CONNECTION LOGIC (SMART DROPS) ---
  const connectionStartParams = React.useRef<{ nodeId: string | null; handleId: string | null; handleType: string | null }>({ nodeId: null, handleId: null, handleType: null });

  const onConnectStart = useCallback((_: any, params: { nodeId: string | null; handleId: string | null; handleType: string | null }) => {
    connectionStartParams.current = params;
  }, []);

  const onConnectEnd = useCallback((event: any) => {
    const target = event.target as Element;
    // Check if we dropped on a node (look for pbtNode class or parent)
    const nodeElement = target.closest('.react-flow__node-pbtNode');

    if (nodeElement && connectionStartParams.current.nodeId) {
      const targetId = nodeElement.getAttribute('data-id');
      const sourceId = connectionStartParams.current.nodeId;

      if (targetId && sourceId && targetId !== sourceId) {
        // Manually trigger a connection!
        // We know source/target nodes, we can let handleConnectWrapper figure out the handles

        // Prevent duplicate if ReactFlow already handled it via handle
        // We can check if an edge was just added, but simpler is to rely on addEdge dedupe or just fire it.
        // Actually, onConnect fires BEFORE onConnectEnd if successful. 
        // So we might get a double fire if the user hit a handle. 
        // We can check if the target IS a handle.
        if (target.classList.contains('react-flow__handle')) return;

        // If not a handle, but IS a node, force connect
        const params = {
          source: sourceId,
          sourceHandle: connectionStartParams.current.handleId, // Use the handle they dragged from
          target: targetId,
          targetHandle: null // Let wrapper calculate intelligent target handle
        };
        handleConnectWrapper(params as any);
      }
    }
  }, [nodes]); // Add nodes dependency if needed, though we use ref for start params



  // --- HANDLERS ---





  // WRAP onConnect properly
  const handleConnectWrapper = useCallback((params: Connection) => {
    // Smart Connect Logic: Determine best handles if just dropped casually
    let sourceHandle = params.sourceHandle;
    let targetHandle = params.targetHandle;

    if (nodes) {
      const sourceNode = nodes.find(n => n.id === params.source);
      const targetNode = nodes.find(n => n.id === params.target);

      if (sourceNode && targetNode && sourceNode.position && targetNode.position) {
        const dx = targetNode.position.x - sourceNode.position.x;
        const dy = targetNode.position.y - sourceNode.position.y;
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);

        // Logic: Connect "Faces"
        if (absDx > absDy) {
          // Horizontal containment dominates
          if (dx > 0) {
            // Target is to the RIGHT
            sourceHandle = 'right';
            targetHandle = 'left';
          } else {
            // Target is to the LEFT
            sourceHandle = 'left';
            targetHandle = 'right';
          }
        } else {
          // Vertical containment dominates
          if (dy > 0) {
            // Target is BELOW
            sourceHandle = 'bottom';
            targetHandle = 'top';
          } else {
            // Target is ABOVE
            sourceHandle = 'top';
            targetHandle = 'bottom';
          }
        }
      }
    }

    const newEdgeData = {
      ...params,
      sourceHandle, // Override
      targetHandle, // Override
      id: `edge-${Date.now()}`, // Generate unique ID
      type: 'default',
      animated: true,
      label: '',
      style: { stroke: '#475569', strokeWidth: 2 },
      data: { weight: 'moderado', relation: '', bidirectional: false, polarity: 'positive' },
      markerEnd: { type: MarkerType.ArrowClosed, width: 15, height: 15, color: '#64748b' }
    };

    const newEdges = addEdge(newEdgeData, edges);
    takeSnapshot({ nodes, edges: newEdges });

    // Auto-open modal to ask about bidirectional
    setTimeout(() => {
      const createdEdge = newEdges.find(e => e.id === newEdgeData.id);
      if (createdEdge) {
        setSelectedItem({ type: 'edge', data: createdEdge });
        setEditForm({
          id: createdEdge.id,
          relation: 'Influencia',
          weight: 'moderado',
          reverseWeight: 'moderado',
          bidirectional: false,
          polarity: 'positive',
          reversePolarity: 'positive',
          sourceHandle: createdEdge.sourceHandle,
          targetHandle: createdEdge.targetHandle
        });
        setIsModalOpen(true);
      }
    }, 100);
  }, [nodes, emitUpdate, takeSnapshot, edges]);

  // Edge Update Handler - allows dragging arrowheads to reconnect
  const onEdgeUpdate = useCallback((oldEdge: Edge, newConnection: Connection) => {
    // Preserve the edge data when reconnecting
    const updatedEdge = {
      ...oldEdge,
      source: newConnection.source,
      target: newConnection.target,
      sourceHandle: newConnection.sourceHandle,
      targetHandle: newConnection.targetHandle,
    };
    const newEdges = edges.map(e => e.id === oldEdge.id ? updatedEdge : e);
    takeSnapshot({ nodes, edges: newEdges });
  }, [edges, nodes, takeSnapshot]);

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    if (node.type === 'regionNode') return; // Don't edit regions
    setSelectedItem({ type: 'node', data: node });
    setEditForm({
      id: node.id,
      label: node.data.label,
      category: node.data.category || 'Contexto',
      change: node.data.change || 'estavel',
      isTarget: node.data.isTarget || false
    });
    setIsModalOpen(true);
  }, []);

  const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    setSelectedItem({ type: 'edge', data: edge });
    const edgeData = edge.data || {};
    setEditForm({
      id: edge.id,
      relation: edge.label || edgeData.relation || 'Influencia',
      weight: edgeData.weight || 'moderado',
      reverseWeight: edgeData.reverseWeight || edgeData.weight || 'moderado',
      bidirectional: edgeData.bidirectional || false,
      polarity: edgeData.polarity || 'positive',
      reversePolarity: edgeData.reversePolarity || edgeData.polarity || 'positive',
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle
    });
    setIsModalOpen(true);
  }, []);

  const handleAddNewNode = () => {
    const newId = `manual-${Date.now()}`;
    const defaultCategory = 'Cognitiva';
    setSelectedItem({ type: 'node', data: { id: newId } }); // Pseudo node
    setEditForm({
      id: newId,
      label: 'Novo Processo',
      category: defaultCategory,
      change: 'novo',
      isTarget: false,
      isNew: true
    });
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!selectedItem || !editForm) return;

    if (selectedItem.type === 'node') {
      let updatedNodes: Node[] = [];

      if ((editForm as any).isNew) {
        const parentKey = editForm.category === 'Intervenção' ? 'Comportamento' : (REGIONS[editForm.category] ? editForm.category : 'Contexto');
        const newNode: Node = {
          id: editForm.id,
          type: 'pbtNode',
          position: getRelativePosition(parentKey),
          data: {
            label: editForm.label,
            category: editForm.category,
            change: editForm.change,
            isTarget: editForm.isTarget,
            isModerator: editForm.isModerator
          },
          parentId: `region-${parentKey}`,
          extent: 'parent'
        };
        updatedNodes = [...nodes, newNode];
      } else {
        updatedNodes = nodes.map(node => {
          if (node.id === selectedItem.data.id) {
            const oldCategory = node.data.category;
            const newCategory = editForm.category;

            let updatedNode = {
              ...node,
              data: {
                ...node.data,
                label: editForm.label,
                category: newCategory,
                change: editForm.change,
                isTarget: editForm.isTarget,
                isModerator: editForm.isModerator
              }
            };

            if (oldCategory !== newCategory) {
              const parentKey = newCategory === 'Intervenção' ? 'Comportamento' : (REGIONS[newCategory] ? newCategory : 'Contexto');
              updatedNode.parentId = `region-${parentKey}`;
              updatedNode.position = getRelativePosition(parentKey);
            }
            return updatedNode;
          }
          return node;
        });
      }

      takeSnapshot({ nodes: updatedNodes, edges });
      emitUpdate(updatedNodes, edges);
    } else if (selectedItem.type === 'edge') {
      const weight = editForm.weight;
      const reverseWeight = editForm.reverseWeight || weight;
      const isBidirectional = editForm.bidirectional;
      const forwardPolarity = editForm.polarity;
      const reversePolarity = editForm.reversePolarity || forwardPolarity;

      // Line is neutral (2px solid)
      let strokeWidth = 2;

      // Helper to get marker config based on polarity AND weight
      const getMarkerConfig = (polarity: string, edgeWeight: string) => {
        let arrowSize = 15;
        if (edgeWeight === 'fraco') { arrowSize = 11; }
        if (edgeWeight === 'forte') { arrowSize = 18; }

        if (polarity === 'negative') {
          const sizeMap: Record<string, string> = {
            'fraco': 'arrow-hollow-fraco',
            'moderado': 'arrow-hollow-moderado',
            'forte': 'arrow-hollow-forte'
          };
          return sizeMap[edgeWeight] || 'arrow-hollow-moderado';
        }
        return {
          type: MarkerType.ArrowClosed,
          width: arrowSize,
          height: arrowSize,
          color: '#64748b'
        };
      };

      const markerEnd = getMarkerConfig(forwardPolarity, weight);
      const markerStart = isBidirectional ? getMarkerConfig(reversePolarity, reverseWeight) : undefined;

      const updatedEdges = edges.map(edge => {
        if (edge.id === selectedItem.data.id) {
          return {
            ...edge,
            label: editForm.relation,
            sourceHandle: editForm.sourceHandle,
            targetHandle: editForm.targetHandle,
            animated: !isBidirectional,
            style: {
              ...edge.style,
              strokeWidth,
              strokeDasharray: isBidirectional ? '8, 4' : undefined
            },
            className: isBidirectional ? 'react-flow__edge-bidirectional' : '',

            markerEnd,
            markerStart,
            data: {
              ...edge.data,
              weight,
              reverseWeight,
              bidirectional: isBidirectional,
              relation: editForm.relation,
              polarity: forwardPolarity,
              reversePolarity: reversePolarity
            }
          };
        }
        return edge;
      });

      takeSnapshot({ nodes, edges: updatedEdges });
      emitUpdate(nodes, updatedEdges);
    }
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  const handleDelete = () => {
    if (!selectedItem) return;

    if (selectedItem.type === 'node') {
      const newNodes = nodes.filter(n => n.id !== selectedItem.data.id);
      const newEdges = edges.filter(e => e.source !== selectedItem.data.id && e.target !== selectedItem.data.id); // Cleanup edges
      takeSnapshot({ nodes: newNodes, edges: newEdges });
      emitUpdate(newNodes, newEdges);
    } else {
      const newEdges = edges.filter(e => e.id !== selectedItem.data.id);
      takeSnapshot({ nodes, edges: newEdges });
      emitUpdate(nodes, newEdges);
    }
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  // Auto-Organize: Redistributes nodes using Dagre layout
  const handleAutoOrganize = useCallback(() => {
    const { nodes: reorganizedNodes, edges: reorganizedEdges } = getGridLayoutedElements(
      nodes.filter(n => n.type === 'pbtNode').map(n => ({
        id: n.id,
        type: 'pbtNode',
        data: n.data,
        position: n.position
      })),
      edges
    );

    takeSnapshot({ nodes: reorganizedNodes, edges: reorganizedEdges });
    emitUpdate(reorganizedNodes, reorganizedEdges);
  }, [nodes, edges, emitUpdate, takeSnapshot]);


  if (!nodes.length) {
    return (
      <div className="h-[750px] w-full flex items-center justify-center border border-white/10 rounded-xl bg-black/50 text-slate-500 font-mono text-sm">
        <p>&gt; AGUARDANDO DADOS DA REDE...</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '750px', backgroundColor: currentTheme.background }} className="border border-white/10 rounded-xl overflow-hidden relative group shadow-inner transition-colors duration-500">
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
        <div className="relative w-full h-full max-w-[1200px] max-h-[800px]">
          {/* BackgroundMatrix removed - using Region Nodes now */}
          <div className="absolute inset-0 z-10">
            <ReactFlow
              nodes={nodes.map(n => {
                // Pass global Visual States to nodes
                if (n.id.startsWith('region-')) {
                  return { ...n, data: { ...n.data, hideLabels: !showRegionLabels, theme } };
                }
                if (n.type === 'pbtNode') {
                  const isHovered = n.id === hoveredNodeId;
                  const isContextMode = !!hoveredNodeId || !!(selectedItem?.type === 'node');
                  const focusId = hoveredNodeId || (selectedItem?.type === 'node' ? selectedItem.data.id : null);
                  // Check if related (edge exists)
                  const isRelated = edges.some(e =>
                    (e.source === focusId && e.target === n.id) ||
                    (e.target === focusId && e.source === n.id)
                  );

                  return {
                    ...n,
                    data: {
                      ...n.data,
                      theme,
                      mode,
                      isHovered,
                      isRelated,
                      isContextMode,
                      showCategoryBadge: !showRegionLabels,
                      onNodeHover: () => setHoveredNodeId(n.id),
                      onNodeLeave: () => setHoveredNodeId(null)
                    }
                  };
                }
                return n;
              })}
              edges={edges}
              nodeTypes={nodeTypes}

              onNodesChange={onNodesChangeWrapper}
              onEdgesChange={onEdgesChange}

              onConnectStart={onConnectStart}
              onConnectEnd={onConnectEnd}
              onConnect={handleConnectWrapper}
              onNodeClick={onNodeClick}
              onEdgeClick={onEdgeClick}
              connectOnClick={true}
              fitView
              attributionPosition="bottom-right"
              minZoom={0.5}
              maxZoom={1.5}
              proOptions={{ hideAttribution: true }}
            >
              <Controls className="bg-slate-800 border b-slate-700 fill-slate-300" showInteractive={true} />
              <svg>
                <defs>
                  {/* Directional Weights - Size varies to show strength */}
                  {/* Weak: Small (11px) */}
                  <marker id="arrow-hollow-fraco" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="11" markerHeight="11" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="white" stroke="#64748b" strokeWidth="1" />
                  </marker>
                  {/* Moderate: Medium (15px) */}
                  <marker id="arrow-hollow-moderado" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="15" markerHeight="15" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="white" stroke="#64748b" strokeWidth="1" />
                  </marker>
                  {/* Strong: Large (18px) */}
                  {/* Colors need to be dynamic for Light Mode, injecting IDs based on theme */}
                  <marker id="arrow-hollow-fraco" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="11" markerHeight="11" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill={currentTheme.background} stroke={currentTheme.edge} strokeWidth="1" />
                  </marker>
                  <marker id="arrow-hollow-moderado" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="15" markerHeight="15" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill={currentTheme.background} stroke={currentTheme.edge} strokeWidth="1" />
                  </marker>
                  <marker id="arrow-hollow-forte" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="18" markerHeight="18" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill={currentTheme.background} stroke={currentTheme.edge} strokeWidth="1" />
                  </marker>
                </defs>
              </svg>

              {/* Controls Overlay */}
              <div className="absolute top-4 right-4 z-50 flex flex-col gap-2">
                <button
                  onClick={handleAddNewNode}
                  className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-full shadow-lg border border-blue-400 transition-transform active:scale-95"
                  title="Adicionar Processo"
                >
                  <Plus className="w-5 h-5" />
                </button>
                <button
                  onClick={handleAutoOrganize}
                  className="bg-slate-700 hover:bg-slate-600 text-white p-2 rounded-full shadow-lg border border-slate-600 transition-transform active:scale-95"
                  title="Auto-Organizar (Redistribuir nós)"
                >
                  <LayoutGrid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setShowRegionLabels(!showRegionLabels)}
                  className={`${showRegionLabels ? 'bg-emerald-700/80 hover:bg-emerald-600' : 'bg-slate-700/50 hover:bg-slate-600'} text-white p-2 rounded-full shadow-lg border border-white/10 transition-all`}
                  title={showRegionLabels ? "Esconder Mapa de Regiões" : "Mostrar Mapa de Regiões"}
                >
                  {showRegionLabels ? <Map className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                </button>

                <div className="w-full h-px bg-white/10 my-1" />

                <button
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="bg-slate-700/50 hover:bg-slate-600 text-white p-2 rounded-full shadow-lg border border-white/10 transition-all"
                  title={theme === 'dark' ? "Modo Claro (Paciente)" : "Modo Escuro (Clínico)"}
                >
                  {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-300" /> : <Moon className="w-5 h-5 text-blue-300" />}
                </button>
                <button
                  onClick={() => setMode(mode === 'build' ? 'session' : 'build')}
                  className={`${mode === 'session' ? 'bg-purple-600 hover:bg-purple-500' : 'bg-slate-700/50 hover:bg-slate-600'} text-white p-2 rounded-full shadow-lg border border-white/10 transition-all`}
                  title={mode === 'build' ? "Entrar em Modo Sessão" : "Voltar para Modo Construção"}
                >
                  {mode === 'build' ? <Monitor className="w-5 h-5" /> : <Wrench className="w-5 h-5" />}
                </button>
              </div>

              {/* Editing Modal */}
              {isModalOpen && editForm && (
                <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
                  <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-[320px] overflow-hidden animate-in fade-in zoom-in duration-200">
                    <div className="bg-slate-800 px-4 py-3 border-b border-slate-700 flex justify-between items-center">
                      <span className="font-bold text-slate-200 text-sm flex items-center gap-2">
                        {selectedItem?.type === 'node' ? <Edit3 className="w-3 h-3" /> : <ArrowRight className="w-3 h-3" />}
                        {selectedItem?.type === 'node' ? 'Editar Processo' : 'Editar Conexão'}
                      </span>
                      <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
                    </div>

                    <div className="p-4 space-y-4">
                      {selectedItem?.type === 'node' ? (
                        <>
                          <div className="space-y-1">
                            <label className="text-[10px] uppercase text-slate-500 font-bold">Nome do Processo</label>
                            <input
                              value={editForm.label}
                              onChange={(e) => setEditForm({ ...editForm, label: e.target.value })}
                              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white focus:border-blue-500 outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] uppercase text-slate-500 font-bold">Categoria (Move o card)</label>
                            <select
                              value={editForm.category}
                              onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white outline-none"
                            >
                              {Object.keys(REGIONS).filter(k => k !== 'Intervenção').map(cat => (
                                <option key={cat} value={cat}>{REGIONS[cat].label}</option>
                              ))}
                              <option value="Intervenção">Intervenção</option>
                            </select>
                          </div>
                          <div className="flex gap-2">
                            <div className="space-y-1 flex-1">
                              <label className="text-[10px] uppercase text-slate-500 font-bold">Mudança</label>
                              <select
                                value={editForm.change}
                                onChange={(e) => setEditForm({ ...editForm, change: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white outline-none"
                              >
                                <option value="estavel">Estável</option>
                                <option value="aumentou">Aumentou</option>
                                <option value="diminuiu">Diminuiu</option>
                                <option value="novo">Novo</option>
                              </select>
                            </div>
                            <div className="space-y-1 flex flex-col justify-center gap-2 pb-2 pl-2">
                              <label className="flex items-center gap-2 cursor-pointer pt-4">
                                <input
                                  type="checkbox"
                                  checked={editForm.isTarget}
                                  onChange={(e) => setEditForm({ ...editForm, isTarget: e.target.checked })}
                                  className="w-4 h-4 rounded border-slate-600 bg-slate-900"
                                />
                                <span className="text-xs text-slate-300">Alvo Terapêutico</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={editForm.isModerator}
                                  onChange={(e) => setEditForm({ ...editForm, isModerator: e.target.checked })}
                                  className="w-4 h-4 rounded border-slate-600 bg-slate-900"
                                />
                                <span className="text-xs text-slate-300">Moderador (Fixo)</span>
                              </label>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          {/* Visual indicator of edge direction */}
                          {selectedItem?.data && (
                            <div className="mb-3 p-2 bg-slate-950 border border-slate-700 rounded">
                              <div className="flex items-center justify-center gap-2 text-xs">
                                <span className="font-bold text-blue-400">
                                  {nodes.find(n => n.id === selectedItem.data.source)?.data?.label || 'Origem'}
                                </span>
                                <ArrowRight className="w-3 h-3 text-slate-500" />
                                <span className="font-bold text-green-400">
                                  {nodes.find(n => n.id === selectedItem.data.target)?.data?.label || 'Destino'}
                                </span>
                              </div>
                            </div>
                          )}

                          <div className="space-y-1">
                            <label className="text-[10px] uppercase text-slate-500 font-bold">Nome da Relação</label>
                            <input
                              value={editForm.relation}
                              onChange={(e) => setEditForm({ ...editForm, relation: e.target.value })}
                              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] uppercase text-slate-500 font-bold">
                              Força/Influência {editForm.bidirectional ? '(IDA →)' : ''}
                            </label>
                            <select
                              value={editForm.weight}
                              onChange={(e) => setEditForm({ ...editForm, weight: e.target.value })}
                              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white outline-none"
                            >
                              <option value="fraco">Fraca (Incerta)</option>
                              <option value="moderado">Moderada (Relevante)</option>
                              <option value="forte">Forte (Dominante)</option>
                            </select>
                          </div>
                          {/* Bidirectional Toggle removed here, moving to own row */}

                          {/* Polarity Select */}
                          <div className="space-y-1">
                            <label className="text-[10px] uppercase text-slate-500 font-bold">Tipo de Relação (Polaridade)</label>
                            <select
                              value={editForm.polarity || 'positive'}
                              onChange={(e) => setEditForm({ ...editForm, polarity: e.target.value })}
                              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white outline-none"
                            >
                              <option value="positive">Positiva / Excitatória (Seta Cheia)</option>
                              <option value="negative">Negativa / Inibitória (Seta Vazia)</option>
                            </select>
                          </div>

                          <div className="flex items-center gap-2 pt-2">
                            <input
                              type="checkbox"
                              id="bidirectional"
                              checked={editForm.bidirectional}
                              onChange={(e) => setEditForm({ ...editForm, bidirectional: e.target.checked })}
                              className="w-4 h-4 bg-slate-950 border-slate-700 rounded"
                            />
                            <label htmlFor="bidirectional" className="text-xs text-slate-300 select-none cursor-pointer">Bidirecional</label>
                          </div>

                          {/* Reverse Weight (only for bidirectional) */}
                          {editForm.bidirectional && (
                            <div className="space-y-1 mt-2 border-t border-slate-700 pt-3">
                              <label className="text-[10px] uppercase text-slate-500 font-bold">Força Reversa (← VOLTA)</label>
                              <select
                                value={editForm.reverseWeight || editForm.weight || 'moderado'}
                                onChange={(e) => setEditForm({ ...editForm, reverseWeight: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white outline-none"
                              >
                                <option value="fraco">Fraca (Incerta)</option>
                                <option value="moderado">Moderada (Relevante)</option>
                                <option value="forte">Forte (Dominante)</option>
                              </select>
                            </div>
                          )}

                          {/* Reverse Polarity (only for bidirectional) */}
                          {editForm.bidirectional && (
                            <div className="space-y-1 mt-2 border-t border-slate-700 pt-3">
                              <label className="text-[10px] uppercase text-slate-500 font-bold">Polaridade Reversa (Seta de Volta)</label>
                              <select
                                value={editForm.reversePolarity || editForm.polarity || 'positive'}
                                onChange={(e) => setEditForm({ ...editForm, reversePolarity: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white outline-none"
                              >
                                <option value="positive">Positiva (Cheia)</option>
                                <option value="negative">Negativa (Vazia)</option>
                              </select>
                              <p className="text-[9px] text-slate-500 italic mt-1">
                                💡 Use polaridades diferentes para "Empurra-Puxa" (ex: Ida=Positiva, Volta=Negativa)
                              </p>
                            </div>
                          )}
                        </>
                      )}

                      <div className="flex gap-2 pt-2 border-t border-slate-700 mt-2">
                        <button onClick={handleDelete} className="flex-1 bg-red-900/50 hover:bg-red-900 text-red-200 py-2 rounded text-xs font-bold border border-red-800 transition-colors flex items-center justify-center gap-1">
                          <Trash2 className="w-3 h-3" /> Excluir
                        </button>
                        <button onClick={handleSave} className="flex-[2] bg-blue-600 hover:bg-blue-500 text-white py-2 rounded text-xs font-bold transition-colors flex items-center justify-center gap-1 shadow-lg shadow-blue-900/20">
                          <Save className="w-3 h-3" /> Salvar Alterações
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tutorial/Legend Toggle Button */}
              <button
                onClick={() => setShowLegend(!showLegend)}
                className="absolute bottom-4 right-14 z-50 bg-slate-800/90 hover:bg-slate-700/90 backdrop-blur border border-slate-600/50 px-3 py-2 rounded-lg shadow-xl transition-all flex items-center gap-2 text-slate-300 hover:text-white"
                title="Como ler a rede"
              >
                <HelpCircle className="w-4 h-4" />
                <span className="text-xs font-medium">Legenda</span>
                {showLegend ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
              </button>

              {/* Full Tutorial/Legend Panel */}
              {showLegend && (
                <div className="absolute bottom-16 right-14 bg-slate-900/95 backdrop-blur-md border border-slate-700/50 p-4 rounded-xl shadow-2xl z-50 max-w-md animate-in slide-in-from-bottom-2 duration-200">
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-700">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-blue-400" />
                      Como Ler a Rede de Processos
                    </h3>
                    <button
                      onClick={() => setShowLegend(false)}
                      className="text-slate-400 hover:text-white transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Direção */}
                    <div>
                      <h4 className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-2">
                        📍 Direção da Influência
                      </h4>
                      <div className="space-y-2 pl-2">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center w-12 justify-center">
                            <div className="w-8 border-b-2 border-dashed border-slate-400"></div>
                            <ArrowRight className="w-4 h-4 text-slate-400 -ml-1" />
                          </div>
                          <div>
                            <span className="text-[11px] text-slate-200 font-medium">Unidirecional</span>
                            <span className="text-[9px] text-slate-500 block">A → B (A influencia B)</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center w-12 justify-center">
                            <ArrowLeft className="w-4 h-4 text-slate-400 -mr-1" />
                            <div className="w-8 h-0.5 bg-slate-400"></div>
                            <ArrowRight className="w-4 h-4 text-slate-400 -ml-1" />
                          </div>
                          <div>
                            <span className="text-[11px] text-slate-200 font-medium">Bidirecional</span>
                            <span className="text-[9px] text-slate-500 block">A ↔ B (Influência mútua)</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Separator */}
                    <div className="border-t border-slate-700/50"></div>

                    {/* Intensidade */}
                    <div>
                      <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-2">
                        💪 Intensidade da Conexão
                      </h4>
                      <div className="space-y-2 pl-2">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center w-12 justify-center">
                            <div className="w-8 bg-slate-400" style={{ height: '2px' }}></div>
                            <ArrowRight className="text-slate-400 -ml-1" style={{ width: '11px', height: '11px' }} />
                          </div>
                          <span className="text-[11px] text-slate-400">Fraca (Ponta Pequena)</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center w-12 justify-center">
                            <div className="w-8 bg-slate-300" style={{ height: '2px' }}></div>
                            <ArrowRight className="text-slate-300 -ml-1" style={{ width: '15px', height: '15px' }} />
                          </div>
                          <span className="text-[11px] text-slate-300">Moderada (Ponta Média)</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center w-12 justify-center">
                            <div className="w-8 bg-white" style={{ height: '2px' }}></div>
                            <ArrowRight className="text-white -ml-1" style={{ width: '18px', height: '18px' }} />
                          </div>
                          <span className="text-[11px] text-white font-medium">Forte (Ponta Grande)</span>
                        </div>
                      </div>
                    </div>

                    {/* Separator */}
                    <div className="border-t border-slate-700/50"></div>

                    {/* Polaridade */}
                    <div>
                      <h4 className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-2">
                        ⚡ Polaridade (Tipo de Efeito)
                      </h4>
                      <div className="space-y-2 pl-2">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center w-12 justify-center">
                            <div className="w-8 h-0.5 bg-slate-300"></div>
                            <svg className="w-5 h-5 -ml-1" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8-8-8z" fill="#94a3b8" />
                            </svg>
                          </div>
                          <div>
                            <span className="text-[11px] text-emerald-400 font-medium">Positiva (Seta Cheia)</span>
                            <span className="text-[9px] text-slate-500 block">↑A causa ↑B (amplifica, excitatória)</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center w-12 justify-center">
                            <div className="w-8 h-0.5 bg-slate-300"></div>
                            <svg className="w-5 h-5 -ml-1" viewBox="0 0 24 24">
                              <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8-8-8z" fill="none" stroke="#94a3b8" strokeWidth="2" />
                            </svg>
                          </div>
                          <div>
                            <span className="text-[11px] text-red-400 font-medium">Negativa (Seta Vazia)</span>
                            <span className="text-[9px] text-slate-500 block">↑A causa ↓B (inibe, suprime)</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Separator */}
                    <div className="border-t border-slate-700/50"></div>

                    {/* Nós */}
                    <div>
                      <h4 className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-2">
                        🧩 Processos (Nós)
                      </h4>
                      <div className="space-y-2 pl-2 text-[10px] text-slate-400">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-none bg-blue-500/30 border border-blue-500/50"></div>
                          <span>Retangular = Mecanismo (mediador)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-lg bg-teal-500/30 border border-teal-500/50"></div>
                          <span>Arredondado = Fator Moderador (condição)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-none bg-yellow-500/30 border border-yellow-500/50 relative">
                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-500 rounded-full"></div>
                          </div>
                          <span>⭐ Estrela = Alvo Terapêutico</span>
                        </div>
                      </div>
                    </div>

                    {/* Dica */}
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-2 mt-2">
                      <p className="text-[9px] text-blue-300/80">
                        💡 <strong>Dica:</strong> Clique em qualquer nó ou conexão para editar suas propriedades.
                        Arraste de um ponto ● para outro para criar novas conexões.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </ReactFlow>
          </div>
        </div>
      </div>
    </div>
  );
}
