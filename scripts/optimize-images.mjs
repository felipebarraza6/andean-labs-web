#!/usr/bin/env node
/**
 * Genera variantes responsive AVIF / WebP / JPG (480 / 960 / 1600)
 * a partir de los originales en assets/img/ y assets/news/.
 *
 * Uso:
 *   npm install
 *   npm run optimize-images
 *
 * Salida: assets/{img,news}/r/<basename>-<width>.{avif,webp,jpg}
 * También escribe/actualiza campos srcset en data/gallery.json y data/news.json
 * (mantiene "image" como fallback JPG original).
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const WIDTHS = [480, 960, 1600];
const FORMATS = [
  { ext: 'avif', options: { quality: 55, effort: 4 } },
  { ext: 'webp', options: { quality: 72 } },
  { ext: 'jpg', options: { quality: 78, mozjpeg: true } },
];

const INPUT_DIRS = [
  { dir: 'assets/img', out: 'assets/img/r' },
  { dir: 'assets/news', out: 'assets/news/r' },
];

function basenameNoExt(file) {
  return path.basename(file, path.extname(file));
}

function toPosix(p) {
  return p.split(path.sep).join('/');
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function listImages(dir) {
  const abs = path.join(ROOT, dir);
  let entries;
  try {
    entries = await fs.readdir(abs);
  } catch {
    return [];
  }
  return entries
    .filter((f) => /\.(jpe?g|png)$/i.test(f))
    .map((f) => path.join(dir, f));
}

async function optimizeOne(relInput, outRelDir) {
  const absIn = path.join(ROOT, relInput);
  const base = basenameNoExt(relInput);
  const absOutDir = path.join(ROOT, outRelDir);
  await ensureDir(absOutDir);

  const meta = await sharp(absIn).metadata();
  const srcW = meta.width || 1920;
  const srcH = meta.height || 1440;

  const generated = { avif: [], webp: [], jpg: [] };

  for (const w of WIDTHS) {
    const targetW = Math.min(w, srcW);
    for (const fmt of FORMATS) {
      const outName = `${base}-${w}.${fmt.ext}`;
      const absOut = path.join(absOutDir, outName);
      const relOut = toPosix(path.join(outRelDir, outName));

      let pipeline = sharp(absIn).resize({
        width: targetW,
        withoutEnlargement: true,
        fit: 'inside',
      });

      if (fmt.ext === 'avif') pipeline = pipeline.avif(fmt.options);
      else if (fmt.ext === 'webp') pipeline = pipeline.webp(fmt.options);
      else pipeline = pipeline.jpeg(fmt.options);

      await pipeline.toFile(absOut);
      generated[fmt.ext].push(`${relOut} ${w}w`);
    }
  }

  const srcset = {
    avif: generated.avif.join(', '),
    webp: generated.webp.join(', '),
    jpg: generated.jpg.join(', '),
  };

  return { src: toPosix(relInput), width: srcW, height: srcH, srcset };
}

function defaultSizes(kind) {
  if (kind === 'news') return '(max-width: 560px) 100vw, (max-width: 900px) 50vw, 380px';
  if (kind === 'gallery') return '(max-width: 1180px) 100vw, 1124px';
  return '(max-width: 900px) 100vw, 560px';
}

async function patchGallery(manifest) {
  const file = path.join(ROOT, 'data/gallery.json');
  const data = JSON.parse(await fs.readFile(file, 'utf8'));
  for (const item of data) {
    if (!item.image || item.placeholder) continue;
    const m = manifest.get(toPosix(item.image));
    if (!m) continue;
    item.width = m.width;
    item.height = m.height;
    item.srcset = m.srcset;
    item.sizes = item.sizes || defaultSizes('gallery');
  }
  await fs.writeFile(file, JSON.stringify(data, null, 2) + '\n');
}

async function patchNews(manifest) {
  const file = path.join(ROOT, 'data/news.json');
  const data = JSON.parse(await fs.readFile(file, 'utf8'));
  for (const item of data) {
    if (!item.image) continue;
    const m = manifest.get(toPosix(item.image));
    if (!m) continue;
    item.width = m.width;
    item.height = m.height;
    item.srcset = m.srcset;
    item.sizes = item.sizes || defaultSizes('news');
  }
  await fs.writeFile(file, JSON.stringify(data, null, 2) + '\n');
}

async function writeManifest(manifest) {
  const out = path.join(ROOT, 'data/image-manifest.json');
  const obj = Object.fromEntries(manifest);
  await fs.writeFile(out, JSON.stringify(obj, null, 2) + '\n');
}

async function main() {
  const manifest = new Map();
  let count = 0;

  for (const { dir, out } of INPUT_DIRS) {
    const files = await listImages(dir);
    for (const rel of files) {
      process.stdout.write(`Optimizando ${rel}… `);
      const result = await optimizeOne(rel, out);
      manifest.set(result.src, {
        width: result.width,
        height: result.height,
        srcset: result.srcset,
      });
      count += 1;
      console.log('ok');
    }
  }

  // Logos (PNG) → WebP más livianos junto al original (sin srcset multi-ancho)
  for (const logo of ['assets/logo-full.png', 'assets/logo-icon.png']) {
    const abs = path.join(ROOT, logo);
    try {
      await fs.access(abs);
    } catch {
      continue;
    }
    const webpOut = logo.replace(/\.png$/i, '.webp');
    await sharp(abs).webp({ quality: 80 }).toFile(path.join(ROOT, webpOut));
    console.log(`Logo WebP: ${webpOut}`);
  }

  await patchGallery(manifest);
  await patchNews(manifest);
  await writeManifest(manifest);

  console.log(`\nListo: ${count} imágenes → variantes en */r/`);
  console.log('Actualizados: data/gallery.json, data/news.json, data/image-manifest.json');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
