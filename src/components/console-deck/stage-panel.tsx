import type { StageNode } from "@/lib/journal/types";
import { formatClock, stageClocks } from "@/lib/run-clock/run-clock";
import { MICRO_LABEL } from "@/components/console-deck/crt";

interface StagePanelProps {
  stages: StageNode[];
  totalMs: number;
  live: boolean;
}

type StageStatus = "running" | "done" | "failed";

function stageStatus(stage: StageNode): StageStatus {
  if (stage.legs.some((leg) => leg.status === "running")) return "running";
  if (stage.legs.some((leg) => leg.status === "failed")) return "failed";
  return "done";
}

const DOT_CLASSES: Record<StageStatus, string> = {
  running: "bg-emerald-400 animate-pulse",
  done: "bg-[#EAEAEA]/40",
  failed: "bg-[#E61919]",
};

const CLOCK_GLOW = "text-emerald-400 [text-shadow:0_0_8px_rgba(52,211,153,0.6)]";
const CLOCK_DIM = "text-[#EAEAEA]/40";

export function StagePanel({ stages, totalMs, live }: StagePanelProps) {
  const clocks = stageClocks(stages, totalMs);

  return (
    <div className="flex flex-col gap-3" data-live={live}>
      <div className="flex items-center justify-between">
        <span className={MICRO_LABEL}>[ STAGES ]</span>
        <span
          data-testid="stage-panel-total-clock"
          className={`font-mono text-sm tabular-nums ${CLOCK_GLOW}`}
        >
          {formatClock(totalMs)}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {stages.map((stage) => {
          const status = stageStatus(stage);
          const clock = clocks.get(stage.key) ?? { ms: 0, ticking: false };
          const failedLegs = stage.legs.filter(
            (leg) => leg.status === "failed" && leg.error
          );

          return (
            <div key={stage.key} className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className={`size-2 shrink-0 rounded-full ${DOT_CLASSES[status]}`}
                />
                <span className="flex-1 truncate font-mono text-sm text-[#EAEAEA]">
                  {stage.title}
                </span>
                <span className={MICRO_LABEL}>
                  {stage.legs.length} LEG{stage.legs.length === 1 ? "" : "S"}
                </span>
                <span
                  data-testid={`stage-panel-clock-${stage.key}`}
                  className={`shrink-0 font-mono text-sm tabular-nums ${
                    clock.ticking ? CLOCK_GLOW : CLOCK_DIM
                  }`}
                >
                  {formatClock(clock.ms)}
                </span>
              </div>
              {failedLegs.map((leg) => (
                <p key={leg.label} className="pl-4 text-xs text-[#E61919]">
                  {leg.error}
                </p>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
