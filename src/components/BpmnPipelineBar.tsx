import { AlertOctagon, Check, ChevronRight, CircleDot, Loader2 } from 'lucide-react';
import { BpmnStepState } from '../domain/orchestrator/auditBpmnOrchestrator';

interface BpmnPipelineBarProps {
  steps: BpmnStepState[];
  variant?: 'compact' | 'full';
}

export function BpmnPipelineBar({
  steps,
  variant = 'compact',
}: BpmnPipelineBarProps) {
  if (steps.length === 0) return null;

  if (variant === 'full') {
    return (
      <div className="divide-y divide-[#1F2937] rounded-md border border-[#1F2937] bg-[#090D16]">
        {steps.map((step, idx) => {
          const isRunning = step.status === 'RUNNING';
          const isCompleted = step.status === 'COMPLETED';
          const isError = step.status === 'ERROR';

          return (
            <div
              key={step.id}
              className="flex items-center justify-between gap-3 px-4 py-3 text-xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="font-mono text-[#9CA3AF] tabular-nums w-5 shrink-0">
                  0{idx + 1}.
                </span>
                <span
                  className={`font-medium truncate ${
                    isRunning
                      ? 'text-[#F9FAFB]'
                      : isCompleted
                        ? 'text-[#10B981]'
                        : isError
                          ? 'text-[#EF4444]'
                          : 'text-[#6B7280]'
                  }`}
                >
                  {step.label}
                </span>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                {isCompleted && (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#10B981] tabular-nums">
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>
                      {step.durationMs !== undefined ? `${step.durationMs} ms` : 'Concluído'}
                    </span>
                  </span>
                )}
                {isRunning && (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#3B82F6]">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                    <span>Executando</span>
                  </span>
                )}
                {isError && (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#EF4444]">
                    <AlertOctagon className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Falha</span>
                  </span>
                )}
                {step.status === 'PENDING' && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-[#6B7280]">
                    <CircleDot className="h-3 w-3" aria-hidden="true" />
                    <span>Aguardando</span>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div
      aria-label="Orquestração BPMN da auditoria"
      className="border-b border-[#1F2937] bg-[#090D16] px-5 py-2.5 overflow-x-auto"
    >
      <div className="flex items-center gap-2 min-w-max">
        <span className="text-[11px] font-semibold text-[#9CA3AF] mr-1">
          BPMN:
        </span>
        {steps.map((step, idx) => {
          const isCompleted = step.status === 'COMPLETED';
          const isError = step.status === 'ERROR';
          const isRunning = step.status === 'RUNNING';

          return (
            <div key={step.id} className="flex items-center gap-2">
              <div className="inline-flex items-center gap-1.5 text-[11px]">
                {isCompleted && (
                  <Check className="h-3 w-3 text-[#10B981] shrink-0" aria-hidden="true" />
                )}
                {isRunning && (
                  <Loader2 className="h-3 w-3 animate-spin text-[#3B82F6] shrink-0" aria-hidden="true" />
                )}
                {isError && (
                  <AlertOctagon className="h-3 w-3 text-[#EF4444] shrink-0" aria-hidden="true" />
                )}
                <span
                  className={`whitespace-nowrap font-medium ${
                    isCompleted
                      ? 'text-[#D1D5DB]'
                      : isRunning
                        ? 'text-[#3B82F6]'
                        : isError
                          ? 'text-[#EF4444]'
                          : 'text-[#6B7280]'
                  }`}
                >
                  {step.shortLabel}
                </span>
                {step.durationMs !== undefined && (
                  <span className="font-mono text-[10px] text-[#9CA3AF] tabular-nums">
                    ({step.durationMs}ms)
                  </span>
                )}
              </div>
              {idx < steps.length - 1 && (
                <ChevronRight
                  className="h-3.5 w-3.5 text-[#374151] shrink-0"
                  aria-hidden="true"
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
