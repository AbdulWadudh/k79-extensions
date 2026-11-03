import "@fontsource-variable/geist-mono";
import "@fontsource-variable/schibsted-grotesk";
import "@/styles/globals.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createQueryClient } from "@/lib/query-client";
import { App } from "./App";

const queryClient = createQueryClient();
const root = document.getElementById("root");

if (!root) throw new Error("Side panel root is missing.");

createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
);
