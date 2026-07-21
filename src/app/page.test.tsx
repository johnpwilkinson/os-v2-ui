import { afterEach, describe, expect, it, vi } from "vitest";

const { redirectSpy } = vi.hoisted(() => ({
  redirectSpy: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: (path: string) => redirectSpy(path),
}));

import Home from "./page";

afterEach(() => {
  vi.clearAllMocks();
});

describe("Home", () => {
  it("redirects to /console [req:1.4]", () => {
    Home();

    expect(redirectSpy).toHaveBeenCalledWith("/console");
  });
});
