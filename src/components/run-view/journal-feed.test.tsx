import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import { JournalFeed } from "@/components/run-view/journal-feed";
import type { JournalLine } from "@/lib/journal/types";

beforeEach(() => {
  Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
    configurable: true,
    value: 600,
  });
  Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
    configurable: true,
    value: 600,
  });
  window.HTMLElement.prototype.scrollTo = vi.fn();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("JournalFeed", () => {
  it("renders a known-kind row [req:9.9]", () => {
    const lines: JournalLine[] = [
      {
        kind: "leg-complete",
        label: "impl:web",
        legKind: "exec",
        ok: true,
        tokens: 42,
        ms: 100,
        raw: '{"type":"leg-complete"}',
      },
    ];

    render(<JournalFeed lines={lines} />);

    expect(screen.getByText("impl:web")).toBeInTheDocument();
    expect(screen.getByText("42 tok 100 ms")).toBeInTheDocument();
  });

  it("renders an unknown-kind line's raw text without throwing [req:9.9]", () => {
    const lines: JournalLine[] = [
      { kind: "unknown", raw: "not-json-and-not-recognized $$$" },
    ];

    expect(() => render(<JournalFeed lines={lines} />)).not.toThrow();
    expect(screen.getByText("not-json-and-not-recognized $$$")).toBeInTheDocument();
  });
});
