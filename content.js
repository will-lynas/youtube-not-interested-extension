// Track the currently hovered video element
let hoveredVideo = null;

console.log('=== YouTube Not Interested extension loaded ===');

// Track based on element position for thumbnails
document.addEventListener('mousemove', (e) => {
  const elementsAtPoint = document.elementsFromPoint(e.clientX, e.clientY);
  let found = false;
  for (const el of elementsAtPoint) {
    const renderer = el.closest('ytd-rich-item-renderer, ytd-video-renderer, ytd-compact-video-renderer');
    if (renderer) {
      hoveredVideo = renderer;
      found = true;
      break;
    }
  }
  if (!found) {
    hoveredVideo = null;
  }
}, { passive: true });

// Key handler
function handleKeyDown(e) {
  if (e.key.toLowerCase() !== 'x') return;

  console.log('X pressed! Hovered video:', hoveredVideo ? 'YES' : 'NO');

  const tag = e.target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable) {
    console.log('Ignoring - in text field');
    return;
  }

  if (hoveredVideo) {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    markNotInterested(hoveredVideo);
  }
}

// Add listeners to multiple targets for better capture
window.addEventListener('keydown', handleKeyDown, true);
document.addEventListener('keydown', handleKeyDown, true);

async function markNotInterested(videoElement) {
  console.log('Video element:', videoElement.tagName);

  // Find ALL buttons in the element and log them
  const allButtons = videoElement.querySelectorAll('button');
  console.log('All buttons:', allButtons.length);

  let menuButton = null;

  // Look for buttons - the menu button typically has specific characteristics
  for (const btn of allButtons) {
    const ariaLabel = btn.getAttribute('aria-label') || '';
    const title = btn.getAttribute('title') || '';

    console.log('Button aria-label:', ariaLabel);

    // Menu button often has "Action menu" or similar label
    if (ariaLabel.toLowerCase().includes('action') ||
        ariaLabel.toLowerCase().includes('menu') ||
        title.toLowerCase().includes('action') ||
        title.toLowerCase().includes('menu')) {
      menuButton = btn;
      break;
    }
  }

  // If not found by aria-label, look for the button in ytd-menu-renderer
  if (!menuButton) {
    const menuRenderer = videoElement.querySelector('ytd-menu-renderer');
    if (menuRenderer) {
      menuButton = menuRenderer.querySelector('button');
      console.log('Found button in ytd-menu-renderer');
    }
  }

  // Try finding inline-menu-button (used on home page)
  if (!menuButton) {
    const inlineMenu = videoElement.querySelector('#menu button, [id="menu"] button');
    if (inlineMenu) {
      menuButton = inlineMenu;
      console.log('Found inline menu button');
    }
  }

  // Last resort: find button with yt-icon-button or three-dot icon
  if (!menuButton) {
    const iconButtons = videoElement.querySelectorAll('yt-icon-button button, button.yt-icon-button');
    for (const btn of iconButtons) {
      menuButton = btn;
      console.log('Found yt-icon-button');
      break;
    }
  }

  // Try ytd-button-renderer with icon
  if (!menuButton) {
    const buttonRenderer = videoElement.querySelector('ytd-button-renderer button');
    if (buttonRenderer) {
      menuButton = buttonRenderer;
      console.log('Found ytd-button-renderer button');
    }
  }

  console.log('Menu button found:', !!menuButton);

  if (!menuButton) {
    showFeedback(videoElement, 'Menu not found', false);
    return;
  }

  // Click the menu button
  menuButton.click();
  console.log('Clicked menu button');

  // Wait for menu popup
  await waitForElement('ytd-menu-service-item-renderer, tp-yt-paper-item, yt-list-item-view-model', 1500);
  await sleep(300);

  // Find "Not interested" option - try multiple selectors for different YouTube versions
  const menuItems = document.querySelectorAll('ytd-menu-service-item-renderer, tp-yt-paper-item, yt-list-item-view-model, ytd-menu-popup-renderer yt-formatted-string');
  console.log('Found menu items:', menuItems.length);

  for (const item of menuItems) {
    const text = item.textContent.toLowerCase();
    console.log('Menu item:', text.substring(0, 50));
    if (text.includes('not interested')) {
      item.click();
      showFeedback(videoElement, 'Not interested!', true);
      return;
    }
  }

  // Close menu
  document.body.click();
  showFeedback(videoElement, 'Option not found', false);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function waitForElement(selector, timeout) {
  return new Promise((resolve) => {
    if (document.querySelector(selector)) {
      resolve(true);
      return;
    }

    const observer = new MutationObserver(() => {
      if (document.querySelector(selector)) {
        observer.disconnect();
        resolve(true);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => {
      observer.disconnect();
      resolve(false);
    }, timeout);
  });
}

function showFeedback(element, message, success) {
  const feedback = document.createElement('div');
  feedback.textContent = message;
  feedback.style.cssText = `
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: ${success ? 'rgba(0, 128, 0, 0.9)' : 'rgba(128, 0, 0, 0.9)'};
    color: white;
    padding: 8px 16px;
    border-radius: 4px;
    font-size: 14px;
    font-weight: bold;
    z-index: 9999;
    pointer-events: none;
  `;

  element.style.position = 'relative';
  element.appendChild(feedback);

  setTimeout(() => feedback.remove(), 1500);
}
