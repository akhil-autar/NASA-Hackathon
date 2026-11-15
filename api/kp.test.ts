import { afterEach, describe, expect, it, vi } from "vitest";
import handler from "./kp";

function fakeRes() {
  const out: { code?: number; body?: any; headers: Record<string, string> } = { headers: {} };
  const res = {
    status(c: number) {
      out.code = c;
      return res;
    },
    setHeader(n: string, v: string) {
      out.headers[n] = v;
    },
    json(b: unknown) {
      out.body = b;
    },
  };
  return { res, out };
}

afterEach(() => vi.unstubAllGlobals());

describe("/api/kp", () => {
  it("asks GFZ for the flare day + 3 days and returns the highest Kp", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        meta: { source: "GFZ Potsdam", license: "CC BY 4.0" },
        datetime: ["2017-09-07T21:00:00Z", "2017-09-08T00:00:00Z", "2017-09-08T12:00:00Z"],
        Kp: [7.667, 8.333, 7.0],
        status: ["def", "def", "def"],
      }),
    }));
    vi.stubGlobal("fetch", fetchMock);
    const { res, out } = fakeRes();
    await handler({ query: { date: "2017-09-06" } }, res);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://kp.gfz.de/app/json/?start=2017-09-06T00:00:00Z&end=2017-09-09T23:59:59Z&index=Kp",
      expect.anything(),
    );
    expect(out.code).toBe(200);
    expect(out.body).toMatchObject({ available: true, maxKp: 8.333, maxTime: "2017-09-08T00:00:00Z", status: "def" });
    expect(out.headers["Cache-Control"]).toContain("s-maxage=2592000");
  });

  it("says when GFZ has no readings yet", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ datetime: [], Kp: [] }) })));
    const { res, out } = fakeRes();
    await handler({ query: { date: "2024-05-10" } }, res);
    expect(out.body.available).toBe(false);
  });

  it("rejects bad dates and reports GFZ being down", async () => {
    const a = fakeRes();
    await handler({ query: { date: "nonsense" } }, a.res);
    expect(a.out.code).toBe(400);
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 503 })));
    const b = fakeRes();
    await handler({ query: { date: "2024-05-10" } }, b.res);
    expect(b.out.code).toBe(502);
  });
});
