import { useEffect, useState } from 'react';
import { AuditWorkspace } from './components/AuditWorkspace';
import { IngestionPanel } from './components/IngestionPanel';
import { TopBar, WorkspaceTab } from './components/TopBar';
import {
  BpmnStepState,
  EnterpriseAuditBundle,
  INITIAL_BPMN_STEPS,
  orchestrateEnterpriseAudit,
} from './domain/orchestrator/auditBpmnOrchestrator';
import {
  computeSha256Hex,
  formatReportMarkdown,
  NormativeScope,
  readDocumentFile,
  SAMPLE_EDITAIS,
  SampleEdital,
} from './utils/cryptoAndAnalysis';
import {
  invokeStep1TriageFastService,
  invokeStep1TriageService,
} from './services/triageService';
import { invokeStep2ExtractorService } from './services/extractorService';
import {
  Step1FastTriageResponse,
  Step1TriageResult,
  TriageMode,
} from './types/triage';
import { Step2ExtractorResult } from './types/extractor';

export default function App() {
  const defaultSample = SAMPLE_EDITAIS[0];

  const [fileName, setFileName] = useState<string>(defaultSample.nomeArquivo);
  const [documentText, setDocumentText] = useState<string>(defaultSample.conteudo);
  const [mimeType, setMimeType] = useState<'application/pdf' | 'text/plain'>('text/plain');
  const [pdfBase64, setPdfBase64] = useState<string | undefined>(undefined);
  const [fileSizeBytes, setFileSizeBytes] = useState<number>(
    new TextEncoder().encode(defaultSample.conteudo).length
  );
  const [sha256, setSha256] = useState<string>('');
  const [selectedSampleId, setSelectedSampleId] = useState<string | null>(
    defaultSample.id
  );
  const [scope, setScope] = useState<NormativeScope>({
    lei14133: true,
    tcesc: true,
    lgpd: true,
  });
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('achados');
  const [isAuditing, setIsAuditing] = useState<boolean>(false);
  const [bpmnSteps, setBpmnSteps] = useState<BpmnStepState[]>(INITIAL_BPMN_STEPS);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [bundle, setBundle] = useState<EnterpriseAuditBundle | null>(null);
  const [auditedOriginalText, setAuditedOriginalText] = useState<string>(
    defaultSample.conteudo
  );
  const [companyProfile, setCompanyProfile] = useState<string>(
    'CNAE 6201-5/01 (Desenvolvimento de software sob encomenda) e 6311-9/00 (Tratamento de dados, hospedagem em nuvem, prontuário eletrônico e soluções de biometria digital).'
  );
  const [triageMode, setTriageMode] = useState<TriageMode>('full');
  const [triageResult, setTriageResult] = useState<Step1TriageResult | null>(null);
  const [fastTriageResponse, setFastTriageResponse] =
    useState<Step1FastTriageResponse | null>(null);
  const [isTriaging, setIsTriaging] = useState<boolean>(false);
  const [triageError, setTriageError] = useState<string | null>(null);
  const [extractorResult, setExtractorResult] =
    useState<Step2ExtractorResult | null>(null);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [extractorError, setExtractorError] = useState<string | null>(null);

  // Initialize first reference sample audit via BPMN + MCP orchestrator on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await orchestrateEnterpriseAudit({
        mode: 'REFERENCE_DEMO',
        fileName: defaultSample.nomeArquivo,
        mimeType: 'text/plain',
        textContent: defaultSample.conteudo,
        scope: { lei14133: true, tcesc: true, lgpd: true },
      });
      if (cancelled) return;
      setSha256(result.report.sha256_documento);
      setBundle(result);
      setAuditedOriginalText(defaultSample.conteudo);
      setBpmnSteps(result.bpmnSteps);
    })();
    return () => {
      cancelled = true;
    };
  }, [defaultSample]);

  const executeEnterprisePipeline = async (params: {
    mode: 'GEMINI_REAL' | 'REFERENCE_DEMO';
    targetFileName: string;
    targetMimeType: 'application/pdf' | 'text/plain';
    targetBase64?: string;
    targetText: string;
    precomputedSha256?: string;
    targetScope: NormativeScope;
  }) => {
    setAuditError(null);
    setIsAuditing(true);
    setBpmnSteps(INITIAL_BPMN_STEPS.map((s) => ({ ...s })));

    try {
      const result = await orchestrateEnterpriseAudit({
        mode: params.mode,
        fileName: params.targetFileName,
        mimeType: params.targetMimeType,
        base64Data: params.targetBase64,
        textContent: params.targetText,
        precomputedSha256: params.precomputedSha256,
        scope: params.targetScope,
        onBpmnProgress: setBpmnSteps,
      });

      setSha256(result.report.sha256_documento);
      setBundle(result);
      setAuditedOriginalText(params.targetText);
      setActiveTab('achados');
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Erro inesperado na orquestração pericial.';
      setAuditError(message);
    } finally {
      setIsAuditing(false);
    }
  };

  const handleSelectSample = async (sample: SampleEdital) => {
    setSelectedSampleId(sample.id);
    setFileName(sample.nomeArquivo);
    setMimeType('text/plain');
    setPdfBase64(undefined);
    setDocumentText(sample.conteudo);
    setFileSizeBytes(new TextEncoder().encode(sample.conteudo).length);
    setTriageResult(null);
    setFastTriageResponse(null);
    setTriageError(null);
    setExtractorResult(null);
    setExtractorError(null);

    await executeEnterprisePipeline({
      mode: 'REFERENCE_DEMO',
      targetFileName: sample.nomeArquivo,
      targetMimeType: 'text/plain',
      targetText: sample.conteudo,
      targetScope: scope,
    });
  };

  const handleFileUpload = async (file: File) => {
    setAuditError(null);
    setSelectedSampleId(null);
    setIsAuditing(true);
    setBpmnSteps(
      INITIAL_BPMN_STEPS.map((s) =>
        s.id === 'INGEST_SHA256' ? { ...s, status: 'RUNNING' } : { ...s }
      )
    );

    try {
      const result = await readDocumentFile(file);
      setFileName(file.name);
      setMimeType(result.mimeType);
      setPdfBase64(result.base64Data);
      setDocumentText(result.text);
      setSha256(result.sha256);
      setFileSizeBytes(result.sizeBytes);
      setTriageResult(null);
      setFastTriageResponse(null);
      setTriageError(null);
      setExtractorResult(null);
      setExtractorError(null);

      await executeEnterprisePipeline({
        mode: 'GEMINI_REAL',
        targetFileName: file.name,
        targetMimeType: result.mimeType,
        targetBase64: result.base64Data,
        targetText: result.text,
        precomputedSha256: result.sha256,
        targetScope: scope,
      });
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Não foi possível ler ou auditar o arquivo enviado.';
      setAuditError(message);
      setIsAuditing(false);
    }
  };

  const handleTextChange = async (nextText: string) => {
    setAuditError(null);
    setSelectedSampleId(null);
    setMimeType('text/plain');
    setPdfBase64(undefined);
    setDocumentText(nextText);
    setTriageResult(null);
    setFastTriageResponse(null);
    setTriageError(null);
    setExtractorResult(null);
    setExtractorError(null);
    if (!fileName) {
      setFileName('Minuta_Avulsa_Edital.txt');
    }
    setFileSizeBytes(new TextEncoder().encode(nextText).length);

    if (nextText.trim().length > 0) {
      const digest = await computeSha256Hex(nextText);
      setSha256(digest);
    } else {
      setSha256('');
    }
  };

  const handleRunAudit = async () => {
    const isPdf = mimeType === 'application/pdf' && !!pdfBase64;
    if (!isPdf && !documentText.trim()) return;

    const activeFileName = fileName || 'Minuta_Avulsa_Edital.txt';
    await executeEnterprisePipeline({
      mode: 'GEMINI_REAL',
      targetFileName: activeFileName,
      targetMimeType: isPdf ? 'application/pdf' : 'text/plain',
      targetBase64: isPdf ? pdfBase64 : undefined,
      targetText: documentText,
      precomputedSha256: sha256 || undefined,
      targetScope: scope,
    });
  };

  const handleRunTriage = async () => {
    const isPdf = mimeType === 'application/pdf' && !!pdfBase64;
    if (!isPdf && !documentText.trim()) return;

    setTriageError(null);
    setIsTriaging(true);
    try {
      const payload = {
        fileName: fileName || 'Minuta_Avulsa_Edital.txt',
        mimeType: isPdf ? ('application/pdf' as const) : ('text/plain' as const),
        base64Data: isPdf ? pdfBase64 : undefined,
        textContent: documentText,
        companyProfile,
      };
      if (triageMode === 'fast') {
        const fastRes = await invokeStep1TriageFastService(payload);
        setFastTriageResponse(fastRes);
      } else {
        const result = await invokeStep1TriageService(payload);
        setTriageResult(result);
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Não foi possível executar a triagem do preâmbulo.';
      setTriageError(message);
    } finally {
      setIsTriaging(false);
    }
  };

  const handleRunExtraction = async () => {
    const isPdf = mimeType === 'application/pdf' && !!pdfBase64;
    if (!isPdf && !documentText.trim()) return;

    setExtractorError(null);
    setIsExtracting(true);
    try {
      const result = await invokeStep2ExtractorService({
        fileName: fileName || 'Minuta_Avulsa_Edital.txt',
        mimeType: isPdf ? 'application/pdf' : 'text/plain',
        base64Data: isPdf ? pdfBase64 : undefined,
        textContent: documentText,
      });
      setExtractorResult(result);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Não foi possível executar a extração documental forense.';
      setExtractorError(message);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleReset = () => {
    setAuditError(null);
    setSelectedSampleId(null);
    setFileName('');
    setMimeType('text/plain');
    setPdfBase64(undefined);
    setDocumentText('');
    setFileSizeBytes(0);
    setSha256('');
    setBundle(null);
    setAuditedOriginalText('');
    setTriageResult(null);
    setFastTriageResponse(null);
    setTriageError(null);
    setExtractorResult(null);
    setExtractorError(null);
    setBpmnSteps(INITIAL_BPMN_STEPS);
    setActiveTab('achados');
  };

  const handleExportMarkdown = () => {
    if (!bundle?.report) return;
    const markdown = formatReportMarkdown(bundle.report);
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Parecer_GovShield_${bundle.report.nome_arquivo.replace(/\.[^.]+$/, '')}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const isPdfLoaded = mimeType === 'application/pdf' && !!pdfBase64;

  return (
    <div id="top" className="min-h-screen flex flex-col bg-[#090D16] text-[#F9FAFB]">
      <TopBar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        hasReport={!!bundle?.report}
        onExportMarkdown={handleExportMarkdown}
        onLoadDefaultSample={() => handleSelectSample(SAMPLE_EDITAIS[0])}
      />

      <main className="mx-auto w-full max-w-[1480px] flex-1 px-4 py-6 sm:px-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          <IngestionPanel
            fileName={fileName}
            documentText={documentText}
            isPdfLoaded={isPdfLoaded}
            sha256={sha256}
            fileSizeBytes={fileSizeBytes}
            selectedSampleId={selectedSampleId}
            scope={scope}
            isAuditing={isAuditing}
            onSelectSample={handleSelectSample}
            onFileUpload={handleFileUpload}
            onTextChange={handleTextChange}
            onScopeChange={setScope}
            onRunAudit={handleRunAudit}
            onReset={handleReset}
          />

          <AuditWorkspace
            bundle={bundle}
            originalText={auditedOriginalText}
            activeFileName={fileName}
            hasActiveDocument={isPdfLoaded || documentText.trim().length > 0}
            companyProfile={companyProfile}
            triageMode={triageMode}
            triageResult={triageResult}
            fastTriageResponse={fastTriageResponse}
            isTriaging={isTriaging}
            triageError={triageError}
            extractorResult={extractorResult}
            isExtracting={isExtracting}
            extractorError={extractorError}
            activeTab={activeTab}
            isAuditing={isAuditing}
            bpmnSteps={bpmnSteps}
            auditError={auditError}
            onSelectTab={setActiveTab}
            onCompanyProfileChange={setCompanyProfile}
            onTriageModeChange={setTriageMode}
            onRunTriage={handleRunTriage}
            onRunExtraction={handleRunExtraction}
            onLoadDefaultSample={() => handleSelectSample(SAMPLE_EDITAIS[0])}
            onDismissError={() => setAuditError(null)}
            onRetryAudit={handleRunAudit}
          />
        </div>
      </main>

      <footer className="border-t border-[#1F2937] bg-[#090D16] py-4 px-4 sm:px-6">
        <div className="mx-auto flex max-w-[1480px] flex-col gap-1 sm:flex-row sm:items-center sm:justify-between text-xs text-[#9CA3AF]">
          <span>GovShield Audit Studio · Arquitetura DDD · BPMN · Document AST · GraphRAG · MCP</span>
          <span>Conformidade: Lei nº 14.133/2021 · Jurisprudência TCE/SC · LGPD</span>
        </div>
      </footer>
    </div>
  );
}
