import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import { parseRunIdStart } from "@/lib/run-clock/run-clock";
import type { RunJournalLine } from "@/lib/journal/types";

const RUN_ID = "20260719T180530657";
const START = parseRunIdStart(RUN_ID)!;
const STALL_AFTER_MS = 10 * 60_000;

beforeEach(() => {
  Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
    configurable: true,
    value: 600,
  });
  Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
    configurable: true,
    value: 600,
  });
  window.HTMLElement.prototype.scrollTo = vi.fn();
});

afterEach(() => {
  vi.restoreAllMocks();
});

const { getQuery, subscriptionSpy } = vi.hoisted(() => ({
  getQuery: vi.fn(),
  subscriptionSpy: vi.fn(),
}));

vi.mock("@/components/console-deck/trpc", () => ({
  trpc: {
    runs: {
      get: { useQuery: () => getQuery() },
      journalTail: {
        useSubscription: (input: unknown, options: unknown) => subscriptionSpy(input, options),
      },
    },
  },
}));

import { ProgramMonitor } from "@/components/console-deck/program-monitor";

function meterValue(label: string): string | null {
  return screen.getByText(label).nextElementSibling?.textContent ?? null;
}

describe("ProgramMonitor", () => {
  it("renders the MERGED emerald treatment with the post-colon feature name for a finished summary [req:11.8]", () => {
    getQuery.mockReturnValue({
      data: {
        ok: true,
        lines: [],
        lineCount: 0,
        finished: true,
        summary: { gate: "MERGED:acme-web", turboRuns: null },
        engineState: null,
        repoUrl: null,
        mtimeMs: START,
      },
    });

    render(<ProgramMonitor runId={RUN_ID} isNewestRun={false} nowMs={START} />);

    const status = screen.getByTestId("program-monitor-status");
    expect(status).toHaveTextContent("MERGED");
    expect(status).toHaveTextContent("acme-web");
    expect(status).toHaveClass("text-emerald-400");
  });

  it("renders HALTED with the halt_kind and gate-or-error detail for a haltKind summary [req:11.8]", () => {
    getQuery.mockReturnValue({
      data: {
        ok: true,
        lines: [],
        lineCount: 0,
        finished: true,
        summary: { halt_kind: "timeout", error: "boom", turboRuns: null },
        engineState: null,
        repoUrl: null,
        mtimeMs: START,
      },
    });

    render(<ProgramMonitor runId={RUN_ID} isNewestRun={false} nowMs={START} />);

    const status = screen.getByTestId("program-monitor-status");
    expect(status).toHaveTextContent("HALTED");
    expect(status).toHaveTextContent("timeout");
    expect(status).toHaveTextContent("boom");
  });

  it("renders the pulsing LIVE treatment and derived meter values with EXEC as an em dash for an unfinished fresh-mtime snapshot [req:11.8]", () => {
    const lines: RunJournalLine[] = [
      { kind: "leg-start", label: "impl", legKind: "llm", raw: "" },
      { kind: "leg-complete", label: "impl", legKind: "llm", ok: true, tokens: 42, raw: "" },
    ];

    getQuery.mockReturnValue({
      data: {
        ok: true,
        lines,
        lineCount: lines.length,
        finished: false,
        summary: undefined,
        engineState: { phase: "running" },
        repoUrl: null,
        mtimeMs: START,
      },
    });

    render(<ProgramMonitor runId={RUN_ID} isNewestRun nowMs={START + 1_000} />);

    const status = screen.getByTestId("program-monitor-status");
    expect(status).toHaveTextContent("LIVE");
    expect(status.querySelector('[class*="animate-pulse"]')).not.toBeNull();

    expect(meterValue("EXEC")).toBe("—");
    expect(meterValue("LLM HOPS")).toBe("1");
    expect(meterValue("OUT TOKENS")).toBe("42");
  });

  it("renders STALLED for an unfinished stale-mtime snapshot [req:11.8]", () => {
    getQuery.mockReturnValue({
      data: {
        ok: true,
        lines: [],
        lineCount: 0,
        finished: false,
        summary: undefined,
        engineState: { phase: "running" },
        repoUrl: null,
        mtimeMs: START,
      },
    });

    render(
      <ProgramMonitor runId={RUN_ID} isNewestRun nowMs={START + STALL_AFTER_MS + 1_000} />,
    );

    const status = screen.getByTestId("program-monitor-status");
    expect(status).toHaveTextContent("STALLED");
  });

  it("renders the no-run-found state for a not-ok snapshot [req:11.8]", () => {
    getQuery.mockReturnValue({ data: { ok: false } });

    render(<ProgramMonitor runId={RUN_ID} isNewestRun={false} nowMs={START} />);

    expect(screen.getByTestId("program-monitor-no-run")).toHaveTextContent(
      `NO RUN FOUND FOR "${RUN_ID}"`,
    );
  });

  it("renders meter values from the summary for a finished snapshot [req:11.8]", () => {
    getQuery.mockReturnValue({
      data: {
        ok: true,
        lines: [],
        lineCount: 0,
        finished: true,
        summary: {
          gate: "SOME_GATE",
          execCount: 12,
          llmHops: 7,
          live_output_tokens: 4321,
          turboRuns: null,
        },
        engineState: null,
        repoUrl: null,
        mtimeMs: START,
      },
    });

    render(<ProgramMonitor runId={RUN_ID} isNewestRun={false} nowMs={START} />);

    expect(meterValue("GATE")).toBe("SOME_GATE");
    expect(meterValue("EXEC")).toBe("12");
    expect(meterValue("LLM HOPS")).toBe("7");
    expect(meterValue("OUT TOKENS")).toBe("4321");
  });
});
