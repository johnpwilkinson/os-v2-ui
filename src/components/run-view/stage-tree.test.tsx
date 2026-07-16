import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { StageTree } from "@/components/run-view/stage-tree";
import type { StageNode } from "@/lib/journal/types";

const stages: StageNode[] = [
  {
    key: "impl",
    title: "Implement",
    legs: [
      { label: "impl:web", status: "done", tokens: 120, ms: 450 },
      { label: "impl:api", status: "running" },
      { label: "impl:cli", status: "failed", error: "boom" },
    ],
  },
  {
    key: "val",
    title: "Validate",
    legs: [{ label: "val:web", status: "done", ms: 30 }],
  },
];

describe("StageTree", () => {
  it("renders a group title per stage [req:9.8]", () => {
    render(<StageTree stages={stages} />);

    expect(screen.getByText("Implement")).toBeInTheDocument();
    expect(screen.getByText("Validate")).toBeInTheDocument();
  });

  it("renders a status dot per leg reflecting done/running/failed [req:9.8]", () => {
    const { container } = render(<StageTree stages={stages} />);

    const dots = container.querySelectorAll('[aria-hidden="true"]');
    const classesFor = (label: string) =>
      Array.from(dots).find((dot) => dot.nextSibling?.textContent === label)?.className;

    expect(classesFor("impl:web")).toContain("bg-emerald-500");
    expect(classesFor("impl:api")).toContain("bg-amber-500");
    expect(classesFor("impl:cli")).toContain("bg-red-500");
  });

  it("renders tokens and ms values in mono, tabular-nums styling [req:9.8]", () => {
    render(<StageTree stages={stages} />);

    const numerals = screen.getByText("120 tok 450 ms");
    expect(numerals.className).toContain("font-mono");
    expect(numerals.className).toContain("tabular-nums");

    const msOnly = screen.getByText("30 ms");
    expect(msOnly.className).toContain("font-mono");
    expect(msOnly.className).toContain("tabular-nums");
  });
});
