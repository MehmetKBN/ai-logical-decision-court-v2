import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DELIBERATION_ORDER } from '../../../config/hats';
import { useCourtStore } from '../../../store/useCourtStore';
import { useSettingsStore } from '../../../store/useSettingsStore';
import type { HatId } from '../../../types/court';
import type {
  AIProviderAdapter,
  StreamCompletionParams,
} from '../../../types/provider';
import * as ProviderAdapterModule from '../ProviderAdapter';
import {
  abortCourtSession,
  retryFromHat,
  runCourtSession,
} from '../orchestrator';

function detectHatFromPrompt(systemPrompt: string): HatId {
  const firstLine = systemPrompt.split('\n')[0]?.toUpperCase() ?? '';
  if (firstLine.includes('YOU ARE THE WHITE HAT')) return 'white';
  if (firstLine.includes('YOU ARE THE RED HAT')) return 'red';
  if (firstLine.includes('YOU ARE THE YELLOW HAT')) return 'yellow';
  if (firstLine.includes('YOU ARE THE BLACK HAT')) return 'black';
  if (firstLine.includes('YOU ARE THE GREEN HAT')) return 'green';
  return 'blue';
}

describe('Sequential 5+1 Court Orchestrator', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useCourtStore.getState().resetCourt();
    useSettingsStore.getState().updateSettings({
      provider: 'gemini',
      apiKey: '',
      demoMode: true,
    });
  });

  it('executes all 6 hats sequentially in order (white -> red -> yellow -> black -> green -> blue) and passes prior context', async () => {
    const executionOrder: HatId[] = [];
    const promptsReceivedByHat: Record<string, string> = {};

    const stubAdapter: AIProviderAdapter = {
      id: 'gemini',
      testConnection: async () => ({ ok: true, message: 'OK' }),
      streamCompletion: async ({
        systemPrompt,
        messages,
        callbacks,
      }: StreamCompletionParams) => {
        const hatId = detectHatFromPrompt(systemPrompt);
        executionOrder.push(hatId);
        promptsReceivedByHat[hatId] = messages[0]?.content ?? '';

        const text = `Statement from ${hatId} hat.`;
        callbacks.onToken(text);
        callbacks.onComplete(text);
      },
    };

    vi.spyOn(ProviderAdapterModule, 'getProviderAdapter').mockReturnValue(
      stubAdapter,
    );

    useCourtStore
      .getState()
      .setCasePrompt('Should we open-source our core engine?');
    useCourtStore
      .getState()
      .setContextConstraints('Enterprise customers contribute 80% of revenue.');

    await runCourtSession();

    const finalState = useCourtStore.getState();
    expect(executionOrder).toEqual([...DELIBERATION_ORDER]);
    expect(finalState.status).toBe('completed');
    expect(finalState.activeHatId).toBeNull();

    for (const hatId of DELIBERATION_ORDER) {
      expect(finalState.responses[hatId].status).toBe('completed');
      expect(finalState.responses[hatId].content).toBe(
        `Statement from ${hatId} hat.`,
      );
    }

    // Verify Blue Hat received all 5 preceding council hats in its Prior Council Transcript
    expect(promptsReceivedByHat.blue).toContain('Statement from white hat.');
    expect(promptsReceivedByHat.blue).toContain('Statement from red hat.');
    expect(promptsReceivedByHat.blue).toContain('Statement from yellow hat.');
    expect(promptsReceivedByHat.blue).toContain('Statement from black hat.');
    expect(promptsReceivedByHat.blue).toContain('Statement from green hat.');
  });

  it('supports mid-session cancellation via abortCourtSession()', async () => {
    const executionOrder: HatId[] = [];

    const stubAdapter: AIProviderAdapter = {
      id: 'gemini',
      testConnection: async () => ({ ok: true, message: 'OK' }),
      streamCompletion: async ({
        systemPrompt,
        callbacks,
      }: StreamCompletionParams) => {
        const hatId = detectHatFromPrompt(systemPrompt);
        executionOrder.push(hatId);
        callbacks.onToken(`Partial ${hatId}`);

        if (hatId === 'yellow') {
          abortCourtSession();
          return;
        }

        callbacks.onComplete(`Partial ${hatId}`);
      },
    };

    vi.spyOn(ProviderAdapterModule, 'getProviderAdapter').mockReturnValue(
      stubAdapter,
    );

    useCourtStore.getState().setCasePrompt('Test abort mid-flight');
    await runCourtSession();

    const state = useCourtStore.getState();
    expect(state.status).toBe('aborted');
    expect(executionOrder).toEqual(['white', 'red', 'yellow']);
    expect(state.responses.white.status).toBe('completed');
    expect(state.responses.red.status).toBe('completed');
    expect(state.responses.yellow.status).toBe('aborted');
    expect(state.responses.black.status).toBe('idle');
  });

  it('retries from a failed hat via retryFromHat() while preserving earlier completed hats', async () => {
    let shouldFailBlackHat = true;
    const executedTurns: HatId[] = [];

    const stubAdapter: AIProviderAdapter = {
      id: 'gemini',
      testConnection: async () => ({ ok: true, message: 'OK' }),
      streamCompletion: async ({
        systemPrompt,
        callbacks,
      }: StreamCompletionParams) => {
        const hatId = detectHatFromPrompt(systemPrompt);
        executedTurns.push(hatId);

        if (hatId === 'black' && shouldFailBlackHat) {
          callbacks.onError(new Error('Simulated 429 Rate Limit on Black Hat'));
          return;
        }

        const output = `Completed testimony for ${hatId}`;
        callbacks.onToken(output);
        callbacks.onComplete(output);
      },
    };

    vi.spyOn(ProviderAdapterModule, 'getProviderAdapter').mockReturnValue(
      stubAdapter,
    );

    useCourtStore.getState().setCasePrompt('Test retryFromHat recovery');

    // First run fails on Turn #4 (Black Hat)
    await runCourtSession();

    const failedState = useCourtStore.getState();
    expect(failedState.status).toBe('error');
    expect(failedState.responses.white.status).toBe('completed');
    expect(failedState.responses.red.status).toBe('completed');
    expect(failedState.responses.yellow.status).toBe('completed');
    expect(failedState.responses.black.status).toBe('error');
    expect(failedState.responses.black.errorMessage).toContain(
      'Simulated 429 Rate Limit on Black Hat',
    );
    expect(failedState.responses.green.status).toBe('idle');

    // Now clear the simulated fault and retry directly from Black Hat
    shouldFailBlackHat = false;
    executedTurns.length = 0;

    await retryFromHat('black');

    const recoveredState = useCourtStore.getState();
    expect(executedTurns).toEqual(['black', 'green', 'blue']);
    expect(recoveredState.status).toBe('completed');

    // Earlier hats (white, red, yellow) remain intact without being re-executed
    for (const hatId of DELIBERATION_ORDER) {
      expect(recoveredState.responses[hatId].status).toBe('completed');
      expect(recoveredState.responses[hatId].content).toBe(
        `Completed testimony for ${hatId}`,
      );
    }
  });
});
