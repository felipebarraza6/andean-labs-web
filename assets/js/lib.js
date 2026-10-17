/** Utilidades compartidas (sin build step). */

export const LANGS = ['es', 'en', 'zh'];
export const DEFAULT_LANG = 'es';

const jsonCache = new Map();

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/** Fetch JSON con cache en memoria (evita re-descargas al cambiar idioma / re-render). */
export async function loadJSON(path) {
  if (jsonCache.has(path)) return jsonCache.get(path);
  const pending = fetch(path).then((res) => {
    if (!res.ok) throw new Error('Failed to load ' + path);
    return res.json();
  });
  jsonCache.set(path, pending);
  try {
    return await pending;
  } catch (err) {
    jsonCache.delete(path);
    throw err;
  }
}

export function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function pickLocale(obj, lang) {
  if (!obj) return '';
  return obj[lang] || obj.es || '';
}

/**
 * Construye <picture> con AVIF/WebP/JPG srcset si existen en el ítem,
 * o <img> simple con el fallback `image`.
 */
export function responsivePicture(item, {
  className = '',
  alt = '',
  loading = 'lazy',
  decoding = 'async',
  fetchpriority = null,
  fitClass = '',
} = {}) {
  const w = item.width || 1920;
  const h = item.height || 1440;
  const src = item.image || '';
  const sizes = item.sizes || '(max-width: 1180px) 100vw, 1124px';
  const cls = [className, fitClass].filter(Boolean).join(' ').trim();
  const pri = fetchpriority ? ` fetchpriority="${fetchpriority}"` : '';
  const classAttr = cls ? ` class="${cls}"` : '';

  if (!item.srcset || (!item.srcset.avif && !item.srcset.webp && !item.srcset.jpg)) {
    return `<img src="${src}" alt="${escapeHtml(alt)}" loading="${loading}" decoding="${decoding}" width="${w}" height="${h}"${classAttr}${pri}>`;
  }

  const sources = [];
  if (item.srcset.avif) {
    sources.push(`<source type="image/avif" srcset="${item.srcset.avif}" sizes="${sizes}">`);
  }
  if (item.srcset.webp) {
    sources.push(`<source type="image/webp" srcset="${item.srcset.webp}" sizes="${sizes}">`);
  }
  const jpgSrcset = item.srcset.jpg || '';
  const imgSrcset = jpgSrcset ? ` srcset="${jpgSrcset}" sizes="${sizes}"` : '';

  return `<picture>${sources.join('')}
    <img src="${src}" alt="${escapeHtml(alt)}" loading="${loading}" decoding="${decoding}" width="${w}" height="${h}"${imgSrcset}${classAttr}${pri}>
  </picture>`;
}

/** Deriva srcset por convención assets/{img|news}/r/<base>-{w}.{ext} si no hay campo srcset. */
export function withDerivedSrcset(item) {
  if (!item || !item.image || item.srcset) return item;
  const m = item.image.match(/^(assets\/(?:img|news))\/([^/]+)\.(jpe?g|png)$/i);
  if (!m) return item;
  const [, folder, base] = m;
  const widths = [480, 960, 1600];
  const build = (ext) => widths.map((w) => `${folder}/r/${base}-${w}.${ext} ${w}w`).join(', ');
  return {
    ...item,
    srcset: { avif: build('avif'), webp: build('webp'), jpg: build('jpg') },
  };
}
