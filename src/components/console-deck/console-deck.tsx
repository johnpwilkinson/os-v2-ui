"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { createClient, trpc } from "@/components/console-deck/trpc";
import { AmbientStrip } from "@/components/console-deck/ambient-strip";
import { BusFilter, type BusFilterBucket } from "@/components/console-deck/bus-filter";
import { ProgramMonitor } from "@/components/console-deck/program-monitor";
import { Filmstrip } from "@/components/console-deck/filmstrip";
import { FRAME, SCANLINES } from "@/components/console-deck/crt";
import { cn } from "@/lib/utils";
import type { RunListEntry } from "@/server/runs";

const ALL_BUCKETS: BusFilterBucket[] = ["live", "halted", "passed"];
const CROSSHAIR = "pointer-events-none absolute text-[#EAEAEA]/40 text-xs";

interface ConsoleDeckProps {
  runId: string | null;
}

export function ConsoleDeck({ runId }: ConsoleDeckProps) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() => createClient());

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <ConsoleDeckShell runId={runId} />
      </QueryClientProvider>
    </trpc.Provider>
  );
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
}

function ConsoleDeckShell({ runId }: ConsoleDeckProps) {
  const router = useRouter();

  const runsQuery = trpc.runs.list.useQuery(undefined, { refetchInterval: 5000 });
  const stateQuery = trpc.console.state.useQuery(undefined, { refetchInterval: 5000 });

  const [nowMs, setNowMs] = useState(() => Date.now());
  const [enabled, setEnabled] = useState<Set<BusFilterBucket>>(() => new Set(ALL_BUCKETS));
  const [highlightIndex, setHighlightIndex] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(intervalId);
  }, []);

  const runsData: RunListEntry[] | undefined = runsQuery.data;
  const entries = useMemo(() => runsData ?? [], [runsData]);

  const stateData = stateQuery.data;
  const queryError = stateQuery.error;
  const linkDown = Boolean(queryError) || (stateData !== undefined && !stateData.ok);
  const errorMessage = queryError
    ? queryError.message
    : stateData && !stateData.ok
      ? stateData.error
      : null;
  const state = linkDown ? null : stateData && stateData.ok ? stateData.state : null;

  const runsByRunId = useMemo(() => {
    const map: Record<string, { alias: string; phase: string | null }> = {};
    if (!state) return map;
    for (const [alias, run] of Object.entries(state.runs)) {
      if (run.runId) {
        map[run.runId] = { alias, phase: run.phase };
      }
    }
    return map;
  }, [state]);

  const counts = useMemo(() => {
    const result: Record<BusFilterBucket, number> = { live: 0, halted: 0, passed: 0 };
    for (const entry of entries) {
      result[entry.status] += 1;
    }
    return result;
  }, [entries]);

  const programRunId = runId ?? entries[0]?.runId ?? null;
  const highlightedRunId =
    entries.length > 0 ? entries[Math.min(highlightIndex, entries.length - 1)].runId : null;

  function toggleBucket(bucket: BusFilterBucket) {
    setEnabled((prev) => {
      const next = new Set(prev);
      if (next.has(bucket)) {
        next.delete(bucket);
      } else {
        next.add(bucket);
      }
      return next;
    });
  }

  function enableAll() {
    setEnabled(new Set(ALL_BUCKETS));
  }

  function take(targetRunId: string) {
    router.push("/console/" + targetRunId);
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (isEditableTarget(event.target)) return;

      switch (event.key) {
        case "j":
          setHighlightIndex((prev) =>
            entries.length === 0 ? prev : Math.min(entries.length - 1, prev + 1),
          );
          break;
        case "k":
          setHighlightIndex((prev) => (entries.length === 0 ? prev : Math.max(0, prev - 1)));
          break;
        case "Enter":
          if (highlightedRunId) router.push("/console/" + highlightedRunId);
          break;
        case "1":
          toggleBucket("live");
          break;
        case "2":
          toggleBucket("halted");
          break;
        case "3":
          toggleBucket("passed");
          break;
        case "4":
          enableAll();
          break;
        default:
          break;
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [entries, highlightedRunId, router]);

  const runsLoaded = runsData !== undefined;
  const isNewestRun = programRunId !== null && entries.length > 0 && programRunId === entries[0].runId;

  return (
    <div className={FRAME}>
      <div className="relative mx-auto flex max-w-7xl flex-col gap-4 px-6 py-6">
        <span className={`${CROSSHAIR} -top-2 -left-1`}>+</span>
        <span className={`${CROSSHAIR} -top-2 -right-1`}>+</span>
        <span className={`${CROSSHAIR} -bottom-2 -left-1`}>+</span>
        <span className={`${CROSSHAIR} -bottom-2 -right-1`}>+</span>

        <AmbientStrip state={state} error={errorMessage} nowMs={nowMs} />
        <BusFilter enabled={enabled} counts={counts} onToggle={toggleBucket} onAll={enableAll} />

        {!runsLoaded ? null : entries.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 py-24 text-center">
            <p className={cn("text-sm text-[#EAEAEA]/70")}>NO CHAMBER RUNS FOUND.</p>
            <p className="max-w-md text-sm text-[#EAEAEA]/50">
              No run directories were found under the artifacts root. Set the
              CHAMBER_ARTIFACTS_DIR env var to point at a directory containing chamber run
              output.
            </p>
          </div>
        ) : programRunId ? (
          <ProgramMonitor runId={programRunId} isNewestRun={isNewestRun} nowMs={nowMs} />
        ) : null}

        <Filmstrip
          entries={entries}
          runsByRunId={runsByRunId}
          enabled={enabled}
          selectedRunId={programRunId}
          highlightedRunId={highlightedRunId}
          nowMs={nowMs}
          onTake={take}
        />
      </div>

      <div className={SCANLINES} />
    </div>
  );
}
