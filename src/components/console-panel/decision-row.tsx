import type { ConsoleDecision } from "@/lib/console/types";

interface DecisionRowProps {
  decision: ConsoleDecision;
  nowMs: number;
}

function fmtDuration(ms: number): string {
  const totalSeconds = Math.floor(Math.max(0, ms) / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

export function DecisionRow({ decision, nowMs }: DecisionRowProps) {
  const isAlert =
    decision.kind === "halt" ||
    (decision.kind === "verdict" && !decision.recommendation.startsWith("Merge"));

  const ageMs = nowMs - Date.parse(decision.ts);
  const ttlMs = Date.parse(decision.expiresAt) - nowMs;

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.08em]">
          <span className={isAlert ? "text-[#E61919]" : "text-[#EAEAEA]/60"}>
            {decision.kind.toUpperCase()}
          </span>
          <span className="text-[#EAEAEA]/60">
            {decision.repo ?? "—"} :: {decision.feature ?? "—"}
            {decision.runId ? ` :: ${decision.runId}` : ""}
          </span>
        </div>
        <div className="text-sm [text-shadow:0_0_6px_rgba(234,234,234,0.22)]">
          {decision.title}
        </div>
        <div className="text-sm [text-shadow:0_0_6px_rgba(234,234,234,0.3)]">
          {decision.recommendation}
        </div>
      </div>
      <div className="flex flex-col items-end gap-1 text-right font-mono text-[11px] text-[#EAEAEA]/60">
        <span>AGE {fmtDuration(ageMs)}</span>
        <span>TTL {fmtDuration(ttlMs)}</span>
      </div>
    </div>
  );
}
