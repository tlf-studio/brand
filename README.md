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

Règles : ne pas déformer, recolorer ni ajouter d'effet. Zone de protection : la hauteur du carré accent, tout autour. Taille minimale : 24 px.

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

`ident/TLF-ident-C-final.mp4` — 1080p, 30 fps, 4,5 s, avec son. Séquence : fondu du nom (0,5 → 1,9 s), carré orange qui glisse en place (2,0 → 2,9 s), fondu au noir (3,9 s). Aussi en `.webm`, et la piste audio seule en `.wav` / `.mp3`. La vidéo muette est `ident/tlf-studio-ident-1080p30.mp4`.

Le logo sonore : grain fin, scintillement vitreux qui monte avec le fondu, aspiration inversée vers le nom puis vers le carré, sub qui s'épanouit aux deux moments, traînée brillante. Pas de note identifiable, uniquement de la texture.

## Licence

Ces fichiers sont la propriété de TLF Studio. Utilisation libre pour parler du studio (articles, vidéos, streams). Pas d'utilisation pour laisser croire à une affiliation.
