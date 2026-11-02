# K79 Extensions

A Bun-managed monorepo for small, focused Chrome extensions that share one design system, one build standard, and one extension-to-background messaging contract.

> **Status: specification.** The repository is initialized. Implementation starts after [`SPEC.md`](./SPEC.md) is approved.

## Extensions

| Package | Surface | Purpose | Status |
| --- | --- | --- | --- |
| `@k79/infisical` | Side panel + toolbar popup | Browse and manage Infisical secrets without leaving the current tab. Working name: **Infisical Console**. | Spec |

## Start here

- [`SPEC.md`](./SPEC.md) — scope, architecture, security boundaries, UX, and acceptance criteria.
- [`AGENTS.md`](./AGENTS.md) — engineering contract: workflow, architecture rules, UI standards, security, testing, git, and Definition of Done.
- [`PRODUCT.md`](./PRODUCT.md) — durable product truth for Impeccable.
- `DESIGN.md` — created after the first shipped surface, from the built design, as required by the Impeccable workflow.

## Planned stack

- **Bun 1.4+** workspaces and scripts
- **WXT** for Manifest V3 extension builds
- **React 19 + TypeScript**
- **Tailwind CSS v4** plus shared CSS tokens
- **Base UI** primitives (`@base-ui/react`), with shadcn/ui's Base UI recipes vendored into `packages/ui`
- **Hugeicons** (`@hugeicons/react` + `@hugeicons/core-free-icons`), no mixed icon sets
- **TanStack Query** for server state
- **React Hook Form + Zod** using shadcn's current form anatomy: `Controller`, `Field`, `FieldLabel`, `FieldDescription`, `FieldError`, `zodResolver`
- **Vitest + Testing Library + Playwright**
- **Biome** for linting and formatting

## Planned layout

```text
k79-extensions/
├─ extensions/
│  └─ infisical/          # First extension; contains only Infisical-specific code
├─ packages/
│  ├─ shared/             # Brand-agnostic types, result/error helpers, messaging base
│  └─ ui/                 # Shared accessible primitives, tokens, and interaction patterns
├─ e2e/                   # Browser-level extension tests
├─ docs/                  # ADRs and live-test notes
├─ PRODUCT.md
├─ SPEC.md
└─ package.json
```

## Commands

The commands below are the contract. They are wired up during implementation.

```bash
bun install
bun run dev:infisical
bun run build:infisical
bun run zip:infisical
bun run check
bun run test
bun run test:e2e
```

## Security posture

- Secret values are fetched on demand and held in memory only. They are never written to extension storage, logs, analytics, or crash reports.
- Network calls live in the background service worker, not in UI components.
- The extension never exposes a generic “fetch any URL” message. Only known Infisical operations are callable.
- Infisical Cloud origins are declared; self-hosted origins use an explicit optional host-permission grant.
- Deleting a secret requires an explicit confirmation showing its key, project, environment, and path.

## License

Private. Add a license before public distribution.
