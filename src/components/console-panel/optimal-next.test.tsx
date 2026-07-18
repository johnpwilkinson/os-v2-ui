import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { OptimalNext } from "@/components/console-panel/optimal-next";
import { FIXTURE_STATE_ACTIVE } from "@/lib/console/fixtures";

describe("OptimalNext", () => {
  it("leads with the OPTIMAL NEXT caption and the >>> directive from the fixture [req:2.1]", () => {
    render(<OptimalNext directive={FIXTURE_STATE_ACTIVE.optimalNext} />);

    expect(screen.getByText("[ OPTIMAL NEXT ]")).toBeInTheDocument();
    expect(
      screen.getByText(`>>> ${FIXTURE_STATE_ACTIVE.optimalNext}`),
    ).toBeInTheDocument();
  });

  it("renders exactly one terminal-green LINK dot when the bridge link is up [req:3.3]", () => {
    const { container } = render(
      <OptimalNext directive={FIXTURE_STATE_ACTIVE.optimalNext} />,
    );

    const greenDots = container.querySelectorAll('[class*="bg-[#4AF626]"]');
    expect(greenDots).toHaveLength(1);
  });
});
