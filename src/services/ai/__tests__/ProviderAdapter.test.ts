import { describe, expect, it } from 'vitest';
import {
  normalizeHttpError,
  parseSSEStream,
  resolveEffectiveBaseUrl,
  resolveEffectiveModelId,
} from '../ProviderAdapter';
import type { ProviderSettings } from '../../../types/provider';

function createChunkedResponse(chunks: string[]): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
      }
      controller.close();
    },
  });
  return new Response(stream);
}

describe('ProviderAdapter utilities', () => {
  describe('parseSSEStream', () => {
    it('reassembles partial SSE lines split across multiple network packets and stops at [DONE]', async () => {
      const response = createChunkedResponse([
        'data: {"text":"First ',
        'part"}\n\ndata: {"text":"Second"}\r\n',
        ': keep-alive comment\n',
        'data: [DONE]\n',
        'data: {"text":"Ignored after DONE"}\n',
      ]);

      const received: string[] = [];
      await parseSSEStream(response, (payload) => {
        received.push(payload);
      });

      expect(received).toEqual([
        '{"text":"First part"}',
        '{"text":"Second"}',
      ]);
    });

    it('aborts immediately when AbortSignal is triggered', async () => {
      const abortController = new AbortController();
      const encoder = new TextEncoder();

      const stream = new ReadableStream<Uint8Array>({
        pull(controller) {
          controller.enqueue(encoder.encode('data: {"chunk":1}\n\n'));
          abortController.abort();
        },
      });

      const response = new Response(stream);
      const received: string[] = [];

      await expect(
        parseSSEStream(
          response,
          (payload) => {
            received.push(payload);
          },
          abortController.signal,
        ),
      ).rejects.toThrow(/aborted/i);

      expect(received).toEqual(['{"chunk":1}']);
    });
  });

  describe('normalizeHttpError', () => {
    it('formats 401/403 authentication errors cleanly with server JSON message', () => {
      const err = normalizeHttpError(
        'gemini',
        401,
        JSON.stringify({ error: { message: 'API key not valid' } }),
        'gemini-2.5-flash',
      );
      expect(err.message).toContain('Authentication failed (401)');
      expect(err.message).toContain('Google Gemini');
      expect(err.message).toContain('API key not valid');
    });

    it('formats 404 model not found errors with the offending model ID', () => {
      const err = normalizeHttpError(
        'openai',
        404,
        '{"message":"Model gpt-99 does not exist"}',
        'gpt-99',
      );
      expect(err.message).toContain('404');
      expect(err.message).toContain('gpt-99');
    });

    it('formats 429 rate limit errors clearly', () => {
      const err = normalizeHttpError(
        'anthropic',
        429,
        '{"error":"rate_limit_exceeded"}',
        'claude-3-7-sonnet-latest',
      );
      expect(err.message).toContain('Rate limit or quota exceeded (429)');
      expect(err.message).toContain('Anthropic Claude');
    });

    it('formats 500+ upstream server errors', () => {
      const err = normalizeHttpError(
        'openrouter',
        503,
        'Service Unavailable',
        'google/gemini-2.5-flash',
      );
      expect(err.message).toContain('upstream server error (503)');
    });
  });

  describe('resolveEffectiveModelId & resolveEffectiveBaseUrl', () => {
    const baseSettings: ProviderSettings = {
      provider: 'openrouter',
      apiKey: 'test-key',
      modelId: 'google/gemini-2.5-flash',
      customModelId: '  deepseek/deepseek-r1  ',
      customBaseUrl: 'https://api.groq.com/openai/v1///',
      storageMode: 'local',
      demoMode: false,
    };

    it('prioritizes trimmed customModelId over preset modelId', () => {
      expect(resolveEffectiveModelId(baseSettings)).toBe(
        'deepseek/deepseek-r1',
      );
      expect(
        resolveEffectiveModelId({ ...baseSettings, customModelId: '   ' }),
      ).toBe('google/gemini-2.5-flash');
    });

    it('strips trailing slashes from customBaseUrl for OpenRouter/Custom provider', () => {
      expect(resolveEffectiveBaseUrl(baseSettings)).toBe(
        'https://api.groq.com/openai/v1',
      );
    });
  });
});
