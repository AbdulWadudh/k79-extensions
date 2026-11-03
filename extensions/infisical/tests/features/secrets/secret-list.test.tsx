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
      secrets={[secret]}
      selectedKey={null}
      onSelect={vi.fn()}
      onCopy={vi.fn()}
      onReveal={vi.fn()}
      copiedKey={null}
      loading={false}
      error={null}
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

  it("selects and copies a secret from its row", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onCopy = vi.fn();
    renderList({ onSelect, onCopy });

    await user.click(screen.getByRole("button", { name: /STRIPE_SECRET_KEY/ }));
    expect(onSelect).toHaveBeenCalledWith(secret);

    await user.click(screen.getByRole("button", { name: "Copy secret value" }));
    expect(onCopy).toHaveBeenCalledWith(secret);
  });

  it("teaches the empty state when the folder has no secrets", () => {
    renderList({ secrets: [], canWrite: true });
    expect(screen.getByText("No secrets in this folder")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "New secret" })).toBeInTheDocument();
  });
});
