import { useMemo, useState } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  Check,
  Copy,
  Info,
} from 'lucide-react';
import {
  AuditFinding,
  DependencyEdge,
  DependencyNode,
  RiskSeverity,
} from '../types/audit';
import {
  findFindingForNode,
  findNodeIdForFinding,
} from '../utils/graphFindingMatcher';

interface DependencyGraphViewProps {
  nos: DependencyNode[];
  arestas: DependencyEdge[];
  achados: AuditFinding[];
  selectedNodeId: string | null;
  onSelectNodeId: (nodeId: string | null) => void;
}

interface PositionedNode extends DependencyNode {
  x: number;
  y: number;
  width: number;
  height: number;
}

const COLUMN_ORDER: DependencyNode['tipo'][] = [
  'SECRETARIA',
  'CLAUSULA',
  'LEI',
  'RISCO',
];

const COLUMN_TITLES: Record<DependencyNode['tipo'], string> = {
  SECRETARIA: 'Órgão / Secretaria',
  CLAUSULA: 'Cláusulas / Achados',
  LEI: 'Fundamento Legal / Norma',
  RISCO: 'Impacto / Risco',
};

const NODE_COLORS: Record<
  DependencyNode['tipo'],
  { stroke: string; fill: string; text: string; badge: string }
> = {
  SECRETARIA: {
    stroke: '#3B82F6',
    fill: '#0F172A',
    text: '#F9FAFB',
    badge: 'text-[#3B82F6]',
  },
  CLAUSULA: {
    stroke: '#6B7280',
    fill: '#111827',
    text: '#F9FAFB',
    badge: 'text-[#D1D5DB]',
  },
  LEI: {
    stroke: '#10B981',
    fill: '#0D1F1A',
    text: '#F9FAFB',
    badge: 'text-[#10B981]',
  },
  RISCO: {
    stroke: '#EF4444',
    fill: '#1F1115',
    text: '#F9FAFB',
    badge: 'text-[#EF4444]',
  },
};

const EDGE_COLORS: Record<DependencyEdge['relacao'], string> = {
  VIOLA: '#EF4444',
  EXIGE: '#3B82F6',
  IMPACTA: '#F59E0B',
};

const SEVERITY_DISPLAY: Record<
  RiskSeverity,
  { label: string; colorClass: string; Icon: typeof AlertOctagon }
> = {
  CRITICO: { label: 'Crítico', colorClass: 'text-[#EF4444]', Icon: AlertOctagon },
  ALTO: { label: 'Alto', colorClass: 'text-[#F59E0B]', Icon: AlertTriangle },
  MODERADO: { label: 'Moderado', colorClass: 'text-[#3B82F6]', Icon: Info },
};

export function DependencyGraphView({
  nos,
  arestas,
  achados,
  selectedNodeId,
  onSelectNodeId,
}: DependencyGraphViewProps) {
  const [relationFilter, setRelationFilter] = useState<
    'TODAS' | DependencyEdge['relacao']
  >('TODAS');
  const [copiedRectification, setCopiedRectification] = useState(false);

  const visibleEdges = useMemo(() => {
    if (relationFilter === 'TODAS') return arestas;
    return arestas.filter((e) => e.relacao === relationFilter);
  }, [arestas, relationFilter]);

  const activeColumns = useMemo(() => {
    const present = COLUMN_ORDER.filter((col) =>
      nos.some((n) => n.tipo === col)
    );
    return present.length > 0 ? present : COLUMN_ORDER;
  }, [nos]);

  const layout = useMemo(() => {
    const grouped: Record<DependencyNode['tipo'], DependencyNode[]> = {
      SECRETARIA: [],
      CLAUSULA: [],
      LEI: [],
      RISCO: [],
    };

    nos.forEach((n) => {
      grouped[n.tipo].push(n);
    });

    const nodeWidth = 204;
    const colGap = 56;
    const leftPad = 24;

    const colX = new Map<DependencyNode['tipo'], number>();
    activeColumns.forEach((col, index) => {
      colX.set(col, leftPad + index * (nodeWidth + colGap));
    });

    const maxRows = Math.max(
      1,
      ...activeColumns.map((col) => grouped[col].length)
    );

    const rowHeight = 76;
    const topOffset = 58;
    const svgHeight = Math.max(320, topOffset + maxRows * rowHeight + 24);
    const svgWidth = Math.max(
      720,
      leftPad * 2 + activeColumns.length * nodeWidth + (activeColumns.length - 1) * colGap
    );

    const positioned: PositionedNode[] = [];
    const nodeMap = new Map<string, PositionedNode>();

    activeColumns.forEach((col) => {
      const items = grouped[col];
      const totalColHeight = items.length * rowHeight;
      const startY =
        topOffset + (maxRows * rowHeight - totalColHeight) / 2;

      items.forEach((item, idx) => {
        const node: PositionedNode = {
          ...item,
          x: colX.get(col) ?? leftPad,
          y: startY + idx * rowHeight,
          width: nodeWidth,
          height: 56,
        };
        positioned.push(node);
        nodeMap.set(item.id, node);
      });
    });

    return { positioned, nodeMap, colX, svgWidth, svgHeight };
  }, [nos, activeColumns]);

  const connectedNodeIds = useMemo(() => {
    const set = new Set<string>();
    if (!selectedNodeId) return set;
    set.add(selectedNodeId);
    visibleEdges.forEach((edge) => {
      if (edge.origem === selectedNodeId) set.add(edge.destino);
      if (edge.destino === selectedNodeId) set.add(edge.origem);
    });
    return set;
  }, [selectedNodeId, visibleEdges]);

  const selectedNode = layout.nodeMap.get(selectedNodeId ?? '');

  const selectedEdges = useMemo(() => {
    if (!selectedNodeId) return [];
    return visibleEdges.filter(
      (e) => e.origem === selectedNodeId || e.destino === selectedNodeId
    );
  }, [selectedNodeId, visibleEdges]);

  const matchedFinding = useMemo(
    () => findFindingForNode(selectedNode, nos, arestas, achados),
    [selectedNode, nos, arestas, achados]
  );

  const handleCopySuggestion = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedRectification(true);
      setTimeout(() => setCopiedRectification(false), 1800);
    } catch {
      // Clipboard blocked
    }
  };

  if (nos.length === 0) {
    return (
      <div className="p-10 text-center">
        <p className="text-sm font-medium text-[#F9FAFB]">
          Grafo de dependências indisponível
        </p>
        <p className="mt-1 text-xs text-[#9CA3AF]">
          Execute a auditoria em um documento para mapear cláusulas, normas e riscos.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Controls & Dual Legend */}
      <div className="border-b border-[#1F2937] p-5 space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-1 rounded-md border border-[#1F2937] bg-[#090D16] p-1">
            {(['TODAS', 'VIOLA', 'EXIGE', 'IMPACTA'] as const).map((rel) => {
              const active = relationFilter === rel;
              return (
                <button
                  key={rel}
                  type="button"
                  onClick={() => setRelationFilter(rel)}
                  className={`rounded px-2.5 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6] ${
                    active
                      ? 'bg-[#1F2937] text-[#F9FAFB]'
                      : 'text-[#9CA3AF] hover:text-[#F9FAFB]'
                  }`}
                >
                  {rel === 'TODAS' ? 'Todas as Relações' : rel}
                </button>
              );
            })}
          </div>

          {selectedNodeId && (
            <button
              type="button"
              onClick={() => onSelectNodeId(null)}
              className="self-start sm:self-auto rounded-md border border-[#1F2937] bg-[#090D16] px-3 py-1.5 text-xs font-medium text-[#9CA3AF] hover:text-[#F9FAFB] whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]"
            >
              Limpar seleção
            </button>
          )}
        </div>

        {/* Legends: Node Types + Edge Relations */}
        <div className="flex flex-col gap-2 pt-1 text-[11px] text-[#9CA3AF] lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
            <span className="font-semibold text-[#D1D5DB]">Nós:</span>
            {COLUMN_ORDER.map((tipo) => (
              <span key={tipo} className="inline-flex items-center gap-1.5">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-xs border"
                  style={{
                    borderColor: NODE_COLORS[tipo].stroke,
                    backgroundColor: NODE_COLORS[tipo].fill,
                  }}
                  aria-hidden="true"
                />
                <span className="font-mono">{tipo}</span>
              </span>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
            <span className="font-semibold text-[#D1D5DB]">Relações:</span>
            {(['VIOLA', 'EXIGE', 'IMPACTA'] as const).map((rel) => (
              <span key={rel} className="inline-flex items-center gap-1.5">
                <span
                  className="inline-block h-0.5 w-4"
                  style={{ backgroundColor: EDGE_COLORS[rel] }}
                  aria-hidden="true"
                />
                <span className="font-mono">{rel}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Quick Jump by Finding (RT_001.. / FND-001..) */}
        {achados.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] font-medium text-[#9CA3AF] mr-1">
              Focar achado:
            </span>
            {achados.map((finding) => {
              const targetId = findNodeIdForFinding(finding, nos);
              const isFocused =
                targetId !== null && selectedNodeId === targetId;
              return (
                <button
                  key={finding.id}
                  type="button"
                  onClick={() =>
                    onSelectNodeId(isFocused ? null : targetId)
                  }
                  className={`rounded border px-2 py-1 text-[11px] font-mono tabular-nums transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6] ${
                    isFocused
                      ? 'border-[#3B82F6] bg-[#3B82F6]/15 text-[#F9FAFB]'
                      : 'border-[#1F2937] bg-[#090D16] text-[#9CA3AF] hover:border-[#374151] hover:text-[#F9FAFB]'
                  }`}
                >
                  {finding.regra_id}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Interactive SVG Canvas */}
      <div className="overflow-x-auto bg-[#090D16] p-4">
        <svg
          viewBox={`0 0 ${layout.svgWidth} ${layout.svgHeight}`}
          className="min-w-[740px] w-full h-auto select-none"
          role="img"
          aria-label="Grafo de dependências jurídicas entre órgão, cláusulas, normas e riscos"
        >
          <defs>
            {(['VIOLA', 'EXIGE', 'IMPACTA'] as const).map((rel) => (
              <marker
                key={rel}
                id={`arrow-${rel}`}
                markerWidth="8"
                markerHeight="8"
                refX="7"
                refY="3"
                orient="auto"
              >
                <path d="M0,0 L0,6 L7,3 z" fill={EDGE_COLORS[rel]} />
              </marker>
            ))}
          </defs>

          {/* Column Headers */}
          {activeColumns.map((col) => {
            const headerX = layout.colX.get(col) ?? 24;
            return (
              <text
                key={col}
                x={headerX}
                y={28}
                fill="#9CA3AF"
                fontSize="11"
                fontWeight="600"
                fontFamily="Plus Jakarta Sans, sans-serif"
              >
                {COLUMN_TITLES[col]}
              </text>
            );
          })}

          {/* Edges */}
          {visibleEdges.map((edge, idx) => {
            const source = layout.nodeMap.get(edge.origem);
            const target = layout.nodeMap.get(edge.destino);
            if (!source || !target) return null;

            const startX = source.x + source.width;
            const startY = source.y + source.height / 2;
            const endX = target.x - 4;
            const endY = target.y + target.height / 2;
            const midX = (startX + endX) / 2;
            const midY = (startY + endY) / 2;

            const isDirectConnection =
              selectedNodeId !== null &&
              (edge.origem === selectedNodeId || edge.destino === selectedNodeId);
            const isHighlighted = !selectedNodeId || isDirectConnection;

            return (
              <g key={`${edge.origem}-${edge.destino}-${edge.relacao}-${idx}`}>
                <path
                  d={`M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`}
                  fill="none"
                  stroke={EDGE_COLORS[edge.relacao]}
                  strokeWidth={isDirectConnection ? 2.25 : isHighlighted ? 1.6 : 1}
                  strokeOpacity={isDirectConnection ? 1 : isHighlighted ? 0.85 : 0.14}
                  markerEnd={`url(#arrow-${edge.relacao})`}
                />
                {isDirectConnection && (
                  <g transform={`translate(${midX}, ${midY})`}>
                    <rect
                      x={-28}
                      y={-9}
                      width={56}
                      height={18}
                      rx={3}
                      fill="#090D16"
                      stroke={EDGE_COLORS[edge.relacao]}
                      strokeWidth={1}
                    />
                    <text
                      x={0}
                      y={3.5}
                      textAnchor="middle"
                      fill="#F9FAFB"
                      fontSize="9"
                      fontWeight="600"
                      fontFamily="JetBrains Mono, monospace"
                    >
                      {edge.relacao}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Nodes */}
          {layout.positioned.map((node) => {
            const style = NODE_COLORS[node.tipo];
            const isSelected = selectedNodeId === node.id;
            const isDimmed =
              selectedNodeId !== null && !connectedNodeIds.has(node.id);

            const truncatedLabel =
              node.label.length > 26
                ? `${node.label.slice(0, 25)}…`
                : node.label;

            return (
              <g
                key={node.id}
                role="button"
                tabIndex={0}
                aria-label={`${node.tipo}: ${node.label}`}
                onClick={() =>
                  onSelectNodeId(isSelected ? null : node.id)
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectNodeId(isSelected ? null : node.id);
                  }
                }}
                className="cursor-pointer focus:outline-none"
                opacity={isDimmed ? 0.25 : 1}
              >
                <rect
                  x={node.x}
                  y={node.y}
                  width={node.width}
                  height={node.height}
                  rx={6}
                  fill={style.fill}
                  stroke={isSelected ? '#F9FAFB' : style.stroke}
                  strokeWidth={isSelected ? 2 : 1.25}
                />
                <text
                  x={node.x + 12}
                  y={node.y + 20}
                  fill="#9CA3AF"
                  fontSize="10"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {node.tipo}
                </text>
                <text
                  x={node.x + 12}
                  y={node.y + 39}
                  fill={style.text}
                  fontSize="12"
                  fontWeight="600"
                  fontFamily="Public Sans, sans-serif"
                >
                  {truncatedLabel}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Forensic Inspection Panel for Selected Node */}
      <div className="border-t border-[#1F2937] bg-[#111827] p-5">
        {selectedNode ? (
          <div className="space-y-4">
            {/* Selected Node Summary & Neighbor Navigation */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className={NODE_COLORS[selectedNode.tipo].badge}>
                    {selectedNode.tipo}
                  </span>
                  <span className="text-[#4B5563]" aria-hidden="true">
                    ·
                  </span>
                  <span className="text-[#9CA3AF]">{selectedNode.id}</span>
                </div>
                <h4 className="mt-1 text-sm font-semibold text-[#F9FAFB]">
                  {selectedNode.label}
                </h4>
              </div>

              <span className="text-xs text-[#9CA3AF] tabular-nums shrink-0">
                {selectedEdges.length} conexão(ões) direta(s)
              </span>
            </div>

            {/* Direct Edges / Traversal Chips */}
            {selectedEdges.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                {selectedEdges.map((edge, idx) => {
                  const isOutgoing = edge.origem === selectedNode.id;
                  const neighborId = isOutgoing ? edge.destino : edge.origem;
                  const neighbor = layout.nodeMap.get(neighborId);
                  if (!neighbor) return null;

                  return (
                    <button
                      key={`${edge.origem}-${edge.destino}-${idx}`}
                      type="button"
                      onClick={() => onSelectNodeId(neighbor.id)}
                      className="inline-flex items-center gap-1.5 rounded border border-[#1F2937] bg-[#090D16] px-2.5 py-1.5 text-[11px] text-[#D1D5DB] hover:border-[#374151] hover:text-[#F9FAFB] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]"
                    >
                      <span
                        className="font-mono font-semibold"
                        style={{ color: EDGE_COLORS[edge.relacao] }}
                      >
                        {isOutgoing ? edge.relacao : `← ${edge.relacao}`}
                      </span>
                      <ArrowRight
                        className="h-3 w-3 text-[#6B7280]"
                        aria-hidden="true"
                      />
                      <span className="truncate max-w-[200px]">
                        {neighbor.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Correlated Forensic Finding Details */}
            {matchedFinding ? (
              <div className="border-t border-[#1F2937] pt-4 space-y-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                    {(() => {
                      const sev = SEVERITY_DISPLAY[matchedFinding.severidade];
                      const SevIcon = sev.Icon;
                      return (
                        <span
                          className={`inline-flex items-center gap-1 font-semibold ${sev.colorClass}`}
                        >
                          <SevIcon className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>{sev.label}</span>
                        </span>
                      );
                    })()}
                    <span className="text-[#4B5563]" aria-hidden="true">
                      ·
                    </span>
                    <span className="font-mono text-[#9CA3AF]">
                      {matchedFinding.regra_id}
                    </span>
                    <span className="text-[#4B5563]" aria-hidden="true">
                      ·
                    </span>
                    <span className="font-semibold text-[#F9FAFB]">
                      {matchedFinding.titulo}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      handleCopySuggestion(matchedFinding.sugestao_retificacao)
                    }
                    className="self-start sm:self-auto inline-flex items-center gap-1.5 rounded border border-[#1F2937] bg-[#090D16] px-2.5 py-1.5 text-[11px] font-medium text-[#F9FAFB] hover:border-[#374151] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]"
                  >
                    {copiedRectification ? (
                      <>
                        <Check
                          className="h-3 w-3 text-[#10B981]"
                          aria-hidden="true"
                        />
                        <span className="text-[#10B981]">Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy
                          className="h-3 w-3 text-[#9CA3AF]"
                          aria-hidden="true"
                        />
                        <span>Copiar Sugestão de Retificação</span>
                      </>
                    )}
                  </button>
                </div>

                <div>
                  <p className="text-[11px] font-semibold text-[#9CA3AF] mb-1">
                    Trecho Original do Edital
                  </p>
                  <blockquote className="rounded-md border border-[#1F2937] bg-[#090D16] px-3.5 py-2.5 font-mono text-xs leading-relaxed text-[#D1D5DB]">
                    “{matchedFinding.trecho_original}”
                  </blockquote>
                </div>

                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                  <div>
                    <p className="text-[11px] font-semibold text-[#9CA3AF] mb-1">
                      Fundamentação Legal
                    </p>
                    <p className="text-xs leading-relaxed text-[#F9FAFB]">
                      {matchedFinding.fundamentacao_legal}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-[#10B981] mb-1">
                      Sugestão de Retificação
                    </p>
                    <p className="rounded-md border border-[#10B981]/30 bg-[#10B981]/5 px-3 py-2 text-xs leading-relaxed text-[#F9FAFB]">
                      {matchedFinding.sugestao_retificacao}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="border-t border-[#1F2937] pt-3 text-xs text-[#9CA3AF]">
                {selectedNode.tipo === 'SECRETARIA'
                  ? 'Nó raiz do órgão contratante. Clique em uma das cláusulas conectadas acima para inspecionar o trecho original, fundamentação legal e sugestão de retificação.'
                  : 'Nenhum achado textual correlacionado diretamente a este nó. Navegue pelos nós vizinhos acima para visualizar os apontamentos vinculados.'}
              </p>
            )}
          </div>
        ) : (
          <p className="text-xs text-[#9CA3AF]">
            Clique em qualquer nó do grafo ou selecione um achado acima para isolar suas dependências jurídicas e inspecionar trecho original, fundamentação legal e sugestão de retificação.
          </p>
        )}
      </div>
    </div>
  );
}
