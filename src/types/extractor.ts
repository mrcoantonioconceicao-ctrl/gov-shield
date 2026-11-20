export type SomatorioAtestados = 'SIM' | 'NAO' | 'OMISSO';

export type BarreiraTipo =
  | 'INDICACAO_MARCA'
  | 'RESTRICAO_GEOGRAFICA_SEDE'
  | 'VISTORIA_PRESENCIAL'
  | 'PRAZO_ENTREGA_IMPLANTACAO'
  | 'AGLUTINACAO_LOTE_UNICO'
  | 'EXIGENCIA_LGPD_CIBER'
  | 'OUTRA_BARREIRA';

export interface TechnicalRequirementDetail {
  clausula: string;
  descricao_objetiva: string;
  trecho_literal: string;
}

export interface OperationalBarrier {
  tipo: BarreiraTipo;
  clausula: string;
  valor_ou_prazo: string;
  trecho_literal: string;
}

export interface Step2ExtractorResult {
  qualificacao_tecnica: {
    exige_atestado_capacidade: boolean;
    percentual_minimo_exigido: number;
    permite_somatorio_atestados: SomatorioAtestados;
    exige_vinculo_previo_equipe: boolean;
    exige_certificacoes_especificas: string[];
    exigencias_tecnicas_detalhadas: TechnicalRequirementDetail[];
  };
  qualificacao_economica: {
    exige_capital_ou_patrimonio: boolean;
    percentual_exigido: number;
    valor_minimo_reais: number;
    indices_contabeis_exigidos: string;
    exige_garantia_proposta: boolean;
    trecho_literal: string;
  };
  barreiras_operacionais_e_restricoes: OperationalBarrier[];
  tempo_execucao_segundos?: number;
}
