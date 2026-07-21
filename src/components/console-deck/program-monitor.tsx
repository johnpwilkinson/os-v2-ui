"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { skipToken } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";

import { trpc } from "@/components/console-deck/trpc";
import { MICRO_LABEL, PRIMARY_TEXT } from "@/components/console-deck/crt";
import { StagePanel } from "@/components/console-deck/stage-panel";
import { JournalPane } from "@/components/console-deck/journal-pane";
import { deriveRunView } from "@/lib/journal/derive";
import { groupStages } from "@/lib/journal/stages";
import { parseRunIdStart } from "@/lib/run-clock/run-clock";
import type { NormalizedSummary, RunJournalLine } from "@/lib/journal/types";

const DEFAULT_STALL_AFTER_MS = 10 * 60_000;

interface ProgramMonitorProps {
  runId: string;
  isNewestRun: boolean;
  nowMs: number;
}

interface TailStatus {
  mtimeMs: number;
  finished: boolean;
  stallAfterMs: number;
}

type StatusTreatment =
  | { kind: "MERGED"; featureName: string }
  | { kind: "HALTED"; haltKind: string; detail: string }
  | { kind: "LIVE" }
  | { kind: "STALLED" }
  | { kind: "INCOMPLETE" };

function deriveStatusTreatment(
  summary: NormalizedSummary | null,
  live: boolean,
  stalled: boolean,
): StatusTreatment {
  if (summary?.gate?.startsWith("MERGED")) {
    const colonIndex = summary.gate.indexOf(":");
    const featureName = colonIndex >= 0 ? summary.gate.slice(colonIndex + 1) : "";
    return { kind: "MERGED", featureName };
  }

  if (summary && summary.halt_kind != null) {
    return { kind: "HALTED", haltKind: summary.halt_kind, detail: summary.gate ?? summary.error ?? "" };
  }

  if (stalled) return { kind: "STALLED" };
  if (summary === null && live) return { kind: "LIVE" };
  return { kind: "INCOMPLETE" };
}

export function ProgramMonitor({ runId, isNewestRun, nowMs }: ProgramMonitorProps) {
  const snapshotQuery = trpc.runs.get.useQuery({ runId });
  const snapshot = snapshotQuery.data;

  const [lines, setLines] = useState<RunJournalLine[]>([]);
  const [status, setStatus] = useState<TailStatus | null>(null);
  const seenIndices = useRef<Set<number>>(new Set());
  const seededRunId = useRef<string | null>(null);
  const refetchedOnFinish = useRef(false);

  useEffect(() => {
    if (!snapshot || !snapshot.ok || seededRunId.current === runId) return;
    seededRunId.current = runId;
    seenIndices.current = new Set(Array.from({ length: snapshot.lineCount }, (_, index) => index));
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

  const finished = status?.finished ?? (snapshot?.ok ? snapshot.finished : false);
  const subscriptionInput =
    snapshot?.ok && !snapshot.finished
      ? { runId, lastEventId: snapshot.lineCount > 0 ? String(snapshot.lineCount - 1) : null }
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
        setStatus({ mtimeMs: event.mtimeMs, finished: event.finished, stallAfterMs: event.stallAfterMs });
      }
    },
  });

  const derived = useMemo(() => deriveRunView(lines), [lines]);
  const stages = useMemo(() => groupStages(lines), [lines]);

  if (!snapshot) {
    return <ProgramFrame runId={runId}>{null}</ProgramFrame>;
  }

  if (!snapshot.ok) {
    return (
      <ProgramFrame runId={runId}>
        <div className="flex flex-1 flex-col items-center justify-center gap-2 py-16 text-center">
          <p data-testid="program-monitor-no-run" className="font-mono text-sm text-[#EAEAEA]/50">
            NO RUN FOUND FOR &quot;{runId}&quot;
          </p>
        </div>
      </ProgramFrame>
    );
  }

  const summary = snapshot.summary ?? null;
  const enginePhaseRunning = snapshot.engineState?.phase === "running";
  const mtimeMs = status?.mtimeMs ?? snapshot.mtimeMs;
  const stallAfterMs = status?.stallAfterMs ?? DEFAULT_STALL_AFTER_MS;
  const mtimeWithinStallWindow = status !== null && nowMs - status.mtimeMs <= status.stallAfterMs;
  const live = (isNewestRun && enginePhaseRunning) || mtimeWithinStallWindow;
  const stalled = !finished && nowMs - mtimeMs > stallAfterMs;

  const treatment = deriveStatusTreatment(summary, live, stalled);

  const gate = summary?.gate ?? null;
  const execCount = finished ? (summary?.execCount ?? null) : null;
  const llmHops = finished ? (summary?.llmHops ?? 0) : derived.llmHops;
  const outputTokens = finished ? (summary?.live_output_tokens ?? 0) : derived.outputTokens;

  const start = parseRunIdStart(runId);
  const totalMs = start === null ? 0 : finished ? mtimeMs - start : nowMs - start;

  return (
    <ProgramFrame runId={runId} repoUrl={snapshot.repoUrl} treatment={treatment}>
      <div className="flex flex-wrap items-center gap-4 border-b border-[#EAEAEA]/10 pb-3">
        <MeterCell label="GATE" value={gate ?? "—"} />
        <MeterCell label="EXEC" value={execCount === null ? "—" : String(execCount)} />
        <MeterCell label="LLM HOPS" value={String(llmHops)} />
        <MeterCell label="OUT TOKENS" value={String(outputTokens)} />
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <StagePanel stages={stages} totalMs={totalMs} live={live} />
        <JournalPane lines={lines} />
      </div>
    </ProgramFrame>
  );
}

function MeterCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className={MICRO_LABEL}>{label}</span>
      <span className="font-mono text-sm tabular-nums text-[#EAEAEA]">{value}</span>
    </div>
  );
}

function StatusLine({ treatment }: { treatment: StatusTreatment }) {
  switch (treatment.kind) {
    case "MERGED":
      return (
        <span
          data-testid="program-monitor-status"
          className="flex items-center gap-2 text-sm text-emerald-400 [text-shadow:0_0_6px_rgba(52,211,153,0.5)]"
        >
          <span className="uppercase tracking-[0.08em]">MERGED</span>
          {treatment.featureName.length > 0 && <span>{treatment.featureName}</span>}
        </span>
      );
    case "HALTED":
      return (
        <span data-testid="program-monitor-status" className="flex items-center gap-2 text-sm text-[#E61919]">
          <span className="uppercase tracking-[0.08em]">HALTED</span>
          <span>{treatment.haltKind}</span>
          {treatment.detail.length > 0 && <span>{treatment.detail}</span>}
        </span>
      );
    case "LIVE":
      return (
        <span
          data-testid="program-monitor-status"
          className="flex items-center gap-2 text-sm text-emerald-400 [text-shadow:0_0_6px_rgba(52,211,153,0.5)]"
        >
          <span className="inline-block size-2 rounded-full bg-emerald-400 motion-safe:animate-pulse" />
          <span className="uppercase tracking-[0.08em]">LIVE</span>
        </span>
      );
    case "STALLED":
      return (
        <span data-testid="program-monitor-status" className="text-sm uppercase tracking-[0.08em] text-amber-400">
          STALLED
        </span>
      );
    case "INCOMPLETE":
      return (
        <span data-testid="program-monitor-status" className="text-sm uppercase tracking-[0.08em] text-[#EAEAEA]/40">
          INCOMPLETE
        </span>
      );
  }
}

function ProgramFrame({
  runId,
  repoUrl,
  treatment,
  children,
}: {
  runId: string;
  repoUrl?: string | null;
  treatment?: StatusTreatment;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border border-emerald-400/40 bg-[#0A0A0A] p-4 shadow-[0_0_16px_rgba(52,211,153,0.15)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className={MICRO_LABEL}>[ PROGRAM ]</span>
          <span className={`${PRIMARY_TEXT} text-[#EAEAEA]`}>{runId}</span>
          {treatment && <StatusLine treatment={treatment} />}
        </div>
        {repoUrl && (
          <a
            href={repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open repository"
            className="text-[#EAEAEA]/60 hover:text-emerald-400"
          >
            <ExternalLink className="size-4" />
          </a>
        )}
      </div>
      {children}
    </div>
  );
}
