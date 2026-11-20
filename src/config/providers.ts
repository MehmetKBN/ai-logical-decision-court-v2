import type { ProviderId, ProviderMeta } from '../types/provider';

export const GITHUB_REPO_URL =
  'https://github.com/MehmetKBN/ai-logical-decision-court-v2';

export const PROVIDER_ORDER: readonly ProviderId[] = [
  'gemini',
  'openai',
  'anthropic',
  'openrouter',
] as const;

export const PROVIDERS: Record<ProviderId, ProviderMeta> = {
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    defaultBaseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    requiresBaseUrl: false,
    defaultModelId: 'gemini-2.5-flash',
    apiKeyPlaceholder: 'AIzaSy...',
    docsUrl: 'https://aistudio.google.com/app/apikey',
    models: [
      {
        id: 'gemini-4-hydrogen',
        label: 'Gemini 4 Hydrogen',
        description: 'Next-gen high-velocity reasoning & synthesis model',
      },
      {
        id: 'gemini-2.5-pro',
        label: 'Gemini 2.5 Pro',
        description: 'Deep multi-perspective reasoning for complex dilemmas',
      },
      {
        id: 'gemini-2.5-flash',
        label: 'Gemini 2.5 Flash',
        description: 'Fast, responsive sequential deliberation (Recommended)',
      },
    ],
  },

  openai: {
    id: 'openai',
    name: 'OpenAI',
    defaultBaseUrl: 'https://api.openai.com/v1',
    requiresBaseUrl: false,
    defaultModelId: 'gpt-4.1',
    apiKeyPlaceholder: 'sk-proj-...',
    docsUrl: 'https://platform.openai.com/api-keys',
    models: [
      {
        id: 'gpt-4.1',
        label: 'GPT-4.1',
        description: 'Flagship high-precision instruction following & analysis',
      },
      {
        id: 'gpt-4o',
        label: 'GPT-4o',
        description: 'Balanced speed and omni reasoning across all six hats',
      },
      {
        id: 'o3-mini',
        label: 'o3-mini',
        description: 'Compact STEM and logical reasoning specialist',
      },
    ],
  },

  anthropic: {
    id: 'anthropic',
    name: 'Anthropic Claude',
    defaultBaseUrl: 'https://api.anthropic.com/v1',
    requiresBaseUrl: false,
    defaultModelId: 'claude-3-7-sonnet-latest',
    apiKeyPlaceholder: 'sk-ant-api03-...',
    docsUrl: 'https://console.anthropic.com/settings/keys',
    models: [
      {
        id: 'claude-3-7-sonnet-latest',
        label: 'Claude 3.7 Sonnet',
        description: 'Nuanced persona adherence and judicial synthesis',
      },
      {
        id: 'claude-3-5-haiku-latest',
        label: 'Claude 3.5 Haiku',
        description: 'Ultra-fast council deliberation',
      },
    ],
  },

  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter / Custom OpenAI',
    defaultBaseUrl: 'https://openrouter.ai/api/v1',
    requiresBaseUrl: true,
    defaultModelId: 'google/gemini-2.5-flash',
    apiKeyPlaceholder: 'sk-or-v1-... (or custom endpoint key)',
    docsUrl: 'https://openrouter.ai/keys',
    models: [
      {
        id: 'google/gemini-2.5-flash',
        label: 'Google: Gemini 2.5 Flash (OpenRouter)',
        description: 'Low-latency OpenRouter preset',
      },
      {
        id: 'anthropic/claude-3.7-sonnet',
        label: 'Anthropic: Claude 3.7 Sonnet (OpenRouter)',
        description: 'High-depth reasoning via OpenRouter',
      },
      {
        id: 'openai/gpt-4.1',
        label: 'OpenAI: GPT-4.1 (OpenRouter)',
        description: 'Flagship OpenAI model via OpenRouter',
      },
      {
        id: 'deepseek/deepseek-r1',
        label: 'DeepSeek: R1 (OpenRouter)',
        description: 'Open-weights reasoning model via OpenRouter',
      },
    ],
  },
};
