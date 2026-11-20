interface NormativeRuleRow {
  codigo: string;
  diploma: string;
  artigo: string;
  objetoControle: string;
  severidadePadrao: 'Crítico' | 'Alto' | 'Moderado';
}

const NORMATIVE_MATRIX: NormativeRuleRow[] = [
  {
    codigo: 'L14133-MARCA-01',
    diploma: 'Lei nº 14.133/2021',
    artigo: 'Art. 9º, I e Art. 41, I',
    objetoControle: 'Vedação à indicação de marca ou solução proprietária sem justificativa técnica.',
    severidadePadrao: 'Crítico',
  },
  {
    codigo: 'TCESC-TERRITORIO-02',
    diploma: 'TCE/SC · Jurisprudência',
    artigo: 'Prejulgados / Art. 9º, I, "a"',
    objetoControle: 'Proibição de exigência prévia de sede ou filial no estado/município para habilitação.',
    severidadePadrao: 'Crítico',
  },
  {
    codigo: 'TCESC-ATESTADO-03',
    diploma: 'Lei 14.133 / TCE-SC',
    artigo: 'Art. 67, § 2º',
    objetoControle: 'Teto de 50% para atestados técnico-operacionais e admissão de somatório.',
    severidadePadrao: 'Alto',
  },
  {
    codigo: 'TCESC-AGLUTINACAO-04',
    diploma: 'Lei 14.133 / TCE-SC',
    artigo: 'Art. 40, V, "b" e § 2º',
    objetoControle: 'Parcelamento obrigatório de objetos divisíveis (software, hardware e serviços).',
    severidadePadrao: 'Alto',
  },
  {
    codigo: 'TCESC-VISTORIA-05',
    diploma: 'Lei nº 14.133/2021',
    artigo: 'Art. 63, §§ 2º e 3º',
    objetoControle: 'Facultatividade de vistoria técnica e substituição por declaração formal.',
    severidadePadrao: 'Alto',
  },
  {
    codigo: 'L14133-VINCULO-06',
    diploma: 'Lei nº 14.133/2021',
    artigo: 'Art. 67, I',
    objetoControle: 'Vedação à exigência de vínculo trabalhista (CLT) prévio do responsável técnico.',
    severidadePadrao: 'Alto',
  },
  {
    codigo: 'L14133-REAJUSTE-07',
    diploma: 'Lei nº 14.133/2021',
    artigo: 'Art. 22 e Art. 92, § 3º',
    objetoControle: 'Previsão de índice objetivo de reajuste anual e matriz de alocação de riscos.',
    severidadePadrao: 'Moderado',
  },
  {
    codigo: 'LGPD-SENSIVEIS-08',
    diploma: 'LGPD · Lei nº 13.709/2018',
    artigo: 'Arts. 11, 23, 33, 38 e 41',
    objetoControle: 'RIPD, indicação de Encarregado (DPO) e limites de transferência internacional para dados sensíveis.',
    severidadePadrao: 'Crítico',
  },
  {
    codigo: 'LGPD-CIBER-09',
    diploma: 'LGPD · Lei nº 13.709/2018',
    artigo: 'Arts. 46 e 48',
    objetoControle: 'Criptografia em trânsito/repouso, descarte seguro e SLA de comunicação de incidentes.',
    severidadePadrao: 'Crítico',
  },
  {
    codigo: 'LGPD-COMPARTILHAMENTO-10',
    diploma: 'LGPD · Lei nº 13.709/2018',
    artigo: 'Arts. 6º, 12 e 26',
    objetoControle: 'Proibição de compartilhamento de dados públicos identificáveis com entes privados.',
    severidadePadrao: 'Alto',
  },
];

export function NormativeReferenceView() {
  return (
    <div>
      <div className="border-b border-[#1F2937] px-5 py-4">
        <h3 className="text-sm font-semibold text-[#F9FAFB]">
          Matriz de Regras e Critérios Normativos
        </h3>
        <p className="mt-1 text-xs text-[#9CA3AF]">
          Conjunto de regras determinísticas aplicadas nesta fundação e mapeadas para o contrato estrito do motor de auditoria.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#1F2937] bg-[#0D131F] text-[11px] font-semibold text-[#9CA3AF]">
              <th className="px-5 py-3 whitespace-nowrap">Regra ID</th>
              <th className="px-5 py-3 whitespace-nowrap">Diploma / Órgão</th>
              <th className="px-5 py-3 whitespace-nowrap">Dispositivo</th>
              <th className="px-5 py-3">Objeto de Controle Pericial</th>
              <th className="px-5 py-3 text-right whitespace-nowrap">Severidade</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1F2937] text-xs">
            {NORMATIVE_MATRIX.map((row) => {
              const sevColor =
                row.severidadePadrao === 'Crítico'
                  ? 'text-[#EF4444]'
                  : row.severidadePadrao === 'Alto'
                    ? 'text-[#F59E0B]'
                    : 'text-[#3B82F6]';

              return (
                <tr
                  key={row.codigo}
                  className="hover:bg-[#0D131F]/70 transition-colors"
                >
                  <td className="px-5 py-3 font-mono text-[#F9FAFB] whitespace-nowrap tabular-nums">
                    {row.codigo}
                  </td>
                  <td className="px-5 py-3 text-[#D1D5DB] whitespace-nowrap">
                    {row.diploma}
                  </td>
                  <td className="px-5 py-3 font-mono text-[#9CA3AF] whitespace-nowrap">
                    {row.artigo}
                  </td>
                  <td className="px-5 py-3 text-[#D1D5DB] leading-relaxed">
                    {row.objetoControle}
                  </td>
                  <td className={`px-5 py-3 text-right font-semibold whitespace-nowrap ${sevColor}`}>
                    {row.severidadePadrao}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
