import type { RpcError, RpcRequest, RpcResponse } from "./protocol";

export class RpcClientError extends Error {
  readonly code: RpcError["code"];
  readonly status?: number;

  constructor(error: RpcError) {
    super(error.message);
    this.name = "RpcClientError";
    this.code = error.code;
    this.status = error.status;
  }
}

export async function rpc<T>(request: RpcRequest): Promise<T> {
  let response: RpcResponse<T>;

  try {
    response = (await chrome.runtime.sendMessage(request)) as RpcResponse<T>;
  } catch {
    throw new RpcClientError({
      code: "unknown",
      message: "The extension background worker did not respond. Reload the panel and try again.",
    });
  }

  if (!response || typeof response !== "object" || !("ok" in response)) {
    throw new RpcClientError({
      code: "unknown",
      message: "The extension returned an invalid response.",
    });
  }

  if (!response.ok) throw new RpcClientError(response.error);
  return response.data;
}
