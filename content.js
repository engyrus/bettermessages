const LAST_CONV_STORAGE_KEY = 'bettermessages_last_conv';

const CLIPBOARD_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" width="18" height="18" fill="currentColor">
  <path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h167q11-35 43-57.5t70-22.5q40 0 71.5 22.5T594-840h166q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-560h-80v120H280v-120h-80v560Zm280-560q17 0 28.5-11.5T520-800q0-17-11.5-28.5T480-840q-17 0-28.5 11.5T440-800q0 17 11.5 28.5T480-760Z"/>
</svg>`;

const CHECK_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" width="18" height="18" fill="currentColor">
  <path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z"/>
</svg>`;

const TRASH_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" width="18" height="18" fill="currentColor">
  <path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/>
</svg>`;

let pendingRestore = null;
let restoreTimer = null;
try {
  const raw = localStorage.getItem(LAST_CONV_STORAGE_KEY);
  if (raw) {
    pendingRestore = JSON.parse(raw);
  }
} catch (_) {}

function getConvListItemComponent(itemEl) {
  return findAngularComponent(
    itemEl,
    (item) => item.Ha && typeof item.getConversationId === 'function'
  );
}

function saveActiveConversation(slug) {
  const selectedLink = document.querySelector(
    'mws-conversation-list-item a.list-item.selected, mws-conversation-list-item a.list-item[aria-selected="true"]'
  );
  const itemEl = selectedLink?.closest('mws-conversation-list-item');
  const comp = itemEl ? getConvListItemComponent(itemEl) : null;
  const href = selectedLink?.getAttribute('href') || `/web/conversations/${slug}`;
  const data = {
    slug,
    href,
    id: comp?.Ha?.id || null,
  };
  try {
    localStorage.setItem(LAST_CONV_STORAGE_KEY, JSON.stringify(data));
  } catch (_) {}
}

function findMatchingConversationLink(target) {
  const items = document.querySelectorAll('mws-conversation-list-item');
  for (const itemEl of items) {
    const link = itemEl.querySelector('a.list-item');
    if (!link) continue;
    const href = link.getAttribute('href') || '';
    const comp = getConvListItemComponent(itemEl);
    const compId = comp?.Ha?.id;
    const compSlug = comp?.getConversationId?.();

    if (
      (target.id && compId && String(compId) === String(target.id)) ||
      (target.slug && compSlug && String(compSlug) === String(target.slug)) ||
      (target.href && href === target.href) ||
      (target.slug && href.endsWith(`/conversations/${target.slug}`))
    ) {
      return link;
    }
  }
  return null;
}

function isBlockingDialogOpen() {
  return Boolean(document.querySelector('mat-dialog-container, .cdk-overlay-pane mat-dialog-container'));
}

function trackAndRestoreConversation() {
  const match = location.pathname.match(/\/conversations\/([^/?#]+)$/);
  const activeSlug = match && match[1] !== 'new' ? match[1] : null;

  if (activeSlug) {
    pendingRestore = null;
    if (restoreTimer) {
      clearTimeout(restoreTimer);
      restoreTimer = null;
    }
    saveActiveConversation(activeSlug);
    return;
  }

  // Wait if a modal dialog (like "Use Google Messages here?") is currently on screen
  if (isBlockingDialogOpen()) {
    if (!pendingRestore) {
      try {
        const raw = localStorage.getItem(LAST_CONV_STORAGE_KEY);
        if (raw) pendingRestore = JSON.parse(raw);
      } catch (_) {}
    }
    return;
  }

  if (!pendingRestore || restoreTimer) return;

  // Wait until the conversation list has rendered its items in the DOM
  const link = findMatchingConversationLink(pendingRestore);
  if (!link) return;

  restoreTimer = setTimeout(() => {
    restoreTimer = null;
    if (!pendingRestore || isBlockingDialogOpen()) return;
    const targetLink = findMatchingConversationLink(pendingRestore);
    pendingRestore = null;
    if (targetLink) {
      targetLink.click();
    }
  }, 150);
}

function decorateStartChatIcon(btn) {
  const link = btn.querySelector('a.fab, button.fab');
  if (link && !link.getAttribute('title')) {
    link.setAttribute('title', 'Start chat');
    link.setAttribute('aria-label', 'Start chat');
  }

  const svg = btn.querySelector('.fab-icon svg');
  if (svg && !svg.querySelector('.bettermessages-plus')) {
    const ns = 'http://www.w3.org/2000/svg';
    const plus = document.createElementNS(ns, 'path');
    plus.setAttribute('class', 'bettermessages-plus');
    plus.setAttribute('d', 'M12 7.1v5M9.5 9.6h5');
    plus.setAttribute('stroke', 'currentColor');
    plus.setAttribute('stroke-width', '2');
    plus.setAttribute('stroke-linecap', 'round');
    svg.appendChild(plus);
  }
}

function relocateStartChatButton() {
  const existingBtn = document.querySelector('mw-fab-link.start-chat');
  if (existingBtn) {
    decorateStartChatIcon(existingBtn);
  }

  // Look for a newly rendered Start Chat button inside mw-main-nav
  const navStartBtn = document.querySelector('mw-main-nav .main-nav-header > mw-fab-link.start-chat');
  if (!navStartBtn) return;

  decorateStartChatIcon(navStartBtn);

  // Target 1: Google Account mode header (next to the Google account icon)
  const rightAligned = document.querySelector('mw-branded-header .right-aligned');
  const accountSwitcher = rightAligned?.querySelector('mw-accountswitcher');
  if (rightAligned && accountSwitcher) {
    rightAligned.querySelectorAll('mw-fab-link.start-chat').forEach((el) => {
      if (el !== navStartBtn) el.remove();
    });
    rightAligned.insertBefore(navStartBtn, accountSwitcher);
    return;
  }

  // Target 2: QR-code mode header (next to the 3-dot menu icon)
  const qrHeader = document.querySelector('mw-main-nav .new-chat-header');
  const navMenu = qrHeader?.querySelector('mw-main-nav-menu');
  if (qrHeader && navMenu) {
    qrHeader.querySelectorAll('mw-fab-link.start-chat').forEach((el) => {
      if (el !== navStartBtn) el.remove();
    });
    qrHeader.insertBefore(navStartBtn, navMenu);
  }
}

// Shorten URLs to scheme + hostname, with "..." if anything follows (path, query, hash)
function shortenUrls(text) {
  return text.replace(/\bhttps?:\/\/[^\s/?#]+[^\s]*/gi, (url) => {
    const m = url.match(/^(https?:\/\/[^\s/?#]+)(.*)$/i);
    if (!m) return url;
    const [, origin, rest] = m;
    // Keep trailing sentence punctuation (e.g. "see https://x.com.") outside the URL
    const trailing = rest.match(/[.,!?;:)\]]*$/)[0];
    const path = rest.slice(0, rest.length - trailing.length);
    return (path && path !== '/' ? `${origin}/...` : `${origin}/`) + trailing;
  });
}

function syncConversationRailTooltips() {
  const items = document.querySelectorAll('mws-conversation-list-item .list-item');
  items.forEach((link) => {
    const nameEl = link.querySelector('[data-e2e-conversation-name], .conversation-name, .name');
    const name = nameEl?.textContent?.trim();
    if (!name) return;
    // The last-message preview is already rendered (just hidden in the rail), so reuse it
    const snippetEl = link.querySelector('mws-conversation-snippet, .snippet-text');
    const rawSnippet = snippetEl?.textContent?.replace(/\s+/g, ' ').trim();
    const snippet = rawSnippet ? shortenUrls(rawSnippet) : '';
    const title = snippet ? `${name}\n${snippet}` : name;
    if (link.getAttribute('title') !== title) {
      link.setAttribute('title', title);
    }
  });
}

function findAngularComponent(hostEl, predicate) {
  const ctx = hostEl?.__ngContext__;
  if (!ctx) return null;
  if (ctx.component && predicate(ctx.component)) {
    return ctx.component;
  }
  const lView = Array.isArray(ctx) ? ctx : ctx.lView;
  if (!Array.isArray(lView)) return null;
  for (let i = 0; i < lView.length; i++) {
    const item = lView[i];
    if (item && typeof item === 'object' && predicate(item)) {
      return item;
    }
  }
  return null;
}

function getMessageActionsComponent(actionsEl) {
  return findAngularComponent(
    actionsEl,
    (item) => typeof item.tA === 'function' && item.nka && item.Ya
  );
}

function getImagePartComponent(imagePartEl) {
  return findAngularComponent(
    imagePartEl,
    (item) => item.rc && item.Ya && typeof item.JX === 'function'
  );
}

function createImageViewerBlobUrl(imgUrl) {
  const safeUrl = String(imgUrl).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>BetterMessages Image</title>
  <style>
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      background: #0e0e0e;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: auto;
      user-select: none;
    }
    img {
      max-width: 100vw;
      max-height: 100vh;
      object-fit: contain;
      cursor: zoom-in;
      display: block;
      margin: auto;
    }
    body.zoomed {
      display: block;
    }
    body.zoomed img {
      max-width: none;
      max-height: none;
      cursor: zoom-out;
    }
    .esc-hint {
      position: fixed;
      bottom: 18px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(32, 33, 36, 0.85);
      color: #e8eaed;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 13px;
      padding: 6px 14px;
      border-radius: 999px;
      border: 1px solid rgba(255, 255, 255, 0.15);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.45);
      pointer-events: auto;
      cursor: pointer;
      z-index: 10;
    }
  </style>
</head>
<body>
  <div class="esc-hint" onclick="window.close()">Escape to close</div>
  <img id="viewer-img" src="${safeUrl}" alt="Image">
  <script>
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        window.close();
      }
    });
    const img = document.getElementById('viewer-img');
    img.addEventListener('click', () => {
      document.body.classList.toggle('zoomed');
    });
  </script>
</body>
</html>`;
  const blob = new Blob([html], { type: 'text/html' });
  return URL.createObjectURL(blob);
}

function triggerMenuFallback(actionsEl, selector) {
  const trigger = actionsEl.querySelector('button.menu-trigger, button[data-e2e-message-action-menu]');
  if (!trigger) return;
  trigger.click();
  requestAnimationFrame(() => {
    const menuItem = document.querySelector(selector);
    if (menuItem) {
      menuItem.click();
    }
  });
}

function expandMessageActionMenus() {
  const actionBars = document.querySelectorAll('mws-message-actions');
  actionBars.forEach((actionsEl) => {
    const menuTrigger = actionsEl.querySelector('button.menu-trigger, button[data-e2e-message-action-menu]');
    if (!menuTrigger) return;

    // Avoid duplicating buttons if already injected alongside the current menuTrigger
    if (actionsEl.querySelector('.bettermessages-action-btn')) return;

    const comp = getMessageActionsComponent(actionsEl);
    const wrapperPart = actionsEl.closest('.msg-focus-element, mws-message-wrapper');
    const textEl = wrapperPart?.querySelector('[data-e2e-text-message-content] .text-msg, .text-msg');
    const canCopy = comp ? Boolean(comp.yoa) : Boolean(textEl && textEl.textContent);

    if (canCopy) {
      const copyBtn = document.createElement('button');
      copyBtn.type = 'button';
      copyBtn.className = 'bettermessages-action-btn bettermessages-copy-btn';
      copyBtn.title = 'Copy text';
      copyBtn.setAttribute('aria-label', 'Copy text');
      copyBtn.innerHTML = CLIPBOARD_SVG;
      copyBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const instance = getMessageActionsComponent(actionsEl);
        if (instance && instance.nka && typeof instance.nka.emit === 'function') {
          instance.nka.emit();
        } else if (textEl?.textContent) {
          navigator.clipboard.writeText(textEl.textContent);
        } else {
          triggerMenuFallback(actionsEl, '[data-e2e-message-action-copy]');
        }
        copyBtn.innerHTML = CHECK_SVG;
        setTimeout(() => {
          if (copyBtn.isConnected) copyBtn.innerHTML = CLIPBOARD_SVG;
        }, 1200);
      });
      actionsEl.insertBefore(copyBtn, menuTrigger);
    }

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'bettermessages-action-btn bettermessages-delete-btn';
    deleteBtn.title = 'Delete message';
    deleteBtn.setAttribute('aria-label', 'Delete message');
    deleteBtn.innerHTML = TRASH_SVG;
    deleteBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const instance = getMessageActionsComponent(actionsEl);
      if (instance && typeof instance.tA === 'function' && instance.Ya) {
        instance.tA({
          conversationId: instance.Ya.conversationId,
          Ab: instance.Ya.id,
        });
      } else {
        triggerMenuFallback(actionsEl, '[data-e2e-message-action-delete]');
      }
    });
    actionsEl.insertBefore(deleteBtn, menuTrigger);
  });
}

document.addEventListener(
  'click',
  (e) => {
    const target = e.target instanceof Element ? e.target : null;
    if (!target) return;

    // If the user explicitly clicks the Back button in the conversation header to return
    // to the index list, clear the remembered conversation until they open another one
    if (
      target.closest(
        'mw-conversation-header a[href$="/conversations"], mw-conversation-header [data-e2e-header-back-button], mws-header a[href$="/conversations"]'
      )
    ) {
      pendingRestore = null;
      if (restoreTimer) {
        clearTimeout(restoreTimer);
        restoreTimer = null;
      }
      try {
        localStorage.removeItem(LAST_CONV_STORAGE_KEY);
      } catch (_) {}
      return;
    }

    // Ignore clicks on our floating action buttons
    if (target.closest('mws-message-actions')) return;

    // Intercept clicks on message images to open the full-resolution image in a new browser tab
    const imagePartEl = target.closest('mws-image-message-part');
    if (!imagePartEl || !target.closest('.image-wrapper, .image-msg, mws-image')) return;

    const comp = getImagePartComponent(imagePartEl);
    const imgEl = imagePartEl.querySelector('img.image-msg, mws-image img, img');
    const initialUrl =
      comp?.rc?.vO?.url ||
      comp?.rc?.file?.url ||
      imgEl?.currentSrc ||
      imgEl?.src;

    if (!initialUrl) return;

    // Prevent the in-sidebar lightbox from opening
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    const viewerUrl = createImageViewerBlobUrl(initialUrl);
    const newTab = window.open(viewerUrl, '_blank');
    if (newTab) {
      newTab.addEventListener('keydown', (ev) => {
        if (ev.key === 'Escape') newTab.close();
      });
    }

    // If full-resolution image (vO) hasn't been fetched from the phone yet, request it
    // and upgrade the new tab's image as soon as it arrives
    if (comp && !comp.rc?.vO?.url && typeof comp.JX === 'function') {
      try {
        comp.JX({
          conversationId: comp.Ya.conversationId,
          Ab: comp.Ya.id,
          Qna: comp.rc,
          Xk: true,
        });
      } catch (_) {}

      if (newTab) {
        let checks = 0;
        const timer = setInterval(() => {
          checks++;
          const fullResUrl = comp.rc?.vO?.url;
          if (newTab.closed || checks > 40) {
            clearInterval(timer);
          } else if (fullResUrl && fullResUrl !== initialUrl) {
            clearInterval(timer);
            try {
              const viewerImg = newTab.document?.getElementById('viewer-img');
              if (viewerImg) {
                viewerImg.src = fullResUrl;
              } else {
                newTab.location.replace(createImageViewerBlobUrl(fullResUrl));
              }
            } catch (_) {}
          }
        }, 200);
      }
    }
  },
  true
);

// ==========================================================================
// Auto-copy verification codes from newly arriving messages
// ==========================================================================

const OTP_KEYWORDS = /code|verif|auth/i;
// 4-8 digits, or two digit groups joined by a hyphen (e.g. 123-456).
// Allows a letter prefix like "G-123456" but rejects pieces of phone numbers.
const OTP_PATTERN = /(?<!\d|\d-)(\d{3,4}-\d{3,4}|\d{4,8})(?!\d|-\d)/;
const OTP_STARTUP_GRACE_MS = 5000;

const seenSnippets = new WeakMap();
const copiedCodes = new Set();
let otpWatchStart = null;

function extractVerificationCode(text) {
  if (!text || !OTP_KEYWORDS.test(text)) return null;
  const match = text.match(OTP_PATTERN);
  return match ? match[1] : null;
}

function showCodeToast(code) {
  let toast = document.getElementById('bettermessages-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'bettermessages-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = `Copied code ${code}`;
  toast.classList.add('visible');
  clearTimeout(toast._hideTimer);
  toast._hideTimer = setTimeout(() => toast.classList.remove('visible'), 3000);
}

function copyVerificationCode(code) {
  if (copiedCodes.has(code)) return;
  copiedCodes.add(code);
  window.postMessage({ source: 'bettermessages', type: 'copy-code', text: code }, '*');
  showCodeToast(code);
}

function watchForVerificationCodes() {
  const items = document.querySelectorAll('mws-conversation-list-item');
  if (items.length === 0) return;
  if (otpWatchStart === null) otpWatchStart = Date.now();
  const pastGrace = Date.now() - otpWatchStart > OTP_STARTUP_GRACE_MS;

  items.forEach((itemEl) => {
    const snippetEl = itemEl.querySelector('mws-conversation-snippet, .snippet-text');
    const text = snippetEl?.textContent?.trim();
    if (!text) return;

    const previous = seenSnippets.get(itemEl);
    if (previous === text) return;
    seenSnippets.set(itemEl, text);

    // Messages already present at startup are history, not new arrivals
    if (!pastGrace) return;

    // Skip messages you sent yourself
    if (/^you:/i.test(text)) return;

    // A brand-new list item only counts if it's unread (avoids re-rendered old items)
    if (previous === undefined) {
      const link = itemEl.querySelector('a.list-item');
      const unread =
        link?.classList.contains('unread') ||
        itemEl.querySelector('[data-e2e-is-unread="true"], .unread');
      if (!unread) return;
    }

    const code = extractVerificationCode(text);
    if (code) copyVerificationCode(code);
  });
}

function handleDomMutations() {
  trackAndRestoreConversation();
  relocateStartChatButton();
  syncConversationRailTooltips();
  expandMessageActionMenus();
  watchForVerificationCodes();
}

const observer = new MutationObserver(handleDomMutations);
observer.observe(document.documentElement, { childList: true, subtree: true });
handleDomMutations();
