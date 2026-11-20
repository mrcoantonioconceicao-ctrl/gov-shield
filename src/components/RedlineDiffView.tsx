import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Check,
  Copy,
  Download,
  FileDiff,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import {
  applyRedlinePatches,
  formatRectifiedDownloadContent,
  RedlinePatchResult,
} from '../services/redlinePatchService';
import { AuditReport, RiskSeverity } from '../types/audit';

interface RedlineDiffViewProps {
  report: AuditReport;
  originalText: string;
}

const SEVERITY_COLOR: Record<RiskSeverity, string> = {
  CRITICO: 'text-[#EF4444]',
  ALTO: 'text-[#F59E0B]',
  MODERADO: 'text-[#3B82F6]',
};

export function RedlineDiffView({
  report,
  originalText,
}: RedlineDiffViewProps) {
  const [approvedIds, setApprovedIds] = useState<Set<string>>(
    () => new Set(report.achados.map((a) => a.id))
  );
  const [patchResult, setPatchResult] = useState<RedlinePatchResult | null>(null);
  const [copiedRectified, setCopiedRectified] = useState(false);

  // Reset approved selections when report changes
  useEffect(() => {
    setApprovedIds(new Set(report.achados.map((a) => a.id)));
  }, [report.sha256_documento, report.timestamp_auditoria, report.achados]);

  // Recompute deterministic patches and SHA-256 in real time
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await applyRedlinePatches({
        originalText,
        originalSha256: report.sha256_documento,
        findings: report.achados,
        approvedIds,
      });
      if (!cancelled) {
        setPatchResult(result);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [originalText, report.sha256_documento, report.achados, approvedIds]);

  const toggleFinding = (id: string) => {
    setApprovedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    setApprovedIds(new Set(report.achados.map((a) => a.id)));
  };

  const handleClearAll = () => {
    setApprovedIds(new Set());
  };

  const handleDownload = (format: 'txt' | 'md') => {
    if (!patchResult) return;
    const content = formatRectifiedDownloadContent(patchResult, report, format);
    const mime =
      format === 'md'
        ? 'text/markdown;charset=utf-8'
        : 'text/plain;charset=utf-8';
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const baseName = report.nome_arquivo.replace(/\.[^.]+$/, '');
    const link = document.createElement('a');
    link.href = url;
    link.download = `${baseName}_Retificado.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyRectified = async () => {
    if (!patchResult) return;
    try {
      await navigator.clipboard.writeText(patchResult.rectifiedText);
      setCopiedRectified(true);
      setTimeout(() => setCopiedRectified(false), 1800);
    } catch {
      // Clipboard blocked
    }
  };

  const activePatches = useMemo(
    () => patchResult?.patches.filter((p) => p.applied) ?? [],
    [patchResult]
  );

  if (report.achados.length === 0) {
    return (
      <div className="p-10 text-center">
        <p className="text-sm font-medium text-[#F9FAFB]">
          Nenhuma retificação pendente neste documento
        </p>
        <p className="mt-1 text-xs text-[#9CA3AF]">
          O relatório atual não possui apontamentos para aplicação de patches na minuta.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-[#1F2937]">
      {/* 1. Cryptographic Custody Chain of Rectification */}
      <div className="p-5 bg-[#0D131F] space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[#F9FAFB]">
              Cadeia de Custódia da Retificação (Pull Request Documental)
            </h3>
            <p className="text-xs text-[#9CA3AF] mt-0.5">
              Aplicação determinística e instantânea com recálculo criptográfico SHA-256 no navegador.
            </p>
          </div>

          {/* Human-in-the-Loop Governance Indicator */}
          <div className="inline-flex items-center gap-2 rounded-md border border-[#F59E0B]/40 bg-[#F59E0B]/10 px-3 py-1.5 text-xs font-medium text-[#F59E0B] shrink-0 self-start lg:self-auto">
            <UserCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>
              Aguardando Assinatura da Autoridade Competente (Human-in-the-Loop)
            </span>
          </div>
        </div>

        {/* SHA-256 Original -> Patches -> SHA-256 Retificado */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_auto_auto_auto_1fr] lg:items-center rounded-md border border-[#1F2937] bg-[#090D16] p-4">
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-[#9CA3AF]">
              SHA-256 Original
            </p>
            <code className="mt-1 block truncate font-mono text-xs text-[#D1D5DB] tabular-nums">
              {report.sha256_documento}
            </code>
          </div>

          <ArrowRight
            className="hidden lg:block h-4 w-4 text-[#4B5563]"
            aria-hidden="true"
          />

          <div className="px-0 lg:px-3">
            <p className="text-[11px] font-medium text-[#9CA3AF]">
              Cláusulas Saneadas
            </p>
            <p className="mt-1 font-mono text-sm font-semibold text-[#3B82F6] tabular-nums">
              {patchResult?.appliedCount ?? 0} / {report.achados.length} patches
            </p>
          </div>

          <ArrowRight
            className="hidden lg:block h-4 w-4 text-[#4B5563]"
            aria-hidden="true"
          />

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <ShieldCheck
                className="h-3.5 w-3.5 text-[#10B981] shrink-0"
                aria-hidden="true"
              />
              <p className="text-[11px] font-medium text-[#10B981]">
                Novo SHA-256 da Minuta Saneada
              </p>
            </div>
            <code className="mt-1 block truncate font-mono text-xs text-[#F9FAFB] tabular-nums">
              {patchResult?.rectifiedSha256 || report.sha256_documento}
            </code>
          </div>
        </div>

        {/* Download Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleSelectAll}
              className="rounded border border-[#1F2937] bg-[#090D16] px-2.5 py-1.5 text-xs font-medium text-[#D1D5DB] hover:border-[#374151] hover:text-[#F9FAFB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]"
            >
              Selecionar todas
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              className="rounded border border-[#1F2937] bg-[#090D16] px-2.5 py-1.5 text-xs font-medium text-[#9CA3AF] hover:border-[#374151] hover:text-[#F9FAFB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]"
            >
              Desmarcar todas
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleDownload('txt')}
              disabled={!patchResult}
              className="inline-flex items-center gap-1.5 rounded-md border border-[#1F2937] bg-[#090D16] px-3 py-1.5 text-xs font-medium text-[#F9FAFB] hover:border-[#374151] disabled:opacity-45 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]"
            >
              <Download className="h-3.5 w-3.5 text-[#3B82F6]" aria-hidden="true" />
              <span>Baixar Edital Retificado (.txt)</span>
            </button>
            <button
              type="button"
              onClick={() => handleDownload('md')}
              disabled={!patchResult}
              className="inline-flex items-center gap-1.5 rounded-md bg-[#3B82F6] px-3 py-1.5 text-xs font-semibold text-[#F9FAFB] hover:bg-[#2563EB] disabled:opacity-45 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]"
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Baixar Edital Retificado (.md)</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Checkboxes & Redline Diff Blocks (Before vs After) */}
      <div className="p-5 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <FileDiff className="h-4 w-4 text-[#3B82F6]" aria-hidden="true" />
            <h4 className="text-sm font-semibold text-[#F9FAFB]">
              Revisão de Correções (Antes vs. Depois)
            </h4>
          </div>
          <span className="text-xs font-mono text-[#9CA3AF] tabular-nums">
            {activePatches.length} patch(es) ativo(s)
          </span>
        </div>

        <div className="divide-y divide-[#1F2937] rounded-md border border-[#1F2937] bg-[#090D16]">
          {(patchResult?.patches ?? []).map((item) => {
            const { finding, applied, matchStrategy, beforeText, afterText } = item;
            return (
              <div key={finding.id} className="p-4 space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={applied}
                    onChange={() => toggleFinding(finding.id)}
                    className="mt-0.5 h-4 w-4 rounded border-[#374151] bg-[#111827] accent-[#3B82F6] shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                      <span
                        className={`font-semibold ${SEVERITY_COLOR[finding.severidade]}`}
                      >
                        {finding.severidade}
                      </span>
                      <span className="text-[#4B5563]" aria-hidden="true">
                        ·
                      </span>
                      <span className="font-mono text-[#9CA3AF]">
                        {finding.regra_id}
                      </span>
                      <span className="text-[#4B5563]" aria-hidden="true">
                        ·
                      </span>
                      <span className="font-mono text-[11px] text-[#3B82F6]">
                        {matchStrategy === 'INLINE_REPLACE'
                          ? 'Substituição Direta'
                          : 'Adendo de Retificação'}
                      </span>
                    </div>
                    <p className="mt-1 text-xs sm:text-sm font-semibold text-[#F9FAFB]">
                      {finding.titulo}
                    </p>
                  </div>
                </label>

                {applied ? (
                  <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 pl-7">
                    <div className="rounded-md border border-[#EF4444]/30 bg-[#EF4444]/10 p-3">
                      <p className="text-[11px] font-mono font-semibold text-[#EF4444] mb-1.5">
                        - Trecho Original (Removido)
                      </p>
                      <p className="font-mono text-xs leading-relaxed text-[#FCA5A5] line-through">
                        {beforeText}
                      </p>
                    </div>
                    <div className="rounded-md border border-[#10B981]/30 bg-[#10B981]/10 p-3">
                      <p className="text-[11px] font-mono font-semibold text-[#10B981] mb-1.5">
                        + Redação Saneada (Aplicada)
                      </p>
                      <p className="font-mono text-xs leading-relaxed text-[#D1FAE5]">
                        {afterText}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="pl-7 text-xs font-mono text-[#6B7280]">
                    Patch desmarcado — redação original preservada na minuta consolidada.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Full Consolidated Rectified Text */}
      <div className="p-5 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-semibold text-[#F9FAFB]">
              Texto Consolidado da Minuta Retificada
            </h4>
            <p className="text-xs text-[#9CA3AF]">
              Documento completo resultante após aplicação dos patches selecionados.
            </p>
          </div>
          <button
            type="button"
            onClick={handleCopyRectified}
            disabled={!patchResult}
            className="inline-flex items-center gap-1.5 rounded-md border border-[#1F2937] bg-[#090D16] px-3 py-1.5 text-xs font-medium text-[#F9FAFB] hover:border-[#374151] disabled:opacity-45 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]"
          >
            {copiedRectified ? (
              <>
                <Check className="h-3.5 w-3.5 text-[#10B981]" aria-hidden="true" />
                <span className="text-[#10B981]">Minuta copiada!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-[#9CA3AF]" aria-hidden="true" />
                <span>Copiar Minuta Completa</span>
              </>
            )}
          </button>
        </div>

        <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap rounded-md border border-[#1F2937] bg-[#090D16] p-4 font-mono text-xs leading-relaxed text-[#D1D5DB]">
          {patchResult?.rectifiedText || originalText}
        </pre>
      </div>
    </div>
  );
}
