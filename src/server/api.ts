import { initTRPC } from "@trpc/server";
import { z } from "zod";
import { listRuns, readRunSnapshot, resolveRepoUrl } from "@/server/runs";
import { tailJournal } from "@/server/journal-tail";
import { fetchConsoleState } from "@/server/console";
import { parseConsoleState } from "@/lib/console/parse";

const t = initTRPC.create({ sse: { ping: { enabled: true, intervalMs: 15_000 } } });

export const appRouter = t.router({
  runs: t.router({
    list: t.procedure.query(() => listRuns()),
    get: t.procedure.input(z.object({ runId: z.string() })).query(async (opts) => {
      const [snapshot, repoUrl] = await Promise.all([
        readRunSnapshot(opts.input.runId),
        resolveRepoUrl(opts.input.runId),
      ]);
      return { ...snapshot, repoUrl };
    }),
    journalTail: t.procedure
      .input(z.object({ runId: z.string(), lastEventId: z.string().nullish() }))
      .subscription(async function* (opts) {
        yield* tailJournal(opts.input.runId, opts.input.lastEventId, opts.signal);
      }),
  }),
  console: t.router({
    state: t.procedure.query(async () => {
      const res = await fetchConsoleState();
      if (!res.ok) return { ok: false as const, error: res.error };
      const state = parseConsoleState(res.raw);
      if (!state) return { ok: false as const, error: "malformed console state" };
      return { ok: true as const, state };
    }),
  }),
});

export type AppRouter = typeof appRouter;
