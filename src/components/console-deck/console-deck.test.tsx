import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import { FIXTURE_STATE_IDLE } from "@/lib/console/fixtures";
import type { RunListEntry } from "@/server/runs";

const RUN_A = "20260719T180000000";
const RUN_B = "20260719T190000000";

function entries(): RunListEntry[] {
  return [
    { runId: RUN_A, finished: true, mtimeMs: 1, status: "halted" },
    { runId: RUN_B, finished: false, mtimeMs: 2, status: "live" },
  ];
}

const { pushSpy, runsListSpy, stateQuerySpy, getQuerySpy } = vi.hoisted(() => ({
  pushSpy: vi.fn(),
  runsListSpy: vi.fn(),
  stateQuerySpy: vi.fn(),
  getQuerySpy: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushSpy }),
}));

vi.mock("@/components/console-deck/trpc", () => ({
  createClient: () => ({}),
  trpc: {
    Provider: (props: { children: ReactNode }) => props.children,
    runs: {
      list: { useQuery: () => runsListSpy() },
      get: { useQuery: () => getQuerySpy() },
      journalTail: { useSubscription: () => {} },
    },
    console: {
      state: { useQuery: () => stateQuerySpy() },
    },
  },
}));

import { ConsoleDeck } from "@/components/console-deck/console-deck";

beforeEach(() => {
  runsListSpy.mockReturnValue({ data: entries() });
  stateQuerySpy.mockReturnValue({ data: { ok: true, state: FIXTURE_STATE_IDLE } });
  getQuerySpy.mockReturnValue({ data: { ok: false } });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("ConsoleDeck", () => {
  it("pressing j then Enter pushes /console/<second-run> [req:11.10]", () => {
    render(<ConsoleDeck runId={null} />);

    fireEvent.keyDown(window, { key: "j" });
    fireEvent.keyDown(window, { key: "Enter" });

    expect(pushSpy).toHaveBeenCalledWith(`/console/${RUN_B}`);
  });

  it("k moves the highlight back so Enter pushes the first run again [req:11.10]", () => {
    render(<ConsoleDeck runId={null} />);

    fireEvent.keyDown(window, { key: "j" });
    fireEvent.keyDown(window, { key: "k" });
    fireEvent.keyDown(window, { key: "Enter" });

    expect(pushSpy).toHaveBeenCalledWith(`/console/${RUN_A}`);
  });

  it("pressing 2 dims halted tiles while keeping them in the document [req:11.10]", () => {
    render(<ConsoleDeck runId={null} />);

    const tile = screen.getByRole("button", { name: new RegExp(RUN_A) });
    expect(tile).not.toHaveClass("opacity-35");

    fireEvent.keyDown(window, { key: "2" });

    expect(tile).toHaveClass("opacity-35");
    expect(tile).toBeInTheDocument();
  });

  it("pressing 4 re-enables all buckets, clearing the dim treatment [req:11.10]", () => {
    render(<ConsoleDeck runId={null} />);

    const tile = screen.getByRole("button", { name: new RegExp(RUN_A) });

    fireEvent.keyDown(window, { key: "2" });
    expect(tile).toHaveClass("opacity-35");

    fireEvent.keyDown(window, { key: "4" });

    expect(tile).not.toHaveClass("opacity-35");
  });

  it("ignores keydown originating from an input element [req:11.10]", () => {
    render(<ConsoleDeck runId={null} />);

    const input = document.createElement("input");
    document.body.appendChild(input);

    try {
      fireEvent.keyDown(input, { key: "j" });
      fireEvent.keyDown(input, { key: "Enter" });

      expect(pushSpy).not.toHaveBeenCalled();

      fireEvent.keyDown(window, { key: "Enter" });
      expect(pushSpy).toHaveBeenCalledWith(`/console/${RUN_A}`);
    } finally {
      document.body.removeChild(input);
    }
  });

  it("renders the CHAMBER_ARTIFACTS_DIR empty state when there are zero runs [req:11.10]", () => {
    runsListSpy.mockReturnValue({ data: [] });

    render(<ConsoleDeck runId={null} />);

    expect(screen.getByText("NO CHAMBER RUNS FOUND.")).toBeInTheDocument();
    expect(screen.getByText(/CHAMBER_ARTIFACTS_DIR/)).toBeInTheDocument();
  });
});
