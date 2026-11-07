#!/usr/bin/env node
// Assemble le dossier presse/ à partir des fichiers de référence du repo.
// Usage : npm run build:presse
//   presse/logos/        monogrammes, avatars, lockups (SVG + PNG)
//   presse/ident/        ident complet et coupe courte (mp4, wav, mp3)
//   presse/palette/      tokens
//   presse/typographie/  Space Grotesk + licence OFL
//   presse/regles.pdf    généré depuis presse/regles.md
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, rmSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { chromium } from 'playwright';
import { ROOT, png, esc } from './lib/render.mjs';

const P = path.join(ROOT, 'presse');
const r = (...p) => path.join(ROOT, ...p);
const cp = (src, dest) => {
  mkdirSync(path.dirname(path.join(P, dest)), { recursive: true });
  copyFileSync(r(src), path.join(P, dest));
};
for (const d of ['logos', 'ident', 'palette', 'typographie']) rmSync(path.join(P, d), { recursive: true, force: true });

// Logos : SVG d'origine, PNG 512 et 2048 (monogrammes et avatars), 1200 et 2400 de large (lockups).
const svgPng = (src, dest, tailles) => {
  cp(src, `logos/${dest}.svg`);
  const svg = readFileSync(r(src), 'utf8');
  for (const t of tailles) writeFileSync(path.join(P, 'logos', `${dest}-${t}.png`), png(svg, t));
};
for (const v of ['light', 'dark', 'on-accent']) svgPng(`logo/static/tlf-monogram-${v}.svg`, `tlf-monogram-${v}`, [512, 2048]);
svgPng('logo/static/tlf-avatar.svg', 'tlf-avatar', [512, 2048]);
for (const b of ['jeux', 'mods', 'bots']) svgPng(`logo/branches/tlf-avatar-${b}.svg`, `tlf-avatar-${b}`, [512, 2048]);
for (const b of ['studio', 'jeux', 'mods', 'bots'])
  for (const t of ['light', 'dark']) svgPng(`logo/branches/tlf-lockup-${b}-${t}.svg`, `tlf-lockup-${b}-${t}`, [1200, 2400]);

// Ident complet et coupe courte. La vidéo courte reprend la même fenêtre que le son court.
for (const ext of ['mp4', 'wav', 'mp3']) cp(`ident/TLF-ident-C-final.${ext}`, `ident/TLF-ident-C-final.${ext}`);
for (const ext of ['wav', 'mp3']) cp(`ident/TLF-ident-C-short.${ext}`, `ident/TLF-ident-C-short.${ext}`);
const { short } = JSON.parse(readFileSync(r('ident', 'timing.json'), 'utf8'));
execFileSync('ffmpeg', [
  '-v', 'error', '-y', '-ss', String(short.debutDansFull), '-t', String(short.duree), '-i', r('ident', 'TLF-ident-C-final.mp4'),
  '-i', r('ident', 'TLF-ident-C-short.wav'), '-map', '0:v', '-map', '1:a',
  '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k',
  '-shortest', '-movflags', '+faststart', path.join(P, 'ident', 'TLF-ident-C-short.mp4'),
]);

// Palette et typographie.
cp('palette/tokens.json', 'palette/tokens.json');
cp('palette/tokens.css', 'palette/tokens.css');
for (const f of ['SpaceGrotesk-Bold.ttf', 'SpaceGrotesk-Medium.ttf', 'OFL.txt']) cp(`fonts/${f}`, `typographie/${f}`);

// Règles d'usage : Markdown → HTML → PDF (Chromium).
function md2html(md) {
  const inline = (s) => esc(s).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  const out = [];
  const lines = md.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (/^#{1,3} /.test(l)) {
      const n = l.match(/^#+/)[0].length;
      out.push(`<h${n}>${inline(l.slice(n + 1))}</h${n}>`);
    } else if (l.startsWith('|')) {
      const rows = [];
      while (i < lines.length && lines[i].startsWith('|')) rows.push(lines[i++]);
      i--;
      const cells = (row) => row.split('|').slice(1, -1).map((c) => inline(c.trim()));
      out.push(`<table><thead><tr>${cells(rows[0]).map((c) => `<th>${c}</th>`).join('')}</tr></thead><tbody>${rows
        .slice(2).map((row) => `<tr>${cells(row).map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`);
    } else if (l.startsWith('- ')) {
      const items = [];
      while (i < lines.length && lines[i].startsWith('- ')) items.push(`<li>${inline(lines[i++].slice(2))}</li>`);
      i--;
      out.push(`<ul>${items.join('')}</ul>`);
    } else if (l.trim()) out.push(`<p>${inline(l)}</p>`);
  }
  return out.join('\n');
}
const font = (w, f) =>
  `@font-face{font-family:'Space Grotesk';font-weight:${w};src:url(data:font/ttf;base64,${readFileSync(r('fonts', f)).toString('base64')})}`;
const mono = readFileSync(r('logo/static/tlf-monogram-light.svg'), 'utf8').replace(/width="240" height="240"/, 'width="56" height="56"');
const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><style>
${font(700, 'SpaceGrotesk-Bold.ttf')}${font(500, 'SpaceGrotesk-Medium.ttf')}
@page{size:A4;margin:22mm 20mm}
body{font-family:'Space Grotesk',sans-serif;font-weight:500;color:#111111;font-size:10.5pt;line-height:1.5}
h1{font-size:22pt;margin:18px 0 6px;line-height:1.15}h2{font-size:13pt;margin:22px 0 6px;padding-top:10px;border-top:1px solid #E0E0DC;break-after:avoid}
h2::before{content:'';display:inline-block;width:9px;height:9px;background:#E8562A;margin-right:10px;vertical-align:1px}
table{border-collapse:collapse;width:100%;margin:6px 0 10px;break-inside:avoid}th,td{text-align:left;padding:5px 8px;border-bottom:1px solid #E0E0DC}
th{font-size:8pt;letter-spacing:.2em;text-transform:uppercase;color:#6B6B6B}code{font-family:inherit;background:#F4F4F2;padding:1px 5px;border-radius:4px}
ul{padding-left:18px}strong{font-weight:700}
</style></head><body>${mono}${md2html(readFileSync(path.join(P, 'regles.md'), 'utf8'))}</body></html>`;
const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent(html, { waitUntil: 'load' });
await page.pdf({ path: path.join(P, 'regles.pdf'), format: 'A4', printBackground: true });
await browser.close();
if (!existsSync(path.join(P, 'regles.pdf'))) throw new Error('regles.pdf non généré');
console.log('presse/ à jour : logos, ident, palette, typographie, regles.pdf');
