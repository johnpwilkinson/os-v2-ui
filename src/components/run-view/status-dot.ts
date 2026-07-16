import type { LegStatus } from "@/lib/journal/types";

export const STATUS_DOT_CLASSES: Record<LegStatus, string> = {
  done: "bg-emerald-500",
  failed: "bg-red-500",
  running: "bg-emerald-500 motion-safe:animate-pulse",
};
