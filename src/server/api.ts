import { initTRPC } from "@trpc/server";
import { z } from "zod";
import { listRuns, readRunSnapshot, resolveRepoUrl } from "@/server/runs";
import { tailJournal } from "@/server/journal-tail";

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
});

export type AppRouter = typeof appRouter;
