export const MICRO_LABEL = "text-[11px] uppercase tracking-[0.08em] text-[#EAEAEA]/60";

export const PRIMARY_TEXT = "text-sm [text-shadow:0_0_6px_rgba(234,234,234,0.22)]";

export const SCANLINES =
  "pointer-events-none fixed inset-0 z-50 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.18)_2px,rgba(0,0,0,0.18)_4px)]";

export const FRAME = "min-h-[100dvh] bg-[#0A0A0A] text-[#EAEAEA] font-mono";

export type StatusKey = "live" | "halted" | "passed" | "stalled";

export const STATUS_TEXT: Record<StatusKey, string> = {
  live: "text-emerald-400",
  halted: "text-[#E61919]",
  passed: "text-[#EAEAEA]/40",
  stalled: "text-amber-400",
};

export const STATUS_LED: Record<StatusKey, string> = {
  live: "bg-emerald-400 animate-pulse",
  halted: "bg-[#E61919] animate-pulse",
  passed: "bg-[#EAEAEA]/40",
  stalled: "bg-amber-400",
};
