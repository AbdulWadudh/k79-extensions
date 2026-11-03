# K79 Extensions

A Bun-managed monorepo for small, focused Chrome extensions that share one design system, one build standard, and one extension-to-background messaging contract.

## Extensions

| Package | Surface | Purpose | Status |
| --- | --- | --- | --- |
| `@k79/infisical` | Side panel + toolbar popup | Browse and manage Infisical shared secrets without leaving the current tab. Working name: **Infisical Console**. | MVP |

The first extension uses **Universal Auth only**. Infisical has deprecated token-based authentication, so there is no pasted-token fallback.

## Start here

- [`SPEC.md`](./SPEC.md) — scope, architecture, security boundaries, UX, and acceptance criteria.
- [`AGENTS.md`](./AGENTS.md) — engineering contract for agents and humans.
- [`PRODUCT.md`](./PRODUCT.md) — durable product truth.
- [`DESIGN.md`](./DESIGN.md) — the shipped visual system, tokens, and component rules.
- [`tasks/plan.md`](./tasks/plan.md) — implementation plan and checkpoints.
- [`tasks/todo.md`](./tasks/todo.md) — task list.

## Stack

- **Bun 1.4** workspaces and scripts
- **WXT 0.21** for Manifest V3 builds
- **React 19 + TypeScript**
- **Tailwind CSS v4** plus shared CSS tokens
- **Base UI** primitives (`@base-ui/react`)
- **shadcn/ui Base UI recipes** vendored into `packages/ui`
- **Hugeicons** (`@hugeicons/react` + `@hugeicons/core-free-icons`)
- **TanStack Query** for server state
- **React Hook Form + Zod** using shadcn’s current form anatomy
- **Vitest + Testing Library + Playwright + axe**
- **Biome** for lint and format

## Quick start

```bash
bun install
bun run build:infisical
```

Load the unpacked extension:

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Choose **Load unpacked**.
4. Select `extensions/infisical/.output/chrome-mv3`.
5. Pin **Infisical Console** and click it. The toolbar popup is a full compact console; use the panel icon in its path row when you want the same workspace in Chrome’s side panel.

Development with hot reload:

```bash
bun run dev:infisical
```

## Commands

```bash
bun run dev:infisical
bun run build:infisical
bun run zip:infisical
bun run build
bun run zip
bun run check
bun run lint
bun run format
bun run typecheck
bun run test
bun run test:e2e
bun run test:live
bun run smoke
```

All Infisical tests live under `extensions/infisical/tests/`:

- `tests/api`, `tests/background`, `tests/features`, `tests/lib` — Vitest unit/component tests.
- `tests/e2e` — Playwright extension tests.
- `tests/live` — real-instance UI and API smoke scripts.

`bun run test:e2e` builds the extension, launches a visible Chromium window, loads the unpacked extension, checks onboarding and popup, and runs axe.

## Use it

- Folders render as rows above secrets. Click a folder to enter it; use the up control in the path bar to return.
- Click a row to open the inspector. The eye action reveals the value inline without opening the card.
- Edit and Delete sit inline beneath the key in the inspector.
- The popup runs the full console. The panel icon in its path row opens the same session in the side panel.

## Live testing

Real credentials are local-only. The repo ignores `.env`; use `.env.example` as the shape.

```dotenv
INFISICAL_CLIENT_ID=
INFISICAL_CLIENT_SECRET=
INFISICAL_BASE_URL=https://us.infisical.com
```

Nothing in `.env` is bundled into the extension. It is read only by local smoke scripts.

Full live UI pass, including onboarding and a disposable synthetic secret:

```bash
bun run test:live
```

The script creates a `K79_SYNTHETIC_SMOKE_*` secret, reveals/copies/edits/renames it, deletes it, checks extension storage for leakage, runs axe on the workspace and inspector, and captures review screenshots in `.impeccable/review/` (ignored by git). If a step fails after creation, it attempts API cleanup in `finally`.

API-only live smoke, without a browser:

```bash
bun run smoke
```

## Architecture

```text
k79-extensions/
├─ extensions/infisical/
│  ├─ src/entrypoints/       # background, side panel, popup
│  ├─ src/api/               # Infisical DTOs, client, errors
│  ├─ src/background/        # auth, storage, message handlers
│  ├─ src/features/          # connection, folders, secrets, workspace, settings
│  ├─ src/lib/               # query keys, paths, format, permissions, theme
│  ├─ src/styles/            # extension CSS entry
│  └─ tests/                 # unit, e2e, and live tests for this extension
├─ packages/shared/          # brand-agnostic helpers
└─ packages/ui/              # Base UI primitives, shadcn recipes, tokens
```

- All Infisical HTTP happens in the background service worker.
- UI surfaces call a typed, Zod-validated message union. There is no arbitrary fetch message.
- Access tokens live in `chrome.storage.session`; preferences live in `chrome.storage.local`.
- Credentials are stored in `chrome.storage.local` only when “Remember on this device” is on.
- Secret values live in memory only. Lists use `viewSecretValue=false`; values are fetched one at a time for reveal, copy, or edit.
- Self-hosted origins request an optional host permission for the exact origin.

## Security

- No secret values in persistent storage, logs, telemetry, fixtures, or screenshots.
- Deletion names the key, project, environment, and path before confirmation.
- No content scripts or `<all_urls>` permission.
- No remote code or remote fonts.
- A 403 marks the scope read-only; mutations are disabled.
- The extension never claims to bypass Infisical RBAC or audit logging.

## License

Private. Add a license before public distribution.
