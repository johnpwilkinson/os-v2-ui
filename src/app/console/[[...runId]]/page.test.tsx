import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const { consoleDeckSpy } = vi.hoisted(() => ({
  consoleDeckSpy: vi.fn(),
}));

vi.mock("@/components/console-deck/console-deck", () => ({
  ConsoleDeck: (props: { runId: string | null }) => {
    consoleDeckSpy(props);
    return <div>console-deck:{String(props.runId)}</div>;
  },
}));

import ConsolePage, { dynamic } from "./page";

afterEach(() => {
  vi.clearAllMocks();
});

describe("ConsolePage", () => {
  it("exports dynamic as force-dynamic [req:1.1]", () => {
    expect(dynamic).toBe("force-dynamic");
  });

  it("renders ConsoleDeck with runId null when no run segment is present [req:1.1]", async () => {
    const element = await ConsolePage({ params: Promise.resolve({ runId: undefined }) });
    render(element);

    expect(consoleDeckSpy).toHaveBeenCalledWith({ runId: null });
    expect(screen.getByText("console-deck:null")).toBeInTheDocument();
  });

  it("renders ConsoleDeck with the runId taken from the run segment [req:1.2]", async () => {
    const element = await ConsolePage({ params: Promise.resolve({ runId: ["run-123"] }) });
    render(element);

    expect(consoleDeckSpy).toHaveBeenCalledWith({ runId: "run-123" });
    expect(screen.getByText("console-deck:run-123")).toBeInTheDocument();
  });
});
