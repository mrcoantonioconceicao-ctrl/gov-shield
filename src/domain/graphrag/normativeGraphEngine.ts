import {
  AuditReport,
  DependencyEdge,
  DependencyNode,
} from '../../types/audit';
import { DocumentAstRoot } from '../ast/documentAstParser';

export interface GraphRagMetrics {
  totalNos: number;
  totalArestas: number;
  nosPorTipo: Record<DependencyNode['tipo'], number>;
  arestasPorRelacao: Record<DependencyEdge['relacao'], number>;
  cruzamentosNormativos: string[];
  nosCentrais: { id: string; label: string; grau: number }[];
}

export interface NormativeGraphContext {
  diplomasAtivos: string[];
  cruzamentosSugeridos: string[];
  resumoPrompt: string;
}

const NORMATIVE_CROSSWALKS: {
  keyword: RegExp;
  cruzamento: string;
}[] = [
  {
    keyword: /marca|propriet|medicore|exclusiv/i,
    cruzamento:
      'Lei 14.133/2021 (Art. 9º, I e Art. 41, I) ↔ Jurisprudência TCE/SC (vedação a direcionamento sem justificativa técnica)',
  },
  {
    keyword: /sede|filial|estado|territ|município/i,
    cruzamento:
      'Lei 14.133/2021 (Art. 9º, I, "a") ↔ Prejulgados TCE/SC (vedação à restrição geográfica na habilitação)',
  },
  {
    keyword: /atestado|capacidade|65%|80%|contrato único/i,
    cruzamento:
      'Lei 14.133/2021 (Art. 67, § 2º · teto 50%) ↔ Decisões TCE/SC (obrigatoriedade de somatório de atestados)',
  },
  {
    keyword: /lote único|aglutina|software|hardware|cabeamento/i,
    cruzamento:
      'Lei 14.133/2021 (Art. 40, V, "b" e § 2º) ↔ Súmula 247 TCU / TCE/SC (dever de parcelamento do objeto)',
  },
  {
    keyword: /visita técnica|vistoria/i,
    cruzamento:
      'Lei 14.133/2021 (Art. 63, §§ 2º e 3º) ↔ TCE/SC (vistoria facultativa substituível por declaração formal)',
  },
  {
    keyword: /biometr|prontuár|exterior|retenc|retenção|ripd|dpo|criptograf|lpr|placas/i,
    cruzamento:
      'LGPD (Lei 13.709/2018 · Arts. 11, 23, 33, 38, 46 e 48) ↔ Lei 14.133/2021 (Art. 18 ETP e Art. 92 cláusulas necessárias)',
  },
];

export function buildNormativeGraphContext(
  ast: DocumentAstRoot,
  rawText: string,
  scope: { lei14133: boolean; tcesc: boolean; lgpd: boolean }
): NormativeGraphContext {
  const diplomasAtivos: string[] = [];
  if (scope.lei14133) diplomasAtivos.push('Lei nº 14.133/2021');
  if (scope.tcesc) diplomasAtivos.push('Jurisprudência TCE/SC');
  if (scope.lgpd) diplomasAtivos.push('LGPD (Lei nº 13.709/2018)');

  const combinedText = `${rawText}\n${ast.secoes.map((s) => s.titulo).join(' ')}`;
  const cruzamentosSugeridos = NORMATIVE_CROSSWALKS.filter((cw) =>
    cw.keyword.test(combinedText)
  ).map((cw) => cw.cruzamento);

  const resumoPrompt =
    cruzamentosSugeridos.length > 0
      ? cruzamentosSugeridos.map((c) => `- ${c}`).join('\n')
      : `- Cruzamento padrão entre ${diplomasAtivos.join(', ')}`;

  return {
    diplomasAtivos,
    cruzamentosSugeridos,
    resumoPrompt,
  };
}

export function analyzeNormativeGraph(
  report: AuditReport,
  context?: NormativeGraphContext
): GraphRagMetrics {
  const { nos, arestas } = report.grafo_dependencias;

  const nosPorTipo: Record<DependencyNode['tipo'], number> = {
    SECRETARIA: 0,
    CLAUSULA: 0,
    LEI: 0,
    RISCO: 0,
  };
  const degreeMap = new Map<string, number>();

  nos.forEach((n) => {
    nosPorTipo[n.tipo] = (nosPorTipo[n.tipo] ?? 0) + 1;
    degreeMap.set(n.id, 0);
  });

  const arestasPorRelacao: Record<DependencyEdge['relacao'], number> = {
    VIOLA: 0,
    EXIGE: 0,
    IMPACTA: 0,
  };

  arestas.forEach((e) => {
    arestasPorRelacao[e.relacao] = (arestasPorRelacao[e.relacao] ?? 0) + 1;
    degreeMap.set(e.origem, (degreeMap.get(e.origem) ?? 0) + 1);
    degreeMap.set(e.destino, (degreeMap.get(e.destino) ?? 0) + 1);
  });

  const nosCentrais = nos
    .map((n) => ({
      id: n.id,
      label: n.label,
      grau: degreeMap.get(n.id) ?? 0,
    }))
    .sort((a, b) => b.grau - a.grau)
    .slice(0, 4);

  const dynamicCrosswalks = new Set<string>(
    context?.cruzamentosSugeridos ?? []
  );
  report.achados.forEach((a) => {
    if (a.categoria === 'VIOLACAO_LEGAL') {
      dynamicCrosswalks.add(`Lei nº 14.133/2021 ↔ ${a.regra_id}`);
    } else if (a.categoria === 'RISCO_IMPUGNACAO_TCESC') {
      dynamicCrosswalks.add(`Jurisprudência TCE/SC ↔ ${a.regra_id}`);
    } else if (a.categoria === 'LACUNA_CIBER_LGPD') {
      dynamicCrosswalks.add(`LGPD (Lei nº 13.709/2018) ↔ ${a.regra_id}`);
    }
  });

  return {
    totalNos: nos.length,
    totalArestas: arestas.length,
    nosPorTipo,
    arestasPorRelacao,
    cruzamentosNormativos: Array.from(dynamicCrosswalks),
    nosCentrais,
  };
}
