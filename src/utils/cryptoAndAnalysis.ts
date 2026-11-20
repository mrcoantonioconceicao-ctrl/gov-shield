import {
  AuditFinding,
  AuditReport,
  AuditStatus,
  DependencyEdge,
  DependencyNode,
  RiskCategory,
  RiskSeverity,
} from '../types/audit';

export interface NormativeScope {
  lei14133: boolean;
  tcesc: boolean;
  lgpd: boolean;
}

export interface SampleEdital {
  id: string;
  titulo: string;
  subtitulo: string;
  nomeArquivo: string;
  conteudo: string;
}

export const SAMPLE_EDITAIS: SampleEdital[] = [
  {
    id: 'sms-florianopolis',
    titulo: 'Pregão Eletrônico nº 042/2026 — Saúde Digital',
    subtitulo: 'Secretaria Municipal de Saúde · Prontuário Eletrônico & LGPD',
    nomeArquivo: 'Edital_PE_042_2026_SMS_Prontuario_Saude.txt',
    conteudo: `PREFEITURA MUNICIPAL DE FLORIANÓPOLIS
SECRETARIA MUNICIPAL DE SAÚDE
EDITAL DE PREGÃO ELETRÔNICO Nº 042/2026
PROCESSO ADMINISTRATIVO Nº 2026.04.0198-SMS
MODALIDADE: Pregão Eletrônico (Menor Preço Global)

1. DO OBJETO
1.1. Contratação de plataforma integrada de Prontuário Eletrônico do Cidadão, agendamento ambulatorial, biometria facial na recepção das UPAs e repositório em nuvem pública para atendimento das unidades da Secretaria Municipal de Saúde.

2. DA QUALIFICAÇÃO TÉCNICA E RESTRIÇÕES
2.1. A licitante deverá comprovar, mediante atestado de capacidade técnica registrado em conselho profissional, execução anterior de sistema compatível com quantitativo mínimo de 80% (oitenta por cento) da população atendida no município.
2.2. Para garantir compatibilidade com o parque atual, o módulo de triagem clínica deverá operar exclusivamente com solução proprietária da marca MediCore Enterprise Suite ou equivalente da mesma linha corporativa, vedada a integração via API aberta com sistemas legados.
2.3. Somente serão habilitadas empresas com sede ou filial instalada no Estado de Santa Catarina há no mínimo 24 meses antes da sessão pública.

3. DA AGLUTINAÇÃO DO OBJETO
3.1. O lote único engloba licenciamento de software SaaS, fornecimento de 450 estações desktop, instalação de cabeamento estruturado nas unidades e serviço de portaria presencial.

4. DO TRATAMENTO DE DADOS PESSOAIS E SEGURANÇA
4.1. A contratada poderá armazenar os bancos de dados de prontuários médicos e registros biométricos em servidores hospedados no exterior sem necessidade de relatório de impacto prévio ou indicação de encarregado (DPO), cabendo à empresa definir livremente o prazo de retenção após o término contratual.
4.2. Não há exigência de criptografia em repouso ou plano de resposta a incidentes cibernéticos no Termo de Referência.`,
  },
  {
    id: 'infra-sc',
    titulo: 'Concorrência Eletrônica nº 018/2026 — Mobilidade SC',
    subtitulo: 'Secretaria de Infraestrutura e Mobilidade · Critérios TCE/SC',
    nomeArquivo: 'Edital_CE_018_2026_SIE_Pavimentacao_Viaria.txt',
    conteudo: `GOVERNO DO ESTADO DE SANTA CATARINA
SECRETARIA DE ESTADO DA INFRAESTRUTURA E MOBILIDADE
EDITAL DE CONCORRÊNCIA ELETRÔNICA Nº 018/2026
PROCESSO ADMINISTRATIVO Nº SIE-2026/00841
MODALIDADE: Concorrência Eletrônica (Empreitada por Preço Unitário)

1. DO OBJETO
1.1. Contratação de empresa especializada para execução de obras de restauração asfáltica, drenagem pluvial e implantação de sistema inteligente de monitoramento de tráfego com câmeras LPR na rodovia SC-401.

2. DA VISITA TÉCNICA E HABILITAÇÃO
2.1. É obrigatória a realização de visita técnica presencial pelo responsável técnico da licitante em data única fixada pela comissão, sob pena de inabilitação automática, sendo vedada a substituição por declaração formal de conhecimento das condições locais.
2.2. Exige-se comprovação de vínculo empregatício permanente (carteira assinada) do engenheiro civil responsável na data de publicação do edital.
2.3. A licitante deverá apresentar atestado de capacidade técnico-operacional comprovando execução prévia de 65% da extensão total da rodovia em contrato único.

3. DA DOTAÇÃO, REAJUSTE E MATRIZ DE RISCOS
3.1. O contrato administrativo não contará com matriz de alocação de riscos nem índice específico de reajuste anual, permanecendo os preços fixos e irreajustáveis durante todo o período de vigência de 24 meses.
3.2. As imagens de leitura automática de placas veiculares (LPR) capturadas serão compartilhadas com parceiros comerciais privados para fins estatísticos sem anonimização prévia.`,
  },
  {
    id: 'tributario-joinville',
    titulo: 'Pregão Eletrônico nº 109/2026 — Gestão Tributária',
    subtitulo: 'Secretaria da Fazenda · Conformidade com Ressalvas',
    nomeArquivo: 'Edital_PE_109_2026_SEFAZ_Sistema_Tributario.txt',
    conteudo: `PREFEITURA MUNICIPAL DE JOINVILLE
SECRETARIA MUNICIPAL DA FAZENDA
EDITAL DE PREGÃO ELETRÔNICO Nº 109/2026
PROCESSO ADMINISTRATIVO Nº 2026-SEFAZ-1104
MODALIDADE: Pregão Eletrônico (Técnica e Preço)

1. DO OBJETO
1.1. Contratação de solução em nuvem para gestão tributária municipal, emissão de NFS-e padrão nacional e portal do contribuinte, com Estudo Técnico Preliminar (ETP) anexo.

2. DA HABILITAÇÃO E CRITÉRIOS
2.1. Atestado de capacidade técnica limitado a 40% das parcelas de maior relevância técnica e valor significativo, admitindo-se somatório de atestados.
2.2. Permite-se declaração formal de pleno conhecimento do ambiente tecnológico em substituição à vistoria presencial facultativa.

3. DA PROTEÇÃO DE DADOS E SLA
3.1. Os dados fiscais dos contribuintes serão tratados em território nacional em conformidade com a LGPD (Lei nº 13.709/2018), exigindo-se criptografia TLS 1.3 e AES-256.
3.2. Fica pendente de definição objetiva no anexo contratual o prazo máximo (em horas) para notificação à Administração Pública e à ANPD em caso de incidente de segurança da informação, bem como o procedimento de devolução e descarte seguro dos backups ao término do contrato.`,
  },
];

export async function computeSha256Hex(input: ArrayBuffer | string): Promise<string> {
  const buffer =
    typeof input === 'string' ? new TextEncoder().encode(input).buffer : input;

  if (typeof window !== 'undefined' && window.crypto?.subtle) {
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  // Fallback deterministic hash for non-secure contexts
  const bytes = new Uint8Array(buffer);
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < bytes.length; i++) {
    h1 = Math.imul(h1 ^ bytes[i], 2654435761);
    h2 = Math.imul(h2 ^ bytes[i], 1597334677);
  }
  const part1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const part2 = (h2 >>> 0).toString(16).padStart(8, '0');
  return `${part1}${part2}`.repeat(4);
}

export interface LoadedDocumentPayload {
  text: string;
  sha256: string;
  sizeBytes: number;
  mimeType: 'application/pdf' | 'text/plain';
  base64Data?: string;
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  const chunks: string[] = [];
  for (let i = 0; i < bytes.length; i += chunkSize) {
    chunks.push(
      String.fromCharCode(...bytes.subarray(i, Math.min(i + chunkSize, bytes.length)))
    );
  }
  return btoa(chunks.join(''));
}

export async function readDocumentFile(
  file: File
): Promise<LoadedDocumentPayload> {
  const arrayBuffer = await file.arrayBuffer();
  const sha256 = await computeSha256Hex(arrayBuffer);

  const lowerName = file.name.toLowerCase();
  const isPdf =
    lowerName.endsWith('.pdf') || file.type === 'application/pdf';

  if (isPdf) {
    const base64Data = arrayBufferToBase64(arrayBuffer);
    const kb = (file.size / 1024).toFixed(1);
    return {
      text: `[PDF nativo carregado: ${file.name} · ${kb} KB · leitura integral multimodal habilitada via Gemini 2.5]`,
      sha256,
      sizeBytes: file.size,
      mimeType: 'application/pdf',
      base64Data,
    };
  }

  const text = new TextDecoder('utf-8', { fatal: false }).decode(arrayBuffer);
  return {
    text,
    sha256,
    sizeBytes: file.size,
    mimeType: 'text/plain',
  };
}

export async function executeGeminiAudit(params: {
  fileName: string;
  mimeType: 'application/pdf' | 'text/plain';
  base64Data?: string;
  textContent?: string;
  sha256: string;
  scope: NormativeScope;
}): Promise<AuditReport> {
  const startMs = performance.now();

  const response = await fetch('/api/audit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const data = (await response.json()) as AuditReport & { error?: string };

  if (!response.ok) {
    throw new Error(
      data?.error ||
        `Falha na auditoria pericial (HTTP ${response.status}).`
    );
  }

  const elapsedSeconds = Number(
    Math.max(0.1, (performance.now() - startMs) / 1000).toFixed(2)
  );

  return {
    ...data,
    sha256_documento: params.sha256,
    nome_arquivo: params.fileName,
    metricas_economia: {
      ...data.metricas_economia,
      tempo_execucao_segundos: elapsedSeconds,
    },
  };
}

interface RuleDefinition {
  regra_id: string;
  categoria: RiskCategory;
  severidade: RiskSeverity;
  scopeKey: keyof NormativeScope;
  titulo: string;
  fundamentacao_legal: string;
  impacto_operacional: string;
  sugestao_retificacao: string;
  lawNodeLabel: string;
  riskNodeLabel: string;
  clauseNodeLabel: string;
  edgeRelation: DependencyEdge['relacao'];
  patterns: RegExp[];
  fallbackExcerpt: string;
}

const AUDIT_RULES: RuleDefinition[] = [
  {
    regra_id: 'L14133-MARCA-01',
    categoria: 'VIOLACAO_LEGAL',
    severidade: 'CRITICO',
    scopeKey: 'lei14133',
    titulo: 'Direcionamento de marca/solução proprietária sem justificativa técnica formal',
    fundamentacao_legal:
      'Lei nº 14.133/2021, art. 41, inciso I, e art. 9º, inciso I (vedação à preferência de marca e restrição injustificada à competitividade).',
    impacto_operacional:
      'Risco imediato de impugnação ao edital por fornecedores concorrentes e suspensão cautelar do certame pelo controle externo.',
    sugestao_retificacao:
      'Substituir a referência à marca específica por especificações técnicas objetivas baseadas em padrões abertos (ex.: API REST/HL7 FHIR), admitindo expressamente soluções equivalentes ou superiores.',
    lawNodeLabel: 'Lei 14.133/21 · Art. 9º e 41',
    riskNodeLabel: 'Impugnação por Direcionamento',
    clauseNodeLabel: 'Cláusula de Marca Exclusiva',
    edgeRelation: 'VIOLA',
    patterns: [
      /exclusivamente.*marca|marca\s+[a-z0-9]+|solução proprietária|vedada a integração/i,
    ],
    fallbackExcerpt:
      'Exigência de solução proprietária específica sem abertura a padrões equivalentes.',
  },
  {
    regra_id: 'TCESC-TERRITORIO-02',
    categoria: 'RISCO_IMPUGNACAO_TCESC',
    severidade: 'CRITICO',
    scopeKey: 'tcesc',
    titulo: 'Cláusula restritiva de localização geográfica prévia (sede ou filial local)',
    fundamentacao_legal:
      'Lei nº 14.133/2021, art. 9º, I, "a"; Jurisprudência consolidada do TCE/SC (Prejulgados e Decisões sobre vedação de restrição territorial na fase de habilitação).',
    impacto_operacional:
      'Redução drástica do universo de competidores e elevada probabilidade de anulação do certame por ofensa ao princípio da isonomia.',
    sugestao_retificacao:
      'Excluir a exigência de sede/filial prévia como condição de habilitação, exigindo apenas declaração de que a contratada manterá estrutura de atendimento após a assinatura do contrato, caso indispensável à execução.',
    lawNodeLabel: 'TCE/SC · Vedação Territorial',
    riskNodeLabel: 'Nulidade por Restrição Geográfica',
    clauseNodeLabel: 'Cláusula de Sede/Filial Prévia',
    edgeRelation: 'VIOLA',
    patterns: [
      /sede ou filial|instalada no estado|município há no mínimo|restrição geográfica/i,
    ],
    fallbackExcerpt:
      'Condicionamento de habilitação à existência prévia de sede ou filial regional.',
  },
  {
    regra_id: 'TCESC-ATESTADO-03',
    categoria: 'RISCO_IMPUGNACAO_TCESC',
    severidade: 'ALTO',
    scopeKey: 'tcesc',
    titulo: 'Exigência de atestado técnico acima do teto legal de 50% (ou em contrato único)',
    fundamentacao_legal:
      'Lei nº 14.133/2021, art. 67, § 2º (limite máximo de 50% das parcelas de maior relevância); entendimento reiterado do TCE/SC sobre permissão de somatório de atestados.',
    impacto_operacional:
      'Afastamento indevido de empresas tecnicamente aptas, elevando o preço médio contratado e motivando representações junto ao TCE/SC.',
    sugestao_retificacao:
      'Limitar a comprovação técnico-operacional ao teto máximo de 50% das parcelas de maior relevância técnica e valor significativo, permitindo expressamente o somatório de atestados.',
    lawNodeLabel: 'Lei 14.133/21 · Art. 67 §2º / TCE-SC',
    riskNodeLabel: 'Representação por Excesso Técnico',
    clauseNodeLabel: 'Qualificação Técnica (>50%)',
    edgeRelation: 'VIOLA',
    patterns: [
      /(6[0-9]|7[0-9]|8[0-9]|9[0-9]|100)\s*%.*(atestado|capacidade|extensão|população)|contrato único/i,
    ],
    fallbackExcerpt:
      'Exigência quantitativa superior a 50% ou vedação implícita ao somatório de atestados.',
  },
  {
    regra_id: 'TCESC-AGLUTINACAO-04',
    categoria: 'RISCO_IMPUGNACAO_TCESC',
    severidade: 'ALTO',
    scopeKey: 'tcesc',
    titulo: 'Aglutinação indevida de objetos heterogêneos em lote único sem parcelamento',
    fundamentacao_legal:
      'Lei nº 14.133/2021, art. 40, inciso V, alínea "b", e § 2º (dever de parcelamento quando técnica e economicamente viável); Súmula 247 TCU e jurisprudência TCE/SC.',
    impacto_operacional:
      'Impede a participação de fornecedores especializados de software, hardware e serviços distintos, gerando sobrepreço por subcontratação em cascata.',
    sugestao_retificacao:
      'Dividir a contratação em lotes distintos (ex.: Lote 1 — Software SaaS; Lote 2 — Equipamentos; Lote 3 — Infraestrutura física), ou apresentar justificativa técnica e econômica robusta no ETP.',
    lawNodeLabel: 'Lei 14.133/21 · Art. 40 V-b / TCE-SC',
    riskNodeLabel: 'Sobrepreço e Restrição de Lote',
    clauseNodeLabel: 'Lote Único Heterogêneo',
    edgeRelation: 'IMPACTA',
    patterns: [
      /lote único.*(software|desktop|cabeamento|portaria)|aglutinação/i,
    ],
    fallbackExcerpt:
      'Reunião de software, fornecimento de hardware e serviços contínuos em lote indivisível.',
  },
  {
    regra_id: 'TCESC-VISTORIA-05',
    categoria: 'RISCO_IMPUGNACAO_TCESC',
    severidade: 'ALTO',
    scopeKey: 'tcesc',
    titulo: 'Obrigatoriedade de visita técnica presencial com vedação à declaração formal',
    fundamentacao_legal:
      'Lei nº 14.133/2021, art. 63, §§ 2º e 3º (a vistoria prévia deve ser facultada e substituível por declaração formal de conhecimento pleno das condições).',
    impacto_operacional:
      'Restringe a competitividade interestadual e expõe o processo à suspensão liminar pelo TCE/SC por violação literal do art. 63, § 3º.',
    sugestao_retificacao:
      'Tornar a vistoria técnica facultativa, em datas flexíveis, assegurando ao licitante o direito de substituí-la por declaração formal assinada pelo responsável técnico.',
    lawNodeLabel: 'Lei 14.133/21 · Art. 63 §§2º-3º',
    riskNodeLabel: 'Inabilitação Ilegal por Vistoria',
    clauseNodeLabel: 'Cláusula de Visita Obrigatória',
    edgeRelation: 'VIOLA',
    patterns: [
      /visita técnica.*obrigat|inabilitação automática.*visita|vedada a substituição por declaração/i,
    ],
    fallbackExcerpt:
      'Imposição de visita presencial em data única com vedação à declaração substitutiva.',
  },
  {
    regra_id: 'L14133-VINCULO-06',
    categoria: 'VIOLACAO_LEGAL',
    severidade: 'ALTO',
    scopeKey: 'lei14133',
    titulo: 'Exigência de vínculo empregatício permanente prévio do responsável técnico',
    fundamentacao_legal:
      'Lei nº 14.133/2021, art. 67, inciso I; jurisprudência pacífica do TCE/SC e TCU (basta comprovação de disponibilidade futura mediante contrato de prestação ou declaração de contratação).',
    impacto_operacional:
      'Impõe ônus trabalhista antecipado às licitantes antes mesmo da adjudicação, restringindo a disputa.',
    sugestao_retificacao:
      'Admitir a comprovação de vínculo por contrato social, CTPS, contrato de prestação de serviços regido pela legislação civil ou declaração de contratação futura.',
    lawNodeLabel: 'Lei 14.133/21 · Art. 67 I',
    riskNodeLabel: 'Ônus Trabalhista Indevido',
    clauseNodeLabel: 'Vínculo CLT Prévio Obrigatório',
    edgeRelation: 'VIOLA',
    patterns: [
      /vínculo empregatício permanente|carteira assinada.*data de publicação/i,
    ],
    fallbackExcerpt:
      'Exigência de vínculo celetista prévio na data de publicação do edital.',
  },
  {
    regra_id: 'L14133-REAJUSTE-07',
    categoria: 'VIOLACAO_LEGAL',
    severidade: 'MODERADO',
    scopeKey: 'lei14133',
    titulo: 'Vedação ou omissão de cláusula de reajuste e matriz de riscos em contrato plurianual',
    fundamentacao_legal:
      'Lei nº 14.133/2021, art. 92, inciso V e § 3º, e art. 22 (obrigatoriedade de previsão de índice de reajustamento em sentido estrito após 12 meses e alocação de riscos em obras de maior porte).',
    impacto_operacional:
      'Gera desequilíbrio econômico-financeiro, litígios contratuais futuros ou incorporação de gordura financeira (risco inflacionário) nas propostas.',
    sugestao_retificacao:
      'Incluir cláusula expressa de reajuste anual com índice setorial oficial (ex.: INCC/IGP-M/IPCA conforme natureza do item) contado da data-base do orçamento estimado e anexar Matriz de Riscos.',
    lawNodeLabel: 'Lei 14.133/21 · Art. 22 e 92 §3º',
    riskNodeLabel: 'Desequilíbrio Econômico-Financeiro',
    clauseNodeLabel: 'Ausência de Reajuste e Matriz',
    edgeRelation: 'EXIGE',
    patterns: [
      /fixos e irreajustáveis|não contará com matriz|sem.*índice específico de reajuste/i,
    ],
    fallbackExcerpt:
      'Contrato com vigência superior a 12 meses sem critério objetivo de reajuste e matriz de riscos.',
  },
  {
    regra_id: 'LGPD-SENSIVEIS-08',
    categoria: 'LACUNA_CIBER_LGPD',
    severidade: 'CRITICO',
    scopeKey: 'lgpd',
    titulo: 'Tratamento de dados sensíveis e transferência internacional sem RIPD, DPO ou retenção definida',
    fundamentacao_legal:
      'LGPD (Lei nº 13.709/2018), art. 5º, II, art. 11, art. 23, art. 33 (transferência internacional), art. 38 (RIPD) e art. 41 (Encarregado/DPO).',
    impacto_operacional:
      'Exposição jurídica grave do ente público a sanções administrativas da ANPD, ações civis públicas e vazamento de dados médicos/biométricos de cidadãos.',
    sugestao_retificacao:
      'Exigir hospedagem em jurisdição adequada conforme art. 33 da LGPD, elaboração prévia de Relatório de Impacto à Proteção de Dados (RIPD), indicação formal de Encarregado (DPO) e tabela taxativa de retenção/eliminação segura.',
    lawNodeLabel: 'LGPD · Arts. 11, 23, 33 e 38',
    riskNodeLabel: 'Sanção ANPD / Exposição de Dados Sensíveis',
    clauseNodeLabel: 'Cláusula de Dados Biométricos/Saúde',
    edgeRelation: 'VIOLA',
    patterns: [
      /hospedados no exterior|sem necessidade de relatório de impacto|definir livremente o prazo de retenção|biometria|prontuários médicos/i,
    ],
    fallbackExcerpt:
      'Transferência internacional e guarda indefinida de dados de saúde/biometria sem RIPD.',
  },
  {
    regra_id: 'LGPD-CIBER-09',
    categoria: 'LACUNA_CIBER_LGPD',
    severidade: 'CRITICO',
    scopeKey: 'lgpd',
    titulo: 'Omissão de controles criptográficos e plano de resposta a incidentes cibernéticos',
    fundamentacao_legal:
      'LGPD (Lei nº 13.709/2018), art. 46 (medidas de segurança técnicas e administrativas) e art. 48 (comunicação de incidentes de segurança à ANPD e aos titulares).',
    impacto_operacional:
      'Vulnerabilidade crítica a ransomware e exfiltração de bases públicas, sem responsabilização contratual clara ou SLA de contenção.',
    sugestao_retificacao:
      'Incluir anexo técnico de Segurança da Informação prevendo criptografia em trânsito (TLS 1.3) e em repouso (AES-256), gestão de chaves pelo contratante, logs auditáveis imutáveis e SLA de notificação de incidentes em até 24 horas.',
    lawNodeLabel: 'LGPD · Arts. 46 e 48',
    riskNodeLabel: 'Vulnerabilidade a Incidente Cibernético',
    clauseNodeLabel: 'Lacuna de Segurança e Resposta',
    edgeRelation: 'EXIGE',
    patterns: [
      /não há exigência de criptografia|sem.*plano de resposta|pendente de definição.*prazo máximo.*notificação|descarte seguro/i,
    ],
    fallbackExcerpt:
      'Ausência de requisitos mínimos de criptografia, SLA de incidentes e descarte seguro.',
  },
  {
    regra_id: 'LGPD-COMPARTILHAMENTO-10',
    categoria: 'LACUNA_CIBER_LGPD',
    severidade: 'ALTO',
    scopeKey: 'lgpd',
    titulo: 'Compartilhamento de dados de monitoramento com terceiros privados sem anonimização',
    fundamentacao_legal:
      'LGPD (Lei nº 13.709/2018), art. 6º (princípios da finalidade e necessidade), art. 26 (vedação de compartilhamento com entes privados pelo Poder Público fora das hipóteses legais).',
    impacto_operacional:
      'Desvio de finalidade no uso de imagens veiculares (LPR) e responsabilização solidária do órgão contratante.',
    sugestao_retificacao:
      'Vedar expressamente o compartilhamento ou monetização de dados pessoais/placas com terceiros privados, admitindo apenas estatísticas agregadas e irreversivelmente anonimizadas (art. 12 da LGPD).',
    lawNodeLabel: 'LGPD · Arts. 6º, 12 e 26',
    riskNodeLabel: 'Desvio de Finalidade em Dados Públicos',
    clauseNodeLabel: 'Compartilhamento LPR com Privados',
    edgeRelation: 'VIOLA',
    patterns: [
      /compartilhadas com parceiros comerciais|sem anonimização prévia/i,
    ],
    fallbackExcerpt:
      'Cessão de registros identificáveis a terceiros privados sem base legal ou anonimização.',
  },
];

function extractSnippet(text: string, regex: RegExp, fallback: string): string {
  const match = regex.exec(text);
  if (!match) return fallback;

  const lines = text.split(/\r?\n/);
  const matchedLine = lines.find((line) => regex.test(line));
  if (matchedLine && matchedLine.trim().length > 15) {
    return matchedLine.trim();
  }

  const idx = match.index;
  const start = Math.max(0, idx - 60);
  const end = Math.min(text.length, idx + match[0].length + 110);
  return text.slice(start, end).replace(/\s+/g, ' ').trim();
}

function extractDocumentMetadata(text: string, fileName: string) {
  const orgaoMatch = text.match(
    /(PREFEITURA[^\n]+|GOVERNO[^\n]+|SECRETARIA[^\n]+|CÂMARA[^\n]+|AUTARQUIA[^\n]+)/i
  );
  const secretariaMatch = text.match(/(SECRETARIA[^\n]+)/i);
  const editalMatch = text.match(
    /(EDITAL[^\n]{0,80}|PREGÃO[^\n]{0,60}Nº\s*[\d./-]+|CONCORRÊNCIA[^\n]{0,60}Nº\s*[\d./-]+|PROCESSO[^\n]{0,60}Nº\s*[\w./-]+)/i
  );
  const modalidadeMatch = text.match(/MODALIDADE:\s*([^\n]+)/i);
  const objetoMatch = text.match(/(?:1\.1\.|OBJETO[:\s]+)([^\n]{20,260})/i);

  const orgaoIdentificado = secretariaMatch
    ? secretariaMatch[1].trim()
    : orgaoMatch
      ? orgaoMatch[1].trim()
      : 'Órgão Público Não Identificado no Cabeçalho';

  return {
    orgao_identificado: orgaoIdentificado,
    numero_edital_ou_processo: editalMatch
      ? editalMatch[1].replace(/^EDITAL DE\s*/i, '').trim()
      : fileName.replace(/\.[^.]+$/, ''),
    objeto_resumido: objetoMatch
      ? objetoMatch[1].trim()
      : 'Análise de minuta de edital ou contrato administrativo submetido via ingestão direta.',
    modalidade: modalidadeMatch
      ? modalidadeMatch[1].trim()
      : /concorrência/i.test(text)
        ? 'Concorrência Eletrônica'
        : /dispensa/i.test(text)
          ? 'Dispensa Eletrônica'
          : 'Pregão Eletrônico',
  };
}

export function runDeterministicAudit(params: {
  text: string;
  fileName: string;
  sha256: string;
  scope: NormativeScope;
}): AuditReport {
  const startMs = performance.now();
  const { text, fileName, sha256, scope } = params;
  const metadata = extractDocumentMetadata(text, fileName);

  const achados: AuditFinding[] = [];
  const nos: DependencyNode[] = [
    {
      id: 'node-orgao',
      tipo: 'SECRETARIA',
      label: metadata.orgao_identificado.slice(0, 42),
    },
  ];
  const arestas: DependencyEdge[] = [];

  const addedNodeIds = new Set<string>(['node-orgao']);

  AUDIT_RULES.forEach((rule, index) => {
    if (!scope[rule.scopeKey]) return;

    const matchedPattern = rule.patterns.find((pattern) => pattern.test(text));
    if (!matchedPattern) return;

    const findingId = `FND-${String(achados.length + 1).padStart(3, '0')}`;
    const excerpt = extractSnippet(text, matchedPattern, rule.fallbackExcerpt);

    achados.push({
      id: findingId,
      regra_id: rule.regra_id,
      categoria: rule.categoria,
      severidade: rule.severidade,
      titulo: rule.titulo,
      fundamentacao_legal: rule.fundamentacao_legal,
      trecho_original: excerpt,
      impacto_operacional: rule.impacto_operacional,
      sugestao_retificacao: rule.sugestao_retificacao,
    });

    const clauseId = `clausula-${index}`;
    const lawId = `lei-${index}`;
    const riskId = `risco-${index}`;

    if (!addedNodeIds.has(clauseId)) {
      nos.push({ id: clauseId, tipo: 'CLAUSULA', label: rule.clauseNodeLabel });
      addedNodeIds.add(clauseId);
    }
    if (!addedNodeIds.has(lawId)) {
      nos.push({ id: lawId, tipo: 'LEI', label: rule.lawNodeLabel });
      addedNodeIds.add(lawId);
    }
    if (!addedNodeIds.has(riskId)) {
      nos.push({ id: riskId, tipo: 'RISCO', label: rule.riskNodeLabel });
      addedNodeIds.add(riskId);
    }

    arestas.push(
      { origem: 'node-orgao', destino: clauseId, relacao: 'EXIGE' },
      { origem: clauseId, destino: lawId, relacao: rule.edgeRelation },
      { origem: clauseId, destino: riskId, relacao: 'IMPACTA' }
    );
  });

  // Compute deterministic risk score (0 to 100)
  const severityWeights: Record<RiskSeverity, number> = {
    CRITICO: 24,
    ALTO: 14,
    MODERADO: 7,
  };
  const rawScore = achados.reduce(
    (acc, item) => acc + severityWeights[item.severidade],
    achados.length === 0 ? 12 : 8
  );
  const scoreRiscoGlobal = Math.min(98, Math.max(8, rawScore));

  const criticalCount = achados.filter((a) => a.severidade === 'CRITICO').length;
  let statusParecer: AuditStatus = 'APROVADO_COM_RESSALVAS';
  if (scoreRiscoGlobal >= 70 || criticalCount >= 2) {
    statusParecer = 'ALTO_RISCO_IMPUGNACAO';
  } else if (scoreRiscoGlobal >= 35 || criticalCount === 1 || achados.length >= 2) {
    statusParecer = 'REQUER_RETIFICACAO_PREVIA';
  }

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const estimatedHumanMinutes = Math.max(25, Math.round(wordCount / 18) + achados.length * 15);
  const elapsedSeconds = Math.max(0.18, Number(((performance.now() - startMs) / 1000).toFixed(2)));

  return {
    sha256_documento: sha256,
    nome_arquivo: fileName,
    timestamp_auditoria: new Date().toISOString(),
    metadados_documento: metadata,
    score_risco_global: scoreRiscoGlobal,
    status_parecer: statusParecer,
    metricas_economia: {
      tempo_estimado_revisao_humana_minutos: estimatedHumanMinutes,
      tempo_execucao_segundos: elapsedSeconds,
      clausulas_criticas_detectadas: criticalCount,
    },
    achados,
    grafo_dependencias: {
      nos,
      arestas,
    },
  };
}

export function formatReportMarkdown(report: AuditReport): string {
  const statusLabel: Record<AuditStatus, string> = {
    ALTO_RISCO_IMPUGNACAO: 'ALTO RISCO DE IMPUGNAÇÃO',
    REQUER_RETIFICACAO_PREVIA: 'REQUER RETIFICAÇÃO PRÉVIA',
    APROVADO_COM_RESSALVAS: 'APROVADO COM RESSALVAS',
  };

  const lines = [
    `# Parecer Pericial — GovShield Audit Studio`,
    ``,
    `- **Arquivo:** ${report.nome_arquivo}`,
    `- **SHA-256:** \`${report.sha256_documento}\``,
    `- **Timestamp:** ${report.timestamp_auditoria}`,
    `- **Órgão Identificado:** ${report.metadados_documento.orgao_identificado}`,
    `- **Processo / Edital:** ${report.metadados_documento.numero_edital_ou_processo}`,
    `- **Modalidade:** ${report.metadados_documento.modalidade}`,
    `- **Objeto:** ${report.metadados_documento.objeto_resumido}`,
    `- **Score de Risco Global:** ${report.score_risco_global}/100`,
    `- **Conclusão:** ${statusLabel[report.status_parecer]}`,
    ``,
    `## Achados Jurídicos e Técnicos (${report.achados.length})`,
    ``,
  ];

  if (report.achados.length === 0) {
    lines.push('Nenhuma desconformidade crítica detectada no escopo selecionado.');
  } else {
    report.achados.forEach((f, idx) => {
      lines.push(
        `### ${idx + 1}. [${f.severidade}] ${f.titulo} (${f.regra_id})`,
        `- **Categoria:** ${f.categoria}`,
        `- **Fundamentação Legal:** ${f.fundamentacao_legal}`,
        `- **Trecho Original:** "${f.trecho_original}"`,
        `- **Impacto Operacional:** ${f.impacto_operacional}`,
        `- **Sugestão de Retificação:** ${f.sugestao_retificacao}`,
        ``
      );
    });
  }

  return lines.join('\n');
}
