import { QueryClient } from "@tanstack/react-query";
import { RpcClientError } from "../messaging/client";

const noRetryCodes = new Set(["unauthorized", "forbidden", "validation", "not_found"]);

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 10_000,
        retry: (count, error) => {
          if (error instanceof RpcClientError && noRetryCodes.has(error.code)) return false;
          return count < 1;
        },
      },
      mutations: {
        retry: false,
      },
    },
  });
}
