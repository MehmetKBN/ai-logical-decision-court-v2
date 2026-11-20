import type {
  AIProviderAdapter,
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

interface AnthropicStreamEvent {
  type?: string;
  delta?: {
    type?: string;
    text?: string;
  };
  error?: {
    message?: string;
  };
}

function buildAnthropicHeaders(apiKey: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
    'anthropic-dangerous-direct-browser-access': 'true',
  };
}

export const anthropicAdapter: AIProviderAdapter = {
  id: 'anthropic',

  async streamCompletion(params: StreamCompletionParams): Promise<void> {
    const { settings, systemPrompt, messages, callbacks, signal } = params;
    const apiKey = settings.apiKey.trim();

    if (!apiKey) {
      callbacks.onError(
        new Error(
          'Anthropic API key is missing. Please add your key in Settings or enable Demo Mode.',
        ),
      );
      return;
    }

    const modelId = resolveEffectiveModelId(settings);
    const baseUrl = resolveEffectiveBaseUrl(settings);
    const url = `${baseUrl}/messages`;

    const extraSystem = messages
      .filter((m) => m.role === 'system')
      .map((m) => m.content.trim())
      .filter(Boolean);

    const topLevelSystem = [systemPrompt.trim(), ...extraSystem]
      .filter(Boolean)
      .join('\n\n');

    const conversationMessages = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'assistant' ? ('assistant' as const) : ('user' as const),
        content: m.content,
      }));

    if (conversationMessages.length === 0) {
      conversationMessages.push({
        role: 'user',
        content: 'Proceed with your statement.',
      });
    }

    let fullText = '';

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: buildAnthropicHeaders(apiKey),
        body: JSON.stringify({
          model: modelId,
          max_tokens: 1024,
          ...(topLevelSystem ? { system: topLevelSystem } : {}),
          messages: conversationMessages,
          stream: true,
        }),
        signal,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw normalizeHttpError(
          'anthropic',
          response.status,
          errorText,
          modelId,
        );
      }

      let streamError: Error | null = null;

      await parseSSEStream(
        response,
        (dataPayload) => {
          try {
            const event = JSON.parse(dataPayload) as AnthropicStreamEvent;
            if (
              event.type === 'content_block_delta' &&
              event.delta?.type === 'text_delta' &&
              typeof event.delta.text === 'string'
            ) {
              fullText += event.delta.text;
              callbacks.onToken(event.delta.text);
            } else if (event.type === 'error' && event.error?.message) {
              streamError = new Error(
                `Anthropic stream error: ${event.error.message}`,
              );
            }
          } catch {
            // Ignore non-JSON SSE lines
          }
        },
        signal,
      );

      if (streamError) {
        throw streamError;
      }

      callbacks.onComplete(fullText);
    } catch (error: unknown) {
      if (isAbortError(error, signal)) {
        return;
      }
      callbacks.onError(normalizeProviderError(error, 'anthropic'));
    }
  },

  async testConnection(
    settings: ProviderSettings,
  ): Promise<ConnectionTestResult> {
    const apiKey = settings.apiKey.trim();
    if (!apiKey) {
      return {
        ok: false,
        message: 'Please enter an Anthropic API key before testing.',
      };
    }

    const modelId = resolveEffectiveModelId(settings);
    const baseUrl = resolveEffectiveBaseUrl(settings);
    const url = `${baseUrl}/messages`;
    const startTime = performance.now();

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: buildAnthropicHeaders(apiKey),
        body: JSON.stringify({
          model: modelId,
          max_tokens: 8,
          messages: [{ role: 'user', content: 'Reply with OK.' }],
        }),
      });

      const latencyMs = Math.round(performance.now() - startTime);

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        const normalized = normalizeHttpError(
          'anthropic',
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
        message: `Connected to Anthropic (${modelId}) in ${latencyMs}ms.`,
        latencyMs,
      };
    } catch (error: unknown) {
      return {
        ok: false,
        message: normalizeProviderError(error, 'anthropic').message,
      };
    }
  },
};
