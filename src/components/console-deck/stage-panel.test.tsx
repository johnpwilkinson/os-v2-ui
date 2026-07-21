import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { StagePanel } from "@/components/console-deck/stage-panel";
import type { StageNode } from "@/lib/journal/types";

function leg(
  status: "running" | "done" | "failed",
  extra: Partial<{ label: string; ms: number; error: string }> = {}
) {
  return { label: extra.label ?? "leg", status, ms: extra.ms, error: extra.error };
}

describe("StagePanel", () => {
  it("renders the total run clock in the header as formatClock(totalMs) and updates it across rerenders while live [req:7.2] [req:11.6]", () => {
    const stages: StageNode[] = [
      { key: "impl", title: "Implement", legs: [leg("running")] },
    ];

    const { rerender } = render(<StagePanel stages={stages} totalMs={5000} live />);
    expect(screen.getByTestId("stage-panel-total-clock")).toHaveTextContent("0:05");

    rerender(<StagePanel stages={stages} totalMs={6000} live />);
    expect(screen.getByTestId("stage-panel-total-clock")).toHaveTextContent("0:06");
  });

  it("renders the header clock frozen at the given totalMs when the run is finished [req:7.3] [req:11.6]", () => {
    const stages: StageNode[] = [
      { key: "impl", title: "Implement", legs: [leg("done", { ms: 1000 })] },
    ];

    render(<StagePanel stages={stages} totalMs={2000} live={false} />);
    expect(screen.getByTestId("stage-panel-total-clock")).toHaveTextContent("0:02");
  });

  it("shows a completed stage's duration as the sum of its done/failed legs' ms values, statically [req:7.4] [req:11.6]", () => {
    const stages: StageNode[] = [
      {
        key: "impl",
        title: "Implement",
        legs: [leg("done", { label: "a", ms: 1000 }), leg("failed", { label: "b", ms: 500 })],
      },
    ];

    render(<StagePanel stages={stages} totalMs={10_000} live={false} />);
    const stageClock = screen.getByTestId("stage-panel-clock-impl");
    expect(stageClock).toHaveTextContent("0:01");
    expect(stageClock).not.toHaveClass("text-emerald-400");
  });

  it("ticks the stage owning the most recently opened running leg as its elapsed grows with totalMs [req:7.5] [req:11.6]", () => {
    const stages: StageNode[] = [
      { key: "impl", title: "Implement", legs: [leg("done", { label: "a", ms: 1000 })] },
      {
        key: "val",
        title: "Validate",
        legs: [leg("done", { label: "b", ms: 500 }), leg("running", { label: "c" })],
      },
    ];

    const { rerender } = render(<StagePanel stages={stages} totalMs={4000} live />);
    // total completed = 1500; val ticks as 500 + max(0, 4000 - 1500) = 3000
    const tickingClock = screen.getByTestId("stage-panel-clock-val");
    expect(tickingClock).toHaveTextContent("0:03");
    expect(tickingClock).toHaveClass("text-emerald-400");
    expect(screen.getByTestId("stage-panel-clock-impl")).toHaveTextContent("0:01");

    rerender(<StagePanel stages={stages} totalMs={5000} live />);
    // val ticks as 500 + max(0, 5000 - 1500) = 4000
    expect(screen.getByTestId("stage-panel-clock-val")).toHaveTextContent("0:04");
  });
});
