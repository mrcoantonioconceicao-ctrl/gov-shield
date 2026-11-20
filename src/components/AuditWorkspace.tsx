import { useEffect, useState } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  Check,
  CheckCircle2,
  Copy,
  FileCode2,
  FileSearch,
  Loader2,
  RefreshCw,
  X,
} from 'lucide-react';
import {
  BpmnStepState,
  EnterpriseAuditBundle,
} from '../domain/orchestrator/auditBpmnOrchestrator';
import { AuditFinding, AuditStatus } from '../types/audit';
import {
  Step1FastTriageResponse,
  Step1TriageResult,
  TriageMode,
} from '../types/triage';
import { Step2ExtractorResult } from '../types/extractor';
import { findNodeIdForFinding } from '../utils/graphFindingMatcher';
import { BpmnPipelineBar } from './BpmnPipelineBar';
import { DependencyGraphView } from './DependencyGraphView';
import { EnterpriseArchitectureView } from './EnterpriseArchitectureView';
import { FindingsList } from './FindingsList';
import { NormativeReferenceView } from './NormativeReferenceView';
import { RedlineDiffView } from './RedlineDiffView';
import { Step1TriageView } from './Step1TriageView';
import { Step2ExtractorView } from './Step2ExtractorView';
import { WorkspaceTab } from './TopBar';

interface AuditWorkspaceProps {
  bundle: EnterpriseAuditBundle | null;
  originalText: string;
  activeFileName: string;
  hasActiveDocument: boolean;
  companyProfile: string;
  triageMode: TriageMode;
  triageResult: Step1TriageResult | null;
  fastTriageResponse: Step1FastTriageResponse | null;
  isTriaging: boolean;
  triageError: string | null;
  extractorResult: Step2ExtractorResult | null;
  isExtracting: boolean;
  extractorError: string | null;
  activeTab: WorkspaceTab;
  isAuditing: boolean;
  bpmnSteps: BpmnStepState[];
  auditError: string | null;
  onSelectTab: (tab: WorkspaceTab) => void;
  onCompanyProfileChange: (value: string) => void;
  onTriageModeChange: (mode: TriageMode) => void;
  onRunTriage: () => void;
  onRunExtraction: () => void;
  onLoadDefaultSample: () => void;
  onDismissError: () => void;
  onRetryAudit: () => void;
}

const STATUS_DISPLAY: Record<
  AuditStatus,
  {
    label: string;
    colorClass: string;
    borderClass: string;
    Icon: typeof AlertOctagon;
  }
> = {
  ALTO_RISCO_IMPUGNACAO: {
    label: 'Alto Risco de Impugnação',
    colorClass: 'text-[#EF4444]',
    borderClass: 'border-[#EF4444]/40 bg-[#EF4444]/10',
    Icon: AlertOctagon,
  },
  REQUER_RETIFICACAO_PREVIA: {
    label: 'Requer Retificação Prévia',
    colorClass: 'text-[#F59E0B]',
    borderClass: 'border-[#F59E0B]/40 bg-[#F59E0B]/10',
    Icon: AlertTriangle,
  },
  APROVADO_COM_RESSALVAS: {
    label: 'Aprovado com Ressalvas',
    colorClass: 'text-[#10B981]',
    borderClass: 'border-[#10B981]/40 bg-[#10B981]/10',
    Icon: CheckCircle2,
  },
};

export function AuditWorkspace({
  bundle,
  originalText,
  activeFileName,
  hasActiveDocument,
  companyProfile,
  triageMode,
  triageResult,
  fastTriageResponse,
  isTriaging,
  triageError,
  extractorResult,
  isExtracting,
  extractorError,
  activeTab,
  isAuditing,
  bpmnSteps,
  auditError,
  onSelectTab,
  onCompanyProfileChange,
  onTriageModeChange,
  onRunTriage,
  onRunExtraction,
  onLoadDefaultSample,
  onDismissError,
  onRetryAudit,
}: AuditWorkspaceProps) {
  const [copiedJson, setCopiedJson] = useState(false);
  const [selectedGraphNodeId, setSelectedGraphNodeId] = useState<string | null>(
    null
  );

  const report = bundle?.report ?? null;

  useEffect(() => {
    if (!report) {
      setSelectedGraphNodeId(null);
      return;
    }
    const firstClause = report.grafo_dependencias.nos.find(
      (n) => n.tipo === 'CLAUSULA'
    );
    setSelectedGraphNodeId(
      firstClause?.id ?? report.grafo_dependencias.nos[0]?.id ?? null
    );
  }, [report]);

  const handleInspectInGraph = (finding: AuditFinding) => {
    if (!report) return;
    const nodeId = findNodeIdForFinding(
      finding,
      report.grafo_dependencias.nos
    );
    setSelectedGraphNodeId(nodeId);
    onSelectTab('grafo');
  };

  if (isAuditing) {
    return (
      <section
        aria-label="Orquestração BPMN em andamento"
        aria-live="polite"
        className="flex-1 min-w-0 rounded-lg border border-[#1F2937] bg-[#111827] flex flex-col justify-center items-center p-8 sm:p-12 min-h-[540px]"
      >
        <div className="w-full max-w-xl">
          <div className="flex items-center gap-3 mb-6">
            <Loader2
              className="h-5 w-5 animate-spin text-[#3B82F6] shrink-0"
              aria-hidden="true"
            />
            <div>
              <h1 className="text-base font-semibold text-[#F9FAFB]">
                Orquestração Pericial BPMN em Execução
              </h1>
              <p className="text-xs text-[#9CA3AF] mt-0.5">
                Pipeline Enterprise: SHA-256 · Document AST · GraphRAG · Gemini 2.5 · Telemetria MCP
              </p>
            </div>
          </div>

          <BpmnPipelineBar steps={bpmnSteps} variant="full" />
        </div>
      </section>
    );
  }

  const errorBanner = auditError ? (
    <div
      role="alert"
      className="border-b border-[#EF4444]/40 bg-[#EF4444]/10 px-5 py-3.5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start gap-2.5 min-w-0">
        <AlertOctagon
          className="h-4 w-4 text-[#EF4444] shrink-0 mt-0.5"
          aria-hidden="true"
        />
        <div className="min-w-0">
          <p className="text-xs font-semibold text-[#F9FAFB]">
            Falha ao executar auditoria no motor Gemini 2.5
          </p>
          <p className="text-xs text-[#FCA5A5] mt-0.5 leading-relaxed">
            {auditError}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onRetryAudit}
          className="inline-flex items-center gap-1.5 rounded border border-[#EF4444]/40 bg-[#090D16] px-3 py-1.5 text-xs font-medium text-[#F9FAFB] hover:border-[#EF4444] whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]"
        >
          <RefreshCw className="h-3 w-3" aria-hidden="true" />
          <span>Tentar novamente</span>
        </button>
        <button
          type="button"
          onClick={onDismissError}
          aria-label="Fechar alerta de erro"
          className="rounded p-1.5 text-[#9CA3AF] hover:text-[#F9FAFB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  ) : null;

  if (!bundle || !report) {
    if (activeTab === 'triagem') {
      return (
        <section
          aria-label="Triagem de edital (Etapa 1)"
          className="flex-1 min-w-0 rounded-lg border border-[#1F2937] bg-[#111827] flex flex-col overflow-hidden min-h-[540px]"
        >
          {errorBanner}
          <Step1TriageView
            fileName={activeFileName}
            hasDocument={hasActiveDocument}
            companyProfile={companyProfile}
            triageMode={triageMode}
            triageResult={triageResult}
            fastTriageResponse={fastTriageResponse}
            isTriaging={isTriaging}
            triageError={triageError}
            onCompanyProfileChange={onCompanyProfileChange}
            onTriageModeChange={onTriageModeChange}
            onRunTriage={onRunTriage}
          />
        </section>
      );
    }

    if (activeTab === 'extracao') {
      return (
        <section
          aria-label="Extrator forense (Etapa 2)"
          className="flex-1 min-w-0 rounded-lg border border-[#1F2937] bg-[#111827] flex flex-col overflow-hidden min-h-[540px]"
        >
          {errorBanner}
          <Step2ExtractorView
            fileName={activeFileName}
            hasDocument={hasActiveDocument}
            extractorResult={extractorResult}
            isExtracting={isExtracting}
            extractorError={extractorError}
            onRunExtraction={onRunExtraction}
          />
        </section>
      );
    }

    return (
      <section
        aria-label="Painel de resultados da auditoria"
        className="flex-1 min-w-0 rounded-lg border border-[#1F2937] bg-[#111827] flex flex-col overflow-hidden min-h-[540px]"
      >
        {errorBanner}
        <div className="flex-1 flex flex-col justify-center items-center p-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-md border border-[#1F2937] bg-[#090D16] mb-4">
            <FileSearch className="h-6 w-6 text-[#3B82F6]" aria-hidden="true" />
          </div>
          <h1 className="text-lg font-semibold text-[#F9FAFB]">
            Nenhum parecer pericial ativo no momento
          </h1>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-[#9CA3AF]">
            Envie um arquivo PDF ou TXT no painel de ingestão à esquerda, selecione um dos editais de referência ou cole cláusulas para iniciar a orquestração BPMN e auditoria via Gemini 2.5.
          </p>
          <button
            type="button"
            onClick={onLoadDefaultSample}
            className="mt-6 inline-flex items-center gap-2 rounded-md bg-[#3B82F6] px-4 py-2.5 text-xs font-semibold text-[#F9FAFB] transition-colors hover:bg-[#2563EB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]"
          >
            Carregar Edital de Demonstração
          </button>
        </div>
      </section>
    );
  }

  const statusMeta = STATUS_DISPLAY[report.status_parecer];
  const StatusIcon = statusMeta.Icon;

  const scoreBarColor =
    report.score_risco_global >= 70
      ? 'bg-[#EF4444]'
      : report.score_risco_global >= 35
        ? 'bg-[#F59E0B]'
        : 'bg-[#10B981]';

  const scoreTextColor =
    report.score_risco_global >= 70
      ? 'text-[#EF4444]'
      : report.score_risco_global >= 35
        ? 'text-[#F59E0B]'
        : 'text-[#10B981]';

  const formattedDate = new Date(report.timestamp_auditoria).toLocaleString(
    'pt-BR',
    {
      dateStyle: 'short',
      timeStyle: 'medium',
    }
  );

  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(report, null, 2));
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 1800);
    } catch {
      // Clipboard blocked
    }
  };

  return (
    <section
      aria-label="Painel de auditoria pericial"
      className="flex-1 min-w-0 rounded-lg border border-[#1F2937] bg-[#111827] flex flex-col overflow-hidden"
    >
      {errorBanner}

      {/* Compact 5-stage BPMN Trace */}
      <BpmnPipelineBar steps={bundle.bpmnSteps} variant="compact" />

      {/* Report Executive Header */}
      <div className="border-b border-[#1F2937] p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-[#9CA3AF]">
              <span className="font-medium text-[#F9FAFB]">
                {report.metadados_documento.orgao_identificado}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono">
                {report.metadados_documento.modalidade}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">{formattedDate}</span>
            </div>

            <h1 className="mt-1.5 text-lg sm:text-xl font-semibold text-[#F9FAFB] leading-snug text-balance">
              {report.metadados_documento.numero_edital_ou_processo}
            </h1>

            <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-[#9CA3AF] max-w-3xl">
              {report.metadados_documento.objeto_resumido}
            </p>
          </div>

          {/* Explicit Status Classification (icon + text label) */}
          <div
            className={`shrink-0 inline-flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-semibold whitespace-nowrap ${statusMeta.borderClass} ${statusMeta.colorClass}`}
          >
            <StatusIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{statusMeta.label}</span>
          </div>
        </div>
      </div>

      {/* 4-Column Tabular KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-[#1F2937] border-b border-[#1F2937] bg-[#0D131F]">
        <div className="p-4 sm:px-5">
          <p className="text-[11px] font-medium text-[#9CA3AF]">
            Score de Risco Global
          </p>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span
              className={`text-2xl font-semibold font-mono tabular-nums ${scoreTextColor}`}
            >
              {report.score_risco_global}
            </span>
            <span className="text-xs font-mono text-[#9CA3AF] tabular-nums">
              / 100
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-sm bg-[#1F2937]">
            <div
              className={`h-full transition-all duration-200 ${scoreBarColor}`}
              style={{ width: `${report.score_risco_global}%` }}
            />
          </div>
        </div>

        <div className="p-4 sm:px-5">
          <p className="text-[11px] font-medium text-[#9CA3AF]">
            Apontamentos Detectados
          </p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-semibold font-mono text-[#F9FAFB] tabular-nums">
              {report.achados.length}
            </span>
            <span className="text-xs text-[#EF4444] font-medium tabular-nums">
              {report.metricas_economia.clausulas_criticas_detectadas} crítico(s)
            </span>
          </div>
          <p className="mt-2 text-[11px] text-[#9CA3AF] tabular-nums">
            AST: {bundle.ast.totalSecoes} seções · {bundle.ast.totalClausulas} cláusulas
          </p>
        </div>

        <div className="p-4 sm:px-5">
          <p className="text-[11px] font-medium text-[#9CA3AF]">
            Ganho de Eficiência Pericial
          </p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-semibold font-mono text-[#10B981] tabular-nums">
              {report.metricas_economia.tempo_execucao_segundos}s
            </span>
            <span className="text-xs text-[#9CA3AF] tabular-nums">
              vs. {report.metricas_economia.tempo_estimado_revisao_humana_minutos} min manual
            </span>
          </div>
          <p className="mt-2 text-[11px] text-[#9CA3AF] tabular-nums">
            {bundle.mcpLogs.length} tools MCP auditadas
          </p>
        </div>

        <div className="p-4 sm:px-5">
          <p className="text-[11px] font-medium text-[#9CA3AF]">
            Documento e Custódia
          </p>
          <p className="mt-1.5 truncate text-xs font-mono text-[#F9FAFB]">
            {report.nome_arquivo}
          </p>
          <p className="mt-1.5 truncate text-[11px] font-mono text-[#9CA3AF] tabular-nums">
            SHA-256: {report.sha256_documento.slice(0, 16)}…
          </p>
        </div>
      </div>

      {/* Workspace Sub-Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1F2937] px-5 py-2.5 bg-[#111827]">
        <div
          role="tablist"
          aria-label="Seções do parecer pericial"
          className="flex flex-wrap items-center gap-1"
        >
          {(
            [
              { id: 'triagem', label: 'Triagem (Etapa 1)' },
              { id: 'extracao', label: 'Extração (Etapa 2)' },
              { id: 'achados', label: `Achados (${report.achados.length})` },
              {
                id: 'minuta',
                label: 'Minuta Retificada (Diff)',
              },
              {
                id: 'grafo',
                label: `Grafo (${report.grafo_dependencias.nos.length} nós)`,
              },
              {
                id: 'arquitetura',
                label: 'Arquitetura & Telemetria MCP',
              },
              { id: 'json', label: 'Contrato JSON' },
              { id: 'normas', label: 'Base Normativa' },
            ] as { id: WorkspaceTab; label: string }[]
          ).map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                type="button"
                aria-selected={active}
                onClick={() => onSelectTab(tab.id)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6] ${
                  active
                    ? 'bg-[#3B82F6]/15 text-[#F9FAFB] border border-[#3B82F6]/40'
                    : 'text-[#9CA3AF] hover:text-[#F9FAFB] border border-transparent'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-[#9CA3AF]">
          <FileCode2 className="h-3.5 w-3.5 text-[#3B82F6]" aria-hidden="true" />
          <span>DDD · BPMN · GraphRAG · MCP</span>
        </div>
      </div>

      {/* Tab Content Viewport */}
      <div className="flex-1">
        {activeTab === 'triagem' && (
          <Step1TriageView
            fileName={activeFileName}
            hasDocument={hasActiveDocument}
            companyProfile={companyProfile}
            triageMode={triageMode}
            triageResult={triageResult}
            fastTriageResponse={fastTriageResponse}
            isTriaging={isTriaging}
            triageError={triageError}
            onCompanyProfileChange={onCompanyProfileChange}
            onTriageModeChange={onTriageModeChange}
            onRunTriage={onRunTriage}
          />
        )}

        {activeTab === 'extracao' && (
          <Step2ExtractorView
            fileName={activeFileName}
            hasDocument={hasActiveDocument}
            extractorResult={extractorResult}
            isExtracting={isExtracting}
            extractorError={extractorError}
            onRunExtraction={onRunExtraction}
          />
        )}

        {activeTab === 'achados' && (
          <FindingsList
            key={`${report.sha256_documento}-${report.timestamp_auditoria}`}
            achados={report.achados}
            findingAstPaths={bundle.findingAstPaths}
            onInspectInGraph={handleInspectInGraph}
          />
        )}

        {activeTab === 'minuta' && (
          <RedlineDiffView
            key={`${report.sha256_documento}-${report.timestamp_auditoria}`}
            report={report}
            originalText={originalText}
          />
        )}

        {activeTab === 'grafo' && (
          <DependencyGraphView
            key={`${report.sha256_documento}-${report.timestamp_auditoria}`}
            nos={report.grafo_dependencias.nos}
            arestas={report.grafo_dependencias.arestas}
            achados={report.achados}
            selectedNodeId={selectedGraphNodeId}
            onSelectNodeId={setSelectedGraphNodeId}
          />
        )}

        {activeTab === 'arquitetura' && (
          <EnterpriseArchitectureView
            ast={bundle.ast}
            graphMetrics={bundle.graphMetrics}
            mcpLogs={bundle.mcpLogs}
          />
        )}

        {activeTab === 'json' && (
          <div>
            <div className="flex items-center justify-between gap-4 border-b border-[#1F2937] px-5 py-3.5">
              <div>
                <h3 className="text-sm font-semibold text-[#F9FAFB]">
                  Payload Estruturado (AuditReport)
                </h3>
                <p className="text-xs text-[#9CA3AF]">
                  Contrato de saída compatível com src/types/audit.ts.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCopyJson}
                className="inline-flex items-center gap-1.5 rounded-md border border-[#1F2937] bg-[#090D16] px-3 py-1.5 text-xs font-medium text-[#F9FAFB] hover:border-[#374151] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]"
              >
                {copiedJson ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-[#10B981]" />
                    <span className="text-[#10B981]">JSON copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-[#9CA3AF]" />
                    <span>Copiar JSON</span>
                  </>
                )}
              </button>
            </div>
            <pre className="max-h-[620px] overflow-auto bg-[#090D16] p-5 font-mono text-xs leading-relaxed text-[#D1D5DB]">
              {JSON.stringify(report, null, 2)}
            </pre>
          </div>
        )}

        {activeTab === 'normas' && <NormativeReferenceView />}
      </div>
    </section>
  );
}
