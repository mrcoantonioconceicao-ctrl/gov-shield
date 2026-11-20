import { useState } from 'react';
import {
  AlertOctagon,
  Check,
  Copy,
  FileSearch,
  Loader2,
  Play,
  ShieldAlert,
} from 'lucide-react';
import { BarreiraTipo, Step2ExtractorResult } from '../types/extractor';

interface Step2ExtractorViewProps {
  fileName: string;
  hasDocument: boolean;
  extractorResult: Step2ExtractorResult | null;
  isExtracting: boolean;
  extractorError: string | null;
  onRunExtraction: () => void;
}

const BARREIRA_LABELS: Record<BarreiraTipo, string> = {
  INDICACAO_MARCA: 'Indicação de Marca',
  RESTRICAO_GEOGRAFICA_SEDE: 'Restrição Geográfica / Sede',
  VISTORIA_PRESENCIAL: 'Vistoria Presencial',
  PRAZO_ENTREGA_IMPLANTACAO: 'Prazo de Entrega / Implantação',
  AGLUTINACAO_LOTE_UNICO: 'Aglutinação em Lote Único',
  EXIGENCIA_LGPD_CIBER: 'Exigência LGPD / Cibersegurança',
  OUTRA_BARREIRA: 'Outra Barreira Operacional',
};

const SOMATORIO_LABELS: Record<string, string> = {
  SIM: 'Permitido',
  NAO: 'Vedado',
  OMISSO: 'Omisso no edital',
};

export function Step2ExtractorView({
  fileName,
  hasDocument,
  extractorResult,
  isExtracting,
  extractorError,
  onRunExtraction,
}: Step2ExtractorViewProps) {
  const [copiedJson, setCopiedJson] = useState(false);

  const handleCopyJson = async () => {
    if (!extractorResult) return;
    try {
      await navigator.clipboard.writeText(
        JSON.stringify(extractorResult, null, 2)
      );
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 1800);
    } catch {
      // Clipboard blocked
    }
  };

  const formattedCurrency = (value: number) => {
    if (!value || value <= 0) return 'Não expresso em R$';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="divide-y divide-[#1F2937]">
      {/* 1. Extraction Header & Action */}
      <div className="p-5 bg-[#0D131F] space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[#F9FAFB]">
              Etapa 2 — Extrator Documental Forense (Habilitação e Barreiras)
            </h3>
            <p className="text-xs text-[#9CA3AF] mt-0.5">
              Transcrição literal (ipsissima verba) de requisitos técnicos, econômico-financeiros e restrições operacionais, sem juízo jurídico.
            </p>
          </div>

          <button
            type="button"
            disabled={!hasDocument || isExtracting}
            onClick={onRunExtraction}
            className="inline-flex items-center gap-2 rounded-md bg-[#3B82F6] px-4 py-2 text-xs font-semibold text-[#F9FAFB] transition-colors hover:bg-[#2563EB] disabled:opacity-45 disabled:cursor-not-allowed whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]"
          >
            {isExtracting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                <span>Extraindo cláusulas...</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Executar Extração (Etapa 2)</span>
              </>
            )}
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#9CA3AF]">
          <span>
            Documento alvo:{' '}
            <code className="font-mono text-[#D1D5DB]">
              {fileName || 'Nenhum documento selecionado'}
            </code>
          </span>
          {extractorResult?.tempo_execucao_segundos !== undefined && (
            <span className="font-mono tabular-nums">
              Tempo de extração: {extractorResult.tempo_execucao_segundos}s
            </span>
          )}
        </div>

        {extractorError && (
          <div
            role="alert"
            className="rounded-md border border-[#EF4444]/40 bg-[#EF4444]/10 p-3 flex items-start gap-2.5"
          >
            <AlertOctagon
              className="h-4 w-4 text-[#EF4444] shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <p className="text-xs text-[#FCA5A5] leading-relaxed">
              {extractorError}
            </p>
          </div>
        )}
      </div>

      {/* 2. Extraction Results */}
      {!extractorResult ? (
        <div className="p-10 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-md border border-[#1F2937] bg-[#090D16]">
            <FileSearch className="h-5 w-5 text-[#3B82F6]" aria-hidden="true" />
          </div>
          <p className="text-sm font-semibold text-[#F9FAFB]">
            Extrator forense pronto para varredura literal
          </p>
          <p className="mt-1 max-w-md mx-auto text-xs text-[#9CA3AF] leading-relaxed">
            Clique em <strong>Executar Extração (Etapa 2)</strong> para localizar e transcrever atestados, capital social, índices contábeis e barreiras operacionais do edital ativo.
          </p>
        </div>
      ) : (
        <div className="p-5 space-y-6">
          {/* A. Qualificação Técnica */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-[#F9FAFB]">
              1. Qualificação Técnica Extraída
            </h4>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-md border border-[#1F2937] bg-[#090D16] p-3.5">
                <p className="text-[11px] font-medium text-[#9CA3AF]">
                  Atestado de Capacidade
                </p>
                <p className="mt-1 text-xs font-mono font-semibold text-[#F9FAFB]">
                  {extractorResult.qualificacao_tecnica.exige_atestado_capacidade
                    ? 'Exigido'
                    : 'Não exigido'}
                </p>
              </div>

              <div className="rounded-md border border-[#1F2937] bg-[#090D16] p-3.5">
                <p className="text-[11px] font-medium text-[#9CA3AF]">
                  Percentual Mínimo
                </p>
                <p className="mt-1 text-xs font-mono font-semibold text-[#F9FAFB] tabular-nums">
                  {extractorResult.qualificacao_tecnica.percentual_minimo_exigido > 0
                    ? `${extractorResult.qualificacao_tecnica.percentual_minimo_exigido}%`
                    : 'Não especificado'}
                </p>
              </div>

              <div className="rounded-md border border-[#1F2937] bg-[#090D16] p-3.5">
                <p className="text-[11px] font-medium text-[#9CA3AF]">
                  Somatório de Atestados
                </p>
                <p className="mt-1 text-xs font-mono font-semibold text-[#F9FAFB]">
                  {SOMATORIO_LABELS[
                    extractorResult.qualificacao_tecnica.permite_somatorio_atestados
                  ] ??
                    extractorResult.qualificacao_tecnica.permite_somatorio_atestados}
                </p>
              </div>

              <div className="rounded-md border border-[#1F2937] bg-[#090D16] p-3.5">
                <p className="text-[11px] font-medium text-[#9CA3AF]">
                  Vínculo Prévio de Equipe
                </p>
                <p className="mt-1 text-xs font-mono font-semibold text-[#F9FAFB]">
                  {extractorResult.qualificacao_tecnica.exige_vinculo_previo_equipe
                    ? 'Sim (Exigido no edital)'
                    : 'Não exigido'}
                </p>
              </div>
            </div>

            {extractorResult.qualificacao_tecnica.exige_certificacoes_especificas
              .length > 0 && (
              <div className="rounded-md border border-[#1F2937] bg-[#090D16] p-3.5">
                <p className="text-[11px] font-medium text-[#9CA3AF]">
                  Certificações / Registros Específicos
                </p>
                <p className="mt-1 text-xs font-mono text-[#F9FAFB]">
                  {extractorResult.qualificacao_tecnica.exige_certificacoes_especificas.join(
                    ' · '
                  )}
                </p>
              </div>
            )}

            {extractorResult.qualificacao_tecnica.exigencias_tecnicas_detalhadas
              .length > 0 && (
              <div className="divide-y divide-[#1F2937] rounded-md border border-[#1F2937] bg-[#090D16]">
                {extractorResult.qualificacao_tecnica.exigencias_tecnicas_detalhadas.map(
                  (item, idx) => (
                    <div key={`${item.clausula}-${idx}`} className="p-4 space-y-2">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                        <span className="font-mono font-semibold text-[#3B82F6]">
                          {item.clausula}
                        </span>
                        <span className="text-[#4B5563]" aria-hidden="true">
                          ·
                        </span>
                        <span className="font-medium text-[#F9FAFB]">
                          {item.descricao_objetiva}
                        </span>
                      </div>
                      <blockquote className="rounded border border-[#1F2937] bg-[#111827] p-3 font-mono text-xs leading-relaxed text-[#D1D5DB]">
                        “{item.trecho_literal}”
                      </blockquote>
                    </div>
                  )
                )}
              </div>
            )}
          </div>

          {/* B. Qualificação Econômico-Financeira */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-[#F9FAFB]">
              2. Qualificação Econômico-Financeira
            </h4>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-md border border-[#1F2937] bg-[#090D16] p-3.5">
                <p className="text-[11px] font-medium text-[#9CA3AF]">
                  Capital / Patrimônio Líquido
                </p>
                <p className="mt-1 text-xs font-mono font-semibold text-[#F9FAFB] tabular-nums">
                  {extractorResult.qualificacao_economica
                    .exige_capital_ou_patrimonio
                    ? extractorResult.qualificacao_economica.percentual_exigido > 0
                      ? `Sim (${extractorResult.qualificacao_economica.percentual_exigido}%)`
                      : 'Sim'
                    : 'Não exigido'}
                </p>
              </div>

              <div className="rounded-md border border-[#1F2937] bg-[#090D16] p-3.5">
                <p className="text-[11px] font-medium text-[#9CA3AF]">
                  Valor Mínimo Expresso
                </p>
                <p className="mt-1 text-xs font-mono font-semibold text-[#F9FAFB] tabular-nums">
                  {formattedCurrency(
                    extractorResult.qualificacao_economica.valor_minimo_reais
                  )}
                </p>
              </div>

              <div className="rounded-md border border-[#1F2937] bg-[#090D16] p-3.5">
                <p className="text-[11px] font-medium text-[#9CA3AF]">
                  Índices Contábeis
                </p>
                <p className="mt-1 text-xs font-mono text-[#F9FAFB]">
                  {extractorResult.qualificacao_economica
                    .indices_contabeis_exigidos || 'Não especificados'}
                </p>
              </div>

              <div className="rounded-md border border-[#1F2937] bg-[#090D16] p-3.5">
                <p className="text-[11px] font-medium text-[#9CA3AF]">
                  Garantia de Proposta (Art. 58)
                </p>
                <p className="mt-1 text-xs font-mono font-semibold text-[#F9FAFB]">
                  {extractorResult.qualificacao_economica.exige_garantia_proposta
                    ? 'Exigida'
                    : 'Não exigida'}
                </p>
              </div>
            </div>

            {extractorResult.qualificacao_economica.trecho_literal && (
              <blockquote className="rounded-md border border-[#1F2937] bg-[#090D16] p-3.5 font-mono text-xs leading-relaxed text-[#D1D5DB]">
                “{extractorResult.qualificacao_economica.trecho_literal}”
              </blockquote>
            )}
          </div>

          {/* C. Barreiras Operacionais e Restrições */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-xs font-semibold text-[#F9FAFB]">
                3. Barreiras Operacionais e Restrições Literais
              </h4>
              <span className="text-xs font-mono text-[#9CA3AF] tabular-nums">
                {extractorResult.barreiras_operacionais_e_restricoes.length}{' '}
                registro(s)
              </span>
            </div>

            {extractorResult.barreiras_operacionais_e_restricoes.length === 0 ? (
              <div className="rounded-md border border-[#1F2937] bg-[#090D16] p-4 text-xs text-[#9CA3AF]">
                Nenhuma barreira operacional ou restrição específica detectada no texto submetido.
              </div>
            ) : (
              <div className="divide-y divide-[#1F2937] rounded-md border border-[#1F2937] bg-[#090D16]">
                {extractorResult.barreiras_operacionais_e_restricoes.map(
                  (barreira, idx) => (
                    <div
                      key={`${barreira.tipo}-${barreira.clausula}-${idx}`}
                      className="p-4 space-y-2"
                    >
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                        <ShieldAlert
                          className="h-3.5 w-3.5 text-[#F59E0B] shrink-0"
                          aria-hidden="true"
                        />
                        <span className="font-semibold text-[#F59E0B]">
                          {BARREIRA_LABELS[barreira.tipo] ?? barreira.tipo}
                        </span>
                        <span className="text-[#4B5563]" aria-hidden="true">
                          ·
                        </span>
                        <span className="font-mono text-[#3B82F6]">
                          {barreira.clausula}
                        </span>
                        <span className="text-[#4B5563]" aria-hidden="true">
                          ·
                        </span>
                        <span className="font-mono text-[#D1D5DB]">
                          {barreira.valor_ou_prazo}
                        </span>
                      </div>
                      <blockquote className="rounded border border-[#1F2937] bg-[#111827] p-3 font-mono text-xs leading-relaxed text-[#D1D5DB]">
                        “{barreira.trecho_literal}”
                      </blockquote>
                    </div>
                  )
                )}
              </div>
            )}
          </div>

          {/* D. Structured JSON Payload */}
          <div className="rounded-md border border-[#1F2937] bg-[#090D16] overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-[#1F2937] px-4 py-2.5">
              <span className="text-xs font-semibold text-[#D1D5DB]">
                Saída Estruturada (Step 2 Extractor Schema)
              </span>
              <button
                type="button"
                onClick={handleCopyJson}
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
              {JSON.stringify(extractorResult, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
