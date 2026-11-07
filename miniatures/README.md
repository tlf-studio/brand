# Miniatures et habillage

Gabarits des vignettes vidéo et des posts « build in public ». Le rendu est commun avec le kit mod (`scripts/lib/render.mjs`).

| Format | Taille | Gabarit | Contenu |
|---|---|---|---|
| `youtube` | 1280 × 720 | `gabarits/youtube.svg` | Fond, bandeau orange avec titre court, monogramme ou lockup de branche en coin |
| `vertical` | 1080 × 1920 | `gabarits/youtube.svg` | Couverture de short, même composition, bandeau au tiers inférieur |
| `post` | 1600 × 900 | `gabarits/post.svg` | Post Bluesky / X : capture, légende, petit monogramme |

## Utilisation

```bash
npm run miniatures -- miniatures/exemple/youtube.json miniatures/exemple/post-anonyme.json
```

Sortie en SVG vectorisé et PNG dans `miniatures/sortie/` (non versionné).

## Champs

| Champ | Formats | Description |
|---|---|---|
| `format` | tous | `youtube`, `vertical` ou `post` |
| `titre` | youtube, vertical | Titre court, deux lignes au plus (le corps se réduit pour tenir) |
| `branche` | youtube, vertical | `jeux`, `mods` ou `bots` : lockup de branche à la place du monogramme, si la vidéo ne concerne qu'une branche |
| `fond` | youtube, vertical | Image PNG ou JPEG, assombrie vers le bas |
| `capture` | post | Capture PNG ou JPEG |
| `legende` | post | Texte du post |
| `projet` | post | Nom du projet, **interdit en mode anonyme** |
| `date` | post | Ex. « Semaine 45 » |
| `anonyme` | post | Projet non révélé, voir ci-dessous |

## Mode anonyme

Pour un projet non révélé :

- `"anonyme": { "mode": "flou", "force": 28 }` : capture floutée (flou gaussien, 28 par défaut) ;
- `"anonyme": { "mode": "recadrage", "zone": { "x": 800, "y": 200, "largeur": 400, "hauteur": 310 } }` : seul un détail de la capture est montré, en pixels de l'image source.

En mode anonyme, le générateur refuse les champs `projet` et `nom`. Relisez quand même la capture : un titre de fenêtre ou un texte d'interface lisible après recadrage suffit à révéler un projet.
