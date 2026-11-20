import { Download, Shield } from 'lucide-react';

export type WorkspaceTab =
  | 'triagem'
  | 'extracao'
  | 'achados'
  | 'minuta'
  | 'grafo'
  | 'arquitetura'
  | 'json'
  | 'normas';

interface TopBarProps {
  activeTab: WorkspaceTab;
  onSelectTab: (tab: WorkspaceTab) => void;
  hasReport: boolean;
  onExportMarkdown: () => void;
  onLoadDefaultSample: () => void;
}

const NAV_ITEMS: { id: WorkspaceTab; label: string }[] = [
  { id: 'triagem', label: 'Triagem' },
  { id: 'achados', label: 'Achados' },
  { id: 'minuta', label: 'Minuta Retificada' },
  { id: 'grafo', label: 'Grafo' },
  { id: 'arquitetura', label: 'Arquitetura MCP' },
  { id: 'json', label: 'Contrato JSON' },
];

export function TopBar({
  activeTab,
  onSelectTab,
  hasReport,
  onExportMarkdown,
  onLoadDefaultSample,
}: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-[#1F2937] bg-[#090D16]/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1480px] items-center justify-between gap-8 px-4 py-3 sm:px-6">
        {/* Zone 1: Single-line brand wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            onSelectTab('achados');
          }}
          className="flex items-center gap-2.5 text-base font-semibold tracking-tight text-[#F9FAFB] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6] rounded"
        >
          <Shield className="h-5 w-5 text-[#3B82F6] shrink-0" aria-hidden="true" />
          <span>GovShield Audit Studio</span>
        </a>

        {/* Zone 2: Concise single-line navigation links */}
        <nav aria-label="Navegação da auditoria" className="hidden md:flex items-center gap-6">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`relative py-1.5 text-sm font-medium whitespace-nowrap shrink-0 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6] rounded ${
                  isActive
                    ? 'text-[#F9FAFB]'
                    : 'text-[#9CA3AF] hover:text-[#F9FAFB]'
                }`}
              >
                {item.label}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 -bottom-[13px] h-[2px] bg-[#3B82F6]"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Single primary action */}
        <div className="flex items-center shrink-0">
          {hasReport ? (
            <button
              type="button"
              onClick={onExportMarkdown}
              className="inline-flex items-center gap-2 rounded-md bg-[#3B82F6] px-4 py-2 text-xs font-semibold text-[#F9FAFB] transition-colors duration-150 hover:bg-[#2563EB] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#090D16]"
            >
              <Download className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>Exportar Parecer</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onLoadDefaultSample}
              className="inline-flex items-center gap-2 rounded-md bg-[#3B82F6] px-4 py-2 text-xs font-semibold text-[#F9FAFB] transition-colors duration-150 hover:bg-[#2563EB] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#090D16]"
            >
              <span>Carregar Edital Modelo</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
