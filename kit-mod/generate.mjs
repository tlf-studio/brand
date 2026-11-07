#!/usr/bin/env node
// Kit page de mod : génère les visuels de chaque plateforme à partir d'un mod.json.
// Usage : npm run kit:mod -- kit-mod/exemple/mod.json [--sortie kit-mod/sortie]
//
// Formats exigés par les plateformes, vérifiés le 7 novembre 2026 :
// - CurseForge : logo de projet carré 1:1, PNG, au moins 400 × 400 (les images plus grandes sont
//   réduites), pas un carré uni. Pas de bannière ; galerie sans taille imposée.
//   Source : https://support.curseforge.com/support/solutions/articles/9000199552
// - Modrinth : icône 256 Kio au plus (png, jpg, webp, gif, svg…), sans dimensions imposées ;
//   images de galerie 5 Mio au plus, l'une marquée « featured ». Pas de champ bannière.
//   Sources : https://docs.modrinth.com/api/operations/changeprojecticon/
//             https://docs.modrinth.com/api/operations/addgalleryimage/
// - Thunderstore : icon.png à la racine du paquet, exactement 256 × 256, PNG.
//   Source : https://wiki.thunderstore.io/mods/creating-a-package
// - LCPDFR.com : au moins une capture en jeu (ou OpenIV), et la capture principale doit montrer
//   le mod lui-même : l'en-tête de galerie ne doit donc jamais être placé en premier. Aucune
//   dimension publiée ; on fournit du 1920 × 1080.
//   Source : https://www.lcpdfr.com/guideline-hub/file-guidelines-r3/
// - Nexus Mods : la première image (« primary ») sert de vignette dans les recherches ; le wiki
//   recommande du 16:9 en 1920 × 1080 et une bannière d'en-tête 1400 × 400. Recommandation non
//   officielle (wiki ancien, pages d'aide inaccessibles) : à contrôler à l'envoi.
//   Source : https://wiki.nexusmods.com/index.php/Creating_a_mod_page
import { readFileSync, writeFileSync, mkdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { measure, vectorize } from '../scripts/lib/svg-text.mjs';
import { ROOT, COLORS, png, esc, fill, template, place, dataUri, fitSize, isHex } from '../scripts/lib/render.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));

export const PLATEFORMES = {
  curseforge: { nom: 'CurseForge', icone: { taille: 512 }, banniere: [1920, 480], galerie: [1920, 1080] },
  modrinth: { nom: 'Modrinth', icone: { taille: 512, maxOctets: 256 * 1024 }, banniere: [1920, 480], galerie: [1920, 1080] },
  thunderstore: { nom: 'Thunderstore', icone: { taille: 256, fichier: 'icon.png' }, banniere: [1920, 480] },
  lcpdfr: { nom: 'LCPDFR.com', banniere: [1920, 480], galerie: [1920, 1080] },
  nexus: { nom: 'Nexus Mods', banniere: [1400, 400], galerie: [1920, 1080] },
};

const arg = (name) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : undefined;
};

/** Fond : visuel du mod recadré en « cover », assombri vers la gauche pour la lisibilité du texte. */
function fond(mod, W, H, { degrade = true, id = 'f' } = {}) {
  if (!mod.visuel) return '';
  const img = `<image href="${dataUri(mod.visuel)}" width="${W}" height="${H}" preserveAspectRatio="xMidYMid slice"/>`;
  if (!degrade) return img;
  return `${img}<defs><linearGradient id="${id}-voile" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#111111" stop-opacity=".92"/><stop offset=".55" stop-color="#111111" stop-opacity=".6"/><stop offset="1" stop-color="#111111" stop-opacity=".35"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#${id}-voile)"/>`;
}

export function banniere(mod, [W, H]) {
  const pad = Math.round(H * 0.16);
  const lockH = Math.round(H * 0.2);
  const lockW = lockH * 2.5;
  const titreSize = fitSize(mod.nom, W - pad * 3 - lockW, { max: Math.round(H * 0.24) });
  const accrocheSize = Math.round(H * 0.075);
  const filetH = Math.max(4, Math.round(H * 0.016));
  return fill(template('kit-mod/gabarits/banniere.svg'), {
    W, H, PAD: pad,
    NOM: esc(mod.nom),
    ACCROCHE: esc(mod.accroche ?? ''),
    TITRE_SIZE: titreSize,
    TITRE_Y: Math.round(H * 0.5),
    ACCROCHE_SIZE: accrocheSize,
    ACCROCHE_Y: Math.round(H * 0.5 + accrocheSize * 1.9),
    FOND: fond(mod, W, H, { id: 'banniere' }),
    FILET_Y: H - filetH, FILET_H: filetH,
    SECONDAIRE: mod.couleurSecondaire ?? COLORS.accent,
    LOCKUP: place('logo/branches/tlf-lockup-mods-dark.svg', W - pad - lockW, H - pad - lockH, lockH),
  });
}

export function icone(mod) {
  if (mod.icone !== 'visuel' || !mod.visuel) return readFileSync(path.join(ROOT, 'logo/branches/tlf-avatar-mods.svg'), 'utf8');
  return fill(template('kit-mod/gabarits/icone.svg'), {
    NOM: esc(mod.nom),
    FOND: fond(mod, 512, 512, { degrade: false }),
    MONOGRAMME: place('logo/static/tlf-avatar.svg', 376, 376, 112),
  });
}

export function galerieEntete(mod, [W, H], section = 'Présentation') {
  const pad = Math.round(H * 0.09);
  const titreSize = fitSize(mod.nom, W - pad * 2, { max: Math.round(H * 0.13) });
  const sectionSize = Math.round(H * 0.026);
  const monoH = Math.round(H * 0.12);
  return fill(template('kit-mod/gabarits/galerie-entete.svg'), {
    W, H, PAD: pad,
    NOM: esc(mod.nom),
    SECTION: esc(section.toUpperCase()),
    FOND: fond(mod, W, H, { id: 'galerie' }),
    BARRE_Y: Math.round(H * 0.58), BARRE_W: Math.round(H * 0.06), BARRE_H: Math.round(H * 0.012),
    SECTION_Y: Math.round(H * 0.58) + Math.round(H * 0.012) + Math.round(sectionSize * 2.2),
    SECTION_SIZE: sectionSize,
    SECONDAIRE_TEXTE: mod.couleurSecondaire ?? '#A0A0A0',
    TITRE_Y: Math.round(H * 0.58) - Math.round(H * 0.04),
    TITRE_SIZE: titreSize,
    MONOGRAMME: place('logo/static/tlf-monogram-dark.svg', W - pad - monoH, pad - monoH * (10 / 120), monoH),
  });
}

const STATUTS = { stable: '#2E7D4F', beta: '#E8562A', alpha: '#8A4FD8', archive: '#6B6B6B' };
const STATUT_LIBELLE = { stable: 'Stable', beta: 'Bêta', alpha: 'Alpha', archive: 'Archivé' };

export function badge(libelle, valeur, { fondValeur = COLORS.surface2, texteValeur = '#FFFFFF', id }) {
  const L = libelle.toUpperCase();
  const gauche = Math.ceil(14 + measure(L, { size: 12, weight: 500, tracking: 0.2 }) + 14);
  const droite = Math.ceil(12 + measure(valeur, { size: 15, weight: 700 }) + 14);
  return fill(template('kit-mod/gabarits/badge.svg'), {
    W: gauche + droite, GAUCHE_W: gauche, DROITE_W: droite, VALEUR_X: gauche + 12, ID: id,
    LIBELLE: esc(L), VALEUR: esc(valeur), FOND_VALEUR: fondValeur, TEXTE_VALEUR: texteValeur,
  });
}

export function badges(mod) {
  const out = { version: badge('Version', mod.versions.mod, { fondValeur: COLORS.white, texteValeur: COLORS.ink, id: 'version' }) };
  out.chargeur = badge('Chargeur', mod.versions.chargeurs.join(' · '), { id: 'chargeur' });
  out.jeu = badge(mod.jeu ?? 'Jeu', mod.versions.jeu.join(' · '), { fondValeur: COLORS.white, texteValeur: COLORS.ink, id: 'jeu' });
  if (mod.statut) out.statut = badge('Statut', STATUT_LIBELLE[mod.statut] ?? mod.statut, { fondValeur: STATUTS[mod.statut] ?? COLORS.surface2, id: 'statut' });
  return out;
}

export function description(mod) {
  const md = readFileSync(path.join(HERE, 'description.md'), 'utf8');
  const liste = (a) => (a?.length ? a.map((x) => `- ${x}`).join('\n') : '- <à compléter>');
  return fill(md, {
    NOM: mod.nom,
    ACCROCHE: mod.accroche ?? '',
    PRESENTATION: mod.presentation ?? '<à compléter>',
    FONCTIONNALITES: liste(mod.fonctionnalites),
    INSTALLATION: liste(mod.installation),
    JEU: mod.jeu ?? 'Jeu',
    VERSIONS_JEU: mod.versions.jeu.join(', '),
    CHARGEURS: mod.versions.chargeurs.join(', '),
    COMPATIBILITE: liste(mod.compatibilite),
    SITE: mod.liens?.site ?? 'https://tlfstudio.fr',
    DISCORD: mod.liens?.discord ?? '<lien Discord>',
    KOFI: mod.liens?.kofi ?? '<lien Ko-fi>',
    CREDITS: liste(mod.credits),
  });
}

function valider(mod) {
  for (const k of ['nom', 'slug', 'plateformes', 'versions']) if (!mod[k]) throw new Error(`mod.json : champ « ${k} » manquant`);
  if (!/^[a-z0-9-]+$/.test(mod.slug)) throw new Error('mod.json : « slug » en minuscules, chiffres et tirets');
  for (const p of mod.plateformes) if (!PLATEFORMES[p]) throw new Error(`mod.json : plateforme inconnue « ${p} » (${Object.keys(PLATEFORMES).join(', ')})`);
  if (mod.couleurSecondaire && !isHex(mod.couleurSecondaire)) throw new Error('mod.json : « couleurSecondaire » au format #RRGGBB');
  if (!mod.versions.mod || !mod.versions.jeu?.length || !mod.versions.chargeurs?.length)
    throw new Error('mod.json : versions.mod, versions.jeu[] et versions.chargeurs[] sont obligatoires');
}

export function generer(fichier, sortie = path.join(HERE, 'sortie')) {
  const mod = JSON.parse(readFileSync(fichier, 'utf8'));
  valider(mod);
  if (mod.visuel) mod.visuel = path.resolve(path.dirname(fichier), mod.visuel);
  const dir = path.join(sortie, mod.slug);
  const ecrire = (rel, data) => {
    const f = path.join(dir, rel);
    mkdirSync(path.dirname(f), { recursive: true });
    writeFileSync(f, data);
    return f;
  };

  // Gabarits communs, en SVG vectorisé (aucune police requise).
  ecrire('commun/icone.svg', vectorize(icone(mod)));
  for (const [nom, svg] of Object.entries(badges(mod))) {
    ecrire(`commun/badges/${nom}.svg`, vectorize(svg));
    ecrire(`commun/badges/${nom}.png`, png(svg, Number(svg.match(/width="(\d+)"/)[1]) * 2));
  }
  ecrire('commun/description.md', description(mod));

  for (const p of mod.plateformes) {
    const spec = PLATEFORMES[p];
    if (spec.icone) {
      let icon = png(icone(mod), spec.icone.taille);
      if (spec.icone.maxOctets && icon.length > spec.icone.maxOctets) icon = png(icone(mod), 256);
      const f = ecrire(`${p}/${spec.icone.fichier ?? 'icone.png'}`, icon);
      if (spec.icone.maxOctets && statSync(f).size > spec.icone.maxOctets) throw new Error(`${p} : icône au-delà de ${spec.icone.maxOctets} octets`);
    }
    if (spec.banniere) ecrire(`${p}/banniere.png`, png(banniere(mod, spec.banniere), spec.banniere[0]));
    if (spec.galerie) ecrire(`${p}/galerie-entete.png`, png(galerieEntete(mod, spec.galerie), spec.galerie[0]));
    console.log(`${spec.nom} → ${path.relative(ROOT, path.join(dir, p))}`);
  }
  return dir;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const fichier = process.argv.slice(2).find((a) => a.endsWith('.json'));
  if (!fichier) {
    console.error('Usage : npm run kit:mod -- <chemin/mod.json> [--sortie <dossier>]');
    process.exit(1);
  }
  generer(path.resolve(fichier), arg('sortie') ? path.resolve(arg('sortie')) : undefined);
}
