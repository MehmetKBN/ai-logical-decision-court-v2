import {
  Cpu,
  KeyRound,
  Scale,
  Settings,
  Sparkles,
} from 'lucide-react';
import { GITHUB_REPO_URL, PROVIDERS } from '../../config/providers';
import { useCourtStore } from '../../store/useCourtStore';
import { useSettingsStore } from '../../store/useSettingsStore';

export interface HeaderProps {
  onOpenSettings: () => void;
}

export function Header({ onOpenSettings }: HeaderProps) {
  const provider = useSettingsStore((s) => s.provider);
  const demoMode = useSettingsStore((s) => s.demoMode);
  const setDemoMode = useSettingsStore((s) => s.setDemoMode);
  const effectiveModelId = useSettingsStore((s) => s.getEffectiveModelId());
  const isConfigured = useSettingsStore((s) => s.isConfigured());
  const sessionStatus = useCourtStore((s) => s.status);

  const isRunning = sessionStatus === 'running';
  const providerMeta = PROVIDERS[provider];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-6 lg:px-8">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-500/35 bg-blue-500/10 text-hat-blue shadow-sm shadow-blue-500/20">
            <Scale className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-slate-50 sm:text-lg">
                AI Logical Decision Court
              </span>
              <span className="rounded-md border border-blue-500/30 bg-blue-500/15 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-blue-300">
                v2
              </span>
            </div>
            <p className="hidden text-xs text-slate-400 sm:block">
              De Bono&apos;s Six Thinking Hats • 5 + 1 Sequential Deliberation
            </p>
          </div>
        </div>

        {/* Right: Controls & Status */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Demo Mode Toggle Pill */}
          <button
            type="button"
            disabled={isRunning}
            onClick={() => setDemoMode(!demoMode)}
            title={
              demoMode
                ? 'Demo Mode active (simulated stream, no API key required). Click to switch to BYOK mode.'
                : 'Enable Demo Mode to preview the full 5+1 court flow without an API key.'
            }
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
              demoMode
                ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300 shadow-sm shadow-emerald-500/10'
                : 'border-slate-700/80 bg-slate-900/80 text-slate-400 hover:border-slate-600 hover:text-slate-200'
            } ${isRunning ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Demo Mode</span>
            <span
              className={`ml-0.5 h-2 w-2 rounded-full ${
                demoMode ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
              }`}
            />
          </button>

          {/* Active Provider / Model Status Pill */}
          <div
            className="hidden items-center gap-1.5 rounded-full border border-slate-800 bg-slate-900/70 px-3 py-1.5 font-mono text-xs text-slate-300 md:inline-flex"
            title="Current AI Engine Configuration"
          >
            {demoMode ? (
              <>
                <Cpu className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-300">Simulator Engine</span>
              </>
            ) : isConfigured ? (
              <>
                <Cpu className="h-3.5 w-3.5 text-blue-400" />
                <span className="text-slate-400">{providerMeta.name}:</span>
                <span className="max-w-[160px] truncate text-slate-100">
                  {effectiveModelId}
                </span>
              </>
            ) : (
              <>
                <KeyRound className="h-3.5 w-3.5 text-amber-400" />
                <span className="text-amber-300">No API Key Set</span>
              </>
            )}
          </div>

          {/* Settings Trigger */}
          <button
            type="button"
            onClick={onOpenSettings}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-700/80 bg-slate-900/90 px-3 py-2 text-xs font-medium text-slate-200 transition-colors hover:border-blue-500/50 hover:bg-slate-800/90 hover:text-white"
            aria-label="Open AI Provider Settings"
          >
            <Settings className="h-4 w-4 text-slate-400" />
            <span className="hidden sm:inline">Settings</span>
          </button>

          {/* GitHub Repository Link */}
          <a
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-xl border border-slate-800 bg-slate-900/70 p-2 text-slate-400 transition-colors hover:border-slate-700 hover:text-slate-100"
            aria-label="View source on GitHub"
            title="View Open-Source Repository on GitHub"
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="h-4 w-4 fill-current"
            >
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z" />
            </svg>
          </a>
        </div>
      </div>
    </header>
  );
}
