import { Step2ExtractorResult } from '../types/extractor';

export interface Step2ExtractorServiceInput {
  fileName: string;
  mimeType: 'application/pdf' | 'text/plain';
  base64Data?: string;
  textContent?: string;
}

/**
 * SOA client-side service calling POST /api/extract (Etapa 2: Extrator Documental Forense).
 */
export async function invokeStep2ExtractorService(
  params: Step2ExtractorServiceInput
): Promise<Step2ExtractorResult> {
  const response = await fetch('/api/extract', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const data = (await response.json()) as Step2ExtractorResult & { error?: string };

  if (!response.ok) {
    throw new Error(
      data?.error || `Falha na extração forense do edital (HTTP ${response.status}).`
    );
  }

  return data;
}
