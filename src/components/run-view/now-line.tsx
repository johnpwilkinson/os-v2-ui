"use client";

import { formatDistanceToNowStrict } from "date-fns";

interface NowLineProps {
  nowLabel: string | null;
  mtimeMs: number;
  now: number;
  finished: boolean;
  stallAfterMs: number;
}

export function NowLine({ nowLabel, mtimeMs, now, finished, stallAfterMs }: NowLineProps) {
  const stalled = !finished && now - mtimeMs > stallAfterMs;

  return (
    <div className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
      <span className="font-mono text-zinc-900 dark:text-zinc-100">
        {nowLabel ?? "idle"}
      </span>
      <span>
        last activity {formatDistanceToNowStrict(mtimeMs, { addSuffix: true })}
      </span>
      {stalled && (
        <span className="text-xs font-medium uppercase text-amber-600 dark:text-amber-400">
          STALLED
        </span>
      )}
    </div>
  );
}
