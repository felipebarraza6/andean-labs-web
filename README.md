# Andean Labs — Web

Sitio estático de Andean Labs (HTML + JSON + assets), publicado con **GitHub Pages** desde `main`.

Preview actual (project site): https://felipebarraza6.github.io/andean-labs-web/

## Contenido editable

| Qué | Dónde |
|-----|--------|
| Noticias (6 miniaturas) | `data/news.json` + imágenes en `assets/news/` |
| Convenios / slider | `data/partners.json` (+ `logo` opcional en `assets/`) |
| Redes, WhatsApp, correo, dirección | `data/social.json` |
| Textos ES / EN / 中文 | `i18n/es.json`, `i18n/en.json`, `i18n/zh.json` |
| Fotos de laboratorios | `assets/img/` |

## Cómo agregar una noticia

1. Sube la miniatura a `assets/news/` (JPEG/WebP recomendado, ~1200px de ancho).
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

## Formulario de contacto

El formulario abre el cliente de correo del visitante (`mailto:`) hacia **mesparza@andeanlabs.cl** (definido en `data/social.json` → `email`).

No hay backend. Alternativas sin servidor propio: [Formspree](https://formspree.io/) o [FormSubmit](https://formsubmit.co/) apuntando al mismo correo.

## WhatsApp y redes

- WhatsApp flotante y en contacto: https://wa.me/56982653092  
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
  js/main.js
  img/          # fotos de labs, biotec, podcast
  news/         # miniaturas de noticias
  logo-*.png
data/
  news.json
  partners.json
  social.json
i18n/
  es.json | en.json | zh.json
```

## Desarrollo local

Sirve la carpeta con cualquier servidor estático (necesario para que `fetch` cargue los JSON):

```bash
python3 -m http.server 8080
# abrir http://localhost:8080
```
