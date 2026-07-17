import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { DecisionRow } from "@/components/console-panel/decision-row";
import { FIXTURE_STATE_ACTIVE } from "@/lib/console/fixtures";

const NOW_MS = Date.parse(FIXTURE_STATE_ACTIVE.ts);

const [nonMergeVerdict, haltDecision] = FIXTURE_STATE_ACTIVE.decisions;

describe("DecisionRow", () => {
  it("renders one telemetry row showing kind, title, recommendation, repo/feature identity, age, and expiry countdown [req:2.2]", () => {
    render(<DecisionRow decision={nonMergeVerdict} nowMs={NOW_MS} />);

    expect(screen.getByText("VERDICT")).toBeInTheDocument();
    expect(screen.getByText(nonMergeVerdict.title)).toBeInTheDocument();
    expect(screen.getByText(nonMergeVerdict.recommendation)).toBeInTheDocument();
    expect(
      screen.getByText(`${nonMergeVerdict.repo} :: ${nonMergeVerdict.feature}`, {
        exact: false,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/^AGE \d{2}:\d{2}:\d{2}$/)).toBeInTheDocument();
    expect(screen.getByText(/^TTL \d{2}:\d{2}:\d{2}$/)).toBeInTheDocument();
  });

  it("uses hazard red as the alert color for a halt row [req:3.2]", () => {
    render(<DecisionRow decision={haltDecision} nowMs={NOW_MS} />);

    expect(screen.getByText("HALT")).toHaveClass("text-[#E61919]");
  });

  it("uses hazard red as the alert color for a verdict row whose recommendation does not start with Merge [req:3.2]", () => {
    render(<DecisionRow decision={nonMergeVerdict} nowMs={NOW_MS} />);

    expect(screen.getByText("VERDICT")).toHaveClass("text-[#E61919]");
  });

  it("does not use hazard red for a verdict row whose recommendation starts with Merge [req:3.2]", () => {
    const mergeVerdict = {
      ...nonMergeVerdict,
      recommendation: "Merge this once CI is green",
    };

    render(<DecisionRow decision={mergeVerdict} nowMs={NOW_MS} />);

    expect(screen.getByText("VERDICT")).not.toHaveClass("text-[#E61919]");
  });
});
