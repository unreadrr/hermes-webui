/**
 * personal-m3-rewrite: cream skin DOM restructure.
 *
 * The mockup's M3 chat layout has:
 *   - topbar with chips (model, effort, profile, yolo, ctx-progress)
 *   - chat content
 *   - SINGLE-ROW pill composer: 📎 + textarea + 🎤 + send
 *
 * Live HTML has those chips INSIDE composer-footer.  CSS-only can't
 * physically move them.  This script does — but ONLY when data-skin=cream.
 * Other skins keep their existing layout untouched.
 *
 * Idempotent: safe to call multiple times, won't double-move nodes.
 * Reversible: switching away from cream restores chips to composer.
 */
(function () {
  'use strict';

  const TOPBAR_ID = 'creamM3Topbar';
  const CHIP_IDS = [
    'yoloPill',
    'profileChipWrap',
    'composerToolsetsPillBtn',
    'composerMobileWorkspaceAction',
    'composerMobileModelAction',
    'composerMobileReasoningAction',
    'composerMobileContextAction',
    'ctxIndicatorWrap',
    'bgBadge',
  ];

  // Original parents — recorded on first move so we can restore on skin change
  const _originalParents = new WeakMap();

  function isCreamActive() {
    return document.documentElement.getAttribute('data-skin') === 'cream';
  }

  function ensureTopbar() {
    let topbar = document.getElementById(TOPBAR_ID);
    if (topbar) return topbar;

    const messagesShell = document.querySelector('.messages-shell');
    if (!messagesShell) return null;

    topbar = document.createElement('div');
    topbar.id = TOPBAR_ID;
    topbar.className = 'cream-m3-topbar';

    // Insert as the FIRST child of messages-shell so it sits above .messages
    messagesShell.insertBefore(topbar, messagesShell.firstChild);
    return topbar;
  }

  function moveChipsToTopbar() {
    const topbar = ensureTopbar();
    if (!topbar) return;

    for (const id of CHIP_IDS) {
      const el = document.getElementById(id);
      if (!el) continue;
      if (el.parentElement === topbar) continue;
      // Record original parent + position for reversal
      if (!_originalParents.has(el)) {
        _originalParents.set(el, {
          parent: el.parentElement,
          nextSibling: el.nextElementSibling,
        });
      }
      topbar.appendChild(el);
      el.classList.add('cream-m3-relocated');
    }
  }

  function restoreChipsToComposer() {
    for (const id of CHIP_IDS) {
      const el = document.getElementById(id);
      if (!el) continue;
      const orig = _originalParents.get(el);
      if (!orig || !orig.parent) continue;
      try {
        if (orig.nextSibling && orig.nextSibling.parentElement === orig.parent) {
          orig.parent.insertBefore(el, orig.nextSibling);
        } else {
          orig.parent.appendChild(el);
        }
        el.classList.remove('cream-m3-relocated');
      } catch (_) {}
    }
    const topbar = document.getElementById(TOPBAR_ID);
    if (topbar) topbar.remove();
  }

  function apply() {
    if (isCreamActive()) {
      moveChipsToTopbar();
    } else {
      restoreChipsToComposer();
    }
  }

  // Run on DOM ready and on every skin change
  function init() {
    apply();

    // Watch for skin attribute changes on <html>
    const obs = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'attributes' && m.attributeName === 'data-skin') {
          apply();
          return;
        }
      }
    });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-skin'] });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
