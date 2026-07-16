import { describe, expect, test } from "vitest";
import { deriveRunView } from "./derive";
import type { JournalLine } from "./types";

function legStart(label: string): JournalLine {
  return { kind: "leg-start", label, legKind: "", raw: "" };
}

function legComplete(label: string, ok: boolean, tokens?: number): JournalLine {
  return { kind: "leg-complete", label, legKind: "", ok, tokens, raw: "" };
}

describe("deriveRunView", () => {
  test("now-line is the leg-start left open when one leg is open [req:9.4]", () => {
    const lines: JournalLine[] = [
      legStart("impl:1.1"),
      legComplete("impl:1.1", true, 10),
      legStart("val:9.1"),
    ];

    const view = deriveRunView(lines);

    expect(view.nowLine).toBe("val:9.1");
  });

  test("when multiple legs are open, the now-line is the most recently started one [req:9.4]", () => {
    const lines: JournalLine[] = [legStart("impl:1.1"), legStart("val:9.1")];

    const view = deriveRunView(lines);

    expect(view.nowLine).toBe("val:9.1");
  });

  test("now-line is null when all legs have completed [req:9.4]", () => {
    const lines: JournalLine[] = [
      legStart("impl:1.1"),
      legComplete("impl:1.1", true, 10),
      legStart("val:9.1"),
      legComplete("val:9.1", true, 20),
    ];

    const view = deriveRunView(lines);

    expect(view.nowLine).toBeNull();
  });

  test("sums numeric tokens across completions and counts them as LLM hops [req:9.4]", () => {
    const lines: JournalLine[] = [
      legStart("impl:1.1"),
      legComplete("impl:1.1", true, 100),
      legStart("debug:2.1"),
      legComplete("debug:2.1", false),
      legStart("val:9.1"),
      legComplete("val:9.1", true, 50),
    ];

    const view = deriveRunView(lines);

    expect(view.outputTokens).toBe(150);
    expect(view.llmHops).toBe(2);
  });
});
