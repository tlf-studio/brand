# Kit page de mod

Visuels et description d'une page de mod TLF Studio, générés depuis un seul fichier `mod.json`.

## Contenu

| Fichier | Rôle |
|---|---|
| `gabarits/banniere.svg` | Bannière de description : nom, accroche, lockup Mods en coin bas droit |
| `gabarits/icone.svg` | Icône carrée en mode « visuel » : visuel du mod, avatar studio en coin |
| `gabarits/galerie-entete.svg` | En-tête de galerie ou de section, monogramme en coin haut droit |
| `gabarits/badge.svg` | Badge libellé / valeur (version, chargeur, version de jeu, statut) |
| `description.md` | Gabarit Markdown : Présentation, Fonctionnalités, Installation, Compatibilité, Liens, Crédits |
| `generate.mjs` | Remplit les gabarits et exporte aux formats de chaque plateforme |
| `exemple/` | Mod fictif complet (`mod.json` et `visuel.png`) |

Les champs `{{…}}` des gabarits sont remplis par `generate.mjs`. Un champ manquant arrête la génération.

## Utilisation

```bash
npm install
npm run kit:mod -- kit-mod/exemple/mod.json
```

Sortie dans `kit-mod/sortie/<slug>/` (non versionné) :

```
commun/icone.svg              icône vectorisée
commun/badges/*.svg|png       badges (PNG en 2x)
commun/description.md         description remplie
curseforge/icone.png          512 × 512        banniere.png 1920 × 480   galerie-entete.png 1920 × 1080
modrinth/icone.png            512 × 512, < 256 Kio (sinon 256 × 256)      banniere.png       galerie-entete.png
thunderstore/icon.png         256 × 256 exact, à mettre à la racine du paquet           banniere.png (README)
lcpdfr/banniere.png           1920 × 480       galerie-entete.png 1920 × 1080
nexus/banniere.png            1400 × 400       galerie-entete.png 1920 × 1080
```

Les exigences de chaque plateforme, et leurs sources, sont en tête de `generate.mjs`. Points d'attention :

- **LCPDFR.com** : la capture principale doit montrer le mod en jeu. Ne mettez jamais l'en-tête de galerie en premier.
- **Nexus Mods** : la première image sert de vignette. Mettez une capture en jeu en premier et vérifiez l'aperçu après l'envoi. Les tailles Nexus sont des recommandations non officielles.
- **Modrinth** : marquez une capture en jeu comme « featured ».

## `mod.json`

| Champ | Obligatoire | Description |
|---|---|---|
| `nom` | oui | Nom affiché |
| `slug` | oui | Minuscules, chiffres et tirets ; nom du dossier de sortie |
| `plateformes` | oui | Parmi `curseforge`, `modrinth`, `thunderstore`, `lcpdfr`, `nexus` |
| `versions.mod` | oui | Version du mod (`1.2.0`) |
| `versions.jeu` | oui | Versions du jeu (`["1.21.1"]`) |
| `versions.chargeurs` | oui | `["NeoForge", "Forge"]`, `["RagePluginHook"]`… |
| `jeu` | non | Nom du jeu, libellé du badge (défaut : « Jeu ») |
| `accroche` | non | Une phrase sous le nom |
| `statut` | non | `stable`, `beta`, `alpha` ou `archive` |
| `couleurSecondaire` | non | `#RRGGBB`. Colore le filet de la bannière et le libellé de section, **jamais le monogramme** |
| `visuel` | non | PNG ou JPEG, relatif au `mod.json`. Fond des bannières et en-têtes |
| `icone` | non | `studio` (défaut : avatar à pastille Mods) ou `visuel` (visuel du mod, avatar studio en coin) |
| `presentation`, `fonctionnalites`, `installation`, `compatibilite`, `credits`, `liens` | non | Contenu de la description |

## Exemple complet

`exemple/mod.json` décrit un mod fictif, « Lanternes de Givre » :

```json
{
  "nom": "Lanternes de Givre",
  "slug": "lanternes-de-givre",
  "accroche": "Des lanternes qui gèlent l'eau autour d'elles.",
  "jeu": "Minecraft",
  "plateformes": ["curseforge", "modrinth", "thunderstore", "lcpdfr", "nexus"],
  "versions": { "mod": "1.2.0", "jeu": ["1.21.1"], "chargeurs": ["NeoForge", "Forge"] },
  "statut": "beta",
  "couleurSecondaire": "#4FA3D9",
  "visuel": "visuel.png",
  "icone": "studio"
}
```

`npm run kit:mod -- kit-mod/exemple/mod.json` produit les visuels des cinq plateformes et `commun/description.md`, prête à coller.

## Règles

- Le monogramme, les lockups et les avatars viennent de `logo/` sans modification : ni recoloration, ni déformation, ni effet.
- Un projet non révélé n'a pas de page de mod : rien dans ce kit ne doit porter le nom d'un projet verrouillé.
