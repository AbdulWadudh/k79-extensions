import { ConsoleApp } from "@/app/console-app";
import { openSidePanel } from "@/lib/sidepanel";

export function App() {
  return (
    <ConsoleApp
      onOpenSidePanel={() => {
        void openSidePanel();
      }}
    />
  );
}
