import { z } from "zod";
import type { JournalLine } from "./types";

const batterySchema = z
  .object({
    kind: z.literal("battery"),
    label: z.string(),
    start: z.boolean().optional(),
    ok: z.boolean().optional(),
    exitCode: z.number().optional(),
    ms: z.number().optional(),
  })
  .loose();

const legStartSchema = z
  .object({
    label: z.string(),
    phase: z.literal("start"),
    kind: z.string().optional(),
  })
  .loose();

const legCompleteSchema = z
  .object({
    label: z.string(),
    ok: z.boolean(),
    kind: z.string().optional(),
    tokens: z.number().optional(),
    ms: z.number().optional(),
    error: z.string().optional(),
  })
  .loose();

const logSchema = z
  .object({
    log: z.string(),
  })
  .loose();

function tryParseEvt(remainder: string): { evtType: string; payload: Record<string, unknown> } | null {
  let inner: unknown;
  try {
    inner = JSON.parse(remainder);
  } catch {
    return null;
  }
  if (inner === null || typeof inner !== "object" || Array.isArray(inner)) {
    return null;
  }
  const payload = inner as Record<string, unknown>;
  const evtType = typeof payload.type === "string" ? payload.type : "";
  return { evtType, payload };
}

export function classifyLine(raw: string): JournalLine {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { kind: "unknown", raw };
  }

  const battery = batterySchema.safeParse(parsed);
  if (battery.success) {
    const { label, start, ok, exitCode, ms } = battery.data;
    return { kind: "battery", label, start, ok, exitCode, ms, raw };
  }

  const legStart = legStartSchema.safeParse(parsed);
  if (legStart.success) {
    return {
      kind: "leg-start",
      label: legStart.data.label,
      legKind: legStart.data.kind ?? "",
      raw,
    };
  }

  const legComplete = legCompleteSchema.safeParse(parsed);
  if (legComplete.success) {
    const { label, kind, ok, tokens, ms, error } = legComplete.data;
    return {
      kind: "leg-complete",
      label,
      legKind: kind ?? "",
      ok,
      tokens,
      ms,
      error,
      raw,
    };
  }

  const log = logSchema.safeParse(parsed);
  if (log.success) {
    const text = log.data.log;
    if (text.startsWith("EVT ")) {
      const evt = tryParseEvt(text.slice("EVT ".length));
      if (evt) {
        return { kind: "evt", evtType: evt.evtType, payload: evt.payload, raw };
      }
    }
    return { kind: "log", text, raw };
  }

  return { kind: "unknown", raw };
}

export function parseJournal(text: string): JournalLine[] {
  return text
    .split("\n")
    .filter((line) => line.length > 0)
    .map((line) => classifyLine(line));
}
