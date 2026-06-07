/**
 * JTGeats — script.js  (Production Ready — Final Pass)
 *
 * Features:
 *  1. Mobile Navigation  — hamburger, slide menu, overlay, keyboard, Escape
 *  2. Cart Badge         — count, SR live-region, badge animation, 99+ cap
 *  3. Modal              — focus trap, Escape, backdrop, validation, success state
 *  4. Carousel           — autoplay, prev/next, keyboard, touch/swipe, responsive
 *  5. Quantity           — increment / decrement with min/max guard, a11y labels
 *  6. Add-to-Cart        — badge update, SR announcement, button feedback
 *  7. Hero Search        — scroll-to-menu interaction
 *  8. Video Player       — toggle play/pause, overlay, keyboard
 *  9. Contact Form       — full validation with a11y feedback
 *
 * Architecture:
 *  - Each feature is an IIFE; no shared globals pollute the namespace.
 *  - All DOM queries are guarded; missing elements skip gracefully.
 *  - No third-party libraries required.
 */

'use strict';

/* ─── Micro helpers ──────────────────────────────────────────── */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

/* ═══════════════════════════════════════════════════════════════
   1. MOBILE NAVIGATION
   ═══════════════════════════════════════════════════════════════ */
(function initMobileNav() {
  const hamburger  = $('#hamburger');
  const mobileMenu = $('#mobileMenu');
  const overlay    = $('#mobileOverlay');
  const closeBtn   = $('#mobileMenuClose');

  if (!hamburger || !mobileMenu) return;

  function openMenu() {
    hamburger.setAttribute('aria-expanded', 'true');
    mobileMenu.setAttribute('aria-hidden', 'false');
    mobileMenu.classList.add('active');
    overlay?.classList.add('active');
    document.body.classList.add('menu-open');

    // Focus first link after transition begins
    const firstLink = mobileMenu.querySelector('a');
    if (firstLink) setTimeout(() => firstLink.focus(), 50);
  }

  function closeMenu() {
    hamburger.setAttribute('aria-expanded', 'false');
    mobileMenu.setAttribute('aria-hidden', 'true');
    mobileMenu.classList.remove('active');
    overlay?.classList.remove('active');
    document.body.classList.remove('menu-open');
    hamburger.focus();
  }

  hamburger.addEventListener('click', openMenu);
  closeBtn?.addEventListener('click', closeMenu);
  overlay?.addEventListener('click', closeMenu);

  // Close on menu link click (SPA-style smooth scroll)
  $$('a', mobileMenu).forEach((link) => {
    link.addEventListener('click', closeMenu);
  });

  // Keyboard: Escape closes
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileMenu.classList.contains('active')) {
      closeMenu();
    }
  });
})();

/* ═══════════════════════════════════════════════════════════════
   2. CART BADGE — centralised cart state
   ═══════════════════════════════════════════════════════════════ */
const Cart = (function () {
  let count = 0;

  const badge      = $('#cartBadge');
  const cartBtn    = $('#cartBtn');
  const liveRegion = $('#cartFeedback');
  let clearTimer   = null;

  function updateBadge() {
    if (!badge) return;

    if (count <= 0) {
      badge.textContent = '';
      badge.classList.add('empty-dot');
    } else {
      const label = count >= 100 ? '99+' : String(count);
      badge.textContent = label;
      badge.classList.remove('empty-dot');

      // Bump animation: force reflow between class removal and re-add
      badge.classList.remove('bump');
      void badge.offsetWidth;
      badge.classList.add('bump');
      badge.addEventListener('animationend', () => badge.classList.remove('bump'), { once: true });
    }

    // Update aria-label on cart button
    if (cartBtn) {
      cartBtn.setAttribute('aria-label', `Open cart (${count} item${count !== 1 ? 's' : ''})`);
    }
  }

  function announce(msg) {
    if (!liveRegion) return;
    clearTimeout(clearTimer);
    liveRegion.textContent = '';
    requestAnimationFrame(() => { liveRegion.textContent = msg; });
    clearTimer = setTimeout(() => { liveRegion.textContent = ''; }, 3000);
  }

  function addItem(name) {
    count++;
    updateBadge();
    announce(`${name} added to cart. ${count} item${count !== 1 ? 's' : ''} in cart.`);
  }

  function removeItem(name) {
    if (count > 0) {
      count--;
      updateBadge();
      announce(`${name} removed from cart. ${count} item${count !== 1 ? 's' : ''} in cart.`);
    }
  }

  // Initialise badge state
  updateBadge();

  return { addItem, removeItem };
})();

/* ═══════════════════════════════════════════════════════════════
   3. MODAL — Request a Dish
   ═══════════════════════════════════════════════════════════════ */
(function initModal() {
  const modalBg    = $('#modalBg');
  const openBtn    = $('#requestDishBtn');
  const cancelBtn  = $('#cancelBtn');
  const submitBtn  = $('#submitBtn');
  const closeX     = $('#modalCloseX');
  const dishInput  = $('#dishName');
  const dishError  = $('#dishNameError');
  const successDiv = $('#modalSuccess');
  const actionsDiv = $('#mActions');

  if (!modalBg) return;

  let triggerEl = null;

  function focusableEls() {
    return $$(
      'a[href], button:not([disabled]), input:not([disabled]), ' +
      'select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      modalBg
    );
  }

  function openModal(trigger) {
    triggerEl = trigger || null;
    showFormState();
    clearFieldError();

    modalBg.removeAttribute('inert');
    modalBg.classList.add('open');
    document.body.classList.add('modal-open');

    // Focus first focusable element after animation frame
    requestAnimationFrame(() => {
      const first = focusableEls()[0];
      if (first) first.focus();
    });
  }

  function closeModal() {
    clearFieldError();
    modalBg.classList.remove('open');
    document.body.classList.remove('modal-open');

    modalBg.addEventListener('transitionend', () => {
      modalBg.setAttribute('inert', '');
    }, { once: true });

    if (triggerEl) {
      triggerEl.focus();
      triggerEl = null;
    }
  }

  function showFormState() {
    if (successDiv) successDiv.hidden = true;
    if (actionsDiv) actionsDiv.style.display = '';
    $$('.m-field', modalBg).forEach(f => { f.style.display = ''; });
    const sub = $('.m-sub', modalBg);
    if (sub) sub.style.display = '';
  }

  function showSuccessState() {
    $$('.m-field', modalBg).forEach(f => { f.style.display = 'none'; });
    const sub = $('.m-sub', modalBg);
    if (sub) sub.style.display = 'none';
    if (actionsDiv) {
      actionsDiv.style.display = 'flex';
      actionsDiv.innerHTML = `<button class="m-submit" id="successCloseBtn" type="button">Close</button>`;
      $('#successCloseBtn')?.addEventListener('click', closeModal);
    }
    if (successDiv) successDiv.hidden = false;
  }

  function clearFieldError() {
    if (dishError) dishError.textContent = '';
    if (dishInput) dishInput.removeAttribute('aria-invalid');
  }

  function handleSubmit() {
    const val = dishInput ? dishInput.value.trim() : '';

    if (!val) {
      if (dishError) dishError.textContent = 'Please enter a dish name.';
      if (dishInput) {
        dishInput.setAttribute('aria-invalid', 'true');
        dishInput.focus();
      }
      return;
    }

    // Loading state
    if (submitBtn) {
      submitBtn.textContent = 'Submitting…';
      submitBtn.classList.add('loading');
    }

    // Simulate async submit
    setTimeout(() => {
      if (dishInput) dishInput.value = '';
      const typeEl = $('#dishType');
      const noteEl = $('#dishNote');
      if (typeEl) typeEl.value = '';
      if (noteEl) noteEl.value = '';

      clearFieldError();
      showSuccessState();

      if (submitBtn) {
        submitBtn.textContent = 'Submit Request';
        submitBtn.classList.remove('loading');
      }
    }, 800);
  }

  // Tab-key focus trap
  function trapFocus(e) {
    if (!modalBg.classList.contains('open') || e.key !== 'Tab') return;
    const els = focusableEls();
    if (!els.length) { e.preventDefault(); return; }
    const first = els[0];
    const last  = els[els.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
    }
  }

  openBtn?.addEventListener('click',  (e) => openModal(e.currentTarget));
  cancelBtn?.addEventListener('click', closeModal);
  closeX?.addEventListener('click',   closeModal);
  submitBtn?.addEventListener('click', handleSubmit);

  // Close on backdrop click (only if clicking the backdrop itself)
  modalBg.addEventListener('click', (e) => {
    if (e.target === modalBg) closeModal();
  });

  // Escape closes, Tab is trapped
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalBg.classList.contains('open')) {
      closeModal();
      return;
    }
    trapFocus(e);
  });

  // Clear individual field errors on input
  dishInput?.addEventListener('input', () => {
    if (dishInput.getAttribute('aria-invalid') === 'true') {
      clearFieldError();
    }
  });
})();

/* ═══════════════════════════════════════════════════════════════
   4. CAROUSEL — Popular Items
   ═══════════════════════════════════════════════════════════════ */
(function initCarousel() {
  const viewport = $('#cViewport');
  const track    = $('#cTrack');
  const prevBtn  = $('#prevBtn');
  const nextBtn  = $('#nextBtn');

  if (!track || !viewport) return;

  const slides = $$('.c-slide', track);
  const total  = slides.length;
  const GAP    = 20; // px, must match CSS .c-track gap

  let index      = 0;
  let visible    = 3;
  let autoTimer  = null;
  let resizeTimer = null;

  function visibleCount() {
    const vw = window.innerWidth;
    if (vw <= 820)  return 1;
    if (vw <= 1100) return 2;
    return 3;
  }

  function getSlideWidth() {
    const slide = slides[0];
    if (!slide) return 0;
    return slide.getBoundingClientRect().width;
  }

  function stride() {
    if (slides.length < 2) return getSlideWidth();
    return slides[1].offsetLeft - slides[0].offsetLeft;
  }

  function maxIndex() {
    return Math.max(0, total - visible);
  }

  function updateActiveCard() {
    const allCards = $$('.pop-card', track);
    allCards.forEach(card => card.classList.remove('pop-card--active'));

    // Highlight the center slide among currently visible slides
    const centerOffset = Math.floor(visible / 2);
    const activeIdx = Math.min(index + centerOffset, total - 1);
    const activeSlide = slides[activeIdx];
    if (activeSlide) {
      const card = activeSlide.querySelector('.pop-card');
      if (card) card.classList.add('pop-card--active');
    }
  }

  function goTo(i) {
    index = Math.min(Math.max(i, 0), maxIndex());

    requestAnimationFrame(() => {
      track.style.transform = `translateX(-${index * stride()}px)`;
    });

    if (prevBtn) prevBtn.disabled = index === 0;
    if (nextBtn) nextBtn.disabled = index >= maxIndex();

    updateActiveCard();

    // Update ARIA live region
    const from = index + 1;
    const to   = Math.min(index + visible, total);
    track.setAttribute(
      'aria-label',
      `Popular items carousel, showing items ${from} to ${to} of ${total}`
    );
  }

  function advance() {
    goTo(index >= maxIndex() ? 0 : index + 1);
  }

  function startAuto() {
    stopAuto();
    autoTimer = setInterval(advance, 5000);
  }

  function stopAuto() {
    clearInterval(autoTimer);
    autoTimer = null;
  }

  // Navigation buttons
  prevBtn?.addEventListener('click', () => { goTo(index - 1); startAuto(); });
  nextBtn?.addEventListener('click', () => { goTo(index + 1); startAuto(); });

  // Keyboard arrows (skip if focus is inside a form or modal)
  document.addEventListener('keydown', (e) => {
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
    if (document.activeElement?.closest('#modalBg')) return;
    if (e.key === 'ArrowLeft')  { goTo(index - 1); startAuto(); }
    if (e.key === 'ArrowRight') { goTo(index + 1); startAuto(); }
  });

  // Touch / swipe
  let touchStartX = 0;
  let touchStartY = 0;
  let isScrolling = false;

  viewport.addEventListener('touchstart', (e) => {
    touchStartX  = e.touches[0].clientX;
    touchStartY  = e.touches[0].clientY;
    isScrolling  = false;
    stopAuto();
  }, { passive: true });

  viewport.addEventListener('touchmove', (e) => {
    const dx = Math.abs(e.touches[0].clientX - touchStartX);
    const dy = Math.abs(e.touches[0].clientY - touchStartY);
    if (dy > dx) isScrolling = true;
  }, { passive: true });

  viewport.addEventListener('touchend', (e) => {
    if (!isScrolling) {
      const delta = touchStartX - e.changedTouches[0].clientX;
      if (Math.abs(delta) > 40) {
        delta > 0 ? goTo(index + 1) : goTo(index - 1);
      }
    }
    startAuto();
  }, { passive: true });

  // Pause autoplay on hover
  viewport.addEventListener('mouseenter', stopAuto);
  viewport.addEventListener('mouseleave', startAuto);

  // Debounced resize
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const prev = visible;
      visible = visibleCount();
      if (prev !== visible) {
        goTo(Math.min(index, maxIndex()));
      } else {
        goTo(index); // recalculate translate with new slide widths
      }
    }, 150);
  });

  // Initialise after layout settles
  visible = visibleCount();
  requestAnimationFrame(() => {
    goTo(0);
    startAuto();
  });
})();

/* ═══════════════════════════════════════════════════════════════
   5. QUANTITY SELECTORS & TOGGLES
   ═══════════════════════════════════════════════════════════════ */
(function initQuantityToggle() {
  const MAX_QTY = 99;

  $$('.qty-toggle').forEach((toggle) => {
    const itemName = toggle.getAttribute('data-item') || 'Item';
    const addBtn   = $('.qty-toggle__add', toggle);
    const ctrl     = $('.qty-toggle__ctrl', toggle);
    const decBtn   = $('.qty-dec', toggle);
    const incBtn   = $('.qty-inc', toggle);
    const display  = $('.qty-val', toggle);

    if (!addBtn || !ctrl || !decBtn || !incBtn || !display) return;

    let count = 0;

    function updateUI() {
      if (count <= 0) {
        ctrl.setAttribute('hidden', '');
        addBtn.style.display = '';
        addBtn.removeAttribute('hidden');
        display.textContent = '0';
      } else {
        addBtn.setAttribute('hidden', '');
        addBtn.style.display = 'none';
        ctrl.removeAttribute('hidden');
        display.textContent = count;
      }
      decBtn.setAttribute('aria-label', `Decrease quantity of ${itemName}, current: ${count}`);
      incBtn.setAttribute('aria-label', `Increase quantity of ${itemName}, current: ${count}`);
    }

    addBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      count = 1;
      updateUI();
      Cart.addItem(itemName);

      // Visual feedback on button click before hide
      addBtn.classList.add('added');
      setTimeout(() => addBtn.classList.remove('added'), 600);
    });

    decBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (count <= 0) return;
      count--;
      updateUI();
      Cart.removeItem(itemName);
    });

    incBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (count >= MAX_QTY) return;
      count++;
      updateUI();
      Cart.addItem(itemName);
    });

    // Initialise UI
    updateUI();
  });
})();

/* ═══════════════════════════════════════════════════════════════
   7. HERO SEARCH
   ═══════════════════════════════════════════════════════════════ */
(function initHeroSearch() {
  const btn   = $('#heroSearchBtn');
  const input = $('#heroSearch');

  if (!btn || !input) return;

  function doSearch() {
    const q = input.value.trim();
    if (!q) { input.focus(); return; }
    const menuSection = $('#menu');
    if (menuSection) {
      menuSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  btn.addEventListener('click', doSearch);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); doSearch(); }
  });
})();

/* ═══════════════════════════════════════════════════════════════
   8. VIDEO PLAYER
   ═══════════════════════════════════════════════════════════════ */
(function initVideo() {
  const wrap    = $('#videoWrap');
  const video   = $('#mainVideo');
  const overlay = $('#vOverlay');
  const playBtn = $('#playBtn');

  if (!video || !overlay) return;

  function syncState() {
    const playing = !video.paused && !video.ended;
    overlay.classList.toggle('is-playing', playing);
    overlay.setAttribute('aria-hidden', String(playing));

    if (playBtn) {
      playBtn.setAttribute('aria-pressed', String(playing));
      playBtn.setAttribute('aria-label', playing ? 'Pause video' : 'Play video');
    }
  }

  async function togglePlayback() {
    try {
      if (video.paused || video.ended) {
        await video.play();
      } else {
        video.pause();
      }
    } catch (err) {
      console.warn('[JTGeats] Video playback blocked:', err.message);
    }
  }

  // Clicking the wrapper toggles playback
  wrap?.addEventListener('click', togglePlayback);

  // Sync on native video events
  video.addEventListener('play',  syncState);
  video.addEventListener('pause', syncState);
  video.addEventListener('ended', syncState);

  // Keyboard: Space / Enter on play button
  playBtn?.addEventListener('keydown', (e) => {
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); togglePlayback(); }
  });

  // Initial sync
  syncState();
})();

/* ═══════════════════════════════════════════════════════════════
   9. CONTACT FORM
   ═══════════════════════════════════════════════════════════════ */
(function initContact() {
  const submitBtn  = $('#contactSubmit');
  const nameInput  = $('#contactName');
  const emailInput = $('#contactEmail');
  const msgInput   = $('#contactMessage');
  const feedback   = $('#formFeedback');

  if (!submitBtn) return;

  function setFeedback(msg, isError = false) {
    if (!feedback) return;
    feedback.textContent = msg;
    feedback.style.color = isError ? '#d32f2f' : '#1AC073';
  }

  function resetFeedback() {
    if (feedback) feedback.textContent = '';
  }

  function markInvalid(el, msg) {
    el?.setAttribute('aria-invalid', 'true');
    setFeedback(msg, true);
    el?.focus();
    return false;
  }

  function clearInvalid() {
    [nameInput, emailInput, msgInput].forEach((el) => {
      el?.removeAttribute('aria-invalid');
    });
    resetFeedback();
  }

  function validate() {
    clearInvalid();

    if (!nameInput?.value.trim())
      return markInvalid(nameInput, 'Please enter your name.');

    if (!emailInput?.value.trim())
      return markInvalid(emailInput, 'Please enter your email address.');

    if (!isEmail(emailInput.value))
      return markInvalid(emailInput, 'Please enter a valid email address.');

    if (!msgInput?.value.trim())
      return markInvalid(msgInput, 'Please enter your message.');

    return true;
  }

  submitBtn.addEventListener('click', () => {
    if (!validate()) return;

    const origText = submitBtn.textContent;
    submitBtn.textContent = 'Sending…';
    submitBtn.disabled = true;

    setTimeout(() => {
      if (nameInput)  nameInput.value  = '';
      if (emailInput) emailInput.value = '';
      if (msgInput)   msgInput.value   = '';

      clearInvalid();
      setFeedback('Thank you! We will contact you within 48 hours. ✓');

      submitBtn.textContent = origText;
      submitBtn.disabled = false;

      setTimeout(resetFeedback, 6000);
    }, 700);
  });

  // Real-time: clear aria-invalid on input
  [nameInput, emailInput, msgInput].forEach((el) => {
    el?.addEventListener('input', () => {
      if (el.getAttribute('aria-invalid') === 'true') {
        el.removeAttribute('aria-invalid');
        resetFeedback();
      }
    });
  });
})();