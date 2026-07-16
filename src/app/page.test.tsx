import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const { runViewSpy, listRunsMock } = vi.hoisted(() => ({
  runViewSpy: vi.fn(),
  listRunsMock: vi.fn(),
}));

vi.mock("@/components/run-view/run-view", () => ({
  RunView: (props: { runId: string }) => {
    runViewSpy(props);
    return <div>run-view:{props.runId}</div>;
  },
}));

vi.mock("@/server/runs", () => ({
  listRuns: () => listRunsMock(),
}));

import Home from "./page";

afterEach(() => {
  vi.clearAllMocks();
});

describe("Home", () => {
  it("renders RunView for the newest (first-listed) run [req:1.3]", async () => {
    listRunsMock.mockResolvedValue([
      { runId: "run-b", finished: false, mtimeMs: Date.now() },
      { runId: "run-a", finished: true, mtimeMs: Date.now() - 1000 },
    ]);

    const element = await Home();
    render(element);

    expect(runViewSpy).toHaveBeenCalledWith({ runId: "run-b" });
    expect(screen.getByText("run-view:run-b")).toBeInTheDocument();
  });

  it("renders an empty state without crashing when there are zero runs [req:1.4]", async () => {
    listRunsMock.mockResolvedValue([]);

    const element = await Home();
    render(element);

    expect(runViewSpy).not.toHaveBeenCalled();
    expect(screen.getByText("No chamber runs found.")).toBeInTheDocument();
  });
});
