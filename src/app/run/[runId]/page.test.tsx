import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const { runViewSpy } = vi.hoisted(() => ({ runViewSpy: vi.fn() }));

vi.mock("@/components/run-view/run-view", () => ({
  RunView: (props: { runId: string }) => {
    runViewSpy(props);
    return <div>run-view:{props.runId}</div>;
  },
}));

import RunPage from "./page";

describe("RunPage", () => {
  it("awaits the params Promise and renders RunView for that runId [req:1.5]", async () => {
    const element = await RunPage({ params: Promise.resolve({ runId: "run-123" }) });
    render(element);

    expect(runViewSpy).toHaveBeenCalledWith({ runId: "run-123" });
    expect(screen.getByText("run-view:run-123")).toBeInTheDocument();
  });
});
