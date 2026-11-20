import type {
  AIProviderAdapter,
  ChatMessage,
  ConnectionTestResult,
  ProviderSettings,
  StreamCompletionParams,
} from '../../types/provider';
import {
  isAbortError,
  normalizeHttpError,
  normalizeProviderError,
  parseSSEStream,
  resolveEffectiveBaseUrl,
  resolveEffectiveModelId,
} from './ProviderAdapter';

interface OpenAIStreamDelta {
  content?: string | null;
}

interface OpenAIStreamChoice {
  delta?: OpenAIStreamDelta;
}

interface OpenAIStreamChunk {
  choices?: OpenAIStreamChoice[];
}

function buildOpenAIHeaders(
  apiKey: string,
  baseUrl: string,
): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (apiKey.length > 0) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  if (baseUrl.toLowerCase().includes('openrouter.ai')) {
    const referer =
      typeof window !== 'undefined' && window.location?.origin
        ? window.location.origin
        : 'https://github.com/ai-logical-decision-court-v2';
    headers['HTTP-Referer'] = referer;
    headers['X-Title'] = 'AI Logical Decision Court v2';
  }

  return headers;
}

function isLocalEndpoint(baseUrl: string): boolean {
  return /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?/i.test(baseUrl);
}

export const openaiAdapter: AIProviderAdapter = {
  id: 'openai',

  async streamCompletion(params: StreamCompletionParams): Promise<void> {
    const { settings, systemPrompt, messages, callbacks, signal } = params;
    const providerId = settings.provider === 'openrouter' ? 'openrouter' : 'openai';
    const baseUrl = resolveEffectiveBaseUrl(settings);
    const apiKey = settings.apiKey.trim();

    if (!apiKey && !isLocalEndpoint(baseUrl)) {
      callbacks.onError(
        new Error(
          'API key is missing. Please configure your key in Settings or enable Demo Mode.',
        ),
      );
      return;
    }

    const modelId = resolveEffectiveModelId(settings);
    const url = `${baseUrl}/chat/completions`;

    const payloadMessages: ChatMessage[] = [];
    if (systemPrompt.trim().length > 0) {
      payloadMessages.push({
        role: 'system',
        content: systemPrompt.trim(),
      });
    }
    for (const msg of messages) {
      payloadMessages.push({
        role: msg.role,
        content: msg.content,
      });
    }

    let fullText = '';

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: buildOpenAIHeaders(apiKey, baseUrl),
        body: JSON.stringify({
          model: modelId,
          messages: payloadMessages,
          stream: true,
        }),
        signal,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw normalizeHttpError(
          providerId,
          response.status,
          errorText,
          modelId,
        );
      }

      await parseSSEStream(
        response,
        (dataPayload) => {
          try {
            const parsed = JSON.parse(dataPayload) as OpenAIStreamChunk;
            const deltaText = parsed.choices?.[0]?.delta?.content;
            if (typeof deltaText === 'string' && deltaText.length > 0) {
              fullText += deltaText;
              callbacks.onToken(deltaText);
            }
          } catch {
            // Ignore non-JSON comments or heartbeats
          }
        },
        signal,
      );

      callbacks.onComplete(fullText);
    } catch (error: unknown) {
      if (isAbortError(error, signal)) {
        return;
      }
      callbacks.onError(normalizeProviderError(error, providerId));
    }
  },

  async testConnection(
    settings: ProviderSettings,
  ): Promise<ConnectionTestResult> {
    const providerId =
      settings.provider === 'openrouter' ? 'openrouter' : 'openai';
    const baseUrl = resolveEffectiveBaseUrl(settings);
    const apiKey = settings.apiKey.trim();

    if (!apiKey && !isLocalEndpoint(baseUrl)) {
      return {
        ok: false,
        message: 'Please enter an API key before testing the connection.',
      };
    }

    const modelId = resolveEffectiveModelId(settings);
    const url = `${baseUrl}/chat/completions`;
    const startTime = performance.now();

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: buildOpenAIHeaders(apiKey, baseUrl),
        body: JSON.stringify({
          model: modelId,
          messages: [{ role: 'user', content: 'Reply with OK.' }],
          max_tokens: 8,
          stream: false,
        }),
      });

      const latencyMs = Math.round(performance.now() - startTime);

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        const normalized = normalizeHttpError(
          providerId,
          response.status,
          errorText,
          modelId,
        );
        return {
          ok: false,
          message: normalized.message,
          latencyMs,
        };
      }

      return {
        ok: true,
        message: `Connected to ${modelId} at ${baseUrl} in ${latencyMs}ms.`,
        latencyMs,
      };
    } catch (error: unknown) {
      return {
        ok: false,
        message: normalizeProviderError(error, providerId).message,
      };
    }
  },
};
