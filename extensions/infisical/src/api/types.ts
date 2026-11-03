import { z } from "zod";
import { tryNormalizeSecretPath } from "../lib/path";

const secretPathSchema = z
  .string()
  .trim()
  .default("/")
  .superRefine((value, ctx) => {
    if (!tryNormalizeSecretPath(value)) {
      ctx.addIssue({
        code: "custom",
        message: "Secret paths cannot contain '.' or '..' segments.",
      });
    }
  })
  .transform((value) => tryNormalizeSecretPath(value) ?? "/");

export const secretScopeSchema = z.object({
  projectId: z.string().trim().min(1, "Choose a project."),
  environment: z.string().trim().min(1, "Choose an environment."),
  secretPath: secretPathSchema,
});

export type SecretScope = z.infer<typeof secretScopeSchema>;

export const secretNameSchema = z
  .string()
  .trim()
  .min(1, "Enter a secret key.")
  .max(255, "Secret keys must be 255 characters or fewer.")
  .refine((value) => !value.includes("/"), "Secret keys cannot contain '/'.");

export const environmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
});

export const projectSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  environments: z.array(environmentSchema).default([]),
});

export const projectListResponseSchema = z.object({
  projects: z.array(projectSchema).default([]),
});

export const folderDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
  relativePath: z.string().optional(),
});

export const folderListResponseSchema = z.object({
  folders: z.array(folderDtoSchema).default([]),
});

export const secretDtoSchema = z.object({
  id: z.string(),
  secretKey: z.string(),
  secretValue: z.string().optional().default(""),
  secretComment: z.string().optional().default(""),
  version: z.number().int().nonnegative().optional().default(1),
  secretPath: z.string().optional().default("/"),
  updatedAt: z.string().optional(),
  createdAt: z.string().optional(),
  tags: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        slug: z.string(),
        color: z.string().nullable().optional(),
      }),
    )
    .optional()
    .default([]),
});

export const secretListResponseSchema = z.object({
  secrets: z.array(secretDtoSchema).default([]),
});

export const secretResponseSchema = z.object({
  secret: secretDtoSchema,
});

export const approvalResponseSchema = z.object({
  approval: z.record(z.string(), z.unknown()),
});

export const authResponseSchema = z.object({
  accessToken: z.string(),
  expiresIn: z.number().nonnegative(),
  tokenType: z.string().optional(),
});

export type Environment = z.infer<typeof environmentSchema>;
export type Project = z.infer<typeof projectSchema>;
export type FolderDto = z.infer<typeof folderDtoSchema>;
export type SecretDto = z.infer<typeof secretDtoSchema>;

export type FolderSummary = {
  id: string;
  name: string;
  path: string;
};

export type SecretSummary = {
  id: string;
  key: string;
  path: string;
  comment: string;
  version: number;
  updatedAt?: string;
  tags: Array<{ id: string; name: string; slug: string; color?: string | null }>;
};

export type SecretDetail = SecretSummary & {
  value: string;
};

export type MutationResult =
  | { status: "saved"; secret: SecretDetail }
  | { status: "pending"; message: string };

export function toFolderSummary(dto: FolderDto, basePath: string): FolderSummary {
  const candidate = dto.relativePath?.trim()
    ? dto.relativePath
    : `${basePath}/${dto.name}`.replace(/\/+/g, "/");
  return {
    id: dto.id,
    name: dto.name,
    path: tryNormalizeSecretPath(candidate) ?? `${basePath}/${dto.name}`.replace(/\/+/g, "/"),
  };
}

export function toSecretSummary(dto: SecretDto): SecretSummary {
  return {
    id: dto.id,
    key: dto.secretKey,
    path: dto.secretPath || "/",
    comment: dto.secretComment,
    version: dto.version,
    updatedAt: dto.updatedAt,
    tags: dto.tags,
  };
}

export function toSecretDetail(dto: SecretDto): SecretDetail {
  return {
    ...toSecretSummary(dto),
    value: dto.secretValue ?? "",
  };
}
