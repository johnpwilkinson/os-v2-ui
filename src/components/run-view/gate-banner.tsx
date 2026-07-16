"use client";

import { ExternalLink } from "lucide-react";
import type { NormalizedSummary } from "@/lib/journal/types";

interface GateBannerProps {
  summary: NormalizedSummary | null;
  live: boolean;
  repoUrl: string | null;
}

export function GateBanner({ summary, live, repoUrl }: GateBannerProps) {
  const content = renderBannerContent(summary, live);

  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-md px-4 py-3 ${content.colorClasses}`}
    >
      <div className="flex items-center gap-2">
        {content.dot}
        <span className="font-medium">{content.label}</span>
        {content.details
          .filter((detail) => detail.length > 0)
          .map((detail, index) => (
            <span key={index} className="text-sm">
              {detail}
            </span>
          ))}
      </div>
      {repoUrl && (
        <a
          href={repoUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Open repository"
        >
          <ExternalLink className="size-4" />
        </a>
      )}
    </div>
  );
}

function renderBannerContent(summary: NormalizedSummary | null, live: boolean) {
  if (summary?.gate?.startsWith("MERGED")) {
    const colonIndex = summary.gate.indexOf(":");
    const featureName =
      colonIndex >= 0 ? summary.gate.slice(colonIndex + 1) : "";
    return {
      colorClasses: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      dot: null,
      label: "MERGED",
      details: [featureName],
    };
  }

  if (summary && summary.halt_kind != null) {
    const detailText = summary.gate ?? summary.error ?? "";
    return {
      colorClasses: "bg-red-500/10 text-red-600 dark:text-red-400",
      dot: null,
      label: "HALTED",
      details: [summary.halt_kind, detailText],
    };
  }

  if (!summary && live) {
    return {
      colorClasses: "bg-zinc-500/10 text-zinc-700 dark:text-zinc-300",
      dot: (
        <span className="size-2 rounded-full bg-emerald-500 motion-safe:animate-pulse" />
      ),
      label: "RUNNING",
      details: [],
    };
  }

  return {
    colorClasses: "bg-zinc-500/10 text-zinc-700 dark:text-zinc-300",
    dot: null,
    label: "INCOMPLETE",
    details: [],
  };
}
