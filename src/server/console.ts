export type FetchConsoleStateResult = { ok: false; error: string } | { ok: true; raw: unknown };

export function bridgeUrl(): string {
  const env = process.env.CHAMBER_BRIDGE_URL;
  return env && env.length > 0 ? env : "http://127.0.0.1:8378";
}

export async function fetchConsoleState(fetchFn: typeof fetch = fetch): Promise<FetchConsoleStateResult> {
  try {
    const res = await fetchFn(`${bridgeUrl()}/console/state`, {
      headers: { "X-Chamber-Bridge": "1" },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return { ok: false, error: `bridge http ${res.status}` };
    return { ok: true, raw: await res.json() };
  } catch (e) {
    return { ok: false, error: `bridge unreachable: ${e instanceof Error ? e.message : String(e)}` };
  }
}
