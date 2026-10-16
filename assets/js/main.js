(function () {
  'use strict';

  const LANGS = ['es', 'en', 'zh'];
  const DEFAULT_LANG = 'es';
  let lang = localStorage.getItem('al-lang') || DEFAULT_LANG;
  if (!LANGS.includes(lang)) lang = DEFAULT_LANG;

  let i18n = {};
  let social = null;
  let partners = [];
  let news = [];
  let partnerIndex = 0;
  let partnerTimer = null;

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  async function loadJSON(path) {
    const res = await fetch(path);
    if (!res.ok) throw new Error('Failed to load ' + path);
    return res.json();
  }

  function t(key) {
    return (i18n[key] != null ? i18n[key] : key);
  }

  function applyI18n() {
    $$('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      const val = t(key);
      if (el.hasAttribute('data-i18n-html')) el.innerHTML = val;
      else el.textContent = val;
    });
    $$('[data-i18n-placeholder]').forEach((el) => {
      el.placeholder = t(el.getAttribute('data-i18n-placeholder'));
    });
    $$('[data-i18n-aria]').forEach((el) => {
      el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria')));
    });
    document.documentElement.lang = lang === 'zh' ? 'zh-Hans' : lang;
    $$('.lang-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
      btn.setAttribute('aria-pressed', btn.dataset.lang === lang ? 'true' : 'false');
    });
    renderPartners();
    renderNews();
    if (social) applySocial();
  }

  async function setLang(next) {
    if (!LANGS.includes(next)) return;
    lang = next;
    localStorage.setItem('al-lang', lang);
    i18n = await loadJSON('i18n/' + lang + '.json');
    applyI18n();
  }

  function applySocial() {
    const wa = social.whatsapp;
    const phone = social.phoneDisplay || social.phone;
    const email = social.email;

    $$('[data-social="whatsapp"]').forEach((a) => {
      a.href = wa;
    });
    $$('[data-social="facebook"]').forEach((a) => {
      a.href = social.facebook;
    });
    $$('[data-social="linkedin"]').forEach((a) => {
      a.href = social.linkedin;
    });
    $$('[data-social="instagram"]').forEach((a) => {
      a.href = social.instagram;
    });
    $$('[data-social="email"]').forEach((a) => {
      a.href = 'mailto:' + email;
      if (a.classList.contains('val')) a.textContent = email;
    });
    $$('[data-social="phone"]').forEach((a) => {
      a.href = 'tel:' + social.phone;
      if (a.classList.contains('val')) a.textContent = phone;
    });
    $$('[data-address]').forEach((el) => {
      el.textContent = social.address[lang] || social.address.es;
    });
  }

  function renderPartners() {
    const track = $('#partners-track');
    if (!track || !partners.length) return;

    track.innerHTML = partners.map((p, i) => {
      const tagline = (p.tagline && (p.tagline[lang] || p.tagline.es)) || '';
      const logoBlock = p.logo
        ? `<img src="${p.logo}" alt="${p.name}" class="partner-logo" loading="lazy">`
        : `<div class="partner-placeholder"><span class="partner-placeholder-name">${p.name}</span>${p.todo ? `<span class="partner-todo">${t('partners.todoLogo')}</span>` : ''}</div>`;
      return `
        <article class="partner-slide${i === partnerIndex ? ' active' : ''}" data-index="${i}" aria-hidden="${i === partnerIndex ? 'false' : 'true'}">
          <div class="partner-badge">${t('partners.active')}</div>
          ${logoBlock}
          <h3 class="partner-name">${p.fullName || p.name}</h3>
          <p class="partner-tagline">${tagline}</p>
        </article>`;
    }).join('');

    const dots = $('#partners-dots');
    if (dots) {
      dots.innerHTML = partners.map((_, i) =>
        `<button type="button" class="partner-dot${i === partnerIndex ? ' active' : ''}" data-goto="${i}" aria-label="${i + 1}"></button>`
      ).join('');
    }
  }

  function showPartner(index) {
    if (!partners.length) return;
    partnerIndex = (index + partners.length) % partners.length;
    $$('.partner-slide').forEach((slide, i) => {
      slide.classList.toggle('active', i === partnerIndex);
      slide.setAttribute('aria-hidden', i === partnerIndex ? 'false' : 'true');
    });
    $$('.partner-dot').forEach((dot, i) => {
      dot.classList.toggle('active', i === partnerIndex);
    });
  }

  function startPartnerAutoplay() {
    stopPartnerAutoplay();
    partnerTimer = setInterval(() => showPartner(partnerIndex + 1), 4500);
  }

  function stopPartnerAutoplay() {
    if (partnerTimer) clearInterval(partnerTimer);
    partnerTimer = null;
  }

  function formatDate(iso) {
    try {
      const d = new Date(iso + 'T12:00:00');
      const locales = { es: 'es-CL', en: 'en-US', zh: 'zh-CN' };
      return d.toLocaleDateString(locales[lang] || 'es-CL', {
        year: 'numeric', month: 'short', day: 'numeric'
      });
    } catch (_) {
      return iso;
    }
  }

  function shareUrl(item) {
    if (item.link) return item.link;
    return window.location.href.split('#')[0] + '#noticia-' + item.id;
  }

  function renderNews() {
    const grid = $('#news-grid');
    if (!grid) return;

    const items = news
      .slice()
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
      .slice(0, 6);

    grid.innerHTML = items.map((item) => {
      const title = item.title[lang] || item.title.es || '';
      const summary = item.summary[lang] || item.summary.es || '';
      const url = shareUrl(item);
      const exampleBadge = item.example
        ? `<span class="news-badge">${t('news.example')}</span>`
        : '';
      const linkAttr = item.link
        ? `href="${item.link}" target="_blank" rel="noopener"`
        : `href="#noticia-${item.id}"`;

      return `
        <article class="news-card" id="noticia-${item.id}">
          <a class="news-thumb" ${linkAttr}>
            <img src="${item.image}" alt="${title}" loading="lazy" width="640" height="400">
            ${exampleBadge}
          </a>
          <div class="news-body">
            <time datetime="${item.date}">${formatDate(item.date)}</time>
            <h3><a ${linkAttr}>${title}</a></h3>
            <p>${summary}</p>
            <div class="news-share">
              <span class="news-share-label">${t('news.share')}</span>
              <div class="news-share-btns">
                <a class="share-btn" href="https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}" target="_blank" rel="noopener" aria-label="${t('news.shareWhatsApp')}">WA</a>
                <a class="share-btn" href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}" target="_blank" rel="noopener" aria-label="${t('news.shareFacebook')}">Fb</a>
                <a class="share-btn" href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}" target="_blank" rel="noopener" aria-label="${t('news.shareLinkedIn')}">in</a>
                <button type="button" class="share-btn copy-link" data-url="${url}" aria-label="${t('news.copyLink')}">URL</button>
              </div>
            </div>
          </div>
        </article>`;
    }).join('');

    $$('.copy-link', grid).forEach((btn) => {
      btn.addEventListener('click', async () => {
        const url = btn.dataset.url;
        try {
          await navigator.clipboard.writeText(url);
          const prev = btn.textContent;
          btn.textContent = '✓';
          btn.title = t('news.copied');
          setTimeout(() => {
            btn.textContent = prev;
            btn.title = t('news.copyLink');
          }, 2000);
        } catch (_) {
          window.prompt(t('news.copyLink'), url);
        }
      });
    });
  }

  function initMenu() {
    const burger = $('#burger');
    const navlinks = $('#navlinks');
    if (!burger || !navlinks) return;
    burger.addEventListener('click', () => {
      const open = navlinks.classList.toggle('open');
      burger.setAttribute('aria-expanded', open);
    });
    $$('a', navlinks).forEach((a) => a.addEventListener('click', () => {
      navlinks.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
    }));
  }

  function initReveal() {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) e.target.classList.add('in');
      });
    }, { threshold: 0.12 });
    $$('.reveal').forEach((el) => io.observe(el));
  }

  function initForm() {
    const form = $('#contact-form');
    if (!form) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const nombre = $('#nombre').value.trim();
      const correo = $('#correo').value.trim();
      const mensaje = $('#mensaje').value.trim();
      const to = (social && social.email) || 'mesparza@andeanlabs.cl';
      const subject = 'Contacto web — ' + nombre;
      const body = 'Nombre: ' + nombre + '\nCorreo: ' + correo + '\n\n' + mensaje;
      window.location.href = 'mailto:' + to + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
      const btn = form.querySelector('button');
      const original = btn.textContent;
      btn.textContent = t('contact.sending');
      setTimeout(() => { btn.textContent = original; }, 3000);
    });
  }

  function initPartnersUI() {
    const prev = $('#partners-prev');
    const next = $('#partners-next');
    const dots = $('#partners-dots');
    const slider = $('#partners-slider');

    if (prev) prev.addEventListener('click', () => {
      showPartner(partnerIndex - 1);
      startPartnerAutoplay();
    });
    if (next) next.addEventListener('click', () => {
      showPartner(partnerIndex + 1);
      startPartnerAutoplay();
    });
    if (dots) dots.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-goto]');
      if (!btn) return;
      showPartner(Number(btn.dataset.goto));
      startPartnerAutoplay();
    });
    if (slider) {
      slider.addEventListener('mouseenter', stopPartnerAutoplay);
      slider.addEventListener('mouseleave', startPartnerAutoplay);
      slider.addEventListener('focusin', stopPartnerAutoplay);
      slider.addEventListener('focusout', startPartnerAutoplay);
    }
    startPartnerAutoplay();
  }

  function initLangSwitcher() {
    $$('.lang-btn').forEach((btn) => {
      btn.addEventListener('click', () => setLang(btn.dataset.lang));
    });
  }

  async function init() {
    initMenu();
    initReveal();
    initForm();
    initLangSwitcher();

    try {
      [i18n, social, partners, news] = await Promise.all([
        loadJSON('i18n/' + lang + '.json'),
        loadJSON('data/social.json'),
        loadJSON('data/partners.json'),
        loadJSON('data/news.json')
      ]);
      applyI18n();
      initPartnersUI();
    } catch (err) {
      console.error(err);
      applyI18n();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
