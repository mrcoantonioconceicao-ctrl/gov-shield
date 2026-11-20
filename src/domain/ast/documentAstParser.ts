import { AuditFinding } from '../../types/audit';

export interface NormativeRefNode {
  id: string;
  tipo: 'LEI_14133' | 'TCESC' | 'LGPD' | 'OUTRA_NORMA';
  texto: string;
  linha: number;
}

export interface ClauseNode {
  id: string;
  numero: string;
  titulo: string;
  conteudo: string;
  linhaInicio: number;
  linhaFim: number;
  referenciasNormativas: NormativeRefNode[];
}

export interface SectionNode {
  id: string;
  numero: string;
  titulo: string;
  linhaInicio: number;
  linhaFim: number;
  clausulas: ClauseNode[];
  referenciasNormativas: NormativeRefNode[];
}

export interface DocumentAstRoot {
  nomeArquivo: string;
  totalLinhas: number;
  totalSecoes: number;
  totalClausulas: number;
  totalReferenciasNormativas: number;
  secoes: SectionNode[];
}

export interface AstLocationMatch {
  caminhoEstrutural: string;
  secaoId: string | null;
  clausulaId: string | null;
}

const SECTION_HEADER_REGEX =
  /^(?:(\d{1,2})\.\s+([A-ZÀ-Ú0-9][^a-z]{2,}|(?:DO|DA|DOS|DAS)\s+[^\n]+)|((?:CLÁUSULA|CLAUSULA|SEÇÃO|SECAO|CAPÍTULO|CAPITULO|ANEXO)\s+[A-Z0-9IVX]+[^\n]*))$/i;

const CLAUSE_REGEX =
  /^(\d{1,2}\.\d{1,2}(?:\.\d{1,2})?)\.?\s+(.+)$/;

const NORMATIVE_PATTERNS: {
  tipo: NormativeRefNode['tipo'];
  regex: RegExp;
}[] = [
  {
    tipo: 'LEI_14133',
    regex: /Lei\s*(?:Federal\s*)?(?:n[º°.]*\s*)?14\.?133(?:\/2021)?|Nova\s+Lei\s+de\s+Licitações/gi,
  },
  {
    tipo: 'LGPD',
    regex: /LGPD|Lei\s*(?:n[º°.]*\s*)?13\.?709(?:\/2018)?|ANPD|dados\s+(?:pessoais|sensíveis|biométricos)/gi,
  },
  {
    tipo: 'TCESC',
    regex: /TCE\/?SC|Prejulgado\s*(?:n[º°.]*\s*)?\d+|Súmula\s*(?:n[º°.]*\s*)?\d+/gi,
  },
  {
    tipo: 'OUTRA_NORMA',
    regex: /Art\.?\s*\d+[º°]?(?:\s*,?\s*(?:§\s*\d+[º°]?|inciso\s+[IVX]+))?/gi,
  },
];

function extractNormativeRefs(
  text: string,
  lineNumber: number,
  prefix: string
): NormativeRefNode[] {
  const refs: NormativeRefNode[] = [];
  const seen = new Set<string>();

  NORMATIVE_PATTERNS.forEach(({ tipo, regex }) => {
    const localRegex = new RegExp(regex.source, regex.flags);
    let match: RegExpExecArray | null;
    while ((match = localRegex.exec(text)) !== null) {
      const normalized = match[0].replace(/\s+/g, ' ').trim();
      const key = `${tipo}:${normalized.toLowerCase()}`;
      if (!seen.has(key)) {
        seen.add(key);
        refs.push({
          id: `${prefix}-ref-${refs.length + 1}`,
          tipo,
          texto: normalized,
          linha: lineNumber,
        });
      }
    }
  });

  return refs;
}

export function parseDocumentToAst(
  text: string,
  nomeArquivo: string
): DocumentAstRoot {
  const lines = text.split(/\r?\n/);
  const secoes: SectionNode[] = [];

  let currentSection: SectionNode | null = null;
  let currentClause: ClauseNode | null = null;

  const ensureDefaultSection = (lineNum: number): SectionNode => {
    if (!currentSection) {
      currentSection = {
        id: 'sec-0',
        numero: '0',
        titulo: 'Preâmbulo e Cabeçalho',
        linhaInicio: lineNum,
        linhaFim: lineNum,
        clausulas: [],
        referenciasNormativas: [],
      };
      secoes.push(currentSection);
    }
    return currentSection;
  };

  lines.forEach((rawLine, idx) => {
    const lineNum = idx + 1;
    const trimmed = rawLine.trim();
    if (!trimmed) return;

    const sectionMatch = SECTION_HEADER_REGEX.exec(trimmed);
    const clauseMatch = CLAUSE_REGEX.exec(trimmed);

    if (sectionMatch && !clauseMatch) {
      currentClause = null;
      const num = sectionMatch[1] || String(secoes.length + 1);
      const title = (sectionMatch[2] || sectionMatch[3] || trimmed)
        .replace(/\s+/g, ' ')
        .trim();

      const sectionId = `sec-${secoes.length + 1}`;
      currentSection = {
        id: sectionId,
        numero: num,
        titulo: title,
        linhaInicio: lineNum,
        linhaFim: lineNum,
        clausulas: [],
        referenciasNormativas: extractNormativeRefs(trimmed, lineNum, sectionId),
      };
      secoes.push(currentSection);
      return;
    }

    const activeSection = ensureDefaultSection(lineNum);
    activeSection.linhaFim = lineNum;

    if (clauseMatch) {
      const clauseNum = clauseMatch[1];
      const clauseContent = clauseMatch[2].trim();
      const clauseId = `${activeSection.id}-cls-${activeSection.clausulas.length + 1}`;

      currentClause = {
        id: clauseId,
        numero: clauseNum,
        titulo: `Item ${clauseNum}`,
        conteudo: clauseContent,
        linhaInicio: lineNum,
        linhaFim: lineNum,
        referenciasNormativas: extractNormativeRefs(
          trimmed,
          lineNum,
          clauseId
        ),
      };
      activeSection.clausulas.push(currentClause);
      return;
    }

    if (currentClause) {
      currentClause.conteudo = `${currentClause.conteudo} ${trimmed}`.trim();
      currentClause.linhaFim = lineNum;
      const extraRefs = extractNormativeRefs(
        trimmed,
        lineNum,
        `${currentClause.id}-l${lineNum}`
      );
      extraRefs.forEach((r) => {
        if (
          !currentClause!.referenciasNormativas.some(
            (existing) =>
              existing.texto.toLowerCase() === r.texto.toLowerCase()
          )
        ) {
          currentClause!.referenciasNormativas.push(r);
        }
      });
    } else {
      const clauseId = `${activeSection.id}-cls-${activeSection.clausulas.length + 1}`;
      const newClause: ClauseNode = {
        id: clauseId,
        numero: `${activeSection.numero}.${activeSection.clausulas.length + 1}`,
        titulo: `Parágrafo ${activeSection.clausulas.length + 1}`,
        conteudo: trimmed,
        linhaInicio: lineNum,
        linhaFim: lineNum,
        referenciasNormativas: extractNormativeRefs(trimmed, lineNum, clauseId),
      };
      activeSection.clausulas.push(newClause);
      currentClause = newClause;
    }
  });

  let totalClausulas = 0;
  let totalReferenciasNormativas = 0;

  secoes.forEach((sec) => {
    totalClausulas += sec.clausulas.length;
    totalReferenciasNormativas += sec.referenciasNormativas.length;
    sec.clausulas.forEach((cls) => {
      totalReferenciasNormativas += cls.referenciasNormativas.length;
    });
  });

  return {
    nomeArquivo,
    totalLinhas: lines.length,
    totalSecoes: secoes.length,
    totalClausulas,
    totalReferenciasNormativas,
    secoes,
  };
}

function normalizeForMatch(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function mapFindingToAstPath(
  ast: DocumentAstRoot,
  finding: AuditFinding
): AstLocationMatch {
  const excerptNorm = normalizeForMatch(finding.trecho_original);
  const excerptTokens = excerptNorm
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 4);

  let bestScore = 0;
  let bestMatch: AstLocationMatch = {
    caminhoEstrutural:
      ast.secoes[0]
        ? `Seção ${ast.secoes[0].numero} (${ast.secoes[0].titulo.slice(0, 32)})`
        : 'Documento Integral',
    secaoId: ast.secoes[0]?.id ?? null,
    clausulaId: null,
  };

  for (const sec of ast.secoes) {
    const secLabel =
      sec.numero === '0'
        ? sec.titulo
        : `Seção ${sec.numero}`;

    for (const cls of sec.clausulas) {
      const clsNorm = normalizeForMatch(`${cls.numero} ${cls.conteudo}`);
      let score = 0;

      if (excerptNorm.length >= 16 && clsNorm.includes(excerptNorm.slice(0, 36))) {
        score += 100;
      } else {
        for (const tok of excerptTokens) {
          if (clsNorm.includes(tok)) score += 1;
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestMatch = {
          caminhoEstrutural: `${secLabel} > ${cls.titulo}`,
          secaoId: sec.id,
          clausulaId: cls.id,
        };
      }
    }
  }

  return bestMatch;
}

export function summarizeAstForPrompt(ast: DocumentAstRoot): string {
  if (ast.secoes.length === 0) return 'Nenhuma seção numerada detectada.';
  return ast.secoes
    .slice(0, 12)
    .map((sec) => {
      const items = sec.clausulas
        .slice(0, 6)
        .map((c) => c.titulo)
        .join(', ');
      return `- Seção ${sec.numero} (${sec.titulo}): ${items || 'Texto livre'}`;
    })
    .join('\n');
}
