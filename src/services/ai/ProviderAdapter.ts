import { PROVIDERS } from '../../config/providers';
import type {
  AIProviderAdapter,
  ProviderId,
  ProviderSettings,
} from '../../types/provider';
import { anthropicAdapter } from './anthropicAdapter';
import { geminiAdapter } from './geminiAdapter';
import { mockAdapter } from './mockAdapter';
import { openaiAdapter } from './openaiAdapter';

/**
 * Resolves the effective model ID from user settings, prioritizing a custom model ID override.
 */
export function resolveEffectiveModelId(settings: ProviderSettings): string {
  const custom = settings.customModelId.trim();
  if (custom.length > 0) {
    return custom;
  }
  const preset = settings.modelId.trim();
  if (preset.length > 0) {
    return preset;
  }
  return PROVIDERS[settings.provider].defaultModelId;
}

/**
 * Resolves the clean base URL (without trailing slashes) for the active provider.
 */
export function resolveEffectiveBaseUrl(settings: ProviderSettings): string {
  if (settings.provider === 'openrouter') {
    const custom = settings.customBaseUrl.trim().replace(/\/+$/, '');
    if (custom.length > 0) {
      return custom;
    }
    return PROVIDERS.openrouter.defaultBaseUrl;
  }
  return PROVIDERS[settings.provider].defaultBaseUrl.replace(/\/+$/, '');
}

/**
 * Checks whether an unknown error was triggered by an AbortController signal.
 */
export function isAbortError(error: unknown, signal?: AbortSignal): boolean {
  if (signal?.aborted) {
    return true;
  }
  if (error instanceof DOMException && error.name === 'AbortError') {
    return true;
  }
  if (error instanceof Error && error.name === 'AbortError') {
    return true;
  }
  return false;
}

/**
 * Extracts a server-provided message from a JSON error body if available.
 */
function extractJsonErrorDetail(rawBody: string): string | null {
  const trimmed = rawBody.trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
    return trimmed.length > 0 ? trimmed.slice(0, 240) : null;
  }

  try {
    const parsed: unknown = JSON.parse(trimmed);
    if (typeof parsed === 'object' && parsed !== null) {
      const record = parsed as Record<string, unknown>;
      if (typeof record.message === 'string' && record.message.trim()) {
        return record.message.trim();
      }
      if (typeof record.error === 'string' && record.error.trim()) {
        return record.error.trim();
      }
      if (typeof record.error === 'object' && record.error !== null) {
        const errObj = record.error as Record<string, unknown>;
        if (typeof errObj.message === 'string' && errObj.message.trim()) {
          return errObj.message.trim();
        }
      }
    }
  } catch {
    // Ignore JSON parse errors and fall back
  }

  return trimmed.length > 0 ? trimmed.slice(0, 240) : null;
}

/**
 * Converts HTTP status codes and raw error bodies into clear, user-friendly diagnostics
 * without ever echoing sensitive credentials.
 */
export function normalizeHttpError(
  providerId: ProviderId,
  status: number,
  rawBody: string,
  modelId: string,
): Error {
  const providerName = PROVIDERS[providerId].name;
  const detail = extractJsonErrorDetail(rawBody);
  const suffix = detail ? ` (${detail})` : '';

  if (status === 401 || status === 403) {
    return new Error(
      `Authentication failed (${status}) for ${providerName}. Please verify that your API key is valid and has billing/access enabled.${suffix}`,
    );
  }

  if (status === 404) {
    return new Error(
      `Model or endpoint not found (404) on ${providerName}. Verify that model ID "${modelId}" and the base URL are correct.${suffix}`,
    );
  }

  if (status === 429) {
    return new Error(
      `Rate limit or quota exceeded (429) on ${providerName}. Please wait a moment before retrying or check your provider quota.${suffix}`,
    );
  }

  if (status >= 500) {
    return new Error(
      `${providerName} encountered an upstream server error (${status}). Please try again shortly.${suffix}`,
    );
  }

  return new Error(
    `${providerName} request failed with HTTP ${status}${suffix || '.'}`,
  );
}

/**
 * Normalizes unexpected runtime or network/CORS errors into readable Error instances.
 */
export function normalizeProviderError(
  error: unknown,
  providerId: ProviderId,
): Error {
  if (error instanceof Error) {
    if (error.name === 'AbortError') {
      return error;
    }
    if (
      error.name === 'TypeError' &&
      /fetch|network|failed to fetch/i.test(error.message)
    ) {
      const providerName = PROVIDERS[providerId].name;
      return new Error(
        `Network or CORS error while connecting to ${providerName}. Check your internet connection, ad-blocker/firewall, or custom Base URL.`,
      );
    }
    return error;
  }

  return new Error(
    `Unexpected error while communicating with ${PROVIDERS[providerId].name}.`,
  );
}

/**
 * Safely reads a Server-Sent Events (SSE) HTTP response stream, buffering partial chunks
 * across network packet boundaries and invoking `onDataLine` for each `data:` payload.
 */
export async function parseSSEStream(
  response: Response,
  onDataLine: (dataPayload: string) => void,
  signal?: AbortSignal,
): Promise<void> {
  if (!response.body) {
    throw new Error('The AI provider returned an empty response stream.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  const processLine = (rawLine: string): boolean => {
    const line = rawLine.trim();
    if (!line || line.startsWith(':')) {
      return false;
    }
    if (!line.startsWith('data:')) {
      return false;
    }

    const payload = line.slice(5).trim();
    if (!payload) {
      return false;
    }
    if (payload === '[DONE]') {
      return true;
    }

    onDataLine(payload);
    return false;
  };

  try {
    while (true) {
      if (signal?.aborted) {
        await reader.cancel();
        throw new DOMException('Deliberation stream aborted by user.', 'AbortError');
      }

      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const shouldStop = processLine(line);
        if (shouldStop) {
          await reader.cancel();
          return;
        }
      }
    }

    buffer += decoder.decode();
    if (buffer.trim().length > 0) {
      const remainingLines = buffer.split(/\r?\n/);
      for (const line of remainingLines) {
        const shouldStop = processLine(line);
        if (shouldStop) {
          return;
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Factory returning the active AIProviderAdapter based on user settings.
 * Returns `mockAdapter` automatically when `demoMode` is enabled.
 */
export function getProviderAdapter(
  settings: ProviderSettings,
): AIProviderAdapter {
  if (settings.demoMode) {
    return mockAdapter;
  }

  switch (settings.provider) {
    case 'gemini':
      return geminiAdapter;
    case 'openai':
    case 'openrouter':
      return openaiAdapter;
    case 'anthropic':
      return anthropicAdapter;
  }
}
