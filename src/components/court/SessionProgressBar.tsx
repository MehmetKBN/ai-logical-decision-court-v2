import {
  AlertCircle,
  Check,
  Clock,
  Loader2,
  Slash,
} from 'lucide-react';
import { DELIBERATION_ORDER, HATS } from '../../config/hats';
import { useCourtStore } from '../../store/useCourtStore';
import type { HatId, HatStatus } from '../../types/court';

const HAT_DOT_STYLES: Record<
  HatId,
  {
    activeBorder: string;
    activeBg: string;
    activeText: string;
    dotColor: string;
  }
> = {
  white: {
    activeBorder: 'border-slate-200/80',
    activeBg: 'bg-slate-100/10',
    activeText: 'text-slate-100',
    dotColor: 'bg-hat-white',
  },
  red: {
    activeBorder: 'border-red-500/80',
    activeBg: 'bg-red-500/15',
    activeText: 'text-red-300',
    dotColor: 'bg-hat-red',
  },
  yellow: {
    activeBorder: 'border-yellow-500/80',
    activeBg: 'bg-yellow-500/15',
    activeText: 'text-yellow-300',
    dotColor: 'bg-hat-yellow',
  },
  black: {
    activeBorder: 'border-slate-400/80',
    activeBg: 'bg-slate-700/40',
    activeText: 'text-slate-200',
    dotColor: 'bg-slate-400',
  },
  green: {
    activeBorder: 'border-emerald-500/80',
    activeBg: 'bg-emerald-500/15',
    activeText: 'text-emerald-300',
    dotColor: 'bg-hat-green',
  },
  blue: {
    activeBorder: 'border-blue-500/90',
    activeBg: 'bg-blue-500/20',
    activeText: 'text-blue-200',
    dotColor: 'bg-hat-blue',
  },
};

function renderStepStatusIcon(status: HatStatus, dotColor: string) {
  switch (status) {
    case 'thinking':
    case 'streaming':
      return <Loader2 className="h-3.5 w-3.5 animate-spin text-current" />;
    case 'completed':
      return <Check className="h-3.5 w-3.5 text-emerald-400" />;
    case 'error':
      return <AlertCircle className="h-3.5 w-3.5 text-red-400" />;
    case 'aborted':
      return <Slash className="h-3.5 w-3.5 text-amber-400" />;
    case 'idle':
      return <span className={`h-2.5 w-2.5 rounded-full ${dotColor} opacity-75`} />;
  }
}

export function SessionProgressBar() {
  const responses = useCourtStore((s) => s.responses);
  const activeHatId = useCourtStore((s) => s.activeHatId);
  const sessionStatus = useCourtStore((s) => s.status);

  const completedCount = DELIBERATION_ORDER.filter(
    (id) => responses[id].status === 'completed',
  ).length;

  return (
    <nav
      aria-label="Court Deliberation Pipeline"
      className="court-glass rounded-2xl px-4 py-3 sm:px-5"
    >
      <div className="mb-2.5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-blue-400" />
          <span className="font-semibold text-slate-200">
            Sequential Deliberation Pipeline
          </span>
        </div>
        <span className="font-mono text-[11px] text-slate-400">
          {sessionStatus === 'idle' && 'Ready to Convene (0 / 6)'}
          {sessionStatus === 'running' &&
            `Turn ${completedCount + 1} of 6 in Progress`}
          {sessionStatus === 'completed' && 'Verdict Delivered (6 / 6)'}
          {sessionStatus === 'aborted' &&
            `Session Stopped (${completedCount} / 6)`}
          {sessionStatus === 'error' && 'Session Interrupted by Error'}
        </span>
      </div>

      <ol className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {DELIBERATION_ORDER.map((hatId) => {
          const hat = HATS[hatId];
          const resp = responses[hatId];
          const isActive =
            activeHatId === hatId ||
            resp.status === 'thinking' ||
            resp.status === 'streaming';
          const style = HAT_DOT_STYLES[hatId];

          return (
            <li
              key={hatId}
              className={`flex items-center justify-between rounded-xl border px-3 py-2 text-xs transition-all ${
                isActive
                  ? `${style.activeBorder} ${style.activeBg} ${style.activeText} shadow-sm`
                  : resp.status === 'completed'
                    ? 'border-slate-800 bg-slate-900/80 text-slate-200'
                    : resp.status === 'error'
                      ? 'border-red-500/40 bg-red-500/10 text-red-300'
                      : 'border-slate-800/70 bg-slate-950/60 text-slate-400'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                {renderStepStatusIcon(resp.status, style.dotColor)}
                <div className="truncate">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[10px] opacity-65">
                      #{hat.turnOrder}
                    </span>
                    <span className="truncate font-semibold">{hat.name}</span>
                  </div>
                </div>
              </div>

              <span className="ml-1.5 shrink-0 font-mono text-[10px] uppercase tracking-wider opacity-75">
                {resp.status === 'idle' && (hat.isJudge ? 'Judge' : 'Wait')}
                {resp.status === 'thinking' && 'Think'}
                {resp.status === 'streaming' && 'Live'}
                {resp.status === 'completed' && 'Done'}
                {resp.status === 'error' && 'Err'}
                {resp.status === 'aborted' && 'Stop'}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
