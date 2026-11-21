import { motion } from 'framer-motion';
import {
  AlertTriangle,
  CheckCircle2,
  Gavel,
  Loader2,
  RotateCw,
  Scale,
  Sparkles,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { COUNCIL_HATS, HATS } from '../../config/hats';
import { retryFromHat } from '../../services/ai/orchestrator';
import { useCourtStore } from '../../store/useCourtStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { ExportTranscriptButton } from '../export/ExportTranscriptButton';

export function BlueHatVerdictPanel() {
  const blueHat = HATS.blue;
  const responses = useCourtStore((s) => s.responses);
  const activeHatId = useCourtStore((s) => s.activeHatId);
  const sessionStatus = useCourtStore((s) => s.status);
  const demoMode = useSettingsStore((s) => s.demoMode);

  const blueResponse = responses.blue;
  const completedCouncilCount = COUNCIL_HATS.filter(
    (id) => responses[id].status === 'completed',
  ).length;

  const isBlueActive =
    activeHatId === 'blue' ||
    blueResponse.status === 'thinking' ||
    blueResponse.status === 'streaming';

  const isVerdictComplete = blueResponse.status === 'completed';

  const durationSeconds =
    blueResponse.startedAt && blueResponse.completedAt
      ? ((blueResponse.completedAt - blueResponse.startedAt) / 1000).toFixed(1)
      : null;

  return (
    <motion.section
      layout
      aria-label="Blue Hat Head Judge Verdict Chamber"
      initial={{ opacity: 0, y: 14 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: isBlueActive ? 1.008 : 1,
      }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`court-glass-elevated relative overflow-hidden rounded-2xl border-2 p-6 transition-all duration-300 sm:p-7 ${
        isBlueActive || isVerdictComplete
          ? 'glow-hat-blue border-blue-500/80'
          : 'border-blue-500/25'
      }`}
    >
      {/* Subtle Ambient Royal Blue Backdrop Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl"
      />

      {/* Chamber Header */}
      <header className="relative z-10 flex flex-wrap items-start justify-between gap-4 border-b border-slate-700/70 pb-4">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-blue-400/40 bg-blue-500/20 text-blue-300 shadow-inner shadow-blue-500/20">
            <Scale className="h-6 w-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md border border-blue-400/30 bg-blue-500/20 px-2 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-blue-200">
                Center Bench • Turn #6
              </span>
              <h2 className="text-lg font-bold tracking-tight text-white sm:text-xl">
                {blueHat.name} — {blueHat.roleTitle}
              </h2>
            </div>
            <p className="mt-0.5 text-xs text-slate-300">
              {blueHat.shortTagline}
            </p>
          </div>
        </div>

        {/* Judicial Status Indicator & Transcript Export */}
        <div className="flex flex-wrap items-center gap-3">
          <ExportTranscriptButton />

          <div className="flex flex-col items-end gap-1">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-xs font-semibold ${
                isBlueActive
                  ? 'border-blue-400/60 bg-blue-500/25 text-blue-100 animate-pulse'
                  : isVerdictComplete
                    ? 'border-emerald-400/50 bg-emerald-500/20 text-emerald-200'
                    : blueResponse.status === 'error'
                      ? 'border-red-500/50 bg-red-500/20 text-red-200'
                      : 'border-slate-700 bg-slate-900/90 text-slate-300'
              }`}
            >
              {isBlueActive && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {isVerdictComplete && (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              )}
              {blueResponse.status === 'idle' && (
                <Gavel className="h-3.5 w-3.5 text-blue-400" />
              )}
              {blueResponse.status === 'idle' &&
                `Awaiting Council (${completedCouncilCount}/5)`}
              {blueResponse.status === 'thinking' &&
                'Synthesizing Council Testimony...'}
              {blueResponse.status === 'streaming' && 'Delivering Final Verdict'}
              {blueResponse.status === 'completed' && 'Final Verdict Ruled'}
              {blueResponse.status === 'error' && 'Verdict Error'}
              {blueResponse.status === 'aborted' && 'Session Stopped'}
            </span>

            <span className="font-mono text-[11px] text-slate-400">
              {blueHat.cognitiveLens}
              {durationSeconds ? ` • ${durationSeconds}s` : ''}
            </span>
          </div>
        </div>
      </header>

      {/* Chamber Body */}
      <div className="relative z-10 mt-5">
        {blueResponse.status === 'idle' && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-blue-500/25 bg-slate-950/50 px-6 py-10 text-center">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400">
              <Gavel className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-semibold text-slate-200">
              {sessionStatus === 'running'
                ? `Head Judge Listening to Council Testimony (${completedCouncilCount} of 5 Complete)`
                : 'The Central Verdict Chamber is in Standby'}
            </h3>
            <p className="mt-1.5 max-w-xl text-xs leading-relaxed text-slate-400">
              Once the White, Red, Yellow, Black, and Green hats conclude their
              sequential arguments, the{' '}
              <strong className="text-blue-300">Blue Hat Head Judge</strong>{' '}
              will synthesize every perspective, resolve core tensions, and
              deliver the structured{' '}
              <strong className="text-slate-200">
                Final Verdict &amp; Actionable Next Steps
              </strong>
              .
            </p>

            {/* 5-Hat Mini Progress Dots */}
            <div className="mt-4 flex items-center gap-2">
              {COUNCIL_HATS.map((councilHatId) => {
                const st = responses[councilHatId].status;
                return (
                  <span
                    key={councilHatId}
                    title={`${HATS[councilHatId].name}: ${st}`}
                    className={`h-2.5 w-8 rounded-full transition-all ${
                      st === 'completed'
                        ? 'bg-blue-400'
                        : st === 'streaming' || st === 'thinking'
                          ? 'bg-blue-400/50 animate-pulse'
                          : 'bg-slate-800'
                    }`}
                  />
                );
              })}
            </div>
          </div>
        )}

        {blueResponse.status === 'thinking' && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-blue-500/30 bg-slate-950/60 px-6 py-12 text-center">
            <Loader2 className="mb-3 h-7 w-7 animate-spin text-blue-400" />
            <p className="text-sm font-semibold text-blue-100">
              The Head Judge is Weighing All Five Council Perspectives...
            </p>
            <p className="mt-1 font-mono text-xs text-slate-400">
              Resolving tensions between Yellow Hat upside, Black Hat risks, and
              Green Hat mitigations
            </p>
          </div>
        )}

        {blueResponse.status === 'error' && (
          <div className="rounded-xl border border-red-500/40 bg-red-950/30 p-4 text-xs text-red-200">
            <div className="mb-1 flex items-center gap-2 font-semibold text-red-300">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>Head Judge Deliberation Interrupted</span>
            </div>
            <p>{blueResponse.errorMessage}</p>
            <div className="mt-3">
              <button
                type="button"
                onClick={() => void retryFromHat('blue')}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-red-400/40 bg-red-900/50 px-3 py-1.5 text-xs font-semibold text-red-100 transition-colors hover:bg-red-800/60"
              >
                <RotateCw className="h-3.5 w-3.5" />
                <span>Retry from here</span>
              </button>
            </div>
          </div>
        )}

        {(blueResponse.status === 'streaming' ||
          blueResponse.status === 'completed' ||
          blueResponse.status === 'aborted') &&
          blueResponse.content.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-xl border border-blue-500/20 bg-slate-950/65 p-5 sm:p-6"
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-blue-300">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Official Judicial Synthesis &amp; Ruling</span>
                </div>
                {demoMode && (
                  <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-medium text-emerald-300">
                    <Sparkles className="h-2.5 w-2.5" />
                    Simulated Demo Output
                  </span>
                )}
              </div>
              <div className="court-markdown">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {blueResponse.content}
                </ReactMarkdown>
                {blueResponse.status === 'streaming' && (
                  <span
                    aria-hidden="true"
                    className="ml-1 inline-block h-4 w-2 translate-y-0.5 animate-pulse rounded-xs bg-blue-400"
                  />
                )}
              </div>
            </motion.div>
          )}
      </div>
    </motion.section>
  );
}
