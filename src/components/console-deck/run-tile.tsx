import { formatDistanceToNowStrict } from "date-fns";
import { cn } from "@/lib/utils";
import { formatClock, parseRunIdStart } from "@/lib/run-clock/run-clock";
import { STATUS_LED, STATUS_TEXT } from "@/components/console-deck/crt";
import type { RunListEntry } from "@/server/runs";

interface RunTileConsoleRun {
  alias: string;
  phase: string | null;
}

interface RunTileProps {
  entry: RunListEntry;
  consoleRun?: RunTileConsoleRun | null;
  selected: boolean;
  highlighted: boolean;
  dimmed: boolean;
  nowMs: number;
  onTake: (runId: string) => void;
}

const SELECTED_TREATMENT = "border-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.6)]";
const HIGHLIGHTED_TREATMENT = "border-[#EAEAEA]/70";
const BASE_TREATMENT = "border-[#EAEAEA]/20";

export function RunTile({
  entry,
  consoleRun,
  selected,
  highlighted,
  dimmed,
  nowMs,
  onTake,
}: RunTileProps) {
  const start = parseRunIdStart(entry.runId);
  const clock =
    start === null
      ? null
      : entry.status === "live"
        ? formatClock(nowMs - start)
        : formatClock(entry.mtimeMs - start);

  return (
    <button
      type="button"
      onClick={() => onTake(entry.runId)}
      className={cn(
        "flex min-w-[160px] shrink-0 flex-col gap-1 border bg-[#0A0A0A] p-3 text-left transition-opacity",
        selected ? SELECTED_TREATMENT : highlighted ? HIGHLIGHTED_TREATMENT : BASE_TREATMENT,
        dimmed && "opacity-35",
      )}
    >
      <div className="flex items-center gap-2">
        <span className={cn("inline-block size-2 shrink-0 rounded-full", STATUS_LED[entry.status])} />
        <span className={cn("truncate text-sm", STATUS_TEXT[entry.status])}>{entry.runId}</span>
      </div>
      <div className="text-[11px] text-[#EAEAEA]/60">
        {formatDistanceToNowStrict(entry.mtimeMs, { addSuffix: true })}
      </div>
      {clock !== null && <div className="text-[11px] tabular-nums text-[#EAEAEA]/80">{clock}</div>}
      {entry.status !== "live" && entry.outputTokens !== undefined && (
        <div className="text-[11px] text-[#EAEAEA]/60">{entry.outputTokens} TOK</div>
      )}
      {entry.status === "live" && consoleRun && (
        <div className="text-[11px] text-[#EAEAEA]/60">
          {consoleRun.alias} · {consoleRun.phase ?? "—"}
        </div>
      )}
    </button>
  );
}
