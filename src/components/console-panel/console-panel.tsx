"use client";

import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { createClient, trpc } from "@/components/console-panel/trpc";
import { OptimalNext } from "@/components/console-panel/optimal-next";
import { DecisionRow } from "@/components/console-panel/decision-row";

const MICRO_LABEL = "text-[11px] uppercase tracking-[0.08em] text-[#EAEAEA]/60";
const PRIMARY_TEXT = "text-sm [text-shadow:0_0_6px_rgba(234,234,234,0.22)]";
const CROSSHAIR = "absolute text-[#EAEAEA]/40 text-xs";

export function ConsolePanel() {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() => createClient());

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <ConsolePanelShell />
      </QueryClientProvider>
    </trpc.Provider>
  );
}

function ConsolePanelShell() {
  const stateQuery = trpc.console.state.useQuery(undefined, { refetchInterval: 5000 });
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const intervalId = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(intervalId);
  }, []);

  const data = stateQuery.data;
  const queryError = stateQuery.error;
  const linkDown = Boolean(queryError) || (data !== undefined && !data.ok);
  const errorMessage = queryError
    ? queryError.message
    : data && !data.ok
      ? data.error
      : null;
  const state = linkDown ? null : data && data.ok ? data.state : null;

  return (
    <div className="relative min-h-[100dvh] bg-[#0A0A0A] text-[#EAEAEA] font-mono">
      <div className="relative mx-auto max-w-5xl px-6 py-10">
        <span className={`${CROSSHAIR} -top-2 -left-1`}>+</span>
        <span className={`${CROSSHAIR} -top-2 -right-1`}>+</span>
        <span className={`${CROSSHAIR} -bottom-2 -left-1`}>+</span>
        <span className={`${CROSSHAIR} -bottom-2 -right-1`}>+</span>

        <h1 className="text-[clamp(2.5rem,8vw,7rem)] font-bold uppercase leading-[0.9] tracking-[-0.04em] [text-shadow:0_0_8px_rgba(234,234,234,0.25)]">
          CONSOLE
        </h1>

        {linkDown ? (
          <div className="mt-6 w-full border border-[#E61919] p-4 text-[#E61919]">
            <span className="flex items-center gap-2">
              <span className="inline-block size-2 bg-[#E61919] shadow-[0_0_6px_#E61919]" />
              {`── LINK DOWN ── ${errorMessage ?? "unknown error"}`}
            </span>
          </div>
        ) : null}

        {state ? (
          <div className="mt-6 grid gap-px bg-[#EAEAEA]/20 md:grid-cols-2">
            <div className="bg-[#0A0A0A] p-4">
              <OptimalNext directive={state.optimalNext} />
            </div>

            <div className="bg-[#0A0A0A] p-4">
              <span className={MICRO_LABEL}>[ ENGINE ]</span>
              <div className={`mt-2 ${PRIMARY_TEXT}`}>
                {state.engine
                  ? `${(state.engine.phase ?? "—").toUpperCase()} :: ${state.engine.repo ?? "—"}/${state.engine.feature ?? "—"}${
                      state.engine.runId ? ` :: ${state.engine.runId}` : ""
                    }`
                  : "—"}
              </div>
            </div>

            <div className="bg-[#0A0A0A] p-4">
              <span className={MICRO_LABEL}>[ FLEET ]</span>
              <div className="mt-2 flex flex-col gap-1">
                {Object.entries(state.repos).map(([alias, repo]) => (
                  <div key={alias} className={PRIMARY_TEXT}>
                    {`${alias} :: ${repo.class ?? "—"} :: ${repo.watched ? "WATCHED" : "UNWATCHED"} :: ${
                      repo.driver ? "DRIVER" : "—"
                    }`}
                  </div>
                ))}
              </div>
              <div className={`mt-2 ${MICRO_LABEL}`}>{`QUEUE DEPTH ${state.watchQueueDepth}`}</div>
            </div>

            <div className="bg-[#0A0A0A] p-4">
              <span className={MICRO_LABEL}>[ PENDING DECISIONS ]</span>
              <div className="mt-2 flex flex-col gap-4">
                {state.decisions.length === 0 ? (
                  <div className="text-sm text-[#EAEAEA]/40">NO PENDING DECISIONS</div>
                ) : (
                  state.decisions.map((decision) => (
                    <DecisionRow key={decision.id} decision={decision} nowMs={nowMs} />
                  ))
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="pointer-events-none fixed inset-0 z-50 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.18)_2px,rgba(0,0,0,0.18)_4px)]" />
    </div>
  );
}
