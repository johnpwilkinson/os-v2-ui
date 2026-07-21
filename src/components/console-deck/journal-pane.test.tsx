import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { JournalPane } from "@/components/console-deck/journal-pane";
import type { RunJournalLine } from "@/lib/journal/types";

function line(label: string): RunJournalLine {
  return { kind: "log", text: label, raw: label };
}

function setScrollMetrics(
  el: HTMLElement,
  metrics: { scrollTop: number; scrollHeight: number; clientHeight: number }
) {
  Object.defineProperty(el, "scrollTop", { configurable: true, value: metrics.scrollTop });
  Object.defineProperty(el, "scrollHeight", { configurable: true, value: metrics.scrollHeight });
  Object.defineProperty(el, "clientHeight", { configurable: true, value: metrics.clientHeight });
}

let scrollToSpy: ReturnType<typeof vi.fn>;

beforeEach(() => {
  Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
    configurable: true,
    value: 600,
  });
  Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
    configurable: true,
    value: 600,
  });
  scrollToSpy = vi.fn();
  window.HTMLElement.prototype.scrollTo = scrollToSpy as unknown as typeof window.HTMLElement.prototype.scrollTo;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("JournalPane", () => {
  it("renders the full journal history pinned to the tail by default [req:8.1]", () => {
    const lines = [line("first"), line("second"), line("third")];

    render(<JournalPane lines={lines} />);

    expect(screen.getByText("first")).toBeInTheDocument();
    expect(screen.getByText("second")).toBeInTheDocument();
    expect(screen.getByText("third")).toBeInTheDocument();
    expect(screen.getByTestId("journal-pane-status")).toHaveTextContent(
      "● PINNED TO TAIL · 3 LINES"
    );
  });

  it("auto-scrolls to each appended line while pinned and shows the total line count [req:8.2]", () => {
    const { rerender } = render(<JournalPane lines={[line("a"), line("b")]} />);
    const callsAfterMount = scrollToSpy.mock.calls.length;
    expect(callsAfterMount).toBeGreaterThan(0);

    rerender(<JournalPane lines={[line("a"), line("b"), line("c")]} />);

    expect(scrollToSpy.mock.calls.length).toBeGreaterThan(callsAfterMount);
    expect(screen.getByTestId("journal-pane-status")).toHaveTextContent(
      "● PINNED TO TAIL · 3 LINES"
    );
  });

  it("unpins and shows the reviewing-history indicator when the user scrolls up past the stick threshold [req:8.3]", () => {
    render(<JournalPane lines={[line("a"), line("b"), line("c")]} />);
    const scrollEl = screen.getByTestId("journal-pane-scroll");

    setScrollMetrics(scrollEl, { scrollTop: 0, scrollHeight: 1000, clientHeight: 400 });
    fireEvent.scroll(scrollEl);

    expect(screen.getByTestId("journal-pane-status")).toHaveTextContent(
      "○ UNPINNED — REVIEWING HISTORY"
    );
  });

  it("accumulates arriving lines into a new-lines pill instead of scrolling while unpinned [req:8.4]", () => {
    const { rerender } = render(<JournalPane lines={[line("a"), line("b"), line("c")]} />);
    const scrollEl = screen.getByTestId("journal-pane-scroll");
    setScrollMetrics(scrollEl, { scrollTop: 0, scrollHeight: 1000, clientHeight: 400 });
    fireEvent.scroll(scrollEl);

    const callsAfterUnpin = scrollToSpy.mock.calls.length;

    rerender(<JournalPane lines={[line("a"), line("b"), line("c"), line("d")]} />);

    expect(screen.getByTestId("journal-pane-new-lines-pill")).toHaveTextContent("▼ 1 NEW LINE");
    expect(scrollToSpy.mock.calls.length).toBe(callsAfterUnpin);

    rerender(
      <JournalPane lines={[line("a"), line("b"), line("c"), line("d"), line("e")]} />
    );
    expect(screen.getByTestId("journal-pane-new-lines-pill")).toHaveTextContent("▼ 2 NEW LINES");
  });

  it("repins, clears the pill, and jumps to the tail when the pill is clicked [req:8.5]", () => {
    const { rerender } = render(<JournalPane lines={[line("a"), line("b"), line("c")]} />);
    const scrollEl = screen.getByTestId("journal-pane-scroll");
    setScrollMetrics(scrollEl, { scrollTop: 0, scrollHeight: 1000, clientHeight: 400 });
    fireEvent.scroll(scrollEl);
    rerender(<JournalPane lines={[line("a"), line("b"), line("c"), line("d")]} />);

    const callsBeforeClick = scrollToSpy.mock.calls.length;
    fireEvent.click(screen.getByTestId("journal-pane-new-lines-pill"));

    expect(screen.getByTestId("journal-pane-status")).toHaveTextContent(
      "● PINNED TO TAIL · 4 LINES"
    );
    expect(screen.queryByTestId("journal-pane-new-lines-pill")).not.toBeInTheDocument();
    expect(scrollToSpy.mock.calls.length).toBeGreaterThan(callsBeforeClick);
  });

  it("repins, clears the pill, and jumps to the tail when scrolled back within the stick threshold [req:8.5]", () => {
    const { rerender } = render(<JournalPane lines={[line("a"), line("b"), line("c")]} />);
    const scrollEl = screen.getByTestId("journal-pane-scroll");
    setScrollMetrics(scrollEl, { scrollTop: 0, scrollHeight: 1000, clientHeight: 400 });
    fireEvent.scroll(scrollEl);
    rerender(<JournalPane lines={[line("a"), line("b"), line("c"), line("d")]} />);
    expect(screen.getByTestId("journal-pane-new-lines-pill")).toBeInTheDocument();

    setScrollMetrics(scrollEl, { scrollTop: 970, scrollHeight: 1000, clientHeight: 400 });
    fireEvent.scroll(scrollEl);

    expect(screen.getByTestId("journal-pane-status")).toHaveTextContent(
      "● PINNED TO TAIL · 4 LINES"
    );
    expect(screen.queryByTestId("journal-pane-new-lines-pill")).not.toBeInTheDocument();
  });
});
