import type { StageNode } from "@/lib/journal/types";

const RUN_ID_SHAPE = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(\d{3})$/;

export function parseRunIdStart(runId: string): number | null {
  const match = RUN_ID_SHAPE.exec(runId);
  if (!match) return null;
  const [, y, mo, d, hh, mm, ss, ms] = match;
  return new Date(
    Number(y),
    Number(mo) - 1,
    Number(d),
    Number(hh),
    Number(mm),
    Number(ss),
    Number(ms)
  ).getTime();
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function formatClock(ms: number): string {
  const clamped = Math.max(0, ms);
  const totalSeconds = Math.floor(clamped / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours >= 1) {
    return `${hours}:${pad2(minutes)}:${pad2(seconds)}`;
  }
  return `${minutes}:${pad2(seconds)}`;
}

export function stageClocks(
  stages: StageNode[],
  totalElapsedMs: number
): Map<string, { ms: number; ticking: boolean }> {
  let tickingStageKey: string | null = null;
  for (const stage of stages) {
    for (const leg of stage.legs) {
      if (leg.status === "running") {
        tickingStageKey = stage.key;
      }
    }
  }

  const completedByStage = new Map<string, number>();
  let totalCompletedMs = 0;
  for (const stage of stages) {
    let sum = 0;
    for (const leg of stage.legs) {
      if (leg.status === "done" || leg.status === "failed") {
        sum += leg.ms ?? 0;
      }
    }
    completedByStage.set(stage.key, sum);
    totalCompletedMs += sum;
  }

  const result = new Map<string, { ms: number; ticking: boolean }>();
  for (const stage of stages) {
    const completed = completedByStage.get(stage.key) ?? 0;
    if (stage.key === tickingStageKey) {
      const remainder = Math.max(0, totalElapsedMs - totalCompletedMs);
      result.set(stage.key, { ms: completed + remainder, ticking: true });
    } else {
      result.set(stage.key, { ms: completed, ticking: false });
    }
  }
  return result;
}
