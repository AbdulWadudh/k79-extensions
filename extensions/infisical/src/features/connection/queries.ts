import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Project, SecretScope } from "@/api/types";
import { queryKeys } from "@/lib/query-keys";
import { rpc } from "@/messaging/client";
import type {
  ConnectInput,
  ConnectionStatus,
  ConnectResult,
  ThemePreference,
} from "@/messaging/protocol";

export function useConnectionStatus() {
  return useQuery({
    queryKey: queryKeys.status,
    queryFn: () => rpc<ConnectionStatus>({ type: "connection.status" }),
  });
}

export function useProjects(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.projects,
    queryFn: () => rpc<Project[]>({ type: "projects.list" }),
    enabled,
  });
}

export function useConnect() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ConnectInput) =>
      rpc<ConnectResult>({ type: "connection.connect", payload: input }),
    onSuccess: (result) => {
      queryClient.setQueryData(queryKeys.projects, result.projects);
    },
  });
}

export function useSetScope() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (scope: SecretScope) =>
      rpc<ConnectionStatus>({ type: "scope.set", payload: { scope } }),
    onSuccess: (status, scope) => {
      queryClient.setQueryData(queryKeys.status, status);
      void queryClient.invalidateQueries({ queryKey: queryKeys.secrets(scope) });
    },
  });
}

export function useSetTheme() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (theme: ThemePreference) =>
      rpc<ConnectionStatus>({ type: "prefs.setTheme", payload: { theme } }),
    onSuccess: (status) => {
      queryClient.setQueryData(queryKeys.status, status);
    },
  });
}

export function useSetRemember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (remember: boolean) =>
      rpc<ConnectionStatus>({ type: "connection.setRemember", payload: { remember } }),
    onSuccess: (status) => {
      queryClient.setQueryData(queryKeys.status, status);
    },
  });
}

export function useDisconnect() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => rpc<ConnectionStatus>({ type: "connection.disconnect" }),
    onSuccess: (status) => {
      queryClient.setQueryData(queryKeys.status, status);
      queryClient.removeQueries({ queryKey: queryKeys.projects });
      queryClient.removeQueries({ queryKey: ["secrets"] });
      queryClient.removeQueries({ queryKey: ["secret"] });
    },
  });
}
