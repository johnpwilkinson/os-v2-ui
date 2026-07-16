export type JournalLine =
  | { kind: "leg-start"; label: string; legKind: string; raw: string }
  | {
      kind: "leg-complete";
      label: string;
      legKind: string;
      ok: boolean;
      tokens?: number;
      ms?: number;
      error?: string;
      raw: string;
    }
  | {
      kind: "battery";
      label: string;
      start?: boolean;
      ok?: boolean;
      exitCode?: number;
      ms?: number;
      raw: string;
    }
  | { kind: "evt"; evtType: string; payload: Record<string, unknown>; raw: string }
  | { kind: "log"; text: string; raw: string }
  | { kind: "unknown"; raw: string };

export type LegStatus = "running" | "done" | "failed";

export interface StageLeg {
  label: string;
  status: LegStatus;
  legKind?: string;
  tokens?: number;
  ms?: number;
  error?: string;
  exitCode?: number;
}

export interface StageNode {
  key: string;
  title: string;
  legs: StageLeg[];
}

export interface RunViewModel {
  nowLine: string | null;
  outputTokens: number;
  llmHops: number;
}

export interface NormalizedSummary {
  execCount?: number;
  llmHops?: number;
  turboRuns: number | null;
  gate?: string;
  halt_kind?: string | null;
  error?: string;
  live_output_tokens?: number;
  live_input_tokens?: number;
}
