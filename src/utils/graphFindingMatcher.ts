import {
  AuditFinding,
  DependencyEdge,
  DependencyNode,
} from '../types/audit';

const STOPWORDS = new Set([
  'a', 'ao', 'aos', 'as', 'com', 'como', 'da', 'das', 'de', 'do', 'dos',
  'e', 'em', 'na', 'nas', 'no', 'nos', 'o', 'os', 'ou', 'para', 'pela',
  'pelo', 'por', 'que', 'se', 'sem', 'sob', 'sobre', 'um', 'uma', 'clausula',
  'lei', 'art', 'artigo', 'risco', 'edital', 'contrato',
]);

function tokenize(input: string): string[] {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 2 && !STOPWORDS.has(token));
}

function scoreNodeAgainstFinding(
  node: DependencyNode,
  finding: AuditFinding
): number {
  const nodeIdNorm = node.id.toLowerCase();
  const findingIdNorm = finding.id.toLowerCase();
  const regraIdNorm = finding.regra_id.toLowerCase();

  if (
    nodeIdNorm.includes(findingIdNorm) ||
    nodeIdNorm.includes(regraIdNorm) ||
    node.label.toLowerCase().includes(findingIdNorm) ||
    node.label.toLowerCase().includes(regraIdNorm)
  ) {
    return 100;
  }

  const nodeTokens = tokenize(node.label);
  if (nodeTokens.length === 0) return 0;

  const findingText = [
    finding.titulo,
    finding.fundamentacao_legal,
    finding.trecho_original,
    finding.impacto_operacional,
    finding.regra_id,
  ].join(' ');
  const findingTokenSet = new Set(tokenize(findingText));

  let hits = 0;
  for (const token of nodeTokens) {
    if (findingTokenSet.has(token)) {
      hits += 1;
    }
  }
  return hits;
}

export function findFindingForNode(
  node: DependencyNode | undefined,
  nos: DependencyNode[],
  arestas: DependencyEdge[],
  achados: AuditFinding[]
): AuditFinding | null {
  if (!node || achados.length === 0) return null;
  if (node.tipo === 'SECRETARIA') return null;

  let bestFinding: AuditFinding | null = null;
  let bestScore = 0;

  for (const finding of achados) {
    const directScore = scoreNodeAgainstFinding(node, finding);
    if (directScore > bestScore) {
      bestScore = directScore;
      bestFinding = finding;
    }
  }

  if (bestScore >= 1) {
    return bestFinding;
  }

  // Fallback: inspect neighbor nodes connected to this node
  const neighborIds = new Set<string>();
  for (const edge of arestas) {
    if (edge.origem === node.id) neighborIds.add(edge.destino);
    if (edge.destino === node.id) neighborIds.add(edge.origem);
  }
  const neighbors = nos.filter(
    (n) => neighborIds.has(n.id) && n.tipo !== 'SECRETARIA'
  );

  for (const neighbor of neighbors) {
    for (const finding of achados) {
      const neighborScore = scoreNodeAgainstFinding(neighbor, finding);
      if (neighborScore > bestScore) {
        bestScore = neighborScore;
        bestFinding = finding;
      }
    }
  }

  return bestScore >= 1 ? bestFinding : null;
}

export function findNodeIdForFinding(
  finding: AuditFinding,
  nos: DependencyNode[]
): string | null {
  if (nos.length === 0) return null;

  const candidateNodes = nos.filter((n) => n.tipo !== 'SECRETARIA');
  const pool = candidateNodes.length > 0 ? candidateNodes : nos;

  let bestNode: DependencyNode | null = null;
  let bestScore = -1;

  for (const node of pool) {
    let score = scoreNodeAgainstFinding(node, finding);
    if (node.tipo === 'CLAUSULA') {
      score += 0.5; // Prefer CLAUSULA anchor when scores tie
    }
    if (score > bestScore) {
      bestScore = score;
      bestNode = node;
    }
  }

  return bestNode ? bestNode.id : pool[0]?.id ?? null;
}
