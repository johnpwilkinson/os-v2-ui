import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import { FIXTURE_STATE_ACTIVE } from "@/lib/console/fixtures";

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

import ConsolePage, { dynamic } from "./page";

afterEach(() => {
  vi.clearAllMocks();
});

describe("ConsolePage", () => {
  it("exports dynamic as force-dynamic [req:2.1]", () => {
    expect(dynamic).toBe("force-dynamic");
  });

  it("leads with the >>> OPTIMAL NEXT directive when rendered against the active fixture [req:2.1]", () => {
    stateQuerySpy.mockReturnValue({ data: { ok: true, state: FIXTURE_STATE_ACTIVE } });

    render(<ConsolePage />);

    expect(
      screen.getByText(`>>> ${FIXTURE_STATE_ACTIVE.optimalNext}`),
    ).toBeInTheDocument();
  });
});
