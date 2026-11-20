import { Type } from '@google/genai';
import type { Schema } from '@google/genai';

export const STEP1_TRIAGE_SYSTEM_INSTRUCTION = `
Você é um classificador pericial de licitações públicas brasileiras (Lei nº 14.133/2021).
Sua única tarefa é ler o preâmbulo/objeto do edital e cruzar com o escopo de atuação da empresa.

REGRAS ESTRITAS:
1. Extraia apenas fatos explícitos no texto. Se um dado não constar, retorne null ou "NAO_INFORMADO".
2. Identifique a UF (sigla de 2 letras) do órgão licitante. Se for órgão federal (Ministério, Autarquia Federal, Universidade Federal, etc.), defina esfera="FEDERAL" e mantenha a UF de execução/sede.
3. Avalie "match_escopo" como true SOMENTE se o objeto da licitação tiver aderência direta aos CNAEs ou atividades informadas no perfil da empresa. Na dúvida, marque true para evitar falso descarte.
4. Não faça análise jurídica nesta etapa.
`.trim();

export const step1TriageResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    numero_edital: {
      type: Type.STRING,
      description: 'Ex: Pregão Eletrônico nº 045/2026',
    },
    orgao_licitante: { type: Type.STRING },
    uf: {
      type: Type.STRING,
      description: 'Sigla do estado (ex: SC, PR, SP, DF) ou BR',
    },
    esfera: {
      type: Type.STRING,
      enum: ['FEDERAL', 'ESTADUAL', 'MUNICIPAL', 'CONSORCIO_PUBLICO'],
    },
    modalidade: {
      type: Type.STRING,
      enum: [
        'PREGAO_ELETRONICO',
        'CONCORRENCIA',
        'DISPENSA',
        'INEXIGIBILIDADE',
        'OUTRA',
      ],
    },
    portal_disputa: {
      type: Type.STRING,
      description: 'Ex: Compras.gov.br, PNCP, BLL, Licitanet, BEC',
    },
    valor_estimado: {
      type: Type.NUMBER,
      description: 'Valor global em reais (0 se sigiloso/não informado)',
    },
    valor_sigiloso: { type: Type.BOOLEAN },
    objeto_resumido: {
      type: Type.STRING,
      description: 'Resumo factual em até 2 frases',
    },
    beneficio_me_epp: {
      type: Type.BOOLEAN,
      description: 'Se há exclusividade ou cota reservada LC 123/2006',
    },
    match_escopo: {
      type: Type.BOOLEAN,
      description: 'True se o objeto bate com o CNAE/atividades da empresa',
    },
    motivo_match: {
      type: Type.STRING,
      description: 'Justificativa curta de 1 linha para o match ou descarte',
    },
  },
  required: [
    'numero_edital',
    'orgao_licitante',
    'uf',
    'esfera',
    'modalidade',
    'valor_estimado',
    'valor_sigiloso',
    'objeto_resumido',
    'beneficio_me_epp',
    'match_escopo',
    'motivo_match',
  ],
};
