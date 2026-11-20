export type ProviderId = 'gemini' | 'openai' | 'anthropic' | 'openrouter';

export type StorageMode = 'local' | 'session';

export interface ModelPreset {
  id: string;
  label: string;
  description?: string;
}

export interface ProviderMeta {
  id: ProviderId;
  name: string;
  defaultBaseUrl: string;
  requiresBaseUrl: boolean;
  defaultModelId: string;
  models: ModelPreset[];
  apiKeyPlaceholder: string;
  docsUrl: string;
}

export interface ProviderSettings {
  provider: ProviderId;
  apiKey: string;
  modelId: string;
  customModelId: string;
  customBaseUrl: string;
  storageMode: StorageMode;
  demoMode: boolean;
}

export type ChatRole = 'system' | 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface StreamCallbacks {
  onToken: (chunk: string) => void;
  onComplete: (fullText: string) => void;
  onError: (error: Error) => void;
}

export interface StreamCompletionParams {
  settings: ProviderSettings;
  systemPrompt: string;
  messages: ChatMessage[];
  callbacks: StreamCallbacks;
  signal?: AbortSignal;
}

export interface ConnectionTestResult {
  ok: boolean;
  message: string;
  latencyMs?: number;
}

export interface AIProviderAdapter {
  readonly id: ProviderId;
  streamCompletion: (params: StreamCompletionParams) => Promise<void>;
  testConnection: (settings: ProviderSettings) => Promise<ConnectionTestResult>;
}
