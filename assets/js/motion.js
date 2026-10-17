/**
 * Andean Labs — motion layer (vanilla)
 * Header compacto, reveal/stagger, hero parallax/shine, fade de idioma.
 * No altera la arquitectura de datos de main.js.
 */
(function () {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function setStaggerIndices(container, childSel) {
    if (!container) return;
    $$(childSel, container).forEach((el, i) => {
      el.style.setProperty('--stagger-i', String(i));
    });
    container.classList.add('is-staggered');
  }

  function applyStaggers(root = document) {
    setStaggerIndices($('.lab-grid', root), '.lab-card');
    setStaggerIndices($('.serv-grid', root), '.serv-card');
    setStaggerIndices($('.news-grid', root), '.news-card');
    setStaggerIndices($('.stat-strip', root), '.stat');
  }

  function initHeaderCompact() {
    const header = $('header');
    if (!header) return;

    let ticking = false;
    const update = () => {
      const compact = window.scrollY > 28;
      header.classList.toggle('is-compact', compact);
      ticking = false;
    };

    window.addEventListener(
      'scroll',
      () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(update);
      },
      { passive: true }
    );
    update();
  }

  function initHeroMotion() {
    const hero = $('.hero');
    if (!hero) return;

    const shine = document.createElement('div');
    shine.className = 'hero-shine';
    shine.setAttribute('aria-hidden', 'true');
    hero.appendChild(shine);

    if (reduceMotion) return;

    hero.classList.add('is-lit');

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const rect = hero.getBoundingClientRect();
        const progress = Math.min(1, Math.max(0, -rect.top / Math.max(rect.height, 1)));
        hero.style.setProperty('--hero-parallax', (progress * 36).toFixed(1) + 'px');
        ticking = false;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  function initEnhancedReveal() {
    /* main.js ya observa .reveal; aquí solo añadimos stagger y re-observamos nodos dinámicos */
    applyStaggers();

    if (reduceMotion) {
      $$('.reveal').forEach((el) => el.classList.add('in'));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }
    );

    $$('.reveal').forEach((el) => io.observe(el));

    /* Noticias / galería se renderizan async: reaplicar stagger cuando cambie el DOM */
    const newsGrid = $('#news-grid');
    if (newsGrid && typeof MutationObserver !== 'undefined') {
      const mo = new MutationObserver(() => {
        setStaggerIndices(newsGrid, '.news-card');
        if (newsGrid.classList.contains('in')) {
          $$('.news-card', newsGrid).forEach((card) => {
            card.style.opacity = '';
          });
        } else {
          io.observe(newsGrid);
        }
      });
      mo.observe(newsGrid, { childList: true });
    }
  }

  function initLangFade() {
    if (reduceMotion) return;

    $$('.lang-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.documentElement.classList.add('is-lang-fading');
        window.setTimeout(() => {
          document.documentElement.classList.remove('is-lang-fading');
        }, 320);
      });
    });
  }

  function initFocusRings() {
    /* Refuerzo de foco visible en controles glass (WCAG) */
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') document.documentElement.classList.add('using-keyboard');
    });
    document.addEventListener('mousedown', () => {
      document.documentElement.classList.remove('using-keyboard');
    });
  }

  function init() {
    initHeaderCompact();
    initHeroMotion();
    initEnhancedReveal();
    initLangFade();
    initFocusRings();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
