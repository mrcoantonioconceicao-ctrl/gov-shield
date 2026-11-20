import { AuditReport } from '../../types/audit';
import {
  computeSha256Hex,
  NormativeScope,
} from '../../utils/cryptoAndAnalysis';
import {
  invokeGeminiAuditService,
  invokeReferenceAuditService,
} from '../../services/geminiAuditService';
import {
  DocumentAstRoot,
  mapFindingToAstPath,
  parseDocumentToAst,
  summarizeAstForPrompt,
} from '../ast/documentAstParser';
import {
  analyzeNormativeGraph,
  buildNormativeGraphContext,
  GraphRagMetrics,
} from '../graphrag/normativeGraphEngine';
import {
  McpExecutionLogEntry,
  mcpToolRegistry,
} from '../mcp/mcpToolRegistry';

export type BpmnStageId =
  | 'INGEST_SHA256'
  | 'DOCUMENT_AST'
  | 'GRAPHRAG_NORMATIVE'
  | 'GEMINI_AUDIT'
  | 'FINAL_REPORT';

export type BpmnStepStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'ERROR';

export interface BpmnStepState {
  id: BpmnStageId;
  label: string;
  shortLabel: string;
  status: BpmnStepStatus;
  durationMs?: number;
}

export interface EnterpriseAuditBundle {
  report: AuditReport;
  ast: DocumentAstRoot;
  graphMetrics: GraphRagMetrics;
  findingAstPaths: Record<string, string>;
  mcpLogs: McpExecutionLogEntry[];
  bpmnSteps: BpmnStepState[];
}

export const INITIAL_BPMN_STEPS: BpmnStepState[] = [
  {
    id: 'INGEST_SHA256',
    label: 'Start: Ingestão & SHA-256',
    shortLabel: 'Start: Ingestão & SHA-256',
    status: 'PENDING',
  },
  {
    id: 'DOCUMENT_AST',
    label: 'Task 1: Document AST Parser',
    shortLabel: 'Task 1: Document AST',
    status: 'PENDING',
  },
  {
    id: 'GRAPHRAG_NORMATIVE',
    label: 'Task 2: GraphRAG Normativo',
    shortLabel: 'Task 2: GraphRAG',
    status: 'PENDING',
  },
  {
    id: 'GEMINI_AUDIT',
    label: 'Task 3: Auditoria Gemini 2.5',
    shortLabel: 'Task 3: Gemini 2.5',
    status: 'PENDING',
  },
  {
    id: 'FINAL_REPORT',
    label: 'End: Parecer & Grafo',
    shortLabel: 'End: Parecer & Grafo',
    status: 'PENDING',
  },
];

export interface OrchestrateAuditParams {
  mode: 'GEMINI_REAL' | 'REFERENCE_DEMO';
  fileName: string;
  mimeType: 'application/pdf' | 'text/plain';
  base64Data?: string;
  textContent: string;
  precomputedSha256?: string;
  scope: NormativeScope;
  onBpmnProgress?: (steps: BpmnStepState[]) => void;
}

export async function orchestrateEnterpriseAudit(
  params: OrchestrateAuditParams
): Promise<EnterpriseAuditBundle> {
  const steps: BpmnStepState[] = INITIAL_BPMN_STEPS.map((s) => ({ ...s }));
  const emitProgress = () => {
    params.onBpmnProgress?.(steps.map((s) => ({ ...s })));
  };

  const setStepState = (
    id: BpmnStageId,
    status: BpmnStepStatus,
    durationMs?: number
  ) => {
    const target = steps.find((s) => s.id === id);
    if (target) {
      target.status = status;
      if (durationMs !== undefined) {
        target.durationMs = durationMs;
      }
    }
    emitProgress();
  };

  mcpToolRegistry.clearLogs();

  // Stage 1: Start — Ingestão & SHA-256
  let currentStage: BpmnStageId = 'INGEST_SHA256';
  try {
    setStepState('INGEST_SHA256', 'RUNNING');
    const t1 = performance.now();
    const sha256 = await mcpToolRegistry.invoke(
      'verify_sha256_custody',
      { fileName: params.fileName, precomputed: !!params.precomputedSha256 },
      async () => {
        if (params.precomputedSha256 && params.precomputedSha256.length === 64) {
          return params.precomputedSha256;
        }
        return computeSha256Hex(params.textContent);
      },
      (digest) => `SHA-256 verificado (${digest.slice(0, 12)}…) · ${params.fileName}`
    );
    setStepState('INGEST_SHA256', 'COMPLETED', Math.round(performance.now() - t1));

    // Stage 2: Task 1 — Document AST Parser
    currentStage = 'DOCUMENT_AST';
    setStepState('DOCUMENT_AST', 'RUNNING');
    const t2 = performance.now();
    const ast = await mcpToolRegistry.invoke(
      'parse_document_ast',
      { fileName: params.fileName, length: params.textContent.length },
      () => parseDocumentToAst(params.textContent, params.fileName),
      (parsedAst) =>
        `${parsedAst.totalSecoes} seções · ${parsedAst.totalClausulas} cláusulas · ${parsedAst.totalReferenciasNormativas} refs`
    );
    setStepState('DOCUMENT_AST', 'COMPLETED', Math.round(performance.now() - t2));

    // Stage 3: Task 2 — GraphRAG Normativo
    currentStage = 'GRAPHRAG_NORMATIVE';
    setStepState('GRAPHRAG_NORMATIVE', 'RUNNING');
    const t3 = performance.now();
    const graphContext = await mcpToolRegistry.invoke(
      'query_graphrag_normative',
      { secoes: ast.totalSecoes, scope: params.scope },
      () => buildNormativeGraphContext(ast, params.textContent, params.scope),
      (ctx) =>
        `${ctx.diplomasAtivos.length} diplomas ativos · ${ctx.cruzamentosSugeridos.length} cruzamentos`
    );
    setStepState(
      'GRAPHRAG_NORMATIVE',
      'COMPLETED',
      Math.round(performance.now() - t3)
    );

    // Stage 4: Task 3 — Auditoria Gemini 2.5 (or Reference Demo runner)
    currentStage = 'GEMINI_AUDIT';
    setStepState('GEMINI_AUDIT', 'RUNNING');
    const t4 = performance.now();
    const report = await mcpToolRegistry.invoke(
      'run_gemini_compliance_audit',
      { mode: params.mode, mimeType: params.mimeType },
      async () => {
        if (params.mode === 'REFERENCE_DEMO') {
          return invokeReferenceAuditService({
            text: params.textContent,
            fileName: params.fileName,
            sha256,
            scope: params.scope,
          });
        }

        return invokeGeminiAuditService({
          fileName: params.fileName,
          mimeType: params.mimeType,
          base64Data: params.base64Data,
          textContent:
            params.mimeType === 'text/plain' ? params.textContent : undefined,
          sha256,
          scope: params.scope,
          astSummary: summarizeAstForPrompt(ast),
          graphRagSummary: graphContext.resumoPrompt,
        });
      },
      (rep) =>
        `${rep.achados.length} achados · score ${rep.score_risco_global}/100 · ${rep.status_parecer}`
    );
    setStepState('GEMINI_AUDIT', 'COMPLETED', Math.round(performance.now() - t4));

    // Stage 5: End — Parecer & Grafo
    currentStage = 'FINAL_REPORT';
    setStepState('FINAL_REPORT', 'RUNNING');
    const t5 = performance.now();

    const findingAstPaths: Record<string, string> = {};
    report.achados.forEach((finding) => {
      const match = mapFindingToAstPath(ast, finding);
      findingAstPaths[finding.id] = match.caminhoEstrutural;
    });

    const graphMetrics = analyzeNormativeGraph(report, graphContext);
    setStepState('FINAL_REPORT', 'COMPLETED', Math.round(performance.now() - t5));

    return {
      report,
      ast,
      graphMetrics,
      findingAstPaths,
      mcpLogs: mcpToolRegistry.getLogs(),
      bpmnSteps: steps.map((s) => ({ ...s })),
    };
  } catch (err) {
    setStepState(currentStage, 'ERROR');
    throw err;
  }
}
