export type RiskCategory = 'VIOLACAO_LEGAL' | 'RISCO_IMPUGNACAO_TCESC' | 'LACUNA_CIBER_LGPD';

export type RiskSeverity = 'CRITICO' | 'ALTO' | 'MODERADO';

export type AuditStatus = 'APROVADO_COM_RESSALVAS' | 'REQUER_RETIFICACAO_PREVIA' | 'ALTO_RISCO_IMPUGNACAO';

export interface AuditFinding {
  id: string;
  regra_id: string;
  categoria: RiskCategory;
  severidade: RiskSeverity;
  titulo: string;
  fundamentacao_legal: string;
  trecho_original: string;
  impacto_operacional: string;
  sugestao_retificacao: string;
}

export interface DependencyNode {
  id: string;
  tipo: 'CLAUSULA' | 'LEI' | 'RISCO' | 'SECRETARIA';
  label: string;
}

export interface DependencyEdge {
  origem: string;
  destino: string;
  relacao: 'VIOLA' | 'EXIGE' | 'IMPACTA';
}

export interface AuditReport {
  sha256_documento: string;
  nome_arquivo: string;
  timestamp_auditoria: string;
  metadados_documento: {
    orgao_identificado: string;
    numero_edital_ou_processo: string;
    objeto_resumido: string;
    modalidade: string;
  };
  score_risco_global: number; // 0 a 100
  status_parecer: AuditStatus;
  metricas_economia: {
    tempo_estimado_revisao_humana_minutos: number;
    tempo_execucao_segundos: number;
    clausulas_criticas_detectadas: number;
  };
  achados: AuditFinding[];
  grafo_dependencias: {
    nos: DependencyNode[];
    arestas: DependencyEdge[];
  };
}
