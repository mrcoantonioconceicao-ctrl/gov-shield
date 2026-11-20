import { AuditFinding, AuditReport } from '../types/audit';
import { computeSha256Hex } from '../utils/cryptoAndAnalysis';

export type PatchMatchStrategy = 'INLINE_REPLACE' | 'ADDENDUM_APPENDIX';

export interface AppliedPatchItem {
  finding: AuditFinding;
  applied: boolean;
  matchStrategy: PatchMatchStrategy;
  beforeText: string;
  afterText: string;
}

export interface RedlinePatchResult {
  originalSha256: string;
  rectifiedSha256: string;
  rectifiedText: string;
  appliedCount: number;
  totalFindings: number;
  patches: AppliedPatchItem[];
  timestamp: string;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function tryReplaceClause(
  sourceText: string,
  originalExcerpt: string,
  replacementText: string
): { updatedText: string; replaced: boolean } {
  const cleanExcerpt = originalExcerpt.trim();
  if (!cleanExcerpt) {
    return { updatedText: sourceText, replaced: false };
  }

  // 1. Exact literal match
  const exactIdx = sourceText.indexOf(cleanExcerpt);
  if (exactIdx !== -1) {
    const updatedText =
      sourceText.slice(0, exactIdx) +
      replacementText +
      sourceText.slice(exactIdx + cleanExcerpt.length);
    return { updatedText, replaced: true };
  }

  // 2. Flexible whitespace / line-break normalized match
  const tokens = cleanExcerpt.split(/\s+/).filter(Boolean);
  if (tokens.length >= 3) {
    const pattern = tokens.map(escapeRegExp).join('\\s+');
    const regex = new RegExp(pattern, 'i');
    if (regex.test(sourceText)) {
      const updatedText = sourceText.replace(regex, () => replacementText);
      return { updatedText, replaced: true };
    }
  }

  return { updatedText: sourceText, replaced: false };
}

export async function applyRedlinePatches(params: {
  originalText: string;
  originalSha256: string;
  findings: AuditFinding[];
  approvedIds: Set<string>;
}): Promise<RedlinePatchResult> {
  const { originalText, originalSha256, findings, approvedIds } = params;

  const resolvedOriginalSha256 =
    originalSha256.trim() || (await computeSha256Hex(originalText));

  let workingText = originalText;
  const addendumBlocks: string[] = [];
  const patches: AppliedPatchItem[] = [];

  for (const finding of findings) {
    const isApproved = approvedIds.has(finding.id);

    if (!isApproved) {
      patches.push({
        finding,
        applied: false,
        matchStrategy: 'INLINE_REPLACE',
        beforeText: finding.trecho_original,
        afterText: finding.sugestao_retificacao,
      });
      continue;
    }

    const { updatedText, replaced } = tryReplaceClause(
      workingText,
      finding.trecho_original,
      finding.sugestao_retificacao
    );

    if (replaced) {
      workingText = updatedText;
      patches.push({
        finding,
        applied: true,
        matchStrategy: 'INLINE_REPLACE',
        beforeText: finding.trecho_original,
        afterText: finding.sugestao_retificacao,
      });
    } else {
      addendumBlocks.push(
        `[${finding.regra_id} · ${finding.titulo}]\nRedação Substitutiva Aprovada:\n${finding.sugestao_retificacao}`
      );
      patches.push({
        finding,
        applied: true,
        matchStrategy: 'ADDENDUM_APPENDIX',
        beforeText: finding.trecho_original,
        afterText: finding.sugestao_retificacao,
      });
    }
  }

  if (addendumBlocks.length > 0) {
    workingText = `${workingText.trimEnd()}\n\n========================================================================\nADENDO DE RETIFICAÇÃO PERICIAL (CLÁUSULAS SANEADAS)\n========================================================================\n\n${addendumBlocks.join('\n\n------------------------------------------------------------------------\n\n')}`;
  }

  const appliedCount = patches.filter((p) => p.applied).length;
  const rectifiedSha256 =
    appliedCount === 0 && workingText === originalText
      ? resolvedOriginalSha256
      : await computeSha256Hex(workingText);

  return {
    originalSha256: resolvedOriginalSha256,
    rectifiedSha256,
    rectifiedText: workingText,
    appliedCount,
    totalFindings: findings.length,
    patches,
    timestamp: new Date().toISOString(),
  };
}

export function formatRectifiedDownloadContent(
  result: RedlinePatchResult,
  report: AuditReport,
  format: 'txt' | 'md'
): string {
  const custodyStatus =
    'Aguardando Assinatura da Autoridade Competente (Human-in-the-Loop)';

  if (format === 'md') {
    return [
      `# Minuta Retificada — GovShield Audit Studio`,
      ``,
      `## Cadeia de Custódia Criptográfica`,
      `- **Documento Original:** ${report.nome_arquivo}`,
      `- **Órgão Identificado:** ${report.metadados_documento.orgao_identificado}`,
      `- **Processo / Edital:** ${report.metadados_documento.numero_edital_ou_processo}`,
      `- **SHA-256 Original:** \`${result.originalSha256}\``,
      `- **Cláusulas Saneadas:** ${result.appliedCount} de ${result.totalFindings}`,
      `- **SHA-256 Minuta Retificada:** \`${result.rectifiedSha256}\``,
      `- **Timestamp da Retificação:** ${result.timestamp}`,
      `- **Status de Governança:** ${custodyStatus}`,
      ``,
      `---`,
      ``,
      `## Texto Integral Retificado`,
      ``,
      result.rectifiedText,
      ``,
    ].join('\n');
  }

  return [
    `========================================================================`,
    `GOVSHIELD AUDIT STUDIO — MINUTA RETIFICADA COM RASTREABILIDADE SHA-256`,
    `========================================================================`,
    `Documento Original       : ${report.nome_arquivo}`,
    `Órgão Identificado       : ${report.metadados_documento.orgao_identificado}`,
    `Processo / Edital        : ${report.metadados_documento.numero_edital_ou_processo}`,
    `SHA-256 Original         : ${result.originalSha256}`,
    `Cláusulas Saneadas       : ${result.appliedCount} de ${result.totalFindings}`,
    `SHA-256 Minuta Retificada: ${result.rectifiedSha256}`,
    `Timestamp                : ${result.timestamp}`,
    `Status de Governança     : ${custodyStatus}`,
    `========================================================================`,
    ``,
    result.rectifiedText,
    ``,
  ].join('\n');
}
