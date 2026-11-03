# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

delegated: Bun workspaces, WXT, React 19, TypeScript, Tailwind CSS v4, Base UI (`@base-ui/react`), shadcn/ui's Base UI recipes vendored into the shared UI package, Hugeicons (`@hugeicons/react` + `@hugeicons/core-free-icons`), TanStack Query, React Hook Form, Zod, Vitest, Playwright, and Biome. Forms follow shadcn's current React Hook Form anatomy: `Controller` + `Field`/`FieldLabel`/`FieldDescription`/`FieldError` + `zodResolver`. The user asked for Bun everywhere it is practical and explicitly chose Base UI, Hugeicons, and the shadcn form approach.

## Users

Developers, platform engineers, and DevOps operators who already use Infisical and keep a browser open beside their editor, terminal, or incident tooling. They usually need one of three things: confirm a value, copy a credential into another tool, or make a small correction without opening the full Infisical dashboard.

## Product Purpose

K79 Extensions is a home for small, focused Chrome extensions. The first extension, Infisical Console, brings Infisical secret management into Chrome's side panel: connect to Cloud or a self-hosted instance, choose a project/environment/path, then search, reveal, copy, create, edit, and delete shared secrets. Success means fewer context switches and fewer accidental exposures while managing secrets.

## Positioning

A fast, keyboard-first companion to Infisical that keeps the dangerous parts deliberate: values appear only when asked for, live only in memory, and destructive actions identify exactly what will be removed. It is a working surface, not a second dashboard.

## Operating Context

- Used in Chrome’s side panel or a 456 px toolbar popup, frequently beside an IDE or terminal.
- Used on trusted workstations, often for long sessions, sometimes at night.
- Users may work with Infisical Cloud (US or EU region) or a self-hosted instance.
- Projects are scoped by RBAC. A machine identity may legitimately be unable to list all projects.
- Network calls can fail because of expired tokens, revoked permissions, a sleeping service worker, or an offline machine.
- The extension is not a password manager and does not replace Infisical's audit trail or access controls.

## Capabilities and Constraints

Confirmed for the first usable slice:

- Universal Auth only: a Machine Identity Client ID + Client Secret. Infisical has deprecated token-based authentication; do not add a pasted-token fallback.
- Configurable base URL for Cloud (US/EU) and self-hosted instances.
- Project and environment selection, with a manual project-ID/environment-slug fallback when listing is forbidden.
- Shared-secret CRUD: list, search, reveal, copy, create, edit, delete.
- Folder path navigation by path, with recent paths.
- Side panel and toolbar popup both run the full workspace. The popup is the default fast surface; the side panel is optional for a larger persistent view.
- Explicit confirmation before deletion.
- No secret values in persistent storage, logs, telemetry, or error text.
- English-only UI for V1.
- Chrome 116+ on Manifest V3. Internal/unpacked distribution first.

Out of scope for V1:

- Secret version history, rollback, dynamic secrets, secret rotations, tags, personal overrides, imports, folder CRUD, bulk import/export, audit logs, sharing, SSO/OAuth, and multi-project workspaces.
- Chrome Web Store publishing and automatic updates.
- Firefox, Safari, and Edge-specific packaging.

## Brand Commitments

The user has not supplied a logo, typeface, color, or voice guideline. The working extension name is **Infisical Console**; replace it if it conflicts with an existing brand. “Infisical” must always read as the platform being connected to, not as an official endorsement.

## Evidence on Hand

No production credentials, screenshots, customer claims, or brand assets are available. Demo data used in development must be labelled synthetic and must never be presented as a real customer or a real secret.

## Product Principles

1. **The dangerous action is the deliberate action.** Mask by default, reveal on request, confirm deletion, and never auto-copy.
2. **Fast hands, safe defaults.** Keyboard paths for frequent work; no hidden mutations and no destructive single-key shortcuts.
3. **The scope is always visible.** Project, environment, and path are legible before any read or write.
4. **Fail honestly.** Expired credentials, missing permissions, and offline states are explained with the next useful action.
5. **One extension, one job.** Shared foundations stay generic; Infisical behavior stays inside its extension.

## Accessibility & Inclusion

Target WCAG 2.2 AA. The side panel must work at 320–800 px widths, respect reduced motion, preserve visible focus, label every icon-only control, and never use color alone to communicate state. Keyboard-only use is a first-class path.
