import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { bridgeUrl, fetchConsoleState } from "./console";

let previousBridgeUrl: string | undefined;

beforeEach(() => {
  previousBridgeUrl = process.env.CHAMBER_BRIDGE_URL;
  delete process.env.CHAMBER_BRIDGE_URL;
});

afterEach(() => {
  if (previousBridgeUrl === undefined) {
    delete process.env.CHAMBER_BRIDGE_URL;
  } else {
    process.env.CHAMBER_BRIDGE_URL = previousBridgeUrl;
  }
});

function jsonResponse(body: unknown, ok = true, status = 200) {
  return { ok, status, json: async () => body } as Response;
}

describe("fetchConsoleState", () => {
  test("resolves { ok: true, raw } from a fake fetch returning 200 JSON, never touching a live bridge [req:1.1] [req:1.3] [req:4.1]", async () => {
    const raw = { ts: "now", optimalNext: "hold", decisions: [], repos: {} };
    const fakeFetch = vi.fn(async () => jsonResponse(raw));

    const result = await fetchConsoleState(fakeFetch as unknown as typeof fetch);

    expect(result).toEqual({ ok: true, raw });
    expect(fakeFetch).toHaveBeenCalledTimes(1);
  });

  test("resolves { ok: false, error: 'bridge http NNN' } for a fake fetch returning non-200 [req:1.3] [req:4.1]", async () => {
    const fakeFetch = vi.fn(async () => jsonResponse({}, false, 503));

    const result = await fetchConsoleState(fakeFetch as unknown as typeof fetch);

    expect(result).toEqual({ ok: false, error: "bridge http 503" });
  });

  test("resolves { ok: false } with a 'bridge unreachable' prefix when the fake fetch throws [req:1.3] [req:4.1]", async () => {
    const fakeFetch = vi.fn(async () => {
      throw new Error("connect ECONNREFUSED");
    });

    const result = await fetchConsoleState(fakeFetch as unknown as typeof fetch);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.startsWith("bridge unreachable")).toBe(true);
    expect(result.error).toContain("connect ECONNREFUSED");
  });

  test("calls the fake fetch with the /console/state URL and X-Chamber-Bridge header set to 1 against the default bridge URL [req:1.1] [req:1.2] [req:4.1]", async () => {
    const fakeFetch = vi.fn<typeof fetch>(async () => jsonResponse({}));

    await fetchConsoleState(fakeFetch as unknown as typeof fetch);

    expect(fakeFetch).toHaveBeenCalledTimes(1);
    const [url, init] = fakeFetch.mock.calls[0];
    expect(url).toBe("http://127.0.0.1:8378/console/state");
    expect((init as RequestInit).headers).toMatchObject({ "X-Chamber-Bridge": "1" });
  });

  test("uses CHAMBER_BRIDGE_URL as the bridge base URL when set [req:1.2] [req:4.1]", async () => {
    process.env.CHAMBER_BRIDGE_URL = "http://example.internal:9000";
    const fakeFetch = vi.fn<typeof fetch>(async () => jsonResponse({}));

    await fetchConsoleState(fakeFetch as unknown as typeof fetch);

    const [url] = fakeFetch.mock.calls[0];
    expect(url).toBe("http://example.internal:9000/console/state");
  });
});

describe("bridgeUrl", () => {
  test("defaults to http://127.0.0.1:8378 when CHAMBER_BRIDGE_URL is unset [req:1.2]", () => {
    expect(bridgeUrl()).toBe("http://127.0.0.1:8378");
  });

  test("honors CHAMBER_BRIDGE_URL when set [req:1.2]", () => {
    process.env.CHAMBER_BRIDGE_URL = "http://example.internal:9000";
    expect(bridgeUrl()).toBe("http://example.internal:9000");
  });
});
