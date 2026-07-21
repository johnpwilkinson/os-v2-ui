import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { Filmstrip } from "@/components/console-deck/filmstrip";
import type { BusFilterBucket } from "@/components/console-deck/bus-filter";
import { parseRunIdStart } from "@/lib/run-clock/run-clock";
import type { RunListEntry } from "@/server/runs";

const LIVE_RUN_ID = "20260719T180530657";
const HALTED_RUN_ID = "20260719T190000000";
const START = parseRunIdStart(LIVE_RUN_ID)!;

const LIVE_ENTRY: RunListEntry = {
  runId: LIVE_RUN_ID,
  finished: false,
  mtimeMs: START,
  status: "live",
};

const HALTED_ENTRY: RunListEntry = {
  runId: HALTED_RUN_ID,
  finished: true,
  mtimeMs: parseRunIdStart(HALTED_RUN_ID)! + 10_000,
  status: "halted",
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(START);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("Filmstrip", () => {
  it("dims a disabled bucket's tile with opacity-35 while it stays mounted and still calls onTake when clicked [req:4.2] [req:4.4] [req:11.5]", () => {
    const onTake = vi.fn();

    render(
      <Filmstrip
        entries={[LIVE_ENTRY, HALTED_ENTRY]}
        runsByRunId={{}}
        enabled={new Set<BusFilterBucket>(["live", "passed"])}
        selectedRunId={null}
        highlightedRunId={null}
        nowMs={START}
        onTake={onTake}
      />,
    );

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(2);

    const haltedTile = screen.getByText(HALTED_RUN_ID).closest("button")!;
    expect(haltedTile).toHaveClass("opacity-35");
    expect(haltedTile).toBeInTheDocument();

    fireEvent.click(haltedTile);
    expect(onTake).toHaveBeenCalledWith(HALTED_RUN_ID);

    const liveTile = screen.getByText(LIVE_RUN_ID).closest("button")!;
    expect(liveTile).not.toHaveClass("opacity-35");
  });

  it("applies the selected treatment to the tile matching selectedRunId [req:5.5] [req:11.5]", () => {
    render(
      <Filmstrip
        entries={[LIVE_ENTRY, HALTED_ENTRY]}
        runsByRunId={{}}
        enabled={new Set<BusFilterBucket>(["live", "halted", "passed"])}
        selectedRunId={LIVE_RUN_ID}
        highlightedRunId={null}
        nowMs={START}
        onTake={vi.fn()}
      />,
    );

    const selectedTile = screen.getByText(LIVE_RUN_ID).closest("button")!;
    expect(selectedTile).toHaveClass("border-emerald-400");

    const otherTile = screen.getByText(HALTED_RUN_ID).closest("button")!;
    expect(otherTile).not.toHaveClass("border-emerald-400");
  });

  it("passes the matching consoleRun lookup through to enrich the live tile with alias and phase [req:5.4] [req:11.5]", () => {
    render(
      <Filmstrip
        entries={[LIVE_ENTRY, HALTED_ENTRY]}
        runsByRunId={{ [LIVE_RUN_ID]: { alias: "acme-web", phase: "BUILD" } }}
        enabled={new Set<BusFilterBucket>(["live", "halted", "passed"])}
        selectedRunId={null}
        highlightedRunId={null}
        nowMs={START}
        onTake={vi.fn()}
      />,
    );

    expect(screen.getByText("acme-web · BUILD")).toBeInTheDocument();
  });
});
