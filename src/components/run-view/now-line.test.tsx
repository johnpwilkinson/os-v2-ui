import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { NowLine } from "@/components/run-view/now-line";

describe("NowLine", () => {
  it("shows the current running-leg label [req:9.7]", () => {
    render(
      <NowLine
        nowLabel="build:web"
        mtimeMs={Date.now()}
        now={Date.now()}
        finished={false}
        stallAfterMs={60_000}
      />,
    );

    expect(screen.getByText("build:web")).toBeInTheDocument();
  });

  it("shows idle when there is no running leg [req:9.7]", () => {
    render(
      <NowLine
        nowLabel={null}
        mtimeMs={Date.now()}
        now={Date.now()}
        finished={false}
        stallAfterMs={60_000}
      />,
    );

    expect(screen.getByText("idle")).toBeInTheDocument();
  });

  it("shows the STALLED badge once now - mtimeMs exceeds stallAfterMs on an unfinished run [req:9.7]", () => {
    const mtimeMs = Date.now() - 500;
    render(
      <NowLine
        nowLabel="build:web"
        mtimeMs={mtimeMs}
        now={mtimeMs + 500}
        finished={false}
        stallAfterMs={1}
      />,
    );

    expect(screen.getByText("STALLED")).toBeInTheDocument();
  });

  it("does not show STALLED while within the stall threshold on an unfinished run [req:9.7]", () => {
    const now = Date.now();
    render(
      <NowLine
        nowLabel="build:web"
        mtimeMs={now}
        now={now}
        finished={false}
        stallAfterMs={60_000_000}
      />,
    );

    expect(screen.queryByText("STALLED")).not.toBeInTheDocument();
  });

  it("does not show STALLED on a finished run even when far past the stall threshold [req:9.7]", () => {
    const now = Date.now();
    render(
      <NowLine
        nowLabel="build:web"
        mtimeMs={now - 1_000_000}
        now={now}
        finished={true}
        stallAfterMs={1}
      />,
    );

    expect(screen.queryByText("STALLED")).not.toBeInTheDocument();
  });
});
