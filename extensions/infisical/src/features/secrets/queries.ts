import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { MutationResult, SecretDetail, SecretScope, SecretSummary } from "@/api/types";
import { queryKeys } from "@/lib/query-keys";
import { rpc } from "@/messaging/client";
import type { SecretInput, SecretUpdateInput } from "@/messaging/protocol";

export function useSecrets(scope: SecretScope | null) {
  return useQuery({
    queryKey: scope ? queryKeys.secrets(scope) : ["secrets", "none"],
    queryFn: () =>
      rpc<SecretSummary[]>({ type: "secrets.list", payload: { scope: scope as SecretScope } }),
    enabled: scope !== null,
  });
}

export function useSecretDetail(scope: SecretScope | null, name: string | null, enabled: boolean) {
  return useQuery({
    queryKey: scope && name ? queryKeys.secret(scope, name) : ["secret", "none"],
    queryFn: () =>
      rpc<SecretDetail>({
        type: "secrets.get",
        payload: { scope: scope as SecretScope, name: name as string },
      }),
    enabled: enabled && scope !== null && name !== null,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: 0,
  });
}

export function useCreateSecret(scope: SecretScope | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SecretInput) => {
      if (!scope) throw new Error("Choose a scope first.");
      return rpc<MutationResult>({ type: "secrets.create", payload: { scope, input } });
    },
    onSuccess: () => {
      if (scope) void queryClient.invalidateQueries({ queryKey: queryKeys.secrets(scope) });
    },
  });
}

export function useUpdateSecret(scope: SecretScope | null, name: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SecretUpdateInput) => {
      if (!scope) throw new Error("Choose a scope first.");
      return rpc<MutationResult>({ type: "secrets.update", payload: { scope, name, input } });
    },
    onSuccess: () => {
      if (scope) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.secrets(scope) });
        void queryClient.removeQueries({ queryKey: queryKeys.secret(scope, name) });
        if (scope) void queryClient.removeQueries({ queryKey: ["secret"] });
      }
    },
  });
}

export function useDeleteSecret(scope: SecretScope | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => {
      if (!scope) throw new Error("Choose a scope first.");
      return rpc<MutationResult>({ type: "secrets.delete", payload: { scope, name } });
    },
    onSuccess: () => {
      if (scope) void queryClient.invalidateQueries({ queryKey: queryKeys.secrets(scope) });
    },
  });
}
