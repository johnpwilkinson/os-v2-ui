import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

import { RunPicker } from "@/components/run-view/run-picker";

beforeEach(() => {
  Element.prototype.hasPointerCapture = Element.prototype.hasPointerCapture ?? (() => false);
  Element.prototype.setPointerCapture = Element.prototype.setPointerCapture ?? (() => {});
  Element.prototype.releasePointerCapture = Element.prototype.releasePointerCapture ?? (() => {});
  Element.prototype.scrollIntoView = Element.prototype.scrollIntoView ?? (() => {});
});

describe("RunPicker", () => {
  it("renders a relative-time label (not raw UTC) for each run's list metadata [req:7.9]", async () => {
    const user = userEvent.setup();
    const mtimeMs = Date.now() - 5 * 60_000;

    render(
      <RunPicker
        runs={[{ runId: "run-1", finished: true, mtimeMs }]}
        selectedRunId="run-1"
      />,
    );

    await user.click(screen.getByRole("combobox"));

    const option = await screen.findByRole("option", { name: /run-1/ });
    expect(option.textContent).toMatch(/\d+ minutes? ago/);
    expect(option.textContent).not.toMatch(/\d{4}-\d{2}-\d{2}T/);
  });
});
