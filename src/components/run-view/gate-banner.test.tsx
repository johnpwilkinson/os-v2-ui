import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { GateBanner } from "@/components/run-view/gate-banner";
import type { NormalizedSummary } from "@/lib/journal/types";

function summary(overrides: Partial<NormalizedSummary> = {}): NormalizedSummary {
  return { turboRuns: null, ...overrides };
}

describe("GateBanner", () => {
  it("shows MERGED with the feature name for gate MERGED:footer-locale-badge [req:9.6]", () => {
    render(
      <GateBanner
        summary={summary({ gate: "MERGED:footer-locale-badge" })}
        live={false}
        feature={null}
        repoUrl={null}
      />,
    );

    expect(screen.getByText("MERGED")).toBeInTheDocument();
    expect(screen.getByText("footer-locale-badge")).toBeInTheDocument();
  });

  it("shows HALTED with the halt_kind for a summary with halt_kind validate-nogo [req:9.6]", () => {
    render(
      <GateBanner
        summary={summary({ halt_kind: "validate-nogo" })}
        live={false}
        feature={null}
        repoUrl={null}
      />,
    );

    expect(screen.getByText("HALTED")).toBeInTheDocument();
    expect(screen.getByText("validate-nogo")).toBeInTheDocument();
  });

  it("shows RUNNING with a pulse dot when there is no summary and the run is live [req:9.6]", () => {
    const { container } = render(
      <GateBanner summary={null} live={true} feature={null} repoUrl={null} />,
    );

    expect(screen.getByText("RUNNING")).toBeInTheDocument();
    expect(container.querySelector('[class*="animate-pulse"]')).not.toBeNull();
  });

  it("shows INCOMPLETE when there is no summary and the run is not live [req:9.6]", () => {
    const { container } = render(
      <GateBanner summary={null} live={false} feature={null} repoUrl={null} />,
    );

    expect(screen.getByText("INCOMPLETE")).toBeInTheDocument();
    expect(container.querySelector('[class*="animate-pulse"]')).toBeNull();
  });

  it("renders a repo anchor with target and rel when repoUrl is given, absent when null [req:9.6]", () => {
    const { rerender } = render(
      <GateBanner
        summary={null}
        live={false}
        feature={null}
        repoUrl="https://github.com/acme/widgets"
      />,
    );

    const link = screen.getByRole("link", { name: /open repository/i });
    expect(link).toHaveAttribute("href", "https://github.com/acme/widgets");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");

    rerender(<GateBanner summary={null} live={false} feature={null} repoUrl={null} />);
    expect(screen.queryByRole("link", { name: /open repository/i })).not.toBeInTheDocument();
  });
});
