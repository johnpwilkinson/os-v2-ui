import { describe, expect, test } from "vitest";
import { parseRunIdStart, formatClock, stageClocks } from "./run-clock";
import type { StageNode } from "@/lib/journal/types";

describe("parseRunIdStart", () => {
  test("[req:7.1][req:11.1] parses a YYYYMMDDTHHMMSSmmm runId as a local-time epoch", () => {
    const start = parseRunIdStart("20260719T180530657");
    expect(start).toBe(new Date(2026, 6, 19, 18, 5, 30, 657).getTime());
  });

  test("[req:7.1][req:11.1] returns null for a runId that does not match the shape", () => {
    expect(parseRunIdStart("not-a-run-id")).toBeNull();
  });

  test("[req:7.1][req:11.1] returns null for a runId missing the millisecond digits", () => {
    expect(parseRunIdStart("20260719T180530")).toBeNull();
  });
});

describe("formatClock", () => {
  test("[req:11.1] clamps negative ms to 0:00", () => {
    expect(formatClock(-500)).toBe("0:00");
  });

  test("[req:11.1] renders m:ss below one hour", () => {
    expect(formatClock(90000)).toBe("1:30");
  });

  test("[req:11.1] renders h:mm:ss at or above one hour", () => {
    expect(formatClock(3661000)).toBe("1:01:01");
  });
});

function leg(status: "running" | "done" | "failed", ms?: number) {
  return { label: "leg", status, ms };
}

describe("stageClocks", () => {
  test("[req:7.4][req:11.1] sums a stage's done/failed legs' ms when nothing is running", () => {
    const stages: StageNode[] = [
      { key: "impl", title: "Implement", legs: [leg("done", 1000), leg("failed", 500)] },
      { key: "val", title: "Validate", legs: [leg("done", 2000)] },
    ];
    const result = stageClocks(stages, 10000);
    expect(result.get("impl")).toEqual({ ms: 1500, ticking: false });
    expect(result.get("val")).toEqual({ ms: 2000, ticking: false });
  });

  test("[req:7.6][req:11.1] counts a completed leg with no ms value as zero, not NaN", () => {
    const stages: StageNode[] = [
      { key: "impl", title: "Implement", legs: [leg("done"), leg("failed", 500)] },
    ];
    const result = stageClocks(stages, 1000);
    expect(result.get("impl")).toEqual({ ms: 500, ticking: false });
  });

  test("[req:7.5][req:11.1] ticks the stage owning the most recently opened running leg", () => {
    const stages: StageNode[] = [
      { key: "impl", title: "Implement", legs: [leg("done", 1000)] },
      { key: "val", title: "Validate", legs: [leg("done", 500), leg("running")] },
    ];
    // total completed ms across all stages = 1000 + 500 = 1500
    // ticking stage "val" gets its own completed (500) + max(0, totalElapsed - 1500)
    const result = stageClocks(stages, 4000);
    expect(result.get("impl")).toEqual({ ms: 1000, ticking: false });
    expect(result.get("val")).toEqual({ ms: 500 + (4000 - 1500), ticking: true });
  });

  test("[req:7.5][req:11.1] attributes ticking to the last running leg in stage-then-leg order", () => {
    const stages: StageNode[] = [
      { key: "a", title: "A", legs: [leg("running")] },
      { key: "b", title: "B", legs: [leg("done", 100), leg("running")] },
    ];
    const result = stageClocks(stages, 5000);
    expect(result.get("a")).toEqual({ ms: 0, ticking: false });
    expect(result.get("b")?.ticking).toBe(true);
  });

  test("[req:11.1] returns ticking false everywhere when no leg is running", () => {
    const stages: StageNode[] = [{ key: "impl", title: "Implement", legs: [leg("done", 100)] }];
    const result = stageClocks(stages, 5000);
    expect(result.get("impl")).toEqual({ ms: 100, ticking: false });
  });
});
