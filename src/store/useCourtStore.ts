import { create } from 'zustand';
import { DELIBERATION_ORDER } from '../config/hats';
import type {
  CourtSession,
  HatId,
  HatResponse,
  HatStatus,
} from '../types/court';

export function createInitialResponses(): Record<HatId, HatResponse> {
  return DELIBERATION_ORDER.reduce(
    (acc, hatId) => {
      acc[hatId] = {
        hatId,
        status: 'idle',
        content: '',
      };
      return acc;
    },
    {} as Record<HatId, HatResponse>,
  );
}

export interface CourtStoreState extends CourtSession {
  setCasePrompt: (casePrompt: string) => void;
  setContextConstraints: (contextConstraints: string) => void;
  startSession: () => void;
  setActiveHat: (hatId: HatId | null) => void;
  appendHatToken: (hatId: HatId, chunk: string) => void;
  setHatStatus: (
    hatId: HatId,
    status: HatStatus,
    errorMessage?: string,
  ) => void;
  completeSession: () => void;
  abortSession: () => void;
  resetCourt: () => void;
}

export const useCourtStore = create<CourtStoreState>((set) => ({
  casePrompt: '',
  contextConstraints: '',
  status: 'idle',
  activeHatId: null,
  responses: createInitialResponses(),

  setCasePrompt: (casePrompt) => {
    set({ casePrompt });
  },

  setContextConstraints: (contextConstraints) => {
    set({ contextConstraints });
  },

  startSession: () => {
    set({
      status: 'running',
      activeHatId: 'white',
      responses: createInitialResponses(),
    });
  },

  setActiveHat: (hatId) => {
    set({ activeHatId: hatId });
  },

  appendHatToken: (hatId, chunk) => {
    set((state) => {
      const current = state.responses[hatId];
      return {
        responses: {
          ...state.responses,
          [hatId]: {
            ...current,
            status: 'streaming',
            content: current.content + chunk,
            startedAt: current.startedAt ?? Date.now(),
          },
        },
      };
    });
  },

  setHatStatus: (hatId, status, errorMessage) => {
    set((state) => {
      const current = state.responses[hatId];
      const now = Date.now();
      const isTerminal =
        status === 'completed' || status === 'error' || status === 'aborted';

      return {
        status: status === 'error' ? 'error' : state.status,
        responses: {
          ...state.responses,
          [hatId]: {
            ...current,
            status,
            errorMessage: errorMessage ?? current.errorMessage,
            startedAt:
              status === 'thinking' || status === 'streaming'
                ? (current.startedAt ?? now)
                : current.startedAt,
            completedAt: isTerminal ? now : current.completedAt,
          },
        },
      };
    });
  },

  completeSession: () => {
    set({
      status: 'completed',
      activeHatId: null,
    });
  },

  abortSession: () => {
    set((state) => {
      const updatedResponses = { ...state.responses };
      for (const hatId of DELIBERATION_ORDER) {
        const item = updatedResponses[hatId];
        if (item.status === 'thinking' || item.status === 'streaming') {
          updatedResponses[hatId] = {
            ...item,
            status: 'aborted',
            completedAt: Date.now(),
          };
        }
      }

      return {
        status: 'aborted',
        activeHatId: null,
        responses: updatedResponses,
      };
    });
  },

  resetCourt: () => {
    set({
      casePrompt: '',
      contextConstraints: '',
      status: 'idle',
      activeHatId: null,
      responses: createInitialResponses(),
    });
  },
}));
