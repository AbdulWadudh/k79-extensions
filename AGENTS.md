# AGENTS.md

This is the engineering contract for **k79-extensions**. It applies to AI coding agents and human contributors.

If this file conflicts with `SPEC.md`, **`SPEC.md` wins for product scope and behavior**. This file wins for process, quality, and engineering conventions. If the conflict is material, stop and ask instead of guessing.

---

## 1. Current Phase

Read the **Status** line in [`SPEC.md`](./SPEC.md) before doing anything.

- If the status says **Awaiting approval**, do not scaffold implementation code, install the app stack, or start UI work. Documentation changes are allowed.
- If the status says **Approved** or **In progress**, follow the plan and task list.
- If the status is unclear, stop and ask.

The spec gate is deliberate. Do not “helpfully” skip it.

---

## 2. Source of Truth

Read in this order:

1. [`SPEC.md`](./SPEC.md) — scope, acceptance criteria, architecture, security boundaries.
2. [`PRODUCT.md`](./PRODUCT.md) — durable product truth for Impeccable.
3. `AGENTS.md` — this file; process and quality rules.
4. `DESIGN.md` — visual system, once it exists. It is written after the first shipped surface.
5. [`README.md`](./README.md) — onboarding and quick commands.
6. Code and tests — evidence of what exists, not authority over what should exist.

Do not silently change product behavior to match existing code. Update the spec first.

---

## 3. Non-Negotiables

1. **Bun only.** Use `bun` and `bunx`. Never run `npm`, `yarn`, or `pnpm` install commands. Do not add a second lockfile.
2. **No secret values in persistent storage, logs, telemetry, or error text.**
3. **The background service worker is the only network boundary.** UI code never calls Infisical directly.
4. **No generic fetch message.** Only named, typed operations cross the extension message bus.
5. **No content scripts and no `<all_urls>` in the production manifest** without explicit approval.
6. **No destructive action without explicit confirmation** that names the key, project, environment, and path.
7. **No fake completion.** A task is done only when the Definition of Done is met.
8. **No drive-by refactors.** Touch only what the task requires.
9. **No dependency additions without approval.** The approved stack is recorded in `SPEC.md`.
10. **No UI that ships without being seen at its real sizes and states.**

---

## 4. Commands

These commands are the contract. They will be wired during the foundation task.

```bash
# Install
bun install

# Development
bun run dev:infisical

# Build
bun run build:infisical
bun run build

# Package
bun run zip:infisical
bun run zip

# Quality
bun run check
bun run lint
bun run format
bun run typecheck
bun run test
bun run test:e2e
```

Targeted verification:

```bash
# One unit test file
bunx vitest run path/to/file.test.ts

# One test name
bunx vitest run -t "normalizes the folder path"

# One Playwright spec
bunx playwright test e2e/onboarding.spec.ts

# Inspect the built manifest
Get-Content extensions/infisical/.output/chrome-mv3/manifest.json
```

The built extension lands at:

```text
extensions/infisical/.output/chrome-mv3
```

Environment: Windows + PowerShell. Use PowerShell-compatible commands. Keep paths quoted when they contain spaces.

---

## 5. Repository Map

```text
k79-extensions/
├─ extensions/
│  └─ infisical/
│     ├─ entrypoints/
│     │  ├─ background.ts
│     │  ├─ sidepanel/
│     │  └─ popup/
│     ├─ src/
│     │  ├─ api/
│     │  ├─ background/
│     │  ├─ features/
│     │  ├─ components/
│     │  ├─ lib/
│     │  ├─ styles/
│     │  └─ demo/
│     ├─ wxt.config.ts
│     └─ package.json
├─ packages/
│  ├─ shared/
│  └─ ui/
├─ e2e/
├─ docs/adr/
├─ AGENTS.md
├─ SPEC.md
├─ PRODUCT.md
└─ README.md
```

Rules:

- `packages/shared` has no React and no Infisical behavior.
- `packages/ui` has accessible primitives and tokens, not Infisical screens.
- `extensions/*` may import from packages, never from another extension.
- Infisical-specific code stays inside `extensions/infisical`.
- Do not create a `utils` dumping ground. Name modules by responsibility.

---

## 6. Working Workflow

For non-trivial work, follow this sequence:

```text
SPEC → PLAN → TASKS → IMPLEMENT → VERIFY → REVIEW → COMMIT → REPORT
```

### 6.1 Check the spec

- Confirm the requested work is in scope.
- If it changes behavior, permissions, storage, or public UX, update `SPEC.md` first.
- If it is a new architectural decision, add a short ADR under `docs/adr/`.

### 6.2 Plan and slice

- Break work into thin, verifiable vertical slices.
- Each slice should be independently testable.
- Do not write a large feature in one pass.
- Prefer working software over speculative abstractions.

### 6.3 Implement

- Read surrounding code before editing.
- Match existing naming, structure, and patterns.
- Keep changes small and reversible.
- Preserve unrelated user work.
- Do not remove code you do not understand.

### 6.4 Verify

- Run the narrowest relevant test first, then the full check.
- Exercise the real surface for UI work.
- Check loading, empty, error, forbidden, and offline states.
- Do not claim verification you did not perform.
- If a live Infisical account is unavailable, say so and distinguish mock verification from live verification.

### 6.5 Review

Before committing, review the diff for:

- correctness and edge cases;
- security and secret leakage;
- accessibility and keyboard flow;
- responsive behavior;
- error handling;
- unnecessary complexity;
- tests that actually prove behavior;
- docs/spec drift.

### 6.6 Report

State what changed, how it was verified, and what remains unverified. Do not bury limitations.

---

## 7. Skills and Tooling

Use the available skills deliberately. This is the default mapping:

| Work | Skill |
| --- | --- |
| New feature or behavior change | `spec-driven-development` |
| Breaking a spec into tasks | `planning-and-task-breakdown` |
| Incremental implementation | `incremental-implementation` |
| UI construction | `frontend-ui-engineering` + `impeccable` |
| Design review or polish | `impeccable` (`critique`, `audit`, `polish`) |
| Tests and bug fixes | `test-driven-development` |
| Something broke | `debugging-and-error-recovery` |
| Security review | `security-and-hardening` |
| Browser verification | `browser` or `browser-testing-with-devtools` |
| Performance work | `performance-optimization` |
| Commits and branches | `git-workflow-and-versioning` |
| Architecture decisions | `documentation-and-adrs` |
| Release preparation | `shipping-and-launch` |

Do not invoke a skill just to say you did. Use it when its workflow applies. If two skills conflict, prefer the one that protects correctness and user safety.

---

## 8. Architecture Rules

### 8.1 Network boundary

- All Infisical HTTP requests happen in `entrypoints/background.ts` or modules under `src/background/`.
- UI surfaces call typed message operations, not `fetch`.
- The message union must name each supported operation. Never expose `fetch(url, options)`.
- Validate request and response payloads with Zod at the boundary.
- Keep one HTTP client with consistent base URL, headers, timeout, error mapping, and retry policy.

### 8.2 Service worker lifecycle

- Chrome may terminate the service worker at any time.
- Do not keep required state only in module-level variables.
- Access tokens live in `chrome.storage.session`.
- Preferences live in `chrome.storage.local`.
- Long-lived credentials live in `chrome.storage.local` only when “Remember on this device” is enabled; otherwise use `chrome.storage.session`.
- Secret values live in memory only.
- Auth login must be single-flight.
- A 401 may trigger one re-login and one retry.
- Never retry a non-idempotent mutation after an ambiguous network failure.

### 8.3 State

- TanStack Query owns server state. There is no query persistence.
- React context owns session and selected scope.
- Component state owns ephemeral UI state.
- Do not add Redux, Zustand, MobX, or another global store without approval.
- Do not mirror query data into local state “just in case.”

### 8.4 Chrome permissions

Production manifest should start with:

```ts
permissions: ["storage", "sidePanel"]
host_permissions: ["https://*.infisical.com/*"]
optional_host_permissions: [
  "https://*/*",
  "http://localhost/*",
  "http://127.0.0.1/*",
]
minimum_chrome_version: "114"
```

- Self-hosted origins request permission for the exact configured origin from a user gesture.
- Do not add `tabs`, `activeTab`, `scripting`, `webRequest`, `cookies`, or broad host permissions unless the spec changes and the user approves.
- No remote code. No remote fonts. Bundle assets locally.
- Side panel opens only from a user gesture.

### 8.5 API behavior

- Default base URL: `https://us.infisical.com`.
- EU: `https://eu.infisical.com`.
- Self-hosted: normalized origin, HTTPS required except localhost development.
- Encode path segments with `encodeURIComponent`.
- Normalize folder paths: leading `/`, root `/`, no trailing slash except root, reject `..`.
- Use `viewSecretValue=false` for lists.
- Fetch a value only for reveal, copy, or edit hydration.
- Normalize errors into stable codes: `unauthorized`, `forbidden`, `not_found`, `rate_limited`, `validation`, `network`, `server`, `unknown`.
- Honor `Retry-After` for 429 with a bounded wait; never loop.
- Treat an `approval` response as pending, not saved.

---

## 9. TypeScript and Code Style

- `strict` mode. No `any`. Use `unknown` and parse at boundaries.
- Named exports everywhere except WXT entrypoints.
- Prefer `type` for data shapes; `interface` only for extensible contracts.
- One responsibility per module. No `utils.ts` grab bags.
- Use discriminated unions for async UI state.
- Use `satisfies` for typed lookup tables where it improves inference.
- Avoid non-null assertions. Handle absence explicitly.
- Keep functions small enough to test without mocking half the world.
- Comments explain why, not what.
- Error messages are written for the user, not copied from a stack trace.
- Never log request/response bodies that can contain secret values.

Naming:

- Files: `kebab-case.ts` / `kebab-case.tsx`.
- Components: `PascalCase`.
- Functions and variables: `camelCase`.
- Types and schemas: `PascalCase`; Zod schemas end with `Schema`.
- Constants: `SCREAMING_SNAKE_CASE` only for true constants.
- Tests: `*.test.ts` or `*.test.tsx`; e2e: `*.spec.ts`.

Formatting and linting are owned by Biome. Do not argue with the formatter.

---

## 10. React and UI Conventions

### 10.1 Primitives

- Use **Base UI** (`@base-ui/react`) for accessible interactive primitives.
- Use shadcn/ui’s **Base UI** recipes as the starting point for shared components. Vendor the generated code into `packages/ui`; do not depend on a remote registry at runtime.
- Do not import from the deprecated `@base-ui-components/react` package.
- Do not mix in Radix, Headless UI, or another primitive library.
- Icons: **Hugeicons only** (`@hugeicons/react` + `@hugeicons/core-free-icons`). Do not add Lucide, Heroicons, or icon fonts.

Example icon use:

```tsx
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon } from "@hugeicons/core-free-icons";

<HugeiconsIcon
  icon={Search01Icon}
  size={16}
  strokeWidth={1.5}
  aria-hidden="true"
/>;
```

Icon-only controls still need an accessible name:

```tsx
<button type="button" aria-label="Copy secret value">
  <HugeiconsIcon icon={Copy01Icon} size={16} aria-hidden="true" />
</button>
```

### 10.2 Forms

Follow shadcn’s current React Hook Form anatomy:

- `useForm` with `zodResolver`
- `Controller` for controlled Base UI controls
- Base UI `Field`, `FieldLabel`, `FieldDescription`, `FieldError`, `FieldGroup`, `FieldSet`
- `mode: "onTouched"`
- `data-invalid` on the field wrapper
- `aria-invalid` on the control
- Preserve the draft when submission fails
- Never echo a secret value in a validation or server error

Pattern:

```tsx
const form = useForm<SecretFormValues>({
  resolver: zodResolver(secretFormSchema),
  mode: "onTouched",
  defaultValues: { key: "", value: "", comment: "", secretPath: "/" },
});

<Controller
  name="key"
  control={form.control}
  render={({ field, fieldState }) => (
    <Field data-invalid={fieldState.invalid}>
      <FieldLabel htmlFor="secret-key">Key</FieldLabel>
      <Input {...field} id="secret-key" aria-invalid={fieldState.invalid} />
      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
    </Field>
  )}
/>;
```

Do not use TanStack Form or Formisch for this extension unless the spec changes.

### 10.3 Styling

- Tailwind CSS v4 utilities plus shared tokens.
- No ad hoc hex values in feature code. Add or use a token.
- One workhorse UI sans and one bundled monospace for secret keys/values.
- No display type in labels, buttons, or data.
- No neon glow, glassmorphism, gradient text, or “cyber vault” decoration.
- Respect `prefers-reduced-motion`.
- Every interactive component defines default, hover, focus, active, disabled, loading, and error states.

### 10.4 Accessibility

Target WCAG 2.2 AA.

- Visible focus, never clipped.
- Full keyboard path for every primary flow.
- Labels for every control; accessible names for icon-only buttons.
- Errors are announced and remain near the control.
- Do not rely on color alone.
- Minimum target size appropriate for desktop Chrome; do not make controls smaller than the rest of the panel.
- Test at 360 px and 800 px side-panel widths, plus the 380 px popup.
- No horizontal page scroll at supported widths.
- Modals are reserved for short confirmations, not primary editing flows.

---

## 11. Security Rules

### Always

- Validate every message and network boundary with Zod.
- Keep network access and credentials in the background.
- Keep secret values in memory only.
- Mask values by default; reveal only on request.
- Confirm deletes with key, project, environment, and path.
- Redact values from errors, logs, and DevTools-friendly state.
- Request the minimum host permission for a self-hosted origin.
- Prefer no telemetry. The spec does not permit it.

### Ask first

- Any new Chrome permission or host permission.
- Any analytics, crash reporting, remote logging, or backend service.
- Changing credential storage, sync, or “remember” behavior.
- Adding a content script or `<all_urls>`.
- Adding a dependency that handles secrets, crypto, or network interception.

### Never

- Commit real credentials, tokens, project IDs, or secret values.
- Store secret values in `chrome.storage`, `localStorage`, IndexedDB, cookies, or query persistence.
- Log request/response bodies that contain values.
- Add `eval`, remote scripts, or remote fonts.
- Retry a mutation after an ambiguous network failure.
- Weaken or bypass Infisical RBAC.
- Put secret values in test fixtures. Use synthetic values such as `sk_test_synthetic_do_not_use`.

### Secret incident

If a real secret is ever committed or logged:

1. Stop.
2. Do not just delete the line and continue.
3. Tell the user immediately.
4. Rotate/revoke the credential in Infisical.
5. Remove it from history if the user asks.
6. Add or improve a guard so it cannot recur.

---

## 12. Testing Rules

Use test-driven development for logic and bug fixes.

- Write the failing test first when practical.
- Test behavior, not implementation details.
- Prefer one meaningful assertion over five incidental ones.
- Do not delete or skip failing tests to get green.
- Do not add snapshot-only tests for interactive UI.
- Mock the network at the HTTP boundary, not by mocking your own API client everywhere.
- Use synthetic secret values only.
- Tests must not require real Infisical credentials.

Required levels:

- **Unit:** API client, auth/session, storage policy, path normalization, search, error mapping.
- **Component:** keyboard selection, reveal/copy, form validation, delete confirmation, onboarding fallback.
- **E2E:** onboarding, list/search/reveal/copy, create/edit/rename/delete, 401 reconnect, 403 read-only, service worker restart, popup → side panel.
- **Accessibility:** axe on onboarding, workspace, editor, popup.
- **Live smoke:** manual, against a real instance when credentials are available; never in CI.

Coverage target: at least **80% statements and branches** for `src/api`, `src/domain`, `src/background`, and storage/session logic. Do not chase coverage with trivial tests.

---

## 13. UI Quality Bar

This is an **Operate** surface. Familiarity and speed beat decoration.

Before UI work:

- Read `PRODUCT.md`.
- Run `impeccable context`.
- Follow the Impeccable direction round for a new visual world.
- Record the direction contract in the surface brief before code.
- Read `reference/craft-floor.md` immediately before editing UI.

During UI work:

- Build the real task, not a marketing shell.
- Design the states, not just the resting screen.
- Keep scope (project/environment/path) visible before reads and writes.
- Make masking, revealing, and copying feel deliberate.
- Use one accent for primary/selection, one semantic destructive color.
- Use Hugeicons consistently.
- Keep motion 150–220 ms and state-driven.

Before calling UI work done:

- Inspect at 360 px, 800 px, and the 380 px popup.
- Drive hover, focus, open, closed, loading, empty, error, and overlong-content states.
- Check keyboard-only navigation.
- Run axe and the Impeccable detector on changed targets.
- Run the finish review before shipping a new surface.
- Write `DESIGN.md` from the built result, not from the plan.

---

## 14. Git and Review

### Branches

```text
main
feat/infisical-<short-name>
fix/infisical-<short-name>
docs/<short-name>
chore/<short-name>
```

### Commits

Use Conventional Commits:

```text
feat(infisical): add universal auth connection
fix(infisical): keep draft after failed secret update
docs: update security boundaries
test(infisical): cover expired token reconnect
refactor(ui): extract field wrapper
chore: configure biome
```

- One logical change per commit.
- Commit body explains why when it is not obvious.
- Do not commit `.output`, `coverage`, `node_modules`, screenshots that are not review evidence, or any credential.
- Do not force-push `main`.

### Pull request checklist

- [ ] Scope matches the spec.
- [ ] Tests added or updated.
- [ ] `bun run check` passes.
- [ ] `bun run test` passes.
- [ ] Build succeeds.
- [ ] UI checked at supported sizes and states.
- [ ] No secret values in storage, logs, fixtures, or screenshots.
- [ ] Permissions changed only with approval.
- [ ] Docs/spec updated.
- [ ] No unrelated refactors.

---

## 15. Definition of Done

A task is done only when all applicable items are true:

- [ ] Acceptance criteria are met.
- [ ] Relevant tests fail before the fix and pass after.
- [ ] `bun run check` passes.
- [ ] `bun run test` passes.
- [ ] `bun run build:infisical` succeeds.
- [ ] The changed surface was exercised at runtime.
- [ ] Loading, empty, error, forbidden, and offline states were considered.
- [ ] Keyboard and screen-reader basics were checked.
- [ ] No secret values appear in storage, logs, fixtures, screenshots, or errors.
- [ ] No new permission or dependency was added without approval.
- [ ] Spec/docs are updated if behavior changed.
- [ ] Diff contains no drive-by changes.
- [ ] Commit message is accurate.

If an item cannot be verified, say so explicitly. “Should work” is not done.

---

## 16. Agent Behavior

- Surface assumptions before non-trivial work.
- Stop and ask when ambiguity affects security, scope, permissions, storage, or destructive behavior.
- Do not silently fill in product requirements.
- Push back on approaches with concrete downsides; propose an alternative.
- Prefer the boring, obvious solution.
- Make the smallest change that fully solves the problem.
- Do not touch files unrelated to the task.
- Do not delete unfamiliar code or comments.
- Do not claim a tool ran if it did not.
- Report blockers early.
- Keep the user’s real secrets out of the conversation.
- If you need test credentials, ask for a dedicated machine identity, never a personal token with broad access.

When reporting:

```text
Changed: ...
Verified: ...
Not verified: ...
Risks / next: ...
```

---

## 17. Common Failure Modes to Avoid

- Building before the spec is approved.
- Adding a global state library for one screen.
- Calling Infisical directly from the side panel.
- Exposing a generic fetch message.
- Storing a secret value “temporarily” in storage.
- Retrying a create/update/delete after a timeout.
- Using a modal for the main editor.
- Shipping a form without error and loading states.
- Using a new hex value instead of a token.
- Mixing icon sets.
- Using Radix or Lucide because an old shadcn example did.
- Treating a 403 as “no secrets” instead of “permission denied.”
- Treating an approval response as a saved secret.
- Claiming live verification without a live instance.
- Deleting a failing test.
- Rewriting unrelated code because it “looked messy.”

---

## 18. References

- Infisical API: https://infisical.com/docs/api-reference/overview/introduction
- Infisical authentication: https://infisical.com/docs/api-reference/overview/authentication
- Base UI: https://base-ui.com/react/overview/quick-start
- Base UI forms: https://base-ui.com/react/handbook/forms
- shadcn React Hook Form: https://ui.shadcn.com/docs/forms/react-hook-form
- shadcn Field: https://ui.shadcn.com/docs/components/base/field
- Hugeicons React: https://hugeicons.com/docs/integrations/react/quick-start
- WXT: https://wxt.dev
- Chrome side panel: https://developer.chrome.com/docs/extensions/reference/api/sidePanel
- Chrome extension security: https://developer.chrome.com/docs/extensions/develop/security-privacy/stay-secure

If an external API changes, update the spec and the client together. Do not leave a stale contract in code.
