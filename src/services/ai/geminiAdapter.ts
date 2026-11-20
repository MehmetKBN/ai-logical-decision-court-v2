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

interface GeminiContentPart {
  text: string;
}

interface GeminiContent {
  role: 'user' | 'model';
  parts: GeminiContentPart[];
}

interface GeminiCandidate {
  content?: {
    parts?: Array<{ text?: string }>;
  };
}

interface GeminiStreamChunk {
  candidates?: GeminiCandidate[];
}

function buildGeminiContents(messages: ChatMessage[]): GeminiContent[] {
  const contents: GeminiContent[] = [];

  for (const msg of messages) {
    if (msg.role === 'system') {
      continue;
    }
    const role: 'user' | 'model' = msg.role === 'assistant' ? 'model' : 'user';
    contents.push({
      role,
      parts: [{ text: msg.content }],
    });
  }

  if (contents.length === 0) {
    contents.push({
      role: 'user',
      parts: [{ text: 'Proceed with your statement.' }],
    });
  }

  return contents;
}

export const geminiAdapter: AIProviderAdapter = {
  id: 'gemini',

  async streamCompletion(params: StreamCompletionParams): Promise<void> {
    const { settings, systemPrompt, messages, callbacks, signal } = params;
    const apiKey = settings.apiKey.trim();

    if (!apiKey) {
      callbacks.onError(
        new Error('Google Gemini API key is missing. Please add your key in Settings or enable Demo Mode.'),
      );
      return;
    }

    const modelId = resolveEffectiveModelId(settings);
    const baseUrl = resolveEffectiveBaseUrl(settings);
    const url = `${baseUrl}/models/${encodeURIComponent(modelId)}:streamGenerateContent?alt=sse&key=${encodeURIComponent(apiKey)}`;

    const systemMessages = messages
      .filter((m) => m.role === 'system')
      .map((m) => m.content.trim())
      .filter(Boolean);

    const combinedSystemInstruction = [systemPrompt.trim(), ...systemMessages]
      .filter(Boolean)
      .join('\n\n');

    const body = {
      ...(combinedSystemInstruction
        ? {
            systemInstruction: {
              parts: [{ text: combinedSystemInstruction }],
            },
          }
        : {}),
      contents: buildGeminiContents(messages),
      generationConfig: {
        temperature: 0.7,
      },
    };

    let fullText = '';

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw normalizeHttpError('gemini', response.status, errorText, modelId);
      }

      await parseSSEStream(
        response,
        (dataPayload) => {
          try {
            const parsed = JSON.parse(dataPayload) as GeminiStreamChunk;
            const parts = parsed.candidates?.[0]?.content?.parts;
            if (!parts) return;

            for (const part of parts) {
              if (typeof part.text === 'string' && part.text.length > 0) {
                fullText += part.text;
                callbacks.onToken(part.text);
              }
            }
          } catch {
            // Ignore malformed keep-alive fragments
          }
        },
        signal,
      );

      callbacks.onComplete(fullText);
    } catch (error: unknown) {
      if (isAbortError(error, signal)) {
        return;
      }
      callbacks.onError(normalizeProviderError(error, 'gemini'));
    }
  },

  async testConnection(
    settings: ProviderSettings,
  ): Promise<ConnectionTestResult> {
    const apiKey = settings.apiKey.trim();
    if (!apiKey) {
      return {
        ok: false,
        message: 'Please enter a Google Gemini API key before testing.',
      };
    }

    const modelId = resolveEffectiveModelId(settings);
    const baseUrl = resolveEffectiveBaseUrl(settings);
    const url = `${baseUrl}/models/${encodeURIComponent(modelId)}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const startTime = performance.now();

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: 'Reply with OK.' }] }],
          generationConfig: { maxOutputTokens: 8 },
        }),
      });

      const latencyMs = Math.round(performance.now() - startTime);

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        const normalized = normalizeHttpError(
          'gemini',
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
        message: `Connected to Google Gemini (${modelId}) in ${latencyMs}ms.`,
        latencyMs,
      };
    } catch (error: unknown) {
      return {
        ok: false,
        message: normalizeProviderError(error, 'gemini').message,
      };
    }
  },
};
