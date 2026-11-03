import { defineBackground } from "wxt/utils/define-background";
import { handleMessage } from "@/background/handlers";

export default defineBackground(() => {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (sender.id !== chrome.runtime.id) return false;

    void handleMessage(message).then(sendResponse);
    return true;
  });
});
