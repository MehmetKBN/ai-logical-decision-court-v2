import { useEffect, useState } from 'react';
import { AlertTriangle, Settings, ShieldCheck, Sparkles, X } from 'lucide-react';
import { CaseInputPanel } from './components/court/CaseInputPanel';
import { SessionProgressBar } from './components/court/SessionProgressBar';
import { CourtroomGrid } from './components/layout/CourtroomGrid';
import { Header } from './components/layout/Header';
import { SettingsModal } from './components/settings/SettingsModal';
import { DELIBERATION_ORDER, HATS } from './config/hats';
import { useCourtStore } from './store/useCourtStore';
import { useSettingsStore } from './store/useSettingsStore';

export function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [errorBannerDismissed, setErrorBannerDismissed] = useState(false);

  const sessionStatus = useCourtStore((s) => s.status);
  const responses = useCourtStore((s) => s.responses);
  const demoMode = useSettingsStore((s) => s.demoMode);
  const setDemoMode = useSettingsStore((s) => s.setDemoMode);

  // Reset error banner dismissal whenever a new session starts or status changes
  useEffect(() => {
    if (sessionStatus === 'running' || sessionStatus === 'idle') {
      setErrorBannerDismissed(false);
    }
  }, [sessionStatus]);

  const failedHatId = DELIBERATION_ORDER.find(
    (id) => responses[id].status === 'error',
  );
  const failedHatError = failedHatId
    ? responses[failedHatId].errorMessage
    : null;

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      {/* Sticky Top Courtroom Header */}
      <Header onOpenSettings={() => setIsSettingsOpen(true)} />

      {/* Dismissible Session-Level Error Banner */}
      {sessionStatus === 'error' && !errorBannerDismissed && (
        <div
          role="alert"
          className="border-b border-red-500/40 bg-red-950/75 px-4 py-3 text-xs text-red-100 backdrop-blur-md"
        >
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 sm:px-6 lg:px-8">
            <div className="flex items-start gap-2.5 sm:items-center">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400 sm:mt-0" />
              <div>
                <strong className="font-semibold text-red-200">
                  {failedHatId
                    ? `${HATS[failedHatId].name} Deliberation Error: `
                    : 'Court Session Error: '}
                </strong>
                <span>
                  {failedHatError ??
                    'An unexpected provider error interrupted the deliberation.'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsSettingsOpen(true)}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-red-400/40 bg-red-900/50 px-2.5 py-1 font-semibold text-red-100 transition-colors hover:bg-red-800/60"
              >
                <Settings className="h-3.5 w-3.5" />
                <span>Check API Key &amp; Settings</span>
              </button>
              {!demoMode && (
                <button
                  type="button"
                  onClick={() => {
                    setDemoMode(true);
                    setErrorBannerDismissed(true);
                  }}
                  className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-emerald-500/40 bg-emerald-500/20 px-2.5 py-1 font-semibold text-emerald-200 transition-colors hover:bg-emerald-500/30"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Switch to Demo Mode</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setErrorBannerDismissed(true)}
                className="cursor-pointer rounded-lg p-1 text-red-300 hover:bg-red-900/50 hover:text-white"
                aria-label="Dismiss error banner"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Courtroom Workspace */}
      <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <CaseInputPanel onOpenSettings={() => setIsSettingsOpen(true)} />
        <SessionProgressBar />
        <CourtroomGrid />
      </main>

      {/* BYOK Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Privacy-First Footer */}
      <footer className="mt-12 border-t border-slate-900 bg-slate-950/90 py-5 text-xs text-slate-500">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-500/80" />
            <span>
              100% Client-Side Privacy • Zero Backend • API keys never leave
              your browser
            </span>
          </div>
          <span className="font-mono text-[11px] text-slate-600">
            AI Logical Decision Court v2.0 • Edward De Bono&apos;s Six Thinking
            Hats
          </span>
        </div>
      </footer>
    </div>
  );
}

export default App;
