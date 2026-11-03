import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft01Icon, Cancel01Icon, FloppyDiskIcon } from "@hugeicons/core-free-icons";
import {
  Badge,
  Button,
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  IconButton,
  Input,
  Skeleton,
  Textarea,
} from "@k79/ui";
import { type ReactNode, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import type { MutationResult, SecretDetail, SecretScope, SecretSummary } from "@/api/types";
import { ErrorBanner } from "@/components/error-banner";
import { Icon } from "@/components/icon";
import { useCreateSecret, useUpdateSecret } from "@/features/secrets/queries";
import { normalizeSecretKeyInput } from "@/lib/secret-key";
import { RpcClientError } from "@/messaging/client";

const secretFormSchema = z.object({
  key: z
    .string()
    .trim()
    .min(1, "Enter a secret key.")
    .max(255, "Secret keys must be 255 characters or fewer.")
    .refine((value) => !value.includes("/"), "Secret keys cannot contain '/'."),
  value: z.string().min(1, "Enter a secret value."),
  comment: z.string().max(2_000, "Comments must be 2,000 characters or fewer."),
});

type SecretFormValues = z.infer<typeof secretFormSchema>;

export function SecretEditor({
  mode,
  scope,
  projectName,
  environment,
  secret,
  detail,
  detailLoading,
  onClose,
  onSaved,
  onForbidden,
  readOnly,
}: {
  mode: "create" | "edit";
  scope: SecretScope;
  projectName?: string;
  environment: string;
  secret?: SecretSummary;
  detail?: SecretDetail;
  detailLoading?: boolean;
  onClose: () => void;
  onSaved: (result: MutationResult) => void;
  onForbidden: () => void;
  readOnly: boolean;
}) {
  const create = useCreateSecret(scope);
  const update = useUpdateSecret(scope, secret?.key ?? "");
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<SecretFormValues>({
    resolver: zodResolver(secretFormSchema),
    mode: "onTouched",
    defaultValues: {
      key: detail?.key ?? "",
      value: detail?.value ?? "",
      comment: detail?.comment ?? "",
    },
  });

  const busy = create.isPending || update.isPending;
  const isEditing = mode === "edit";
  const keyChanged = isEditing && detail ? form.watch("key").trim() !== detail.key : false;

  async function submit(values: SecretFormValues) {
    setFormError(null);
    try {
      const result = isEditing
        ? await update.mutateAsync({
            name: detail?.key ?? secret?.key ?? "",
            newName: values.key.trim(),
            value: values.value,
            comment: values.comment,
          })
        : await create.mutateAsync({
            name: values.key.trim(),
            value: values.value,
            comment: values.comment,
          });
      onSaved(result);
    } catch (error) {
      if (error instanceof RpcClientError && error.code === "forbidden") onForbidden();
      setFormError(error instanceof Error ? error.message : "Could not save this secret.");
    }
  }

  if (detailLoading) {
    return (
      <div className="flex h-full min-h-0 flex-col bg-surface">
        <EditorBar title="Loading secret" onClose={onClose} />
        <div className="grid gap-4 p-4" role="status" aria-busy="true" aria-label="Loading secret">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-surface">
      <EditorBar
        title={isEditing ? "Edit secret" : "New secret"}
        onClose={onClose}
        meta={
          <span className="truncate font-mono text-[10px] text-muted">
            {projectName ?? scope.projectId} / {environment} / {scope.secretPath}
          </span>
        }
      />

      <div className="min-h-0 flex-1 overflow-y-auto">
        <form
          id="secret-editor-form"
          className="grid gap-5 p-4"
          onSubmit={form.handleSubmit(submit)}
          noValidate
        >
          {readOnly ? (
            <div className="rounded-sm border border-warning/35 bg-warning-soft px-3 py-2.5 text-[11px] leading-4 text-warning">
              This identity can read this scope but cannot change it.
            </div>
          ) : null}

          <Controller
            name="key"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field name={field.name} invalid={fieldState.invalid} dirty={fieldState.isDirty}>
                <FieldLabel htmlFor="secret-key">Key</FieldLabel>
                <Input
                  {...field}
                  id="secret-key"
                  autoComplete="off"
                  spellCheck={false}
                  autoCapitalize="characters"
                  className="font-mono"
                  placeholder="STRIPE_SECRET_KEY"
                  aria-invalid={fieldState.invalid}
                  disabled={readOnly}
                  onChange={(event) => field.onChange(normalizeSecretKeyInput(event.target.value))}
                />
                {keyChanged ? (
                  <FieldDescription>
                    Renaming the key moves this entry. The old key will no longer resolve.
                  </FieldDescription>
                ) : (
                  <FieldDescription>
                    No slashes. Keys are normalized to UPPERCASE for Infisical projects that require
                    it.
                  </FieldDescription>
                )}
                {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
              </Field>
            )}
          />

          <Controller
            name="value"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field name={field.name} invalid={fieldState.invalid} dirty={fieldState.isDirty}>
                <div className="flex items-center justify-between gap-2">
                  <FieldLabel htmlFor="secret-value">Value</FieldLabel>
                  <Badge tone={isEditing ? "accent" : "neutral"}>
                    {isEditing ? "Existing" : "New"}
                  </Badge>
                </div>
                <Textarea
                  {...field}
                  id="secret-value"
                  rows={7}
                  autoComplete="off"
                  spellCheck={false}
                  className="min-h-36 font-mono text-[12px]"
                  placeholder="Paste the secret value"
                  aria-invalid={fieldState.invalid}
                  disabled={readOnly}
                />
                <FieldDescription>
                  Sent directly to Infisical. Never stored by this extension.
                </FieldDescription>
                {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
              </Field>
            )}
          />

          <Controller
            name="comment"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field name={field.name} invalid={fieldState.invalid} dirty={fieldState.isDirty}>
                <FieldLabel htmlFor="secret-comment">Comment</FieldLabel>
                <Textarea
                  {...field}
                  id="secret-comment"
                  rows={3}
                  className="min-h-20"
                  placeholder="Optional context for teammates"
                  aria-invalid={fieldState.invalid}
                  disabled={readOnly}
                />
                {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
              </Field>
            )}
          />

          {formError ? <ErrorBanner title="Could not save" message={formError} /> : null}
        </form>
      </div>

      <div className="flex shrink-0 items-center justify-end gap-2 border-t border-line bg-surface p-3">
        <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button
          type="submit"
          form="secret-editor-form"
          variant="primary"
          size="sm"
          loading={busy}
          disabled={readOnly}
        >
          <Icon icon={FloppyDiskIcon} size={14} />
          {isEditing ? "Save changes" : "Create secret"}
        </Button>
      </div>
    </div>
  );
}

function EditorBar({
  title,
  meta,
  onClose,
}: {
  title: string;
  meta?: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="flex h-11 shrink-0 items-center gap-2 border-b border-line px-2">
      <IconButton label="Back" onClick={onClose} className="min-[700px]:hidden">
        <Icon icon={ArrowLeft01Icon} size={15} />
      </IconButton>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[12px] font-semibold text-ink">{title}</div>
        {meta}
      </div>
      <IconButton label="Close editor" onClick={onClose}>
        <Icon icon={Cancel01Icon} size={15} />
      </IconButton>
    </div>
  );
}
