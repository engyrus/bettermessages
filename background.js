chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

function clearCachedFramingHeaders() {
  chrome.browsingData.remove(
    { origins: ["https://messages.google.com"] },
    { serviceWorkers: true, cacheStorage: true, cache: true }
  );
}

// Copy verification codes to the clipboard via an offscreen document
// (works even when the side panel doesn't have focus)
async function ensureOffscreenDocument() {
  const existing = await chrome.runtime.getContexts({ contextTypes: ['OFFSCREEN_DOCUMENT'] });
  if (existing.length > 0) return;
  await chrome.offscreen.createDocument({
    url: 'offscreen.html',
    reasons: ['CLIPBOARD'],
    justification: 'Copy verification codes from incoming messages to the clipboard',
  });
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.type !== 'copy-to-clipboard' || !msg.text) return;
  ensureOffscreenDocument()
    .then(() =>
      chrome.runtime.sendMessage({ target: 'offscreen', type: 'write-clipboard', text: msg.text })
    )
    .catch((error) => console.error(error));
});

chrome.runtime.onInstalled.addListener(clearCachedFramingHeaders);
chrome.runtime.onStartup.addListener(clearCachedFramingHeaders);
clearCachedFramingHeaders();
