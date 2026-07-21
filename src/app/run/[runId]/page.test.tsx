import { afterEach, describe, expect, it, vi } from "vitest";

const { redirectSpy } = vi.hoisted(() => ({
  redirectSpy: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: (path: string) => redirectSpy(path),
}));

import RunPage from "./page";

afterEach(() => {
  vi.clearAllMocks();
});

describe("RunPage", () => {
  it("awaits the params Promise and redirects to /console/<runId> [req:1.3]", async () => {
    await RunPage({ params: Promise.resolve({ runId: "run-123" }) });

    expect(redirectSpy).toHaveBeenCalledWith("/console/run-123");
  });
});
