import { useQuery } from "@tanstack/react-query";
import type { FolderSummary, SecretScope } from "@/api/types";
import { queryKeys } from "@/lib/query-keys";
import { rpc } from "@/messaging/client";

export function useFolders(scope: SecretScope | null, recursive = false) {
  return useQuery({
    queryKey: scope ? queryKeys.folders(scope, recursive) : ["folders", "none"],
    queryFn: () =>
      rpc<FolderSummary[]>({
        type: "folders.list",
        payload: { scope: scope as SecretScope, recursive },
      }),
    enabled: scope !== null,
  });
}
