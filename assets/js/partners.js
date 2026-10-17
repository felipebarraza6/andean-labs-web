import { $, $$ } from './lib.js';

export function createPartners({ t, getLang, prefersReducedMotion }) {
  let partners = [];
  let index = 0;
  let timer = null;
  let uiReady = false;

  function render() {
    const track = $('#partners-track');
    if (!track || !partners.length) return;
    const lang = getLang();

    track.innerHTML = partners.map((p, i) => {
      const tagline = (p.tagline && (p.tagline[lang] || p.tagline.es)) || '';
      const logoBlock = p.logo
        ? `<img src="${p.logo}" alt="${p.name}" class="partner-logo" loading="lazy" decoding="async" width="200" height="72">`
        : `<div class="partner-placeholder"><span class="partner-placeholder-name">${p.name}</span>${p.todo ? `<span class="partner-todo">${t('partners.todoLogo')}</span>` : ''}</div>`;
      return `
        <article class="partner-slide${i === index ? ' active' : ''}" data-index="${i}" aria-hidden="${i === index ? 'false' : 'true'}">
          <div class="partner-badge">${t('partners.active')}</div>
          ${logoBlock}
          <h3 class="partner-name">${p.fullName || p.name}</h3>
          <p class="partner-tagline">${tagline}</p>
        </article>`;
    }).join('');

    const dots = $('#partners-dots');
    if (dots) {
      dots.innerHTML = partners.map((_, i) =>
        `<button type="button" class="partner-dot${i === index ? ' active' : ''}" data-goto="${i}" aria-label="${i + 1}"></button>`
      ).join('');
    }
  }

  function show(next) {
    if (!partners.length) return;
    index = (next + partners.length) % partners.length;
    $$('.partner-slide').forEach((slide, i) => {
      slide.classList.toggle('active', i === index);
      slide.setAttribute('aria-hidden', i === index ? 'false' : 'true');
    });
    $$('.partner-dot').forEach((dot, i) => {
      dot.classList.toggle('active', i === index);
    });
  }

  function stopAutoplay() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  function startAutoplay() {
    stopAutoplay();
    if (prefersReducedMotion) return;
    timer = setInterval(() => show(index + 1), 4500);
  }

  function initUI() {
    if (uiReady) return;
    const prev = $('#partners-prev');
    const next = $('#partners-next');
    const dots = $('#partners-dots');
    const slider = $('#partners-slider');
    uiReady = true;

    if (prev) prev.addEventListener('click', () => { show(index - 1); startAutoplay(); });
    if (next) next.addEventListener('click', () => { show(index + 1); startAutoplay(); });
    if (dots) dots.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-goto]');
      if (!btn) return;
      show(Number(btn.dataset.goto));
      startAutoplay();
    });

    if (slider) {
      slider.addEventListener('mouseenter', stopAutoplay);
      slider.addEventListener('mouseleave', startAutoplay);
      slider.addEventListener('focusin', stopAutoplay);
      slider.addEventListener('focusout', startAutoplay);

      let touchX = null;
      slider.addEventListener('touchstart', (e) => {
        touchX = e.changedTouches[0].clientX;
        stopAutoplay();
      }, { passive: true });
      slider.addEventListener('touchend', (e) => {
        if (touchX == null) return;
        const dx = e.changedTouches[0].clientX - touchX;
        touchX = null;
        if (Math.abs(dx) < 40) {
          startAutoplay();
          return;
        }
        if (dx > 0) show(index - 1);
        else show(index + 1);
        startAutoplay();
      }, { passive: true });

      if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) startAutoplay();
            else stopAutoplay();
          });
        }, { threshold: 0.25 });
        io.observe(slider);
      } else {
        startAutoplay();
      }
    } else {
      startAutoplay();
    }
  }

  return {
    setData(data) { partners = Array.isArray(data) ? data : []; },
    render,
    initUI,
  };
}
