import { describe, expect, test } from "vitest";
import { classifyLine, parseJournal } from "./parse";
import {
  BATTERY_COMPLETE_LINE,
  BATTERY_START_LINE,
  EVT_GATE_LINE,
  GARBAGE_LINE,
  LEG_COMPLETE_LINE,
  LEG_FAILED_LINE,
  LEG_START_LINE,
  PLAIN_LOG_LINE,
  UNRECOGNIZED_SHAPE_LINE,
} from "./fixtures";

describe("classifyLine", () => {
  test("classifies a leg-start line [req:9.1]", () => {
    const result = classifyLine(LEG_START_LINE);
    expect(result.kind).toBe("leg-start");
    if (result.kind === "leg-start") {
      expect(result.label).toBe("val:9.1");
      expect(result.legKind).toBe("validate");
    }
  });

  test("classifies an ok leg-complete line with tokens/ms [req:9.1]", () => {
    const result = classifyLine(LEG_COMPLETE_LINE);
    expect(result.kind).toBe("leg-complete");
    if (result.kind === "leg-complete") {
      expect(result.label).toBe("val:9.1");
      expect(result.ok).toBe(true);
      expect(result.tokens).toBe(956);
      expect(result.ms).toBe(12443);
    }
  });

  test("classifies a failed leg-complete line carrying error [req:9.1]", () => {
    const result = classifyLine(LEG_FAILED_LINE);
    expect(result.kind).toBe("leg-complete");
    if (result.kind === "leg-complete") {
      expect(result.label).toBe("debug:3.2");
      expect(result.ok).toBe(false);
      expect(result.error).toBe("pytest exit 1");
      expect(result.ms).toBe(803);
    }
  });

  test("classifies a battery start line [req:9.1]", () => {
    const result = classifyLine(BATTERY_START_LINE);
    expect(result.kind).toBe("battery");
    if (result.kind === "battery") {
      expect(result.label).toBe("mech:build");
      expect(result.start).toBe(true);
    }
  });

  test("classifies a battery completion line with exitCode [req:9.1]", () => {
    const result = classifyLine(BATTERY_COMPLETE_LINE);
    expect(result.kind).toBe("battery");
    if (result.kind === "battery") {
      expect(result.label).toBe("mech:build");
      expect(result.ok).toBe(true);
      expect(result.exitCode).toBe(0);
      expect(result.ms).toBe(3037);
    }
  });

  test("classifies a plain log line [req:9.1]", () => {
    const result = classifyLine(PLAIN_LOG_LINE);
    expect(result.kind).toBe("log");
    if (result.kind === "log") {
      expect(result.text).toBe("GATE: GO (validate-impl)");
    }
  });

  test("decodes an EVT gate line to evt with evtType gate [req:9.1]", () => {
    const result = classifyLine(EVT_GATE_LINE);
    expect(result.kind).toBe("evt");
    if (result.kind === "evt") {
      expect(result.evtType).toBe("gate");
      expect(result.payload).toMatchObject({
        v: 1,
        type: "gate",
        turbo: "validate-impl",
        feature: "single-run-live-view",
      });
    }
  });

  test("classifies non-JSON garbage as unknown without throwing [req:9.2]", () => {
    expect(() => classifyLine(GARBAGE_LINE)).not.toThrow();
    const result = classifyLine(GARBAGE_LINE);
    expect(result.kind).toBe("unknown");
  });

  test("classifies JSON of unrecognized shape as unknown [req:9.2]", () => {
    const result = classifyLine(UNRECOGNIZED_SHAPE_LINE);
    expect(result.kind).toBe("unknown");
  });

  test("classifies an EVT line with unparseable inner JSON as plain log without throwing [req:9.2]", () => {
    const line = `{"log":"EVT notjson{"}`;
    expect(() => classifyLine(line)).not.toThrow();
    const result = classifyLine(line);
    expect(result.kind).toBe("log");
    if (result.kind === "log") {
      expect(result.text).toBe("EVT notjson{");
    }
  });
});

describe("parseJournal", () => {
  test("returns exactly one entry per non-empty line for a multi-line blob with a trailing newline [req:9.1]", () => {
    const blob = [LEG_START_LINE, LEG_COMPLETE_LINE, BATTERY_START_LINE, PLAIN_LOG_LINE].join("\n") + "\n";
    const result = parseJournal(blob);
    expect(result).toHaveLength(4);
    expect(result.map((entry) => entry.kind)).toEqual(["leg-start", "leg-complete", "battery", "log"]);
  });
});
