import { AuditReport } from '../types/audit';
import {
  NormativeScope,
  runDeterministicAudit,
} from '../utils/cryptoAndAnalysis';

export interface GeminiAuditServiceInput {
  fileName: string;
  mimeType: 'application/pdf' | 'text/plain';
  base64Data?: string;
  textContent?: string;
  sha256: string;
  scope: NormativeScope;
  astSummary?: string;
  graphRagSummary?: string;
}

/**
 * SOA client-side service encapsulating calls to the server-side
 * @google/genai (gemini-2.5-flash) audit endpoint (/api/audit).
 */
export async function invokeGeminiAuditService(
  params: GeminiAuditServiceInput
): Promise<AuditReport> {
  const startMs = performance.now();

  const response = await fetch('/api/audit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const data = (await response.json()) as AuditReport & { error?: string };

  if (!response.ok) {
    throw new Error(
      data?.error || `Falha na auditoria pericial (HTTP ${response.status}).`
    );
  }

  const elapsedSeconds = Number(
    Math.max(0.1, (performance.now() - startMs) / 1000).toFixed(2)
  );

  return {
    ...data,
    sha256_documento: params.sha256,
    nome_arquivo: params.fileName,
    metricas_economia: {
      ...data.metricas_economia,
      tempo_execucao_segundos: elapsedSeconds,
    },
  };
}

/**
 * Deterministic compliance runner reserved for the 3 sidebar reference cases.
 */
export function invokeReferenceAuditService(params: {
  text: string;
  fileName: string;
  sha256: string;
  scope: NormativeScope;
}): AuditReport {
  return runDeterministicAudit(params);
}
