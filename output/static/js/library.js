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

  // ── Target Navigation Clicks (Quick Nav, Hire Me, Email Icon) ──
  const targetTriggers = document.querySelectorAll('[data-target]:not(.hotspot-btn)');
  targetTriggers.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const target = btn.getAttribute('data-target');
      openPanel(target);
    });
  });

  // ── Copy Email to Clipboard ──
  const copyEmailBtn = document.getElementById('copyEmailBtn');
  if (copyEmailBtn) {
    copyEmailBtn.addEventListener('click', () => {
      const email = copyEmailBtn.getAttribute('data-email') || 'arwa95025@gmail.com';
      const handleSuccess = () => {
        const originalText = copyEmailBtn.textContent;
        copyEmailBtn.textContent = 'Copied! ✓';
        copyEmailBtn.style.background = '#d4a853';
        copyEmailBtn.style.color = '#121e14';
        setTimeout(() => {
          copyEmailBtn.textContent = originalText;
          copyEmailBtn.style.background = '';
          copyEmailBtn.style.color = '';
        }, 2000);
      };

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(email).then(handleSuccess).catch(() => fallbackCopy(email, handleSuccess));
      } else {
        fallbackCopy(email, handleSuccess);
      }
    });
  }

  function fallbackCopy(text, onSuccess) {
    const tempInput = document.createElement('input');
    tempInput.value = text;
    document.body.appendChild(tempInput);
    tempInput.select();
    try {
      document.execCommand('copy');
      if (onSuccess) onSuccess();
    } catch (e) {}
    document.body.removeChild(tempInput);
  }

  // ── Contact Form Handling ──
  const contactForm = document.getElementById('contactForm');
  const formStatus = document.getElementById('formStatus');
  const submitBtn = document.getElementById('contactSubmitBtn');

  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const nameInput = document.getElementById('contactName');
      const emailInput = document.getElementById('contactEmail');
      const msgInput = document.getElementById('contactMsg');

      const name = nameInput ? nameInput.value.trim() : '';
      const email = emailInput ? emailInput.value.trim() : '';
      const message = msgInput ? msgInput.value.trim() : '';

      // Client validation matching CS50P rules
      if (name.length < 2) {
        if (formStatus) {
          formStatus.textContent = 'Please enter your name (min 2 characters).';
          formStatus.className = 'form-status error';
        }
        if (nameInput) nameInput.focus();
        return;
      }

      const emailRegex = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
      if (!emailRegex.test(email)) {
        if (formStatus) {
          formStatus.textContent = 'Please enter a valid email address.';
          formStatus.className = 'form-status error';
        }
        if (emailInput) emailInput.focus();
        return;
      }

      if (message.length < 10) {
        if (formStatus) {
          formStatus.textContent = 'Message must be at least 10 characters.';
          formStatus.className = 'form-status error';
        }
        if (msgInput) msgInput.focus();
        return;
      }

      // Success feedback
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.6';
      }
      if (formStatus) {
        formStatus.textContent = 'Message sent! Arwa will reply soon. ✨';
        formStatus.className = 'form-status';
      }

      contactForm.reset();

      setTimeout(() => {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.style.opacity = '1';
        }
      }, 3500);
    });
  }

  // ── Tab & Modal Switchers (Works on all elements with data-switch-to) ──
  document.querySelectorAll('[data-switch-to]').forEach(btn => {
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

  // ── Fairy Dust Sparkling Motes (Dancing Left & Right Across Books) ──
  function createFairyDust() {
    const bookHotspots = document.querySelectorAll('.hotspot-btn');
    bookHotspots.forEach(btn => {
      // Create container for the fairy dust
      const dustWrap = document.createElement('div');
      dustWrap.className = 'fairy-dust-container';
      dustWrap.setAttribute('aria-hidden', 'true');

      // 7 dancing stardust motes per book
      const moteCount = 7;
      for (let i = 0; i < moteCount; i++) {
        const mote = document.createElement('span');
        mote.className = 'fairy-mote';

        // Stagger positions across the book body
        const startX = 10 + (i * 12) + (Math.random() * 8); // 10% to 90%
        const startY = 15 + Math.random() * 70; // 15% to 85%

        // Drift distance: graceful left-to-right swaying movement (15px to 32px)
        const driftDistance = 15 + Math.random() * 18;
        const driftY = (Math.random() - 0.5) * 8; // gentle vertical float
        const dur = 2.4 + Math.random() * 2.2; // 2.4s to 4.6s cycle
        const delay = -(Math.random() * 4); // negative delay so all motes are active immediately

        // Alternate drift directions: odd motes drift right, even motes drift left
        const dir = i % 2 === 0 ? 1 : -1;

        mote.style.left = `${Math.min(92, Math.max(8, startX))}%`;
        mote.style.top = `${Math.min(88, Math.max(12, startY))}%`;
        mote.style.setProperty('--drift-x', `${driftDistance * dir}px`);
        mote.style.setProperty('--drift-y', `${driftY}px`);
        mote.style.setProperty('--dur', `${dur}s`);
        mote.style.setProperty('--delay', `${delay}s`);

        // Natural size variation (2px to 3.5px)
        const size = (2.2 + Math.random() * 1.4).toFixed(1);
        mote.style.width = `${size}px`;
        mote.style.height = `${size}px`;

        dustWrap.appendChild(mote);
      }

      btn.appendChild(dustWrap);
    });
  }

  createFireflies();
  createFairyDust();
});
