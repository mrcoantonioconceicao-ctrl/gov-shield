import { useMemo, useState } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  GitFork,
  Info,
  Search,
} from 'lucide-react';
import {
  AuditFinding,
  RiskCategory,
  RiskSeverity,
} from '../types/audit';

interface FindingsListProps {
  achados: AuditFinding[];
  findingAstPaths?: Record<string, string>;
  onInspectInGraph?: (finding: AuditFinding) => void;
}

const SEVERITY_META: Record<
  RiskSeverity,
  {
    label: string;
    colorClass: string;
    Icon: typeof AlertOctagon;
  }
> = {
  CRITICO: {
    label: 'Crítico',
    colorClass: 'text-[#EF4444]',
    Icon: AlertOctagon,
  },
  ALTO: {
    label: 'Alto',
    colorClass: 'text-[#F59E0B]',
    Icon: AlertTriangle,
  },
  MODERADO: {
    label: 'Moderado',
    colorClass: 'text-[#3B82F6]',
    Icon: Info,
  },
};

const CATEGORY_LABEL: Record<RiskCategory, string> = {
  VIOLACAO_LEGAL: 'Violação Legal (Lei 14.133/2021)',
  RISCO_IMPUGNACAO_TCESC: 'Risco de Impugnação (TCE/SC)',
  LACUNA_CIBER_LGPD: 'Lacuna Ciber / LGPD',
};

export function FindingsList({
  achados,
  findingAstPaths,
  onInspectInGraph,
}: FindingsListProps) {
  const [severityFilter, setSeverityFilter] = useState<'TODAS' | RiskSeverity>('TODAS');
  const [categoryFilter, setCategoryFilter] = useState<'TODAS' | RiskCategory>('TODAS');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    achados.slice(0, 2).forEach((item) => {
      initial[item.id] = true;
    });
    return initial;
  });
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredFindings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return achados.filter((f) => {
      if (severityFilter !== 'TODAS' && f.severidade !== severityFilter) return false;
      if (categoryFilter !== 'TODAS' && f.categoria !== categoryFilter) return false;
      if (!q) return true;
      return (
        f.titulo.toLowerCase().includes(q) ||
        f.regra_id.toLowerCase().includes(q) ||
        f.fundamentacao_legal.toLowerCase().includes(q) ||
        f.trecho_original.toLowerCase().includes(q) ||
        f.sugestao_retificacao.toLowerCase().includes(q)
      );
    });
  }, [achados, severityFilter, categoryFilter, searchQuery]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopySuggestion = async (finding: AuditFinding) => {
    try {
      await navigator.clipboard.writeText(finding.sugestao_retificacao);
      setCopiedId(finding.id);
      setTimeout(() => setCopiedId(null), 1800);
    } catch {
      // Ignore clipboard failure
    }
  };

  return (
    <div>
      {/* Filter & Search Bar */}
      <div className="flex flex-col gap-3 border-b border-[#1F2937] p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1 rounded-md border border-[#1F2937] bg-[#090D16] p-1">
          {(
            [
              { id: 'TODAS', label: `Todas (${achados.length})` },
              {
                id: 'CRITICO',
                label: `Crítico (${achados.filter((a) => a.severidade === 'CRITICO').length})`,
              },
              {
                id: 'ALTO',
                label: `Alto (${achados.filter((a) => a.severidade === 'ALTO').length})`,
              },
              {
                id: 'MODERADO',
                label: `Moderado (${achados.filter((a) => a.severidade === 'MODERADO').length})`,
              },
            ] as const
          ).map((tab) => {
            const active = severityFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSeverityFilter(tab.id)}
                className={`rounded px-2.5 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors duration-150 tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6] ${
                  active
                    ? 'bg-[#1F2937] text-[#F9FAFB]'
                    : 'text-[#9CA3AF] hover:text-[#F9FAFB]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <select
            aria-label="Filtrar por categoria normativa"
            value={categoryFilter}
            onChange={(e) =>
              setCategoryFilter(e.target.value as 'TODAS' | RiskCategory)
            }
            className="rounded-md border border-[#1F2937] bg-[#090D16] px-3 py-1.5 text-xs text-[#F9FAFB] focus:border-[#3B82F6] focus:outline-none"
          >
            <option value="TODAS">Todas as categorias</option>
            <option value="VIOLACAO_LEGAL">Lei nº 14.133/2021</option>
            <option value="RISCO_IMPUGNACAO_TCESC">Risco TCE/SC</option>
            <option value="LACUNA_CIBER_LGPD">Lacuna Ciber / LGPD</option>
          </select>

          <div className="relative">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9CA3AF]"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar cláusula ou artigo..."
              aria-label="Buscar nos achados"
              className="w-full sm:w-56 rounded-md border border-[#1F2937] bg-[#090D16] pl-8 pr-3 py-1.5 text-xs text-[#F9FAFB] placeholder:text-[#6B7280] focus:border-[#3B82F6] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Findings List */}
      {filteredFindings.length === 0 ? (
        <div className="p-10 text-center">
          <p className="text-sm font-medium text-[#F9FAFB]">
            Nenhum achado encontrado para os filtros aplicados
          </p>
          <p className="mt-1 text-xs text-[#9CA3AF]">
            {achados.length === 0
              ? 'Não foram detectadas desconformidades críticas para o escopo selecionado.'
              : 'Limpe os filtros ou altere o termo de busca para visualizar todos os apontamentos.'}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-[#1F2937]">
          {filteredFindings.map((finding) => {
            const meta = SEVERITY_META[finding.severidade];
            const SeverityIcon = meta.Icon;
            const isExpanded = !!expandedIds[finding.id];
            const isCopied = copiedId === finding.id;

            return (
              <article key={finding.id} className="transition-colors duration-150">
                <div className="flex flex-col gap-3 px-5 py-4 hover:bg-[#0D131F] transition-colors duration-150 sm:flex-row sm:items-start sm:justify-between">
                  <button
                    type="button"
                    onClick={() => toggleExpand(finding.id)}
                    aria-expanded={isExpanded}
                    className="flex-1 min-w-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6] rounded"
                  >
                    {/* Clean unboxed metadata row */}
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs mb-1.5">
                      <span
                        className={`inline-flex items-center gap-1.5 font-semibold ${meta.colorClass}`}
                      >
                        <SeverityIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        <span>{meta.label}</span>
                      </span>
                      <span className="text-[#4B5563]" aria-hidden="true">
                        ·
                      </span>
                      <span className="font-mono text-[#9CA3AF] tabular-nums">
                        {finding.regra_id}
                      </span>
                      <span className="text-[#4B5563]" aria-hidden="true">
                        ·
                      </span>
                      <span className="text-[#9CA3AF]">
                        {CATEGORY_LABEL[finding.categoria]}
                      </span>
                      {findingAstPaths?.[finding.id] && (
                        <>
                          <span className="text-[#4B5563]" aria-hidden="true">
                            ·
                          </span>
                          <span className="font-mono text-[#3B82F6]">
                            {findingAstPaths[finding.id]}
                          </span>
                        </>
                      )}
                    </div>

                    <h4 className="text-sm font-semibold text-[#F9FAFB] leading-snug">
                      {finding.titulo}
                    </h4>
                  </button>

                  {/* Quick Actions Row */}
                  <div className="flex items-center gap-2 shrink-0 sm:pt-0.5">
                    <button
                      type="button"
                      onClick={() => handleCopySuggestion(finding)}
                      title="Copiar sugestão de retificação"
                      className="inline-flex items-center gap-1.5 rounded border border-[#1F2937] bg-[#090D16] px-2.5 py-1.5 text-[11px] font-medium text-[#D1D5DB] hover:border-[#374151] hover:text-[#F9FAFB] transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]"
                    >
                      {isCopied ? (
                        <>
                          <Check className="h-3 w-3 text-[#10B981]" aria-hidden="true" />
                          <span className="text-[#10B981]">Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3 text-[#9CA3AF]" aria-hidden="true" />
                          <span>Copiar Sugestão de Retificação</span>
                        </>
                      )}
                    </button>

                    {onInspectInGraph && (
                      <button
                        type="button"
                        onClick={() => onInspectInGraph(finding)}
                        title="Destacar este achado no Grafo de Dependências"
                        className="inline-flex items-center gap-1.5 rounded border border-[#1F2937] bg-[#090D16] px-2.5 py-1.5 text-[11px] font-medium text-[#9CA3AF] hover:border-[#3B82F6]/60 hover:text-[#F9FAFB] transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]"
                      >
                        <GitFork className="h-3 w-3 text-[#3B82F6]" aria-hidden="true" />
                        <span>Grafo</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => toggleExpand(finding.id)}
                      aria-label={isExpanded ? 'Recolher detalhes' : 'Expandir detalhes'}
                      aria-expanded={isExpanded}
                      className="rounded p-1.5 text-[#9CA3AF] hover:text-[#F9FAFB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]"
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <ChevronDown className="h-4 w-4" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-[#1F2937]/70 bg-[#0D131F]/60 px-5 py-4 space-y-4">
                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                      <div>
                        <p className="text-[11px] font-semibold text-[#9CA3AF] mb-1">
                          Fundamentação Legal
                        </p>
                        <p className="text-xs leading-relaxed text-[#F9FAFB]">
                          {finding.fundamentacao_legal}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold text-[#9CA3AF] mb-1">
                          Impacto Operacional e Jurídico
                        </p>
                        <p className="text-xs leading-relaxed text-[#F9FAFB]">
                          {finding.impacto_operacional}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-[11px] font-semibold text-[#9CA3AF] mb-1.5">
                        Trecho Original Identificado no Edital
                      </p>
                      <blockquote className="rounded-md border border-[#1F2937] bg-[#090D16] px-3.5 py-2.5 font-mono text-xs leading-relaxed text-[#D1D5DB]">
                        “{finding.trecho_original}”
                      </blockquote>
                    </div>

                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <p className="text-[11px] font-semibold text-[#10B981]">
                          Sugestão de Retificação Pericial
                        </p>
                        <button
                          type="button"
                          onClick={() => handleCopySuggestion(finding)}
                          className="inline-flex items-center gap-1.5 rounded border border-[#1F2937] bg-[#090D16] px-2.5 py-1 text-[11px] font-medium text-[#9CA3AF] hover:text-[#F9FAFB] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]"
                        >
                          {isCopied ? (
                            <>
                              <Check className="h-3 w-3 text-[#10B981]" />
                              <span className="text-[#10B981]">Copiado!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" />
                              <span>Copiar Sugestão de Retificação</span>
                            </>
                          )}
                        </button>
                      </div>
                      <p className="rounded-md border border-[#10B981]/30 bg-[#10B981]/5 px-3.5 py-2.5 text-xs leading-relaxed text-[#F9FAFB]">
                        {finding.sugestao_retificacao}
                      </p>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
