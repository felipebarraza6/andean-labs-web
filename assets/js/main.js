import { $, $$, LANGS, DEFAULT_LANG, loadJSON } from './lib.js';
import { createGallery } from './gallery.js';
import { createPartners } from './partners.js';
import { createNews } from './news.js';

let lang = localStorage.getItem('al-lang') || DEFAULT_LANG;
if (!LANGS.includes(lang)) lang = DEFAULT_LANG;

let i18n = {};
let social = null;

let prefersReducedMotion = false;
try {
  prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
} catch (_) {
  prefersReducedMotion = false;
}

function t(key) {
  return i18n[key] != null ? i18n[key] : key;
}

function getLang() {
  return lang;
}

const gallery = createGallery({ t, getLang, prefersReducedMotion });
const partners = createPartners({ t, getLang, prefersReducedMotion });
const news = createNews({ t, getLang });

function applySocial() {
  if (!social) return;
  const wa = social.whatsapp;
  const phone = social.phoneDisplay || social.phone;
  const email = social.email;

  $$('[data-social="whatsapp"]').forEach((a) => { a.href = wa; });
  $$('[data-social="facebook"]').forEach((a) => { a.href = social.facebook; });
  $$('[data-social="linkedin"]').forEach((a) => { a.href = social.linkedin; });
  $$('[data-social="instagram"]').forEach((a) => { a.href = social.instagram; });
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
  partners.render();
  news.render();
  gallery.render();
  applySocial();
}

async function setLang(next) {
  if (!LANGS.includes(next)) return;
  lang = next;
  localStorage.setItem('al-lang', lang);
  i18n = await loadJSON('i18n/' + lang + '.json');
  applyI18n();
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
  if (!('IntersectionObserver' in window)) {
    $$('.reveal').forEach((el) => el.classList.add('in'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
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
    const to = (social && social.formEmail) || 'mesparza@andeanlabs.cl';
    const subject = 'Contacto web — ' + nombre;
    const body = 'Nombre: ' + nombre + '\nCorreo: ' + correo + '\n\n' + mensaje;
    window.location.href = 'mailto:' + to + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    const btn = form.querySelector('button');
    const original = btn.textContent;
    btn.textContent = t('contact.sending');
    setTimeout(() => { btn.textContent = original; }, 3000);
  });
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
    const [i18nData, socialData, partnersData, newsData, galleryData] = await Promise.all([
      loadJSON('i18n/' + lang + '.json'),
      loadJSON('data/social.json'),
      loadJSON('data/partners.json'),
      loadJSON('data/news.json'),
      loadJSON('data/gallery.json'),
    ]);
    i18n = i18nData;
    social = socialData;
    partners.setData(partnersData);
    news.setData(newsData);
    gallery.setData(galleryData);
    applyI18n();
    partners.initUI();
    gallery.initUI();
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
