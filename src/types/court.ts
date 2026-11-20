export type HatId = 'white' | 'red' | 'yellow' | 'black' | 'green' | 'blue';

export type HatStatus =
  | 'idle'
  | 'thinking'
  | 'streaming'
  | 'completed'
  | 'error'
  | 'aborted';

export type HatIconName =
  | 'FileText'
  | 'Flame'
  | 'Sun'
  | 'ShieldAlert'
  | 'Sprout'
  | 'Scale';

export interface HatConfig {
  id: HatId;
  name: string;
  roleTitle: string;
  turnOrder: 1 | 2 | 3 | 4 | 5 | 6;
  isJudge: boolean;
  accentHex: string;
  glowClass: string;
  iconName: HatIconName;
  shortTagline: string;
  cognitiveLens: string;
  systemPrompt: string;
}

export interface HatResponse {
  hatId: HatId;
  status: HatStatus;
  content: string;
  errorMessage?: string;
  startedAt?: number;
  completedAt?: number;
}

export type SessionStatus =
  | 'idle'
  | 'running'
  | 'completed'
  | 'aborted'
  | 'error';

export interface CourtSession {
  casePrompt: string;
  contextConstraints: string;
  status: SessionStatus;
  activeHatId: HatId | null;
  responses: Record<HatId, HatResponse>;
}
