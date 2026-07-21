import { cn } from "@/lib/utils";

export type BusFilterBucket = "live" | "halted" | "passed";

interface BusFilterProps {
  enabled: Set<BusFilterBucket>;
  counts: Record<BusFilterBucket, number>;
  onToggle: (bucket: BusFilterBucket) => void;
  onAll: () => void;
}

const BUCKETS: BusFilterBucket[] = ["live", "halted", "passed"];

const BASE_TREATMENT =
  "rounded border px-3 py-1 text-[11px] uppercase tracking-[0.08em] transition-colors";

const OFF_TREATMENT = "border-[#EAEAEA]/20 text-[#EAEAEA]/40";

const ON_TREATMENT: Record<BusFilterBucket, string> = {
  live: "border-emerald-400 text-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]",
  halted: "border-[#E61919] text-[#E61919] shadow-[0_0_8px_rgba(230,25,25,0.5)]",
  passed: "border-emerald-400 text-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]",
};

export function BusFilter({ enabled, counts, onToggle, onAll }: BusFilterProps) {
  return (
    <div className="flex items-center gap-2">
      {BUCKETS.map((bucket) => {
        const isOn = enabled.has(bucket);
        return (
          <button
            key={bucket}
            type="button"
            onClick={() => onToggle(bucket)}
            className={cn(BASE_TREATMENT, isOn ? ON_TREATMENT[bucket] : OFF_TREATMENT)}
          >
            {bucket.toUpperCase()} {counts[bucket]}
          </button>
        );
      })}
      <button
        type="button"
        onClick={onAll}
        className={cn(BASE_TREATMENT, OFF_TREATMENT)}
      >
        ALL
      </button>
    </div>
  );
}
