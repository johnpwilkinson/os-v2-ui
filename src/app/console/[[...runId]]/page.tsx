import { ConsoleDeck } from "@/components/console-deck/console-deck";

export const dynamic = "force-dynamic";

export default async function ConsolePage({
  params,
}: {
  params: Promise<{ runId?: string[] }>;
}) {
  const { runId } = await params;

  return <ConsoleDeck runId={runId?.[0] ?? null} />;
}
