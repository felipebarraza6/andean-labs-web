import { $, $$, escapeHtml, responsivePicture, withDerivedSrcset } from './lib.js';

export function createNews({ t, getLang }) {
  let news = [];

  function formatDate(iso) {
    try {
      const d = new Date(iso + 'T12:00:00');
      const locales = { es: 'es-CL', en: 'en-US', zh: 'zh-CN' };
      return d.toLocaleDateString(locales[getLang()] || 'es-CL', {
        year: 'numeric', month: 'short', day: 'numeric',
      });
    } catch (_) {
      return iso;
    }
  }

  function shareUrl(item) {
    if (item.link) return item.link;
    return window.location.href.split('#')[0] + '#noticia-' + item.id;
  }

  function render() {
    const grid = $('#news-grid');
    if (!grid) return;
    const lang = getLang();

    const items = news
      .slice()
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
      .slice(0, 6);

    grid.innerHTML = items.map((raw) => {
      const item = withDerivedSrcset(raw);
      const title = item.title[lang] || item.title.es || '';
      const summary = item.summary[lang] || item.summary.es || '';
      const url = shareUrl(item);
      const exampleBadge = item.example
        ? `<span class="news-badge">${t('news.example')}</span>`
        : '';
      const linkAttr = item.link
        ? `href="${item.link}" target="_blank" rel="noopener"`
        : `href="#noticia-${item.id}"`;

      const media = responsivePicture({
        ...item,
        width: item.width || 640,
        height: item.height || 400,
        sizes: item.sizes || '(max-width: 560px) 100vw, (max-width: 900px) 50vw, 380px',
      }, {
        alt: title,
        loading: 'lazy',
        decoding: 'async',
      });

      return `
        <article class="news-card" id="noticia-${item.id}">
          <a class="news-thumb" ${linkAttr}>
            ${media}
            ${exampleBadge}
          </a>
          <div class="news-body">
            <time datetime="${item.date}">${formatDate(item.date)}</time>
            <h3><a ${linkAttr}>${escapeHtml(title)}</a></h3>
            <p>${escapeHtml(summary)}</p>
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

  return {
    setData(data) { news = Array.isArray(data) ? data : []; },
    render,
  };
}
