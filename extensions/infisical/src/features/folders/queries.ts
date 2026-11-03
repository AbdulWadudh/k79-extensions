import { useQuery } from "@tanstack/react-query";
import type { FolderSummary, SecretScope } from "@/api/types";
import { queryKeys } from "@/lib/query-keys";
import { rpc } from "@/messaging/client";

export function useFolders(scope: SecretScope | null) {
  return useQuery({
    queryKey: scope ? queryKeys.folders(scope) : ["folders", "none"],
    queryFn: () =>
      rpc<FolderSummary[]>({
        type: "folders.list",
        payload: { scope: scope as SecretScope },
      }),
    enabled: scope !== null,
  });
}
