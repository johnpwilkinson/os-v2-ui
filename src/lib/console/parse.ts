import type { ConsoleDecision, ConsoleEngine, ConsoleRepo, ConsoleState } from "./types";

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function parseDecision(raw: unknown): ConsoleDecision | null {
  if (!isPlainObject(raw)) return null;
  if (
    typeof raw.id !== "string" ||
    typeof raw.kind !== "string" ||
    typeof raw.title !== "string" ||
    typeof raw.recommendation !== "string" ||
    typeof raw.ts !== "string" ||
    typeof raw.expiresAt !== "string"
  ) {
    return null;
  }
  return {
    id: raw.id,
    kind: raw.kind,
    repo: typeof raw.repo === "string" ? raw.repo : null,
    feature: typeof raw.feature === "string" ? raw.feature : null,
    runId: typeof raw.runId === "string" ? raw.runId : null,
    title: raw.title,
    recommendation: raw.recommendation,
    ts: raw.ts,
    expiresAt: raw.expiresAt,
  };
}

function parseRepo(raw: unknown): ConsoleRepo {
  if (!isPlainObject(raw)) {
    return { class: null, watched: false, driver: false };
  }
  return {
    class: typeof raw.class === "string" ? raw.class : null,
    watched: Boolean(raw.watched) || Boolean(raw.watch),
    driver: Boolean(raw.driver),
  };
}

function parseEngine(raw: unknown): ConsoleEngine | null {
  if (!isPlainObject(raw)) return null;
  return {
    active: Boolean(raw.active),
    phase: typeof raw.phase === "string" ? raw.phase : null,
    repo: typeof raw.repo === "string" ? raw.repo : null,
    feature: typeof raw.feature === "string" ? raw.feature : null,
    runId: typeof raw.runId === "string" ? raw.runId : null,
  };
}

export function parseConsoleState(raw: unknown): ConsoleState | null {
  if (!isPlainObject(raw)) return null;
  if (typeof raw.ts !== "string") return null;
  if (typeof raw.optimalNext !== "string") return null;
  if (!Array.isArray(raw.decisions)) return null;
  if (!isPlainObject(raw.repos)) return null;

  const decisions = raw.decisions
    .map((entry) => parseDecision(entry))
    .filter((decision): decision is ConsoleDecision => decision !== null);

  const repos: Record<string, ConsoleRepo> = {};
  for (const [alias, value] of Object.entries(raw.repos)) {
    repos[alias] = parseRepo(value);
  }

  return {
    ts: raw.ts,
    engine: parseEngine(raw.engine),
    optimalNext: raw.optimalNext,
    decisions,
    watchQueueDepth: Number(raw.watchQueueDepth) || 0,
    repos,
  };
}
