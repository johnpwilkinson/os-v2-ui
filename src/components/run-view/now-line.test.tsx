import { describe, expect, it } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";

import { NowLine } from "@/components/run-view/now-line";

function flush(ms = 10): Promise<void> {
  return act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });
}

describe("NowLine", () => {
  it("shows the current running-leg label [req:9.7]", () => {
    render(
      <NowLine
        nowLabel="build:web"
        mtimeMs={Date.now()}
        finished={false}
        stallAfterMs={60_000}
      />,
    );

    expect(screen.getByText("build:web")).toBeInTheDocument();
  });

  it("shows idle when there is no running leg [req:9.7]", () => {
    render(
      <NowLine nowLabel={null} mtimeMs={Date.now()} finished={false} stallAfterMs={60_000} />,
    );

    expect(screen.getByText("idle")).toBeInTheDocument();
  });

  it("shows the STALLED badge once Date.now() - mtimeMs exceeds stallAfterMs on an unfinished run [req:9.7]", async () => {
    render(
      <NowLine
        nowLabel="build:web"
        mtimeMs={Date.now() - 500}
        finished={false}
        stallAfterMs={1}
      />,
    );

    await waitFor(() => expect(screen.getByText("STALLED")).toBeInTheDocument());
  });

  it("does not show STALLED while within the stall threshold on an unfinished run [req:9.7]", async () => {
    render(
      <NowLine
        nowLabel="build:web"
        mtimeMs={Date.now()}
        finished={false}
        stallAfterMs={60_000_000}
      />,
    );

    await flush();
    expect(screen.queryByText("STALLED")).not.toBeInTheDocument();
  });

  it("does not show STALLED on a finished run even when far past the stall threshold [req:9.7]", async () => {
    render(
      <NowLine
        nowLabel="build:web"
        mtimeMs={Date.now() - 1_000_000}
        finished={true}
        stallAfterMs={1}
      />,
    );

    await flush();
    expect(screen.queryByText("STALLED")).not.toBeInTheDocument();
  });
});
