let hoveredVideo = null;

document.addEventListener('mousemove', (e) => {
  for (const el of document.elementsFromPoint(e.clientX, e.clientY)) {
    const renderer = el.closest('ytd-rich-item-renderer, ytd-video-renderer, ytd-compact-video-renderer');
    if (renderer) {
      hoveredVideo = renderer;
      return;
    }
  }
  hoveredVideo = null;
}, { passive: true });

window.addEventListener('keydown', (e) => {
  const key = e.key.toLowerCase();
  if (key !== 'x' && key !== 'w') return;
  const tag = e.target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable) return;
  if (hoveredVideo) {
    e.preventDefault();
    e.stopImmediatePropagation();
    clickMenuOption(hoveredVideo, key === 'x' ? 'not interested' : 'watch later');
  }
}, true);

async function clickMenuOption(videoElement, optionText) {
  const menuButton = findMenuButton(videoElement);
  if (!menuButton) return;

  menuButton.click();

  await waitForElement('ytd-popup-container yt-list-item-view-model');
  await new Promise(r => setTimeout(r, 200));

  for (const item of document.querySelectorAll('ytd-popup-container yt-list-item-view-model')) {
    if (item.textContent.toLowerCase().includes(optionText)) {
      item.click();
      return;
    }
  }

  document.body.click();
}

function findMenuButton(videoElement) {
  for (const btn of videoElement.querySelectorAll('button')) {
    const label = (btn.getAttribute('aria-label') || btn.getAttribute('title') || '').toLowerCase();
    if (label.includes('action') || label.includes('menu')) return btn;
  }
  return videoElement.querySelector('ytd-menu-renderer button, #menu button');
}

function waitForElement(selector) {
  return new Promise((resolve) => {
    if (document.querySelector(selector)) return resolve();
    const observer = new MutationObserver(() => {
      if (document.querySelector(selector)) {
        observer.disconnect();
        resolve();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => { observer.disconnect(); resolve(); }, 1000);
  });
}
