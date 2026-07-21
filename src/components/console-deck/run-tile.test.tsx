import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { RunTile } from "@/components/console-deck/run-tile";
import { parseRunIdStart } from "@/lib/run-clock/run-clock";
import type { RunListEntry } from "@/server/runs";

const RUN_ID = "20260719T180530657";
const START = parseRunIdStart(RUN_ID)!;

function entry(overrides: Partial<RunListEntry> = {}): RunListEntry {
  return {
    runId: RUN_ID,
    finished: false,
    mtimeMs: START,
    status: "live",
    ...overrides,
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(START);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("RunTile", () => {
  it("ticks the live tile clock string as nowMs advances [req:5.3] [req:11.5]", () => {
    const { rerender } = render(
      <RunTile
        entry={entry({ status: "live" })}
        selected={false}
        highlighted={false}
        dimmed={false}
        nowMs={START + 5_000}
        onTake={vi.fn()}
      />,
    );

    expect(screen.getByText("0:05")).toBeInTheDocument();

    rerender(
      <RunTile
        entry={entry({ status: "live" })}
        selected={false}
        highlighted={false}
        dimmed={false}
        nowMs={START + 65_000}
        onTake={vi.fn()}
      />,
    );

    expect(screen.queryByText("0:05")).not.toBeInTheDocument();
    expect(screen.getByText("1:05")).toBeInTheDocument();
  });

  it("freezes a finished tile's clock at mtime minus start regardless of nowMs [req:5.2] [req:11.5]", () => {
    const finished = entry({ status: "passed", finished: true, mtimeMs: START + 90_000 });

    const { rerender } = render(
      <RunTile
        entry={finished}
        selected={false}
        highlighted={false}
        dimmed={false}
        nowMs={START + 90_000}
        onTake={vi.fn()}
      />,
    );

    expect(screen.getByText("1:30")).toBeInTheDocument();

    rerender(
      <RunTile
        entry={finished}
        selected={false}
        highlighted={false}
        dimmed={false}
        nowMs={START + 500_000}
        onTake={vi.fn()}
      />,
    );

    expect(screen.getByText("1:30")).toBeInTheDocument();
  });

  it("renders no clock element for a runId that does not parse as a timestamp [req:5.6] [req:11.5]", () => {
    render(
      <RunTile
        entry={entry({ runId: "not-a-timestamp-run", status: "live" })}
        selected={false}
        highlighted={false}
        dimmed={false}
        nowMs={START + 5_000}
        onTake={vi.fn()}
      />,
    );

    expect(screen.getByText("not-a-timestamp-run")).toBeInTheDocument();
    expect(screen.queryByText(/^\d{1,2}:\d{2}(:\d{2})?$/)).not.toBeInTheDocument();
  });

  it("applies the halted status treatment classes [req:5.1] [req:11.5]", () => {
    render(
      <RunTile
        entry={entry({ status: "halted", finished: true })}
        selected={false}
        highlighted={false}
        dimmed={false}
        nowMs={START}
        onTake={vi.fn()}
      />,
    );

    const runIdEl = screen.getByText(RUN_ID);
    expect(runIdEl).toHaveClass("text-[#E61919]");

    const led = runIdEl.parentElement?.firstElementChild;
    expect(led).toHaveClass("bg-[#E61919]");
    expect(led).toHaveClass("animate-pulse");
  });

  it("applies the passed status treatment classes [req:5.1] [req:11.5]", () => {
    render(
      <RunTile
        entry={entry({ status: "passed", finished: true })}
        selected={false}
        highlighted={false}
        dimmed={false}
        nowMs={START}
        onTake={vi.fn()}
      />,
    );

    const runIdEl = screen.getByText(RUN_ID);
    expect(runIdEl).toHaveClass("text-[#EAEAEA]/40");

    const led = runIdEl.parentElement?.firstElementChild;
    expect(led).toHaveClass("bg-[#EAEAEA]/40");
    expect(led).not.toHaveClass("animate-pulse");
  });

  it("renders the repo alias and phase on a live tile when a matching consoleRun is passed [req:5.4] [req:11.5]", () => {
    render(
      <RunTile
        entry={entry({ status: "live" })}
        consoleRun={{ alias: "acme-web", phase: "BUILD" }}
        selected={false}
        highlighted={false}
        dimmed={false}
        nowMs={START}
        onTake={vi.fn()}
      />,
    );

    expect(screen.getByText("acme-web · BUILD")).toBeInTheDocument();
  });

  it("does not render alias and phase on a finished tile even when consoleRun is passed [req:5.4] [req:11.5]", () => {
    render(
      <RunTile
        entry={entry({ status: "passed", finished: true })}
        consoleRun={{ alias: "acme-web", phase: "BUILD" }}
        selected={false}
        highlighted={false}
        dimmed={false}
        nowMs={START}
        onTake={vi.fn()}
      />,
    );

    expect(screen.queryByText("acme-web · BUILD")).not.toBeInTheDocument();
  });

  it("applies the selected treatment when selected is true [req:5.5] [req:11.5]", () => {
    render(
      <RunTile
        entry={entry({ status: "live" })}
        selected
        highlighted={false}
        dimmed={false}
        nowMs={START}
        onTake={vi.fn()}
      />,
    );

    const tile = screen.getByRole("button");
    expect(tile).toHaveClass("border-emerald-400");
    expect(tile).toHaveClass("shadow-[0_0_10px_rgba(52,211,153,0.6)]");
  });

  it("carries opacity-35 while dimmed, stays mounted, and still calls onTake on click [req:4.2] [req:4.4] [req:11.5]", () => {
    const onTake = vi.fn();

    render(
      <RunTile
        entry={entry({ status: "live" })}
        selected={false}
        highlighted={false}
        dimmed
        nowMs={START}
        onTake={onTake}
      />,
    );

    const tile = screen.getByRole("button");
    expect(tile).toHaveClass("opacity-35");
    expect(tile).toBeInTheDocument();

    fireEvent.click(tile);
    expect(onTake).toHaveBeenCalledWith(RUN_ID);
  });
});
