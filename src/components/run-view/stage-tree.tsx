"use client";

import type { StageNode } from "@/lib/journal/types";
import { STATUS_DOT_CLASSES } from "@/components/run-view/status-dot";

interface StageTreeProps {
  stages: StageNode[];
}

export function StageTree({ stages }: StageTreeProps) {
  return (
    <div className="flex flex-col gap-4">
      {stages.map((stage) => (
        <div key={stage.key}>
          <h3 className="mb-1 font-mono text-xs uppercase text-zinc-500 dark:text-zinc-400">
            {stage.title}
          </h3>
          <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {stage.legs.map((leg) => {
              const numerals = [
                leg.tokens !== undefined ? `${leg.tokens} tok` : null,
                leg.ms !== undefined ? `${leg.ms} ms` : null,
              ]
                .filter((value): value is string => value !== null)
                .join(" ");

              return (
                <div key={leg.label} className="flex flex-col gap-1 py-2">
                  <div className="flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className={`size-2 shrink-0 rounded-full ${STATUS_DOT_CLASSES[leg.status]}`}
                    />
                    <span className="flex-1 truncate font-mono text-xs text-zinc-900 dark:text-zinc-100">
                      {leg.label}
                    </span>
                    {numerals.length > 0 && (
                      <span className="shrink-0 font-mono tabular-nums text-xs text-zinc-500 dark:text-zinc-400">
                        {numerals}
                      </span>
                    )}
                  </div>
                  {leg.status === "failed" && leg.error && (
                    <p className="pl-4 text-xs text-red-600 dark:text-red-400">
                      {leg.error}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
