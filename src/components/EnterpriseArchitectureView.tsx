import { useState } from 'react';
import {
  AlertOctagon,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Cpu,
  FolderTree,
  Network,
} from 'lucide-react';
import { DocumentAstRoot } from '../domain/ast/documentAstParser';
import { GraphRagMetrics } from '../domain/graphrag/normativeGraphEngine';
import {
  MCP_TOOL_CONTRACTS,
  McpExecutionLogEntry,
} from '../domain/mcp/mcpToolRegistry';

interface EnterpriseArchitectureViewProps {
  ast: DocumentAstRoot;
  graphMetrics: GraphRagMetrics;
  mcpLogs: McpExecutionLogEntry[];
}

export function EnterpriseArchitectureView({
  ast,
  graphMetrics,
  mcpLogs,
}: EnterpriseArchitectureViewProps) {
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >(() => {
    const initial: Record<string, boolean> = {};
    ast.secoes.slice(0, 2).forEach((s) => {
      initial[s.id] = true;
    });
    return initial;
  });

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="divide-y divide-[#1F2937]">
      {/* Summary Strip: AST + GraphRAG + MCP */}
      <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#1F2937] bg-[#0D131F]">
        <div className="p-5">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#9CA3AF]">
            <FolderTree className="h-4 w-4 text-[#3B82F6]" aria-hidden="true" />
            <span>Document AST Determinístico</span>
          </div>
          <p className="mt-2 text-xl font-semibold font-mono text-[#F9FAFB] tabular-nums">
            {ast.totalSecoes} seções · {ast.totalClausulas} cláusulas
          </p>
          <p className="mt-1 text-xs text-[#9CA3AF] tabular-nums">
            {ast.totalReferenciasNormativas} referências normativas mapeadas em {ast.totalLinhas} linhas
          </p>
        </div>

        <div className="p-5">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#9CA3AF]">
            <Network className="h-4 w-4 text-[#10B981]" aria-hidden="true" />
            <span>GraphRAG Normativo</span>
          </div>
          <p className="mt-2 text-xl font-semibold font-mono text-[#F9FAFB] tabular-nums">
            {graphMetrics.totalNos} nós · {graphMetrics.totalArestas} arestas
          </p>
          <p className="mt-1 text-xs text-[#9CA3AF] tabular-nums">
            VIOLA ({graphMetrics.arestasPorRelacao.VIOLA}) · EXIGE ({graphMetrics.arestasPorRelacao.EXIGE}) · IMPACTA ({graphMetrics.arestasPorRelacao.IMPACTA})
          </p>
        </div>

        <div className="p-5">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#9CA3AF]">
            <Cpu className="h-4 w-4 text-[#F59E0B]" aria-hidden="true" />
            <span>Camada MCP (Model Context Protocol)</span>
          </div>
          <p className="mt-2 text-xl font-semibold font-mono text-[#F9FAFB] tabular-nums">
            {mcpLogs.length} / {MCP_TOOL_CONTRACTS.length} tools invocadas
          </p>
          <p className="mt-1 text-xs text-[#9CA3AF] tabular-nums">
            Latência total:{' '}
            {mcpLogs
              .reduce((acc, log) => acc + log.durationMs, 0)
              .toFixed(1)}{' '}
            ms
          </p>
        </div>
      </div>

      {/* Section 1: MCP Tool Execution Telemetry Log */}
      <div className="p-5 space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-[#F9FAFB]">
            Log Auditável de Invocação MCP
          </h3>
          <p className="text-xs text-[#9CA3AF] mt-0.5">
            Registro em memória das chamadas de ferramentas do protocolo MCP com tempo real de execução em milissegundos.
          </p>
        </div>

        <div className="overflow-x-auto rounded-md border border-[#1F2937]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#1F2937] bg-[#0D131F] text-[11px] font-semibold text-[#9CA3AF]">
                <th className="px-4 py-2.5 whitespace-nowrap">Tool MCP</th>
                <th className="px-4 py-2.5 whitespace-nowrap">Status</th>
                <th className="px-4 py-2.5 text-right whitespace-nowrap">
                  Latência (ms)
                </th>
                <th className="px-4 py-2.5">Resumo do Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2937] bg-[#090D16] text-xs">
              {mcpLogs.map((log) => (
                <tr key={log.id} className="hover:bg-[#0D131F]/70">
                  <td className="px-4 py-2.5 font-mono text-[#F9FAFB] whitespace-nowrap">
                    {log.toolName}
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    {log.status === 'SUCCESS' ? (
                      <span className="inline-flex items-center gap-1 font-medium text-[#10B981]">
                        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>SUCCESS</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-medium text-[#EF4444]">
                        <AlertOctagon className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>ERROR</span>
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-[#D1D5DB] tabular-nums whitespace-nowrap">
                    {log.durationMs.toFixed(2)} ms
                  </td>
                  <td className="px-4 py-2.5 text-[#9CA3AF]">
                    {log.payloadSummary}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 2: GraphRAG Cross-Normative Links */}
      <div className="p-5 space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-[#F9FAFB]">
            Cruzamentos Normativos (GraphRAG)
          </h3>
          <p className="text-xs text-[#9CA3AF] mt-0.5">
            Relações semânticas identificadas entre Lei nº 14.133/2021, jurisprudência do TCE/SC e LGPD.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-md border border-[#1F2937] bg-[#090D16] p-4">
            <p className="text-[11px] font-semibold text-[#9CA3AF] mb-2">
              Cruzamentos Ativos no Parecer
            </p>
            {graphMetrics.cruzamentosNormativos.length === 0 ? (
              <p className="text-xs text-[#6B7280]">
                Nenhum cruzamento normativo específico registrado.
              </p>
            ) : (
              <ul className="space-y-1.5 text-xs text-[#D1D5DB]">
                {graphMetrics.cruzamentosNormativos.map((item, idx) => (
                  <li key={idx} className="leading-relaxed">
                    • {item}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-md border border-[#1F2937] bg-[#090D16] p-4">
            <p className="text-[11px] font-semibold text-[#9CA3AF] mb-2">
              Nós de Maior Centralidade no Grafo
            </p>
            {graphMetrics.nosCentrais.length === 0 ? (
              <p className="text-xs text-[#6B7280]">
                Sem nós mapeados neste documento.
              </p>
            ) : (
              <div className="divide-y divide-[#1F2937]">
                {graphMetrics.nosCentrais.map((node) => (
                  <div
                    key={node.id}
                    className="flex items-center justify-between gap-2 py-2 first:pt-0 last:pb-0 text-xs"
                  >
                    <span className="truncate text-[#F9FAFB]">{node.label}</span>
                    <span className="font-mono text-[#3B82F6] tabular-nums shrink-0">
                      grau {node.grau}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Section 3: Document AST Hierarchy */}
      <div className="p-5 space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-[#F9FAFB]">
            Árvore Estrutural Extraída (Document AST)
          </h3>
          <p className="text-xs text-[#9CA3AF] mt-0.5">
            Hierarquia determinística Seção → Cláusula → Referência Normativa utilizada para endereçamento pericial.
          </p>
        </div>

        <div className="divide-y divide-[#1F2937] rounded-md border border-[#1F2937] bg-[#090D16]">
          {ast.secoes.map((sec) => {
            const isOpen = !!expandedSections[sec.id];
            return (
              <div key={sec.id}>
                <button
                  type="button"
                  onClick={() => toggleSection(sec.id)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-[#0D131F] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#3B82F6]"
                >
                  <div className="min-w-0">
                    <span className="font-mono text-xs text-[#3B82F6] mr-2">
                      Seção {sec.numero}
                    </span>
                    <span className="text-xs font-semibold text-[#F9FAFB]">
                      {sec.titulo}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 text-[11px] font-mono text-[#9CA3AF] tabular-nums">
                    <span>{sec.clausulas.length} itens</span>
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <ChevronDown className="h-4 w-4" aria-hidden="true" />
                    )}
                  </div>
                </button>

                {isOpen && sec.clausulas.length > 0 && (
                  <div className="border-t border-[#1F2937]/70 divide-y divide-[#1F2937]/50 bg-[#111827]/40">
                    {sec.clausulas.map((cls) => (
                      <div key={cls.id} className="px-4 py-2.5 pl-8 space-y-1">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                          <span className="font-mono font-medium text-[#D1D5DB]">
                            {cls.titulo}
                          </span>
                          <span className="font-mono text-[10px] text-[#6B7280] tabular-nums">
                            L{cls.linhaInicio}
                            {cls.linhaFim !== cls.linhaInicio
                              ? `–L${cls.linhaFim}`
                              : ''}
                          </span>
                        </div>
                        <p className="text-xs text-[#9CA3AF] line-clamp-2 leading-relaxed">
                          {cls.conteudo}
                        </p>
                        {cls.referenciasNormativas.length > 0 && (
                          <p className="text-[11px] font-mono text-[#10B981]">
                            Refs:{' '}
                            {cls.referenciasNormativas
                              .map((r) => r.texto)
                              .join(' · ')}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
