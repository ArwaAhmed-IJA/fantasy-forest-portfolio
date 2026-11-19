/**
 * door.js — Fantasy Forest Door Landing Page
 * CS50P Final Project — Arwa Ahmed
 *
 * Handles 3D door opening animation, light flood transition,
 * keyboard accessibility, and ambient floating fireflies/petals.
 */

document.addEventListener('DOMContentLoaded', () => {
  const enterBtn = document.getElementById('enterBtn');
  const doorLeaf = document.getElementById('doorLeaf');
  const doorInterior = document.getElementById('doorInterior');
  const lightFlood = document.getElementById('lightFlood');
  const particlesContainer = document.getElementById('particles');

  let isOpening = false;

  // ── Floating Ambient Fireflies & Petals ──
  function createParticles() {
    if (!particlesContainer) return;

    const count = 35;
    const palette = [
      { color: 'rgba(255, 230, 130, 0.95)', isFirefly: true },
      { color: 'rgba(255, 195, 80, 0.9)', isFirefly: true },
      { color: 'rgba(184, 150, 220, 0.75)', isFirefly: false }, // wisteria
      { color: 'rgba(215, 180, 245, 0.65)', isFirefly: false }, // soft lilac
      { color: 'rgba(250, 185, 200, 0.7)', isFirefly: false },  // rose petal
    ];

    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      p.className = 'particle';

      const item = palette[Math.floor(Math.random() * palette.length)];
      const size = item.isFirefly ? (Math.random() * 3 + 3) : (Math.random() * 7 + 5);
      const startX = Math.random() * 100;
      const startY = Math.random() * 85 + 15;
      const tx = (Math.random() - 0.5) * 160;
      const ty = -(Math.random() * 220 + 80);
      const dur = Math.random() * 6 + 6;
      const delay = Math.random() * 5;
      const maxOp = item.isFirefly ? (Math.random() * 0.4 + 0.6) : (Math.random() * 0.4 + 0.35);

      p.style.width = `${size}px`;
      p.style.height = item.isFirefly ? `${size}px` : `${size * 1.3}px`;
      p.style.background = item.color;
      p.style.left = `${startX}%`;
      p.style.top = `${startY}%`;
      p.style.setProperty('--tx', `${tx}px`);
      p.style.setProperty('--ty', `${ty}px`);
      p.style.setProperty('--dur', `${dur}s`);
      p.style.setProperty('--delay', `${delay}s`);
      p.style.setProperty('--max-op', maxOp);

      if (item.isFirefly) {
        p.style.borderRadius = '50%';
        p.style.boxShadow = `0 0 10px 2px ${item.color}`;
      }

      particlesContainer.appendChild(p);
    }
  }

  // ── Door Open Transition ──
  function openDoor() {
    if (isOpening) return;
    isOpening = true;

    // Accessibility check: reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      window.location.href = 'library.html';
      return;
    }

    try {
      localStorage.setItem('hasEnteredDoor', 'true');
    } catch (e) {}

    // 1. Swing door open
    if (doorLeaf) doorLeaf.classList.add('is-open');
    if (doorInterior) doorInterior.classList.add('active');

    // 2. Flood screen with warm light
    setTimeout(() => {
      if (lightFlood) lightFlood.classList.add('active');
    }, 220);

    // 3. Navigate into the fantasy library
    setTimeout(() => {
      window.location.href = 'library.html';
    }, 920);
  }

  if (enterBtn) {
    enterBtn.addEventListener('click', openDoor);
    enterBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openDoor();
      }
    });
  }

  createParticles();
});
