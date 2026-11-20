import { useState } from 'react';
import {
  AlertOctagon,
  Building2,
  Check,
  CheckCircle2,
  Copy,
  Filter,
  Loader2,
  Play,
  XCircle,
  Zap,
} from 'lucide-react';
import {
  Step1FastTriageResponse,
  Step1TriageResult,
  TriageMode,
} from '../types/triage';

interface Step1TriageViewProps {
  fileName: string;
  hasDocument: boolean;
  companyProfile: string;
  triageMode: TriageMode;
  triageResult: Step1TriageResult | null;
  fastTriageResponse: Step1FastTriageResponse | null;
  isTriaging: boolean;
  triageError: string | null;
  onCompanyProfileChange: (value: string) => void;
  onTriageModeChange: (mode: TriageMode) => void;
  onRunTriage: () => void;
}

const PROFILE_PRESETS: { label: string; value: string }[] = [
  {
    label: 'TI, SaaS & Saúde Digital',
    value:
      'CNAE 6201-5/01 (Desenvolvimento de software sob encomenda) e 6311-9/00 (Tratamento de dados, hospedagem em nuvem, prontuário eletrônico e soluções de biometria digital).',
  },
  {
    label: 'Gestão Tributária & GovTech',
    value:
      'CNAE 6202-3/00 (Licenciamento de software customizável para administração pública, gestão fiscal/tributária, NFS-e e portais de atendimento em nuvem).',
  },
  {
    label: 'Engenharia & Obras Viárias',
    value:
      'CNAE 4211-1/01 (Construção e restauração de rodovias, pavimentação asfáltica, drenagem pluvial e sinalização/monitoramento viário).',
  },
];

const MODALIDADE_LABELS: Record<string, string> = {
  PREGAO_ELETRONICO: 'Pregão Eletrônico',
  CONCORRENCIA: 'Concorrência',
  DISPENSA: 'Dispensa de Licitação',
  INEXIGIBILIDADE: 'Inexigibilidade',
  OUTRA: 'Outra Modalidade',
};

const ESFERA_LABELS: Record<string, string> = {
  FEDERAL: 'Federal',
  ESTADUAL: 'Estadual',
  MUNICIPAL: 'Municipal',
  CONSORCIO_PUBLICO: 'Consórcio Público',
  NAO_INFORMADO: 'Não informado',
};

export function Step1TriageView({
  fileName,
  hasDocument,
  companyProfile,
  triageMode,
  triageResult,
  fastTriageResponse,
  isTriaging,
  triageError,
  onCompanyProfileChange,
  onTriageModeChange,
  onRunTriage,
}: Step1TriageViewProps) {
  const [copiedJson, setCopiedJson] = useState(false);

  const activeJsonPayload =
    triageMode === 'fast' ? fastTriageResponse : triageResult;

  const handleCopyTriageJson = async () => {
    if (!activeJsonPayload) return;
    try {
      await navigator.clipboard.writeText(
        JSON.stringify(activeJsonPayload, null, 2)
      );
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 1800);
    } catch {
      // Clipboard blocked
    }
  };

  const formattedCurrency = (value: number, sigiloso = false) => {
    if (sigiloso) return 'Orçamento Sigiloso';
    if (!value || value <= 0) return 'Não informado';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="divide-y divide-[#1F2937]">
      {/* 1. Company Scope / CNAE Input & Execution Controls */}
      <div className="p-5 bg-[#0D131F] space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[#F9FAFB]">
              Etapa 1 — Triagem de Preâmbulo e Match de Escopo (CNAE)
            </h3>
            <p className="text-xs text-[#9CA3AF] mt-0.5">
              Extração factual do preâmbulo/objeto e cruzamento com o perfil de atuação antes da auditoria jurídica completa.
            </p>
          </div>

          {/* Triage Mode Toggle */}
          <div
            role="group"
            aria-label="Modo de triagem"
            className="inline-flex items-center rounded-md border border-[#1F2937] bg-[#090D16] p-1 shrink-0 self-start sm:self-auto"
          >
            <button
              type="button"
              onClick={() => onTriageModeChange('full')}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                triageMode === 'full'
                  ? 'bg-[#3B82F6]/20 text-[#F9FAFB]'
                  : 'text-[#9CA3AF] hover:text-[#F9FAFB]'
              }`}
            >
              Completa (12 campos)
            </button>
            <button
              type="button"
              onClick={() => onTriageModeChange('fast')}
              className={`inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                triageMode === 'fast'
                  ? 'bg-[#3B82F6]/20 text-[#F9FAFB]'
                  : 'text-[#9CA3AF] hover:text-[#F9FAFB]'
              }`}
            >
              <Zap className="h-3 w-3 text-[#3B82F6]" aria-hidden="true" />
              <span>Ultra-Rápida (2.5k chars)</span>
            </button>
          </div>
        </div>

        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label
              htmlFor="company-cnae-profile"
              className="text-xs font-semibold text-[#D1D5DB]"
            >
              Perfil da Empresa / CNAEs e Atividades de Interesse
            </label>
            <div className="flex flex-wrap items-center gap-1.5">
              {PROFILE_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => onCompanyProfileChange(preset.value)}
                  className="rounded border border-[#1F2937] bg-[#090D16] px-2.5 py-1 text-[11px] font-medium text-[#9CA3AF] hover:border-[#374151] hover:text-[#F9FAFB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <textarea
            id="company-cnae-profile"
            value={companyProfile}
            onChange={(e) => onCompanyProfileChange(e.target.value)}
            rows={3}
            placeholder="Informe os CNAEs, objeto social ou áreas de atuação da empresa para validar o match de escopo..."
            className="w-full resize-y rounded-md border border-[#1F2937] bg-[#090D16] p-3 text-xs leading-relaxed text-[#F9FAFB] placeholder:text-[#6B7280] focus:border-[#3B82F6] focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-[11px] text-[#9CA3AF]">
            {fileName
              ? `Documento: ${fileName} · Sem análise jurídica nesta etapa.`
              : 'Sem análise jurídica nesta etapa — apenas classificação factual.'}
          </span>
          <button
            type="button"
            disabled={!hasDocument || !companyProfile.trim() || isTriaging}
            onClick={onRunTriage}
            className="inline-flex items-center gap-2 rounded-md bg-[#3B82F6] px-4 py-2 text-xs font-semibold text-[#F9FAFB] transition-colors hover:bg-[#2563EB] disabled:opacity-45 disabled:cursor-not-allowed whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]"
          >
            {isTriaging ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                <span>Classificando preâmbulo...</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" aria-hidden="true" />
                <span>
                  {triageMode === 'fast'
                    ? 'Executar Triagem Ultra-Rápida'
                    : 'Executar Triagem (Etapa 1)'}
                </span>
              </>
            )}
          </button>
        </div>

        {triageError && (
          <div
            role="alert"
            className="rounded-md border border-[#EF4444]/40 bg-[#EF4444]/10 p-3 flex items-start gap-2.5"
          >
            <AlertOctagon
              className="h-4 w-4 text-[#EF4444] shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <p className="text-xs text-[#FCA5A5] leading-relaxed">{triageError}</p>
          </div>
        )}
      </div>

      {/* 2A. Fast Triage Output */}
      {triageMode === 'fast' && fastTriageResponse && (
        <div className="p-5 space-y-5">
          <div
            className={`rounded-md border p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${
              fastTriageResponse.data.match_escopo
                ? 'border-[#10B981]/40 bg-[#10B981]/10'
                : 'border-[#EF4444]/40 bg-[#EF4444]/10'
            }`}
          >
            <div className="flex items-start gap-3 min-w-0">
              {fastTriageResponse.data.match_escopo ? (
                <CheckCircle2
                  className="h-5 w-5 text-[#10B981] shrink-0 mt-0.5"
                  aria-hidden="true"
                />
              ) : (
                <XCircle
                  className="h-5 w-5 text-[#EF4444] shrink-0 mt-0.5"
                  aria-hidden="true"
                />
              )}
              <div className="min-w-0">
                <p
                  className={`text-xs font-semibold ${
                    fastTriageResponse.data.match_escopo
                      ? 'text-[#10B981]'
                      : 'text-[#EF4444]'
                  }`}
                >
                  {fastTriageResponse.data.match_escopo
                    ? 'Match Positivo (Triagem Ultra-Rápida)'
                    : 'Sem Aderência (Triagem Ultra-Rápida)'}
                </p>
                <p className="mt-1 text-xs text-[#F9FAFB] leading-relaxed">
                  {fastTriageResponse.data.objeto_resumido}
                </p>
              </div>
            </div>

            <span className="text-xs font-mono text-[#9CA3AF] tabular-nums shrink-0">
              {fastTriageResponse.elapsedMs} ms
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-md border border-[#1F2937] bg-[#090D16] p-3.5">
              <p className="text-[11px] font-medium text-[#9CA3AF]">UF</p>
              <p className="mt-1 text-xs font-mono font-semibold text-[#F9FAFB]">
                {fastTriageResponse.data.uf}
              </p>
            </div>
            <div className="rounded-md border border-[#1F2937] bg-[#090D16] p-3.5">
              <p className="text-[11px] font-medium text-[#9CA3AF]">Esfera</p>
              <p className="mt-1 text-xs font-mono font-semibold text-[#F9FAFB]">
                {ESFERA_LABELS[fastTriageResponse.data.esfera] ??
                  fastTriageResponse.data.esfera}
              </p>
            </div>
            <div className="rounded-md border border-[#1F2937] bg-[#090D16] p-3.5">
              <p className="text-[11px] font-medium text-[#9CA3AF]">
                Valor Estimado
              </p>
              <p className="mt-1 text-xs font-mono font-semibold text-[#F9FAFB] tabular-nums">
                {formattedCurrency(fastTriageResponse.data.valor_estimado)}
              </p>
            </div>
          </div>

          <div className="rounded-md border border-[#1F2937] bg-[#090D16] overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-[#1F2937] px-4 py-2.5">
              <span className="text-xs font-semibold text-[#D1D5DB]">
                Saída Estruturada (Step 1 Fast Schema · {fastTriageResponse.elapsedMs} ms)
              </span>
              <button
                type="button"
                onClick={handleCopyTriageJson}
                className="inline-flex items-center gap-1.5 rounded border border-[#1F2937] bg-[#111827] px-2.5 py-1 text-[11px] font-medium text-[#F9FAFB] hover:border-[#374151] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]"
              >
                {copiedJson ? (
                  <>
                    <Check className="h-3 w-3 text-[#10B981]" aria-hidden="true" />
                    <span className="text-[#10B981]">Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3 text-[#9CA3AF]" aria-hidden="true" />
                    <span>Copiar JSON</span>
                  </>
                )}
              </button>
            </div>
            <pre className="max-h-[260px] overflow-auto p-4 font-mono text-xs leading-relaxed text-[#D1D5DB]">
              {JSON.stringify(fastTriageResponse, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* 2B. Full Triage Output */}
      {triageMode === 'full' && triageResult && (
        <div className="p-5 space-y-5">
          {/* Match Verdict Banner */}
          <div
            className={`rounded-md border p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${
              triageResult.match_escopo
                ? 'border-[#10B981]/40 bg-[#10B981]/10'
                : 'border-[#EF4444]/40 bg-[#EF4444]/10'
            }`}
          >
            <div className="flex items-start gap-3 min-w-0">
              {triageResult.match_escopo ? (
                <CheckCircle2
                  className="h-5 w-5 text-[#10B981] shrink-0 mt-0.5"
                  aria-hidden="true"
                />
              ) : (
                <XCircle
                  className="h-5 w-5 text-[#EF4444] shrink-0 mt-0.5"
                  aria-hidden="true"
                />
              )}
              <div className="min-w-0">
                <p
                  className={`text-xs font-semibold ${
                    triageResult.match_escopo ? 'text-[#10B981]' : 'text-[#EF4444]'
                  }`}
                >
                  {triageResult.match_escopo
                    ? 'Match Positivo — Edital aderente ao escopo da empresa'
                    : 'Sem Aderência — Objeto fora do escopo/CNAE informado'}
                </p>
                <p className="mt-1 text-xs text-[#F9FAFB] leading-relaxed">
                  {triageResult.motivo_match}
                </p>
              </div>
            </div>

            {triageResult.tempo_execucao_segundos !== undefined && (
              <span className="text-xs font-mono text-[#9CA3AF] tabular-nums shrink-0">
                {triageResult.tempo_execucao_segundos}s
              </span>
            )}
          </div>

          {/* Factual Metadata Grid */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-md border border-[#1F2937] bg-[#090D16] p-3.5">
              <p className="text-[11px] font-medium text-[#9CA3AF]">
                Número do Edital
              </p>
              <p className="mt-1 text-xs font-mono font-semibold text-[#F9FAFB]">
                {triageResult.numero_edital || 'NAO_INFORMADO'}
              </p>
            </div>

            <div className="rounded-md border border-[#1F2937] bg-[#090D16] p-3.5 sm:col-span-2">
              <p className="text-[11px] font-medium text-[#9CA3AF]">
                Órgão Licitante
              </p>
              <p className="mt-1 text-xs font-semibold text-[#F9FAFB] flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-[#3B82F6] shrink-0" aria-hidden="true" />
                <span>{triageResult.orgao_licitante || 'NAO_INFORMADO'}</span>
              </p>
            </div>

            <div className="rounded-md border border-[#1F2937] bg-[#090D16] p-3.5">
              <p className="text-[11px] font-medium text-[#9CA3AF]">UF / Esfera</p>
              <p className="mt-1 text-xs font-mono font-semibold text-[#F9FAFB]">
                {triageResult.uf} · {ESFERA_LABELS[triageResult.esfera] ?? triageResult.esfera}
              </p>
            </div>

            <div className="rounded-md border border-[#1F2937] bg-[#090D16] p-3.5">
              <p className="text-[11px] font-medium text-[#9CA3AF]">
                Modalidade / Portal
              </p>
              <p className="mt-1 text-xs font-semibold text-[#F9FAFB]">
                {MODALIDADE_LABELS[triageResult.modalidade] ?? triageResult.modalidade}
                {triageResult.portal_disputa &&
                triageResult.portal_disputa !== 'NAO_INFORMADO'
                  ? ` · ${triageResult.portal_disputa}`
                  : ''}
              </p>
            </div>

            <div className="rounded-md border border-[#1F2937] bg-[#090D16] p-3.5">
              <p className="text-[11px] font-medium text-[#9CA3AF]">
                Valor Estimado / LC 123
              </p>
              <p className="mt-1 text-xs font-mono font-semibold text-[#F9FAFB] tabular-nums">
                {formattedCurrency(
                  triageResult.valor_estimado,
                  triageResult.valor_sigiloso
                )}
              </p>
              <p className="mt-0.5 text-[11px] text-[#9CA3AF]">
                Benefício ME/EPP:{' '}
                <span className="text-[#D1D5DB]">
                  {triageResult.beneficio_me_epp ? 'Sim (LC 123/2006)' : 'Não identificado'}
                </span>
              </p>
            </div>
          </div>

          {/* Summarized Object */}
          <div className="rounded-md border border-[#1F2937] bg-[#090D16] p-4">
            <p className="text-[11px] font-medium text-[#9CA3AF]">
              Objeto Resumido (Extração Factual)
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-[#F9FAFB]">
              {triageResult.objeto_resumido}
            </p>
          </div>

          {/* Structured JSON Payload */}
          <div className="rounded-md border border-[#1F2937] bg-[#090D16] overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-[#1F2937] px-4 py-2.5">
              <span className="text-xs font-semibold text-[#D1D5DB]">
                Saída Estruturada (Step 1 Triage Schema)
              </span>
              <button
                type="button"
                onClick={handleCopyTriageJson}
                className="inline-flex items-center gap-1.5 rounded border border-[#1F2937] bg-[#111827] px-2.5 py-1 text-[11px] font-medium text-[#F9FAFB] hover:border-[#374151] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]"
              >
                {copiedJson ? (
                  <>
                    <Check className="h-3 w-3 text-[#10B981]" aria-hidden="true" />
                    <span className="text-[#10B981]">Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3 text-[#9CA3AF]" aria-hidden="true" />
                    <span>Copiar JSON</span>
                  </>
                )}
              </button>
            </div>
            <pre className="max-h-[260px] overflow-auto p-4 font-mono text-xs leading-relaxed text-[#D1D5DB]">
              {JSON.stringify(triageResult, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* 2C. Empty State for Active Mode */}
      {!activeJsonPayload && (
        <div className="p-10 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-md border border-[#1F2937] bg-[#090D16]">
            <Filter className="h-5 w-5 text-[#3B82F6]" aria-hidden="true" />
          </div>
          <p className="text-sm font-semibold text-[#F9FAFB]">
            Triagem de escopo pronta para execução
          </p>
          <p className="mt-1 max-w-md mx-auto text-xs text-[#9CA3AF] leading-relaxed">
            {triageMode === 'fast'
              ? 'Modo ultra-rápido ativado: lê apenas os primeiros 2.500 caracteres do preâmbulo para retornar UF, esfera, valor estimado, resumo e match.'
              : 'Defina ou selecione o perfil CNAE acima e clique em Executar Triagem (Etapa 1) para extrair UF, esfera, modalidade, valor estimado e aderência ao escopo.'}
          </p>
        </div>
      )}
    </div>
  );
}
