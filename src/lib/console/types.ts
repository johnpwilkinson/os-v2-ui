export interface ConsoleDecision {
  id: string;
  kind: string; // 'propose' | 'verdict' | 'halt' | 'offer' | future kinds
  repo: string | null;
  feature: string | null;
  runId: string | null;
  title: string;
  recommendation: string;
  ts: string; // ISO mint time
  expiresAt: string; // ISO expiry
}

export interface ConsoleRepo {
  class: string | null;
  watched: boolean;
  driver: boolean;
}

export interface ConsoleEngine {
  active: boolean;
  phase: string | null;
  repo: string | null;
  feature: string | null;
  runId: string | null;
}

export interface ConsoleRun {
  active: boolean;
  phase: string | null;
  feature: string | null;
  runId: string | null;
}

export interface ConsoleState {
  ts: string;
  engine: ConsoleEngine | null;
  optimalNext: string;
  decisions: ConsoleDecision[];
  watchQueueDepth: number;
  repos: Record<string, ConsoleRepo>;
  runs: Record<string, ConsoleRun>;
}
