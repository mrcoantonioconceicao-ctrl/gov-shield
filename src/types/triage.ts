export type TriageEsfera =
  | 'FEDERAL'
  | 'ESTADUAL'
  | 'MUNICIPAL'
  | 'CONSORCIO_PUBLICO';

export type TriageModalidade =
  | 'PREGAO_ELETRONICO'
  | 'CONCORRENCIA'
  | 'DISPENSA'
  | 'INEXIGIBILIDADE'
  | 'OUTRA';

export type TriageMode = 'full' | 'fast';

export interface Step1TriageResult {
  numero_edital: string;
  orgao_licitante: string;
  uf: string;
  esfera: TriageEsfera;
  modalidade: TriageModalidade;
  portal_disputa?: string;
  valor_estimado: number;
  valor_sigiloso: boolean;
  objeto_resumido: string;
  beneficio_me_epp: boolean;
  match_escopo: boolean;
  motivo_match: string;
  tempo_execucao_segundos?: number;
}

export interface Step1FastTriageResult {
  uf: string;
  esfera: 'FEDERAL' | 'ESTADUAL' | 'MUNICIPAL' | 'NAO_INFORMADO';
  valor_estimado: number;
  objeto_resumido: string;
  match_escopo: boolean;
}

export interface Step1FastTriageResponse {
  data: Step1FastTriageResult;
  elapsedMs: number;
}
