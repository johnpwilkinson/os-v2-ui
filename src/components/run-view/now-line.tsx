"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNowStrict } from "date-fns";

interface NowLineProps {
  nowLabel: string | null;
  mtimeMs: number;
  finished: boolean;
  stallAfterMs: number;
}

export function NowLine({ nowLabel, mtimeMs, finished, stallAfterMs }: NowLineProps) {
  const [now, setNow] = useState(mtimeMs);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const intervalId = setInterval(tick, 30_000);
    const timeoutId = setTimeout(tick, 0);
    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
  }, []);

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
