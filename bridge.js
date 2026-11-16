// Runs in the extension's ISOLATED world so it can talk to the background service worker.
// content.js (MAIN world) posts messages here; we relay them to background.js.
const expectedOrigin = `chrome-extension://${chrome.runtime.id}`;
const isInBetterMessages =
  window !== window.top &&
  Array.from(window.location.ancestorOrigins || []).includes(expectedOrigin);

if (isInBetterMessages) {
  window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    const data = event.data;
    if (!data || data.source !== 'bettermessages' || data.type !== 'copy-code') return;
    chrome.runtime.sendMessage({ type: 'copy-to-clipboard', text: String(data.text) });
  });
}
