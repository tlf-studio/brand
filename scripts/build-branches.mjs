#!/usr/bin/env node
// Régénère logo/branches/ depuis logo/branches/src/ :
// SVG vectorisés, PNG (lockups 1200 et 2400 de large, avatars 112, 256, 512) et planche de contrôle.
// Usage : npm run build:branches
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { png } from './lib/render.mjs';
import { vectorize, stripFontStyles } from './lib/svg-text.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'logo', 'branches', 'src');
const OUT = path.join(ROOT, 'logo', 'branches');


const built = {};
for (const file of readdirSync(SRC).filter((f) => f.endsWith('.svg')).sort()) {
  const svg = vectorize(stripFontStyles(readFileSync(path.join(SRC, file), 'utf8')));
  if (/<text\b/.test(svg)) throw new Error(`${file} : texte non vectorisé`);
  writeFileSync(path.join(OUT, file), svg);
  built[file] = svg;
  const base = file.replace(/\.svg$/, '');
  const sizes = file.startsWith('tlf-lockup-') ? [1200, 2400] : [112, 256, 512];
  for (const w of sizes) writeFileSync(path.join(OUT, `${base}-${w}.png`), png(svg, w));
  console.log(`${file} → svg + ${sizes.join(', ')} px`);
}

// Planche de contrôle : toutes les variantes, en clair et en sombre.
const inner = (svg) => svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').replace(/<!--[\s\S]*?-->/g, '');
const nest = (svg, x, y, w, h) => {
  const vb = svg.match(/viewBox="([^"]+)"/)[1];
  return `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="${vb}">${inner(svg)}</svg>`;
};
const W = 1560;
const parts = [];
const label = (x, y, t, fill) =>
  `<text x="${x}" y="${y}" font-family="Space Grotesk, system-ui, sans-serif" font-size="13" letter-spacing="2" fill="${fill}">${t}</text>`;
const branches = ['studio', 'jeux', 'mods', 'bots'];
['light', 'dark'].forEach((theme, i) => {
  const x0 = i * (W / 2);
  const bg = theme === 'light' ? '#F4F4F2' : '#1C1C1C';
  const mute = theme === 'light' ? '#6B6B6B' : '#A0A0A0';
  parts.push(`<rect x="${x0}" y="0" width="${W / 2}" height="1240" fill="${bg}"/>`);
  parts.push(label(x0 + 40, 48, theme === 'light' ? 'LOCKUPS — CLAIR' : 'LOCKUPS — SOMBRE', mute));
  branches.forEach((b, j) => {
    parts.push(nest(built[`tlf-lockup-${b}-${theme}.svg`], x0 + 40, 76 + j * 180, 400, 160));
  });
  parts.push(label(x0 + 40, 836, 'AVATARS À PASTILLE — 200 / 112 / 64 PX', mute));
  ['jeux', 'mods', 'bots'].forEach((b, j) => {
    const s = built[`tlf-avatar-${b}.svg`];
    parts.push(nest(s, x0 + 40 + j * 236, 860, 200, 200));
    parts.push(nest(s, x0 + 40 + j * 236, 1080, 112, 112));
    parts.push(nest(s, x0 + 164 + j * 236, 1080, 64, 64));
  });
});
const planche = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} 1240" width="${W}" height="1240" role="img" aria-label="Planche de contrôle des déclinaisons TLF Studio">
<!-- Planche générée par scripts/build-branches.mjs. Ne pas modifier à la main. -->
${parts.join('\n')}
</svg>
`;
writeFileSync(path.join(OUT, 'planche.svg'), planche);
writeFileSync(path.join(OUT, 'planche.png'), png(planche, W));
console.log('planche.svg + planche.png');
