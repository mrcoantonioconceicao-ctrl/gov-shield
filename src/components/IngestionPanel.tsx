import React, { useRef, useState } from 'react';
import {
  Check,
  Copy,
  FileText,
  Play,
  RotateCcw,
  ShieldCheck,
  Upload,
} from 'lucide-react';
import { NormativeScope, SAMPLE_EDITAIS, SampleEdital } from '../utils/cryptoAndAnalysis';

interface IngestionPanelProps {
  fileName: string;
  documentText: string;
  isPdfLoaded: boolean;
  sha256: string;
  fileSizeBytes: number;
  selectedSampleId: string | null;
  scope: NormativeScope;
  isAuditing: boolean;
  onSelectSample: (sample: SampleEdital) => void;
  onFileUpload: (file: File) => Promise<void>;
  onTextChange: (text: string) => void;
  onScopeChange: (nextScope: NormativeScope) => void;
  onRunAudit: () => void;
  onReset: () => void;
}

export function IngestionPanel({
  fileName,
  documentText,
  isPdfLoaded,
  sha256,
  fileSizeBytes,
  selectedSampleId,
  scope,
  isAuditing,
  onSelectSample,
  onFileUpload,
  onTextChange,
  onScopeChange,
  onRunAudit,
  onReset,
}: IngestionPanelProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    setUploadError(null);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    try {
      await onFileUpload(file);
    } catch {
      setUploadError('Falha ao ler o arquivo selecionado. Tente formato .txt, .md ou .pdf.');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await onFileUpload(file);
    } catch {
      setUploadError('Não foi possível processar o arquivo selecionado.');
    }
    e.target.value = '';
  };

  const handleCopyHash = async () => {
    if (!sha256) return;
    try {
      await navigator.clipboard.writeText(sha256);
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 1800);
    } catch {
      // Clipboard blocked in restricted context
    }
  };

  const formattedSize =
    fileSizeBytes > 1024
      ? `${(fileSizeBytes / 1024).toFixed(1)} KB`
      : `${fileSizeBytes} B`;

  const hasText = documentText.trim().length > 0;
  const anyScopeEnabled = scope.lei14133 || scope.tcesc || scope.lgpd;

  return (
    <aside
      aria-label="Painel de ingestão documental"
      className="w-full lg:w-[380px] shrink-0 rounded-lg border border-[#1F2937] bg-[#111827] flex flex-col"
    >
      {/* Section 01: Document Ingestion */}
      <div className="p-5 border-b border-[#1F2937]">
        <div className="flex items-center justify-between gap-2 mb-3">
          <h2 className="text-sm font-semibold text-[#F9FAFB]">
            01. Ingestão Documental
          </h2>
          <span className="text-xs font-mono text-[#9CA3AF] tabular-nums">
            {hasText ? `${documentText.length} chars` : 'Aguardando'}
          </span>
        </div>

        <div
          role="button"
          tabIndex={0}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`cursor-pointer rounded-md border border-dashed p-4 text-center transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6] ${
            isDragging
              ? 'border-[#3B82F6] bg-[#3B82F6]/10'
              : 'border-[#374151] bg-[#090D16]/70 hover:border-[#3B82F6]/70'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt,.md,.csv,.json,.html"
            onChange={handleFileChange}
            className="sr-only"
            aria-label="Selecionar arquivo de edital ou contrato"
          />
          <Upload
            className="mx-auto mb-2 h-5 w-5 text-[#3B82F6]"
            aria-hidden="true"
          />
          <p className="text-xs font-medium text-[#F9FAFB]">
            Arraste o edital ou clique para selecionar
          </p>
          <p className="mt-1 text-[11px] text-[#9CA3AF]">
            Leitura nativa de PDF, TXT, MD e CSV via motor Gemini 2.5
          </p>
        </div>

        {uploadError && (
          <p className="mt-2 text-xs text-[#EF4444]" role="alert">
            {uploadError}
          </p>
        )}

        {/* Active file indicator */}
        {fileName && (
          <div className="mt-3 flex items-center justify-between gap-2 rounded-md border border-[#1F2937] bg-[#090D16] px-3 py-2">
            <div className="flex items-center gap-2 min-w-0">
              <FileText
                className="h-4 w-4 text-[#3B82F6] shrink-0"
                aria-hidden="true"
              />
              <span className="truncate text-xs font-mono text-[#F9FAFB]">
                {fileName}
              </span>
            </div>
            <span className="text-[11px] font-mono text-[#9CA3AF] tabular-nums shrink-0">
              {isPdfLoaded ? `PDF · ${formattedSize}` : formattedSize}
            </span>
          </div>
        )}
      </div>

      {/* Section 02: Quick Reference Cases */}
      <div className="p-5 border-b border-[#1F2937]">
        <h3 className="text-xs font-semibold text-[#9CA3AF] mb-2.5">
          02. Editais de Referência (Demonstração)
        </h3>
        <div className="space-y-1.5">
          {SAMPLE_EDITAIS.map((sample) => {
            const isSelected = selectedSampleId === sample.id;
            return (
              <button
                key={sample.id}
                type="button"
                onClick={() => onSelectSample(sample)}
                className={`w-full text-left rounded-md border px-3 py-2.5 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6] ${
                  isSelected
                    ? 'border-[#3B82F6] bg-[#3B82F6]/10'
                    : 'border-[#1F2937] bg-[#090D16]/60 hover:border-[#374151]'
                }`}
              >
                <div className="text-xs font-semibold text-[#F9FAFB] truncate">
                  {sample.titulo}
                </div>
                <div className="mt-0.5 text-[11px] text-[#9CA3AF] truncate">
                  {sample.subtitulo}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Section 03: SHA-256 Chain of Custody */}
      <div className="p-5 border-b border-[#1F2937]">
        <div className="flex items-center justify-between gap-2 mb-2">
          <h3 className="text-xs font-semibold text-[#9CA3AF]">
            03. Cadeia de Custódia (SHA-256)
          </h3>
          {sha256 ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#10B981]">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Íntegro</span>
            </span>
          ) : (
            <span className="text-[11px] text-[#9CA3AF]">Sem documento</span>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 rounded-md border border-[#1F2937] bg-[#090D16] px-3 py-2">
          <code className="truncate text-[11px] font-mono text-[#9CA3AF] tabular-nums">
            {sha256 || '0000000000000000000000000000000000000000000000000000000000000000'}
          </code>
          <button
            type="button"
            disabled={!sha256}
            onClick={handleCopyHash}
            title="Copiar hash SHA-256"
            className="shrink-0 rounded p-1 text-[#9CA3AF] hover:text-[#F9FAFB] disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]"
          >
            {copiedHash ? (
              <Check className="h-3.5 w-3.5 text-[#10B981]" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Section 04: Normative Scope & Raw Text */}
      <div className="p-5 flex-1 flex flex-col gap-4">
        <div>
          <h3 className="text-xs font-semibold text-[#9CA3AF] mb-2.5">
            04. Escopo Normativo Ativo
          </h3>
          <div className="space-y-2">
            <label className="flex items-center gap-2.5 cursor-pointer text-xs text-[#F9FAFB]">
              <input
                type="checkbox"
                checked={scope.lei14133}
                onChange={(e) =>
                  onScopeChange({ ...scope, lei14133: e.target.checked })
                }
                className="h-4 w-4 rounded border-[#374151] bg-[#090D16] accent-[#3B82F6]"
              />
              <span>Lei nº 14.133/2021 (Nova Lei de Licitações)</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer text-xs text-[#F9FAFB]">
              <input
                type="checkbox"
                checked={scope.tcesc}
                onChange={(e) =>
                  onScopeChange({ ...scope, tcesc: e.target.checked })
                }
                className="h-4 w-4 rounded border-[#374151] bg-[#090D16] accent-[#3B82F6]"
              />
              <span>Jurisprudência e Prejulgados TCE/SC</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer text-xs text-[#F9FAFB]">
              <input
                type="checkbox"
                checked={scope.lgpd}
                onChange={(e) =>
                  onScopeChange({ ...scope, lgpd: e.target.checked })
                }
                className="h-4 w-4 rounded border-[#374151] bg-[#090D16] accent-[#3B82F6]"
              />
              <span>LGPD (Lei nº 13.709/2018) e Cibersegurança</span>
            </label>
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between gap-2 mb-2">
            <label
              htmlFor="edital-raw-text"
              className="text-xs font-semibold text-[#9CA3AF]"
            >
              {isPdfLoaded ? 'Documento PDF Vinculado' : 'Minuta ou Cláusulas Extraídas'}
            </label>
            {isPdfLoaded && (
              <span className="text-[11px] font-mono text-[#3B82F6]">
                Envio integral Base64
              </span>
            )}
          </div>
          <textarea
            id="edital-raw-text"
            value={documentText}
            readOnly={isPdfLoaded}
            onChange={(e) => onTextChange(e.target.value)}
            rows={7}
            placeholder="Cole aqui o texto integral ou cláusulas do edital/contrato administrativo para inspeção imediata..."
            className="w-full flex-1 resize-y rounded-md border border-[#1F2937] bg-[#090D16] p-3 font-mono text-[11px] leading-relaxed text-[#F9FAFB] placeholder:text-[#6B7280] focus:border-[#3B82F6] focus:outline-none read-only:text-[#9CA3AF]"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2.5 pt-1">
          <button
            type="button"
            disabled={(!hasText && !isPdfLoaded) || !anyScopeEnabled || isAuditing}
            onClick={onRunAudit}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-md bg-[#3B82F6] px-4 py-2.5 text-xs font-semibold text-[#F9FAFB] transition-colors duration-150 hover:bg-[#2563EB] disabled:opacity-45 disabled:cursor-not-allowed whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]"
          >
            <Play className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>
              {isAuditing ? 'Auditando com Gemini 2.5...' : 'Executar Auditoria Pericial'}
            </span>
          </button>
          <button
            type="button"
            onClick={onReset}
            title="Limpar documento e reiniciar"
            className="inline-flex items-center justify-center rounded-md border border-[#1F2937] bg-[#090D16] px-3 py-2.5 text-xs font-medium text-[#9CA3AF] transition-colors duration-150 hover:border-[#374151] hover:text-[#F9FAFB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </aside>
  );
}
