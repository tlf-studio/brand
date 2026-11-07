// Outils d'export partagés : remplissage des gabarits SVG, rendu PNG, insertion des logos.
// Utilisés par scripts/build-branches.mjs, kit-mod/generate.mjs et miniatures/generate.mjs.
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';
import { measure } from './svg-text.mjs';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const COLORS = { ink: '#111111', accent: '#E8562A', bg: '#F4F4F2', white: '#FFFFFF', muted: '#6B6B6B', mutedDark: '#A0A0A0', line: '#E0E0DC', surface: '#1C1C1C', surface2: '#2A2A2A' };
const FONT_FILES = ['Bold', 'Medium'].map((w) => path.join(ROOT, 'fonts', `SpaceGrotesk-${w}.ttf`));

/** Rendu PNG. Si width et height sont donnés, le SVG doit déjà avoir ces proportions. */
export function png(svg, width) {
  const opts = { font: { fontFiles: FONT_FILES, loadSystemFonts: false, defaultFontFamily: 'Space Grotesk' } };
  if (width) opts.fitTo = { mode: 'width', value: Math.round(width) };
  return new Resvg(svg, opts).render().asPng();
}

export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Remplace les {{CLE}} d'un gabarit. Une clé absente est une erreur, pour ne rien publier de cassé. */
export function fill(template, vars) {
  return template.replace(/\{\{([A-Z0-9_]+)\}\}/g, (_, k) => {
    if (!(k in vars)) throw new Error(`Gabarit : valeur manquante pour {{${k}}}`);
    return String(vars[k]);
  });
}

export function template(file) {
  return readFileSync(path.join(ROOT, file), 'utf8');
}

/** Contenu d'un SVG du repo (sans la balise racine), à placer dans un <svg> imbriqué. */
export function logo(file) {
  const src = readFileSync(path.join(ROOT, file), 'utf8');
  const viewBox = src.match(/viewBox="([^"]+)"/)[1];
  const inner = src.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').replace(/<!--[\s\S]*?-->/g, '').trim();
  const [, , w, h] = viewBox.split(/\s+/).map(Number);
  return { viewBox, inner, ratio: w / h };
}

/** <svg> imbriqué positionné : place un logo du repo sans le redessiner ni le déformer. */
export function place(file, x, y, height) {
  const l = logo(file);
  return `<svg x="${x}" y="${y}" width="${(height * l.ratio).toFixed(2)}" height="${height}" viewBox="${l.viewBox}">${l.inner}</svg>`;
}

/** Image locale en data URI (PNG ou JPEG). */
export function dataUri(file) {
  if (!existsSync(file)) throw new Error(`Image introuvable : ${file}`);
  const ext = path.extname(file).toLowerCase();
  const mime = ext === '.png' ? 'image/png' : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : null;
  if (!mime) throw new Error(`Format d'image non pris en charge (PNG ou JPEG) : ${file}`);
  return `data:${mime};base64,${readFileSync(file).toString('base64')}`;
}

/** Plus grand corps (≤ max) pour que le texte tienne dans la largeur donnée. */
export function fitSize(text, maxWidth, { max, min = 12, weight = 700, tracking = 0 }) {
  let size = max;
  while (size > min && measure(text, { size, weight, tracking }) > maxWidth) size -= 1;
  return size;
}

/** Coupe un texte en lignes d'au plus maxWidth. */
export function wrap(text, maxWidth, { size, weight = 500, tracking = 0, maxLines = 3 }) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = '';
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (cur && measure(next, { size, weight, tracking }) > maxWidth) {
      lines.push(cur);
      cur = w;
    } else cur = next;
  }
  if (cur) lines.push(cur);
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    kept[maxLines - 1] = kept[maxLines - 1].replace(/\s*\S*$/, '') + ' …';
    return kept;
  }
  return lines;
}

export const isHex = (c) => /^#[0-9A-Fa-f]{6}$/.test(c);

/** Dimensions d'une image PNG ou JPEG, lues dans l'en-tête. */
export function imageSize(file) {
  const b = readFileSync(file);
  if (b.readUInt32BE(0) === 0x89504e47) return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
  if (b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i < b.length) {
      const marker = b[i + 1];
      const len = b.readUInt16BE(i + 2);
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker))
        return { width: b.readUInt16BE(i + 7), height: b.readUInt16BE(i + 5) };
      i += 2 + len;
    }
  }
  throw new Error(`Dimensions illisibles : ${file}`);
}
