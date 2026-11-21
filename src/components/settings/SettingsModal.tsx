import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  Globe,
  HardDrive,
  KeyRound,
  Loader2,
  Lock,
  ShieldCheck,
  Sparkles,
  Trash2,
  Wifi,
  X,
} from 'lucide-react';
import { PROVIDER_ORDER, PROVIDERS } from '../../config/providers';
import { getProviderAdapter } from '../../services/ai/ProviderAdapter';
import { useSettingsStore } from '../../store/useSettingsStore';
import type {
  ConnectionTestResult,
  ProviderId,
  StorageMode,
} from '../../types/provider';

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const provider = useSettingsStore((s) => s.provider);
  const apiKey = useSettingsStore((s) => s.apiKey);
  const modelId = useSettingsStore((s) => s.modelId);
  const customModelId = useSettingsStore((s) => s.customModelId);
  const customBaseUrl = useSettingsStore((s) => s.customBaseUrl);
  const storageMode = useSettingsStore((s) => s.storageMode);
  const demoMode = useSettingsStore((s) => s.demoMode);

  const setProvider = useSettingsStore((s) => s.setProvider);
  const setApiKey = useSettingsStore((s) => s.setApiKey);
  const setModelId = useSettingsStore((s) => s.setModelId);
  const setCustomModelId = useSettingsStore((s) => s.setCustomModelId);
  const setCustomBaseUrl = useSettingsStore((s) => s.setCustomBaseUrl);
  const setStorageMode = useSettingsStore((s) => s.setStorageMode);
  const setDemoMode = useSettingsStore((s) => s.setDemoMode);
  const clearApiKey = useSettingsStore((s) => s.clearApiKey);
  const effectiveModelId = useSettingsStore((s) => s.getEffectiveModelId());

  const [showApiKey, setShowApiKey] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(
    null,
  );

  const activeProviderMeta = PROVIDERS[provider];

  // Clear stale connection test result whenever provider/key/model/baseURL changes
  useEffect(() => {
    setTestResult(null);
  }, [provider, apiKey, modelId, customModelId, customBaseUrl, demoMode]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleProviderChange = (nextProvider: ProviderId) => {
    setProvider(nextProvider);
  };

  const handleStorageModeChange = (nextMode: StorageMode) => {
    setStorageMode(nextMode);
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);
    try {
      const currentSettings = useSettingsStore.getState();
      const adapter = getProviderAdapter(currentSettings);
      const result = await adapter.testConnection(currentSettings);
      setTestResult(result);
    } catch (error: unknown) {
      setTestResult({
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : 'Unexpected error while testing connection.',
      });
    } finally {
      setTestingConnection(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="settings-modal-title"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
          />

          {/* Modal Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="court-glass-elevated relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-700/80 shadow-2xl"
          >
            {/* Header */}
            <header className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-500/35 bg-blue-500/15 text-blue-400">
                  <KeyRound className="h-5 w-5" />
                </div>
                <div>
                  <h2
                    id="settings-modal-title"
                    className="text-base font-bold tracking-tight text-white sm:text-lg"
                  >
                    AI Provider &amp; BYOK Privacy Settings
                  </h2>
                  <p className="text-xs text-slate-400">
                    Bring Your Own Key • 100% browser-direct API requests
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="cursor-pointer rounded-xl border border-slate-800 bg-slate-900/80 p-2 text-slate-400 transition-colors hover:border-slate-700 hover:text-white"
                aria-label="Close Settings Modal"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            {/* Scrollable Content */}
            <div className="space-y-6 overflow-y-auto px-6 py-5">
              {/* 1. Demo Mode Toggle Card */}
              <div
                className={`flex flex-col justify-between gap-4 rounded-xl border p-4 transition-colors sm:flex-row sm:items-center ${
                  demoMode
                    ? 'border-emerald-500/45 bg-emerald-500/10'
                    : 'border-slate-800 bg-slate-900/60'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Sparkles
                      className={`h-4 w-4 ${
                        demoMode ? 'text-emerald-400' : 'text-slate-400'
                      }`}
                    />
                    <span className="text-sm font-semibold text-slate-100">
                      Demo Mode (No API Key Required)
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-400">
                    Simulate the full 5+1 Six Thinking Hats deliberation and
                    Blue Hat verdict using the built-in interactive mock engine.
                  </p>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={demoMode}
                  onClick={() => setDemoMode(!demoMode)}
                  className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer items-center rounded-full border transition-colors ${
                    demoMode
                      ? 'border-emerald-400/50 bg-emerald-500'
                      : 'border-slate-700 bg-slate-800'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${
                      demoMode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* 2. Provider Selector Tabs */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Select AI Provider
                </label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {PROVIDER_ORDER.map((id) => {
                    const meta = PROVIDERS[id];
                    const isSelected = provider === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => handleProviderChange(id)}
                        className={`flex cursor-pointer flex-col items-start rounded-xl border p-3 text-left transition-all ${
                          isSelected
                            ? 'border-blue-500/80 bg-blue-500/15 text-white shadow-sm shadow-blue-500/10'
                            : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:bg-slate-900 hover:text-slate-200'
                        }`}
                      >
                        <span className="text-xs font-bold leading-snug">
                          {meta.name}
                        </span>
                        <span className="mt-1 line-clamp-1 font-mono text-[10px] text-slate-400">
                          {meta.defaultModelId}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. API Key Input + Privacy Badge */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label
                    htmlFor="settings-api-key"
                    className="text-xs font-semibold uppercase tracking-wider text-slate-300"
                  >
                    {activeProviderMeta.name} API Key
                  </label>
                  <a
                    href={activeProviderMeta.docsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-blue-400 hover:text-blue-300 hover:underline"
                  >
                    <span>Get {activeProviderMeta.name} Key</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>

                <div className="relative flex items-center">
                  <input
                    id="settings-api-key"
                    type={showApiKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={activeProviderMeta.apiKeyPlaceholder}
                    autoComplete="off"
                    spellCheck={false}
                    className="w-full rounded-xl border border-slate-700/80 bg-slate-950/90 py-2.5 pl-3.5 pr-20 font-mono text-xs text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <div className="absolute right-2 flex items-center gap-1">
                    {apiKey.length > 0 && (
                      <button
                        type="button"
                        onClick={clearApiKey}
                        title="Clear saved API key"
                        className="cursor-pointer rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-red-300"
                        aria-label="Clear saved API key"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowApiKey((prev) => !prev)}
                      title={showApiKey ? 'Hide API key' : 'Show API key'}
                      className="cursor-pointer rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                      aria-label={showApiKey ? 'Hide API key' : 'Show API key'}
                    >
                      {showApiKey ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Explicit Local Privacy Notice */}
                <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-950/20 px-3 py-2 text-[11px] text-emerald-300/90">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400" />
                  <span>
                    Zero Backend • Stored locally in your browser and sent
                    directly to your chosen AI provider — never to our servers.
                  </span>
                </div>
              </div>

              {/* 4. Browser Storage Mode Toggle (Local vs Session) */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Key Storage Persistence
                </label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => handleStorageModeChange('local')}
                    className={`flex cursor-pointer items-center gap-2.5 rounded-xl border p-3 text-left text-xs transition-all ${
                      storageMode === 'local'
                        ? 'border-blue-500/70 bg-blue-500/15 text-white'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <HardDrive className="h-4 w-4 shrink-0 text-blue-400" />
                    <div>
                      <div className="font-semibold">
                        Local Storage (Remember)
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Persists across browser restarts on this device
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStorageModeChange('session')}
                    className={`flex cursor-pointer items-center gap-2.5 rounded-xl border p-3 text-left text-xs transition-all ${
                      storageMode === 'session'
                        ? 'border-blue-500/70 bg-blue-500/15 text-white'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <Lock className="h-4 w-4 shrink-0 text-amber-400" />
                    <div>
                      <div className="font-semibold">
                        Session Only (Ephemeral)
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Automatically wiped as soon as you close this tab
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* 5. Model Selection (Curated Preset + Custom Model ID Override) */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label
                    htmlFor="settings-model-preset"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
                  >
                    Curated Model Preset
                  </label>
                  <select
                    id="settings-model-preset"
                    value={modelId}
                    onChange={(e) => setModelId(e.target.value)}
                    className="w-full rounded-xl border border-slate-700/80 bg-slate-950/90 px-3 py-2.5 text-xs text-slate-100 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    {activeProviderMeta.models.map((m) => (
                      <option
                        key={m.id}
                        value={m.id}
                        className="bg-slate-900 text-slate-100"
                      >
                        {m.label} ({m.id})
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-400">
                    {activeProviderMeta.models.find((m) => m.id === modelId)
                      ?.description ?? 'Select a recommended model preset.'}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="settings-custom-model"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
                  >
                    Custom Model ID (Optional Override)
                  </label>
                  <input
                    id="settings-custom-model"
                    type="text"
                    value={customModelId}
                    onChange={(e) => setCustomModelId(e.target.value)}
                    placeholder="e.g., gemini-4-hydrogen or llama3.3:70b"
                    spellCheck={false}
                    className="w-full rounded-xl border border-slate-700/80 bg-slate-950/90 px-3 py-2.5 font-mono text-xs text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <p className="text-[11px] text-slate-400">
                    Active Model:{' '}
                    <code className="rounded bg-slate-900 px-1.5 py-0.5 font-mono text-blue-300">
                      {effectiveModelId}
                    </code>
                  </p>
                </div>
              </div>

              {/* 6. Custom Base URL (OpenRouter / Groq / Together / Local Ollama) */}
              {provider === 'openrouter' && (
                <div className="space-y-1.5 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="settings-base-url"
                      className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-300"
                    >
                      <Globe className="h-3.5 w-3.5 text-blue-400" />
                      <span>OpenAI-Compatible Base URL</span>
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setCustomBaseUrl(PROVIDERS.openrouter.defaultBaseUrl)
                      }
                      className="cursor-pointer text-[11px] text-blue-400 hover:underline"
                    >
                      Reset to OpenRouter Default
                    </button>
                  </div>
                  <input
                    id="settings-base-url"
                    type="url"
                    value={customBaseUrl}
                    onChange={(e) => setCustomBaseUrl(e.target.value)}
                    placeholder="https://openrouter.ai/api/v1"
                    spellCheck={false}
                    className="w-full rounded-xl border border-slate-700/80 bg-slate-950 py-2 px-3 font-mono text-xs text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                  />
                  <p className="text-[11px] leading-relaxed text-slate-400">
                    Supports <strong>OpenRouter</strong> (
                    <code className="text-slate-300">
                      https://openrouter.ai/api/v1
                    </code>
                    ), <strong>Groq</strong> (
                    <code className="text-slate-300">
                      https://api.groq.com/openai/v1
                    </code>
                    ), <strong>Together AI</strong>, or local{' '}
                    <strong>Ollama</strong> (
                    <code className="text-slate-300">
                      http://localhost:11434/v1
                    </code>
                    ).
                  </p>
                  <p className="text-[11px] font-medium text-amber-300/90">
                    Security Note: Only enter endpoints you trust — your API key
                    will be sent directly to this URL.
                  </p>
                </div>
              )}

              {/* 7. Connection Test Result Banner */}
              {testResult && (
                <div
                  className={`flex items-start gap-2.5 rounded-xl border p-3.5 text-xs ${
                    testResult.ok
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                      : 'border-red-500/40 bg-red-500/10 text-red-200'
                  }`}
                >
                  {testResult.ok ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  ) : (
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                  )}
                  <div className="flex-1 leading-relaxed">
                    <span className="font-semibold">
                      {testResult.ok
                        ? 'Connection Verified: '
                        : 'Connection Test Failed: '}
                    </span>
                    <span>{testResult.message}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 bg-slate-950/80 px-6 py-4">
              <button
                type="button"
                disabled={testingConnection}
                onClick={() => void handleTestConnection()}
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-200 transition-colors hover:border-blue-500/50 hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {testingConnection ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-400" />
                    <span>Testing Connection...</span>
                  </>
                ) : (
                  <>
                    <Wifi className="h-3.5 w-3.5 text-blue-400" />
                    <span>Test Connection</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="inline-flex cursor-pointer items-center rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-600/20 transition-colors hover:bg-blue-500"
              >
                Save &amp; Return to Court
              </button>
            </footer>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
