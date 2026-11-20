import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI, Type } from '@google/genai';
import type { AuditReport } from './src/types/audit.ts';
import type { Step1TriageResult } from './src/types/triage.ts';
import type { Step2ExtractorResult } from './src/types/extractor.ts';
import { GEMINI_AUDIT_SYSTEM_INSTRUCTION } from './src/services/auditPromptConfig.ts';
import {
  STEP1_TRIAGE_SYSTEM_INSTRUCTION,
  step1TriageResponseSchema,
} from './src/services/triagePromptConfig.ts';
import {
  STEP2_EXTRACTOR_SYSTEM_INSTRUCTION,
  step2ExtractorResponseSchema,
} from './src/services/extractorPromptConfig.ts';
import {
  parseJsonSafely,
  runStep1TriageFast,
  runStep1TriageFastPdf,
} from './src/services/triageFastEngine.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Disable HMR in AI Studio proxy environments unless explicitly enabled
if (process.env.DISABLE_HMR === undefined) {
  process.env.DISABLE_HMR = 'true';
}

const AUDIT_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  required: [
    'metadados_documento',
    'score_risco_global',
    'status_parecer',
    'metricas_economia',
    'achados',
    'grafo_dependencias',
  ],
  properties: {
    metadados_documento: {
      type: Type.OBJECT,
      required: [
        'orgao_identificado',
        'numero_edital_ou_processo',
        'objeto_resumido',
        'modalidade',
      ],
      properties: {
        orgao_identificado: { type: Type.STRING },
        numero_edital_ou_processo: { type: Type.STRING },
        objeto_resumido: { type: Type.STRING },
        modalidade: { type: Type.STRING },
      },
    },
    score_risco_global: {
      type: Type.NUMBER,
      description: 'Pontuação numérica de risco global entre 0 e 100.',
    },
    status_parecer: {
      type: Type.STRING,
      enum: [
        'APROVADO_COM_RESSALVAS',
        'REQUER_RETIFICACAO_PREVIA',
        'ALTO_RISCO_IMPUGNACAO',
      ],
    },
    metricas_economia: {
      type: Type.OBJECT,
      required: [
        'tempo_estimado_revisao_humana_minutos',
        'tempo_execucao_segundos',
        'clausulas_criticas_detectadas',
      ],
      properties: {
        tempo_estimado_revisao_humana_minutos: { type: Type.NUMBER },
        tempo_execucao_segundos: { type: Type.NUMBER },
        clausulas_criticas_detectadas: { type: Type.NUMBER },
      },
    },
    achados: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        required: [
          'id',
          'regra_id',
          'categoria',
          'severidade',
          'titulo',
          'fundamentacao_legal',
          'trecho_original',
          'impacto_operacional',
          'sugestao_retificacao',
        ],
        properties: {
          id: { type: Type.STRING },
          regra_id: { type: Type.STRING },
          categoria: {
            type: Type.STRING,
            enum: [
              'VIOLACAO_LEGAL',
              'RISCO_IMPUGNACAO_TCESC',
              'LACUNA_CIBER_LGPD',
            ],
          },
          severidade: {
            type: Type.STRING,
            enum: ['CRITICO', 'ALTO', 'MODERADO'],
          },
          titulo: { type: Type.STRING },
          fundamentacao_legal: { type: Type.STRING },
          trecho_original: { type: Type.STRING },
          impacto_operacional: { type: Type.STRING },
          sugestao_retificacao: { type: Type.STRING },
        },
      },
    },
    grafo_dependencias: {
      type: Type.OBJECT,
      required: ['nos', 'arestas'],
      properties: {
        nos: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            required: ['id', 'tipo', 'label'],
            properties: {
              id: { type: Type.STRING },
              tipo: {
                type: Type.STRING,
                enum: ['CLAUSULA', 'LEI', 'RISCO', 'SECRETARIA'],
              },
              label: { type: Type.STRING },
            },
          },
        },
        arestas: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            required: ['origem', 'destino', 'relacao'],
            properties: {
              origem: { type: Type.STRING },
              destino: { type: Type.STRING },
              relacao: {
                type: Type.STRING,
                enum: ['VIOLA', 'EXIGE', 'IMPACTA'],
              },
            },
          },
        },
      },
    },
  },
};

interface AuditRequestBody {
  fileName?: string;
  mimeType?: string;
  base64Data?: string;
  textContent?: string;
  sha256?: string;
  astSummary?: string;
  graphRagSummary?: string;
  scope?: {
    lei14133?: boolean;
    tcesc?: boolean;
    lgpd?: boolean;
  };
}

interface TriageRequestBody {
  fileName?: string;
  mimeType?: string;
  base64Data?: string;
  textContent?: string;
  companyProfile?: string;
}

interface ExtractRequestBody {
  fileName?: string;
  mimeType?: string;
  base64Data?: string;
  textContent?: string;
}

function buildScopeInstructions(scope?: AuditRequestBody['scope']): string {
  const activeScopes: string[] = [];
  if (scope?.lei14133 !== false) {
    activeScopes.push('Lei nº 14.133/2021 (Nova Lei de Licitações e Contratos)');
  }
  if (scope?.tcesc !== false) {
    activeScopes.push('Jurisprudência e Prejulgados do TCE/SC');
  }
  if (scope?.lgpd !== false) {
    activeScopes.push('LGPD (Lei nº 13.709/2018) e Segurança Cibernética');
  }

  return activeScopes.length > 0
    ? activeScopes.join('; ')
    : 'Lei nº 14.133/2021; Jurisprudência TCE/SC; LGPD';
}

function extractReadableError(err: unknown): { status: number; message: string } {
  const rawMessage =
    err instanceof Error ? err.message : 'Erro desconhecido ao processar auditoria.';

  if (
    rawMessage.includes('API_KEY_INVALID') ||
    rawMessage.includes('PERMISSION_DENIED') ||
    rawMessage.includes('403')
  ) {
    return {
      status: 403,
      message:
        'Chave de API inválida ou sem permissão. Verifique a variável GEMINI_API_KEY em Settings > Secrets.',
    };
  }
  if (rawMessage.includes('RESOURCE_EXHAUSTED') || rawMessage.includes('429')) {
    return {
      status: 429,
      message:
        'Limite de requisições da API Gemini atingido (429). Aguarde alguns instantes e tente novamente.',
    };
  }
  if (rawMessage.includes('NOT_FOUND') || rawMessage.includes('404')) {
    return {
      status: 404,
      message:
        'Modelo gemini-2.5-flash indisponível ou não encontrado para esta chave de API.',
    };
  }

  return {
    status: 502,
    message: `Falha na execução do motor pericial Gemini: ${rawMessage}`,
  };
}

async function createServer() {
  const app = express();
  app.use(express.json({ limit: '40mb' }));

  app.post('/api/audit', async (req: Request, res: Response) => {
    const startMs = performance.now();
    const body = (req.body || {}) as AuditRequestBody;

    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) {
      res.status(500).json({
        error:
          'Chave GEMINI_API_KEY não configurada no servidor. Configure-a em Settings > Secrets para habilitar o motor Gemini 2.5.',
      });
      return;
    }

    const fileName = (body.fileName || 'Documento_Sem_Nome.txt').trim();
    const mimeType = body.mimeType || 'text/plain';
    const sha256 = (body.sha256 || '').trim();

    if (!sha256 || sha256.length !== 64) {
      res.status(400).json({
        error: 'Hash SHA-256 ausente ou inválido para a cadeia de custódia.',
      });
      return;
    }

    if (mimeType === 'application/pdf' && !body.base64Data) {
      res.status(400).json({
        error: 'Conteúdo Base64 do arquivo PDF não foi recebido pelo servidor.',
      });
      return;
    }

    if (mimeType !== 'application/pdf' && !body.textContent?.trim()) {
      res.status(400).json({
        error: 'Nenhum conteúdo textual foi enviado para auditoria.',
      });
      return;
    }

    const scopeText = buildScopeInstructions(body.scope);
    const astContextBlock = body.astSummary
      ? `\n\nMAPA ESTRUTURAL (DOCUMENT AST):\n${body.astSummary}`
      : '';
    const graphRagContextBlock = body.graphRagSummary
      ? `\n\nCRUZAMENTOS NORMATIVOS PRIORITÁRIOS (GRAPHRAG):\n${body.graphRagSummary}`
      : '';

    const auditPrompt = `Realize a auditoria pericial completa do documento "${fileName}" considerando exclusivamente o seguinte escopo normativo ativo: ${scopeText}.
Extraia os metadados reais, identifique todas as cláusulas desconformes com transcrição literal (ipsissima verba) em trecho_original, proponha minuta de retificação completa e pronta para publicação (sem placeholders entre colchetes) em sugestao_retificacao, e construa o grafo de dependências correspondente.
Lembrete: NÃO invente apontamentos se não houver evidência textual explícita no documento.${astContextBlock}${graphRagContextBlock}`;

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const parts =
        mimeType === 'application/pdf' && body.base64Data
          ? [
              {
                inlineData: {
                  data: body.base64Data,
                  mimeType: 'application/pdf',
                },
              },
              { text: auditPrompt },
            ]
          : [
              {
                text: `${auditPrompt}\n\nCONTEÚDO INTEGRAL DO DOCUMENTO:\n${body.textContent}`,
              },
            ];

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts },
        config: {
          temperature: 0.1,
          systemInstruction: GEMINI_AUDIT_SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema: AUDIT_RESPONSE_SCHEMA,
        },
      });

      const rawJson = (response.text || '').trim();
      if (!rawJson) {
        res.status(502).json({
          error: 'O modelo retornou uma resposta vazia. Tente enviar novamente.',
        });
        return;
      }

      const parsed = parseJsonSafely<
        Omit<
          AuditReport,
          'sha256_documento' | 'nome_arquivo' | 'timestamp_auditoria'
        >
      >(rawJson);

      const elapsedSeconds = Number(
        Math.max(0.1, (performance.now() - startMs) / 1000).toFixed(2)
      );

      const nos = Array.isArray(parsed.grafo_dependencias?.nos)
        ? parsed.grafo_dependencias.nos
        : [];
      const validNodeIds = new Set(nos.map((n) => n.id));
      const arestas = Array.isArray(parsed.grafo_dependencias?.arestas)
        ? parsed.grafo_dependencias.arestas.filter(
            (e) => validNodeIds.has(e.origem) && validNodeIds.has(e.destino)
          )
        : [];

      const achados = Array.isArray(parsed.achados) ? parsed.achados : [];
      const criticalCount = achados.filter((a) => a.severidade === 'CRITICO').length;

      const finalReport: AuditReport = {
        sha256_documento: sha256,
        nome_arquivo: fileName,
        timestamp_auditoria: new Date().toISOString(),
        metadados_documento: {
          orgao_identificado:
            parsed.metadados_documento?.orgao_identificado ||
            'Não identificado no documento',
          numero_edital_ou_processo:
            parsed.metadados_documento?.numero_edital_ou_processo ||
            fileName.replace(/\.[^.]+$/, ''),
          objeto_resumido:
            parsed.metadados_documento?.objeto_resumido ||
            'Objeto não especificado no cabeçalho.',
          modalidade:
            parsed.metadados_documento?.modalidade || 'Não especificada',
        },
        score_risco_global: Math.min(
          100,
          Math.max(0, Math.round(Number(parsed.score_risco_global) || 0))
        ),
        status_parecer: parsed.status_parecer || 'REQUER_RETIFICACAO_PREVIA',
        metricas_economia: {
          tempo_estimado_revisao_humana_minutos: Math.max(
            15,
            Math.round(
              Number(
                parsed.metricas_economia?.tempo_estimado_revisao_humana_minutos
              ) || 45
            )
          ),
          tempo_execucao_segundos: elapsedSeconds,
          clausulas_criticas_detectadas: criticalCount,
        },
        achados,
        grafo_dependencias: {
          nos,
          arestas,
        },
      };

      res.json(finalReport);
    } catch (err) {
      const { status, message } = extractReadableError(err);
      res.status(status).json({ error: message });
    }
  });

  app.post('/api/triage', async (req: Request, res: Response) => {
    const startMs = performance.now();
    const body = (req.body || {}) as TriageRequestBody;

    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) {
      res.status(500).json({
        error:
          'Chave GEMINI_API_KEY não configurada no servidor. Configure-a em Settings > Secrets.',
      });
      return;
    }

    const fileName = (body.fileName || 'Documento_Sem_Nome.txt').trim();
    const mimeType = body.mimeType || 'text/plain';
    const companyProfile = (body.companyProfile || '').trim();

    if (!companyProfile) {
      res.status(400).json({
        error:
          'Informe o perfil da empresa (CNAEs ou atividades de atuação) para avaliar o match de escopo.',
      });
      return;
    }

    if (mimeType === 'application/pdf' && !body.base64Data) {
      res.status(400).json({
        error: 'Conteúdo Base64 do arquivo PDF não foi recebido pelo servidor.',
      });
      return;
    }

    if (mimeType !== 'application/pdf' && !body.textContent?.trim()) {
      res.status(400).json({
        error: 'Nenhum conteúdo textual foi enviado para triagem.',
      });
      return;
    }

    const triagePrompt = `Analise o preâmbulo e o objeto do documento "${fileName}" e faça o cruzamento com o seguinte perfil/escopo de atuação da empresa:

PERFIL DA EMPRESA (CNAEs / ATIVIDADES):
${companyProfile}`;

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const parts =
        mimeType === 'application/pdf' && body.base64Data
          ? [
              {
                inlineData: {
                  data: body.base64Data,
                  mimeType: 'application/pdf',
                },
              },
              { text: triagePrompt },
            ]
          : [
              {
                text: `${triagePrompt}\n\nTEXTO DO EDITAL:\n${body.textContent}`,
              },
            ];

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: { parts },
        config: {
          systemInstruction: STEP1_TRIAGE_SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema: step1TriageResponseSchema,
        },
      });

      const rawJson = (response.text || '').trim();
      if (!rawJson) {
        res.status(502).json({
          error: 'O modelo retornou uma resposta vazia na triagem. Tente novamente.',
        });
        return;
      }

      const parsed = parseJsonSafely<Step1TriageResult>(rawJson);
      const elapsedSeconds = Number(
        Math.max(0.1, (performance.now() - startMs) / 1000).toFixed(2)
      );

      res.json({
        ...parsed,
        tempo_execucao_segundos: elapsedSeconds,
      });
    } catch (err) {
      const { status, message } = extractReadableError(err);
      res.status(status).json({ error: message });
    }
  });

  app.post('/api/triage/fast', async (req: Request, res: Response) => {
    const body = (req.body || {}) as TriageRequestBody;

    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) {
      res.status(500).json({
        error:
          'Chave GEMINI_API_KEY não configurada no servidor. Configure-a em Settings > Secrets.',
      });
      return;
    }

    const mimeType = body.mimeType || 'text/plain';
    const companyProfile = (body.companyProfile || '').trim();

    if (!companyProfile) {
      res.status(400).json({
        error:
          'Informe o perfil da empresa (CNAEs ou atividades de atuação) para avaliar o match de escopo.',
      });
      return;
    }

    if (mimeType === 'application/pdf' && !body.base64Data) {
      res.status(400).json({
        error: 'Conteúdo Base64 do arquivo PDF não foi recebido pelo servidor.',
      });
      return;
    }

    if (mimeType !== 'application/pdf' && !body.textContent?.trim()) {
      res.status(400).json({
        error: 'Nenhum conteúdo textual foi enviado para triagem rápida.',
      });
      return;
    }

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const result =
        mimeType === 'application/pdf' && body.base64Data
          ? await runStep1TriageFastPdf(ai, body.base64Data, companyProfile)
          : await runStep1TriageFast(
              ai,
              body.textContent || '',
              companyProfile
            );

      res.json(result);
    } catch (err) {
      const { status, message } = extractReadableError(err);
      res.status(status).json({ error: message });
    }
  });

  app.post('/api/extract', async (req: Request, res: Response) => {
    const startMs = performance.now();
    const body = (req.body || {}) as ExtractRequestBody;

    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) {
      res.status(500).json({
        error:
          'Chave GEMINI_API_KEY não configurada no servidor. Configure-a em Settings > Secrets.',
      });
      return;
    }

    const fileName = (body.fileName || 'Documento_Sem_Nome.txt').trim();
    const mimeType = body.mimeType || 'text/plain';

    if (mimeType === 'application/pdf' && !body.base64Data) {
      res.status(400).json({
        error: 'Conteúdo Base64 do arquivo PDF não foi recebido pelo servidor.',
      });
      return;
    }

    if (mimeType !== 'application/pdf' && !body.textContent?.trim()) {
      res.status(400).json({
        error: 'Nenhum conteúdo textual foi enviado para extração forense.',
      });
      return;
    }

    const extractPrompt = `Realize a extração documental forense completa do documento "${fileName}", localizando e transcrevendo literalmente (ipsissima verba) as exigências de qualificação técnica, qualificação econômico-financeira e todas as barreiras operacionais e restrições presentes no texto.`;

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const parts =
        mimeType === 'application/pdf' && body.base64Data
          ? [
              {
                inlineData: {
                  data: body.base64Data,
                  mimeType: 'application/pdf',
                },
              },
              { text: extractPrompt },
            ]
          : [
              {
                text: `${extractPrompt}\n\nTEXTO INTEGRAL DO EDITAL:\n${body.textContent}`,
              },
            ];

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: { parts },
        config: {
          systemInstruction: STEP2_EXTRACTOR_SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema: step2ExtractorResponseSchema,
        },
      });

      const rawJson = (response.text || '').trim();
      if (!rawJson) {
        res.status(502).json({
          error:
            'O modelo retornou uma resposta vazia na extração forense. Tente novamente.',
        });
        return;
      }

      const parsed = parseJsonSafely<Step2ExtractorResult>(rawJson);
      const elapsedSeconds = Number(
        Math.max(0.1, (performance.now() - startMs) / 1000).toFixed(2)
      );

      res.json({
        ...parsed,
        tempo_execucao_segundos: elapsedSeconds,
      });
    } catch (err) {
      const { status, message } = extractReadableError(err);
      res.status(status).json({ error: message });
    }
  });

  const httpServer = http.createServer(app);

  if (!IS_PRODUCTION) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === 'true' ? false : { server: httpServer },
      },
      appType: 'spa',
    });

    if (process.env.DISABLE_HMR === 'true') {
      app.get('/@vite/client', async (_req: Request, res: Response, next) => {
        try {
          const result = await vite.transformRequest('/@vite/client');
          if (!result) {
            next();
            return;
          }
          const patchedCode = result.code.replace(
            'transport.connect(createHMRHandler(handleMessage));',
            '/* HMR WebSocket disabled */'
          );
          res.type('application/javascript').send(patchedCode);
        } catch (err) {
          next(err);
        }
      });
    }

    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('/{*splat}', (_req: Request, res: Response) => {
      const indexFile = path.join(distPath, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Build assets not found.');
      }
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`GovShield Audit Studio server listening on http://0.0.0.0:${PORT}`);
  });
}

createServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
