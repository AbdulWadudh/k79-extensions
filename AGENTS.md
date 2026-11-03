# AGENTS.md

Engineering contract for **k79-extensions**. Product scope/behavior: `SPEC.md` wins. Process/quality: this file wins. Material conflict: stop and ask.

## Gate

Read **Status** in `SPEC.md`.

- **Awaiting approval:** docs only. No code, dependencies, scaffolding, or UI.
- **Approved / In progress:** follow the plan and task list.
- **Unclear:** stop and ask.

## Read Order

`SPEC.md` → `PRODUCT.md` → `AGENTS.md` → `DESIGN.md` (once it exists) → `README.md`.

Code is evidence, not authority. Change the spec before changing behavior.

## Non-Negotiables

1. **Bun only.** Use `bun`/`bunx`. Never `npm`, `yarn`, or `pnpm`. One lockfile.
2. **No secret values** in storage, logs, telemetry, fixtures, screenshots, or errors.
3. **Background service worker is the only network boundary.** UI never calls Infisical.
4. **No generic fetch message.** Only named, Zod-validated operations cross the message bus.
5. **No content scripts or `<all_urls>`** without explicit approval.
6. **Confirm destructive actions** with key, project, environment, and path.
7. **No fake completion.** Definition of Done must be met.
8. **No drive-by refactors.** Touch only what the task needs.
9. **No new dependency or Chrome permission without approval.**
10. **No UI ships without runtime inspection** at real sizes and states.

## Commands

```bash
bun install
bun run dev:infisical
bun run build:infisical
bun run zip:infisical
bun run check
bun run lint
bun run format
bun run typecheck
bun run test
bun run test:e2e

bunx vitest run path/to/file.test.ts
bunx playwright test extensions/infisical/tests/e2e/extension.spec.ts
```

Build output: `extensions/infisical/.output/chrome-mv3`.

Environment: Windows + PowerShell. Quote paths with spaces.

## Layout

```text
extensions/infisical/
  src/entrypoints/{background.ts,sidepanel/,popup/}
  src/{api,background,features,components,lib,styles,demo}/
  tests/{api,background,features,lib,e2e,live}/
packages/{shared,ui}/
docs/adr/
```

Rules:

- `packages/shared`: no React, no Infisical.
- `packages/ui`: accessible primitives + tokens, no Infisical screens.
- Extensions may import packages; never import another extension.
- Infisical code, tests, fixtures, demo data, and extension-specific UI stay in `extensions/infisical`.
- Tests mirror source under `extensions/*/tests/`; never colocate `*.test.*` in `src` or create a root `tests/` folder.
- No `utils.ts` dumping ground.

## Extension Isolation

The boundary is intentional: an extension is a self-contained product; shared packages are infrastructure, not a junk drawer.

- **If only one extension uses it, it belongs to that extension.** Example: a secret row, environment rail, Infisical DTO, or Infisical test stays in `extensions/infisical`.
- **If at least two extensions use it, it may become shared.** Example: a Button, Dialog, Field, token sheet, or generic Result helper may live in `packages/*`.
- **Boundary test:** delete the Infisical extension mentally. Any file that becomes unused does not belong in `packages/*` or at the repo root.
- **Tests are owned by their extension.** `extensions/infisical/tests/**` only. A shared test utility goes into `packages/testing` only when two extensions actually need it.
- **No cross-extension imports.** An extension may import `@k79/*` packages; packages may never import an extension.
- **No extension-specific code, tests, fixtures, screenshots, assets, strings, or secret/project names** in shared packages or at the repo root.
- Extension-specific implementation notes and surface briefs stay with the extension.

## Workflow

`SPEC → PLAN → TASKS → IMPLEMENT → VERIFY → REVIEW → COMMIT → REPORT`

- Non-trivial work: spec first, thin vertical slices, tests, runtime verification, diff review.
- Update `SPEC.md` before changing behavior, permissions, storage, or public UX.
- Architectural decision: add a short ADR in `docs/adr/`.
- If live Infisical credentials are unavailable, say mock verification and mark live verification pending.

Skills: `spec-driven-development`, `planning-and-task-breakdown`, `incremental-implementation`, `frontend-ui-engineering`, `impeccable`, `test-driven-development`, `debugging-and-error-recovery`, `security-and-hardening`, `browser`, `git-workflow-and-versioning`, `documentation-and-adrs`. Use when applicable; don't invoke for show.

## Architecture

- All HTTP in `background.ts` or `src/background/`. UI uses typed messages.
- Zod-validate every request and response. No arbitrary URL/method message.
- Service worker may die: rehydrate. Access token → `storage.session`; prefs → `storage.local`; long-lived credentials → `storage.local` only when “Remember” is on, else `storage.session`; secret values → memory only.
- Auth login is single-flight. 401 → one re-login + one retry. Never retry a mutation after an ambiguous network failure.
- TanStack Query = server state; React context = session/scope; component state = ephemeral UI. No Redux/Zustand/MobX without approval.
- Start permissions: `storage`, `sidePanel`; `host_permissions: https://*.infisical.com/*`; optional exact-origin permission for self-hosted; `minimum_chrome_version: 116`.
- No remote code or fonts. Bundle locally.
- API: default `https://us.infisical.com`; EU `https://eu.infisical.com`; self-hosted HTTPS (localhost HTTP only). Encode path segments. Normalize paths: leading `/`, root `/`, no trailing slash except root, reject `..`.
- Lists use `viewSecretValue=false`. Fetch one value only for reveal/copy/edit.
- Error codes: `unauthorized`, `forbidden`, `not_found`, `rate_limited`, `validation`, `network`, `server`, `unknown`. Honor `Retry-After` for 429; no loops.
- `approval` response means pending, not saved.

## Code

- TypeScript `strict`; no `any`; parse `unknown` at boundaries.
- Named exports except WXT entrypoints. Files `kebab-case`; components `PascalCase`; tests `*.test.ts(x)`; e2e `*.spec.ts`.
- Discriminated unions for async UI state. Avoid non-null assertions and unnecessary effects.
- Base UI: `@base-ui/react`. Vendor shadcn’s Base UI recipes into `packages/ui`. No Radix/Headless UI.
- Icons: Hugeicons only (`@hugeicons/react` + `@hugeicons/core-free-icons`). No Lucide/Heroicons/icon fonts. Icon-only buttons need `aria-label`.
- Forms: shadcn’s current React Hook Form anatomy — `useForm` + `Controller` + `zodResolver` + Base UI `Field`/`FieldLabel`/`FieldDescription`/`FieldError`/`FieldGroup`/`FieldSet`; `mode: "onTouched"`; `data-invalid` + `aria-invalid`; preserve draft on failure. No TanStack Form/Formisch unless spec changes.
- Styling: Tailwind v4 + shared tokens. No ad hoc hex. No neon glow, glassmorphism, gradient text, or cyber-vault decoration.
- Motion: 150–220 ms, state-driven, respect `prefers-reduced-motion`.
- Every control defines default, hover, focus, active, disabled, loading, error.
- Accessibility: WCAG 2.2 AA; visible focus; full keyboard path; labels; errors announced; no color-only meaning.
- Test at 360 px, 800 px, and 456 px popup. No horizontal page scroll.

## Security

**Always:** validate boundaries; keep credentials/network in background; mask by default; reveal on request; redact values; request minimum host permission.

**Ask first:** new permissions; analytics/remote logging/backend; credential storage changes; content script or broad host access; crypto/secret/network dependencies.

**Never:** commit real credentials/tokens/project IDs; persist secret values; log bodies with values; add `eval`/remote code/remote fonts; retry ambiguous mutations; bypass Infisical RBAC.

**Incident:** stop → tell user → rotate credential → remove from history if asked → add guard.

## Testing

- TDD for logic and bug fixes. Test behavior, not implementation.
- No deleted/skipped tests to get green. No snapshot-only interactive tests.
- Unit: API, auth/session, storage, paths, search, errors. Component: keyboard, reveal/copy, forms, delete, onboarding. E2E: onboarding, CRUD, 401, 403, worker restart, popup → panel. Axe on core surfaces.
- Mock at the HTTP boundary. Synthetic values only (`sk_test_synthetic_do_not_use`). No real credentials in tests.
- Coverage ≥ 80% statements/branches for `src/api`, `src/domain`, `src/background`, storage/session.
- Live smoke test is manual, never CI.

## Done

- [ ] Acceptance criteria met.
- [ ] Tests added/updated and passing.
- [ ] `bun run check`, `bun run test`, `bun run build:infisical` pass.
- [ ] Runtime surface exercised at supported sizes/states.
- [ ] No secret leakage; no new permission/dependency without approval.
- [ ] Spec/docs updated; diff has no unrelated changes.
- [ ] Commit message accurate.

Unverified is not done. Report it explicitly.

## Git

Branches: `feat/infisical-*`, `fix/infisical-*`, `docs/*`, `chore/*`.

Conventional Commits: `feat(infisical): ...`, `fix(infisical): ...`, `docs: ...`, `test(infisical): ...`, `refactor(ui): ...`, `chore: ...`.

One logical change per commit. No force-push `main`. No build output, coverage, credentials, or non-evidence screenshots.

## Report

```text
Changed: ...
Verified: ...
Not verified: ...
Risks / next: ...
```

Surface assumptions. Ask when scope, security, permissions, storage, or destructive behavior is ambiguous. Prefer the smallest complete change. Never claim a check ran if it did not.

## Pitfalls

- Building before spec approval.
- Calling Infisical from the side panel.
- Storing a secret “temporarily.”
- Retrying create/update/delete after a timeout.
- Generic modal for the main editor.
- Mixing icon sets or using deprecated Base UI imports.
- Treating 403 as “empty” or `approval` as “saved.”
- Claiming live verification without a live instance.
- Deleting failing tests.
- Refactoring unrelated code.

## References

- Infisical API: https://infisical.com/docs/api-reference/overview/introduction
- Base UI: https://base-ui.com/react/overview/quick-start
- Base UI forms: https://base-ui.com/react/handbook/forms
- shadcn RHF: https://ui.shadcn.com/docs/forms/react-hook-form
- Hugeicons: https://hugeicons.com/docs/integrations/react/quick-start
- WXT: https://wxt.dev
