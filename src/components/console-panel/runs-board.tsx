import type { ConsoleEngine, ConsoleRun } from "@/lib/console/types";

const MICRO_LABEL = "text-[11px] uppercase tracking-[0.08em] text-[#EAEAEA]/60";
const ACTIVE_TEXT = "text-sm [text-shadow:0_0_6px_rgba(234,234,234,0.22)]";
const INACTIVE_TEXT = "text-sm text-[#EAEAEA]/40";

interface RunsBoardProps {
  runs: Record<string, ConsoleRun>;
  engine: ConsoleEngine | null;
}

export function RunsBoard({ runs, engine }: RunsBoardProps) {
  const entries = Object.entries(runs).sort(
    ([aliasA, a], [aliasB, b]) => Number(b.active) - Number(a.active) || aliasA.localeCompare(aliasB),
  );

  return (
    <>
      <span className={MICRO_LABEL}>[ RUNS ]</span>
      <div className="mt-2 flex flex-col gap-1">
        {entries.length === 0 ? (
          <div className={ACTIVE_TEXT}>
            {engine
              ? `${(engine.phase ?? "—").toUpperCase()} :: ${engine.repo ?? "—"}/${engine.feature ?? "—"}${
                  engine.runId ? ` :: ${engine.runId}` : ""
                }`
              : "—"}
          </div>
        ) : (
          entries.map(([alias, run]) => (
            <div key={alias} className={run.active ? ACTIVE_TEXT : INACTIVE_TEXT}>
              {`${alias.toUpperCase()} :: ${(run.phase ?? "—").toUpperCase()} :: ${run.feature ?? "—"}${
                run.runId ? ` :: ${run.runId}` : ""
              }`}
            </div>
          ))
        )}
      </div>
    </>
  );
}
