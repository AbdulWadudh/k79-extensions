# Spec: K79 Extensions + Infisical Console

**Status:** Implemented — first usable slice (2026-11-03). Live UI and API smoke tests pass against the configured Universal Auth identity.

**Owner:** K79
**Date:** 2026-11-03
**Target:** Chrome 116+ (Manifest V3), internal/unpacked distribution first

---

## 1. Objective

Create a Bun-managed monorepo for small, focused Chrome extensions, then ship the first one: **Infisical Console**, a side-panel companion for Infisical Cloud and self-hosted Infisical.

A developer should be able to open Chrome's side panel, see the current Infisical scope, find a secret, reveal or copy it, and make a small correction without opening the Infisical dashboard. The experience must feel faster than a dashboard while being more deliberate about exposure than a `.env` file.

Success is not “a CRUD form that works.” Success is a tool that a developer can keep open all day without worrying that a secret will appear, persist, or leave the machine by accident.

### Success criteria

- A new user can connect, choose a scope, and copy a secret in under two minutes.
- A daily user can find a secret by keyboard in under five seconds.
- Secret values are never written to persistent storage, logs, analytics, or error reports.
- Every mutation makes the affected project, environment, path, and key obvious before it happens.
- The build is loadable as an unpacked Chrome extension from one command.
- The UI is usable at 360 px and 800 px side-panel widths and with a keyboard alone.
- The architecture accepts a second extension without copying the build system, design tokens, or messaging layer.

---

## 2. Capability Map

| Module | Responsibility | Depends on |
| --- | --- | --- |
| `extension-foundation` | Bun workspace, WXT shell, shared UI/tokens, shared messaging base, lint/typecheck/test/build/zip commands. | — |
| `infisical-connection` | Base URL, Universal Auth, credential storage policy, token lifecycle, project/environment discovery, permission fallback. | `extension-foundation` |
| `infisical-secrets` | Secret list, search, reveal, copy, create, edit, delete, folder path handling, mutation states. | `infisical-connection` |
| `extension-surfaces` | Onboarding, side-panel workspace, detail/editor panes, settings, toolbar popup, responsive and keyboard behavior. | `infisical-connection`, `infisical-secrets` |
| `quality-release` | Unit/component/e2e tests, accessibility checks, packaging, live smoke-test notes, ADRs. | all |

**Build order:** foundation → connection → secrets → surfaces → hardening/release. The surfaces module begins against typed contracts as soon as the connection boundary exists; it does not wait for every API edge case.

---

## 3. Scope

### In scope for V1

- Connect to Infisical Cloud US, Cloud EU, or a self-hosted instance.
- Authenticate with Universal Auth: Machine Identity Client ID + Client Secret.
- Choose a project and environment.
- Fall back to a manual project ID and environment slug when listing projects/environments is forbidden.
- Work within a folder path, with recent paths and navigable folder rows.
- List shared secrets with values hidden by default.
- Search locally by key, path, and comment.
- Reveal and copy a secret value on demand.
- Create a shared secret.
- Create with a comment; edit value and key inline in the inspector.
- Delete a shared secret with explicit confirmation.
- Toolbar popup: connection state, current scope, recent secret names, quick copy, open side panel.
- Onboarding, settings, empty/loading/error states.
- Disposable synthetic live-smoke checks for UI and API verification.

### Out of scope for V1

- Secret version history, rollback, dynamic secrets, rotations, tags, personal overrides, imports, folder CRUD, secret sharing, audit logs.
- Bulk import/export, multi-select, multi-project workspaces.
- OAuth/SSO login, Chrome identity integration, team administration.
- Chrome Web Store listing, auto-update, Edge/Firefox/Safari packaging.
- Telemetry or analytics.

---

## 4. Users and Jobs

### Primary jobs

1. **Confirm:** “Is `STRIPE_SECRET_KEY` set to the value I think it is in staging?”
2. **Retrieve:** “Copy the current production database URL into my terminal or another tool.”
3. **Correct:** “Add a missing local-development secret or fix a stale value without opening the dashboard.”
4. **Audit scope:** “Which project, environment, and folder am I looking at before I change anything?”

### Non-goals

The extension is not a secret browser for unauthorized users. It uses the permissions of the supplied Machine Identity and must not attempt to bypass Infisical RBAC. It is not an offline vault and must not imply that values are available when the network is down.

---

## 5. UX Specification

### 5.1 Surfaces

**Side panel — full workspace.** Chrome 116+ side panel, 320–800 px wide. This is the primary surface for browsing and editing.

**Toolbar popup — compact console.** 380 px wide, 520 px tall. Runs the same onboarding, workspace, list, inline reveal, inspector, editor, and settings surfaces as the side panel. It is a complete working surface, not a teaser. An optional “Open side panel” control in the workspace header moves the same session into the side panel.

**Onboarding — inside the side panel.** No separate options page for the first run. Three steps:

1. **Connect:** instance URL, Machine Identity Client ID + Client Secret, “Test connection.”
2. **Choose scope:** project + environment, or manual fallback.
3. **Ready:** summary, “Remember on this device” choice, open workspace.

### 5.2 Information architecture

```text
Side panel
├─ Onboarding (first run only)
├─ Workspace
│  ├─ Scope header        project / environment / connection state
│  ├─ Path bar            / / / / current folder, recent paths, up one level
│  ├─ Search              local filter, keyboard shortcut
│  ├─ Secret list         rows, folder grouping, counts, loading/empty/error states
│  ├─ Inspector          detail + inline edit + reveal/copy/delete (wide layout)
│  └─ Editor             create only (pane on wide, pushed page on narrow)
├─ Settings
│  ├─ Connection
│  ├─ Appearance
│  └─ About
└─ Popup
   ├─ Onboarding (first run)
   ├─ Workspace
   │  ├─ Scope + path + search
   │  ├─ Secret list with inline reveal
   │  ├─ Inspector / editor
   │  └─ Settings
   └─ Open side panel (optional)
```

### 5.3 Layout

The signature structure is **index and leaf**:

- **Wide (≥ 640 px):** a narrow vertical environment/index rail on the left, the secret list in the middle, and a 280–320 px inspector on the right. The rail gives one-click environment switching without a modal.
- **Dashboard access:** the path row has a globe control that opens the exact project overview in Infisical: `/organizations/{orgId}/projects/secret-management/{projectId}/overview` on the appropriate cloud or self-hosted origin.
- **Medium (480–639 px):** top scope band and list; selecting a row pushes a full-height inspector page with a back control.
- **Narrow (320–479 px):** same as medium, with the environment selector collapsed into a labeled chip and the path bar reduced to a breadcrumb that can be scrolled horizontally.
- **No horizontal page scroll at any supported width.**

Creation uses the editor page, not a centered modal. Editing is inline in the value card: key and value become textboxes, with Cancel/Save in the card footer. Only short, destructive confirmations use a dialog.

### 5.4 Secret list

Each row shows:

- Folder rows above secrets: folder icon, name, full path, and a navigation chevron. Clicking opens that folder.
- Secret key in monospace with tabular figures.
- Masked value: a fixed-width mask that does **not** reveal value length.
- Folder path (when not at root), muted.
- A small metadata line: version and relative update time.
- Hover/focus actions: Reveal, Copy, Details.
- A selected state with a solid accent rail, not a glow.

Behavior:

- Values are not fetched during list load. The list request uses `viewSecretValue=false`.
- Reveal fetches the single secret with `viewSecretValue=true`; the value stays in memory for the current panel session.
- Row reveal is inline: the eye action shows the value in the row without opening the inspector.
- Row click copies the value. A dedicated details icon opens the inspector.
- The header reveal control is a toggle: if any value is revealed it conceals all; otherwise it fetches and reveals all visible values in the current folder.
- The inspector value card header shows the actual secret key. Reveal, copy, edit, and delete are icon-only controls in the card’s bottom-right footer.
- Copy fetches the value if needed, writes to the clipboard, and shows a short confirmation with the key name.
- “Conceal all” clears inline and inspector values.
- Search is local and never queries values.

### 5.5 Inspector

- Version badge in the nav; updated time and comment below the card.
- No duplicate key heading; the value card header owns the actual key.
- Value field: masked until revealed; monospace, multi-line aware.
- The value body sizes to its content up to a maximum height, then scrolls; there is no hardcoded minimum height.
- Bottom-right card actions: reveal, copy, edit, delete.
- A clear “Shared secret” label. Personal secrets are out of scope.
- On 403, mutation controls are disabled with a precise explanation.

### 5.6 Create Editor and Inline Edit

Create editor fields:

- Key (required; no `/`; trimmed; normalized to UPPERCASE).
- Value (required).
- Comment (optional).
- Folder path (defaults to the current path; normalized to start with `/`, no trailing slash except root).

Inline edit is confined to the value card:

- The card header key becomes a monospace textbox.
- The value body becomes a monospace textarea.
- Cancel and Save replace the reveal/copy/edit/delete footer actions.
- No separate edit page or duplicate header is introduced.

States: default, dirty, validating, saving, saved, error. A failed save preserves the draft and shows the server message without echoing the value.

### 5.7 Delete confirmation

The confirmation names the key, project, environment, and path. The destructive button is labeled **Delete secret** and is never the default focused action. A successful delete removes the row and shows an undo-shaped message only if a real restore is available; otherwise it states that the deletion is permanent in Infisical.

### 5.8 Keyboard map

| Shortcut | Action |
| --- | --- |
| `/` or `⌘/Ctrl+K` | Focus search |
| `↑` / `↓` | Move selection |
| `Enter` | Copy focused row |
| `R` | Reveal selected value |
| `⌘/Ctrl+C` | Copy selected value |
| `E` | Edit selected secret |
| `N` | New secret |
| `Esc` | Close inspector/editor/dialog |
| `⌘/Ctrl+Shift+X` | Conceal all revealed values |

Shortcuts do not fire while an input, textarea, or select has focus. Delete never has a bare single-key shortcut.

### 5.9 State inventory

Every screen must define: loading, empty, no-results, offline, unauthorized, forbidden, rate-limited, server-error, stale-cache, saving, saved, and destructive-confirmation states. Toasts are confirmation, not the only error channel. Errors stay near the control that caused them.

### 5.10 Copy and empty-state copy

- Empty folder: “No secrets in `/path` yet.” Actions: New secret, Go up.
- No results: “No secrets match `query`.” Action: Clear search.
- No projects: “This identity cannot list projects.” Action: Enter a project ID manually.
- Expired token: “Your Infisical session expired. Reconnect to continue.” Action: Reconnect.
- Forbidden mutation: “This identity can read this scope but cannot change it.” No retry button that would fail again.

---

## 6. Design Intent

**Mode:** Operate. The interface serves the task and earns trust through precision, not decoration.

**Working direction:** *The Secure Ledger* — an archival, security-printing-informed instrument rather than a neon developer dashboard. Hairline rules, indexed edges, tabular numbers, a stamped environment chip, and a single restrained accent. The world should feel like a controlled record of sensitive entries, not a toy vault. This direction is provisional until the Impeccable direction round after spec approval.

**Hard constraints:**

- No neon-on-black glow, glassmorphism, gradient text, or generic “cyber vault” imagery.
- No display type in labels, buttons, or data.
- One workhorse sans for UI and one bundled monospace for keys/values with tabular figures.
- Hugeicons only, Stroke Rounded set; one icon weight and one optical size unless a documented exception exists.
- Restrained color: neutral ground, one accent for primary/selection, one semantic destructive color. Environment colors are labels, not decoration.
- Light and dark themes from the same tokens; default to the system preference.
- A visible scope line above every destructive or mutating action.
- Motion is 150–220 ms, state-driven, and disabled under `prefers-reduced-motion`.
- Keyboard focus is always visible and never clipped.

**Deliberate moments:**

- The masked value field uses a fixed-width mask, so the length of a secret is not leaked at a glance.
- Reveal is a short, calm transition rather than a dramatic flourish.
- Copy feedback changes the action in place; it does not move the row.
- The environment chip reads like a stamp on a record, with a color and a text label.
- Empty states teach the next action without illustrations of padlocks or keys.

**Impeccable workflow:** run `impeccable context`, then the Operate direction round before UI code. Record the chosen direction contract in the surface brief. Use the code-led path because this is an app surface. After the build, run the finish review and record `DESIGN.md` from the shipped result.

---

## 7. Architecture

### 7.1 Stack

- **Runtime and package manager:** Bun 1.4.x.
- **Extension build:** WXT (latest stable at scaffold time) with React and TypeScript.
- **UI primitives:** Base UI (`@base-ui/react`). Use shadcn/ui's Base UI recipes as the starting point for shared primitives, vendored into `packages/ui` and re-themed with K79 tokens rather than imported as an opaque dependency.
- **Icons:** Hugeicons (`@hugeicons/react` + `@hugeicons/core-free-icons`, Stroke Rounded free set). No Lucide or mixed icon libraries.
- **State:** TanStack Query for server state; React context for session/scope; no global store until a concrete need appears.
- **Forms:** shadcn's current React Hook Form recipe: `useForm` + `Controller` + `zodResolver` + Base UI `Field` anatomy (`Field`, `FieldLabel`, `FieldDescription`, `FieldError`, `FieldGroup`, `FieldSet`). Use `mode: "onTouched"`, `data-invalid` on the field, and `aria-invalid` on the control.
- **Validation:** Zod at every network and message boundary; the same schemas feed form validation.
- **Tests:** Vitest, React Testing Library, Playwright, axe.
- **Quality:** Biome, TypeScript strict mode.

### 7.2 Workspace layout

```text
k79-extensions/
├─ extensions/
│  └─ infisical/
│     ├─ src/
│     │  ├─ entrypoints/
│     │  │  ├─ background.ts
│     │  │  ├─ sidepanel/
│     │  │  └─ popup/
│     │  ├─ api/              # Infisical HTTP client + DTOs
│     │  ├─ background/       # auth session, request handlers, storage
│     │  ├─ features/
│     │  │  ├─ connection/
│     │  │  ├─ secrets/
│     │  │  ├─ workspace/
│     │  │  └─ settings/
│     │  ├─ components/       # Extension-specific composition
│     │  ├─ lib/              # messaging client, queries, formatting
│     │  └─ styles/
│     ├─ tests/
│     │  ├─ api/
│     │  ├─ background/
│     │  ├─ features/
│     │  ├─ lib/
│     │  ├─ e2e/              # Playwright extension tests
│     │  └─ live/             # real-instance UI/API smoke scripts
│     ├─ wxt.config.ts
│     └─ package.json
├─ packages/
│  ├─ shared/
│  └─ ui/
├─ docs/adr/
├─ PRODUCT.md
├─ SPEC.md
├─ package.json
└─ biome.json
```

### 7.3 Boundaries

- **`packages/shared`** contains no React and no Infisical behavior. It is safe for any extension.
- **`packages/ui`** contains Base UI primitives styled with vendored shadcn recipes, plus tokens. It contains no Infisical screens. Extension-specific composition lives in the extension.
- **`extensions/*`** may import from packages, never from another extension.
- **The background service worker is the only code that performs network requests.** UI components call typed message operations.
- **No generic fetch message.** The request union names only supported Infisical operations, so a compromised UI page cannot turn the background into an open proxy.

### 7.4 Data flow

```text
Side panel / popup
    │  typed message + Zod-validated payload
    ▼
Background service worker
    ├─ credential/session store
    ├─ single-flight auth (login, refresh, 401 retry)
    ├─ Infisical API client
    └─ normalized errors
    │  typed response
    ▼
TanStack Query cache (memory only)
    │
    ▼
React surfaces
```

### 7.5 Service-worker lifecycle

- Chrome may terminate the worker at any time. No session state may exist only in a module-level variable.
- Access tokens live in `chrome.storage.session`.
- Persistent preferences live in `chrome.storage.local`.
- Long-lived credentials live in `chrome.storage.local` **only** when “Remember on this device” is enabled; otherwise they live in `chrome.storage.session`.
- Secret values are never written to either store.
- Auth login is single-flight; concurrent UI requests await the same login promise.
- A 401 may trigger one re-login and one retry. Mutations are not retried after ambiguous network failures.

### 7.6 Manifest and permissions

```ts
permissions: ["storage", "sidePanel"]
host_permissions: ["https://*.infisical.com/*"]
optional_host_permissions: [
  "https://*/*",
  "http://localhost/*",
  "http://127.0.0.1/*",
]
minimum_chrome_version: "116"
```

- Self-hosted origins request permission only for the configured origin, from a user gesture.
- No content scripts. No `<all_urls>` by default. No remote code.
- Fonts and icons are bundled locally.
- Side panel path is registered in the manifest; popup uses `chrome.sidePanel.open` from a click.

### 7.7 Storage model

```ts
// chrome.storage.local — durable preferences, never secret values
type LocalPrefs = {
  baseUrl: string;
  projectId?: string;
  environment?: string;
  secretPath: string;
  rememberCredentials: boolean;
  theme: "system" | "light" | "dark";
  recentPaths: string[];
  recentSecretKeys: Array<{ key: string; path: string }>;
};

// chrome.storage.session — access token + transient credentials
type SessionState = {
  accessToken?: string;
  tokenExpiresAt?: number;
  credentials?: UniversalCredentials;
};
```

- `rememberCredentials` defaults to **off**. The UI states that credentials, when remembered, are stored unencrypted in extension storage visible to anyone with access to the browser profile.
- Removing the connection clears tokens, credentials, recents, and query caches.
- No secret value is included in TanStack Query persistence because there is no persistence.

---

## 8. Infisical API Contract

All requests are made by the background worker against the configured base URL. The default is `https://us.infisical.com`; EU is `https://eu.infisical.com`; self-hosted URLs are normalized to an origin.

### 8.1 Authentication

**Universal Auth**

```http
POST /api/v1/auth/universal-auth/login
Content-Type: application/json

{ "clientId": "...", "clientSecret": "..." }
```

Response includes `accessToken` and `expiresIn`. The token is treated as opaque. On a 401, the worker re-authenticates once and retries the original request.

Infisical has deprecated token-based authentication. Do not add a pasted-token fallback to the UI or message contract.

### 8.2 Discovery

```http
GET /api/v1/projects?type=secret-manager
GET /api/v1/projects/{projectId}
```

Project response includes environments with `name`, `slug`, and `id`. If `/projects` is forbidden, the onboarding offers manual project ID entry. If the single project fetch is also forbidden, the user enters an environment slug manually and the first secret-list request verifies the scope.

### 8.3 Secrets

```http
GET    /api/v4/secrets?projectId=...&environment=...&secretPath=/&viewSecretValue=false&expandSecretReferences=false&recursive=false&includeImports=false
GET    /api/v4/secrets/{secretName}?projectId=...&environment=...&secretPath=/&viewSecretValue=true
POST   /api/v4/secrets/{secretName}
PATCH  /api/v4/secrets/{secretName}
DELETE /api/v4/secrets/{secretName}
```

Create body:

```json
{
  "projectId": "...",
  "environment": "dev",
  "secretPath": "/",
  "secretValue": "...",
  "secretComment": "",
  "type": "shared"
}
```

Update body adds `newSecretName` when the key changes. Delete sends `{ projectId, environment, secretPath, type: "shared" }` as its JSON body.

If the response is an `approval` object rather than a `secret`, the UI reports “Change submitted for approval” and does not assume the mutation landed.

### 8.4 Normalization

- Trim the base URL; require HTTPS except for `localhost`/`127.0.0.1` development.
- Encode path segments with `encodeURIComponent`.
- Normalize folder paths: must start with `/`; root is `/`; remove trailing slash except root; reject `..`.
- Treat the API as the authority on key validation; surface its message without including the value.
- Map status codes to stable UI error codes: `unauthorized`, `forbidden`, `not_found`, `rate_limited`, `validation`, `network`, `server`, `unknown`.
- Honor `Retry-After` for 429 with a bounded, user-visible wait; do not loop.

---

## 9. Security and Privacy

### Always

- Validate every message request and response at the boundary with Zod.
- Keep network access and credentials in the background worker.
- Keep secret values in memory only.
- Use `secretValueHidden`/`viewSecretValue=false` for lists.
- Fetch a value only for reveal, copy, or edit hydration.
- Redact values from errors, logs, and DevTools-friendly state.
- Require explicit confirmation for deletion.
- Request the minimum host permission for self-hosted instances.

### Ask first

- Adding any Chrome permission beyond `storage` and `sidePanel`.
- Adding analytics, telemetry, crash reporting, or remote logging.
- Changing where credentials are stored or enabling credential sync.
- Publishing to the Chrome Web Store.
- Adding a content script or `<all_urls>`.

### Never

- Commit real Infisical credentials, tokens, project IDs, or secret values.
- Store secret values in `storage.local`, `storage.session`, `localStorage`, IndexedDB, or query persistence.
- Log request bodies or response bodies that contain secret values.
- Add `eval`, remote scripts, or remote fonts.
- Retry a non-idempotent mutation after an ambiguous network failure.
- Bypass or weaken Infisical RBAC in the client.

### Threat notes

- Extension storage is not a hardware vault. “Remember” is convenience, not a security boundary; the UI says so.
- A compromised extension page can call the background, but the message union limits it to known operations and the configured origin.
- Clipboard contents outlive the extension. The UI confirms copies but does not promise automatic clearing in V1.
- The extension must not claim to clear Infisical audit history or hide actions from the workspace.

---

## 10. Commands

```bash
# Install
bun install

# Development
bun run dev:infisical
# → bun run --filter @k79/infisical dev

# Production build
bun run build:infisical
# → bun run --filter @k79/infisical build

# Package for loading/distribution
bun run zip:infisical
# → bun run --filter @k79/infisical zip

# All extensions
bun run build
bun run zip

# Quality
bun run check          # biome check + typecheck
bun run lint           # biome check
bun run format         # biome format --write
bun run typecheck      # tsc --noEmit across workspaces
bun run test           # vitest run
bun run test:e2e       # playwright test
```

The built extension lands in `extensions/infisical/.output/chrome-mv3`.

---

## 11. Code Style

```ts
// Named exports, explicit types at boundaries, values never logged.
export async function listSecrets(scope: SecretScope): Promise<SecretSummary[]> {
  const response = await request<{ secrets: SecretDto[] }>("/api/v4/secrets", {
    query: {
      projectId: scope.projectId,
      environment: scope.environment,
      secretPath: scope.secretPath,
      viewSecretValue: "false",
      expandSecretReferences: "false",
      recursive: "false",
      includeImports: "false",
    },
  });

  return response.secrets.map(toSecretSummary);
}
```

```tsx
// shadcn's current form anatomy: Controller + Base UI Field + Zod resolver.
const form = useForm<SecretFormValues>({
  resolver: zodResolver(secretFormSchema),
  mode: "onTouched",
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

Conventions:

- TypeScript `strict`; no `any`; prefer `unknown` + a parser at boundaries.
- Named exports everywhere except WXT entrypoints.
- One public function per file when the file is a service. Tests live under `extensions/*/tests/` mirroring source; never colocate test files in `src`.
- UI components are function components with explicit props; no default exports.
- Classes use Tailwind utilities and shared tokens; no ad hoc hex values in feature code.
- Async UI states use discriminated unions, not parallel booleans.
- Error messages are written for the user, not copied from a stack trace.
- Use `type` for data shapes and `interface` only for extensible component contracts.

---

## 12. Testing Strategy

### Unit (Vitest)

- API client: URL/query construction, path encoding, error normalization, 401 single-retry, 429 handling.
- Auth: token expiry, single-flight login, credential storage policy, reconnect states.
- Domain: path normalization, search filtering, scope validation, rename payloads.
- Storage: remember on/off, clearing connection data, no values in stored state.

### Component (Vitest + Testing Library)

- Secret row: keyboard selection, reveal, copy, no value in the accessible name until revealed.
- Inline edit: key/value editing, dirty state, failed save preserves draft, no layout switch.
- Delete dialog: names scope/key, cancel is default focus, destructive action requires a deliberate click.
- Onboarding: Universal Auth validation, manual scope fallback, inline errors.

### End-to-end (Playwright)

- Load the built extension in Chromium with a local mock Infisical server.
- Onboard with Universal Auth.
- List, search, reveal, copy, create, edit, rename, delete.
- Force 401 and verify reconnect behavior.
- Force 403 and verify mutation controls are disabled.
- Restart the service worker and verify session recovery.
- Open the popup and open the side panel.
- Capture 360 px and 800 px side-panel screenshots, plus the 380 px popup; run axe on each.

### Live smoke test

A manual checklist runs against a real Infisical instance when credentials are available. It is never part of CI. If no instance is available, the spec remains implemented but live verification is explicitly marked as pending.

### Coverage

At least 80% statements and branches for `src/api`, `src/domain`, `src/background`, and storage/session logic. Visual components are covered by interaction tests and e2e, not snapshots.

---

## 13. Boundaries

### Always

- Run `bun run check` and relevant tests before calling a task complete.
- Validate inputs at every external boundary.
- Keep project/environment/path visible before mutations.
- Preserve keyboard access and visible focus.
- Update this spec before changing scope, storage policy, or permissions.

### Ask first

- Adding dependencies beyond the approved stack.
- Adding Chrome permissions or host permissions.
- Adding telemetry, remote services, or a backend.
- Changing the credential storage model.
- Changing the extension name or public brand.

### Never

- Commit secrets, tokens, or real project identifiers.
- Store secret values persistently.
- Add destructive actions without confirmation.
- Add `eval`, remote code, or remote fonts.
- Delete failing tests to get a green build.

---

## 14. Acceptance Criteria

### Build and packaging

- [x] `bun install` completes with a committed `bun.lock`.
- [x] `bun run check` passes.
- [x] `bun run test` passes.
- [x] `bun run build:infisical` produces `extensions/infisical/.output/chrome-mv3`.
- [x] The unpacked build loads in Chrome 116+ with no manifest errors.
- [x] `bun run test:e2e` passes with the real extension page and axe.

### Connection

- [x] Universal Auth connects to a real or mock Infisical instance and obtains a token.
- [ ] Invalid credentials produce an actionable inline error.
- [ ] US, EU, and self-hosted base URLs work; self-hosted permission is requested per origin.
- [ ] Project and environment discovery works; a 403 offers the manual fallback.
- [x] Token expiry triggers one re-login and retry; a failed retry surfaces reconnect.

### Secrets

- [x] Listing never fetches values.
- [x] Search filters by key, path, and comment without a network request.
- [x] Reveal and copy fetch exactly one secret and keep the value in memory only.
- [x] Create, edit, rename, and delete are reflected in Infisical and in the list.
- [ ] A failed mutation preserves the draft and does not report success.
- [x] A secret-protection `approval` response is reported as pending, not saved.
- [x] Delete requires confirmation that names key, project, environment, and path.
- [ ] 403 disables mutation controls with an explanation.
- [ ] “Conceal all” removes every revealed value from the UI.

### UX and accessibility

- [x] Side panel works at 360 px and 800 px without horizontal page scroll.
- [x] Popup works at 380 px as a complete console and offers an optional side-panel control.
- [ ] All primary flows are keyboard-completable.
- [x] Focus is visible and never clipped; icon-only controls have accessible names.
- [x] Reduced motion is respected.
- [x] Axe reports no serious or critical issues on onboarding, workspace, and detail.
- [x] Loading, empty, no-results, offline, unauthorized, forbidden, and server-error states exist.

### Security

- [x] No secret values appear in `chrome.storage.local`, `chrome.storage.session`, `localStorage`, IndexedDB, logs, or error text.
- [x] No generic fetch or arbitrary-URL message is exposed.
- [x] No content script or `<all_urls>` permission is present in the production manifest.
- [x] Clearing the connection removes credentials, tokens, recents, and in-memory caches.

### Design

- [x] The Impeccable direction contract is recorded before UI implementation.
- [ ] The finish review passes at the shipped sizes.
- [x] `DESIGN.md` is written from the built surface.
- [x] The UI does not use the banned neon/glass/gradient-text clichés in §6.

---

## 15. Risks and Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Machine identity cannot list projects | Onboarding dead-ends | Manual project ID/environment fallback; test the 403 path. |
| Self-hosted CORS/host permissions | Requests fail | All requests in background; request optional host permission for the exact origin. |
| Service worker terminated mid-flow | Lost token/session | Persist only session token and prefs; rehydrate; single-flight auth. |
| Secret values leak into logs/errors | Critical | Central redaction, no body logging, tests that scan storage and captured console output. |
| Mutation retry duplicates a write | Data integrity | Re-auth only on 401; never retry ambiguous network failures. |
| Large secret lists | Sluggish panel | Local filtering; virtualize the list if it exceeds 200 rows. |
| Chrome side panel width changes | Broken layout | Structural breakpoints; test 360/480/800; no fixed page widths. |
| Secret protection approvals | UI reports false success | Detect `approval` response and show pending state. |
| Name/brand conflict | Distribution issue | Working name only; confirm before publishing. |

---

## 16. Open Questions

1. **Distribution:** V1 is internal/unpacked. Chrome Web Store packaging is a later decision.
2. **Name:** “Infisical Console” is the working name; confirm before publishing.
3. **Clipboard clearing:** V1 does not auto-clear, because reliable background clearing requires an offscreen document.
4. **Demo mode:** Deferred. Real credentials are available, and live smoke tests use disposable synthetic secrets instead.

---

## 17. Assumptions

- Chrome is the only target for V1; Manifest V3 is required.
- The user has permission to create/use an Infisical Machine Identity with access to the target project.
- Shared secrets only; personal overrides and dynamic secrets are later work.
- The side panel is the primary surface; the popup is deliberately thin.
- English-only UI for V1.
- No backend service is added. The extension talks directly to Infisical from the background worker.
- “Remember on this device” is off by default.
- The repo is private until a license and distribution decision are made.

---

## 18. Approval

Approve this spec to start the implementation plan and scaffolding. Changes to scope, security posture, permissions, or the visual direction should be made here first, then reflected in the plan and code.
