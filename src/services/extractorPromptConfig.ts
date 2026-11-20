import { Type } from '@google/genai';
import type { Schema } from '@google/genai';

export const STEP2_EXTRACTOR_SYSTEM_INSTRUCTION = `
Você é um extrator documental forense. Sua única função é localizar e transcrever literalmente as exigências de habilitação e barreiras operacionais do edital.

REGRAS ANTI-ALUCINAÇÃO (INVIOLÁVEIS):
1. PROIBIDO emitir opinião jurídica ou dizer se uma cláusula é legal ou ilegal nesta etapa.
2. Todo item extraído DEVE conter o endereço da cláusula (ex: "Item 9.4.2") e o "trecho_literal" (ipsissima verba) copiado exatamente do texto.
3. Se o edital NÃO exigir determinado requisito (ex: não exige vistoria, não exige garantia de proposta), retorne false ou lista vazia. Nunca presuma exigências padrão.
4. Extraia valores numéricos exatos para percentuais de atestado, capital social/patrimônio líquido e prazos em dias.
`.trim();

export const step2ExtractorResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    qualificacao_tecnica: {
      type: Type.OBJECT,
      properties: {
        exige_atestado_capacidade: { type: Type.BOOLEAN },
        percentual_minimo_exigido: {
          type: Type.NUMBER,
          description: 'Ex: 50 para 50%, ou 0 se não especificado',
        },
        permite_somatorio_atestados: {
          type: Type.STRING,
          enum: ['SIM', 'NAO', 'OMISSO'],
        },
        exige_vinculo_previo_equipe: {
          type: Type.BOOLEAN,
          description: 'Exige carteira assinada/contrato antes da licitação',
        },
        exige_certificacoes_especificas: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'Ex: ISO 27001, PMP, CREA, ANVISA',
        },
        exigencias_tecnicas_detalhadas: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              clausula: { type: Type.STRING },
              descricao_objetiva: { type: Type.STRING },
              trecho_literal: { type: Type.STRING },
            },
            required: ['clausula', 'descricao_objetiva', 'trecho_literal'],
          },
        },
      },
      required: [
        'exige_atestado_capacidade',
        'percentual_minimo_exigido',
        'permite_somatorio_atestados',
        'exige_vinculo_previo_equipe',
        'exige_certificacoes_especificas',
        'exigencias_tecnicas_detalhadas',
      ],
    },
    qualificacao_economica: {
      type: Type.OBJECT,
      properties: {
        exige_capital_ou_patrimonio: { type: Type.BOOLEAN },
        percentual_exigido: {
          type: Type.NUMBER,
          description: 'Ex: 10 para 10% do valor estimado',
        },
        valor_minimo_reais: {
          type: Type.NUMBER,
          description: 'Valor calculado em reais se expresso, ou 0',
        },
        indices_contabeis_exigidos: {
          type: Type.STRING,
          description: 'Ex: ILC >= 1.0, ILG >= 1.0, SG >= 1.0',
        },
        exige_garantia_proposta: {
          type: Type.BOOLEAN,
          description: 'Art. 58 Lei 14.133 (até 1%)',
        },
        trecho_literal: { type: Type.STRING },
      },
      required: [
        'exige_capital_ou_patrimonio',
        'percentual_exigido',
        'valor_minimo_reais',
        'indices_contabeis_exigidos',
        'exige_garantia_proposta',
        'trecho_literal',
      ],
    },
    barreiras_operacionais_e_restricoes: {
      type: Type.ARRAY,
      description:
        'Qualquer exigência de marca específica, sede/filial local, vistoria obrigatória, prazo curto de entrega ou aglutinação de objetos.',
      items: {
        type: Type.OBJECT,
        properties: {
          tipo: {
            type: Type.STRING,
            enum: [
              'INDICACAO_MARCA',
              'RESTRICAO_GEOGRAFICA_SEDE',
              'VISTORIA_PRESENCIAL',
              'PRAZO_ENTREGA_IMPLANTACAO',
              'AGLUTINACAO_LOTE_UNICO',
              'EXIGENCIA_LGPD_CIBER',
              'OUTRA_BARREIRA',
            ],
          },
          clausula: { type: Type.STRING },
          valor_ou_prazo: {
            type: Type.STRING,
            description: "Ex: '5 dias úteis', 'Sede em até 50km', 'Marca X'",
          },
          trecho_literal: { type: Type.STRING },
        },
        required: ['tipo', 'clausula', 'valor_ou_prazo', 'trecho_literal'],
      },
    },
  },
  required: [
    'qualificacao_tecnica',
    'qualificacao_economica',
    'barreiras_operacionais_e_restricoes',
  ],
};
