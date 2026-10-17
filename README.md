# Andean Labs — Web

Sitio estático de Andean Labs (HTML + JSON + assets), publicado con **GitHub Pages** desde `main`.

Preview actual (project site): https://felipebarraza6.github.io/andean-labs-web/

## Contenido editable

| Qué | Dónde |
|-----|--------|
| Noticias (6 miniaturas) | `data/news.json` + imágenes en `assets/news/` |
| Convenios / slider | `data/partners.json` (+ `logo` opcional en `assets/`) |
| Galería / carrusel | `data/gallery.json` + imágenes en `assets/img/` |
| Redes, WhatsApp, correo mostrado, correo del formulario, dirección | `data/social.json` (`email` = visible; `formEmail` = destino del form) |
| Textos ES / EN / 中文 | `i18n/es.json`, `i18n/en.json`, `i18n/zh.json` |
| Fotos de laboratorios | `assets/img/` |

## Cómo agregar una noticia

1. Sube la miniatura a `assets/news/` (JPEG original; luego corre `npm run optimize-images`).
2. Abre `data/news.json` y agrega un objeto al **inicio** del arreglo (las 6 más recientes por `date` se muestran):

```json
{
  "id": "mi-noticia-2026-10",
  "example": false,
  "date": "2026-10-16",
  "title": {
    "es": "Título en español",
    "en": "English title",
    "zh": "中文标题"
  },
  "summary": {
    "es": "Resumen corto…",
    "en": "Short summary…",
    "zh": "简短摘要…"
  },
  "image": "assets/news/mi-noticia.jpg",
  "link": ""
}
```

3. Si `link` está vacío, el compartir usa la URL de la página + ancla `#noticia-<id>`. Si tiene URL, se usa ese enlace.
4. Pon `"example": false` en noticias reales. Las 6 entradas actuales están marcadas como **ejemplo** (`"example": true` + prefijo `[EJEMPLO]` / `[EXAMPLE]` / `[示例]`).
5. Haz commit y push a la rama publicada (p. ej. `main`).

Cada tarjeta incluye botones para compartir en WhatsApp, Facebook, LinkedIn y copiar el enlace.

## Cómo agregar un convenio al slider

Edita `data/partners.json`:

```json
{
  "id": "nuevo-socio",
  "name": "NOMBRE CORTO",
  "fullName": "Nombre completo",
  "logo": "assets/img/logo-socio.png",
  "tagline": {
    "es": "Descripción breve",
    "en": "Short description",
    "zh": "简短说明"
  },
  "todo": false
}
```

Si no hay logo oficial, deja `"logo": null` y `"todo": true`: se muestra un placeholder de texto con marca TODO.

## Cómo agregar o editar una foto de la galería

1. Sube la imagen a `assets/img/` (recomendado ~1920×1440 JPEG) y corre `npm run optimize-images`.
2. Edita `data/gallery.json` y agrega (o modifica) un objeto en el arreglo:

```json
{
  "image": "assets/img/mi-foto.jpg",
  "lab": "analisis|mecatronica|biotecnologia|fablab|espacios",
  "title": {
    "es": "Laboratorio de Análisis Industriales",
    "en": "Industrial Analysis Laboratory",
    "zh": "工业分析实验室"
  },
  "caption": {
    "es": "Caption corto en una línea.",
    "en": "Short one-line caption.",
    "zh": "一行简短说明。"
  },
  "alt": {
    "es": "Texto alternativo",
    "en": "Alt text",
    "zh": "替代文本"
  },
  "width": 1920,
  "height": 1440,
  "placeholder": false
}
```

3. Para el FAB LAB u otra foto pendiente, usa `"image": null`, `"placeholder": true` y un `todo` descriptivo; no rotules una foto de otro laboratorio como FAB LAB.
4. Haz commit y push a la rama publicada.

El carrusel re-renderiza al cambiar idioma (ES / EN / 中文).

## Formulario de contacto

El correo **mostrado** en Contacto es `contacto@andeanlabs.cl` (`data/social.json` → `email`).

El formulario abre el cliente de correo del visitante (`mailto:`) hacia **mesparza@andeanlabs.cl** (`data/social.json` → `formEmail`).

No hay backend. Alternativas sin servidor propio: [Formspree](https://formspree.io/) o [FormSubmit](https://formsubmit.co/) apuntando al mismo correo de formulario.

## WhatsApp y redes

- WhatsApp flotante y en contacto: https://wa.me/56982653092  
- Teléfono mostrado: +56 9 7605 2000 (`phone` / `phoneDisplay` en `data/social.json`)
- Facebook / LinkedIn / Instagram: URLs en `data/social.json` con valores `#TODO-…` hasta que el cliente envíe los enlaces oficiales. Edita solo ese archivo.

## Idiomas

Selector **ES / EN / 中文** en el header (ES por defecto). La preferencia se guarda en `localStorage` (`al-lang`). Traducciones en `i18n/*.json`.

## Dominio personalizado `andeanlabs.cl`

**No se agregó archivo `CNAME` en este PR** para no romper la URL actual de GitHub Pages (`https://felipebarraza6.github.io/andean-labs-web/`) mientras el DNS aún no está configurado.

Cuando quieras activar el dominio:

1. En el DNS de `andeanlabs.cl`:
   - Registros **A** para `@` → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - Registro **CNAME** para `www` → `felipebarraza6.github.io`
2. En el repo: **Settings → Pages → Custom domain** → `andeanlabs.cl` (GitHub creará/actualizará el `CNAME`).
3. Activa “Enforce HTTPS” cuando el certificado esté listo.
4. Opcional: en Pages, si usas custom domain, la URL `github.io` puede redirigir al dominio; verifica el comportamiento antes de publicarlo.

## Estructura

```
index.html
assets/
  js/
    main.js       # entrada (ES modules, sin bundler)
    lib.js        # fetch cache, picture/srcset
    gallery.js | partners.js | news.js
  img/            # originales + img/r/ (AVIF/WebP/JPG responsive)
  news/           # miniaturas + news/r/
  logo-*.png|.webp
data/
  news.json | partners.json | gallery.json | social.json
  image-manifest.json   # generado por el script de imágenes
i18n/
  es.json | en.json | zh.json
scripts/
  optimize-images.mjs   # regenera variantes responsive (Node + sharp)
```

## Imágenes responsive (rendimiento)

Las fotos grandes viven en `assets/img/` y `assets/news/`. El sitio sirve variantes **AVIF / WebP / JPG** en anchos **480 / 960 / 1600** vía `<picture>` + `srcset`/`sizes`.

Tras agregar o reemplazar un JPG/PNG:

```bash
npm install          # solo para el script (devDependency: sharp)
npm run optimize-images
```

Eso escribe `assets/{img,news}/r/<nombre>-<ancho>.{avif,webp,jpg}`, actualiza `srcset`/`sizes`/`width`/`height` en `data/gallery.json` y `data/news.json` (el campo `image` original se conserva como fallback), y regenera `data/image-manifest.json`.

Sin Node, el sitio sigue funcionando: el JS usa `image` si no hay `srcset`, o deriva rutas `*/r/` por convención.

## Desarrollo local

Sirve la carpeta con cualquier servidor estático (necesario para `fetch` de JSON y ES modules):

```bash
python3 -m http.server 8080
# abrir http://localhost:8080
```

O: `npm run serve`.
