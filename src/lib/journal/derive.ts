import type { JournalLine, RunViewModel } from "./types";

export function deriveRunView(lines: JournalLine[]): RunViewModel {
  const openLegs = new Set<string>();
  const openOrder: string[] = [];
  let outputTokens = 0;
  let llmHops = 0;

  for (const line of lines) {
    if (line.kind === "leg-start") {
      if (!openLegs.has(line.label)) {
        openOrder.push(line.label);
      }
      openLegs.add(line.label);
    } else if (line.kind === "leg-complete") {
      openLegs.delete(line.label);
      const idx = openOrder.indexOf(line.label);
      if (idx !== -1) openOrder.splice(idx, 1);
      if (typeof line.tokens === "number") {
        outputTokens += line.tokens;
        llmHops += 1;
      }
    }
  }

  const nowLine = openOrder.length > 0 ? openOrder[openOrder.length - 1] : null;

  return { nowLine, outputTokens, llmHops };
}
