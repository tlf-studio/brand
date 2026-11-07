#!/usr/bin/env node
// Miniatures et habillage : miniature YouTube, couverture verticale (shorts), post « build in public ».
// Usage : npm run miniatures -- miniatures/exemple/youtube.json [autre.json …] [--sortie <dossier>]
// Export partagé avec le kit mod (scripts/lib/render.mjs).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { vectorize } from '../scripts/lib/svg-text.mjs';
import { png, esc, fill, template, place, dataUri, fitSize, wrap, imageSize } from '../scripts/lib/render.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const FORMATS = { youtube: [1280, 720], vertical: [1080, 1920], post: [1600, 900] };
const BRANCHES = ['jeux', 'mods', 'bots'];

const arg = (name) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : undefined;
};

function fondImage(file, W, H) {
  return `<image href="${dataUri(file)}" width="${W}" height="${H}" preserveAspectRatio="xMidYMid slice"/>
<defs><linearGradient id="voile" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#111111" stop-opacity=".25"/><stop offset="1" stop-color="#111111" stop-opacity=".85"/></linearGradient></defs>
<rect width="${W}" height="${H}" fill="url(#voile)"/>`;
}

/** Miniature YouTube ou couverture verticale. */
export function couverture(c) {
  const [W, H] = FORMATS[c.format];
  const vertical = c.format === 'vertical';
  const pad = Math.round(Math.min(W, H) * 0.07);
  const maxSize = Math.round(Math.min(W, H) * (vertical ? 0.11 : 0.12));
  const largeur = W - pad * 2;
  // Titre court : 2 lignes au plus, corps réduit jusqu'à ce que ça tienne.
  let size = maxSize, lignes;
  do {
    lignes = wrap(c.titre, largeur, { size, weight: 700, maxLines: 2 });
    size -= 2;
  } while (lignes.some((l) => l.endsWith('…')) && size > 24);
  size += 2;
  const interligne = Math.round(size * 1.05);
  const bandeauH = Math.round(pad * 1.1 + interligne * lignes.length + size * 0.25);
  const bandeauY = vertical ? Math.round(H * 0.62) : H - bandeauH - pad;
  const titre = lignes
    .map((l, i) => `<text x="${pad}" y="${bandeauY + Math.round(pad * 0.55) + size * 0.72 + i * interligne}" font-family="Space Grotesk" font-weight="700" font-size="${size}" fill="#111111">${esc(l)}</text>`)
    .join('\n');
  const marqueH = Math.round(Math.min(W, H) * (c.branche ? 0.12 : 0.13));
  const marque = c.branche
    ? place(`logo/branches/tlf-lockup-${c.branche}-dark.svg`, pad - marqueH * (10 / 120), pad - marqueH * (10 / 120), marqueH)
    : place('logo/static/tlf-monogram-dark.svg', pad - marqueH * (10 / 120), pad - marqueH * (10 / 120), marqueH);
  return fill(template('miniatures/gabarits/youtube.svg'), {
    W, H,
    TITRE: esc(c.titre),
    FOND: c.fond ? fondImage(c.fond, W, H) : '',
    BANDEAU_Y: bandeauY, BANDEAU_W: W, BANDEAU_H: bandeauH,
    TITRE_LIGNES: titre,
    MARQUE: marque,
  });
}

/** Capture placée dans le cadre 1000 × 772 du post, éventuellement floutée ou recadrée. */
function capture(c) {
  const X = 64, Y = 64, W = 1000, H = 772;
  if (!c.capture) return { capture: '', filtres: '' };
  const href = dataUri(c.capture);
  const anonyme = c.anonyme ?? null;
  if (anonyme?.mode === 'recadrage') {
    const r = anonyme.zone;
    if (!r) throw new Error('Mode anonyme « recadrage » : préciser anonyme.zone { x, y, largeur, hauteur } en pixels de la capture');
    const { width: iw, height: ih } = imageSize(c.capture);
    return {
      filtres: '',
      capture: `<svg x="${X}" y="${Y}" width="${W}" height="${H}" viewBox="${r.x} ${r.y} ${r.largeur} ${r.hauteur}" preserveAspectRatio="xMidYMid slice"><image href="${href}" width="${iw}" height="${ih}"/></svg>`,
    };
  }
  const img = `<image href="${href}" x="${X - 40}" y="${Y - 40}" width="${W + 80}" height="${H + 80}" preserveAspectRatio="xMidYMid slice"${anonyme ? ' filter="url(#flou)"' : ''}/>`;
  const force = anonyme?.force ?? 28;
  return { capture: img, filtres: anonyme ? `<filter id="flou" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="${force}"/></filter>` : '' };
}

/** Post « build in public » (Bluesky, X). */
export function post(c) {
  if (c.anonyme && ('projet' in c || 'nom' in c))
    throw new Error('Mode anonyme : retirer les champs « projet » et « nom », le nom du projet ne doit pas apparaître');
  if (c.anonyme && !['flou', 'recadrage'].includes(c.anonyme.mode)) throw new Error('anonyme.mode : « flou » ou « recadrage »');
  const { capture: cap, filtres } = capture(c);
  const lignes = wrap(c.legende ?? '', 420, { size: 34, weight: 500, maxLines: 9 });
  const debut = c.anonyme || !c.projet ? 200 : 236;
  return fill(template('miniatures/gabarits/post.svg'), {
    FILTRES: filtres,
    CAPTURE: cap,
    SURTITRE: !c.anonyme && c.projet ? `<text x="1120" y="184" font-family="Space Grotesk" font-weight="700" font-size="30" fill="#111111">${esc(c.projet)}</text>` : '',
    LEGENDE_LIGNES: lignes.map((l, i) => `<text x="1120" y="${debut + i * 46}" font-family="Space Grotesk" font-weight="500" font-size="34" fill="#4A4A4A">${esc(l)}</text>`).join('\n'),
    DATE: esc(c.date ?? ''),
    MONOGRAMME: place('logo/static/tlf-monogram-light.svg', 1450, 750, 96),
  });
}

export function generer(fichier, sortie = path.join(HERE, 'sortie')) {
  const c = JSON.parse(readFileSync(fichier, 'utf8'));
  if (!FORMATS[c.format]) throw new Error(`${fichier} : « format » parmi ${Object.keys(FORMATS).join(', ')}`);
  if (c.branche && !BRANCHES.includes(c.branche)) throw new Error(`${fichier} : « branche » parmi ${BRANCHES.join(', ')}`);
  for (const k of ['fond', 'capture']) if (c[k]) c[k] = path.resolve(path.dirname(fichier), c[k]);
  if (c.format !== 'post' && !c.titre) throw new Error(`${fichier} : « titre » obligatoire`);
  const svg = c.format === 'post' ? post(c) : couverture(c);
  const base = path.join(sortie, path.basename(fichier, '.json'));
  mkdirSync(sortie, { recursive: true });
  writeFileSync(`${base}.svg`, vectorize(svg));
  writeFileSync(`${base}.png`, png(svg, FORMATS[c.format][0]));
  console.log(`${path.basename(fichier)} → ${path.relative(process.cwd(), base)}.png (${FORMATS[c.format].join(' × ')})`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const fichiers = process.argv.slice(2).filter((a) => a.endsWith('.json'));
  if (!fichiers.length) {
    console.error('Usage : npm run miniatures -- <fichier.json> [autre.json …] [--sortie <dossier>]');
    process.exit(1);
  }
  for (const f of fichiers) generer(path.resolve(f), arg('sortie') ? path.resolve(arg('sortie')) : undefined);
}
