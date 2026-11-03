import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./extensions/infisical/src", import.meta.url)),
      "@k79/shared": fileURLToPath(new URL("./packages/shared/src/index.ts", import.meta.url)),
      "@k79/ui": fileURLToPath(new URL("./packages/ui/src/index.ts", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["extensions/*/tests/**/*.test.{ts,tsx}", "packages/*/tests/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      include: [
        "extensions/infisical/src/api/**/*.{ts,tsx}",
        "extensions/infisical/src/background/**/*.{ts,tsx}",
        "extensions/infisical/src/lib/**/*.{ts,tsx}",
      ],
      exclude: ["**/*.test.{ts,tsx}", "**/demo/**"],
    },
  },
});
