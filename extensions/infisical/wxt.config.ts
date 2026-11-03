import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "wxt";

export default defineConfig({
  srcDir: "src",
  modules: ["@wxt-dev/module-react"],
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  manifest: {
    name: "Infisical Console",
    description: "A focused Infisical secrets workspace for Chrome's side panel.",
    version: "0.1.0",
    permissions: ["storage", "sidePanel"],
    host_permissions: ["https://*.infisical.com/*"],
    optional_host_permissions: ["https://*/*", "http://localhost/*", "http://127.0.0.1/*"],
    minimum_chrome_version: "116",
    side_panel: {
      default_path: "sidepanel.html",
    },
    action: {
      default_title: "Infisical Console",
    },
    icons: {
      16: "icon/16.png",
      32: "icon/32.png",
      48: "icon/48.png",
      128: "icon/128.png",
    },
  },
});
