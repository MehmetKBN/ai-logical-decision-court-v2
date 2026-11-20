import { create } from 'zustand';
import { PROVIDERS } from '../config/providers';
import type {
  ProviderId,
  ProviderSettings,
  StorageMode,
} from '../types/provider';

const STORAGE_KEY = 'aildc_v2_provider_settings';

const DEFAULT_SETTINGS: ProviderSettings = {
  provider: 'gemini',
  apiKey: '',
  modelId: PROVIDERS.gemini.defaultModelId,
  customModelId: '',
  customBaseUrl: PROVIDERS.openrouter.defaultBaseUrl,
  storageMode: 'local',
  demoMode: false,
};

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

function getStorageByMode(mode: StorageMode): Storage | null {
  if (!isBrowser()) return null;
  try {
    return mode === 'session' ? window.sessionStorage : window.localStorage;
  } catch {
    return null;
  }
}

function loadPersistedSettings(): ProviderSettings {
  if (!isBrowser()) return DEFAULT_SETTINGS;

  try {
    // Check sessionStorage first in case the user opted into session-only privacy mode
    const sessionRaw = window.sessionStorage.getItem(STORAGE_KEY);
    if (sessionRaw) {
      const parsed = JSON.parse(sessionRaw) as Partial<ProviderSettings>;
      return sanitizeSettings({ ...DEFAULT_SETTINGS, ...parsed, storageMode: 'session' });
    }

    const localRaw = window.localStorage.getItem(STORAGE_KEY);
    if (localRaw) {
      const parsed = JSON.parse(localRaw) as Partial<ProviderSettings>;
      return sanitizeSettings({ ...DEFAULT_SETTINGS, ...parsed, storageMode: 'local' });
    }
  } catch {
    // Fall back safely to defaults if storage is corrupted or blocked
  }

  return DEFAULT_SETTINGS;
}

function sanitizeSettings(raw: ProviderSettings): ProviderSettings {
  const provider: ProviderId =
    raw.provider in PROVIDERS ? raw.provider : DEFAULT_SETTINGS.provider;
  const providerMeta = PROVIDERS[provider];

  return {
    provider,
    apiKey: typeof raw.apiKey === 'string' ? raw.apiKey : '',
    modelId:
      typeof raw.modelId === 'string' && raw.modelId.trim().length > 0
        ? raw.modelId
        : providerMeta.defaultModelId,
    customModelId:
      typeof raw.customModelId === 'string' ? raw.customModelId : '',
    customBaseUrl:
      typeof raw.customBaseUrl === 'string' && raw.customBaseUrl.trim().length > 0
        ? raw.customBaseUrl
        : PROVIDERS.openrouter.defaultBaseUrl,
    storageMode: raw.storageMode === 'session' ? 'session' : 'local',
    demoMode: Boolean(raw.demoMode),
  };
}

function persistSettings(settings: ProviderSettings): void {
  if (!isBrowser()) return;

  try {
    const activeStorage = getStorageByMode(settings.storageMode);
    const inactiveMode: StorageMode =
      settings.storageMode === 'local' ? 'session' : 'local';
    const inactiveStorage = getStorageByMode(inactiveMode);

    // Always purge the opposite storage so API keys are never left behind on mode switch
    inactiveStorage?.removeItem(STORAGE_KEY);
    activeStorage?.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Ignore quota or private-browsing storage errors gracefully
  }
}

function extractSettingsSnapshot(state: SettingsStoreState): ProviderSettings {
  return {
    provider: state.provider,
    apiKey: state.apiKey,
    modelId: state.modelId,
    customModelId: state.customModelId,
    customBaseUrl: state.customBaseUrl,
    storageMode: state.storageMode,
    demoMode: state.demoMode,
  };
}

export interface SettingsStoreState extends ProviderSettings {
  setProvider: (provider: ProviderId) => void;
  setApiKey: (apiKey: string) => void;
  setModelId: (modelId: string) => void;
  setCustomModelId: (customModelId: string) => void;
  setCustomBaseUrl: (customBaseUrl: string) => void;
  setStorageMode: (storageMode: StorageMode) => void;
  setDemoMode: (demoMode: boolean) => void;
  updateSettings: (partial: Partial<ProviderSettings>) => void;
  clearApiKey: () => void;
  getEffectiveModelId: () => string;
  getEffectiveBaseUrl: () => string;
  isConfigured: () => boolean;
}

export const useSettingsStore = create<SettingsStoreState>((set, get) => {
  const initial = loadPersistedSettings();

  return {
    ...initial,

    setProvider: (provider) => {
      const providerMeta = PROVIDERS[provider];
      set((state) => {
        const next: ProviderSettings = {
          ...extractSettingsSnapshot(state),
          provider,
          modelId: providerMeta.defaultModelId,
        };
        persistSettings(next);
        return next;
      });
    },

    setApiKey: (apiKey) => {
      set((state) => {
        const next: ProviderSettings = {
          ...extractSettingsSnapshot(state),
          apiKey,
        };
        persistSettings(next);
        return next;
      });
    },

    setModelId: (modelId) => {
      set((state) => {
        const next: ProviderSettings = {
          ...extractSettingsSnapshot(state),
          modelId,
        };
        persistSettings(next);
        return next;
      });
    },

    setCustomModelId: (customModelId) => {
      set((state) => {
        const next: ProviderSettings = {
          ...extractSettingsSnapshot(state),
          customModelId,
        };
        persistSettings(next);
        return next;
      });
    },

    setCustomBaseUrl: (customBaseUrl) => {
      set((state) => {
        const next: ProviderSettings = {
          ...extractSettingsSnapshot(state),
          customBaseUrl,
        };
        persistSettings(next);
        return next;
      });
    },

    setStorageMode: (storageMode) => {
      set((state) => {
        const next: ProviderSettings = {
          ...extractSettingsSnapshot(state),
          storageMode,
        };
        persistSettings(next);
        return next;
      });
    },

    setDemoMode: (demoMode) => {
      set((state) => {
        const next: ProviderSettings = {
          ...extractSettingsSnapshot(state),
          demoMode,
        };
        persistSettings(next);
        return next;
      });
    },

    updateSettings: (partial) => {
      set((state) => {
        const merged = sanitizeSettings({
          ...extractSettingsSnapshot(state),
          ...partial,
        });
        persistSettings(merged);
        return merged;
      });
    },

    clearApiKey: () => {
      set((state) => {
        const next: ProviderSettings = {
          ...extractSettingsSnapshot(state),
          apiKey: '',
        };
        persistSettings(next);
        return next;
      });
    },

    getEffectiveModelId: () => {
      const { customModelId, modelId, provider } = get();
      const trimmedCustom = customModelId.trim();
      if (trimmedCustom.length > 0) {
        return trimmedCustom;
      }
      return modelId.trim() || PROVIDERS[provider].defaultModelId;
    },

    getEffectiveBaseUrl: () => {
      const { provider, customBaseUrl } = get();
      if (provider === 'openrouter') {
        const trimmed = customBaseUrl.trim().replace(/\/+$/, '');
        return trimmed.length > 0 ? trimmed : PROVIDERS.openrouter.defaultBaseUrl;
      }
      return PROVIDERS[provider].defaultBaseUrl;
    },

    isConfigured: () => {
      const { demoMode, apiKey } = get();
      return demoMode || apiKey.trim().length > 0;
    },
  };
});
