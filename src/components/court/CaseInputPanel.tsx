import { useState, type KeyboardEvent } from 'react';
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Gavel,
  RotateCcw,
  Sparkles,
  Square,
  Wand2,
} from 'lucide-react';
import {
  abortCourtSession,
  runCourtSession,
} from '../../services/ai/orchestrator';
import { useCourtStore } from '../../store/useCourtStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { ExportTranscriptButton } from '../export/ExportTranscriptButton';

interface SampleDilemma {
  id: string;
  label: string;
  prompt: string;
  constraints: string;
}

const SAMPLE_DILEMMAS: readonly SampleDilemma[] = [
  {
    id: 'startup-vs-staff',
    label: 'Startup Founder vs. Staff Engineer Offer',
    prompt:
      'Should I leave my stable principal engineering role to co-found an AI developer-tools startup with a former colleague who just secured a $500k pre-seed term sheet?',
    constraints:
      'Current compensation: $260k/yr. Runway needed: at least 18 months of personal savings available. Family obligation: supporting a mortgage, no dependents yet. Decision deadline: 14 days.',
  },
  {
    id: 'monolith-migration',
    label: 'Core Monolith to Microservices Rewrite',
    prompt:
      'Should our 14-engineer SaaS product team freeze feature development for 4 months to rewrite our legacy monolith into event-driven microservices before our enterprise launch?',
    constraints:
      'Current ARR: $3.2M. Two enterprise prospects require 99.95% SLA within 6 months. Competitor just released a similar feature set.',
  },
  {
    id: 'bootstrap-vs-vc',
    label: 'Bootstrap Profitably vs. Raise Seed Round',
    prompt:
      'Our B2B SaaS just reached $18k MRR growing 15% month-over-month with zero outside capital. Should we stay 100% bootstrapped or accept a $1.5M seed round at a $10M valuation cap?',
    constraints:
      '2 technical founders. Burn rate is near zero. Raising VC requires hiring a sales team and targeting 3x faster growth within 12 months.',
  },
] as const;

export interface CaseInputPanelProps {
  onOpenSettings: () => void;
}

export function CaseInputPanel({ onOpenSettings }: CaseInputPanelProps) {
  const casePrompt = useCourtStore((s) => s.casePrompt);
  const contextConstraints = useCourtStore((s) => s.contextConstraints);
  const status = useCourtStore((s) => s.status);
  const setCasePrompt = useCourtStore((s) => s.setCasePrompt);
  const setContextConstraints = useCourtStore((s) => s.setContextConstraints);
  const resetCourt = useCourtStore((s) => s.resetCourt);

  const isConfigured = useSettingsStore((s) => s.isConfigured());
  const demoMode = useSettingsStore((s) => s.demoMode);
  const setDemoMode = useSettingsStore((s) => s.setDemoMode);

  const [showConstraints, setShowConstraints] = useState<boolean>(
    () => contextConstraints.trim().length > 0,
  );

  const isRunning = status === 'running';
  const hasSessionOutput =
    status === 'completed' || status === 'aborted' || status === 'error';
  const canConvene = !isRunning && casePrompt.trim().length > 0;

  const handleConvene = () => {
    if (!canConvene) return;
    void runCourtSession();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleConvene();
    }
  };

  const applySample = (sample: SampleDilemma) => {
    if (isRunning) return;
    setCasePrompt(sample.prompt);
    setContextConstraints(sample.constraints);
    setShowConstraints(true);
  };

  return (
    <section
      aria-label="Submit a Case to the Decision Court"
      className="court-glass rounded-2xl p-5 shadow-xl sm:p-6"
    >
      {/* Unconfigured BYOK Callout Banner */}
      {!isConfigured && (
        <div className="mb-5 flex flex-col justify-between gap-3 rounded-xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 sm:flex-row sm:items-center">
          <div className="flex items-start gap-2.5 text-xs text-amber-200 sm:items-center">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400 sm:mt-0" />
            <span>
              <strong>No API Key Configured:</strong> Configure your own Gemini,
              OpenAI, Anthropic, or OpenRouter key—or enable{' '}
              <strong>Demo Mode</strong> to test the full 5+1 court simulation
              immediately.
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setDemoMode(true)}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-200 transition-colors hover:bg-emerald-500/30"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Enable Demo Mode
            </button>
            <button
              type="button"
              onClick={onOpenSettings}
              className="inline-flex cursor-pointer items-center rounded-lg border border-amber-400/30 bg-slate-900/80 px-3 py-1.5 text-xs font-medium text-amber-100 transition-colors hover:bg-slate-800"
            >
              Configure API Key
            </button>
          </div>
        </div>
      )}

      {/* Header Row & Sample Dilemma Presets */}
      <div className="mb-3 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <div>
          <label
            htmlFor="court-case-input"
            className="text-sm font-semibold tracking-tight text-slate-100"
          >
            Case Before the Court (Decision or Dilemma)
          </label>
          <p className="text-xs text-slate-400">
            Present a high-stakes choice, architecture trade-off, or strategic
            question for sequential 6-hat deliberation.
          </p>
        </div>

        {/* Sample Presets */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400">
            <Wand2 className="h-3 w-3 text-blue-400" />
            Samples:
          </span>
          {SAMPLE_DILEMMAS.map((sample) => (
            <button
              key={sample.id}
              type="button"
              disabled={isRunning}
              onClick={() => applySample(sample)}
              className="cursor-pointer rounded-lg border border-slate-800 bg-slate-900/80 px-2.5 py-1 text-[11px] font-medium text-slate-300 transition-colors hover:border-blue-500/40 hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {sample.label}
            </button>
          ))}
        </div>
      </div>

      {/* Primary Case Prompt Textarea */}
      <div className="relative">
        <textarea
          id="court-case-input"
          rows={3}
          disabled={isRunning}
          value={casePrompt}
          onChange={(e) => setCasePrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g., Should we delay our v2 product launch by 6 weeks to rebuild the onboarding flow, or ship now to hit our Q3 target?"
          className="w-full resize-y rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 transition-colors focus:border-blue-500/60 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </div>

      {/* Collapsible Context & Constraints Section */}
      <div className="mt-3">
        <button
          type="button"
          onClick={() => setShowConstraints((prev) => !prev)}
          className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium text-slate-400 transition-colors hover:text-slate-200"
        >
          {showConstraints ? (
            <ChevronUp className="h-3.5 w-3.5 text-blue-400" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-blue-400" />
          )}
          <span>Add Context &amp; Constraints (Optional)</span>
          {contextConstraints.trim().length > 0 && !showConstraints && (
            <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] text-blue-300">
              Included
            </span>
          )}
        </button>

        {showConstraints && (
          <div className="mt-2">
            <textarea
              id="court-constraints-input"
              rows={2}
              disabled={isRunning}
              value={contextConstraints}
              onChange={(e) => setContextConstraints(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Budget limits, timeline deadlines, team size, risk tolerance, or non-negotiable constraints..."
              className="w-full resize-y rounded-xl border border-slate-800/90 bg-slate-950/60 px-3.5 py-2.5 text-xs text-slate-200 placeholder-slate-500 transition-colors focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/15 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/70 pt-4">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="hidden sm:inline">
            Shortcut:{' '}
            <kbd className="rounded border border-slate-700 bg-slate-900 px-1.5 py-0.5 font-mono text-[11px] text-slate-300">
              Ctrl/⌘ + Enter
            </kbd>
          </span>
          {demoMode && (
            <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-300">
              <Sparkles className="h-3 w-3" />
              Simulating in Demo Mode
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {!isRunning && <ExportTranscriptButton variant="compact" />}

          {hasSessionOutput && !isRunning && (
            <button
              type="button"
              onClick={resetCourt}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900/90 px-3.5 py-2 text-xs font-medium text-slate-300 transition-colors hover:border-slate-600 hover:bg-slate-800 hover:text-white"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              New Case / Reset
            </button>
          )}

          {isRunning ? (
            <button
              type="button"
              onClick={abortCourtSession}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-red-500/50 bg-red-500/20 px-4 py-2.5 text-xs font-semibold text-red-200 shadow-lg shadow-red-500/10 transition-all hover:bg-red-500/30"
            >
              <Square className="h-3.5 w-3.5 fill-current" />
              Stop Session
            </button>
          ) : (
            <button
              type="button"
              disabled={!canConvene}
              onClick={handleConvene}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500 disabled:shadow-none"
            >
              <Gavel className="h-4 w-4" />
              Convene Court
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
