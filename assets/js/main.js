/**
 * SOLVIKTECH — main.js
 * Handles: language switching, header scroll, mobile nav,
 *          IntersectionObserver reveals, workflow line animation,
 *          FAQ accordion, contact form, smooth scroll, active nav.
 * Depends on: i18n.js (loaded before this file)
 */

(function () {
  'use strict';

  /* ============================================================
     LANGUAGE SYSTEM
     All DOM text nodes are driven by i18n[lang] keys.
     Each element carries data-i18n="section.key"
     and optionally data-i18n-ph="section.key" for placeholders.
  ============================================================ */
  let currentLang = 'en';

  function applyLang(lang, persist = true) {
    if (!i18n[lang]) return;
    currentLang = lang;
    const t = i18n[lang];

    /* Update all text elements */
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const val = resolvePath(t, key);
      if (val !== undefined) el.textContent = val;
    });

    /* Update placeholders */
    document.querySelectorAll('[data-i18n-ph]').forEach(el => {
      const key = el.getAttribute('data-i18n-ph');
      const val = resolvePath(t, key);
      if (val !== undefined) el.setAttribute('placeholder', val);
    });

    /* Update select options */
    document.querySelectorAll('[data-i18n-opt]').forEach(el => {
      const keys = el.getAttribute('data-i18n-opt').split(',');
      const options = el.querySelectorAll('option[data-opt]');
      options.forEach((opt, i) => {
        const key = keys[i] ? keys[i].trim() : null;
        if (key) {
          const val = resolvePath(t, key);
          if (val !== undefined) opt.textContent = val;
        }
      });
      /* Update placeholder/first option */
      const phKey = el.getAttribute('data-i18n-ph');
      if (phKey) {
        const phVal = resolvePath(t, phKey);
        const firstOpt = el.querySelector('option:first-child');
        if (firstOpt && phVal !== undefined) firstOpt.textContent = phVal;
      }
    });

    /* Apply html lang + dir */
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');

    /* Update lang buttons */
    document.querySelectorAll('[data-lang-btn]').forEach(btn => {
      const isActive = btn.getAttribute('data-lang-btn') === lang;
      btn.classList.toggle('active', isActive);
    });

    /* Persist only for same-language URL sessions */
    if (persist) {
      try { localStorage.setItem('svt-lang', lang); } catch (e) { /* noop */ }
    }
  }

  /* Resolve dot-notation key: "nav.home" → t.nav.home */
  function resolvePath(obj, path) {
    return path.split('.').reduce((acc, k) => (acc ? acc[k] : undefined), obj);
  }

  /* Public setter for onclick handlers */
  window.setLang = function (lang) {
    applyLang(lang);
  };

  /* Restore saved lang or detect browser preference */
  function initLang() {
    const path = window.location.pathname || '';
    const forcedLang = path.includes('/ar/') ? 'ar' : 'en';
    applyLang(forcedLang, false);
  }

  /* ============================================================
     HEADER SCROLL
  ============================================================ */
  function initHeader() {
    const header = document.getElementById('header');
    if (!header) return;
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          header.classList.toggle('scrolled', window.scrollY > 40);
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  /* ============================================================
     MOBILE NAV
  ============================================================ */
  function initMobileNav() {
    const hamburger  = document.getElementById('hamburger');
    const mobileNav  = document.getElementById('mobileNav');
    const closeBtn   = document.getElementById('mobileNavClose');
    if (!hamburger || !mobileNav) return;

    function open() {
      mobileNav.classList.add('open');
      hamburger.classList.add('open');
      hamburger.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    }
    function close() {
      mobileNav.classList.remove('open');
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }

    hamburger.addEventListener('click', () =>
      mobileNav.classList.contains('open') ? close() : open()
    );
    if (closeBtn) closeBtn.addEventListener('click', close);
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') close();
    });

    /* Close on nav link click */
    mobileNav.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', close);
    });

    /* Expose for lang buttons inside mobile nav */
    window.closeMobileNav = close;
  }

  /* ============================================================
     REVEAL ON SCROLL (IntersectionObserver)
  ============================================================ */
  function initReveal() {
    const els = document.querySelectorAll('.reveal');
    if (!els.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -36px 0px' });

    els.forEach(el => observer.observe(el));
  }

  /* ============================================================
     WORKFLOW LINE ANIMATION
  ============================================================ */
  function initWorkflowLine() {
    const fill = document.getElementById('workflowFill');
    if (!fill) return;
    const timeline = fill.closest('.workflow-desktop');
    if (!timeline) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          fill.style.width = '100%';
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });

    observer.observe(timeline);
  }

  /* ============================================================
     ACTIVE NAV ON SCROLL
  ============================================================ */
  function initActiveNav() {
    const navLinks = document.querySelectorAll('.main-nav a[href^="#"]');
    const sections = [];
    navLinks.forEach(a => {
      const id = a.getAttribute('href').slice(1);
      const el = document.getElementById(id);
      if (el) sections.push({ link: a, el });
    });
    if (!sections.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          sections.forEach(s => s.link.classList.remove('active'));
          const match = sections.find(s => s.el === entry.target);
          if (match) match.link.classList.add('active');
        }
      });
    }, { threshold: 0.35 });

    sections.forEach(s => observer.observe(s.el));
  }

  /* ============================================================
     FAQ ACCORDION
  ============================================================ */
  function initFAQ() {
    document.querySelectorAll('.faq-q').forEach(btn => {
      btn.addEventListener('click', () => {
        const item = btn.closest('.faq-item');
        const isOpen = item.classList.contains('open');

        /* Close all open items */
        document.querySelectorAll('.faq-item.open').forEach(i => {
          i.classList.remove('open');
          i.querySelector('.faq-q').setAttribute('aria-expanded', 'false');
        });

        /* Toggle clicked item */
        if (!isOpen) {
          item.classList.add('open');
          btn.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }

  /* ============================================================
     CONTACT FORM
     AJAX submit — no redirect when JS is active.
  ============================================================ */
  function initContactForm() {
    const form = document.getElementById('contactForm');
    const submitBtn = document.getElementById('submitBtn');
    const submitLabel = document.getElementById('submitBtnLabel');
    const successMsg = document.getElementById('formSuccess');
    const errorMsg = document.getElementById('formError');
    if (!form || !submitBtn || !submitLabel || !successMsg || !errorMsg) return;

    const defaultLabel = submitLabel.textContent.trim();
    const sendingLabel = 'Sending...';
    const endpoint = 'https://formsubmit.co/ajax/liuditata@gmail.com';

    function setMessageState(type) {
      successMsg.classList.toggle('is-visible', type === 'success');
      errorMsg.classList.toggle('is-visible', type === 'error');
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      submitBtn.disabled = true;
      submitLabel.textContent = sendingLabel;
      setMessageState(null);

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { Accept: 'application/json' },
          body: new FormData(form)
        });

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const result = await response.json().catch(() => ({}));
        if (result.success !== 'true' && result.success !== true) {
          throw new Error('Submission was not accepted');
        }

        form.reset();
        setMessageState('success');
      } catch (err) {
        setMessageState('error');
      } finally {
        submitBtn.disabled = false;
        submitLabel.textContent = defaultLabel;
      }
    });
  }

  /* ============================================================
     SMOOTH SCROLL
  ============================================================ */
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', e => {
        const id = a.getAttribute('href');
        if (id === '#') return;
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        const offset = 76;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      });
    });
  }

  /* ============================================================
     INSIGHTS CAROUSEL
  ============================================================ */
  function initInsightsCarousel() {
    const track   = document.getElementById('insightsTrack');
    if (!track) return;

    const slides  = Array.from(track.querySelectorAll('.carousel-slide'));
    const dots    = Array.from(document.querySelectorAll('.carousel-dot'));
    const prevBtn = document.querySelector('.carousel-prev');
    const nextBtn = document.querySelector('.carousel-next');
    const total   = slides.length;
    let current   = 0;
    let autoTimer = null;
    const AUTO_DELAY = 5000;

    function getState(i) {
      const diff = (i - current + total) % total;
      if (diff === 0) return 'center';
      if (diff === 1) return 'right';
      if (diff === total - 1) return 'left';
      return 'hidden';
    }

    function render() {
      slides.forEach((sl, i) => {
        sl.setAttribute('data-state', getState(i));
      });
      dots.forEach((d, i) => {
        const active = i === current;
        d.classList.toggle('active', active);
        d.setAttribute('aria-selected', active ? 'true' : 'false');
      });
    }

    function goTo(idx) {
      current = ((idx % total) + total) % total;
      render();
    }

    function goNext() { goTo(current + 1); }
    function goPrev() { goTo(current - 1); }

    function startAuto() {
      stopAuto();
      autoTimer = setInterval(goNext, AUTO_DELAY);
    }
    function stopAuto() {
      if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
    }

    /* Button controls */
    if (prevBtn) prevBtn.addEventListener('click', () => { goPrev(); startAuto(); });
    if (nextBtn) nextBtn.addEventListener('click', () => { goNext(); startAuto(); });

    /* Dot controls */
    dots.forEach(d => {
      d.addEventListener('click', () => {
        goTo(+d.getAttribute('data-dot'));
        startAuto();
      });
    });

    /* Side-card click to focus */
    slides.forEach((sl, i) => {
      sl.addEventListener('click', () => {
        if (sl.getAttribute('data-state') !== 'center') {
          goTo(i);
          startAuto();
        }
      });
    });

    /* Touch / swipe */
    let touchStartX = 0;
    track.addEventListener('touchstart', e => {
      touchStartX = e.touches[0].clientX;
      stopAuto();
    }, { passive: true });
    track.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) > 40) {
        const isRTL = document.documentElement.lang === 'ar';
        if (dx < 0) isRTL ? goPrev() : goNext();
        else         isRTL ? goNext() : goPrev();
      }
      startAuto();
    }, { passive: true });

    /* Pause on hover */
    track.closest('.insights-carousel')?.addEventListener('mouseenter', stopAuto);
    track.closest('.insights-carousel')?.addEventListener('mouseleave', startAuto);

    /* Init */
    render();
    startAuto();
  }

  /* ============================================================
     INIT
  ============================================================ */
  document.addEventListener('DOMContentLoaded', () => {
    initLang();
    initHeader();
    initMobileNav();
    initReveal();
    initWorkflowLine();
    initActiveNav();
    initFAQ();
    initContactForm();
    initSmoothScroll();
    initInsightsCarousel();
  });

})();
