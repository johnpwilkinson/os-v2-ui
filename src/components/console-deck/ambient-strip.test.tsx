import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { AmbientStrip } from "@/components/console-deck/ambient-strip";
import { FIXTURE_STATE_ACTIVE, FIXTURE_STATE_IDLE } from "@/lib/console/fixtures";

const NOW_MS = Date.parse(FIXTURE_STATE_ACTIVE.ts);

describe("AmbientStrip", () => {
  it("renders the optimalNext directive in the ambient strip [req:3.1] [req:11.3]", () => {
    render(<AmbientStrip state={FIXTURE_STATE_ACTIVE} error={null} nowMs={NOW_MS} />);

    expect(screen.getByText("[ OPTIMAL NEXT ]")).toBeInTheDocument();
    expect(screen.getByText(FIXTURE_STATE_ACTIVE.optimalNext)).toBeInTheDocument();
  });

  it("renders each pending decision as a compact intercom line with kind, title, and a ticking mm:ss TTL countdown [req:3.2] [req:11.3]", () => {
    const [nonMergeVerdict, haltDecision] = FIXTURE_STATE_ACTIVE.decisions;

    render(<AmbientStrip state={FIXTURE_STATE_ACTIVE} error={null} nowMs={NOW_MS} />);

    expect(screen.getByText("VERDICT")).toBeInTheDocument();
    expect(screen.getByText(nonMergeVerdict.title)).toBeInTheDocument();
    expect(screen.getByText("HALT")).toBeInTheDocument();
    expect(screen.getByText(haltDecision.title)).toBeInTheDocument();

    const ttlCells = screen.getAllByText(/^⏳ \d{2,}:\d{2}$/);
    expect(ttlCells).toHaveLength(2);

    expect(screen.getByText("VERDICT")).toHaveClass("text-[#E61919]");
    expect(screen.getByText("HALT")).toHaveClass("text-[#E61919]");
  });

  it("does not use hazard red for a verdict decision whose recommendation starts with Merge [req:3.2] [req:11.3]", () => {
    const mergeState = {
      ...FIXTURE_STATE_ACTIVE,
      decisions: [
        {
          ...FIXTURE_STATE_ACTIVE.decisions[0],
          recommendation: "Merge once CI is green",
        },
      ],
    };

    render(<AmbientStrip state={mergeState} error={null} nowMs={NOW_MS} />);

    expect(screen.getByText("VERDICT")).not.toHaveClass("text-[#E61919]");
  });

  it("ticks the TTL countdown down as nowMs advances by one second [req:3.2] [req:11.3]", () => {
    const [firstDecision] = FIXTURE_STATE_ACTIVE.decisions;
    const expiresMs = Date.parse(firstDecision.expiresAt);

    const { rerender } = render(
      <AmbientStrip
        state={{ ...FIXTURE_STATE_ACTIVE, decisions: [firstDecision] }}
        error={null}
        nowMs={expiresMs - 65_000}
      />,
    );
    expect(screen.getByText("⏳ 01:05")).toBeInTheDocument();

    rerender(
      <AmbientStrip
        state={{ ...FIXTURE_STATE_ACTIVE, decisions: [firstDecision] }}
        error={null}
        nowMs={expiresMs - 64_000}
      />,
    );
    expect(screen.getByText("⏳ 01:04")).toBeInTheDocument();
  });

  it("renders a dimmed NO PENDING DECISIONS line when no decisions are pending [req:3.3] [req:11.3]", () => {
    render(<AmbientStrip state={FIXTURE_STATE_IDLE} error={null} nowMs={NOW_MS} />);

    const line = screen.getByText("NO PENDING DECISIONS");
    expect(line).toBeInTheDocument();
    expect(line).toHaveClass("text-[#EAEAEA]/40");
  });

  it("renders a fleet summary with watched count, driver count, and watch queue depth [req:3.4] [req:11.3]", () => {
    render(<AmbientStrip state={FIXTURE_STATE_ACTIVE} error={null} nowMs={NOW_MS} />);

    expect(screen.getByText("[ FLEET ]")).toBeInTheDocument();
    expect(screen.getByText("2 WATCHED · 1 DRIVER · Q:2")).toBeInTheDocument();
  });

  it("renders a LINK DOWN banner with the error message instead of the state cells when error is set, without throwing [req:3.5] [req:11.3]", () => {
    expect(() =>
      render(<AmbientStrip state={null} error="fetch failed" nowMs={NOW_MS} />),
    ).not.toThrow();

    expect(screen.getByText("── LINK DOWN ── fetch failed")).toBeInTheDocument();
    expect(screen.queryByText("[ OPTIMAL NEXT ]")).not.toBeInTheDocument();
    expect(screen.queryByText("[ INTERCOM ]")).not.toBeInTheDocument();
    expect(screen.queryByText("[ FLEET ]")).not.toBeInTheDocument();
  });

  it("still renders the CONSOLE brand cell when the link is down [req:3.5] [req:11.3]", () => {
    render(<AmbientStrip state={null} error="fetch failed" nowMs={NOW_MS} />);

    expect(screen.getByText("CONSOLE")).toBeInTheDocument();
  });
});
