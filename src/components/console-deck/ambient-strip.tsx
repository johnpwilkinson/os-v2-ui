import type { ConsoleDecision, ConsoleState } from "@/lib/console/types";
import { MICRO_LABEL, PRIMARY_TEXT } from "@/components/console-deck/crt";

interface AmbientStripProps {
  state: ConsoleState | null;
  error: string | null;
  nowMs: number;
}

function isAlertKind(decision: ConsoleDecision): boolean {
  return (
    decision.kind === "halt" ||
    (decision.kind === "verdict" && !decision.recommendation.startsWith("Merge"))
  );
}

function formatTtl(ms: number): string {
  const totalSeconds = Math.floor(Math.max(0, ms) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(minutes)}:${pad(seconds)}`;
}

const CELL = "bg-[#0A0A0A] p-4";

export function AmbientStrip({ state, error, nowMs }: AmbientStripProps) {
  const watched = state ? Object.values(state.repos).filter((repo) => repo.watched).length : 0;
  const drivers = state ? Object.values(state.repos).filter((repo) => repo.driver).length : 0;

  return (
    <div className="grid gap-px bg-[#EAEAEA]/20 md:grid-cols-4">
      <div className={CELL}>
        <span className="text-lg font-bold uppercase tracking-[-0.02em] [text-shadow:0_0_8px_rgba(234,234,234,0.25)]">
          CONSOLE
        </span>
      </div>

      {error !== null ? (
        <div className={`${CELL} border border-[#E61919] text-[#E61919] md:col-span-3`}>
          <span className="flex items-center gap-2">
            <span className="inline-block size-2 bg-[#E61919] shadow-[0_0_6px_#E61919]" />
            {`── LINK DOWN ── ${error}`}
          </span>
        </div>
      ) : state ? (
        <>
          <div className={CELL}>
            <span className={MICRO_LABEL}>[ OPTIMAL NEXT ]</span>
            <div className={`mt-2 ${PRIMARY_TEXT}`}>{state.optimalNext}</div>
          </div>

          <div className={CELL}>
            <span className={MICRO_LABEL}>[ INTERCOM ]</span>
            <div className="mt-2 flex flex-col gap-1">
              {state.decisions.length === 0 ? (
                <div className="text-sm text-[#EAEAEA]/40">NO PENDING DECISIONS</div>
              ) : (
                state.decisions.map((decision) => (
                  <div key={decision.id} className="flex items-center gap-2 text-sm">
                    <span
                      className={`text-[11px] uppercase tracking-[0.08em] ${
                        isAlertKind(decision) ? "text-[#E61919]" : "text-[#EAEAEA]/60"
                      }`}
                    >
                      {decision.kind.toUpperCase()}
                    </span>
                    <span className={PRIMARY_TEXT}>{decision.title}</span>
                    <span className="ml-auto shrink-0 text-[11px] tabular-nums text-[#EAEAEA]/60">
                      {`⏳ ${formatTtl(Date.parse(decision.expiresAt) - nowMs)}`}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className={CELL}>
            <span className={MICRO_LABEL}>[ FLEET ]</span>
            <div className={`mt-2 ${PRIMARY_TEXT}`}>
              {`${watched} WATCHED · ${drivers} DRIVER · Q:${state.watchQueueDepth}`}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
