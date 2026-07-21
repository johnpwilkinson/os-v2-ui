import { RunTile } from "@/components/console-deck/run-tile";
import type { BusFilterBucket } from "@/components/console-deck/bus-filter";
import type { RunListEntry } from "@/server/runs";

interface FilmstripConsoleRun {
  alias: string;
  phase: string | null;
}

interface FilmstripProps {
  entries: RunListEntry[];
  runsByRunId: Record<string, FilmstripConsoleRun | undefined>;
  enabled: Set<BusFilterBucket>;
  selectedRunId: string | null;
  highlightedRunId: string | null;
  nowMs: number;
  onTake: (runId: string) => void;
}

export function Filmstrip({
  entries,
  runsByRunId,
  enabled,
  selectedRunId,
  highlightedRunId,
  nowMs,
  onTake,
}: FilmstripProps) {
  return (
    <div className="flex flex-row gap-2 overflow-x-auto">
      {entries.map((entry) => (
        <RunTile
          key={entry.runId}
          entry={entry}
          consoleRun={runsByRunId[entry.runId] ?? null}
          selected={entry.runId === selectedRunId}
          highlighted={entry.runId === highlightedRunId}
          dimmed={!enabled.has(entry.status)}
          nowMs={nowMs}
          onTake={onTake}
        />
      ))}
    </div>
  );
}
