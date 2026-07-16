import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import { JournalFeed } from "@/components/run-view/journal-feed";
import type { JournalLine, RunJournalLine } from "@/lib/journal/types";

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

  it("renders a source badge for lines tagged with a turbo-* source directory [req:9.5]", () => {
    const lines: RunJournalLine[] = [
      { kind: "log", text: "nested-log", raw: "nested-log", source: "turbo-x-feat" },
    ];

    render(<JournalFeed lines={lines} />);

    expect(screen.getByText("turbo-x-feat")).toBeInTheDocument();
    expect(screen.getByText("nested-log")).toBeInTheDocument();
  });

  it("renders a leg-start row with the running status dot [req:9.9]", () => {
    const lines: JournalLine[] = [
      { kind: "leg-start", label: "impl:web", legKind: "exec", raw: '{"label":"impl:web","phase":"start"}' },
    ];

    const { container } = render(<JournalFeed lines={lines} />);

    expect(screen.getByText("impl:web")).toBeInTheDocument();
    expect(container.querySelector('[class*="animate-pulse"]')).not.toBeNull();
  });

  it("renders a battery start row with the running status dot and no exit code [req:9.9]", () => {
    const lines: JournalLine[] = [
      { kind: "battery", label: "battery:smoke", start: true, raw: '{"kind":"battery","label":"battery:smoke","start":true}' },
    ];

    const { container } = render(<JournalFeed lines={lines} />);

    expect(screen.getByText("battery:smoke")).toBeInTheDocument();
    expect(container.querySelector('[class*="animate-pulse"]')).not.toBeNull();
  });

  it("renders a completed battery row with its exit code and duration [req:9.9]", () => {
    const lines: JournalLine[] = [
      {
        kind: "battery",
        label: "battery:smoke",
        ok: true,
        exitCode: 0,
        ms: 250,
        raw: '{"kind":"battery","label":"battery:smoke","ok":true,"exitCode":0,"ms":250}',
      },
    ];

    render(<JournalFeed lines={lines} />);

    expect(screen.getByText("battery:smoke")).toBeInTheDocument();
    expect(screen.getByText("250 ms exit 0")).toBeInTheDocument();
  });

  it("renders an evt row with the evtType badge and a key=value payload summary [req:9.9]", () => {
    const lines: JournalLine[] = [
      {
        kind: "evt",
        evtType: "gate",
        payload: { type: "gate", v: 1, name: "footer-locale-badge" },
        raw: '{"log":"EVT {\\"type\\":\\"gate\\",\\"v\\":1,\\"name\\":\\"footer-locale-badge\\"}"}',
      },
    ];

    render(<JournalFeed lines={lines} />);

    expect(screen.getByText("gate")).toBeInTheDocument();
    expect(screen.getByText("name=footer-locale-badge")).toBeInTheDocument();
  });
});
