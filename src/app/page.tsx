import { RunView } from "@/components/run-view/run-view";
import { listRuns } from "@/server/runs";

export const dynamic = "force-dynamic";

export default async function Home() {
  const runs = await listRuns();

  if (runs.length === 0) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-2 bg-zinc-50 px-6 text-center dark:bg-zinc-950">
        <p className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
          No chamber runs found.
        </p>
        <p className="max-w-md text-sm text-zinc-500 dark:text-zinc-400">
          No run directories were found under the artifacts root. Set the
          CHAMBER_ARTIFACTS_DIR env var to point at a directory containing
          chamber run output.
        </p>
      </main>
    );
  }

  return <RunView runId={runs[0].runId} />;
}
