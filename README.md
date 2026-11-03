# BetterMessages v1.0

## by Jerry Kindall - engyrus@gmail.com

**BetterMessages** is a browser extension for Chrome and Chromium-based browsers (Thorium, Brave, Edge, Vivaldi) that loads [Google Messages for Web](https://messages.google.com/web/)
into the browser's native side panel. It also improves the Google Messages for Web user experience.

## Main Features

- **Native browser side panel**: Opens Google Messages for Web in the browser's side panel via the toolbar icon or **`Alt+Shift+M`**.
- **Pinned avatar rail**: Keeps an independently scrollable vertical avatar rail on the left side of active conversations so you can switch chats without returning to the main conversation list. Tooltips show the name or number and last message for each conversation.
- **Remember last active conversation**: Remembers which conversation you had open when closing the sidebar or browser and automatically reopens it the next time.
- **Tightened user interface**: Reclaims wasted space so you have more room for your messages, and makes all message actions require just one click.
- **Full-resolution images**: Image thumbnails open full-size in a new browser tab (press **`Esc`** to close) rather than being stuck inside the sidebar.
- **Auto-copy verification codes**: When a new message arrives containing a verification code, the code is copied to your clipboard automatically. The clipboard is cleared after 15 seconds if the code is still on it.

---

## Installation (Unpacked Extension)

0. Make sure you're logged in to Google Messages for Web with the account you want to use, then close the tab where Google Messages for Web is opened.
1. Clone or download this repository.
2. Open your Chromium browser and navigate to `chrome://extensions`.
3. Enable **Developer mode** in the top-right corner.
4. Click **Load unpacked** and select this repository folder.
5. Click the **BetterMessages** icon in the toolbar (or press **`Alt+Shift+M`**, or whatever that is on a Mac) to activate the sidebar.

BetterMessages will eventually appear in the Chrome Web Store once it's had a shakeout cruise.

---

## A small risk

It's possible that changes Google makes to Google Messages for Web will break some functionality of BetterMessages. I use the extension every day, though,
so I should notice it almost immediately and fix it *tout de suite.* The main lag will probably be how quickly the Chrome Web Store approves the update,
once it's published there.
