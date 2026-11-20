import { DELIBERATION_ORDER, HATS } from '../../config/hats';
import { useCourtStore } from '../../store/useCourtStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import type { HatId } from '../../types/court';
import type { ChatMessage } from '../../types/provider';
import { getProviderAdapter, isAbortError } from './ProviderAdapter';

let activeAbortController: AbortController | null = null;

/**
 * Builds the contextual user message passed to the current hat, including:
 * 1. The user's submitted Case Dilemma
 * 2. Optional Context / Constraints
 * 3. The full chronological transcript of all preceding hats in the session
 */
function buildHatUserPrompt(
  currentHatId: HatId,
  casePrompt: string,
  contextConstraints: string,
  completedTranscripts: Array<{ hatId: HatId; content: string }>,
): string {
  const currentHat = HATS[currentHatId];
  const sections: string[] = [
    `CASE DILEMMA:\n${casePrompt.trim()}`,
  ];

  if (contextConstraints.trim().length > 0) {
    sections.push(
      `CONTEXT & CONSTRAINTS:\n${contextConstraints.trim()}`,
    );
  }

  if (completedTranscripts.length > 0) {
    const formattedTranscript = completedTranscripts
      .map(({ hatId, content }) => {
        const hatMeta = HATS[hatId];
        return `--- [Turn ${hatMeta.turnOrder}: ${hatMeta.name.toUpperCase()} — ${hatMeta.roleTitle}] ---\n${content.trim()}`;
      })
      .join('\n\n');

    sections.push(
      `PRIOR COUNCIL TRANSCRIPT (Build upon or respond to these preceding perspectives according to your specific cognitive lens):\n\n${formattedTranscript}`,
    );
  }

  sections.push(
    `YOUR TURN NOW:\nDeliver your official statement as the ${currentHat.name} (${currentHat.roleTitle}, Turn ${currentHat.turnOrder} of 6). Stay strictly within your assigned cognitive lens (${currentHat.cognitiveLens}).`,
  );

  return sections.join('\n\n========================================\n\n');
}

/**
 * Cancels any currently running 5+1 court session immediately.
 */
export function abortCourtSession(): void {
  if (activeAbortController) {
    activeAbortController.abort();
    activeAbortController = null;
  }
  const courtStore = useCourtStore.getState();
  if (courtStore.status === 'running') {
    courtStore.abortSession();
  }
}

/**
 * Executes the sequential 5+1 Decision Court session:
 * White Hat -> Red Hat -> Yellow Hat -> Black Hat -> Green Hat -> Blue Hat (Head Judge).
 */
export async function runCourtSession(): Promise<void> {
  // Abort any previous in-flight session first
  if (activeAbortController) {
    activeAbortController.abort();
    activeAbortController = null;
  }

  const courtState = useCourtStore.getState();
  const settingsState = useSettingsStore.getState();

  const casePrompt = courtState.casePrompt.trim();
  const contextConstraints = courtState.contextConstraints.trim();

  if (!casePrompt) {
    courtState.setHatStatus(
      'white',
      'error',
      'Please enter a decision or dilemma before convening the court.',
    );
    return;
  }

  if (!settingsState.isConfigured()) {
    courtState.startSession();
    courtState.setHatStatus(
      'white',
      'error',
      'No API key configured. Please open Settings to enter your API key or enable Demo Mode.',
    );
    return;
  }

  const controller = new AbortController();
  activeAbortController = controller;
  const { signal } = controller;

  const adapter = getProviderAdapter(settingsState);
  const completedTranscripts: Array<{ hatId: HatId; content: string }> = [];

  courtState.startSession();

  try {
    for (const hatId of DELIBERATION_ORDER) {
      if (signal.aborted) {
        useCourtStore.getState().abortSession();
        return;
      }

      const hatConfig = HATS[hatId];
      const store = useCourtStore.getState();

      store.setActiveHat(hatId);
      store.setHatStatus(hatId, 'thinking');

      const userPrompt = buildHatUserPrompt(
        hatId,
        casePrompt,
        contextConstraints,
        completedTranscripts,
      );

      const messages: ChatMessage[] = [
        {
          role: 'user',
          content: userPrompt,
        },
      ];

      let turnError: Error | null = null;
      let turnFinalText = '';

      await adapter.streamCompletion({
        settings: useSettingsStore.getState(),
        systemPrompt: hatConfig.systemPrompt,
        messages,
        signal,
        callbacks: {
          onToken: (chunk) => {
            if (signal.aborted) return;
            useCourtStore.getState().appendHatToken(hatId, chunk);
          },
          onComplete: (fullText) => {
            turnFinalText = fullText;
          },
          onError: (err) => {
            turnError = err;
          },
        },
      });

      if (signal.aborted) {
        useCourtStore.getState().abortSession();
        return;
      }

      if (turnError) {
        const errMessage =
          (turnError as Error).message ||
          `An error occurred during ${hatConfig.name}'s turn.`;
        useCourtStore.getState().setHatStatus(hatId, 'error', errMessage);
        useCourtStore.getState().setActiveHat(null);
        return;
      }

      const recordedContent =
        useCourtStore.getState().responses[hatId].content.trim() ||
        turnFinalText.trim();

      useCourtStore.getState().setHatStatus(hatId, 'completed');
      completedTranscripts.push({
        hatId,
        content: recordedContent,
      });
    }

    if (!signal.aborted) {
      useCourtStore.getState().completeSession();
    }
  } catch (error: unknown) {
    if (isAbortError(error, signal)) {
      useCourtStore.getState().abortSession();
      return;
    }

    const activeHat = useCourtStore.getState().activeHatId ?? 'white';
    const message =
      error instanceof Error
        ? error.message
        : 'An unexpected error interrupted the court session.';
    useCourtStore.getState().setHatStatus(activeHat, 'error', message);
    useCourtStore.getState().setActiveHat(null);
  } finally {
    if (activeAbortController === controller) {
      activeAbortController = null;
    }
  }
}
