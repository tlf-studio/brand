# TLF Studio — identité visuelle

Tout ce qu'il faut pour représenter TLF Studio : logos, couleurs, typographie, animations et ident vidéo.

## Logo

Le monogramme **TLF** en blocs, 7 rectangles sur une grille 120 × 120, le dernier (coin bas droit) en orange accent.

| Fichier | Usage |
|---|---|
| `logo/static/tlf-monogram-light.svg` | Encre `#111111` sur fond clair |
| `logo/static/tlf-monogram-dark.svg` | Blanc sur fond sombre |
| `logo/static/tlf-monogram-on-accent.svg` | Blanc sur fond orange, carré accent en noir |
| `logo/static/tlf-avatar.svg` | Avatar carré 512 px, fond noir arrondi (GitHub, Discord) |
| `logo/animated/*.svg` | 6 animations × clair/sombre, CSS intégré, voir `logo/animated/README.txt` |
| `logo/branches/*` | Lockups et avatars par branche, voir « Déclinaisons par branche » |

Règles : ne pas déformer, recolorer ni ajouter d'effet. Zone de protection : la hauteur du carré accent, tout autour. Taille minimale : 24 px (64 px pour les avatars à pastille). Ne composez pas de lockup non officiel. Règles complètes : `presse/regles.md`.

## Couleurs

| Nom | Hex | Usage |
|---|---|---|
| Encre | `#111111` | Texte, logo sur clair, fond sombre |
| Accent | `#E8562A` | Carré du logo, boutons principaux, soulignements |
| Fond | `#F4F4F2` | Fond de page clair |
| Blanc | `#FFFFFF` | Surfaces, logo sur sombre |
| Gris | `#6B6B6B` | Texte secondaire |
| Bordure | `#E0E0DC` | Séparateurs |
| Surfaces sombres | `#1C1C1C` / `#2A2A2A` | Cartes en mode sombre |

Tokens prêts à l'emploi dans `palette/tokens.json` et `palette/tokens.css`.

## Typographie

**Space Grotesk** (Google Fonts, licence OFL). Bold 700 pour les titres et le logo texte, Medium 500 pour le corps. Labels en capitales espacées (`letter-spacing: 0.3em`).

## Ident vidéo

`ident/TLF-ident-C-final.mp4` — 1080p, 30 fps, 4,5 s, avec son. Séquence : fondu du nom (0,5 → 1,9 s), carré orange qui glisse en place (2,0 → 2,9 s), fondu au noir (3,9 s). Dans le son, l'épanouissement du nom attaque à 1,595 s et celui du carré à 2,615 s (mesures de `ident/timing.json`). Aussi en `.webm`, et la piste audio seule en `.wav` / `.mp3`. La vidéo muette est `ident/tlf-studio-ident-1080p30.mp4`.

Le logo sonore : grain fin, scintillement vitreux qui monte avec le fondu, aspiration inversée vers le nom puis vers le carré, sub qui s'épanouit aux deux moments, traînée brillante. Pas de note identifiable, uniquement de la texture.

## Déclinaisons par branche

Deux familles, dans `logo/branches/`. Le monogramme n'y est jamais déformé ni recoloré.

| Famille | Fichiers | Quand l'utiliser |
|---|---|---|
| Lockup « libellé de branche » | `tlf-lockup-{studio,jeux,mods,bots}-{light,dark}.svg`, PNG 1200 et 2400 de large | Formats larges : bannières, en-têtes, dossiers de presse, pages de mods. `studio` quand le contenu concerne tout le studio. |
| Avatar à pastille | `tlf-avatar-{jeux,mods,bots}.svg`, PNG 112, 256 et 512 | Icônes carrées : CurseForge, Modrinth, Thunderstore, Nexus Mods, Discord, GitHub. |

- Sous 64 px, utilisez `logo/static/tlf-avatar.svg`, sans pastille : le libellé n'est plus lisible.
- Le texte des SVG est vectorisé : aucune police n'est requise. Les sources avec `<text>` sont dans `logo/branches/src/`. Modifiez-les, puis lancez `npm run build:branches`.
- `logo/branches/planche.svg` (et `.png`) montre toutes les variantes en clair et en sombre.

## Logo sonore court

`ident/TLF-ident-C-short.{wav,mp3,ogg}` : coupe de 1,8 s de `TLF-ident-C-final`, pour les shorts, les splash screens des jeux et les exports vidéo. Le logo sonore officiel reste C-final.

- Impact du carré à 0,6 s, traînée de 1,2 s. Fondus de 30 ms (entrée) et 250 ms (sortie).
- −14 LUFS intégré, true peak sous −1 dBTP. WAV 48 kHz / 24 bits, MP3 320 kbit/s, OGG Vorbis pour les jeux.
- Instants mesurés dans `ident/timing.json` : dans C-final, l'attaque du nom est à 1,595 s et celle du carré à 2,615 s.
- Régénérer : `npm run analyse:ident`, puis `npm run cut:ident` (ou `bash scripts/cut-ident.sh <début> <fin> <impact>`).

## Exports vidéo

Les 6 animations de `logo/animated/`, exportées en vidéo et calées sur le logo sonore court :

```bash
npm run export:animations   # → exports/ (non versionné)
npm run export:release      # exporte, puis crée la release GitHub brand-vX.Y.Z
```

- `exports/tlf-{n}-{nom}-{light|dark}-{16x9|9x16}[-muet].mp4` : 1920 × 1080 et 1080 × 1920, 30 i/s, H.264 et AAC.
- L'instant où chaque animation se pose est noté dans `logo/animated/timing.json`. Il tombe sur l'impact du son. Si l'animation se pose après 0,6 s, le son démarre plus tard et la vidéo dure plus de 2,5 s, pour ne pas couper la traînée.
- Les vidéos sont publiées dans les [releases du repo](https://github.com/tlf-studio/brand/releases) (`brand-vX.Y.Z`), pas dans git.

## Kits

- `kit-mod/` : visuels et description d'une page de mod aux formats de chaque plateforme. Voir `kit-mod/README.md`.
- `miniatures/` : miniatures YouTube, couvertures verticales, posts « build in public » avec un mode anonyme. Voir `miniatures/README.md`.
- `presse/` : dossier presse prêt à publier, avec les règles d'usage (`regles.md` et `regles.pdf`).

## Scripts

Prérequis : Node 20 ou plus, ffmpeg dans le PATH, `npm install`, puis `npx playwright install chromium` pour les exports vidéo et le PDF.

| Commande | Effet |
|---|---|
| `npm run build:branches` | Régénère `logo/branches/` (SVG vectorisés, PNG, planche) depuis `logo/branches/src/` |
| `npm run analyse:ident` | Mesure les attaques de C-final et écrit `ident/timing.json` (partie `full`) |
| `npm run cut:ident` | Coupe, normalise et exporte le logo sonore court, écrit `ident/timing.json` (partie `short`) |
| `npm run export:animations` | Exporte les 24 vidéos (et leurs versions muettes) dans `exports/` |
| `npm run export:release` | Exporte, puis publie les vidéos dans une release `brand-vX.Y.Z` (version du `package.json`) |
| `npm run kit:mod -- <mod.json>` | Génère le kit d'une page de mod dans `kit-mod/sortie/` |
| `npm run miniatures -- <fichier.json>` | Génère une miniature ou un post dans `miniatures/sortie/` |
| `npm run build:presse` | Reconstruit `presse/` depuis les fichiers de référence |
| `npm run sync:presse -- <chemin-du-site>` | Copie `presse/` vers `public/presse/` dans le repo du site |

## Licence

Ces fichiers sont la propriété de TLF Studio. Utilisation libre pour parler du studio (articles, vidéos, streams). Pas d'utilisation pour laisser croire à une affiliation.
