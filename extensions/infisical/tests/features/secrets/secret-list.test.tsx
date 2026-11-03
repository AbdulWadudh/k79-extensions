import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import type { SecretSummary } from "@/api/types";
import { SecretList } from "@/features/secrets/secret-list";

const secret: SecretSummary = {
  id: "secret-1",
  key: "STRIPE_SECRET_KEY",
  path: "/payments",
  comment: "Billing key",
  version: 4,
  updatedAt: new Date(Date.now() - 60_000).toISOString(),
  tags: [],
};

function renderList(overrides: Partial<ComponentProps<typeof SecretList>> = {}) {
  return render(
    <SecretList
      folders={[]}
      secrets={[secret]}
      selectedKey={null}
      onSelect={vi.fn()}
      onOpenFolder={vi.fn()}
      onCopy={vi.fn()}
      onToggleReveal={vi.fn()}
      revealedValues={{}}
      revealingKey={null}
      loading={false}
      error={null}
      foldersError={null}
      onRetry={vi.fn()}
      onNew={vi.fn()}
      hasSearch={false}
      onClearSearch={vi.fn()}
      canWrite
      {...overrides}
    />,
  );
}

describe("SecretList", () => {
  it("renders masked metadata without a value", () => {
    renderList();
    expect(screen.getByText("STRIPE_SECRET_KEY")).toBeInTheDocument();
    expect(screen.getByText("/payments")).toBeInTheDocument();
    expect(screen.queryByText("super-secret")).not.toBeInTheDocument();
  });

  it("copies from the row and opens details from the dedicated button", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onCopy = vi.fn();
    renderList({ onSelect, onCopy });

    await user.click(screen.getByRole("button", { name: new RegExp(`^Copy${secret.key}`) }));
    expect(onCopy).toHaveBeenCalledWith(secret);
    expect(onSelect).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "View details" }));
    expect(onSelect).toHaveBeenCalledWith(secret);
  });

  it("teaches the empty state when the folder has no folders or secrets", () => {
    renderList({ folders: [], secrets: [], canWrite: true });
    expect(screen.getByText("No secrets in this folder")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "New secret" })).toBeInTheDocument();
  });

  it("renders folder rows and opens them", async () => {
    const user = userEvent.setup();
    const onOpenFolder = vi.fn();
    const folder = { id: "folder-1", name: "LMS-BACKEND", path: "/LMS-BACKEND" };

    renderList({ folders: [folder], secrets: [], onOpenFolder });
    expect(screen.getByText("LMS-BACKEND")).toBeInTheDocument();
    expect(screen.queryByText("No secrets in this folder")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /LMS-BACKEND/ }));
    expect(onOpenFolder).toHaveBeenCalledWith(folder);
  });

  it("toggles an inline reveal without selecting the row", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onToggleReveal = vi.fn();
    renderList({ onSelect, onToggleReveal });

    await user.click(screen.getByRole("button", { name: "Reveal secret value" }));
    expect(onToggleReveal).toHaveBeenCalledWith(secret);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("renders an inline revealed value and its conceal action", async () => {
    const user = userEvent.setup();
    const onToggleReveal = vi.fn();
    renderList({
      onToggleReveal,
      revealedValues: { [secret.key]: "synthetic-value" },
    });

    expect(screen.getByText("synthetic-value")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Conceal secret value" }));
    expect(onToggleReveal).toHaveBeenCalledWith(secret);
  });
});
