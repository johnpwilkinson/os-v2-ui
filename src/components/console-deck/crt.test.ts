import { describe, expect, it } from "vitest";

import { FRAME, MICRO_LABEL, PRIMARY_TEXT, SCANLINES, STATUS_LED, STATUS_TEXT } from "@/components/console-deck/crt";

describe("crt constants", () => {
  it("carries the CRT frame, glow, and scanline overlay class strings verbatim [req:10.1]", () => {
    expect(FRAME).toBe("min-h-[100dvh] bg-[#0A0A0A] text-[#EAEAEA] font-mono");
    expect(MICRO_LABEL).toBe("text-[11px] uppercase tracking-[0.08em] text-[#EAEAEA]/60");
    expect(PRIMARY_TEXT).toBe("text-sm [text-shadow:0_0_6px_rgba(234,234,234,0.22)]");
    expect(SCANLINES).toBe(
      "pointer-events-none fixed inset-0 z-50 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.18)_2px,rgba(0,0,0,0.18)_4px)]",
    );
  });

  it("maps live/halted/passed/stalled status text colors [req:10.1]", () => {
    expect(STATUS_TEXT.live).toBe("text-emerald-400");
    expect(STATUS_TEXT.halted).toBe("text-[#E61919]");
    expect(STATUS_TEXT.passed).toBe("text-[#EAEAEA]/40");
    expect(STATUS_TEXT.stalled).toBe("text-amber-400");
  });

  it("maps live/halted/passed/stalled LED classes with pulse on live and halted [req:10.1]", () => {
    expect(STATUS_LED.live).toBe("bg-emerald-400 animate-pulse");
    expect(STATUS_LED.halted).toBe("bg-[#E61919] animate-pulse");
    expect(STATUS_LED.passed).toBe("bg-[#EAEAEA]/40");
    expect(STATUS_LED.stalled).toBe("bg-amber-400");
  });
});
