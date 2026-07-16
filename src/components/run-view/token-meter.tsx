"use client";

interface TokenMeterProps {
  outputTokens: number;
  llmHops: number;
}

export function TokenMeter({ outputTokens, llmHops }: TokenMeterProps) {
  return (
    <div className="flex items-center gap-4 text-sm text-zinc-600 dark:text-zinc-400">
      <div className="flex items-baseline gap-1">
        <span className="font-mono tabular-nums text-zinc-900 dark:text-zinc-100">
          {outputTokens}
        </span>
        <span>output tokens</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="font-mono tabular-nums text-zinc-900 dark:text-zinc-100">
          {llmHops}
        </span>
        <span>llm hops</span>
      </div>
    </div>
  );
}
