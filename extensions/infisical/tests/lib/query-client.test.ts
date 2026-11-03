import { describe, expect, it } from "vitest";
import { createQueryClient } from "@/lib/query-client";
import { RpcClientError } from "@/messaging/client";

type Retry = (failureCount: number, error: unknown) => boolean;

describe("query client policy", () => {
  it("does not retry authorization or validation failures", () => {
    const client = createQueryClient();
    const retry = client.getDefaultOptions().queries?.retry as Retry;

    expect(retry(0, new RpcClientError({ code: "unauthorized", message: "expired" }))).toBe(false);
    expect(retry(0, new RpcClientError({ code: "forbidden", message: "no access" }))).toBe(false);
    expect(retry(0, new RpcClientError({ code: "validation", message: "bad" }))).toBe(false);
  });

  it("retries a transient failure once", () => {
    const client = createQueryClient();
    const retry = client.getDefaultOptions().queries?.retry as Retry;

    expect(retry(0, new Error("network"))).toBe(true);
    expect(retry(1, new Error("network"))).toBe(false);
  });

  it("never retries mutations", () => {
    const client = createQueryClient();
    expect(client.getDefaultOptions().mutations?.retry).toBe(false);
  });
});
