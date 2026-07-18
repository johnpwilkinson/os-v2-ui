import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { RunsBoard } from "@/components/console-panel/runs-board";
import { FIXTURE_STATE_ACTIVE, FIXTURE_STATE_MULTI_RUN } from "@/lib/console/fixtures";
import type { ConsoleRun } from "@/lib/console/types";

const ACTIVE_TEXT_CLASS = "[text-shadow:0_0_6px_rgba(234,234,234,0.22)]";
const INACTIVE_TEXT_CLASS = "text-[#EAEAEA]/40";

describe("RunsBoard", () => {
  it("renders one row per alias showing the alias, phase, feature, and runId [req:2.1]", () => {
    render(<RunsBoard runs={FIXTURE_STATE_MULTI_RUN.runs} engine={FIXTURE_STATE_MULTI_RUN.engine} />);

    const { sim, ui } = FIXTURE_STATE_MULTI_RUN.runs;
    expect(
      screen.getByText(`SIM :: ${sim.phase!.toUpperCase()} :: ${sim.feature} :: ${sim.runId}`),
    ).toBeInTheDocument();
    expect(
      screen.getByText(`UI :: ${ui.phase!.toUpperCase()} :: ${ui.feature} :: ${ui.runId}`),
    ).toBeInTheDocument();
  });

  it("renders every active row simultaneously with the panel's primary glow treatment when two or more entries are active [req:2.2]", () => {
    render(<RunsBoard runs={FIXTURE_STATE_MULTI_RUN.runs} engine={FIXTURE_STATE_MULTI_RUN.engine} />);

    const { sim, ui } = FIXTURE_STATE_MULTI_RUN.runs;
    expect(
      screen.getByText(`SIM :: ${sim.phase!.toUpperCase()} :: ${sim.feature} :: ${sim.runId}`),
    ).toHaveClass(ACTIVE_TEXT_CLASS);
    expect(
      screen.getByText(`UI :: ${ui.phase!.toUpperCase()} :: ${ui.feature} :: ${ui.runId}`),
    ).toHaveClass(ACTIVE_TEXT_CLASS);
  });

  it("renders an inactive row dimmed relative to active rows [req:2.3]", () => {
    const runs: Record<string, ConsoleRun> = {
      sim: { active: true, phase: "planning", feature: "console-multi-run", runId: "run-42" },
      ui: { active: false, phase: "idle", feature: "runs-board", runId: null },
    };

    render(<RunsBoard runs={runs} engine={null} />);

    expect(screen.getByText("SIM :: PLANNING :: console-multi-run :: run-42")).toHaveClass(
      ACTIVE_TEXT_CLASS,
    );
    expect(screen.getByText("UI :: IDLE :: runs-board")).toHaveClass(INACTIVE_TEXT_CLASS);
  });

  it("orders active rows before inactive rows and alphabetically by alias within each group [req:2.4]", () => {
    const runs: Record<string, ConsoleRun> = {
      zeta: { active: false, phase: "idle", feature: "z-feature", runId: null },
      alpha: { active: true, phase: "planning", feature: "a-feature", runId: "run-1" },
      delta: { active: false, phase: "idle", feature: "d-feature", runId: null },
      beta: { active: true, phase: "review", feature: "b-feature", runId: "run-2" },
    };

    render(<RunsBoard runs={runs} engine={null} />);

    const rowTexts = screen.getAllByText(/^[A-Z]+ ::/).map((el) => el.textContent);
    expect(rowTexts).toEqual([
      "ALPHA :: PLANNING :: a-feature :: run-1",
      "BETA :: REVIEW :: b-feature :: run-2",
      "DELTA :: IDLE :: d-feature",
      "ZETA :: IDLE :: z-feature",
    ]);
  });

  it("renders the legacy engine summary line when the parsed runs map is empty [req:3.1]", () => {
    const { engine } = FIXTURE_STATE_ACTIVE;

    render(<RunsBoard runs={{}} engine={engine} />);

    const legacyEngineCellText = engine
      ? `${(engine.phase ?? "—").toUpperCase()} :: ${engine.repo ?? "—"}/${engine.feature ?? "—"}${
          engine.runId ? ` :: ${engine.runId}` : ""
        }`
      : "—";

    expect(screen.getByText(legacyEngineCellText)).toBeInTheDocument();
  });
});
