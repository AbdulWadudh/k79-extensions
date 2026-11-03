import { Field as BaseField } from "@base-ui/react/field";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "../lib/cn";

export function Field({ className, ...props }: ComponentProps<typeof BaseField.Root>) {
  return <BaseField.Root className={cn("grid gap-1.5", className)} {...props} />;
}

export function FieldLabel({ className, ...props }: ComponentProps<typeof BaseField.Label>) {
  return (
    <BaseField.Label
      className={cn(
        "text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-soft",
        className,
      )}
      {...props}
    />
  );
}

export function FieldDescription({
  className,
  ...props
}: ComponentProps<typeof BaseField.Description>) {
  return (
    <BaseField.Description
      className={cn("text-[11px] leading-4 text-muted", className)}
      {...props}
    />
  );
}

export function FieldError({
  className,
  errors,
  children,
  ...props
}: Omit<ComponentProps<typeof BaseField.Error>, "children"> & {
  errors?: Array<{ message?: string } | undefined>;
  children?: ReactNode;
}) {
  const message = children ?? errors?.find((error) => error?.message)?.message;
  if (!message) return null;

  return (
    <BaseField.Error
      match
      role="alert"
      className={cn("flex items-start gap-1.5 text-[11px] leading-4 text-danger", className)}
      {...props}
    >
      {message}
    </BaseField.Error>
  );
}

export function FieldGroup({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("grid gap-4", className)} {...props} />;
}

export function FieldSet({ className, ...props }: ComponentProps<"fieldset">) {
  return <fieldset className={cn("m-0 grid gap-4 border-0 p-0", className)} {...props} />;
}

export function FieldLegend({ className, ...props }: ComponentProps<"legend">) {
  return (
    <legend
      className={cn(
        "mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted",
        className,
      )}
      {...props}
    />
  );
}

export function FieldContent({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("grid gap-1", className)} {...props} />;
}

export function FieldTitle({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("text-[13px] font-medium text-ink", className)} {...props} />;
}
