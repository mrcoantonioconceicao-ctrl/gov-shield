import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import type { Schema } from '@google/genai';
import type { Step1FastTriageResult } from '../types/triage.ts';

export const STEP1_FAST_SYSTEM = `
Classifique o edital em relação ao escopo da empresa. Responda apenas com fatos explícitos no texto.
Se faltar informação, use "NAO_INFORMADO" ou 0. Não faça análise jurídica.
`.trim();

export const step1FastSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    uf: { type: Type.STRING },
    esfera: {
      type: Type.STRING,
      enum: ['FEDERAL', 'ESTADUAL', 'MUNICIPAL', 'NAO_INFORMADO'],
    },
    valor_estimado: { type: Type.NUMBER },
    objeto_resumido: { type: Type.STRING },
    match_escopo: { type: Type.BOOLEAN },
  },
  required: ['uf', 'esfera', 'valor_estimado', 'objeto_resumido', 'match_escopo'],
};

export function parseJsonSafely<T>(rawText: string): T {
  const cleaned = rawText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  if (!cleaned) {
    throw new Error('Resposta vazia recebida da API.');
  }

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    throw new Error(
      `Resposta não é um JSON válido. Início recebido: ${cleaned.slice(0, 140)}`
    );
  }
}

export async function runStep1TriageFast(
  ai: GoogleGenAI,
  textoEdital: string,
  escopoEmpresa: string,
  model = 'gemini-4-hydrogen'
): Promise<{ data: Step1FastTriageResult; elapsedMs: number }> {
  const trechoCurto = textoEdital.slice(0, 2500);
  const t0 = performance.now();

  const res = await ai.models.generateContent({
    model,
    contents: `ESCOPO DA EMPRESA:\n${escopoEmpresa}\n\nTRECHO DO EDITAL:\n${trechoCurto}`,
    config: {
      systemInstruction: STEP1_FAST_SYSTEM,
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      responseMimeType: 'application/json',
      responseSchema: step1FastSchema,
    },
  });

  const elapsedMs = Math.round(performance.now() - t0);
  const rawText = typeof res.text === 'string' ? res.text : '';
  const data = parseJsonSafely<Step1FastTriageResult>(rawText);

  return { data, elapsedMs };
}

export async function runStep1TriageFastPdf(
  ai: GoogleGenAI,
  base64Pdf: string,
  escopoEmpresa: string,
  model = 'gemini-4-hydrogen'
): Promise<{ data: Step1FastTriageResult; elapsedMs: number }> {
  const t0 = performance.now();

  const res = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        {
          inlineData: {
            data: base64Pdf,
            mimeType: 'application/pdf',
          },
        },
        {
          text: `ESCOPO DA EMPRESA:\n${escopoEmpresa}\n\nClassifique rapidamente o preâmbulo e o objeto deste edital em PDF.`,
        },
      ],
    },
    config: {
      systemInstruction: STEP1_FAST_SYSTEM,
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      responseMimeType: 'application/json',
      responseSchema: step1FastSchema,
    },
  });

  const elapsedMs = Math.round(performance.now() - t0);
  const rawText = typeof res.text === 'string' ? res.text : '';
  const data = parseJsonSafely<Step1FastTriageResult>(rawText);

  return { data, elapsedMs };
}
