# Implementation Plan: Infisical Console

## Overview

Build the first extension in the k79-extensions monorepo: a Manifest V3 Chrome side panel that connects to Infisical with Universal Auth, chooses a project/environment/path, and performs shared-secret CRUD. Ship a thin toolbar popup for status and quick access.

## Architecture Decisions

- Bun workspaces; WXT builds the extension; React 19 + TypeScript + Tailwind v4.
- Base UI primitives, with shadcn Base UI recipes vendored into `packages/ui`; Hugeicons only.
- React Hook Form + Zod using shadcn's current `Controller` + `Field` anatomy.
- Background service worker owns all network access, credentials, and token refresh.
- UI communicates through a typed, Zod-validated message union. No generic fetch.
- Secret values stay in memory. Lists use `viewSecretValue=false`.
- Real credentials are used only from local `.env` during smoke testing; they are never bundled into the extension.
- Demo mode is dev-only, synthetic, and useful for Playwright/visual review.

## Task List

### Phase 1: Foundation

- [x] Task 1: Scaffold Bun workspace, WXT extension, TypeScript, Biome, shared packages, Tailwind tokens.
- [x] Task 2: Add the typed message boundary, storage policy, and Infisical HTTP client.
- [x] Task 3: Build connection onboarding with Universal Auth and project/environment discovery.

### Checkpoint: Foundation

- [x] `bun run check` passes.
- [x] `bun run build:infisical` emits a loadable `chrome-mv3` build.
- [x] Live Universal Auth login succeeds against the configured instance.

### Phase 2: Core Workspace

- [x] Task 4: Build the side-panel shell, scope header, path bar, search, and secret list.
- [x] Task 5: Add reveal, copy, conceal-all, and the secret inspector.
- [x] Task 6: Add create, edit/rename, and delete flows with confirmation and draft preservation.

### Checkpoint: Core Workspace

- [x] The full CRUD flow works against the real instance.
- [x] Values never enter persistent storage or logs.
- [x] Empty/loading/error/forbidden states are present.

### Phase 3: Popup and Polish

- [x] Task 7: Build the popup quick slip and open-side-panel action.
- [x] Task 8: Add responsive layouts, keyboard map, accessibility, reduced motion, and the Impeccable review pass.
- [x] Task 9: Add unit/component tests under `extensions/infisical/tests`, live smoke scripts, and docs.

### Checkpoint: Complete

- [x] `bun run check`, `bun run test`, `bun run build:infisical` pass.
- [x] Live smoke test completes against the configured Infisical instance.
- [x] UI inspected at 360 px, 800 px, and 380 px popup.
- [x] No secrets in git, storage, logs, fixtures, or screenshots.

## Risks and Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Project list forbidden for identity | Onboarding dead-end | Manual project ID / environment slug fallback. |
| Service worker sleeps | Lost session | Rehydrate from storage.session; single-flight login. |
| WXT/Tailwind v4 integration drift | Build failure | Verify build immediately after scaffold; keep config minimal. |
| Secret leakage | Critical | Central redaction, no body logging, storage tests. |
| Base UI + RHF wiring | Form bugs | Use shadcn Field anatomy and test validation. |
| Real instance lacks test data | Can't verify CRUD | Create a disposable synthetic secret in the test project, then delete it. |

## Open Questions

- Distribution remains internal/unpacked for V1.
- Extension name remains “Infisical Console” as a working name.
- Clipboard auto-clear is deferred.
