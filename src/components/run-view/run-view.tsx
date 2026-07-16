"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider, skipToken } from "@tanstack/react-query";

import { createClient, trpc } from "@/components/run-view/trpc";
import { GateBanner } from "@/components/run-view/gate-banner";
import { JournalFeed } from "@/components/run-view/journal-feed";
import { NowLine } from "@/components/run-view/now-line";
import { RunPicker } from "@/components/run-view/run-picker";
import { StageTree } from "@/components/run-view/stage-tree";
import { TokenMeter } from "@/components/run-view/token-meter";
import { deriveRunView } from "@/lib/journal/derive";
import { groupStages } from "@/lib/journal/stages";
import type { JournalLine } from "@/lib/journal/types";

const DEFAULT_STALL_AFTER_MS = 10 * 60_000;

interface RunViewProps {
  runId: string;
}

interface TailStatus {
  mtimeMs: number;
  finished: boolean;
  stallAfterMs: number;
}

export function RunView({ runId }: RunViewProps) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() => createClient());

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <RunViewShell runId={runId} />
      </QueryClientProvider>
    </trpc.Provider>
  );
}

function RunViewShell({ runId }: RunViewProps) {
  const runsQuery = trpc.runs.list.useQuery();
  const snapshotQuery = trpc.runs.get.useQuery({ runId });
  const snapshot = snapshotQuery.data;

  const [lines, setLines] = useState<JournalLine[]>([]);
  const [status, setStatus] = useState<TailStatus | null>(null);
  const [now, setNow] = useState<number | null>(null);
  const seenIndices = useRef<Set<number>>(new Set());
  const seededRunId = useRef<string | null>(null);
  const refetchedOnFinish = useRef(false);

  useEffect(() => {
    if (!snapshot || !snapshot.ok || seededRunId.current === runId) return;
    seededRunId.current = runId;
    seenIndices.current = new Set(
      Array.from({ length: snapshot.lineCount }, (_, index) => index),
    );
    setLines(snapshot.lines);
    setStatus(null);
    refetchedOnFinish.current = false;
  }, [snapshot, runId]);

  useEffect(() => {
    if (status?.finished && !refetchedOnFinish.current) {
      refetchedOnFinish.current = true;
      void snapshotQuery.refetch();
    } else if (!status?.finished) {
      refetchedOnFinish.current = false;
    }
  }, [status?.finished, snapshotQuery]);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const intervalId = setInterval(tick, 30_000);
    return () => clearInterval(intervalId);
  }, []);

  const finished = status?.finished ?? (snapshot?.ok ? snapshot.finished : false);
  const subscriptionInput =
    snapshot?.ok && !snapshot.finished
      ? {
          runId,
          lastEventId: snapshot.lineCount > 0 ? String(snapshot.lineCount - 1) : null,
        }
      : skipToken;

  trpc.runs.journalTail.useSubscription(subscriptionInput, {
    onData(event) {
      if ("data" in event) {
        const lineEvent = event.data;
        if (lineEvent.type === "line" && !seenIndices.current.has(lineEvent.index)) {
          seenIndices.current.add(lineEvent.index);
          setLines((prev) => [...prev, lineEvent.line]);
        }
      } else if (event.type === "status") {
        setStatus({
          mtimeMs: event.mtimeMs,
          finished: event.finished,
          stallAfterMs: event.stallAfterMs,
        });
      }
    },
  });

  const derived = useMemo(() => deriveRunView(lines), [lines]);
  const stages = useMemo(() => groupStages(lines), [lines]);

  if (!snapshot) {
    return <RunViewFrame>{null}</RunViewFrame>;
  }

  if (!snapshot.ok) {
    return (
      <RunViewFrame>
        <div className="flex flex-1 flex-col items-center justify-center gap-2 py-24 text-center">
          <p className="font-mono text-sm text-zinc-500 dark:text-zinc-400">
            No run found for &quot;{runId}&quot;.
          </p>
        </div>
      </RunViewFrame>
    );
  }

  const runs = runsQuery.data ?? [];
  const isNewestRun = runs.length > 0 && runs[0].runId === runId;
  const enginePhaseRunning = snapshot.engineState?.phase === "running";
  const mtimeWithinStallWindow =
    status !== null && now !== null && now - status.mtimeMs <= status.stallAfterMs;
  const live = (isNewestRun && enginePhaseRunning) || mtimeWithinStallWindow;

  const summary = snapshot.summary ?? null;
  const outputTokens = finished ? (summary?.live_output_tokens ?? 0) : derived.outputTokens;
  const llmHops = finished ? (summary?.llmHops ?? 0) : derived.llmHops;

  return (
    <RunViewFrame>
      <RunPicker runs={runs} selectedRunId={runId} />
      <GateBanner summary={summary} live={live} repoUrl={snapshot.repoUrl} />
      <NowLine
        nowLabel={derived.nowLine}
        mtimeMs={status?.mtimeMs ?? snapshot.mtimeMs ?? now ?? 0}
        now={now ?? 0}
        finished={finished}
        stallAfterMs={status?.stallAfterMs ?? DEFAULT_STALL_AFTER_MS}
      />
      <TokenMeter outputTokens={outputTokens} llmHops={llmHops} />
      <div className="lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-6">
        <StageTree stages={stages} />
        <JournalFeed lines={lines} />
      </div>
    </RunViewFrame>
  );
}

function RunViewFrame({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 px-4 py-4 max-w-7xl mx-auto bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 min-h-[100dvh]">
      {children}
    </div>
  );
}
