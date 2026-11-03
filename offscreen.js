// Offscreen document used to write to the clipboard even when the side panel isn't focused.
const CLEAR_AFTER_MS = 15000;
let clearTimer = null;

function readClipboard() {
  const el = document.getElementById('clip');
  el.value = '';
  el.focus();
  document.execCommand('paste');
  return el.value;
}

function writeClipboard(text) {
  // Use a copy-event handler so we can also write an empty string (clearing the clipboard)
  const onCopy = (e) => {
    e.clipboardData.setData('text/plain', text);
    e.preventDefault();
  };
  document.addEventListener('copy', onCopy);
  document.execCommand('copy');
  document.removeEventListener('copy', onCopy);
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.target !== 'offscreen' || msg.type !== 'write-clipboard') return;
  const code = msg.text;
  writeClipboard(code);

  // After 15 seconds, clear the clipboard -- but only if our code is still on it
  clearTimeout(clearTimer);
  clearTimer = setTimeout(() => {
    clearTimer = null;
    if (readClipboard() === code) {
      writeClipboard('');
    }
  }, CLEAR_AFTER_MS);
});
