import { $, $$, escapeHtml, pickLocale, responsivePicture, withDerivedSrcset } from './lib.js';

export function createGallery({ t, getLang, prefersReducedMotion }) {
  let items = [];
  let index = 0;
  let timer = null;
  let uiReady = false;

  function render() {
    const track = $('#gallery-track');
    if (!track || !items.length) return;
    if (index >= items.length) index = 0;
    const lang = getLang();

    track.innerHTML = items.map((raw, i) => {
      const item = withDerivedSrcset(raw);
      const title = escapeHtml(pickLocale(item.title, lang));
      const caption = escapeHtml(pickLocale(item.caption, lang));
      const alt = escapeHtml(pickLocale(item.alt, lang) || title);
      const w = item.width || 1920;
      const h = item.height || 1440;
      const fitClass = (item.objectFit === 'contain' || h > w) ? 'fit-contain' : '';
      let media;
      if (item.placeholder) {
        media = `
          <div class="gallery-placeholder" role="img" aria-label="${alt}">
            <div class="gallery-placeholder-icon" aria-hidden="true">◇</div>
            <div class="gallery-placeholder-title">${title}</div>
            <div class="gallery-placeholder-note">${escapeHtml(pickLocale(item.caption, lang) || t('gallery.placeholder'))}</div>
          </div>`;
      } else {
        const isFirst = i === 0;
        media = responsivePicture(item, {
          alt,
          loading: isFirst ? 'eager' : 'lazy',
          decoding: 'async',
          fetchpriority: isFirst ? 'high' : null,
          fitClass,
        });
      }
      return `
        <figure class="gallery-slide${i === index ? ' active' : ''}" data-index="${i}" aria-hidden="${i === index ? 'false' : 'true'}">
          <div class="gallery-media">${media}</div>
          <figcaption class="gallery-caption">
            <span class="gallery-caption-lab">${title}</span>
            <span class="gallery-caption-text">${caption}</span>
          </figcaption>
        </figure>`;
    }).join('');

    const dots = $('#gallery-dots');
    if (dots) {
      dots.innerHTML = items.map((_, i) =>
        `<button type="button" class="gallery-dot${i === index ? ' active' : ''}" data-goto="${i}" aria-label="${i + 1}"></button>`
      ).join('');
    }
  }

  function show(next) {
    if (!items.length) return;
    index = (next + items.length) % items.length;
    $$('.gallery-slide').forEach((slide, i) => {
      slide.classList.toggle('active', i === index);
      slide.setAttribute('aria-hidden', i === index ? 'false' : 'true');
    });
    $$('.gallery-dot').forEach((dot, i) => {
      dot.classList.toggle('active', i === index);
    });
  }

  function stopAutoplay() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  function startAutoplay() {
    stopAutoplay();
    if (prefersReducedMotion || items.length < 2) return;
    timer = setInterval(() => show(index + 1), 5500);
  }

  function initUI() {
    if (uiReady) return;
    const prev = $('#gallery-prev');
    const next = $('#gallery-next');
    const dots = $('#gallery-dots');
    const slider = $('#gallery-slider');
    if (!slider) return;
    uiReady = true;

    if (prev) prev.addEventListener('click', () => { show(index - 1); startAutoplay(); });
    if (next) next.addEventListener('click', () => { show(index + 1); startAutoplay(); });
    if (dots) dots.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-goto]');
      if (!btn) return;
      show(Number(btn.dataset.goto));
      startAutoplay();
    });

    slider.addEventListener('mouseenter', stopAutoplay);
    slider.addEventListener('mouseleave', startAutoplay);
    slider.addEventListener('focusin', stopAutoplay);
    slider.addEventListener('focusout', startAutoplay);

    slider.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        show(index - 1);
        startAutoplay();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        show(index + 1);
        startAutoplay();
      }
    });

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

    // Autoplay solo cuando el carrusel está a la vista (menos trabajo en main thread)
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
  }

  return {
    setData(data) { items = Array.isArray(data) ? data : []; },
    render,
    initUI,
  };
}
