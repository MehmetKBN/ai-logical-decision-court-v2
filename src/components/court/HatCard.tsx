import { motion } from 'framer-motion';
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  Flame,
  Loader2,
  RotateCw,
  Scale,
  ShieldAlert,
  Sparkles,
  Sprout,
  Sun,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { HATS } from '../../config/hats';
import { retryFromHat } from '../../services/ai/orchestrator';
import { useCourtStore } from '../../store/useCourtStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import type { HatIconName, HatId, HatStatus } from '../../types/court';

export interface HatCardProps {
  hatId: HatId;
}

const ICON_MAP: Record<HatIconName, typeof FileText> = {
  FileText,
  Flame,
  Sun,
  ShieldAlert,
  Sprout,
  Scale,
};

const HAT_THEME_CLASSES: Record<
  HatId,
  {
    iconBox: string;
    topBorder: string;
    badge: string;
    cursorColor: string;
  }
> = {
  white: {
    iconBox: 'border-slate-200/40 bg-slate-100/10 text-slate-100',
    topBorder: 'border-t-hat-white',
    badge: 'border-slate-300/30 bg-slate-100/10 text-slate-200',
    cursorColor: 'bg-slate-100',
  },
  red: {
    iconBox: 'border-red-500/40 bg-red-500/15 text-red-400',
    topBorder: 'border-t-hat-red',
    badge: 'border-red-500/30 bg-red-500/15 text-red-300',
    cursorColor: 'bg-red-400',
  },
  yellow: {
    iconBox: 'border-yellow-500/40 bg-yellow-500/15 text-yellow-400',
    topBorder: 'border-t-hat-yellow',
    badge: 'border-yellow-500/30 bg-yellow-500/15 text-yellow-300',
    cursorColor: 'bg-yellow-400',
  },
  black: {
    iconBox: 'border-slate-500/50 bg-slate-800/90 text-slate-300',
    topBorder: 'border-t-slate-400',
    badge: 'border-slate-500/40 bg-slate-800 text-slate-300',
    cursorColor: 'bg-slate-300',
  },
  green: {
    iconBox: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-400',
    topBorder: 'border-t-hat-green',
    badge: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300',
    cursorColor: 'bg-emerald-400',
  },
  blue: {
    iconBox: 'border-blue-500/40 bg-blue-500/15 text-blue-400',
    topBorder: 'border-t-hat-blue',
    badge: 'border-blue-500/30 bg-blue-500/15 text-blue-300',
    cursorColor: 'bg-blue-400',
  },
};

function getStatusLabel(status: HatStatus): string {
  switch (status) {
    case 'idle':
      return 'Waiting';
    case 'thinking':
      return 'Deliberating...';
    case 'streaming':
      return 'Speaking';
    case 'completed':
      return 'Concluded';
    case 'error':
      return 'Error';
    case 'aborted':
      return 'Aborted';
  }
}

export function HatCard({ hatId }: HatCardProps) {
  const hat = HATS[hatId];
  const response = useCourtStore((s) => s.responses[hatId]);
  const activeHatId = useCourtStore((s) => s.activeHatId);
  const demoMode = useSettingsStore((s) => s.demoMode);

  const isActive =
    activeHatId === hatId ||
    response.status === 'thinking' ||
    response.status === 'streaming';

  const IconComponent = ICON_MAP[hat.iconName];
  const theme = HAT_THEME_CLASSES[hatId];

  const durationSeconds =
    response.startedAt && response.completedAt
      ? ((response.completedAt - response.startedAt) / 1000).toFixed(1)
      : null;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: isActive ? 1.01 : 1,
      }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`court-glass flex flex-col rounded-2xl border-t-4 ${theme.topBorder} p-5 transition-shadow duration-300 ${
        isActive ? hat.glowClass : ''
      }`}
    >
      {/* Card Header */}
      <header className="flex items-start justify-between gap-3 border-b border-slate-800/80 pb-3.5">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${theme.iconBox}`}
          >
            <IconComponent className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold text-slate-400">
                #{hat.turnOrder}
              </span>
              <h2 className="text-base font-bold tracking-tight text-slate-50">
                {hat.name}
              </h2>
            </div>
            <p className="text-xs font-medium text-slate-400">
              {hat.roleTitle}
            </p>
          </div>
        </div>

        {/* Status Pill */}
        <div className="flex flex-col items-end gap-1">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[11px] font-medium ${
              isActive
                ? `${theme.badge} animate-pulse`
                : response.status === 'completed'
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                  : response.status === 'error'
                    ? 'border-red-500/40 bg-red-500/15 text-red-300'
                    : 'border-slate-800 bg-slate-900/80 text-slate-400'
            }`}
          >
            {(response.status === 'thinking' ||
              response.status === 'streaming') && (
              <Loader2 className="h-3 w-3 animate-spin" />
            )}
            {response.status === 'completed' && (
              <CheckCircle2 className="h-3 w-3 text-emerald-400" />
            )}
            {response.status === 'error' && (
              <AlertTriangle className="h-3 w-3 text-red-400" />
            )}
            {getStatusLabel(response.status)}
          </span>

          <span className="font-mono text-[10px] text-slate-500">
            {hat.cognitiveLens}
            {durationSeconds ? ` • ${durationSeconds}s` : ''}
          </span>
        </div>
      </header>

      {/* Card Body */}
      <div className="mt-4 flex-1">
        {response.status === 'idle' && (
          <div className="flex h-44 flex-col items-center justify-center rounded-xl border border-dashed border-slate-800/80 bg-slate-950/40 px-4 text-center">
            <p className="text-xs font-medium text-slate-400">
              {hat.shortTagline}
            </p>
            <p className="mt-1 font-mono text-[11px] text-slate-500">
              Awaiting Turn #{hat.turnOrder} in the deliberation order
            </p>
          </div>
        )}

        {response.status === 'thinking' && (
          <div className="flex h-44 flex-col items-center justify-center rounded-xl border border-slate-800/70 bg-slate-950/50 px-4 text-center">
            <Loader2 className="mb-2 h-6 w-6 animate-spin text-slate-300" />
            <p className="text-xs font-medium text-slate-200">
              {hat.name} is examining the case &amp; prior testimony...
            </p>
            <p className="mt-1 font-mono text-[11px] text-slate-400">
              Cognitive Lens: {hat.cognitiveLens}
            </p>
          </div>
        )}

        {response.status === 'error' && (
          <div className="rounded-xl border border-red-500/40 bg-red-950/25 p-4 text-xs text-red-200">
            <div className="mb-1 flex items-center gap-1.5 font-semibold text-red-300">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>Deliberation Interrupted</span>
            </div>
            <p className="leading-relaxed text-red-200/90">
              {response.errorMessage ??
                'An unexpected provider error occurred during this turn.'}
            </p>
            <div className="mt-3">
              <button
                type="button"
                onClick={() => void retryFromHat(hatId)}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-red-400/40 bg-red-900/50 px-3 py-1.5 text-xs font-semibold text-red-100 transition-colors hover:bg-red-800/60"
              >
                <RotateCw className="h-3.5 w-3.5" />
                <span>Retry from here</span>
              </button>
            </div>
          </div>
        )}

        {(response.status === 'streaming' ||
          response.status === 'completed' ||
          response.status === 'aborted') &&
          response.content.length > 0 && (
            <div>
              {demoMode && (
                <div className="mb-2.5 flex items-center">
                  <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-medium text-emerald-300">
                    <Sparkles className="h-2.5 w-2.5" />
                    Simulated Demo Output
                  </span>
                </div>
              )}
              <div className="court-markdown max-h-[420px] overflow-y-auto pr-1">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {response.content}
                </ReactMarkdown>
                {response.status === 'streaming' && (
                  <span
                    aria-hidden="true"
                    className={`ml-1 inline-block h-4 w-2 translate-y-0.5 animate-pulse rounded-xs ${theme.cursorColor}`}
                  />
                )}
              </div>
            </div>
          )}

        {response.status === 'aborted' && response.content.length === 0 && (
          <div className="flex h-44 items-center justify-center rounded-xl border border-slate-800/60 bg-slate-950/30 text-xs text-slate-500">
            Session stopped before {hat.name} took the floor.
          </div>
        )}
      </div>
    </motion.article>
  );
}
