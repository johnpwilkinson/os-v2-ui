"use client";

import { useEffect, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

import type { JournalLine, LegStatus } from "@/lib/journal/types";

interface JournalFeedProps {
  lines: JournalLine[];
}

const ROW_HEIGHT_PX = 32;
const STICK_THRESHOLD_PX = 40;

const STATUS_DOT_CLASSES: Record<LegStatus, string> = {
  done: "bg-emerald-500",
  failed: "bg-red-500",
  running: "bg-amber-500 motion-safe:animate-pulse",
};

export function JournalFeed({ lines }: JournalFeedProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [stickToBottom, setStickToBottom] = useState(true);

  const virtualizer = useVirtualizer({
    count: lines.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT_PX,
    overscan: 12,
  });

  useEffect(() => {
    if (!stickToBottom || lines.length === 0) return;
    virtualizer.scrollToIndex(lines.length - 1, { align: "end" });
  }, [lines.length, stickToBottom, virtualizer]);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setStickToBottom(distanceFromBottom <= STICK_THRESHOLD_PX);
  }

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
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
  );
}

function JournalRow({ line }: { line: JournalLine }) {
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
}

interface LegRowProps {
  label: string;
  status: LegStatus;
  tokens?: number;
  ms?: number;
  exitCode?: number;
}

function LegRow({ label, status, tokens, ms, exitCode }: LegRowProps) {
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
      <span className="flex-1 truncate font-mono text-xs text-zinc-900 dark:text-zinc-100">
        {label}
      </span>
      {numerals.length > 0 && (
        <span className="shrink-0 font-mono tabular-nums text-xs text-zinc-500 dark:text-zinc-400">
          {numerals}
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
      <span className="shrink-0 rounded border border-zinc-300 px-1 font-mono text-[10px] uppercase text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
        {evtType}
      </span>
      <span className="truncate font-mono text-xs text-zinc-500 dark:text-zinc-400">
        {summary}
      </span>
    </div>
  );
}

function LogRow({ text }: { text: string }) {
  return (
    <div className="flex h-full items-center truncate px-2 text-xs text-zinc-700 dark:text-zinc-300">
      {text}
    </div>
  );
}

function UnknownRow({ raw }: { raw: string }) {
  return (
    <div className="flex h-full items-center px-2 font-mono text-xs text-zinc-500 dark:text-zinc-500 break-all">
      {raw}
    </div>
  );
}
