/**
 * Andean Labs — motion layer (ES module)
 * Header compacto, reveal/stagger, hero parallax/shine, fade de idioma.
 * Compatible con la carga type=module de #5; no altera datos ni <picture>.
 */

const reduceMotion = (() => {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (_) {
    return false;
  }
})();

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
    header.classList.toggle('is-compact', window.scrollY > 28);
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

  if (!$('.hero-shine', hero)) {
    const shine = document.createElement('div');
    shine.className = 'hero-shine';
    shine.setAttribute('aria-hidden', 'true');
    hero.appendChild(shine);
  }

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
  applyStaggers();

  if (reduceMotion) {
    $$('.reveal').forEach((el) => el.classList.add('in'));
    return;
  }

  if (!('IntersectionObserver' in window)) {
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

  /* Noticias / galería se renderizan async (módulos + <picture>): re-stagger */
  if (typeof MutationObserver === 'undefined') return;

  const newsGrid = $('#news-grid');
  if (newsGrid) {
    const mo = new MutationObserver(() => {
      setStaggerIndices(newsGrid, '.news-card');
      if (!newsGrid.classList.contains('in')) io.observe(newsGrid);
    });
    mo.observe(newsGrid, { childList: true });
  }

  const galleryTrack = $('#gallery-track');
  if (galleryTrack) {
    const mo = new MutationObserver(() => {
      const slider = $('#gallery-slider');
      if (slider && !slider.classList.contains('in')) io.observe(slider);
    });
    mo.observe(galleryTrack, { childList: true });
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
