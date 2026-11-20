export type McpToolName =
  | 'verify_sha256_custody'
  | 'parse_document_ast'
  | 'query_graphrag_normative'
  | 'run_gemini_compliance_audit';

export type McpExecutionStatus = 'SUCCESS' | 'ERROR';

export interface McpToolContract {
  name: McpToolName;
  description: string;
  inputSchema: Record<string, string>;
}

export interface McpExecutionLogEntry {
  id: string;
  toolName: McpToolName;
  timestamp: string;
  durationMs: number;
  status: McpExecutionStatus;
  payloadSummary: string;
}

export const MCP_TOOL_CONTRACTS: McpToolContract[] = [
  {
    name: 'verify_sha256_custody',
    description:
      'Calcula e valida o resumo criptográfico SHA-256 do documento submetido para cadeia de custódia pericial.',
    inputSchema: {
      sourceType: 'ArrayBuffer | string',
      fileName: 'string',
    },
  },
  {
    name: 'parse_document_ast',
    description:
      'Constrói a Árvore Sintática Documental (SectionNode -> ClauseNode -> NormativeRefNode) para endereçamento estrutural.',
    inputSchema: {
      rawText: 'string',
      fileName: 'string',
    },
  },
  {
    name: 'query_graphrag_normative',
    description:
      'Consulta e sintetiza cruzamentos normativos entre Lei nº 14.133/2021, TCE/SC e LGPD com métricas de grafo.',
    inputSchema: {
      astRoot: 'DocumentAstRoot',
      scope: 'NormativeScope',
    },
  },
  {
    name: 'run_gemini_compliance_audit',
    description:
      'Executa auditoria pericial estruturada (JSON Schema) com trava de citação literal via Gemini 2.5 Flash.',
    inputSchema: {
      documentPayload: 'PDF Base64 | Text',
      astContext: 'string',
      graphRagContext: 'string',
    },
  },
];

class McpToolRegistry {
  private logs: McpExecutionLogEntry[] = [];

  public getContracts(): McpToolContract[] {
    return MCP_TOOL_CONTRACTS;
  }

  public getLogs(): McpExecutionLogEntry[] {
    return [...this.logs];
  }

  public clearLogs(): void {
    this.logs = [];
  }

  public async invoke<TInput, TOutput>(
    toolName: McpToolName,
    input: TInput,
    executor: (payload: TInput) => Promise<TOutput> | TOutput,
    summarizeOutput: (output: TOutput) => string
  ): Promise<TOutput> {
    const startMs = performance.now();
    try {
      const output = await executor(input);
      const durationMs = Number(
        Math.max(0.1, performance.now() - startMs).toFixed(2)
      );

      this.logs.push({
        id: `mcp-${Date.now()}-${this.logs.length + 1}`,
        toolName,
        timestamp: new Date().toISOString(),
        durationMs,
        status: 'SUCCESS',
        payloadSummary: summarizeOutput(output),
      });

      return output;
    } catch (err) {
      const durationMs = Number(
        Math.max(0.1, performance.now() - startMs).toFixed(2)
      );
      const errMessage =
        err instanceof Error ? err.message : 'Erro desconhecido na tool MCP';

      this.logs.push({
        id: `mcp-${Date.now()}-${this.logs.length + 1}`,
        toolName,
        timestamp: new Date().toISOString(),
        durationMs,
        status: 'ERROR',
        payloadSummary: errMessage.slice(0, 140),
      });

      throw err;
    }
  }
}

export const mcpToolRegistry = new McpToolRegistry();
