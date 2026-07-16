"use client";

import { useRouter } from "next/navigation";
import { formatDistanceToNowStrict } from "date-fns";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface RunPickerRun {
  runId: string;
  finished: boolean;
  mtimeMs: number;
}

interface RunPickerProps {
  runs: RunPickerRun[];
  selectedRunId: string;
}

export function RunPicker({ runs, selectedRunId }: RunPickerProps) {
  const router = useRouter();

  return (
    <Select
      value={selectedRunId}
      onValueChange={(runId) => router.push("/run/" + runId)}
    >
      <SelectTrigger className="border-zinc-300 bg-zinc-100 font-mono text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="border border-zinc-300 bg-zinc-100 font-mono text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
        {runs.map((run) => (
          <SelectItem key={run.runId} value={run.runId}>
            <span>{run.runId}</span>
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
              {formatDistanceToNowStrict(run.mtimeMs, { addSuffix: true })}
            </span>
            {!run.finished && (
              <span className="text-[10px] uppercase text-emerald-600 dark:text-emerald-400">
                LIVE
              </span>
            )}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
