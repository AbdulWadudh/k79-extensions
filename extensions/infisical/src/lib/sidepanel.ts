export async function openSidePanel(): Promise<void> {
  const current = await chrome.windows.getCurrent();
  if (!current.id) throw new Error("Chrome did not return a window.");
  await chrome.sidePanel.open({ windowId: current.id });
  window.close();
}
