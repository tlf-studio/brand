// Vectorisation des éléments <text> d'un SVG à partir des fichiers OFL de Space Grotesk.
// Le SVG produit ne dépend d'aucune police installée.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import opentype from 'opentype.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const FONTS = {
  700: path.join(ROOT, 'fonts', 'SpaceGrotesk-Bold.ttf'),
  500: path.join(ROOT, 'fonts', 'SpaceGrotesk-Medium.ttf'),
};
const cache = new Map();

export function font(weight = 700) {
  const w = Number(weight) >= 600 ? 700 : 500;
  if (!cache.has(w)) {
    const buf = readFileSync(FONTS[w]);
    cache.set(w, opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)));
  }
  return cache.get(w);
}

/** Largeur d'avance d'une chaîne, espacement compris mais sans l'espacement après la dernière lettre. */
export function measure(text, { size, weight = 700, tracking = 0 }) {
  const f = font(weight);
  const scale = size / f.unitsPerEm;
  const glyphs = f.stringToGlyphs(text);
  let w = 0;
  glyphs.forEach((g, i) => {
    w += g.advanceWidth * scale;
    if (i < glyphs.length - 1) w += tracking * size + (f.getKerningValue(g, glyphs[i + 1]) || 0) * scale;
  });
  return w;
}

/** Tracé SVG (attribut d) d'une chaîne posée à (x, y) sur sa ligne de base. */
export function textPath(text, { x, y, size, weight = 700, tracking = 0, anchor = 'start' }) {
  const f = font(weight);
  const scale = size / f.unitsPerEm;
  const glyphs = f.stringToGlyphs(text);
  // 'middle' centre l'encre réelle des lettres (et non les chasses), pour un centrage optique exact.
  const build = (x0) => {
    const p = new opentype.Path();
    let cx = x0;
    glyphs.forEach((g, i) => {
      p.extend(g.getPath(cx, y, size));
      cx += g.advanceWidth * scale;
      if (i < glyphs.length - 1) cx += tracking * size + (f.getKerningValue(g, glyphs[i + 1]) || 0) * scale;
    });
    return p;
  };
  let p = build(x);
  if (anchor === 'middle' || anchor === 'end') {
    const b = p.getBoundingBox();
    p = build(x - (anchor === 'middle' ? (b.x1 + b.x2) / 2 : b.x2) + x);
  }
  return p.toPathData(2);
}

const attr = (s, name) => {
  const m = s.match(new RegExp(`\\s${name}="([^"]*)"`));
  return m ? m[1] : undefined;
};

/**
 * Remplace chaque <text> par un <path>. Attributs lus : x, y, font-size, font-weight,
 * letter-spacing (en em), text-anchor, fill, data-label (conservé en aria-label du chemin).
 */
export function vectorize(svg) {
  return svg.replace(/<text\b([^>]*)>([^<]*)<\/text>/g, (_, attrs, content) => {
    const size = Number(attr(attrs, 'font-size'));
    const ls = attr(attrs, 'letter-spacing') || '0';
    const tracking = ls.endsWith('em') ? Number(ls.slice(0, -2)) : Number(ls) / size;
    const d = textPath(content.trim(), {
      x: Number(attr(attrs, 'x')),
      y: Number(attr(attrs, 'y')),
      size,
      weight: attr(attrs, 'font-weight') || 700,
      tracking,
      anchor: attr(attrs, 'text-anchor') || 'start',
    });
    const fill = attr(attrs, 'fill') || '#111111';
    return `<path data-text="${content.trim()}" fill="${fill}" d="${d}"/>`;
  });
}

/** Retire le @import de police et les règles de style destinées au rendu avec <text>. */
export function stripFontStyles(svg) {
  return svg.replace(/<style[^>]*>[\s\S]*?<\/style>\s*/g, '');
}
