import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { skipToken } from "@tanstack/react-query";

const { listQuery, getQuery, subscriptionSpy } = vi.hoisted(() => ({
  listQuery: vi.fn(),
  getQuery: vi.fn(),
  subscriptionSpy: vi.fn(),
}));

vi.mock("@/components/run-view/trpc", () => ({
  createClient: () => ({}),
  trpc: {
    Provider: (props: { children: ReactNode }) => props.children,
    runs: {
      list: { useQuery: () => listQuery() },
      get: { useQuery: () => getQuery() },
      journalTail: {
        useSubscription: (input: unknown) => subscriptionSpy(input),
      },
    },
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

import { RunView } from "@/components/run-view/run-view";

describe("RunView", () => {
  it("renders the empty state for a { ok: false } snapshot (no runs / missing run) [req:9.10]", () => {
    listQuery.mockReturnValue({ data: [] });
    getQuery.mockReturnValue({ data: { ok: false } });

    const { container } = render(<RunView runId="missing-run" />);

    expect(container.textContent).toContain('No run found for "missing-run".');
  });

  it("renders finished-run mode with summary-derived numbers and no live subscription [req:9.10]", () => {
    listQuery.mockReturnValue({ data: [{ runId: "run-1", finished: true }] });
    getQuery.mockReturnValue({
      data: {
        ok: true,
        lines: [],
        lineCount: 0,
        finished: true,
        summary: {
          turboRuns: 2,
          llmHops: 7,
          live_output_tokens: 4321,
        },
        engineState: null,
        repoUrl: null,
      },
    });

    render(<RunView runId="run-1" />);

    expect(screen.getByText("4321")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText("output tokens")).toBeInTheDocument();
    expect(screen.getByText("llm hops")).toBeInTheDocument();
    expect(subscriptionSpy).toHaveBeenCalledWith(skipToken);
  });
});
