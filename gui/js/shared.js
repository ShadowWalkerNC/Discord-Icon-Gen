/**
 * shared.js — Sigil GUI shared UX utilities v1.0
 * Include at the bottom of <body> on every GUI page.
 *
 * Provides:
 *   - showToast(message, type?)  — success | error | info | warning
 *   - showLoading(message?)      — full-page canvas loading overlay
 *   - hideLoading()              — remove loading overlay
 *   - initMobileNav()            — hamburger toggle for .nav-links
 *   - initTheme()                — persist dark/light theme in localStorage
 */

(function () {
  'use strict';

  /* ─────────────────────────────────────────────────────────────────────────
   * STYLES — injected once into <head>
   * ───────────────────────────────────────────────────────────────────────── */
  const CSS = `
    /* ── Toast ── */
    #sigil-toast-container {
      position: fixed;
      bottom: 1.5rem;
      right: 1.5rem;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: .5rem;
      pointer-events: none;
    }
    .sigil-toast {
      display: flex;
      align-items: center;
      gap: .6rem;
      padding: .7rem 1.1rem;
      border-radius: .65rem;
      font-size: .875rem;
      font-weight: 600;
      font-family: 'Inter', sans-serif;
      color: #fff;
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255,255,255,.12);
      box-shadow: 0 4px 24px rgba(0,0,0,.5);
      pointer-events: all;
      opacity: 0;
      transform: translateX(2rem);
      transition: opacity 260ms ease, transform 260ms cubic-bezier(.16,1,.3,1);
      max-width: 340px;
      word-break: break-word;
    }
    .sigil-toast.show { opacity: 1; transform: translateX(0); }
    .sigil-toast.hide { opacity: 0; transform: translateX(2rem); }
    .sigil-toast.toast-success { background: rgba(57,255,20,.18); border-color: rgba(57,255,20,.35); }
    .sigil-toast.toast-error   { background: rgba(255,68,68,.22); border-color: rgba(255,68,68,.4); }
    .sigil-toast.toast-warning { background: rgba(255,165,0,.2);  border-color: rgba(255,165,0,.4); }
    .sigil-toast.toast-info    { background: rgba(88,101,242,.22);border-color: rgba(88,101,242,.4); }
    .toast-icon { font-size: 1rem; flex-shrink: 0; }

    /* ── Loading overlay ── */
    #sigil-loading-overlay {
      position: fixed;
      inset: 0;
      z-index: 9990;
      background: rgba(8,8,15,.78);
      backdrop-filter: blur(4px);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      opacity: 0;
      transition: opacity 200ms ease;
      pointer-events: none;
    }
    #sigil-loading-overlay.visible {
      opacity: 1;
      pointer-events: all;
    }
    .sigil-spinner {
      width: 48px;
      height: 48px;
      border: 4px solid rgba(255,255,255,.1);
      border-top-color: #8b0000;
      border-right-color: #4b0082;
      border-radius: 50%;
      animation: sigil-spin 700ms linear infinite;
    }
    @keyframes sigil-spin { to { transform: rotate(360deg); } }
    .sigil-loading-text {
      font-family: 'Orbitron', 'Arial', sans-serif;
      font-size: .85rem;
      font-weight: 700;
      color: rgba(255,255,255,.7);
      letter-spacing: .1em;
    }

    /* ── Mobile hamburger ── */
    .nav-hamburger {
      display: none;
      flex-direction: column;
      gap: 5px;
      background: none;
      border: none;
      cursor: pointer;
      padding: .35rem;
      border-radius: .4rem;
      margin-left: auto;
      transition: background 150ms;
    }
    .nav-hamburger:hover { background: rgba(255,255,255,.07); }
    .nav-hamburger span {
      display: block;
      width: 22px;
      height: 2px;
      background: rgba(255,255,255,.75);
      border-radius: 2px;
      transition: transform 250ms ease, opacity 200ms ease;
    }
    .nav-hamburger.open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
    .nav-hamburger.open span:nth-child(2) { opacity: 0; }
    .nav-hamburger.open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

    @media (max-width: 680px) {
      .nav-hamburger { display: flex; }
      .nav-links {
        display: none !important;
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        flex-direction: column !important;
        background: rgba(8,8,15,.97);
        border-bottom: 1px solid rgba(255,255,255,.1);
        padding: .6rem .75rem .9rem;
        gap: .2rem !important;
        backdrop-filter: blur(16px);
      }
      .nav-links.mobile-open {
        display: flex !important;
      }
      .nav-links .nav-a,
      .nav-links .nav-cta {
        padding: .6rem 1rem;
        font-size: .9rem;
        border-radius: .5rem;
      }
      .nav-links .nav-cta {
        margin-top: .3rem;
        text-align: center;
      }
    }
  `;

  function injectStyles() {
    if (document.getElementById('sigil-shared-styles')) return;
    const style = document.createElement('style');
    style.id = 'sigil-shared-styles';
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  /* ─────────────────────────────────────────────────────────────────────────
   * TOAST
   * ───────────────────────────────────────────────────────────────────────── */
  const TOAST_ICONS = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  let toastContainer = null;

  function getToastContainer() {
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'sigil-toast-container';
      document.body.appendChild(toastContainer);
    }
    return toastContainer;
  }

  /**
   * Show a toast notification.
   * @param {string} message
   * @param {'success'|'error'|'warning'|'info'} [type='info']
   * @param {number} [duration=3800]
   */
  window.showToast = function (message, type = 'info', duration = 3800) {
    injectStyles();
    const c = getToastContainer();
    const toast = document.createElement('div');
    toast.className = `sigil-toast toast-${type}`;
    toast.innerHTML = `<span class="toast-icon">${TOAST_ICONS[type] || 'ℹ️'}</span><span>${message}</span>`;
    c.appendChild(toast);
    requestAnimationFrame(() => { requestAnimationFrame(() => { toast.classList.add('show'); }); });
    const remove = () => {
      toast.classList.remove('show');
      toast.classList.add('hide');
      setTimeout(() => toast.remove(), 300);
    };
    setTimeout(remove, duration);
    toast.addEventListener('click', remove);
  };

  /* ─────────────────────────────────────────────────────────────────────────
   * LOADING OVERLAY
   * ───────────────────────────────────────────────────────────────────────── */
  let loadingOverlay = null;

  function getOverlay() {
    if (!loadingOverlay) {
      loadingOverlay = document.createElement('div');
      loadingOverlay.id = 'sigil-loading-overlay';
      loadingOverlay.innerHTML = `
        <div class="sigil-spinner"></div>
        <div class="sigil-loading-text" id="sigil-loading-text">RENDERING…</div>
      `;
      document.body.appendChild(loadingOverlay);
    }
    return loadingOverlay;
  }

  /**
   * Show the full-page loading overlay.
   * @param {string} [message='RENDERING…']
   */
  window.showLoading = function (message = 'RENDERING…') {
    injectStyles();
    const overlay = getOverlay();
    const txt = overlay.querySelector('#sigil-loading-text');
    if (txt) txt.textContent = message.toUpperCase();
    overlay.classList.add('visible');
  };

  /** Hide the loading overlay. */
  window.hideLoading = function () {
    if (loadingOverlay) loadingOverlay.classList.remove('visible');
  };

  /* ─────────────────────────────────────────────────────────────────────────
   * MOBILE NAV — hamburger toggle
   * ───────────────────────────────────────────────────────────────────────── */
  function initMobileNav() {
    const nav = document.querySelector('nav');
    if (!nav) return;
    const links = nav.querySelector('.nav-links');
    if (!links) return;
    if (nav.querySelector('.nav-hamburger')) return; // already initialised

    const btn = document.createElement('button');
    btn.className = 'nav-hamburger';
    btn.setAttribute('aria-label', 'Toggle navigation');
    btn.innerHTML = '<span></span><span></span><span></span>';

    // Insert before .nav-links
    nav.insertBefore(btn, links);

    btn.addEventListener('click', () => {
      const open = links.classList.toggle('mobile-open');
      btn.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', open);
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!nav.contains(e.target)) {
        links.classList.remove('mobile-open');
        btn.classList.remove('open');
      }
    });

    // Close on nav link click
    links.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        links.classList.remove('mobile-open');
        btn.classList.remove('open');
      });
    });
  }

  /* ─────────────────────────────────────────────────────────────────────────
   * THEME PERSISTENCE
   * ───────────────────────────────────────────────────────────────────────── */
  function initTheme() {
    const saved = localStorage.getItem('sigil-theme');
    if (saved) document.documentElement.setAttribute('data-theme', saved);
  }

  window.sigilSetTheme = function (theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('sigil-theme', theme);
  };

  /* ─────────────────────────────────────────────────────────────────────────
   * AUTO-INIT on DOMContentLoaded
   * ───────────────────────────────────────────────────────────────────────── */
  function init() {
    injectStyles();
    initTheme();
    initMobileNav();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
