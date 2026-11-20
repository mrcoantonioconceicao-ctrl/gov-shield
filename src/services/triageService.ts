import {
  Step1FastTriageResponse,
  Step1TriageResult,
} from '../types/triage';

export interface Step1TriageServiceInput {
  fileName: string;
  mimeType: 'application/pdf' | 'text/plain';
  base64Data?: string;
  textContent?: string;
  companyProfile: string;
}

/**
 * SOA client-side service calling POST /api/triage (Etapa 1: Triagem Completa).
 */
export async function invokeStep1TriageService(
  params: Step1TriageServiceInput
): Promise<Step1TriageResult> {
  const response = await fetch('/api/triage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const data = (await response.json()) as Step1TriageResult & { error?: string };

  if (!response.ok) {
    throw new Error(
      data?.error || `Falha na triagem do edital (HTTP ${response.status}).`
    );
  }

  return data;
}

/**
 * SOA client-side service calling POST /api/triage/fast (Etapa 1: Triagem Ultra-Rápida).
 */
export async function invokeStep1TriageFastService(
  params: Step1TriageServiceInput
): Promise<Step1FastTriageResponse> {
  const response = await fetch('/api/triage/fast', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const data = (await response.json()) as Step1FastTriageResponse & {
    error?: string;
  };

  if (!response.ok) {
    throw new Error(
      data?.error || `Falha na triagem rápida do edital (HTTP ${response.status}).`
    );
  }

  return data;
}
