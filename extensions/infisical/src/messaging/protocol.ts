import { z } from "zod";
import { type Project, secretNameSchema, secretScopeSchema } from "../api/types";

export const themePreferenceSchema = z.enum(["system", "light", "dark"]);
export type ThemePreference = z.infer<typeof themePreferenceSchema>;

export const connectInputSchema = z.object({
  baseUrl: z.string().trim().min(1),
  clientId: z.string().trim().min(1),
  clientSecret: z.string().min(1),
  rememberCredentials: z.boolean().default(false),
});

export const secretInputSchema = z.object({
  name: secretNameSchema,
  value: z.string(),
  comment: z.string().max(2_000).default(""),
});

export const secretUpdateInputSchema = secretInputSchema.extend({
  newName: secretNameSchema.optional(),
});

export const rpcRequestSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("connection.status") }),
  z.object({ type: z.literal("connection.connect"), payload: connectInputSchema }),
  z.object({ type: z.literal("connection.disconnect") }),
  z.object({
    type: z.literal("connection.setRemember"),
    payload: z.object({ remember: z.boolean() }),
  }),
  z.object({ type: z.literal("projects.list") }),
  z.object({ type: z.literal("scope.set"), payload: z.object({ scope: secretScopeSchema }) }),
  z.object({
    type: z.literal("prefs.setTheme"),
    payload: z.object({ theme: themePreferenceSchema }),
  }),
  z.object({ type: z.literal("secrets.list"), payload: z.object({ scope: secretScopeSchema }) }),
  z.object({
    type: z.literal("secrets.get"),
    payload: z.object({ scope: secretScopeSchema, name: secretNameSchema }),
  }),
  z.object({
    type: z.literal("secrets.create"),
    payload: z.object({ scope: secretScopeSchema, input: secretInputSchema }),
  }),
  z.object({
    type: z.literal("secrets.update"),
    payload: z.object({
      scope: secretScopeSchema,
      name: secretNameSchema,
      input: secretUpdateInputSchema,
    }),
  }),
  z.object({
    type: z.literal("secrets.delete"),
    payload: z.object({ scope: secretScopeSchema, name: secretNameSchema }),
  }),
]);

export type RpcRequest = z.infer<typeof rpcRequestSchema>;
export type ConnectInput = z.infer<typeof connectInputSchema>;
export type SecretInput = z.infer<typeof secretInputSchema>;
export type SecretUpdateInput = z.infer<typeof secretUpdateInputSchema>;

export type ConnectionStatus = {
  connected: boolean;
  hasCredentials: boolean;
  baseUrl: string;
  projectId?: string;
  environment?: string;
  secretPath: string;
  rememberCredentials: boolean;
  theme: ThemePreference;
  canListProjects: boolean;
  recentPaths: string[];
  recentSecrets: Array<{ key: string; path: string }>;
};

export type RpcErrorCode =
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "rate_limited"
  | "validation"
  | "network"
  | "server"
  | "unknown";

export type RpcError = {
  code: RpcErrorCode;
  message: string;
  status?: number;
};

export type RpcResponse<T> = { ok: true; data: T } | { ok: false; error: RpcError };

export type ConnectResult = {
  status: ConnectionStatus;
  projects: Project[];
  canListProjects: boolean;
};
