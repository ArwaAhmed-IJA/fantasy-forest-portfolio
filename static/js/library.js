/**
 * library.js — Fantasy Library Scene Interactions
 * CS50P Final Project — Arwa Ahmed
 *
 * Manages interactive shelf hotspots, quick navigation toolbar,
 * parchment modal dialogs, accessible keyboard focus trapping,
 * dynamic attribute styling, and ambient firefly animations.
 */

document.addEventListener('DOMContentLoaded', () => {
  const body = document.body;
  const backdrop = document.getElementById('panelBackdrop');
  const firefliesContainer = document.getElementById('fireflies');
  const hotspotButtons = document.querySelectorAll('.hotspot-btn');
  const quickButtons = document.querySelectorAll('.quick-btn');
  const panels = document.querySelectorAll('.panel');
  const closeButtons = document.querySelectorAll('.panel-close');
  const projectTabButtons = document.querySelectorAll('.project-tab-btn');
  const btnLibFullscreen = document.getElementById('btnLibFullscreen');
  const btnLibFramed = document.getElementById('btnLibFramed');

  let activePanel = null;
  let lastFocusedElement = null;

  // ── Display Mode Switcher (Fullscreen vs Framed) ──
  function setLibDisplayMode(mode) {
    if (mode === 'framed') {
      body.classList.remove('mode-fullscreen');
      body.classList.add('mode-framed');
      if (btnLibFullscreen) btnLibFullscreen.classList.remove('active');
      if (btnLibFramed) btnLibFramed.classList.add('active');
    } else {
      body.classList.remove('mode-framed');
      body.classList.add('mode-fullscreen');
      if (btnLibFramed) btnLibFramed.classList.remove('active');
      if (btnLibFullscreen) btnLibFullscreen.classList.add('active');
    }

    try {
      localStorage.setItem('preferredLibDisplayMode', mode);
    } catch (e) {}
  }

  // Restore saved display mode (default: fullscreen)
  try {
    const savedLibMode = localStorage.getItem('preferredLibDisplayMode');
    if (savedLibMode === 'framed') {
      setLibDisplayMode('framed');
    } else {
      setLibDisplayMode('fullscreen');
    }
  } catch (e) {
    setLibDisplayMode('fullscreen');
  }

  if (btnLibFullscreen) {
    btnLibFullscreen.addEventListener('click', () => setLibDisplayMode('fullscreen'));
  }
  if (btnLibFramed) {
    btnLibFramed.addEventListener('click', () => setLibDisplayMode('framed'));
  }

  // ── Apply dynamic positioning and accent colors from data attributes ──
  function applyDynamicStyles() {
    // Position hotspots over the painting
    document.querySelectorAll('.hotspot-btn[data-top]').forEach(el => {
      el.style.top = `${el.dataset.top}%`;
      el.style.left = `${el.dataset.left}%`;
      el.style.width = `${el.dataset.width}%`;
      el.style.height = `${el.dataset.height}%`;
      if (el.dataset.color) {
        el.style.setProperty('--hs-color', el.dataset.color);
      }
    });

    // Quick nav button accents
    document.querySelectorAll('.quick-btn[data-accent]').forEach(el => {
      el.style.setProperty('--btn-accent', el.dataset.accent);
    });

    // Panel titles
    document.querySelectorAll('.panel-title[data-title-color]').forEach(el => {
      el.style.color = el.dataset.titleColor;
    });

    // Skill proficiency bars
    document.querySelectorAll('.skill-bar[data-bar-w]').forEach(el => {
      el.style.setProperty('--bar-w', `${el.dataset.barW}%`);
      if (el.dataset.barColor) {
        el.style.setProperty('--bar-color', el.dataset.barColor);
      }
    });
  }

  applyDynamicStyles();

  /**
   * Open a specific panel by ID
   * @param {string} targetId - e.g. 'languages', 'web', 'cs50p', 'about'
   */
  function openPanel(targetId) {
    if (!targetId) return;

    let panelId = `panel-${targetId}`;
    if (targetId === 'about') {
      panelId = 'panel-about';
    }

    const panel = document.getElementById(panelId);
    if (!panel) return;

    lastFocusedElement = document.activeElement;

    // Close any open panel first
    if (activePanel && activePanel !== panel) {
      closePanel(false);
    }

    activePanel = panel;
    if (backdrop) backdrop.classList.add('active');
    panel.classList.add('active');
    panel.setAttribute('aria-hidden', 'false');

    // Safely store last viewed panel
    try {
      localStorage.setItem('lastViewedLibraryPanel', targetId);
    } catch (e) {}

    // Focus close button for accessibility
    const closeBtn = panel.querySelector('.panel-close');
    if (closeBtn) {
      setTimeout(() => closeBtn.focus(), 60);
    }
  }

  /**
   * Close the currently active panel
   * @param {boolean} restoreFocus - Whether to return focus to opening element
   */
  function closePanel(restoreFocus = true) {
    if (!activePanel) return;

    activePanel.classList.remove('active');
    activePanel.setAttribute('aria-hidden', 'true');
    if (backdrop) backdrop.classList.remove('active');

    const prevEl = lastFocusedElement;
    activePanel = null;

    if (restoreFocus && prevEl && typeof prevEl.focus === 'function') {
      prevEl.focus();
    }
  }

  // ── Hotspot Clicks (Shelves & Table Books on the Painting) ──
  hotspotButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const target = btn.getAttribute('data-target');
      openPanel(target);
    });

    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const target = btn.getAttribute('data-target');
        openPanel(target);
      }
    });
  });

  // ── Quick Access Toolbar Clicks ──
  quickButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const target = btn.getAttribute('data-target');
      openPanel(target);
    });
  });

  // ── Project Tabs Switcher (Inside Project Modal) ──
  projectTabButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const target = btn.getAttribute('data-switch-to');
      if (target) {
        openPanel(target);
      }
    });
  });

  // ── Close Buttons ──
  closeButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      closePanel(true);
    });
  });

  // Backdrop click dismisses modal
  if (backdrop) {
    backdrop.addEventListener('click', () => {
      closePanel(true);
    });
  }

  // Escape key closes modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && activePanel) {
      closePanel(true);
    }
  });

  // ── Ambient Firefly Particles ──
  function createFireflies() {
    if (!firefliesContainer) return;

    const count = 35;
    for (let i = 0; i < count; i++) {
      const fly = document.createElement('div');
      fly.className = 'firefly';

      const left = Math.random() * 100;
      const top = Math.random() * 95;
      const dur = Math.random() * 5 + 4; // 4s - 9s
      const delay = Math.random() * 5;
      const tx = (Math.random() - 0.5) * 60;
      const ty = -(Math.random() * 60 + 20);
      const tx2 = (Math.random() - 0.5) * 40;
      const ty2 = -(Math.random() * 90 + 40);

      fly.style.left = `${left}%`;
      fly.style.top = `${top}%`;
      fly.style.setProperty('--dur', `${dur}s`);
      fly.style.setProperty('--delay', `${delay}s`);
      fly.style.setProperty('--tx', `${tx}px`);
      fly.style.setProperty('--ty', `${ty}px`);
      fly.style.setProperty('--tx2', `${tx2}px`);
      fly.style.setProperty('--ty2', `${ty2}px`);

      firefliesContainer.appendChild(fly);
    }
  }

  createFireflies();
});
