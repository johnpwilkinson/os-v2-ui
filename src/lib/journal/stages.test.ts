import { describe, expect, test } from "vitest";
import { groupStages } from "./stages";
import type { JournalLine } from "./types";

function legStart(label: string, legKind = ""): JournalLine {
  return { kind: "leg-start", label, legKind, raw: "" };
}

function legComplete(
  label: string,
  ok: boolean,
  extra: Partial<{ tokens: number; ms: number; error: string }> = {}
): JournalLine {
  return { kind: "leg-complete", label, legKind: "", ok, raw: "", ...extra };
}

const KNOWN_TITLES: Record<string, string> = {
  impl: "Implement",
  debug: "Debug",
  val: "Validate",
  refute: "Refute",
  vfix: "Validate-fix",
  mech: "Battery",
  setup: "Setup",
  finalize: "Finalize",
  merge: "Merge",
  note: "Notes",
  enforce: "Enforce",
  gate: "Gate",
  prsurface: "PR surface",
};

describe("groupStages", () => {
  test("preserves first-seen stage order across interleaved labels [req:9.3]", () => {
    const lines: JournalLine[] = [
      legStart("impl:1.1"),
      legStart("val:9.1"),
      legStart("impl:1.2"),
      legStart("debug:2.1"),
    ];

    const stages = groupStages(lines);

    expect(stages.map((s) => s.key)).toEqual(["impl", "val", "debug"]);
  });

  test("preserves first-seen leg order within a stage [req:9.3]", () => {
    const lines: JournalLine[] = [legStart("impl:1.2"), legStart("impl:1.1")];

    const stages = groupStages(lines);

    expect(stages[0].legs.map((leg) => leg.label)).toEqual(["impl:1.2", "impl:1.1"]);
  });

  test("maps each known prefix to its display title [req:9.3]", () => {
    const lines: JournalLine[] = Object.keys(KNOWN_TITLES).map((key) => legStart(`${key}:1`));

    const stages = groupStages(lines);

    expect(stages).toHaveLength(Object.keys(KNOWN_TITLES).length);
    for (const stage of stages) {
      expect(stage.title).toBe(KNOWN_TITLES[stage.key]);
    }
  });

  test("an unknown prefix produces its own group titled by the raw prefix without error [req:9.3]", () => {
    const lines: JournalLine[] = [legStart("weird:1")];

    expect(() => groupStages(lines)).not.toThrow();

    const stages = groupStages(lines);
    expect(stages).toHaveLength(1);
    expect(stages[0].key).toBe("weird");
    expect(stages[0].title).toBe("weird");
  });

  test("a leg with a start and no matching completion is running [req:9.3]", () => {
    const lines: JournalLine[] = [legStart("val:9.1")];

    const stages = groupStages(lines);

    expect(stages[0].legs[0].status).toBe("running");
  });

  test("a leg whose completion has ok:true is done [req:9.3]", () => {
    const lines: JournalLine[] = [legStart("val:9.1"), legComplete("val:9.1", true, { tokens: 100, ms: 200 })];

    const stages = groupStages(lines);

    expect(stages[0].legs[0].status).toBe("done");
    expect(stages[0].legs[0].tokens).toBe(100);
    expect(stages[0].legs[0].ms).toBe(200);
  });

  test("a leg whose completion has ok:false is failed and carries the error [req:9.3]", () => {
    const lines: JournalLine[] = [
      legStart("debug:3.2"),
      legComplete("debug:3.2", false, { error: "pytest exit 1" }),
    ];

    const stages = groupStages(lines);

    expect(stages[0].legs[0].status).toBe("failed");
    expect(stages[0].legs[0].error).toBe("pytest exit 1");
  });
});
