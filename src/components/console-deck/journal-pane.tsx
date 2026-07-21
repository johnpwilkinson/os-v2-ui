"use client";

import { useEffect, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

import type { LegStatus, RunJournalLine } from "@/lib/journal/types";
import { MICRO_LABEL } from "@/components/console-deck/crt";

interface JournalPaneProps {
  lines: RunJournalLine[];
}

const ROW_HEIGHT_PX = 32;
const STICK_THRESHOLD_PX = 40;

const STATUS_DOT_CLASSES: Record<LegStatus, string> = {
  running: "bg-emerald-400 motion-safe:animate-pulse",
  done: "bg-[#EAEAEA]/40",
  failed: "bg-[#E61919]",
};

export function JournalPane({ lines }: JournalPaneProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [pinned, setPinned] = useState(true);
  const [newLinesCount, setNewLinesCount] = useState(0);
  const prevLineCountRef = useRef(lines.length);

  const virtualizer = useVirtualizer({
    count: lines.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT_PX,
    overscan: 12,
  });

  useEffect(() => {
    const delta = lines.length - prevLineCountRef.current;
    prevLineCountRef.current = lines.length;

    if (pinned) {
      if (lines.length === 0) return;
      virtualizer.scrollToIndex(lines.length - 1, { align: "end" });
    } else if (delta > 0) {
      setNewLinesCount((count) => count + delta);
    }
  }, [lines.length, pinned, virtualizer]);

  function repin() {
    setPinned(true);
    setNewLinesCount(0);
    if (lines.length > 0) {
      virtualizer.scrollToIndex(lines.length - 1, { align: "end" });
    }
  }

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const withinThreshold = distanceFromBottom <= STICK_THRESHOLD_PX;

    if (withinThreshold && !pinned) {
      repin();
    } else if (!withinThreshold && pinned) {
      setPinned(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className={MICRO_LABEL}>[ JOURNAL ]</span>
        {pinned ? (
          <span
            data-testid="journal-pane-status"
            className="font-mono text-xs text-emerald-400 [text-shadow:0_0_6px_rgba(52,211,153,0.5)]"
          >
            ● PINNED TO TAIL · {lines.length} LINES
          </span>
        ) : (
          <span data-testid="journal-pane-status" className="font-mono text-xs text-amber-400">
            ○ UNPINNED — REVIEWING HISTORY
          </span>
        )}
      </div>
      <div className="relative">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          data-testid="journal-pane-scroll"
          className="h-[50dvh] overflow-y-auto lg:h-[70dvh]"
        >
          <div
            style={{
              height: virtualizer.getTotalSize(),
              width: "100%",
              position: "relative",
            }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const line = lines[virtualRow.index];
              return (
                <div
                  key={virtualRow.key}
                  data-index={virtualRow.index}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: virtualRow.size,
                    transform: `translateY(${virtualRow.start}px)`,
                    overflow: "hidden",
                  }}
                >
                  <JournalRow line={line} />
                </div>
              );
            })}
          </div>
        </div>
        {!pinned && newLinesCount > 0 && (
          <button
            type="button"
            data-testid="journal-pane-new-lines-pill"
            onClick={repin}
            className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-emerald-400/60 bg-[#0A0A0A] px-3 py-1 font-mono text-xs text-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.4)]"
          >
            ▼ {newLinesCount} NEW LINE{newLinesCount === 1 ? "" : "S"}
          </button>
        )}
      </div>
    </div>
  );
}

function JournalRow({ line }: { line: RunJournalLine }) {
  const row = (() => {
    switch (line.kind) {
      case "leg-start":
        return <LegRow label={line.label} status="running" />;
      case "leg-complete":
        return (
          <LegRow
            label={line.label}
            status={line.ok ? "done" : "failed"}
            tokens={line.tokens}
            ms={line.ms}
            error={line.error}
          />
        );
      case "battery":
        return (
          <LegRow
            label={line.label}
            status={line.start ? "running" : line.ok ? "done" : "failed"}
            ms={line.ms}
            exitCode={line.exitCode}
          />
        );
      case "evt":
        return <EvtRow evtType={line.evtType} payload={line.payload} />;
      case "log":
        return <LogRow text={line.text} />;
      case "unknown":
        return <UnknownRow raw={line.raw} />;
    }
  })();

  if (!line.source) return row;

  return (
    <div className="flex h-full items-center gap-1">
      <SourceBadge source={line.source} />
      <div className="h-full min-w-0 flex-1">{row}</div>
    </div>
  );
}

function SourceBadge({ source }: { source: string }) {
  return (
    <span
      title={source}
      className="shrink-0 rounded border border-[#EAEAEA]/20 px-1 font-mono text-[10px] uppercase text-[#EAEAEA]/50"
    >
      {source}
    </span>
  );
}

interface LegRowProps {
  label: string;
  status: LegStatus;
  tokens?: number;
  ms?: number;
  exitCode?: number;
  error?: string;
}

function LegRow({ label, status, tokens, ms, exitCode, error }: LegRowProps) {
  const numerals = [
    tokens !== undefined ? `${tokens} tok` : null,
    ms !== undefined ? `${ms} ms` : null,
    exitCode !== undefined ? `exit ${exitCode}` : null,
  ]
    .filter((value): value is string => value !== null)
    .join(" ");

  return (
    <div className="flex h-full items-center gap-2 px-2">
      <span
        aria-hidden="true"
        className={`size-2 shrink-0 rounded-full ${STATUS_DOT_CLASSES[status]}`}
      />
      <span className="flex-1 truncate font-mono text-xs text-[#EAEAEA]">{label}</span>
      {numerals.length > 0 && (
        <span className="shrink-0 font-mono text-xs tabular-nums text-[#EAEAEA]/50">
          {numerals}
        </span>
      )}
      {status === "failed" && error && (
        <span className="shrink-0 max-w-[40%] truncate font-mono text-xs text-[#E61919]">
          {error}
        </span>
      )}
    </div>
  );
}

function EvtRow({
  evtType,
  payload,
}: {
  evtType: string;
  payload: Record<string, unknown>;
}) {
  const summary = Object.entries(payload)
    .filter(([key]) => key !== "type" && key !== "v")
    .map(([key, value]) => `${key}=${String(value)}`)
    .join(" ");

  return (
    <div className="flex h-full items-center gap-2 px-2">
      <span className="shrink-0 rounded border border-[#EAEAEA]/20 px-1 font-mono text-[10px] uppercase text-[#EAEAEA]/60">
        {evtType}
      </span>
      <span className="truncate font-mono text-xs text-[#EAEAEA]/50">{summary}</span>
    </div>
  );
}

function LogRow({ text }: { text: string }) {
  return (
    <div className="flex h-full items-center truncate px-2 font-mono text-xs text-[#EAEAEA]/70">
      {text}
    </div>
  );
}

function UnknownRow({ raw }: { raw: string }) {
  return (
    <div className="flex h-full items-center break-all px-2 font-mono text-xs text-[#EAEAEA]/50">
      {raw}
    </div>
  );
}
