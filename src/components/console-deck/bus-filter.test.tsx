import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { BusFilter, type BusFilterBucket } from "@/components/console-deck/bus-filter";

const ALL_BUCKETS: BusFilterBucket[] = ["live", "halted", "passed"];

function allEnabled() {
  return new Set<BusFilterBucket>(ALL_BUCKETS);
}

describe("BusFilter", () => {
  it("shows each bucket button's count from the counts prop [req:11.4]", () => {
    render(
      <BusFilter
        enabled={allEnabled()}
        counts={{ live: 3, halted: 1, passed: 7 }}
        onToggle={vi.fn()}
        onAll={vi.fn()}
      />
    );

    expect(screen.getByText("LIVE 3")).toBeInTheDocument();
    expect(screen.getByText("HALTED 1")).toBeInTheDocument();
    expect(screen.getByText("PASSED 7")).toBeInTheDocument();
  });

  it("calls onToggle with the clicked bucket's key [req:11.4]", () => {
    const onToggle = vi.fn();

    render(
      <BusFilter
        enabled={allEnabled()}
        counts={{ live: 0, halted: 0, passed: 0 }}
        onToggle={onToggle}
        onAll={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText("HALTED 0"));

    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(onToggle).toHaveBeenCalledWith("halted");
  });

  it("calls onAll when the ALL button is clicked [req:11.4]", () => {
    const onAll = vi.fn();

    render(
      <BusFilter
        enabled={new Set<BusFilterBucket>()}
        counts={{ live: 0, halted: 0, passed: 0 }}
        onToggle={vi.fn()}
        onAll={onAll}
      />
    );

    fireEvent.click(screen.getByText("ALL"));

    expect(onAll).toHaveBeenCalledTimes(1);
  });

  it("carries the dim off-treatment class on a disabled bucket [req:11.4]", () => {
    render(
      <BusFilter
        enabled={new Set<BusFilterBucket>(["live", "passed"])}
        counts={{ live: 0, halted: 0, passed: 0 }}
        onToggle={vi.fn()}
        onAll={vi.fn()}
      />
    );

    const haltedButton = screen.getByText("HALTED 0");
    expect(haltedButton).toHaveClass("border-[#EAEAEA]/20");
    expect(haltedButton).toHaveClass("text-[#EAEAEA]/40");
    expect(haltedButton).not.toHaveClass("border-[#E61919]");
  });
});
