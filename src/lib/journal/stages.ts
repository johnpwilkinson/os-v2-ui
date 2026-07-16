import type { JournalLine, StageLeg, StageNode } from "./types";

const STAGE_TITLES: Record<string, string> = {
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

function stageKey(label: string): string {
  const idx = label.indexOf(":");
  return idx === -1 ? label : label.slice(0, idx);
}

export function groupStages(lines: JournalLine[]): StageNode[] {
  const stageOrder: string[] = [];
  const legOrders = new Map<string, string[]>();
  const legsByStage = new Map<string, Map<string, StageLeg>>();

  function stageFor(key: string): { legOrder: string[]; legs: Map<string, StageLeg> } {
    let legs = legsByStage.get(key);
    let legOrder = legOrders.get(key);
    if (!legs || !legOrder) {
      legs = new Map();
      legOrder = [];
      legsByStage.set(key, legs);
      legOrders.set(key, legOrder);
      stageOrder.push(key);
    }
    return { legOrder, legs };
  }

  for (const line of lines) {
    if (line.kind === "leg-start") {
      const key = stageKey(line.label);
      const { legOrder, legs } = stageFor(key);
      if (!legs.has(line.label)) legOrder.push(line.label);
      legs.set(line.label, {
        label: line.label,
        status: "running",
        legKind: line.legKind,
      });
    } else if (line.kind === "leg-complete") {
      const key = stageKey(line.label);
      const { legOrder, legs } = stageFor(key);
      if (!legs.has(line.label)) legOrder.push(line.label);
      legs.set(line.label, {
        label: line.label,
        status: line.ok ? "done" : "failed",
        legKind: line.legKind,
        tokens: line.tokens,
        ms: line.ms,
        error: line.ok ? undefined : line.error,
      });
    } else if (line.kind === "battery") {
      const key = stageKey(line.label);
      const { legOrder, legs } = stageFor(key);
      if (!legs.has(line.label)) legOrder.push(line.label);
      if (line.start) {
        legs.set(line.label, {
          label: line.label,
          status: "running",
        });
      } else {
        legs.set(line.label, {
          label: line.label,
          status: line.ok ? "done" : "failed",
          ms: line.ms,
          exitCode: line.exitCode,
        });
      }
    }
  }

  return stageOrder.map((key) => {
    const legOrder = legOrders.get(key)!;
    const legs = legsByStage.get(key)!;
    return {
      key,
      title: STAGE_TITLES[key] ?? key,
      legs: legOrder.map((label) => legs.get(label)!),
    };
  });
}
