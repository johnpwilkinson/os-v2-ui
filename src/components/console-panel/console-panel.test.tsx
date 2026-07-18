import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import {
  FIXTURE_RAW_LEGACY_ACTIVE_NO_RUNS,
  FIXTURE_STATE_ACTIVE,
  FIXTURE_STATE_IDLE,
  FIXTURE_STATE_MULTI_RUN,
} from "@/lib/console/fixtures";
import { parseConsoleState } from "@/lib/console/parse";

const { stateQuerySpy } = vi.hoisted(() => ({
  stateQuerySpy: vi.fn(),
}));

vi.mock("@/components/console-panel/trpc", () => ({
  createClient: () => ({}),
  trpc: {
    Provider: (props: { children: ReactNode }) => props.children,
    console: {
      state: {
        useQuery: (input: unknown, options: unknown) => stateQuerySpy(input, options),
      },
    },
  },
}));

import { ConsolePanel } from "@/components/console-panel/console-panel";

afterEach(() => {
  vi.clearAllMocks();
});

describe("ConsolePanel", () => {
  it("leads with the OPTIMAL NEXT directive and renders one telemetry row per live decision [req:2.1] [req:2.2]", () => {
    stateQuerySpy.mockReturnValue({ data: { ok: true, state: FIXTURE_STATE_ACTIVE } });

    render(<ConsolePanel />);

    expect(screen.getByText("[ OPTIMAL NEXT ]")).toBeInTheDocument();
    expect(
      screen.getByText(`>>> ${FIXTURE_STATE_ACTIVE.optimalNext}`),
    ).toBeInTheDocument();
    for (const decision of FIXTURE_STATE_ACTIVE.decisions) {
      expect(screen.getByText(decision.title)).toBeInTheDocument();
    }
  });

  it("renders the dim NO PENDING DECISIONS row when zero decisions are live [req:2.3]", () => {
    stateQuerySpy.mockReturnValue({ data: { ok: true, state: FIXTURE_STATE_IDLE } });

    render(<ConsolePanel />);

    expect(screen.getByText("NO PENDING DECISIONS")).toHaveClass("text-[#EAEAEA]/40");
  });

  it("renders the full-width red LINK DOWN banner naming the error when the query returns ok false [req:2.4]", () => {
    stateQuerySpy.mockReturnValue({ data: { ok: false, error: "bridge unreachable: timeout" } });

    render(<ConsolePanel />);

    const banner = screen.getByText(/LINK DOWN/);
    expect(banner.textContent).toContain("bridge unreachable: timeout");
    expect(banner.closest("div")).toHaveClass("text-[#E61919]");
  });

  it("renders the full-width red LINK DOWN banner naming the error when the query itself errors [req:2.4]", () => {
    stateQuerySpy.mockReturnValue({ data: undefined, error: new Error("network down") });

    render(<ConsolePanel />);

    const banner = screen.getByText(/LINK DOWN/);
    expect(banner.textContent).toContain("network down");
  });

  it("hides the live panel and shows only the LINK DOWN banner when a refetch errors over stale ok data [req:2.4] [req:3.3]", () => {
    stateQuerySpy.mockReturnValue({
      data: { ok: true, state: FIXTURE_STATE_ACTIVE },
      error: new Error("network down"),
    });

    render(<ConsolePanel />);

    expect(screen.getByText(/LINK DOWN/)).toBeInTheDocument();
    expect(screen.queryByText("[ OPTIMAL NEXT ]")).not.toBeInTheDocument();
  });

  it("refetches the console state every five seconds [req:2.5]", () => {
    stateQuerySpy.mockReturnValue({ data: { ok: true, state: FIXTURE_STATE_IDLE } });

    render(<ConsolePanel />);

    expect(stateQuerySpy).toHaveBeenCalledWith(undefined, { refetchInterval: 5000 });
  });

  it("renders exactly one terminal-green element, the LINK indicator dot, in the live tree [req:3.3]", () => {
    stateQuerySpy.mockReturnValue({ data: { ok: true, state: FIXTURE_STATE_ACTIVE } });

    const { container } = render(<ConsolePanel />);

    const greenDots = container.querySelectorAll('[class*="bg-[#4AF626]"]');
    expect(greenDots).toHaveLength(1);
  });

  it("renders from the console fixtures module rather than live data [req:4.2]", () => {
    stateQuerySpy.mockReturnValue({ data: { ok: true, state: FIXTURE_STATE_ACTIVE } });

    render(<ConsolePanel />);

    expect(screen.getByText(FIXTURE_STATE_ACTIVE.decisions[0].recommendation)).toBeInTheDocument();
  });

  it("renders both repo rows when the two-active runs fixture drives the shell [req:2.2]", () => {
    stateQuerySpy.mockReturnValue({ data: { ok: true, state: FIXTURE_STATE_MULTI_RUN } });

    render(<ConsolePanel />);

    const { sim, ui } = FIXTURE_STATE_MULTI_RUN.runs;
    expect(
      screen.getByText(`SIM :: ${sim.phase!.toUpperCase()} :: ${sim.feature} :: ${sim.runId}`),
    ).toBeInTheDocument();
    expect(
      screen.getByText(`UI :: ${ui.phase!.toUpperCase()} :: ${ui.feature} :: ${ui.runId}`),
    ).toBeInTheDocument();
  });

  it("renders the same engine summary text the pre-feature panel produced when the bridge response omits the runs field entirely [req:3.2]", () => {
    const state = parseConsoleState(FIXTURE_RAW_LEGACY_ACTIVE_NO_RUNS);
    stateQuerySpy.mockReturnValue({ data: { ok: true, state } });

    render(<ConsolePanel />);

    expect(screen.getByText("PLANNING :: os-v2-ui/console-state-panel :: run-42")).toBeInTheDocument();
  });
});
